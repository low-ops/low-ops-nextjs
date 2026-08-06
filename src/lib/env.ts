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
