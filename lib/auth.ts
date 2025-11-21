import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface User {
    id: string;
    username: string;
    email: string;
    role: 'super_admin' | 'dept_admin' | 'dept_viewer';
    departmentId?: string;
    departmentName?: string;
}

// Initialize default admin user in Firestore
export async function initializeUsers() {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        
        if (snapshot.empty) {
            // Create default admin user
            const adminAuth = await createUserWithEmailAndPassword(
                auth,
                'admin@gahar.gov.sa',
                'admin123'
            );
            
            await setDoc(doc(db, 'users', adminAuth.user.uid), {
                username: 'admin',
                email: 'admin@gahar.gov.sa',
                role: 'super_admin'
            });
            
            console.log('Default admin user created');
        }
    } catch (error: any) {
        if (error.code !== 'auth/email-already-in-use') {
            console.error('Error initializing users:', error);
        }
    }
}

// User CRUD operations
export async function getUsers(): Promise<User[]> {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as User));
    } catch (error) {
        console.error('Error getting users:', error);
        return [];
    }
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

export async function addUser(userData: {
    username: string;
    email: string;
    password: string;
    role: 'super_admin' | 'dept_admin' | 'dept_viewer';
    departmentId?: string;
    departmentName?: string;
}): Promise<User | null> {
    try {
        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            userData.email,
            userData.password
        );
        
        // Create user profile in Firestore
        const userProfile = {
            username: userData.username,
            email: userData.email,
            role: userData.role,
            departmentId: userData.departmentId,
            departmentName: userData.departmentName
        };
        
        await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
        
        return {
            id: userCredential.user.uid,
            ...userProfile
        };
    } catch (error) {
        console.error('Error adding user:', error);
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
        // You may need Firebase Admin SDK for that
    } catch (error) {
        console.error('Error deleting user:', error);
    }
}

// Authentication
export async function login(email: string, password: string): Promise<User | null> {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userProfile = await getUserProfile(userCredential.user.uid);
        return userProfile;
    } catch (error) {
        console.error('Login error:', error);
        return null;
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
    if (user.role === 'super_admin') return true;
    return user.departmentId === deptId;
}
