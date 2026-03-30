"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { OptionSelector } from "@/components/ui/option-selector";
import type { DietPlanView } from "@/lib/supabase/content";

const CATEGORY_OPTIONS = [
  { value: "All", label: "All" },
  { value: "Weight Loss", label: "Weight Loss" },
  { value: "Muscle Gain", label: "Muscle Gain" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Veg Only", label: "Veg Only" },
  { value: "Non-Veg", label: "Non-Veg" },
  { value: "Low Carb", label: "Low Carb" },
  { value: "High Protein", label: "High Protein" },
];

export function FuelBrowser({ plans }: { plans: DietPlanView[] }) {
  const [category, setCategory] = useState("All");

  const filteredPlans = useMemo(
    () => plans.filter((plan) => category === "All" || plan.category === category),
    [category, plans],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge>Diet plans</Badge>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">Indian one-day fuel systems for every body goal.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            Weight loss, muscle gain, maintenance, veg-only, non-veg, low-carb, and high-protein users all get category-specific day plans with familiar Indian meals.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <p className="mb-2 text-sm font-medium">Category</p>
          <OptionSelector
            value={category}
            onValueChange={setCategory}
            options={CATEGORY_OPTIONS}
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {filteredPlans.length > 0 ? (
          filteredPlans.map((plan) => (
            <Card key={plan.id} className="rounded-[32px] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">{plan.category}</p>
                  <h2 className="mt-2 text-2xl font-bold">{plan.title}</h2>
                </div>
                <Badge>{plan.calories} kcal</Badge>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  ["Protein", `${plan.protein}g`],
                  ["Carbs", `${plan.carbs}g`],
                  ["Fats", `${plan.fats}g`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-strong)] p-4"
                  >
                    <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
                    <p className="mt-2 font-heading text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                {plan.meals.map((meal) => (
                  <div
                    key={`${plan.id}-${meal.time}`}
                    className="rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-strong)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{meal.meal}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">{meal.time}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
                      {meal.items.join(" • ")}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ))
        ) : (
          <Card className="rounded-[32px] p-6 text-sm text-[var(--muted-foreground)] xl:col-span-2">
            No diet plans found in the database for this filter.
          </Card>
        )}
      </div>
    </div>
  );
}
