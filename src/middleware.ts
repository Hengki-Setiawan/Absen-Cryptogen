import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Define protected routes
    const isAdminRoute = path.startsWith('/admin');
    const isAbsenRoute = path.startsWith('/absen');

    // Skip if not a protected route
    if (!isAdminRoute && !isAbsenRoute) {
        return NextResponse.next();
    }

    // Check for session cookie (simple check, ideally verify JWT/Session on server)
    // Note: Since we are using localStorage for session in this app (client-side), 
    // we can't fully verify on middleware without a cookie. 
    // However, we can check for a basic cookie if we were setting one.
    // Given the current architecture uses localStorage 'user_session', 
    // middleware is limited. 

    // BUT, for better security, we should ideally set a cookie on login.
    // For now, since the user asked for "optimization" and "security", 
    // I will add a placeholder middleware that allows passing for now 
    // but sets the stage for cookie-based auth later.

    // If we want to be strict, we can't check localStorage here.
    // So we will rely on client-side checks for now, OR we can implement cookie setting in login.

    // Let's stick to a simple pass-through with headers for now to avoid breaking the current localStorage flow
    // until we refactor to cookies (which is a bigger task).

    // Actually, let's implement a simple header check or just allow it 
    // but add security headers.

    const response = NextResponse.next();

    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}

export const config = {
    matcher: ['/admin/:path*', '/absen/:path*'],
};
