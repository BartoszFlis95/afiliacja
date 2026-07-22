import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

type Role = "ADMIN" | "BRAND" | "INFLUENCER";

const ROLE_PREFIXES: Array<{ prefix: string; role: Role }> = [
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/brand", role: "BRAND" },
  { prefix: "/influencer", role: "INFLUENCER" },
];

const DASHBOARD_BY_ROLE: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  BRAND: "/brand/dashboard",
  INFLUENCER: "/influencer/dashboard",
};

// Chronione przez matcher poniżej, ale trzymane jawnie na wypadek
// przyszłego rozszerzenia matchera na szerszy zakres ścieżek.
const PUBLIC_PREFIXES = [
  "/products",
  "/r",
  "/api/auth",
  "/api/track",
  "/api/conversion",
];

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role as Role | undefined;

  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  if (isLoggedIn && isAuthRoute) {
    const dashboard = role ? DASHBOARD_BY_ROLE[role] : "/login";
    return NextResponse.redirect(new URL(dashboard, req.url));
  }

  const matchedSection = ROLE_PREFIXES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (matchedSection) {
    if (!isLoggedIn) {
      const callbackUrl = encodeURIComponent(`${pathname}${search}`);
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${callbackUrl}`, req.url)
      );
    }

    if (role !== matchedSection.role) {
      const dashboard = role ? DASHBOARD_BY_ROLE[role] : "/login";
      return NextResponse.redirect(new URL(dashboard, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/brand/:path*",
    "/influencer/:path*",
    "/login",
    "/register",
  ],
};
