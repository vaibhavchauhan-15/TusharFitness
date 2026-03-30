import { env } from "@/lib/env";

function getSupabaseProjectRef() {
  if (!env.supabaseUrl) {
    return null;
  }

  try {
    return new URL(env.supabaseUrl).hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
}

export function isSupabaseAuthCookieName(name: string) {
  const projectRef = getSupabaseProjectRef();
  const expectedPrefix = projectRef ? `sb-${projectRef}-` : "sb-";

  if (!name.startsWith(expectedPrefix)) {
    return false;
  }

  return (
    name.includes("auth-token") ||
    name.includes("refresh-token") ||
    name.includes("access-token") ||
    name.includes("code-verifier")
  );
}

export function isRefreshTokenNotFoundError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: unknown; message?: unknown; status?: unknown };
  const code = typeof candidate.code === "string" ? candidate.code.toLowerCase() : "";
  const message = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";

  return code === "refresh_token_not_found" || message.includes("refresh token not found");
}
