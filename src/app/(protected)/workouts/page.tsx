import { WorkoutBrowser } from "@/components/workouts/workout-browser";
import { getSessionState } from "@/lib/session";
import {
  getWorkoutCatalogForUser,
  resolvePreferredWorkoutGoalSlug,
} from "@/lib/supabase/workouts";

type WorkoutsPageProps = {
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

export default async function WorkoutsPage({ searchParams }: WorkoutsPageProps) {
  const [catalog, session, query] = await Promise.all([
    getWorkoutCatalogForUser(),
    getSessionState(),
    searchParams,
  ]);

  const preferredGoalSlug = resolvePreferredWorkoutGoalSlug(session?.user.goal, catalog.goals);
  const requestedGoalSlug = getNormalizedQuerySlug(query.goal);
  const selectedGoalSlug =
    requestedGoalSlug && catalog.goals.some((goal) => goal.slug === requestedGoalSlug)
      ? requestedGoalSlug
      : preferredGoalSlug;

  const requestedBodyPartSlug = getNormalizedQuerySlug(query.bodyPart);

  return (
    <WorkoutBrowser
      catalog={catalog}
      initialGoalSlug={selectedGoalSlug}
      initialBodyPartSlug={requestedBodyPartSlug}
    />
  );
}
