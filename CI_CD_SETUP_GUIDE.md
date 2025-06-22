# Students Enrollment System - CI/CD Pipeline Setup

## 🚀 Complete CI/CD Pipeline Implementation

This guide provides step-by-step instructions to set up a production-ready CI/CD pipeline for your Students Enrollment System using GitHub Actions, Docker, and automated deployment.

## 📋 What's Included

### 1. **GitHub Actions CI/CD Pipeline** (`.github/workflows/ci.yml`)
- **Code Quality**: ESLint, Prettier formatting checks
- **Testing**: Backend tests with Jest, coverage reporting
- **Security**: npm audit, Snyk vulnerability scanning
- **Building**: Docker image building and pushing
- **Deployment**: Automated staging and production deployment
- **Monitoring**: Health checks and notifications

### 2. **Docker Configuration**
- **Multi-stage Dockerfile**: Optimized for production
- **Docker Compose**: Development and production configurations
- **Container Security**: Non-root user, health checks
- **Resource Management**: Memory and CPU limits

### 3. **Nginx Reverse Proxy**
- **SSL/TLS Termination**: HTTPS configuration
- **Rate Limiting**: API protection
- **Static File Serving**: Optimized caching
- **Security Headers**: Comprehensive security setup

### 4. **Deployment Scripts**
- **Automated Deployment**: Zero-downtime deployments
- **Database Backups**: Automatic backup before production deployment
- **Health Checks**: Post-deployment validation
- **Rollback**: Automatic rollback on failure

### 5. **Monitoring & Logging**
- **Health Endpoints**: `/api/health` and `/api/metrics`
- **Prometheus**: Metrics collection (optional)
- **Grafana**: Visualization dashboards (optional)
- **Log Aggregation**: Centralized logging (optional)

## 🛠️ Quick Setup

### 1. Run Setup Script
```bash
chmod +x scripts/setup-ci.sh
./scripts/setup-ci.sh
```

This will automatically:
- Install dependencies (Node.js, Docker, Docker Compose)
- Set up environment files
- Configure Git hooks for code quality
- Initialize development database
- Create necessary directories

### 2. Configure GitHub Repository

#### Add Repository Secrets
Go to `Settings > Secrets and variables > Actions` in your GitHub repository:

**Required Secrets:**
```
# Docker Registry
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password

# Staging Environment
STAGING_HOST=your-staging-server-ip
STAGING_USER=ubuntu
STAGING_SSH_KEY=your-private-ssh-key
STAGING_URL=https://staging.yourdomain.com

# Production Environment  
PRODUCTION_HOST=your-production-server-ip
PRODUCTION_USER=ubuntu
PRODUCTION_SSH_KEY=your-private-ssh-key
PRODUCTION_URL=https://yourdomain.com

# Optional
SNYK_TOKEN=your-snyk-token
SLACK_WEBHOOK_URL=your-slack-webhook
```

### 3. Server Preparation

