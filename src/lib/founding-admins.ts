import { db } from "@/db";
import { user } from "@/db/schema";
import { sql } from "drizzle-orm";

export const FOUNDING_ADMIN_COUNT = 1;

type AuthHookContext = {
  path?: string;
} | null | undefined;

export function isSignUpUserCreation(ctx: AuthHookContext): boolean {
  const path = ctx?.path;
  if (!path || path.startsWith("/admin/")) {
    return false;
  }

  return (
    path === "/sign-up/email" ||
    path.startsWith("/callback/") ||
    path.startsWith("/oauth2/callback/")
  );
}

export async function getExistingUserCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user);

  return row?.count ?? 0;
}

export async function isRegistrationEnabled(): Promise<boolean> {
  return (await getExistingUserCount()) === 0;
}

export async function getDefaultAuthPath(): Promise<string> {
  return (await isRegistrationEnabled()) ? "/auth/sign-up" : "/auth/sign-in";
}

export function applyFoundingAdminToNewUser<
  T extends { role?: string | null; emailVerified?: boolean },
>(userData: T, existingUserCount: number): T {
  if (existingUserCount >= FOUNDING_ADMIN_COUNT) {
    return userData;
  }

  return {
    ...userData,
    role: "admin",
    emailVerified: true,
  };
}
