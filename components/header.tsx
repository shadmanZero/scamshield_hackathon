import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/logo";

export function Header() {
  return (
    <header className="flex items-center justify-between">
      <Wordmark />
      <ThemeToggle />
    </header>
  );
}
