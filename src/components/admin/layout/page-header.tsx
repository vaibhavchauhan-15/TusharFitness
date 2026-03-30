import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type Action = {
  label: string;
  href?: string;
};

type AdminPageHeaderProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  actions?: Action[];
  actionSlot?: React.ReactNode;
};

export function AdminPageHeader({
  title,
  subtitle,
  eyebrow = "Admin",
  actions = [],
  actionSlot,
}: AdminPageHeaderProps) {
  return (
    <Card className="rounded-[30px] p-6 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <Badge>{eyebrow}</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground md:text-base">{subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {actionSlot}
          {actions.map((action) => (
            action.href ? (
              <Link
                key={action.label}
                href={action.href}
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition hover:bg-(--primary-strong)"
              >
                {action.label}
              </Link>
            ) : (
              <button
                key={action.label}
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(249,115,22,0.28)] transition hover:bg-(--primary-strong)"
              >
                {action.label}
              </button>
            )
          ))}
        </div>
      </div>
    </Card>
  );
}

