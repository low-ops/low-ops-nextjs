import "dotenv/config";

import { createHash } from "node:crypto";
import { z } from "zod";

const postgresSchema = z.object({
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.coerce.string().default("5432"),
  POSTGRES_DATABASE: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string(),
});

const AWS_REGION_PATTERN = /^[a-z]{2}(?:-[a-z]+)+-\d+$/;

const s3Schema = z.object({
  S3_ENDPOINT: z.string().min(1),
  S3_BUCKET_NAME: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_REGION: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() ? value.trim() : "us-east-1",
    z.string().min(1),
  ),
});

function isLikelyAwsRegion(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? AWS_REGION_PATTERN.test(trimmed) : false;
}

function extractRegionFromS3Endpoint(endpoint: string) {
  try {
    const host = new URL(normalizeS3Endpoint(endpoint)).hostname.toLowerCase();
    const match =
      host.match(/\.s3[.-]([a-z0-9-]+)\.amazonaws\.com$/) ??
      host.match(/^s3[.-]([a-z0-9-]+)\.amazonaws\.com$/);

    if (match && match[1] !== "dualstack" && isLikelyAwsRegion(match[1])) {
      return match[1];
    }

    if (host === "s3.amazonaws.com" || host.endsWith(".s3.amazonaws.com")) {
      return "us-east-1";
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function resolveS3Region(endpoint: string, defaultRegion: string) {
  for (const candidate of [
    process.env.S3_REGION,
    process.env.AWS_REGION,
    process.env.AWS_DEFAULT_REGION,
    process.env.S3_SERVICE_NAME,
  ]) {
    if (isLikelyAwsRegion(candidate)) {
      return candidate!.trim();
    }
  }

  const region = extractRegionFromS3Endpoint(endpoint) ?? defaultRegion;
  return region.trim() || "us-east-1";
}

export function getPostgresConfig() {
  return postgresSchema.parse(process.env);
}

export function getDatabaseUrl() {
  const postgres = getPostgresConfig();
  const password = encodeURIComponent(postgres.POSTGRES_PASSWORD);

  return `postgresql://${postgres.POSTGRES_USER}:${password}@${postgres.POSTGRES_HOST}:${postgres.POSTGRES_PORT}/${postgres.POSTGRES_DATABASE}`;
}

function normalizeS3Endpoint(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const isLocal =
    trimmed.startsWith("localhost") ||
    trimmed.startsWith("127.0.0.1") ||
    trimmed.startsWith("minio") ||
    trimmed.includes(":9000");

  return `${isLocal ? "http" : "https"}://${trimmed}`;
}

function getS3PublicBaseUrl(endpoint: string) {
  const configured = process.env.S3_PUBLIC_BASE_URL?.trim();
  return normalizeS3Endpoint(configured || endpoint).replace(/\/$/, "");
}

function parseS3BucketName(value: string) {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, "");
  const slashIndex = trimmed.indexOf("/");

  if (slashIndex === -1) {
    return { bucket: trimmed, prefix: "" };
  }

  return {
    bucket: trimmed.slice(0, slashIndex),
    prefix: trimmed.slice(slashIndex + 1).replace(/\/$/, ""),
  };
}

export function resolveS3ObjectKey(relativeKey: string, prefix = "") {
  const normalizedKey = relativeKey.replace(/^\//, "");
  const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, "");

  if (!normalizedPrefix) {
    return normalizedKey;
  }

  if (
    normalizedKey === normalizedPrefix ||
    normalizedKey.startsWith(`${normalizedPrefix}/`)
  ) {
    return normalizedKey;
  }

  return `${normalizedPrefix}/${normalizedKey}`;
}

export function getS3Config() {
  const s3 = s3Schema.parse(process.env);
  const { bucket, prefix } = parseS3BucketName(s3.S3_BUCKET_NAME);
  const endpoint = normalizeS3Endpoint(s3.S3_ENDPOINT);
  const sessionToken =
    process.env.S3_SESSION_TOKEN?.trim() ||
    process.env.AWS_SESSION_TOKEN?.trim();

  return {
    endpoint,
    bucket,
    prefix,
    publicBaseUrl: getS3PublicBaseUrl(endpoint),
    accessKeyId: s3.S3_ACCESS_KEY_ID,
    secretAccessKey: s3.S3_SECRET_ACCESS_KEY,
    region: resolveS3Region(endpoint, s3.S3_REGION),
    forcePathStyle: true as const,
    ...(sessionToken ? { sessionToken } : {}),
  };
}

export function getS3ObjectUrl(key: string) {
  const { bucket, prefix, publicBaseUrl } = getS3Config();
  const objectKey = resolveS3ObjectKey(key, prefix);

  return new URL(`${publicBaseUrl}/${bucket}/${objectKey}`).toString();
}

export function getAppPort() {
  const port = Number(process.env.PORT ?? "8000");
  return Number.isFinite(port) ? port : 8000;
}

export function getMetricsPort() {
  if (!isMetricsServerEnabled()) {
    return null;
  }

  return parseMetricsPortValue(process.env.METRICS_PORT);
}

export function getMetricsHost() {
  const configured = process.env.METRICS_HOST?.trim();
  if (configured) {
    return configured;
  }

  return isProductionRuntime() ? "0.0.0.0" : "127.0.0.1";
}

export function getMetricsToken() {
  return process.env.METRICS_TOKEN?.trim() || undefined;
}

export function isMetricsAuthRequired() {
  return (
    (isProductionRuntime() || Boolean(getMetricsToken())) &&
    isMetricsServerEnabled()
  );
}

function normalizeAppUrl(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    const pathname = url.pathname.replace(/\/$/, "");
    return `${url.protocol}//${url.host}${pathname === "/" ? "" : pathname}`;
  } catch {
    return undefined;
  }
}

export function getApplicationUrl() {
  for (const key of [
    "APPLICATION_URL",
    "BETTER_AUTH_URL",
    "APP_URL",
    "PUBLIC_URL",
  ]) {
    const normalized = normalizeAppUrl(process.env[key]);
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

export function getTrustedOrigins() {
  const origins = new Set<string>();
  const applicationUrl = getApplicationUrl();
  const betterAuthUrl = normalizeAppUrl(process.env.BETTER_AUTH_URL);

  if (applicationUrl) {
    origins.add(applicationUrl);
  }

  if (betterAuthUrl) {
    origins.add(betterAuthUrl);
  }

  const extraOrigins = process.env.TRUSTED_ORIGINS?.split(",") ?? [];
  for (const origin of extraOrigins) {
    const normalized = normalizeAppUrl(origin.trim());
    if (normalized) {
      origins.add(normalized);
    }
  }

  if (origins.size === 0) {
    origins.add(DEFAULT_BASE_URL);
  }

  return [...origins];
}

export function getOtelConfig() {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
  const serviceName = process.env.OTEL_SERVICE_NAME?.trim();

  if (!endpoint || !serviceName) {
    return undefined;
  }

  return {
    endpoint: endpoint.replace(/\/$/, ""),
    serviceName,
  };
}

const DEFAULT_AUTH_SECRET =
  "build-time-placeholder-secret-min-32-chars!!";
const DEFAULT_BASE_URL = "http://localhost:8000";

export function isDeployedRuntime() {
  return (
    process.cwd() === "/app" ||
    Boolean(process.env.KUBERNETES_SERVICE_HOST) ||
    Boolean(process.env.OTEL_SERVICE_NAME?.trim())
  );
}

export function isDevelopmentRuntime() {
  if (process.env.ALLOW_INVALID_RUNTIME_ENV === "true") {
    return true;
  }

  if (isDeployedRuntime()) {
    return false;
  }

  return process.env.NODE_ENV === "development";
}

export function isProductionRuntime() {
  return !isDevelopmentRuntime();
}

function derivePlatformAuthSecret() {
  if (!isDeployedRuntime()) {
    return undefined;
  }

  const material = [
    process.env.POSTGRES_PASSWORD,
    process.env.POSTGRES_HOST,
    process.env.POSTGRES_DATABASE,
    process.env.POSTGRES_USER,
    process.env.S3_SECRET_ACCESS_KEY,
    process.env.S3_BUCKET_NAME,
    process.env.OTEL_SERVICE_NAME,
  ]
    .map((value) => value?.trim())
    .filter(Boolean);

  if (material.length < 4) {
    return undefined;
  }

  return createHash("sha256").update(material.join("\0")).digest("base64url");
}

function resolveAuthSecret() {
  for (const key of ["BETTER_AUTH_SECRET", "AUTH_SECRET"]) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }

  return derivePlatformAuthSecret();
}

export function isAuthSecretDerived() {
  for (const key of ["BETTER_AUTH_SECRET", "AUTH_SECRET"]) {
    if (process.env[key]?.trim()) {
      return false;
    }
  }

  return Boolean(derivePlatformAuthSecret());
}

export function isMetricsServerEnabled() {
  const raw = process.env.METRICS_PORT?.trim()?.toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off") {
    return false;
  }

  if (process.env.METRICS_ENABLED?.trim()?.toLowerCase() === "false") {
    return false;
  }

  return true;
}

function parseMetricsPortValue(raw: string | undefined) {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return 8001;
  }

  const port = Number(trimmed);
  return Number.isFinite(port) && port > 0 ? port : 8001;
}

