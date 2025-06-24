#!/bin/bash

# GitHub Actions CI Local Setup Script
# This script sets up the local environment for testing CI/CD pipeline

set -e

echo "🚀 Setting up GitHub Actions CI Local Testing Environment..."
echo "============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running on supported OS
check_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        print_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
    print_status "Detected OS: $OS"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18.x or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version must be 18 or higher. Current: $(node --version)"
        exit 1
    fi
    print_status "Node.js $(node --version) ✓"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    print_status "npm $(npm --version) ✓"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. Some features will be unavailable."
    else
        print_status "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) ✓"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed."
        exit 1
    fi
    print_status "Git $(git --version | cut -d' ' -f3) ✓"
}

# Install Act (GitHub Actions local runner)
install_act() {
    print_step "Installing Act (GitHub Actions local runner)..."
    
    if command -v act &> /dev/null; then
        print_status "Act is already installed: $(act --version)"
        return 0
    fi
    
    case $OS in
        "linux")
            if command -v curl &> /dev/null; then
                curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
            else
                print_error "curl is required to install Act"
                exit 1
            fi
            ;;
        "macos")
            if command -v brew &> /dev/null; then
                brew install act
            else
                print_warning "Homebrew not found. Please install Act manually from: https://github.com/nektos/act"
            fi
            ;;
        "windows")
            print_warning "Please install Act manually using Chocolatey or Scoop:"
            print_warning "  choco install act-cli"
            print_warning "  scoop install act"
            ;;
    esac
}

# Install dependencies
install_dependencies() {
    print_step "Installing project dependencies..."
    
    # Backend dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Frontend dependencies
    print_status "Installing frontend dependencies..."
    cd client && npm install && cd ..
    
    # Development dependencies
    print_status "Installing additional development tools..."
    npm install --save-dev \
        eslint@^8.50.0 \
        prettier@^3.0.3 \
        jest@^29.7.0 \
        supertest@^6.3.3 \
        @types/jest@^29.5.5 \
        mongodb-memory-server@^9.1.1
    
    print_status "Dependencies installed successfully ✓"
}

# Create configuration files
create_config_files() {
    print_step "Creating configuration files..."
    
    # Create Jest config if it doesn't exist
    if [ ! -f "jest.config.js" ]; then
        print_status "Creating jest.config.js..."
        cat > jest.config.js << 'EOF'
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverageFrom: [
    'server/**/*.js',
    'server.js',
    '!server/node_modules/**',
    '!**/node_modules/**',
    '!coverage/**',
    '!tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true
};
EOF
    fi
    
    # Create .dockerignore if it doesn't exist
    if [ ! -f ".dockerignore" ]; then
        print_status "Creating .dockerignore..."
        cat > .dockerignore << 'EOF'
node_modules/
client/node_modules/
npm-debug.log*
.nyc_output
coverage/
.env*
.git/
.gitignore
README.md
Dockerfile
.dockerignore
EOF
    fi
    
    # Create .secrets file for Act
    if [ ! -f ".secrets" ]; then
        print_status "Creating .secrets file for Act..."
        cat > .secrets << 'EOF'
JWT_SECRET=test-jwt-secret-for-ci
STRIPE_SECRET_KEY=sk_test_fake_key_for_ci
STRIPE_WEBHOOK_SECRET=whsec_fake_webhook_secret
MONGODB_URI=mongodb://testuser:testpass@localhost:27017/test_db?authSource=admin
EMAIL_FROM=test@ci.com
EMAIL_HOST=smtp.test.com
EMAIL_PORT=587
EMAIL_USER=testuser
EMAIL_PASS=testpass
EOF
        print_warning "Created .secrets file with test values. Update as needed."
    fi
}

# Create test environment
create_test_env() {
    print_step "Setting up test environment..."
    
    # Create .env.test if it doesn't exist
    if [ ! -f ".env.test" ]; then
        print_status "Creating .env.test..."
        cat > .env.test << 'EOF'
NODE_ENV=test
PORT=5001
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/students-enrollment-test
JWT_SECRET=test_jwt_secret_for_local_development_only
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_test_webhook_secret
EMAIL_USER=test@example.com
EMAIL_PASS=test_password
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
        print_status "Created .env.test file"
    fi
    
    # Create tests directory structure
    if [ ! -d "tests" ]; then
        print_status "Creating tests directory structure..."
        mkdir -p tests/{unit,integration,helpers}
        
        # Create basic test setup file
        cat > tests/setup.js << 'EOF'
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

// Connect to the in-memory database
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Clear all test data after every test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});
EOF
        
        # Create sample test file
        cat > tests/unit/sample.test.js << 'EOF'
