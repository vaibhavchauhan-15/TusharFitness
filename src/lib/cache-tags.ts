export const CACHE_TAGS = {
  workoutsCatalog: "workouts-catalog",
  workoutExercises: "workout-exercises",
  dietPlans: "diet-plans",
} as const;

export const CACHE_TTL = {
  workoutsCatalogSeconds: 300,
  workoutExerciseDetailsSeconds: 600,
  dietPlansSeconds: 600,
  profilePublicSeconds: 120,
} as const;
