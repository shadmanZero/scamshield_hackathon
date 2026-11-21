import { z } from "zod";
import { languageSchema } from "@/lib/analysis";
import { jsonError, jsonOk, limitByClient, rejectOversized } from "@/lib/guards";
import { analyzeMessage } from "@/lib/openrouter";
import { signSpeech, spokenText } from "@/lib/speech";

export const maxDuration = 60;

// A 1600px JPEG from the browser compressor is well under 1.5 MB of base64; anything larger is not a screenshot.
const maxImageChars = 4_000_000;

const requestSchema = z
  .object({
    language: languageSchema,
    text: z.string().trim().min(1).max(5_000).optional(),
    image: z
      .string()
      .regex(/^data:image\/(jpeg|png|webp);base64,/)
      .max(maxImageChars)
      .optional(),
  })
  .refine((body) => body.text || body.image, { message: "Provide text or image" });

export async function POST(request: Request) {
  const rejected = limitByClient(request, 20) ?? rejectOversized(request, maxImageChars + 10_000);
  if (rejected) return rejected;

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(z.prettifyError(parsed.error), 400);

  try {
    const analysis = await analyzeMessage(parsed.data);
    const speech = await signSpeech(spokenText(analysis, parsed.data.language));
    return jsonOk({ ...analysis, speech });
  } catch (error) {
    console.error(error);
    return jsonError("Analysis failed. Please try again.", 502);
  }
}
