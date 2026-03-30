"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { WorkoutExercise } from "@/lib/supabase/workouts";

type ExerciseCardProps = {
  exercise: WorkoutExercise;
  href: string;
};

function toTitleCase(value: string) {
  return value.replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function formatExerciseName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Exercise";
  }

  return trimmed === trimmed.toLowerCase() ? toTitleCase(trimmed) : trimmed;
}

export function ExerciseCard({ exercise, href }: ExerciseCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const displayName = useMemo(() => formatExerciseName(exercise.name), [exercise.name]);

  const difficultyLabel = useMemo(() => {
    const raw = exercise.difficulty.trim();
    if (!raw || raw.toLowerCase() === "not set") {
      return "All levels";
    }

    return raw === raw.toLowerCase() ? toTitleCase(raw) : raw;
  }, [exercise.difficulty]);

  const targetLabel =
    exercise.targetMuscle.trim() && exercise.targetMuscle !== "Not specified"
      ? exercise.targetMuscle
      : "Full body";

  const setsRepsLabel =
    exercise.sets !== "--" && exercise.reps !== "--"
      ? `${exercise.sets} x ${exercise.reps}`
      : "Custom plan";

  const equipmentLabel =
    exercise.equipment.trim() && exercise.equipment !== "Not specified"
      ? exercise.equipment
      : "Bodyweight";

  const formCue = exercise.shortFormCue.trim() || "Keep the movement controlled and stable.";

  return (
    <Link href={href} className="group block h-full focus-visible:outline-none">
      <Card className="flex h-full flex-col overflow-hidden rounded-3xl border border-(--card-border) bg-(--surface-strong) shadow-[0_12px_26px_rgba(40,18,6,0.08)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-(--primary)/45 group-hover:shadow-[0_20px_42px_rgba(217,93,10,0.16)] group-focus-visible:ring-2 group-focus-visible:ring-(--ring)">
        <div className="relative aspect-4/3 overflow-hidden border-b border-(--card-border) bg-muted">
          {!imageFailed ? (
            <Image
              src={exercise.imageUrl}
              alt={displayName}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-(--primary-soft) via-background to-muted" />
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/30 via-black/10 to-transparent" />
          <span className="absolute right-3 top-3 rounded-full border border-(--card-border) bg-(--background)/90 px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground backdrop-blur-sm">
            {difficultyLabel}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="space-y-1">
            <h3 className="line-clamp-2 text-[1.06rem] font-semibold leading-snug text-foreground">{displayName}</h3>
            <p className="text-xs text-muted-foreground">Balanced setup for focused and safe execution.</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-(--card-border) bg-(--background)/80 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Target</p>
              <p className="mt-1 line-clamp-1 text-sm font-semibold text-foreground">{targetLabel}</p>
            </div>
            <div className="rounded-xl border border-(--card-border) bg-(--background)/80 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Sets x Reps</p>
              <p className="mt-1 line-clamp-1 text-sm font-semibold text-foreground">{setsRepsLabel}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="line-clamp-1">
              <span className="font-semibold text-foreground">Equipment:</span> {equipmentLabel}
            </p>

            <p className="line-clamp-2 leading-6">
              <span className="font-semibold text-foreground">Form cue:</span> {formCue}
            </p>
          </div>

        </div>
      </Card>
    </Link>
  );
}