#### For Ubuntu/Debian Servers:
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directories
sudo mkdir -p /var/www/students-enrollment-staging
sudo mkdir -p /var/www/students-enrollment-production
sudo chown $USER:$USER /var/www/students-enrollment-*
```

## 🚀 Deployment Process

### Branch Strategy
- **`main`** → Production deployment
- **`develop`** → Staging deployment
- **`feature/*`** → Feature branches (create PR to develop)

### Automated Deployment
1. **Push to `develop`** → Automatically deploys to staging
2. **Push to `main`** → Automatically deploys to production

### Manual Deployment
```bash
# Deploy to staging
./scripts/deploy.sh staging latest

# Deploy to production
./scripts/deploy.sh production v1.2.0
```

## 🔧 Environment Configuration

### Create Environment Files

The setup script creates template files. Update them with your actual values:

#### `.env.staging`
```env
NODE_ENV=staging
MONGODB_URI=mongodb://admin:password@mongodb:27017/students_enrollment_staging?authSource=admin
JWT_SECRET=your-staging-jwt-secret
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
CLIENT_URL=https://staging.yourdomain.com
# ... other staging configurations
```

#### `.env.production`
```env
NODE_ENV=production
MONGODB_URI=mongodb://admin:strongpassword@mongodb:27017/students_enrollment?authSource=admin
JWT_SECRET=your-production-jwt-secret-different-from-staging
STRIPE_SECRET_KEY=sk_live_your_stripe_live_key
CLIENT_URL=https://yourdomain.com
# ... other production configurations
```

## 📊 Pipeline Stages Breakdown

### 1. **Code Quality & Linting**
```yaml
- ESLint validation
- Prettier formatting check
- Conventional commit validation
```

### 2. **Automated Testing**
```yaml
- Backend tests with MongoDB in-memory
- Frontend tests (when available)
- Coverage reporting to Codecov
```

### 3. **Security Scanning**
```yaml
- npm audit for vulnerabilities
- Snyk security analysis
- Dependency checks
```

### 4. **Building & Packaging**
```yaml
- Multi-stage Docker build
- Frontend optimization
- Image pushing to registry
```

### 5. **Deployment**
```yaml
- Database backup (production)
- Zero-downtime deployment
- Health check validation
- Rollback on failure
```

## 🎯 Key Features

### ✅ **Zero-Downtime Deployment**
- Blue-green deployment strategy
- Health checks before traffic switching
- Automatic rollback on failure

### ✅ **Comprehensive Testing**
- Unit tests with Jest
- Integration tests with real database
- Security vulnerability scanning

### ✅ **Production Security**
- SSL/TLS termination
- Rate limiting and DDoS protection
- Security headers configuration
- Non-root container execution

### ✅ **Monitoring & Observability**
- Application health endpoints
- Prometheus metrics (optional)
- Log aggregation (optional)
- Real-time notifications

### ✅ **Developer Experience**
- Git hooks for code quality
- Conventional commit enforcement
- Automated code formatting
- Local development environment

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start development servers
npm run dev:server       # Start backend only
npm run dev:client       # Start frontend only

# Testing
npm run test             # Run all tests
npm run test:backend     # Run backend tests with coverage
npm run test:watch       # Run tests in watch mode

# Code Quality
npm run lint             # Check code quality
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting

# Building
npm run build            # Build frontend for production
npm run docker:build     # Build Docker image
npm run docker:dev       # Run with Docker Compose (dev)
npm run docker:prod      # Run with Docker Compose (prod)

# Deployment
npm run deploy:staging   # Deploy to staging
npm run deploy:production # Deploy to production

# Database
npm run migrate          # Run database migrations
npm run seed             # Seed database with sample data
npm run create-admin     # Create admin user interactively
```

## 🔍 Monitoring & Health Checks

### Health Check Endpoints
- **Application**: `GET /api/health`
- **Metrics**: `GET /api/metrics`

### Sample Health Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "database": "connected",
  "memory": {
    "rss": 45056000,
    "heapTotal": 20971520,
    "heapUsed": 18515072
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### Pipeline Fails at Testing
```bash
# Run tests locally to debug
npm run test:backend
npm run lint
```

#### Deployment Connection Issues
- Verify SSH key format (OpenSSH private key)
- Check server accessibility
- Confirm user permissions

#### Docker Build Failures
```bash
# Test local build
docker build -t test-build .
# Check for dependency issues
npm audit fix
```

### Emergency Procedures

#### Rollback Production
```bash
# Automatic rollback (if health checks fail)
# Manual rollback
./scripts/deploy.sh production previous
```

#### Database Recovery
```bash
# Restore from backup
docker run --rm -v backup_volume:/backup mongo:6.0 \
  mongorestore /backup/mongodb_backup_YYYYMMDD_HHMMSS
```

## 📚 Additional Resources

### Documentation
- **Deployment Guide**: `docs/deployment/README.md`
- **Testing Guide**: `docs/TESTING.md`
- **Payment Setup**: `docs/PAYMENT_TESTING.md`

### Monitoring (Optional)
```bash
# Start monitoring stack
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Access:
# Prometheus: http://your-domain:9090
# Grafana: http://your-domain:3001 (admin/admin123)
```

## 🎉 Success Checklist

After setup, verify:
- [ ] GitHub Actions pipeline runs successfully
- [ ] Staging deployment works
- [ ] Health checks respond correctly
- [ ] SSL certificates are valid (production)
- [ ] Monitoring is operational
- [ ] Backup system is working
- [ ] Rollback procedures tested

## 🔐 Security Best Practices

1. **Use strong, unique passwords** for all services
2. **Rotate secrets regularly** (JWT secrets, API keys)
3. **Keep dependencies updated** (`npm audit`)
4. **Monitor security advisories** 
5. **Use HTTPS everywhere** in production
6. **Implement proper RBAC** in application
7. **Regular security scans** with Snyk

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review GitHub Actions logs
3. Check application health endpoints
4. Examine Docker container logs

---

**🎯 This CI/CD pipeline provides enterprise-grade deployment automation with security, monitoring, and reliability built-in.**

**Next Steps**: Update environment variables, configure your servers, and push to `develop` branch to test the pipeline! 