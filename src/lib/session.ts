import { getLevelFromXp } from "@/lib/gamification";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProfileForUser } from "@/lib/supabase/profile";

export type DashboardSnapshot = {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  todayWorkout: {
    title: string;
    description: string;
    duration: string;
    exercises: { name: string; sets: string; reps: string }[];
  } | null;
  todayDiet: {
    title: string;
    category: string;
    meals: { time: string; meal: string; items: string[] }[];
  } | null;
};

export type DashboardActivityItem = {
  label: string;
  value: string;
};

export type DashboardProgressPoint = {
  month: string;
  bodyWeight: number;
  weightLifted: number;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar: string | null;
  age: number | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: string | null;
  dietType: string | null;
  activityLevel: string | null;
  injuryNotes: string | null;
  streak: number;
  xp: number;
  referrals: number;
  referralCode: string | null;
  memberSince: string | null;
  provider: "supabase";
  level: number;
  title: string;
  badge: string;
  progress: number;
};

export type SessionState = {
  authenticated: boolean;
  onboardingCompleted: boolean;
  accessActive: boolean;
  user: SessionUser;
};

type WorkoutRow = {
  title: string;
  sets: string | null;
  reps: string | null;
  goal: string | null;
};

type DietRow = {
  title: string;
  category: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  diet_meals:
    | {
        meal_name: string;
        meal_time: string | null;
        items: unknown;
      }[]
    | null;
};

function toNumberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function toDisplayName(rawName: string | null, email: string | null) {
  if (rawName && rawName.trim().length > 0) {
    return rawName.trim();
  }

  if (email && email.includes("@")) {
    return email.split("@")[0] ?? "Athlete";
  }

  return "Athlete";
}

function toStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toWorkoutGoalSlug(value: string | null) {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (!normalized) {
    return null;
  }

  switch (normalized) {
    case "muscle gain":
      return "muscle-gain";
    case "fat loss":
      return "fat-loss";
    case "muscle-gain":
    case "fat-loss":
    case "strength":
    case "endurance":
      return normalized;
    default:
      return null;
  }
}

export async function getSessionState(): Promise<SessionState | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profile = await ensureProfileForUser(supabase, user);

  const { data: gamificationState } = await supabase
    .from("gamification_state")
    .select("streak, xp, level, badge, title")
    .eq("user_id", user.id)
    .maybeSingle<{
      streak: number;
      xp: number;
      level: number;
      badge: string;
      title: string;
    }>();

  const { data: activeSubscription } = await supabase
    .from("subscriptions")
    .select("status, trial_end_at, current_period_end")
    .eq("user_id", user.id)
    .in("status", ["trialing", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      status: "trialing" | "active" | "past_due" | "canceled" | "expired";
      trial_end_at: string | null;
      current_period_end: string | null;
    }>();

  const { count: rewardedReferralsCount } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("inviter_user_id", user.id)
    .eq("reward_status", "rewarded");

  const xp = gamificationState?.xp ?? 0;
  const level = getLevelFromXp(xp);

  const now = Date.now();
  const trialEndsAt = activeSubscription?.trial_end_at
    ? new Date(activeSubscription.trial_end_at).getTime()
    : null;
  const paidEndsAt = activeSubscription?.current_period_end
    ? new Date(activeSubscription.current_period_end).getTime()
    : null;
  const profileTrialEnd = profile?.created_at
    ? new Date(profile.created_at).getTime() + 7 * 24 * 60 * 60 * 1000
    : now;

  const accessActive = activeSubscription
    ? activeSubscription.status === "active"
      ? paidEndsAt ? paidEndsAt > now : true
      : trialEndsAt
        ? trialEndsAt > now
        : true
    : profileTrialEnd > now;

  return {
    authenticated: true,
    onboardingCompleted: Boolean(profile?.onboarding_completed),
    accessActive,
    user: {
      id: user.id,
      name: toDisplayName(
        profile?.full_name ??
          (typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : null),
        user.email ?? null,
      ),
      email: user.email ?? "",
      username: profile?.username ?? "",
      avatar:
        profile?.avatar_url ??
        (typeof user.user_metadata.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : null),
      age: toNumberOrNull(profile?.age),
      gender: profile?.gender ?? null,
      heightCm: toNumberOrNull(profile?.height_cm),
      weightKg: toNumberOrNull(profile?.weight_kg),
      goal: profile?.goal ?? null,
      dietType: profile?.diet_type ?? null,
      activityLevel: profile?.activity_level ?? null,
      injuryNotes: profile?.injury_notes ?? null,
      referralCode: profile?.referral_code ?? null,
      referrals: rewardedReferralsCount ?? 0,
      memberSince: profile?.created_at ?? null,
      streak: gamificationState?.streak ?? 0,
      xp,
      provider: "supabase",
      level: gamificationState?.level ?? level.level,
      title: gamificationState?.title ?? level.title,
      badge: gamificationState?.badge ?? level.badge,
      progress: level.progress,
    },
  };
}

