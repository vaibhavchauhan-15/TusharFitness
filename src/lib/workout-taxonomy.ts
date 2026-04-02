export type WorkoutGoalSpec = {
  slug: string;
  name: string;
  subtitle: string;
  imageUrl: string;
  sortOrder: number;
};

export type WorkoutBodyPartSpec = {
  slug: string;
  name: string;
  imageUrl: string;
  sortOrder: number;
};

export const WORKOUT_GOAL_SPECS: readonly WorkoutGoalSpec[] = [
  {
    slug: "muscle-gain",
    name: "Muscle Gain",
    subtitle: "Build size and strength with progressive overload",
    imageUrl: "/images/workouts/body-parts/chest.png",
    sortOrder: 1,
  },
  {
    slug: "fat-loss",
    name: "Fat Loss",
    subtitle: "Burn calories while keeping lean muscle",
    imageUrl: "/images/workouts/body-parts/legs.png",
    sortOrder: 2,
  },
  {
    slug: "strength",
    name: "Strength",
    subtitle: "Focus on power and heavy compound movement",
    imageUrl: "/images/workouts/body-parts/arms.png",
    sortOrder: 3,
  },
  {
    slug: "endurance",
    name: "Endurance",
    subtitle: "Increase stamina and work capacity",
    imageUrl: "/images/workouts/body-parts/core.png",
    sortOrder: 4,
  },
] as const;

const BODY_PART_IMAGE_BY_SLUG: Record<string, string> = {
  abs: "/images/workouts/body-parts/abs.png",
  arms: "/images/workouts/body-parts/arms.png",
  forearms: "/images/workouts/body-parts/arms.png",
  triceps: "/images/workouts/body-parts/triceps.png",
  biceps: "/images/workouts/body-parts/biceps.png",
  chest: "/images/workouts/body-parts/chest.png",
  back: "/images/workouts/body-parts/back.png",
  legs: "/images/workouts/body-parts/legs.png",
  shoulders: "/images/workouts/body-parts/shoulders.png",
  core: "/images/workouts/body-parts/core.png",
  thigh: "/images/workouts/body-parts/thigh.png",
  thighs: "/images/workouts/body-parts/thigh.png",
  hip: "/images/workouts/body-parts/heap.png",
  hips: "/images/workouts/body-parts/heap.png",
  glutes: "/images/workouts/body-parts/heap.png",
};

export function resolveBodyPartImageUrl(bodyPartSlug: string) {
  return BODY_PART_IMAGE_BY_SLUG[bodyPartSlug] ?? "/images/workouts/body-parts/biceps.png";
}

export const WORKOUT_BODY_PART_SPECS: readonly WorkoutBodyPartSpec[] = [
  { slug: "biceps", name: "Biceps", imageUrl: resolveBodyPartImageUrl("biceps"), sortOrder: 1 },
  { slug: "chest", name: "Chest", imageUrl: resolveBodyPartImageUrl("chest"), sortOrder: 2 },
  { slug: "back", name: "Back", imageUrl: resolveBodyPartImageUrl("back"), sortOrder: 3 },
  { slug: "legs", name: "Legs", imageUrl: resolveBodyPartImageUrl("legs"), sortOrder: 4 },
  { slug: "shoulders", name: "Shoulders", imageUrl: resolveBodyPartImageUrl("shoulders"), sortOrder: 5 },
  { slug: "core", name: "Core", imageUrl: resolveBodyPartImageUrl("core"), sortOrder: 6 },
  { slug: "arms", name: "Arms", imageUrl: resolveBodyPartImageUrl("arms"), sortOrder: 7 },
  { slug: "triceps", name: "Triceps", imageUrl: resolveBodyPartImageUrl("triceps"), sortOrder: 8 },
  { slug: "forearms", name: "Forearms", imageUrl: resolveBodyPartImageUrl("forearms"), sortOrder: 9 },
  { slug: "glutes", name: "Glutes", imageUrl: resolveBodyPartImageUrl("glutes"), sortOrder: 10 },
  { slug: "thighs", name: "Thighs", imageUrl: resolveBodyPartImageUrl("thighs"), sortOrder: 11 },
  { slug: "hips", name: "Hips", imageUrl: resolveBodyPartImageUrl("hips"), sortOrder: 12 },
  { slug: "abs", name: "Abs", imageUrl: resolveBodyPartImageUrl("abs"), sortOrder: 13 },
] as const;

export const WORKOUT_GOAL_SLUGS = WORKOUT_GOAL_SPECS.map((item) => item.slug);
export const WORKOUT_BODY_PART_SLUGS = WORKOUT_BODY_PART_SPECS.map((item) => item.slug);

const GOAL_SPEC_BY_SLUG = new Map(WORKOUT_GOAL_SPECS.map((item) => [item.slug, item] as const));
const BODY_PART_SPEC_BY_SLUG = new Map(
  WORKOUT_BODY_PART_SPECS.map((item) => [item.slug, item] as const),
);

export function getWorkoutGoalSpec(slug: string) {
  return GOAL_SPEC_BY_SLUG.get(slug) ?? null;
}

export function getWorkoutBodyPartSpec(slug: string) {
  return BODY_PART_SPEC_BY_SLUG.get(slug) ?? null;
}

export function titleCaseSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
