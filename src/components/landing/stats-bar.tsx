"use client";

import { useEffect, useRef } from "react";
import { gsap, setupGSAP } from "@/lib/gsap";

const stats = [
  {
    value: "10,000+",
    label: "Active users",
    target: 10000,
    format: (nextValue: number) => `${Math.round(nextValue).toLocaleString("en-IN")}+`,
  },
  {
    value: "500+",
    label: "Diet combinations",
    target: 500,
    format: (nextValue: number) => `${Math.round(nextValue)}+`,
  },
  {
    value: "300+",
    label: "Workout templates",
    target: 300,
    format: (nextValue: number) => `${Math.round(nextValue)}+`,
  },
  {
    value: "24/7",
    label: "AI support cycle",
    target: 24,
    format: (nextValue: number) => `${Math.round(nextValue)}/7`,
  },
];

export function StatsBar() {
  const sectionRef = useRef<HTMLElement>(null);
  const valueRefs = useRef<Array<HTMLParagraphElement | null>>([]);

  useEffect(() => {
    setupGSAP();

    const section = sectionRef.current;

    if (!section) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      valueRefs.current.forEach((element, index) => {
        const stat = stats[index];

        if (!element || !stat) {
          return;
        }

        const counter = { value: 0 };

        gsap.to(counter, {
          value: stat.target,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 78%",
            once: true,
          },
          onUpdate: () => {
            element.textContent = stat.format(counter.value);
          },
        });
      });
    }, section);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="border-b border-border/60 py-12"
      aria-label="Key platform stats"
      data-scroll-reveal
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Platform traction at a glance
        </p>
        <div
          className="grid gap-3 rounded-3xl border border-border/70 bg-card/80 p-3 shadow-[0_18px_50px_rgba(2,6,23,0.08)] sm:grid-cols-2 xl:grid-cols-4"
          data-scroll-stagger
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              data-stagger-item
              className="rounded-2xl border border-border/60 bg-background/85 p-6 text-center"
            >
              <p
                ref={(element) => {
                  valueRefs.current[index] = element;
                }}
                className="text-3xl font-semibold tracking-tight text-foreground"
              >
                {stat.value}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
