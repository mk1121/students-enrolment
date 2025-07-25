# Students Enrollment System - CI/CD Pipeline Documentation

## Overview

This document provides comprehensive guidelines for setting up and using the CI/CD pipeline for the Students Enrollment System. The pipeline is built using GitHub Actions and supports automated testing, building, and deployment to staging and production environments.

## Table of Contents

1. [Pipeline Architecture](#pipeline-architecture)
2. [Workflow Optimization](#workflow-optimization)
3. [Setup Instructions](#setup-instructions)
4. [Environment Configuration](#environment-configuration)
5. [Deployment Process](#deployment-process)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)

## Pipeline Architecture

### CI/CD Workflow

```mermaid
graph TD
    A[Feature Branch] --> B[Create PR to develop]
    B --> C[CI Tests Run]
    C --> D[PR Approved & Merged]
    D --> E[Auto-deploy to Staging]
    E --> F[Create PR to main]
    F --> G[Quick Validation]
    G --> H[PR Approved & Merged]
    H --> I[Auto-deploy to Production]
    I --> J[Production Health Check]
    J --> K[Monitoring & Alerts]
```

### Workflow Optimization

This pipeline is optimized to eliminate duplicate CI runs:

- **Feature Branch Push**: No tests (saves resources)
- **PR to develop**: Full CI tests run (lint, format, backend tests, frontend tests)
- **Push to develop**: CI tests + staging deployment
- **PR to main**: Quick validation only (no full CI re-run)
- **Push to main**: CI tests + production deployment

**Benefits**: 
- Reduced CI runs by ~75%
- Faster feedback loop
- Lower resource usage
- Tests run only when necessary

### Environments

- **Development**: Local development environment
- **Staging**: Testing environment (auto-deployed from `develop` branch)
- **Production**: Live environment (auto-deployed from `main` branch)

## Workflow Optimization

### Problem Solved
The GitHub Actions workflows have been optimized to eliminate duplicate CI runs that previously occurred at multiple stages:

- ❌ **Before**: Feature push → CI runs → PR to develop → CI runs again → Develop to main PR → CI runs again → Main merge → CI runs again
- ✅ **After**: Feature push → Nothing → PR to develop → CI runs → Develop to main PR → Quick validation → Main merge → CI + Deploy

### Current Workflow Structure

#### 1. CI/CD Pipeline (ci.yml)
- **Triggers**: Only on `pull_request` to `develop`
- **Purpose**: Run comprehensive tests for feature branches
- **Jobs**: Lint, Backend Tests, Frontend Tests, Security Audit, Coverage

#### 2. Deploy Staging (deploy-staging.yml)
- **Triggers**: Only on `push` to `develop`
- **Purpose**: Run CI tests + deploy to staging environment
- **Jobs**: CI Tests → Staging Deployment

#### 3. Deploy Production (deploy-production.yml)
- **Triggers**: Only on `push` to `main`
- **Purpose**: Run CI tests + deploy to production environment
- **Jobs**: CI Tests → Production Deployment

#### 4. Enforce PR Rules (enforce-pr-rules.yml)
- **Triggers**: Only on `pull_request` to `main`
- **Purpose**: Enforce repository workflow rules with quick validation
- **Jobs**: Branch validation, PR title format, deployment readiness, quick lint check

### Benefits Achieved

1. **Reduced Redundancy**: Eliminated 4 duplicate CI runs
2. **Faster Feedback**: Tests run only when necessary
3. **Resource Optimization**: Reduced GitHub Actions usage by ~75%
4. **Cleaner Workflow**: Each workflow has a specific purpose
5. **Better Developer Experience**: Less noise in PR status checks
6. **Trusts develop branch**: Avoids re-testing already validated code

### When Tests Run

- **Feature Branch Push**: No tests (saves resources)
- **PR to develop**: Full CI tests (ci.yml) - **ONLY TIME FULL TESTS RUN**
- **Push to develop**: CI + Staging deployment (deploy-staging.yml)
- **PR to main**: Quick validation only (enforce-pr-rules.yml) - **NO FULL CI**
- **Push to main**: CI + Production deployment (deploy-production.yml)

## Setup Instructions

### 1. Initial Setup

Run the setup script to configure your development environment:

```bash
chmod +x scripts/setup-ci.sh
./scripts/setup-ci.sh
```

This script will:
- Install required dependencies
- Set up environment files
- Configure Git hooks
- Initialize database
- Set up monitoring

### 2. GitHub Repository Setup

#### Required Secrets

Add the following secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

##### Docker Registry
```
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password
DOCKER_REGISTRY=your-registry.com (optional, defaults to Docker Hub)
```

##### Staging Environment
```
STAGING_HOST=staging-server-ip
STAGING_USER=ubuntu
STAGING_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
STAGING_PORT=22
STAGING_URL=https://staging.yourdomain.com
```

##### Production Environment
```
PRODUCTION_HOST=production-server-ip
PRODUCTION_USER=ubuntu
PRODUCTION_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
PRODUCTION_PORT=22
PRODUCTION_URL=https://yourdomain.com
```

##### Optional Services
```
SNYK_TOKEN=your-snyk-token-for-security-scanning
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### 3. Server Setup

#### Staging Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /var/www/students-enrollment-staging
sudo chown $USER:$USER /var/www/students-enrollment-staging

# Clone repository
cd /var/www/students-enrollment-staging
git clone https://github.com/your-username/students-enrollment.git .
git checkout develop
```

#### Production Server Setup

```bash
# Same as staging, but use production directory and main branch
sudo mkdir -p /var/www/students-enrollment-production
sudo chown $USER:$USER /var/www/students-enrollment-production
cd /var/www/students-enrollment-production
git clone https://github.com/your-username/students-enrollment.git .
git checkout main
```

### 4. SSL Certificate Setup (Production)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Set up auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Environment Configuration

### Environment Files

Create the following environment files:

#### `.env.staging`
```env
NODE_ENV=staging
PORT=5000
MONGODB_URI=mongodb://admin:password@mongodb:27017/students_enrollment_staging?authSource=admin
REDIS_URL=redis://:password@redis:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-staging
JWT_REFRESH_SECRET=your-refresh-secret-staging
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
SSLCOMMERZ_STORE_ID=your_test_store_id
SSLCOMMERZ_STORE_PASSWORD=your_test_store_password
SSLCOMMERZ_IS_LIVE=false

# Email Configuration
EMAIL_FROM=noreply@staging.yourdomain.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password

# URLs
CLIENT_URL=https://staging.yourdomain.com
SERVER_URL=https://staging.yourdomain.com/api

# Database
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-mongo-password
MONGO_DB_NAME=students_enrollment_staging
REDIS_PASSWORD=your-redis-password
```

#### `.env.production`
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://admin:password@mongodb:27017/students_enrollment?authSource=admin
REDIS_URL=redis://:password@redis:6379

# JWT Configuration (Use strong, unique keys)
JWT_SECRET=your-super-secret-jwt-key-production-different-from-staging
JWT_REFRESH_SECRET=your-refresh-secret-production
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d

# Payment Gateways (Use live keys)
STRIPE_SECRET_KEY=sk_live_your_stripe_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
SSLCOMMERZ_STORE_ID=your_live_store_id
SSLCOMMERZ_STORE_PASSWORD=your_live_store_password
SSLCOMMERZ_IS_LIVE=true

# Email Configuration
EMAIL_FROM=noreply@yourdomain.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password

# URLs
CLIENT_URL=https://yourdomain.com
SERVER_URL=https://yourdomain.com/api

# Database
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-strong-mongo-password
MONGO_DB_NAME=students_enrollment
REDIS_PASSWORD=your-strong-redis-password

# Docker Configuration
DOCKER_REGISTRY=your-registry.com
DOCKER_IMAGE=students-enrollment
IMAGE_TAG=latest
```

## Deployment Process

### Automated Deployment

The CI/CD pipeline automatically deploys:
- **Staging**: When code is pushed to `develop` branch (after PR merge)
- **Production**: When code is pushed to `main` branch (after PR merge)

**Important**: Direct pushes to `develop` and `main` should be disabled via branch protection rules. All changes should go through pull requests to ensure code quality and proper testing.

### Manual Deployment

#### Deploy to Staging
```bash
./scripts/deploy.sh staging latest
```

#### Deploy to Production
```bash
./scripts/deploy.sh production v1.2.0
```

### Deployment Steps

1. **Pre-deployment Checks**
   - Code quality validation
   - Security scanning
   - Test execution
   - Build verification

2. **Database Backup** (Production only)
   - Automatic MongoDB backup
   - Stored in `/var/www/backups/`

3. **Zero-downtime Deployment**
   - New container deployment
   - Health check validation
   - Traffic switching
   - Old container cleanup

4. **Post-deployment**
   - Health checks
   - Smoke tests
   - Monitoring alerts
   - Notification delivery

### Branch Strategy

```
main (production)
├── develop (staging)
    ├── feature/user-authentication
    ├── feature/payment-integration
    └── hotfix/security-patch
```

- **main**: Production-ready code
- **develop**: Integration branch for staging
- **feature/***: New features
- **hotfix/***: Critical fixes
- **release/***: Release preparation

## Monitoring and Maintenance

### Health Checks

The application includes built-in health check endpoints:

- **Application Health**: `/api/health`
- **Database Health**: `/api/auth/health`
- **Payment Systems**: `/api/payments/health`

### Monitoring Stack

#### Production Monitoring
```bash
# Start monitoring stack
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Access monitoring
# Prometheus: http://your-domain.com:9090
# Grafana: http://your-domain.com:3001 (admin/admin123)
```

#### Log Aggregation
```bash
# Start logging stack
docker-compose -f docker-compose.prod.yml --profile logging up -d
```

### Backup Strategy

#### Automated Backups
```bash
# Setup daily backups
sudo crontab -e

# Add backup job
0 2 * * * /var/www/students-enrollment-production/scripts/backup.sh
```

#### Manual Backup
```bash
# Database backup
docker exec mongodb mongodump --out /backup/manual_$(date +%Y%m%d_%H%M%S)

# File backup
tar -czf /backup/files_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/uploads
```

### Security Maintenance

#### SSL Certificate Renewal
```bash
# Check certificate expiry
sudo certbot certificates

# Manual renewal
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

#### Security Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d

# Security scan
bun audit
```

## Troubleshooting

### Common Issues

#### 1. Pipeline Failures

**Linting Errors**
```bash
# Fix automatically
bun run lint:fix

# Check manually
bun run lint
```

**Test Failures**
```bash
# Run tests locally
bun run test:backend

# Debug specific test
bun run test:watch -- --testNamePattern="payment"
```

**Build Failures**
```bash
# Check Docker build
docker build -t test-build .

# Check frontend build
cd client && bun run build
```

#### 2. Deployment Issues

**SSH Connection Failed**
- Verify SSH key is correct
- Check server accessibility
- Confirm user permissions

**Docker Issues**
```bash
# Check Docker status
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# Clean up Docker
docker system prune -f
```

**Database Connection**
```bash
# Check MongoDB status
docker-compose ps mongodb

# Check logs
docker-compose logs mongodb

# Test connection
docker exec -it mongodb mongosh
```

#### 3. Production Issues

**Application Not Responding**
```bash
# Check application logs
docker-compose logs app

# Check Nginx logs
docker-compose logs nginx

# Restart services
docker-compose restart app
```

**High Memory Usage**
```bash
# Monitor resources
docker stats

# Check application metrics
curl -f http://localhost:5000/api/health
```

### Emergency Procedures

#### Rollback Deployment
```bash
# Automatic rollback (if health checks fail)
# Manual rollback
cd /var/www/students-enrollment-production
./scripts/deploy.sh production previous

# Or use Docker tags
docker tag students-enrollment:backup students-enrollment:latest
docker-compose up -d app
```

#### Database Recovery
```bash
# Restore from backup
docker run --rm -v backup_volume:/backup mongo:6.0 \
  mongorestore --host mongodb:27017 \
  --username admin --password password \
  --authenticationDatabase admin \
  /backup/mongodb_backup_YYYYMMDD_HHMMSS
```

### Performance Optimization

#### Monitoring Performance
```bash
# Application metrics
curl http://localhost:5000/api/metrics

# Database performance
docker exec mongodb mongostat

# System resources
htop
```

#### Scaling Options
```bash
# Horizontal scaling (multiple app instances)
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Database optimization
# Add to MongoDB configuration
docker exec mongodb mongo --eval "db.runCommand({setParameter: 1, wiredTigerCacheSizeGB: 2})"
```

## Best Practices

### Development Workflow

1. **Feature Development**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/new-feature
   # ... develop feature
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   # Create PR to develop branch - CI tests will run here
   ```

2. **Code Quality**
   - Use conventional commit messages
   - Write tests for new features
   - Update documentation
   - Follow ESLint rules

3. **Testing Strategy**
   ```bash
   # Local development testing
   bun run lint
   bun run test:backend
   bun run test:frontend
   bun run format:check
   
   # Integration testing
   docker-compose up -d
   bun run test:integration
   ```

4. **Branch Protection Setup**
   Enable branch protection for optimal workflow:
   
   **Protect develop branch:**
   - Require pull request reviews
   - Require status checks to pass
   - Require branches to be up to date before merging
   - Restrict pushes that create matching branches
   
   **Protect main branch:**
   - Require pull request reviews
   - Require status checks to pass
   - Restrict pushes that create matching branches
   - Only allow PRs from develop branch

5. **Workflow Process**
   ```
   Feature Branch → PR to develop → CI tests → Merge to develop → Auto-deploy to staging
                                                      ↓
   Develop → PR to main → Quick validation → Merge to main → Auto-deploy to production
   ```

### Production Deployment

1. **Pre-deployment Checklist**
   - [ ] All tests passing
   - [ ] Security scan clean
   - [ ] Database migrations ready
   - [ ] Environment variables updated
   - [ ] SSL certificates valid
   - [ ] Monitoring configured

2. **Release Process**
   ```bash
   # Create release branch
   git checkout -b release/v1.2.0 develop
   
   # Update version
   bun version 1.2.0
   
   # Merge to main
   git checkout main
   git merge release/v1.2.0
   git tag v1.2.0
   git push origin main --tags
   
   # Merge back to develop
   git checkout develop
   git merge main
   git push origin develop
   ```

3. **Post-deployment**
   - Monitor application metrics
   - Check error logs
   - Verify critical user flows
   - Update documentation

## Support and Contact

For issues related to the CI/CD pipeline:

1. Check this documentation
2. Review GitHub Actions logs
3. Check application logs
4. Contact the development team

---

**Last Updated**: [Current Date]
**Version**: 1.0.0 