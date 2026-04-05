import { notFound, redirect } from "next/navigation";
import {
  ChatWorkspace,
  type ChatWorkspaceMessage,
  type ChatWorkspaceSession,
} from "@/app/chat/chat-workspace";
import { getSessionState } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ChatSessionRow = {
  id: string;
  title: string | null;
  created_at: string;
};

type ChatMessageRow = {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  created_at: string;
};

const DEFAULT_SESSION_TITLE = "New chat";

function getSessionTitle(title: string | null) {
  const normalized = String(title ?? "").trim();
  return normalized.length > 0 ? normalized.slice(0, 80) : DEFAULT_SESSION_TITLE;
}

export async function ChatPageContent({
  sessionId,
}: {
  sessionId?: string;
}) {
  const sessionState = await getSessionState();

  if (!sessionState) {
    redirect("/login");
  }

  if (!sessionState.onboardingCompleted) {
    redirect("/app/onboarding");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login");
  }

  const userId = sessionState.user.id;

  const sessionsPromise = supabase
    .from("ai_chat_sessions")
    .select("id, title, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<ChatSessionRow[]>();

  const selectedSessionPromise = sessionId
    ? supabase
        .from("ai_chat_sessions")
        .select("id, title, created_at")
        .eq("id", sessionId)
        .eq("user_id", userId)
        .maybeSingle<ChatSessionRow>()
    : Promise.resolve({ data: null, error: null });

  const messagesPromise = sessionId
    ? supabase
        .from("ai_chat_messages")
        .select("id, role, content, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(50)
        .returns<ChatMessageRow[]>()
    : Promise.resolve({ data: [] as ChatMessageRow[], error: null });

  const [sessionsResult, selectedSessionResult, messagesResult] = await Promise.all([
    sessionsPromise,
    selectedSessionPromise,
    messagesPromise,
  ]);

  if (sessionsResult.error) {
    throw new Error("Could not load chat sessions.");
  }

  if (sessionId) {
    if (selectedSessionResult.error) {
      throw new Error("Could not load selected chat session.");
    }

    if (!selectedSessionResult.data) {
      notFound();
    }

    if (messagesResult.error) {
      throw new Error("Could not load chat messages.");
    }
  }

  const sessions: ChatWorkspaceSession[] = (sessionsResult.data ?? []).map((session) => ({
    id: session.id,
    title: getSessionTitle(session.title),
    createdAt: session.created_at,
    lastActivityAt: session.created_at,
  }));

  const messages: ChatWorkspaceMessage[] = (messagesResult.data ?? [])
    .filter((message): message is ChatMessageRow & { role: "assistant" | "user" } =>
      message.role === "assistant" || message.role === "user",
    )
    .map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.created_at,
    }));

  return (
    <ChatWorkspace
      initialSessionId={sessionId ?? null}
      initialSessions={sessions}
      initialMessages={messages}
    />
  );
}
