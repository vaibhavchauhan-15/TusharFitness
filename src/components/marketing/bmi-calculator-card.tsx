"use client";

import { useRef, useState } from "react";
import {
  HiArrowDownTray,
  HiArrowsRightLeft,
  HiCheckCircle,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineHeart,
  HiOutlineInformationCircle,
  HiOutlinePrinter,
  HiOutlineScale,
  HiOutlineShare,
} from "react-icons/hi2";
import { OptionSelector } from "@/components/ui/option-selector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calculateBmi, cn } from "@/lib/utils";

type UnitSystem = "metric" | "imperial";
type Mode = "adult" | "child";
type Gender = "female" | "male" | "other";
type ActivityLevel = "light" | "moderate" | "active" | "athlete";
type Goal = "lose-weight" | "maintain" | "gain-muscle";
type CategoryKey = "underweight" | "healthy" | "overweight" | "obesity";

type ValidationErrors = Partial<Record<"age" | "height" | "weight" | "waist" | "hip", string>>;

type SavedResult = {
  bmi: number;
  categoryLabel: string;
  savedAt: string;
  mode: Mode;
};

type CalculationResult = {
  bmi: number;
  category: CategoryKey;
  categoryLabel: string;
  scoreToneClass: string;
  badgeClassName: string;
  markerColor: string;
  healthyWeightRangeLabel: string;
  riskSummary: string;
  insight: string;
  recommendations: string[];
  heightCm: number;
  weightKg: number;
  waistHipInsight: string | null;
  categoryExplanation: string;
  isPediatricEstimate: boolean;
};

const BMI_STORAGE_KEY = "tusharfitness:bmi-last-result";
const BMI_BAR_BACKGROUND =
  "linear-gradient(90deg, #7dd3fc 0%, #7dd3fc 23.21%, #22c55e 23.21%, #22c55e 46.43%, #fbbf24 46.43%, #fbbf24 64.29%, #f97316 64.29%, #ef4444 100%)";

const ACTIVITY_OPTIONS = [
  {
    value: "light",
    label: "Light",
    description: "Desk work or low daily movement.",
  },
  {
    value: "moderate",
    label: "Moderate",
    description: "Regular walks and 2-4 exercise sessions weekly.",
  },
  {
    value: "active",
    label: "Active",
    description: "Frequent training or a physically demanding routine.",
  },
  {
    value: "athlete",
    label: "Athlete",
    description: "High training volume with recovery and performance focus.",
  },
] as const;

const GOAL_OPTIONS = [
  {
    value: "lose-weight",
    label: "Lose weight",
    description: "Aim for slow, steady fat loss without extreme restriction.",
  },
  {
    value: "maintain",
    label: "Maintain weight",
    description: "Support stable habits, energy, and healthy routines.",
  },
  {
    value: "gain-muscle",
    label: "Gain muscle",
    description: "Prioritize strength, protein, and recovery support.",
  },
] as const;

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function kgToLb(value: number) {
  return value / 0.45359237;
}

function lbToKg(value: number) {
  return value * 0.45359237;
}

function cmToInches(value: number) {
  return value / 2.54;
}

function inchesToCm(value: number) {
  return value * 2.54;
}

function heightCmToImperial(value: number) {
  const totalInches = cmToInches(value);
  const feet = Math.floor(totalInches / 12);
  const inches = roundToSingleDecimal(totalInches - feet * 12);

  return {
    feet: String(feet),
    inches: String(inches),
  };
}

function imperialHeightToCm(feetValue: string, inchesValue: string) {
  const feet = toNumber(feetValue);
  const inches = toNumber(inchesValue);
  return inchesToCm((Number.isFinite(feet) ? feet : 0) * 12 + (Number.isFinite(inches) ? inches : 0));
}

