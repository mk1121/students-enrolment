#!/bin/bash

# Students Enrollment System - Deployment Script
# Usage: ./scripts/deploy.sh [environment] [version]
# Example: ./scripts/deploy.sh production v1.2.0

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Default values
ENVIRONMENT="${1:-staging}"
VERSION="${2:-latest}"
REGISTRY="${DOCKER_REGISTRY:-your-registry.com}"
IMAGE_NAME="${DOCKER_IMAGE:-students-enrollment}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required tools are installed
    local tools=("docker" "docker-compose" "curl" "jq")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed"
            exit 1
        fi
    done
    
    # Check if .env file exists for the environment
    if [[ ! -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]]; then
        log_error ".env.$ENVIRONMENT file not found"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Function to backup database
backup_database() {
    log_info "Creating database backup..."
    
    local backup_dir="$PROJECT_ROOT/backups/$ENVIRONMENT"
    mkdir -p "$backup_dir"
    
    # Load environment variables
    source "$PROJECT_ROOT/.env.$ENVIRONMENT"
    
    # Create MongoDB backup
    docker run --rm \
        --network "${COMPOSE_PROJECT_NAME:-students-enrollment}_students-network" \
        -v "$backup_dir:/backup" \
        mongo:6.0 \
        mongodump \
        --host mongodb:27017 \
        --username "$MONGO_ROOT_USERNAME" \
        --password "$MONGO_ROOT_PASSWORD" \
        --authenticationDatabase admin \
        --db "$MONGO_DB_NAME" \
        --out "/backup/mongodb_backup_$TIMESTAMP"
    
    log_success "Database backup created at $backup_dir/mongodb_backup_$TIMESTAMP"
}

# Function to run health check
health_check() {
    local url="$1"
    local max_attempts=30
    local attempt=1
    
    log_info "Running health check on $url..."
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$url/api/health" > /dev/null; then
            log_success "Health check passed"
            return 0
        fi
        
        log_info "Health check attempt $attempt/$max_attempts failed, retrying in 10s..."
        sleep 10
        ((attempt++))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Function to run smoke tests
run_smoke_tests() {
    local base_url="$1"
    
    log_info "Running smoke tests..."
    
    # Test API endpoint
    if ! curl -f -s "$base_url/api/health" | jq -e '.status == "healthy"' > /dev/null; then
        log_error "API health check failed"
        return 1
    fi
    
    # Test database connectivity
    if ! curl -f -s "$base_url/api/auth/health" > /dev/null; then
        log_error "Database connectivity test failed"
        return 1
    fi
    
    log_success "Smoke tests passed"
}

# Function to rollback deployment
rollback() {
    log_warning "Rolling back deployment..."
    
    # Get previous image tag
    local previous_tag=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep "$REGISTRY/$IMAGE_NAME" | sed -n '2p' | cut -d':' -f2)
    
    if [[ -z "$previous_tag" ]]; then
        log_error "No previous image found for rollback"
        exit 1
    fi
    
    log_info "Rolling back to version: $previous_tag"
    
    # Update docker-compose to use previous tag
    export IMAGE_TAG="$previous_tag"
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" up -d app
    
    # Wait and test
    sleep 30
    if health_check "${SERVER_URL:-http://localhost}"; then
        log_success "Rollback completed successfully"
    else
        log_error "Rollback failed"
        exit 1
    fi
}

# Function to deploy to staging
deploy_staging() {
    log_info "Deploying to staging environment..."
    
    cd "$PROJECT_ROOT"
    
    # Load staging environment
    export $(cat .env.staging | xargs)
    export IMAGE_TAG="$VERSION"
    
    # Pull latest images
    docker-compose -f docker-compose.yml pull
    
    # Deploy
    docker-compose -f docker-compose.yml up -d
    
    # Wait for services to be ready
    sleep 45
    
    # Run health check
    if health_check "${STAGING_URL:-http://localhost}"; then
        run_smoke_tests "${STAGING_URL:-http://localhost}"
        log_success "Staging deployment completed successfully"
    else
        log_error "Staging deployment failed"
        exit 1
    fi
}

# Function to deploy to production
deploy_production() {
    log_info "Deploying to production environment..."
    
    # Confirm production deployment
    read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " -r
    if [[ ! $REPLY =~ ^yes$ ]]; then
        log_warning "Production deployment cancelled"
        exit 0
    fi
    
    cd "$PROJECT_ROOT"
    
    # Load production environment
    export $(cat .env.production | xargs)
    export IMAGE_TAG="$VERSION"
    
    # Create backup
    backup_database
    
    # Deploy with zero downtime
    log_info "Starting zero-downtime deployment..."
    
    # Pull new image
    docker pull "$REGISTRY/$IMAGE_NAME:$VERSION"
    
    # Deploy
    docker-compose -f docker-compose.prod.yml up -d app
    
    # Wait for new container to be ready
    sleep 60
    
    # Run health check
    if health_check "${PRODUCTION_URL:-https://your-domain.com}"; then
        run_smoke_tests "${PRODUCTION_URL:-https://your-domain.com}"
        
        # Clean up old images (keep last 3)
        docker images "$REGISTRY/$IMAGE_NAME" --format "table {{.Tag}}" | tail -n +4 | xargs -r docker rmi "$REGISTRY/$IMAGE_NAME:" 2>/dev/null || true
        
        log_success "Production deployment completed successfully"
        
        # Send notification
        send_notification "✅ Production deployment successful - Version: $VERSION"
    else
        log_error "Production deployment failed, initiating rollback..."
        rollback
        send_notification "❌ Production deployment failed and rolled back - Version: $VERSION"
        exit 1
    fi
}

# Function to send notification
send_notification() {
    local message="$1"
    
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
    
    if [[ -n "${DISCORD_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"content\":\"$message\"}" \
            "$DISCORD_WEBHOOK_URL" || true
    fi
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [environment] [version]

Environments:
  staging     Deploy to staging environment
  production  Deploy to production environment

Examples:
  $0 staging latest
  $0 production v1.2.0
  
Environment files required:
  .env.staging     - Staging environment variables
  .env.production  - Production environment variables
EOF
}

# Main execution
main() {
    log_info "Starting deployment process..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"
    log_info "Timestamp: $TIMESTAMP"
    
    # Validate environment parameter
    if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        show_usage
        exit 1
    fi
    
    # Run prerequisite checks
    check_prerequisites
    
    # Set up trap for cleanup on error
    trap 'log_error "Deployment failed at line $LINENO"' ERR
    
    # Deploy based on environment
    case "$ENVIRONMENT" in
        staging)
            deploy_staging
            ;;
        production)
            deploy_production
            ;;
    esac
    
    log_success "Deployment completed successfully!"
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 