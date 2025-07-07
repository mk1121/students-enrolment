# 🎓 Students Online Enrollment System

[![CI/CD Pipeline](https://github.com/your-username/students-enrolment/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/students-enrolment/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/your-username/students-enrolment/branch/main/graph/badge.svg)](https://codecov.io/gh/your-username/students-enrolment)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

A comprehensive, production-ready web application for student enrollment management with integrated payment gateways, built using the MERN stack (MongoDB, Express.js, React.js, Node.js).

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📚 Documentation](#-documentation)
- [🔧 Development](#-development)
- [🧪 Testing](#-testing)
- [🚢 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🎯 Overview

The Students Online Enrollment System is a modern, scalable web application designed to streamline the student enrollment process for educational institutions. It provides a complete solution for course management, student registration, secure payment processing, and administrative oversight.

### 🌟 Key Highlights

- **Production-Ready**: Fully configured CI/CD pipeline with automated testing and deployment
- **Secure**: JWT authentication, helmet security, rate limiting, and comprehensive input validation
- **Scalable**: Microservices-ready architecture with Docker containerization
- **User-Friendly**: Responsive design with Material-UI components
- **Payment Integration**: Multiple payment gateways (Stripe, SSLCommerz)
- **Email System**: Automated notifications with Gmail OAuth 2.0

## ✨ Features

### 👨‍🎓 For Students
- **User Management**: Registration, authentication, and profile management
- **Course Discovery**: Browse and search available courses with detailed information
- **Enrollment Process**: Simple, secure course enrollment with payment integration
- **Dashboard**: Personal dashboard with enrollment history and progress tracking
- **Course Materials**: Access to enrolled course materials and resources
- **Payment History**: Complete transaction history and receipt management

### 👨‍💼 For Administrators
- **Course Management**: Complete CRUD operations for courses and materials
- **Student Management**: User management and enrollment oversight
- **Payment Tracking**: Comprehensive payment and transaction management
- **Analytics Dashboard**: Detailed insights and reporting
- **Email Notifications**: Automated email system for various events
- **System Monitoring**: Health checks and performance metrics

### 🔐 Security & Performance
- **Authentication**: JWT-based authentication with refresh tokens
- **Authorization**: Role-based access control (Student, Admin)
- **Security Headers**: Helmet.js for security headers
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive validation using express-validator
- **Data Encryption**: Password hashing with bcryptjs

## 🛠️ Tech Stack

### Frontend
- **React.js 18.2.0** - Modern UI library
- **Material-UI (MUI) 5.14** - Component library
- **React Router 6.17** - Client-side routing
- **Axios** - HTTP client
- **React Testing Library** - Testing framework

### Backend
- **Node.js 18.x** - Runtime environment
- **Express.js 4.18** - Web framework
- **MongoDB 6.0** - NoSQL database
- **Mongoose 7.5** - ODM for MongoDB
- **JWT** - Authentication
- **Stripe & SSLCommerz** - Payment gateways

### DevOps & Deployment
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **Render** - Backend hosting
- **GitHub Pages** - Frontend hosting
- **MongoDB Atlas** - Database hosting

### Development Tools
- **Jest** - Testing framework
- **ESLint & Prettier** - Code quality
- **Nodemon** - Development server
- **Concurrently** - Run multiple commands

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v18.0.0 or higher)
- **Bun** (v1.0.0 or higher) - [Install Bun](https://bun.sh/)
- **MongoDB** (v6.0 or higher) or MongoDB Atlas account
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/students-enrolment.git
   cd students-enrolment
   ```

2. **Install dependencies**
   ```bash
# Install backend dependencies
bun install
   
   # Install frontend dependencies
   cd client && bun install && cd ..
   ```

3. **Environment setup**
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit .env file with your configuration
   nano .env
   ```

4. **Database setup**
   ```bash
   # Run migrations
   bun run migrate
   
   # Seed initial data (optional)
   node seed-simple.js
   ```

5. **Create admin user**
   ```bash
   # Interactive admin creation
   node create-admin-interactive.js
   ```

6. **Start the application**
   ```bash
   # Development mode (both frontend and backend)
   bun run dev
   
   # Or run separately
   bun run server  # Backend only (http://localhost:5001)
bun run client  # Frontend only (http://localhost:3000)
   ```

7. **Verify installation**
   - Backend health check: http://localhost:5001/api/health
   - Frontend application: http://localhost:3000

## 📚 Documentation

### 📖 Core Documentation
- [**API Documentation**](docs/API.md) - Complete API reference
- [**Database Schema**](docs/DATABASE.md) - Database design and models
- [**Architecture Guide**](docs/ARCHITECTURE.md) - System architecture overview

### 🔧 Development Documentation
- [**Development Guide**](docs/DEVELOPMENT.md) - Local development setup
- [**Testing Guide**](docs/TESTING.md) - Testing strategies and guidelines
- [**Contributing Guide**](CONTRIBUTING.md) - How to contribute to the project

### 🚢 Deployment & Operations
- [**Deployment Guide**](docs/deployment/README.md) - Production deployment instructions
- [**GitHub Secrets Guide**](docs/GITHUB_SECRETS_GUIDE.md) - Required environment variables

### 🔧 Setup & Configuration
- [**Gmail OAuth Setup**](docs/GMAIL_OAUTH_SETUP.md) - Email configuration
- [**Payment Testing**](docs/PAYMENT_TESTING.md) - Payment gateway testing
- [**Migration Guide**](docs/MIGRATIONS.md) - Database migrations

## 🔧 Development

### Available Scripts

```bash
# Development
bun run dev          # Start both frontend and backend
bun run server       # Start backend only
bun run client       # Start frontend only

# Testing
bun run test:backend     # Run backend tests
bun run test:frontend    # Run frontend tests
bun run test:all         # Run all tests
bun run test:coverage    # Generate coverage report

# Code Quality
bun run lint             # Run ESLint
bun run lint:fix         # Fix ESLint issues
bun run format           # Format code with Prettier
bun run format:check     # Check code formatting

# Database
bun run migrate          # Run database migrations
bun run migrate:status   # Check migration status
bun run migrate:rollback # Rollback last migration

# Build & Deployment
bun run build           # Build frontend for production
bun run start           # Start production server
```

### Project Structure

```
students-enrolment/
├── 📁 client/                    # React frontend
│   ├── 📁 public/               # Static assets
│   │   ├── 📁 components/       # Reusable components
│   │   ├── 📁 pages/           # Page components
│   │   ├── 📁 context/         # React context
│   │   └── 📄 App.js           # Main app component
│   └── 📄 package.json
├── 📁 server/                   # Node.js backend
│   ├── 📁 middleware/          # Custom middleware
│   ├── 📁 models/              # Mongoose models
│   ├── 📁 routes/              # API routes
│   └── 📁 utils/               # Utility functions
├── 📁 tests/                   # Test suites
├── 📁 docs/                    # Documentation
├── 📁 migrations/              # Database migrations
├── 📁 .github/workflows/       # CI/CD workflows
├── 📄 server.js                # Express server
├── 📄 docker-compose.yml       # Docker configuration
└── 📄 package.json            # Backend dependencies
```

## 🧪 Testing

### Test Coverage

- **Backend**: 120 tests (110 passed, 10 skipped)
- **Test Suites**: 7 comprehensive test suites
- **Coverage**: High coverage across all modules

### Running Tests

```bash
# Quick testing
./quick-ci-test.sh all

# Local CI simulation with act
./test-ci-local.sh

# Manual testing
bun run test:backend
bun run test:frontend
bun run test:coverage
```

### Test Structure
- **Unit Tests**: Individual function and component testing
- **Integration Tests**: API endpoint testing
- **Security Tests**: Authentication and authorization testing
- **Performance Tests**: Load and stress testing

## 🚢 Deployment

### Deployment Options

1. **Docker Deployment**
   ```bash
   docker-compose up -d
   ```

2. **Cloud Deployment**
   - Backend: Render, Heroku, Railway
   - Frontend: GitHub Pages, Netlify, Vercel
   - Database: MongoDB Atlas

3. **CI/CD Pipeline**
   - Automatic deployment on branch push
   - Branch-based environments (develop → staging, main → production)

### Environment Variables

Required environment variables for production:

```env
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
EMAIL_USER=your_gmail_address
GMAIL_CLIENT_ID=your_gmail_client_id
# ... see .env.example for complete list
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### 🌿 Branch Strategy

This project follows a **Git Flow** strategy with branch protection rules:

#### 📋 Branch Structure
- **`main`** - Production-ready code, protected branch
- **`develop`** - Integration branch for features, staging environment
- **`feature/*`** - Feature development branches
- **`fix/*`** - Bug fix branches
- **`hotfix/*`** - Emergency fixes for production

#### 🔒 Branch Protection Rules
- **Direct pushes to `main` are prohibited**
- **Only `develop` branch can create PRs to `main`**
- **All PRs require at least 1 approving review**
- **Status checks must pass before merging**
- **Branch must be up-to-date before merging**

#### 🚀 Workflow Process
1. **Feature Development**: Create feature branches from `develop`
2. **Integration**: Merge feature branches into `develop`
3. **Testing**: `develop` branch triggers staging deployment
4. **Production**: Create PR from `develop` to `main` for production deployment
5. **Hotfixes**: Create hotfix branches from `main`, merge to both `main` and `develop`

### Development Workflow

1. Fork the repository
2. Create a feature branch from `develop` (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`bun run test:all`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request to `develop` branch
8. After review and merge to `develop`, create PR from `develop` to `main`

### Code Quality Standards

- Follow ESLint and Prettier configurations
- Write comprehensive tests for new features
- Maintain test coverage above 80%
- Follow conventional commit messages
- Use semantic versioning for releases

## 📞 Support & Help

- **Documentation**: Check the [docs](docs/) folder
- **Issues**: [GitHub Issues](https://github.com/your-username/students-enrolment/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/students-enrolment/discussions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <strong>Built with ❤️ by the Students Enrollment System Team</strong>
</div> 