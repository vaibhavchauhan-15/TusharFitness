import Link from "next/link";
import { Logo } from "@/components/logo";
import { Card } from "@/components/ui/card";

export function AuthShell({
  title,
  description,
  children,
  footerText,
  footerLinkLabel,
  footerLinkHref,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkLabel: string;
  footerLinkHref: string;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 sm:py-12">
      <div className="absolute inset-0 bg-(--gradient-hero)" />
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-(--primary-soft) blur-3xl"
        style={{ height: "32rem", width: "32rem" }}
      />
      <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-(--accent-soft) blur-3xl" />
      <div className="relative grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_0.92fr]">
        <Card className="hidden rounded-[36px] border border-(--card-border) p-8 lg:block lg:p-10">
          <div className="inline-flex items-center rounded-full border border-(--card-border) bg-(--surface-strong) px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Athlete OS
          </div>
          <Logo />
          <h1 className="mt-8 max-w-xl text-5xl font-bold leading-tight">
            Precision training platform with conversion-first onboarding.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
            Auth, onboarding, workouts, meal intelligence, analytics, referrals, streak systems, and AI guidance are connected in one flow so athletes enter fast and stay retained.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              "Protected dashboard routes",
              "Live Supabase auth and sessions",
              "Trial-to-subscription ready flow",
              "AI and analytics history preserved",
            ].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-(--card-border) bg-(--surface-strong) px-4 py-4 text-sm"
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </Card>

        <Card className="rounded-[36px] border border-(--card-border) p-6 sm:p-8">
          <Logo />
          <h2 className="mt-8 text-3xl font-bold leading-tight sm:text-4xl">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-sm text-muted-foreground">
            {footerText}{" "}
            <Link href={footerLinkHref} className="font-semibold text-primary">
              {footerLinkLabel}
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
