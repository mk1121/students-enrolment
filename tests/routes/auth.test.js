const request = require('supertest');
const express = require('express');
const authRoutes = require('../../server/routes/auth');
const { createTestUser, createTestAdmin, generateToken, sampleUserData } = require('../helpers/testHelpers');
const User = require('../../server/models/User');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    test('should register a new user', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully. Please check your email to verify your account.');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.password).toBeUndefined();

      // Verify user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.firstName).toBe(userData.firstName);
      expect(user.isEmailVerified).toBe(false);
    });

    test('should not register user with existing email', async () => {
      const user = await createTestUser();
      
      const userData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: user.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('User with this email already exists');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test('should validate email format', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test('should validate password length', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser({
        email: 'test@example.com',
        password: 'password123',
        isEmailVerified: true
      });
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(user.email);
      expect(response.body.user.password).toBeUndefined();
    });

    test('should not login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid email or password');
    });

    test('should not login with inactive account', async () => {
      user.isActive = false;
      await user.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.message).toBe('Account is deactivated. Please contact support.');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser({
        email: 'test@example.com',
        isEmailVerified: true
      });
    });

    test('should send password reset email for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.message).toBe('If an account with that email exists, a password reset link has been sent.');

      // Verify reset token was set
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.passwordResetToken).toBeDefined();
      expect(updatedUser.passwordResetExpires).toBeDefined();
    });

    test('should return success even for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.message).toBe('If an account with that email exists, a password reset link has been sent.');
    });

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let user, resetToken;

    beforeEach(async () => {
      user = await createTestUser({
        email: 'test@example.com',
        isEmailVerified: true
      });

      // Set reset token
      resetToken = 'test-reset-token';
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();
    });

    test('should reset password with valid token', async () => {
      const newPassword = 'newpassword123';

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword
        })
        .expect(200);

      expect(response.body.message).toBe('Password reset successfully');

      // Verify password was changed
      const updatedUser = await User.findById(user._id).select('+password');
      const isMatch = await updatedUser.comparePassword(newPassword);
      expect(isMatch).toBe(true);

      // Verify reset token was cleared
      expect(updatedUser.passwordResetToken).toBeUndefined();
      expect(updatedUser.passwordResetExpires).toBeUndefined();
    });

    test('should not reset password with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'newpassword123'
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid or expired reset token');
    });

    test('should not reset password with expired token', async () => {
      // Set expired token
      user.passwordResetExpires = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      await user.save();

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: 'newpassword123'
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid or expired reset token');
    });

    test('should validate password length', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          password: '123'
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/verify-email', () => {
    let user, verificationToken;

    beforeEach(async () => {
      verificationToken = 'test-verification-token';
      user = await createTestUser({
        email: 'test@example.com',
        isEmailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
    });

    test('should verify email with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      expect(response.body.message).toBe('Email verified successfully');

      // Verify email was marked as verified
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isEmailVerified).toBe(true);
      expect(updatedUser.emailVerificationToken).toBeUndefined();
      expect(updatedUser.emailVerificationExpires).toBeUndefined();
    });

    test('should not verify email with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.message).toBe('Invalid or expired verification token');
    });

    test('should not verify email with expired token', async () => {
      // Set expired token
      user.emailVerificationExpires = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      await user.save();

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken })
        .expect(400);

      expect(response.body.message).toBe('Invalid or expired verification token');
    });
  });
}); 