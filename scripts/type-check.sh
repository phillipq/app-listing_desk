#!/bin/bash

# Type check script
echo "🔍 Running TypeScript type checking..."

# First, run tsc directly to catch implicit any errors (like Vercel does)
echo "Running tsc --noEmit to catch implicit any errors..."
TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
TSC_EXIT_CODE=$?

# Check for implicit any errors specifically
if echo "$TSC_OUTPUT" | grep -qE "(implicit|Parameter.*implicitly|error TS[0-9]+.*any)"; then
    echo "❌ TypeScript found implicit any errors:"
    echo "$TSC_OUTPUT" | grep -E "(implicit|Parameter.*implicitly|error TS[0-9]+.*any)" | head -20
    exit 1
fi

# If tsc found other errors, show them
if [ $TSC_EXIT_CODE -ne 0 ]; then
    echo "❌ TypeScript found errors:"
    echo "$TSC_OUTPUT" | head -30
    exit 1
fi

# Then run Next.js build to check for other errors
echo "Running Next.js build..."
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
