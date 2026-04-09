import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isActiveAdminUser } from "@/lib/admin/access";
import { env, isSupabaseConfigured } from "@/lib/env";
import {
  isRefreshTokenNotFoundError,
  isSupabaseAuthCookieName,
} from "@/lib/supabase/auth-utils";

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  request.cookies.getAll().forEach(({ name }) => {
    if (isSupabaseAuthCookieName(name)) {
      request.cookies.delete(name);
      response.cookies.delete(name);
    }
  });
}

function toTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function isAccessActive(params: {
  status: "trialing" | "active" | "past_due" | "canceled" | "expired" | null;
  trialEndAt: string | null;
  currentPeriodEnd: string | null;
  fallbackStartAt: string | null;
}) {
  const { status, trialEndAt, currentPeriodEnd, fallbackStartAt } = params;
  const now = Date.now();
  const trialEndsAt = toTimestamp(trialEndAt);
  const periodEndsAt = toTimestamp(currentPeriodEnd);
  const trialStart = toTimestamp(fallbackStartAt) ?? now;
  const fallbackTrialEnd = trialStart + 7 * 24 * 60 * 60 * 1000;

  if (!status) {
    return fallbackTrialEnd > now;
  }

  if (status === "active") {
    return periodEndsAt ? periodEndsAt > now : true;
  }

  if (status !== "trialing") {
    return false;
  }

  return trialEndsAt ? trialEndsAt > now : true;
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!isSupabaseConfigured) {
    return {
      response,
      user: null,
      isAdmin: false,
      onboardingCompleted: false,
      accessActive: false,
    };
  }

  const supabase = createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      if (isRefreshTokenNotFoundError(error)) {
        clearSupabaseAuthCookies(request, response);
      }

      return {
        response,
        user: null,
        isAdmin: false,
        onboardingCompleted: false,
        accessActive: false,
      };
    }

    if (!user) {
      return {
        response,
        user,
        isAdmin: false,
        onboardingCompleted: false,
        accessActive: false,
      };
    }

    const isAdmin = await isActiveAdminUser(supabase, user.id);

    if (isAdmin) {
      return {
        response,
        user,
        isAdmin,
        onboardingCompleted: true,
        accessActive: true,
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, created_at")
      .eq("id", user.id)
      .maybeSingle<{
        onboarding_completed: boolean | null;
        created_at: string | null;
      }>();

    const { data: activeSubscription } = await supabase
      .from("subscriptions")
      .select("status, trial_end_at, current_period_end")
      .eq("user_id", user.id)
      .in("status", ["trialing", "active"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{
        status: "trialing" | "active" | "past_due" | "canceled" | "expired";
        trial_end_at: string | null;
        current_period_end: string | null;
      }>();

    const onboardingCompleted = Boolean(profile?.onboarding_completed);
    const accessActive = isAccessActive({
      status: activeSubscription?.status ?? null,
      trialEndAt: activeSubscription?.trial_end_at ?? null,
      currentPeriodEnd: activeSubscription?.current_period_end ?? null,
      fallbackStartAt: profile?.created_at ?? user.created_at ?? null,
    });

    return { response, user, isAdmin, onboardingCompleted, accessActive };
  } catch (error) {
    if (isRefreshTokenNotFoundError(error)) {
      clearSupabaseAuthCookies(request, response);
      return {
        response,
        user: null,
        isAdmin: false,
        onboardingCompleted: false,
        accessActive: false,
      };
    }

    throw error;
  }
}
