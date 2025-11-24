#!/bin/bash

echo "🚀 Building PiccSync Frontend for Production..."

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build for production
echo "🔨 Building for production..."
npm run build

# Check if build was successful
if [ -d "dist" ]; then
    echo "✅ Build successful! Files ready in dist/ folder"
    echo "📁 Build contents:"
    ls -la dist/
    
    echo ""
    echo "🔍 Checking environment variables in build..."
    if grep -r "VITE_" dist/ 2>/dev/null; then
        echo "⚠️  Found VITE_ variables in build - this is expected"
    fi
    
    echo ""
    echo "📋 Next steps:"
    echo "1. Upload the contents of frontend/dist/ to your S3 bucket"
    echo "2. Invalidate CloudFront cache"
    echo "3. Test the application"
    
else
    echo "❌ Build failed!"
    exit 1
fi