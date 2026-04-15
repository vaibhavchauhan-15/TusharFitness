"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { LANDING_APPLE_SPRING, LANDING_STAT_STAGGER_INTENSITY } from "@/lib/motion";

type Stat = {
  value: string;
  label: string;
  target: number;
  format: (nextValue: number) => string;
};

const stats: Stat[] = [
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

type StatsBarProps = {
  staggerIntensity?: number;
  peakMode?: "hold" | "cinematic";
};

export function StatsBar({
  staggerIntensity = LANDING_STAT_STAGGER_INTENSITY,
  peakMode = "hold",
}: StatsBarProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  return (
    <section
      ref={sectionRef}
      className="border-b border-border/60 py-12"
      aria-label="Key platform stats"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Platform traction at a glance
        </p>
        <div className="grid gap-3 rounded-3xl border border-border/70 bg-card/80 p-3 shadow-[0_18px_50px_rgba(2,6,23,0.08)] sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <StatItem
              key={stat.label}
              stat={stat}
              index={index}
              totalCount={stats.length}
              staggerIntensity={staggerIntensity}
              peakMode={peakMode}
              progress={scrollYProgress}
              prefersReducedMotion={Boolean(prefersReducedMotion)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatItem({
  stat,
  index,
  totalCount,
  staggerIntensity,
  peakMode,
  progress,
  prefersReducedMotion,
}: {
  stat: Stat;
  index: number;
  totalCount: number;
  staggerIntensity: number;
  peakMode: "hold" | "cinematic";
  progress: MotionValue<number>;
  prefersReducedMotion: boolean;
}) {
  const centeredIndex = index - (totalCount - 1) / 2;
  const staggerOffset = centeredIndex * staggerIntensity;
  const shiftedProgress = useTransform(progress, (latest) => latest - staggerOffset);

  const emphasisProgress = useTransform(
    shiftedProgress,
    [0, 0.5, 1],
    peakMode === "cinematic" ? [0, 1, 0] : [0, 1, 1],
  );
  const rawValue = useTransform(emphasisProgress, [0, 1], [0, stat.target]);
  const smoothValue = useSpring(rawValue, LANDING_APPLE_SPRING);
  const staticValue = useMotionValue(stat.target);
  const cardOpacity = useTransform(emphasisProgress, [0, 1], [0.58, 1]);
  const cardScale = useTransform(emphasisProgress, [0, 1], [0.95, 1.02]);
  const cardBrightness = useTransform(emphasisProgress, [0, 1], [0.94, 1]);
  const cardFilter = useMotionTemplate`brightness(${cardBrightness})`;
  const numberGlowStrength = useTransform(emphasisProgress, [0, 1], [0.04, 0.28]);
  const numberShadow = useMotionTemplate`0 0 16px color-mix(in oklab, var(--primary) calc(${numberGlowStrength} * 100%), transparent)`;

  return (
    <motion.div
      className="rounded-2xl border border-border/60 bg-background/85 p-7 text-center md:p-8"
      style={
        prefersReducedMotion
          ? undefined
          : {
              opacity: cardOpacity,
              scale: cardScale,
              filter: cardFilter,
            }
      }
    >
      <motion.p
        className="bg-linear-to-r from-foreground via-foreground to-primary bg-clip-text font-extrabold tracking-[-0.02em] text-transparent"
        style={
          prefersReducedMotion
            ? {
                fontSize: "clamp(2rem, 5vw, 4rem)",
                lineHeight: 0.96,
              }
            : {
                fontSize: "clamp(2rem, 5vw, 4rem)",
                lineHeight: 0.96,
                textShadow: numberShadow,
              }
        }
      >
        <AnimatedNumber value={prefersReducedMotion ? staticValue : smoothValue} format={stat.format} />
      </motion.p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-sm">{stat.label}</p>
    </motion.div>
  );
}

function AnimatedNumber({
  value,
  format,
}: {
  value: MotionValue<number>;
  format: (nextValue: number) => string;
}) {
  const valueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!valueRef.current) {
      return;
    }

    valueRef.current.textContent = format(value.get());
  }, [format, value]);

  useMotionValueEvent(value, "change", (latest) => {
    if (!valueRef.current) {
      return;
    }

    valueRef.current.textContent = format(latest);
  });

  return <span ref={valueRef}>{format(value.get())}</span>;
}
