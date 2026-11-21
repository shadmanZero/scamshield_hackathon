// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Home } from "@/components/home";
import { strings } from "@/lib/i18n";
import { samples } from "@/lib/samples";

function renderHome(overrides: Partial<Parameters<typeof Home>[0]> = {}) {
  const props = { t: strings.en, language: "en" as const, onLanguageChange: vi.fn(), onSubmit: vi.fn(), ...overrides };
  render(<Home {...props} />);
  return props;
}

describe("Home", () => {
  it("offers all four languages and reports a change", () => {
    const { onLanguageChange } = renderHome();
    const group = screen.getByRole("group", { name: "Language" });
    expect(group.querySelectorAll("button")).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "हिंदी" }));
    expect(onLanguageChange).toHaveBeenCalledWith("hi");
  });

  it("submits a sample message on tap", () => {
    const { onSubmit } = renderHome();
    fireEvent.click(screen.getByRole("button", { name: /Bank message/ }));
    expect(onSubmit).toHaveBeenCalledWith({ text: samples[0].text });
  });

  it("reveals the paste box and submits trimmed text", () => {
    const { onSubmit } = renderHome();
    expect(screen.queryByRole("textbox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Paste text" }));
    expect(screen.getByRole("button", { name: "Paste text" })).toHaveAttribute("aria-expanded", "true");

    const check = screen.getByRole("button", { name: "Check message" });
    expect(check).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: "Paste text" }), { target: { value: "  Share OTP  " } });
    fireEvent.click(check);
    expect(onSubmit).toHaveBeenCalledWith({ text: "Share OTP" });
  });

  it("hands a chosen screenshot to the parent untouched", () => {
    const { onSubmit } = renderHome();
    const file = new File(["x"], "shot.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText(/Upload screenshot/), { target: { files: [file] } });
    expect(onSubmit).toHaveBeenCalledWith({ file });
  });

  it("announces an error", () => {
    renderHome({ error: "Could not check this message." });
    expect(screen.getByRole("alert")).toHaveTextContent("Could not check this message.");
  });
});
