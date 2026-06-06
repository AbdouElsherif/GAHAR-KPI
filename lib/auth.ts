import {
    browserLocalPersistence,
    browserSessionPersistence,
    onAuthStateChanged,
    setPersistence,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { logger } from './logger';

export interface User {
    id: string;
    username: string;
    email: string;
    role: 'super_admin' | 'dept_admin' | 'dept_viewer' | 'general_viewer';
    departmentId?: string;
    departmentName?: string;
    mustChangePassword?: boolean;
}

interface UserInput {
    username: string;
    email: string;
    password: string;
    role: User['role'];
    departmentId?: string;
    departmentName?: string;
}

async function authenticatedRequest<T = Record<string, unknown>>(
    url: string,
    init: RequestInit = {},
): Promise<T> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Authentication required');

    const idToken = await currentUser.getIdToken();
    const response = await fetch(url, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
            ...init.headers,
        },
        cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data as T;
}

export async function getUserProfile(uid: string): Promise<User | null> {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } as User : null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}

export async function getUsers(): Promise<User[]> {
    const data = await authenticatedRequest<{ users: User[] }>('/api/admin/users/');
    return data.users;
}

export async function addUser(userData: UserInput): Promise<User> {
    const data = await authenticatedRequest<{ user: User }>('/api/admin/users/', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
    return data.user;
}

export async function updateUser(id: string, updates: Partial<User>) {
    await authenticatedRequest(`/api/admin/users/${encodeURIComponent(id)}/`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
}

export async function deleteUser(id: string) {
    await authenticatedRequest(`/api/admin/users/${encodeURIComponent(id)}/`, {
        method: 'DELETE',
    });
}

function generateTemporaryPassword(length = 20): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    const password = ['A', 'a', '2', '!'];
    const randomValues = new Uint32Array(length - password.length);
    crypto.getRandomValues(randomValues);
    password.push(...Array.from(randomValues, value => alphabet[value % alphabet.length]));

    const shuffleValues = new Uint32Array(password.length);
    crypto.getRandomValues(shuffleValues);
    for (let index = password.length - 1; index > 0; index--) {
        const swapIndex = shuffleValues[index] % (index + 1);
        [password[index], password[swapIndex]] = [password[swapIndex], password[index]];
    }

    return password.join('');
}

export async function resetUserPassword(userId: string): Promise<{
    success: boolean;
    error?: string;
    newPassword?: string;
}> {
    try {
        const newPassword = generateTemporaryPassword();
        await authenticatedRequest('/api/reset-password/', {
            method: 'POST',
            body: JSON.stringify({ userId, newPassword }),
        });
        return { success: true, newPassword };
    } catch (error: any) {
        return { success: false, error: error.message || 'Password reset failed' };
    }
}

export async function setRememberMe(remember: boolean): Promise<void> {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
}

export async function login(
    email: string,
    password: string,
    rememberMe = false,
): Promise<User | null> {
    try {
        await setRememberMe(rememberMe);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userProfile = await getUserProfile(userCredential.user.uid);

        if (!userProfile) {
            logger.error('User profile not found for UID:', userCredential.user.uid);
            await signOut(auth);
        }

        return userProfile;
    } catch (error) {
        console.error('Login error:', error);
        return null;
    }
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await authenticatedRequest('/api/change-password/', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
    });
    await signOut(auth);
}

export async function logout() {
    await signOut(auth);
}

export function getCurrentUser(): Promise<User | null> {
    return new Promise(resolve => {
        const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
            resolve(firebaseUser ? await getUserProfile(firebaseUser.uid) : null);
            unsubscribe();
        });
    });
}

export function onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async firebaseUser => {
        callback(firebaseUser ? await getUserProfile(firebaseUser.uid) : null);
    });
}

export function isAuthenticated(): boolean {
    return auth.currentUser !== null;
}

export function canEdit(user: User | null): boolean {
    if (!user || user.mustChangePassword) return false;
    return user.role === 'super_admin' || user.role === 'dept_admin';
}

export function canAccessDepartment(user: User | null, deptId: string): boolean {
    if (!user || user.mustChangePassword) return false;
    if (user.role === 'super_admin' || user.role === 'general_viewer') return true;
    return user.departmentId === deptId;
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
    if (password.length < 12) {
        return { isValid: false, error: 'كلمة المرور يجب أن تكون 12 حرفاً على الأقل' };
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
    if (!/[^A-Za-z0-9]/.test(password)) {
        return { isValid: false, error: 'كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل' };
    }
    return { isValid: true };
}
