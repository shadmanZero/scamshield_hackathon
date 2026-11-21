"use client";

import {
  CheckIcon,
  FootprintsIcon,
  Link2Icon,
  LoaderCircleIcon,
  ListChecksIcon,
  PhoneIcon,
  RotateCcwIcon,
  Share2Icon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShieldQuestionIcon,
  SquareIcon,
  TriangleAlertIcon,
  Volume2Icon,
} from "lucide-react";
import { useEffect, useRef } from "react";
import type { Analysis } from "@/lib/analysis";
import { useSpeech } from "@/hooks/use-speech";
import { segmentMessage } from "@/lib/highlight";
import type { Speech } from "@/lib/speech";
import type { Strings } from "@/lib/i18n";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

export type AnalysisResult = Analysis & { speech: Speech };

type Props = { analysis: AnalysisResult; t: Strings; onReset: () => void };

const verdictStyles: Record<Analysis["verdict"], { band: string; Icon: typeof ShieldAlertIcon }> = {
  scam: { band: "bg-scam text-scam-foreground", Icon: ShieldAlertIcon },
  suspicious: { band: "bg-caution text-caution-foreground", Icon: ShieldQuestionIcon },
  safe: { band: "bg-safe text-safe-foreground", Icon: ShieldCheckIcon },
};

const actionClass = "h-auto min-h-14 flex-col gap-1 px-1 py-2 text-sm leading-tight whitespace-normal [&_svg]:size-5";

export function Result({ analysis, t, onReset }: Props) {
  const { verdict, redFlags, whatHappensNext, whatToDoNow } = analysis;
  const { band, Icon } = verdictStyles[verdict];
  const headline = t.verdict[verdict];
  const speech = useSpeech(analysis.speech);
  const heading = useRef<HTMLHeadingElement>(null);

  // The screen swaps in place, so move focus to the verdict for keyboard and screen reader users.
  useEffect(() => heading.current?.focus(), []);

  async function share() {
    const text = `${headline}\n\n${analysis.explanation}\n\n${whatToDoNow.map((step) => `• ${step}`).join("\n")}\n\n— ScamShield`;
    // The native share sheet only exists in secure contexts (HTTPS or localhost); a plain
    // http:// address on a phone gets the WhatsApp link instead.
    if (!navigator.share) {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
      return;
    }
    try {
      await navigator.share({ title: "ScamShield", text });
    } catch {
      // Dismissing the sheet rejects; nothing to recover from.
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col pb-28">
      <div className="px-4 pt-5 pb-4">
        <Header t={t} />
      </div>
      <section className={`flex flex-col gap-4 px-4 pt-7 pb-7 ${band}`}>
        <Icon className="size-14" strokeWidth={1.75} />
        <div className="flex flex-col gap-1">
          {analysis.scamType !== "none" && (
            <p className="text-sm font-medium tracking-wide uppercase opacity-85">{t.scamType[analysis.scamType]}</p>
          )}
          <h1 ref={heading} tabIndex={-1} className="font-heading text-5xl leading-[1.05] tracking-tight text-balance outline-none">
            {headline}
          </h1>
        </div>
        <div className="flex items-center gap-3 text-sm font-medium">
          <span>{t.riskScore}</span>
          <div
            role="meter"
            aria-label={t.riskScore}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(analysis.riskScore)}
            className="h-1.5 flex-1 bg-black/20"
          >
            <div className="h-full bg-current" style={{ width: `${analysis.riskScore}%` }} />
          </div>
          <span className="tabular-nums">{Math.round(analysis.riskScore)}/100</span>
        </div>
      </section>

      <div className="flex flex-col gap-10 px-4 pt-7">
        <p className="text-xl leading-relaxed">{analysis.explanation}</p>

        <Section title={t.redFlags} icon={<TriangleAlertIcon className="text-destructive" />} hidden={redFlags.length === 0}>
          {analysis.message.sender && (
            <p className="text-sm text-muted-foreground">
              {t.from}: {analysis.message.sender}
            </p>
          )}
          <p className="border-l-2 border-destructive bg-card py-3 pr-3 pl-4 leading-relaxed">
            <HighlightedMessage text={analysis.message.text} flags={redFlags} />
          </p>
          <ol className="flex flex-col gap-3">
            {redFlags.map((flag, index) => (
              <li key={index} id={`flag-${index}`} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center bg-scam text-xs font-semibold text-scam-foreground tabular-nums">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{flag.reason}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title={t.links} icon={<Link2Icon />} hidden={analysis.message.links.length === 0}>
          <ul className="flex flex-col gap-2">
            {analysis.message.links.map((link, index) => (
              <li key={index} className="bg-muted px-3 py-2 font-mono text-sm break-all">
                {link}
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t.whatHappensNext} icon={<FootprintsIcon />} hidden={whatHappensNext.length === 0}>
          <ol className="flex flex-col">
            {whatHappensNext.map((step, index) => (
              <li key={index} className="relative flex gap-4 pb-5 last:pb-0">
                {index < whatHappensNext.length - 1 && <span className="absolute top-8 left-4 h-[calc(100%-2rem)] w-px bg-border" />}
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-foreground/30 bg-card text-sm font-medium tabular-nums">
                  {index + 1}
                </span>
                <span className="pt-1 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title={t.whatToDoNow} icon={<ListChecksIcon />}>
          <ol className="flex flex-col gap-3">
            {whatToDoNow.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-safe/15 text-safe">
                  <CheckIcon className="size-4" />
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
          {verdict !== "safe" && (
            <div className="flex flex-col gap-3 pt-2">
              <Button size="xl" nativeButton={false} render={<a href="tel:1930" />}>
                <PhoneIcon />
                {t.call1930}
              </Button>
              <Button
                size="xl"
                variant="outline"
                nativeButton={false}
                render={<a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" />}
              >
                {t.report}
              </Button>
            </div>
          )}
        </Section>
      </div>

      <nav aria-label={t.actions} className="fixed inset-x-0 bottom-0 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <Button variant={speech.status === "idle" ? "default" : "secondary"} onClick={speech.toggle} className={actionClass}>
            {speech.status === "idle" && <Volume2Icon />}
            {speech.status === "loading" && <LoaderCircleIcon className="animate-spin" />}
            {speech.status === "playing" && <SquareIcon />}
            {speech.status === "idle" ? t.listen : t.stop}
          </Button>
          <Button variant="outline" onClick={share} className={actionClass}>
            <Share2Icon />
            {t.share}
          </Button>
          <Button variant="outline" onClick={onReset} className={actionClass}>
            <RotateCcwIcon />
            {t.checkAnother}
          </Button>
        </div>
      </nav>
    </main>
  );
}

function Section({ title, icon, hidden, children }: { title: string; icon: React.ReactNode; hidden?: boolean; children: React.ReactNode }) {
  if (hidden) return null;
  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2.5 font-heading text-2xl [&_svg]:size-5 [&_svg]:shrink-0">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function HighlightedMessage({ text, flags }: { text: string; flags: Analysis["redFlags"] }) {
  return segmentMessage(
    text,
    flags.map((flag) => flag.phrase),
  ).map((segment, index) =>
    segment.flag === undefined ? (
      segment.text
    ) : (
      <mark
        key={index}
        aria-describedby={`flag-${segment.flag}`}
        className="bg-scam/12 px-0.5 text-foreground decoration-destructive underline decoration-2 underline-offset-2"
      >
        {segment.text}
        <sup aria-hidden className="ml-0.5 font-semibold text-destructive">
          {segment.flag + 1}
        </sup>
      </mark>
    ),
  );
}
