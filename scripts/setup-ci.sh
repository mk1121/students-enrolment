#!/bin/bash

# Students Enrollment System - CI/CD Setup Script
# This script sets up the development environment and CI/CD requirements

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Node.js if not present
install_nodejs() {
    if ! command_exists node; then
        log_info "Installing Node.js..."
        
        # Install using NodeSource repository
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
        
        log_success "Node.js installed successfully"
    else
        local node_version=$(node --version)
        log_info "Node.js already installed: $node_version"
    fi
}

# Function to install Docker if not present
install_docker() {
    if ! command_exists docker; then
        log_info "Installing Docker..."
        
        # Install Docker
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        
        log_success "Docker installed successfully"
        log_warning "Please log out and log back in for Docker group membership to take effect"
    else
        local docker_version=$(docker --version)
        log_info "Docker already installed: $docker_version"
    fi
}

# Function to install Docker Compose if not present
install_docker_compose() {
    if ! command_exists docker-compose; then
        log_info "Installing Docker Compose..."
        
        # Install Docker Compose
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        
        log_success "Docker Compose installed successfully"
    else
        local compose_version=$(docker-compose --version)
        log_info "Docker Compose already installed: $compose_version"
    fi
}

# Function to install development tools
install_dev_tools() {
    log_info "Installing development tools..."
    
    # Install system dependencies
    sudo apt-get update
    if ! sudo apt-get install -y netcat-openbsd; then
        echo "Failed to install netcat-openbsd. Please check your package sources or try installing netcat-traditional."
        exit 1
    fi
    sudo apt-get install -y \
        curl \
        wget \
        git \
        jq \
        unzip \
        build-essential \
        python3-pip
    
    # Install global npm packages
    npm install -g \
        eslint \
        prettier \
        pm2 \
        nodemon \
        jest \
        npm-check-updates
    
    log_success "Development tools installed successfully"
}

# Function to setup project dependencies
setup_project_dependencies() {
    log_info "Setting up project dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Install backend dependencies
    if [[ -f "package.json" ]]; then
        log_info "Installing backend dependencies..."
        npm ci
    fi
    
    # Install frontend dependencies
    if [[ -f "client/package.json" ]]; then
        log_info "Installing frontend dependencies..."
        cd client
        npm ci
        cd ..
    fi
    
    log_success "Project dependencies installed successfully"
}

# Function to setup environment files
setup_environment_files() {
    log_info "Setting up environment files..."
    
    cd "$PROJECT_ROOT"
    
    # Create environment files from example
    local env_files=(".env.development" ".env.staging" ".env.production" ".env.test")
    
    for env_file in "${env_files[@]}"; do
        if [[ ! -f "$env_file" ]]; then
            log_info "Creating $env_file from example..."
            cp env.example "$env_file"
            
            # Customize based on environment
            case "$env_file" in
                ".env.development")
                    sed -i 's/NODE_ENV=production/NODE_ENV=development/' "$env_file"
                    sed -i 's/PORT=5000/PORT=5000/' "$env_file"
                    ;;
                ".env.staging")
                    sed -i 's/NODE_ENV=production/NODE_ENV=staging/' "$env_file"
                    sed -i 's/PORT=5000/PORT=5001/' "$env_file"
                    ;;
                ".env.test")
                    sed -i 's/NODE_ENV=production/NODE_ENV=test/' "$env_file"
                    sed -i 's/PORT=5000/PORT=5002/' "$env_file"
                    sed -i 's/students_enrollment/students_enrollment_test/' "$env_file"
                    ;;
            esac
        else
            log_info "$env_file already exists"
        fi
    done
    
    log_success "Environment files setup completed"
}

# Function to setup Git hooks
setup_git_hooks() {
    log_info "Setting up Git hooks..."
    
    cd "$PROJECT_ROOT"
    
    # Create pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Run linting
echo "Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
    echo "ESLint failed. Commit aborted."
    exit 1
fi

# Run Prettier check
echo "Running Prettier check..."
npm run format:check
if [ $? -ne 0 ]; then
    echo "Code formatting check failed. Please run 'npm run format' and try again."
    exit 1
fi

# Run tests
echo "Running tests..."
npm run test:quick
if [ $? -ne 0 ]; then
    echo "Tests failed. Commit aborted."
    exit 1
fi

echo "Pre-commit checks passed!"
EOF

    chmod +x .git/hooks/pre-commit
    
    # Create commit-msg hook for conventional commits
    cat > .git/hooks/commit-msg << 'EOF'
#!/bin/bash

# Check commit message format
commit_regex='^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .{1,50}'

if ! grep -qE "$commit_regex" "$1"; then
    echo "Invalid commit message format!"
    echo "Please use the conventional commit format:"
    echo "  feat: add new feature"
    echo "  fix: bug fix"
    echo "  docs: documentation changes"
    echo "  style: formatting changes"
    echo "  refactor: code refactoring"
    echo "  test: adding or updating tests"
    echo "  chore: maintenance tasks"
    echo "  perf: performance improvements"
    echo "  ci: CI/CD changes"
    echo "  build: build system changes"
    echo "  revert: revert previous commit"
    exit 1
fi
EOF

    chmod +x .git/hooks/commit-msg
    
    log_success "Git hooks setup completed"
}

