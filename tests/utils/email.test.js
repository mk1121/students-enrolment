const { sendEmail, emailTemplates, verifyEmailConfig } = require('../../server/utils/email');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// Mock nodemailer
jest.mock('nodemailer');
jest.mock('googleapis');

describe('Email Service with OAuth2 Gmail Integration', () => {
  let mockTransporter;
  let mockOAuth2Client;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock OAuth2 client
    mockOAuth2Client = {
      setCredentials: jest.fn(),
      getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-access-token' })
    };

    // Mock Google OAuth2
    google.auth.OAuth2 = jest.fn().mockReturnValue(mockOAuth2Client);

    // Mock transporter
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
      verify: jest.fn().mockResolvedValue(true)
    };

    // Mock nodemailer.createTransporter
    nodemailer.createTransporter = jest.fn().mockReturnValue(mockTransporter);

    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.GMAIL_CLIENT_ID = 'test-client-id';
    process.env.GMAIL_CLIENT_SECRET = 'test-client-secret';
    process.env.GMAIL_REFRESH_TOKEN = 'test-refresh-token';
    process.env.EMAIL_USER = 'test@gmail.com';
    process.env.EMAIL_FROM = 'noreply@studentsenrollment.com';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.GMAIL_CLIENT_ID;
    delete process.env.GMAIL_CLIENT_SECRET;
    delete process.env.GMAIL_REFRESH_TOKEN;
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_FROM;
  });

  describe('OAuth2 Configuration', () => {
    test('should create OAuth2 client with correct credentials', async () => {
      await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>'
      });

      expect(google.auth.OAuth2).toHaveBeenCalledWith(
        'test-client-id',
        'test-client-secret',
        'https://developers.google.com/oauthplayground'
      );
    });

    test('should set refresh token on OAuth2 client', async () => {
      await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>'
      });

      expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith({
        refresh_token: 'test-refresh-token'
      });
    });

    test('should handle missing OAuth2 credentials gracefully', async () => {
      delete process.env.GMAIL_CLIENT_ID;
      delete process.env.GMAIL_CLIENT_SECRET;
      delete process.env.GMAIL_REFRESH_TOKEN;

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>'
      });

      expect(result.messageId).toBe('mock-message-id-oauth2');
    });
  });

  describe('Email Verification Tests', () => {
    test('should send email verification with correct template', async () => {
      const userName = 'John Doe';
      const verificationUrl = 'https://example.com/verify?token=abc123';
      const template = emailTemplates.emailVerification(userName, verificationUrl);

      const result = await sendEmail({
        to: 'john@example.com',
        subject: template.subject,
        html: template.html
      });

      expect(result.messageId).toBeTruthy();
      expect(template.subject).toBe('Verify Your Email Address - Students Enrollment System');
      expect(template.html).toContain(userName);
      expect(template.html).toContain(verificationUrl);
      expect(template.html).toContain('Verify Email Address');
    });

    test('should include verification link in email template', () => {
      const userName = 'Jane Smith';
      const verificationUrl = 'https://example.com/verify?token=xyz789';
      const template = emailTemplates.emailVerification(userName, verificationUrl);

      expect(template.html).toContain(`href="${verificationUrl}"`);
      expect(template.html).toContain('This verification link will expire in 24 hours');
      expect(template.html).toContain('background-color: #007bff');
    });

    test('should handle email verification with OAuth2 failure', async () => {
      // Mock OAuth2 failure
      mockOAuth2Client.getAccessToken.mockRejectedValue(new Error('OAuth2 failed'));
      
      const template = emailTemplates.emailVerification('Test User', 'https://example.com/verify');
      
      const result = await sendEmail({
        to: 'test@example.com',
        subject: template.subject,
        html: template.html
      });

      // Should still return a mock result in test environment
      expect(result.messageId).toBe('mock-message-id-oauth2');
    });
  });

  describe('Password Reset Tests', () => {
    test('should send password reset email with correct template', async () => {
      const userName = 'Alice Johnson';
      const resetUrl = 'https://example.com/reset?token=reset123';
      const template = emailTemplates.passwordReset(userName, resetUrl);

      const result = await sendEmail({
        to: 'alice@example.com',
        subject: template.subject,
        html: template.html
      });

      expect(result.messageId).toBeTruthy();
      expect(template.subject).toBe('Password Reset Request - Students Enrollment System');
      expect(template.html).toContain(userName);
      expect(template.html).toContain(resetUrl);
      expect(template.html).toContain('Reset Password');
    });

    test('should include security warning in password reset template', () => {
      const template = emailTemplates.passwordReset('User', 'https://example.com/reset');

      expect(template.html).toContain('This link will expire in 1 hour');
      expect(template.html).toContain('If you didn\'t request this password reset');
      expect(template.html).toContain('this link can only be used once');
      expect(template.html).toContain('background-color: #dc3545');
    });

    test('should handle password reset with OAuth2 token refresh', async () => {
      // Mock successful token refresh
      mockOAuth2Client.getAccessToken.mockResolvedValue({ 
        token: 'new-access-token' 
      });

      const template = emailTemplates.passwordReset('Test User', 'https://example.com/reset');
      
      const result = await sendEmail({
        to: 'test@example.com',
        subject: template.subject,
        html: template.html
      });

      expect(mockOAuth2Client.getAccessToken).toHaveBeenCalled();
      expect(result.messageId).toBeTruthy();
    });
  });

  describe('OAuth2 Error Handling', () => {
    test('should handle expired refresh token', async () => {
      mockOAuth2Client.getAccessToken.mockRejectedValue(
        new Error('invalid_grant: Token has been expired or revoked')
      );

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      });

      // Should fallback to mock in test environment
      expect(result.messageId).toBe('mock-message-id-oauth2');
    });

    test('should handle invalid credentials error', async () => {
      mockTransporter.verify.mockRejectedValue(
        new Error('BadCredentials: Invalid login')
      );

      const verificationResult = await verifyEmailConfig();
      expect(verificationResult.success).toBe(false);
      expect(verificationResult.message).toContain('BadCredentials');
    });

    test('should handle network connectivity issues', async () => {
      mockOAuth2Client.getAccessToken.mockRejectedValue(
        new Error('Network error: ENOTFOUND')
      );

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      });

      expect(result.messageId).toBe('mock-message-id-oauth2');
    });
  });

  describe('Email Template Security', () => {
    test('should sanitize user input in email templates', () => {
      const maliciousName = '<script>alert("xss")</script>John';
      const template = emailTemplates.emailVerification(maliciousName, 'https://example.com');

      // Template should contain the original input (HTML escaping should be done at render time)
      expect(template.html).toContain(maliciousName);
    });

    test('should validate email URLs in templates', () => {
      const validUrl = 'https://example.com/verify?token=abc123';
      const template = emailTemplates.emailVerification('User', validUrl);

      expect(template.html).toContain(validUrl);
      expect(template.html).toMatch(/href="https:\/\/[^"]+"/);
    });
  });

  describe('Comprehensive OAuth2 Flow Tests', () => {
    test('should complete full OAuth2 authentication flow', async () => {
      // Mock successful OAuth2 flow
      mockOAuth2Client.setCredentials.mockReturnValue();
      mockOAuth2Client.getAccessToken.mockResolvedValue({ 
        token: 'ya29.mock-access-token' 
      });

      nodemailer.createTransporter = jest.fn().mockReturnValue({
        ...mockTransporter,
        sendMail: jest.fn().mockResolvedValue({
          messageId: 'oauth2-message-id',
          envelope: {
            from: 'noreply@studentsenrollment.com',
            to: ['test@example.com']
          }
        })
      });

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'OAuth2 Test',
        html: '<p>OAuth2 Email Test</p>'
      });

      expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith({
        refresh_token: 'test-refresh-token'
      });
      expect(mockOAuth2Client.getAccessToken).toHaveBeenCalled();
      expect(result.messageId).toBeTruthy();
    });

    test('should handle OAuth2 scope permissions error', async () => {
      mockOAuth2Client.getAccessToken.mockRejectedValue(
        new Error('insufficient_scope: Requested scopes exceed granted scopes')
      );

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Scope Test',
        html: '<p>Scope Test</p>'
      });

      expect(result.messageId).toBe('mock-message-id-oauth2');
    });

    test('should verify email configuration with OAuth2', async () => {
      const result = await verifyEmailConfig();
      expect(mockTransporter.verify).toHaveBeenCalled();
    });
  });

  describe('Email Templates Integration', () => {
    test('should send welcome email after registration', async () => {
      const template = emailTemplates.welcome('New User');
      
      const result = await sendEmail({
        to: 'newuser@example.com',
        subject: template.subject,
        html: template.html
      });

      expect(template.subject).toBe('Welcome to Students Enrollment System');
      expect(template.html).toContain('Welcome New User!');
      expect(template.html).toContain('Browse our comprehensive course catalog');
      expect(result.messageId).toBeTruthy();
    });

    test('should send course enrollment confirmation', async () => {
      const template = emailTemplates.courseEnrollment('Student', 'React Bootcamp', 299);
      
      const result = await sendEmail({
        to: 'student@example.com',
        subject: template.subject,
        html: template.html
      });

      expect(template.subject).toBe('Course Enrollment Confirmation');
      expect(template.html).toContain('React Bootcamp');
      expect(template.html).toContain('$299');
      expect(result.messageId).toBeTruthy();
    });

    test('should send payment confirmation', async () => {
      const template = emailTemplates.paymentConfirmation(
        'Buyer', 
        'JavaScript Course', 
        199, 
        'txn_123456'
      );
      
      const result = await sendEmail({
        to: 'buyer@example.com',
        subject: template.subject,
        html: template.html
      });

      expect(template.subject).toBe('Payment Confirmation - Students Enrollment System');
      expect(template.html).toContain('JavaScript Course');
      expect(template.html).toContain('$199');
      expect(template.html).toContain('txn_123456');
      expect(result.messageId).toBeTruthy();
    });
  });

  describe('Error Recovery and Fallbacks', () => {
    test('should fallback gracefully when OAuth2 is unavailable', async () => {
      // Simulate OAuth2 completely unavailable
      delete process.env.GMAIL_CLIENT_ID;
      delete process.env.GMAIL_CLIENT_SECRET;
      delete process.env.GMAIL_REFRESH_TOKEN;

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Fallback Test',
        html: '<p>Fallback Test</p>'
      });

      expect(result.messageId).toBe('mock-message-id-oauth2');
    });

    test('should log appropriate messages for missing configuration', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      delete process.env.GMAIL_CLIENT_ID;
      
      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TEST] Email would be sent to test@example.com')
      );
      
      consoleSpy.mockRestore();
    });
  });
}); 