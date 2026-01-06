import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool as PgPool } from "pg";
import ws from "ws";
import * as schema from "../shared/schema";

neonConfig.webSocketConstructor = ws;

type Db = ReturnType<typeof drizzle<typeof schema>>;

let cachedDb: Db | null = null;

export function getDb(): Db {
  if (cachedDb) return cachedDb;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL must be set. Configure it in .env or Replit Secrets.",
    );
  }

  const isNeon =
    databaseUrl.includes("neon.tech") || databaseUrl.includes("replit");

  const pool: unknown = isNeon
    ? new NeonPool({ connectionString: databaseUrl })
    : new PgPool({ connectionString: databaseUrl });

  cachedDb = drizzle(pool as unknown as Parameters<typeof drizzle>[0], { schema });
  return cachedDb;
}
