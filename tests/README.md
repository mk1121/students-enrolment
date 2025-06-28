# Test Suite Documentation

This directory contains comprehensive tests for the Students Enrollment System backend.

## Running Tests

### Install Dependencies
```bash
bun install
```

### Run All Tests
```bash
bun test
```

### Run Tests with Coverage
```bash
bun run test:coverage
```

### Run Specific Test Suites
```bash
# Run only email tests
bun test -- tests/utils/email.test.js

# Run only auth tests
bun test -- tests/routes/auth.test.js

# Run with verbose output
bun test -- --verbose

# Run tests in watch mode
bun test -- --watch
```

## Test Structure

- `setup.js` - Jest configuration and database setup
- `helpers/` - Test utilities and helper functions
- `models/` - Database model tests
- `middleware/` - Middleware tests
- `routes/` - API route tests
- `utils/` - Utility function tests (including email service)

## Test Coverage

The test suite covers:
- ✅ User model validation and methods
- ✅ Authentication middleware
- ✅ Authentication routes (login, register, password reset, email verification)
- ✅ OAuth2 Gmail integration with nodemailer
- ✅ Email service functionality and templates
- ✅ Basic courses routes
- ❌ Enrollment routes (to be added)
- ❌ Payment routes (to be added)
- ❌ User management routes (to be added)

## Test Categories

### 1. Model Tests (`tests/models/`)

**User Model Tests**: 
- Validation rules and constraints
- Password hashing with bcrypt
- Instance methods (comparePassword, generatePublicProfile)
- Virtual properties
- Pre-save middleware
- Database indexes

```javascript
// Example model test
test('should hash password before saving', async () => {
  const user = new User({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'plaintext123'
  });
  
  await user.save();
  expect(user.password).not.toBe('plaintext123');
  expect(user.password).toMatch(/^\$2[ab]\$/); // bcrypt hash pattern
});
```

### 2. Middleware Tests (`tests/middleware/`)

**Authentication Middleware**:
- JWT token validation
- Role-based access control (admin, instructor, student)
- Ownership verification
- Optional authentication scenarios
- Error handling for invalid/expired tokens

```javascript
// Example middleware test
test('should verify valid JWT token', async () => {
  const user = await createTestUser();
  const token = generateToken(user);
  
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = {};
  const next = jest.fn();
  
  await authMiddleware(req, res, next);
  
  expect(req.user).toBeDefined();
  expect(req.user.id).toBe(user._id.toString());
  expect(next).toHaveBeenCalledWith();
});
```

### 3. Route Tests (`tests/routes/`)

**Authentication Routes**:
- User registration with validation
- Login with credentials verification
- Password reset flow
- Email verification process
- Error handling and validation

**Courses Routes**:
- CRUD operations
- Filtering and pagination
- Authorization checks
- Instructor assignment

```javascript
// Example route test
test('should register new user and send verification email', async () => {
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
  expect(response.body.user.password).toBeUndefined(); // Password should not be returned
});
```

### 4. Email Service Tests (`tests/utils/`)

**OAuth2 Gmail Integration Tests**:

#### OAuth2 Configuration
- OAuth2 client creation with correct credentials
- Refresh token management
- Access token generation and refresh
- Error handling for expired/invalid tokens

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
```

#### Email Verification Tests
- Email verification template generation
- Verification link inclusion and formatting
- OAuth2 failure handling during verification
- Security considerations (link expiration, etc.)

```javascript
test('should send email verification with correct template', async () => {
  const userName = 'John Doe';
  const verificationUrl = 'https://example.com/verify?token=abc123';
  const template = emailTemplates.emailVerification(userName, verificationUrl);

  expect(template.subject).toBe('Verify Your Email Address - Students Enrollment System');
  expect(template.html).toContain(userName);
  expect(template.html).toContain(verificationUrl);
  expect(template.html).toContain('This verification link will expire in 24 hours');
});
```

#### Password Reset Tests
- Password reset email template
- Reset URL generation and validation
- Security warnings and expiration notices
- OAuth2 token refresh during reset process

```javascript
test('should include security warning in password reset template', () => {
  const template = emailTemplates.passwordReset('User', 'https://example.com/reset');

  expect(template.html).toContain('This link will expire in 1 hour');
  expect(template.html).toContain('If you didn\'t request this password reset');
  expect(template.html).toContain('this link can only be used once');
});
```

#### OAuth2 Error Handling
- Expired refresh token scenarios
- Invalid credentials handling
- Network connectivity issues
- Scope permission errors
- Graceful fallback mechanisms

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

#### Email Template Security
- Input sanitization tests
- XSS prevention
- URL validation
- Template injection protection

```javascript
test('should validate email URLs in templates', () => {
  const validUrl = 'https://example.com/verify?token=abc123';
  const template = emailTemplates.emailVerification('User', validUrl);

  expect(template.html).toContain(validUrl);
  expect(template.html).toMatch(/href="https:\/\/[^"]+"/);
});
```

### 5. Integration Tests (`tests/integration/`)

**Server Integration Tests**:
- Health check endpoints
- Database connectivity
- Error handling middleware
- CORS configuration
- Security headers

## Test Environment

### Database Configuration
- **Database**: In-memory MongoDB using `mongodb-memory-server`
- **Isolation**: Each test gets a fresh database instance
- **Cleanup**: Automatic cleanup after each test
- **Transactions**: Support for transaction testing

### Mocking Strategy
- **External APIs**: Stripe, email services
- **OAuth2**: Google APIs and token management
- **File System**: File uploads and storage
- **Time**: Date/time for consistent testing

```javascript
// Email service mocking
jest.mock('nodemailer');
jest.mock('googleapis');

