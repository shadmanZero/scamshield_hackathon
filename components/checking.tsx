"use client";

import { useEffect, useState } from "react";
import { CheckIcon } from "lucide-react";
import type { Strings } from "@/lib/i18n";
import { Header } from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

// The server answers in one round trip, so progress is paced on a timer and
// parks on the last step until the result arrives.
export function Checking({ t }: { t: Strings }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (current === t.steps.length - 1) return;
    const timer = setTimeout(() => setCurrent(current + 1), 1800);
    return () => clearTimeout(timer);
  }, [current, t.steps.length]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-5 pb-10" aria-busy>
      <Header />

      <ol className="flex flex-col divide-y rounded-lg border bg-card">
        {t.steps.map((step, index) => (
          <li
            key={step}
            className={`flex items-center gap-3 px-4 py-3 transition-colors ${index > current ? "text-muted-foreground/60" : index < current ? "text-muted-foreground" : "font-medium"}`}
          >
            <span className="flex size-5 shrink-0 items-center justify-center">
              {index < current ? <CheckIcon className="size-5 text-safe" /> : index === current ? <Spinner className="size-5 text-accent" /> : null}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <p className="-mt-3 text-sm text-muted-foreground">{t.checkingHint}</p>

      <div className="flex flex-col gap-8" aria-hidden>
        <div className="-mx-4 flex flex-col gap-4 bg-muted/60 px-4 pt-8 pb-7">
          <Skeleton className="size-14 rounded-full bg-muted-foreground/15" />
          <Skeleton className="h-4 w-24 bg-muted-foreground/15" />
          <Skeleton className="h-11 w-3/4 bg-muted-foreground/15" />
          <Skeleton className="h-1.5 w-full bg-muted-foreground/15" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-4/6" />
        </div>
      </div>
    </main>
  );
}
