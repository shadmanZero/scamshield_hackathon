// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSpeech } from "@/hooks/use-speech";

const play = vi.fn().mockResolvedValue(undefined);
const pause = vi.fn();
const fetchMock = vi.fn();
const revoke = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal(
    "Audio",
    class {
      src = "";
      currentTime = 0;
      onended: (() => void) | null = null;
      play = play;
      pause = pause;
    },
  );
  vi.stubGlobal("URL", { ...URL, createObjectURL: () => "blob:speech", revokeObjectURL: revoke });
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  play.mockClear();
  pause.mockClear();
});

describe("useSpeech", () => {
  it("fetches the audio once, then replays it from the cached element", async () => {
    fetchMock.mockResolvedValue(new Response(new Blob(["pcm"]), { status: 200 }));
    const { result, unmount } = renderHook(() => useSpeech({ text: "hello", token: "signed" }));

    await act(() => result.current.toggle());
    expect(result.current.status).toBe("playing");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ text: "hello", token: "signed" });

    await act(() => result.current.toggle());
    expect(result.current.status).toBe("idle");
    expect(pause).toHaveBeenCalled();

    await act(() => result.current.toggle());
    expect(result.current.status).toBe("playing");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    unmount();
    expect(revoke).toHaveBeenCalledWith("blob:speech");
  });

  it("falls back to idle when synthesis fails", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 502 }));
    const { result } = renderHook(() => useSpeech({ text: "hello", token: "signed" }));
    await act(() => result.current.toggle());
    expect(result.current.status).toBe("idle");
  });
});
