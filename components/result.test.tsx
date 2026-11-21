// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Result } from "@/components/result";
import { strings } from "@/lib/i18n";
import { validResult } from "@/test/fixtures";

afterEach(() => vi.unstubAllGlobals());

describe("Result", () => {
  it("leads with the verdict, the scam type and an accessible risk meter", () => {
    render(<Result analysis={validResult} t={strings.hi} onReset={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(strings.hi.verdict.scam);
    expect(screen.getByText(strings.hi.scamType.kyc_update)).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: strings.hi.riskScore })).toHaveAttribute("aria-valuenow", "95");
    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
  });

  it("numbers each highlighted phrase to match its reason", () => {
    render(<Result analysis={validResult} t={strings.en} onReset={vi.fn()} />);
    const marks = document.querySelectorAll("mark");
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveTextContent("Share OTP1");
    expect(marks[0]).toHaveAttribute("aria-describedby", "flag-0");
    expect(document.getElementById("flag-0")).toHaveTextContent("Banks never ask for OTP.");
    expect(screen.getByText("Banks never ask for OTP.")).toBeInTheDocument();
    expect(screen.getByText("http://sbi-kyc.xyz")).toBeInTheDocument();
  });

  it("offers the helpline only when the message is not safe", () => {
    const { unmount } = render(<Result analysis={validResult} t={strings.en} onReset={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Call 1930/ })).toHaveAttribute("href", "tel:1930");
    expect(screen.getByRole("button", { name: /cybercrime.gov.in/ })).toHaveAttribute("rel", "noreferrer");
    unmount();

    render(
      <Result
        analysis={{ ...validResult, verdict: "safe", scamType: "none", redFlags: [], whatHappensNext: [] }}
        t={strings.en}
        onReset={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: /Call 1930/ })).toBeNull();
    expect(screen.queryByText(strings.en.redFlags)).toBeNull();
    expect(screen.queryByText(strings.en.whatHappensNext)).toBeNull();
  });

  it("falls back to WhatsApp when the native share sheet is unavailable", () => {
    const open = vi.fn();
    vi.stubGlobal("open", open);
    render(<Result analysis={validResult} t={strings.en} onReset={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Warn family" }));
    expect(open).toHaveBeenCalledTimes(1);
    const [url, target, features] = open.mock.calls[0];
    expect(url).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(decodeURIComponent(url)).toContain(validResult.explanation);
    expect(target).toBe("_blank");
    expect(features).toBe("noopener");
  });

  it("uses the native share sheet when the browser has one", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    render(<Result analysis={validResult} t={strings.en} onReset={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Warn family" }));
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: "ScamShield" }));
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  });

  it("lets the user start over", () => {
    const onReset = vi.fn();
    render(<Result analysis={validResult} t={strings.en} onReset={onReset} />);
    fireEvent.click(screen.getByRole("button", { name: "Check another" }));
    expect(onReset).toHaveBeenCalled();
  });
});

describe("Result listen button", () => {
  it("reflects the speech state", async () => {
    vi.resetModules();
    const toggle = vi.fn();
    vi.doMock("@/hooks/use-speech", () => ({ useSpeech: () => ({ status: "loading", toggle }) }));
    const { Result: MockedResult } = await import("@/components/result");
    render(<MockedResult analysis={validResult} t={strings.en} onReset={vi.fn()} />);
    const button = screen.getByRole("button", { name: strings.en.stop });
    expect(button.querySelector(".animate-spin")).not.toBeNull();
    fireEvent.click(button);
    expect(toggle).toHaveBeenCalled();
    vi.doUnmock("@/hooks/use-speech");
  });
});
