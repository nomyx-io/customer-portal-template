import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes: Set<string> = new Set(["/dashboard", "/my-portfolio", "/marketplace"]);

export async function middleware(request: NextRequest): Promise<NextResponse> {
  if (request.method === "OPTIONS") {
    return NextResponse.json({});
  }

  const requestUrl = new URL(request.url);
  const path = requestUrl.pathname;

  // Check if it's a protected route
  if (protectedRoutes.has(path)) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token?.accessToken) {
        // Construct the login URL with the current URL as the redirect parameter
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", request.url);

        // Create response with redirect
        const response = NextResponse.redirect(loginUrl);

        // Clear any existing auth cookies
        response.cookies.delete("next-auth.session-token");
        response.cookies.delete("__Secure-next-auth.session-token");

        return response;
      }
    } catch (error) {
      console.error("Middleware error:", error);
      // Handle error case with redirect
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all protected routes
     */
    "/dashboard/:path*",
    "/my-portfolio/:path*",
    "/marketplace/:path*",
  ],
};
