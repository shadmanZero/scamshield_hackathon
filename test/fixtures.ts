import type { Analysis } from "@/lib/analysis";
import type { AnalysisResult } from "@/components/result";

export const validAnalysis: Analysis = {
  message: { text: "Your account will be blocked. Share OTP.", sender: "VM-SBIINB", links: ["http://sbi-kyc.xyz"] },
  verdict: "scam",
  riskScore: 95,
  scamType: "kyc_update",
  impersonates: "State Bank of India",
  redFlags: [{ phrase: "Share OTP", reason: "Banks never ask for OTP." }],
  whatHappensNext: ["You enter your OTP.", "Money leaves your account."],
  explanation: "This is a scam.",
  whatToDoNow: ["Delete it.", "Do not click.", "Call 1930."],
};

export const validResult: AnalysisResult = { ...validAnalysis, speech: { text: "This is a scam. Delete it.", token: "signed" } };