describe('Sample Test', () => {
  test('should pass', () => {
    expect(true).toBe(true);
  });
});
EOF
    fi
}

# Setup Docker Compose for testing
setup_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        print_step "Creating Docker Compose configuration for testing..."
        
        cat > docker-compose.test.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    environment:
      MONGO_INITDB_ROOT_USERNAME: testuser
      MONGO_INITDB_ROOT_PASSWORD: testpass
      MONGO_INITDB_DATABASE: test_db
    ports:
      - "27017:27017"
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.runCommand({ping: 1})"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  mongodb_test_data:
EOF
        print_status "Created docker-compose.test.yml"
    fi
}

# Add health check endpoint to server.js
add_health_check() {
    if ! grep -q "/api/health" server.js; then
        print_step "Adding health check endpoint to server.js..."
        
        # Create backup
        cp server.js server.js.backup
        
        # Add health check routes before the catch-all route
        sed -i.bak '/app.listen/i\
// Health check endpoints\
app.get("/health", (req, res) => {\
  res.status(200).json({\
    status: "healthy",\
    timestamp: new Date().toISOString(),\
    uptime: process.uptime(),\
    environment: process.env.NODE_ENV || "development"\
  });\
});\
\
app.get("/api/health", (req, res) => {\
  res.status(200).json({\
    status: "healthy",\
    timestamp: new Date().toISOString(),\
    uptime: process.uptime(),\
    environment: process.env.NODE_ENV || "development"\
  });\
});\
\
' server.js
        
        print_status "Added health check endpoints to server.js"
    fi
}

# Run initial tests
run_initial_tests() {
    print_step "Running initial tests to verify setup..."
    
    # Test linting
    print_status "Running ESLint..."
    if npm run lint; then
        print_status "Linting passed ✓"
    else
        print_warning "Linting failed. Fix issues before proceeding."
    fi
    
    # Test formatting
    print_status "Checking code formatting..."
    if npm run format:check; then
        print_status "Code formatting is correct ✓"
    else
        print_warning "Code formatting issues found. Run 'npm run format' to fix."
    fi
    
    # Test basic functionality
    print_status "Running basic tests..."
    if npm run test:backend; then
        print_status "Backend tests passed ✓"
    else
        print_warning "Some backend tests failed."
    fi
}

# Display usage instructions
show_usage() {
    print_step "Setup completed! Here's what you can do:"
    echo ""
    echo "📋 Available Commands:"
    echo "  npm run ci:test          - Run complete CI test suite"
    echo "  npm run lint             - Run ESLint"
    echo "  npm run format:check     - Check code formatting"
    echo "  npm run test:backend     - Run backend tests"
    echo "  npm run test:coverage    - Run tests with coverage"
    echo "  npm run health:check     - Check application health"
    echo ""
    echo "🐳 Docker Commands:"
    echo "  docker-compose -f docker-compose.test.yml up  - Start test database"
    echo "  docker-compose -f docker-compose.test.yml down - Stop test database"
    echo ""
    echo "🎭 Act Commands (if installed):"
    echo "  act                      - Run full GitHub Actions workflow"
    echo "  act -j lint              - Run only lint job"
    echo "  act -j test-backend      - Run only backend test job"
    echo "  act -j build             - Run only build job"
    echo "  act --secret-file .secrets - Run with secrets file"
    echo ""
    echo "📁 Important Files Created:"
    echo "  jest.config.js           - Jest testing configuration"
    echo "  .env.test                - Test environment variables"
    echo "  .secrets                 - Act secrets file"
    echo "  docker-compose.test.yml  - Docker test configuration"
    echo "  tests/                   - Test directory structure"
    echo ""
    echo "🔧 Next Steps:"
    echo "  1. Update .env.test with your actual test credentials"
    echo "  2. Update .secrets with your GitHub secrets for Act"
    echo "  3. Run 'npm run ci:test' to verify everything works"
    echo "  4. Start writing tests in the tests/ directory"
    echo ""
    print_status "Local CI/CD testing environment is ready! 🎉"
}

# Main execution
main() {
    check_os
    check_prerequisites
    install_act
    install_dependencies
    create_config_files
    create_test_env
    setup_docker_compose
    add_health_check
    run_initial_tests
    show_usage
}

# Run main function
main