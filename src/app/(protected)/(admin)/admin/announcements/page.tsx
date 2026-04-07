import { createAnnouncementAction } from "@/lib/admin/actions";
import { DrawerForm } from "@/components/admin/forms/drawer-form";
import { EmptyState } from "@/components/admin/feedback/empty-state";
import { StatusPill } from "@/components/admin/feedback/status-pill";
import { AdminPageHeader } from "@/components/admin/layout/page-header";
import { AppTable } from "@/components/admin/tables/app-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listAnnouncements } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils";

export default async function AdminAnnouncementsPage() {
  const { rows, count } = await listAnnouncements({ pageSize: 24 });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Communications"
        title="Announcements and broadcast content"
        subtitle="Draft and publish update messages with clear status control and target audience metadata."
      />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted-foreground)]">{count} announcements</p>

          {rows.length > 0 ? (
            <AppTable
              caption="Announcements table"
              rows={rows}
              columns={[
                {
                  key: "title",
                  header: "Title",
                  render: (row) => (
                    <div>
                      <p className="font-semibold">{row.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">/{row.slug}</p>
                    </div>
                  ),
                },
                {
                  key: "audience",
                  header: "Audience",
                  render: (row) => row.targetAudience,
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <StatusPill value={row.status} />,
                },
                {
                  key: "published",
                  header: "Published",
                  render: (row) => (row.publishedAt ? formatDate(row.publishedAt) : "--"),
                },
              ]}
            />
          ) : (
            <EmptyState
              title="No announcements yet"
              description="Create your first communication post to activate this module."
            />
          )}
        </div>

        <DrawerForm
          title="Create announcement"
          description="Draft now and publish when the message is ready for users."
        >
          <form action={createAnnouncementAction} className="space-y-3">
            <Input name="title" placeholder="Title" required />
            <Input name="slug" placeholder="Slug (optional)" />
            <Input name="excerpt" placeholder="Short excerpt" />
            <Input name="targetAudience" placeholder="Target audience" defaultValue="all" />
            <Textarea name="body" placeholder="Announcement body" required />
            <select
              name="status"
              className="h-12 w-full rounded-2xl border border-[var(--card-border)] bg-[var(--surface-strong)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]"
              defaultValue="draft"
            >
              <option value="draft">Save as draft</option>
              <option value="published">Publish now</option>
            </select>
            <Button type="submit" className="w-full">
              Save Announcement
            </Button>
          </form>
        </DrawerForm>
      </div>
    </div>
  );
}
