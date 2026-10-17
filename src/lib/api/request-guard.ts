const CORRELATION_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

/** Reuses a well-formed incoming id (so a client can trace a request end to end), otherwise mints one. */
export function resolveCorrelationId(headerValue: string | null): string {
  if (headerValue && CORRELATION_ID_PATTERN.test(headerValue)) return headerValue;
  return crypto.randomUUID();
}

/**
 * Best-effort client identifier for rate limiting. On Vercel the platform sets
 * x-forwarded-for, so the first entry is the connecting client.
 */
export function getClientKey(headers: Pick<Headers, "get">): string {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || headers.get("x-real-ip")?.trim() || "unknown";
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type RateLimiterOptions = {
  limit: number;
  windowMs: number;
  maxKeys?: number;
};

/**
 * Fixed-window, in-memory limiter. State lives in a single server instance, so
 * on serverless platforms it is a best-effort guard against bursts and abuse,
 * not a global quota. Use a shared store (e.g. Redis) when a hard limit is needed.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  const maxKeys = options.maxKeys ?? 5000;

  function makeRoom(now: number) {
    if (buckets.size < maxKeys) return;
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
    if (buckets.size >= maxKeys) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey !== undefined) buckets.delete(oldestKey);
    }
  }

  return {
    check(key: string, now: number): RateLimitResult {
      const existing = buckets.get(key);
      if (!existing || existing.resetAt <= now) {
        makeRoom(now);
        buckets.set(key, { count: 1, resetAt: now + options.windowMs });
        return { allowed: true, remaining: options.limit - 1, retryAfterSeconds: 0 };
      }
      if (existing.count >= options.limit) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
        };
      }
      existing.count += 1;
      return {
        allowed: true,
        remaining: options.limit - existing.count,
        retryAfterSeconds: 0,
      };
    },
  };
}

type ApiJsonOptions = {
  status?: number;
  correlationId: string;
  headers?: Record<string, string>;
};

/**
 * JSON response that always carries x-correlation-id. Server errors (5xx) also
 * echo the id in the body so users can quote it when reporting a problem.
 */
export function apiJson(body: Record<string, unknown>, options: ApiJsonOptions): Response {
  const status = options.status ?? 200;
  return Response.json(
    status >= 500 ? { ...body, correlationId: options.correlationId } : body,
    {
      status,
      headers: {
        "x-correlation-id": options.correlationId,
        "cache-control": "no-store",
        ...options.headers,
      },
    },
  );
}

export function rateLimitResponse(result: RateLimitResult, correlationId: string): Response {
  return apiJson(
    { error: `Terlalu banyak permintaan. Coba lagi dalam ${result.retryAfterSeconds} detik.` },
    {
      status: 429,
      correlationId,
      headers: { "retry-after": String(result.retryAfterSeconds) },
    },
  );
}

export function serializeError(error: unknown): { name: string; message: string } {
  if (error instanceof Error) return { name: error.name, message: error.message };
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return { name: "Error", message: error.message };
  }
  return { name: "UnknownError", message: String(error) };
}

/** One JSON line per event so logs can be filtered by route or correlationId. */
export function logApiEvent(
  level: "info" | "warn" | "error",
  route: string,
  correlationId: string,
  message: string,
  error?: unknown,
) {
  const entry = {
    level,
    route,
    correlationId,
    message,
    ...(error === undefined ? {} : { error: serializeError(error) }),
  };
  console[level](JSON.stringify(entry));
}

/** Client-side: formats an API error payload, appending the support reference when present. */
export function formatApiError(
  payload: { error?: string; correlationId?: string },
  fallback: string,
): string {
  const message = payload.error ?? fallback;
  return payload.correlationId ? `${message} (ref: ${payload.correlationId})` : message;
}
