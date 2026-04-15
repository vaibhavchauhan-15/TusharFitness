"use client";

import { Apple, Leaf, Salad, Soup } from "lucide-react";
import { ExpandingCards, type CardItem } from "@/components/ui/expanding-cards";

const diets: CardItem[] = [
  {
    id: "high-protein-vegetarian",
    title: "High-Protein Vegetarian",
    description: "Macro balanced paneer, lentils, tofu, and grains tuned for strength targets.",
    imgSrc:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
    icon: <Leaf size={22} className="text-white" />,
    linkHref: "/onboarding",
  },
  {
    id: "lean-non-veg-plans",
    title: "Lean Non-Veg Plans",
    description: "Fat-loss-first Indian meals with calorie control and high satiety.",
    imgSrc:
      "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=1200&q=80",
    icon: <Salad size={22} className="text-white" />,
    linkHref: "/onboarding",
  },
  {
    id: "muscle-gain-meals",
    title: "Muscle Gain Meals",
    description: "High-calorie performance meals with clean carb and protein structures.",
    imgSrc:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80",
    icon: <Apple size={22} className="text-white" />,
    linkHref: "/onboarding",
  },
  {
    id: "weight-loss-thali",
    title: "Weight-Loss Thali",
    description: "Sustainable thali-inspired plans for steady fat loss and long-term adherence.",
    imgSrc:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80",
    icon: <Soup size={22} className="text-white" />,
    linkHref: "/onboarding",
  },
];

export function DietSection() {
  return (
    <section
      id="diet"
      className="border-b border-border/60 py-24"
      aria-label="Diet programs"
      data-scroll-reveal
      data-scroll-zoom
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Diet Section</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Personalized Indian nutrition users can actually follow.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            From fat loss to muscle gain, every diet path maps to familiar food choices and practical meal timing.
          </p>
        </div>

        <ExpandingCards
          items={diets}
          defaultActiveIndex={0}
          className="mt-10 h-140 max-w-none md:h-105"
          data-scroll-stagger
        />
        <p className="mt-4 text-sm text-muted-foreground">Each plan maps to familiar Indian meals with practical timing.</p>
      </div>
    </section>
  );
}
