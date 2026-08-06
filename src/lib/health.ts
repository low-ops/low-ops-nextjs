import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getS3Config } from "@/lib/env";

export type HealthCheckResult = {
  healthy: boolean;
  checks: {
    postgres: "ok" | "error";
    s3: "ok" | "error";
  };
};

export async function checkHealth(): Promise<HealthCheckResult> {
  const checks: HealthCheckResult["checks"] = {
    postgres: "error",
    s3: "error",
  };

  try {
    await db.execute(sql`select 1`);
    checks.postgres = "ok";
  } catch {
    checks.postgres = "error";
  }

  try {
    const s3Config = getS3Config();
    const client = new S3Client({
      endpoint: s3Config.endpoint,
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
      forcePathStyle: s3Config.forcePathStyle,
    });

    await client.send(
      new HeadBucketCommand({
        Bucket: s3Config.bucket,
      }),
    );
    checks.s3 = "ok";
  } catch {
    checks.s3 = "error";
  }

  return {
    healthy: checks.postgres === "ok" && checks.s3 !== "error",
    checks,
  };
}
