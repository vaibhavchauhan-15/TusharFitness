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
  "/chat",
];

function getAuthedHomeRoute(params: {
  isAdmin: boolean;
  onboardingCompleted: boolean;
  accessActive: boolean;
}) {
  if (params.isAdmin) {
    return "/admin/dashboard";
  }

  if (!params.onboardingCompleted) {
    return "/onboarding";
  }

  if (!params.accessActive) {
    return "/signup";
  }

  return "/dashboard";
}

function isProtectedRoute(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function toLoginRedirectUrl(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (requestedPath && requestedPath !== "/") {
    loginUrl.searchParams.set("next", requestedPath);
  }

  return loginUrl;
}

export async function middleware(request: NextRequest) {
  const { response, user, isAdmin, onboardingCompleted, accessActive } = await updateSession(request);
  const isAuthed = Boolean(user);
  const pathname = request.nextUrl.pathname;
  const isProtected = isProtectedRoute(pathname);
  const isSignupPage = pathname === "/signup";
  const isOnboardingPage = pathname === "/onboarding";
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (!isAuthed && isProtected) {
    return NextResponse.redirect(toLoginRedirectUrl(request));
  }

  if (!isAuthed) {
    return response;
  }

  if (pathname === "/") {
    const destination = getAuthedHomeRoute({
      isAdmin,
      onboardingCompleted,
      accessActive,
    });
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isOnboardingPage) {
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (onboardingCompleted) {
      const destination = accessActive ? "/dashboard" : "/signup";
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  // Keep /signup open for authenticated users with inactive access so renewal can complete.
  if (isSignupPage) {
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (!onboardingCompleted) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    if (accessActive) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (isProtected && !isAdmin) {
    if (!onboardingCompleted && !isOnboardingPage) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    if (onboardingCompleted && !accessActive && !isSignupPage) {
      return NextResponse.redirect(new URL("/signup", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/dashboard/:path*",
    "/analytics",
    "/analytics/:path*",
    "/bmi-calculator",
    "/bmi-calculator/:path*",
    "/fuel",
    "/fuel/:path*",
    "/settings",
    "/settings/:path*",
    "/workouts/:path*",
    "/profile/:path*",
    "/onboarding",
    "/chat",
    "/chat/:path*",
    "/admin",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
