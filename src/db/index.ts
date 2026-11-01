import * as schema from "./schema";
import { getDatabaseUrl } from "@/lib/env";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

type AppDatabase = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as typeof globalThis & {
  __appDb?: AppDatabase;
};

export function getDb() {
  if (!globalForDb.__appDb) {
    globalForDb.__appDb = drizzle(getDatabaseUrl(), { schema });
  }

  return globalForDb.__appDb;
}

export const db = new Proxy({} as AppDatabase, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  },
});