# Function to setup package.json scripts
setup_npm_scripts() {
    log_info "Setting up npm scripts..."
    
    cd "$PROJECT_ROOT"
    
    # Add CI/CD scripts to package.json
    npm pkg set scripts.lint="eslint . --ext .js,.jsx --ignore-path .gitignore"
    npm pkg set scripts.lint:fix="eslint . --ext .js,.jsx --ignore-path .gitignore --fix"
    npm pkg set scripts.format="prettier --write ."
    npm pkg set scripts.format:check="prettier --check ."
    npm pkg set scripts.test:quick="jest --passWithNoTests --silent --detectOpenHandles"
    npm pkg set scripts.test:backend="jest --testPathPattern=tests/ --coverage --silent --detectOpenHandles"
    npm pkg set scripts.test:coverage="jest --coverage --silent --detectOpenHandles"
    npm pkg set scripts.test:watch="jest --watch --silent --detectOpenHandles"
    npm pkg set scripts.build="cd client && npm run build"
    npm pkg set scripts.dev="concurrently \"npm run dev:server\" \"npm run dev:client\""
    npm pkg set scripts.dev:server="nodemon server.js"
    npm pkg set scripts.dev:client="cd client && npm start"
    npm pkg set scripts.start:staging="NODE_ENV=staging node server.js"
    npm pkg set scripts.start:production="NODE_ENV=production node server.js"
    npm pkg set scripts.docker:build="docker build -t students-enrollment ."
    npm pkg set scripts.docker:dev="docker-compose up --build"
    npm pkg set scripts.docker:prod="docker-compose -f docker-compose.prod.yml up -d"
    npm pkg set scripts.deploy:staging="./scripts/deploy.sh staging"
    npm pkg set scripts.deploy:production="./scripts/deploy.sh production"
    npm pkg set scripts.setup="./scripts/setup-ci.sh"
    
    log_success "npm scripts setup completed"
}

# Function to setup development database
setup_dev_database() {
    log_info "Setting up development database..."
    
    cd "$PROJECT_ROOT"
    
    # Start MongoDB using Docker Compose
    if docker-compose ps | grep -q mongodb; then
        log_info "MongoDB container already running"
    else
        log_info "Starting MongoDB container..."
        docker-compose up -d mongodb
        
        # Wait for MongoDB to be ready
        log_info "Waiting for MongoDB to be ready..."
        sleep 10
        
        # Run migrations
        if [[ -f "migrate.js" ]]; then
            log_info "Running database migrations..."
            node migrate.js
        fi
        
        # Seed database
        if [[ -f "seed-simple.js" ]]; then
            log_info "Seeding database with sample data..."
            node seed-simple.js
        fi
    fi
    
    log_success "Development database setup completed"
}

