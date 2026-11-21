import { describe, expect, it } from "vitest";
import { rateLimited } from "@/lib/rate-limit";

describe("rateLimited", () => {
  it("allows up to the limit inside a minute and blocks the next call", () => {
    const start = 1_000_000;
    for (let i = 0; i < 3; i++) expect(rateLimited("a", 3, start + i)).toBe(false);
    expect(rateLimited("a", 3, start + 10)).toBe(true);
  });

  it("forgets calls older than a minute", () => {
    const start = 2_000_000;
    for (let i = 0; i < 3; i++) rateLimited("b", 3, start + i);
    expect(rateLimited("b", 3, start + 60_001)).toBe(false);
  });

  it("counts clients separately", () => {
    const start = 3_000_000;
    for (let i = 0; i < 3; i++) rateLimited("c", 3, start);
    expect(rateLimited("d", 3, start)).toBe(false);
  });
});

describe("table cap", () => {
  it("resets the table instead of growing without bound", () => {
    const start = 4_000_000;
    for (let i = 0; i <= 10_000; i++) rateLimited(`client-${i}`, 1, start);
    rateLimited("client-0", 1, start + 1);
    expect(rateLimited("client-0", 1, start + 2)).toBe(true);
  });
});
