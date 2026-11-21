// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeToggle } from "@/components/theme-toggle";
import { strings } from "@/lib/i18n";

afterEach(() => {
  document.documentElement.classList.remove("dark");
  localStorage.clear();
});

describe("ThemeToggle", () => {
  it("switches the root class and remembers the choice", async () => {
    render(<ThemeToggle t={strings.en} />);
    const button = screen.getByRole("button", { name: "Switch to dark mode" });
    fireEvent.click(button);
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.theme).toBe("dark");

    fireEvent.click(await screen.findByRole("button", { name: "Switch to light mode" }));
    expect(document.documentElement).not.toHaveClass("dark");
    expect(localStorage.theme).toBe("light");
  });
});
