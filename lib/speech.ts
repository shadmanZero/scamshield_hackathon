import { type Analysis, type Language } from "@/lib/analysis";
import { strings } from "@/lib/i18n";
import { requestHeaders } from "@/lib/openrouter";

export type Speech = { text: string; token: string };

const sampleRate = 24_000;

function wavHeader(pcmByteLength: number) {
  const header = new DataView(new ArrayBuffer(44));
  const writeTag = (offset: number, tag: string) => new Uint8Array(header.buffer, offset, 4).set(new TextEncoder().encode(tag));
  writeTag(0, "RIFF");
  header.setUint32(4, 36 + pcmByteLength, true);
  writeTag(8, "WAVE");
  writeTag(12, "fmt ");
  header.setUint32(16, 16, true);
  header.setUint16(20, 1, true);
  header.setUint16(22, 1, true);
  header.setUint32(24, sampleRate, true);
  header.setUint32(28, sampleRate * 2, true);
  header.setUint16(32, 2, true);
  header.setUint16(34, 16, true);
  writeTag(36, "data");
  header.setUint32(40, pcmByteLength, true);
  return header.buffer;
}

export function spokenText(analysis: Analysis, language: Language) {
  return [strings[language].verdict[analysis.verdict], analysis.explanation, ...analysis.whatToDoNow].join(". ");
}

// Speech is paid per character, so only text this server composed may be synthesized. The API key
// doubles as the signing secret: it never leaves the server and an HMAC cannot be reversed into it.
async function signingKey(usage: KeyUsage) {
  const secret = process.env.OPENROUTER_API_KEY;
  if (!secret) throw new Error("OPENROUTER_API_KEY is not set");
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

export async function signSpeech(text: string): Promise<Speech> {
  const signature = await crypto.subtle.sign("HMAC", await signingKey("sign"), new TextEncoder().encode(text));
  return { text, token: Buffer.from(signature).toString("base64url") };
}

export async function verifySpeech({ text, token }: Speech): Promise<boolean> {
  return crypto.subtle.verify("HMAC", await signingKey("verify"), Buffer.from(token, "base64url"), new TextEncoder().encode(text));
}

export async function synthesizeSpeech(text: string): Promise<Blob> {
  const response = await fetch("https://openrouter.ai/api/v1/audio/speech", {
    method: "POST",
    headers: requestHeaders(),
    body: JSON.stringify({
      // The cheapest speech model on OpenRouter that speaks Hindi, Bengali and Assamese.
      model: "google/gemini-3.8-flash-lite-tts",
      input: text,
      voice: "Sulafat",
      instructions: "Speak slowly, clearly and calmly, as if to an older person.",
      response_format: "pcm",
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}: ${await response.text()}`);
  }

  // Gemini TTS only returns headerless PCM (16-bit mono), which browsers cannot play.
  const pcm = await response.arrayBuffer();
  return new Blob([wavHeader(pcm.byteLength), pcm], { type: "audio/wav" });
}
