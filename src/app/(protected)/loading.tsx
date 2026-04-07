export default function ProtectedLoading() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-7xl gap-4 px-3 py-4 sm:px-4 lg:grid-cols-[280px_1fr]">
      <aside className="glass-panel hidden animate-pulse rounded-[28px] border border-(--card-border) p-4 lg:block">
        <div className="h-10 w-40 rounded-xl bg-(--surface-strong)" />
        <div className="mt-6 space-y-3">
          <div className="h-11 rounded-xl bg-(--surface-strong)" />
          <div className="h-11 rounded-xl bg-(--surface-strong)" />
          <div className="h-11 rounded-xl bg-(--surface-strong)" />
          <div className="h-11 rounded-xl bg-(--surface-strong)" />
        </div>
      </aside>

      <section className="glass-panel animate-pulse rounded-[28px] border border-(--card-border) p-4 sm:p-5">
        <div className="h-8 w-48 rounded-xl bg-(--surface-strong)" />
        <div className="mt-4 h-28 rounded-2xl bg-(--surface-strong)" />
        <div className="mt-3 h-28 rounded-2xl bg-(--surface-strong)" />
      </section>
    </div>
  );
}
