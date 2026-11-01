// Fuzzy matching (spec §4.3): case-insensitive, characters in order.
// Higher scores for word-start matches, consecutive characters and shorter text.

const isWordStart = (text, i) => {
  if (i === 0) return true;
  const prev = text[i - 1];
  const cur = text[i];
  if (/[\s\-_./:·—~]/.test(prev)) return true;
  // camelCase boundary
  return prev === prev.toLowerCase() && cur !== cur.toLowerCase();
};

// Scores one alignment that starts searching at `from`. Greedy, but prefers a
// word-start occurrence of each character when one exists before the next
// plain occurrence is forced.
function align(q, text, lower, from) {
  let score = 0;
  let last = -2;
  let pos = from;
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi];
    let at = lower.indexOf(ch, pos);
    if (at < 0) return null;
    // If this char isn't consecutive, look ahead for a word-start occurrence.
    if (at !== last + 1 && !isWordStart(text, at)) {
      let look = lower.indexOf(ch, at + 1);
      while (look >= 0) {
        if (isWordStart(text, look)) { at = look; break; }
        look = lower.indexOf(ch, look + 1);
      }
    }
    if (at === last + 1) score += 6;
    if (isWordStart(text, at)) score += 8;
    if (at === 0) score += 4;
    score -= Math.min(at - last - 1, 10) * 0.5; // gap penalty
    last = at;
    pos = at + 1;
  }
  return score;
}

/** Score of `query` against `text`, or null when it doesn't match. */
export function fuzzyScore(query, text) {
  if (!query) return 0;
  if (!text) return null;
  const q = query.toLowerCase().replace(/\s+/g, "");
  if (!q) return 0;
  const lower = text.toLowerCase();
  let best = null;
  // Try each occurrence of the first character as a start.
  for (let start = lower.indexOf(q[0]); start >= 0; start = lower.indexOf(q[0], start + 1)) {
    const s = align(q, text, lower, start);
    if (s != null && (best == null || s > best)) best = s;
  }
  if (best == null) return null;
  return best - text.length * 0.1; // shorter text ranks higher
}

/** Best score across a row's primary text and its extra fields (folders,
 *  command text, method names). Extra fields score a little lower. */
export function scoreFields(query, primary, extras = []) {
  let best = fuzzyScore(query, primary);
  for (const e of extras) {
    const s = fuzzyScore(query, e);
    if (s != null && (best == null || s - 3 > best)) best = s - 3;
  }
  return best;
}
