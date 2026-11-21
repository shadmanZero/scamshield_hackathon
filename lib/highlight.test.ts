import { describe, expect, it } from "vitest";
import { segmentMessage } from "@/lib/highlight";

const text = "Dear customer, your account will be blocked. Share OTP now.";

describe("segmentMessage", () => {
  it("returns the whole text as one plain segment when nothing is flagged", () => {
    expect(segmentMessage(text, [])).toEqual([{ text }]);
  });

  it("wraps each phrase and keeps the original phrase index", () => {
    expect(segmentMessage(text, ["Share OTP", "account will be blocked"])).toEqual([
      { text: "Dear customer, your " },
      { text: "account will be blocked", flag: 1 },
      { text: ". " },
      { text: "Share OTP", flag: 0 },
      { text: " now." },
    ]);
  });

  it("skips phrases that overlap an earlier match", () => {
    expect(segmentMessage(text, ["your account", "account will"])).toEqual([
      { text: "Dear customer, " },
      { text: "your account", flag: 0 },
      { text: " will be blocked. Share OTP now." },
    ]);
  });

  it("ignores phrases that are not in the text", () => {
    expect(segmentMessage(text, ["refund"])).toEqual([{ text }]);
  });

  it("handles a phrase at the very start and the very end", () => {
    expect(segmentMessage("abc", ["abc"])).toEqual([{ text: "abc", flag: 0 }]);
    expect(segmentMessage("x abc", ["x", "abc"])).toEqual([{ text: "x", flag: 0 }, { text: " " }, { text: "abc", flag: 1 }]);
  });

  it("highlights every occurrence of a repeated phrase", () => {
    expect(segmentMessage("OTP now. Send OTP.", ["OTP"])).toEqual([
      { text: "OTP", flag: 0 },
      { text: " now. Send " },
      { text: "OTP", flag: 0 },
      { text: "." },
    ]);
  });

  it("ignores an empty phrase", () => {
    expect(segmentMessage("abc", [""])).toEqual([{ text: "abc" }]);
  });
});
