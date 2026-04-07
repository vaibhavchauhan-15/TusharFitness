import { AdminPageHeader } from "@/components/admin/layout/page-header";
import { AppTable } from "@/components/admin/tables/app-table";
import { Card } from "@/components/ui/card";
import { listAdminActivity } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils";

const roleMatrix = [
  {
    role: "Admin",
    permission: "Full operational access across users, billing, content, analytics, and audit logs.",
  },
] as const;

export default async function AdminSettingsPage() {
  const activity = await listAdminActivity({ pageSize: 20 });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Settings"
        title="Permissions, governance, and safety"
        subtitle="Centralize role boundaries, destructive-action safety, and audit visibility as the team grows."
      />

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="rounded-[30px] p-5 md:p-6">
          <h2 className="text-xl font-bold">Role permission matrix</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Use this as the baseline for access control and keep sensitive flows limited to the smallest valid role.
          </p>
          <div className="mt-4 space-y-2">
            {roleMatrix.map((item) => (
              <div key={item.role} className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface-strong)] p-3">
                <p className="font-semibold">{item.role}</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.permission}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[30px] p-5 md:p-6">
          <h2 className="text-xl font-bold">Security checklist</h2>
          <ul className="mt-4 space-y-2 text-sm leading-7 text-[var(--muted-foreground)]">
            <li>Route protection with role checks in admin layout.</li>
            <li>RLS policies for admin-only tables and mutations.</li>
            <li>Audit log insert on admin actions from server actions.</li>
            <li>Status-based publish/unpublish workflows.</li>
            <li>Explicit destructive confirmations for sensitive operations.</li>
          </ul>
        </Card>
      </section>

      <section>
        <AppTable
          caption="Admin activity log"
          rows={activity.rows}
          columns={[
            {
              key: "action",
              header: "Action",
              render: (row) => row.actionType.replace(/_/g, " "),
            },
            {
              key: "entity",
              header: "Entity",
              render: (row) => row.entityType.replace(/_/g, " "),
            },
            {
              key: "date",
              header: "Date",
              render: (row) => formatDate(row.createdAt),
            },
          ]}
        />
      </section>
    </div>
  );
}