function getCategoryMeta(category: CategoryKey) {
  switch (category) {
    case "underweight":
      return {
        label: "Underweight",
        scoreToneClass: "text-sky-600",
        badgeClassName:
          "border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100",
        markerColor: "#0284c7",
      };
    case "healthy":
      return {
        label: "Healthy",
        scoreToneClass: "text-emerald-600",
        badgeClassName:
          "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100",
        markerColor: "#16a34a",
      };
    case "overweight":
      return {
        label: "Overweight",
        scoreToneClass: "text-amber-600",
        badgeClassName:
          "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
        markerColor: "#d97706",
      };
    case "obesity":
      return {
        label: "Obesity",
        scoreToneClass: "text-rose-600",
        badgeClassName:
          "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100",
        markerColor: "#dc2626",
      };
  }
}

function getBmiCategory(bmi: number): CategoryKey {
  if (bmi < 18.5) {
    return "underweight";
  }

  if (bmi < 25) {
    return "healthy";
  }

  if (bmi < 30) {
    return "overweight";
  }

  return "obesity";
}

function getHealthyWeightRangeLabel(heightCm: number, unitSystem: UnitSystem, locale: string) {
  const heightMeters = heightCm / 100;
  const minKg = 18.5 * heightMeters * heightMeters;
  const maxKg = 24.9 * heightMeters * heightMeters;
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  });

  if (unitSystem === "imperial") {
    return `${formatter.format(kgToLb(minKg))} to ${formatter.format(kgToLb(maxKg))} lb`;
  }

  return `${formatter.format(minKg)} to ${formatter.format(maxKg)} kg`;
}

function getWaistHipInsight(waistValue: string, hipValue: string, gender: Gender, locale: string) {
  const waist = toNumber(waistValue);
  const hip = toNumber(hipValue);

  if (!(waist > 0) || !(hip > 0)) {
    return null;
  }

  const ratio = waist / hip;
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  if (gender === "female") {
    if (ratio >= 0.85) {
      return `Waist-to-hip ratio: ${formatter.format(ratio)}. This is above the common screening threshold used for women and may suggest more central fat storage.`;
    }

    return `Waist-to-hip ratio: ${formatter.format(ratio)}. This sits below the common screening threshold used for women.`;
  }

  if (gender === "male") {
    if (ratio >= 0.9) {
      return `Waist-to-hip ratio: ${formatter.format(ratio)}. This is above the common screening threshold used for men and may suggest more central fat storage.`;
    }

    return `Waist-to-hip ratio: ${formatter.format(ratio)}. This sits below the common screening threshold used for men.`;
  }

  if (ratio >= 0.88) {
    return `Waist-to-hip ratio: ${formatter.format(ratio)}. This may suggest more weight carried through the waist, which adds context beyond BMI alone.`;
  }

  return `Waist-to-hip ratio: ${formatter.format(ratio)}. This adds context about body-fat distribution beyond BMI alone.`;
}

function getRiskSummary(category: CategoryKey, mode: Mode) {
  if (mode === "child") {
    return "For children and teens, BMI is best interpreted with age- and sex-specific percentiles. Use this as a quick screening estimate, not a diagnosis.";
  }

  switch (category) {
    case "underweight":
      return "A lower BMI can sometimes be linked with low energy stores, low muscle mass, or nutrition gaps. Context from appetite, strength, and medical history matters.";
    case "healthy":
      return "This BMI falls in the healthy range for adults. Daily habits like food quality, sleep, strength work, and waist size still shape long-term risk.";
    case "overweight":
      return "A BMI in this range can be associated with higher cardiometabolic strain over time. Waist size, blood pressure, activity, and lab markers help complete the picture.";
    case "obesity":
      return "A BMI in this range can be associated with higher long-term health risk. Support from a clinician or dietitian can help make next steps safer and more personalized.";
  }
}

function getCategoryExplanation(category: CategoryKey, mode: Mode) {
  if (mode === "child") {
    return "Pediatric BMI categories are normally based on age- and sex-specific percentiles, so this page treats the category below as a quick estimate only.";
  }

  switch (category) {
    case "underweight":
      return "Below 18.5";
    case "healthy":
      return "18.5 to 24.9";
    case "overweight":
      return "25.0 to 29.9";
    case "obesity":
      return "30.0 and above";
  }
}

