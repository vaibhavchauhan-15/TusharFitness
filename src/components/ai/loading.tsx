export default function ChatLoading() {
  return (
    <section className="relative h-dvh overflow-hidden p-3 sm:p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.14),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_35%)]"
      />

      <div className="relative mx-auto flex h-full max-w-425 gap-3">
        <aside className="glass-panel hidden h-full w-[320px] shrink-0 rounded-[30px] border border-(--card-border) p-3 md:flex md:flex-col">
          <div className="h-9 w-40 animate-pulse rounded-xl bg-(--surface-strong)" />
          <div className="mt-3 h-11 w-full animate-pulse rounded-xl bg-(--surface-strong)" />

          <div className="mt-4 space-y-2">
            <div className="h-5 w-24 animate-pulse rounded-lg bg-(--surface-strong)" />
            <div className="h-14 w-full animate-pulse rounded-xl bg-(--surface-strong)" />
            <div className="h-14 w-full animate-pulse rounded-xl bg-(--surface-strong)" />
            <div className="h-14 w-full animate-pulse rounded-xl bg-(--surface-strong)" />
          </div>
        </aside>

        <div className="glass-panel flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-(--card-border)">
          <div className="flex h-16 items-center border-b border-(--card-border) px-4 sm:px-5">
            <div className="h-6 w-44 animate-pulse rounded-xl bg-(--surface-strong)" />
          </div>

          <div className="flex-1 space-y-4 px-3 py-5 sm:px-5">
            <div className="flex items-start gap-3">
              <div className="h-7 w-7 animate-pulse rounded-full bg-(--primary-soft)" />
              <div className="w-full max-w-[72%] space-y-2">
                <div className="h-5 w-3/4 animate-pulse rounded-xl bg-(--primary-soft)" />
                <div className="h-5 w-full animate-pulse rounded-xl bg-(--primary-soft)" />
              </div>
            </div>

            <div className="ml-auto flex w-full max-w-[64%] justify-end">
              <div className="w-full space-y-2">
                <div className="h-5 w-full animate-pulse rounded-xl bg-(--surface-strong)" />
                <div className="h-5 w-4/5 animate-pulse rounded-xl bg-(--surface-strong)" />
              </div>
            </div>
          </div>

          <div className="px-3 pb-3 sm:px-5 sm:pb-4">
            <div className="mx-auto h-12 w-full max-w-280 animate-pulse rounded-3xl border border-(--card-border) bg-surface sm:w-[88%] xl:w-[70%]" />
          </div>
        </div>
      </div>
    </section>
  );
}
