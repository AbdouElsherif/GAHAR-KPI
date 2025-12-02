import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// This runs on the server side only and has full admin privileges
function initAdmin() {
    if (!admin.apps.length) {
        try {
            // Get credentials from environment variables
            const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

            if (!privateKey || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PROJECT_ID) {
                console.error('Missing Firebase Admin credentials in environment variables');
                return false;
            }

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
            });

            console.log('Firebase Admin initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase Admin initialization error:', error);
            return false;
        }
    }
    return true;
}

// Export a helper to get Auth that initializes on demand
export function getAdminAuth() {
    const initialized = initAdmin();
    if (!initialized) {
        throw new Error('Firebase Admin could not be initialized. Check server logs for credentials error.');
    }
    return admin.auth();
}

// Export a helper to get Firestore that initializes on demand
export function getAdminDb() {
    const initialized = initAdmin();
    if (!initialized) {
        throw new Error('Firebase Admin could not be initialized.');
    }
    return admin.firestore();
}

export default admin;
