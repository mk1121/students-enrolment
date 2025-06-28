# 🤝 Contributing to Students Enrollment System

Thank you for your interest in contributing to the Students Enrollment System! We welcome contributions from developers of all skill levels. This guide will help you get started and ensure your contributions align with our project standards.

## 📋 Table of Contents

- [🎯 How to Contribute](#-how-to-contribute)
- [🚀 Getting Started](#-getting-started)
- [🔄 Development Workflow](#-development-workflow)
- [📝 Coding Guidelines](#-coding-guidelines)
- [🧪 Testing Requirements](#-testing-requirements)
- [📖 Documentation](#-documentation)
- [🐛 Bug Reports](#-bug-reports)
- [💡 Feature Requests](#-feature-requests)
- [👥 Community Guidelines](#-community-guidelines)

---

## 🎯 How to Contribute

### Types of Contributions

We welcome several types of contributions:

- **🐛 Bug Fixes**: Help us identify and fix issues
- **✨ New Features**: Implement new functionality
- **📚 Documentation**: Improve project documentation
- **🧪 Tests**: Add or improve test coverage
- **🔧 Performance**: Optimize existing code
- **🎨 UI/UX**: Enhance user interface and experience
- **🔒 Security**: Improve security measures

### Contribution Process

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch
4. **Make** your changes
5. **Test** your changes thoroughly
6. **Submit** a pull request

---

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **Git** (latest version)
- **MongoDB** (v6.0+ or MongoDB Atlas account)

### Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/students-enrolment.git
   cd students-enrolment
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/students-enrolment.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

5. **Set up environment**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

6. **Initialize database**:
   ```bash
   npm run migrate
   node seed-simple.js
   ```

7. **Start development servers**:
   ```bash
   npm run dev
   ```

8. **Verify setup**:
   - Backend: http://localhost:5001/api/health
   - Frontend: http://localhost:3000

---

## 🔄 Development Workflow

### Branch Strategy

We follow a Git Flow branching strategy:

```
main          ← Production-ready code
  ↑
develop       ← Integration branch
  ↑
feature/*     ← Feature development
hotfix/*      ← Critical fixes
release/*     ← Release preparation
```

### Creating a Feature Branch

```bash
# Update your local develop branch
git checkout develop
git pull upstream develop

# Create a new feature branch
git checkout -b feature/your-feature-name

# Start coding!
```

### Branch Naming Conventions

- **Features**: `feature/feature-name`
  - `feature/user-authentication`
  - `feature/course-search`
  - `feature/payment-integration`

- **Bug Fixes**: `bugfix/issue-description`
  - `bugfix/login-validation-error`
  - `bugfix/course-display-issue`

- **Documentation**: `docs/documentation-topic`
  - `docs/api-endpoints`
  - `docs/setup-guide`

- **Tests**: `test/test-description`
  - `test/auth-middleware`
  - `test/course-crud-operations`

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

#### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

#### Examples

```bash
feat(auth): add JWT token refresh functionality
fix(payment): resolve Stripe webhook validation error
docs(api): update authentication endpoint documentation
test(courses): add unit tests for course validation
refactor(db): optimize database query performance
style(ui): improve course card layout and spacing
```

---

## 📝 Coding Guidelines

### Code Style

We use **ESLint** and **Prettier** to maintain consistent code style:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Format code
npm run format
```

### JavaScript Standards

#### Variables and Functions
```javascript
// ✅ Good - camelCase for variables and functions
const userEmail = 'user@example.com';
const calculateTotalPrice = (items) => { };

// ✅ Good - PascalCase for classes
class UserService {
  constructor() { }
}

// ✅ Good - SCREAMING_SNAKE_CASE for constants
const API_BASE_URL = 'https://api.example.com';
```

#### Async/Await vs Promises
```javascript
// ✅ Preferred - async/await
const fetchUser = async (id) => {
  try {
    const user = await User.findById(id);
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// ❌ Avoid - promise chains
const fetchUser = (id) => {
  return User.findById(id)
    .then(user => user)
    .catch(error => {
      console.error('Error fetching user:', error);
      throw error;
    });
};
```

#### Error Handling
```javascript
// ✅ Good - comprehensive error handling
const createUser = async (userData) => {
  try {
    const user = new User(userData);
    await user.save();
    return { success: true, user };
  } catch (error) {
    if (error.code === 11000) {
      return { success: false, error: 'Email already exists' };
    }
    return { success: false, error: 'Failed to create user' };
  }
};
```

### React Guidelines

#### Component Structure
```javascript
// ✅ Good - functional component with hooks
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const CourseCard = ({ course, onEnroll }) => {
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      await onEnroll(course.id);
    } catch (error) {
      console.error('Enrollment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="course-card">
      <h3>{course.title}</h3>
      <p>{course.description}</p>
      <button onClick={handleEnroll} disabled={loading}>
        {loading ? 'Enrolling...' : 'Enroll Now'}
      </button>
    </div>
  );
};

CourseCard.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired
  }).isRequired,
  onEnroll: PropTypes.func.isRequired
};

export default CourseCard;
```

### Database Guidelines

#### Model Definition
```javascript
// ✅ Good - comprehensive schema with validation
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Add indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
```

---

## 🧪 Testing Requirements

### Test Coverage

We aim for high test coverage across all components:

- **Backend**: Minimum 80% coverage
- **Frontend**: Minimum 70% coverage
- **Critical paths**: 100% coverage (auth, payments)

### Writing Tests

#### Backend Tests
```javascript
// tests/routes/auth.test.js
describe('Auth Routes', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
    });
  });
});
```

#### Frontend Tests
```javascript
// components/CourseCard.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import CourseCard from './CourseCard';

const mockCourse = {
  id: '1',
  title: 'JavaScript Fundamentals',
  description: 'Learn JavaScript basics'
};

describe('CourseCard', () => {
  it('should render course information correctly', () => {
    render(<CourseCard course={mockCourse} onEnroll={jest.fn()} />);
    
    expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Learn JavaScript basics')).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
# Run all tests
npm run test:all

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/routes/auth.test.js

# Watch mode for development
npm run test:watch
```

---

## 📖 Documentation

### Code Documentation

#### JSDoc Comments
```javascript
/**
 * Creates a new user enrollment for a course
 * @param {string} userId - The ID of the user
 * @param {string} courseId - The ID of the course
 * @param {Object} paymentInfo - Payment information
 * @param {number} paymentInfo.amount - Payment amount
 * @param {string} paymentInfo.method - Payment method
 * @returns {Promise<Object>} The created enrollment object
 * @throws {Error} When user or course not found
 */
const createEnrollment = async (userId, courseId, paymentInfo) => {
  // Implementation
};
```

#### README Updates

When adding new features, update relevant documentation:

- **README.md**: Main project overview
- **docs/API.md**: API endpoint documentation
- **docs/DEVELOPMENT.md**: Development setup and guidelines

### API Documentation

For new API endpoints, include:

```javascript
/**
 * @api {post} /api/enrollments Create Enrollment
 * @apiName CreateEnrollment
 * @apiGroup Enrollments
 * 
 * @apiParam {String} courseId Course ID
 * @apiParam {String} paymentIntentId Payment intent ID
 * 
 * @apiSuccess {Boolean} success Response status
 * @apiSuccess {Object} data Enrollment data
 * 
 * @apiError {Boolean} success false
 * @apiError {String} error Error message
 */
```

---

## 🐛 Bug Reports

### Before Reporting

1. **Search existing issues** to avoid duplicates
2. **Test with latest version** from develop branch
3. **Check documentation** for known limitations
4. **Try reproducing** the issue consistently

### Bug Report Template

When creating a bug report, include:

```markdown
## Bug Description
A clear and concise description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Node.js version: [e.g. 18.17.0]
- Project version: [e.g. 1.0.0]

## Screenshots
If applicable, add screenshots.

## Additional Context
Any other context about the problem.
```

### Priority Levels

- **🔴 Critical**: Security issues, data loss, system crashes
- **🟠 High**: Major functionality broken, significant user impact
- **🟡 Medium**: Minor functionality issues, workaround available
- **🟢 Low**: Cosmetic issues, enhancement requests

---

## 💡 Feature Requests

### Feature Request Template

```markdown
## Feature Description
A clear and concise description of the feature.

## Problem Statement
What problem does this feature solve?

## Proposed Solution
Describe your proposed solution.

## Alternative Solutions
Alternative approaches you've considered.

## Additional Context
Screenshots, mockups, or references.

## Implementation Considerations
Technical considerations or constraints.
```

### Evaluation Criteria

Features are evaluated based on:

- **User Impact**: How many users will benefit?
- **Complexity**: Implementation effort required
- **Alignment**: Fits project goals and architecture
- **Resources**: Available development capacity

---

## 👥 Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:

- Experience level
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Body size
- Race
- Ethnicity
- Age
- Religion
- Nationality

### Expected Behavior

- **Be respectful** and inclusive in communications
- **Welcome newcomers** and help them get started
- **Give constructive feedback** during code reviews
- **Focus on collaboration** over competition
- **Acknowledge contributions** from others

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing others' private information
- Spamming or excessive self-promotion
- Any other conduct deemed inappropriate

### Enforcement

Community guidelines are enforced by project maintainers. Violations may result in:

1. **Warning**: Private message about the behavior
2. **Temporary ban**: Short-term exclusion from project
3. **Permanent ban**: Long-term exclusion from project

---

## 🔄 Pull Request Process

### Before Submitting

Ensure your pull request:

- [ ] **Follows coding standards** (linting passes)
- [ ] **Includes tests** for new functionality
- [ ] **Updates documentation** as needed
- [ ] **Passes all tests** in CI pipeline
- [ ] **Has descriptive commit messages**
- [ ] **Targets the correct branch** (usually `develop`)

### Pull Request Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to change)
- [ ] Documentation update

## Changes Made
- List specific changes
- Include any breaking changes
- Mention configuration changes

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Test coverage maintained

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have made corresponding changes to documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective
- [ ] New and existing unit tests pass
```

### Review Process

1. **Automated checks** run (linting, tests, security)
2. **Manual review** by maintainers
3. **Feedback incorporation** if changes requested
4. **Approval and merge** once ready

### Review Criteria

Reviewers check for:

- **Code quality** and adherence to standards
- **Test coverage** and test quality
- **Documentation** completeness
- **Security** considerations
- **Performance** impact
- **Backward compatibility**

---

## 🏆 Recognition

### Contributors

We recognize contributors through:

- **Contributors file** listing all contributors
- **Release notes** mentioning significant contributions
- **GitHub achievements** and profile contributions
- **Community highlights** in project updates

### Becoming a Maintainer

Regular contributors may be invited to become maintainers based on:

- **Consistent quality** contributions
- **Community engagement** and helpfulness
- **Understanding** of project goals and architecture
- **Availability** for ongoing maintenance

---

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time chat and support
- **Email**: Private or sensitive matters

### Development Help

- **Documentation**: Check [docs/](docs/) folder
- **Examples**: Review existing code patterns
- **Mentoring**: Ask for help in discussions
- **Pair programming**: Available for complex features

---

## 📚 Additional Resources

### Learning Materials

- [Git Workflow Guide](https://www.atlassian.com/git/tutorials/comparing-workflows)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [JavaScript Best Practices](https://github.com/ryanmcdermott/clean-code-javascript)
- [React Best Practices](https://reactjs.org/docs/thinking-in-react.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Development Tools

- [Postman Collection](https://documenter.getpostman.com/view/your-collection) - API testing
- [VS Code Extensions](.vscode/extensions.json) - Recommended extensions
- [Docker Setup](docker-compose.yml) - Local development environment

---

## 🙏 Thank You

Thank you for contributing to the Students Enrollment System! Your efforts help make this project better for everyone. Whether you're fixing bugs, adding features, improving documentation, or helping other contributors, your work is valued and appreciated.

Together, we're building something amazing! 🚀

---

**Happy Contributing!** 💻✨ 