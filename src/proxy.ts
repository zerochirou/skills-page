import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/dashboard", "/onboarding"];
const AUTH_ROUTES = ["/signin", "/signup"];

const SESSION_COOKIE_NAMES = [
  "__Secure-better-auth.session_token",
  "better-auth.session_token",
  "__Secure-better-auth-session_token",
  "better-auth-session_token",
] as const;

function hasSessionCookie(request: NextRequest): boolean {
  for (const name of SESSION_COOKIE_NAMES) {
    if (request.cookies.get(name)?.value) {
      return true;
    }
  }
  return false;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = hasSessionCookie(request);

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected && !isAuthenticated) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/onboarding",
    "/onboarding/:path*",
    "/signin",
    "/signup",
  ],
};
