const request = require('supertest');
const express = require('express');
const coursesRoutes = require('../../server/routes/courses');
const { createTestUser, createTestAdmin, createTestCourse, generateToken, getAuthHeader, sampleCourseData } = require('../helpers/testHelpers');
const Course = require('../../server/models/Course');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/courses', coursesRoutes);

describe('Courses Routes', () => {
  let student, admin, instructor, studentToken, adminToken, instructorToken;

  beforeEach(async () => {
    student = await createTestUser({ email: 'student@example.com' });
    admin = await createTestAdmin({ email: 'admin@example.com' });
    instructor = await createTestUser({ email: 'instructor@example.com' });
    
    studentToken = generateToken(student._id);
    adminToken = generateToken(admin._id);
    instructorToken = generateToken(instructor._id);
  });

  describe('GET /api/courses', () => {
    beforeEach(async () => {
      await createTestCourse({ 
        title: 'JavaScript Basics', 
        instructor: instructor._id,
        status: 'published',
        isActive: true 
      });
      await createTestCourse({ 
        title: 'Python Advanced', 
        instructor: instructor._id,
        status: 'published',
        isActive: true 
      });
    });

    test('should get all active courses', async () => {
      const response = await request(app)
        .get('/api/courses')
        .expect(200);

      expect(response.body.courses).toBeDefined();
      expect(response.body.courses).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    test('should search courses by title', async () => {
      const response = await request(app)
        .get('/api/courses?search=JavaScript')
        .expect(200);

      expect(response.body.courses).toHaveLength(1);
      expect(response.body.courses[0].title).toContain('JavaScript');
    });

    test('should filter courses by category', async () => {
      await createTestCourse({ 
        title: 'Design Course', 
        category: 'Design',
        instructor: instructor._id,
        status: 'published',
        isActive: true
      });

      const response = await request(app)
        .get('/api/courses?category=Design')
        .expect(200);

      expect(response.body.courses).toHaveLength(1);
      expect(response.body.courses[0].category).toBe('Design');
    });

    test('should paginate results', async () => {
      const response = await request(app)
        .get('/api/courses?page=1&limit=1')
        .expect(200);

      expect(response.body.courses).toHaveLength(1);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalPages).toBeGreaterThan(1);
    });
  });

  describe('GET /api/courses/:id', () => {
    let course;

    beforeEach(async () => {
      course = await createTestCourse({ 
        instructor: instructor._id,
        status: 'published',
        isActive: true
      });
    });

    test('should get course by id', async () => {
      const response = await request(app)
        .get(`/api/courses/${course._id}`)
        .expect(200);

      expect(response.body.course).toBeDefined();
      expect(response.body.course._id).toBe(course._id.toString());
      expect(response.body.course.title).toBe(course.title);
    });

    test('should return 404 for non-existent course', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/courses/${fakeId}`)
        .expect(404);

      expect(response.body.message).toBe('Course not found');
    });
  });

  describe('POST /api/courses', () => {
    test('should create course as admin', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'A test course for testing purposes',
        category: 'Programming',
        level: 'Beginner',
        duration: 10,
        price: 99.99,
        instructor: instructor._id
      };

      const response = await request(app)
        .post('/api/courses')
        .set(getAuthHeader(adminToken))
        .send(courseData)
        .expect(201);

      expect(response.body.message).toBe('Course created successfully');
      expect(response.body.course).toBeDefined();
      expect(response.body.course.title).toBe(courseData.title);
    });

    test('should not create course as student', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'A test course for testing purposes',
        category: 'Programming',
        level: 'Beginner',
        duration: 10,
        price: 99.99,
        instructor: instructor._id
      };

      const response = await request(app)
        .post('/api/courses')
        .set(getAuthHeader(studentToken))
        .send(courseData)
        .expect(403);

      expect(response.body.message).toBe('Access denied. Admin privileges required.');
    });

    test('should not create course without authentication', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'A test course for testing purposes',
        category: 'Programming',
        level: 'Beginner',
        duration: 10,
        price: 99.99,
        instructor: instructor._id
      };

      const response = await request(app)
        .post('/api/courses')
        .send(courseData)
        .expect(401);

      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/courses')
        .set(getAuthHeader(adminToken))
        .send({})
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/courses/:id', () => {
    let course;

    beforeEach(async () => {
      course = await createTestCourse({ 
        instructor: instructor._id,
        status: 'published',
        isActive: true
      });
    });

    test('should update course as admin', async () => {
      const updateData = {
        title: 'Updated Course Title',
        price: 199.99
      };

      const response = await request(app)
        .put(`/api/courses/${course._id}`)
        .set(getAuthHeader(adminToken))
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Course updated successfully');
      expect(response.body.course.title).toBe(updateData.title);
      expect(response.body.course.price).toBe(updateData.price);
    });

    test('should update course as instructor', async () => {
      const updateData = {
        title: 'Updated by Instructor'
      };

      const response = await request(app)
        .put(`/api/courses/${course._id}`)
        .set(getAuthHeader(instructorToken))
        .send(updateData)
        .expect(200);

      expect(response.body.course.title).toBe(updateData.title);
    });

    test('should not update course as student', async () => {
      const updateData = {
        title: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/courses/${course._id}`)
        .set(getAuthHeader(studentToken))
        .send(updateData)
        .expect(403);

      expect(response.body.message).toBe('Access denied. Only course instructor can perform this action.');
    });

    test('should return 404 for non-existent course', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = {
        title: 'Updated Title'
      };

      const response = await request(app)
        .put(`/api/courses/${fakeId}`)
        .set(getAuthHeader(adminToken))
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBe('Course not found');
    });
  });

  describe('DELETE /api/courses/:id', () => {
    let course;

    beforeEach(async () => {
      course = await createTestCourse({ 
        instructor: instructor._id,
        status: 'published',
        isActive: true
      });
    });

    test('should delete course as admin', async () => {
      const response = await request(app)
        .delete(`/api/courses/${course._id}`)
        .set(getAuthHeader(adminToken))
        .expect(200);

      expect(response.body.message).toBe('Course deleted successfully');

      // Verify course was soft deleted (isActive = false)
      const deletedCourse = await Course.findById(course._id);
      expect(deletedCourse.isActive).toBe(false);
    });

    test('should not delete course as student', async () => {
      const response = await request(app)
        .delete(`/api/courses/${course._id}`)
        .set(getAuthHeader(studentToken))
        .expect(403);

      expect(response.body.message).toBe('Access denied. Only course instructor can perform this action.');
    });

    test('should return 404 for non-existent course', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/courses/${fakeId}`)
        .set(getAuthHeader(adminToken))
        .expect(404);

      expect(response.body.message).toBe('Course not found');
    });
  });

  describe('GET /api/courses/featured', () => {
    beforeEach(async () => {
      await createTestCourse({ 
        title: 'Featured Course', 
        isFeatured: true,
        instructor: instructor._id,
        status: 'published',
        isActive: true
      });
      await createTestCourse({ 
        title: 'Regular Course', 
        isFeatured: false,
        instructor: instructor._id,
        status: 'published',
        isActive: true
      });
    });

    test('should get featured courses', async () => {
      const response = await request(app)
        .get('/api/courses/featured')
        .expect(200);

      expect(response.body.courses).toBeDefined();
      expect(response.body.courses).toHaveLength(1);
      expect(response.body.courses[0].isFeatured).toBe(true);
    });
  });

  describe('GET /api/courses/categories', () => {
    beforeEach(async () => {
      await createTestCourse({ 
        category: 'Programming',
        instructor: instructor._id,
        status: 'published',
        isActive: true
      });
      await createTestCourse({ 
        category: 'Design',
        instructor: instructor._id,
        status: 'published',
        isActive: true
      });
      await createTestCourse({ 
        category: 'Programming',
        instructor: instructor._id,
        status: 'published',
        isActive: true
      });
    });

    test('should get course categories', async () => {
      const response = await request(app)
        .get('/api/courses/categories')
        .expect(200);

      expect(response.body.categories).toBeDefined();
      expect(response.body.categories).toHaveLength(2);
      expect(response.body.categories).toContain('Programming');
      expect(response.body.categories).toContain('Design');
    });
  });
}); 