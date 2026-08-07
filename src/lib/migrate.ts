import { getDatabaseUrl } from "@/lib/env";
import { logger } from "@/lib/logger";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "node:path";
import { Pool } from "pg";

export async function runMigrations() {
  const pool = new Pool({
    connectionString: getDatabaseUrl(),
  });

  const db = drizzle(pool);
  const migrationsFolder = path.join(process.cwd(), "drizzle");

  try {
    await migrate(db, { migrationsFolder });
    logger.info("Database migrations applied", { migrationsFolder });
  } finally {
    await pool.end();
  }
}
