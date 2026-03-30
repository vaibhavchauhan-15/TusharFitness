"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  HiCheckBadge,
  HiClipboardDocument,
  HiMiniSparkles,
  HiOutlinePaperAirplane,
  HiOutlineXMark,
} from "react-icons/hi2";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

function toReadableKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatJsonValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value === null || value === undefined) {
    return "Not provided";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
      .join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatStructuredJsonMessage(content: string) {
  const trimmed = content.trim();

  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;

    if (Array.isArray(parsed)) {
      return `\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
    }

    if (!parsed || typeof parsed !== "object") {
      return `\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
    }

    const objectValue = parsed as Record<string, unknown>;
    const title = typeof objectValue.title === "string" ? objectValue.title.trim() : "";
    const steps = Array.isArray(objectValue.steps)
      ? objectValue.steps.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];

    const remainingEntries = Object.entries(objectValue).filter(([key]) => key !== "title" && key !== "steps");

    if (!title && steps.length === 0 && remainingEntries.length === 0) {
      return `\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
    }

    const lines: string[] = [];

    if (title) {
      lines.push(`## ${title}`);
    }

    if (steps.length > 0) {
      lines.push("### Steps");
      steps.forEach((step, index) => {
        lines.push(`${index + 1}. ${step}`);
      });
    }

    if (remainingEntries.length > 0) {
      lines.push("### Details");
      remainingEntries.forEach(([key, value]) => {
        lines.push(`- **${toReadableKey(key)}:** ${formatJsonValue(value)}`);
      });
    }

    return lines.join("\n\n");
  } catch {
    return null;
  }
}

