"use client";

import { useEffect, useMemo, useState } from "react";
import { signInWithGoogleAction, signUpWithEmailAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

type SignupFormProps = {
  initialUsername: string;
  initialSuggestions: string[];
};

type UsernameCheckPayload = {
  available: boolean;
  normalized: string;
  suggestions: string[];
  reason?: "empty" | "service_unavailable" | "lookup_failed";
};

type UsernameCheckState = {
  status: "idle" | "checking" | "available" | "taken" | "soft-warning";
  message: string | null;
  suggestions: string[];
};

function normalizeUsernameDraft(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);

  if (!normalized) {
    return "";
  }

  return normalized;
}

function toUsernameFromName(name: string) {
  const draft = normalizeUsernameDraft(name);
  return draft || "fitness_user";
}

export function SignupForm({ initialUsername, initialSuggestions }: SignupFormProps) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState(normalizeUsernameDraft(initialUsername));
  const [usernameTouched, setUsernameTouched] = useState(Boolean(initialUsername));
  const [usernameState, setUsernameState] = useState<UsernameCheckState>({
    status: "idle",
    message: "Use 3-20 characters: lowercase letters, numbers, and underscore.",
    suggestions: initialSuggestions,
  });

  useEffect(() => {
    if (!username || username.length < 3) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setUsernameState((previous) => ({
          ...previous,
          status: "checking",
          message: "Checking username availability...",
        }));

        const query = new URLSearchParams({
          value: username,
          seed: fullName || username,
        });

        const response = await fetch(`/api/username/check?${query.toString()}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          setUsernameState({
            status: "soft-warning",
            message: "Could not check username live. You can still continue and we will validate on submit.",
            suggestions: [],
          });
          return;
        }

        const payload = (await response.json()) as UsernameCheckPayload;
        const normalized = normalizeUsernameDraft(payload.normalized || username);

        if (normalized && normalized !== username) {
          setUsername(normalized);
          return;
        }

        if (payload.reason === "service_unavailable" || payload.reason === "lookup_failed") {
          setUsernameState({
            status: "soft-warning",
            message: "Realtime check is currently limited. We will validate this username on submit.",
            suggestions: payload.suggestions ?? [],
          });
          return;
        }

        if (payload.available) {
          setUsernameState({
            status: "available",
            message: `${normalized} is available.`,
            suggestions: payload.suggestions ?? [],
          });
          return;
        }

        setUsernameState({
          status: "taken",
          message: `${normalized} is already taken. Pick one of the suggested options.`,
          suggestions: payload.suggestions ?? [],
        });
      } catch {
        setUsernameState({
          status: "soft-warning",
          message: "Username check is temporarily unavailable. Final validation happens on submit.",
          suggestions: [],
        });
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fullName, initialSuggestions, username]);

  const effectiveUsernameState =
    username.length < 3
      ? {
          status: "idle" as const,
          message: "Use 3-20 characters: lowercase letters, numbers, and underscore.",
          suggestions: initialSuggestions,
        }
      : usernameState;

  const statusClassName = useMemo(() => {
    if (effectiveUsernameState.status === "available") {
      return "text-emerald-600 dark:text-emerald-300";
    }

    if (effectiveUsernameState.status === "taken") {
      return "text-red-600 dark:text-red-300";
    }

    if (effectiveUsernameState.status === "checking") {
      return "text-[var(--muted-foreground)]";
    }

    return "text-[var(--muted-foreground)]";
  }, [effectiveUsernameState.status]);

  return (
    <>
      <form className="space-y-4" action={signUpWithEmailAction}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="signup-name" className="text-sm font-medium">
              Full name
            </label>
            <Input
              id="signup-name"
              name="name"
              value={fullName}
              onChange={(event) => {
                const nextName = event.target.value;
                setFullName(nextName);

                if (!usernameTouched) {
                  setUsername(toUsernameFromName(nextName));
                }
              }}
              placeholder="Your name"
              autoComplete="name"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="signup-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="signup-email"
              name="email"
              type="email"
              placeholder="you@tusharfitness.app"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-username" className="text-sm font-medium">
            Username
          </label>
          <Input
            id="signup-username"
            name="username"
            value={username}
            onChange={(event) => {
              setUsernameTouched(true);
              setUsername(normalizeUsernameDraft(event.target.value));
            }}
            placeholder="tusharfitness_prime"
            autoComplete="username"
            minLength={3}
            maxLength={20}
            pattern="[a-z0-9_]{3,20}"
            aria-invalid={effectiveUsernameState.status === "taken"}
            required
          />
          {effectiveUsernameState.message ? (
            <p aria-live="polite" className={`text-xs ${statusClassName}`}>
              {effectiveUsernameState.message}
            </p>
          ) : null}
          {effectiveUsernameState.suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {effectiveUsernameState.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setUsernameTouched(true);
                    setUsername(suggestion);
                  }}
                  className="rounded-full border border-(--card-border) bg-(--surface-strong) px-3 py-1 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="signup-password"
            name="password"
            type="password"
            placeholder="Create a secure password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <SubmitButton pendingLabel="Creating account..." className="w-full">
          Create account
        </SubmitButton>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <span className="h-px flex-1 bg-(--card-border)" />
        <span>or continue with</span>
        <span className="h-px flex-1 bg-(--card-border)" />
      </div>

      <form action={signInWithGoogleAction}>
        <input type="hidden" name="source" value="signup" />
        <input type="hidden" name="next" value="/app/onboarding" />
        <Button type="submit" variant="outline" className="w-full">
          Sign up with Google
        </Button>
      </form>
    </>
  );
}
