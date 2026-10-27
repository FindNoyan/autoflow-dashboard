// Pure sorting logic for the workflows table (no React, no DOM).
//
// sortWorkflows(rows, { key, direction }):
//   - key "name": case-insensitive A-Z (ascending) / Z-A (descending).
//   - key "successRate": numeric; a missing/non-numeric rate sorts last
//     in either direction, never first.
//   - key "lastRun": by recency. The table shows relative labels
//     ("3 min ago", "1 hr ago", "2 days ago"), so the value compared is
//     minutes ago — ascending therefore means most recent first, and
//     an unparseable label ("—") sorts last in either direction.
//   - The sort is stable: equal rows keep their original order.
//   - The input array is never mutated; a new array is returned.
//
// parseRelativeMinutes(value): minutes ago for a "<n> <unit> ago" label,
// or null when the label cannot be parsed.

const MINUTES_PER_UNIT = {
  min: 1,
  mins: 1,
  minute: 1,
  minutes: 1,
  hr: 60,
  hrs: 60,
  hour: 60,
  hours: 60,
  day: 1440,
  days: 1440,
  week: 10080,
  weeks: 10080,
  month: 43200,
  months: 43200,
};

export function parseRelativeMinutes(value) {
  if (typeof value !== "string") {
    return null;
  }
  const match = value
    .trim()
    .toLowerCase()
    .match(/^(\d+)\s+(min|mins|minute|minutes|hr|hrs|hour|hours|day|days|week|weeks|month|months)\s+ago$/);
  if (!match) {
    return null;
  }
  return Number(match[1]) * MINUTES_PER_UNIT[match[2]];
}

function numericRate(row) {
  // Guard null/undefined/"" explicitly: Number(null) is 0 and
  // Number("") is 0, and neither means a real 0% rate.
  if (row.successRate === null || row.successRate === undefined || row.successRate === "") {
    return null;
  }
  const rate = Number(row.successRate);
  return Number.isFinite(rate) ? rate : null;
}

export function sortWorkflows(rows, { key = "name", direction = "asc" } = {}) {
  const dir = direction === "desc" ? -1 : 1;
  return (rows ?? [])
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      // Missing values sort last in either direction, so they are
      // handled before the direction multiplier is applied.
      if (key === "lastRun") {
        const am = parseRelativeMinutes(a.row.lastRun);
        const bm = parseRelativeMinutes(b.row.lastRun);
        if (am === null && bm === null) {
          return a.index - b.index;
        }
        if (am === null) {
          return 1;
        }
        if (bm === null) {
          return -1;
        }
        if (am !== bm) {
          return (am - bm) * dir;
        }
        return a.index - b.index;
      }
      if (key === "successRate") {
        const ar = numericRate(a.row);
        const br = numericRate(b.row);
        if (ar === null && br === null) {
          return a.index - b.index;
        }
        if (ar === null) {
          return 1;
        }
        if (br === null) {
          return -1;
        }
        if (ar !== br) {
          return (ar - br) * dir;
        }
        return a.index - b.index;
      }
      // Default key: name (unknown keys fall back to name order).
      const cmp = (a.row.name ?? "").localeCompare(b.row.name ?? "", undefined, {
        sensitivity: "base",
      });
      return cmp !== 0 ? cmp * dir : a.index - b.index;
    })
    .map(({ row }) => row);
}
