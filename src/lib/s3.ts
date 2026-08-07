import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getS3Config, resolveS3ObjectKey } from "@/lib/env";

let s3Client: S3Client | null = null;

function getS3Client() {
  if (!s3Client) {
    const config = getS3Config();
    s3Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle,
    });
  }

  return s3Client;
}

export async function uploadAvatar(params: {
  userId: string;
  fileName: string;
  contentType: string;
  body: Buffer;
}) {
  const { bucket, prefix } = getS3Config();
  const extension = params.fileName.split(".").pop()?.toLowerCase() || "jpg";
  const key = resolveS3ObjectKey(
    `avatars/${params.userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`,
    prefix,
  );

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );

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
