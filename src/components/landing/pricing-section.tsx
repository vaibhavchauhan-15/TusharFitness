"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const plans = [
  {
    name: "Starter",
    monthlyPrice: 0,
    period: "3 days",
    description: "Best for trying the platform before upgrading.",
    features: ["1 workout plan", "1 diet plan", "BMI calculator", "Limited AI messages"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Build",
    monthlyPrice: 79,
    period: "month",
    description: "For users building habits and consistency.",
    features: [
      "Workout library access",
      "Diet library access",
      "Progress dashboard",
      "Streak tracker",
    ],
    cta: "Choose Build",
    highlighted: false,
  },
  {
    name: "Transform",
    monthlyPrice: 99,
    period: "month",
    description: "Most popular plan for serious body transformation.",
    features: [
      "Everything in Build",
      "Unlimited AI coach",
      "Meal calorie tracking",
      "Priority support",
    ],
    cta: "Choose Transform",
    highlighted: true,
  },
  {
    name: "Elite",
    monthlyPrice: 199,
    period: "month",
    description: "High-touch coaching with custom plans and sessions.",
    features: [
      "Everything in Transform",
      "1:1 coach sessions",
      "Custom plans",
      "Progress PDF reports",
    ],
    cta: "Choose Elite",
    highlighted: false,
  },
];

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const resolvedPlans = useMemo(
    () =>
      plans.map((plan) => {
        const isFreePlan = plan.monthlyPrice === 0;
        const yearlyPrice = Math.round(plan.monthlyPrice * 10);
        const displayPrice = isFreePlan
          ? plan.monthlyPrice
          : billingCycle === "monthly"
            ? plan.monthlyPrice
            : yearlyPrice;
        const displayPeriod = isFreePlan
          ? plan.period
          : billingCycle === "monthly"
            ? plan.period
            : "year";

        return {
          ...plan,
          displayPrice,
          displayPeriod,
        };
      }),
    [billingCycle],
  );

  return (
    <section
      id="pricing"
      className="border-b border-border/60 bg-[linear-gradient(180deg,transparent_0%,rgba(249,115,22,0.05)_100%)] py-24"
      aria-label="Pricing plans"
      data-scroll-reveal
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Pricing Section</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Transparent plans for every stage of your fitness journey.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Start free, upgrade when ready, and keep everything in one account.
          </p>

          <div className="mt-8 inline-flex rounded-full border border-border/70 bg-card/80 p-1 shadow-sm" role="tablist" aria-label="Billing cycle">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={billingCycle === "monthly"}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                billingCycle === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={billingCycle === "yearly"}
            >
              Yearly (save 16%)
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4" data-scroll-stagger>
          {resolvedPlans.map((plan) => (
            <article
              key={plan.name}
              data-stagger-item
              className={`relative flex h-full flex-col rounded-3xl border p-6 shadow-sm transition-all hover:-translate-y-1 ${
                plan.highlighted
                  ? "border-primary/45 bg-primary/9 shadow-[0_24px_80px_rgba(249,115,22,0.3)]"
                  : "border-border/70 bg-card/80"
              }`}
            >
              {plan.highlighted ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/40 bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-foreground">
                  Most popular
                </span>
              ) : null}

              <div>
                <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                <p className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
                  Rs {plan.displayPrice}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">/ {plan.displayPeriod}</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                {billingCycle === "yearly" && plan.monthlyPrice > 0 ? (
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-primary">
                    Effective Rs {Math.round(plan.displayPrice / 12)}/month
                  </p>
                ) : null}
              </div>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="text-sm text-muted-foreground">
                    - {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`mt-7 inline-flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-border bg-background text-foreground hover:bg-accent"
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
