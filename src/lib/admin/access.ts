import type { SupabaseClient } from "@supabase/supabase-js";

type AdminAccessLookupRow = {
  user_id: string;
};

export async function isActiveAdminUser(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle<AdminAccessLookupRow>();

  if (error) {
    return false;
  }

  return Boolean(data);
}