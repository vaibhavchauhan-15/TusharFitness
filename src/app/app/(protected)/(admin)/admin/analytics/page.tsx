import { AnalyticsChart } from "@/components/admin/charts/analytics-chart";
import { StatCard } from "@/components/admin/cards/stat-card";
import { EmptyState } from "@/components/admin/feedback/empty-state";
import { AdminPageHeader } from "@/components/admin/layout/page-header";
import { AppTable } from "@/components/admin/tables/app-table";
import { getAdminDashboardData } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils";

export default async function AdminAnalyticsPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Growth and performance insights"
        subtitle="Focus on key trends only: user growth, active subscriptions, and monetization signals without chart overload."
      />

      {data.kpis.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.kpis.slice(0, 6).map((kpi) => (
            <StatCard key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} tone={kpi.tone} />
          ))}
        </section>
      ) : null}

      {data.trend.length > 0 ? (
        <AnalyticsChart points={data.trend} />
      ) : (
        <EmptyState
          title="No analytics trend data"
          description="Create users, subscriptions, and payments to visualize trends here."
        />
      )}

      <section>
        {data.latestUploads.length > 0 ? (
          <AppTable
            caption="Latest media uploads"
            rows={data.latestUploads}
            columns={[
              {
                key: "file",
                header: "File",
                render: (row) => row.fileName,
              },
              {
                key: "type",
                header: "Type",
                render: (row) => row.fileType,
              },
              {
                key: "date",
                header: "Uploaded",
                render: (row) => formatDate(row.createdAt),
              },
            ]}
          />
        ) : null}
      </section>
    </div>
  );
}
