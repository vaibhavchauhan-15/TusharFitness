import { NextResponse } from "next/server";
import { isActiveAdminUser } from "@/lib/admin/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProfileForUser } from "@/lib/supabase/profile";

function normalizeSource(value: string | null) {
  return value === "signup" ? "signup" : "login";
}

function toSafeAppPath(value: string | null, fallback: string) {
  if (!value) {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const source = normalizeSource(requestUrl.searchParams.get("source"));
  const authFallback = source === "signup" ? "/signup" : "/login";
  const defaultNext = source === "signup" ? "/app/onboarding" : "/app/dashboard";
  const requestedNext = toSafeAppPath(requestUrl.searchParams.get("next"), defaultNext);

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(new URL(`${authFallback}?error=supabase_unavailable`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL(`${authFallback}?error=oauth_failed`, request.url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`${authFallback}?error=oauth_failed`, request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL(`${authFallback}?error=oauth_failed`, request.url));
  }

  const profile = await ensureProfileForUser(supabase, user);
  const isAdmin = await isActiveAdminUser(supabase, user.id);

  if (isAdmin) {
    return NextResponse.redirect(new URL("/app/admin/dashboard", request.url));
  }

  const finalNext =
    profile?.onboarding_completed && requestedNext.startsWith("/app/onboarding")
      ? "/app/dashboard"
      : requestedNext;

  return NextResponse.redirect(new URL(finalNext, request.url));
}
