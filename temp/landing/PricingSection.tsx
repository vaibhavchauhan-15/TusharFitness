"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const plans = [
  {
    name: "Starter",
    price: "₹0",
    period: "3 days",
    description: "Test the platform before committing",
    features: [
      "1 workout plan",
      "1 diet plan",
      "BMI calculator",
      "Limited AI coach (3 messages)",
    ],
    cta: "Start Starter",
    href: "/dashboard",
    highlighted: false,
    badge: null,
  },
  {
    name: "Build",
    price: "₹79",
    period: "/month",
    description: "Perfect for beginners starting their journey",
    features: [
      "All workout plans",
      "Full diet library",
      "Progress tracking",
      "Streak system",
      "Email support",
    ],
    cta: "Choose Build",
    href: "/dashboard",
    highlighted: false,
    badge: null,
  },
  {
    name: "Transform",
    price: "₹99",
    period: "/month",
    description: "Best for serious fitness enthusiasts",
    features: [
      "Everything in Build",
      "AI Fitness Coach (unlimited)",
      "Meal calorie tracker",
      "Habit builder",
      "Priority support",
      "Workout scheduler",
    ],
    cta: "Choose Transform",
    href: "/dashboard",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Elite",
    price: "₹199",
    period: "/month",
    description: "For those who want the complete transformation",
    features: [
      "Everything in Transform",
      "Personal guide sessions",
      "1-on-1 video coaching",
      "Custom diet + workout",
      "Priority WhatsApp access",
      "Progress PDF reports",
      "Referral rewards",
    ],
    cta: "Choose Elite",
    href: "/dashboard",
    highlighted: false,
    badge: "Best Value",
  },
];

export function PricingSection() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto" id="pricing" aria-label="Subscription plans and pricing">
      <div className="text-center mb-16">
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="w-12 h-px bg-primary" />
          <span className="text-primary font-[Space_Grotesk] text-xs uppercase tracking-widest">Plans & Pricing</span>
          <span className="w-12 h-px bg-primary" />
        </div>
        <h2 className="text-4xl md:text-5xl font-[Epilogue] font-black italic tracking-tight uppercase mb-4">
          Invest in Your<br />
          <span className="text-transparent bg-clip-text bg-linear-to-br from-primary to-primary-container">
            Best Self
          </span>
        </h2>
        <p className="text-on-surface-variant max-w-xl mx-auto">
          Plans designed for every stage of your fitness journey. Upgrade or downgrade anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-3xl p-6 border flex flex-col transition-all duration-300 hover:-translate-y-1 ${
              plan.highlighted
                ? "bg-gradient-to-b from-surface-container-high to-surface-container border-primary/40 shadow-[0_0_40px_rgba(255,145,89,0.15)]"
                : "bg-surface-container border-outline-variant/10 hover:border-outline-variant/30"
            }`}
          >
            {/* Badge */}
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-on-accent font-[Epilogue] font-black text-xs uppercase rounded-full whitespace-nowrap">
                {plan.badge}
              </div>
            )}

            {/* Plan Info */}
            <div className="mb-6">
              <p className="font-[Space_Grotesk] text-xs uppercase tracking-widest text-on-surface-variant mb-2">{plan.name}</p>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-[Epilogue] font-black italic text-on-surface">{plan.price}</span>
                <span className="text-on-surface-variant font-[Space_Grotesk] text-sm mb-1">{plan.period}</span>
              </div>
              <p className="text-on-surface-variant text-sm">{plan.description}</p>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm">
                  <Icon name="check_circle" filled size={18} className="text-primary shrink-0" />
                  <span className="text-on-surface-variant font-[Inter]">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href={plan.href}
              id={`pricing-${plan.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`}
              className={`block py-3.5 rounded-xl font-[Epilogue] font-extrabold uppercase text-center text-sm transition-all active:scale-95 ${
                plan.highlighted
                  ? "bg-linear-to-br from-primary to-primary-container text-on-accent shadow-[0_0_20px_rgba(255,145,89,0.3)] hover:scale-105"
                  : "bg-surface-container-highest text-primary hover:bg-primary hover:text-on-accent"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="text-center text-on-surface-variant text-sm mt-8 font-[Space_Grotesk]">
        Starter includes a 3-day free trial. No credit card required to start. Cancel anytime.
      </p>
    </section>
  );
}
