import { completeOnboardingAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OptionSelector, type OptionSelectorOption } from "@/components/ui/option-selector";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { redirect } from "next/navigation";
import { isActiveAdminUser } from "@/lib/admin/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProfileForUser, normalizeUsername } from "@/lib/supabase/profile";

export const dynamic = "force-dynamic";

type OnboardingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type OnboardingPrefill = {
  username: string | null;
  age: number | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: string | null;
  dietType: string | null;
  activityLevel: string | null;
  injuryNotes: string | null;
};

const GENDER_OPTIONS: OptionSelectorOption[] = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const GOAL_OPTIONS: OptionSelectorOption[] = [
  { value: "Muscle Gain", label: "Muscle Gain", description: "Build lean size and strength." },
  { value: "Fat Loss", label: "Fat Loss", description: "Trim body fat while preserving muscle." },
  { value: "Maintenance", label: "Maintenance", description: "Stay athletic with sustainable routines." },
];

const DIET_OPTIONS: OptionSelectorOption[] = [
  { value: "High Protein", label: "High Protein" },
  { value: "Veg Only", label: "Veg Only" },
  { value: "Non-Veg", label: "Non-Veg" },
  { value: "Low Carb", label: "Low Carb" },
  { value: "Maintenance", label: "Maintenance" },
];

const ACTIVITY_OPTIONS: OptionSelectorOption[] = [
  { value: "Sedentary", label: "Sedentary" },
  { value: "Lightly active", label: "Lightly active" },
  { value: "Moderately active", label: "Moderately active" },
  { value: "Very active", label: "Very active" },
];

function getFirstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getOnboardingErrorMessage(error: string | undefined) {
  switch (error) {
    case "username_taken":
      return "That username is already claimed. Choose one of the suggested options and submit again.";
    case "save_failed":
      return "We could not save your setup right now. Please retry.";
    default:
      return null;
  }
}

function getSelectDefaultValue(
  value: string | null | undefined,
  options: OptionSelectorOption[],
  fallback: string,
) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  const matchedOption = options.find((option) => {
    return option.value.toLowerCase() === normalized || option.label.toLowerCase() === normalized;
  });

  return matchedOption?.value ?? fallback;
}

