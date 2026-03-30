import { EmptyState } from "@/components/admin/feedback/empty-state";
import { StatusPill } from "@/components/admin/feedback/status-pill";
import { AdminPageHeader } from "@/components/admin/layout/page-header";
import { AppTable } from "@/components/admin/tables/app-table";
import { listMediaFiles } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils";

export default async function AdminMediaPage() {
  const { rows, count } = await listMediaFiles({ pageSize: 24 });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Media Manager"
        title="Centralized media library"
        subtitle="Track reusable files for diet plans, workouts, and content assets with type and recency visibility."
      />

      <p className="text-sm text-[var(--muted-foreground)]">{count} media files</p>

      {rows.length > 0 ? (
        <AppTable
          caption="Media files table"
          rows={rows}
          columns={[
            {
              key: "file",
              header: "File",
              render: (row) => (
                <div>
                  <p className="font-semibold">{row.fileName}</p>
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[var(--primary)] underline-offset-2 hover:underline"
                  >
                    Open asset
                  </a>
                </div>
              ),
            },
            {
              key: "type",
              header: "Type",
              render: (row) => <StatusPill value={row.fileType} />,
            },
            {
              key: "size",
              header: "Size",
              render: (row) =>
                row.sizeBytes !== null ? `${(row.sizeBytes / (1024 * 1024)).toFixed(2)} MB` : "--",
            },
            {
              key: "created",
              header: "Uploaded",
              render: (row) => formatDate(row.createdAt),
            },
          ]}
        />
      ) : (
        <EmptyState
          title="No media uploaded"
          description="Upload files to Supabase Storage and insert metadata into media_files to activate this view."
        />
      )}
    </div>
  );
}
