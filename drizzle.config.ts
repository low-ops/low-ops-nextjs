import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { getDatabaseUrl } from "./src/lib/env";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
