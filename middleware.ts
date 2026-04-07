import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const protectedPrefixes = [
  "/dashboard",
  "/analytics",
  "/bmi-calculator",
  "/fuel",
  "/settings",
  "/workouts",
  "/profile",
  "/onboarding",
  "/admin",
  "/app",
];

function isProtectedRoute(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
  const { response, user, isAdmin } = await updateSession(request);
  const isAuthed = Boolean(user);
  const pathname = request.nextUrl.pathname;
  const isProtected = isProtectedRoute(pathname);
  const isLoginPage = pathname === "/login";
  const isSignupPage = pathname === "/signup";

  if (isProtected && !isAuthed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoginPage && isAuthed) {
    const targetPath = isAdmin ? "/admin/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  // Signed-in non-admin users may still need /signup for inactive access or renewal flows.
  if (isSignupPage && isAuthed && isAdmin) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/app",
    "/app/:path*",
    "/dashboard",
    "/analytics",
    "/bmi-calculator",
    "/fuel",
    "/settings",
    "/workouts/:path*",
    "/profile/:path*",
    "/onboarding",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
