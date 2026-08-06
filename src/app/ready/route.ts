import { checkHealth } from "@/lib/health";
import { applyNoCacheHeaders } from "@/lib/http-headers";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function GET() {
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
