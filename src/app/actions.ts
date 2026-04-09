"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isActiveAdminUser } from "@/lib/admin/access";
import { env, isSupabaseConfigured } from "@/lib/env";
import {
  ensureProfileForUser,
  getUsernameSuggestions,
  normalizeUsername,
} from "@/lib/supabase/profile";
import {
  isRefreshTokenNotFoundError,
  isSupabaseAuthCookieName,
} from "@/lib/supabase/auth-utils";

function normalizeHandle(value: string) {
  return normalizeUsername(value);
}

function toNumberOrNull(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toIntegerOrNull(value: FormDataEntryValue | null) {
  const parsed = toNumberOrNull(value);

  if (parsed === null) {
    return null;
  }

  return Math.round(parsed);
}

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

function getErrorCode(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const candidate = error as { code?: unknown };
  return typeof candidate.code === "string" ? candidate.code.toLowerCase() : "";
}

function getErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const candidate = error as { message?: unknown };
  return typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";
}

function mapSignupError(error: unknown) {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);

  if (
    code === "23505" &&
    (message.includes("username") || message.includes("profiles_username_key"))
  ) {
    return "username_taken";
  }

  if (code === "user_already_exists" || message.includes("already registered")) {
    return "user_exists";
  }

  if (code === "weak_password" || message.includes("password")) {
    return "weak_password";
  }

  if (code === "invalid_email" || message.includes("invalid email")) {
    return "invalid_email";
  }

  return "signup_failed";
}

function mapLoginError(error: unknown) {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "email_not_confirmed";
  }

  return "invalid_credentials";
}

function mapOAuthError(error: unknown) {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);

  if (code === "provider_disabled" || message.includes("provider is not enabled")) {
    return "oauth_unavailable";
  }

  return "oauth_failed";
}

function normalizeOAuthSource(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "signup" ? "signup" : "login";
}

function toSafeNextPath(value: FormDataEntryValue | null, fallback: string) {
  const candidate = String(value ?? "").trim();

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  return candidate;
}

function toUsernameConflictQuery(preferredUsername: string, suggestions: string[]) {
  const query = new URLSearchParams({
    error: "username_taken",
    username: preferredUsername,
  });

  if (suggestions.length > 0) {
    query.set("suggestions", suggestions.join(","));
  }

  return query.toString();
}

async function checkUsernameAvailability(preferredUsername: string, seed: string) {
  const adminSupabase = createSupabaseAdminClient();

  if (!adminSupabase) {
    return null;
  }

  const baseCandidates = getUsernameSuggestions(seed || preferredUsername, {
    suffixSeed: preferredUsername,
    limit: 8,
  });

  const numericFallbacks = Array.from({ length: 8 }, (_, index) => {
    return normalizeHandle(`${preferredUsername}_${index + 21}`);
  });

  const candidates = Array.from(
    new Set([preferredUsername, ...baseCandidates, ...numericFallbacks]),
  );

  const { data, error } = await adminSupabase
    .from("profiles")
    .select("username")
    .in("username", candidates)
    .returns<Array<{ username: string }>>();

  if (error) {
    return null;
  }

  const taken = new Set((data ?? []).map((entry) => entry.username));
  const suggestions = candidates
    .filter((candidate) => !taken.has(candidate) && candidate !== preferredUsername)
    .slice(0, 4);

  return {
    available: !taken.has(preferredUsername),
    suggestions,
  };
}

async function clearSupabaseAuthCookies() {
  const cookieStore = await cookies();

  cookieStore.getAll().forEach(({ name }) => {
    if (isSupabaseAuthCookieName(name)) {
      cookieStore.delete(name);
    }
  });
}

async function runAuthCallWithRefreshRecovery<T extends { error: unknown }>(
  execute: (supabase: SupabaseServerClient) => Promise<T>,
) {
  let supabase = await createSupabaseServerClient();

  if (!supabase || !isSupabaseConfigured) {
    return null;
  }

  try {
    const firstResult = await execute(supabase);
    if (!isRefreshTokenNotFoundError(firstResult.error)) {
      return { supabase, result: firstResult };
    }
  } catch (error) {
    if (!isRefreshTokenNotFoundError(error)) {
      throw error;
    }
  }

  await clearSupabaseAuthCookies();
  supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const retriedResult = await execute(supabase);
  return { supabase, result: retriedResult };
}

export async function signInWithEmailAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const requestedNext = toSafeNextPath(formData.get("next"), "/dashboard");

  const authAttempt = await runAuthCallWithRefreshRecovery((supabase) => {
    return supabase.auth.signInWithPassword({ email, password });
  });

  if (authAttempt) {
    const { error } = authAttempt.result;

    if (error) {
      redirect(`/login?error=${mapLoginError(error)}`);
    }

    const {
      data: { user },
    } = await authAttempt.supabase.auth.getUser();

    if (user) {
      const isAdmin = await isActiveAdminUser(authAttempt.supabase, user.id);

      if (isAdmin) {
        const adminDestination = requestedNext.startsWith("/admin") ? requestedNext : "/admin/dashboard";
        redirect(adminDestination);
      }

      const profile = await ensureProfileForUser(authAttempt.supabase, user);

      if (!profile?.onboarding_completed) {
        redirect("/onboarding");
      }

      const userDestination = requestedNext.startsWith("/admin") ? "/dashboard" : requestedNext;
      redirect(userDestination);
    }

    redirect("/login?error=invalid_credentials");
  }

  redirect("/login?error=supabase_unavailable");
}

