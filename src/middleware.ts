import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';


const protectedRoutes: Set<string> = new Set([
    '/dashboard',
    '/my-portfolio',
    '/marketplace',
  ]);
  

//nextjs already verifies the crf token, so we just check if it exists
const verifyNextAuthCsrfToken = (request: NextRequest): boolean => {

    const baseUrl: string = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "";
    const useSecureCookies = baseUrl.startsWith('https://')
    const csrfCookieName = useSecureCookies
    ? '__Host-next-auth.csrf-token'
    : 'next-auth.csrf-token';

    return !!request.cookies.get(csrfCookieName);
}

export async function middleware(request: NextRequest): Promise<NextResponse> {

    if (request.method === 'OPTIONS') {
        return NextResponse.json({});
    }

    const requestUrl = new URL(request.url);
    const path = requestUrl.pathname;
    
    if(protectedRoutes.has(path)) {

        const token:any = await getToken({ req: request });
        const tokenVerified = token && verifyNextAuthCsrfToken(request);

        if (!tokenVerified) {

            const redirectUrl = new URL('/login', requestUrl.toString());

            redirectUrl.searchParams.append('redirect', requestUrl.toString());

            return NextResponse.redirect(redirectUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
