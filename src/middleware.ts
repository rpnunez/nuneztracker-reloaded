import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const OPEN = new Set(["/login", "/signup", "/pending"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/auth")) return NextResponse.next();
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/sw.js")
  ) {
    return NextResponse.next();
  }
  const session = request.cookies.get("nt_session")?.value;
  const isOpen = OPEN.has(pathname);
  if (!session && !isOpen && !pathname.startsWith("/api/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
