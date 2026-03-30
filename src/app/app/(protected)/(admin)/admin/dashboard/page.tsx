import { AnalyticsChart } from "@/components/admin/charts/analytics-chart";
import { StatCard } from "@/components/admin/cards/stat-card";
import { EmptyState } from "@/components/admin/feedback/empty-state";
import { StatusPill } from "@/components/admin/feedback/status-pill";
import { AdminPageHeader } from "@/components/admin/layout/page-header";
import { AppTable } from "@/components/admin/tables/app-table";
import { Card } from "@/components/ui/card";
import { getAdminDashboardData } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Admin Dashboard"
        title="Operational command center"
        subtitle="Track user growth, subscriptions, content velocity, and engagement at a glance with fast, scan-friendly blocks."
      />

      {data.kpis.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.kpis.map((kpi) => (
            <StatCard key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} tone={kpi.tone} />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No dashboard metrics yet"
          description="Run the admin migration and seed initial entities to populate KPI cards, trends, and activity feeds."
        />
      )}

      <AnalyticsChart points={data.trend} />

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="rounded-[30px] p-5 md:p-6">
          <h3 className="text-xl font-bold">Latest user registrations</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Quickly spot onboarding spikes and inactive cohorts.</p>
          <div className="mt-4">
            {data.recentUsers.length > 0 ? (
              <AppTable
                caption="Recent users"
                rows={data.recentUsers}
                columns={[
                  {
                    key: "name",
                    header: "User",
                    render: (row) => (
                      <div>
                        <p className="font-semibold">{row.fullName || row.username}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">@{row.username}</p>
                      </div>
                    ),
                  },
                  {
                    key: "goal",
                    header: "Goal",
                    render: (row) => row.goal || "--",
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (row) => <StatusPill value={row.accountStatus} />,
                  },
                  {
                    key: "joined",
                    header: "Joined",
                    render: (row) => (row.createdAt ? formatDate(row.createdAt) : "--"),
                  },
                ]}
              />
            ) : (
              <EmptyState
                title="No recent users"
                description="User registration events will appear here once new accounts are created."
              />
            )}
          </div>
        </Card>

        <Card className="rounded-[30px] p-5 md:p-6">
          <h3 className="text-xl font-bold">Recent admin activity</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Auditable record of content and billing operations.</p>
          <div className="mt-4">
            {data.recentActivity.length > 0 ? (
              <AppTable
                caption="Recent admin activity"
                rows={data.recentActivity}
                columns={[
                  {
                    key: "action",
                    header: "Action",
                    render: (row) => <span className="font-medium">{row.actionType.replace(/_/g, " ")}</span>,
                  },
                  {
                    key: "entity",
                    header: "Entity",
                    render: (row) => <span className="capitalize">{row.entityType.replace(/_/g, " ")}</span>,
                  },
                  {
                    key: "time",
                    header: "When",
                    render: (row) => formatDate(row.createdAt),
                  },
                ]}
              />
            ) : (
              <EmptyState
                title="No admin activity yet"
                description="Actions like publish/unpublish, edits, and payment overrides will be logged here."
              />
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
