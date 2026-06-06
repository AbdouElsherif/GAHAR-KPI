import { NextRequest } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { noStoreJson, securityErrorResponse } from '@/lib/api-response';
import {
    consumeRateLimit,
    isStrongPassword,
    requireAuthenticatedUser,
    SecurityError,
} from '@/lib/server-security';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const { token, db } = await requireAuthenticatedUser(request);
        if (!await consumeRateLimit(db, `password-change:${token.uid}`, 5, 15 * 60_000)) {
            throw new SecurityError('Too many password change attempts', 429);
        }

        const body = await request.json().catch(() => {
            throw new SecurityError('Invalid JSON body', 400);
        }) as Record<string, unknown>;
        const oldPassword = body.oldPassword;
        const newPassword = body.newPassword;

        if (typeof oldPassword !== 'string' || oldPassword.length > 128) {
            throw new SecurityError('Current password is required', 400);
        }
        if (!isStrongPassword(newPassword)) {
            throw new SecurityError(
                'Password must be 12-128 characters and include upper, lower, number, and special characters',
                400,
            );
        }
        if (oldPassword === newPassword) {
            throw new SecurityError('New password must be different from the current password', 400);
        }

        const authUser = await getAdminAuth().getUser(token.uid);
        if (!authUser.email) {
            throw new SecurityError('User email is unavailable', 400);
        }

        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        if (!apiKey) {
            throw new Error('Firebase API key is not configured');
        }

        const verification = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: authUser.email,
                    password: oldPassword,
                    returnSecureToken: true,
                }),
                cache: 'no-store',
            },
        );

        if (!verification.ok) {
            throw new SecurityError('Current password is incorrect', 401);
        }
        const verifiedUser = await verification.json() as { localId?: string };
        if (verifiedUser.localId !== token.uid) {
            throw new SecurityError('Current password is incorrect', 401);
        }

        const auth = getAdminAuth();
        await auth.updateUser(token.uid, { password: newPassword });
        await db.collection('users').doc(token.uid).update({
            mustChangePassword: false,
            passwordChangedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: token.uid,
        });
        await auth.revokeRefreshTokens(token.uid);

        return noStoreJson({ success: true });
    } catch (error) {
        return securityErrorResponse(error, 'Unable to change password');
    }
}
