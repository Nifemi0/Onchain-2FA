#!/bin/bash

# Drosera Authenticator Setup Script
# This script helps set up the development environment

set -e

echo "🚀 Setting up Drosera Authenticator..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) is installed"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "npm $(npm --version) is installed"
}

# Check if Foundry is installed
check_foundry() {
    if ! command -v forge &> /dev/null; then
        print_warning "Foundry is not installed. Installing Foundry..."
        curl -L https://foundry.paradigm.xyz | bash
        source ~/.bashrc
        foundryup
        print_success "Foundry installed successfully"
    else
        print_success "Foundry $(forge --version) is installed"
    fi
}

# Setup smart contracts
setup_contracts() {
    print_status "Setting up smart contracts..."
    
    cd contracts
    
    # Check if lib directory exists
    if [ ! -d "lib" ]; then
        print_status "Installing forge-std..."
        forge install foundry-rs/forge-std --no-commit
    fi
    
    # Run tests
    print_status "Running smart contract tests..."
    forge test -vv
    
    print_success "Smart contracts setup complete"
    cd ..
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    print_success "Frontend setup complete"
    cd ..
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env
        print_warning "Please edit backend/.env with your configuration"
    fi
    
    # Build TypeScript
    print_status "Building backend..."
    npm run build
    
    print_success "Backend setup complete"
    cd ..
}

# Create environment files
create_env_files() {
    print_status "Creating environment files..."
    
    # Create contracts .env if it doesn't exist
    if [ ! -f "contracts/.env" ]; then
        cp contracts/.env.example contracts/.env
        print_warning "Please edit contracts/.env with your private key and RPC URLs"
    fi
    
    print_success "Environment files created"
}

# Main setup function
main() {
    echo "🎯 Drosera Authenticator Setup"
    echo "=============================="
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    check_node
    check_npm
    check_foundry
    
    # Setup components
    setup_contracts
    setup_frontend
    setup_backend
    create_env_files
    
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Edit contracts/.env with your private key and RPC URLs"
    echo "2. Edit backend/.env with your configuration"
    echo "3. Deploy smart contract: cd contracts && forge script script/DeployLocal.s.sol --rpc-url http://localhost:8545 --broadcast"
    echo "4. Update frontend/src/lib/config.ts with contract address"
    echo "5. Start development servers:"
    echo "   - Frontend: cd frontend && npm run dev"
    echo "   - Backend: cd backend && npm run dev"
    echo ""
    echo "📚 Documentation:"
    echo "- Main README: ./README.md"
    echo "- Deployment Guide: ./DEPLOYMENT.md"
    echo "- Project Summary: ./PROJECT_SUMMARY.md"
    echo ""
    echo "🚀 Happy coding!"
}

# Run main function
main "$@"