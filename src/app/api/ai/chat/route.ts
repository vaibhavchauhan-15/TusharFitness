import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";
import { createApiTimer } from "@/lib/api/perf";
import { enforceRateLimit, resolveRequestIdentity } from "@/lib/api/rate-limit";
import { env, isGroqConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store",
};

const REQUEST_SCHEMA = z.object({
  sessionId: z.string().uuid().optional().nullable(),
  message: z.string().trim().min(1).max(4000),
});

const CONTEXT_HISTORY_LIMIT = 10;

const SYSTEM_PROMPT = `You are TusharFitness AI Coach for a fitness SaaS app.
Provide practical, safe, and encouraging coaching about workouts, recovery, mobility, nutrition, sleep, and consistency.

Output format (mandatory):
- Always respond with clean Markdown, not a plain text wall.
- Use headings (##, ###), bullet lists, and numbered steps when helpful.
- Use **bold** to highlight key actions.
- Use tables for structured plans, comparisons, or meal/workout breakdowns.
- Use fenced code blocks only when sharing templates, formulas, or code-like content.
- Keep spacing clean (single blank line between sections, avoid excessive empty lines).
- Use emojis sparingly (0-2 max) only when they improve clarity.
- Do not output raw HTML.

Quality rules:
- Keep answers concise, structured, and actionable.
- Ask 1 short clarifying question when needed.

Safety rules:
- If medical red flags appear (severe pain, chest pain, breathing issues, fainting, trauma), advise immediate professional care.
- Do not provide diagnosis, prescriptions, or unsafe extreme plans.
- Use plain language and avoid hype.`;

export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  title: string | null;
  created_at: string;
};

type MessageRow = {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  created_at: string;
};

type SseSend = (event: string, payload: unknown) => void;

function deriveSessionTitle(rawMessage: string) {
  const collapsed = rawMessage.replace(/\s+/g, " ").trim();

  if (!collapsed) {
    return "New chat";
  }

  return collapsed.slice(0, 80);
}

