"use client";

import { useEffect } from "react";
import { languageSchema } from "@/lib/analysis";
import { strings } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  const t = strings[languageSchema.catch("en").parse(document.documentElement.lang)];

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo className="size-12" />
      <h1 className="font-heading text-3xl">{t.somethingWrong}</h1>
      <Button size="xl" onClick={reset}>
        {t.tryAgain}
      </Button>
    </main>
  );
}
