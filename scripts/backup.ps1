# ================================================================
# GAHAR KPI - Comprehensive Backup System
# ================================================================

param(
    [string]$BackupPath = "D:\Backups\GAHAR-KPI",
    [switch]$SkipFirebase = $false
)

$ErrorActionPreference = "Continue"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "    GAHAR KPI - Backup System v1.0" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Setup paths
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "GAHAR-KPI-Backup_$timestamp"
$tempBackupDir = Join-Path $env:TEMP $backupName
$finalBackupPath = Join-Path $BackupPath "$backupName.zip"

# Ensure backup directory exists
if (-not (Test-Path $BackupPath)) {
    Write-Host "[INFO] Creating backup directory..." -ForegroundColor Yellow
    New-Item -Path $BackupPath -ItemType Directory -Force | Out-Null
}

# Create temp directory
Write-Host "[1/6] Creating temporary backup directory..." -ForegroundColor Green
New-Item -Path $tempBackupDir -ItemType Directory -Force | Out-Null

# ====================
# 1. Copy source code
# ====================
Write-Host "[2/6] Copying source code and files..." -ForegroundColor Green

# Get project root directory relative to this script
# Script is in /scripts, so project root is one level up
$scriptsDir = $PSScriptRoot
$sourceDir = Split-Path $scriptsDir -Parent

Write-Host "  - Project Root: $sourceDir" -ForegroundColor Gray

$codeBackupDir = Join-Path $tempBackupDir "code"

# Copy all files excluding unnecessary folders
$excludeDirs = @("node_modules", ".next", ".git", "dist", "build", ".vercel")

Write-Host "  - Copying project files..." -ForegroundColor Gray

Copy-Item -Path $sourceDir -Destination $codeBackupDir -Recurse -Force -Exclude $excludeDirs

# Remove excluded directories from backup
foreach ($dir in $excludeDirs) {
    $dirPath = Join-Path $codeBackupDir $dir
    if (Test-Path $dirPath) {
        Remove-Item -Path $dirPath -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "  - Code copied successfully" -ForegroundColor Green

# ====================
# 2. Copy .env files
# ====================
Write-Host "[3/6] Copying environment variables (.env)..." -ForegroundColor Green

$envFiles = @(".env.local", ".env", ".env.production")
$envBackupDir = Join-Path $tempBackupDir "environment"
New-Item -Path $envBackupDir -ItemType Directory -Force | Out-Null

foreach ($envFile in $envFiles) {
    $envPath = Join-Path $sourceDir $envFile
    if (Test-Path $envPath) {
        Copy-Item -Path $envPath -Destination $envBackupDir -Force
        Write-Host "  - Copied: $envFile" -ForegroundColor Gray
    }
}

# ====================
# 3. Export Firebase data
# ====================
if (-not $SkipFirebase) {
    Write-Host "[4/6] Exporting Firebase data..." -ForegroundColor Green
    
    $firebaseBackupDir = Join-Path $tempBackupDir "firebase-data"
    New-Item -Path $firebaseBackupDir -ItemType Directory -Force | Out-Null
    
    $nodeScriptPath = Join-Path $sourceDir "scripts\firebase-backup.js"
    
    if (Test-Path $nodeScriptPath) {
        Write-Host "  - Exporting Firestore data..." -ForegroundColor Gray
        Set-Location $sourceDir
        
        try {
            node $nodeScriptPath $firebaseBackupDir 2>&1 | Out-Null
            Write-Host "  - Firebase data exported successfully" -ForegroundColor Green
        } catch {
            Write-Host "  ! Warning: Firebase export failed. Continuing without it." -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ! Warning: Firebase script not found. Skipping." -ForegroundColor Yellow
    }
} else {
    Write-Host "[4/6] Skipped Firebase export (--SkipFirebase)" -ForegroundColor Yellow
}

# ====================
# 4. Create README file
# ====================
Write-Host "[5/6] Creating README file..." -ForegroundColor Green

$readmePath = Join-Path $tempBackupDir "BACKUP-INFO.txt"
$currentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$readmeLines = @(
    "================================================================",
    "GAHAR KPI Application - Backup Information",
    "================================================================",
    "",
    "Backup Date: $currentDate",
    "Backup Name: $backupName",
    "",
    "================================================================",
    "Contents:",
    "================================================================",
    "",
    "1. code/ - Complete application source code",
    "   - Next.js application files",
    "   - All components and pages",
    "   - Configuration files",
    "",
    "2. environment/ - Environment variables",
    "   - .env.local (Firebase configuration)",
    "   - Secret keys and credentials",
    "",
    "3. firebase-data/ - Firebase exports (if available)",
    "   - kpi-data.json - All KPI records",
    "   - users.json - User accounts",
    "   - backup-metadata.json - Export information",
    "",
    "================================================================",
    "Restoration Instructions:",
    "================================================================",
    "",
    "1. Extract this ZIP file",
    "",
    "2. Restore code:",
    "   - Copy contents of 'code' folder to your project directory",
    "   - Run: npm install",
    "",
    "3. Restore environment variables:",
    "   - Copy .env files from 'environment' folder to project root",
    "",
    "4. Run the application:",
    "   - npm run dev (for development)",
    "   - npm run build && npm start (for production)",
    "",
    "5. For Firebase restoration:",
    "   - Use Firebase Console or CLI",
    "   - Import data from firebase-data folder",
    "",
    "================================================================",
    "Security Warning:",
    "================================================================",
    "",
    "This backup contains sensitive information!",
    "- Keep it in a secure location",
    "- Do not share .env files",
    "- Use encryption if storing in cloud",
    "",
    "================================================================",
    "Created by: GAHAR Backup System v1.0",
    "================================================================"
)

$readmeLines | Out-File -FilePath $readmePath -Encoding UTF8

Write-Host "  - README created successfully" -ForegroundColor Green

# ====================
# 5. Compress to ZIP
# ====================
Write-Host "[6/6] Compressing files to ZIP..." -ForegroundColor Green

try {
    Compress-Archive -Path "$tempBackupDir\*" -DestinationPath $finalBackupPath -Force
    
    $zipSize = (Get-Item $finalBackupPath).Length / 1MB
    
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor Green
    Write-Host "  Backup completed successfully!" -ForegroundColor Green
    Write-Host "=====================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Location: $finalBackupPath" -ForegroundColor Cyan
    Write-Host "Size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "Error compressing files: $_" -ForegroundColor Red
    exit 1
}

# ====================
# 6. Cleanup temp files
# ====================
Write-Host "Cleaning up temporary files..." -ForegroundColor Gray
Remove-Item -Path $tempBackupDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Backup process completed!" -ForegroundColor Green
Write-Host ""
