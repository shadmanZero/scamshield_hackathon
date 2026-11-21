export type Segment = { text: string; flag?: number };

// Splits a message into plain and flagged runs so the UI can wrap each flagged phrase.
// `flag` is the index of the phrase that matched, for the numbered reasons list.
export function segmentMessage(text: string, phrases: string[]): Segment[] {
  const matches = phrases
    .flatMap((phrase, flag) => {
      if (!phrase) return [];
      const found: { flag: number; start: number; end: number }[] = [];
      for (let start = text.indexOf(phrase); start >= 0; start = text.indexOf(phrase, start + phrase.length)) {
        found.push({ flag, start, end: start + phrase.length });
      }
      return found;
    })
    .sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start < cursor) continue;
    if (match.start > cursor) segments.push({ text: text.slice(cursor, match.start) });
    segments.push({ text: text.slice(match.start, match.end), flag: match.flag });
    cursor = match.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}
