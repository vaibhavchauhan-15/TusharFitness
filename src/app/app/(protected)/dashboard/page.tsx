import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getDashboardState } from "@/lib/session";

export default async function DashboardPage() {
  const state = await getDashboardState();

  if (!state) {
    return null;
  }

  return (
    <DashboardOverview
      user={state.session.user}
      snapshot={state.dashboardSnapshot}
      activityOverview={state.activityOverview}
      progressData={state.progressData}
    />
  );
}
