import "server-only";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Privileged server-side database client.
//
// SECURITY: this connection bypasses Supabase RLS by design (service-role /
// direct DATABASE_URL). It MUST only be used from trusted server code
// (Server Components, Server Actions, Route Handlers, scripts) AFTER explicit
// authorization via src/lib/auth/require.ts (requireStudent / requireAdmin)
// plus ownership checks. Never import this module from client components;
// never expose DATABASE_URL or service keys to the browser.

declare global {
  // eslint-disable-next-line no-var
  var __jalaninPool: Pool | undefined;
}

function getPool(): Pool {
  if (!global.__jalaninPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not configured. See .env.example.");
    }
    // Serverless-safe pooling defaults for Vercel + Supabase (PRD NFR).
    global.__jalaninPool = new Pool({
      connectionString,
      max: Number(process.env.PG_POOL_MAX ?? 5),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return global.__jalaninPool;
}

export const db = drizzlePg(getPool(), { schema });

export type Db = typeof db;
