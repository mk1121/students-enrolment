const jwt = require('jsonwebtoken');
const User = require('../../server/models/User');
const Course = require('../../server/models/Course');
const Enrollment = require('../../server/models/Enrollment');
const Payment = require('../../server/models/Payment');

// Generate JWT token for testing
const generateToken = (userId, expiresIn = '1h') => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });
};

// Create test user
const createTestUser = async (userData = {}) => {
  const defaultUserData = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}${Math.random().toString(36).substr(2, 9)}@example.com`,
    password: 'password123',
    role: 'student',
    isEmailVerified: true,
    ...userData
  };

  const user = new User(defaultUserData);
  await user.save();
  return user;
};

// Create test admin user
const createTestAdmin = async (userData = {}) => {
  const adminData = {
    firstName: 'Admin',
    lastName: 'User',
    email: `admin${Date.now()}${Math.random().toString(36).substr(2, 9)}@example.com`,
    password: 'adminpass123',
    role: 'admin',
    isEmailVerified: true,
    ...userData
  };

  return await createTestUser(adminData);
};

// Create test course
const createTestCourse = async (courseData = {}) => {
  const defaultCourseData = {
    title: 'Test Course',
    description: 'A test course for testing purposes',
    category: 'Programming',
    level: 'Beginner',
    duration: 10,
    price: 99.99,
    instructor: null, // Will be set by the test
    isActive: true,
    ...courseData
  };

  const course = new Course(defaultCourseData);
  await course.save();
  return course;
};

// Create test enrollment
const createTestEnrollment = async (enrollmentData = {}) => {
  const defaultEnrollmentData = {
    student: null, // Will be set by the test
    course: null, // Will be set by the test
    status: 'active',
    progress: 0,
    payment: {
      amount: 99.99,
      currency: 'USD',
      paymentMethod: 'stripe',
      paymentStatus: 'pending'
    },
    ...enrollmentData
  };

  const enrollment = new Enrollment(defaultEnrollmentData);
  await enrollment.save();
  return enrollment;
};

// Create test payment
const createTestPayment = async (paymentData = {}) => {
  const defaultPaymentData = {
    user: null, // Will be set by the test
    course: null, // Will be set by the test
    amount: 99.99,
    currency: 'USD',
    status: 'completed',
    paymentMethod: 'card',
    stripePaymentIntentId: 'pi_test_123456789',
    ...paymentData
  };

  const payment = new Payment(defaultPaymentData);
  await payment.save();
  return payment;
};

// Get authorization header with JWT token
const getAuthHeader = (token) => {
  return { Authorization: `Bearer ${token}` };
};

// Clean up all test data
const cleanupTestData = async () => {
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Enrollment.deleteMany({}),
    Payment.deleteMany({})
  ]);
};

// Sample test data
const sampleUserData = {
  student: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    role: 'student',
    phone: '+1234567890',
    dateOfBirth: new Date('1995-05-15'),
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'USA'
    }
  },
  admin: {
    firstName: 'Jane',
    lastName: 'Admin',
    email: 'jane.admin@example.com',
    password: 'adminpass123',
    role: 'admin'
  }
};

const sampleCourseData = {
  title: 'JavaScript Fundamentals',
  description: 'Learn the basics of JavaScript programming',
  category: 'Programming',
  level: 'Beginner',
  duration: 20,
  price: 149.99,
  curriculum: [
    {
      title: 'Introduction to JavaScript',
      description: 'Getting started with JavaScript',
      duration: 2,
      videoUrl: 'https://example.com/video1.mp4',
      resources: ['https://example.com/resource1.pdf']
    },
    {
      title: 'Variables and Data Types',
      description: 'Understanding JavaScript variables',
      duration: 3,
      videoUrl: 'https://example.com/video2.mp4',
      resources: ['https://example.com/resource2.pdf']
    }
  ],
  requirements: ['Basic computer knowledge'],
  learningOutcomes: ['Understand JavaScript basics', 'Write simple programs'],
  tags: ['javascript', 'programming', 'web-development'],
  isActive: true
};

module.exports = {
  generateToken,
  createTestUser,
  createTestAdmin,
  createTestCourse,
  createTestEnrollment,
  createTestPayment,
  getAuthHeader,
  cleanupTestData,
  sampleUserData,
  sampleCourseData
}; 