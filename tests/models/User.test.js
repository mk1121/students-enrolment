const User = require('../../server/models/User');
const { sampleUserData } = require('../helpers/testHelpers');

describe('User Model', () => {
  describe('User Creation', () => {
    test('should create a valid user', async () => {
      const userData = sampleUserData.student;
      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.firstName).toBe(userData.firstName);
      expect(savedUser.lastName).toBe(userData.lastName);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.isEmailVerified).toBe(false); // default value
      expect(savedUser.isActive).toBe(true); // default value
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    test('should hash password before saving', async () => {
      const userData = { ...sampleUserData.student };
      const user = new User(userData);
      const savedUser = await user.save();

      // Password should be hashed
      expect(savedUser.password).not.toBe(userData.password);
      expect(savedUser.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash format
    });

    test('should create admin user', async () => {
      const adminData = sampleUserData.admin;
      const admin = new User(adminData);
      const savedAdmin = await admin.save();

      expect(savedAdmin.role).toBe('admin');
    });
  });

  describe('User Validation', () => {
    test('should require firstName', async () => {
      const userData = { ...sampleUserData.student };
      delete userData.firstName;
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow('First name is required');
    });

    test('should require lastName', async () => {
      const userData = { ...sampleUserData.student };
      delete userData.lastName;
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow('Last name is required');
    });

    test('should require email', async () => {
      const userData = { ...sampleUserData.student };
      delete userData.email;
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow('Email is required');
    });

    test('should require password', async () => {
      const userData = { ...sampleUserData.student };
      delete userData.password;
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow('Password is required');
    });

    test('should validate email format', async () => {
      const userData = { ...sampleUserData.student, email: 'invalid-email' };
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow('Please enter a valid email');
    });

    test('should validate password minimum length', async () => {
      const userData = { ...sampleUserData.student, password: '123' };
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow('Password must be at least 6 characters');
    });

    test('should validate firstName maximum length', async () => {
      const userData = { ...sampleUserData.student, firstName: 'a'.repeat(51) };
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow('First name cannot exceed 50 characters');
    });

    test('should validate lastName maximum length', async () => {
      const userData = { ...sampleUserData.student, lastName: 'a'.repeat(51) };
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow('Last name cannot exceed 50 characters');
    });

    test('should validate phone number format', async () => {
      const userData = { ...sampleUserData.student, phone: 'invalid-phone' };
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow('Please enter a valid phone number');
    });

    test('should validate role enum', async () => {
      const userData = { ...sampleUserData.student, role: 'invalid-role' };
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow();
    });

    test('should enforce unique email', async () => {
      const userData = sampleUserData.student;
      
      // Create first user
      const user1 = new User(userData);
      await user1.save();

      // Try to create second user with same email
      const user2 = new User(userData);
      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('User Methods', () => {
    let user;

    beforeEach(async () => {
      const userData = sampleUserData.student;
      user = new User(userData);
      await user.save();
    });

    test('should compare password correctly', async () => {
      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);

      const isNotMatch = await user.comparePassword('wrongpassword');
      expect(isNotMatch).toBe(false);
    });

    test('should get public profile', () => {
      const publicProfile = user.getPublicProfile();

      expect(publicProfile.password).toBeUndefined();
      expect(publicProfile.emailVerificationToken).toBeUndefined();
      expect(publicProfile.emailVerificationExpires).toBeUndefined();
      expect(publicProfile.passwordResetToken).toBeUndefined();
      expect(publicProfile.passwordResetExpires).toBeUndefined();
      
      expect(publicProfile.firstName).toBe(user.firstName);
      expect(publicProfile.lastName).toBe(user.lastName);
      expect(publicProfile.email).toBe(user.email);
    });
  });

  describe('User Virtuals', () => {
    test('should return full name', async () => {
      const userData = sampleUserData.student;
      const user = new User(userData);
      
      expect(user.fullName).toBe(`${userData.firstName} ${userData.lastName}`);
    });
  });

  describe('User Middleware', () => {
    test('should not hash password if not modified', async () => {
      const userData = sampleUserData.student;
      const user = new User(userData);
      await user.save();
      
      const originalPassword = user.password;
      
      // Update user without changing password
      user.firstName = 'Updated Name';
      await user.save();
      
      expect(user.password).toBe(originalPassword);
    });

    test('should hash password when modified', async () => {
      const userData = sampleUserData.student;
      const user = new User(userData);
      await user.save();
      
      const originalPassword = user.password;
      
      // Update password
      user.password = 'newpassword123';
      await user.save();
      
      expect(user.password).not.toBe(originalPassword);
      expect(user.password).not.toBe('newpassword123');
      
      // Should be able to compare with new password
      const isMatch = await user.comparePassword('newpassword123');
      expect(isMatch).toBe(true);
    });
  });

  describe('User Indexes', () => {
    test('should have email index', async () => {
      const indexes = await User.collection.getIndexes();
      const emailIndex = Object.keys(indexes).find(key => key.includes('email'));
      expect(emailIndex).toBeDefined();
    });

    test('should have role index', async () => {
      const indexes = await User.collection.getIndexes();
      const roleIndex = Object.keys(indexes).find(key => key.includes('role'));
      expect(roleIndex).toBeDefined();
    });
  });
}); 