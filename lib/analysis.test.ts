import { describe, expect, it } from "vitest";
import { analysisSchema, languageSchema } from "@/lib/analysis";
import { validAnalysis } from "@/test/fixtures";

describe("analysisSchema", () => {
  it("accepts a complete analysis", () => {
    expect(analysisSchema.parse(validAnalysis)).toEqual(validAnalysis);
  });

  it("rejects an unknown verdict", () => {
    expect(analysisSchema.safeParse({ ...validAnalysis, verdict: "maybe" }).success).toBe(false);
  });

  it("rejects an unknown scam type", () => {
    expect(analysisSchema.safeParse({ ...validAnalysis, scamType: "crypto" }).success).toBe(false);
  });

  it("requires every field so the UI never renders holes", () => {
    expect(analysisSchema.safeParse({ ...validAnalysis, explanation: undefined }).success).toBe(false);
  });

  it("allows sender and impersonated organisation to be unknown", () => {
    const result = analysisSchema.safeParse({ ...validAnalysis, message: { ...validAnalysis.message, sender: null }, impersonates: null });
    expect(result.success).toBe(true);
  });
});

describe("languageSchema", () => {
  it("accepts only the supported languages", () => {
    for (const code of ["en", "hi", "bn", "as"]) expect(languageSchema.safeParse(code).success).toBe(true);
    expect(languageSchema.safeParse("fr").success).toBe(false);
  });
});
