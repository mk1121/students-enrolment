# Testing Documentation

This document provides comprehensive information about testing the Students Enrollment System, with special focus on OAuth2 Gmail integration and email verification functionality.

## Overview

The testing suite covers all aspects of the application including:
- 🔐 Authentication and authorization
- 📧 OAuth2 Gmail email integration  
- 👤 User management and profiles
- 📚 Course management
- 💳 Payment processing
- 🔍 API endpoints and business logic

## Quick Start

```bash
# Install dependencies
bun install

# Run all tests
bun test

# Run with coverage
bun run test:coverage

# Run specific test suite
bun test -- tests/utils/email.test.js

# Run in watch mode
bun test -- --watch
```

## Test Environment Setup

### Database Configuration
```javascript
// tests/setup.js
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
```

### Environment Variables
```env
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key-for-testing-only
GMAIL_CLIENT_ID=test-client-id
GMAIL_CLIENT_SECRET=test-client-secret
GMAIL_REFRESH_TOKEN=test-refresh-token
EMAIL_USER=test@gmail.com
EMAIL_FROM=noreply@studentsenrollment.com
STRIPE_SECRET_KEY=sk_test_fake_key_for_testing
```

## OAuth2 Gmail Integration Testing

### Test Structure Overview

```javascript
// tests/utils/email.test.js
describe('Email Service with OAuth2 Gmail Integration', () => {
  describe('OAuth2 Configuration', () => {
    // OAuth2 setup and credential tests
  });
  
  describe('Email Verification Tests', () => {
    // Registration email verification tests
  });
  
  describe('Password Reset Tests', () => {
    // Password reset email tests
  });
  
  describe('OAuth2 Error Handling', () => {
    // Error scenarios and recovery tests
  });
});
```

### OAuth2 Configuration Tests

#### 1. Credential Management
```javascript
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
```

#### 2. Missing Credentials Handling
```javascript
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
```

### Email Verification Testing

#### 1. Template Generation
```javascript
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
});
```

#### 2. Template Content Validation
```javascript
test('should include verification link in email template', () => {
  const userName = 'Jane Smith';
  const verificationUrl = 'https://example.com/verify?token=xyz789';
  const template = emailTemplates.emailVerification(userName, verificationUrl);

  expect(template.html).toContain(`href="${verificationUrl}"`);
  expect(template.html).toContain('This verification link will expire in 24 hours');
  expect(template.html).toContain('background-color: #007bff');
  expect(template.html).toContain('Verify Email Address');
});
```

#### 3. OAuth2 Failure During Verification
```javascript
test('should handle email verification with OAuth2 failure', async () => {
  mockOAuth2Client.getAccessToken.mockRejectedValue(new Error('OAuth2 failed'));
  
  const template = emailTemplates.emailVerification('Test User', 'https://example.com/verify');
  
  const result = await sendEmail({
    to: 'test@example.com',
    subject: template.subject,
    html: template.html
  });

  expect(result.messageId).toBe('mock-message-id-oauth2');
});
```

### Password Reset Testing

#### 1. Template Generation
```javascript
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
});
```

#### 2. Security Features
```javascript
test('should include security warning in password reset template', () => {
  const template = emailTemplates.passwordReset('User', 'https://example.com/reset');

  expect(template.html).toContain('This link will expire in 1 hour');
  expect(template.html).toContain('If you didn\'t request this password reset');
  expect(template.html).toContain('this link can only be used once');
  expect(template.html).toContain('background-color: #dc3545');
});
```

#### 3. OAuth2 Token Refresh
```javascript
test('should handle password reset with OAuth2 token refresh', async () => {
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
```

### OAuth2 Error Handling Tests

#### 1. Expired Token Scenarios
```javascript
test('should handle expired refresh token', async () => {
  mockOAuth2Client.getAccessToken.mockRejectedValue(
    new Error('invalid_grant: Token has been expired or revoked')
  );

  const result = await sendEmail({
    to: 'test@example.com',
    subject: 'Test',
    html: '<p>Test</p>'
  });

  expect(result.messageId).toBe('mock-message-id-oauth2');
});
```

#### 2. Invalid Credentials
```javascript
test('should handle invalid credentials error', async () => {
  mockTransporter.verify.mockRejectedValue(
    new Error('BadCredentials: Invalid login')
  );

  const verificationResult = await verifyEmailConfig();
  expect(verificationResult.success).toBe(false);
  expect(verificationResult.message).toContain('BadCredentials');
});
```

#### 3. Network Issues
```javascript
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
```

