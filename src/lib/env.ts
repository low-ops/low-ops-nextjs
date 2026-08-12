import "dotenv/config";

import { z } from "zod";

const postgresSchema = z.object({
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.coerce.string().default("5432"),
  POSTGRES_DATABASE: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string(),
});

const s3Schema = z.object({
  S3_ENDPOINT: z.string().min(1),
  S3_BUCKET_NAME: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_REGION: z.string().default("us-east-1"),
});

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

  return {
    endpoint,
    bucket,
    prefix,
    publicBaseUrl: getS3PublicBaseUrl(endpoint),
    accessKeyId: s3.S3_ACCESS_KEY_ID,
    secretAccessKey: s3.S3_SECRET_ACCESS_KEY,
    region: s3.S3_REGION,
    forcePathStyle: true as const,
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
  const port = Number(process.env.METRICS_PORT ?? "8001");
  return Number.isFinite(port) ? port : 8001;
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
  return normalizeAppUrl(process.env.APPLICATION_URL);
}

function getTrustedOrigins() {
  const origins = new Set<string>();
  const applicationUrl = getApplicationUrl();
  const betterAuthUrl = normalizeAppUrl(process.env.BETTER_AUTH_URL);

  if (applicationUrl) {
    origins.add(applicationUrl);
  }

  if (betterAuthUrl) {
    origins.add(betterAuthUrl);
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

export function getAuthConfig(strict = false) {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  const applicationUrl = getApplicationUrl();
  const betterAuthUrl = normalizeAppUrl(process.env.BETTER_AUTH_URL);
  const configuredBaseUrl = applicationUrl ?? betterAuthUrl;
  const trustedOrigins = getTrustedOrigins();

  if (strict) {
    if (!secret || secret.length < 32) {
      throw new Error("BETTER_AUTH_SECRET must be at least 32 characters.");
    }

    if (!configuredBaseUrl) {
      throw new Error("Set APPLICATION_URL or BETTER_AUTH_URL.");
    }
  }

  return {
    secret:
      secret && secret.length >= 32 ? secret : DEFAULT_AUTH_SECRET,
    baseURL: configuredBaseUrl ?? DEFAULT_BASE_URL,
    trustedOrigins,
  };
}

export function validateRuntimeEnv() {
  getPostgresConfig();
  getS3Config();
  getAuthConfig(true);
}
