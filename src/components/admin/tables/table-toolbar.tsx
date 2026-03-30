import { Input } from "@/components/ui/input";

export function TableToolbar({
  defaultSearch,
  placeholder,
  withStatusFilter = true,
}: {
  defaultSearch?: string;
  placeholder: string;
  withStatusFilter?: boolean;
}) {
  return (
    <form className="grid gap-3 rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-strong)] p-3 md:grid-cols-[1fr_220px_auto]">
      <Input defaultValue={defaultSearch ?? ""} name="search" placeholder={placeholder} className="h-11" />
      {withStatusFilter ? (
        <select
          name="status"
          defaultValue=""
          className="h-11 rounded-2xl border border-[var(--card-border)] bg-[var(--background)] px-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="invited">Invited</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
          <option value="trialing">Trialing</option>
          <option value="past_due">Past Due</option>
          <option value="canceled">Canceled</option>
          <option value="expired">Expired</option>
        </select>
      ) : (
        <div />
      )}
      <button
        type="submit"
        className="h-11 rounded-2xl bg-[var(--foreground)] px-5 text-sm font-semibold text-[var(--background)] transition hover:opacity-90"
      >
        Apply filters
      </button>
    </form>
  );
}