export async function signUpWithEmailAction(formData: FormData) {
  const fullName = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const requestedUsername = String(formData.get("username") ?? "").trim();
  const normalizedHandle = normalizeHandle(requestedUsername || fullName || email);

  const usernameAvailability = await checkUsernameAvailability(
    normalizedHandle,
    requestedUsername || fullName || email,
  );

  if (usernameAvailability && !usernameAvailability.available) {
    redirect(`/signup?${toUsernameConflictQuery(normalizedHandle, usernameAvailability.suggestions)}`);
  }

  const authAttempt = await runAuthCallWithRefreshRecovery((supabase) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${env.appUrl}/auth/callback?source=signup&next=/onboarding`,
        data: {
          full_name: fullName || null,
          preferred_username: normalizedHandle,
        },
      },
    });
  });

  if (authAttempt) {
    const { data, error } = authAttempt.result;

    if (error) {
      const signupError = mapSignupError(error);

      if (signupError === "username_taken") {
        const usernameAvailability = await checkUsernameAvailability(
          normalizedHandle,
          requestedUsername || fullName || email,
        );
        redirect(`/signup?${toUsernameConflictQuery(normalizedHandle, usernameAvailability?.suggestions ?? [])}`);
      }

      redirect(`/signup?error=${signupError}`);
    }

    if (data.user) {
      if (data.session) {
        await ensureProfileForUser(authAttempt.supabase, data.user, {
          fullName: fullName || undefined,
          username: normalizedHandle,
        });

        redirect("/onboarding");
      }

      const adminSupabase = createSupabaseAdminClient();

      if (adminSupabase) {
        await ensureProfileForUser(adminSupabase, data.user, {
          fullName: fullName || undefined,
          username: normalizedHandle,
        });
      }

      redirect("/login?check-email=1");
    }

    redirect("/signup?error=signup_failed");
  }

  redirect("/signup?error=supabase_unavailable");
}

export async function signInWithGoogleAction(formData: FormData) {
  const source = normalizeOAuthSource(formData.get("source"));
  const authPath = source === "signup" ? "/signup" : "/login";
  const defaultNext = source === "signup" ? "/onboarding" : "/dashboard";
  const nextPath = toSafeNextPath(formData.get("next"), defaultNext);
  const callbackUrl = new URL("/auth/callback", env.appUrl);
  callbackUrl.searchParams.set("source", source);
  callbackUrl.searchParams.set("next", nextPath);

  const authAttempt = await runAuthCallWithRefreshRecovery((supabase) => {
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });
  });

  if (authAttempt) {
    const { data, error } = authAttempt.result;

    if (error) {
      redirect(`${authPath}?error=${mapOAuthError(error)}`);
    }

    if (data.url) {
      redirect(data.url);
    }

    redirect(`${authPath}?error=oauth_redirect_missing`);
  }

  redirect(`${authPath}?error=supabase_unavailable`);
}

export async function completeOnboardingAction(formData: FormData) {
  const cookieStore = await cookies();
  const username = normalizeHandle(String(formData.get("username") ?? "fitness_user"));
  const age = toIntegerOrNull(formData.get("age"));
  const gender = String(formData.get("gender") ?? "").trim() || null;
  const heightCm = toNumberOrNull(formData.get("height"));
  const weightKg = toNumberOrNull(formData.get("weight"));
  const goal = String(formData.get("goal") ?? "").trim() || null;
  const dietType = String(formData.get("dietType") ?? "").trim() || null;
  const activityLevel = String(formData.get("activityLevel") ?? "").trim() || null;
  const injuryNotes = String(formData.get("injuryNotes") ?? "").trim() || null;

  const supabase = await createSupabaseServerClient();

  if (!supabase || !isSupabaseConfigured) {
    redirect("/login?error=supabase_unavailable");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=invalid_credentials");
  }

  const existingProfile = await ensureProfileForUser(supabase, user, { username });
  let finalUsername = username;

  const updatePayload = {
    username: finalUsername,
    age,
    gender,
    height_cm: heightCm,
    weight_kg: weightKg,
    goal,
    diet_type: dietType,
    activity_level: activityLevel,
    injury_notes: injuryNotes,
    onboarding_completed: true,
  };

  let { error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  if (error?.code === "23505") {
    finalUsername = normalizeHandle(`${username}_${user.id.replace(/-/g, "").slice(0, 4)}`);
    ({ error } = await supabase
      .from("profiles")
      .update({ ...updatePayload, username: finalUsername })
      .eq("id", user.id));
  }

  if (!error) {
    cookieStore.set("tusharfitness-onboarding-complete", "true", {
      httpOnly: true,
      path: "/",
    });
    cookieStore.set("tusharfitness-username", finalUsername || existingProfile?.username || username, {
      httpOnly: true,
      path: "/",
    });

    redirect("/dashboard");
  }

  if (error?.code === "23505") {
    const usernameAvailability = await checkUsernameAvailability(finalUsername, username);
    const query = toUsernameConflictQuery(finalUsername, usernameAvailability?.suggestions ?? []);
    redirect(`/onboarding?${query}`);
  }

  redirect("/onboarding?error=save_failed");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  const cookieStore = await cookies();
  cookieStore.delete("tusharfitness-onboarding-complete");
  cookieStore.delete("tusharfitness-username");
  redirect("/login");
}
