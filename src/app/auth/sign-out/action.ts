"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { account } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getDefaultAuthPath } from "@/lib/founding-admins";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function signedInWithGoogle(userId: string) {
  const [googleAccount] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "google")))
    .limit(1);

  return Boolean(googleAccount);
}

function isAllowedGoogleSsoSignOutUrl(url: string) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.startsWith("auth-apps.") &&
      parsed.pathname === "/oauth2/sign_out"
    );
  } catch {
    return false;
  }
}

export async function signOutUser(googleSsoSignOutUrl?: string) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });
  const googleSso = session
    ? await signedInWithGoogle(session.user.id)
    : false;

  await auth.api.revokeSessions({
    headers: requestHeaders,
  });

  await auth.api.signOut({
    headers: requestHeaders,
  });

  if (
    googleSso &&
    googleSsoSignOutUrl &&
    isAllowedGoogleSsoSignOutUrl(googleSsoSignOutUrl)
  ) {
    redirect(googleSsoSignOutUrl);
  }

  redirect(await getDefaultAuthPath());
}
