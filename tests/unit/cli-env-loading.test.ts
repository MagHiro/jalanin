import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

// Exercise the actual standalone CLI preloader in a fresh Node process.
// No database credentials or real developer .env files are touched.
const fixture = mkdtempSync(join(tmpdir(), "jalanin-env-test-"));
const moduleUrl = pathToFileURL(resolve(process.cwd(), "scripts/load-env.ts")).href;

function readFromCli(exportedValue?: string): string {
  const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: "development" };
  delete env.JALANIN_ENV_TEST_VALUE;
  delete env.__NEXT_PROCESSED_ENV;
  if (exportedValue !== undefined) {
    env.JALANIN_ENV_TEST_VALUE = exportedValue;
  }

  const script = `process.chdir(${JSON.stringify(fixture)});
    await import(${JSON.stringify(moduleUrl)});
    process.stdout.write(process.env.JALANIN_ENV_TEST_VALUE ?? "unset");`;

  const output = spawnSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", script],
    { cwd: process.cwd(), env, encoding: "utf8", timeout: 15000 },
  );
  expect(output.status, output.stderr || output.error?.message).toBe(0);
  return output.stdout.trim();
}

afterAll(() => rmSync(fixture, { recursive: true, force: true }));

describe("standalone script environment loading", () => {
  it("reads .env.local ahead of .env when neither variable is exported", () => {
    writeFileSync(join(fixture, ".env"), "JALANIN_ENV_TEST_VALUE=from-env\n");
    writeFileSync(join(fixture, ".env.local"), "JALANIN_ENV_TEST_VALUE=from-env-local\n");
    expect(readFromCli()).toBe("from-env-local");
  });

  it("keeps an exported environment variable ahead of .env.local", () => {
    expect(readFromCli("from-shell")).toBe("from-shell");
  });
});
