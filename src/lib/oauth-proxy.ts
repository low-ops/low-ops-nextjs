import { getOAuth2ProxyUrl, isOAuthProxyEnabled } from "@/lib/env";
import { logger } from "@/lib/logger";

export type OAuthProxyIdentity = {
  email: string;
  accountId: string;
  name: string;
  idToken?: string | null;
  accessToken?: string | null;
};

const EMAIL_HEADERS = [
  "x-auth-request-email",
  "x-forwarded-email",
  "x-email",
  "x-auth-request-preferred-username",
  "x-forwarded-preferred-username",
];

const USER_HEADERS = [
  "x-auth-request-user",
  "x-forwarded-user",
  "x-user",
  "remote-user",
  "gap-auth",
];

const ACCESS_TOKEN_HEADERS = [
  "x-auth-request-access-token",
  "x-forwarded-access-token",
  "x-access-token",
];

const SSO_HEADER_MARKERS = [
  "x-auth-request-",
  "x-forwarded-user",
  "x-forwarded-email",
  "x-forwarded-preferred",
  "x-forwarded-groups",
  "x-forwarded-access-token",
  "x-email",
  "x-user",
  "x-access-token",
  "authorization",
  "remote-user",
  "gap-auth",
];

const PROBE_USER_AGENTS = [
  "kube-probe/",
  "blackbox exporter",
  "prometheus/",
  "googlehc/",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isProbeRequest(headers: Headers, pathname?: string) {
  if (pathname === "/ready" || pathname?.startsWith("/ready/")) {
    return true;
  }

  const userAgent = headers.get("user-agent")?.toLowerCase() ?? "";
  return PROBE_USER_AGENTS.some((marker) => userAgent.includes(marker));
}

function headerValue(headers: Headers, names: string[]) {
  for (const name of names) {
    const value = headers.get(name)?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function asEmail(value: string | undefined | null) {
  if (!value) {
    return undefined;
  }

  const email = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : undefined;
}

function bearerToken(headers: Headers) {
  const authorization = headers.get("authorization")?.trim() ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return undefined;
  }

  return authorization.slice(7).trim() || undefined;
}

function jwtClaim(headers: Headers, claim: string) {
  const token = bearerToken(headers);
  if (!token) {
    return undefined;
  }

  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) {
    return undefined;
  }

  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (payload.length % 4)) % 4);
    const data = JSON.parse(atob(payload + padding)) as Record<string, unknown>;
    const value = data[claim];
    return value ? String(value).trim() : undefined;
  } catch {
    return undefined;
  }
}

function cookieNames(headers: Headers) {
  return (headers.get("cookie") ?? "")
    .split(";")
    .map((part) => part.split("=")[0]?.trim())
    .filter(Boolean)
    .sort()
    .join(",");
}

function hasOAuth2Cookie(headers: Headers) {
  return (headers.get("cookie") ?? "")
    .split(";")
    .some((part) => part.split("=")[0]?.trim().toLowerCase().includes("oauth2"));
}

function incomingHeaders(headers: Headers) {
  const visible: Record<string, string> = {};

  headers.forEach((value, name) => {
    visible[name] = name.toLowerCase() === "cookie" ? "<redacted>" : value;
  });

  visible.cookie_names = cookieNames(headers);
  return visible;
}

function ssoHeaders(headers: Record<string, string>) {
  const sso: Record<string, string> = {};

  for (const [name, value] of Object.entries(headers)) {
    const lowered = name.toLowerCase();
    if (SSO_HEADER_MARKERS.some((marker) => lowered.includes(marker))) {
      sso[name] = value;
    }
  }

  return sso;
}

type ProxyIdentity = {
  email?: string;
  user?: string;
  access_token?: string;
};

async function oauth2Request(url: string, cookie: string) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Cookie: cookie,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(2000),
    });

    if (!response.ok && response.status !== 202) {
      logger.info("oauth2-proxy request failed", {
        url,
        status: response.status,
      });
      return null;
    }

    return response;
  } catch (error) {
    logger.info("oauth2-proxy request failed", {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function fetchOAuth2Auth(base: string, cookie: string): Promise<ProxyIdentity> {
  const response = await oauth2Request(`${base}/oauth2/auth`, cookie);
  if (!response) {
    return {};
  }

  return {
    email:
      response.headers.get("x-auth-request-email") ||
      response.headers.get("x-forwarded-email") ||
      undefined,
    user:
      response.headers.get("x-auth-request-user") ||
      response.headers.get("x-forwarded-user") ||
      undefined,
    access_token:
      response.headers.get("x-auth-request-access-token") || undefined,
  };
}

async function fetchOAuth2Userinfo(
  base: string,
  cookie: string,
): Promise<ProxyIdentity> {
  const response = await oauth2Request(`${base}/oauth2/userinfo`, cookie);
  if (!response) {
    return {};
  }

  try {
    const data = (await response.json()) as Record<string, unknown>;
    if (!data || typeof data !== "object") {
      return {};
    }

    return {
      email: typeof data.email === "string" ? data.email : undefined,
      user: typeof data.user === "string" ? data.user : undefined,
    };
  } catch {
    return {};
  }
}

async function identityFromOAuth2Proxy(headers: Headers): Promise<ProxyIdentity> {
  if (!hasOAuth2Cookie(headers)) {
    logger.info("oauth2-proxy identity missing cookies", {
      cookie_names: cookieNames(headers),
    });
    return {};
  }

  const cookie = headers.get("cookie") ?? "";
  const base = getOAuth2ProxyUrl();
  if (!base) {
    return {};
  }

  const identity = await fetchOAuth2Auth(base, cookie);
  if (!identity.email) {
    Object.assign(identity, await fetchOAuth2Userinfo(base, cookie));
  }

  logger.info("oauth2-proxy fetched identity", {
    url: base,
    email: identity.email ?? "",
  });

  return identity;
}

export async function getOAuthProxyIdentity(
  headers: Headers,
  pathname?: string,
): Promise<OAuthProxyIdentity | null> {
  if (isProbeRequest(headers, pathname)) {
    return null;
  }

  const enabled = isOAuthProxyEnabled();
  const incoming = incomingHeaders(headers);
  let proxyIdentity: ProxyIdentity = {};
  let email = asEmail(
    headerValue(headers, EMAIL_HEADERS) ||
      headerValue(headers, USER_HEADERS) ||
      jwtClaim(headers, "email"),
  );

  if (enabled && !email) {
    proxyIdentity = await identityFromOAuth2Proxy(headers);
    email = asEmail(proxyIdentity.email);
  }

  logger.info("sso provider headers", {
    path: pathname ?? "",
    enabled,
    email: email ?? "",
    sso: ssoHeaders(incoming),
  });

  if (!enabled || !email) {
    return null;
  }

  const userId =
    headerValue(headers, USER_HEADERS) || proxyIdentity.user || email;

  return {
    email,
    accountId: String(userId).trim().slice(0, 255),
    name: email.split("@", 1)[0] ?? email,
    idToken: bearerToken(headers),
    accessToken:
      headerValue(headers, ACCESS_TOKEN_HEADERS) || proxyIdentity.access_token,
  };
}
