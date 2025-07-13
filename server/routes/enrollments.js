const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const {
  authenticateToken,
  requireAdmin,
  requireStudent,
} = require('../middleware/auth');

// eslint-disable-next-line new-cap
const router = express.Router();

// @route   GET /api/enrollments
// @desc    Get user enrollments
// @access  Private
router.get(
  '/',
  [
    authenticateToken,
    query('status')
      .optional()
      .isIn(['pending', 'active', 'completed', 'cancelled', 'refunded'])
      .withMessage('Invalid status'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
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

      const { status, page = 1, limit = 10 } = req.query;

      // Build filter
      const filter = {};

      if (req.user.role === 'admin') {
        // Admin can see all enrollments
        if (status) {
          filter.status = status;
        }
      } else {
        // Students can only see their own enrollments
        filter.student = req.user._id;
        if (status) {
          filter.status = status;
        }
      }

      // Calculate skip value
      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

      // Execute query
      const enrollments = await Enrollment.find(filter)
        .populate(
          'course',
          'title description thumbnail price duration instructor'
        )
        .populate('student', 'firstName lastName email')
        .populate('course.instructor', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10));

      // Get total count
      const total = await Enrollment.countDocuments(filter);

      // Calculate pagination info
      const totalPages = Math.ceil(total / parseInt(limit, 10));
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        enrollments,
        pagination: {
          currentPage: parseInt(page, 10),
          totalPages,
          total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit, 10),
        },
      });
    } catch (error) {
      console.error('Get enrollments error:', error);
      res.status(500).json({
        message: 'Server error while fetching enrollments',
      });
    }
  }
);

// @route   GET /api/enrollments/my-enrollments
// @desc    Get current user's enrollments
// @access  Private (Student/Admin)
router.get('/my-enrollments', [authenticateToken], async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate(
        'course',
        'title description thumbnail price duration category level instructor'
      )
      .populate('payment', 'amount status paymentMethod')
      .sort({ enrolledAt: -1 });

    res.json({
      enrollments,
      count: enrollments.length,
    });
  } catch (error) {
    console.error('Get my-enrollments error:', error);
    res.status(500).json({
      message: 'Server error while fetching your enrollments',
    });
  }
});

// @route   GET /api/enrollments/:id
// @desc    Get enrollment by ID
// @access  Private
router.get('/:id', [authenticateToken], async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate(
        'course',
        'title description thumbnail price duration instructor syllabus materials'
      )
      .populate('student', 'firstName lastName email')
      .populate('course.instructor', 'firstName lastName email');

    if (!enrollment) {
      return res.status(404).json({
        message: 'Enrollment not found',
      });
    }

    // Check if user has access to this enrollment
    if (
      req.user.role !== 'admin' &&
      enrollment.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: 'Access denied. You can only view your own enrollments.',
      });
    }

    res.json({ enrollment });
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({
      message: 'Server error while fetching enrollment',
    });
  }
});

// @route   POST /api/enrollments
// @desc    Create a new enrollment
// @access  Private (Students only)
router.post(
  '/',
  [
    authenticateToken,
    requireStudent,
    body('courseId').isMongoId().withMessage('Valid course ID is required'),
    body('paymentMethod')
      .isIn(['stripe', 'sslcommerz', 'cash'])
      .withMessage('Valid payment method is required'),
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

      const { courseId, paymentMethod } = req.body;

      // Check if course exists and is published
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          message: 'Course not found',
        });
      }

      if (course.status !== 'published' || !course.isActive) {
        return res.status(400).json({
          message: 'Course is not available for enrollment',
        });
      }

      // Check if user is already enrolled
      const existingEnrollment = await Enrollment.findOne({
        student: req.user._id,
        course: courseId,
      });

      if (existingEnrollment) {
        return res.status(400).json({
          message: 'You are already enrolled in this course',
        });
      }

      // Check if course has available spots
      if (
        course.maxStudents > 0 &&
        course.currentStudents >= course.maxStudents
      ) {
        return res.status(400).json({
          message: 'Course is full. No more enrollments available.',
        });
      }

      // Create enrollment
      const enrollment = new Enrollment({
        student: req.user._id,
        course: courseId,
        payment: {
          amount: course.price,
          currency: course.currency,
          paymentMethod,
          paymentStatus: 'pending',
        },
      });

      await enrollment.save();

      // Update course student count
      await Course.findByIdAndUpdate(
        courseId,
        { $inc: { currentStudents: 1 } },
        { new: true }
      );

      // Populate the enrollment for response
      await enrollment.populate([
        {
          path: 'course',
          select: 'title description thumbnail price duration instructor',
        },
        { path: 'course.instructor', select: 'firstName lastName' },
      ]);

      res.status(201).json({
        message: 'Enrollment created successfully',
        enrollment,
      });
    } catch (error) {
      console.error('Create enrollment error:', error);
      res.status(500).json({
        message: 'Server error while creating enrollment',
      });
    }
  }
);

