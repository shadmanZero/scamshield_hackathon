"use client";

import { useEffect, useState } from "react";
import type { Language } from "@/lib/analysis";
import { compressImage } from "@/lib/compress-image";
import { strings } from "@/lib/i18n";
import type { AnalysisResult } from "@/components/result";
import { Checking } from "@/components/checking";
import { Home } from "@/components/home";
import { Result } from "@/components/result";

type State = { status: "idle"; error?: string } | { status: "checking" } | { status: "result"; analysis: AnalysisResult };

export default function Page() {
  const [language, setLanguage] = useState<Language>("en");
  const [state, setState] = useState<State>({ status: "idle" });
  const t = strings[language];

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  async function check({ text, file }: { text?: string; file?: File }) {
    setState({ status: "checking" });
    try {
      const image = file && (await compressImage(file));
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, image, language }),
      });
      if (!response.ok) throw new Error(`analyze ${response.status}`);
      setState({ status: "result", analysis: await response.json() });
      window.scrollTo(0, 0);
    } catch {
      setState({ status: "idle", error: t.error });
    }
  }

  if (state.status === "checking") return <Checking t={t} />;
  if (state.status === "result") {
    return <Result analysis={state.analysis} t={t} onReset={() => setState({ status: "idle" })} />;
  }
  return <Home t={t} language={language} onLanguageChange={setLanguage} onSubmit={check} error={state.error} />;
}
