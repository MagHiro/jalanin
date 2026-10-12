import { defineConfig } from "drizzle-kit";

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
