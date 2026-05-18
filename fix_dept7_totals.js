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

const numericFields = ['doctors', 'dentists', 'pharmacists', 'physiotherapy', 'veterinarians', 'seniorNursing', 'technicalNursing', 'healthTechnician', 'scientists'];

const collectionsToFix = [
    'medical_professionals_by_category',
    'medical_professionals_by_governorate',
    'total_med_profs_by_category',
    'total_med_profs_by_governorate'
];

async function fixTotals() {
    let totalFixed = 0;

    for (const collectionName of collectionsToFix) {
        console.log(`\n⏳ Checking collection: ${collectionName}...`);
        const snapshot = await db.collection(collectionName).get();
        let fixedInCollection = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            
            // Check if any of the numeric fields exist
            const hasNumericFields = numericFields.some(field => field in data);
            
            if (hasNumericFields) {
                let calculatedTotal = 0;
                for (const field of numericFields) {
                    if (data[field] !== undefined && data[field] !== null) {
                        calculatedTotal += Number(data[field]);
                    }
                }

                // If total is missing, or is zero when calculated is not zero (maybe previously failed)
                // Let's just forcefully update total if it doesn't match
                if (data.total !== calculatedTotal) {
                    await doc.ref.update({ total: calculatedTotal });
                    fixedInCollection++;
                    console.log(`✅ Fixed document ${doc.id}: old total = ${data.total}, new total = ${calculatedTotal}`);
                }
            }
        }
        
        console.log(`🎉 Finished ${collectionName}: Fixed ${fixedInCollection} documents.`);
        totalFixed += fixedInCollection;
    }

    console.log(`\n🚀 All done! Total documents fixed: ${totalFixed}`);
    process.exit(0);
}

fixTotals().catch(console.error);
