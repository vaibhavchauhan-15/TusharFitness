import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/layout/page-header";
import { AppTable } from "@/components/admin/tables/app-table";
import { ProfileOverview } from "@/components/profile/profile-overview";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listAdminActivity } from "@/lib/admin/queries";
import { requireAdminSession, roleToLabel } from "@/lib/admin/permissions";
import { formatDate } from "@/lib/utils";

export default async function AdminProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const admin = await requireAdminSession();

  if (admin.user.username !== username) {
    notFound();
  }

  const activity = await listAdminActivity({ pageSize: 10 });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Admin Profile"
        title="Admin identity and operational context"
        subtitle="This profile blends your personal account data with role-level admin access details so you can operate both modes from one place."
        actions={[
          { label: "Main Website", href: "/dashboard" },
          { label: "Admin Settings", href: "/admin/settings" },
        ]}
      />

      <section className="grid gap-5 xl:grid-cols-3">
        <Card className="rounded-[30px] p-5 md:p-6 xl:col-span-2">
          <h2 className="text-xl font-bold">Admin capabilities</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your current access role and permissions available in the admin workspace.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge>{roleToLabel(admin.role)}</Badge>
            <Badge className="bg-(--surface-strong) text-foreground">@{admin.user.username}</Badge>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(admin.permissions.length > 0 ? admin.permissions : ["full_access"]).map((permission) => (
              <span
                key={permission}
                className="rounded-full border border-(--card-border) bg-(--surface-strong) px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"
              >
                {permission.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </Card>

        <Card className="rounded-[30px] p-5 md:p-6">
          <h2 className="text-xl font-bold">Quick mode switch</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Move between user-facing app experience and admin operations.
          </p>

          <div className="mt-4 space-y-2">
            <Link
              href="/dashboard"
              className="block rounded-2xl border border-(--card-border) bg-(--surface-strong) px-4 py-3 text-sm font-medium transition hover:bg-(--primary-soft)"
            >
              Open Main Website
            </Link>
            <Link
              href="/admin/dashboard"
              className="block rounded-2xl border border-(--card-border) bg-(--surface-strong) px-4 py-3 text-sm font-medium transition hover:bg-(--primary-soft)"
            >
              Open Admin Page
            </Link>
          </div>
        </Card>
      </section>

      <ProfileOverview user={admin.user} />

      <section>
        <AppTable
          caption="Recent admin actions"
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