function cleanAssistantResponseText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[\t ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeAssistantContent(value: unknown) {
  if (typeof value === "string") {
    const trimmed = cleanAssistantResponseText(value);
    return trimmed.length > 0 ? trimmed : "I can help with training, recovery, and nutrition. Could you share more details?";
  }

  if (Array.isArray(value)) {
    const combined = value
      .map((part) => {
        if (!part || typeof part !== "object") {
          return "";
        }

        const candidate = part as { type?: unknown; text?: unknown };
        if (candidate.type === "text" && typeof candidate.text === "string") {
          return candidate.text;
        }

        return "";
      })
      .filter((chunk) => chunk.length > 0)
      .join("\n");

    const trimmed = cleanAssistantResponseText(combined);

    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return "I can help with training, recovery, and nutrition. Could you share more details?";
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

function toPublicSession(session: SessionRow, lastActivityAt: string) {
  return {
    id: session.id,
    title: String(session.title ?? "New chat").trim() || "New chat",
    createdAt: session.created_at,
    lastActivityAt,
  };
}

function toPublicMessage(message: MessageRow) {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.created_at,
  };
}

function createSseStream(onStart: (send: SseSend) => Promise<void>) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const send: SseSend = (event, payload) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`),
        );
      };

      try {
        await onStart(send);
      } catch {
        send("error", { error: "Streaming failed." });
      } finally {
        controller.close();
      }
    },
  });
}

export async function POST(request: Request) {
  const timer = createApiTimer("api.ai.chat.post");
  const context = await timer.measure("auth", () => getAuthedSupabaseContext());

  if (!context) {
    return respondJson(timer, { error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  if (!isGroqConfigured || !env.groqApiKey) {
    return respondJson(
      timer,
      { error: "AI assistant is currently unavailable. Please try again later." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  const { supabase, user } = context;
  const identity = resolveRequestIdentity(request);

  const rateLimit = await timer.measure("rate_limit", () =>
    enforceRateLimit({
      namespace: "api-ai-chat-post",
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

  let parsedBody: z.infer<typeof REQUEST_SCHEMA>;

  try {
    const body = await request.json();
    const validated = REQUEST_SCHEMA.safeParse(body);

    if (!validated.success) {
      return respondJson(
        timer,
        { error: "Invalid chat payload." },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    parsedBody = validated.data;
  } catch {
    return respondJson(timer, { error: "Invalid request body." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const normalizedSessionId = parsedBody.sessionId ? parsedBody.sessionId.trim() : null;
  const userMessageContent = parsedBody.message.trim();

  let session: SessionRow | null = null;

  if (normalizedSessionId) {
    const { data: existingSession, error: existingSessionError } = await timer.measure("db_session_lookup", async () =>
      await supabase
        .from("ai_chat_sessions")
        .select("id, title, created_at")
        .eq("id", normalizedSessionId)
        .eq("user_id", user.id)
        .maybeSingle<SessionRow>(),
    );

    if (existingSessionError || !existingSession) {
      return respondJson(timer, { error: "Chat session not found." }, { status: 404, headers: NO_STORE_HEADERS });
    }

    session = existingSession;
  } else {
    const { data: createdSession, error: createSessionError } = await timer.measure("db_session_create", async () =>
      await supabase
        .from("ai_chat_sessions")
        .insert({
          user_id: user.id,
          title: deriveSessionTitle(userMessageContent),
        })
        .select("id, title, created_at")
        .single<SessionRow>(),
    );

    if (createSessionError || !createdSession) {
      return respondJson(timer, { error: "Could not create chat session." }, { status: 500, headers: NO_STORE_HEADERS });
    }

    session = createdSession;
  }

  const userMessagePromise = timer.measure("db_user_message", async () =>
    await supabase
      .from("ai_chat_messages")
      .insert({
        session_id: session.id,
        role: "user",
        content: userMessageContent,
      })
      .select("id, role, content, created_at")
      .single<MessageRow>(),
  );

  const contextPromise = timer.measure("db_context", async () =>
    await supabase
      .from("ai_chat_messages")
      .select("id, role, content, created_at")
      .eq("session_id", session.id)
      .order("created_at", { ascending: false })
      .limit(CONTEXT_HISTORY_LIMIT)
      .returns<MessageRow[]>(),
  );

  const [{ data: createdUserMessage, error: userMessageError }, { data: contextRows, error: contextError }] = await Promise.all([
    userMessagePromise,
    contextPromise,
  ]);

  if (userMessageError || !createdUserMessage) {
    return respondJson(timer, { error: "Could not store user message." }, { status: 500, headers: NO_STORE_HEADERS });
  }

  if (contextError) {
    return respondJson(timer, { error: "Could not load chat context." }, { status: 500, headers: NO_STORE_HEADERS });
  }

  const contextMessages = [...(contextRows ?? [])]
    .reverse()
    .filter((message) => message.id !== createdUserMessage.id)
    .filter((message) => message.role === "assistant" || message.role === "user")
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

  contextMessages.push({
    role: "user",
    content: createdUserMessage.content,
  });

  const groqClient = new Groq({
    apiKey: env.groqApiKey,
    timeout: 20_000,
    maxRetries: 1,
  });

  const stream = createSseStream(async (send) => {
    send("session", {
      session: toPublicSession(session, createdUserMessage.created_at),
      userMessage: toPublicMessage(createdUserMessage),
    });

    let assistantStreamText = "";

    try {
      const completionStream = await timer.measure("groq_stream", async () =>
        await groqClient.chat.completions.create({
          model: env.groqModel,
          temperature: 0.35,
          max_completion_tokens: 700,
          stream: true,
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            ...contextMessages,
          ],
        }, {
          signal: request.signal,
        }),
      );

      for await (const chunk of completionStream) {
        if (request.signal.aborted) {
          break;
        }

        const contentDelta = chunk.choices[0]?.delta?.content;

        if (typeof contentDelta === "string" && contentDelta.length > 0) {
          assistantStreamText += contentDelta;
          send("token", { text: contentDelta });
        }
      }
    } catch {
      send("error", {
        error: "AI service is temporarily unavailable. Please try again.",
      });
      return;
    }

    const assistantText = normalizeAssistantContent(assistantStreamText);

    if (request.signal.aborted && assistantStreamText.trim().length === 0) {
      return;
    }

    const { data: createdAssistantMessage, error: assistantMessageError } = await timer.measure(
      "db_assistant_message",
      async () =>
        await supabase
          .from("ai_chat_messages")
          .insert({
            session_id: session.id,
            role: "assistant",
            content: assistantText,
          })
          .select("id, role, content, created_at")
          .single<MessageRow>(),
    );

    if (assistantMessageError || !createdAssistantMessage) {
      send("error", { error: "Could not store assistant response." });
      return;
    }

    if (request.signal.aborted) {
      return;
    }

    send("done", {
      session: toPublicSession(session, createdAssistantMessage.created_at),
      assistantMessage: toPublicMessage(createdAssistantMessage),
    });
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...NO_STORE_HEADERS,
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "X-Route-Name": "api.ai.chat.post",
    },
  });
}
