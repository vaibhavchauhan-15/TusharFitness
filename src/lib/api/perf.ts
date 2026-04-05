type TimingEntry = {
  name: string;
  durationMs: number;
};

function nowMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function formatServerTiming(entries: TimingEntry[]) {
  return entries
    .map((entry) => `${entry.name};dur=${entry.durationMs.toFixed(1)}`)
    .join(", ");
}

export function createApiTimer(routeName: string) {
  const startedAt = nowMs();
  const entries: TimingEntry[] = [];

  async function measure<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
    const stepStartedAt = nowMs();

    try {
      return await fn();
    } finally {
      entries.push({ name, durationMs: nowMs() - stepStartedAt });
    }
  }

  function finalize<T extends Response>(response: T): T {
    const totalDuration = nowMs() - startedAt;
    const serverTimingEntries = [
      ...entries,
      {
        name: "total",
        durationMs: totalDuration,
      },
    ];

    response.headers.set("Server-Timing", formatServerTiming(serverTimingEntries));
    response.headers.set("X-Route-Name", routeName);

    return response;
  }

  return {
    measure,
    finalize,
  };
}
