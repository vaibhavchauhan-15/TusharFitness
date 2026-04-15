"use client";

import NumberFlow from "@number-flow/react";
import {
  Activity,
  BadgeCheck,
  Bot,
  ChartLine,
  Dumbbell,
  Flame,
  IndianRupee,
  MessageCircle,
  Salad,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles as SparklesComp } from "@/components/ui/sparkles";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { cn } from "@/lib/utils";

const YEARLY_DISCOUNT_PERCENT = 20;
const YEARLY_MULTIPLIER = (100 - YEARLY_DISCOUNT_PERCENT) / 100;

type BillingPeriod = "monthly" | "yearly";

type Plan = {
  name: string;
  price: number;
  description: string;
  buttonText: string;
  includes: string[];
  popular?: boolean;
  highlight?: boolean;
  badge?: string;
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: 0,
    description: "Start your fitness journey with basic tools",
    buttonText: "Start Free",
    includes: [
      "1 beginner workout plan",
      "1 basic diet plan",
      "BMI calculator",
      "Limited AI coach (daily cap)",
    ],
  },
  {
    name: "Build",
    price: 99,
    popular: true,
    badge: "Most Popular",
    description: "Stay consistent with structured plans and guidance",
    buttonText: "Start Building",
    includes: [
      "Everything in Starter",
      "Standard workout plans (home + gym)",
      "Standard diet plans (veg + non-veg)",
      "AI coach (improved limits)",
      "Basic progress tracking",
    ],
  },
  {
    name: "Transform",
    price: 149,
    description: "Track progress and level up your fitness journey",
    buttonText: "Transform Now",
    includes: [
      "Everything in Build",
      "100+ premium workouts",
      "Goal-based diet plans",
      "Progress dashboard",
      "Streak, weight and strength tracking",
    ],
  },
  {
    name: "Arnold",
    price: 199,
    highlight: true,
    badge: "Best Results",
    description: "Full transformation with personal guidance",
    buttonText: "Go Arnold 💪",
    includes: [
      "Everything in Transform",
      "Personal trainer support",
      "Priority chat support",
      "Personalized fitness roadmap",
      "Weekly progress insights",
    ],
  },
];

const featureIconMatchers: Array<{ pattern: RegExp; icon: LucideIcon }> = [
  { pattern: /workout|gym/i, icon: Dumbbell },
  { pattern: /diet|veg/i, icon: Salad },
  { pattern: /bmi/i, icon: Activity },
  { pattern: /ai|trainer|coach/i, icon: Bot },
  { pattern: /progress|dashboard|insight/i, icon: ChartLine },
  { pattern: /streak/i, icon: Flame },
  { pattern: /weight/i, icon: Scale },
  { pattern: /strength/i, icon: Trophy },
  { pattern: /priority|chat/i, icon: MessageCircle },
  { pattern: /roadmap/i, icon: TrendingUp },
];

function getFeatureIcon(feature: string): LucideIcon {
  const match = featureIconMatchers.find(({ pattern }) => pattern.test(feature));
  return match?.icon ?? BadgeCheck;
}

function getDisplayedMonthlyPrice(monthlyPrice: number, period: BillingPeriod): number {
  if (period === "monthly" || monthlyPrice === 0) {
    return monthlyPrice;
  }

  return Math.round(monthlyPrice * YEARLY_MULTIPLIER);
}

function getYearlyTotal(monthlyPrice: number): number {
  if (monthlyPrice === 0) {
    return 0;
  }

  return Math.round(monthlyPrice * 12 * YEARLY_MULTIPLIER);
}

