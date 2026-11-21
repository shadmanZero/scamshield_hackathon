import { z } from "zod";
import { jsonError, limitByClient, rejectOversized } from "@/lib/guards";
import { synthesizeSpeech, verifySpeech } from "@/lib/speech";

export const maxDuration = 60;

const requestSchema = z.object({ text: z.string().trim().min(1).max(4_000), token: z.string().min(1) });

export async function POST(request: Request) {
  const rejected = limitByClient(request, 20) ?? rejectOversized(request, 20_000);
  if (rejected) return rejected;

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(z.prettifyError(parsed.error), 400);

  try {
    if (!(await verifySpeech(parsed.data))) return jsonError("Speech text was not issued by this server.", 403);
    return new Response(await synthesizeSpeech(parsed.data.text), {
      headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error(error);
    return jsonError("Speech failed. Please try again.", 502);
  }
}
