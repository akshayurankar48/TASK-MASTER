import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root to /login for unauthenticated first visit
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // All other routes pass through — client-side auth guard in
  // dashboard layout handles redirects using Zustand (localStorage)
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
