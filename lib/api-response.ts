import { NextResponse } from 'next/server';
import { SecurityError } from './server-security';

export function noStoreJson(body: Record<string, unknown>, status = 200) {
    return NextResponse.json(body, {
        status,
        headers: {
            'Cache-Control': 'no-store, max-age=0',
            Pragma: 'no-cache',
        },
    });
}

export function securityErrorResponse(error: unknown, fallback: string) {
    if (error instanceof SecurityError) {
        return noStoreJson({ success: false, error: error.message }, error.status);
    }

    console.error(fallback, error);
    return noStoreJson({ success: false, error: fallback }, 500);
}
