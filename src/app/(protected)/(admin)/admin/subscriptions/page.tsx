import { createPricingPlanAction } from "@/lib/admin/actions";
import { DrawerForm } from "@/components/admin/forms/drawer-form";
import { EmptyState } from "@/components/admin/feedback/empty-state";
import { StatusPill } from "@/components/admin/feedback/status-pill";
import { AdminPageHeader } from "@/components/admin/layout/page-header";
import { AppTable } from "@/components/admin/tables/app-table";
import { TableToolbar } from "@/components/admin/tables/table-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listSubscriptions } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils";

type SubscriptionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSubscriptionsPage({ searchParams }: SubscriptionsPageProps) {
  const query = await searchParams;
  const status = getSingleParam(query.status) as
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "expired"
    | undefined;

  const { rows, count } = await listSubscriptions({
    status,
    pageSize: 20,
  });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Billing"
        title="Subscriptions, plans, and payment oversight"
        subtitle="Monitor subscription health, identify churn risks, and maintain pricing plans for manual or automated assignment."
      />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <TableToolbar withStatusFilter placeholder="Search is currently available on users/content pages" />
          <p className="text-sm text-[var(--muted-foreground)]">{count} subscription records</p>

          {rows.length > 0 ? (
            <AppTable
              caption="Subscriptions table"
              rows={rows}
              columns={[
                {
                  key: "plan",
                  header: "Plan",
                  render: (row) => (
                    <div>
                      <p className="font-semibold">{row.planName}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{row.provider}</p>
                    </div>
                  ),
                },
                {
                  key: "amount",
                  header: "Amount",
                  render: (row) =>
                    row.amount !== null
                      ? new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: row.currency || "INR",
                        }).format(row.amount)
                      : "--",
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <StatusPill value={row.status} />,
                },
                {
                  key: "period",
                  header: "Period End",
                  render: (row) => (row.currentPeriodEnd ? formatDate(row.currentPeriodEnd) : "--"),
                },
              ]}
            />
          ) : (
            <EmptyState
              title="No subscriptions found"
              description="Run checkout/verify flows or seed billing data to activate this module."
            />
          )}
        </div>

        <DrawerForm
          title="Create pricing plan"
          description="Set up your plan catalog for subscription assignment and payment flows."
        >
          <form action={createPricingPlanAction} className="space-y-3">
            <Input name="name" placeholder="Plan name" required />
            <Input name="slug" placeholder="Slug (optional)" />
            <Input name="description" placeholder="Plan description" />
            <Input name="price" placeholder="Price" type="number" min={0} step="0.01" required />
            <div className="grid grid-cols-2 gap-3">
              <Input name="currency" placeholder="INR" defaultValue="INR" maxLength={3} />
              <select
                name="interval"
                className="h-12 rounded-2xl border border-[var(--card-border)] bg-[var(--surface-strong)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]"
                defaultValue="month"
              >
                <option value="month">Monthly</option>
                <option value="quarter">Quarterly</option>
                <option value="year">Yearly</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </div>
            <Input name="trialDays" placeholder="Trial days" type="number" min={0} defaultValue={0} />
            <Button type="submit" className="w-full">
              Save Plan
            </Button>
          </form>
        </DrawerForm>
      </div>
    </div>
  );
}
