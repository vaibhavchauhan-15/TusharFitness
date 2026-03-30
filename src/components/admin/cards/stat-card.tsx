import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  delta?: string;
  tone?: "default" | "positive" | "negative";
};

const toneClassMap = {
  default: "text-[var(--muted-foreground)]",
  positive: "text-[var(--success)]",
  negative: "text-[var(--danger)]",
};

export function StatCard({ label, value, delta, tone = "default" }: StatCardProps) {
  return (
    <Card className="rounded-[26px] p-5">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 font-heading text-3xl font-bold md:text-4xl">{value}</p>
      {delta ? <p className={cn("mt-2 text-sm font-medium", toneClassMap[tone])}>{delta}</p> : null}
    </Card>
  );
}
