# 👨‍💻 Development Guide
## Students Enrollment System - Developer Handbook

---

## 📋 Table of Contents

- [🚀 Getting Started](#-getting-started)
- [🛠️ Development Environment](#️-development-environment)
- [📁 Project Structure](#-project-structure)
- [🔄 Development Workflow](#-development-workflow)
- [📝 Coding Standards](#-coding-standards)
- [🧪 Testing Guidelines](#-testing-guidelines)
- [🔍 Debugging](#-debugging)
- [📦 Package Management](#-package-management)
- [🎯 Best Practices](#-best-practices)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your development machine:

```bash
# Node.js (v18.0.0 or higher)
node --version  # Should output v18.x.x or higher

# Bun (v1.0.0 or higher)
bun --version   # Should output 1.x.x or higher

# Git
git --version   # Any recent version

# MongoDB (optional for local development)
mongod --version # v6.0 or higher (can use MongoDB Atlas instead)
```

### Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/students-enrolment.git
cd students-enrolment

# 2. Install dependencies
bun install
cd client && bun install && cd ..

# 3. Environment configuration
cp env.example .env
# Edit .env with your configuration

# 4. Database setup
bun run migrate
node seed.js

# 5. Create admin user
# Interactive admin creation
node create-admin-interactive.js

# 6. Start the application
# Development mode (both frontend and backend)
bun run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=5001
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/students-enrollment-dev
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/students-enrollment-dev

# Authentication
JWT_SECRET=your-super-secret-jwt-key-for-development-only
JWT_EXPIRE=1h
JWT_REFRESH_SECRET=your-refresh-secret-for-development
JWT_REFRESH_EXPIRE=7d

# Payment Gateways (Test Keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

SSLCOMMERZ_STORE_ID=test_store_id
SSLCOMMERZ_STORE_PASSWORD=test_store_password
SSLCOMMERZ_IS_LIVE=false

# Email Configuration (Gmail OAuth 2.0)
EMAIL_FROM=noreply@yourdomain.com
EMAIL_USER=your-email@gmail.com
GMAIL_CLIENT_ID=your-gmail-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REFRESH_TOKEN=your-gmail-refresh-token

# Development Tools
DEBUG=app:*
LOG_LEVEL=debug
```

---

## 🛠️ Development Environment

### Recommended IDE Setup

#### Visual Studio Code Extensions

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "humao.rest-client",
    "mongodb.mongodb-vscode",
    "ms-vscode.vscode-jest",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

#### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "files.associations": {
    "*.js": "javascriptreact"
  }
}
```

### Development Tools Setup

#### MongoDB Setup Options

**Option 1: Local MongoDB**
```bash
# Install MongoDB Community Edition
# macOS
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb/brew/mongodb-community

# Ubuntu
sudo apt-get install mongodb

# Start MongoDB
sudo systemctl start mongod
```

**Option 2: MongoDB Docker**
```bash
# Run MongoDB in Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:6.0

# Connect to MongoDB
docker exec -it mongodb mongosh
```

**Option 3: MongoDB Atlas (Recommended)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

---

## 📁 Project Structure

### Root Directory

```
students-enrolment/
├── 📁 client/                    # React frontend application
├── 📁 server/                    # Express.js backend modules
├── 📁 tests/                     # Test suites and helpers
├── 📁 docs/                      # Documentation files
├── 📁 migrations/                # Database migration scripts
├── 📁 scripts/                   # Utility scripts
├── 📁 .github/                   # GitHub Actions workflows
├── 📄 server.js                  # Express server entry point
├── 📄 package.json               # Backend dependencies
├── 📄 docker-compose.yml         # Docker configuration
├── 📄 .env.example              # Environment template
├── 📄 .eslintrc.js              # ESLint configuration
├── 📄 .prettierrc               # Prettier configuration
├── 📄 jest.config.js            # Jest test configuration
└── 📄 README.md                 # Project documentation
```

### Backend Structure (`/server`)

```
server/
├── 📁 middleware/                # Express middleware
│   └── auth.js                  # JWT authentication
├── 📁 models/                   # Mongoose data models
│   ├── User.js                  # User schema
│   ├── Course.js                # Course schema
│   ├── Enrollment.js            # Enrollment schema
│   └── Payment.js               # Payment schema
├── 📁 routes/                   # Express route handlers
│   ├── auth.js                  # Authentication endpoints
│   ├── courses.js               # Course management
│   ├── enrollments.js           # Enrollment handling
│   ├── payments.js              # Payment processing
│   ├── sslcommerz.js           # SSLCommerz integration
│   └── users.js                 # User management
└── 📁 utils/                    # Utility functions
    └── email.js                 # Email service utilities
```

### Frontend Structure (`/client`)

```
client/
├── 📁 public/                   # Static assets
│   ├── index.html              # HTML template
│   ├── favicon.ico             # Favicon
│   └── manifest.json           # PWA manifest
├── 📁 src/                     # React source code
│   ├── 📁 components/          # Reusable React components
│   │   ├── 📁 Auth/           # Authentication components
│   │   └── 📁 Layout/         # Layout components
│   ├── 📁 pages/              # Page components
│   │   ├── 📁 Auth/           # Authentication pages
│   │   ├── 📁 Admin/          # Admin panel pages
│   │   └── 📁 Courses/        # Course-related pages
│   ├── 📁 context/            # React Context providers
│   ├── App.js                 # Main application component
│   ├── App.test.js            # App component tests
│   └── index.js               # Application entry point
└── 📄 package.json            # Frontend dependencies
```

---

## 🔄 Development Workflow

### Git Workflow

#### Branch Strategy

```mermaid
gitgraph
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Setup"
    
    branch feature/auth
    checkout feature/auth
    commit id: "Auth logic"
    commit id: "Auth tests"
    
    checkout develop
    merge feature/auth
    
    branch feature/courses
    checkout feature/courses
    commit id: "Course CRUD"
    commit id: "Course tests"
    
    checkout develop
    merge feature/courses
    
    checkout main
    merge develop
    commit id: "Release v1.0"
```

#### Branch Naming Conventions

```bash
# Feature branches
feature/user-authentication
feature/course-management
feature/payment-integration

# Bug fix branches
bugfix/login-validation
bugfix/course-display

# Hotfix branches
hotfix/security-patch
hotfix/payment-error

# Release branches
release/v1.0.0
release/v1.1.0
```

#### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
# Format: <type>(<scope>): <description>

# Examples
feat(auth): add JWT token refresh functionality
fix(payment): resolve Stripe webhook validation error
docs(api): update authentication endpoint documentation
test(courses): add unit tests for course validation
refactor(db): optimize database query performance
style(ui): improve course card layout and spacing
chore(deps): update dependencies to latest versions
```

### Development Commands

```bash
# Backend Development
bun run server          # Start backend with nodemon
bun run lint           # Run ESLint
bun run lint:fix       # Fix ESLint issues
bun run format         # Format code with Prettier
bun run format:check   # Check code formatting

# Frontend Development
bun run client         # Start React development server
cd client && bun start # Alternative way to start frontend

# Full Development
bun run dev           # Start both backend and frontend concurrently

# Testing
bun run test:backend      # Run backend tests
bun run test:frontend     # Run frontend tests
bun run test:all         # Run all tests
bun run test:coverage    # Generate test coverage report

# Database
bun run migrate          # Run database migrations
bun run migrate:status   # Check migration status
bun run migrate:rollback # Rollback last migration
node seed.js            # Seed database with comprehensive data

# Build & Production
bun run build           # Build frontend for production
bun start              # Start production server

# Utilities
bun run health:check    # Check application health
bun audit              # Check for security vulnerabilities
bun outdated           # Check for outdated packages
```

### Daily Development Routine

1. **Start Your Day**
   ```bash
   git checkout develop
   git pull origin develop
   bun install  # Update dependencies if needed
   bun run dev  # Start development servers
   ```

2. **Feature Development**
   ```bash
   git checkout -b feature/your-feature-name
   # Make your changes
   bun run lint
   bun run test:all
   git add .
   git commit -m "feat(scope): your commit message"
   git push origin feature/your-feature-name
   ```

3. **Code Review & Merge**
   - Create Pull Request on GitHub
   - Request code review
   - Address feedback
   - Merge to develop branch

---

## 📝 Coding Standards

### JavaScript/Node.js Standards

#### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error'
  }
};
```

#### Code Style Guidelines

**1. Variable Naming**
```javascript
// Use camelCase for variables and functions
const userEmail = 'user@example.com';
const calculateTotalPrice = (items) => { };

// Use PascalCase for classes and constructors
class UserService {
  constructor() { }
}

// Use SCREAMING_SNAKE_CASE for constants
const API_BASE_URL = 'https://api.example.com';
const MAX_LOGIN_ATTEMPTS = 5;
```

**2. Function Structure**
```javascript
// Prefer arrow functions for short functions
const formatPrice = (price) => `$${price.toFixed(2)}`;

// Use regular functions for complex logic
function validateUserInput(userData) {
  if (!userData.email) {
    throw new Error('Email is required');
  }
  
  if (!userData.password || userData.password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  return true;
}

// Use async/await instead of promises
const fetchUserData = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};
```

**3. Error Handling**
```javascript
// Use try-catch for async operations
const createUser = async (userData) => {
  try {
    const user = new User(userData);
    await user.save();
    return user;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Email already exists');
    }
    throw error;
  }
};

// Use proper error responses
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};
```

### React/Frontend Standards

#### Component Structure
```javascript
// Functional components with hooks
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const CourseCard = ({ course, onEnroll }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

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
    <Box sx={{ p: 2, border: 1, borderRadius: 1 }}>
      <Typography variant="h6">{course.title}</Typography>
      <Typography variant="body2">{course.description}</Typography>
      <Button 
        onClick={handleEnroll} 
        disabled={loading}
        variant="contained"
      >
        {loading ? 'Enrolling...' : 'Enroll Now'}
      </Button>
    </Box>
  );
};

export default CourseCard;
```



### Database Standards

#### Model Definition
```javascript
// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'instructor'],
    default: 'student'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Pre-save middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

module.exports = mongoose.model('User', userSchema);
```

---

## 🧪 Testing Guidelines

### Testing Strategy

#### Test Pyramid
```
    /\
   /E2E\        <- End-to-End Tests (few)
  /______\      
 /        \
/Integration\ <- Integration Tests (some)
\____________/
/            \
/  Unit Tests \ <- Unit Tests (many)
\______________/
```

#### Backend Testing

**Unit Tests Example**
```javascript
// tests/models/User.test.js
const mongoose = require('mongoose');
const User = require('../../server/models/User');

describe('User Model', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('User Validation', () => {
    it('should create a valid user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
    });

    it('should fail validation with invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      const user = new User(userData);
      let error;

      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });
  });

  describe('User Methods', () => {
    it('should compare password correctly', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      const isMatch = await user.comparePassword('password123');
      const isNotMatch = await user.comparePassword('wrongpassword');

      expect(isMatch).toBe(true);
      expect(isNotMatch).toBe(false);
    });
  });
});
```

**Integration Tests Example**
```javascript
// tests/routes/auth.test.js
const request = require('supertest');
const app = require('../../server');
const User = require('../../server/models/User');

describe('Auth Routes', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
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
      expect(response.body.data.token).toBeDefined();
    });

    it('should not register user with existing email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      // Create user first
      await User.create(userData);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('email');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };
      await User.create(userData);
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should not login with invalid credentials', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
```

#### Frontend Testing

**Component Tests Example**
```javascript
// client/src/components/CourseCard.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import CourseCard from './CourseCard';
import theme from '../styles/theme';

const mockCourse = {
  id: '1',
  title: 'JavaScript Fundamentals',
  description: 'Learn JavaScript basics',
  price: 99.99,
  instructor: 'John Doe'
};

const renderCourseCard = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <CourseCard course={mockCourse} onEnroll={jest.fn()} {...props} />
    </ThemeProvider>
  );
};

describe('CourseCard', () => {
  it('should render course information', () => {
    renderCourseCard();

    expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Learn JavaScript basics')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should call onEnroll when enroll button is clicked', async () => {
    const onEnrollMock = jest.fn();
    renderCourseCard({ onEnroll: onEnrollMock });

    const enrollButton = screen.getByText('Enroll Now');
    fireEvent.click(enrollButton);

    await waitFor(() => {
      expect(onEnrollMock).toHaveBeenCalledWith('1');
    });
  });

  it('should show loading state during enrollment', async () => {
    const onEnrollMock = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    renderCourseCard({ onEnroll: onEnrollMock });

    const enrollButton = screen.getByText('Enroll Now');
    fireEvent.click(enrollButton);

    expect(screen.getByText('Enrolling...')).toBeInTheDocument();
    expect(enrollButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Enroll Now')).toBeInTheDocument();
    });
  });
});
```

### Test Commands

```bash
# Run all tests
bun run test:all

# Run backend tests only
bun run test:backend

# Run frontend tests only
bun run test:frontend

# Run tests with coverage
bun run test:coverage

# Run specific test file
bun test -- tests/routes/auth.test.js

# Run tests matching pattern
bun test -- --grep "User validation"
```

---

## 🔍 Debugging

### Backend Debugging

#### Node.js Debugging
```bash
# Start with Node.js debugger
node --inspect server.js

# Start with nodemon and debugger
nodemon --inspect server.js

# Debug specific port
node --inspect=0.0.0.0:9229 server.js
```

#### VS Code Debug Configuration
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server.js",
      "env": {
        "NODE_ENV": "development"
      },
      "envFile": "${workspaceFolder}/.env",
      "console": "integratedTerminal",
      "restart": true,
      "runtimeExecutable": "nodemon"
    },
    {
      "name": "Attach to Process",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true
    }
  ]
}
```

#### Debugging Techniques
```javascript
// Console logging with context
console.log('User login attempt:', {
  email: req.body.email,
  timestamp: new Date().toISOString(),
  ip: req.ip,
  userAgent: req.get('User-Agent')
});

// Debug specific conditions
if (process.env.NODE_ENV === 'development') {
  console.debug('Database query:', { query, params });
}

// Error context logging
const logError = (error, context = {}) => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};
```

### Frontend Debugging

#### React Developer Tools
- Install React Developer Tools browser extension
- Use Component tab to inspect component state and props
- Use Profiler tab to identify performance issues

#### Debugging React Components
```javascript
// Debug component renders
import { useEffect } from 'react';

const CourseCard = ({ course }) => {
  // Debug effect
  useEffect(() => {
    console.log('CourseCard rendered:', { course });
  }, [course]);

  return <div>{course.title}</div>;
};
```

#### Browser Debugging
```javascript
// Add debugger statements
const handleSubmit = (formData) => {
  debugger; // Execution will pause here
  
  if (!formData.email) {
    console.warn('Email is missing');
    return;
  }
  
  submitForm(formData);
};

// Network debugging
axios.interceptors.request.use(request => {
  console.log('Starting Request:', request);
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('Response:', response);
    return response;
  },
  error => {
    console.error('Response Error:', error);
    return Promise.reject(error);
  }
);
```

---

## 📦 Package Management

### Dependency Management

#### Adding New Dependencies
```bash
# Backend dependencies
bun install package-name
bun install --save-dev package-name  # Development only

# Frontend dependencies
cd client
bun install package-name
bun install --save-dev package-name  # Development only
```

#### Version Management
```bash
# Check for outdated packages
bun outdated

# Update packages
bun update

# Update specific package
bun install package-name@latest

# Check for security vulnerabilities
bun audit

# Fix vulnerabilities automatically
# Note: Bun audit fix not yet available, use npm for this
npm audit fix
```

#### Lock File Management
```bash
# Clean install (uses bun.lock)
bun install --frozen-lockfile

# Update lock file
rm bun.lock node_modules
bun install

# Verify lock file integrity
bun audit
```

### Recommended Packages

#### Backend Utilities
```json
{
  "express-async-errors": "^3.1.1",
  "express-mongo-sanitize": "^2.2.0",
  "express-slow-down": "^1.4.0",
  "hpp": "^0.2.3",
  "xss-clean": "^0.1.1"
}
```

#### Frontend Utilities
```json
{
  "react-hook-form": "^7.45.0",
  "react-query": "^3.39.0",
  "date-fns": "^2.30.0",
  "lodash": "^4.17.21",
  "uuid": "^9.0.0"
}
```

---

## 🎯 Best Practices

### Code Quality

#### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{js,jsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{md,json}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

#### Code Review Checklist

**Backend Review Points:**
- [ ] Input validation implemented
- [ ] Error handling covers edge cases
- [ ] Security vulnerabilities addressed
- [ ] Database queries optimized
- [ ] Tests cover main scenarios
- [ ] API responses consistent
- [ ] Logging appropriate for debugging

**Frontend Review Points:**
- [ ] Components are reusable and focused
- [ ] Props are properly typed/validated
- [ ] State management is efficient
- [ ] Error boundaries handle failures
- [ ] Accessibility guidelines followed
- [ ] Performance optimized (memoization, lazy loading)
- [ ] Mobile responsive design

### Performance Guidelines

#### Backend Performance
```javascript
// Use database indexes
userSchema.index({ email: 1, role: 1 });

// Implement pagination
const getPaginatedResults = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return await Model.find()
    .limit(limit * 1)
    .skip(skip)
    .exec();
};

// Use lean queries for read-only operations
const users = await User.find().lean();

// Implement caching for expensive operations
const getCachedData = async (key) => {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await expensiveOperation();
  await redis.setex(key, 300, JSON.stringify(data));
  return data;
};
```

#### Frontend Performance
```javascript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{processData(data)}</div>;
});

// Implement lazy loading
const LazyComponent = lazy(() => import('./LazyComponent'));

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return data.map(item => expensiveCalculation(item));
}, [data]);

