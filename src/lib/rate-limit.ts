import { NextRequest } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

const DEFAULT_MAX = 20;
const DEFAULT_WINDOW_MS = 60_000;

function getAuthRateLimitConfig() {
  const max = Number(process.env.AUTH_RATE_LIMIT_MAX ?? DEFAULT_MAX);
  const windowMs = Number(
    process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? DEFAULT_WINDOW_MS,
  );

  return {
    max: Number.isFinite(max) && max > 0 ? max : DEFAULT_MAX,
    windowMs:
      Number.isFinite(windowMs) && windowMs > 0 ? windowMs : DEFAULT_WINDOW_MS,
  };
}

function pruneExpiredEntries(now: number) {
  if (store.size <= 10_000) {
    return;
  }

  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export function checkAuthRateLimit(clientKey: string): {
  success: boolean;
  retryAfter?: number;
} {
  const { max, windowMs } = getAuthRateLimitConfig();
  const now = Date.now();
  pruneExpiredEntries(now);

  const entry = store.get(clientKey);

  if (!entry || now >= entry.resetAt) {
    store.set(clientKey, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  if (entry.count >= max) {
    return {
      success: false,
      retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { success: true };
}

export function isAuthRateLimitPath(pathname: string, method: string): boolean {
  if (!pathname.startsWith("/api/auth/")) {
    return false;
  }

  return method === "POST" || method === "PUT" || method === "PATCH";
}
