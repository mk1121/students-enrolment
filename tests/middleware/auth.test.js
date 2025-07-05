const {
  authenticateToken,
  requireAdmin,
  requireStudent,
  requireInstructor,
  requireOwnership,
  optionalAuth
} = require('../../server/middleware/auth');
const { createTestUser, createTestAdmin, createTestCourse, generateToken } = require('../helpers/testHelpers');

// Mock request and response objects
const mockRequest = (headers = {}, user = null, params = {}, body = {}) => ({
  headers,
  user,
  params,
  body
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    let user, token;

    beforeEach(async () => {
      user = await createTestUser();
      token = generateToken(user._id);
    });

    test('should authenticate valid token', async () => {
      const req = mockRequest({ authorization: `Bearer ${token}` });
      const res = mockResponse();

      await authenticateToken(req, res, mockNext);

      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(user._id.toString());
      expect(req.user.email).toBe(user.email);
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject request without token', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await authenticateToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. No token provided.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request with invalid token', async () => {
      const req = mockRequest({ authorization: 'Bearer invalid-token' });
      const res = mockResponse();

      await authenticateToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid token.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request for deactivated user', async () => {
      user.isActive = false;
      await user.save();
      
      const req = mockRequest({ authorization: `Bearer ${token}` });
      const res = mockResponse();

      await authenticateToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Account is deactivated.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    test('should allow admin user', () => {
      const req = mockRequest({}, { role: 'admin' });
      const res = mockResponse();

      requireAdmin(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject non-admin user', () => {
      const req = mockRequest({}, { role: 'student' });
      const res = mockResponse();

      requireAdmin(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. Admin privileges required.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireStudent', () => {
    test('should allow student user', () => {
      const req = mockRequest({}, { role: 'student' });
      const res = mockResponse();

      requireStudent(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject non-student user', () => {
      const req = mockRequest({}, { role: 'admin' });
      const res = mockResponse();

      requireStudent(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. Student privileges required.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireInstructor', () => {
    let admin, instructor, course;

    beforeEach(async () => {
      admin = await createTestAdmin();
      instructor = await createTestUser({ email: 'instructor@example.com' });
      course = await createTestCourse({ instructor: instructor._id });
    });

    test('should allow admin user', async () => {
      const req = mockRequest({}, admin, { id: course._id.toString() });
      const res = mockResponse();

      await requireInstructor(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow course instructor', async () => {
      const req = mockRequest({}, instructor, { id: course._id.toString() });
      const res = mockResponse();

      await requireInstructor(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject non-instructor user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const req = mockRequest({}, otherUser, { id: course._id.toString() });
      const res = mockResponse();

      await requireInstructor(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. Only course instructor can perform this action.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request without courseId', async () => {
      const req = mockRequest({}, instructor);
      const res = mockResponse();

      await requireInstructor(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Course ID is required.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request for non-existent course', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const req = mockRequest({}, instructor, { id: fakeId });
      const res = mockResponse();

      await requireInstructor(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Course not found.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnership', () => {
    let user, otherUser, admin;

    beforeEach(async () => {
      user = await createTestUser();
      otherUser = await createTestUser({ email: 'other@example.com' });
      admin = await createTestAdmin();
    });

    test('should allow user to access own resource', () => {
      const middleware = requireOwnership('userId');
      const req = mockRequest({}, user, { userId: user._id.toString() });
      const res = mockResponse();

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow admin to access any resource', () => {
      const middleware = requireOwnership('userId');
      const req = mockRequest({}, admin, { userId: user._id.toString() });
      const res = mockResponse();

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject user accessing other user resource', () => {
      const middleware = requireOwnership('userId');
      const req = mockRequest({}, user, { userId: otherUser._id.toString() });
      const res = mockResponse();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. You can only access your own resources.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request without required field', () => {
      const middleware = requireOwnership('userId');
      const req = mockRequest({}, user);
      const res = mockResponse();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'userId is required.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should work with custom resource field', () => {
      const middleware = requireOwnership('studentId');
      const req = mockRequest({}, user, { studentId: user._id.toString() });
      const res = mockResponse();

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    let user, token;

    beforeEach(async () => {
      user = await createTestUser();
      token = generateToken(user._id);
    });

    test('should authenticate valid token', async () => {
      const req = mockRequest({ authorization: `Bearer ${token}` });
      const res = mockResponse();

      await optionalAuth(req, res, mockNext);

      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(user._id.toString());
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should continue without authentication when no token', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await optionalAuth(req, res, mockNext);

      expect(req.user).toBeFalsy();
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should continue without authentication when invalid token', async () => {
      const req = mockRequest({ authorization: 'Bearer invalid-token' });
      const res = mockResponse();

      await optionalAuth(req, res, mockNext);

      expect(req.user).toBeFalsy();
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should continue without authentication when user is inactive', async () => {
      user.isActive = false;
      await user.save();
      
      const req = mockRequest({ authorization: `Bearer ${token}` });
      const res = mockResponse();

      await optionalAuth(req, res, mockNext);

      expect(req.user).toBeFalsy();
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
}); 