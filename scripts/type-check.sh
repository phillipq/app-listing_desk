#!/bin/bash

# Type check script
echo "🔍 Running TypeScript type checking..."

# Run Next.js build with dry run to check for TypeScript errors
npm run build

# Check exit code
if [ $? -eq 0 ]; then
    echo "✅ TypeScript type checking passed!"
    exit 0
else
    echo "❌ TypeScript type checking failed!"
    echo "Please fix the TypeScript errors before committing."
    exit 1
fi
