import { redirect } from "next/navigation";
import type { SessionUser } from "@/lib/session";
import { getSessionState } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/types/admin";

type AdminAccessRow = {
  role: AdminRole;
  permissions: unknown;
  is_active: boolean;
};

export type AdminSession = {
  user: SessionUser;
  role: AdminRole;
  permissions: string[];
};

function normalizePermissions(rawPermissions: unknown) {
  if (!Array.isArray(rawPermissions)) {
    return [];
  }

  return rawPermissions.filter((permission): permission is string => {
    return typeof permission === "string" && permission.trim().length > 0;
  });
}

export function roleToLabel(role: AdminRole) {
  if (role === "admin") {
    return "Admin";
  }

  return role;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getSessionState();

  if (!session) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("role,permissions,is_active")
    .eq("user_id", session.user.id)
    .maybeSingle<AdminAccessRow>();

  if (error || !data || !data.is_active) {
    return null;
  }

  return {
    user: session.user,
    role: data.role,
    permissions: normalizePermissions(data.permissions),
  };
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/dashboard?admin=forbidden");
  }

  return session;
}
