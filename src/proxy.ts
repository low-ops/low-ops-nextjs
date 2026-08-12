import { isPublicPath } from "@/lib/public-paths";
import { DEFAULT_SIGN_IN_REDIRECT } from "@/lib/config";
import { auth } from "@/lib/auth";
import { getDefaultAuthPath } from "@/lib/founding-admins";
import { applyNoCacheHeaders } from "@/lib/http-headers";
import {
  getHttpActiveRequests,
  initMetrics,
  recordHttpRequest,
} from "@/lib/metrics";
import {
  checkAuthRateLimit,
  getClientIp,
  isAuthRateLimitPath,
} from "@/lib/rate-limit";
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
    if (isAuthRateLimitPath(pathname, request.method)) {
      const rateLimit = checkAuthRateLimit(getClientIp(request));

      if (!rateLimit.success) {
        const response = NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: rateLimit.retryAfter
              ? { "Retry-After": String(rateLimit.retryAfter) }
              : undefined,
          },
        );

        return finalizeResponse(request, response, startedAt);
      }
    }

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (session && pathname.startsWith("/auth/")) {
      return finalizeResponse(
        request,
        NextResponse.redirect(new URL(DEFAULT_SIGN_IN_REDIRECT, request.url)),
        startedAt,
      );
    }

    if (isPublicPath(pathname)) {
      return finalizeResponse(request, NextResponse.next(), startedAt);
    }

    if (!session) {
      return finalizeResponse(
        request,
        NextResponse.redirect(
          new URL(await getDefaultAuthPath(), request.url),
        ),
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
