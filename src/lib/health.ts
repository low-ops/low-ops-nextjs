import { HeadBucketCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getS3Config, resolveS3ObjectKey } from "@/lib/env";
import { createS3Client } from "@/lib/s3";

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
    const client = createS3Client(s3Config);

    await client.send(
      new HeadBucketCommand({
        Bucket: s3Config.bucket,
      }),
    );

    const probeBody = Buffer.from("ok");
    const probeKey = resolveS3ObjectKey(".healthcheck", s3Config.prefix);

    await client.send(
      new PutObjectCommand({
        Bucket: s3Config.bucket,
        Key: probeKey,
        Body: probeBody,
        ContentType: "text/plain",
        ContentLength: probeBody.length,
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
