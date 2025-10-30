#!/bin/bash
set -e

echo "🚀 Starting Conductor workspace setup for Syndicate GOV AI Catalog v3..."

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# 1. Check if Bun is installed
echo ""
print_info "Checking for Bun runtime..."
if ! command -v bun &> /dev/null; then
    print_error "Bun is not installed!"
    echo ""
    echo "This project requires Bun 1.3+ to run."
    echo "Please install Bun first: https://bun.sh"
    echo ""
    echo "Quick install: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

BUN_VERSION=$(bun --version)
print_success "Bun ${BUN_VERSION} is installed"

# 2. Install dependencies
echo ""
print_info "Installing dependencies with Bun..."
if bun install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# 3. Handle environment variables
echo ""
print_info "Setting up environment configuration..."

# Check if .env exists in the repo root
if [ -f "$CONDUCTOR_ROOT_PATH/.env" ]; then
    print_info "Found .env in repository root, creating symlink..."
    ln -sf "$CONDUCTOR_ROOT_PATH/.env" .env
    print_success "Environment file linked successfully"
elif [ -f "$CONDUCTOR_ROOT_PATH/.env.example" ]; then
    print_info "Found .env.example in repository root, copying as template..."
    cp "$CONDUCTOR_ROOT_PATH/.env.example" .env
    print_success "Created .env from template"
    echo ""
    print_info "⚠️  Please update .env with your actual configuration values"
else
    print_info "No .env or .env.example found - skipping environment setup"
    print_info "If you need environment variables, create a .env file in the repository root"
fi

# 4. Verify workspace setup
echo ""
print_info "Verifying workspace setup..."

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found! Workspace may not be set up correctly."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_error "node_modules not found! Dependency installation may have failed."
    exit 1
fi

print_success "Workspace structure verified"

# 5. Display workspace info
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_success "Workspace setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Workspace: $CONDUCTOR_WORKSPACE_NAME"
echo "Root Path: $CONDUCTOR_ROOT_PATH"
echo "Workspace Path: $CONDUCTOR_WORKSPACE_PATH"
echo ""
print_info "Quick start commands:"
echo "  • bun run citadel:dev      - Start Citadel in development mode"
echo "  • bun run citadel:status   - Check system status"
echo "  • bun run validate:all     - Run all validations"
echo "  • bun run test             - Run tests"
echo ""
print_success "Ready to code! 🎉"
echo ""
