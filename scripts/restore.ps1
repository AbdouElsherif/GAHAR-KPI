# ================================================================
# GAHAR KPI - نظام استعادة النسخ الاحتياطية
# Backup Restoration Script
# ================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupZipPath,
    
    [string]$RestorePath = "D:\تطبيقي-restored",
    
    [switch]$RestoreFirebase = $false
)

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "    GAHAR KPI - Restore System v1.0" -ForegroundColor Cyan
Write-Host "    نظام استعادة النسخ الاحتياطية" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من وجود ملف ZIP
if (-not (Test-Path $BackupZipPath)) {
    Write-Host "❌ خطأ: ملف النسخة الاحتياطية غير موجود!" -ForegroundColor Red
    Write-Host "المسار: $BackupZipPath" -ForegroundColor Yellow
    exit 1
}

# ====================
# 1. فك ضغط الملف
# ====================
Write-Host "[1/5] فك ضغط النسخة الاحتياطية..." -ForegroundColor Green

$tempRestoreDir = Join-Path $env:TEMP "gahar-restore-temp"

if (Test-Path $tempRestoreDir) {
    Remove-Item -Path $tempRestoreDir -Recurse -Force
}

try {
    Expand-Archive -Path $BackupZipPath -DestinationPath $tempRestoreDir -Force
    Write-Host "  ✓ تم فك الضغط بنجاح" -ForegroundColor Green
} catch {
    Write-Host "  ❌ خطأ في فك الضغط: $_" -ForegroundColor Red
    exit 1
}

# ====================
# 2. نسخ الكود
# ====================
Write-Host "[2/5] استعادة الكود البرمجي..." -ForegroundColor Green

$codeSource = Join-Path $tempRestoreDir "code"
$codeDest = Join-Path $RestorePath "code"

if (Test-Path $codeDest) {
    Write-Host "  ⚠ تحذير: المجلد موجود بالفعل. سيتم استبداله." -ForegroundColor Yellow
    Remove-Item -Path $codeDest -Recurse -Force
}

Copy-Item -Path $codeSource -Destination $codeDest -Recurse -Force
Write-Host "  ✓ تم استعادة الكود" -ForegroundColor Green

# ====================
# 3. استعادة ملفات .env
# ====================
Write-Host "[3/5] استعادة المتغيرات البيئية..." -ForegroundColor Green

$envSource = Join-Path $tempRestoreDir "environment"
$envFiles = Get-ChildItem -Path $envSource -Filter "*.env*" -ErrorAction SilentlyContinue

foreach ($envFile in $envFiles) {
    Copy-Item -Path $envFile.FullName -Destination $codeDest -Force
    Write-Host "  ✓ استُعيد: $($envFile.Name)" -ForegroundColor Gray
}

# ====================
# 4. تثبيت المكتبات
# ====================
Write-Host "[4/5] تثبيت مكتبات npm..." -ForegroundColor Green
Write-Host "  (قد يستغرق بضع دقائق...)" -ForegroundColor Gray

Set-Location $codeDest

try {
    npm install --silent
    Write-Host "  ✓ تم تثبيت المكتبات بنجاح" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ تحذير: حدث خطأ في npm install" -ForegroundColor Yellow
}

# ====================
# 5. استعادة بيانات Firebase
# ====================
if ($RestoreFirebase) {
    Write-Host "[5/5] استعادة بيانات Firebase..." -ForegroundColor Green
    
    $firebaseDataPath = Join-Path $tempRestoreDir "firebase-data"
    
    if (Test-Path $firebaseDataPath) {
        Write-Host "  📝 ملاحظة: استعادة Firebase تتطلب إعدادات إضافية" -ForegroundColor Yellow
        Write-Host "  راجع ملف BACKUP-INFO.md للتعليمات التفصيلية" -ForegroundColor Yellow
        
        # نسخ ملفات البيانات
        $firebaseDest = Join-Path $codeDest "firebase-restore-data"
        Copy-Item -Path $firebaseDataPath -Destination $firebaseDest -Recurse -Force
        
        Write-Host "  ✓ تم نسخ ملفات Firebase إلى: $firebaseDest" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ لم يتم العثور على بيانات Firebase" -ForegroundColor Yellow
    }
} else {
    Write-Host "[5/5] تم تخطي استعادة Firebase" -ForegroundColor Yellow
}

# ====================
# تنظيف
# ====================
Write-Host ""
Write-Host "تنظيف الملفات المؤقتة..." -ForegroundColor Gray
Remove-Item -Path $tempRestoreDir -Recurse -Force -ErrorAction SilentlyContinue

# ====================
# النتيجة النهائية
# ====================
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "  ✅ تمت استعادة النسخة الاحتياطية بنجاح!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 موقع المشروع المُستعاد: $codeDest" -ForegroundColor Cyan
Write-Host ""
Write-Host "الخطوات التالية:" -ForegroundColor Yellow
Write-Host "  1. راجع ملف .env.local وتأكد من الإعدادات" -ForegroundColor White
Write-Host "  2. شغل المشروع محلياً: npm run dev" -ForegroundColor White
Write-Host "  3. إذا لزم الأمر، استعد بيانات Firebase يدوياً" -ForegroundColor White
Write-Host ""