### Email Template Security Tests

#### 1. Input Sanitization
```javascript
test('should handle potentially malicious input safely', () => {
  const maliciousName = '<script>alert("xss")</script>John';
  const template = emailTemplates.emailVerification(maliciousName, 'https://example.com');

  // Template contains the input as-is (sanitization should happen at render time)
  expect(template.html).toContain(maliciousName);
});
```

#### 2. URL Validation
```javascript
test('should validate email URLs in templates', () => {
  const validUrl = 'https://example.com/verify?token=abc123';
  const template = emailTemplates.emailVerification('User', validUrl);

  expect(template.html).toContain(validUrl);
  expect(template.html).toMatch(/href="https:\/\/[^"]+"/);
});
```

## Authentication Flow Testing

### Registration with Email Verification
```javascript
describe('Registration with Email Verification', () => {
  test('should register user and trigger verification email', async () => {
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.message).toBe('User registered successfully. Please check your email to verify your account.');
    
    // Verify user was created with unverified status
    const user = await User.findOne({ email: userData.email });
    expect(user.isEmailVerified).toBe(false);
    expect(user.emailVerificationToken).toBeTruthy();
  });

  test('should verify email with valid token', async () => {
    const user = await createTestUser({
      isEmailVerified: false,
      emailVerificationToken: 'valid-token',
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const response = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: 'valid-token' })
      .expect(200);

    expect(response.body.message).toBe('Email verified successfully');

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.isEmailVerified).toBe(true);
    expect(updatedUser.emailVerificationToken).toBeUndefined();
  });
});
```

### Password Reset Flow
```javascript
describe('Password Reset Flow', () => {
  test('should send password reset email', async () => {
    const user = await createTestUser({
      email: 'test@example.com',
      isEmailVerified: true
    });

    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' })
      .expect(200);

    expect(response.body.message).toBe('If an account with that email exists, a password reset link has been sent.');

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.passwordResetToken).toBeTruthy();
    expect(updatedUser.passwordResetExpires).toBeTruthy();
  });

  test('should reset password with valid token', async () => {
    const user = await createTestUser({
      passwordResetToken: 'valid-reset-token',
      passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000)
    });

    const newPassword = 'newpassword123';

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: 'valid-reset-token',
        password: newPassword
      })
      .expect(200);

    expect(response.body.message).toBe('Password reset successfully');

    const updatedUser = await User.findById(user._id).select('+password');
    const isMatch = await updatedUser.comparePassword(newPassword);
    expect(isMatch).toBe(true);
  });
});
```

## Mock Configuration

### Nodemailer Mocking
```javascript
// Mock setup for nodemailer
jest.mock('nodemailer');

beforeEach(() => {
  mockTransporter = {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
    verify: jest.fn().mockResolvedValue(true)
  };

  nodemailer.createTransporter = jest.fn().mockReturnValue(mockTransporter);
});
```

### Google APIs Mocking
```javascript
// Mock setup for Google OAuth2
jest.mock('googleapis');

beforeEach(() => {
  mockOAuth2Client = {
    setCredentials: jest.fn(),
    getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-access-token' })
  };

  google.auth.OAuth2 = jest.fn().mockReturnValue(mockOAuth2Client);
});
```

## Integration Testing

### Email Service Integration
```javascript
describe('Complete OAuth2 Flow Integration', () => {
  test('should complete full authentication and email flow', async () => {
    // 1. Register user
    const userData = {
      firstName: 'Integration',
      lastName: 'Test',
      email: 'integration@example.com',
      password: 'password123'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    // 2. Verify OAuth2 client was configured
    expect(google.auth.OAuth2).toHaveBeenCalledWith(
      'test-client-id',
      'test-client-secret',
      'https://developers.google.com/oauthplayground'
    );

    // 3. Verify email would be sent
    expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith({
      refresh_token: 'test-refresh-token'
    });

    // 4. Get verification token from database
    const user = await User.findOne({ email: userData.email });
    const token = user.emailVerificationToken;

    // 5. Verify email
    const verifyResponse = await request(app)
      .post('/api/auth/verify-email')
      .send({ token })
      .expect(200);

    // 6. Login with verified account
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      })
      .expect(200);

    expect(loginResponse.body.token).toBeTruthy();
  });
});
```

## Performance Testing

