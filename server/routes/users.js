const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const {
  authenticateToken,
  requireAdmin,
  requireOwnership,
} = require('../middleware/auth');

// eslint-disable-next-line new-cap
const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get(
  '/',
  [
    authenticateToken,
    requireAdmin,
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    query('role')
      .optional()
      .isIn(['student', 'admin'])
      .withMessage('Invalid role'),
    query('search')
      .optional()
      .isString()
      .withMessage('Search must be a string'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { page = 1, limit = 10, role, search } = req.query;

      // Build filter
      const filter = { isActive: true };
      if (role) {
        filter.role = role;
      }
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      const users = await User.find(filter)
        .select(
          '-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires'
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10));

      const total = await User.countDocuments(filter);
      const totalPages = Math.ceil(total / parseInt(limit, 10));

      res.json({
        users,
        pagination: {
          currentPage: parseInt(page, 10),
          totalPages,
          total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit: parseInt(limit, 10),
        },
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        message: 'Server error while fetching users',
      });
    }
  }
);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get(
  '/:id',
  [authenticateToken, requireOwnership('id')],
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select(
        '-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires'
      );

      if (!user) {
        return res.status(404).json({
          message: 'User not found',
        });
      }

      res.json({ user });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        message: 'Server error while fetching user',
      });
    }
  }
);

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put(
  '/:id',
  [
    authenticateToken,
    requireOwnership('id'),
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('phone')
      .optional()
      .matches(/^[+]?[1-9][\d]{0,15}$/)
      .withMessage('Please provide a valid phone number'),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid date'),
    body('address')
      .optional()
      .isObject()
      .withMessage('Address must be an object'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: 'User not found',
        });
      }

      // Update allowed fields
      const allowedFields = [
        'firstName',
        'lastName',
        'phone',
        'dateOfBirth',
        'address',
        'profilePicture',
      ];
      const updates = {};

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      }).select(
        '-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires'
      );

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        message: 'Server error while updating user',
      });
    }
  }
);

// @route   PUT /api/users/:id/role
// @desc    Update user role (Admin only)
// @access  Private (Admin)
router.put(
  '/:id/role',
  [
    authenticateToken,
    requireAdmin,
    body('role')
      .isIn(['student', 'admin'])
      .withMessage('Role must be either student or admin'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { role } = req.body;

      // Prevent admin from changing their own role
      if (req.params.id === req.user._id.toString()) {
        return res.status(400).json({
          message: 'You cannot change your own role',
        });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true, runValidators: true }
      ).select(
        '-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires'
      );

      if (!user) {
        return res.status(404).json({
          message: 'User not found',
        });
      }

      res.json({
        message: 'User role updated successfully',
        user,
      });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({
        message: 'Server error while updating user role',
      });
    }
  }
);

// @route   PUT /api/users/:id/status
// @desc    Update user status (Admin only)
// @access  Private (Admin)
router.put(
  '/:id/status',
  [
    authenticateToken,
    requireAdmin,
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { isActive } = req.body;

      // Prevent admin from deactivating themselves
      if (req.params.id === req.user._id.toString()) {
        return res.status(400).json({
          message: 'You cannot deactivate your own account',
        });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive },
        { new: true, runValidators: true }
      ).select(
        '-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires'
      );

      if (!user) {
        return res.status(404).json({
          message: 'User not found',
        });
      }

      res.json({
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        user,
      });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        message: 'Server error while updating user status',
      });
    }
  }
);

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private (Admin)
router.delete('/:id', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        message: 'You cannot delete your own account',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // Soft delete - set isActive to false
    user.isActive = false;
    await user.save();

    res.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      message: 'Server error while deleting user',
    });
  }
});

// @route   GET /api/users/:id/enrollments
// @desc    Get user enrollments
// @access  Private
router.get(
  '/:id/enrollments',
  [authenticateToken, requireOwnership('id')],
  async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;

      const filter = { student: req.params.id };
      if (status) {
        filter.status = status;
      }

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      const Enrollment = require('../models/Enrollment');
      const enrollments = await Enrollment.find(filter)
        .populate(
          'course',
          'title description thumbnail price duration instructor'
        )
        .populate('course.instructor', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10));

      const total = await Enrollment.countDocuments(filter);
      const totalPages = Math.ceil(total / parseInt(limit, 10));

      res.json({
        enrollments,
        pagination: {
          currentPage: parseInt(page, 10),
          totalPages,
          total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit: parseInt(limit, 10),
        },
      });
    } catch (error) {
      console.error('Get user enrollments error:', error);
      res.status(500).json({
        message: 'Server error while fetching user enrollments',
      });
    }
  }
);

// @route   GET /api/users/:id/payments
// @desc    Get user payments
// @access  Private
router.get(
  '/:id/payments',
  [authenticateToken, requireOwnership('id')],
  async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;

      const filter = { user: req.params.id };
      if (status) {
        filter.status = status;
      }

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      const Payment = require('../models/Payment');
      const payments = await Payment.find(filter)
        .populate('course', 'title')
        .populate('enrollment')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10));

      const total = await Payment.countDocuments(filter);
      const totalPages = Math.ceil(total / parseInt(limit, 10));

      res.json({
        payments,
        pagination: {
          currentPage: parseInt(page, 10),
          totalPages,
          total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit: parseInt(limit, 10),
        },
      });
    } catch (error) {
      console.error('Get user payments error:', error);
      res.status(500).json({
        message: 'Server error while fetching user payments',
      });
    }
  }
);

// @route   GET /api/users/analytics/overview
// @desc    Get user analytics (Admin only)
// @access  Private (Admin)
router.get(
  '/analytics/overview',
  [authenticateToken, requireAdmin],
  async (req, res) => {
    try {
      const totalUsers = await User.countDocuments({ isActive: true });
      const totalStudents = await User.countDocuments({
        role: 'student',
        isActive: true,
      });
      const totalAdmins = await User.countDocuments({
        role: 'admin',
        isActive: true,
      });
      const verifiedUsers = await User.countDocuments({
        isEmailVerified: true,
        isActive: true,
      });

      // Get users by month for the last 12 months
      const monthlyUsers = await User.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(
                new Date().setFullYear(new Date().getFullYear() - 1)
              ),
            },
            isActive: true,
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 },
        },
      ]);

      // Get recent users
      const recentUsers = await User.find({ isActive: true })
        .select('firstName lastName email role createdAt')
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        overview: {
          totalUsers,
          totalStudents,
          totalAdmins,
          verifiedUsers,
        },
        monthlyUsers,
        recentUsers,
      });
    } catch (error) {
      console.error('Get user analytics error:', error);
      res.status(500).json({
        message: 'Server error while fetching user analytics',
      });
    }
  }
);

module.exports = router;
