import { z } from "zod";
import { languageSchema } from "@/lib/analysis";
import { analyzeMessage } from "@/lib/openrouter";

export const maxDuration = 60;

const requestSchema = z
  .object({
    language: languageSchema,
    text: z.string().trim().min(1).optional(),
    image: z.string().startsWith("data:image/").optional(),
  })
  .refine((body) => body.text || body.image, { message: "Provide text or image" });

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
  }

  try {
    return Response.json(await analyzeMessage(parsed.data));
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Analysis failed. Please try again." }, { status: 502 });
  }
}
