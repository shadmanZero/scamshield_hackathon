// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Checking } from "@/components/checking";
import { strings } from "@/lib/i18n";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("Checking", () => {
  it("walks through the steps on a timer and parks on the last one", () => {
    render(<Checking t={strings.en} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveAttribute("aria-current", "step");

    act(() => vi.advanceTimersByTime(1800));
    expect(items[1]).toHaveAttribute("aria-current", "step");

    act(() => vi.advanceTimersByTime(1800));
    expect(items[2]).toHaveAttribute("aria-current", "step");

    act(() => vi.advanceTimersByTime(10_000));
    expect(items[2]).toHaveAttribute("aria-current", "step");
  });

  it("announces progress to assistive technology", () => {
    render(<Checking t={strings.bn} />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText(strings.bn.checkingHint)).toBeInTheDocument();
  });
});
