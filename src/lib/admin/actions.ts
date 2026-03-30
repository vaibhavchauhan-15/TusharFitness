"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminSession } from "@/lib/admin/permissions";
import {
  accountStatusSchema,
  announcementCreateSchema,
  categoryCreateSchema,
  exerciseLibraryCreateSchema,
  pricingPlanCreateSchema,
  statusSchema,
  workoutProgramUploadSchema,
} from "@/lib/admin/validators";
import { WORKOUT_BODY_PART_SLUGS, WORKOUT_GOAL_SLUGS } from "@/lib/workout-taxonomy";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function toTextValue(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function toLineItems(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function appendSlugSuffix(base: string, attempt: number) {
  if (attempt <= 0) {
    return base;
  }

  const suffix = `-${attempt + 1}`;
  const maxBaseLength = Math.max(1, 96 - suffix.length);
  return `${base.slice(0, maxBaseLength)}${suffix}`;
}

const WORKOUT_GOAL_SLUG_ALIASES: Record<string, string[]> = {
  "fat loss": ["fat-loss"],
  "fat-loss": ["fat-loss"],
  "muscle gain": ["muscle-gain"],
  "muscle-gain": ["muscle-gain"],
  "general fitness": ["muscle-gain"],
  "general-fitness": ["muscle-gain"],
  maintenance: ["muscle-gain"],
};

const WORKOUT_BODY_PART_SLUG_ALIASES: Record<string, string[]> = {
  "full body": ["core", "chest", "back", "legs"],
  "full-body": ["core", "chest", "back", "legs"],
  "upper body": ["chest", "back", "shoulders", "arms", "biceps"],
  "upper-body": ["chest", "back", "shoulders", "arms", "biceps"],
  "lower body": ["legs", "glutes", "thighs", "core"],
  "lower-body": ["legs", "glutes", "thighs", "core"],
  arm: ["arms", "biceps", "triceps"],
};

function pushUnique(target: string[], value: string | null | undefined) {
  if (!value) {
    return;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return;
  }

  if (!target.includes(normalized)) {
    target.push(normalized);
  }
}

function toSlugCandidates(value: string, aliases: Record<string, string[]>) {
  const candidates: string[] = [];
  const normalized = value.trim().toLowerCase();
  const slugified = slugify(value);

  pushUnique(candidates, normalized);
  pushUnique(candidates, slugified);

  for (const alias of aliases[normalized] ?? []) {
    pushUnique(candidates, alias);
  }

  for (const alias of aliases[slugified] ?? []) {
    pushUnique(candidates, alias);
  }

  return candidates;
}

function pickBestSlug(candidates: string[], availableSlugs: string[], fallbackToFirst = true) {
  if (availableSlugs.length === 0) {
    return null;
  }

  const availableSet = new Set(availableSlugs.map((slug) => slug.trim().toLowerCase()));

  for (const candidate of candidates) {
    if (availableSet.has(candidate)) {
      return candidate;
    }
  }

  return fallbackToFirst ? availableSlugs[0] : null;
}

function resolveCatalogSlugsForWorkoutUpload(
  input: {
    goalSlug?: string;
    bodyPartSlug?: string;
    goal: string;
    goalType: string;
    bodyPart: string;
  },
) {
  const availableGoalSlugs = [...WORKOUT_GOAL_SLUGS];
  const availableBodyPartSlugs = [...WORKOUT_BODY_PART_SLUGS];

  const goalCandidates = [
    ...toSlugCandidates(input.goalSlug ?? "", WORKOUT_GOAL_SLUG_ALIASES),
    ...toSlugCandidates(input.goalType, WORKOUT_GOAL_SLUG_ALIASES),
    ...toSlugCandidates(input.goal, WORKOUT_GOAL_SLUG_ALIASES),
  ];

  const bodyPartCandidates = [
    ...toSlugCandidates(input.bodyPartSlug ?? "", WORKOUT_BODY_PART_SLUG_ALIASES),
    ...toSlugCandidates(input.bodyPart, WORKOUT_BODY_PART_SLUG_ALIASES),
  ];

  return {
    goalSlug: pickBestSlug(goalCandidates, availableGoalSlugs, false),
    bodyPartSlug: pickBestSlug(bodyPartCandidates, availableBodyPartSlugs, false),
  };
}

function isSlugUniqueConflict(error: { code?: string | null; message?: string | null } | null | undefined) {
  if (!error) {
    return false;
  }

  const message = String(error.message ?? "").toLowerCase();
  return error.code === "23505" && message.includes("slug");
}

async function writeAdminLog(input: {
  adminUserId: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return;
  }

  await supabase.from("admin_activity_logs").insert({
    admin_user_id: input.adminUserId,
    action_type: input.actionType,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
}

function ensureRole(role: string) {
  if (role !== "admin") {
    throw new Error("Insufficient permission");
  }
}

export async function createDietPlanAction(formData: FormData) {
  const admin = await requireAdminSession();
  ensureRole(admin.role);

  const title = toTextValue(formData.get("title"));
  const goalType = toTextValue(formData.get("goalType"));
  const dietaryPreference = toTextValue(formData.get("dietaryPreference"));
  const difficulty = toTextValue(formData.get("difficulty"));

  if (title.length < 3) {
    throw new Error("Diet plan title must be at least 3 characters");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const status = statusSchema.parse(toTextValue(formData.get("status")) || "draft");

  const { data, error } = await supabase
    .from("diet_plans")
    .insert({
      title,
      slug: slugify(toTextValue(formData.get("slug")) || title),
      goal_type: goalType || null,
      dietary_preference: dietaryPreference || null,
      difficulty: difficulty || null,
      description: toTextValue(formData.get("description")) || null,
      status,
      created_by: admin.user.id,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  await writeAdminLog({
    adminUserId: admin.user.id,
    actionType: "create",
    entityType: "diet_plan",
    entityId: data.id,
    metadata: {
      title,
      status,
    },
  });

  revalidatePath("/app/admin/diet-plans");
}

export async function createWorkoutProgramAction(formData: FormData) {
  const admin = await requireAdminSession();
  ensureRole(admin.role);

  const title = toTextValue(formData.get("title"));
  const exerciseName = toTextValue(formData.get("exerciseName"));

  const parsed = workoutProgramUploadSchema.parse({
    title,
    slug: slugify(toTextValue(formData.get("slug")) || title),
    goalSlug: toTextValue(formData.get("goalSlug")),
    bodyPartSlug: toTextValue(formData.get("bodyPartSlug")),
    goal: toTextValue(formData.get("goal")),
    bodyPart: toTextValue(formData.get("bodyPart")),
    goalType: toTextValue(formData.get("goalType")),
    difficulty: toTextValue(formData.get("difficulty")),
    level: toTextValue(formData.get("level")),
    durationMinutes: toTextValue(formData.get("durationMinutes")),
    durationWeeks: toTextValue(formData.get("durationWeeks")),
    description: toTextValue(formData.get("description")),
    thumbnailUrl: toTextValue(formData.get("thumbnailUrl")),
    status: toTextValue(formData.get("status")) || "draft",
    exerciseName,
    targetMuscle: toTextValue(formData.get("targetMuscle")),
    equipment: toTextValue(formData.get("equipment")),
    motion: toTextValue(formData.get("motion")),
    formCue: toTextValue(formData.get("formCue")),
    position: toTextValue(formData.get("position")) || "0",
    durationSeconds: toTextValue(formData.get("durationSeconds")) || "0",
    restSeconds: toTextValue(formData.get("restSeconds")) || "0",
    mediaUrl: toTextValue(formData.get("videoUrl")),
    sets: toTextValue(formData.get("sets")),
    reps: toTextValue(formData.get("reps")),
    instructions: toTextValue(formData.get("instructions")),
    formCues: toTextValue(formData.get("formCues")),
    commonMistakes: toTextValue(formData.get("commonMistakes")),
    cautions: toTextValue(formData.get("cautions")),
    progressionNotes: toTextValue(formData.get("progressionNotes")),
    optionalNotes: toTextValue(formData.get("optionalNotes")),
  });

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const publishedAt = parsed.status === "published" ? new Date().toISOString() : null;
  const durationLabel = `${parsed.durationMinutes} mins`;
  const catalogSlugs = resolveCatalogSlugsForWorkoutUpload({
    goalSlug: parsed.goalSlug || undefined,
    bodyPartSlug: parsed.bodyPartSlug || undefined,
    goal: parsed.goal,
    goalType: parsed.goalType,
    bodyPart: parsed.bodyPart,
  });

  if (!catalogSlugs.goalSlug || !catalogSlugs.bodyPartSlug) {
    throw new Error("Unable to map workout goal/body part. Select valid taxonomy values and try again.");
  }

  let createdWorkoutProgramId: string | null = null;
  let resolvedProgramSlug = parsed.slug;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidateSlug = appendSlugSuffix(parsed.slug, attempt);
    const { data, error } = await supabase
      .from("workout_plans")
      .insert({
        title: parsed.title,
        slug: candidateSlug,
        goal: parsed.goal,
        body_part: parsed.bodyPart,
        duration: durationLabel,
        difficulty: parsed.difficulty || null,
        goal_type: parsed.goalType || null,
        level: parsed.level || null,
        duration_weeks: parsed.durationWeeks,
        thumbnail_url: parsed.thumbnailUrl || null,
        description: parsed.description || null,
        status: parsed.status,
        created_by: admin.user.id,
        published_at: publishedAt,
      })
      .select("id")
      .single<{ id: string }>();

    if (!error) {
      createdWorkoutProgramId = data.id;
      resolvedProgramSlug = candidateSlug;
      break;
    }

    if (!isSlugUniqueConflict(error)) {
      throw new Error(error.message);
    }
  }

  if (!createdWorkoutProgramId) {
    throw new Error("Unable to save workout program because the slug is already in use.");
  }

  const removeCreatedWorkoutProgram = async () => {
    if (!createdWorkoutProgramId) {
      return;
    }

    await supabase.from("workout_plans").delete().eq("id", createdWorkoutProgramId);
  };

  const instructionSteps = toLineItems(formData.get("instructions"));
  const formCueLines = toLineItems(formData.get("formCues"));
  const commonMistakeLines = toLineItems(formData.get("commonMistakes"));
  const resolvedFormCues = formCueLines.length > 0
    ? formCueLines
    : parsed.formCue
      ? [parsed.formCue]
      : [];

  const baseExerciseSlug = slugify(
    toTextValue(formData.get("exerciseSlug")) || `${resolvedProgramSlug}-${parsed.exerciseName}`,
  );

  let createdExerciseSlug: string | null = null;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidateExerciseSlug = appendSlugSuffix(baseExerciseSlug || "exercise", attempt);
    const { error: workoutExerciseError } = await supabase.from("workout_exercises").insert({
      workout_plan_id: createdWorkoutProgramId,
      slug: candidateExerciseSlug,
      goal_slug: catalogSlugs.goalSlug,
      body_part_slug: catalogSlugs.bodyPartSlug,
      name: parsed.exerciseName,
      thumbnail_url: parsed.thumbnailUrl || null,
      target_muscle: parsed.targetMuscle,
      equipment: parsed.equipment,
      difficulty: parsed.difficulty || null,
      motion: parsed.motion || parsed.targetMuscle || null,
      form_cue: parsed.formCue || resolvedFormCues[0] || null,
      instruction_steps: instructionSteps,
      form_cues: resolvedFormCues,
      common_mistakes: commonMistakeLines,
      position: parsed.position,
      sort_order: parsed.position,
      duration_seconds: parsed.durationSeconds || null,
      rest_seconds: parsed.restSeconds || null,
      media_url: parsed.mediaUrl || null,
      sets: parsed.sets,
      reps: parsed.reps,
      instructions: parsed.instructions || null,
      cautions: parsed.commonMistakes || parsed.cautions || null,
      progression_notes: parsed.optionalNotes || parsed.progressionNotes || null,
    });

    if (!workoutExerciseError) {
      createdExerciseSlug = candidateExerciseSlug;
      break;
    }

    if (!isSlugUniqueConflict(workoutExerciseError)) {
      await removeCreatedWorkoutProgram();
      throw new Error(workoutExerciseError.message);
    }
  }

  if (!createdExerciseSlug) {
    await removeCreatedWorkoutProgram();
    throw new Error("Unable to save workout exercise because the exercise slug is already in use.");
  }

  await writeAdminLog({
    adminUserId: admin.user.id,
    actionType: "create",
    entityType: "workout_program",
    entityId: createdWorkoutProgramId,
    metadata: {
      title: parsed.title,
      slug: resolvedProgramSlug,
      status: parsed.status,
      goal: parsed.goal,
      bodyPart: parsed.bodyPart,
      goalSlug: catalogSlugs.goalSlug,
      bodyPartSlug: catalogSlugs.bodyPartSlug,
      goalType: parsed.goalType,
      difficulty: parsed.difficulty,
      durationMinutes: parsed.durationMinutes,
      mediaUrl: parsed.mediaUrl || null,
      exerciseName: parsed.exerciseName,
      exerciseSlug: createdExerciseSlug,
      targetMuscle: parsed.targetMuscle,
      equipment: parsed.equipment,
    },
  });

  revalidatePath("/app/admin/workouts");
  revalidatePath("/app/workouts");
  revalidatePath("/app/workouts/exercises");
}

export async function createExerciseLibraryAction(formData: FormData) {
  const admin = await requireAdminSession();
  ensureRole(admin.role);

  const name = toTextValue(formData.get("name"));
  const parsed = exerciseLibraryCreateSchema.parse({
    name,
    slug: slugify(toTextValue(formData.get("slug")) || name),
    goalSlug: toTextValue(formData.get("goalSlug")),
    bodyPartSlug: toTextValue(formData.get("bodyPartSlug")),
    imageUrl: toTextValue(formData.get("imageUrl")),
    videoUrl: toTextValue(formData.get("videoUrl")),
    targetMuscle: toTextValue(formData.get("targetMuscle")),
    equipment: toTextValue(formData.get("equipment")),
    difficulty: toTextValue(formData.get("difficulty")) || "moderate",
    shortFormCue: toTextValue(formData.get("shortFormCue")),
    sets: toTextValue(formData.get("sets")),
    reps: toTextValue(formData.get("reps")),
    restSeconds: toTextValue(formData.get("restSeconds")) || "0",
    sortOrder: toTextValue(formData.get("sortOrder")) || "0",
    instructions: toLineItems(formData.get("instructions")),
    formCues: toLineItems(formData.get("formCues")),
    commonMistakes: toLineItems(formData.get("commonMistakes")),
    optionalNotes: toTextValue(formData.get("optionalNotes")),
  });

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const exerciseInsert = {
    name: parsed.name,
    goal_slug: parsed.goalSlug,
    body_part_slug: parsed.bodyPartSlug,
    thumbnail_url: parsed.imageUrl,
    media_url: parsed.videoUrl || null,
    target_muscle: parsed.targetMuscle,
    equipment: parsed.equipment,
    difficulty: parsed.difficulty,
    sets: parsed.sets,
    reps: parsed.reps,
    rest_seconds: parsed.restSeconds || null,
    form_cue: parsed.shortFormCue || parsed.formCues[0] || null,
    instruction_steps: parsed.instructions,
    form_cues: parsed.formCues,
    common_mistakes: parsed.commonMistakes,
    instructions: parsed.instructions.join("\n"),
    cautions: parsed.commonMistakes.join("\n") || null,
    progression_notes: parsed.optionalNotes || null,
    sort_order: parsed.sortOrder,
    position: parsed.sortOrder,
  };

  let createdExerciseId: string | null = null;
  let createdExerciseSlug = parsed.slug;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidateSlug = appendSlugSuffix(parsed.slug, attempt);
    const { data, error } = await supabase
      .from("workout_exercises")
      .insert({
        ...exerciseInsert,
        slug: candidateSlug,
      })
      .select("id")
      .single<{ id: string }>();

    if (!error) {
      createdExerciseId = data.id;
      createdExerciseSlug = candidateSlug;
      break;
    }

    if (!isSlugUniqueConflict(error)) {
      throw new Error(error.message);
    }
  }

  if (!createdExerciseId) {
    throw new Error("Unable to save exercise because the slug is already in use.");
  }

  await writeAdminLog({
    adminUserId: admin.user.id,
    actionType: "create",
    entityType: "exercise_library",
    entityId: createdExerciseId,
    metadata: {
      name: parsed.name,
      slug: createdExerciseSlug,
      goalSlug: parsed.goalSlug,
      bodyPartSlug: parsed.bodyPartSlug,
    },
  });

  revalidatePath("/app/admin/exercise-library");
  revalidatePath("/app/workouts");
  revalidatePath("/app/workouts/exercises");
}

export async function createCategoryAction(formData: FormData) {
  const admin = await requireAdminSession();
  ensureRole(admin.role);

  const parsed = categoryCreateSchema.parse({
    type: toTextValue(formData.get("type")),
    name: toTextValue(formData.get("name")),
    slug: slugify(toTextValue(formData.get("slug")) || toTextValue(formData.get("name"))),
    description: toTextValue(formData.get("description")),
  });

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      type: parsed.type,
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description || null,
      created_by: admin.user.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  await writeAdminLog({
    adminUserId: admin.user.id,
    actionType: "create",
    entityType: "category",
    entityId: data.id,
    metadata: parsed,
  });

  revalidatePath("/app/admin/categories");
}

export async function createAnnouncementAction(formData: FormData) {
  const admin = await requireAdminSession();
  ensureRole(admin.role);

  const parsed = announcementCreateSchema.parse({
    title: toTextValue(formData.get("title")),
    slug: slugify(toTextValue(formData.get("slug")) || toTextValue(formData.get("title"))),
    excerpt: toTextValue(formData.get("excerpt")),
    body: toTextValue(formData.get("body")),
    targetAudience: toTextValue(formData.get("targetAudience")) || "all",
    status: toTextValue(formData.get("status")) || "draft",
  });

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: parsed.title,
      slug: parsed.slug,
      excerpt: parsed.excerpt || null,
      body: parsed.body,
      target_audience: parsed.targetAudience,
      status: parsed.status,
      published_at: parsed.status === "published" ? new Date().toISOString() : null,
      created_by: admin.user.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  await writeAdminLog({
    adminUserId: admin.user.id,
    actionType: "create",
    entityType: "announcement",
    entityId: data.id,
    metadata: {
      title: parsed.title,
      status: parsed.status,
    },
  });

  revalidatePath("/app/admin/announcements");
}

export async function createPricingPlanAction(formData: FormData) {
  const admin = await requireAdminSession();
  ensureRole(admin.role);

  const parsed = pricingPlanCreateSchema.parse({
    name: toTextValue(formData.get("name")),
    slug: slugify(toTextValue(formData.get("slug")) || toTextValue(formData.get("name")),).slice(0, 64),
    description: toTextValue(formData.get("description")),
    price: toTextValue(formData.get("price")),
    currency: toTextValue(formData.get("currency")) || "INR",
    interval: toTextValue(formData.get("interval")) || "month",
    trialDays: toTextValue(formData.get("trialDays")) || "0",
  });

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { data, error } = await supabase
    .from("pricing_plans")
    .insert({
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description || null,
      price: parsed.price,
      currency: parsed.currency,
      interval: parsed.interval,
      trial_days: parsed.trialDays,
      created_by: admin.user.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  await writeAdminLog({
    adminUserId: admin.user.id,
    actionType: "create",
    entityType: "pricing_plan",
    entityId: data.id,
    metadata: {
      name: parsed.name,
      price: parsed.price,
      interval: parsed.interval,
    },
  });

  revalidatePath("/app/admin/subscriptions");
}

export async function setDietPlanStatusAction(planId: string, nextStatus: "draft" | "published" | "archived") {
  const admin = await requireAdminSession();
  ensureRole(admin.role);

  const validatedStatus = statusSchema.parse(nextStatus);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const publishedAt = validatedStatus === "published" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("diet_plans")
    .update({
      status: validatedStatus,
      published_at: publishedAt,
    })
    .eq("id", planId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAdminLog({
    adminUserId: admin.user.id,
    actionType: "status_change",
    entityType: "diet_plan",
    entityId: planId,
    metadata: { status: validatedStatus },
  });

  revalidatePath("/app/admin/diet-plans");
}

export async function setWorkoutStatusAction(
  workoutId: string,
  nextStatus: "draft" | "published" | "archived",
) {
  const admin = await requireAdminSession();
  ensureRole(admin.role);

  const validatedStatus = statusSchema.parse(nextStatus);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const publishedAt = validatedStatus === "published" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("workout_plans")
    .update({
      status: validatedStatus,
      published_at: publishedAt,
    })
    .eq("id", workoutId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAdminLog({
    adminUserId: admin.user.id,
    actionType: "status_change",
    entityType: "workout_program",
    entityId: workoutId,
    metadata: { status: validatedStatus },
  });

  revalidatePath("/app/admin/workouts");
}

export async function setUserAccountStatusAction(
  userId: string,
  nextStatus: "active" | "suspended" | "invited",
) {
  const admin = await requireAdminSession();
  ensureRole(admin.role);

  const validatedStatus = accountStatusSchema.parse(nextStatus);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ account_status: validatedStatus })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await writeAdminLog({
    adminUserId: admin.user.id,
    actionType: "status_change",
    entityType: "user",
    entityId: userId,
    metadata: { status: validatedStatus },
  });

  revalidatePath("/app/admin/users");
}