function normalizeAssistantMessage(content: string) {
  const structuredContent = formatStructuredJsonMessage(content) ?? content;

  return structuredContent
    .replace(/\r\n/g, "\n")
    .replace(/^\s*(?:--+|—+|___+)\s*$/gm, "\n---\n")
    .replace(/([^\n])\s+(\d+\.\s+)/g, "$1\n$2")
    .replace(/([^\n])\s+([*-]\s+)/g, "$1\n$2")
    .replace(/---+\s*(#{1,6}\s)/g, "\n\n$1")
    .replace(/(?<!\n)(\d+\.\s+\*\*)/g, "\n$1")
    .replace(/(?<!\n)(-\s+\*\*)/g, "\n$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function FloatingAiAssistant({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const copyFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimeoutRef.current) {
        clearTimeout(copyFeedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const root = messagesViewportRef.current;
    if (!root) {
      return;
    }

    const tables = root.querySelectorAll<HTMLTableElement>("table.ai-markdown-table");

    tables.forEach((table) => {
      const headers = Array.from(table.querySelectorAll("thead th"))
        .map((cell) => cell.textContent?.replace(/\s+/g, " ").trim() ?? "")
        .filter((text) => text.length > 0);

      let maxColumns = headers.length;
      const rows = Array.from(table.querySelectorAll("tbody tr"));

      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll("td"));
        maxColumns = Math.max(maxColumns, cells.length);

        cells.forEach((cell, index) => {
          cell.setAttribute("data-label", headers[index] ?? `Column ${index + 1}`);
        });
      });

      table.setAttribute("data-column-count", String(maxColumns));
      table.setAttribute("data-stack-mobile", maxColumns >= 3 ? "true" : "false");
    });
  }, [open, messages]);

  async function copyToClipboard(text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  async function handleCopyMessage(content: string, index: number) {
    try {
      await copyToClipboard(content);
      setCopiedMessageIndex(index);

      if (copyFeedbackTimeoutRef.current) {
        clearTimeout(copyFeedbackTimeoutRef.current);
      }

      copyFeedbackTimeoutRef.current = setTimeout(() => {
        setCopiedMessageIndex(null);
      }, 1800);
    } catch {
      setErrorMessage("Could not copy response.");
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoadingHistory(true);
      setErrorMessage(null);

      try {
        const response = await fetch("/api/ai/chat", {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error("Could not load chat history.");
        }

        const data = (await response.json()) as {
          sessionId: string | null;
          messages: ChatMessage[];
        };

        if (cancelled) {
          return;
        }

        setSessionId(data.sessionId);
        setMessages(data.messages);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Could not load chat history.");
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [username]);

  async function handleSend() {
    if (!prompt.trim()) return;

    const userMessage = { role: "user" as const, content: prompt.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setPrompt("");
    setSending(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          messages: nextMessages,
        }),
      });

      const data = (await response.json()) as {
        sessionId?: string;
        reply?: string;
        error?: string;
      };

      const assistantReply = data.reply;

      if (!response.ok || typeof assistantReply !== "string" || assistantReply.length === 0) {
        throw new Error(data.error ?? "Could not get AI response.");
      }

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: assistantReply,
        },
      ]);
    } catch (error) {
      setMessages((current) => current.filter((item, index) => index !== current.length - 1));
      setErrorMessage(error instanceof Error ? error.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed bottom-24 right-4 z-50 w-[min(92vw,24rem)] overflow-hidden rounded-[28px] border border-(--card-border) bg-(--surface-strong) shadow-(--shadow-soft) backdrop-blur xl:right-8"
          >
            <div className="flex items-center justify-between border-b border-(--card-border) px-5 py-4">
              <div>
                <p className="font-heading text-lg font-semibold">TusharFitness AI</p>
                <p className="text-sm text-muted-foreground">
                  Recovery, fuel, form, and motivation guidance.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-muted-foreground transition hover:bg-(--primary-soft) hover:text-foreground"
                onClick={() => setOpen(false)}
                aria-label="Close AI assistant"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            <div
              ref={messagesViewportRef}
              className="hide-scrollbar flex max-h-96 flex-col gap-3 overflow-y-auto px-5 py-4"
            >
              {loadingHistory ? (
                <div className="rounded-3xl bg-(--primary-soft) px-4 py-3 text-sm text-muted-foreground">
                  Loading chat history...
                </div>
              ) : null}

              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "max-w-[90%] rounded-3xl px-4 py-3 text-sm leading-6",
                    message.role === "assistant"
                      ? "group relative pr-12 bg-(--primary-soft) text-foreground"
                      : "ml-auto bg-foreground text-background",
                  )}
                >
                  {message.role === "assistant" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleCopyMessage(message.content, index)}
                        className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-black/10 hover:text-foreground"
                        aria-label="Copy response"
                        title={copiedMessageIndex === index ? "Copied" : "Copy response"}
                      >
                        {copiedMessageIndex === index ? (
                          <HiCheckBadge className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <HiClipboardDocument className="h-4 w-4" />
                        )}
                      </button>

                      <div className="pr-1">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            p: ({ children }) => (
                              <p className="mb-2 last:mb-0">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
                            ),
                            li: ({ children }) => <li>{children}</li>,
                            h1: ({ children }) => (
                              <h3 className="mb-2 mt-1 text-base font-semibold">{children}</h3>
                            ),
                            h2: ({ children }) => (
                              <h3 className="mb-2 mt-1 text-base font-semibold">{children}</h3>
                            ),
                            h3: ({ children }) => (
                              <h4 className="mb-2 mt-1 text-sm font-semibold">{children}</h4>
                            ),
                            hr: () => <hr className="my-3 border-white/20" />,
                            blockquote: ({ children }) => (
                              <blockquote className="my-3 border-l-2 border-white/25 bg-black/10 px-3 py-2 italic text-foreground/90">
                                {children}
                              </blockquote>
                            ),
                            pre: ({ children }) => (
                              <pre className="my-3 overflow-x-auto rounded-xl border border-white/15 bg-black/20 p-0">
                                {children}
                              </pre>
                            ),
                            code: ({ className, children }) => {
                              const isBlock =
                                typeof className === "string" &&
                                (className.includes("language-") || className.includes("hljs"));

                              if (isBlock) {
                                return (
                                  <code
                                    className={cn(
                                      "block min-w-full whitespace-pre p-3 font-mono text-xs leading-6 sm:text-sm",
                                      className,
                                    )}
                                  >
                                    {children}
                                  </code>
                                );
                              }

                              return (
                                <code className={cn("rounded bg-black/15 px-1.5 py-0.5 font-mono text-[0.85em]", className)}>
                                  {children}
                                </code>
                              );
                            },
                            table: ({ children }) => (
                              <div className="ai-markdown-table-wrap my-3 overflow-x-auto rounded-xl border border-white/15 bg-black/5">
                                <table className="ai-markdown-table min-w-full w-max table-auto border-collapse text-left text-xs sm:text-sm">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => (
                              <thead className="bg-black/10 text-foreground/90">{children}</thead>
                            ),
                            tbody: ({ children }) => <tbody>{children}</tbody>,
                            tr: ({ children }) => <tr className="border-t border-white/10">{children}</tr>,
                            th: ({ children }) => (
                              <th className="px-3 py-2 align-top font-semibold whitespace-normal">{children}</th>
                            ),
                            td: ({ children }) => (
                              <td className="px-3 py-2 align-top text-foreground/95 whitespace-normal">{children}</td>
                            ),
                            img: ({ src, alt }) => {
                              if (typeof src !== "string" || src.length === 0) {
                                return null;
                              }

                              return (
                                <Image
                                  src={src}
                                  alt={alt ?? "AI shared image"}
                                  width={1200}
                                  height={700}
                                  unoptimized
                                  className="my-3 max-h-64 w-full rounded-xl border border-white/15 object-cover"
                                />
                              );
                            },
                            input: ({ type, checked }) => {
                              if (type === "checkbox") {
                                return (
                                  <input
                                    type="checkbox"
                                    checked={Boolean(checked)}
                                    readOnly
                                    disabled
                                    className="mr-2 inline-block h-4 w-4 align-middle accent-orange-500"
                                  />
                                );
                              }

                              return <input type={type} readOnly disabled className="align-middle" />;
                            },
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="underline decoration-current/40 underline-offset-2"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {normalizeAssistantMessage(message.content)}
                        </ReactMarkdown>
                      </div>
                    </>
                  ) : (
                    message.content
                  )}
                </div>
              ))}

              {errorMessage ? (
                <div className="rounded-3xl border border-(--card-border) bg-(--surface-strong) px-4 py-3 text-sm text-muted-foreground">
                  {errorMessage}
                </div>
              ) : null}
            </div>

            <div className="border-t border-(--card-border) p-4">
              <div className="flex gap-2">
                <Input
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Ask about workouts, soreness, macros, or recovery..."
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="md"
                  className="w-12 px-0"
                  onClick={() => void handleSend()}
                  disabled={sending || loadingHistory}
                >
                  <HiOutlinePaperAirplane className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Guidance only. For severe pain, emergency symptoms, or medical diagnosis, contact a licensed professional.
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-6 right-4 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-[0_20px_45px_rgba(249,115,22,0.4)] transition hover:scale-[1.02] xl:right-8"
        aria-label="Open AI assistant"
      >
        <HiMiniSparkles className="h-7 w-7" />
      </button>
    </>
  );
}
