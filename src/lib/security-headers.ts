export const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
} as const;

const BASE_SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
} as const;

export function getSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = { ...BASE_SECURITY_HEADERS };

  if (process.env.NODE_ENV !== "development") {
    headers["Strict-Transport-Security"] =
      "max-age=31536000; includeSubDomains";
  }

  return headers;
}

export function applyHeaderRecord(
  response: { headers: { set: (key: string, value: string) => void } },
  headers: Record<string, string>,
) {
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
}
