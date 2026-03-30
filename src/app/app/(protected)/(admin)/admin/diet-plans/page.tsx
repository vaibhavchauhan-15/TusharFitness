import { createDietPlanAction, setDietPlanStatusAction } from "@/lib/admin/actions";
import { DrawerForm } from "@/components/admin/forms/drawer-form";
import { EmptyState } from "@/components/admin/feedback/empty-state";
import { StatusPill } from "@/components/admin/feedback/status-pill";
import { AdminPageHeader } from "@/components/admin/layout/page-header";
import { AppTable } from "@/components/admin/tables/app-table";
import { TableToolbar } from "@/components/admin/tables/table-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listDietPlans } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils";

type DietPlansPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminDietPlansPage({ searchParams }: DietPlansPageProps) {
  const query = await searchParams;
  const search = getSingleParam(query.search) ?? "";
  const status = getSingleParam(query.status) as "draft" | "published" | "archived" | undefined;

  const { rows, count } = await listDietPlans({
    search,
    status,
    pageSize: 20,
  });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Diet CMS"
        title="Diet plans with publish workflow"
        subtitle="Create structured plans, manage draft and publish states, and keep assignment-ready content organized."
      />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <TableToolbar defaultSearch={search} placeholder="Search plans by title or slug" />
          <p className="text-sm text-[var(--muted-foreground)]">{count} diet plans</p>

          {rows.length > 0 ? (
            <AppTable
              caption="Diet plans table"
              rows={rows}
              columns={[
                {
                  key: "title",
                  header: "Plan",
                  render: (row) => (
                    <div>
                      <p className="font-semibold">{row.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">/{row.slug || "missing-slug"}</p>
                    </div>
                  ),
                },
                {
                  key: "focus",
                  header: "Goal / Preference",
                  render: (row) => (
                    <div>
                      <p>{row.goalType || "--"}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{row.dietaryPreference || "--"}</p>
                    </div>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <StatusPill value={row.status} />,
                },
                {
                  key: "updated",
                  header: "Updated",
                  render: (row) => (row.createdAt ? formatDate(row.createdAt) : "--"),
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (row) => (
                    <div className="flex flex-wrap gap-2">
                      {row.status !== "published" ? (
                        <form action={setDietPlanStatusAction.bind(null, row.id, "published")}>
                          <Button type="submit" size="sm" variant="outline">
                            Publish
                          </Button>
                        </form>
                      ) : null}
                      {row.status !== "draft" ? (
                        <form action={setDietPlanStatusAction.bind(null, row.id, "draft")}>
                          <Button type="submit" size="sm" variant="outline">
                            Draft
                          </Button>
                        </form>
                      ) : null}
                      {row.status !== "archived" ? (
                        <form action={setDietPlanStatusAction.bind(null, row.id, "archived")}>
                          <Button type="submit" size="sm" variant="outline">
                            Archive
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
              title="No diet plans yet"
              description="Create your first plan in the form panel to start building publish-ready nutrition content."
            />
          )}
        </div>

        <DrawerForm
          title="Create diet plan"
          description="Quick-create a draft or publish immediately. Structured meals can be expanded in the next iteration."
        >
          <form action={createDietPlanAction} className="space-y-3">
            <Input name="title" placeholder="Plan title" required />
            <Input name="slug" placeholder="Slug (optional)" />
            <Input name="goalType" placeholder="Goal type (fat-loss, muscle-gain...)" />
            <Input name="dietaryPreference" placeholder="Diet preference (veg, keto...)" />
            <Input name="difficulty" placeholder="Difficulty (beginner, intermediate...)" />
            <Textarea name="description" placeholder="Description / coach notes" />
            <select
              name="status"
              className="h-11 w-full rounded-2xl border border-[var(--card-border)] bg-[var(--surface-strong)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]"
              defaultValue="draft"
            >
              <option value="draft">Save as draft</option>
              <option value="published">Publish now</option>
            </select>
            <Button type="submit" className="w-full">
              Save Plan
            </Button>
          </form>
        </DrawerForm>
      </div>
    </div>
  );
}
