import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getUsernameSuggestions, normalizeUsername } from "@/lib/supabase/profile";

function toUsernameCandidates(value: string, seed: string) {
  const normalized = normalizeUsername(value);
  const baseSuggestions = getUsernameSuggestions(seed || normalized, {
    suffixSeed: normalized,
    limit: 8,
  });
  const numericFallbacks = Array.from({ length: 8 }, (_, index) => {
    return normalizeUsername(`${normalized}_${index + 21}`);
  });

  return {
    normalized,
    candidates: Array.from(new Set([normalized, ...baseSuggestions, ...numericFallbacks])),
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const value = String(requestUrl.searchParams.get("value") ?? "").trim();
  const seed = String(requestUrl.searchParams.get("seed") ?? value).trim();

  if (!value) {
    return NextResponse.json(
      {
        available: false,
        normalized: "",
        suggestions: [],
        reason: "empty",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const { normalized, candidates } = toUsernameCandidates(value, seed);
  const adminSupabase = createSupabaseAdminClient();

  if (!adminSupabase) {
    return NextResponse.json(
      {
        available: true,
        normalized,
        suggestions: candidates.filter((candidate) => candidate !== normalized).slice(0, 4),
        reason: "service_unavailable",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const { data, error } = await adminSupabase
    .from("profiles")
    .select("username")
    .in("username", candidates)
    .returns<Array<{ username: string }>>();

  if (error) {
    return NextResponse.json(
      {
        available: true,
        normalized,
        suggestions: candidates.filter((candidate) => candidate !== normalized).slice(0, 4),
        reason: "lookup_failed",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const taken = new Set((data ?? []).map((entry) => entry.username));
  const suggestions = candidates
    .filter((candidate) => !taken.has(candidate) && candidate !== normalized)
    .slice(0, 4);

  return NextResponse.json(
    {
      available: !taken.has(normalized),
      normalized,
      suggestions,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
