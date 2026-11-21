import { z } from "zod";

export const languageSchema = z.enum(["en", "hi", "bn", "as"]);
export type Language = z.infer<typeof languageSchema>;

export const languageNames: Record<Language, string> = {
  en: "English",
  hi: "Hindi",
  bn: "Bengali",
  as: "Assamese",
};

export const analysisSchema = z.object({
  message: z.object({
    text: z.string().describe("The full message text exactly as written, transcribed from the screenshot if one was given"),
    sender: z.string().nullable().describe("Sender name, phone number or ID as shown, or null if not visible"),
    links: z.array(z.string()).describe("Every URL in the message exactly as written, including shortened ones"),
  }),
  verdict: z.enum(["scam", "suspicious", "safe"]),
  riskScore: z.number().describe("0 (certainly safe) to 100 (certainly a scam)"),
  scamType: z.enum([
    "kyc_update",
    "courier",
    "electricity_bill",
    "job_offer",
    "digital_arrest",
    "lottery",
    "upi",
    "other",
    "none",
  ]),
  impersonates: z.string().nullable().describe("The organisation the message pretends to come from, in English, or null"),
  redFlags: z.array(
    z.object({
      phrase: z.string().describe("An exact substring copied character-for-character from message.text"),
      reason: z.string().describe("One short sentence in the user's language"),
    }),
  ),
  whatHappensNext: z.array(z.string()).describe("3 to 5 short steps, in the user's language, of what the scammer does if the user follows the message. Empty if safe"),
  explanation: z.string().describe("2 to 4 very simple sentences in the user's language explaining the verdict"),
  whatToDoNow: z.array(z.string()).describe("Exactly 3 short actions in the user's language"),
});

export type Analysis = z.infer<typeof analysisSchema>;