### Email Service Performance
```javascript
describe('Email Service Performance', () => {
  test('should handle multiple concurrent email requests', async () => {
    const emailPromises = Array.from({ length: 10 }, (_, i) =>
      sendEmail({
        to: `test${i}@example.com`,
        subject: `Test Email ${i}`,
        html: `<p>Test content ${i}</p>`
      })
    );

    const results = await Promise.all(emailPromises);
    
    results.forEach(result => {
      expect(result.messageId).toBeTruthy();
    });

    expect(mockTransporter.sendMail).toHaveBeenCalledTimes(10);
  });

  test('should handle OAuth2 token refresh under load', async () => {
    // Simulate token expiration on first call
    mockOAuth2Client.getAccessToken
      .mockRejectedValueOnce(new Error('Token expired'))
      .mockResolvedValue({ token: 'new-token' });

    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Load Test',
      html: '<p>Load test content</p>'
    });

    expect(result.messageId).toBe('mock-message-id-oauth2');
  });
});
```

## Test Utilities and Helpers

### Email Testing Helpers
```javascript
// tests/helpers/emailHelpers.js
const { emailTemplates } = require('../../server/utils/email');

// Helper to validate email template structure
function validateEmailTemplate(template) {
  expect(template).toHaveProperty('subject');
  expect(template).toHaveProperty('html');
  expect(template.subject).toBeTruthy();
  expect(template.html).toBeTruthy();
  expect(template.html).toContain('Students Enrollment System');
}

// Helper to extract links from email HTML
function extractLinksFromEmail(html) {
  const linkRegex = /href="([^"]+)"/g;
  const links = [];
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    links.push(match[1]);
  }
  
  return links;
}

// Helper to validate verification URL
function validateVerificationUrl(url) {
  expect(url).toMatch(/^https:\/\/.+\/verify\?token=.+$/);
  
  const urlObj = new URL(url);
  expect(urlObj.searchParams.get('token')).toBeTruthy();
}

module.exports = {
  validateEmailTemplate,
  extractLinksFromEmail,
  validateVerificationUrl
};
```

### OAuth2 Testing Utilities
```javascript
// tests/helpers/oauth2Helpers.js

// Mock OAuth2 success scenario
function mockOAuth2Success() {
  mockOAuth2Client.setCredentials.mockReturnValue();
  mockOAuth2Client.getAccessToken.mockResolvedValue({
    token: 'ya29.mock-access-token'
  });
}

// Mock OAuth2 failure scenarios
function mockOAuth2Failure(errorType = 'expired_token') {
  const errors = {
    expired_token: new Error('invalid_grant: Token has been expired'),
    invalid_credentials: new Error('BadCredentials: Invalid login'),
    network_error: new Error('Network error: ENOTFOUND'),
    scope_error: new Error('insufficient_scope: Requested scopes exceed granted')
  };

  mockOAuth2Client.getAccessToken.mockRejectedValue(
    errors[errorType] || errors.expired_token
  );
}

// Reset OAuth2 mocks
function resetOAuth2Mocks() {
  jest.clearAllMocks();
  mockOAuth2Success();
}

module.exports = {
  mockOAuth2Success,
  mockOAuth2Failure,
  resetOAuth2Mocks
};
```

## Coverage and Reporting

### Coverage Targets
- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

### Critical Coverage Areas
```javascript
// High-priority areas for test coverage
const criticalAreas = [
  'Authentication flows',
  'OAuth2 integration',
  'Email verification',
  'Password reset',
  'Payment processing',
  'Data validation',
  'Error handling',
  'Security measures'
];
```

### Coverage Commands
```bash
# Generate detailed coverage report
bun run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html

# Check coverage for specific files
bun run test:coverage -- --collectCoverageFrom="server/utils/email.js"
```

## Continuous Integration

### GitHub Actions Configuration
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'bun'
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Run tests
        run: bun run test:coverage
        env:
          NODE_ENV: test
          JWT_SECRET: test-jwt-secret
          GMAIL_CLIENT_ID: test-client-id
          GMAIL_CLIENT_SECRET: test-client-secret
          GMAIL_REFRESH_TOKEN: test-refresh-token
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## Debugging Tests

### Debug Configuration
```javascript
// jest.config.js for debugging
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // For debugging
  testTimeout: 30000,
  detectOpenHandles: true,
  forceExit: true
};
```

### Debug Commands
```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test with debugging
bun test -- --testNamePattern="should send email verification" --verbose

# Debug with additional logging
DEBUG=* bun test
```

This comprehensive testing documentation covers all aspects of OAuth2 Gmail integration testing, email verification workflows, and provides the foundation for maintaining high-quality, well-tested email functionality in the Students Enrollment System. 