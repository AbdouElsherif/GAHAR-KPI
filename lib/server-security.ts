import 'server-only';

import type { DecodedIdToken } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { NextRequest } from 'next/server';
import { getAdminAuth, getAdminDb } from './firebase-admin';

export const USER_ROLES = ['super_admin', 'dept_admin', 'dept_viewer', 'general_viewer'] as const;
export type UserRole = typeof USER_ROLES[number];

export interface ManagedUserInput {
    username: string;
    email: string;
    role: UserRole;
    departmentId?: string | null;
    departmentName?: string | null;
}

export async function requireAuthenticatedUser(request: NextRequest): Promise<{
    token: DecodedIdToken;
    db: Firestore;
}> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new SecurityError('Authentication required', 401);
    }

    const auth = getAdminAuth();
    const token = await auth.verifyIdToken(authHeader.slice('Bearer '.length).trim(), true)
        .catch(() => {
            throw new SecurityError('Invalid or expired authentication token', 401);
        });

    return { token, db: getAdminDb() };
}

export async function requireSuperAdmin(request: NextRequest): Promise<{
    token: DecodedIdToken;
    db: Firestore;
}> {
    const context = await requireAuthenticatedUser(request);
    const profile = await context.db.collection('users').doc(context.token.uid).get();

    if (!profile.exists ||
        profile.data()?.role !== 'super_admin' ||
        profile.data()?.mustChangePassword === true) {
        throw new SecurityError('Super administrator access required', 403);
    }

    return context;
}

export async function consumeRateLimit(
    db: Firestore,
    key: string,
    limit: number,
    windowMs: number,
): Promise<boolean> {
    const safeKey = Buffer.from(key).toString('base64url');
    const ref = db.collection('_securityRateLimits').doc(safeKey);
    const now = Date.now();

    return db.runTransaction(async transaction => {
        const snapshot = await transaction.get(ref);
        const data = snapshot.data();
        const windowStartedAt = typeof data?.windowStartedAt === 'number' ? data.windowStartedAt : 0;
        const count = typeof data?.count === 'number' ? data.count : 0;

        if (!snapshot.exists || now - windowStartedAt >= windowMs) {
            transaction.set(ref, {
                count: 1,
                windowStartedAt: now,
                expiresAt: new Date(now + windowMs * 2),
            });
            return true;
        }

        if (count >= limit) {
            return false;
        }

        transaction.update(ref, { count: count + 1 });
        return true;
    });
}

export function validateManagedUserInput(value: unknown): ManagedUserInput {
    if (!value || typeof value !== 'object') {
        throw new SecurityError('Invalid request body', 400);
    }

    const input = value as Record<string, unknown>;
    const username = typeof input.username === 'string' ? input.username.trim() : '';
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const role = input.role;

    if (username.length < 2 || username.length > 100) {
        throw new SecurityError('Username must be 2-100 characters', 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        throw new SecurityError('Invalid email address', 400);
    }
    if (typeof role !== 'string' || !USER_ROLES.includes(role as UserRole)) {
        throw new SecurityError('Invalid user role', 400);
    }

    const departmentRequired = role === 'dept_admin' || role === 'dept_viewer';
    const departmentId = typeof input.departmentId === 'string' ? input.departmentId.trim() : '';
    const departmentName = typeof input.departmentName === 'string' ? input.departmentName.trim() : '';

    if (departmentRequired && (!/^dept(?:[1-9]|1[01])$/.test(departmentId) || !departmentName)) {
        throw new SecurityError('A valid department is required for this role', 400);
    }

    return {
        username,
        email,
        role: role as UserRole,
        departmentId: departmentRequired ? departmentId : null,
        departmentName: departmentRequired ? departmentName : null,
    };
}

export function isStrongPassword(password: unknown): password is string {
    return typeof password === 'string' &&
        password.length >= 12 &&
        password.length <= 128 &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /\d/.test(password) &&
        /[^A-Za-z0-9]/.test(password);
}

export class SecurityError extends Error {
    constructor(message: string, public readonly status: number) {
        super(message);
    }
}
