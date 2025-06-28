#!/bin/bash

# Simple Local CI Testing Script
# Tests CI components locally without Docker authentication issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Function to test linting
test_lint() {
    log_info "🔍 Testing ESLint..."
    if npm run lint; then
        log_success "ESLint passed!"
        return 0
    else
        log_error "ESLint failed!"
        return 1
    fi
}

# Function to test formatting
test_format() {
    log_info "🎨 Testing Prettier formatting..."
    if npm run format:check; then
        log_success "Prettier formatting check passed!"
        return 0
    else
        log_warning "Prettier formatting issues found. Run 'npm run format' to fix."
        return 1
    fi
}

# Function to test backend
test_backend() {
    log_info "🧪 Testing Backend..."
    if npm run test:backend; then
        log_success "Backend tests passed!"
        return 0
    else
        log_error "Backend tests failed!"
        return 1
    fi
}

# Function to test frontend
test_frontend() {
    log_info "⚛️ Testing Frontend..."
    cd client
    if npm test -- --watchAll=false; then
        log_success "Frontend tests passed!"
        cd ..
        return 0
    else
        log_error "Frontend tests failed!"
        cd ..
        return 1
    fi
}

# Function to test build
test_build() {
    log_info "🏗️ Testing Build..."
    cd client
    if npm run build; then
        log_success "Frontend build successful!"
        cd ..
        return 0
    else
        log_error "Frontend build failed!"
        cd ..
        return 1
    fi
}

# Function to run security audit
test_security() {
    log_info "🔒 Testing Security (npm audit)..."
    log_info "Backend security audit..."
    npm audit || log_warning "Backend has security vulnerabilities"
    
    log_info "Frontend security audit..."
    cd client
    npm audit || log_warning "Frontend has security vulnerabilities"
    cd ..
    
    log_success "Security audit completed!"
}

# Function to run all tests
test_all() {
    log_info "🚀 Running all CI tests locally..."
    
    local failed=0
    
    test_lint || ((failed++))
    test_format || ((failed++))
    test_backend || ((failed++))
    test_frontend || ((failed++))
    test_build || ((failed++))
    test_security
    
    if [ $failed -eq 0 ]; then
        log_success "🎉 All tests passed! Your code is ready for CI/CD pipeline."
    else
        log_error "❌ $failed test(s) failed. Please fix the issues before pushing."
        return 1
    fi
}

# Main menu
show_menu() {
    echo
    log_info "🧪 Simple Local CI Testing"
    echo "1. Test Linting (ESLint)"
    echo "2. Test Formatting (Prettier)"
    echo "3. Test Backend"
    echo "4. Test Frontend"
    echo "5. Test Build"
    echo "6. Test Security"
    echo "7. Run All Tests"
    echo "8. Fix Formatting"
    echo "0. Exit"
    echo
}

# Fix formatting
fix_formatting() {
    log_info "🎨 Fixing code formatting..."
    npm run format
    log_success "Formatting fixed!"
}

# Main execution
main() {
    clear
    log_info "🚀 Students Enrollment System - Simple Local CI Testing"
    echo
    
    if [ $# -eq 0 ]; then
        # Interactive mode
        while true; do
            show_menu
            echo -n "Choose an option (0-8): "
            read -r choice
            
            case $choice in
                1) test_lint ;;
                2) test_format ;;
                3) test_backend ;;
                4) test_frontend ;;
                5) test_build ;;
                6) test_security ;;
                7) test_all ;;
                8) fix_formatting ;;
                0) 
                    log_info "Goodbye!"
                    exit 0
                    ;;
                *)
                    log_error "Invalid option. Please choose 0-8."
                    ;;
            esac
            
            echo
            echo "Press Enter to continue..."
            read -r
        done
    else
        # Command line mode
        case $1 in
            "lint") test_lint ;;
            "format") test_format ;;
            "backend") test_backend ;;
            "frontend") test_frontend ;;
            "build") test_build ;;
            "security") test_security ;;
            "all") test_all ;;
            "fix") fix_formatting ;;
            *)
                log_info "Usage: $0 [lint|format|backend|frontend|build|security|all|fix]"
                log_info "Or run without arguments for interactive mode"
                ;;
        esac
    fi
}

# Run main function
main "$@" 