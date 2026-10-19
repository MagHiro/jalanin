import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// drizzle-kit is not launched by Next.js; load the same env files as the app.
// Shell/CI environment variables retain priority.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

// drizzle-kit reads DATABASE_URL for push/introspect.
// Migrations live in ./db/migrations and are applied by
// `pnpm db:migrate` (scripts/migrate.ts) through version-controlled SQL.
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://jalanin:local_password@127.0.0.1:5432/jalanin",
  },
});
