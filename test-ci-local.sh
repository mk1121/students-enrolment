#!/bin/bash

# Students Enrollment System - Local CI Testing with act
# This script tests GitHub Actions workflows locally using act

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command_exists docker; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check act (GitHub Actions runner)
    if [[ ! -f "/usr/local/bin/act" ]]; then
        log_error "GitHub Actions act is not installed. Install it with: curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash -s -- -b /usr/local/bin"
        exit 1
    fi
    
    # Check secrets file
    if [[ ! -f ".secrets" ]]; then
        log_error ".secrets file not found. Please create it with test secrets."
        exit 1
    fi
    
    log_success "All prerequisites met!"
}

# Function to test individual jobs
test_job() {
    local job_name="$1"
    local event_type="${2:-push}"
    
    log_info "Testing job: $job_name (event: $event_type)"
    
    # Use Node.js compatible image
    if /usr/local/bin/act \
        --secret-file .secrets \
        -P ubuntu-latest=node:18-bullseye \
        --job "$job_name" \
        "$event_type"; then
        log_success "Job '$job_name' passed!"
        return 0
    else
        log_error "Job '$job_name' failed!"
        return 1
    fi
}

# Function to test full workflow
test_full_workflow() {
    local event_type="${1:-push}"
    
    log_info "Testing full workflow (event: $event_type)"
    
    if /usr/local/bin/act \
        --secret-file .secrets \
        -P ubuntu-latest=node:18-bullseye \
        "$event_type"; then
        log_success "Full workflow passed!"
        return 0
    else
        log_error "Full workflow failed!"
        return 1
    fi
}

# Function to list available jobs
list_jobs() {
    log_info "Available jobs in your workflow:"
    /usr/local/bin/act --list
}

# Function to dry run (show what would run)
dry_run() {
    local event_type="${1:-push}"
    
    log_info "Dry run - showing what would execute for event: $event_type"
    /usr/local/bin/act --dryrun --secret-file .secrets "$event_type"
}

# Main menu
show_menu() {
    echo
    log_info "🧪 Local CI Testing Menu"
    echo "1. Check prerequisites"
    echo "2. List available jobs"
    echo "3. Dry run (show what would execute)"
    echo "4. Test lint job"
    echo "5. Test backend tests"
    echo "6. Test frontend tests"
    echo "7. Test security scan"
    echo "8. Test build job"
    echo "9. Test full workflow (push event)"
    echo "10. Test full workflow (pull_request event)"
    echo "11. Custom job test"
    echo "0. Exit"
    echo
}

# Function to run custom job
run_custom_job() {
    echo -n "Enter job name: "
    read -r job_name
    if [[ -n "$job_name" ]]; then
        test_job "$job_name"
    else
        log_error "Job name cannot be empty"
    fi
}

# Main execution
main() {
    clear
    log_info "🚀 Students Enrollment System - Local CI Testing"
    log_info "This script helps you test GitHub Actions workflows locally using act"
    echo
    
    # Check prerequisites first
    check_prerequisites
    
    while true; do
        show_menu
        echo -n "Choose an option (0-11): "
        read -r choice
        
        case $choice in
            1)
                check_prerequisites
                ;;
            2)
                list_jobs
                ;;
            3)
                dry_run "push"
                ;;
            4)
                test_job "lint"
                ;;
            5)
                test_job "test-backend"
                ;;
            6)
                test_job "test-frontend"
                ;;
            7)
                test_job "security"
                ;;
            8)
                test_job "build"
                ;;
            9)
                test_full_workflow "push"
                ;;
            10)
                test_full_workflow "pull_request"
                ;;
            11)
                run_custom_job
                ;;
            0)
                log_info "Goodbye!"
                exit 0
                ;;
            *)
                log_error "Invalid option. Please choose 0-11."
                ;;
        esac
        
        echo
        echo "Press Enter to continue..."
        read -r
    done
}

# Handle script arguments
if [[ $# -gt 0 ]]; then
    case "$1" in
        "list")
            check_prerequisites
            list_jobs
            ;;
        "dry-run")
            check_prerequisites
            dry_run "${2:-push}"
            ;;
        "lint")
            check_prerequisites
            test_job "lint"
            ;;
        "test-backend")
            check_prerequisites
            test_job "test-backend"
            ;;
        "test-frontend")
            check_prerequisites
            test_job "test-frontend"
            ;;
        "security")
            check_prerequisites
            test_job "security"
            ;;
        "build")
            check_prerequisites
            test_job "build"
            ;;
        "full")
            check_prerequisites
            test_full_workflow "${2:-push}"
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [command] [options]"
            echo
            echo "Commands:"
            echo "  list                   List available jobs"
            echo "  dry-run [event]        Show what would run (default: push)"
            echo "  lint                   Test lint job"
            echo "  test-backend           Test backend tests"
            echo "  test-frontend          Test frontend tests"
            echo "  security               Test security scan"
            echo "  build                  Test build job"
            echo "  full [event]           Test full workflow (default: push)"
            echo "  help                   Show this help"
            echo
            echo "Examples:"
            echo "  $0 lint                # Test only lint job"
            echo "  $0 full push           # Test full workflow with push event"
            echo "  $0 dry-run pull_request # Dry run for pull request"
            ;;
        *)
            log_error "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
else
    # No arguments - run interactive menu
    main
fi