// @route   PUT /api/enrollments/:id/status
// @desc    Update enrollment status
// @access  Private (Admin/Student)
router.put(
  '/:id/status',
  [
    authenticateToken,
    body('status')
      .isIn(['pending', 'active', 'completed', 'cancelled', 'refunded'])
      .withMessage('Valid status is required'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason cannot exceed 500 characters'),
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

      const { status, reason } = req.body;

      const enrollment = await Enrollment.findById(req.params.id);

      if (!enrollment) {
        return res.status(404).json({
          message: 'Enrollment not found',
        });
      }

      // Check if user has permission to update this enrollment
      if (
        req.user.role !== 'admin' &&
        enrollment.student.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          message: 'Access denied. You can only update your own enrollments.',
        });
      }

      // Students can only update to 'cancelled' status
      if (req.user.role !== 'admin' && status !== 'cancelled') {
        return res.status(403).json({
          message: 'Students can only cancel their enrollments.',
        });
      }

      const oldStatus = enrollment.status;
      enrollment.status = status;

      // Handle status-specific logic
      if (status === 'active' && oldStatus === 'pending') {
        enrollment.startDate = new Date();
      } else if (status === 'completed') {
        enrollment.completionDate = new Date();
      } else if (status === 'cancelled' || status === 'refunded') {
        // Update course student count
        const course = await Course.findById(enrollment.course);
        if (course && course.currentStudents > 0) {
          course.currentStudents -= 1;
          await course.save();
        }
      }

      // Add note if reason provided
      if (reason) {
        const noteData = {
          note: reason,
          createdAt: new Date(),
        };

        if (req.user.role === 'admin') {
          noteData.createdBy = req.user._id;
          enrollment.notes.admin.push(noteData);
        } else {
          enrollment.notes.student.push(noteData);
        }
      }

      await enrollment.save();

      res.json({
        message: 'Enrollment status updated successfully',
        enrollment,
      });
    } catch (error) {
      console.error('Update enrollment status error:', error);
      res.status(500).json({
        message: 'Server error while updating enrollment status',
      });
    }
  }
);

// @route   PUT /api/enrollments/:id/progress
// @desc    Update enrollment progress
// @access  Private (Student)
router.put(
  '/:id/progress',
  [
    authenticateToken,
    requireStudent,
    body('completedLessons')
      .isArray()
      .withMessage('Completed lessons must be an array'),
    body('totalLessons')
      .isInt({ min: 1 })
      .withMessage('Total lessons must be a positive integer'),
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

      const { completedLessons, totalLessons } = req.body;

      const enrollment = await Enrollment.findById(req.params.id);

      if (!enrollment) {
        return res.status(404).json({
          message: 'Enrollment not found',
        });
      }

      // Check if user owns this enrollment
      if (enrollment.student.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'Access denied. You can only update your own enrollments.',
        });
      }

      // Update progress
      enrollment.updateProgress(completedLessons.length, totalLessons);

      // Add completed lessons
      completedLessons.forEach(lessonId => {
        enrollment.addCompletedLesson(lessonId);
      });

      await enrollment.save();

      res.json({
        message: 'Progress updated successfully',
        enrollment,
      });
    } catch (error) {
      console.error('Update progress error:', error);
      res.status(500).json({
        message: 'Server error while updating progress',
      });
    }
  }
);

// @route   POST /api/enrollments/:id/complete
// @desc    Mark enrollment as completed
// @access  Private (Student)
router.post(
  '/:id/complete',
  [authenticateToken, requireStudent],
  async (req, res) => {
    try {
      const enrollment = await Enrollment.findById(req.params.id);

      if (!enrollment) {
        return res.status(404).json({
          message: 'Enrollment not found',
        });
      }

      // Check if user owns this enrollment
      if (enrollment.student.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'Access denied. You can only complete your own enrollments.',
        });
      }

      if (enrollment.status !== 'active') {
        return res.status(400).json({
          message: 'Only active enrollments can be completed',
        });
      }

      // Mark as completed
      enrollment.status = 'completed';
      enrollment.completionDate = new Date();
      enrollment.progress = 100;

      // Issue certificate if course has certificate
      const course = await Course.findById(enrollment.course);
      if (course && course.certificate) {
        enrollment.issueCertificate();
      }

      await enrollment.save();

      res.json({
        message: 'Enrollment completed successfully',
        enrollment,
      });
    } catch (error) {
      console.error('Complete enrollment error:', error);
      res.status(500).json({
        message: 'Server error while completing enrollment',
      });
    }
  }
);

// @route   GET /api/enrollments/analytics/overview
// @desc    Get enrollment analytics (Admin only)
// @access  Private (Admin)
router.get(
  '/analytics/overview',
  [authenticateToken, requireAdmin],
  async (req, res) => {
    try {
      const totalEnrollments = await Enrollment.countDocuments();
      const activeEnrollments = await Enrollment.countDocuments({
        status: 'active',
      });
      const completedEnrollments = await Enrollment.countDocuments({
        status: 'completed',
      });
      const pendingEnrollments = await Enrollment.countDocuments({
        status: 'pending',
      });

      // Get enrollments by month for the last 12 months
      const monthlyEnrollments = await Enrollment.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(
                new Date().setFullYear(new Date().getFullYear() - 1)
              ),
            },
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

      // Get top courses by enrollment
      const topCourses = await Enrollment.aggregate([
        {
          $group: {
            _id: '$course',
            enrollmentCount: { $sum: 1 },
          },
        },
        {
          $sort: { enrollmentCount: -1 },
        },
        {
          $limit: 5,
        },
        {
          $lookup: {
            from: 'courses',
            localField: '_id',
            foreignField: '_id',
            as: 'course',
          },
        },
        {
          $unwind: '$course',
        },
        {
          $project: {
            courseTitle: '$course.title',
            enrollmentCount: 1,
          },
        },
      ]);

      res.json({
        overview: {
          totalEnrollments,
          activeEnrollments,
          completedEnrollments,
          pendingEnrollments,
        },
        monthlyEnrollments,
        topCourses,
      });
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({
        message: 'Server error while fetching analytics',
      });
    }
  }
);

module.exports = router;