function getInsight(category: CategoryKey, mode: Mode, goal: Goal) {
  if (mode === "child") {
    return "Because growth patterns change through childhood and adolescence, a pediatric review gives the clearest interpretation. Use this result to guide a supportive conversation, not to self-diagnose.";
  }

  if (category === "healthy" && goal === "gain-muscle") {
    return "Your BMI sits in a comfortable range for focusing on strength, recovery, and body composition rather than chasing scale changes alone.";
  }

  if (category === "underweight") {
    return "A calm next step is to check whether your current intake, recovery, and strength routine support your daily energy needs.";
  }

  if (category === "healthy") {
    return "Your BMI is in the healthy range. The best next move is usually consistency: strong basics, good recovery, and a routine you can keep.";
  }

  if (category === "overweight") {
    return "A modest shift in food quality, movement, and routine can meaningfully improve health markers without needing an aggressive reset.";
  }

  return "Focus on steady habits and outside support instead of extreme tactics. Small, repeatable changes usually outperform short bursts of restriction.";
}

function getRecommendations(category: CategoryKey, mode: Mode, goal: Goal, activityLevel: ActivityLevel) {
  const items: string[] = [];

  if (mode === "child") {
    items.push("Use this result as a prompt to review pediatric BMI percentiles with a parent, coach, or clinician.");
    items.push("Prioritize regular meals, sleep, outdoor play, and strength-building activity instead of calorie counting.");
  } else if (category === "underweight") {
    items.push("Build meals around protein, carbs, and healthy fats so your intake supports daily energy and recovery.");
    items.push("Use 2 to 4 full-body strength sessions each week if your goal is to gain muscle safely.");
  } else if (category === "healthy") {
    items.push("Keep protein, fiber, hydration, and a regular movement routine steady to protect the healthy range.");
    items.push("Use body composition, energy, and performance trends alongside BMI for a fuller view.");
  } else if (category === "overweight") {
    items.push("Start with one sustainable lever: meal structure, daily steps, or fewer liquid calories.");
    items.push("Aim for regular resistance training and a consistent walking routine to support fat loss while protecting muscle.");
  } else {
    items.push("Choose a small, repeatable routine such as a daily walk, protein-first meals, or consistent meal timing.");
    items.push("If you have symptoms, medications, or long-term conditions, ask a clinician for a personalized plan.");
  }

  if (goal === "lose-weight") {
    items.push("For fat loss, aim for gradual progress with a mild calorie deficit instead of extreme restriction.");
  } else if (goal === "maintain") {
    items.push("For maintenance, keep your weekly routine predictable enough that your weight can stay stable without constant tracking.");
  } else {
    items.push("For muscle gain, anchor the week around progressive strength work, recovery, and enough protein.");
  }

  if (activityLevel === "light") {
    items.push("A simple place to begin is 20 to 30 minutes of walking most days plus 2 beginner strength sessions weekly.");
  } else if (activityLevel === "moderate") {
    items.push("Keep training consistent and progress gradually rather than stacking hard days back to back.");
  } else {
    items.push("Match heavier training with enough food, sleep, and recovery so a high activity load does not distort the bigger health picture.");
  }

  return items.slice(0, 4);
}

function getScalePosition(bmi: number) {
  return ((clamp(bmi, 12, 40) - 12) / 28) * 100;
}

function formatValue(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value);
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">{label}</span>
      {children}
      {error ? (
        <span className="mt-2 block text-sm text-rose-600" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-2 block text-sm text-[var(--muted-foreground)]">{hint}</span>
      ) : null}
    </label>
  );
}

