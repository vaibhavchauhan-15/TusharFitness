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
  videoUrl: string | null;
  targetMuscle: string;
  equipment: string;
  difficulty: string;
  sets: string;
  reps: string;
  instructions: string[];
  formTips: string[];
  shortFormCue: string;
  commonMistakes: string[];
  optionalNotes: string | null;
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
  slug: string | null;
  goal_slug: string | null;
  body_part_slug: string | null;
  name: string;
  thumbnail_url: string | null;
  media_url: string | null;
  target_muscle: string | null;
  equipment: string | null;
  difficulty: string | null;
  sets: string | null;
  reps: string | null;
  instruction_steps: unknown;
  form_cues: unknown;
  common_mistakes: unknown;
  form_cue: string | null;
  instructions: string | null;
  cautions: string | null;
  progression_notes: string | null;
  rest_seconds: number | null;
  sort_order: number | null;
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
      "id,slug,goal_slug,body_part_slug,name,thumbnail_url,media_url,target_muscle,equipment,difficulty,sets,reps,instruction_steps,form_cues,common_mistakes,form_cue,instructions,cautions,progression_notes,rest_seconds,sort_order",
    )
    .not("slug", "is", null)
    .not("goal_slug", "is", null)
    .not("body_part_slug", "is", null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .returns<WorkoutExerciseRow[]>();

  return {
    data: result.data ?? [],
    error: result.error,
  };
}

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

function toStringListFromText(value: string | null | undefined, fallback: string[]) {
  const parsed = String(value ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : fallback;
}

function normalizeGoogleDriveImageUrl(rawUrl: string) {
  try {
    const parsedUrl = new URL(rawUrl);
    const host = parsedUrl.hostname.toLowerCase();

    if (host !== "drive.google.com" && host !== "www.drive.google.com") {
      return rawUrl;
    }

    const pathIdMatch = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/);
    const queryId = parsedUrl.searchParams.get("id");
    const fileId = pathIdMatch?.[1] ?? queryId;

    if (!fileId) {
      return rawUrl;
    }

    const directUrl = new URL("https://drive.google.com/uc");
    directUrl.searchParams.set("export", "view");
    directUrl.searchParams.set("id", fileId);

    return directUrl.toString();
  } catch {
    return rawUrl;
  }
}

function resolveExerciseImageUrl(imageUrl: string | null | undefined) {
  const trimmed = imageUrl?.trim();

  if (!trimmed) {
    return "/images/workouts/exercises/default.svg";
  }

  return normalizeGoogleDriveImageUrl(trimmed);
}

function mapExerciseRow(row: WorkoutExerciseRow): WorkoutExercise {
  if (!row.slug || !row.goal_slug || !row.body_part_slug) {
    throw new Error("Workout exercise row is missing catalog identifiers");
  }

  const instructions = toStringList(
    row.instruction_steps,
    toStringListFromText(row.instructions, ["No instruction provided yet."]),
  );

  const formTips = toStringList(
    row.form_cues,
    toStringListFromText(
      row.form_cue,
      ["Focus on controlled reps and stable posture."],
    ),
  );

  const commonMistakes = toStringList(
    row.common_mistakes,
    toStringListFromText(row.cautions, ["Avoid rushing reps and losing posture."]),
  );

  const shortFormCue = row.form_cue?.trim() || formTips[0] || "Focus on controlled movement.";

  return {
    id: row.id,
    slug: row.slug,
    goalSlug: row.goal_slug,
    bodyPartSlug: row.body_part_slug,
    name: row.name,
    imageUrl: resolveExerciseImageUrl(row.thumbnail_url),
    videoUrl: row.media_url ?? null,
    targetMuscle: row.target_muscle?.trim() || "Not specified",
    equipment: row.equipment?.trim() || "Not specified",
    difficulty: row.difficulty?.trim() || "Not set",
    sets: row.sets?.trim() || "--",
    reps: row.reps?.trim() || "--",
    instructions,
    formTips,
    shortFormCue,
    commonMistakes,
    optionalNotes: row.progression_notes?.trim() || null,
    restSeconds: row.rest_seconds ?? null,
    sortOrder: row.sort_order ?? 0,
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
  const availableBodyPartSlugs = Array.from(new Set(exercises.map((exercise) => exercise.bodyPartSlug)));

  if (availableBodyPartSlugs.length === 0) {
    return getFallbackBodyParts();
  }

  return orderBySortThenName(availableBodyPartSlugs.map(mapBodyPartSlugToBodyPart));
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
  const exercisesResult = await fetchWorkoutExerciseRows(supabase);

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
