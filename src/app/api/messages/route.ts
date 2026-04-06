import { NextResponse } from "next/server";
import { createApiTimer } from "../../../lib/api/perf";
import { enforceRateLimit, resolveRequestIdentity } from "../../../lib/api/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store",
};

export const dynamic = "force-dynamic";

type MessageRow = {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  created_at: string;
};

type SessionOwnershipRow = {
  id: string;
};

function normalizePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(max, parsed);
}

function normalizeCursor(value: string | null) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

async function getAuthedSupabaseContext() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return { supabase, user };
}

function respondJson(
  timer: ReturnType<typeof createApiTimer>,
  body: unknown,
  init?: ResponseInit,
) {
  return timer.finalize(NextResponse.json(body, init));
}

export async function GET(request: Request) {
  const timer = createApiTimer("api.messages.get");
  const context = await timer.measure("auth", () => getAuthedSupabaseContext());

  if (!context) {
    return respondJson(timer, { error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const { supabase, user } = context;
  const identity = resolveRequestIdentity(request);
  const rateLimit = await timer.measure("rate_limit", () =>
    enforceRateLimit({
      namespace: "api-messages-get",
      key: `${user.id}:${identity}`,
      limit: 120,
      window: "1 m",
    }),
  );

  if (!rateLimit.success) {
    return respondJson(
      timer,
      { error: "Too many requests." },
      {
        status: 429,
        headers: {
          ...NO_STORE_HEADERS,
          "Retry-After": String(Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000))),
        },
      },
    );
  }

  const url = new URL(request.url);
  const sessionId = String(url.searchParams.get("sessionId") ?? "").trim();

  if (!sessionId) {
    return respondJson(timer, { error: "sessionId is required." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const limit = normalizePositiveInt(url.searchParams.get("limit"), 20, 100);
  const beforeCursor = normalizeCursor(
    url.searchParams.get("cursor") ?? url.searchParams.get("before"),
  );

  const { data: ownedSession, error: sessionError } = await timer.measure("db_session_auth", async () =>
    await supabase
      .from("ai_chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle<SessionOwnershipRow>(),
  );

  if (sessionError || !ownedSession) {
    return respondJson(timer, { error: "Chat session not found." }, { status: 404, headers: NO_STORE_HEADERS });
  }

  const baseQuery = supabase
    .from("ai_chat_messages")
    .select("id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const effectiveQuery = beforeCursor ? baseQuery.lt("created_at", beforeCursor) : baseQuery;

  const { data: rows, error: messagesError } = await timer.measure("db_messages", async () =>
    await effectiveQuery.returns<MessageRow[]>(),
  );

  if (messagesError) {
    return respondJson(timer, { error: "Could not fetch messages." }, { status: 500, headers: NO_STORE_HEADERS });
  }

  const orderedRows = [...(rows ?? [])].reverse();

  const messages = orderedRows
    .filter((message): message is MessageRow & { role: "assistant" | "user" } =>
      message.role === "assistant" || message.role === "user",
    )
    .map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.created_at,
    }));

  const nextCursor = (rows ?? []).at(-1)?.created_at ?? null;

  return respondJson(
    timer,
    {
      sessionId,
      messages,
      nextCursor,
    },
    { headers: NO_STORE_HEADERS },
  );
}
