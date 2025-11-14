#!/bin/bash

# =====================================================
# QOQNUZ MUSIC - MILESTONE A SETUP SCRIPT
# =====================================================
# This script sets up the complete development environment
# for Qoqnuz Music on Ubuntu Linux
#
# What this script does:
# 1. Installs Node.js and pnpm
# 2. Installs Supabase CLI
# 3. Installs AWS CLI (for R2 management)
# 4. Sets up the Next.js web application
# 5. Guides you through configuration
#
# Run this script: bash setup-milestone-a.sh
# =====================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if running on Ubuntu/Debian
check_os() {
    if [[ ! -f /etc/os-release ]]; then
        print_error "Cannot detect operating system"
        exit 1
    fi

    . /etc/os-release
    if [[ "$ID" != "ubuntu" ]] && [[ "$ID" != "debian" ]]; then
        print_warning "This script is designed for Ubuntu/Debian"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# =====================================================
# STEP 1: SYSTEM UPDATE
# =====================================================
step1_update_system() {
    print_header "STEP 1: Updating System Packages"

    print_info "This updates your package lists to get the latest versions"
    sudo apt update

    print_success "System package lists updated"
}

# =====================================================
# STEP 2: INSTALL NODE.JS
# =====================================================
step2_install_nodejs() {
    print_header "STEP 2: Installing Node.js 20.x"

    # Check if Node.js is already installed
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_info "Node.js is already installed: $NODE_VERSION"
        read -p "Reinstall/update Node.js? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return
        fi
    fi

    print_info "Installing Node.js 20.x from NodeSource repository..."

    # Install Node.js 20.x
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs

    # Verify installation
    NODE_VERSION=$(node -v)
    NPM_VERSION=$(npm -v)

    print_success "Node.js installed: $NODE_VERSION"
    print_success "npm installed: $NPM_VERSION"
}

# =====================================================
# STEP 3: INSTALL PNPM (FASTER PACKAGE MANAGER)
# =====================================================
step3_install_pnpm() {
    print_header "STEP 3: Installing pnpm (Fast Package Manager)"

    if command -v pnpm &> /dev/null; then
        PNPM_VERSION=$(pnpm -v)
        print_info "pnpm is already installed: $PNPM_VERSION"
        return
    fi

    print_info "pnpm is faster and more efficient than npm"
    npm install -g pnpm

    PNPM_VERSION=$(pnpm -v)
    print_success "pnpm installed: $PNPM_VERSION"
}

# =====================================================
# STEP 4: INSTALL SUPABASE CLI
# =====================================================
step4_install_supabase_cli() {
    print_header "STEP 4: Installing Supabase CLI"

    if command -v supabase &> /dev/null; then
        SUPABASE_VERSION=$(supabase --version)
        print_info "Supabase CLI is already installed: $SUPABASE_VERSION"
        return
    fi

    print_info "Installing Supabase CLI for database management..."
    npm install -g supabase

    # Verify installation
    SUPABASE_VERSION=$(supabase --version)
    print_success "Supabase CLI installed: $SUPABASE_VERSION"
}

# =====================================================
# STEP 5: INSTALL AWS CLI (FOR R2)
# =====================================================
step5_install_aws_cli() {
    print_header "STEP 5: Installing AWS CLI (for Cloudflare R2)"

    if command -v aws &> /dev/null; then
        AWS_VERSION=$(aws --version)
        print_info "AWS CLI is already installed: $AWS_VERSION"
        return
    fi

    print_info "AWS CLI is used to manage Cloudflare R2 storage..."
    sudo apt-get install -y awscli

    # Verify installation
    AWS_VERSION=$(aws --version)
    print_success "AWS CLI installed: $AWS_VERSION"
}

# =====================================================
# STEP 6: INSTALL WEB APP DEPENDENCIES
# =====================================================
step6_install_web_deps() {
    print_header "STEP 6: Installing Web App Dependencies"

    cd web

    print_info "Installing Node.js packages (this may take a few minutes)..."
    pnpm install

    print_success "All dependencies installed"

    cd ..
}

# =====================================================
# STEP 7: CONFIGURE ENVIRONMENT VARIABLES
# =====================================================
step7_configure_env() {
    print_header "STEP 7: Configure Environment Variables"

    ENV_FILE="web/.env.local"

    if [[ -f "$ENV_FILE" ]]; then
        print_warning ".env.local already exists"
        read -p "Overwrite it? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Skipping environment configuration"
            return
        fi
    fi

    print_info "Creating .env.local file..."
    cp web/.env.example "$ENV_FILE"

    print_warning "IMPORTANT: You need to manually edit web/.env.local with your credentials"
    print_info "Required credentials:"
    echo "  1. Supabase URL and Keys (from https://app.supabase.com)"
    echo "  2. Cloudflare R2 credentials (from Cloudflare dashboard)"
    echo ""
    print_info "To edit the file, run:"
    echo -e "  ${YELLOW}nano web/.env.local${NC}"
    echo ""

    read -p "Press Enter to continue..."
}

# =====================================================
# STEP 8: INITIALIZE SUPABASE PROJECT
# =====================================================
step8_init_supabase() {
    print_header "STEP 8: Initialize Supabase Project"

    print_info "You need to create a Supabase project first:"
    echo "  1. Go to https://app.supabase.com"
    echo "  2. Click 'New Project'"
    echo "  3. Enter project details:"
    echo "     - Name: Qoqnuz Music"
    echo "     - Database Password: (save this!)"
    echo "     - Region: Choose closest to you"
    echo "  4. Wait for project to be created (~2 minutes)"
    echo ""

    read -p "Have you created a Supabase project? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Create a Supabase project first, then run this script again"
        return
    fi

    print_info "Now you need to:"
    echo "  1. Copy your project URL and keys from Supabase dashboard"
    echo "  2. Paste them into web/.env.local"
    echo "  3. Run the database migration to create all tables"
    echo ""
    print_info "To run the migration:"
    echo -e "  ${YELLOW}# Copy the SQL from supabase/migrations/20250114000000_initial_schema.sql${NC}"
    echo -e "  ${YELLOW}# Go to your Supabase project -> SQL Editor${NC}"
    echo -e "  ${YELLOW}# Paste and run the SQL${NC}"
    echo ""

    read -p "Press Enter to continue..."
}

# =====================================================
# STEP 9: SETUP CLOUDFLARE R2
# =====================================================
step9_setup_r2() {
    print_header "STEP 9: Setup Cloudflare R2"

    print_info "Cloudflare R2 setup instructions:"
    echo "  1. Go to https://dash.cloudflare.com"
    echo "  2. Navigate to R2 (left sidebar)"
    echo "  3. Create a bucket named: qoqnuz-media"
    echo "  4. Create API token with Read & Write permissions"
    echo "  5. Save the Access Key ID and Secret Access Key"
    echo "  6. Note your Account ID (shown at top of R2 page)"
    echo ""
    print_info "For detailed instructions, see: docs/CLOUDFLARE_R2_SETUP.md"
    echo ""

    read -p "Have you set up Cloudflare R2? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Set up R2 first, then continue"
        return
    fi

    print_info "Don't forget to add R2 credentials to web/.env.local"

    read -p "Press Enter to continue..."
}

# =====================================================
# STEP 10: VERIFICATION
# =====================================================
step10_verify() {
    print_header "STEP 10: Verification"

    print_info "Checking installed tools..."

    # Check Node.js
    if command -v node &> /dev/null; then
        print_success "Node.js: $(node -v)"
    else
        print_error "Node.js: Not installed"
    fi

    # Check npm
    if command -v npm &> /dev/null; then
        print_success "npm: $(npm -v)"
    else
        print_error "npm: Not installed"
    fi

    # Check pnpm
    if command -v pnpm &> /dev/null; then
        print_success "pnpm: $(pnpm -v)"
    else
        print_error "pnpm: Not installed"
    fi

    # Check Supabase CLI
    if command -v supabase &> /dev/null; then
        print_success "Supabase CLI: Installed"
    else
        print_error "Supabase CLI: Not installed"
    fi

    # Check AWS CLI
    if command -v aws &> /dev/null; then
        print_success "AWS CLI: Installed"
    else
        print_error "AWS CLI: Not installed"
    fi

    # Check if .env.local exists
    if [[ -f "web/.env.local" ]]; then
        print_success ".env.local: Created"
    else
        print_warning ".env.local: Not configured"
    fi

    # Check if node_modules exists
    if [[ -d "web/node_modules" ]]; then
        print_success "Dependencies: Installed"
    else
        print_warning "Dependencies: Not installed"
    fi
}

# =====================================================
# MAIN EXECUTION
# =====================================================
main() {
    clear

    echo -e "${GREEN}"
    echo "  ╔═══════════════════════════════════════════╗"
    echo "  ║   QOQNUZ MUSIC - MILESTONE A SETUP       ║"
    echo "  ║   Complete Development Environment        ║"
    echo "  ╚═══════════════════════════════════════════╝"
    echo -e "${NC}"

    print_info "This script will set up everything you need for Milestone A"
    print_warning "Some steps require sudo password"
    echo ""

    read -p "Continue with setup? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Setup cancelled"
        exit 0
    fi

    # Run all steps
    check_os
    step1_update_system
    step2_install_nodejs
    step3_install_pnpm
    step4_install_supabase_cli
    step5_install_aws_cli
    step6_install_web_deps
    step7_configure_env
    step8_init_supabase
    step9_setup_r2
    step10_verify

    # Final message
    print_header "SETUP COMPLETE!"

    print_success "Milestone A setup is complete!"
    echo ""
    print_info "Next steps:"
    echo "  1. Edit web/.env.local with your credentials"
    echo "  2. Run database migration in Supabase SQL Editor"
    echo "  3. Upload sample music files to R2"
    echo "  4. Start development server:"
    echo -e "     ${YELLOW}cd web && pnpm dev${NC}"
    echo "  5. Visit http://localhost:3000/test to test streaming"
    echo ""
    print_info "For detailed documentation, see:"
    echo "  - docs/CLOUDFLARE_R2_SETUP.md"
    echo "  - web/README.md"
    echo "  - VERIFICATION_CHECKLIST.md"
    echo ""

    print_success "Happy coding! 🎵"
}

# Run main function
main
