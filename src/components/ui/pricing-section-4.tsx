"use client";

import Link from "next/link";
import NumberFlow from "@number-flow/react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles as SparklesComp } from "@/components/ui/sparkles";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    description: "Great for trying the platform and building your first fitness streak.",
    price: 0,
    yearlyPrice: 0,
    buttonText: "Start free",
    buttonVariant: "outline" as const,
    includes: [
      "Free includes:",
      "1 workout plan",
      "1 diet plan",
      "BMI calculator",
      "Limited AI coach messages",
    ],
  },
  {
    name: "Build",
    description: "Best value for steady progress, better tracking, and daily coaching support.",
    price: 79,
    yearlyPrice: 790,
    buttonText: "Choose Build",
    buttonVariant: "default" as const,
    popular: true,
    includes: [
      "Everything in Starter, plus:",
      "Workout library access",
      "Diet library access",
      "Progress dashboard",
      "Streak tracker",
    ],
  },
  {
    name: "Transform",
    description: "Advanced plan with unlimited AI support and deeper tracking for body transformation.",
    price: 99,
    yearlyPrice: 990,
    buttonText: "Choose Transform",
    buttonVariant: "outline" as const,
    includes: [
      "Everything in Build, plus:",
      "Unlimited AI coach",
      "Meal calorie tracking",
      "Priority support",
      "Weekly progress insights",
    ],
  },
];

function PricingSwitch({ onSwitch }: { onSwitch: (value: string) => void }) {
  const [selected, setSelected] = useState("0");

  const handleSwitch = (value: string) => {
    setSelected(value);
    onSwitch(value);
  };

  return (
    <div className="flex justify-center">
      <div className="relative z-10 mx-auto flex w-fit rounded-full border border-border/70 bg-card/70 p-1 shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={() => handleSwitch("0")}
          className={cn(
            "relative z-10 h-10 w-fit rounded-full px-4 py-1 text-sm font-medium transition-colors sm:px-6 sm:py-2",
            selected === "0" ? "text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {selected === "0" ? (
            <motion.span
              layoutId="pricing-switch"
              className="absolute left-0 top-0 h-10 w-full rounded-full border border-primary/40 bg-linear-to-t from-primary/85 to-primary shadow-sm"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          ) : null}
          <span className="relative">Monthly</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitch("1")}
          className={cn(
            "relative z-10 h-10 w-fit shrink-0 rounded-full px-4 py-1 text-sm font-medium transition-colors sm:px-6 sm:py-2",
            selected === "1" ? "text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {selected === "1" ? (
            <motion.span
              layoutId="pricing-switch"
              className="absolute left-0 top-0 h-10 w-full rounded-full border border-primary/40 bg-linear-to-t from-primary/85 to-primary shadow-sm"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          ) : null}
          <span className="relative flex items-center gap-2">Yearly</span>
        </button>
      </div>
    </div>
  );
}

export default function PricingSection4() {
  const [isYearly, setIsYearly] = useState(false);
  const pricingRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (index: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: index * 0.12,
        duration: 0.45,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  const togglePricingPeriod = (value: string) => setIsYearly(Number.parseInt(value, 10) === 1);

  return (
    <section
      id="pricing"
      className="relative overflow-hidden border-y border-border/60 bg-linear-to-b from-background via-background to-primary/5 py-24"
      aria-label="Pricing plans"
      ref={pricingRef}
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
            opacity: 0.42,
          }}
        />
      </TimelineContent>

      <div className="relative z-20 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <article className="mx-auto mb-8 max-w-3xl space-y-3 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            <VerticalCutReveal
              splitBy="words"
              staggerDuration={0.12}
              staggerFrom="first"
              reverse
              containerClassName="justify-center"
              transition={{
                type: "spring",
                stiffness: 240,
                damping: 36,
                delay: 0,
              }}
            >
              Plans that work with your pace and your goals
            </VerticalCutReveal>
          </h2>

          <TimelineContent as="p" animationNum={2} timelineRef={pricingRef} customVariants={revealVariants} className="text-muted-foreground">
            Start free, scale when ready, and keep all your progress in one account.
          </TimelineContent>

          <TimelineContent as="div" animationNum={3} timelineRef={pricingRef} customVariants={revealVariants} className="pt-2">
            <PricingSwitch onSwitch={togglePricingPeriod} />
          </TimelineContent>
        </article>

        <div
          className="pointer-events-none absolute left-[15%] right-[15%] top-10 h-60"
          style={{
            backgroundImage: "radial-gradient(circle at center, color-mix(in oklab, var(--gradient-color) 38%, transparent) 0%, transparent 70%)",
            opacity: 0.45,
            mixBlendMode: "screen",
          }}
        />

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan, index) => (
            <TimelineContent
              key={plan.name}
              as="div"
              animationNum={4 + index}
              timelineRef={pricingRef}
              customVariants={revealVariants}
              className="h-full"
            >
              <Card
                className={cn(
                  "relative flex h-full flex-col border-border/70 bg-card/80 text-card-foreground shadow-md backdrop-blur-sm",
                  plan.popular && "border-primary/45 bg-linear-to-b from-card to-primary/10 shadow-[0_18px_80px_color-mix(in_oklab,var(--primary)_35%,transparent)]",
                )}
              >
                {plan.popular ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/40 bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-foreground">
                    Most popular
                  </span>
                ) : null}

                <CardHeader className="text-left">
                  <h3 className="mb-2 text-2xl font-semibold text-foreground">{plan.name}</h3>
                  <div className="flex items-baseline">
                    <span className="mr-1 text-lg font-medium text-muted-foreground">Rs</span>
                    <NumberFlow value={isYearly ? plan.yearlyPrice : plan.price} className="text-4xl font-semibold text-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">/{isYearly ? "year" : "month"}</span>
                  </div>
                  {isYearly && plan.price > 0 ? (
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-primary">
                      Effective Rs {Math.round(plan.yearlyPrice / 12)}/month
                    </p>
                  ) : null}
                  <p className="mt-3 text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col pt-0">
                  <Link
                    href="/signup"
                    className={cn(
                      "mb-6 inline-flex h-12 w-full items-center justify-center rounded-xl border px-4 text-base font-semibold transition-colors",
                      plan.popular
                        ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                        : plan.buttonVariant === "outline"
                          ? "border-border bg-background text-foreground hover:bg-accent"
                          : "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                  >
                    {plan.buttonText}
                  </Link>

                  <div className="space-y-3 border-t border-border/60 pt-4">
                    <h4 className="text-base font-medium text-foreground">{plan.includes[0]}</h4>
                    <ul className="space-y-2">
                      {plan.includes.slice(1).map((feature) => (
                        <li key={`${plan.name}-${feature}`} className="flex items-center gap-2">
                          <span className="grid h-2.5 w-2.5 place-content-center rounded-full bg-primary/70" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TimelineContent>
          ))}
        </div>
      </div>
    </section>
  );
}
