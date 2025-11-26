// ================================================================
// GAHAR KPI - Firebase Data Export Script
// سكريبت تصدير بيانات Firebase
// ================================================================

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// قراءة المتغيرات البيئية
require('dotenv').config({ path: '.env.local' });

// التحقق من وجود Service Account (اختياري للنسخ الاحتياطي البسيط)
// يمكن استخدام Firebase Admin SDK مباشرة

console.log('🔵 بدء تصدير بيانات Firebase...\n');

// الحصول على مسار المخرجات من arguments
const outputDir = process.argv[2] || './firebase-backup';

// التأكد من وجود المجلد
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// تهيئة Firebase Admin
try {
    // محاولة التهيئة باستخدام Application Default Credentials
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
    console.log('✓ تم الاتصال بـ Firebase Admin SDK\n');
} catch (error) {
    console.log('⚠️  تحذير: لم يتم العثور على Service Account');
    console.log('ℹ️  لتصدير كامل، قم بتنزيل Service Account Key من Firebase Console\n');

    // محاولة بديلة: تصدير باستخدام Firebase Client SDK
    console.log('📝 سيتم استخدام التصدير البسيط...\n');

    // إنشاء ملف تعليمات
    const instructionsPath = path.join(outputDir, 'EXPORT-INSTRUCTIONS.txt');
    const instructions = `
تعليمات تصدير البيانات من Firebase
===================================

للحصول على نسخة كاملة من قاعدة البيانات:

1. اذهب إلى Firebase Console
2. اختر مشروعك
3. Firestore Database → Export Data
4. Authentication → Export Users

أو استخدم Firebase CLI:
-------------------------

# تسجيل الدخول
firebase login

# تصدير Firestore
firebase firestore:export gs://YOUR-BUCKET/backup

# تصدير Authentication
firebase auth:export users.json --project ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}

تاريخ إنشاء هذا الملف: ${new Date().toLocaleString('ar-EG')}
`;

    fs.writeFileSync(instructionsPath, instructions, 'utf8');
    console.log(`✓ تم إنشاء ملف التعليمات: ${instructionsPath}\n`);

    process.exit(0);
}

// دالة لتصدير مجموعة من Firestore
async function exportCollection(collectionName) {
    console.log(`📥 تصدير: ${collectionName}...`);

    try {
        const db = admin.firestore();
        const snapshot = await db.collection(collectionName).get();

        const data = [];
        snapshot.forEach(doc => {
            data.push({
                id: doc.id,
                ...doc.data()
            });
        });

        const outputPath = path.join(outputDir, `${collectionName}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');

        console.log(`  ✓ تم تصدير ${data.length} سجل إلى: ${outputPath}`);
        return data.length;
    } catch (error) {
        console.error(`  ❌ خطأ في تصدير ${collectionName}:`, error.message);
        return 0;
    }
}

// دالة لتصدير المستخدمين
async function exportUsers() {
    console.log(`📥 تصدير: المستخدمين (Authentication)...`);

    try {
        const listUsersResult = await admin.auth().listUsers();
        const users = listUsersResult.users.map(user => ({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified,
            disabled: user.disabled,
            metadata: {
                creationTime: user.metadata.creationTime,
                lastSignInTime: user.metadata.lastSignInTime
            },
            customClaims: user.customClaims || {}
        }));

        const outputPath = path.join(outputDir, 'users.json');
        fs.writeFileSync(outputPath, JSON.stringify(users, null, 2), 'utf8');

        console.log(`  ✓ تم تصدير ${users.length} مستخدم إلى: ${outputPath}`);
        return users.length;
    } catch (error) {
        console.error(`  ❌ خطأ في تصدير المستخدمين:`, error.message);
        return 0;
    }
}

// دالة رئيسية للتصدير
async function runBackup() {
    try {
        console.log('====================================');
        console.log('  Firebase Backup Process');
        console.log('====================================\n');

        // تصدير البيانات من Firestore
        const kpiCount = await exportCollection('kpi-data');

        // تصدير المستخدمين
        const usersCount = await exportUsers();

        // إنشاء ملف metadata
        const metadata = {
            backupDate: new Date().toISOString(),
            backupDateArabic: new Date().toLocaleString('ar-EG'),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            collections: {
                'kpi-data': kpiCount,
                'users': usersCount
            },
            totalRecords: kpiCount + usersCount
        };

        const metadataPath = path.join(outputDir, 'backup-metadata.json');
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

        console.log('\n====================================');
        console.log('✅ اكتمل التصدير بنجاح!');
        console.log('====================================');
        console.log(`📊 إجمالي السجلات: ${metadata.totalRecords}`);
        console.log(`📁 الموقع: ${outputDir}\n`);

        process.exit(0);

    } catch (error) {
        console.error('\n❌ خطأ في عملية التصدير:', error);
        process.exit(1);
    }
}

// تشغيل النسخ الاحتياطي
runBackup();
