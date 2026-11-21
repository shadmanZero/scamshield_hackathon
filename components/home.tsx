"use client";

import { useState } from "react";
import { CameraIcon, ChevronRightIcon, ClipboardPasteIcon } from "lucide-react";
import type { Language } from "@/lib/analysis";
import { languageLabels, type Strings } from "@/lib/i18n";
import { samples } from "@/lib/samples";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Header } from "@/components/header";

type Props = {
  t: Strings;
  language: Language;
  onLanguageChange: (language: Language) => void;
  onSubmit: (input: { text?: string; file?: File }) => void;
  error?: string;
};

const tileClass =
  "flex flex-col items-center justify-center gap-3 rounded-lg border px-3 py-6 text-base font-medium transition-colors active:translate-y-px [&_svg]:size-7";

export function Home({ t, language, onLanguageChange, onSubmit, error }: Props) {
  const [text, setText] = useState("");
  const [pasting, setPasting] = useState(false);

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onSubmit({ file });
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 pt-5 pb-10">
      <div className="flex flex-col gap-5">
        <Header />
        <ToggleGroup
          value={[language]}
          onValueChange={(value) => value[0] && onLanguageChange(value[0] as Language)}
          spacing={0}
          className="-mx-4 w-auto justify-start overflow-x-auto border-b px-4 [scrollbar-width:none]"
          aria-label="Language"
        >
          {(Object.keys(languageLabels) as Language[]).map((code) => (
            <ToggleGroupItem
              key={code}
              value={code}
              className="-mb-px h-11 shrink-0 rounded-none! border-b-2 border-transparent px-3 text-base text-muted-foreground hover:bg-transparent data-pressed:border-accent data-pressed:bg-transparent data-pressed:font-medium data-pressed:text-foreground"
            >
              {languageLabels[code]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-[2.75rem] leading-[1.05] tracking-tight text-balance">{t.tagline}</h1>
        <p className="text-muted-foreground leading-relaxed">{t.subtitle}</p>
      </div>

      {error && (
        <p role="alert" className="border-l-2 border-destructive pl-3 text-destructive">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <label className={`${tileClass} cursor-pointer border-primary bg-primary text-primary-foreground`}>
            <CameraIcon strokeWidth={1.75} />
            {t.uploadScreenshot}
            <input type="file" accept="image/*" onChange={onFile} className="sr-only" />
          </label>
          <button
            type="button"
            onClick={() => setPasting(true)}
            className={`${tileClass} ${pasting ? "border-primary bg-secondary" : "border-input bg-card hover:bg-muted"}`}
          >
            <ClipboardPasteIcon strokeWidth={1.75} />
            {t.pasteText}
          </button>
        </div>

        {pasting && (
          <div className="flex flex-col gap-3">
            <Textarea
              autoFocus
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t.pastePlaceholder}
              rows={4}
              className="min-h-32 bg-card text-base"
            />
            <Button size="xl" disabled={!text.trim()} onClick={() => onSubmit({ text: text.trim() })}>
              {t.check}
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl">{t.samplesTitle}</h2>
        <ul className="divide-y border-y">
          {samples.map((sample) => (
            <li key={sample.tag}>
              <button
                type="button"
                onClick={() => onSubmit({ text: sample.text })}
                className="-mx-4 flex w-[calc(100%+2rem)] items-center gap-3 px-4 py-3.5 text-left hover:bg-muted active:bg-muted"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-medium">{t.sampleTags[sample.tag]}</span>
                  <span className="truncate text-sm text-muted-foreground">{sample.text}</span>
                </span>
                <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
