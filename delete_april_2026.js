const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!privateKey || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PROJECT_ID) {
    console.error('❌ Missing Firebase Admin credentials in .env.local');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
    })
});

const db = admin.firestore();

async function deleteAprilData() {
    console.log('🔄 Searching for April 2026 data in medical_professionals_by_category...');

    const colRef = db.collection('medical_professionals_by_category');
    const snapshot = await colRef.where('month', '==', '2026-04').get();

    if (snapshot.empty) {
        console.log('ℹ️ No documents found for month 2026-04.');
        return;
    }

    console.log(`🗑️ Found ${snapshot.size} documents for April 2026. Deleting...`);

    const batch = db.batch();
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log('✅ Successfully deleted all April 2026 records from medical_professionals_by_category.');
}

deleteAprilData()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('❌ Error deleting data:', error);
        process.exit(1);
    });
