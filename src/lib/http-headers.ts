import { getApplicationUrl } from "@/lib/env";
import {
  applyHeaderRecord,
  getSecurityHeaders,
  NO_CACHE_HEADERS,
} from "@/lib/security-headers";
import { NextRequest, NextResponse } from "next/server";

export { NO_CACHE_HEADERS, getSecurityHeaders } from "@/lib/security-headers";

export function applySecurityHeaders(response: NextResponse) {
  applyHeaderRecord(response, getSecurityHeaders());
  return response;
}

export function applyNoCacheHeaders(response: NextResponse) {
  applyHeaderRecord(response, NO_CACHE_HEADERS);
  applySecurityHeaders(response);
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
