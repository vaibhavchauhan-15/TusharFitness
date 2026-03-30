import { cn } from "@/lib/utils";

type StatusPillProps = {
  value: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function StatusPill({ value }: StatusPillProps) {
  const normalized = normalize(value);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
        normalized === "active" || normalized === "published" || normalized === "captured"
          ? "border-emerald-300/40 bg-emerald-500/12 text-emerald-700"
          : null,
        normalized === "draft" || normalized === "trialing" || normalized === "pending"
          ? "border-amber-300/40 bg-amber-500/12 text-amber-700"
          : null,
        normalized === "archived" || normalized === "canceled" || normalized === "failed"
          ? "border-rose-300/40 bg-rose-500/12 text-rose-700"
          : null,
        normalized === "suspended" ? "border-red-300/40 bg-red-500/12 text-red-700" : null,
      )}
    >
      {value}
    </span>
  );
}
