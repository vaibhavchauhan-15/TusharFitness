import Link from "next/link";
import { Logo } from "@/components/logo";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Workouts", href: "#workouts" },
      { label: "Diet", href: "#diet" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Tushar", href: "#about" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Login", href: "/login" },
      { label: "Signup", href: "/signup" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms and Conditions", href: "/terms-and-conditions" },
      { label: "Pricing Policy", href: "#pricing" },
      { label: "Contact", href: "/signup" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="py-14" aria-label="Site footer" data-scroll-reveal>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border/70 bg-card/70 p-8 shadow-[0_20px_45px_rgba(2,6,23,0.08)] sm:p-10">
          <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
            <div>
              <Logo subtitle="Fitness Startup SaaS" />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                AI-powered fitness, personalized Indian nutrition, and practical coaching guidance in one product.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {footerColumns.map((column) => (
                <div key={column.title}>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">{column.title}</h3>
                  <ul className="mt-4 space-y-2.5">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>Copyright 2026 TusharFitness. All rights reserved.</p>
            <p>Built in India for sustainable transformations.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
