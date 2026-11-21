import { rateLimited } from "@/lib/rate-limit";

const noStore = { "Cache-Control": "no-store" };

export function jsonError(message: string, status: number, headers: Record<string, string> = {}) {
  return Response.json({ error: message }, { status, headers: { ...noStore, ...headers } });
}

export function jsonOk(data: unknown) {
  return Response.json(data, { headers: noStore });
}

// Per-instance only: on serverless hosts each instance counts separately, which still blunts
// a single abusive client without needing a shared store. The last forwarded hop is the one
// appended by the hosting proxy, so a client cannot rotate it; a direct connection shares one bucket.
export function limitByClient(request: Request, limit: number): Response | null {
  const client = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
  if (!rateLimited(client, limit)) return null;
  return jsonError("Too many requests. Please wait a minute.", 429, { "Retry-After": "60" });
}

// Rejects on the declared size before the body is read, so an oversized upload never reaches memory.
export function rejectOversized(request: Request, maxBytes: number): Response | null {
  const declared = Number(request.headers.get("content-length"));
  if (declared > maxBytes) return jsonError("Request body is too large.", 413);
  return null;
}
