const windowMs = 60_000;
const hits = new Map<string, number[]>();

export function rateLimited(key: string, limit: number, now = Date.now()): boolean {
  // Keyed by client address with no eviction, so cap the table instead of leaking across a long-lived instance.
  if (hits.size > 10_000) hits.clear();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > limit;
}
