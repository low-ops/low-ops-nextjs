import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { account, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getExistingUserCount } from "@/lib/founding-admins";
import { logger } from "@/lib/logger";
import {
  getOAuthProxyIdentity,
  type OAuthProxyIdentity,
} from "@/lib/oauth-proxy";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role?: string | null;
};

async function signCookieValue(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  const bytes = new Uint8Array(signature);
  const encoded = btoa(String.fromCharCode(...bytes));
  return encodeURIComponent(`${value}.${encoded}`);
}

function cookieHeader(
  name: string,
  encodedValue: string,
  attributes: {
    path?: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: string;
    maxAge?: number;
  },
) {
  const parts = [`${name}=${encodedValue}`];

  if (attributes.maxAge != null && attributes.maxAge >= 0) {
    parts.push(`Max-Age=${Math.floor(attributes.maxAge)}`);
  }

  if (attributes.path) {
    parts.push(`Path=${attributes.path}`);
  }

  if (attributes.httpOnly) {
    parts.push("HttpOnly");
  }

  if (attributes.secure) {
    parts.push("Secure");
  }

  if (attributes.sameSite) {
    const sameSite =
      attributes.sameSite.charAt(0).toUpperCase() +
      attributes.sameSite.slice(1);
    parts.push(`SameSite=${sameSite}`);
  }

  return parts.join("; ");
}

async function upsertGoogleUser(identity: OAuthProxyIdentity) {
  const email = identity.email;
  const [existing] = await db
    .select()
    .from(user)
    .where(sql`lower(${user.email}) = ${email}`)
    .limit(1);

  let nextUser = existing;

  if (!nextUser) {
    const existingUserCount = await getExistingUserCount();
    const now = new Date();
    const created = {
      id: crypto.randomUUID(),
      name: identity.name,
      email,
      emailVerified: true,
      image: null,
      role: existingUserCount === 0 ? "admin" : "user",
      banned: false,
      banReason: null,
      banExpires: null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(user).values(created);
    nextUser = created;
  } else {
    if (nextUser.banned) {
      if (nextUser.banExpires && nextUser.banExpires <= new Date()) {
        await db
          .update(user)
          .set({
            banned: false,
            banReason: null,
            banExpires: null,
            updatedAt: new Date(),
          })
          .where(eq(user.id, nextUser.id));
        nextUser = {
          ...nextUser,
          banned: false,
          banReason: null,
          banExpires: null,
        };
      } else {
        return null;
      }
    }

    const fields: Partial<typeof user.$inferInsert> = {};
    if (!nextUser.emailVerified) {
      fields.emailVerified = true;
    }
    if ((nextUser.name || "").includes("@")) {
      fields.name = identity.name;
    }
    if (Object.keys(fields).length > 0) {
      fields.updatedAt = new Date();
      await db.update(user).set(fields).where(eq(user.id, nextUser.id));
      nextUser = { ...nextUser, ...fields };
    }
  }

  const [existingAccount] = await db
    .select({
      id: account.id,
    })
    .from(account)
    .where(
      and(eq(account.userId, nextUser.id), eq(account.providerId, "google")),
    )
    .limit(1);

  if (!existingAccount) {
    const now = new Date();
    await db.execute(sql`
      INSERT INTO account (
        id,
        account_id,
        provider_id,
        user_id,
        access_token,
        id_token,
        created_at,
        updated_at
      )
      VALUES (
        ${crypto.randomUUID()},
        ${identity.accountId},
        ${"google"},
        ${nextUser.id},
        ${identity.accessToken ?? null},
        ${identity.idToken ?? null},
        ${now},
        ${now}
      )
    `);
  } else if (identity.idToken || identity.accessToken) {
    await db.execute(sql`
      UPDATE account
      SET
        id_token = COALESCE(${identity.idToken ?? null}, id_token),
        access_token = COALESCE(${identity.accessToken ?? null}, access_token),
        updated_at = ${new Date()}
      WHERE id = ${existingAccount.id}
    `);
  }

  return nextUser;
}

async function createSessionCookies(userId: string) {
  const ctx = await auth.$context;
  const session = await ctx.internalAdapter.createSession(userId);
  if (!session) {
    return [];
  }

  const sessionCookie = ctx.authCookies.sessionToken;
  const signedValue = await signCookieValue(session.token, ctx.secret);
  return [
    cookieHeader(sessionCookie.name, signedValue, {
      ...sessionCookie.attributes,
      maxAge: ctx.sessionConfig.expiresIn,
    }),
  ];
}

export async function applyOAuthProxySignIn(input: {
  headers: Headers;
  pathname?: string;
  sessionEmail?: string | null;
}): Promise<{ user: SessionUser | null; cookies: string[] }> {
  const identity = await getOAuthProxyIdentity(input.headers, input.pathname);
  if (!identity) {
    return { user: null, cookies: [] };
  }

  if (input.sessionEmail?.toLowerCase() === identity.email) {
    return { user: null, cookies: [] };
  }

  const nextUser = await upsertGoogleUser(identity);
  if (!nextUser) {
    return { user: null, cookies: [] };
  }

  const cookies = await createSessionCookies(nextUser.id);
  logger.info("oauth2-proxy signed in user", {
    email: nextUser.email,
    user_id: nextUser.id,
  });

  return {
    user: {
      id: nextUser.id,
      email: nextUser.email,
      name: nextUser.name,
      role: nextUser.role,
    },
    cookies,
  };
}

export function applySetCookies(
  headers: Headers,
  cookies: string[],
) {
  for (const cookie of cookies) {
    headers.append("Set-Cookie", cookie);
  }
}
