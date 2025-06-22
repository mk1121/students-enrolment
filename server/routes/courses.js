const express = require('express');
const { body, validationResult, query, param } = require('express-validator');
const Course = require('../models/Course');
const { authenticateToken, requireAdmin, requireInstructor, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses with filtering and pagination
// @access  Public
router.get('/', [
  optionalAuth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid level'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('sortBy').optional().isIn(['title', 'price', 'rating', 'createdAt']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const {
      page = 1,
      limit = 10,
      category,
      level,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'published', isActive: true };

    if (category) filter.category = category;
    if (level) filter.level = level;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Build search query
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate skip value
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const courses = await Course.find(filter)
      .populate('instructor', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-syllabus -reviews -materials');

    // Get total count
    const total = await Course.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      courses,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching courses' 
    });
  }
});

// @route   GET /api/courses/featured
// @desc    Get featured courses
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const featuredCourses = await Course.find({
      isFeatured: true,
      status: 'published',
      isActive: true
    })
    .populate('instructor', 'firstName lastName')
    .limit(6)
    .select('-syllabus -reviews -materials');

    res.json({ courses: featuredCourses });

  } catch (error) {
    console.error('Get featured courses error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching featured courses' 
    });
  }
});

// @route   GET /api/courses/categories
// @desc    Get all course categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Course.distinct('category', {
      status: 'published',
      isActive: true
    });

    res.json({ categories });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching categories' 
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  Public
router.get('/:id', [
  optionalAuth,
  param('id').isMongoId().withMessage('Invalid course ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName email profilePicture')
      .populate('reviews.user', 'firstName lastName profilePicture');

    if (!course) {
      return res.status(404).json({ 
        message: 'Course not found' 
      });
    }

    if (course.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({ 
        message: 'Course not found' 
      });
    }

    res.json({ course });

  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching course' 
    });
  }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (Admin/Instructor)
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('category')
    .isIn(['Programming', 'Design', 'Business', 'Marketing', 'Finance', 'Health', 'Language', 'Music', 'Photography', 'Other'])
    .withMessage('Invalid category'),
  body('level')
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Invalid level'),
  body('duration')
    .isFloat({ min: 0.5 })
    .withMessage('Duration must be at least 0.5 hours'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('requirements').optional().isArray().withMessage('Requirements must be an array'),
  body('learningOutcomes').optional().isArray().withMessage('Learning outcomes must be an array'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const courseData = {
      ...req.body,
      instructor: req.user._id
    };

    const course = new Course(courseData);
    await course.save();

    res.status(201).json({
      message: 'Course created successfully',
      course
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ 
      message: 'Server error while creating course' 
    });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private (Admin/Instructor)
router.put('/:id', [
  authenticateToken,
  param('id').isMongoId().withMessage('Invalid course ID'),
  requireInstructor,
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('category')
    .optional()
    .isIn(['Programming', 'Design', 'Business', 'Marketing', 'Finance', 'Health', 'Language', 'Music', 'Photography', 'Other'])
    .withMessage('Invalid category'),
  body('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Invalid level'),
  body('duration')
    .optional()
    .isFloat({ min: 0.5 })
    .withMessage('Duration must be at least 0.5 hours'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ 
        message: 'Course not found' 
      });
    }

    // Check if user is instructor or admin
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied. Only course instructor can update this course.' 
      });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Course updated successfully',
      course: updatedCourse
    });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ 
      message: 'Server error while updating course' 
    });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete a course
// @access  Private (Admin/Instructor)
router.delete('/:id', [
  authenticateToken,
  param('id').isMongoId().withMessage('Invalid course ID'),
  requireInstructor
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ 
        message: 'Course not found' 
      });
    }

    // Check if user is instructor or admin
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied. Only course instructor can delete this course.' 
      });
    }

    // Soft delete - set isActive to false
    course.isActive = false;
    await course.save();

    res.json({
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ 
      message: 'Server error while deleting course' 
    });
  }
});

// @route   POST /api/courses/:id/reviews
// @desc    Add a review to a course
// @access  Private (Students only)
router.post('/:id/reviews', [
  authenticateToken,
  param('id').isMongoId().withMessage('Invalid course ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ 
        message: 'Course not found' 
      });
    }

    // Check if user has already reviewed this course
    const existingReview = course.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already reviewed this course' 
      });
    }

    // Add review
    course.reviews.push({
      user: req.user._id,
      rating: req.body.rating,
      comment: req.body.comment
    });

    await course.save();

    res.status(201).json({
      message: 'Review added successfully',
      course
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ 
      message: 'Server error while adding review' 
    });
  }
});

module.exports = router; 