import { Card } from "@/components/ui/card";

type DrawerFormProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function DrawerForm({ title, description, children }: DrawerFormProps) {
  return (
    <Card className="rounded-[28px] p-5 md:p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{description}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}
