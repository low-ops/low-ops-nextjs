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

export function getS3Config() {
  const s3 = s3Schema.parse(process.env);

  return {
    endpoint: s3.S3_ENDPOINT,
    bucket: s3.S3_BUCKET_NAME,
    accessKeyId: s3.S3_ACCESS_KEY_ID,
    secretAccessKey: s3.S3_SECRET_ACCESS_KEY,
    region: s3.S3_REGION,
    forcePathStyle: true as const,
  };
}

export function getS3ObjectUrl(key: string) {
  const { endpoint, bucket } = getS3Config();
  const normalizedEndpoint = endpoint.replace(/\/$/, "");
  const normalizedKey = key.replace(/^\//, "");

  return `${normalizedEndpoint}/${bucket}/${normalizedKey}`;
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

const authSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32),
});

export function getAuthConfig() {
  const { BETTER_AUTH_SECRET } = authSchema.parse(process.env);
  const baseURL =
    normalizeAppUrl(process.env.BETTER_AUTH_URL) ??
    normalizeAppUrl(process.env.APPLICATION_URL);

  if (!baseURL) {
    throw new Error(
      "Set BETTER_AUTH_URL or APPLICATION_URL to a valid public app URL.",
    );
  }

  return {
    secret: BETTER_AUTH_SECRET,
    baseURL,
  };
}

export function validateRuntimeEnv() {
  getPostgresConfig();
  getS3Config();
  getAuthConfig();
}
