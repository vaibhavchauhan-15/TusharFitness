type SupportedWindowUnit = "ms" | "s" | "m" | "h" | "d";

type RateLimitWindow = `${number} ${SupportedWindowUnit}`;

type EnforceRateLimitOptions = {
  namespace: string;
  key: string;
  limit: number;
  window: RateLimitWindow;
};

type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
};

type InMemoryBucket = {
  count: number;
  reset: number;
};

const WINDOW_UNIT_TO_MS: Record<SupportedWindowUnit, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

const DEFAULT_WINDOW_MS = 60_000;
const CLEANUP_EVERY_N_WRITES = 200;

function parseWindowToMs(windowValue: string) {
  const normalized = String(windowValue).trim().toLowerCase();
  const match = normalized.match(/^(\d+)\s*(ms|s|m|h|d)$/);

  if (!match) {
    return DEFAULT_WINDOW_MS;
  }

  const amount = Number.parseInt(match[1], 10);
  const unit = match[2] as SupportedWindowUnit;

  if (!Number.isFinite(amount) || amount <= 0) {
    return DEFAULT_WINDOW_MS;
  }

  return amount * WINDOW_UNIT_TO_MS[unit];
}

function normalizeIp(value: string | null) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return "unknown";
  }

  // Forwarded IP headers can contain a comma-separated chain, use the first client IP.
  return raw.split(",")[0]?.trim() || "unknown";
}

function getRateLimitStore() {
  const globalScope = globalThis as typeof globalThis & {
    __startupRateLimitStore__?: Map<string, InMemoryBucket>;
    __startupRateLimitWrites__?: number;
  };

  if (!globalScope.__startupRateLimitStore__) {
    globalScope.__startupRateLimitStore__ = new Map<string, InMemoryBucket>();
    globalScope.__startupRateLimitWrites__ = 0;
  }

  return {
    store: globalScope.__startupRateLimitStore__,
    getWrites: () => globalScope.__startupRateLimitWrites__ ?? 0,
    incrementWrites: () => {
      globalScope.__startupRateLimitWrites__ = (globalScope.__startupRateLimitWrites__ ?? 0) + 1;
    },
  };
}

function cleanupExpiredBuckets(now: number) {
  const { store, getWrites } = getRateLimitStore();

  if (getWrites() % CLEANUP_EVERY_N_WRITES !== 0) {
    return;
  }

  for (const [bucketKey, bucket] of store.entries()) {
    if (bucket.reset <= now) {
      store.delete(bucketKey);
    }
  }
}

export function resolveRequestIdentity(request: Request) {
  const forwardedFor = normalizeIp(request.headers.get("x-forwarded-for"));
  const realIp = normalizeIp(request.headers.get("x-real-ip"));
  const cfIp = normalizeIp(request.headers.get("cf-connecting-ip"));
  const userAgent = String(request.headers.get("user-agent") ?? "").trim() || "unknown-agent";
  const ip = forwardedFor !== "unknown" ? forwardedFor : realIp !== "unknown" ? realIp : cfIp;

  return `${ip}:${userAgent.slice(0, 120)}`;
}

export async function enforceRateLimit(options: EnforceRateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  const { store, incrementWrites } = getRateLimitStore();
  const windowMs = parseWindowToMs(options.window);
  const bucketKey = `${options.namespace}:${options.key}`;
  const existing = store.get(bucketKey);

  if (!existing || existing.reset <= now) {
    store.set(bucketKey, {
      count: 1,
      reset: now + windowMs,
    });
    incrementWrites();
    cleanupExpiredBuckets(now);

    return {
      success: true,
      remaining: Math.max(0, options.limit - 1),
      reset: now + windowMs,
    };
  }

  if (existing.count >= options.limit) {
    return {
      success: false,
      remaining: 0,
      reset: existing.reset,
    };
  }

  existing.count += 1;
  store.set(bucketKey, existing);
  incrementWrites();
  cleanupExpiredBuckets(now);

  return {
    success: true,
    remaining: Math.max(0, options.limit - existing.count),
    reset: existing.reset,
  };
}
