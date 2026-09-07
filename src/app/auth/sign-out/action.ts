"use server";

import { auth } from "@/lib/auth";
import { getOAuth2ProxySignOutUrl } from "@/lib/env";
import { getDefaultAuthPath } from "@/lib/founding-admins";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signOutUser() {
  const requestHeaders = await headers();

  await auth.api.revokeSessions({
    headers: requestHeaders,
  });

  await auth.api.signOut({
    headers: requestHeaders,
  });

  redirect(
    getOAuth2ProxySignOutUrl(requestHeaders) ?? (await getDefaultAuthPath()),
  );
}
