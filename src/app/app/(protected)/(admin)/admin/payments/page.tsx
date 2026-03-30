import { EmptyState } from "@/components/admin/feedback/empty-state";
import { StatusPill } from "@/components/admin/feedback/status-pill";
import { AdminPageHeader } from "@/components/admin/layout/page-header";
import { AppTable } from "@/components/admin/tables/app-table";
import { TableToolbar } from "@/components/admin/tables/table-toolbar";
import { listPayments } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils";

type PaymentsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPaymentsPage({ searchParams }: PaymentsPageProps) {
  const query = await searchParams;
  const status = getSingleParam(query.status) as
    | "pending"
    | "captured"
    | "failed"
    | "refunded"
    | "canceled"
    | undefined;

  const { rows, count } = await listPayments({
    status,
    pageSize: 20,
  });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Payments"
        title="Payment operations"
        subtitle="Track payment states, failed attempts, and refund visibility without leaving the admin workspace."
      />

      <TableToolbar withStatusFilter placeholder="Search is currently available in user/content modules" />
      <p className="text-sm text-[var(--muted-foreground)]">{count} payments</p>

      {rows.length > 0 ? (
        <AppTable
          caption="Payments table"
          rows={rows}
          columns={[
            {
              key: "provider",
              header: "Provider",
              render: (row) => row.provider,
            },
            {
              key: "amount",
              header: "Amount",
              render: (row) =>
                new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: row.currency,
                }).format(row.amount),
            },
            {
              key: "status",
              header: "Status",
              render: (row) => <StatusPill value={row.status} />,
            },
            {
              key: "paid",
              header: "Paid At",
              render: (row) => (row.paidAt ? formatDate(row.paidAt) : "--"),
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
          title="No payments found"
          description="Once billing transactions are recorded, this table will show captured, failed, and refunded payments."
        />
      )}
    </div>
  );
}
