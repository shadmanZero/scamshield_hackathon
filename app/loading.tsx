import { Logo } from "@/components/logo";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4" aria-busy>
      <Logo className="size-16 animate-pulse" />
      <span className="font-heading text-3xl tracking-tight">ScamShield</span>
    </main>
  );
}
