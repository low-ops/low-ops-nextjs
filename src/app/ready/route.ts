import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { checkHealth } = await import("@/lib/health");
  const { applyNoCacheHeaders } = await import("@/lib/http-headers");
  const { logger } = await import("@/lib/logger");

  const health = await checkHealth();

  if (!health.healthy) {
    logger.warn("Readiness check failed", { checks: health.checks });
  }

  const response = NextResponse.json(
    {
      status: health.healthy ? "ready" : "not_ready",
      checks: health.checks,
    },
    { status: health.healthy ? 200 : 503 },
  );

  return applyNoCacheHeaders(response);
}
