import { describe, expect, it } from "vitest";
import { languageLabels, strings } from "@/lib/i18n";

const languages = Object.keys(strings);

function leaves(value: unknown, path: string[] = []): [string, unknown][] {
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
  }
  return [[path.join("."), value]];
}

describe("strings", () => {
  it("covers the four launch languages", () => {
    expect(languages.sort()).toEqual(["as", "bn", "en", "hi"]);
    expect(Object.keys(languageLabels).sort()).toEqual(["as", "bn", "en", "hi"]);
  });

  it("has every key translated in every language", () => {
    const reference = leaves(strings.en).map(([key]) => key);
    for (const code of languages) {
      expect(leaves(strings[code as keyof typeof strings]).map(([key]) => key)).toEqual(reference);
    }
  });

  it("leaves no empty string except the label for a non-scam", () => {
    for (const code of languages) {
      for (const [key, value] of leaves(strings[code as keyof typeof strings])) {
        if (key === "scamType.none") continue;
        expect(value, `${code}.${key}`).toBeTruthy();
      }
    }
  });

  it("keeps the checking steps in sync with the loader", () => {
    for (const code of languages) expect(strings[code as keyof typeof strings].steps).toHaveLength(3);
  });
});
