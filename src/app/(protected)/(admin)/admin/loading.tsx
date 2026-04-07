export default function AdminLoading() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-420 gap-4 px-3 py-3 md:px-4 lg:grid-cols-[300px_1fr]">
      <aside className="glass-panel hidden animate-pulse rounded-[28px] border border-(--card-border) p-4 lg:block">
        <div className="h-10 w-44 rounded-xl bg-(--surface-strong)" />
        <div className="mt-6 space-y-2.5">
          <div className="h-11 rounded-xl bg-(--surface-strong)" />
          <div className="h-11 rounded-xl bg-(--surface-strong)" />
          <div className="h-11 rounded-xl bg-(--surface-strong)" />
          <div className="h-11 rounded-xl bg-(--surface-strong)" />
          <div className="h-11 rounded-xl bg-(--surface-strong)" />
        </div>
      </aside>

      <section className="space-y-4">
        <div className="glass-panel h-20 animate-pulse rounded-3xl border border-(--card-border)" />
        <div className="glass-panel h-60 animate-pulse rounded-3xl border border-(--card-border)" />
      </section>
    </div>
  );
}