# Function to create directory structure
create_directories() {
    log_info "Creating directory structure..."
    
    cd "$PROJECT_ROOT"
    
    # Create required directories
    local dirs=(
        ".github/workflows"
        "scripts"
        "nginx/conf.d"
        "nginx/ssl"
        "monitoring"
        "backups/staging"
        "backups/production"
        "logs"
        "uploads"
        "docs/deployment"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
    done
    
    log_success "Directory structure created"
}

# Function to setup monitoring configuration
setup_monitoring() {
    log_info "Setting up monitoring configuration..."
    
    cd "$PROJECT_ROOT"
    
    # Create Prometheus configuration
    cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'students-enrollment'
    static_configs:
      - targets: ['app:5000']
    metrics_path: '/api/metrics'
EOF

    # Create Grafana provisioning
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    
    cat > monitoring/grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

    log_success "Monitoring configuration setup completed"
}

# Function to generate documentation
generate_documentation() {
    log_info "Generating CI/CD documentation..."
    
    cd "$PROJECT_ROOT"
    
    cat > docs/deployment/CI_CD_GUIDE.md << 'EOF'
# CI/CD Pipeline Guide

## Overview
This project uses GitHub Actions for CI/CD with automated testing, building, and deployment.

## Pipeline Stages

### 1. Code Quality & Linting
- ESLint for JavaScript linting
- Prettier for code formatting
- Runs on every push and PR

### 2. Testing
- Backend tests with Jest
- Frontend tests with React Testing Library
- Coverage reporting to Codecov

### 3. Security Scanning
- npm audit for dependency vulnerabilities
- Snyk security scanning

### 4. Building
- Docker image building
- Frontend build optimization
- Artifact storage

### 5. Deployment
- Staging deployment on develop branch
- Production deployment on main branch
- Zero-downtime deployment strategy

## Environment Setup

### Required Secrets
Add these secrets to your GitHub repository:

#### Docker Registry
- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password

#### Staging Environment
- `STAGING_HOST`: Staging server IP/hostname
- `STAGING_USER`: SSH username
- `STAGING_SSH_KEY`: SSH private key
- `STAGING_PORT`: SSH port (default: 22)
- `STAGING_URL`: Staging application URL

#### Production Environment
- `PRODUCTION_HOST`: Production server IP/hostname
- `PRODUCTION_USER`: SSH username
- `PRODUCTION_SSH_KEY`: SSH private key
- `PRODUCTION_PORT`: SSH port (default: 22)
- `PRODUCTION_URL`: Production application URL

#### Optional
- `SNYK_TOKEN`: Snyk security scanning token
- `SLACK_WEBHOOK_URL`: Slack notifications
- `DISCORD_WEBHOOK_URL`: Discord notifications

### Local Development

1. Clone the repository
2. Run setup script: `./scripts/setup-ci.sh`
3. Start development: `npm run dev`

### Manual Deployment

#### Staging
```bash
./scripts/deploy.sh staging latest
```

#### Production
```bash
./scripts/deploy.sh production v1.2.0
```

## Branch Strategy

- `main`: Production branch
- `develop`: Staging branch
- Feature branches: `feature/feature-name`
- Hotfix branches: `hotfix/fix-name`

## Commit Convention

Use conventional commits:
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation
- `style:` formatting
- `refactor:` code refactoring
- `test:` testing
- `chore:` maintenance

## Monitoring

- Application metrics via Prometheus
- Logs aggregation via Filebeat/ELK
- Grafana dashboards for visualization
- Health checks and alerts

## Troubleshooting

### Common Issues

1. **Pipeline fails at testing**
   - Check test files and dependencies
   - Verify environment variables

2. **Docker build fails**
   - Check Dockerfile syntax
   - Verify dependencies in package.json

3. **Deployment fails**
   - Check server connectivity
   - Verify SSH keys and permissions
   - Check environment variables

### Rollback Procedure

If deployment fails, automatic rollback is triggered. Manual rollback:

```bash
cd /var/www/students-enrollment-production
docker-compose -f docker-compose.prod.yml down
docker tag students-enrollment:previous students-enrollment:current
docker-compose -f docker-compose.prod.yml up -d
```
EOF

    log_success "Documentation generated"
}

# Function to verify setup
verify_setup() {
    log_info "Verifying setup..."
    
    local errors=0
    
    # Check required commands
    local commands=("node" "npm" "docker" "docker-compose" "git" "curl" "jq")
    for cmd in "${commands[@]}"; do
        if ! command_exists "$cmd"; then
            log_error "$cmd is not installed or not in PATH"
            ((errors++))
        fi
    done
    
    # Check environment files
    local env_files=(".env.development" ".env.staging" ".env.production" ".env.test")
    for env_file in "${env_files[@]}"; do
        if [[ ! -f "$PROJECT_ROOT/$env_file" ]]; then
            log_error "$env_file is missing"
            ((errors++))
        fi
    done
    
    # Check Git hooks
    if [[ ! -x "$PROJECT_ROOT/.git/hooks/pre-commit" ]]; then
        log_error "Pre-commit hook is missing or not executable"
        ((errors++))
    fi
    
    if [[ $errors -eq 0 ]]; then
        log_success "Setup verification passed"
        return 0
    else
        log_error "Setup verification failed with $errors errors"
        return 1
    fi
}

# Main function
main() {
    log_info "Starting CI/CD setup for Students Enrollment System..."
    
    # Check if running on Ubuntu/Debian
    if [[ ! -f /etc/debian_version ]]; then
        log_warning "This script is designed for Ubuntu/Debian. Some commands may not work on other distributions."
    fi
    
    # Run setup steps
    create_directories
    install_nodejs
    install_docker
    install_docker_compose
    install_dev_tools
    setup_project_dependencies
    setup_environment_files
    setup_git_hooks
    setup_npm_scripts
    setup_monitoring
    setup_dev_database
    generate_documentation
    
    # Verify setup
    if verify_setup; then
        log_success "CI/CD setup completed successfully!"
        echo
        log_info "Next steps:"
        echo "1. Review and update environment files (.env.*)"
        echo "2. Configure GitHub repository secrets"
        echo "3. Update domain names in nginx configuration"
        echo "4. Set up monitoring and alerting"
        echo "5. Test the pipeline with a sample commit"
        echo
        log_info "To start development:"
        echo "npm run dev"
        echo
        log_info "To run tests:"
        echo "npm run test:backend"
        echo
        log_info "To deploy:"
        echo "./scripts/deploy.sh staging latest"
    else
        log_error "Setup completed with errors. Please review and fix the issues above."
        exit 1
    fi
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 