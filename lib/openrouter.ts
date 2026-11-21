import { z } from "zod";
import { analysisSchema, languageNames, type Analysis, type Language } from "@/lib/analysis";

type Input = {
  language: Language;
  text?: string;
  image?: string;
};

const model = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";

const responseSchema = z.toJSONSchema(analysisSchema);
delete responseSchema.$schema;

function systemPrompt(language: Language) {
  return `You are ScamShield, a fraud analyst for people in India. You examine one SMS, WhatsApp or email message and decide whether it is a scam.

Common Indian scam patterns: fake KYC update or account block warnings, courier or customs fee demands, electricity disconnection threats, work-from-home or part-time job offers, "digital arrest" calls from fake police or CBI, lottery or prize wins, UPI collect requests or "wrong transfer" refund tricks. Genuine banks and government bodies never ask for OTP, PIN, passwords, or to install apps or pay fees through a link.

Rules:
- Transcribe the message exactly. Do not correct spelling.
- Every redFlags.phrase must be copied character-for-character from message.text so it can be highlighted.
- Write explanation, redFlags.reason, whatHappensNext and whatToDoNow in ${languageNames[language]}, using very simple everyday words that an older person with little schooling understands. Avoid technical terms.
- If the message is safe, set scamType to "none", riskScore below 20, and leave redFlags and whatHappensNext empty.
- Never mention any website address or phone number in your explanations, not even a genuine one. The app shows verified contacts separately.`;
}

function userContent({ text, image }: Input) {
  const parts: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [];
  if (image) parts.push({ type: "image_url", image_url: { url: image } });
  if (text) parts.push({ type: "text", text: `Message:\n${text}` });
  else parts.push({ type: "text", text: "Analyse the message in this screenshot." });
  return parts;
}

function requestHeaders() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "X-Title": "ScamShield",
  };
}

const speechSampleRate = 24_000;

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
  header.setUint32(24, speechSampleRate, true);
  header.setUint32(28, speechSampleRate * 2, true);
  header.setUint16(32, 2, true);
  header.setUint16(34, 16, true);
  writeTag(36, "data");
  header.setUint32(40, pcmByteLength, true);
  return header.buffer;
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

export async function analyzeMessage(input: Input): Promise<Analysis> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: requestHeaders(),
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt(input.language) },
        { role: "user", content: userContent(input) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "scam_analysis", strict: true, schema: responseSchema },
      },
      // Only route to providers that honour the JSON schema, so the reply is always parseable.
      provider: { require_parameters: true },
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const analysis = analysisSchema.parse(JSON.parse(data.choices[0].message.content));

  // Models occasionally paraphrase a flag; a phrase that is not in the text cannot be highlighted.
  analysis.redFlags = analysis.redFlags.filter((flag) => analysis.message.text.includes(flag.phrase));
  return analysis;
}
