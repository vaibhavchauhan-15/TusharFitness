"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type ToastTone = "info" | "success" | "error";

type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
};

const DEFAULT_DURATION_MS = 4500;

function getToneClasses(tone: ToastTone) {
  if (tone === "success") {
    return "border-emerald-500/55";
  }

  if (tone === "error") {
    return "border-rose-500/65";
  }

  return "border-(--card-border)";
}

function getToneDotClasses(tone: ToastTone) {
  if (tone === "success") {
    return "bg-emerald-500";
  }

  if (tone === "error") {
    return "bg-rose-500";
  }

  return "bg-(--primary)";
}

export function useToastQueue() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(0);
  const timeoutMapRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((toastId: number) => {
    const timeout = timeoutMapRef.current.get(toastId);

    if (timeout) {
      clearTimeout(timeout);
      timeoutMapRef.current.delete(toastId);
    }

    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const pushToast = useCallback(
    (input: ToastInput) => {
      const id = nextIdRef.current + 1;
      nextIdRef.current = id;

      const toast: ToastItem = {
        id,
        title: input.title,
        description: input.description,
        tone: input.tone ?? "info",
      };

      setToasts((current) => [...current, toast]);

      const timeout = setTimeout(() => {
        dismissToast(id);
      }, input.durationMs ?? DEFAULT_DURATION_MS);

      timeoutMapRef.current.set(id, timeout);

      return id;
    },
    [dismissToast],
  );

  useEffect(() => {
    const timeoutMap = timeoutMapRef.current;

    return () => {
      for (const timeout of timeoutMap.values()) {
        clearTimeout(timeout);
      }

      timeoutMap.clear();
    };
  }, []);

  return {
    toasts,
    pushToast,
    dismissToast,
  };
}

type ToastViewportProps = {
  toasts: ToastItem[];
  onDismiss: (toastId: number) => void;
  className?: string;
};

export function ToastViewport({ toasts, onDismiss, className }: ToastViewportProps) {
  if (typeof window === "undefined" || !toasts.length) {
    return null;
  }

  return createPortal(
    <div
      className={cn("pointer-events-none fixed right-4 top-4 flex w-[min(92vw,24rem)] flex-col gap-2", className)}
      style={{ zIndex: 1400 }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.tone === "error" ? "alert" : "status"}
          aria-live={toast.tone === "error" ? "assertive" : "polite"}
          className={cn(
            "pointer-events-auto rounded-2xl border bg-background/95 px-3 py-3 text-foreground shadow-(--shadow-lg) backdrop-blur-sm",
            getToneClasses(toast.tone),
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", getToneDotClasses(toast.tone))} />
                <p className="text-sm font-semibold leading-5">{toast.title}</p>
              </div>
              {toast.description ? (
                <p className="mt-1 line-clamp-3 text-sm leading-5 text-muted-foreground">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded-lg border border-(--card-border) bg-(--surface-strong) px-2 py-1 text-xs font-semibold text-foreground transition hover:bg-(--primary-soft) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)"
              aria-label="Dismiss notification"
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
}