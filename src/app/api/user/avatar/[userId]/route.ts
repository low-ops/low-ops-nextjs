import { db } from "@/db";
import { user } from "@/db/schema";
import { isAdminRole } from "@/lib/admin-auth";
import {
  getAvatarDisplayUrl,
  isExternalAvatarUrl,
  resolveImageStorageKey,
} from "@/lib/avatar";
import { auth } from "@/lib/auth";
import { withApiHeaders } from "@/lib/http-headers";
import { logger } from "@/lib/logger";
import { getS3Object } from "@/lib/s3";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { userId } = await context.params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return withApiHeaders(request, response);
  }

  if (
    session.user.id !== userId &&
    !isAdminRole(session.user.role)
  ) {
    const response = NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return withApiHeaders(request, response);
  }

  const [record] = await db
    .select({ image: user.image })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!record?.image) {
    const response = NextResponse.json({ error: "Not found" }, { status: 404 });
    return withApiHeaders(request, response);
  }

  if (
    isExternalAvatarUrl(record.image) &&
    !resolveImageStorageKey(record.image)
  ) {
    return NextResponse.redirect(record.image);
  }

  const storageKey = resolveImageStorageKey(record.image);

  if (!storageKey) {
    const response = NextResponse.json({ error: "Not found" }, { status: 404 });
    return withApiHeaders(request, response);
  }

  try {
    const object = await getS3Object(storageKey);
    const response = new NextResponse(object.body, {
      status: 200,
      headers: {
        "Content-Type": object.contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });

    return withApiHeaders(request, response);
  } catch (error) {
    logger.error("Avatar fetch failed", {
      userId,
      storageKey,
      image: record.image,
      error: error instanceof Error ? error.message : String(error),
    });

    const fallbackUrl = getAvatarDisplayUrl(userId, record.image);
    if (fallbackUrl && isExternalAvatarUrl(fallbackUrl)) {
      return NextResponse.redirect(fallbackUrl);
    }

    const response = NextResponse.json(
      { error: "Failed to load image" },
      { status: 404 },
    );
    return withApiHeaders(request, response);
  }
}

export async function OPTIONS(request: NextRequest) {
  return withApiHeaders(request, new NextResponse(null, { status: 204 }));
}
