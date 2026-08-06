import { getPostgresConfig } from "@/lib/env";
import { hashPassword } from "better-auth/crypto";
import { like, or } from "drizzle-orm";
import { db } from "./index";
import { account, session, user } from "./schema";

const USER_COUNT = 50;

const DEFAULT_ADMIN = {
  name: "Admin User",
  email: "admin@gmail.com",
  password: "admin",
} as const;

const SEED_EMAIL_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
] as const;

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
  password: string;
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

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

function buildEmail(firstName: string, lastName: string, index: number) {
  const first = normalizeName(firstName);
  const last = normalizeName(lastName);
  const domain = SEED_EMAIL_DOMAINS[index % SEED_EMAIL_DOMAINS.length];
  const birthYear = 1985 + (index % 15);
  const unique = index + 1;

  const localPart = [
    `${first}.${last}${unique}`,
    `${first}${last}${birthYear}`,
    `${first}.${last}${birthYear}`,
    `${first.charAt(0)}${last}${unique}`,
    `${first}_${last}${unique}`,
    `${first}${last.charAt(0)}${unique}`,
    `${first}${unique}`,
    `${first}.${last}.${unique}`,
  ][index % 8];

  return {
    email: `${localPart}@${domain}`,
    password: localPart,
  };
}

function daysAgo(days: number, hour = 12) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function buildDefaultAdminUser(): SeedUser {
  return {
    id: crypto.randomUUID(),
    name: DEFAULT_ADMIN.name,
    email: DEFAULT_ADMIN.email,
    password: DEFAULT_ADMIN.password,
    emailVerified: true,
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=admin%40gmail.com",
    role: "admin",
    banned: false,
    banReason: null,
    banExpires: null,
    createdAt: daysAgo(120, 9),
    updatedAt: daysAgo(1, 10),
    withSession: true,
  };
}

function buildSeedUsers(): SeedUser[] {
  const generatedUsers = Array.from({ length: USER_COUNT }, (_, index) => {
    const number = index + 1;
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

    const { email, password } = buildEmail(firstName, lastName, index);

    return {
      id: crypto.randomUUID(),
      name: `${firstName} ${lastName}`,
      email,
      password,
      emailVerified,
      image: hasImage
        ? `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(email)}`
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

  return [buildDefaultAdminUser(), ...generatedUsers] as SeedUser[];
}

async function clearSeedUsers() {
  await db
    .delete(user)
    .where(
      or(
        ...SEED_EMAIL_DOMAINS.map((domain) => like(user.email, `%@${domain}`)),
      ),
    );
}

async function seed() {
  getPostgresConfig();

  console.log("Clearing existing seed users...");
  await clearSeedUsers();

  const seedUsers = buildSeedUsers();
  const now = new Date();

  console.log(`Creating ${seedUsers.length} seed users...`);

  for (const seedUser of seedUsers) {
    const passwordHash = await hashPassword(seedUser.password);

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
  console.log(
    `- With sessions: ${seedUsers.filter((entry) => entry.withSession).length}`,
  );
  console.log(
    "\nPassword for each user is the email local part (everything before @).",
  );
  console.log("\nSample accounts:");
  console.log(
    `- Default admin: ${DEFAULT_ADMIN.email} / ${DEFAULT_ADMIN.password}`,
  );
  console.log(
    `- Admin: ${admins.find((entry) => entry.email !== DEFAULT_ADMIN.email)?.email ?? admins[0]?.email} / ${admins.find((entry) => entry.email !== DEFAULT_ADMIN.email)?.password ?? admins[0]?.password}`,
  );
  console.log(
    `- User: ${seedUsers.find((entry) => entry.role === "user")?.email} / ${seedUsers.find((entry) => entry.role === "user")?.password}`,
  );
  console.log(
    `- Unverified: ${seedUsers.find((entry) => !entry.emailVerified)?.email} / ${seedUsers.find((entry) => !entry.emailVerified)?.password}`,
  );
  console.log(`- Banned: ${banned[0]?.email} / ${banned[0]?.password}`);
}

function indexSafe(seedUser: SeedUser) {
  return seedUser.email
    .split("@")[0]
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
