import { describe, expect, it } from "vitest";
import { jsonError, jsonOk, limitByClient, rejectOversized } from "@/lib/guards";

const request = (headers: Record<string, string>) => new Request("http://localhost/api", { headers });

describe("limitByClient", () => {
  it("keys on the proxy-appended last hop and answers 429 once the limit is passed", async () => {
    const forwarded = { "x-forwarded-for": "203.0.113.7, 10.0.0.1" };
    for (let i = 0; i < 2; i++) expect(limitByClient(request(forwarded), 2)).toBeNull();
    const response = limitByClient(request(forwarded), 2);
    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBe("60");
    await expect(response?.json()).resolves.toMatchObject({ error: expect.stringContaining("Too many") });
    // A client rotating the first hop still lands in the same bucket.
    expect(limitByClient(request({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" }), 2)?.status).toBe(429);
  });

  it("buckets clients with no forwarded address together", () => {
    for (let i = 0; i < 3; i++) limitByClient(request({}), 3);
    expect(limitByClient(request({}), 3)?.status).toBe(429);
  });
});

describe("rejectOversized", () => {
  it("lets small and undeclared bodies through", () => {
    expect(rejectOversized(request({ "content-length": "100" }), 1000)).toBeNull();
    expect(rejectOversized(request({}), 1000)).toBeNull();
  });

  it("answers 413 for a declared size above the limit", async () => {
    const response = rejectOversized(request({ "content-length": "1001" }), 1000);
    expect(response?.status).toBe(413);
    await expect(response?.json()).resolves.toEqual({ error: "Request body is too large." });
  });
});

describe("json responses", () => {
  it("never allow caching", () => {
    expect(jsonOk({ a: 1 }).headers.get("Cache-Control")).toBe("no-store");
    expect(jsonError("x", 400).headers.get("Cache-Control")).toBe("no-store");
  });
});
