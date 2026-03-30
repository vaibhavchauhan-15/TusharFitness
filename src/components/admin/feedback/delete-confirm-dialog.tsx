"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type DeleteConfirmDialogProps = {
  entityName: string;
  warning: string;
  onConfirm: () => Promise<void>;
};

export function DeleteConfirmDialog({ entityName, warning, onConfirm }: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Delete
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-[24px] border border-(--card-border) bg-background p-5 shadow-(--shadow-soft)">
            <h4 className="text-lg font-bold">Delete {entityName}?</h4>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{warning}</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-[var(--danger)] shadow-none hover:bg-[var(--danger)]/90"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    await onConfirm();
                    setOpen(false);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

