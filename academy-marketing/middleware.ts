import { NextRequest, NextResponse } from "next/server";

const CANONICAL_HOST = "academytn.com";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  // Redirect app subdomain (member portal not yet deployed)
  if (host === "app.academytn.com") {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.pathname = "/";
    return NextResponse.redirect(url, 301);
  }

  // Redirect non-canonical domains (e.g. cspringsacademy.com) to the canonical domain
  if (host && !host.includes(CANONICAL_HOST) && !host.includes("vercel.app") && !host.includes("localhost")) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|images/).*)",
};
