import * as schema from "./schema";
import { getDatabaseUrl } from "@/lib/env";
import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle(getDatabaseUrl(), { schema });
