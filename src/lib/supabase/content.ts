import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WorkoutPlanView = {
  id: string;
  title: string;
  goal: "Muscle Gain" | "Fat Loss" | "Maintenance";
  bodyPart: "Chest" | "Back" | "Biceps" | "Legs" | "Shoulders" | "Core";
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  exercises: Array<{
    name: string;
    motion: string;
    formCue: string;
    sets: string;
    reps: string;
  }>;
};

export type DietPlanView = {
  id: string;
  title: string;
  category:
    | "Weight Loss"
    | "Muscle Gain"
    | "Maintenance"
    | "Veg Only"
    | "Non-Veg"
    | "Low Carb"
    | "High Protein";
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meals: Array<{
    time: string;
    meal: string;
    items: string[];
  }>;
};

type WorkoutExerciseRow = {
  name: string;
  motion: string | null;
  form_cue: string | null;
  sets: string | null;
  reps: string | null;
};

type WorkoutPlanRow = {
  id: string;
  title: string;
  goal: string;
  body_part: string;
  duration: string | null;
  difficulty: string | null;
  description: string | null;
  workout_exercises: WorkoutExerciseRow[] | null;
};

type DietMealRow = {
  meal_name: string;
  meal_time: string | null;
  items: unknown;
};

type DietPlanRow = {
  id: string;
  title: string;
  category: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  diet_meals: DietMealRow[] | null;
};

const validGoals = new Set(["Muscle Gain", "Fat Loss", "Maintenance"]);
const validBodyParts = new Set(["Chest", "Back", "Biceps", "Legs", "Shoulders", "Core"]);
const validDifficulties = new Set(["Beginner", "Intermediate", "Advanced"]);
const validCategories = new Set([
  "Weight Loss",
  "Muscle Gain",
  "Maintenance",
  "Veg Only",
  "Non-Veg",
  "Low Carb",
  "High Protein",
]);

function parseStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapWorkoutPlanRow(row: WorkoutPlanRow): WorkoutPlanView {
  return {
    id: row.id,
    title: row.title,
    goal: validGoals.has(row.goal) ? (row.goal as WorkoutPlanView["goal"]) : "Maintenance",
    bodyPart: validBodyParts.has(row.body_part)
      ? (row.body_part as WorkoutPlanView["bodyPart"])
      : "Core",
    duration: row.duration ?? "40 min",
    difficulty: validDifficulties.has(row.difficulty ?? "")
      ? (row.difficulty as WorkoutPlanView["difficulty"])
      : "Intermediate",
    description: row.description ?? "Structured training block.",
    exercises: (row.workout_exercises ?? []).map((exercise) => ({
      name: exercise.name,
      motion: exercise.motion ?? "Controlled movement.",
      formCue: exercise.form_cue ?? "Stay braced and maintain alignment.",
      sets: exercise.sets ?? "3",
      reps: exercise.reps ?? "10",
    })),
  };
}

function mapDietPlanRow(row: DietPlanRow): DietPlanView {
  return {
    id: row.id,
    title: row.title,
    category: validCategories.has(row.category)
      ? (row.category as DietPlanView["category"])
      : "Maintenance",
    calories: row.calories ?? 2000,
    protein: row.protein ?? 120,
    carbs: row.carbs ?? 200,
    fats: row.fats ?? 60,
    meals: (row.diet_meals ?? []).map((meal) => ({
      time: meal.meal_time ?? "Anytime",
      meal: meal.meal_name,
      items: parseStringList(meal.items),
    })),
  };
}

export async function getWorkoutPlansForUser() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as WorkoutPlanView[];
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [] as WorkoutPlanView[];
  }

  const { data, error } = await supabase
    .from("workout_plans")
    .select(
      "id,title,goal,body_part,duration,difficulty,description,workout_exercises(name,motion,form_cue,sets,reps)",
    )
    .order("title", { ascending: true })
    .returns<WorkoutPlanRow[]>();

  if (error || !data || data.length === 0) {
    return [] as WorkoutPlanView[];
  }

  return data.map(mapWorkoutPlanRow);
}

export async function getDietPlansForUser() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as DietPlanView[];
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [] as DietPlanView[];
  }

  const { data, error } = await supabase
    .from("diet_plans")
    .select("id,title,category,calories,protein,carbs,fats,diet_meals(meal_name,meal_time,items)")
    .order("title", { ascending: true })
    .returns<DietPlanRow[]>();

  if (error || !data || data.length === 0) {
    return [] as DietPlanView[];
  }

  return data.map(mapDietPlanRow);
}
