import { redirect } from "next/navigation";
import { getSessionState } from "@/lib/session";

export default async function AppRootPage() {
  const session = await getSessionState();

  if (!session) {
    redirect("/login");
  }

  if (!session.onboardingCompleted) {
    redirect("/app/onboarding");
  }

  redirect("/app/dashboard");
}
