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
  id: string;
  goal: string | null;
  body_part_slug: string | null;
  difficulty: string | null;
  title: string;
  form_cues: unknown;
  sets: string | null;
  reps: string | null;
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

function toGoalLabel(value: string | null) {
  switch ((value ?? "").trim().toLowerCase()) {
    case "muscle-gain":
      return "Muscle Gain";
    case "fat-loss":
      return "Fat Loss";
    default:
      return "Maintenance";
  }
}

function toBodyPartLabel(value: string | null) {
  const normalized = (value ?? "").trim().toLowerCase();

  if (!normalized) {
    return "Core";
  }

  const titleCased = normalized
    .split("-")
    .map((part) => (part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : ""))
    .join(" ");

  return validBodyParts.has(titleCased) ? titleCased : "Core";
}

function mapWorkoutExerciseRow(row: WorkoutExerciseRow): WorkoutPlanView {
  return {
    id: row.id,
    title: row.title,
    goal: toGoalLabel(row.goal) as WorkoutPlanView["goal"],
    bodyPart: toBodyPartLabel(row.body_part_slug) as WorkoutPlanView["bodyPart"],
    duration: "40 min",
    difficulty: validDifficulties.has(row.difficulty ?? "")
      ? (row.difficulty as WorkoutPlanView["difficulty"])
      : "Intermediate",
    description: "Structured training block.",
    exercises: [
      {
        name: row.title,
        formCue: parseStringList(row.form_cues)[0] ?? "Stay braced and maintain alignment.",
        sets: row.sets ?? "3",
        reps: row.reps ?? "10",
      },
    ],
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
    .from("workout_exercises")
    .select("id,title,goal,body_part_slug,difficulty,form_cues,sets,reps")
    .order("title", { ascending: true })
    .returns<WorkoutExerciseRow[]>();

  if (error || !data || data.length === 0) {
    return [] as WorkoutPlanView[];
  }

  return data.map(mapWorkoutExerciseRow);
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
