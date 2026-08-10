import { db } from "@/db";
import { account, user } from "@/db/schema";
import { logger } from "@/lib/logger";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";

const DEFAULT_ADMIN = {
  name: "Admin User",
  email: "admin@gmail.com",
  password: "admin",
} as const;

export async function ensureDefaultAdminUser() {
  const [existingUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, DEFAULT_ADMIN.email))
    .limit(1);

  if (existingUser) {
    return;
  }

  const now = new Date();
  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(DEFAULT_ADMIN.password);

  await db.insert(user).values({
    id: userId,
    name: DEFAULT_ADMIN.name,
    email: DEFAULT_ADMIN.email,
    emailVerified: true,
    image: null,
    role: "admin",
    banned: false,
    banReason: null,
    banExpires: null,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  logger.info("Default admin user created", { email: DEFAULT_ADMIN.email });
}
