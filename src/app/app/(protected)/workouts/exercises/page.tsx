import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ExerciseList } from "@/components/workouts/exercise-list";
import { getSessionState } from "@/lib/session";
import {
  buildWorkoutCatalogSlice,
  getWorkoutCatalogForUser,
  resolvePreferredWorkoutGoalSlug,
} from "@/lib/supabase/workouts";

type WorkoutsExercisesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getNormalizedQuerySlug(value: string | string[] | undefined) {
  const firstValue = Array.isArray(value) ? value[0] : value;

  if (!firstValue) {
    return null;
  }

  const normalized = firstValue.trim().toLowerCase();
  return /^[a-z0-9-]{2,96}$/.test(normalized) ? normalized : null;
}

export default async function WorkoutsExercisesPage({ searchParams }: WorkoutsExercisesPageProps) {
  const [catalog, session, query] = await Promise.all([
    getWorkoutCatalogForUser(),
    getSessionState(),
    searchParams,
  ]);

  if (catalog.goals.length === 0 || catalog.exercises.length === 0) {
    return (
      <Card className="rounded-4xl p-6">
        <Badge>Workout Catalog</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Workout library is empty</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          Add workout exercise records with goal/body-part slugs in Supabase to populate the grid cards.
        </p>
      </Card>
    );
  }

  const preferredGoalSlug = resolvePreferredWorkoutGoalSlug(session?.user.goal, catalog.goals);
  const requestedGoalSlug = getNormalizedQuerySlug(query.goal);
  const requestedBodyPartSlug = getNormalizedQuerySlug(query.bodyPart);

  const slice = buildWorkoutCatalogSlice(
    catalog,
    requestedGoalSlug,
    requestedBodyPartSlug,
    null,
    preferredGoalSlug,
  );

  if (!slice.selectedGoalSlug || !slice.selectedBodyPartSlug) {
    return (
      <Card className="rounded-3xl border border-(--card-border) bg-(--surface-strong) p-5 text-sm text-muted-foreground">
        No exercises are available for this selection.
      </Card>
    );
  }

  const selectedGoal = catalog.goals.find((goal) => goal.slug === slice.selectedGoalSlug) ?? null;
  const selectedBodyPart = catalog.bodyParts.find(
    (bodyPart) => bodyPart.slug === slice.selectedBodyPartSlug,
  ) ?? null;

  return (
    <div className="space-y-6 pb-4">
      <Card className="relative overflow-hidden rounded-[34px] p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-(--gradient-hero) opacity-95" />
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-30" />

        <div className="relative space-y-4">
          <Badge>Exercise Library</Badge>
          <h1 className="max-w-4xl text-3xl font-bold tracking-tight md:text-4xl">
            {selectedBodyPart?.name ?? "Body Part"} exercises
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            Showing all exercises mapped to your chosen body part and onboarding goal.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-(--card-border) bg-(--background)/75 px-3 py-1.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Goal</span>
              <span>{selectedGoal?.name ?? "Not set"}</span>
            </div>

            <Link
              href={`/app/workouts?goal=${slice.selectedGoalSlug}&bodyPart=${slice.selectedBodyPartSlug}`}
              className="inline-flex items-center rounded-full border border-(--card-border) bg-(--surface-strong) px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-(--primary-soft) hover:text-primary"
            >
              Back to body parts
            </Link>
          </div>
        </div>
      </Card>

      {selectedGoal && selectedBodyPart ? (
        <ExerciseList
          selectedGoalName={selectedGoal.name}
          selectedBodyPartName={selectedBodyPart.name}
          selectedGoalSlug={slice.selectedGoalSlug}
          selectedBodyPartSlug={slice.selectedBodyPartSlug}
          exercises={slice.exercises}
        />
      ) : null}
    </div>
  );
}