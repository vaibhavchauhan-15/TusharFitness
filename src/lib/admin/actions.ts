"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
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
import {
  getWorkoutBodyPartSpec,
  getWorkoutGoalSpec,
  WORKOUT_BODY_PART_SLUGS,
  WORKOUT_GOAL_SLUGS,
} from "@/lib/workout-taxonomy";

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

function resolveCatalogSlugsForWorkoutUpload(
  input: {
    goalSlug: string;
    bodyPartSlug: string;
  },
) {
  const normalizedGoalSlug = input.goalSlug.trim().toLowerCase();
  const normalizedBodyPartSlug = input.bodyPartSlug.trim().toLowerCase();

  const goalSlug = WORKOUT_GOAL_SLUGS.includes(normalizedGoalSlug)
    ? normalizedGoalSlug
    : null;
  const bodyPartSlug = WORKOUT_BODY_PART_SLUGS.includes(normalizedBodyPartSlug)
    ? normalizedBodyPartSlug
    : null;

  if (!goalSlug || !bodyPartSlug) {
    return null;
  }

  const goalSpec = getWorkoutGoalSpec(goalSlug);
  const bodyPartSpec = getWorkoutBodyPartSpec(bodyPartSlug);

  if (!goalSpec || !bodyPartSpec) {
    return null;
  }

  return {
    goalSlug,
    bodyPartSlug,
    goalName: goalSpec.name,
    bodyPartName: bodyPartSpec.name,
  };
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
  revalidateTag(CACHE_TAGS.dietPlans, "max");
}

export async function createWorkoutProgramAction(formData: FormData) {
  const admin = await requireAdminSession();
  ensureRole(admin.role);

  const parsed = workoutProgramUploadSchema.parse({
    title: toTextValue(formData.get("title")),
    goalSlug: toTextValue(formData.get("goalSlug")),
    bodyPartSlug: toTextValue(formData.get("bodyPartSlug")),
    difficulty: toTextValue(formData.get("difficulty")),
    thumbnailUrl: toTextValue(formData.get("thumbnailUrl")),
    targetMuscle: toTextValue(formData.get("targetMuscle")),
    equipment: toTextValue(formData.get("equipment")),
    restSeconds: toTextValue(formData.get("restSeconds")) || "0",
    videoPath: toTextValue(formData.get("videoPath")),
    sets: toTextValue(formData.get("sets")),
    reps: toTextValue(formData.get("reps")),
    instructions: toTextValue(formData.get("instructions")),
    formCues: toTextValue(formData.get("formCues")),
    commonMistakes: toTextValue(formData.get("commonMistakes")),
  });

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const catalogSlugs = resolveCatalogSlugsForWorkoutUpload({
    goalSlug: parsed.goalSlug,
    bodyPartSlug: parsed.bodyPartSlug,
  });

  if (!catalogSlugs) {
    throw new Error("Unable to map workout goal/body part. Select valid taxonomy values and try again.");
  }

  const instructionSteps = toLineItems(formData.get("instructions"));
  const formCues = toLineItems(formData.get("formCues"));
  const commonMistakeLines = toLineItems(formData.get("commonMistakes"));

  const { data, error } = await supabase
    .from("workout_exercises")
    .insert({
      title: parsed.title,
      goal: catalogSlugs.goalSlug,
      body_part_slug: catalogSlugs.bodyPartSlug,
      thumbnail_url: parsed.thumbnailUrl || null,
      target_muscle: parsed.targetMuscle,
      equipment: parsed.equipment,
      difficulty: parsed.difficulty,
      instruction_steps: instructionSteps,
      form_cues: formCues,
      common_mistakes: commonMistakeLines,
      rest_seconds: parsed.restSeconds,
      video_path: parsed.videoPath || null,
      sets: parsed.sets,
      reps: parsed.reps,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  await writeAdminLog({
    adminUserId: admin.user.id,
    actionType: "create",
    entityType: "workout_exercise",
    entityId: data.id,
    metadata: {
      title: parsed.title,
      goal: catalogSlugs.goalSlug,
      bodyPartSlug: catalogSlugs.bodyPartSlug,
      difficulty: parsed.difficulty,
      videoPath: parsed.videoPath || null,
      targetMuscle: parsed.targetMuscle,
      equipment: parsed.equipment,
    },
  });

  revalidatePath("/app/admin/workouts");
  revalidatePath("/app/workouts");
  revalidatePath("/app/workouts/exercises");
  revalidateTag(CACHE_TAGS.workoutExercises, "max");
  revalidateTag(CACHE_TAGS.workoutsCatalog, "max");
}

export async function createExerciseLibraryAction(formData: FormData) {
  const admin = await requireAdminSession();
  ensureRole(admin.role);

  const title = toTextValue(formData.get("title"));
  const parsed = exerciseLibraryCreateSchema.parse({
    title,
    goalSlug: toTextValue(formData.get("goalSlug")),
    bodyPartSlug: toTextValue(formData.get("bodyPartSlug")),
    thumbnailUrl: toTextValue(formData.get("thumbnailUrl")),
    videoPath: toTextValue(formData.get("videoPath")),
    targetMuscle: toTextValue(formData.get("targetMuscle")),
    equipment: toTextValue(formData.get("equipment")),
    difficulty: toTextValue(formData.get("difficulty")) || "moderate",
    sets: toTextValue(formData.get("sets")),
    reps: toTextValue(formData.get("reps")),
    restSeconds: toTextValue(formData.get("restSeconds")) || "0",
    instructions: toLineItems(formData.get("instructions")),
    formCues: toLineItems(formData.get("formCues")),
    commonMistakes: toLineItems(formData.get("commonMistakes")),
  });

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  const exerciseInsert = {
    title: parsed.title,
    goal: parsed.goalSlug,
    body_part_slug: parsed.bodyPartSlug,
    thumbnail_url: parsed.thumbnailUrl || null,
    video_path: parsed.videoPath || null,
    target_muscle: parsed.targetMuscle,
    equipment: parsed.equipment,
    difficulty: parsed.difficulty,
    sets: parsed.sets,
    reps: parsed.reps,
    rest_seconds: parsed.restSeconds || null,
    instruction_steps: parsed.instructions,
    form_cues: parsed.formCues,
    common_mistakes: parsed.commonMistakes,
  };

  const { data, error } = await supabase
    .from("workout_exercises")
    .insert(exerciseInsert)
    .select("id")
    .single<{ id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  await writeAdminLog({
    adminUserId: admin.user.id,
    actionType: "create",
    entityType: "exercise_library",
    entityId: data.id,
    metadata: {
      title: parsed.title,
      goalSlug: parsed.goalSlug,
      bodyPartSlug: parsed.bodyPartSlug,
    },
  });

  revalidatePath("/app/admin/exercise-library");
  revalidatePath("/app/workouts");
  revalidatePath("/app/workouts/exercises");
  revalidateTag(CACHE_TAGS.workoutExercises, "max");
  revalidateTag(CACHE_TAGS.workoutsCatalog, "max");
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
  revalidateTag(CACHE_TAGS.dietPlans, "max");
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

  await writeAdminLog({
    adminUserId: admin.user.id,
    actionType: "status_change",
    entityType: "workout_exercise",
    entityId: workoutId,
    metadata: {
      status: validatedStatus,
      ignored: true,
      reason: "workout_exercises schema does not support status",
    },
  });

  throw new Error("Workout status is no longer editable after moving to workout_exercises-only schema.");
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
