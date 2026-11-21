"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import type { Strings } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const root = () => document.documentElement;

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(root(), { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

export function ThemeToggle({ t }: { t: Strings }) {
  const dark = useSyncExternalStore(
    subscribe,
    () => root().classList.contains("dark"),
    () => false,
  );

  function toggle() {
    root().classList.toggle("dark", !dark);
    localStorage.theme = dark ? "light" : "dark";
  }

  return (
    <Button variant="ghost" size="icon-lg" onClick={toggle} aria-label={dark ? t.lightMode : t.darkMode} className="size-11">
      {dark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
