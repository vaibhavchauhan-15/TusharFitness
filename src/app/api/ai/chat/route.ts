import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { env, isGroqConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store",
};

export const dynamic = "force-dynamic";

type Payload = {
  sessionId?: string;
  messages: { role: "assistant" | "user"; content: string }[];
};

const systemPrompt = `You are TusharFitness AI, a supportive fitness and nutrition guide for Indian users.

Give practical workout, recovery, diet, and habit advice.
Never diagnose injuries or act like a doctor.
For urgent or serious symptoms, advise the user to contact a licensed medical professional.

Formatting requirements:
- Always return clean GitHub-flavored Markdown.
- Use headings for major sections.
- Use bullet lists or numbered lists for steps and checklists.
- Use tables when comparing options.
- Use bold for key actions and warnings.
- Use fenced code blocks (with language tags) only when code or JSON is needed.
- Keep spacing readable with blank lines between sections.
- Never return compact run-on text where multiple list items are on one line.
- If providing structured data, format it as readable markdown rather than raw minified JSON.`;

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

async function ensureChatSessionId(
  sessionId: string | undefined,
  userId: string,
  titleSeed: string,
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
) {
  if (sessionId) {
    const { data: existingSession } = await supabase
      .from("ai_chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle<{ id: string }>();

    if (existingSession?.id) {
      return existingSession.id;
    }
  }

  const { data: createdSession, error: sessionError } = await supabase
    .from("ai_chat_sessions")
    .insert({
      user_id: userId,
      title: titleSeed.slice(0, 80),
    })
    .select("id")
    .single<{ id: string }>();

  if (sessionError || !createdSession) {
    throw sessionError ?? new Error("Could not create chat session.");
  }

  return createdSession.id;
}

export async function GET() {
  const context = await getAuthedSupabaseContext();

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const { supabase, user } = context;

  const { data: latestSession } = await supabase
    .from("ai_chat_sessions")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!latestSession?.id) {
    return NextResponse.json({ sessionId: null, messages: [] }, { headers: NO_STORE_HEADERS });
  }

  const { data: messages } = await supabase
    .from("ai_chat_messages")
    .select("role, content")
    .eq("session_id", latestSession.id)
    .order("created_at", { ascending: true })
    .returns<Array<{ role: "assistant" | "user" | "system"; content: string }>>();

  return NextResponse.json(
    {
      sessionId: latestSession.id,
      messages: (messages ?? []).filter(
        (message): message is { role: "assistant" | "user"; content: string } =>
          message.role === "assistant" || message.role === "user",
      ),
    },
    {
      headers: NO_STORE_HEADERS,
    },
  );
}

export async function POST(request: Request) {
  const context = await getAuthedSupabaseContext();

  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const { supabase, user } = context;
  const body = (await request.json()) as Payload;
  const latestUserMessage = [...(body.messages ?? [])].reverse().find((item) => item.role === "user");

  if (!latestUserMessage?.content?.trim()) {
    return NextResponse.json(
      { error: "Message content is required." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  if (!isGroqConfigured) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  const sessionId = await ensureChatSessionId(
    body.sessionId,
    user.id,
    latestUserMessage.content,
    supabase,
  );

  const client = new Groq({ apiKey: env.groqApiKey });
  const response = await client.chat.completions.create({
    model: env.groqModel,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...body.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ],
  });

  const reply = response.choices[0]?.message?.content?.trim();

  if (!reply) {
    return NextResponse.json(
      { error: "Groq returned an empty response." },
      { status: 502, headers: NO_STORE_HEADERS },
    );
  }

  await supabase.from("ai_chat_messages").insert([
    {
      session_id: sessionId,
      role: "user",
      content: latestUserMessage.content,
    },
    {
      session_id: sessionId,
      role: "assistant",
      content: reply,
    },
  ]);

  return NextResponse.json(
    {
      sessionId,
      reply,
    },
    {
      headers: NO_STORE_HEADERS,
    },
  );
}