// Optimize re-renders with useCallback
const handleClick = useCallback((id) => {
  setSelectedId(id);
}, []);
```

### Security Best Practices

#### Input Validation
```javascript
// Server-side validation
const { body, validationResult } = require('express-validator');

const validateUserInput = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('name').trim().escape().isLength({ min: 1, max: 100 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

#### Data Sanitization
```javascript
// Remove dangerous characters
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks

// Manual sanitization
const sanitizeInput = (input) => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};
```

### Documentation Standards

#### Code Documentation
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

#### API Documentation
```javascript
/**
 * @api {post} /api/enrollments Create Enrollment
 * @apiName CreateEnrollment
 * @apiGroup Enrollments
 * @apiVersion 1.0.0
 * 
 * @apiParam {String} courseId Course ID
 * @apiParam {String} paymentIntentId Stripe payment intent ID
 * 
 * @apiSuccess {Boolean} success Response status
 * @apiSuccess {Object} data Enrollment data
 * @apiSuccess {String} data.id Enrollment ID
 * @apiSuccess {String} data.status Enrollment status
 * 
 * @apiError {Boolean} success false
 * @apiError {Object} error Error details
 * @apiError {String} error.message Error message
 */
```

---

## 📚 Additional Resources

### Learning Resources
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Patterns](https://reactpatterns.com/)
- [MongoDB Performance Best Practices](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

### Tools & Extensions
- [Postman](https://www.postman.com/) - API testing
- [MongoDB Compass](https://www.mongodb.com/products/compass) - Database GUI
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/) - Browser extension
- [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/) - State debugging

### Community & Support
- [Stack Overflow](https://stackoverflow.com/) - Q&A community
- [GitHub Discussions](https://github.com/features/discussions) - Project discussions
- [Discord Server](https://discord.gg/your-server) - Real-time chat
- [Project Issues](https://github.com/your-repo/issues) - Bug reports and feature requests

---

**Happy Coding! 🚀** 