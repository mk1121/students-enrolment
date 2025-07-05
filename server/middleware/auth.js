const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        message: 'Invalid token. User not found.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: 'Account is deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token.',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired.',
      });
    }
    // eslint-disable-next-line no-console
    console.error('Auth middleware error:', error);
    res.status(500).json({
      message: 'Internal server error.',
    });
  }
}

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Access denied. Admin privileges required.',
    });
  }
  next();
}

// Middleware to check if user is student
function requireStudent(req, res, next) {
  if (req.user.role !== 'student') {
    return res.status(403).json({
      message: 'Access denied. Student privileges required.',
    });
  }
  next();
}

// Middleware to check if user is instructor (admin or course instructor)
async function requireInstructor(req, res, next) {
  try {
    if (req.user.role === 'admin') {
      return next();
    }

    const courseId = req.params.id || req.params.courseId || req.body.courseId;
    if (!courseId) {
      return res.status(400).json({
        message: 'Course ID is required.',
      });
    }

    const Course = require('../models/Course');
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: 'Course not found.',
      });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message:
          'Access denied. Only course instructor can perform this action.',
      });
    }

    next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Instructor middleware error:', error);
    res.status(500).json({
      message: 'Internal server error.',
    });
  }
}

// Middleware to check if user owns the resource
function requireOwnership(resourceField = 'userId') {
  return function ownershipMiddleware(req, res, next) {
    const resourceUserId = req.params[resourceField] || req.body[resourceField];

    if (!resourceUserId) {
      return res.status(400).json({
        message: `${resourceField} is required.`,
      });
    }

    if (req.user.role === 'admin') {
      return next();
    }

    if (resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Access denied. You can only access your own resources.',
      });
    }

    next();
  };
}

// Optional authentication middleware (doesn't fail if no token)
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireStudent,
  requireInstructor,
  requireOwnership,
  optionalAuth,
};
