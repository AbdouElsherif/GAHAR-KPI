# Git Push Script - Simple Version

Write-Host "Starting Git Push..." -ForegroundColor Green

# Reset
git reset

# Add files
Write-Host "Adding files..." -ForegroundColor Yellow
git add app/ components/ lib/ public/
git add package.json package-lock.json tsconfig.json next.config.js tailwind.config.ts postcss.config.mjs
git add firebase.ts firestore.ts firestore.rules .firebaserc firebase.json
git add .gitignore
git add app/globals.css

# Commit
Write-Host "Creating commit..." -ForegroundColor Yellow
git commit -m "Initial commit: Complete project with 30 components"

# Restore .firebase
Write-Host "Restoring .firebase folder..." -ForegroundColor Yellow
if (Test-Path "_firebase_temp") {
    Rename-Item _firebase_temp .firebase
}

# Setup remote - EDIT THIS LINE WITH YOUR REPO URL
Write-Host "Setting up GitHub remote..." -ForegroundColor Yellow
Write-Host "IMPORTANT: Edit line 25 in this file with your GitHub URL!" -ForegroundColor Red
# git remote remove origin 2>$null
# git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
# git branch -M main
# git push -u origin main

Write-Host "`nDone! Now uncomment lines 25-28 and add your repo URL, then run again." -ForegroundColor Cyan
