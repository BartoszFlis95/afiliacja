import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";

const ROLE_PREFIXES: Record<string, Role> = {
  "/brand": Role.BRAND,
  "/influencer": Role.INFLUENCER,
  "/admin": Role.ADMIN,
};

const DASHBOARD_REDIRECT: Record<Role, string> = {
  BRAND: "/brand/dashboard",
  INFLUENCER: "/influencer/dashboard",
  ADMIN: "/admin/dashboard",
};

const AUTH_ROUTES = ["/login", "/register"];

export default auth((req: NextRequest & { auth: { user?: { role?: Role } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const userRole = session?.user?.role;
  const isLoggedIn = !!session?.user;

  // Zalogowany próbuje wejść na /login lub /register → redirect na dashboard
  if (isLoggedIn && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    const destination = userRole ? DASHBOARD_REDIRECT[userRole] : "/";
    return NextResponse.redirect(new URL(destination, req.url));
  }

  // Sprawdź dopasowanie prefiksu roli
  for (const [prefix, requiredRole] of Object.entries(ROLE_PREFIXES)) {
    if (pathname.startsWith(prefix)) {
      // Niezalogowany → /login
      if (!isLoggedIn) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Zła rola → własny dashboard
      if (userRole !== requiredRole) {
        const destination = userRole ? DASHBOARD_REDIRECT[userRole] : "/login";
        return NextResponse.redirect(new URL(destination, req.url));
      }

      break;
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/brand/:path*",
    "/influencer/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