beforeEach(() => {
  // Mock OAuth2 client
  mockOAuth2Client = {
    setCredentials: jest.fn(),
    getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-token' })
  };
  
  google.auth.OAuth2 = jest.fn().mockReturnValue(mockOAuth2Client);
});
```

### Environment Variables
```env
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key-for-testing-only
STRIPE_SECRET_KEY=sk_test_fake_key_for_testing
GMAIL_CLIENT_ID=test-client-id
GMAIL_CLIENT_SECRET=test-client-secret
GMAIL_REFRESH_TOKEN=test-refresh-token
EMAIL_USER=test@gmail.com
```

## Test Helpers

The `testHelpers.js` provides utilities for:

### User Management
```javascript
// Create test users with different roles
const student = await createTestUser({ role: 'student' });
const instructor = await createTestUser({ role: 'instructor' });
const admin = await createTestAdmin();
```

### Course Management
```javascript
// Create test courses
const course = await createTestCourse({
  instructor: instructorId,
  price: 299
});
```

### Authentication
```javascript
// Generate JWT tokens
const token = generateToken(user);
const authHeader = getAuthHeaders(user);
```

### Sample Data
```javascript
// Consistent test data
const sampleUserData = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: 'password123'
};
```

## Best Practices

### 1. Test Isolation
```javascript
beforeEach(async () => {
  // Clear database
  await User.deleteMany({});
  await Course.deleteMany({});
  
  // Reset mocks
  jest.clearAllMocks();
});
```

### 2. Realistic Test Data
```javascript
// Use realistic data that matches production patterns
const realUserData = {
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah.johnson@university.edu',
  dateOfBirth: new Date('1995-03-15'),
  phone: '+1-555-0123'
};
```

### 3. Error Testing
```javascript
// Test both success and failure scenarios
describe('Password reset', () => {
  test('should reset password with valid token', async () => {
    // Success case
  });
  
  test('should reject invalid token', async () => {
    // Failure case
  });
  
  test('should reject expired token', async () => {
    // Edge case
  });
});
```

### 4. Async Testing
```javascript
// Proper async/await usage
test('should create user asynchronously', async () => {
  const userData = { /* ... */ };
  
  const response = await request(app)
    .post('/api/auth/register')
    .send(userData);
    
  expect(response.status).toBe(201);
  
  // Verify database state
  const user = await User.findOne({ email: userData.email });
  expect(user).toBeTruthy();
});
```

## Coverage Reporting

### Coverage Targets
- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

### Coverage Reports
```bash
# Generate coverage report
bun run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

### Critical Coverage Areas
- Authentication flows
- Payment processing
- Email delivery
- Data validation
- Error handling

## Debugging Tests

### Debug Mode
```bash
# Run tests with debug output
DEBUG=* bun test

# Run specific test with debugging
bun test -- --testNamePattern="should register user" --verbose
```

### Debug Tools
```javascript
// Add debugging to tests
test('should process payment', async () => {
  console.log('Starting payment test...');
  
  const paymentData = { /* ... */ };
  console.log('Payment data:', paymentData);
  
  const result = await processPayment(paymentData);
  console.log('Payment result:', result);
  
  expect(result.success).toBe(true);
});
```

### Common Debug Scenarios
1. **Database Connection Issues**: Check MongoDB memory server status
2. **Mock Failures**: Verify mock setup and reset
3. **Async Timing**: Ensure proper await usage
4. **Environment Variables**: Verify test environment setup

## CI/CD Integration

### GitHub Actions
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: bun install --frozen-lockfile
      - run: bun run test:coverage
      - uses: codecov/codecov-action@v1
```

### Test Automation
- **Pre-commit**: Run relevant tests before commits
- **PR Validation**: Full test suite on pull requests
- **Deployment**: Integration tests before deployment
- **Monitoring**: Post-deployment smoke tests

## Adding New Tests

### Checklist for New Tests
1. ✅ Create test file in appropriate directory
2. ✅ Use consistent naming: `*.test.js`
3. ✅ Import required helpers and utilities
4. ✅ Set up proper beforeEach/afterEach cleanup
5. ✅ Test both success and failure scenarios
6. ✅ Mock external dependencies
7. ✅ Include edge cases and boundary conditions
8. ✅ Add descriptive test names and comments
9. ✅ Verify test coverage impact
10. ✅ Update documentation if needed

### Test Template
```javascript
const request = require('supertest');
const app = require('../../app');
const { createTestUser, generateToken } = require('../helpers/testHelpers');

describe('New Feature Tests', () => {
  let testUser;
  
  beforeEach(async () => {
    testUser = await createTestUser();
  });
  
  afterEach(async () => {
    // Cleanup
  });
  
  describe('Feature functionality', () => {
    test('should handle success case', async () => {
      // Test implementation
    });
    
    test('should handle error case', async () => {
      // Test implementation
    });
  });
});
``` 