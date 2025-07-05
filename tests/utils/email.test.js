const { sendEmail, emailTemplates, verifyEmailConfig } = require('../../server/utils/email');
const nodemailer = require('nodemailer');

// Mock nodemailer
jest.mock('nodemailer');

describe('Email Service', () => {
  let mockTransporter;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock transporter
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
      verify: jest.fn().mockResolvedValue(true),
    };

    // Mock nodemailer.createTransport
    nodemailer.createTransport = jest.fn().mockReturnValue(mockTransporter);

    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.EMAIL_FROM = 'noreply@studentsenrollment.com';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.EMAIL_FROM;
  });

  describe('Basic Email Functionality', () => {
    test('should send email successfully in test environment', async() => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(result.messageId).toBeTruthy();
    });

    test('should handle missing credentials gracefully', async() => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      expect(result.messageId).toBeTruthy();
    });
  });

  describe('Email Templates', () => {
    test('should generate welcome email template correctly', () => {
      const template = emailTemplates.welcome('John Doe');

      expect(template.subject).toBe('Welcome to Students Enrollment System');
      expect(template.html).toContain('John Doe');
      expect(template.html).toContain('Welcome');
    });

    test('should generate email verification template correctly', () => {
      const userName = 'Jane Smith';
      const verificationUrl = 'https://example.com/verify?token=abc123';
      const template = emailTemplates.emailVerification(userName, verificationUrl);

      expect(template.subject).toBe('Verify Your Email Address - Students Enrollment System');
      expect(template.html).toContain(userName);
      expect(template.html).toContain(verificationUrl);
      expect(template.html).toContain('Verify Email Address');
    });

    test('should generate password reset template correctly', () => {
      const userName = 'Bob Johnson';
      const resetUrl = 'https://example.com/reset?token=reset123';
      const template = emailTemplates.passwordReset(userName, resetUrl);

      expect(template.subject).toBe('Password Reset Request - Students Enrollment System');
      expect(template.html).toContain(userName);
      expect(template.html).toContain(resetUrl);
      expect(template.html).toContain('Reset Password');
    });

    test('should generate course enrollment template correctly', () => {
      const template = emailTemplates.courseEnrollment('Student Name', 'React Bootcamp', 299);

      expect(template.subject).toBe('Course Enrollment Confirmation');
      expect(template.html).toContain('Student Name');
      expect(template.html).toContain('React Bootcamp');
      expect(template.html).toContain('$299');
    });

    test('should generate payment confirmation template correctly', () => {
      const template = emailTemplates.paymentConfirmation(
        'Buyer Name',
        'JavaScript Course',
        199,
        'txn_123456',
      );

      expect(template.subject).toBe('Payment Confirmation - Students Enrollment System');
      expect(template.html).toContain('Buyer Name');
      expect(template.html).toContain('JavaScript Course');
      expect(template.html).toContain('$199');
      expect(template.html).toContain('txn_123456');
    });
  });

  describe('Email Configuration Verification', () => {
    test('should verify email configuration', async() => {
      const result = await verifyEmailConfig();
      expect(typeof result).toBe('object');
    });
  });
}); 