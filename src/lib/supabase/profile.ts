import type { SupabaseClient, User } from "@supabase/supabase-js";

const PROFILE_SELECT = [
  "id",
  "username",
  "full_name",
  "avatar_url",
  "age",
  "gender",
  "height_cm",
  "weight_kg",
  "goal",
  "diet_type",
  "activity_level",
  "injury_notes",
  "onboarding_completed",
  "referral_code",
  "created_at",
].join(",");

export type ProfileRecord = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: string | null;
  diet_type: string | null;
  activity_level: string | null;
  injury_notes: string | null;
  onboarding_completed: boolean | null;
  referral_code: string | null;
  created_at: string | null;
};

export function normalizeUsername(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  const sliced = normalized.slice(0, 20);

  if (sliced.length >= 3) {
    return sliced;
  }

  return "fitness_user";
}

function dedupeUsernames(candidates: string[]) {
  return candidates.filter((candidate, index, all) => {
    return candidate.length >= 3 && all.indexOf(candidate) === index;
  });
}

export function getUsernameSuggestions(
  seed: string,
  options?: {
    suffixSeed?: string;
    limit?: number;
  },
) {
  const base = normalizeUsername(seed);
  const cleanedSuffix = (options?.suffixSeed ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const suffix4 = cleanedSuffix.slice(0, 4);
  const suffix8 = cleanedSuffix.slice(0, 8);
  const hash = [...base].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const firstNumber = String((hash % 89) + 11);
  const secondNumber = String(((hash * 7) % 89) + 11);

  const candidates = dedupeUsernames([
    base,
    normalizeUsername(`${base}_fit`),
    normalizeUsername(`${base}_prime`),
    suffix4 ? normalizeUsername(`${base}_${suffix4}`) : "",
    suffix8 ? normalizeUsername(`${base}_${suffix8}`) : "",
    normalizeUsername(`${base}_${firstNumber}`),
    normalizeUsername(`${base}_${secondNumber}`),
  ]);

  const limit = Math.max(1, options?.limit ?? 5);
  return candidates.slice(0, limit);
}

function toUsernameCandidates(base: string, userId: string) {
  return getUsernameSuggestions(base, {
    suffixSeed: userId,
    limit: 3,
  });
}

function toReferralCode(username: string, userId: string) {
  const suffix = userId.replace(/-/g, "").slice(0, 6).toLowerCase();
  return normalizeUsername(`${username}_${suffix}`).slice(0, 32);
}

async function getProfileById(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle<ProfileRecord>();

  if (error) {
    throw error;
  }

  return data;
}

export async function ensureProfileForUser(
  supabase: SupabaseClient,
  user: User,
  options?: {
    username?: string;
    fullName?: string;
    avatarUrl?: string;
  },
) {
  const existingProfile = await getProfileById(supabase, user.id);

  if (existingProfile) {
    return existingProfile;
  }

  const usernameSeed =
    options?.username ??
    (typeof user.user_metadata.preferred_username === "string"
      ? user.user_metadata.preferred_username
      : undefined) ??
    user.email?.split("@")[0] ??
    `user_${user.id.replace(/-/g, "").slice(0, 8)}`;

  const usernameCandidates = toUsernameCandidates(usernameSeed, user.id);

  for (const candidate of usernameCandidates) {
    const insertPayload = {
      id: user.id,
      username: candidate,
      full_name:
        options?.fullName ??
        (typeof user.user_metadata.full_name === "string"
          ? user.user_metadata.full_name
          : null),
      avatar_url:
        options?.avatarUrl ??
        (typeof user.user_metadata.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : null),
      referral_code: toReferralCode(candidate, user.id),
      onboarding_completed: false,
    };

    const { data, error } = await supabase
      .from("profiles")
      .insert(insertPayload)
      .select(PROFILE_SELECT)
      .single<ProfileRecord>();

    if (!error && data) {
      return data;
    }

    if (error?.code !== "23505") {
      throw error;
    }
  }

  return getProfileById(supabase, user.id);
}
