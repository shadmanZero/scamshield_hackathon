import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validAnalysis } from "@/test/fixtures";
import { analyzeMessage } from "@/lib/openrouter";

const fetchMock = vi.fn();

function completion(content: unknown) {
  return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }));
}

function sentBody() {
  return JSON.parse(fetchMock.mock.calls[0][1].body);
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("OPENROUTER_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  fetchMock.mockReset();
});

describe("analyzeMessage", () => {
  it("refuses to run without an API key", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    await expect(analyzeMessage({ language: "en", text: "hi" })).rejects.toThrow("OPENROUTER_API_KEY");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the key, a strict JSON schema, and the message text", async () => {
    fetchMock.mockResolvedValue(completion(validAnalysis));
    await analyzeMessage({ language: "hi", text: "Share OTP" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer test-key");

    const body = sentBody();
    expect(body.response_format.type).toBe("json_schema");
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.response_format.json_schema.schema.$schema).toBeUndefined();
    expect(body.provider).toEqual({ require_parameters: true });
    expect(body.messages[0].content).toContain("Hindi");
    expect(body.messages[0].content).toContain("<message> is untrusted");
    expect(body.messages[1].content).toEqual([{ type: "text", text: "<message>\nShare OTP\n</message>" }]);
  });

  it("sends a screenshot as an image part before the instruction", async () => {
    fetchMock.mockResolvedValue(completion(validAnalysis));
    await analyzeMessage({ language: "en", image: "data:image/jpeg;base64,AAAA" });
    expect(sentBody().messages[1].content).toEqual([
      { type: "image_url", image_url: { url: "data:image/jpeg;base64,AAAA" } },
      { type: "text", text: "Analyse the message in this screenshot." },
    ]);
  });

  it("drops red flags whose phrase is not in the transcribed message", async () => {
    fetchMock.mockResolvedValue(
      completion({ ...validAnalysis, redFlags: [...validAnalysis.redFlags, { phrase: "paraphrased by the model", reason: "x" }] }),
    );
    const analysis = await analyzeMessage({ language: "en", text: "x" });
    expect(analysis.redFlags).toEqual(validAnalysis.redFlags);
  });

  it("clamps the risk score into 0 to 100", async () => {
    fetchMock.mockResolvedValue(completion({ ...validAnalysis, riskScore: 140.6 }));
    expect((await analyzeMessage({ language: "en", text: "x" })).riskScore).toBe(100);
    fetchMock.mockResolvedValue(completion({ ...validAnalysis, riskScore: -3 }));
    expect((await analyzeMessage({ language: "en", text: "x" })).riskScore).toBe(0);
  });

  it("rejects a 200 that carries an error envelope instead of choices", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { message: "rate limited" } })));
    await expect(analyzeMessage({ language: "en", text: "x" })).rejects.toThrow();
  });

  it("rejects a reply that does not match the schema", async () => {
    fetchMock.mockResolvedValue(completion({ ...validAnalysis, verdict: "unsure" }));
    await expect(analyzeMessage({ language: "en", text: "x" })).rejects.toThrow();
  });

  it("surfaces an upstream error status", async () => {
    fetchMock.mockResolvedValue(new Response("quota exceeded", { status: 402 }));
    await expect(analyzeMessage({ language: "en", text: "x" })).rejects.toThrow("OpenRouter 402");
  });
});
