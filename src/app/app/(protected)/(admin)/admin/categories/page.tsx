import { createCategoryAction } from "@/lib/admin/actions";
import { DrawerForm } from "@/components/admin/forms/drawer-form";
import { EmptyState } from "@/components/admin/feedback/empty-state";
import { StatusPill } from "@/components/admin/feedback/status-pill";
import { AdminPageHeader } from "@/components/admin/layout/page-header";
import { AppTable } from "@/components/admin/tables/app-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listCategories } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils";

export default async function AdminCategoriesPage() {
  const { rows, count } = await listCategories({ pageSize: 24 });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Taxonomy"
        title="Categories and classification"
        subtitle="Maintain shared categories for workouts, nutrition, media, and content modules."
      />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted-foreground)]">{count} categories</p>
          {rows.length > 0 ? (
            <AppTable
              caption="Categories table"
              rows={rows}
              columns={[
                {
                  key: "name",
                  header: "Category",
                  render: (row) => (
                    <div>
                      <p className="font-semibold">{row.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">/{row.slug}</p>
                    </div>
                  ),
                },
                {
                  key: "type",
                  header: "Type",
                  render: (row) => row.type,
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <StatusPill value={row.status} />,
                },
                {
                  key: "created",
                  header: "Created",
                  render: (row) => formatDate(row.createdAt),
                },
              ]}
            />
          ) : (
            <EmptyState
              title="No categories yet"
              description="Create the first taxonomy item to standardize content across modules."
            />
          )}
        </div>

        <DrawerForm
          title="Create category"
          description="Use consistent slugs to power filter bars and assignment logic across modules."
        >
          <form action={createCategoryAction} className="space-y-3">
            <Input name="name" placeholder="Category name" required />
            <Input name="slug" placeholder="Slug (optional)" />
            <select
              name="type"
              className="h-12 w-full rounded-2xl border border-[var(--card-border)] bg-[var(--surface-strong)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]"
              defaultValue="general"
            >
              <option value="general">General</option>
              <option value="diet">Diet</option>
              <option value="workout">Workout</option>
              <option value="content">Content</option>
              <option value="media">Media</option>
            </select>
            <Input name="description" placeholder="Description" />
            <Button type="submit" className="w-full">
              Save Category
            </Button>
          </form>
        </DrawerForm>
      </div>
    </div>
  );
}
