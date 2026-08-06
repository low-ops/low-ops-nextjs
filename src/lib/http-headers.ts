import { getApplicationUrl } from "@/lib/env";
import { NextRequest, NextResponse } from "next/server";

export const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
} as const;

export function applyNoCacheHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(NO_CACHE_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export function applyCorsHeaders(request: NextRequest, response: NextResponse) {
  const applicationUrl = getApplicationUrl();

  if (!applicationUrl) {
    return response;
  }

  const origin = request.headers.get("origin");

  if (origin === applicationUrl) {
    response.headers.set("Access-Control-Allow-Origin", applicationUrl);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
  }

  return response;
}

export function withApiHeaders(request: NextRequest, response: NextResponse) {
  applyNoCacheHeaders(response);
  applyCorsHeaders(request, response);
  return response;
}
