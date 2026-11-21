import { useEffect, useRef, useState } from "react";
import type { Speech } from "@/lib/speech";

const silence = "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQIAAAAAAA==";

export type SpeechStatus = "idle" | "loading" | "playing";

export function useSpeech(speech: Speech) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const audio = useRef<HTMLAudioElement>(null);
  const request = useRef<AbortController>(null);

  useEffect(
    () => () => {
      request.current?.abort();
      audio.current?.pause();
      if (audio.current) URL.revokeObjectURL(audio.current.src);
    },
    [],
  );

  async function toggle() {
    if (status !== "idle") {
      request.current?.abort();
      audio.current?.pause();
      setStatus("idle");
      return;
    }
    if (audio.current) {
      audio.current.currentTime = 0;
      await audio.current.play();
      setStatus("playing");
      return;
    }

    // iOS only lets audio start during the tap itself, and the speech arrives seconds later.
    // Playing silence now keeps this element allowed to play once it does.
    const element = new Audio(silence);
    element.play().catch(() => {});
    request.current = new AbortController();
    setStatus("loading");
    try {
      const response = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(speech),
        signal: request.current.signal,
      });
      if (!response.ok) throw new Error(`speak ${response.status}`);
      element.src = URL.createObjectURL(await response.blob());
      element.onended = () => setStatus("idle");
      await element.play();
      audio.current = element;
      setStatus("playing");
    } catch {
      setStatus("idle");
    }
  }

  return { status, toggle };
}
