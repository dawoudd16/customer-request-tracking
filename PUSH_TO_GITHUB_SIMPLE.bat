@echo off
chcp 65001 >nul
echo ========================================
echo   GitHub Push - Simple Setup
echo ========================================
echo.

REM Navigate to script directory (project root)
cd /d "%~dp0"
echo Current directory: %CD%
echo.

REM Check if we're in the right place
if not exist "backend\package.json" (
    echo ERROR: Cannot find backend\package.json
    echo Please make sure you run this script from the project root folder.
    pause
    exit /b 1
)

echo [Step 1/5] Configuring Git...
"C:\Program Files\Git\bin\git.exe" config user.name "Customer Request Tracking"
"C:\Program Files\Git\bin\git.exe" config user.email "project@example.com"
echo Done!
echo.

echo [Step 2/5] Initializing Git repository...
if exist ".git" (
    echo Git repository already exists. Removing old one...
    rmdir /s /q ".git"
)
"C:\Program Files\Git\bin\git.exe" init
echo Done!
echo.

echo [Step 3/5] Adding all project files...
"C:\Program Files\Git\bin\git.exe" add .
echo Done!
echo.

echo [Step 4/5] Creating initial commit...
"C:\Program Files\Git\bin\git.exe" commit -m "Initial commit: Customer Request Tracking System"
echo Done!
echo.

echo [Step 5/5] Checking status...
"C:\Program Files\Git\bin\git.exe" status
echo.

echo ========================================
echo   SUCCESS! Your code is ready to push!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Go to: https://github.com/new
echo 2. Create a new repository (name it anything you want)
echo 3. Copy the repository URL (it will look like: https://github.com/YOUR_USERNAME/REPO_NAME.git)
echo 4. Come back here and run these commands:
echo.
echo    git remote add origin YOUR_REPOSITORY_URL
echo    git branch -M main
echo    git push -u origin main
echo.
echo Or tell me the repository URL and I can help you push!
echo.
pause

