import { setUserAccountStatusAction } from "@/lib/admin/actions";
import { AdminPageHeader } from "@/components/admin/layout/page-header";
import { TableToolbar } from "@/components/admin/tables/table-toolbar";
import { AppTable } from "@/components/admin/tables/app-table";
import { StatusPill } from "@/components/admin/feedback/status-pill";
import { EmptyState } from "@/components/admin/feedback/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listAdminUsers } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils";

type UsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const query = await searchParams;
  const search = getSingleParam(query.search) ?? "";
  const status = getSingleParam(query.status) as "active" | "suspended" | "invited" | undefined;

  const { rows, count } = await listAdminUsers({
    search,
    status,
    pageSize: 20,
  });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="User Management"
        title="Users, access, and lifecycle control"
        subtitle="Search, filter, and moderate accounts while tracking assignments, onboarding health, and account state."
      />

      <Card className="rounded-[30px] p-4 md:p-5">
        <TableToolbar defaultSearch={search} placeholder="Search by username or full name" />
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">{count} user records found</p>
      </Card>

      {rows.length > 0 ? (
        <AppTable
          caption="Users table"
          rows={rows}
          columns={[
            {
              key: "user",
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
              header: "Goal / Diet",
              render: (row) => (
                <div className="text-sm">
                  <p>{row.goal || "--"}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{row.dietType || "--"}</p>
                </div>
              ),
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
            {
              key: "actions",
              header: "Actions",
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  {row.accountStatus !== "active" ? (
                    <form action={setUserAccountStatusAction.bind(null, row.id, "active")}>
                      <Button type="submit" variant="outline" size="sm">
                        Activate
                      </Button>
                    </form>
                  ) : null}
                  {row.accountStatus !== "suspended" ? (
                    <form action={setUserAccountStatusAction.bind(null, row.id, "suspended")}>
                      <Button type="submit" variant="outline" size="sm">
                        Suspend
                      </Button>
                    </form>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      ) : (
        <EmptyState
          title="No users match your filters"
          description="Try a broader search query or clear status filters to display more accounts."
        />
      )}
    </div>
  );
}
