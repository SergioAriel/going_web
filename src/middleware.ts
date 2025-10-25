import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyIdentityToken } from './utils/tokenVerification';

// This function is the middleware
export async function middleware(request: NextRequest) {
    // 1. Define public routes that should bypass authentication
    const publicRoutes = [
        { method: 'GET', path: '/api/products' },
        { method: 'GET', path: '/api/users' } 
    ];

    for (const route of publicRoutes) {
        if (request.method === route.method && request.nextUrl.pathname.startsWith(route.path)) {
            return NextResponse.next();
        }
    }

    // 2. For all other API routes, perform authentication
    const authorizationHeader = request.headers.get('authorization');

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return NextResponse.json({ message: 'Authorization header is missing or malformed.' }, { status: 401 });
    }

    const token = authorizationHeader.split(' ')[1];

    try {
        // 3. Verify the token
        await verifyIdentityToken(token);
        // If verification is successful, let the request proceed
        return NextResponse.next();
    } catch (error) {
        // If verification fails, return an unauthorized error
        console.error("Auth error in middleware:", error);
        return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 401 });
    }
}

// 4. Configure the middleware to run only on API routes
export const config = {
  matcher: '/api/:path*',
}
