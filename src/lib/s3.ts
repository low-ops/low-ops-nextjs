import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getS3Config, resolveS3ObjectKey } from "@/lib/env";

let s3Client: S3Client | null = null;

export function createS3Client(config = getS3Config()) {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      ...(config.sessionToken ? { sessionToken: config.sessionToken } : {}),
    },
    forcePathStyle: config.forcePathStyle,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

function getS3Client() {
  if (!s3Client) {
    s3Client = createS3Client();
  }

  return s3Client;
}

export async function uploadAvatar(params: {
  userId: string;
  fileName: string;
  contentType: string;
  body: Buffer;
}) {
  const config = getS3Config();
  const extension = params.fileName.split(".").pop()?.toLowerCase() || "jpg";
  const key = resolveS3ObjectKey(
    `avatars/${params.userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`,
    config.prefix,
  );

  try {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: params.body,
        ContentType: params.contentType,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `S3 upload failed for bucket "${config.bucket}" key "${key}" at "${config.endpoint}": ${message}`,
    );
  }

  return {
    key,
  };
}

export async function getS3Object(key: string) {
  const { bucket } = getS3Config();
  const response = await getS3Client().send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error("Object body is empty");
  }

  const bytes = await response.Body.transformToByteArray();

  return {
    body: Buffer.from(bytes),
    contentType: response.ContentType ?? "application/octet-stream",
  };
}
