import { unstable_cache } from "next/cache";
import { CACHE_TAGS, CACHE_TTL } from "@/lib/cache-tags";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  WORKOUT_BODY_PART_SPECS,
  WORKOUT_GOAL_SPECS,
  getWorkoutBodyPartSpec,
  getWorkoutGoalSpec,
  resolveBodyPartImageUrl,
  titleCaseSlug,
} from "@/lib/workout-taxonomy";

export type WorkoutGoal = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  imageUrl: string;
  sortOrder: number;
};

export type WorkoutBodyPart = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  sortOrder: number;
};

export type WorkoutExercise = {
  id: string;
  slug: string;
  goalSlug: string;
  bodyPartSlug: string;
  name: string;
  imageUrl: string;
  videoPath: string | null;
  targetMuscle: string;
  equipment: string;
  difficulty: string;
  sets: string;
  reps: string;
  instructions: string[];
  formTips: string[];
  shortFormCue: string;
  commonMistakes: string[];
  restSeconds: number | null;
  sortOrder: number;
};

export type WorkoutCatalog = {
  goals: WorkoutGoal[];
  bodyParts: WorkoutBodyPart[];
  exercises: WorkoutExercise[];
};

export type WorkoutCatalogSlice = {
  goals: WorkoutGoal[];
  bodyParts: WorkoutBodyPart[];
  exercises: WorkoutExercise[];
  selectedGoalSlug: string | null;
  selectedBodyPartSlug: string | null;
  selectedExercise: WorkoutExercise | null;
};

const PROFILE_GOAL_TO_WORKOUT_GOAL: Record<string, string> = {
  "muscle gain": "muscle-gain",
  "fat loss": "fat-loss",
  strength: "strength",
  endurance: "endurance",
  maintenance: "muscle-gain",
};

type WorkoutExerciseRow = {
  id: string;
  goal: string | null;
  body_part_slug: string | null;
  title: string;
  thumbnail_url: string | null;
  video_path: string | null;
  target_muscle: string | null;
  equipment: string | null;
  difficulty: string | null;
  sets: string | null;
  reps: string | null;
  instruction_steps: unknown;
  form_cues: unknown;
  common_mistakes: unknown;
  rest_seconds: number | null;
  created_at: string | null;
};

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

function getFallbackBodyParts(): WorkoutBodyPart[] {
  return WORKOUT_BODY_PART_SPECS.map((spec) => ({
    id: `body-part-${spec.slug}`,
    slug: spec.slug,
    name: spec.name,
    imageUrl: spec.imageUrl,
    sortOrder: spec.sortOrder,
  }));
}

async function fetchWorkoutExerciseRows(supabase: SupabaseServerClient) {
  const result = await supabase
    .from("workout_exercises")
    .select(
      "id,goal,body_part_slug,title,thumbnail_url,video_path,target_muscle,equipment,difficulty,sets,reps,instruction_steps,form_cues,common_mistakes,rest_seconds,created_at",
    )
    .not("goal", "is", null)
    .not("body_part_slug", "is", null)
    .order("created_at", { ascending: true })
    .order("title", { ascending: true })
    .returns<WorkoutExerciseRow[]>();

  return {
    data: result.data ?? [],
    error: result.error,
  };
}

async function fetchWorkoutExerciseRowsWithAdminClient() {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return null;
  }

  const { data, error } = await adminClient
    .from("workout_exercises")
    .select(
      "id,goal,body_part_slug,title,thumbnail_url,video_path,target_muscle,equipment,difficulty,sets,reps,instruction_steps,form_cues,common_mistakes,rest_seconds,created_at",
    )
    .not("goal", "is", null)
    .not("body_part_slug", "is", null)
    .order("created_at", { ascending: true })
    .order("title", { ascending: true })
    .returns<WorkoutExerciseRow[]>();

  if (error) {
    return null;
  }

  return data ?? [];
}

const getCachedWorkoutExerciseRows = unstable_cache(
  async () => fetchWorkoutExerciseRowsWithAdminClient(),
  ["workout-exercises-v1"],
  {
    tags: [CACHE_TAGS.workoutExercises, CACHE_TAGS.workoutsCatalog],
    revalidate: CACHE_TTL.workoutsCatalogSeconds,
  },
);

function toStringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const parsed = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : fallback;
}

