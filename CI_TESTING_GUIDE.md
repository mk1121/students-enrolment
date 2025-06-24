# GitHub Actions CI Local Testing Guide

## Quick Start

### 1. Run the Setup Script
```bash
chmod +x setup-ci-local.sh
./setup-ci-local.sh
```

This script will:
- ✅ Check prerequisites (Node.js 18+, npm, Docker, Git)
- ✅ Install Act (GitHub Actions local runner)
- ✅ Install all dependencies (backend, frontend, dev tools)
- ✅ Create configuration files (Jest, Docker, environment files)
- ✅ Set up test directory structure
- ✅ Add health check endpoints
- ✅ Run initial tests to verify setup

### 2. Manual Testing Commands

```bash
# Test the complete CI pipeline
npm run ci:test

# Individual components
npm run lint              # ESLint checks
npm run format:check      # Prettier formatting
npm run test:backend      # Backend tests with Jest
npm run test:coverage     # Tests with coverage report
npm run health:check      # Application health check

# Frontend testing
cd client && npm test     # Frontend tests
```

### 3. Using Act (GitHub Actions Local Runner)

```bash
# Run the entire GitHub Actions workflow locally
act

# Run specific jobs
act -j lint               # Code quality check
act -j test-backend       # Backend tests
act -j test-frontend      # Frontend tests
act -j build              # Build application
act -j security           # Security scan

# Run with secrets
act --secret-file .secrets

# Verbose output for debugging
act -v

# Use specific platform
act -P ubuntu-latest=node:18-bullseye
```

### 4. Docker-based Testing

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run tests against Docker database
npm run test:backend

# Stop test database
docker-compose -f docker-compose.test.yml down
```

## File Structure Created

```
├── .github/workflows/ci.yml     # GitHub Actions workflow
├── jest.config.js               # Jest configuration
├── .eslintrc.js                 # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── .prettierignore              # Prettier ignore patterns
├── .dockerignore                # Docker ignore patterns
├── Dockerfile                   # Multi-stage Docker build
├── docker-compose.test.yml      # Test environment
├── setup-ci-local.sh           # Local setup script
├── .env.test                    # Test environment variables
├── .secrets                     # Act secrets file
└── tests/                       # Test directory
    ├── setup.js                 # Test setup with MongoDB Memory Server
    ├── unit/                    # Unit tests
    ├── integration/             # Integration tests
    └── helpers/                 # Test helpers
```

## Environment Configuration

### .env.test
```env
NODE_ENV=test
PORT=5001
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/students-enrollment-test
JWT_SECRET=test_jwt_secret_for_local_development_only
STRIPE_SECRET_KEY=sk_test_your_test_key_here
# ... other test configurations
```

### .secrets (for Act)
```env
JWT_SECRET=test-jwt-secret-for-ci
STRIPE_SECRET_KEY=sk_test_fake_key_for_ci
MONGODB_URI=mongodb://testuser:testpass@localhost:27017/test_db?authSource=admin
# ... other secrets matching your GitHub repository secrets
```

## CI Pipeline Jobs

Your GitHub Actions workflow includes:

1. **Lint** - Code quality and formatting checks
2. **Backend Tests** - Jest tests with MongoDB service
3. **Frontend Tests** - React tests with coverage
4. **Security Scan** - npm audit and Snyk scanning
5. **Build** - Application build and artifact upload
6. **Docker Build** - Multi-stage Docker image build
7. **Deploy Staging** - Deployment to staging environment
8. **Deploy Production** - Deployment to production environment

## Testing Workflow

### Local Development
```bash
# 1. Make code changes
# 2. Run local tests
npm run ci:test

# 3. Fix any issues
npm run lint:fix
npm run format

# 4. Test with Act (optional)
act -j lint -j test-backend

# 5. Commit and push
git add .
git commit -m "your changes"
git push
```

### Act Testing Scenarios
```bash
# Test push to develop branch
act push -e .github/events/push-develop.json

# Test pull request
act pull_request

# Test with different Node versions
act -P ubuntu-latest=node:16-bullseye
act -P ubuntu-latest=node:18-bullseye
act -P ubuntu-latest=node:20-bullseye
```

## Health Check Endpoints

The setup adds health check endpoints to your application:

- `GET /health` - Basic health check
- `GET /api/health` - API health check

Response format:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```bash
   # Start MongoDB with Docker
   docker run -d -p 27017:27017 --name mongo-test mongo:6.0
   ```

2. **Act Permission Errors**
   ```bash
   # Add user to docker group
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **Node Version Issues**
   ```bash
   # Use Node Version Manager
   nvm install 18
   nvm use 18
   ```

4. **Memory Issues**
   ```bash
   # Increase Node memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

### Debugging Tests
```bash
# Run tests with verbose output
npm run test:backend -- --verbose

# Run specific test file
npm run test:backend -- tests/unit/auth.test.js

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Act Debugging
```bash
# Dry run to see what would execute
act --dry-run

# Use different runner image
act -P ubuntu-latest=catthehacker/ubuntu:act-latest

# Skip certain jobs
act --skip-job security
```

## Advanced Usage

### Custom Test Events
Create `.github/events/test-event.json`:
```json
{
  "ref": "refs/heads/feature/test-branch",
  "repository": {
    "name": "students-enrollment",
    "owner": {
      "login": "your-username"
    }
  }
}
```

Run with custom event:
```bash
act workflow_dispatch -e .github/events/test-event.json
```

### Performance Testing
```bash
# Run tests multiple times to check for flaky tests
for i in {1..5}; do npm run test:backend; done

# Check memory usage
npm run test:backend -- --logHeapUsage

# Profile test performance
npm run test:backend -- --detectOpenHandles --forceExit
```

This guide provides everything you need to test your GitHub Actions CI pipeline locally before pushing to GitHub. The setup script automates most of the configuration, and you can use the manual commands to test individual components or the entire workflow. 