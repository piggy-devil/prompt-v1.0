import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/profile", "/dashboard", "/prompt-chat"];

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;

  const res = NextResponse.next();

  const session = req.cookies.get("better-auth.session_data")?.value;
  const sessionToken = req.cookies.get("better-auth.session_token")?.value;

  const isLoggedIn = !!(session && sessionToken);

  const isOnProtectedRoute = protectedRoutes.includes(nextUrl.pathname);
  const isOnAuthRoute = nextUrl.pathname.startsWith("/auth");

  if (isOnProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (isOnAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/prompt-chat", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
