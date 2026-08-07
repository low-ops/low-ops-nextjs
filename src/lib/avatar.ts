import { getS3Config } from "@/lib/env";

export function getAvatarProxyPath(userId: string) {
  return `/api/user/avatar/${userId}`;
}

export function isExternalAvatarUrl(image: string) {
  return image.startsWith("http://") || image.startsWith("https://");
}

export function resolveImageStorageKey(image: string | null | undefined) {
  if (!image) {
    return null;
  }

  if (!isExternalAvatarUrl(image)) {
    return image.replace(/^\//, "");
  }

  try {
    const { bucket } = getS3Config();
    const pathname = new URL(image).pathname.replace(/^\/+/, "");
    const [pathBucket, ...keyParts] = pathname.split("/");

    if (pathBucket === bucket && keyParts.length > 0) {
      return keyParts.join("/");
    }
  } catch {
    return null;
  }

  return null;
}

export function getAvatarDisplayUrl(
  userId: string,
  image?: string | null,
) {
  if (!image) {
    return undefined;
  }

  if (isExternalAvatarUrl(image) && !resolveImageStorageKey(image)) {
    return image;
  }

  return getAvatarProxyPath(userId);
}
