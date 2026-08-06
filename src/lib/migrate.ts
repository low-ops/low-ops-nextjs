import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { getDatabaseUrl } from "@/lib/env";
import { logger } from "@/lib/logger";
import path from "node:path";

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
