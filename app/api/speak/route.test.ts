import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/speak/route";

vi.mock("@/lib/speech", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/speech")>()),
  synthesizeSpeech: vi.fn(),
}));
const { signSpeech, synthesizeSpeech } = await import("@/lib/speech");

beforeEach(() => vi.stubEnv("OPENROUTER_API_KEY", "test-key"));

let client = 0;
function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/speak", {
      method: "POST",
      headers: { "x-forwarded-for": `10.2.${++client % 250}.${client % 250}` },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

afterEach(() => {
  vi.mocked(synthesizeSpeech).mockReset();
  vi.unstubAllEnvs();
});

describe("POST /api/speak", () => {
  it("streams the synthesized audio as WAV", async () => {
    vi.mocked(synthesizeSpeech).mockResolvedValue(new Blob([new Uint8Array(4)], { type: "audio/wav" }));
    const response = await post(await signSpeech("This is a scam."));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("audio/wav");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(synthesizeSpeech).toHaveBeenCalledWith("This is a scam.");
  });

  it("refuses text that this server did not sign", async () => {
    const forged = { ...(await signSpeech("short")), text: "a much longer text to synthesize for free" };
    expect((await post(forged)).status).toBe(403);
    expect((await post({ text: "x", token: "not-a-signature" })).status).toBe(403);
    expect(synthesizeSpeech).not.toHaveBeenCalled();
  });

  it.each([
    ["empty text", { text: "   ", token: "t" }],
    ["text over the limit", { text: "x".repeat(4_001), token: "t" }],
    ["a missing token", { text: "x" }],
    ["a missing body", "{}"],
  ])("rejects %s with 400", async (_label, body) => {
    expect((await post(body)).status).toBe(400);
    expect(synthesizeSpeech).not.toHaveBeenCalled();
  });

  it("answers 502 when synthesis fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(synthesizeSpeech).mockRejectedValue(new Error("boom"));
    expect((await post(await signSpeech("x"))).status).toBe(502);
  });
});
