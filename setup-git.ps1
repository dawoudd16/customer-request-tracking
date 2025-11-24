# Git Setup Script for Customer Request Tracking System
# Run this script in PowerShell

Write-Host "Setting up Git repository..." -ForegroundColor Green

# Get the script directory (project root)
$projectRoot = $PSScriptRoot

# Change to project directory
Set-Location $projectRoot

# Configure Git (you can change these values)
Write-Host "`nConfiguring Git user..." -ForegroundColor Yellow
Write-Host "Please enter your Git configuration:" -ForegroundColor Cyan
$userName = Read-Host "Your Name (or press Enter to use 'Your Name')"
$userEmail = Read-Host "Your Email (or press Enter to use 'your.email@example.com')"

if ([string]::IsNullOrWhiteSpace($userName)) {
    $userName = "Your Name"
}
if ([string]::IsNullOrWhiteSpace($userEmail)) {
    $userEmail = "your.email@example.com"
}

# Set Git config for this repository
git config user.name "$userName"
git config user.email "$userEmail"

Write-Host "`nInitializing Git repository..." -ForegroundColor Yellow
git init

Write-Host "`nAdding files..." -ForegroundColor Yellow
git add .

Write-Host "`nCreating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit: Customer Request Tracking System"

Write-Host "`n✅ Git repository initialized successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Create a repository on GitHub: https://github.com/new" -ForegroundColor White
Write-Host "2. Run these commands (replace YOUR_USERNAME and REPO_NAME):" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git" -ForegroundColor Gray
Write-Host "   git branch -M main" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host "`nOr use GitHub CLI:" -ForegroundColor White
Write-Host "   gh repo create REPO_NAME --public --source=. --remote=origin --push" -ForegroundColor Gray

