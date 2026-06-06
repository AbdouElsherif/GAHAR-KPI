import { NextRequest } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { noStoreJson, securityErrorResponse } from '@/lib/api-response';
import {
    consumeRateLimit,
    isStrongPassword,
    requireSuperAdmin,
    SecurityError,
    validateManagedUserInput,
} from '@/lib/server-security';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        const { token, db } = await requireSuperAdmin(request);
        if (!await consumeRateLimit(db, `admin-users:list:${token.uid}`, 60, 60_000)) {
            throw new SecurityError('Too many requests', 429);
        }

        const snapshot = await db.collection('users').orderBy('username').get();
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return noStoreJson({ success: true, users });
    } catch (error) {
        return securityErrorResponse(error, 'Unable to load users');
    }
}

export async function POST(request: NextRequest) {
    let createdUid: string | null = null;

    try {
        const { token, db } = await requireSuperAdmin(request);
        if (!await consumeRateLimit(db, `admin-users:create:${token.uid}`, 20, 15 * 60_000)) {
            throw new SecurityError('Too many user creation attempts', 429);
        }

        const body = await request.json().catch(() => {
            throw new SecurityError('Invalid JSON body', 400);
        });
        const input = validateManagedUserInput(body);
        const password = (body as Record<string, unknown>).password;

        if (!isStrongPassword(password)) {
            throw new SecurityError(
                'Password must be 12-128 characters and include upper, lower, number, and special characters',
                400,
            );
        }

        const auth = getAdminAuth();
        const authUser = await auth.createUser({
            email: input.email,
            password,
            displayName: input.username,
            emailVerified: false,
        });
        createdUid = authUser.uid;

        const profile = {
            ...input,
            mustChangePassword: true,
            createdAt: FieldValue.serverTimestamp(),
            createdBy: token.uid,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: token.uid,
        };
        await db.collection('users').doc(authUser.uid).set(profile);

        return noStoreJson({
            success: true,
            user: {
                id: authUser.uid,
                ...input,
                mustChangePassword: true,
            },
        }, 201);
    } catch (error: any) {
        if (createdUid) {
            await getAdminAuth().deleteUser(createdUid).catch(cleanupError => {
                console.error('Failed to roll back user creation', cleanupError);
            });
        }
        if (error?.code === 'auth/email-already-exists') {
            return noStoreJson({ success: false, error: 'Email address is already in use' }, 409);
        }
        return securityErrorResponse(error, 'Unable to create user');
    }
}
