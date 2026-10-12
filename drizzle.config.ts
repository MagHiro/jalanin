import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// drizzle-kit is not launched by Next.js; load the same env files as the app.
// Shell/CI environment variables retain priority.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

// drizzle-kit reads SUPABASE_DB_URL (or DATABASE_URL) for push/introspect.
// Migrations themselves live in ./supabase/migrations and are applied by
// `pnpm db:migrate` (scripts/migrate.ts) so local and hosted Supabase stay
// in sync through version-controlled SQL.
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.SUPABASE_DB_URL ??
      process.env.DATABASE_URL ??
      "postgresql://jalanin:jalanin@localhost:54322/jalanin",
  },
});