function resolveExerciseImageUrl(imageUrl: string | null | undefined) {
  const trimmed = imageUrl?.trim();

  if (!trimmed) {
    return "/images/workouts/exercises/default.svg";
  }

  return trimmed;
}

function resolveExerciseVideoPath(videoPath: string | null | undefined) {
  const trimmed = videoPath?.trim();
  return trimmed ? trimmed : null;
}

function toExerciseSlug(row: Pick<WorkoutExerciseRow, "id" | "title">) {
  const titleSlug = row.title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  const fallback = titleSlug || "exercise";
  return `${fallback}-${row.id.slice(0, 8)}`;
}

function mapExerciseRow(row: WorkoutExerciseRow): WorkoutExercise {
  if (!row.goal || !row.body_part_slug) {
    throw new Error("Workout exercise row is missing catalog identifiers");
  }

  const instructions = toStringList(
    row.instruction_steps,
    ["No instruction provided yet."],
  );

  const formTips = toStringList(
    row.form_cues,
    ["Focus on controlled reps and stable posture."],
  );

  const commonMistakes = toStringList(
    row.common_mistakes,
    ["Avoid rushing reps and losing posture."],
  );

  const shortFormCue = formTips[0] || "Focus on controlled movement.";

  return {
    id: row.id,
    slug: toExerciseSlug(row),
    goalSlug: row.goal,
    bodyPartSlug: row.body_part_slug,
    name: row.title,
    imageUrl: resolveExerciseImageUrl(row.thumbnail_url),
    videoPath: resolveExerciseVideoPath(row.video_path),
    targetMuscle: row.target_muscle?.trim() || "Not specified",
    equipment: row.equipment?.trim() || "Not specified",
    difficulty: row.difficulty?.trim() || "Not set",
    sets: row.sets?.trim() || "--",
    reps: row.reps?.trim() || "--",
    instructions,
    formTips,
    shortFormCue,
    commonMistakes,
    restSeconds: row.rest_seconds ?? null,
    sortOrder: 0,
  };
}

function orderBySortThenName<T extends { sortOrder: number; name: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return a.name.localeCompare(b.name);
  });
}

function getGoalSortOrder(slug: string) {
  return getWorkoutGoalSpec(slug)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
}

function getBodyPartSortOrder(slug: string) {
  return getWorkoutBodyPartSpec(slug)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
}

function mapGoalSlugToGoal(slug: string): WorkoutGoal {
  const spec = getWorkoutGoalSpec(slug);

  return {
    id: `goal-${slug}`,
    slug,
    name: spec?.name ?? titleCaseSlug(slug),
    subtitle: spec?.subtitle ?? "Choose your training intention",
    imageUrl: spec?.imageUrl ?? "/images/workouts/goals/default.svg",
    sortOrder: getGoalSortOrder(slug),
  };
}

function mapBodyPartSlugToBodyPart(slug: string): WorkoutBodyPart {
  const spec = getWorkoutBodyPartSpec(slug);

  return {
    id: `body-part-${slug}`,
    slug,
    name: spec?.name ?? titleCaseSlug(slug),
    imageUrl: resolveBodyPartImageUrl(slug),
    sortOrder: getBodyPartSortOrder(slug),
  };
}

function buildGoals(exercises: WorkoutExercise[]) {
  const availableGoalSlugs = Array.from(new Set(exercises.map((exercise) => exercise.goalSlug)));

  if (availableGoalSlugs.length === 0) {
    return WORKOUT_GOAL_SPECS.map((spec) => mapGoalSlugToGoal(spec.slug));
  }

  return orderBySortThenName(availableGoalSlugs.map(mapGoalSlugToGoal));
}

function buildBodyParts(exercises: WorkoutExercise[]) {
  const taxonomyBodyParts = WORKOUT_BODY_PART_SPECS.map((spec) => mapBodyPartSlugToBodyPart(spec.slug));

  const extraBodyPartSlugs = Array.from(new Set(exercises.map((exercise) => exercise.bodyPartSlug))).filter(
    (slug) => !WORKOUT_BODY_PART_SPECS.some((spec) => spec.slug === slug),
  );

  if (extraBodyPartSlugs.length === 0) {
    return taxonomyBodyParts;
  }

  return orderBySortThenName([
    ...taxonomyBodyParts,
    ...extraBodyPartSlugs.map(mapBodyPartSlugToBodyPart),
  ]);
}

