import type { Strings } from "@/lib/i18n";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/logo";

export function Header({ t }: { t: Strings }) {
  return (
    <header className="flex items-center justify-between">
      <Wordmark />
      <ThemeToggle t={t} />
    </header>
  );
}
