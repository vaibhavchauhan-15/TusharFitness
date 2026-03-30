import { NextResponse } from "next/server";
import { getLevelFromXp } from "@/lib/gamification";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const REFERRAL_TRIAL_DAYS = 3;
const REFERRAL_XP = 60;

function addDays(baseDate: Date, days: number) {
  return new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
}

async function awardXpForUser(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  userId: string,
  delta: number,
) {
  const { data: existingState } = await supabase
    .from("gamification_state")
    .select("streak, xp")
    .eq("user_id", userId)
    .maybeSingle<{ streak: number; xp: number }>();

  const nextXp = (existingState?.xp ?? 0) + delta;
  const level = getLevelFromXp(nextXp);

  await supabase.from("gamification_state").upsert(
    {
      user_id: userId,
      streak: existingState?.streak ?? 0,
      xp: nextXp,
      level: level.level,
      badge: level.badge,
      title: level.title,
    },
    { onConflict: "user_id" },
  );
}

async function extendSubscriptionForUser(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  userId: string,
  trialDays: number,
) {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, status, trial_end_at, current_period_end")
    .eq("user_id", userId)
    .in("status", ["trialing", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      id: string;
      status: "trialing" | "active";
      trial_end_at: string | null;
      current_period_end: string | null;
    }>();

  if (!subscription) {
    return;
  }

  const now = new Date();
  const trialEndsAt = subscription.trial_end_at ? new Date(subscription.trial_end_at) : null;
  const periodEndsAt = subscription.current_period_end
    ? new Date(subscription.current_period_end)
    : null;

  const baseDate = trialEndsAt && trialEndsAt > now
    ? trialEndsAt
    : periodEndsAt && periodEndsAt > now
      ? periodEndsAt
      : now;

  const extended = addDays(baseDate, trialDays).toISOString();

  if (subscription.status === "trialing") {
    await supabase
      .from("subscriptions")
      .update({ trial_end_at: extended })
      .eq("id", subscription.id);
    return;
  }

  await supabase
    .from("subscriptions")
    .update({ current_period_end: extended })
    .eq("id", subscription.id);
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { referralCode } = (await request.json()) as { referralCode?: string };
  const normalizedCode = referralCode?.trim().toLowerCase();

  if (!normalizedCode) {
    return NextResponse.json({ error: "Referral code is required." }, { status: 400 });
  }

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from("profiles")
    .select("id, referral_code")
    .eq("id", user.id)
    .maybeSingle<{ id: string; referral_code: string | null }>();

  if (currentProfileError || !currentProfile) {
    return NextResponse.json(
      { error: "Profile not found for current user." },
      { status: 404 },
    );
  }

  if (currentProfile.referral_code === normalizedCode) {
    return NextResponse.json(
      { success: false, message: "You cannot redeem your own referral code." },
      { status: 400 },
    );
  }

  const { data: inviterProfile, error: inviterError } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_code", normalizedCode)
    .maybeSingle<{ id: string }>();

  if (inviterError || !inviterProfile) {
    return NextResponse.json(
      { success: false, message: "Referral code not found." },
      { status: 404 },
    );
  }

  const { data: existingReferral } = await supabase
    .from("referrals")
    .select("id")
    .eq("invited_user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (existingReferral?.id) {
    return NextResponse.json(
      { success: false, message: "Referral already redeemed for this account." },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();

  const { error: insertError } = await supabase.from("referrals").insert({
    inviter_user_id: inviterProfile.id,
    invited_user_id: user.id,
    referral_code: normalizedCode,
    reward_status: "rewarded",
    awarded_trial_days: REFERRAL_TRIAL_DAYS,
    awarded_xp: REFERRAL_XP,
    eligible_at: now,
    rewarded_at: now,
  });

  if (insertError) {
    return NextResponse.json(
      { success: false, message: "Could not redeem referral code." },
      { status: 500 },
    );
  }

  await Promise.all([
    awardXpForUser(supabase, inviterProfile.id, REFERRAL_XP),
    awardXpForUser(supabase, user.id, REFERRAL_XP),
    extendSubscriptionForUser(supabase, inviterProfile.id, REFERRAL_TRIAL_DAYS),
    extendSubscriptionForUser(supabase, user.id, REFERRAL_TRIAL_DAYS),
  ]);

  return NextResponse.json({
    success: true,
    message: "Referral applied. Both users earned bonus XP and trial extension.",
  });

}
