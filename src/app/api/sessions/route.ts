import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiTimer } from "../../../lib/api/perf";
import { enforceRateLimit, resolveRequestIdentity } from "../../../lib/api/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store",
};

export const dynamic = "force-dynamic";

const DEFAULT_SESSION_TITLE = "New chat";

type SessionRow = {
  id: string;
  title: string | null;
  created_at: string;
};

type SessionActivityRow = {
  session_id: string;
  created_at: string;
};

type SessionLastMessageRow = {
  created_at: string;
};

const UPDATE_SESSION_SCHEMA = z.object({
  sessionId: z.string().uuid(),
  title: z.string().trim().min(1).max(80),
});

const DELETE_SESSION_SCHEMA = z.object({
  sessionId: z.string().uuid(),
});

function normalizePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(max, parsed);
}

function normalizeNonNegativeInt(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.min(max, parsed);
}

function normalizeTitle(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, 80);
}

function deriveSessionTitle(rawTitle: string | null) {
  const normalizedTitle = normalizeTitle(rawTitle);

  if (normalizedTitle) {
    return normalizedTitle;
  }

  return DEFAULT_SESSION_TITLE;
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
  const timer = createApiTimer("api.sessions.get");
  const context = await timer.measure("auth", () => getAuthedSupabaseContext());

  if (!context) {
    return respondJson(timer, { error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const { supabase, user } = context;
  const identity = resolveRequestIdentity(request);
  const rateLimit = await timer.measure("rate_limit", () =>
    enforceRateLimit({
      namespace: "api-sessions-get",
      key: `${user.id}:${identity}`,
      limit: 90,
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
  const limit = normalizePositiveInt(url.searchParams.get("limit"), 10, 25);
  const offset = normalizeNonNegativeInt(url.searchParams.get("offset"), 0, 5000);
  const rangeEnd = offset + limit - 1;

  const { data: sessions, error: sessionsError } = await timer.measure("db_sessions", async () =>
    await supabase
      .from("ai_chat_sessions")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, rangeEnd)
      .returns<SessionRow[]>(),
  );

  if (sessionsError) {
    return respondJson(timer, { error: "Could not fetch sessions." }, { status: 500, headers: NO_STORE_HEADERS });
  }

  const sessionRows = sessions ?? [];
  const sessionIds = sessionRows.map((session) => session.id);

  const lastActivityMap = new Map<string, string>();

  if (sessionIds.length > 0) {
    const { data: activityRows, error: activityError } = await timer.measure("db_session_activity", async () =>
      await supabase
        .from("ai_chat_messages")
        .select("session_id, created_at")
        .in("session_id", sessionIds)
        .order("created_at", { ascending: false })
        .returns<SessionActivityRow[]>(),
    );

    if (activityError) {
      return respondJson(
        timer,
        { error: "Could not fetch recent chat activity." },
        { status: 500, headers: NO_STORE_HEADERS },
      );
    }

    for (const activity of activityRows ?? []) {
      if (!lastActivityMap.has(activity.session_id)) {
        lastActivityMap.set(activity.session_id, activity.created_at);
      }
    }
  }

  const summarized = sessionRows
    .map((session: SessionRow) => {
      const lastActivityAt = lastActivityMap.get(session.id) ?? session.created_at;

      return {
        id: session.id,
        title: deriveSessionTitle(session.title),
        createdAt: session.created_at,
        lastActivityAt,
      };
    })
    .sort((a, b) => {
      const aTime = Date.parse(a.lastActivityAt) || 0;
      const bTime = Date.parse(b.lastActivityAt) || 0;
      return bTime - aTime;
    });

  const hasMore = summarized.length === limit;
  const nextOffset = hasMore ? offset + summarized.length : null;

  return respondJson(timer, { sessions: summarized, nextOffset, hasMore }, { headers: NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  const timer = createApiTimer("api.sessions.post");
  const context = await timer.measure("auth", () => getAuthedSupabaseContext());

  if (!context) {
    return respondJson(timer, { error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const { supabase, user } = context;
  const identity = resolveRequestIdentity(request);
  const rateLimit = await timer.measure("rate_limit", () =>
    enforceRateLimit({
      namespace: "api-sessions-post",
      key: `${user.id}:${identity}`,
      limit: 30,
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

  let parsedTitle = DEFAULT_SESSION_TITLE;

  try {
    const body = (await request.json()) as { title?: unknown };

    if (typeof body.title === "string" && body.title.trim().length > 0) {
      parsedTitle = body.title.trim().slice(0, 80);
    }
  } catch {
    // Body is optional for creating a new session.
  }

  const { data: createdSession, error: createError } = await timer.measure("db_create", async () =>
    await supabase
      .from("ai_chat_sessions")
      .insert({
        user_id: user.id,
        title: parsedTitle,
      })
      .select("id, title, created_at")
      .single<SessionRow>(),
  );

  if (createError || !createdSession) {
    return respondJson(timer, { error: "Could not create a new chat." }, { status: 500, headers: NO_STORE_HEADERS });
  }

  return respondJson(
    timer,
    {
      session: {
        id: createdSession.id,
        title: deriveSessionTitle(createdSession.title),
        createdAt: createdSession.created_at,
        lastActivityAt: createdSession.created_at,
      },
    },
    { status: 201, headers: NO_STORE_HEADERS },
  );
}

export async function PATCH(request: Request) {
  const timer = createApiTimer("api.sessions.patch");
  const context = await timer.measure("auth", () => getAuthedSupabaseContext());

  if (!context) {
    return respondJson(timer, { error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const { supabase, user } = context;
  const identity = resolveRequestIdentity(request);
  const rateLimit = await timer.measure("rate_limit", () =>
    enforceRateLimit({
      namespace: "api-sessions-patch",
      key: `${user.id}:${identity}`,
      limit: 40,
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

  let parsedBody: z.infer<typeof UPDATE_SESSION_SCHEMA>;

  try {
    const body = await request.json();
    const validated = UPDATE_SESSION_SCHEMA.safeParse(body);

    if (!validated.success) {
      return respondJson(
        timer,
        { error: "Invalid update payload." },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    parsedBody = validated.data;
  } catch {
    return respondJson(timer, { error: "Invalid request body." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const { data: updatedSession, error: updateError } = await timer.measure("db_update", async () =>
    await supabase
      .from("ai_chat_sessions")
      .update({
        title: parsedBody.title,
      })
      .eq("id", parsedBody.sessionId)
      .eq("user_id", user.id)
      .select("id, title, created_at")
      .maybeSingle<SessionRow>(),
  );

  if (updateError) {
    return respondJson(timer, { error: "Could not update chat title." }, { status: 500, headers: NO_STORE_HEADERS });
  }

  if (!updatedSession) {
    return respondJson(timer, { error: "Chat session not found." }, { status: 404, headers: NO_STORE_HEADERS });
  }

  const { data: lastMessage, error: activityError } = await timer.measure("db_last_activity", async () =>
    await supabase
      .from("ai_chat_messages")
      .select("created_at")
      .eq("session_id", updatedSession.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<SessionLastMessageRow>(),
  );

  if (activityError) {
    return respondJson(timer, { error: "Could not fetch chat activity." }, { status: 500, headers: NO_STORE_HEADERS });
  }

  return respondJson(
    timer,
    {
      session: {
        id: updatedSession.id,
        title: deriveSessionTitle(updatedSession.title),
        createdAt: updatedSession.created_at,
        lastActivityAt: lastMessage?.created_at ?? updatedSession.created_at,
      },
    },
    { headers: NO_STORE_HEADERS },
  );
}

export async function DELETE(request: Request) {
  const timer = createApiTimer("api.sessions.delete");
  const context = await timer.measure("auth", () => getAuthedSupabaseContext());

  if (!context) {
    return respondJson(timer, { error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const { supabase, user } = context;
  const identity = resolveRequestIdentity(request);
  const rateLimit = await timer.measure("rate_limit", () =>
    enforceRateLimit({
      namespace: "api-sessions-delete",
      key: `${user.id}:${identity}`,
      limit: 30,
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

  let parsedBody: z.infer<typeof DELETE_SESSION_SCHEMA>;

  try {
    const body = await request.json();
    const validated = DELETE_SESSION_SCHEMA.safeParse(body);

    if (!validated.success) {
      return respondJson(
        timer,
        { error: "Invalid delete payload." },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    parsedBody = validated.data;
  } catch {
    return respondJson(timer, { error: "Invalid request body." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const { data: deletedSession, error: deleteError } = await timer.measure("db_delete", async () =>
    await supabase
      .from("ai_chat_sessions")
      .delete()
      .eq("id", parsedBody.sessionId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle<{ id: string }>(),
  );

  if (deleteError) {
    return respondJson(timer, { error: "Could not delete chat session." }, { status: 500, headers: NO_STORE_HEADERS });
  }

  if (!deletedSession) {
    return respondJson(timer, { error: "Chat session not found." }, { status: 404, headers: NO_STORE_HEADERS });
  }

  return respondJson(
    timer,
    {
      sessionId: deletedSession.id,
    },
    { headers: NO_STORE_HEADERS },
  );
}