async function getOnboardingPrefill(): Promise<OnboardingPrefill> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      username: null,
      age: null,
      gender: null,
      heightCm: null,
      weightKg: null,
      goal: null,
      dietType: null,
      activityLevel: null,
      injuryNotes: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      username: null,
      age: null,
      gender: null,
      heightCm: null,
      weightKg: null,
      goal: null,
      dietType: null,
      activityLevel: null,
      injuryNotes: null,
    };
  }

  const isAdmin = await isActiveAdminUser(supabase, user.id);

  if (isAdmin) {
    redirect("/admin/dashboard");
  }

  const metadataUsername =
    typeof user.user_metadata?.preferred_username === "string"
      ? user.user_metadata.preferred_username
      : user.email?.split("@")[0] ?? null;

  try {
    const profile = await ensureProfileForUser(supabase, user);

    return {
      username: profile?.username ?? metadataUsername,
      age: profile?.age ?? null,
      gender: profile?.gender ?? null,
      heightCm: profile?.height_cm ?? null,
      weightKg: profile?.weight_kg ?? null,
      goal: profile?.goal ?? null,
      dietType: profile?.diet_type ?? null,
      activityLevel: profile?.activity_level ?? null,
      injuryNotes: profile?.injury_notes ?? null,
    };
  } catch {
    return {
      username: metadataUsername,
      age: null,
      gender: null,
      heightCm: null,
      weightKg: null,
      goal: null,
      dietType: null,
      activityLevel: null,
      injuryNotes: null,
    };
  }
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;
  const prefill = await getOnboardingPrefill();
  const error = getFirstQueryValue(params.error);
  const usernameFromQuery = getFirstQueryValue(params.username);
  const suggestionQuery = getFirstQueryValue(params.suggestions);
  const errorMessage = getOnboardingErrorMessage(error);
  const usernameSuggestions = suggestionQuery
    ? suggestionQuery
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter((item, index, all) => item && all.indexOf(item) === index)
    : [];
  const initialUsername = normalizeUsername(usernameFromQuery ?? prefill.username ?? "fitness_user");
  const initialGender = getSelectDefaultValue(prefill.gender, GENDER_OPTIONS, "Male");
  const initialGoal = getSelectDefaultValue(prefill.goal, GOAL_OPTIONS, "Muscle Gain");
  const initialDiet = getSelectDefaultValue(prefill.dietType, DIET_OPTIONS, "High Protein");
  const initialActivity = getSelectDefaultValue(prefill.activityLevel, ACTIVITY_OPTIONS, "Moderately active");

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-0 top-0 h-80 w-80 rounded-full bg-(--primary-soft) blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-(--accent-soft) blur-3xl" />
      <div className="pointer-events-none absolute inset-0 hero-grid opacity-30" />

      <Card className="relative w-full overflow-hidden rounded-[36px] border border-(--card-border) p-6 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[linear-gradient(180deg,rgba(249,115,22,0.14),transparent)]" />

        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge>Onboarding checkpoint</Badge>
            <span className="rounded-full border border-(--card-border) bg-(--surface-strong) px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Step 1 of 1
            </span>
          </div>

          <h1 className="mt-5 max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl">
            Configure your athlete profile once and unlock a fully personalized command center.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Your username, body metrics, training goal, diet preference, and recovery context shape workouts, fuel plans,
            analytics, and AI guidance.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-(--card-border) bg-(--surface) px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Completion time</p>
              <p className="mt-1 font-semibold">About 2 minutes</p>
            </div>
            <div className="rounded-2xl border border-(--card-border) bg-(--surface) px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Live personalization</p>
              <p className="mt-1 font-semibold">Workouts + fuel + analytics</p>
            </div>
            <div className="rounded-2xl border border-(--card-border) bg-(--surface) px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Editable later</p>
              <p className="mt-1 font-semibold">Tune in Settings anytime</p>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {usernameSuggestions.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-500/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300">
                Suggested usernames
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {usernameSuggestions.map((suggestion) => (
                  <span
                    key={suggestion}
                    className="rounded-full border border-amber-300/40 bg-white/40 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-black/20 dark:text-amber-200"
                  >
                    {suggestion}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
            <form action={completeOnboardingAction} className="space-y-6">
              <section className="rounded-3xl border border-(--card-border) bg-(--surface) p-5 sm:p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Identity
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">Keep this unique and easy to remember.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="onboarding-username" className="text-sm font-medium">
                      Unique username
                    </label>
                    <Input
                      id="onboarding-username"
                      name="username"
                      defaultValue={initialUsername}
                      placeholder="tusharfitness_prime"
                      minLength={3}
                      maxLength={20}
                      pattern="[a-z0-9_]{3,20}"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="onboarding-age" className="text-sm font-medium">
                      Age
                    </label>
                    <Input
                      id="onboarding-age"
                      name="age"
                      type="number"
                      defaultValue={prefill.age !== null ? String(prefill.age) : undefined}
                      placeholder="27"
                      min="13"
                      max="100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="onboarding-gender" className="text-sm font-medium">
                      Gender
                    </label>
                    <OptionSelector
                      id="onboarding-gender"
                      name="gender"
                      defaultValue={initialGender}
                      options={GENDER_OPTIONS}
                      required
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-(--card-border) bg-(--surface) p-5 sm:p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Body Metrics
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">These numbers calibrate calorie targets and progress insights.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="onboarding-height" className="text-sm font-medium">
                      Height (cm)
                    </label>
                    <Input
                      id="onboarding-height"
                      name="height"
                      type="number"
                      defaultValue={prefill.heightCm !== null ? String(prefill.heightCm) : undefined}
                      placeholder="177"
                      min="100"
                      max="250"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="onboarding-weight" className="text-sm font-medium">
                      Weight (kg)
                    </label>
                    <Input
                      id="onboarding-weight"
                      name="weight"
                      type="number"
                      defaultValue={prefill.weightKg !== null ? String(prefill.weightKg) : undefined}
                      step="0.1"
                      placeholder="79.6"
                      min="30"
                      max="250"
                      required
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-(--card-border) bg-(--surface) p-5 sm:p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Program Preferences
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">Choose what best matches your current training phase.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="onboarding-goal" className="text-sm font-medium">
                      Goal
                    </label>
                    <OptionSelector
                      id="onboarding-goal"
                      name="goal"
                      defaultValue={initialGoal}
                      options={GOAL_OPTIONS}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="onboarding-diet" className="text-sm font-medium">
                      Diet type
                    </label>
                    <OptionSelector
                      id="onboarding-diet"
                      name="dietType"
                      defaultValue={initialDiet}
                      options={DIET_OPTIONS}
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="onboarding-activity" className="text-sm font-medium">
                      Activity level
                    </label>
                    <OptionSelector
                      id="onboarding-activity"
                      name="activityLevel"
                      defaultValue={initialActivity}
                      options={ACTIVITY_OPTIONS}
                      required
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-(--card-border) bg-(--surface) p-5 sm:p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Recovery Notes
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Mention pain points, restrictions, or movements you want to avoid.
                </p>
                <div className="mt-4 space-y-2">
                  <label htmlFor="onboarding-injury" className="text-sm font-medium">
                    Injury notes or movement concerns
                  </label>
                  <Textarea
                    id="onboarding-injury"
                    name="injuryNotes"
                    defaultValue={prefill.injuryNotes ?? undefined}
                    placeholder="Example: occasional shoulder tightness after heavy press days."
                  />
                </div>
              </section>

              <div className="flex flex-wrap items-center gap-3">
                <SubmitButton pendingLabel="Saving setup..." className="w-full sm:w-auto">
                  Finish onboarding
                </SubmitButton>
                <p className="text-xs text-muted-foreground">Your profile can be refined later from settings.</p>
              </div>
            </form>

            <aside className="space-y-4 lg:sticky lg:top-6">
              <div className="rounded-3xl border border-(--card-border) bg-(--surface) p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  What this unlocks
                </p>
                <ul className="mt-3 space-y-3 text-sm">
                  <li className="rounded-2xl border border-(--card-border) bg-(--surface-strong) px-3 py-2">
                    <p className="font-semibold">Adaptive training split</p>
                    <p className="mt-1 text-xs text-muted-foreground">Your plan updates around your goal and recovery context.</p>
                  </li>
                  <li className="rounded-2xl border border-(--card-border) bg-(--surface-strong) px-3 py-2">
                    <p className="font-semibold">Macro-aware meal guidance</p>
                    <p className="mt-1 text-xs text-muted-foreground">Diet type and activity level tune your fuel targets.</p>
                  </li>
                  <li className="rounded-2xl border border-(--card-border) bg-(--surface-strong) px-3 py-2">
                    <p className="font-semibold">Smarter AI assistant replies</p>
                    <p className="mt-1 text-xs text-muted-foreground">Context-rich coaching suggestions with less back-and-forth.</p>
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl border border-(--card-border) bg-(--surface) p-5 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Coach note</p>
                <p className="mt-2 leading-6 text-muted-foreground">
                  Choose realistic preferences first. You can always refine your profile after a week of real-world training data.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </Card>
    </div>
  );
}
