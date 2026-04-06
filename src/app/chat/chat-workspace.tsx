"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  HiCheckCircle,
  HiBars3BottomLeft,
  HiMiniSparkles,
  HiOutlineArrowPath,
  HiOutlineClipboardDocumentList,
  HiOutlinePencilSquare,
  HiOutlinePaperAirplane,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineXMark,
} from "react-icons/hi2";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { ActionDialog } from "@/components/ui/action-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToastViewport, useToastQueue } from "@/components/ui/toast-viewport";
import { cn } from "@/lib/utils";

export type ChatWorkspaceSession = {
  id: string;
  title: string;
  createdAt: string;
  lastActivityAt: string;
};

export type ChatWorkspaceMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
};

type ChatWorkspaceProps = {
  initialSessionId: string | null;
  initialSessions: ChatWorkspaceSession[];
  initialMessages: ChatWorkspaceMessage[];
};

type StreamSessionEvent = {
  session: ChatWorkspaceSession;
  userMessage: ChatWorkspaceMessage;
};

type StreamTokenEvent = {
  text: string;
};

type StreamDoneEvent = {
  session: ChatWorkspaceSession;
  assistantMessage: ChatWorkspaceMessage;
};

type StreamErrorEvent = {
  error: string;
};

type LoadMessagesResponse = {
  sessionId: string;
  messages: ChatWorkspaceMessage[];
  nextCursor: string | null;
};

type LoadSessionsResponse = {
  sessions: ChatWorkspaceSession[];
  nextCursor: string | null;
  hasMore: boolean;
};

type PersistedChatCache = {
  version: 1;
  messagesBySession: Record<string, ChatWorkspaceMessage[]>;
  messageCursors: Record<string, string | null>;
};

type MutateSessionResponse = {
  session: ChatWorkspaceSession;
};

type DeleteSessionResponse = {
  sessionId: string;
};

type SessionDialogState =
  | {
      mode: "edit" | "delete";
      session: ChatWorkspaceSession;
    }
  | null;

type ParsedSseEvent = {
  event: string;
  payload: unknown;
};

type SessionGroups = {
  today: ChatWorkspaceSession[];
  yesterday: ChatWorkspaceSession[];
  older: ChatWorkspaceSession[];
};

const CHAT_CACHE_STORAGE_KEY = "tusharfitness-chat-cache-v1";

const SESSION_DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

function isAbortError(error: unknown) {
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }

  if (error && typeof error === "object") {
    const candidate = error as { name?: unknown };
    return candidate.name === "AbortError";
  }

  return false;
}

function parseSseEventBlock(rawBlock: string): ParsedSseEvent | null {
  const lines = rawBlock.split("\n");
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim() || "message";
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  try {
    return {
      event: eventName,
      payload: JSON.parse(dataLines.join("\n")) as unknown,
    };
  } catch {
    return null;
  }
}

function formatSessionDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const parts = SESSION_DATE_FORMATTER.formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value ?? "--";
  const month = parts.find((part) => part.type === "month")?.value ?? "---";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "--";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "--";
  const dayPeriod = parts.find((part) => part.type === "dayPeriod")?.value?.toLowerCase() ?? "";

  return `${day} ${month}, ${hour}:${minute}${dayPeriod ? ` ${dayPeriod}` : ""}`;
}

function getSessionTitle(value: string) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : "New chat";
}

function clampSessionTitle(value: string) {
  return getSessionTitle(value).slice(0, 80);
}

function cleanAssistantResponseText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[\t ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function groupSessionsByRecency(sessions: ChatWorkspaceSession[]): SessionGroups {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const grouped: SessionGroups = {
    today: [],
    yesterday: [],
    older: [],
  };

  for (const session of sessions) {
    const referenceTime = session.lastActivityAt || session.createdAt;
    const sessionDate = new Date(referenceTime);

    if (Number.isNaN(sessionDate.getTime())) {
      grouped.older.push(session);
      continue;
    }

    if (sessionDate >= startOfToday) {
      grouped.today.push(session);
      continue;
    }

    if (sessionDate >= startOfYesterday) {
      grouped.yesterday.push(session);
      continue;
    }

    grouped.older.push(session);
  }

  return grouped;
}

function mergeUniqueSessions(
  current: ChatWorkspaceSession[],
  incoming: ChatWorkspaceSession[],
) {
  const map = new Map<string, ChatWorkspaceSession>();

  for (const session of current) {
    map.set(session.id, session);
  }

  for (const session of incoming) {
    map.set(session.id, session);
  }

  return [...map.values()].sort((a, b) => {
    const left = Date.parse(a.lastActivityAt || a.createdAt) || 0;
    const right = Date.parse(b.lastActivityAt || b.createdAt) || 0;
    return right - left;
  });
}

function parsePersistedCache(rawValue: string | null): PersistedChatCache | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PersistedChatCache>;

    if (parsed.version !== 1) {
      return null;
    }

    if (!parsed.messagesBySession || typeof parsed.messagesBySession !== "object") {
      return null;
    }

    const messagesBySession: Record<string, ChatWorkspaceMessage[]> = {};

    for (const [sessionId, rawMessages] of Object.entries(parsed.messagesBySession)) {
      if (!Array.isArray(rawMessages)) {
        continue;
      }

      messagesBySession[sessionId] = rawMessages
        .filter((message): message is ChatWorkspaceMessage => {
          if (!message || typeof message !== "object") {
            return false;
          }

          const candidate = message as Partial<ChatWorkspaceMessage>;
          return (
            typeof candidate.id === "string" &&
            (candidate.role === "assistant" || candidate.role === "user") &&
            typeof candidate.content === "string" &&
            typeof candidate.createdAt === "string"
          );
        })
        .map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt,
        }));
    }

    const messageCursors: Record<string, string | null> = {};
    const rawCursors = parsed.messageCursors;

    if (rawCursors && typeof rawCursors === "object") {
      for (const [sessionId, value] of Object.entries(rawCursors)) {
        if (typeof value === "string" && value.trim().length > 0) {
          messageCursors[sessionId] = value;
          continue;
        }

        messageCursors[sessionId] = null;
      }
    }

    return {
      version: 1,
      messagesBySession,
      messageCursors,
    };
  } catch {
    return null;
  }
}

