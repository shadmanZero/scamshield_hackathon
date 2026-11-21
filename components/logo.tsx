export function Logo({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={`shrink-0 ${className}`}>
      <path d="M16 2.5 28 7v8.5c0 7.5-5 13-12 15-7-2-12-7.5-12-15V7l12-4.5Z" className="fill-accent" />
      <path d="M10.5 21.5 21.5 10.5" className="stroke-background" strokeWidth="4" strokeLinecap="round" />
      <path d="M16 2.5 28 7v8.5c0 7.5-5 13-12 15" fill="none" className="stroke-foreground/25" strokeWidth="1" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Logo />
      <span className="font-heading text-2xl leading-none tracking-tight">ScamShield</span>
    </span>
  );
}
