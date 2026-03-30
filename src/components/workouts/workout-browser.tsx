"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BodyPartSelector } from "@/components/workouts/body-part-selector";
import type { WorkoutBodyPart, WorkoutCatalog } from "@/lib/supabase/workouts";

function getBodyPartsForGoal(catalog: WorkoutCatalog, goalSlug: string | null) {
  if (catalog.bodyParts.length === 0) {
    return [] as WorkoutBodyPart[];
  }

  if (!goalSlug) {
    return catalog.bodyParts;
  }

  const available = new Set(
    catalog.exercises
      .filter((exercise) => exercise.goalSlug === goalSlug)
      .map((exercise) => exercise.bodyPartSlug),
  );

  const filteredBodyParts = catalog.bodyParts.filter((bodyPart) => available.has(bodyPart.slug));
  return filteredBodyParts.length > 0 ? filteredBodyParts : catalog.bodyParts;
}

type WorkoutBrowserProps = {
  catalog: WorkoutCatalog;
  initialGoalSlug: string | null;
  initialBodyPartSlug?: string | null;
};

export function WorkoutBrowser({
  catalog,
  initialGoalSlug,
  initialBodyPartSlug: preferredBodyPartSlug = null,
}: WorkoutBrowserProps) {
  const router = useRouter();

  const initialBodyPartOptions = getBodyPartsForGoal(catalog, initialGoalSlug);
  const initialBodyPartSlug =
    preferredBodyPartSlug && initialBodyPartOptions.some((bodyPart) => bodyPart.slug === preferredBodyPartSlug)
      ? preferredBodyPartSlug
      : initialBodyPartOptions[0]?.slug ?? null;

  const [selectedGoalSlug] = useState<string | null>(initialGoalSlug);
  const [selectedBodyPartSlug, setSelectedBodyPartSlug] = useState<string | null>(initialBodyPartSlug);

  const selectedGoal = useMemo(
    () => catalog.goals.find((goal) => goal.slug === selectedGoalSlug) ?? null,
    [catalog.goals, selectedGoalSlug],
  );

  const bodyParts = useMemo(
    () => getBodyPartsForGoal(catalog, selectedGoalSlug),
    [catalog, selectedGoalSlug],
  );

  const handleBodyPartSelect = (bodyPartSlug: string) => {
    setSelectedBodyPartSlug(bodyPartSlug);

    const params = new URLSearchParams();
    if (selectedGoalSlug) {
      params.set("goal", selectedGoalSlug);
    }
    params.set("bodyPart", bodyPartSlug);

    router.push(`/app/workouts/exercises?${params.toString()}`);
  };

  if (catalog.bodyParts.length === 0) {
    return (
      <Card className="rounded-4xl p-6">
        <Badge>Workout Catalog</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Body part library is empty</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          Add exercises with valid goal and body-part slugs to render selector cards.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <Card className="relative overflow-hidden rounded-[34px] p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-(--gradient-hero) opacity-95" />
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-30" />

        <div className="relative space-y-4">
          <Badge>Workout Library</Badge>
          <h1 className="max-w-4xl text-3xl font-bold tracking-tight md:text-4xl">
            Choose a body part to begin your training flow.
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            Clean catalog view for quick selection. Click any body part card to open its exercise list.
          </p>

          <div className="inline-flex items-center gap-2 rounded-full border border-(--card-border) bg-(--background)/75 px-3 py-1.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Goal</span>
            <span>{selectedGoal?.name ?? "Not set"}</span>
          </div>
        </div>
      </Card>

      <BodyPartSelector
        selectedGoalName={selectedGoal?.name ?? "All Goals"}
        bodyParts={bodyParts}
        selectedBodyPartSlug={selectedBodyPartSlug}
        onSelect={handleBodyPartSelect}
      />

      {catalog.exercises.length === 0 ? (
        <Card className="rounded-3xl border border-(--card-border) bg-(--surface-strong) p-5 text-sm text-muted-foreground">
          Body-part cards are visible, but no exercises are currently returned from Supabase for this account.
        </Card>
      ) : null}
    </div>
  );
}
