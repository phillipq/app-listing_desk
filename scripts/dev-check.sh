#!/bin/bash

# Development check script - runs all quality checks
echo "🚀 Running development quality checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run command and check exit code
run_check() {
    local name="$1"
    local command="$2"
    
    echo -e "\n${YELLOW}🔍 Running $name...${NC}"
    
    if eval "$command"; then
        echo -e "${GREEN}✅ $name passed!${NC}"
        return 0
    else
        echo -e "${RED}❌ $name failed!${NC}"
        return 1
    fi
}

# Track overall success
overall_success=true

# Run TypeScript type checking
if ! run_check "TypeScript Type Checking" "npx tsc --noEmit"; then
    overall_success=false
fi

# Run ESLint
if ! run_check "ESLint" "npm run lint"; then
    overall_success=false
fi

# Run Prettier check
if ! run_check "Prettier Formatting" "npm run prettier"; then
    overall_success=false
fi

# Run build check
if ! run_check "Next.js Build" "npm run build"; then
    overall_success=false
fi

# Final result
echo -e "\n" 
if [ "$overall_success" = true ]; then
    echo -e "${GREEN}🎉 All checks passed! Your code is ready.${NC}"
    exit 0
else
    echo -e "${RED}💥 Some checks failed. Please fix the issues above.${NC}"
    exit 1
fi