export async function getWorkoutCatalogForUser(): Promise<WorkoutCatalog> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { goals: [], bodyParts: getFallbackBodyParts(), exercises: [] };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { goals: [], bodyParts: getFallbackBodyParts(), exercises: [] };
  }

  return getWorkoutCatalogForAuthenticatedClient(supabase);
}

export async function getWorkoutCatalogForAuthenticatedClient(
  supabase: SupabaseServerClient,
): Promise<WorkoutCatalog> {
  const cachedRows = await getCachedWorkoutExerciseRows();
  const exercisesResult = cachedRows
    ? { data: cachedRows, error: null }
    : await fetchWorkoutExerciseRows(supabase);

  const exercises = exercisesResult.error
    ? []
    : orderBySortThenName((exercisesResult.data ?? []).map(mapExerciseRow));

  const goals = buildGoals(exercises);
  const bodyParts = buildBodyParts(exercises);

  return {
    goals,
    bodyParts,
    exercises,
  };
}

export function buildWorkoutCatalogSlice(
  catalog: WorkoutCatalog,
  requestedGoalSlug?: string | null,
  requestedBodyPartSlug?: string | null,
  requestedExerciseSlug?: string | null,
  fallbackGoalSlug?: string | null,
): WorkoutCatalogSlice {
  const usableFallbackGoalSlug =
    fallbackGoalSlug && catalog.goals.some((goal) => goal.slug === fallbackGoalSlug)
      ? fallbackGoalSlug
      : null;

  const selectedGoalSlug =
    requestedGoalSlug && catalog.goals.some((goal) => goal.slug === requestedGoalSlug)
      ? requestedGoalSlug
      : usableFallbackGoalSlug
        ? usableFallbackGoalSlug
      : catalog.goals[0]?.slug ?? null;

  if (!selectedGoalSlug) {
    return {
      goals: catalog.goals,
      bodyParts: [],
      exercises: [],
      selectedGoalSlug: null,
      selectedBodyPartSlug: null,
      selectedExercise: null,
    };
  }

  const availableBodyPartSlugs = new Set(
    catalog.exercises
      .filter((exercise) => exercise.goalSlug === selectedGoalSlug)
      .map((exercise) => exercise.bodyPartSlug),
  );

  const bodyParts = catalog.bodyParts.filter((bodyPart) => availableBodyPartSlugs.has(bodyPart.slug));

  const selectedBodyPartSlug =
    requestedBodyPartSlug && bodyParts.some((bodyPart) => bodyPart.slug === requestedBodyPartSlug)
      ? requestedBodyPartSlug
      : bodyParts[0]?.slug ?? null;

  if (!selectedBodyPartSlug) {
    return {
      goals: catalog.goals,
      bodyParts,
      exercises: [],
      selectedGoalSlug,
      selectedBodyPartSlug: null,
      selectedExercise: null,
    };
  }

  const exercises = catalog.exercises.filter(
    (exercise) => exercise.goalSlug === selectedGoalSlug && exercise.bodyPartSlug === selectedBodyPartSlug,
  );

  const selectedExercise =
    requestedExerciseSlug
      ? exercises.find((exercise) => exercise.slug === requestedExerciseSlug) ?? null
      : null;

  return {
    goals: catalog.goals,
    bodyParts,
    exercises,
    selectedGoalSlug,
    selectedBodyPartSlug,
    selectedExercise,
  };
}

export function resolvePreferredWorkoutGoalSlug(
  profileGoal: string | null | undefined,
  goals: WorkoutGoal[],
) {
  const normalizedGoal = profileGoal?.trim().toLowerCase() ?? "";

  if (!normalizedGoal) {
    return goals[0]?.slug ?? null;
  }

  const mappedGoalSlug = PROFILE_GOAL_TO_WORKOUT_GOAL[normalizedGoal] ?? null;

  if (mappedGoalSlug && goals.some((goal) => goal.slug === mappedGoalSlug)) {
    return mappedGoalSlug;
  }

  if (goals.some((goal) => goal.slug === normalizedGoal)) {
    return normalizedGoal;
  }

  return goals[0]?.slug ?? null;
}
