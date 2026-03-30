import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildWorkoutCatalogSlice,
  getWorkoutCatalogForAuthenticatedClient,
  resolvePreferredWorkoutGoalSlug,
} from "@/lib/supabase/workouts";

export const runtime = "nodejs";

function normalizeSlug(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  return /^[a-z0-9-]{2,96}$/.test(normalized) ? normalized : null;
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      {
        error: "Supabase is not configured.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const url = new URL(request.url);
  const goalSlug = normalizeSlug(url.searchParams.get("goalSlug"));
  const bodyPartSlug = normalizeSlug(url.searchParams.get("bodyPartSlug"));
  const exerciseSlug = normalizeSlug(url.searchParams.get("exerciseSlug"));

  const { data: profile } = await supabase
    .from("profiles")
    .select("goal")
    .eq("id", user.id)
    .maybeSingle<{ goal: string | null }>();

  const catalog = await getWorkoutCatalogForAuthenticatedClient(supabase);
  const fallbackGoalSlug = resolvePreferredWorkoutGoalSlug(profile?.goal ?? null, catalog.goals);
  const slice = buildWorkoutCatalogSlice(
    catalog,
    goalSlug,
    bodyPartSlug,
    exerciseSlug,
    fallbackGoalSlug,
  );

  return NextResponse.json(
    {
      goals: slice.goals,
      bodyParts: slice.bodyParts,
      exercises: slice.exercises,
      selectedGoalSlug: slice.selectedGoalSlug,
      selectedBodyPartSlug: slice.selectedBodyPartSlug,
      selectedExercise: slice.selectedExercise,
      totalGoals: slice.goals.length,
      totalBodyParts: slice.bodyParts.length,
      totalExercises: slice.exercises.length,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
