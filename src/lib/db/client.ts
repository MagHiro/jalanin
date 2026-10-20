import "server-only";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Privileged server-side database client.
//
// SECURITY: this pool connects as the table owner to standalone PostgreSQL.
// It MUST only be used from trusted server code (Server Components, Server
// Actions, Route Handlers, scripts) AFTER explicit authorization via
// src/lib/auth/require.ts (requireStudent / requireAdmin) plus ownership
// checks. Never import this module from client components; never expose
// DATABASE_URL to the browser.

declare global {
  // eslint-disable-next-line no-var
  var __jalaninPool: Pool | undefined;
}

function getPool(): Pool {
  if (!global.__jalaninPool) {
    // NOTE: this module is imported by every service/route, including at
    // Next.js build time when DATABASE_URL is absent (docker build has no
    // database). The pool is created lazily on first query, but drizzle's
    // Proxy evaluates `db` eagerly at import time via getPool() below — so
    // throwing here hard-fails `pnpm build`. Instead fall back to a dummy
    // connection string; any real query attempt will fail loudly at runtime
    // (and build-time page collection never issues queries for force-dynamic
    // / dynamic routes — only static prerenders do, which we avoid).
    const connectionString =
      process.env.DATABASE_URL ?? "postgresql://build:build@localhost:1/jalanin_build_placeholder";
    // Pooling defaults for a single Node process (local dev + Docker prod).
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