export function getAuthConfig(strict = false) {
  const secret = resolveAuthSecret();
  const applicationUrl = getApplicationUrl();
  const betterAuthUrl = normalizeAppUrl(process.env.BETTER_AUTH_URL);
  const configuredBaseUrl = applicationUrl ?? betterAuthUrl;

  if (strict) {
    if (!secret || secret.length < 32) {
      throw new Error(
        "Set BETTER_AUTH_SECRET (min 32 chars) or ensure platform database/storage env vars are configured.",
      );
    }

    if (!configuredBaseUrl && !isDeployedRuntime()) {
      throw new Error("Set APPLICATION_URL or BETTER_AUTH_URL.");
    }
  }

  return {
    secret:
      secret && secret.length >= 32 ? secret : DEFAULT_AUTH_SECRET,
    baseURL: configuredBaseUrl,
    trustedOrigins: getTrustedOrigins(),
  };
}

export function getAuthBaseUrlConfig():
  | string
  | {
      allowedHosts: string[];
      fallback?: string;
    } {
  const applicationUrl = getApplicationUrl();
  if (applicationUrl) {
    return applicationUrl;
  }

  const betterAuthUrl = normalizeAppUrl(process.env.BETTER_AUTH_URL);
  if (betterAuthUrl) {
    return betterAuthUrl;
  }

  return {
    allowedHosts: ["localhost:*", "*.ci.cinaq.com"],
    fallback: DEFAULT_BASE_URL,
  };
}

export function validateRuntimeEnv() {
  getPostgresConfig();
  getS3Config();
  getAuthConfig(true);

  if (
    isProductionRuntime() &&
    isMetricsServerEnabled() &&
    !getMetricsToken()
  ) {
    throw new Error(
      "METRICS_TOKEN is required when the metrics server is enabled.",
    );
  }
}
