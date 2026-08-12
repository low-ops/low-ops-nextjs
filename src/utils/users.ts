import { db } from "@/db";
import { account, session } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getAvatarDisplayUrl } from "@/lib/avatar";
import { inArray, sql } from "drizzle-orm";
import { headers } from "next/headers";

export interface UserWithDetails {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  banned: boolean;
  banReason?: string;
  banExpires?: Date | null;
  accounts: string[];
  lastSignIn: Date | null;
  createdAt: Date;
  avatarUrl: string;
  role?: string;
}

export interface GetUsersOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  role?: string;
  status?: string;
  email?: string;
  name?: string;
}

async function getAccountsByUserIds(userIds: string[]) {
  if (userIds.length === 0) {
    return {} as Record<string, string[]>;
  }

  const rows = await db
    .select({
      userId: account.userId,
      providerId: account.providerId,
    })
    .from(account)
    .where(inArray(account.userId, userIds));

  return rows.reduce(
    (acc, row) => {
      if (!acc[row.userId]) {
        acc[row.userId] = [];
      }
      acc[row.userId].push(row.providerId);
      return acc;
    },
    {} as Record<string, string[]>,
  );
}

async function getLastSignInByUserIds(userIds: string[]) {
  if (userIds.length === 0) {
    return {} as Record<string, Date>;
  }

  const rows = await db
    .select({
      userId: session.userId,
      lastSignIn: sql<Date>`max(${session.createdAt})`.as("last_sign_in"),
    })
    .from(session)
    .where(inArray(session.userId, userIds))
    .groupBy(session.userId);

  return rows.reduce(
    (acc, row) => {
      acc[row.userId] = row.lastSignIn;
      return acc;
    },
    {} as Record<string, Date>,
  );
}

export async function getUsers(
  options: GetUsersOptions = {},
): Promise<{ users: UserWithDetails[]; total: number }> {
  const query: Record<string, unknown> = {
    limit: options.limit ?? 10,
    offset: options.offset ?? 0,
  };

  if (options.sortBy) query.sortBy = options.sortBy;
  if (options.sortDirection) query.sortDirection = options.sortDirection;

  if (options.role) {
    query.filterField = "role";
    query.filterOperator = "eq";
    query.filterValue = options.role;
  }

  if (options.status) {
    query.filterField = "banned";
    query.filterOperator = "eq";
    query.filterValue = options.status === "banned";
  }

  if (options.email) {
    query.searchField = "email";
    query.searchOperator = "contains";
    query.searchValue = options.email;
  }

  if (options.name) {
    query.searchField = "name";
    query.searchOperator = "contains";
    query.searchValue = options.name;
  }

  const result = await auth.api.listUsers({
    headers: await headers(),
    query,
  });

  if (!result.users?.length) {
    return { users: [], total: result.total ?? 0 };
  }

  const userIds = result.users.map((user) => user.id);
  const [accountsByUser, lastSignInByUser] = await Promise.all([
    getAccountsByUserIds(userIds),
    getLastSignInByUserIds(userIds),
  ]);

  const users: UserWithDetails[] = result.users.map((user) => {
    const accounts = accountsByUser[user.id] || [];
    const banned = user.banned ?? false;
    const banReason = user.banReason || "";
    const banExpires = user.banExpires || null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      verified: user.emailVerified,
      role: user.role,
      banned,
      banReason,
      banExpires,
      accounts,
      lastSignIn: lastSignInByUser[user.id] || null,
      createdAt: user.createdAt,
      avatarUrl: getAvatarDisplayUrl(user.id, user.image) ?? "",
    };
  });

  return { users, total: result.total ?? users.length };
}
