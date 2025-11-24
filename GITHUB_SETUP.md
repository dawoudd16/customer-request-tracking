# GitHub Setup Guide

Follow these steps to push your project to GitHub.

## Prerequisites

1. **Install Git** (if not already installed):
   - Download from: https://git-scm.com/download/win
   - Or use: `winget install Git.Git` (Windows Package Manager)

2. **Create a GitHub account** (if you don't have one):
   - Go to: https://github.com
   - Sign up for a free account

## Step 1: Initialize Git Repository

Open a terminal in the project root directory and run:

```bash
# Initialize git repository
git init

# Add all files (respects .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: Customer Request Tracking System"
```

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `customer-request-tracking` (or your preferred name)
3. Description: "Secure customer document upload and request tracking system for car dealerships"
4. Choose **Public** or **Private**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

## Step 3: Connect and Push

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add remote repository (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Rename default branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Alternative: Using GitHub CLI

If you have GitHub CLI installed:

```bash
# Login to GitHub
gh auth login

# Create repository and push in one command
gh repo create customer-request-tracking --public --source=. --remote=origin --push
```

## Important Notes

✅ **Safe to Push**: The `.gitignore` file is configured to exclude:
- `.env` files (your secrets)
- `node_modules/` (dependencies)
- Firebase service account keys
- Build outputs

⚠️ **Before Pushing**:
- Make sure you haven't committed any `.env` files
- Verify no Firebase service account JSON files are in the repo
- Check that sensitive data is not hardcoded in the source files

## Verify Your Push

After pushing, visit your repository on GitHub:
- `https://github.com/YOUR_USERNAME/REPO_NAME`

You should see all your project files there!

## Future Updates

To push future changes:

```bash
git add .
git commit -m "Description of your changes"
git push
```

