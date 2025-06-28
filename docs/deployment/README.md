# Students Enrollment System - CI/CD Pipeline Documentation

## Overview

This document provides comprehensive guidelines for setting up and using the CI/CD pipeline for the Students Enrollment System. The pipeline is built using GitHub Actions and supports automated testing, building, and deployment to staging and production environments.

## Table of Contents

1. [Pipeline Architecture](#pipeline-architecture)
2. [Setup Instructions](#setup-instructions)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Process](#deployment-process)
5. [Monitoring and Maintenance](#monitoring-and-maintenance)
6. [Troubleshooting](#troubleshooting)

## Pipeline Architecture

### CI/CD Workflow

```mermaid
graph TD
    A[Code Push] --> B[Lint & Format Check]
    B --> C[Security Scan]
    B --> D[Backend Tests]
    B --> E[Frontend Tests]
    C --> F[Build Application]
    D --> F
    E --> F
    F --> G[Docker Build]
    G --> H{Branch?}
    H -->|develop| I[Deploy to Staging]
    H -->|main| J[Deploy to Production]
    I --> K[Staging Health Check]
    J --> L[Production Health Check]
    L --> M[Notify Success/Failure]
```

### Environments

- **Development**: Local development environment
- **Staging**: Testing environment (auto-deployed from `develop` branch)
- **Production**: Live environment (auto-deployed from `main` branch)

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
- **Staging**: When code is pushed to `develop` branch
- **Production**: When code is pushed to `main` branch

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
npm audit
```

## Troubleshooting

### Common Issues

#### 1. Pipeline Failures

**Linting Errors**
```bash
# Fix automatically
npm run lint:fix

# Check manually
npm run lint
```

**Test Failures**
```bash
# Run tests locally
npm run test:backend

# Debug specific test
npm run test:watch -- --testNamePattern="payment"
```

**Build Failures**
```bash
# Check Docker build
docker build -t test-build .

# Check frontend build
cd client && npm run build
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
   # Create PR to develop branch
   ```

2. **Code Quality**
   - Use conventional commit messages
   - Write tests for new features
   - Update documentation
   - Follow ESLint rules

3. **Testing**
   ```bash
   # Before committing
   npm run lint
   npm run test:backend
   npm run format:check
   
   # Integration testing
   docker-compose up -d
   npm run test:integration
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
   npm version 1.2.0
   
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