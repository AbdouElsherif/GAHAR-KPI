import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    getAuth
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { auth, db, firebaseConfig } from './firebase'; // Import firebaseConfig
import { initializeApp, getApp, getApps, deleteApp } from 'firebase/app';

export interface User {
    id: string;
    username: string;
    email: string;
    role: 'super_admin' | 'dept_admin' | 'dept_viewer' | 'general_viewer';
    departmentId?: string;
    departmentName?: string;
}

export async function getUserProfile(uid: string): Promise<User | null> {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return {
                id: userDoc.id,
                ...userDoc.data()
            } as User;
        }
        return null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

export async function getUsers(): Promise<User[]> {
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as User));
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
    }
}

export async function addUser(userData: {
    username: string;
    email: string;
    password: string;
    role: 'super_admin' | 'dept_admin' | 'dept_viewer' | 'general_viewer';
    departmentId?: string;
    departmentName?: string;
}): Promise<User | null> {
    let secondaryApp = null;
    try {
        // Use a secondary app to create the user to avoid logging out the current user
        const secondaryAppName = 'secondaryApp';

        // Check if app already exists (cleanup might have failed)
        const existingApps = getApps();
        const foundApp = existingApps.find(app => app.name === secondaryAppName);
        if (foundApp) {
            secondaryApp = foundApp;
        } else {
            secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
        }

        const secondaryAuth = getAuth(secondaryApp);

        // Create Firebase Auth user using secondary auth
        const userCredential = await createUserWithEmailAndPassword(
            secondaryAuth,
            userData.email,
            userData.password
        );

        // Create user profile in Firestore (using main db instance which has admin permissions)
        const userProfile = {
            username: userData.username,
            email: userData.email,
            role: userData.role,
            departmentId: userData.departmentId,
            departmentName: userData.departmentName
        };

        await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);

        // Cleanup secondary app
        await signOut(secondaryAuth);
        await deleteApp(secondaryApp);

        return {
            id: userCredential.user.uid,
            ...userProfile
        };
    } catch (error: any) {
        console.error('Error adding user:', error);

        // Clean up if error occurred
        if (secondaryApp) {
            try {
                await deleteApp(secondaryApp);
            } catch (e) {
                console.error('Error deleting secondary app:', e);
            }
        }

        // Handle "email already in use" specifically for recovery scenarios
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('البريد الإلكتروني مستخدم بالفعل');
        }

        return null;
    }
}

export async function updateUser(id: string, updates: Partial<User>) {
    try {
        const userRef = doc(db, 'users', id);
        await updateDoc(userRef, updates);
    } catch (error) {
        console.error('Error updating user:', error);
    }
}

export async function deleteUser(id: string) {
    try {
        await deleteDoc(doc(db, 'users', id));
        // Note: This doesn't delete the Firebase Auth user
        // You may need Firebase Admin SDK for that or a cloud function
    } catch (error) {
        console.error('Error deleting user:', error);
    }
}

export async function resetUserPassword(userId: string, newPassword: string = 'Gahar@' + Math.random().toString(36).slice(-8) + '123'): Promise<{ success: boolean; error?: string; newPassword?: string }> {
    try {
        // Call the API route to reset password using Firebase Admin SDK
        const response = await fetch('/api/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, newPassword }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || 'فشل في إعادة تعيين كلمة المرور'
            };
        }

        return {
            success: true,
            newPassword: data.newPassword,
        };
    } catch (error: any) {
        console.error('Error resetting user password:', error);
        return {
            success: false,
            error: error.message || 'حدث خطأ أثناء الاتصال بالخادم'
        };
    }
}

// Authentication
export async function login(email: string, password: string): Promise<User | null> {
    try {
        if (process.env.NODE_ENV !== 'production') {
            console.log('Attempting login for:', email);
        }
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (process.env.NODE_ENV !== 'production') {
            console.log('Auth successful. UID:', userCredential.user.uid);
        }

        const userProfile = await getUserProfile(userCredential.user.uid);
        if (process.env.NODE_ENV !== 'production') {
            console.log('User profile result:', userProfile);
        }

        if (!userProfile) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('User profile not found for UID:', userCredential.user.uid);
            }
            // Emergency recovery: if it's the admin, try to recreate the profile
            if (email === 'admin@gahar.gov.eg') {

                const adminProfile = {
                    username: 'Admin',
                    email: email,
                    role: 'super_admin' as const
                };
                await setDoc(doc(db, 'users', userCredential.user.uid), adminProfile);
                return { id: userCredential.user.uid, ...adminProfile };
            }
        }

        return userProfile;
    } catch (error) {
        console.error('Login error:', error);
        return null;
    }
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No user logged in');

    const credential = EmailAuthProvider.credential(user.email, oldPassword);

    try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
    } catch (error: any) {
        console.error('Change password error:', error);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error('كلمة المرور القديمة غير صحيحة');
        } else if (error.code === 'auth/weak-password') {
            throw new Error('كلمة المرور الجديدة ضعيفة جداً');
        } else {
            throw new Error('حدث خطأ أثناء تغيير كلمة المرور');
        }
    }
}

export async function logout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Logout error:', error);
    }
}

export function getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userProfile = await getUserProfile(firebaseUser.uid);
                resolve(userProfile);
            } else {
                resolve(null);
            }
            unsubscribe();
        });
    });
}

export function onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userProfile = await getUserProfile(firebaseUser.uid);
            callback(userProfile);
        } else {
            callback(null);
        }
    });
}

export function isAuthenticated(): boolean {
    return auth.currentUser !== null;
}

export function canEdit(user: User | null): boolean {
    if (!user) return false;
    return user.role === 'super_admin' || user.role === 'dept_admin';
}

export function canAccessDepartment(user: User | null, deptId: string): boolean {
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'general_viewer') return true;
    return user.departmentId === deptId;
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
    if (password.length < 6) {
        return { isValid: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
    }
    if (!/\d/.test(password)) {
        return { isValid: false, error: 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل' };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, error: 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل' };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, error: 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل' };
    }
    return { isValid: true };
}

export async function initializeUsers() {
    try {
        // Check if super admin exists in Firestore
        const adminEmail = 'admin@gahar.gov.eg';
        const q = query(collection(db, 'users'), where('email', '==', adminEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {


            try {
                // Try to create the user (Auth + Firestore)
                await addUser({
                    username: 'Admin',
                    email: adminEmail,
                    password: 'admin123',
                    role: 'super_admin'
                });

            } catch (error: any) {
                // If Auth user already exists but Firestore profile is missing
                if (error.message === 'البريد الإلكتروني مستخدم بالفعل') {
                    // Admin Auth exists but Firestore profile missing
                    // The login function has emergency recovery logic
                } else {
                    console.error('Error creating admin:', error);
                }
            }
        }
    } catch (error) {
        console.error('Error initializing users:', error);
    }
}
