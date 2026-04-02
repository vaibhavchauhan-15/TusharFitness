import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LazyWorkoutVideo } from "@/components/workouts/lazy-workout-video";
import { getSessionState } from "@/lib/session";
import {
  getWorkoutCatalogForUser,
  resolvePreferredWorkoutGoalSlug,
} from "@/lib/supabase/workouts";

type ExerciseDetailPageProps = {
  params: Promise<{ exerciseSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeSearchParam(value: string | string[] | undefined) {
  const resolvedValue = Array.isArray(value) ? value[0] : value;

  if (!resolvedValue) {
    return null;
  }

  const normalized = resolvedValue.trim().toLowerCase();
  return /^[a-z0-9-]{2,96}$/.test(normalized) ? normalized : null;
}

function formatRestTime(restSeconds: number | null) {
  if (!restSeconds || restSeconds <= 0) {
    return "As needed";
  }

  if (restSeconds < 60) {
    return `${restSeconds} sec`;
  }

  const minutes = Math.floor(restSeconds / 60);
  const seconds = restSeconds % 60;

  if (!seconds) {
    return `${minutes} min`;
  }

  return `${minutes} min ${seconds} sec`;
}

export default async function ExerciseDetailPage({
  params,
  searchParams,
}: ExerciseDetailPageProps) {
  const [{ exerciseSlug }, query, catalog, session] = await Promise.all([
    params,
    searchParams,
    getWorkoutCatalogForUser(),
    getSessionState(),
  ]);

  const normalizedExerciseSlug = exerciseSlug.trim().toLowerCase();
  const exercise = catalog.exercises.find((item) => item.slug === normalizedExerciseSlug) ?? null;

  if (!exercise) {
    notFound();
  }

  const preferredGoalSlug = resolvePreferredWorkoutGoalSlug(session?.user.goal, catalog.goals);
  const goalSlug = normalizeSearchParam(query.goal) ?? preferredGoalSlug;
  const bodyPartSlug = normalizeSearchParam(query.bodyPart) ?? exercise.bodyPartSlug;

  const backToExercisesParams = new URLSearchParams();
  if (goalSlug) {
    backToExercisesParams.set("goal", goalSlug);
  }
  if (bodyPartSlug) {
    backToExercisesParams.set("bodyPart", bodyPartSlug);
  }

  const backToExercisesHref = backToExercisesParams.toString()
    ? `/app/workouts/exercises?${backToExercisesParams.toString()}`
    : "/app/workouts/exercises";

  const goal = catalog.goals.find((item) => item.slug === exercise.goalSlug) ?? null;
  const bodyPart = catalog.bodyParts.find((item) => item.slug === exercise.bodyPartSlug) ?? null;
  const restTimeLabel = formatRestTime(exercise.restSeconds);
  const videoPath = exercise.videoPath;

  return (
    <div className="space-y-6 pb-4">
      <Card className="relative overflow-hidden rounded-[34px] p-6 md:p-7">
        <div className="pointer-events-none absolute inset-0 bg-(--gradient-hero) opacity-95" />
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-30" />

        <div className="relative">
          <Badge>Exercise Detail</Badge>
          <h1 className="mt-4 max-w-4xl text-3xl font-bold tracking-tight md:text-4xl">{exercise.name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            {goal?.name ?? "Goal"} - {bodyPart?.name ?? "Body Part"}
          </p>
          <Link
            href={backToExercisesHref}
            className="mt-5 inline-flex rounded-full border border-(--card-border) bg-(--surface-strong) px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-(--primary-soft) hover:text-primary"
          >
            Back to exercises
          </Link>
        </div>
      </Card>

      <Card className="overflow-hidden rounded-[28px] border border-(--card-border) bg-(--surface-strong)">
        {videoPath ? (
          <LazyWorkoutVideo
            path={videoPath}
            poster={exercise.imageUrl}
            className="aspect-video h-full w-full object-cover"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center p-4 text-center text-sm text-muted-foreground">
            Exercise demo video will appear here once uploaded by admin.
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[28px] p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Target Muscle", exercise.targetMuscle],
              ["Equipment", exercise.equipment],
              ["Difficulty", exercise.difficulty],
              ["Sets / Reps", `${exercise.sets} / ${exercise.reps}`],
              ["Rest Time", restTimeLabel],
              ["Body Part", bodyPart?.name ?? "--"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[18px] border border-(--card-border) bg-(--surface-strong) px-3 py-2.5"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>

        </Card>

        <Card className="rounded-[28px] p-4 sm:p-5">
          <div className="rounded-[22px] border border-(--card-border) bg-(--surface-strong) p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Steps / Instructions
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-foreground">
              {exercise.instructions.map((step, index) => (
                <li key={`${exercise.slug}-instruction-${index + 1}`}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="mt-4 rounded-[22px] border border-(--card-border) bg-(--surface-strong) p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Form Cues</p>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-foreground">
              {exercise.formTips.map((tip, index) => (
                <li key={`${exercise.slug}-tip-${index + 1}`} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-[22px] border border-(--card-border) bg-(--surface-strong) p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Common Mistakes
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-foreground">
              {exercise.commonMistakes.map((mistake, index) => (
                <li key={`${exercise.slug}-mistake-${index + 1}`} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
