import { z } from "zod";
import { synthesizeSpeech } from "@/lib/openrouter";

export const maxDuration = 60;

const requestSchema = z.object({ text: z.string().trim().min(1).max(4000) });

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
  }

  try {
    return new Response(await synthesizeSpeech(parsed.data.text));
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Speech failed. Please try again." }, { status: 502 });
  }
}