function PricingSwitch({
  period,
  onSwitch,
}: {
  period: BillingPeriod;
  onSwitch: (nextValue: BillingPeriod) => void;
}) {
  return (
    <div className="flex justify-center">
      <div className="relative z-10 mx-auto flex w-fit rounded-full border border-border/70 bg-card/75 p-1 shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={() => onSwitch("monthly")}
          className={cn(
            "relative z-10 h-11 w-fit rounded-full px-4 text-sm font-semibold transition-colors sm:px-6",
            period === "monthly" ? "text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {period === "monthly" ? (
            <motion.span
              layoutId="pricing-switch"
              className="absolute inset-0 rounded-full border border-primary/45 bg-primary shadow-md"
              transition={{ type: "spring", stiffness: 500, damping: 34 }}
            />
          ) : null}
          <span className="relative">Monthly</span>
        </button>

        <button
          type="button"
          onClick={() => onSwitch("yearly")}
          className={cn(
            "relative z-10 h-11 w-fit shrink-0 rounded-full px-4 text-sm font-semibold transition-colors sm:px-6",
            period === "yearly" ? "text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {period === "yearly" ? (
            <motion.span
              layoutId="pricing-switch"
              className="absolute inset-0 rounded-full border border-primary/45 bg-primary shadow-md"
              transition={{ type: "spring", stiffness: 500, damping: 34 }}
            />
          ) : null}

          <span className="relative flex items-center gap-2">
            Yearly
            <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]">
              20% off
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

export default function PricingSection4() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const pricingRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (index: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: index * 0.1,
        duration: 0.4,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  return (
    <section
      id="pricing"
      ref={pricingRef}
      aria-label="Pricing plans"
      className="relative overflow-hidden border-y border-border/60 bg-linear-to-b from-background via-background to-primary/10 py-24"
    >
      <TimelineContent
        animationNum={0}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden mask-[radial-gradient(55%_55%,white,transparent)]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--border)_35%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--border)_25%,transparent)_1px,transparent_1px)] bg-size-[68px_72px]" />
        <SparklesComp
          density={1200}
          direction="bottom"
          speed={0.8}
          color="var(--sparkles-color)"
          className="absolute inset-x-0 bottom-0 h-full w-full mask-[radial-gradient(50%_50%,white,transparent_85%)]"
        />
      </TimelineContent>

      <TimelineContent
        animationNum={1}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="pointer-events-none absolute inset-x-0 -top-40 h-[130vh]"
      >
        <div
          className="absolute left-1/2 top-0 h-[150vh] w-[150vh] -translate-x-1/2 rounded-full"
          style={{
            border: "180px solid color-mix(in oklab, var(--gradient-color) 42%, transparent)",
            filter: "blur(88px)",
            WebkitFilter: "blur(88px)",
            opacity: 0.4,
          }}
        />
      </TimelineContent>

      <div className="relative z-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <article className="mx-auto mb-10 max-w-4xl space-y-4 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            <VerticalCutReveal
              splitBy="words"
              staggerDuration={0.1}
              staggerFrom="first"
              reverse
              containerClassName="justify-center"
              transition={{ type: "spring", stiffness: 230, damping: 34, delay: 0 }}
            >
              Premium plans built for every stage of your fitness journey
            </VerticalCutReveal>
          </h2>

          <TimelineContent as="p" animationNum={2} timelineRef={pricingRef} customVariants={revealVariants} className="text-muted-foreground">
            Start free, upgrade when ready, and keep your progress in one account.
          </TimelineContent>

          <TimelineContent
            as="div"
            animationNum={3}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-muted-foreground sm:text-sm"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Trusted by 10,000+ Indian users
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              No credit card required
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/10 px-3 py-1.5 text-primary backdrop-blur">
              <Flame className="h-3.5 w-3.5" />
              Limited time launch pricing
            </span>
          </TimelineContent>

          <TimelineContent as="div" animationNum={4} timelineRef={pricingRef} customVariants={revealVariants} className="pt-2">
            <PricingSwitch period={billingPeriod} onSwitch={setBillingPeriod} />
          </TimelineContent>
        </article>

        <div
          className="pointer-events-none absolute left-[10%] right-[10%] top-20 h-72"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, color-mix(in oklab, var(--gradient-color) 42%, transparent) 0%, transparent 72%)",
            opacity: 0.42,
            mixBlendMode: "screen",
          }}
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, index) => {
            const displayedPrice = getDisplayedMonthlyPrice(plan.price, billingPeriod);
            const yearlyTotal = getYearlyTotal(plan.price);

            return (
              <TimelineContent
                key={plan.name}
                as="div"
                animationNum={5 + index}
                timelineRef={pricingRef}
                customVariants={revealVariants}
                className="h-full"
              >
                <motion.div
                  className="h-full"
                  whileHover={{ y: -8, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                >
                  <Card
                    className={cn(
                      "group relative flex h-full flex-col overflow-visible border border-border/70 bg-card/70 text-card-foreground shadow-lg backdrop-blur-xl transition-all duration-300 md:min-h-144",
                      plan.popular &&
                        "border-primary/60 bg-linear-to-b from-card to-primary/16 shadow-primary/35",
                      plan.highlight &&
                        "border-primary/45 bg-linear-to-b from-card to-primary/12 shadow-primary/30",
                    )}
                  >
                    {plan.badge ? (
                      <span
                        className={cn(
                          "absolute -top-4 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] shadow-md",
                          plan.popular
                            ? "border-primary/45 bg-primary text-primary-foreground"
                            : "border-primary/30 bg-card text-primary",
                        )}
                      >
                        {plan.badge}
                      </span>
                    ) : null}

                    <CardHeader className={cn("min-h-54 text-left", plan.badge && "pt-6")}>
                      <h3 className="mb-1 text-2xl font-semibold text-foreground">{plan.name}</h3>

                      <div className="mt-2 flex items-end gap-1 text-foreground">
                        <IndianRupee className="mb-1 h-5 w-5 text-muted-foreground" />
                        <NumberFlow value={displayedPrice} className="text-4xl font-semibold tabular-nums" />
                        <span className="mb-1 ml-1 text-sm text-muted-foreground">/month</span>
                      </div>

                      {billingPeriod === "yearly" && plan.price > 0 ? (
                        <p className="mt-1 text-xs font-medium text-primary">
                          {YEARLY_DISCOUNT_PERCENT}% OFF yearly · billed ₹{yearlyTotal}/year
                        </p>
                      ) : null}

                      {billingPeriod === "yearly" && plan.price > 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Regular ₹{plan.price}/month, now effectively ₹{displayedPrice}/month
                        </p>
                      ) : null}

                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col pt-0">
                      <Link
                        href="/signup"
                        className={cn(
                          "mb-6 inline-flex h-12 w-full items-center justify-center rounded-xl border px-4 text-base font-semibold transition-all duration-200",
                          plan.popular
                            ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                            : plan.highlight
                              ? "border-primary/55 bg-primary/90 text-primary-foreground hover:bg-primary"
                              : "border-primary/35 bg-primary/15 text-foreground hover:bg-primary/25",
                        )}
                      >
                        {plan.buttonText}
                      </Link>

                      <div className="space-y-3 border-t border-border/60 pt-4">
                        <h4 className="text-base font-medium text-foreground">Includes:</h4>
                        <ul className="space-y-2.5">
                          {plan.includes.map((feature) => {
                            const Icon = getFeatureIcon(feature);

                            return (
                              <li key={`${plan.name}-${feature}`} className="flex items-start gap-2.5">
                                <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary/20 text-primary">
                                  <Icon className="h-3.5 w-3.5" />
                                </span>
                                <span className="text-sm text-muted-foreground">{feature}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TimelineContent>
            );
          })}
        </div>

        <TimelineContent
          as="div"
          animationNum={10}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-2"
        >
          <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-card/60 px-4 py-3 text-center backdrop-blur">
            <IndianRupee className="h-4 w-4 text-primary" />
            Save ₹500+ vs hiring a trainer
          </div>
          <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-card/60 px-4 py-3 text-center backdrop-blur">
            <MessageCircle className="h-4 w-4 text-primary" />
            Works on WhatsApp-style chat
          </div>
        </TimelineContent>
      </div>
    </section>
  );
}