import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import pg from "pg";

function log(level, message, fields = {}) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...fields,
    }),
  );
}

function getDatabaseUrl() {
  const host = process.env.POSTGRES_HOST;
  const port = process.env.POSTGRES_PORT ?? "5432";
  const database = process.env.POSTGRES_DATABASE;
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;

  if (!host || !database || !user || password === undefined) {
    throw new Error("Missing POSTGRES_* environment variables");
  }

  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

async function main() {
  const pool = new pg.Pool({
    connectionString: getDatabaseUrl(),
  });
  const db = drizzle(pool);
  const migrationsFolder = path.join(process.cwd(), "drizzle");

  try {
    await migrate(db, { migrationsFolder });
    log("info", "Database migrations applied", { migrationsFolder });
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  log("error", "Database migration failed", {
    error: error instanceof Error ? error.message : String(error),
    postgresHost: process.env.POSTGRES_HOST,
    postgresDatabase: process.env.POSTGRES_DATABASE,
  });
  process.exit(1);
});
