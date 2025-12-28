# Git Push Script - تنفيذ تلقائي
# نفذ هذا الملف بأمر واحد: .\git-push.ps1

Write-Host "=== بدء عملية رفع المشروع على GitHub ===" -ForegroundColor Green

# 1. Reset أي تغييرات سابقة
Write-Host "`n[1/7] إعادة تعيين Git..." -ForegroundColor Yellow
git reset

# 2. إضافة الملفات الأساسية فقط
Write-Host "`n[2/7] إضافة الملفات الأساسية..." -ForegroundColor Yellow
git add app/ components/ lib/ public/
git add package.json package-lock.json tsconfig.json next.config.js tailwind.config.ts postcss.config.mjs
git add firebase.ts firestore.ts firestore.rules .firebaserc firebase.json
git add .gitignore

# 3. إضافة ملفات CSS
Write-Host "`n[3/7] إضافة ملفات التنسيق..." -ForegroundColor Yellow
git add app/globals.css

# 4. Commit
Write-Host "`n[4/7] إنشاء Commit..." -ForegroundColor Yellow
git commit -m "Initial commit: Complete project with 30 components"

# 5. إعادة .firebase
Write-Host "`n[5/7] إعادة مجلد .firebase..." -ForegroundColor Yellow
if (Test-Path "_firebase_temp") {
    Rename-Item _firebase_temp .firebase
    Write-Host "تم إعادة .firebase بنجاح" -ForegroundColor Green
}

# 6. إعداد Remote (عدّل الرابط هنا)
Write-Host "`n[6/7] ربط بـ GitHub..." -ForegroundColor Yellow
$repoUrl = Read-Host "أدخل رابط GitHub Repository (https://github.com/USERNAME/REPO.git)"
git remote remove origin 2>$null
git remote add origin $repoUrl
git branch -M main

# 7. Push
Write-Host "`n[7/7] رفع الكود على GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host "`n=== تم بنجاح! ===" -ForegroundColor Green
Write-Host "المشروع الآن على GitHub: $repoUrl" -ForegroundColor Cyan
