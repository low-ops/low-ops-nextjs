import "dotenv/config";

import { hashPassword } from "better-auth/crypto";
import { like } from "drizzle-orm";
import { db } from "./index";
import { account, session, user } from "./schema";

const SEED_DOMAIN = "seed.local";
const SEED_PASSWORD = "Password1";
const USER_COUNT = 50;

const FIRST_NAMES = [
  "Alex",
  "Jordan",
  "Taylor",
  "Morgan",
  "Casey",
  "Riley",
  "Avery",
  "Quinn",
  "Hayden",
  "Reese",
  "Blake",
  "Cameron",
  "Drew",
  "Emerson",
  "Finley",
  "Harper",
  "Jamie",
  "Kendall",
  "Logan",
  "Parker",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
];

const BAN_REASONS = [
  "Spamming support tickets",
  "Repeated policy violations",
  "Suspicious login activity",
  "Abusive behavior in comments",
  "Automated bot activity",
];

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Firefox/122.0 Safari/537.36",
];

type SeedUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: "admin" | "user";
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
  withSession: boolean;
};

function daysAgo(days: number, hour = 12) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function buildSeedUsers(): SeedUser[] {
  return Array.from({ length: USER_COUNT }, (_, index) => {
    const number = index + 1;
    const padded = String(number).padStart(2, "0");
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(index * 3) % LAST_NAMES.length];
    const isAdmin = number <= 5 || number === 25;
    const emailVerified = number % 4 !== 0;
    const banned =
      number === 8 ||
      number === 14 ||
      number === 19 ||
      number === 27 ||
      number === 33 ||
      number === 41 ||
      number === 46;
    const hasImage = number % 5 === 0 || number <= 3;
    const permanentBan = number === 19 || number === 41;

    return {
      id: crypto.randomUUID(),
      name: `${firstName} ${lastName}`,
      email: `user${padded}@${SEED_DOMAIN}`,
      emailVerified,
      image: hasImage
        ? `https://api.dicebear.com/9.x/avataaars/svg?seed=user${padded}`
        : null,
      role: isAdmin ? "admin" : "user",
      banned,
      banReason: banned ? BAN_REASONS[index % BAN_REASONS.length] : null,
      banExpires: banned
        ? permanentBan
          ? null
          : daysAgo(-(7 + (index % 21)), 9)
        : null,
      createdAt: daysAgo(90 - index, 8 + (index % 10)),
      updatedAt: daysAgo(index % 30, 14 + (index % 6)),
      withSession: emailVerified && !banned && number % 3 === 0,
    };
  });
}

async function clearSeedUsers() {
  await db.delete(user).where(like(user.email, `%@${SEED_DOMAIN}`));
}

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  console.log("Clearing existing seed users...");
  await clearSeedUsers();

  const seedUsers = buildSeedUsers();
  const passwordHash = await hashPassword(SEED_PASSWORD);
  const now = new Date();

  console.log(`Creating ${seedUsers.length} seed users...`);

  for (const seedUser of seedUsers) {
    await db.insert(user).values({
      id: seedUser.id,
      name: seedUser.name,
      email: seedUser.email,
      emailVerified: seedUser.emailVerified,
      image: seedUser.image,
      role: seedUser.role,
      banned: seedUser.banned,
      banReason: seedUser.banReason,
      banExpires: seedUser.banExpires,
      createdAt: seedUser.createdAt,
      updatedAt: seedUser.updatedAt,
    });

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: seedUser.id,
      providerId: "credential",
      userId: seedUser.id,
      password: passwordHash,
      createdAt: seedUser.createdAt,
      updatedAt: seedUser.updatedAt,
    });

    if (seedUser.withSession) {
      const sessionCreatedAt = daysAgo(indexSafe(seedUser) % 14, 16);
      await db.insert(session).values({
        id: crypto.randomUUID(),
        token: crypto.randomUUID(),
        userId: seedUser.id,
        expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30),
        createdAt: sessionCreatedAt,
        updatedAt: sessionCreatedAt,
        ipAddress: `192.168.${(indexSafe(seedUser) % 250) + 1}.${(indexSafe(seedUser) % 200) + 10}`,
        userAgent: USER_AGENTS[indexSafe(seedUser) % USER_AGENTS.length],
      });
    }
  }

  const admins = seedUsers.filter((entry) => entry.role === "admin");
  const verified = seedUsers.filter((entry) => entry.emailVerified);
  const banned = seedUsers.filter((entry) => entry.banned);

  console.log("\nSeed complete.");
  console.log(`- Total users: ${seedUsers.length}`);
  console.log(`- Admins: ${admins.length}`);
  console.log(`- Verified: ${verified.length}`);
  console.log(`- Unverified: ${seedUsers.length - verified.length}`);
  console.log(`- Banned: ${banned.length}`);
  console.log(`- With sessions: ${seedUsers.filter((entry) => entry.withSession).length}`);
  console.log(`\nDefault password for all seed users: ${SEED_PASSWORD}`);
  console.log("\nSample accounts:");
  console.log(`- Admin: ${admins[0]?.email}`);
  console.log(`- User: ${seedUsers.find((entry) => entry.role === "user")?.email}`);
  console.log(`- Unverified: ${seedUsers.find((entry) => !entry.emailVerified)?.email}`);
  console.log(`- Banned: ${banned[0]?.email}`);
}

function indexSafe(seedUser: SeedUser) {
  return Number(seedUser.email.match(/user(\d+)@/)?.[1] ?? "0");
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
