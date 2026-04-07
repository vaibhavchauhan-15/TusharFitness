import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { isActiveAdminUser } from "@/lib/admin/access";
import { getSessionState } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionState();

  if (!session) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const isAdmin = supabase ? await isActiveAdminUser(supabase, session.user.id) : false;

  if (!session.onboardingCompleted && !isAdmin) {
    redirect("/onboarding");
  }

  if (!session.accessActive) {
    redirect("/signup");
  }

  return (
    <AppShell user={session.user} isAdmin={isAdmin}>
      {children}
    </AppShell>
  );
}
