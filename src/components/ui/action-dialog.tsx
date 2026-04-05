"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { HiOutlineXMark } from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  confirmDisabled?: boolean;
  onConfirm: () => Promise<void> | void;
  onOpenChange: (nextOpen: boolean) => void;
  children?: ReactNode;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Action failed. Please try again.";
}

export function ActionDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "default",
  confirmDisabled = false,
  onConfirm,
  onOpenChange,
  children,
}: ActionDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setSubmitting(false);
      setSubmitError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange, submitting]);

  async function handleConfirm() {
    if (submitting || confirmDisabled) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted || !open) {
    return null;
  }

  const dialog = (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={() => {
          if (!submitting) {
            onOpenChange(false);
          }
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="glass-panel relative z-10 w-full max-w-lg rounded-3xl border border-(--card-border) p-5 shadow-(--shadow-soft)"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id={titleId} className="font-heading text-lg font-semibold text-(--foreground)">
              {title}
            </h3>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm leading-6 text-(--muted-foreground)">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-(--card-border) bg-(--surface-strong) text-(--muted-foreground) transition hover:text-(--foreground)"
            onClick={() => {
              if (!submitting) {
                onOpenChange(false);
              }
            }}
            aria-label="Close dialog"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        {children ? <div className="mt-4">{children}</div> : null}

        {submitError ? (
          <p className="mt-3 rounded-xl border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {submitError}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === "danger" ? "destructive" : "primary"}
            onClick={() => void handleConfirm()}
            disabled={submitting || confirmDisabled}
            className={cn(tone === "danger" ? "shadow-none" : undefined)}
          >
            {submitting ? "Please wait..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
