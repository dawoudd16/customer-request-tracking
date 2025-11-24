@echo off
REM GitHub Push Script for Windows
REM Run this script to initialize git and push to GitHub

echo ========================================
echo GitHub Push Setup
echo ========================================
echo.

REM Check if git is installed
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git is not installed or not in PATH
    echo Please install Git from: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo [1/4] Initializing git repository...
if exist .git (
    echo Git repository already exists.
) else (
    git init
    echo Git repository initialized.
)

echo.
echo [2/4] Adding files...
git add .

echo.
echo [3/4] Creating initial commit...
git commit -m "Initial commit: Customer Request Tracking System"

echo.
echo [4/4] Ready to push!
echo.
echo Next steps:
echo 1. Create a repository on GitHub (https://github.com/new)
echo 2. Run these commands (replace YOUR_USERNAME and REPO_NAME):
echo.
echo    git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo Or use GitHub CLI:
echo    gh repo create REPO_NAME --public --source=. --remote=origin --push
echo.
pause

