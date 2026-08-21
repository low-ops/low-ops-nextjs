import { NextRequest } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const AUTH_RATE_LIMIT_MAX = 20;
const AUTH_RATE_LIMIT_WINDOW_MS = 60_000;

const store = new Map<string, RateLimitEntry>();

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
  const now = Date.now();
  pruneExpiredEntries(now);

  const entry = store.get(clientKey);

  if (!entry || now >= entry.resetAt) {
    store.set(clientKey, {
      count: 1,
      resetAt: now + AUTH_RATE_LIMIT_WINDOW_MS,
    });
    return { success: true };
  }

  if (entry.count >= AUTH_RATE_LIMIT_MAX) {
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
