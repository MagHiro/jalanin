import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/auth/safe-next";

describe("safeNext", () => {
  it.each([null, undefined, "", "https://evil.example", "//evil.example", "/\\evil.example", " /dashboard"])(
    "rejects unsafe destination %j", (value) => expect(safeNext(value)).toBe("/dashboard"),
  );

  it("rejects every ASCII control character before URL normalization", () => {
    for (const code of [...Array.from({ length: 32 }, (_, i) => i), 127]) {
      const value = `/\u002f${String.fromCharCode(code)}evil.example`;
      expect(safeNext(value)).toBe("/dashboard");
      expect(safeNext(`/apply/${String.fromCharCode(code)}123`)).toBe("/dashboard");
      // Tabs/newlines between slashes become protocol-relative in browsers.
      expect(safeNext(`/${String.fromCharCode(code)}/evil.example`)).toBe("/dashboard");
    }
  });

  it("validates decoded query values used by auth and callback", () => {
    const value = new URL("https://jalanin.example/auth/callback?next=%2F%09%2Fevil.example").searchParams.get("next");
    expect(safeNext(value)).toBe("/dashboard");
  });

  it.each(["/", "/apply/123", "/dashboard?tab=applications#saved", "/opportunities?q=hello%20world"])(
    "preserves internal destination %s", (value) => expect(safeNext(value)).toBe(value),
  );
});
