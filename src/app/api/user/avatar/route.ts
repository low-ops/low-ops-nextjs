import { getAvatarProxyPath } from "@/lib/avatar";
import { auth } from "@/lib/auth";
import { withApiHeaders } from "@/lib/http-headers";
import { logger } from "@/lib/logger";
import { getAvatarUploadsTotal } from "@/lib/metrics";
import { uploadAvatar } from "@/lib/s3";
import { getS3Config } from "@/lib/env";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withApiHeaders(request, response);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    const response = NextResponse.json(
      { error: "No file provided" },
      { status: 400 },
    );
    return withApiHeaders(request, response);
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    getAvatarUploadsTotal().inc({ status: "invalid_type" });
    const response = NextResponse.json(
      { error: "File must be a JPEG, PNG, WebP, or GIF image" },
      { status: 400 },
    );
    return withApiHeaders(request, response);
  }

  if (file.size > MAX_FILE_SIZE) {
    getAvatarUploadsTotal().inc({ status: "too_large" });
    const response = NextResponse.json(
      { error: "Image must be 5 MB or smaller" },
      { status: 400 },
    );
    return withApiHeaders(request, response);
  }

  const s3Config = getS3Config();

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { key } = await uploadAvatar({
      userId: session.user.id,
      fileName: file.name,
      contentType: file.type,
      body: buffer,
    });

    getAvatarUploadsTotal().inc({ status: "success" });
    logger.info("Avatar uploaded", {
      userId: session.user.id,
      fileName: file.name,
      key,
    });

    const response = NextResponse.json({
      key,
      url: getAvatarProxyPath(session.user.id),
    });
    return withApiHeaders(request, response);
  } catch (error) {
    getAvatarUploadsTotal().inc({ status: "error" });
    logger.error("Avatar upload failed", {
      userId: session.user.id,
      error: error instanceof Error ? error.message : String(error),
      bucket: s3Config.bucket,
      endpoint: s3Config.endpoint,
    });

    const response = NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
    return withApiHeaders(request, response);
  }
}

export async function OPTIONS(request: NextRequest) {
  return withApiHeaders(request, new NextResponse(null, { status: 204 }));
}
