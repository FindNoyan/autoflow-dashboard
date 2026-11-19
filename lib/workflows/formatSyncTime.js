// Format a "last synced" timestamp for the Refresh control.
// Returns a locale time string (e.g. "9:15:02 AM") for a valid Date,
// and "—" for anything else (null, undefined, an invalid Date, a
// string, a number). Pure function — no React, no DOM — so it is
// unit-testable with node.
export function formatSyncTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}
