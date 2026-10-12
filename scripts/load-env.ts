/**
 * Standalone scripts don't run inside the Next.js runtime and therefore
 * don't automatically read .env.local/.env.
 *
 * Match Next.js environment-file resolution for local development:
 * process.env > .env.development.local > .env.local >
 * .env.development > .env. In production NODE_ENV, Next.js uses
 * the production equivalents and ignores .env.local for tests.
 *
 * Never print credentials. Existing exported variables (e.g. GitHub Actions
 * DATABASE_URL) take precedence over values in environment files.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