export async function getDashboardState() {
  const session = await getSessionState();
  const supabase = await createSupabaseServerClient();

  if (!session || !supabase) {
    return null;
  }

  const userId = session.user.id;
  const goal = session.user.goal;
  const dietType = session.user.dietType;

  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: completedWorkouts }, { count: completedDietsLastWeek }, { count: aiThreads }] =
    await Promise.all([
      supabase
        .from("workout_completions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("diet_completions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("completed_at", last7Days),
      supabase
        .from("ai_chat_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

  const workoutQuery = supabase
    .from("workout_exercises")
    .select("title,sets,reps,goal")
    .limit(1);

  const dietQuery = supabase
    .from("diet_plans")
    .select("title,category,calories,protein,carbs,fats,diet_meals(meal_name,meal_time,items)")
    .limit(1);

  const workoutGoalSlug = toWorkoutGoalSlug(goal);

  const [workoutResult, dietResult, weightLogResult, strengthLogResult] = await Promise.all([
    workoutGoalSlug
      ? workoutQuery.eq("goal", workoutGoalSlug).returns<WorkoutRow[]>()
      : workoutQuery.returns<WorkoutRow[]>(),
    dietType
      ? dietQuery.eq("category", dietType).returns<DietRow[]>()
      : dietQuery.returns<DietRow[]>(),
    supabase
      .from("weight_logs")
      .select("value_kg, logged_at")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(12)
      .returns<Array<{ value_kg: number; logged_at: string }>>(),
    supabase
      .from("strength_logs")
      .select("value_kg, logged_at")
      .eq("user_id", userId)
      .order("logged_at", { ascending: true })
      .returns<Array<{ value_kg: number; logged_at: string }>>(),
  ]);

  const workoutRow = workoutResult.data?.[0] ?? null;
  const dietRow = dietResult.data?.[0] ?? null;

  const monthStrength = new Map<string, number>();
  (strengthLogResult.data ?? []).forEach((entry) => {
    const date = new Date(entry.logged_at);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    monthStrength.set(key, (monthStrength.get(key) ?? 0) + Number(entry.value_kg));
  });

  const progressData = [...(weightLogResult.data ?? [])]
    .reverse()
    .map((entry) => {
      const date = new Date(entry.logged_at);
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

      return {
        month: date.toLocaleString("en-IN", { month: "short" }),
        bodyWeight: Number(entry.value_kg),
        weightLifted: Math.round(monthStrength.get(key) ?? 0),
      };
    });

  const adherenceRatio = Math.min(completedDietsLastWeek ?? 0, 7) / 7;

  const activityOverview: DashboardActivityItem[] = [
    { label: "Completed workouts", value: String(completedWorkouts ?? 0) },
    { label: "Diet adherence", value: `${Math.round(adherenceRatio * 100)}%` },
    { label: "Referral wins", value: String(session.user.referrals) },
    { label: "AI guidance threads", value: String(aiThreads ?? 0) },
  ];

  const dashboardSnapshot: DashboardSnapshot = {
    calories: dietRow?.calories ?? null,
    protein: dietRow?.protein ?? null,
    carbs: dietRow?.carbs ?? null,
    fats: dietRow?.fats ?? null,
    todayWorkout: workoutRow
      ? {
          title: workoutRow.title,
          description: "",
          duration: "",
          exercises: [
            {
              name: workoutRow.title,
              sets: workoutRow.sets ?? "",
              reps: workoutRow.reps ?? "",
            },
          ],
        }
      : null,
    todayDiet: dietRow
      ? {
          title: dietRow.title,
          category: dietRow.category,
          meals: (dietRow.diet_meals ?? []).map((meal) => ({
            time: meal.meal_time ?? "",
            meal: meal.meal_name,
            items: toStringList(meal.items),
          })),
        }
      : null,
  };

  return {
    session,
    dashboardSnapshot,
    activityOverview,
    progressData,
  };
}
