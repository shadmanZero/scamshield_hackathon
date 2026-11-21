// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Page from "@/app/page";
import { strings } from "@/lib/i18n";
import { validResult } from "@/test/fixtures";

vi.mock("@/lib/compress-image", () => ({ compressImage: vi.fn().mockResolvedValue("data:image/jpeg;base64,AAAA") }));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("scrollTo", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("Page", () => {
  it("runs a sample through checking to the result in the chosen language", async () => {
    let resolve!: (response: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    render(<Page />);

    fireEvent.click(screen.getByRole("button", { name: "हिंदी" }));
    expect(document.documentElement.lang).toBe("hi");
    fireEvent.click(screen.getByRole("button", { name: new RegExp(strings.hi.sampleTags.bank) }));
    expect(screen.getByRole("status")).toBeInTheDocument();

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toMatchObject({ language: "hi" });

    await act(async () => resolve(Response.json(validResult)));
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(strings.hi.verdict.scam);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("returns home with an error when the server fails", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 502 }));
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: /Bank message/ }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(strings.en.error));
  });

  it("returns home with an error when the network drops", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: /Bank message/ }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });

  it("compresses a screenshot before sending it", async () => {
    fetchMock.mockResolvedValue(Response.json(validResult));
    render(<Page />);
    fireEvent.change(screen.getByLabelText(/Upload screenshot/), { target: { files: [new File(["x"], "s.png", { type: "image/png" })] } });
    await screen.findByRole("heading", { level: 1, name: strings.en.verdict.scam });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ language: "en", image: "data:image/jpeg;base64,AAAA" });
  });
});