type MarkdownCodeProps = ComponentPropsWithoutRef<"code"> & {
  inline?: boolean;
};

function MarkdownCode({ inline, className, children, ...props }: MarkdownCodeProps) {
  if (inline) {
    return (
      <code
        className={cn(
          "rounded-md border border-(--card-border) bg-surface px-1.5 py-0.5 font-mono text-[0.82em] text-(--primary-strong)",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <pre className="chat-scrollbar my-3 overflow-x-auto rounded-2xl border border-(--card-border) bg-slate-950 px-4 py-3.5 text-[13px] leading-6 text-slate-100">
        <code className={cn("font-mono", className)} {...props}>
          {children}
        </code>
    </pre>
  );
}

function copyTextFallback(text: string) {
  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}

const STARTER_PROMPTS = [
  "Build me a 4-day beginner workout split",
  "Give me a high-protein vegetarian meal plan",
  "How do I recover better after leg day?",
  "Create a fat loss plan without muscle loss",
] as const;

export function ChatWorkspace({
  initialSessionId,
  initialSessions,
  initialMessages,
}: ChatWorkspaceProps) {
  const router = useRouter();
  const { toasts, pushToast, dismissToast } = useToastQueue();
  const initialMessagesCursor =
    initialMessages.length >= 50 ? initialMessages[0]?.createdAt ?? null : null;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialSessionId);
  const [sessions, setSessions] = useState<ChatWorkspaceSession[]>(initialSessions);
  const [messages, setMessages] = useState<ChatWorkspaceMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [sessionDialog, setSessionDialog] = useState<SessionDialogState>(null);
  const [sessionTitleDraft, setSessionTitleDraft] = useState("");
  const [sessionsCursor, setSessionsCursor] = useState<string | null>(
    initialSessions.at(-1)?.createdAt ?? null,
  );
  const [sessionsHasMore, setSessionsHasMore] = useState(initialSessions.length >= 25);
  const [loadingMoreSessions, setLoadingMoreSessions] = useState(false);
  const [messagesCursor, setMessagesCursor] = useState<string | null>(initialMessagesCursor);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [composerExpanded, setComposerExpanded] = useState(false);

  const requestIdRef = useRef(0);
  const streamAbortControllerRef = useRef<AbortController | null>(null);
  const copyFeedbackTimerRef = useRef<number | null>(null);
  const stopRequestedRef = useRef(false);
  const streamingAssistantIdRef = useRef<string | null>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesRef = useRef<ChatWorkspaceMessage[]>(initialMessages);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const desktopSessionsSentinelRef = useRef<HTMLDivElement | null>(null);
  const mobileSessionsSentinelRef = useRef<HTMLDivElement | null>(null);
  const hydratedCacheRef = useRef(false);
  const persistTimerRef = useRef<number | null>(null);
  const streamTokenBufferRef = useRef("");
  const streamTokenRafRef = useRef<number | null>(null);
  const cacheRef = useRef<Record<string, ChatWorkspaceMessage[]>>(
    initialSessionId && initialMessages.length > 0 ? { [initialSessionId]: initialMessages } : {},
  );
  const messageCursorRef = useRef<Record<string, string | null>>(
    initialSessionId ? { [initialSessionId]: initialMessagesCursor } : {},
  );

  const persistCacheSnapshot = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const payload: PersistedChatCache = {
      version: 1,
      messagesBySession: cacheRef.current,
      messageCursors: messageCursorRef.current,
    };

    try {
      window.localStorage.setItem(CHAT_CACHE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // No-op: persistence is best effort.
    }
  }, []);

  const schedulePersistCacheSnapshot = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (persistTimerRef.current !== null) {
      window.clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = window.setTimeout(() => {
      persistTimerRef.current = null;
      persistCacheSnapshot();
    }, 180);
  }, [persistCacheSnapshot]);

  const flushStreamTokenBuffer = useCallback((assistantMessageId: string) => {
    if (streamTokenRafRef.current !== null) {
      window.cancelAnimationFrame(streamTokenRafRef.current);
      streamTokenRafRef.current = null;
    }

    const pending = streamTokenBufferRef.current;

    if (pending.length === 0) {
      return;
    }

    streamTokenBufferRef.current = "";

    setMessages((current) => {
      let changed = false;

      const next = current.map((item) => {
        if (item.id !== assistantMessageId) {
          return item;
        }

        changed = true;
        return {
          ...item,
          content: `${item.content}${pending}`,
        };
      });

      if (!changed) {
        return current;
      }

      messagesRef.current = next;
      return next;
    });
  }, []);

  const appendStreamToken = useCallback(
    (assistantMessageId: string, token: string) => {
      if (token.length === 0) {
        return;
      }

      streamTokenBufferRef.current += token;

      if (streamTokenRafRef.current !== null) {
        return;
      }

      streamTokenRafRef.current = window.requestAnimationFrame(() => {
        streamTokenRafRef.current = null;
        flushStreamTokenBuffer(assistantMessageId);
      });
    },
    [flushStreamTokenBuffer],
  );

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (hydratedCacheRef.current) {
      return;
    }

    hydratedCacheRef.current = true;

    const hydrated = parsePersistedCache(window.localStorage.getItem(CHAT_CACHE_STORAGE_KEY));

    if (!hydrated) {
      return;
    }

    cacheRef.current = {
      ...hydrated.messagesBySession,
      ...cacheRef.current,
    };

    messageCursorRef.current = {
      ...hydrated.messageCursors,
      ...messageCursorRef.current,
    };

    if (activeSessionId && messagesRef.current.length === 0 && cacheRef.current[activeSessionId]) {
      const restored = cacheRef.current[activeSessionId];
      messagesRef.current = restored;
      setMessages(restored);
    }

    if (activeSessionId) {
      setMessagesCursor(messageCursorRef.current[activeSessionId] ?? null);
    }
  }, [activeSessionId]);

  useEffect(() => {
    if (!activeSessionId) {
      setMessagesCursor(null);
      return;
    }

    setMessagesCursor(messageCursorRef.current[activeSessionId] ?? null);
  }, [activeSessionId]);

  useEffect(() => {
    if (!activeSessionId) {
      return;
    }

    cacheRef.current[activeSessionId] = messages;
    messageCursorRef.current[activeSessionId] = messagesCursor;
    schedulePersistCacheSnapshot();
  }, [activeSessionId, messages, messagesCursor, schedulePersistCacheSnapshot]);

  function resizeComposerTextarea(target?: HTMLTextAreaElement | null) {
    const textarea = target ?? composerTextareaRef.current;

    if (!textarea) {
      return;
    }

    const minHeight = 40;
    const maxHeight = 184;

    textarea.style.height = "0px";

    const nextHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
    setComposerExpanded(nextHeight > minHeight + 2);
  }

  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current !== null) {
        window.clearTimeout(copyFeedbackTimerRef.current);
      }

      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current);
      }

      if (streamTokenRafRef.current !== null) {
        window.cancelAnimationFrame(streamTokenRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    resizeComposerTextarea();
  }, [draft]);

  const loadMoreSessions = useCallback(async () => {
    if (loadingMoreSessions || !sessionsHasMore) {
      return;
    }

    setLoadingMoreSessions(true);

    try {
      const query = new URLSearchParams({ limit: "20" });

      if (sessionsCursor) {
        query.set("cursor", sessionsCursor);
      }

      const response = await fetch(`/api/sessions?${query.toString()}`, {
        method: "GET",
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as LoadSessionsResponse;
      const incomingSessions = data.sessions ?? [];

      setSessions((current) => mergeUniqueSessions(current, incomingSessions));
      setSessionsCursor(data.nextCursor ?? null);
      setSessionsHasMore(Boolean(data.hasMore && data.nextCursor));
    } catch {
      // No-op: keep existing list if loading more fails.
    } finally {
      setLoadingMoreSessions(false);
    }
  }, [loadingMoreSessions, sessionsHasMore, sessionsCursor]);

  useEffect(() => {
    if (!sessionsHasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const hasIntersectingTarget = entries.some((entry) => entry.isIntersecting);

        if (hasIntersectingTarget) {
          void loadMoreSessions();
        }
      },
      {
        rootMargin: "180px 0px",
      },
    );

    if (desktopSessionsSentinelRef.current) {
      observer.observe(desktopSessionsSentinelRef.current);
    }

    if (mobileSessionsSentinelRef.current) {
      observer.observe(mobileSessionsSentinelRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [sessionsHasMore, loadMoreSessions]);

  async function loadMessagesForSession(sessionId: string) {
    if (cacheRef.current[sessionId]) {
      const cachedMessages = cacheRef.current[sessionId];
      const cachedCursor = messageCursorRef.current[sessionId] ?? null;

      setMessages((current) => (current === cachedMessages ? current : cachedMessages));
      setMessagesCursor((current) => (current === cachedCursor ? current : cachedCursor));
      return;
    }

    setLoadingMessages(true);
    setErrorMessage(null);

    const requestId = ++requestIdRef.current;

    try {
      const response = await fetch(`/api/messages?sessionId=${encodeURIComponent(sessionId)}&limit=50`, {
        method: "GET",
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        throw new Error("Could not load chat messages.");
      }

      const data = (await response.json()) as LoadMessagesResponse;

      if (requestId !== requestIdRef.current) {
        return;
      }

      cacheRef.current[sessionId] = data.messages;
      messageCursorRef.current[sessionId] = data.nextCursor;
      setMessages(data.messages);
      setMessagesCursor(data.nextCursor);
      persistCacheSnapshot();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not load chat messages.");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoadingMessages(false);
      }
    }
  }

  async function loadOlderMessages() {
    if (!activeSessionId || !messagesCursor || loadingOlderMessages || sending) {
      return;
    }

    setLoadingOlderMessages(true);

    try {
      const query = new URLSearchParams({
        sessionId: activeSessionId,
        limit: "40",
        before: messagesCursor,
      });

      const response = await fetch(`/api/messages?${query.toString()}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Could not load older messages.");
      }

      const data = (await response.json()) as LoadMessagesResponse;
      const olderMessages = data.messages ?? [];

      setMessages((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        const dedupedOlder = olderMessages.filter((item) => !existingIds.has(item.id));
        const next = [...dedupedOlder, ...current];
        messagesRef.current = next;
        cacheRef.current[activeSessionId] = next;
        return next;
      });

      const nextCursor = data.nextCursor ?? null;
      setMessagesCursor(nextCursor);
      messageCursorRef.current[activeSessionId] = nextCursor;
      persistCacheSnapshot();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not load older messages.");
    } finally {
      setLoadingOlderMessages(false);
    }
  }

  function handleRegenerateFromAssistant(messageId: string) {
    if (sending) {
      return;
    }

    const currentMessages = messagesRef.current;
    const assistantIndex = currentMessages.findIndex((item) => item.id === messageId);

    if (assistantIndex <= 0) {
      return;
    }

    for (let index = assistantIndex - 1; index >= 0; index -= 1) {
      const candidate = currentMessages[index];

      if (candidate.role === "user") {
        setDraft(candidate.content);
        requestAnimationFrame(() => {
          void handleSend(candidate.content);
        });
        return;
      }
    }
  }

  function moveSessionToTop(nextSession: ChatWorkspaceSession) {
    setSessions((current) => {
      const deduped = current.filter((item) => item.id !== nextSession.id);
      return [nextSession, ...deduped];
    });
  }

  function openEditSessionDialog(session: ChatWorkspaceSession) {
    if (sending) {
      return;
    }

    setSessionTitleDraft(clampSessionTitle(session.title));
    setSessionDialog({
      mode: "edit",
      session,
    });
  }

  function openDeleteSessionDialog(session: ChatWorkspaceSession) {
    if (sending) {
      return;
    }

    setSessionDialog({
      mode: "delete",
      session,
    });
  }

  function handleSessionDialogOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      return;
    }

    setSessionDialog(null);
    setSessionTitleDraft("");
  }

  async function handleEditSessionConfirm() {
    if (!sessionDialog || sessionDialog.mode !== "edit") {
      return;
    }

    const nextTitle = clampSessionTitle(sessionTitleDraft);

    if (!nextTitle) {
      pushToast({
        tone: "error",
        title: "Could not update title",
        description: "Title cannot be empty.",
      });
      throw new Error("Title cannot be empty.");
    }

    const response = await fetch("/api/sessions", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: sessionDialog.session.id,
        title: nextTitle,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      const message = data.error ?? "Could not update chat title.";
      pushToast({
        tone: "error",
        title: "Failed to update chat title",
        description: message,
      });
      throw new Error(message);
    }

    const data = (await response.json()) as MutateSessionResponse;
    const updatedSession = {
      ...data.session,
      title: clampSessionTitle(data.session.title),
    };

    setSessions((current) =>
      current.map((item) => (item.id === updatedSession.id ? updatedSession : item)),
    );

    pushToast({
      tone: "success",
      title: "Title updated",
      description: `Recent chat renamed to \"${updatedSession.title}\".`,
    });
  }

  async function handleDeleteSessionConfirm() {
    if (!sessionDialog || sessionDialog.mode !== "delete") {
      return;
    }

    const deletedSessionId = sessionDialog.session.id;
    const response = await fetch("/api/sessions", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: deletedSessionId,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      const message = data.error ?? "Could not delete chat session.";
      pushToast({
        tone: "error",
        title: "Failed to delete chat",
        description: message,
      });
      throw new Error(message);
    }

    const data = (await response.json()) as DeleteSessionResponse;

    delete cacheRef.current[data.sessionId];
    delete messageCursorRef.current[data.sessionId];
    persistCacheSnapshot();

    setSessions((current) => current.filter((item) => item.id !== data.sessionId));

    if (activeSessionId === data.sessionId) {
      setActiveSessionId(null);
      setMessages([]);
      router.replace("/chat", { scroll: false });
    }

    setSidebarOpen(false);

    pushToast({
      tone: "success",
      title: "Chat deleted",
      description: "The recent chat and its messages were removed successfully.",
    });
  }

  async function handleSessionSelect(sessionId: string) {
    if (sending) {
      return;
    }

    if (sessionId === activeSessionId) {
      setSidebarOpen(false);
      return;
    }

    setActiveSessionId(sessionId);
    setSidebarOpen(false);
    router.replace(`/chat/${sessionId}`, { scroll: false });
    await loadMessagesForSession(sessionId);
  }

  function handleNewChat() {
    if (sending) {
      return;
    }

    setActiveSessionId(null);
    setMessages([]);
    setMessagesCursor(null);
    setErrorMessage(null);
    setSidebarOpen(false);
    router.replace("/chat", { scroll: false });
  }

  function handleStopGenerating() {
    if (!sending) {
      return;
    }

    stopRequestedRef.current = true;
    streamAbortControllerRef.current?.abort();
  }

  async function handleCopyMessage(message: ChatWorkspaceMessage) {
    const messageText =
      message.role === "assistant"
        ? cleanAssistantResponseText(message.content)
        : message.content;

    if (messageText.trim().length === 0) {
      return;
    }

    let copied = false;

    try {
      if (typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function") {
        await navigator.clipboard.writeText(messageText);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied) {
      copied = copyTextFallback(messageText);
    }

    if (!copied) {
      setErrorMessage("Could not copy message. Please try again.");
      return;
    }

    setCopiedMessageId(message.id);

    if (copyFeedbackTimerRef.current !== null) {
      window.clearTimeout(copyFeedbackTimerRef.current);
    }

    copyFeedbackTimerRef.current = window.setTimeout(() => {
      setCopiedMessageId((current) => (current === message.id ? null : current));
    }, 1400);
  }

  async function handleSend(promptOverride?: string) {
    const prompt = (promptOverride ?? draft).trim();

    if (!prompt || sending) {
      return;
    }

    const tempUserMessageId = `temp-user-${Date.now()}`;
    const tempAssistantMessageId = `temp-assistant-${Date.now()}`;

    const optimisticUserMessage: ChatWorkspaceMessage = {
      id: tempUserMessageId,
      role: "user",
      content: prompt,
      createdAt: new Date().toISOString(),
    };

    const optimisticAssistantMessage: ChatWorkspaceMessage = {
      id: tempAssistantMessageId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    streamingAssistantIdRef.current = tempAssistantMessageId;

    setDraft("");
    setSending(true);
    setErrorMessage(null);
    setMessages((current) => {
      const next = [...current, optimisticUserMessage, optimisticAssistantMessage];
      messagesRef.current = next;
      return next;
    });

    const streamAbortController = new AbortController();
    streamAbortControllerRef.current = streamAbortController;
    stopRequestedRef.current = false;

    let resolvedSessionId = activeSessionId;
    let completed = false;

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        signal: streamAbortController.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: activeSessionId,
          message: prompt,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(typeof data.error === "string" ? data.error : "Could not send your message.");
      }

      if (!response.body) {
        throw new Error("Streaming is unavailable right now.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const handleStreamEvent = (parsedEvent: ParsedSseEvent) => {
        if (parsedEvent.event === "session") {
          const eventPayload = parsedEvent.payload as StreamSessionEvent;

          const session = {
            ...eventPayload.session,
            title: clampSessionTitle(eventPayload.session.title),
          };

          resolvedSessionId = session.id;
          moveSessionToTop(session);

          if (activeSessionId !== session.id) {
            setActiveSessionId(session.id);
            router.replace(`/chat/${session.id}`, { scroll: false });
          }

          setMessages((current) => {
            const next = current.map((item) =>
              item.id === tempUserMessageId ? eventPayload.userMessage : item,
            );
            messagesRef.current = next;
            return next;
          });

          return;
        }

        if (parsedEvent.event === "token") {
          const eventPayload = parsedEvent.payload as StreamTokenEvent;

          if (typeof eventPayload.text !== "string" || eventPayload.text.length === 0) {
            return;
          }

          appendStreamToken(tempAssistantMessageId, eventPayload.text);

          return;
        }

        if (parsedEvent.event === "done") {
          const eventPayload = parsedEvent.payload as StreamDoneEvent;
          flushStreamTokenBuffer(tempAssistantMessageId);

          const session = {
            ...eventPayload.session,
            title: clampSessionTitle(eventPayload.session.title),
          };

          resolvedSessionId = session.id;
          moveSessionToTop(session);

          setMessages((current) => {
            const next = current.map((item) =>
              item.id === tempAssistantMessageId ? eventPayload.assistantMessage : item,
            );
            messagesRef.current = next;
            return next;
          });

          completed = true;
          return;
        }

        if (parsedEvent.event === "error") {
          flushStreamTokenBuffer(tempAssistantMessageId);
          const eventPayload = parsedEvent.payload as StreamErrorEvent;
          throw new Error(eventPayload.error || "Could not stream assistant response.");
        }
      };

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, "\n");

        let blockBoundaryIndex = buffer.indexOf("\n\n");

        while (blockBoundaryIndex !== -1) {
          const rawBlock = buffer.slice(0, blockBoundaryIndex).trim();
          buffer = buffer.slice(blockBoundaryIndex + 2);

          if (rawBlock.length > 0) {
            const parsedEvent = parseSseEventBlock(rawBlock);

            if (parsedEvent) {
              handleStreamEvent(parsedEvent);
            }
          }

          blockBoundaryIndex = buffer.indexOf("\n\n");
        }
      }

      if (!completed && !stopRequestedRef.current) {
        throw new Error("Connection ended before the assistant finished responding.");
      }

      flushStreamTokenBuffer(tempAssistantMessageId);

      if (resolvedSessionId) {
        cacheRef.current[resolvedSessionId] = messagesRef.current;
        persistCacheSnapshot();
      }
    } catch (error) {
      flushStreamTokenBuffer(tempAssistantMessageId);
      const stoppedByUser = stopRequestedRef.current || isAbortError(error);

      if (stoppedByUser) {
        setMessages((current) => {
          const next = current.filter((item) => {
            if (item.id !== tempAssistantMessageId) {
              return true;
            }

            return item.content.trim().length > 0;
          });

          messagesRef.current = next;
          return next;
        });

        if (resolvedSessionId) {
          cacheRef.current[resolvedSessionId] = messagesRef.current;
          persistCacheSnapshot();
        }

        setErrorMessage(null);
      } else {
        setDraft(prompt);

        setMessages((current) => {
          const next = current.filter(
            (item) => item.id !== tempUserMessageId && item.id !== tempAssistantMessageId,
          );
          messagesRef.current = next;
          return next;
        });

        setErrorMessage(error instanceof Error ? error.message : "Could not send your message.");
      }
    } finally {
      flushStreamTokenBuffer(tempAssistantMessageId);
      streamAbortControllerRef.current = null;
      stopRequestedRef.current = false;
      streamingAssistantIdRef.current = null;
      setSending(false);
    }
  }

  const activeSessionTitle = useMemo(() => {
    if (!activeSessionId) {
      return "New chat";
    }

    return sessions.find((item) => item.id === activeSessionId)?.title ?? "Chat";
  }, [activeSessionId, sessions]);

  const groupedSessions = useMemo(() => {
    const grouped = groupSessionsByRecency(sessions);

    return [
      { label: "Today", sessions: grouped.today },
      { label: "Yesterday", sessions: grouped.yesterday },
      { label: "Older", sessions: grouped.older },
    ].filter((group) => group.sessions.length > 0);
  }, [sessions]);

  function renderRecentChatsSkeletonRows(count: number) {
    return (
      <div className="space-y-1.5" aria-hidden>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={`recent-skeleton-${index}`}
            className="rounded-xl border border-(--card-border) bg-surface px-3 py-2"
          >
            <div className="h-4 w-[72%] animate-pulse rounded-md bg-(--surface-strong)" />
            <div className="mt-1.5 h-2.5 w-[42%] animate-pulse rounded-md bg-(--surface-strong)" />
          </div>
        ))}
      </div>
    );
  }

  function renderRecentChatsList(options: { mobile: boolean }) {
    const { mobile } = options;

    return (
      <div
        className={cn(
          "chat-scrollbar recent-chats-scroll-area flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain",
          mobile ? "mt-3 pr-1 pb-6" : "h-full pr-2 pb-8",
        )}
      >
        {groupedSessions.map((group) => (
          <div key={group.label} className="space-y-1.5">
            <p
              className="px-1 font-semibold uppercase tracking-[0.14em] text-(--muted-foreground)"
              style={{ fontSize: "14px", lineHeight: "20px" }}
            >
              {group.label}
            </p>

            <div className="space-y-1.5">
              {group.sessions.map((session) => {
                const active = session.id === activeSessionId;

                return (
                  <div
                    key={session.id}
                    data-active={active}
                    data-disabled={sending}
                    className={cn(
                      "recent-chat-card group relative flex flex-col justify-center overflow-hidden rounded-xl px-3 py-2 text-left",
                      sending ? "opacity-70" : null,
                    )}
                  >
                    <button
                      type="button"
                      className="absolute inset-0 z-0 h-full w-full rounded-xl disabled:cursor-not-allowed"
                      onClick={() => void handleSessionSelect(session.id)}
                      disabled={sending}
                      aria-label={`Open chat: ${clampSessionTitle(session.title)}`}
                    />
                    <div className="relative z-10 pointer-events-none pr-12">
                      <p className={cn("recent-chat-title truncate text-[14px] leading-[1.2]", active ? "font-semibold" : "font-medium")}>
                        {clampSessionTitle(session.title)}
                      </p>
                      <p
                        className="recent-chat-meta mt-0.5"
                        style={{ fontSize: "10px", lineHeight: "12px" }}
                        suppressHydrationWarning
                      >
                        {formatSessionDate(session.lastActivityAt)}
                      </p>
                    </div>

                    <div className="recent-chat-card-actions absolute right-2 top-1/2 z-20 inline-flex -translate-y-1/2 items-center gap-1">
                      <button
                        type="button"
                        className="recent-chat-card-action inline-flex h-7 w-7 items-center justify-center rounded-lg border border-(--card-border) bg-surface text-(--muted-foreground) transition hover:text-(--foreground)"
                        onClick={() => openEditSessionDialog(session)}
                        aria-label="Edit recent chat title"
                        title="Edit"
                        disabled={sending}
                      >
                        <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        className="recent-chat-card-action inline-flex h-7 w-7 items-center justify-center rounded-lg border border-red-400/30 bg-red-500/8 text-red-300 transition hover:bg-red-500/20"
                        onClick={() => openDeleteSessionDialog(session)}
                        aria-label="Delete recent chat"
                        title="Delete"
                        disabled={sending}
                      >
                        <HiOutlineTrash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {loadingMoreSessions ? renderRecentChatsSkeletonRows(3) : null}

        {sessions.length === 0 && !loadingMoreSessions ? (
          <div className="rounded-2xl border border-dashed border-(--card-border) bg-(--surface-strong) p-4 text-sm text-(--muted-foreground)">
            No recent chats yet. Start your first conversation.
          </div>
        ) : null}

        {sessionsHasMore ? (
          <div
            ref={mobile ? mobileSessionsSentinelRef : desktopSessionsSentinelRef}
            className="min-h-2"
            aria-hidden
          />
        ) : null}
      </div>
    );
  }

  return (
    <section className="relative h-dvh overflow-hidden p-3 sm:p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.14),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_35%)]"
      />

      <div className="relative mx-auto flex h-full min-h-0 max-w-425 gap-3">
        <aside className="glass-panel hidden h-full w-[320px] shrink-0 flex-col overflow-hidden rounded-[30px] border border-(--card-border) p-3 md:flex">
          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <div>
              <h1 className="font-heading font-semibold" style={{ fontSize: "20px", lineHeight: "1.25" }}>
                TusharFitness AI
              </h1>
            </div>
            
          </div>

          <Button
            type="button"
            variant="primary"
            className="chat-new-chat-button h-11 w-full justify-start rounded-xl font-medium"
            onClick={handleNewChat}
            disabled={sending}
          >
            <HiOutlinePlus className="h-4 w-4" />
            New chat
          </Button>

          <div className="mt-4 flex-1 overflow-hidden">
            <p
              className="mb-2 px-1 font-semibold uppercase tracking-[0.16em] text-(--muted-foreground)"
              style={{ fontSize: "14px", lineHeight: "20px" }}
            >
              Recent chats
            </p>
            {renderRecentChatsList({ mobile: false })}
          </div>
        </aside>

        <AnimatePresence>
          {sidebarOpen ? (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close recent chats"
              />

              <motion.aside
                initial={{ x: -360, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="glass-panel fixed inset-y-3 left-3 z-50 flex w-[86vw] max-w-85 flex-col rounded-[30px] border border-(--card-border) p-3 md:hidden"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold" style={{ fontSize: "14px", lineHeight: "20px" }}>
                    Recent chats
                  </p>
                  <button
                    type="button"
                    className="rounded-xl p-2 text-(--muted-foreground) transition hover:bg-(--primary-soft) hover:text-(--foreground)"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close sidebar"
                  >
                    <HiOutlineXMark className="h-5 w-5" />
                  </button>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  className="chat-new-chat-button h-11 w-full justify-start rounded-xl font-medium"
                  onClick={handleNewChat}
                  disabled={sending}
                >
                  <HiOutlinePlus className="h-4 w-4" />
                  New chat
                </Button>

                {renderRecentChatsList({ mobile: true })}
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>

        <div className="glass-panel relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-(--card-border)">
          <header className="flex items-center justify-between border-b border-(--card-border) px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-(--card-border) bg-(--surface-strong) transition hover:bg-(--primary-soft) md:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open recent chats"
              >
                <HiBars3BottomLeft className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <p className="truncate font-heading text-lg font-semibold">{clampSessionTitle(activeSessionTitle)}</p>
              </div>
            </div>
          </header>

          <div ref={viewportRef} className="chat-scrollbar flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pt-4 pb-56 sm:px-5 sm:pb-52">
            {loadingMessages ? (
              <div className="space-y-3 py-6">
                <div className="h-14 w-[70%] animate-pulse rounded-3xl bg-(--primary-soft)" />
                <div className="ml-auto h-12 w-[58%] animate-pulse rounded-3xl bg-(--surface-strong)" />
                <div className="h-16 w-[64%] animate-pulse rounded-3xl bg-(--primary-soft)" />
              </div>
            ) : null}

            {!loadingMessages && messages.length === 0 ? (
              <div className="mx-auto flex max-w-2xl flex-col items-center py-14 text-center">
                <h2 className="font-heading text-2xl font-semibold">What should we improve today?</h2>
                <p className="mt-2 max-w-xl text-sm text-(--muted-foreground)">
                  Ask for training programs, nutrition breakdowns, recovery protocols, and progression strategy.
                </p>

                <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                  {STARTER_PROMPTS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setDraft(item)}
                      className="rounded-2xl border border-(--card-border) bg-surface px-4 py-3.5 text-left text-sm font-medium transition-colors duration-200 hover:bg-(--surface-strong)"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <AnimatePresence initial={false}>
              {!loadingMessages ? (
                <div className="space-y-2.5 pb-1">
                  {messages.length > 0 ? (
                    <div className="flex justify-center">
                      {messagesCursor ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 rounded-full border border-(--card-border) px-4 text-xs"
                          onClick={() => void loadOlderMessages()}
                          disabled={loadingOlderMessages || sending}
                        >
                          {loadingOlderMessages ? "Loading history..." : "Load older messages"}
                        </Button>
                      ) : (
                        <span className="text-xs text-(--muted-foreground)">You are viewing the start of this chat.</span>
                      )}
                    </div>
                  ) : null}

                  {messages.map((message) => {
                    const isAssistant = message.role === "assistant";
                    const isStreamingMessage = sending && message.id === streamingAssistantIdRef.current;
                    const renderedAssistantContent = cleanAssistantResponseText(message.content);

                    return (
                      <motion.article
                        key={message.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className={cn(
                          "flex w-full gap-3",
                          isAssistant ? "justify-start" : "justify-end",
                        )}
                      >
                        <div
                          className={cn(
                            "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                            isAssistant
                              ? "border-(--primary)/45 bg-(--primary-soft) text-(--primary-strong)"
                              : "border-(--card-border) bg-surface text-(--foreground)",
                            isAssistant ? "order-1" : "order-2",
                          )}
                        >
                          {isAssistant ? <HiMiniSparkles className="h-3.5 w-3.5" /> : "You"}
                        </div>

                        <div
                          className={cn(
                            "group flex min-w-0 max-w-[90%] flex-col sm:max-w-[82%]",
                            isAssistant ? "order-2 items-start" : "order-1 items-end",
                          )}
                        >
                          <div
                            className={cn(
                              "min-w-0 max-w-full rounded-3xl border px-5 py-3 text-[15px] leading-relaxed shadow-[inset_0_0_0_1px_rgba(255,255,255,0.015)]",
                              isAssistant
                                ? "border-(--card-border) bg-(--surface)/70 text-(--foreground)"
                                : "border-(--card-border) bg-(--surface-strong) text-(--foreground)",
                            )}
                          >
                            {isAssistant ? (
                              <>
                                {renderedAssistantContent.length > 0 ? (
                                  <div className="prose prose-sm min-w-0 max-w-none dark:prose-invert prose-headings:my-1.5 prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:my-1.5 prose-p:leading-snug prose-strong:text-(--foreground) prose-pre:my-2.5 prose-code:before:hidden prose-code:after:hidden prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-table:my-0 prose-hr:my-3">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm, remarkBreaks]}
                                      rehypePlugins={[rehypeHighlight]}
                                      components={{
                                        table({ children }) {
                                          return (
                                            <div className="ai-markdown-table-wrap my-2.5 w-full max-w-full overflow-x-auto rounded-2xl border border-(--card-border)">
                                              <table className="ai-markdown-table min-w-full border-collapse text-left text-[13px] leading-5">
                                                {children}
                                              </table>
                                            </div>
                                          );
                                        },
                                        thead({ children }) {
                                          return <thead className="bg-surface">{children}</thead>;
                                        },
                                        th({ children }) {
                                          return (
                                            <th className="border border-(--card-border) px-2.5 py-1.5 align-top font-semibold text-(--foreground)">
                                              {children}
                                            </th>
                                          );
                                        },
                                        td({ children }) {
                                          return (
                                            <td className="border border-(--card-border) px-2.5 py-1.5 align-top text-(--foreground)">
                                              {children}
                                            </td>
                                          );
                                        },
                                        a({ href, children }) {
                                          return (
                                            <a
                                              href={href}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="font-medium text-(--primary-strong) underline decoration-(--primary)/45 underline-offset-3"
                                            >
                                              {children}
                                            </a>
                                          );
                                        },
                                        code: MarkdownCode,
                                      }}
                                    >
                                      {renderedAssistantContent}
                                    </ReactMarkdown>
                                  </div>
                                ) : null}

                                {isStreamingMessage && renderedAssistantContent.length === 0 ? (
                                  <p className="text-sm text-(--muted-foreground)">AI is thinking...</p>
                                ) : null}

                                {isStreamingMessage ? (
                                  <span className="mt-1 inline-block h-4 w-1 animate-pulse rounded-full bg-(--primary) align-middle" />
                                ) : null}
                              </>
                            ) : (
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            )}
                          </div>

                          <div
                            className={cn(
                              "mt-0.5 flex gap-1 px-0.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
                              isAssistant ? "justify-start" : "justify-end",
                            )}
                          >
                            <button
                              type="button"
                              className={cn(
                                "inline-flex h-7 w-7 items-center justify-center rounded-lg border transition",
                                copiedMessageId === message.id
                                  ? "border-emerald-400/45 bg-emerald-500/15 text-emerald-300"
                                  : "border-(--card-border) bg-surface text-(--muted-foreground) hover:border-(--primary)/55 hover:text-(--foreground)",
                              )}
                              onClick={() => void handleCopyMessage(message)}
                              aria-label={
                                copiedMessageId === message.id
                                  ? "Copied message"
                                  : "Copy message"
                              }
                              title={
                                copiedMessageId === message.id
                                  ? "Copied"
                                  : "Copy message"
                              }
                            >
                              {copiedMessageId === message.id ? (
                                <HiCheckCircle className="h-4 w-4" />
                              ) : (
                                <HiOutlineClipboardDocumentList className="h-4 w-4" />
                              )}
                            </button>

                            {isAssistant && !isStreamingMessage ? (
                              <button
                                type="button"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-(--card-border) bg-surface text-(--muted-foreground) transition hover:border-(--primary)/55 hover:text-(--foreground)"
                                onClick={() => handleRegenerateFromAssistant(message.id)}
                                aria-label="Regenerate response"
                                title="Regenerate"
                              >
                                <HiOutlineArrowPath className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-3 sm:px-5 sm:pb-4">
            <div className="pointer-events-auto mx-auto w-full max-w-280 sm:w-[88%] xl:w-[70%]">
              <div className="chat-composer-shell rounded-3xl border border-(--card-border) bg-surface px-3 py-1.5 shadow-sm transition-all duration-150 ease-out focus-within:ring-1 focus-within:ring-(--primary)/50 sm:px-4 text-[15px]">
              <div className="relative flex items-stretch gap-1.5">
                <textarea
                  ref={composerTextareaRef}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    resizeComposerTextarea(event.currentTarget);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  rows={1}
                  placeholder="Ask Anything"
                  className="chat-composer-textarea chat-scrollbar-compact max-h-50 min-h-10 w-full flex-1 resize-none overflow-y-auto bg-transparent py-2 pl-2 pr-3 leading-relaxed outline-none placeholder:text-(--muted-foreground)"
                />

                <div
                  className={cn(
                    "shrink-0 transition-all duration-150",
                    composerExpanded ? "mb-0.5 self-end" : "self-center",
                  )}
                >
                  <Button
                    type="button"
                    size="icon"
                    variant={sending ? "destructive" : "primary"}
                    className="flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                    onClick={() => {
                      if (sending) {
                        handleStopGenerating();
                        return;
                      }

                      void handleSend();
                    }}
                    disabled={!sending && draft.trim().length === 0}
                  >
                    {sending ? <HiOutlineXMark className="h-5 w-5" /> : <HiOutlinePaperAirplane className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {errorMessage ? (
                <p className="mt-2 rounded-xl border border-red-400/35 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                  {errorMessage}
                </p>
              ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActionDialog
        open={sessionDialog?.mode === "edit"}
        onOpenChange={handleSessionDialogOpenChange}
        title="Edit chat title"
        description="Update the title shown in your recent chats list."
        confirmLabel="Save title"
        confirmDisabled={clampSessionTitle(sessionTitleDraft).length === 0}
        onConfirm={handleEditSessionConfirm}
      >
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-(--muted-foreground)">
          Chat title
        </label>
        <Input
          value={sessionTitleDraft}
          onChange={(event) => setSessionTitleDraft(event.target.value.slice(0, 80))}
          placeholder="Enter a chat title"
          autoFocus
          maxLength={80}
        />
      </ActionDialog>

      <ActionDialog
        open={sessionDialog?.mode === "delete"}
        onOpenChange={handleSessionDialogOpenChange}
        title="Delete this recent chat?"
        description="This will permanently remove the session and all its messages. This action cannot be undone."
        confirmLabel="Delete chat"
        tone="danger"
        onConfirm={handleDeleteSessionConfirm}
      >
        <div className="rounded-xl border border-(--card-border) bg-(--surface-strong) px-3 py-2 text-sm text-(--foreground)">
          {sessionDialog?.mode === "delete" ? clampSessionTitle(sessionDialog.session.title) : ""}
        </div>
      </ActionDialog>

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </section>
  );
}
