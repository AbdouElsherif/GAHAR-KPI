const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin using environment variables
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!privateKey || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PROJECT_ID) {
    console.error('❌ Missing Firebase Admin credentials in .env.local');
    console.error('Required variables: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY');
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

async function restoreFirestore(backupDir) {
    if (!fs.existsSync(backupDir)) {
        console.error(`❌ Backup directory not found: ${backupDir}`);
        process.exit(1);
    }

    console.log('🔄 Starting Firestore restore...');
    console.log(`📁 From: ${backupDir}\n`);

    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
        const collectionName = file.replace('.json', '');
        console.log(`📦 Restoring collection: ${collectionName}`);

        const filePath = path.join(backupDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const batch = db.batch();
        let count = 0;

        for (const [docId, docData] of Object.entries(data)) {
            const docRef = db.collection(collectionName).doc(docId);
            batch.set(docRef, docData);
            count++;

            // Commit every 500 documents (Firestore batch limit)
            if (count % 500 === 0) {
                await batch.commit();
                console.log(`  ⏳ Committed ${count} documents...`);
            }
        }

        // Commit remaining documents
        if (count % 500 !== 0) {
            await batch.commit();
        }

        console.log(`✅ Restored ${count} documents to ${collectionName}`);
    }

    console.log(`\n✅ Restore completed successfully!`);
}

// Usage: node restore-firestore.js backups/firestore-2025-12-11
const backupDir = process.argv[2];

if (!backupDir) {
    console.error('❌ Please provide backup directory path');
    console.log('Usage: node restore-firestore.js backups/firestore-2025-12-11');
    process.exit(1);
}

restoreFirestore(backupDir)
    .then(() => {
        console.log('\n🎉 All done!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error during restore:', error);
        process.exit(1);
    });
