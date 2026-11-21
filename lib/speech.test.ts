import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signSpeech, spokenText, synthesizeSpeech, verifySpeech } from "@/lib/speech";
import { validAnalysis } from "@/test/fixtures";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("OPENROUTER_API_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  fetchMock.mockReset();
});

describe("synthesizeSpeech", () => {
  it("wraps the raw PCM in a playable 16-bit mono WAV header", async () => {
    const pcm = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    fetchMock.mockResolvedValue(new Response(pcm));

    const blob = await synthesizeSpeech("hello");
    expect(blob.type).toBe("audio/wav");
    expect(blob.size).toBe(44 + pcm.length);

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const view = new DataView(bytes.buffer);
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("RIFF");
    expect(new TextDecoder().decode(bytes.slice(8, 12))).toBe("WAVE");
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(24_000);
    expect(view.getUint32(40, true)).toBe(pcm.length);
    expect(bytes.slice(44)).toEqual(pcm);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://openrouter.ai/api/v1/audio/speech");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(init.body)).toMatchObject({ input: "hello", response_format: "pcm" });
  });

  it("surfaces an upstream error status", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 503 }));
    await expect(synthesizeSpeech("x")).rejects.toThrow("OpenRouter 503");
  });
});

describe("spokenText", () => {
  it("reads the verdict, explanation and actions in the chosen language", () => {
    expect(spokenText(validAnalysis, "hi")).toBe("यह धोखा है. This is a scam.. Delete it.. Do not click.. Call 1930.");
  });
});

describe("speech tokens", () => {
  it("verifies its own signature and rejects tampering", async () => {
    const speech = await signSpeech("hello");
    expect(speech.token).not.toContain("test-key");
    await expect(verifySpeech(speech)).resolves.toBe(true);
    await expect(verifySpeech({ ...speech, text: "hello!" })).resolves.toBe(false);
    await expect(verifySpeech({ text: "hello", token: "AAAA" })).resolves.toBe(false);
  });

  it("changes with the secret", async () => {
    const first = await signSpeech("hello");
    vi.stubEnv("OPENROUTER_API_KEY", "other-key");
    await expect(verifySpeech(first)).resolves.toBe(false);
  });

  it("refuses to sign without a secret", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    await expect(signSpeech("x")).rejects.toThrow("OPENROUTER_API_KEY");
  });
});
