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

async function backupFirestore() {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupDir = path.join(__dirname, 'backups', `firestore-${timestamp}`);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log('🔄 Starting Firestore backup...');

    const collectionsRef = await db.listCollections();
    const collections = collectionsRef.map(col => col.id);
    
    console.log(`📋 Found ${collections.length} collections to backup.`);
    for (const collectionName of collections) {
        console.log(`📦 Backing up collection: ${collectionName}`);

        const snapshot = await db.collection(collectionName).get();
        const data = {};

        snapshot.forEach(doc => {
            data[doc.id] = doc.data();
        });

        const filePath = path.join(backupDir, `${collectionName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        console.log(`✅ Saved ${snapshot.size} documents from ${collectionName}`);
    }

    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📁 Location: ${backupDir}`);
}

backupFirestore()
    .then(() => {
        console.log('\n🎉 All done!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error during backup:', error);
        process.exit(1);
    });
