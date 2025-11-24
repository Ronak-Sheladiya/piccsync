@echo off
echo 🚀 Building PiccSync Frontend for Production...

cd frontend

echo 📦 Installing dependencies...
npm install

echo 🔨 Building for production...
npm run build

if exist "dist" (
    echo ✅ Build successful! Files ready in dist/ folder
    echo 📁 Build contents:
    dir dist
    
    echo.
    echo 📋 Next steps:
    echo 1. Upload the contents of frontend/dist/ to your S3 bucket
    echo 2. Invalidate CloudFront cache  
    echo 3. Test the application
    
    echo.
    echo 🔍 To find your S3 bucket:
    echo aws cloudfront get-distribution --id d7svw77q604i
    
) else (
    echo ❌ Build failed!
    pause
    exit /b 1
)

pause