function SegmentedControl<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-[var(--foreground)]">{label}</p>
      <div className="grid grid-cols-2 gap-2 rounded-[22px] border border-[var(--card-border)] bg-[var(--muted)] p-1.5">
        {options.map((option) => {
          const active = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-11 rounded-2xl px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                active
                  ? "bg-[var(--surface-strong)] text-[var(--foreground)] shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--surface-strong)]/70 hover:text-[var(--foreground)]",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BmiCalculatorCard() {
  const resultRef = useRef<HTMLDivElement | null>(null);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [mode, setMode] = useState<Mode>("adult");
  const [gender, setGender] = useState<Gender>("female");
  const [age, setAge] = useState("29");
  const [heightCm, setHeightCm] = useState("168");
  const [weightKg, setWeightKg] = useState("64");
  const [heightFeet, setHeightFeet] = useState("5");
  const [heightInches, setHeightInches] = useState("6.1");
  const [weightLb, setWeightLb] = useState("141.1");
  const [waistValue, setWaistValue] = useState("");
  const [hipValue, setHipValue] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [savedResult, setSavedResult] = useState<SavedResult | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedResult = window.localStorage.getItem(BMI_STORAGE_KEY);

    if (!storedResult) {
      return null;
    }

    try {
      return JSON.parse(storedResult) as SavedResult;
    } catch {
      return null;
    }
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [locale] = useState(() => (typeof window === "undefined" ? "en-IN" : window.navigator.language || "en-IN"));

  function switchUnitSystem(nextUnit: UnitSystem) {
    if (nextUnit === unitSystem) {
      return;
    }

    if (nextUnit === "imperial") {
      const convertedHeight = toNumber(heightCm);
      const convertedWeight = toNumber(weightKg);
      const convertedWaist = toNumber(waistValue);
      const convertedHip = toNumber(hipValue);

      if (convertedHeight > 0) {
        const { feet, inches } = heightCmToImperial(convertedHeight);
        setHeightFeet(feet);
        setHeightInches(inches);
      }

      if (convertedWeight > 0) {
        setWeightLb(String(roundToSingleDecimal(kgToLb(convertedWeight))));
      }

      if (convertedWaist > 0) {
        setWaistValue(String(roundToSingleDecimal(cmToInches(convertedWaist))));
      }

      if (convertedHip > 0) {
        setHipValue(String(roundToSingleDecimal(cmToInches(convertedHip))));
      }
    } else {
      const convertedHeight = imperialHeightToCm(heightFeet, heightInches);
      const convertedWeight = toNumber(weightLb);
      const convertedWaist = toNumber(waistValue);
      const convertedHip = toNumber(hipValue);

      if (convertedHeight > 0) {
        setHeightCm(String(roundToSingleDecimal(convertedHeight)));
      }

      if (convertedWeight > 0) {
        setWeightKg(String(roundToSingleDecimal(lbToKg(convertedWeight))));
      }

      if (convertedWaist > 0) {
        setWaistValue(String(roundToSingleDecimal(inchesToCm(convertedWaist))));
      }

      if (convertedHip > 0) {
        setHipValue(String(roundToSingleDecimal(inchesToCm(convertedHip))));
      }
    }

    setUnitSystem(nextUnit);
    setErrors({});
  }

  function validate() {
    const nextErrors: ValidationErrors = {};
    const ageValue = Math.trunc(toNumber(age));

    if (!(ageValue > 0)) {
      nextErrors.age = "Enter a valid age.";
    } else if (mode === "adult" && ageValue < 20) {
      nextErrors.age = "Adult mode is intended for ages 20 and older.";
    } else if (mode === "child" && (ageValue < 2 || ageValue > 19)) {
      nextErrors.age = "Child/Teen mode is intended for ages 2 to 19.";
    }

    if (unitSystem === "metric") {
      if (!(toNumber(heightCm) > 0)) {
        nextErrors.height = "Enter a valid height in centimeters.";
      }

      if (!(toNumber(weightKg) > 0)) {
        nextErrors.weight = "Enter a valid weight in kilograms.";
      }
    } else {
      const currentFeet = toNumber(heightFeet);
      const currentInches = toNumber(heightInches);

      if (!((currentFeet > 0 || currentInches > 0) && currentInches >= 0 && currentInches < 12)) {
        nextErrors.height = "Use feet and inches, with inches between 0 and 11.9.";
      }

      if (!(toNumber(weightLb) > 0)) {
        nextErrors.weight = "Enter a valid weight in pounds.";
      }
    }

    if (waistValue && !(toNumber(waistValue) > 0)) {
      nextErrors.waist = `Enter a valid waist measurement in ${unitSystem === "metric" ? "cm" : "inches"}.`;
    }

    if (hipValue && !(toNumber(hipValue) > 0)) {
      nextErrors.hip = `Enter a valid hip measurement in ${unitSystem === "metric" ? "cm" : "inches"}.`;
    }

    setErrors(nextErrors);

    const firstErrorField = Object.keys(nextErrors)[0];

    if (firstErrorField) {
      window.requestAnimationFrame(() => {
        document.getElementById(firstErrorField)?.focus();
      });
    }

    return Object.keys(nextErrors).length === 0;
  }

  function handleCalculate() {
    if (!validate()) {
      setStatusMessage("Please review the highlighted fields.");
      return;
    }

    const currentHeightCm =
      unitSystem === "metric" ? toNumber(heightCm) : imperialHeightToCm(heightFeet, heightInches);
    const currentWeightKg = unitSystem === "metric" ? toNumber(weightKg) : lbToKg(toNumber(weightLb));
    const bmi = calculateBmi(currentWeightKg, currentHeightCm);
    const category = getBmiCategory(bmi);
    const categoryMeta = getCategoryMeta(category);
    const nextResult: CalculationResult = {
      bmi,
      category,
      categoryLabel: categoryMeta.label,
      scoreToneClass: categoryMeta.scoreToneClass,
      badgeClassName: categoryMeta.badgeClassName,
      markerColor: categoryMeta.markerColor,
      healthyWeightRangeLabel: getHealthyWeightRangeLabel(currentHeightCm, unitSystem, locale),
      riskSummary: getRiskSummary(category, mode),
      insight: getInsight(category, mode, goal),
      recommendations: getRecommendations(category, mode, goal, activityLevel),
      heightCm: currentHeightCm,
      weightKg: currentWeightKg,
      waistHipInsight: getWaistHipInsight(waistValue, hipValue, gender, locale),
      categoryExplanation: getCategoryExplanation(category, mode),
      isPediatricEstimate: mode === "child",
    };

    setResult(nextResult);
    setStatusMessage(`BMI calculated. Result is ${formatValue(bmi, locale)} in the ${categoryMeta.label} range.`);

    window.requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }

  function handleSave() {
    if (!result) {
      return;
    }

    const nextSavedResult: SavedResult = {
      bmi: result.bmi,
      categoryLabel: result.categoryLabel,
      savedAt: new Date().toISOString(),
      mode,
    };

    window.localStorage.setItem(BMI_STORAGE_KEY, JSON.stringify(nextSavedResult));
    setSavedResult(nextSavedResult);
    setStatusMessage("Saved locally on this device.");
  }

  async function handleShare() {
    if (!result) {
      return;
    }

    const summary = `My BMI result is ${formatValue(result.bmi, locale)} (${result.categoryLabel}). Healthy weight range: ${result.healthyWeightRangeLabel}.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "BMI result",
          text: summary,
        });
        setStatusMessage("Result shared.");
        return;
      }

      await navigator.clipboard.writeText(summary);
      setStatusMessage("Result copied to your clipboard.");
    } catch {
      setStatusMessage("Sharing is not available in this browser.");
    }
  }

  function handlePrint() {
    window.print();
  }

  const lastSavedLabel = savedResult
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(savedResult.savedAt))
    : null;

  const bmiDisplay = result ? formatValue(result.bmi, locale) : "22.4";
  const markerLeft = result ? getScalePosition(result.bmi) : getScalePosition(22.4);
  const recommendationItems =
    result?.recommendations.slice(0, 3) ?? [
      "Adults use standard BMI bands; children and teens need percentile-based interpretation.",
      "Supportive food, movement, and sleep routines usually matter more than chasing a perfect number.",
      "If you want deeper context, add waist and hip measurements above.",
    ];

  return (
    <Card className="overflow-hidden rounded-[32px] p-4 sm:p-6 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        <div className="surface-panel rounded-[28px] p-5 sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Enter your details
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Get a clean, instant BMI snapshot
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--muted-foreground)]">
                Start with the basics. Open the advanced section only if you want extra context.
              </p>
            </div>
            <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] sm:flex">
              <HiOutlineScale className="h-6 w-6" />
            </div>
          </div>

          <div className="space-y-4">
            <SegmentedControl
              label="Unit system"
              value={unitSystem}
              onChange={switchUnitSystem}
              options={[
                { value: "metric", label: "Metric" },
                { value: "imperial", label: "Imperial" },
              ]}
            />

            <SegmentedControl
              label="Mode"
              value={mode}
              onChange={setMode}
              options={[
                { value: "adult", label: "Adult" },
                { value: "child", label: "Child / Teen" },
              ]}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Gender" htmlFor="gender">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "female", label: "Female" },
                    { value: "male", label: "Male" },
                    { value: "other", label: "Other" },
                  ].map((option) => {
                    const active = option.value === gender;

                    return (
                      <button
                        key={option.value}
                        id={option.value === "female" ? "gender" : undefined}
                        type="button"
                        onClick={() => setGender(option.value as Gender)}
                        className={cn(
                          "min-h-11 rounded-2xl border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                          active
                            ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--foreground)]"
                            : "border-[var(--card-border)] bg-[var(--surface-strong)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field
                label="Age"
                htmlFor="age"
                hint={mode === "adult" ? "Adult mode uses ages 20 and older." : "Child/Teen mode is for ages 2 to 19."}
                error={errors.age}
              >
                <Input
                  id="age"
                  inputMode="numeric"
                  min={mode === "adult" ? 20 : 2}
                  max={mode === "adult" ? 120 : 19}
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  placeholder={mode === "adult" ? "29" : "14"}
                />
              </Field>
            </div>

            {unitSystem === "metric" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Height" htmlFor="height" error={errors.height}>
                  <div className="relative">
                    <Input
                      id="height"
                      inputMode="decimal"
                      value={heightCm}
                      onChange={(event) => setHeightCm(event.target.value)}
                      placeholder="168"
                      className="pr-14"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-[var(--muted-foreground)]">
                      cm
                    </span>
                  </div>
                </Field>

                <Field label="Weight" htmlFor="weight" error={errors.weight}>
                  <div className="relative">
                    <Input
                      id="weight"
                      inputMode="decimal"
                      value={weightKg}
                      onChange={(event) => setWeightKg(event.target.value)}
                      placeholder="64"
                      className="pr-14"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-[var(--muted-foreground)]">
                      kg
                    </span>
                  </div>
                </Field>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Height" htmlFor="height" error={errors.height}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Input
                        id="height"
                        inputMode="decimal"
                        value={heightFeet}
                        onChange={(event) => setHeightFeet(event.target.value)}
                        placeholder="5"
                        className="pr-12"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-[var(--muted-foreground)]">
                        ft
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        inputMode="decimal"
                        value={heightInches}
                        onChange={(event) => setHeightInches(event.target.value)}
                        placeholder="6"
                        className="pr-12"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-[var(--muted-foreground)]">
                        in
                      </span>
                    </div>
                  </div>
                </Field>

                <Field label="Weight" htmlFor="weight" error={errors.weight}>
                  <div className="relative">
                    <Input
                      id="weight"
                      inputMode="decimal"
                      value={weightLb}
                      onChange={(event) => setWeightLb(event.target.value)}
                      placeholder="141"
                      className="pr-14"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-[var(--muted-foreground)]">
                      lb
                    </span>
                  </div>
                </Field>
              </div>
            )}

            <details className="group rounded-[24px] border border-[var(--card-border)] bg-[var(--muted)] p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[var(--foreground)] marker:hidden">
                <span className="flex items-center gap-2">
                  <HiArrowsRightLeft className="h-4 w-4 text-[var(--primary)]" />
                  Optional advanced details
                </span>
                <span className="rounded-full border border-[var(--card-border)] bg-[var(--surface-strong)] px-3 py-1 text-xs text-[var(--muted-foreground)] transition group-open:rotate-180">
                  More
                </span>
              </summary>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label={`Waist circumference (${unitSystem === "metric" ? "cm" : "in"})`}
                  htmlFor="waist"
                  hint="Helpful for body-fat distribution context."
                  error={errors.waist}
                >
                  <Input
                    id="waist"
                    inputMode="decimal"
                    value={waistValue}
                    onChange={(event) => setWaistValue(event.target.value)}
                    placeholder={unitSystem === "metric" ? "80" : "31.5"}
                  />
                </Field>

                <Field
                  label={`Hip circumference (${unitSystem === "metric" ? "cm" : "in"})`}
                  htmlFor="hip"
                  hint="Add both waist and hip for a ratio insight."
                  error={errors.hip}
                >
                  <Input
                    id="hip"
                    inputMode="decimal"
                    value={hipValue}
                    onChange={(event) => setHipValue(event.target.value)}
                    placeholder={unitSystem === "metric" ? "96" : "37.8"}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Activity level" htmlFor="activity">
                    <OptionSelector
                      id="activity"
                      value={activityLevel}
                      onValueChange={(value) => setActivityLevel(value as ActivityLevel)}
                      options={ACTIVITY_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                        description: option.description,
                      }))}
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Goal" htmlFor="goal">
                    <OptionSelector
                      id="goal"
                      value={goal}
                      onValueChange={(value) => setGoal(value as Goal)}
                      options={GOAL_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                        description: option.description,
                      }))}
                    />
                  </Field>
                </div>
              </div>
            </details>

            <Button type="button" size="lg" className="w-full justify-center rounded-[22px] text-base" onClick={handleCalculate}>
              Calculate BMI
            </Button>

            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              Your entries stay in this browser by default. Save is optional.
            </p>
          </div>
        </div>

        <div
          ref={resultRef}
          className="glass-panel rounded-[28px] p-5 sm:p-6"
          aria-live="polite"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Your result
              </p>
              <h3 className="mt-3 text-2xl font-bold tracking-tight text-[var(--foreground)]">
                {result ? "Your BMI result, made easy to scan" : "Preview your result panel"}
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--muted-foreground)]">
                {result
                  ? "Score, category, healthy range, and the most useful next steps."
                  : "Complete the form to replace this preview with your live calculation."}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <HiOutlineChartBar className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="surface-panel rounded-[28px] p-5">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted-foreground)]">BMI score</p>
                  <div className="mt-4 flex items-end gap-3">
                    <p className={cn("font-heading text-6xl font-bold tracking-tight", result?.scoreToneClass ?? "text-[var(--success)]")}>
                      {bmiDisplay}
                    </p>
                    <span className="pb-2 text-sm text-[var(--muted-foreground)]">kg/m2</span>
                  </div>
                  <div
                    className={cn(
                      "mt-4 inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold",
                      result?.badgeClassName ??
                        "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100",
                    )}
                  >
                    {result?.categoryLabel ?? "Healthy"}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)]">
                    {result?.categoryExplanation ?? "Example category band: 18.5 to 24.9"}
                  </p>
                </div>

                <div className="w-full max-w-sm rounded-[24px] border border-[var(--card-border)] bg-[var(--muted)] p-4">
                  <p className="text-sm font-semibold text-[var(--foreground)]">Healthy range</p>
                  <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                    {result?.healthyWeightRangeLabel ?? "52.2 to 70.4 kg"}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
                    {result?.insight ?? "This preview shows the calm guidance users see after a calculation."}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-[var(--foreground)]">Color-coded BMI scale</p>
                  <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                    Screening tool
                  </span>
                </div>
                <div className="mt-4 relative h-4 overflow-hidden rounded-full" style={{ background: BMI_BAR_BACKGROUND }}>
                  <div
                    className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-4 border-[color:var(--background)] shadow-[0_12px_24px_rgba(15,23,42,0.2)]"
                    style={{
                      left: `calc(${markerLeft}% - 12px)`,
                      backgroundColor: result?.markerColor ?? "#16a34a",
                    }}
                    aria-hidden="true"
                  />
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-[var(--muted-foreground)]">
                  <span>&lt;18.5</span>
                  <span>18.5-24.9</span>
                  <span>25-29.9</span>
                  <span>30+</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="surface-panel rounded-[28px] p-5">
                <div className="flex items-center gap-2 text-[var(--foreground)]">
                  <HiOutlineHeart className="h-5 w-5 text-[var(--primary)]" />
                  <p className="font-semibold">Health context</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
                  {result?.riskSummary ??
                    "BMI is a screening measure, not a diagnosis. It works best alongside waist size, blood pressure, daily habits, and medical history."}
                </p>
                {result?.waistHipInsight ? (
                  <div className="mt-4 rounded-[22px] border border-sky-200/70 bg-sky-50 p-4 dark:border-sky-900/50 dark:bg-sky-950/30">
                    <p className="flex items-start gap-2 text-sm leading-7 text-sky-900 dark:text-sky-100">
                      <HiOutlineInformationCircle className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                      {result.waistHipInsight}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="surface-panel rounded-[28px] p-5">
                <div className="flex items-center gap-2 text-[var(--foreground)]">
                  <HiCheckCircle className="h-5 w-5 text-[var(--primary)]" />
                  <p className="font-semibold">Recommended next steps</p>
                </div>
                <ul className="mt-4 space-y-3">
                  {recommendationItems.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 rounded-[20px] border border-[var(--card-border)] bg-[var(--muted)] px-4 py-3 text-sm leading-7 text-[var(--foreground)]"
                    >
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--primary)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3 print:hidden">
            <Button type="button" variant="outline" className="justify-center rounded-[20px]" onClick={handleSave} disabled={!result}>
              <HiArrowDownTray className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button type="button" variant="outline" className="justify-center rounded-[20px]" onClick={handlePrint} disabled={!result}>
              <HiOutlinePrinter className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button type="button" variant="outline" className="justify-center rounded-[20px]" onClick={handleShare} disabled={!result}>
              <HiOutlineShare className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="rounded-[24px] border border-[var(--card-border)] bg-[var(--muted)] p-4">
              <p className="flex items-start gap-2 text-sm leading-7 text-[var(--muted-foreground)]">
                <HiOutlineClock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" />
                Privacy note: this calculator works locally in your browser. Results are only stored if you explicitly tap Save.
              </p>
            </div>
            {savedResult ? (
              <div className="surface-panel rounded-[24px] px-4 py-3 text-sm text-[var(--muted-foreground)]">
                <p className="font-semibold text-[var(--foreground)]">Last saved</p>
                <p className="mt-1">
                  {formatValue(savedResult.bmi, locale)} - {savedResult.categoryLabel}
                </p>
                <p className="mt-1">{lastSavedLabel}</p>
              </div>
            ) : null}
          </div>

          {result?.isPediatricEstimate ? (
            <div className="mt-4 rounded-[24px] border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
              <p className="flex items-start gap-2 text-sm leading-7 text-amber-900 dark:text-amber-100">
                <HiOutlineExclamationCircle className="mt-0.5 h-5 w-5 shrink-0" />
                Child and teen BMI is normally interpreted with age- and sex-specific percentiles, not adult cutoffs alone. This page shows a quick estimate and points users toward a clinical review when needed.
              </p>
            </div>
          ) : null}

          {statusMessage ? <p className="mt-4 text-sm text-[var(--muted-foreground)]">{statusMessage}</p> : null}
        </div>
      </div>
    </Card>
  );
}
