import { NextRequest } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { noStoreJson, securityErrorResponse } from '@/lib/api-response';
import {
    consumeRateLimit,
    isStrongPassword,
    requireSuperAdmin,
    SecurityError,
} from '@/lib/server-security';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const contentLength = Number(request.headers.get('content-length') || '0');
        if (contentLength > 2048) {
            throw new SecurityError('Request body is too large', 413);
        }

        const { token, db } = await requireSuperAdmin(request);
        if (!await consumeRateLimit(db, `password-reset:${token.uid}`, 5, 15 * 60_000)) {
            throw new SecurityError('Too many password reset attempts', 429);
        }

        const body = await request.json().catch(() => {
            throw new SecurityError('Invalid JSON body', 400);
        }) as Record<string, unknown>;
        const userId = body.userId;
        const newPassword = body.newPassword;

        if (typeof userId !== 'string' || !/^[A-Za-z0-9_-]{20,128}$/.test(userId)) {
            throw new SecurityError('Invalid user ID', 400);
        }
        if (!isStrongPassword(newPassword)) {
            throw new SecurityError(
                'Password must be 12-128 characters and include upper, lower, number, and special characters',
                400,
            );
        }
        if (userId === token.uid) {
            throw new SecurityError('Use the change password page for your own account', 400);
        }

        const targetRef = db.collection('users').doc(userId);
        const targetProfile = await targetRef.get();
        if (!targetProfile.exists) {
            throw new SecurityError('User not found', 404);
        }

        const auth = getAdminAuth();
        await auth.getUser(userId).catch(() => {
            throw new SecurityError('Authentication account not found', 404);
        });
        await auth.updateUser(userId, { password: newPassword });
        await targetRef.update({
            mustChangePassword: true,
            passwordResetAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: token.uid,
        });
        await auth.revokeRefreshTokens(userId);

        return noStoreJson({ success: true });
    } catch (error) {
        return securityErrorResponse(error, 'Password reset failed');
    }
}
