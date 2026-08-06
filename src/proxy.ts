import { isPublicPath } from "@/lib/public-paths";
import { DEFAULT_LOGIN_REDIRECT } from "@/lib/config";
import { auth } from "@/lib/auth";
import { applyNoCacheHeaders } from "@/lib/http-headers";
import {
  getHttpActiveRequests,
  initMetrics,
  recordHttpRequest,
} from "@/lib/metrics";
import { NextRequest, NextResponse } from "next/server";

function finalizeResponse(
  request: NextRequest,
  response: NextResponse,
  startedAt: number,
) {
  recordHttpRequest({
    method: request.method,
    pathname: request.nextUrl.pathname,
    status: response.status,
    durationSeconds: (performance.now() - startedAt) / 1000,
  });

  return applyNoCacheHeaders(response);
}

export async function proxy(request: NextRequest) {
  initMetrics();
  getHttpActiveRequests().inc();

  const startedAt = performance.now();
  const { pathname } = request.nextUrl;

  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (session && pathname.startsWith("/auth/")) {
      return finalizeResponse(
        request,
        NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, request.url)),
        startedAt,
      );
    }

    if (isPublicPath(pathname)) {
      return finalizeResponse(request, NextResponse.next(), startedAt);
    }

    if (!session) {
      return finalizeResponse(
        request,
        NextResponse.redirect(new URL("/auth/login", request.url)),
        startedAt,
      );
    }

    return finalizeResponse(request, NextResponse.next(), startedAt);
  } finally {
    getHttpActiveRequests().dec();
  }
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
