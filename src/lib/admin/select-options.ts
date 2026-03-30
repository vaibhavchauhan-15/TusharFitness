export type AdminSelectOption = {
  value: string;
  label: string;
  description?: string;
};

export const WORKOUT_EQUIPMENT_OPTIONS: AdminSelectOption[] = [
  { value: "Bodyweight", label: "Bodyweight" },
  { value: "Dumbbell", label: "Dumbbell" },
  { value: "Barbell", label: "Barbell" },
  { value: "Kettlebell", label: "Kettlebell" },
  { value: "Cable", label: "Cable" },
  { value: "Machine", label: "Machine" },
  { value: "Resistance Band", label: "Resistance Band" },
  { value: "EZ Bar", label: "EZ Bar" },
  { value: "Medicine Ball", label: "Medicine Ball" },
  { value: "Other", label: "Other" },
];

export const WORKOUT_PROGRAM_STATUS_OPTIONS: AdminSelectOption[] = [
  { value: "draft", label: "Save as draft" },
  { value: "published", label: "Publish now" },
];

export const WORKOUT_GOAL_OPTIONS: AdminSelectOption[] = [
  { value: "fat loss", label: "Fat Loss" },
  { value: "muscle gain", label: "Muscle Gain" },
  { value: "strength", label: "Strength" },
  { value: "mobility", label: "Mobility" },
  { value: "endurance", label: "Endurance" },
  { value: "maintenance", label: "Maintenance" },
];

export const WORKOUT_BODY_PART_OPTIONS: AdminSelectOption[] = [
  { value: "full body", label: "Full Body" },
  { value: "upper body", label: "Upper Body" },
  { value: "lower body", label: "Lower Body" },
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "legs", label: "Legs" },
  { value: "shoulders", label: "Shoulders" },
  { value: "arms", label: "Arms" },
  { value: "core", label: "Core" },
];

export const WORKOUT_GOAL_TYPE_OPTIONS: AdminSelectOption[] = [
  { value: "fat-loss", label: "Fat Loss" },
  { value: "muscle-gain", label: "Muscle Gain" },
  { value: "strength", label: "Strength" },
  { value: "mobility", label: "Mobility" },
  { value: "endurance", label: "Endurance" },
  { value: "general-fitness", label: "General Fitness" },
];

export const WORKOUT_LEVEL_OPTIONS: AdminSelectOption[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const WORKOUT_DIFFICULTY_OPTIONS: AdminSelectOption[] = [
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "hard", label: "Hard" },
];

export function toAdminSelectOptions(items: Array<{ slug: string; name: string }>): AdminSelectOption[] {
  return items.map((item) => ({
    value: item.slug,
    label: item.name,
  }));
}
