# Complete Git Setup Script - Run this in the project folder
# This script does everything automatically

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete Git Setup for GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the directory where this script is located (project root)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Current directory: $scriptPath" -ForegroundColor Yellow
Write-Host ""

# Check if we're in the right place
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "ERROR: backend or frontend folder not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Red
    pause
    exit 1
}

# Remove any existing .git folder in project directory
if (Test-Path ".git") {
    Write-Host "Removing existing .git folder..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .git
}

# Configure Git
Write-Host "Configuring Git..." -ForegroundColor Green
git config user.name "Customer Request Tracking"
git config user.email "project@example.com"

# Initialize repository
Write-Host "Initializing Git repository..." -ForegroundColor Green
git init

# Add all project files
Write-Host "Adding files to Git..." -ForegroundColor Green
git add .

# Create initial commit
Write-Host "Creating initial commit..." -ForegroundColor Green
git commit -m "Initial commit: Customer Request Tracking System"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Git repository ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps to push to GitHub:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://github.com/new" -ForegroundColor White
Write-Host "2. Create a new repository (name it anything you want)" -ForegroundColor White
Write-Host "3. DO NOT initialize with README, .gitignore, or license" -ForegroundColor Yellow
Write-Host "4. Copy the repository URL (e.g., https://github.com/YOUR_USERNAME/REPO_NAME.git)" -ForegroundColor White
Write-Host ""
Write-Host "5. Then run these commands:" -ForegroundColor Cyan
Write-Host "   git remote add origin YOUR_REPOSITORY_URL" -ForegroundColor Gray
Write-Host "   git branch -M main" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "Or tell me the repository URL and I can help you push!" -ForegroundColor Cyan
Write-Host ""

pause

