import { Card } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Card className="rounded-[26px] border-dashed p-9 text-center">
      <h3 className="font-heading text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">{description}</p>
    </Card>
  );
}
