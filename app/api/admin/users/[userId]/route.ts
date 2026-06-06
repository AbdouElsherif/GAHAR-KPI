import { NextRequest } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { noStoreJson, securityErrorResponse } from '@/lib/api-response';
import {
    consumeRateLimit,
    requireSuperAdmin,
    SecurityError,
    validateManagedUserInput,
} from '@/lib/server-security';
import { getAdminAuth } from '@/lib/firebase-admin';

interface RouteContext {
    params: Promise<{ userId: string }>;
}

function validateUserId(userId: string) {
    if (!/^[A-Za-z0-9_-]{20,128}$/.test(userId)) {
        throw new SecurityError('Invalid user ID', 400);
    }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { userId } = await context.params;
        validateUserId(userId);

        const { token, db } = await requireSuperAdmin(request);
        if (!await consumeRateLimit(db, `admin-users:update:${token.uid}`, 40, 15 * 60_000)) {
            throw new SecurityError('Too many user update attempts', 429);
        }

        const body = await request.json().catch(() => {
            throw new SecurityError('Invalid JSON body', 400);
        });
        const input = validateManagedUserInput(body);
        const userRef = db.collection('users').doc(userId);
        const existing = await userRef.get();

        if (!existing.exists) {
            throw new SecurityError('User not found', 404);
        }
        if (userId === token.uid && input.role !== 'super_admin') {
            throw new SecurityError('You cannot remove your own super administrator role', 400);
        }

        const auth = getAdminAuth();
        const previousAuthUser = await auth.getUser(userId);
        await auth.updateUser(userId, {
            email: input.email,
            displayName: input.username,
        });

        try {
            await userRef.update({
                ...input,
                updatedAt: FieldValue.serverTimestamp(),
                updatedBy: token.uid,
            });
        } catch (error) {
            await auth.updateUser(userId, {
                email: previousAuthUser.email,
                displayName: previousAuthUser.displayName,
            }).catch(rollbackError => console.error('Failed to roll back Auth update', rollbackError));
            throw error;
        }

        return noStoreJson({ success: true });
    } catch (error: any) {
        if (error?.code === 'auth/email-already-exists') {
            return noStoreJson({ success: false, error: 'Email address is already in use' }, 409);
        }
        return securityErrorResponse(error, 'Unable to update user');
    }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const { userId } = await context.params;
        validateUserId(userId);

        const { token, db } = await requireSuperAdmin(request);
        if (!await consumeRateLimit(db, `admin-users:delete:${token.uid}`, 20, 15 * 60_000)) {
            throw new SecurityError('Too many user deletion attempts', 429);
        }
        if (userId === token.uid) {
            throw new SecurityError('You cannot delete your own account', 400);
        }

        const userRef = db.collection('users').doc(userId);
        const profile = await userRef.get();
        if (!profile.exists) {
            throw new SecurityError('User not found', 404);
        }

        if (profile.data()?.role === 'super_admin') {
            const superAdmins = await db.collection('users').where('role', '==', 'super_admin').limit(2).get();
            if (superAdmins.size <= 1) {
                throw new SecurityError('The last super administrator cannot be deleted', 400);
            }
        }

        await getAdminAuth().deleteUser(userId);
        await userRef.delete();

        return noStoreJson({ success: true });
    } catch (error: any) {
        if (error?.code === 'auth/user-not-found') {
            return noStoreJson({ success: false, error: 'Authentication account not found' }, 404);
        }
        return securityErrorResponse(error, 'Unable to delete user');
    }
}
