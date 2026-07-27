import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PREFIXES = ["/sign-in", "/onboarding", "/invite", "/api/cron", "/api/push/vapid"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isPublic) {
    return NextResponse.next();
  }

  const session = request.cookies.get("together_demo_session")?.value;
  if (!session) {
    const signIn = request.nextUrl.clone();
    signIn.pathname = "/sign-in";
    if (pathname !== "/") {
      signIn.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Protect all app routes except static assets and Next internals.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
