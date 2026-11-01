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
  applyOAuthProxySignIn,
  applySetCookies,
} from "@/lib/oauth-proxy-signin";
import { isProbeRequest } from "@/lib/oauth-proxy";
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
    if (pathname === "/ready" || pathname.startsWith("/ready/")) {
      return finalizeResponse(request, NextResponse.next(), startedAt);
    }

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

    const oauthCookies: string[] = [];
    let hasSession = Boolean(session);

    if (!isProbeRequest(request.headers, pathname)) {
      const oauthSignIn = await applyOAuthProxySignIn({
        headers: request.headers,
        pathname,
        sessionEmail: session?.user.email,
      });

      oauthCookies.push(...oauthSignIn.cookies);
      if (oauthSignIn.user) {
        hasSession = true;
      }
    }

    const withOAuthCookies = (response: NextResponse) => {
      applySetCookies(response.headers, oauthCookies);
      return response;
    };

    if (oauthCookies.length > 0 && !pathname.startsWith("/api/")) {
      const destination =
        pathname.startsWith("/auth/") || pathname === "/"
          ? DEFAULT_SIGN_IN_REDIRECT
          : `${pathname}${request.nextUrl.search}`;

      return finalizeResponse(
        request,
        withOAuthCookies(NextResponse.redirect(new URL(destination, request.url))),
        startedAt,
      );
    }

    if (oauthCookies.length > 0) {
      const requestHeaders = new Headers(request.headers);
      const cookiePairs = oauthCookies.map((cookie) => cookie.split(";", 1)[0]);
      const existingCookie = requestHeaders.get("cookie");
      requestHeaders.set(
        "cookie",
        [existingCookie, ...cookiePairs].filter(Boolean).join("; "),
      );

      return finalizeResponse(
        request,
        withOAuthCookies(
          NextResponse.next({
            request: { headers: requestHeaders },
          }),
        ),
        startedAt,
      );
    }

    if (hasSession && pathname.startsWith("/auth/")) {
      return finalizeResponse(
        request,
        withOAuthCookies(
          NextResponse.redirect(new URL(DEFAULT_SIGN_IN_REDIRECT, request.url)),
        ),
        startedAt,
      );
    }

    if (isPublicPath(pathname)) {
      return finalizeResponse(
        request,
        withOAuthCookies(NextResponse.next()),
        startedAt,
      );
    }

    if (!hasSession) {
      return finalizeResponse(
        request,
        withOAuthCookies(
          NextResponse.redirect(
            new URL(await getDefaultAuthPath(), request.url),
          ),
        ),
        startedAt,
      );
    }

    return finalizeResponse(
      request,
      withOAuthCookies(NextResponse.next()),
      startedAt,
    );
  } finally {
    getHttpActiveRequests().dec();
  }
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
