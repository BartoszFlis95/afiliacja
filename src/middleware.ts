import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;

  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  if (isLoggedIn && isAuthRoute) {
    if (role === "BRAND") return NextResponse.redirect(new URL("/brand/dashboard", req.url));
    if (role === "INFLUENCER") return NextResponse.redirect(new URL("/influencer/dashboard", req.url));
    if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  if (!isLoggedIn && pathname.startsWith("/brand")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (!isLoggedIn && pathname.startsWith("/influencer")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (!isLoggedIn && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/login", req.url));
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