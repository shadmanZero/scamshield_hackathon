import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validAnalysis } from "@/test/fixtures";
import { POST } from "@/app/api/analyze/route";

vi.mock("@/lib/openrouter", () => ({ analyzeMessage: vi.fn() }));
const { analyzeMessage } = await import("@/lib/openrouter");

let client = 0;
function post(body: unknown) {
  // A fresh forwarded address per request keeps the rate limiter out of these tests.
  return POST(
    new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": `10.1.${++client % 250}.${client % 250}` },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

beforeEach(() => vi.stubEnv("OPENROUTER_API_KEY", "test-key"));

afterEach(() => {
  vi.mocked(analyzeMessage).mockReset();
  vi.unstubAllEnvs();
});

describe("POST /api/analyze", () => {
  it("returns the analysis for valid text", async () => {
    vi.mocked(analyzeMessage).mockResolvedValue(validAnalysis);
    const response = await post({ language: "en", text: "  Share OTP  " });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.json();
    expect(body).toMatchObject(validAnalysis);
    expect(body.speech.text).toBe("This is a scam. This is a scam.. Delete it.. Do not click.. Call 1930.");
    expect(body.speech.token).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(analyzeMessage).toHaveBeenCalledWith({ language: "en", text: "Share OTP" });
  });

  it("accepts a screenshot without text", async () => {
    vi.mocked(analyzeMessage).mockResolvedValue(validAnalysis);
    const response = await post({ language: "hi", image: "data:image/png;base64,AAAA" });
    expect(response.status).toBe(200);
  });

  it.each([
    ["an unsupported language", { language: "fr", text: "x" }],
    ["neither text nor image", { language: "en" }],
    ["an image that is not a data URL", { language: "en", image: "https://evil.example/x.png" }],
    ["a non-image data URL", { language: "en", image: "data:text/html;base64,AAAA" }],
    ["text over the size limit", { language: "en", text: "x".repeat(5_001) }],
    ["a body that is not JSON", "not json"],
  ])("rejects %s with 400", async (_label, body) => {
    const response = await post(body);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toHaveProperty("error");
    expect(analyzeMessage).not.toHaveBeenCalled();
  });

  it("rejects an oversized body before reading it", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-length": "99999999", "x-forwarded-for": "192.0.2.50" },
        body: JSON.stringify({ language: "en", text: "x" }),
      }),
    );
    expect(response.status).toBe(413);
    expect(analyzeMessage).not.toHaveBeenCalled();
  });

  it("hides upstream failures behind a generic 502", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(analyzeMessage).mockRejectedValue(new Error("OpenRouter 500: secret details"));
    const response = await post({ language: "en", text: "x" });
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).not.toContain("secret");
  });

  it("rate limits a single client", async () => {
    vi.mocked(analyzeMessage).mockResolvedValue(validAnalysis);
    const request = () =>
      POST(
        new Request("http://localhost/api/analyze", {
          method: "POST",
          headers: { "x-forwarded-for": "198.51.100.9" },
          body: JSON.stringify({ language: "en", text: "x" }),
        }),
      );
    for (let i = 0; i < 20; i++) expect((await request()).status).toBe(200);
    expect((await request()).status).toBe(429);
  });
});
