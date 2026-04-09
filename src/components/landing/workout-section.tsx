"use client";

import Link from "next/link";
import { Dumbbell, Flame, House, Zap } from "lucide-react";
import { ExpandingCards, type CardItem } from "@/components/ui/expanding-cards";

const workoutPrograms: CardItem[] = [
  {
    id: "fat-loss-accelerator",
    title: "Fat Loss Accelerator",
    description: "Beginner · 45 min sessions with progressive cardio + strength intervals.",
    imgSrc:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
    icon: <Flame size={22} className="text-white" />,
    linkHref: "/workouts",
  },
  {
    id: "muscle-builder-split",
    title: "Muscle Builder Split",
    description: "Intermediate · 60 min hypertrophy-focused split with clear overload blocks.",
    imgSrc:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
    icon: <Dumbbell size={22} className="text-white" />,
    linkHref: "/workouts",
  },
  {
    id: "hiit-endurance",
    title: "HIIT Endurance",
    description: "Advanced · 30 min high-intensity circuits tuned for stamina and conditioning.",
    imgSrc:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
    icon: <Zap size={22} className="text-white" />,
    linkHref: "/workouts",
  },
  {
    id: "home-no-equipment",
    title: "Home No-Equipment",
    description: "All levels · 35 min bodyweight sessions built for consistency at home.",
    imgSrc:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80",
    icon: <House size={22} className="text-white" />,
    linkHref: "/workouts",
  },
];

export function WorkoutSection() {
  return (
    <section
      id="workouts"
      className="border-b border-border/60 py-24"
      aria-label="Workout programs"
      data-scroll-reveal
      data-scroll-zoom
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Workout Section</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Structured plans for every fitness goal.
            </h2>
          </div>
          <Link
            href="/workouts"
            className="inline-flex items-center text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Browse full workout library
          </Link>
        </div>

        <ExpandingCards
          items={workoutPrograms}
          defaultActiveIndex={1}
          className="mt-10 h-140 max-w-none md:h-105"
          data-scroll-stagger
        />
        <p className="mt-4 text-sm text-muted-foreground">Hover on desktop or tap on mobile to expand a program.</p>
      </div>
    </section>
  );
}
