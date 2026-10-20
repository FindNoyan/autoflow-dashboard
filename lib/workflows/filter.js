// Pure filtering logic for the workflows table (no React, no DOM).
//
// filterWorkflows(rows, { status, query }):
//   - status "all" keeps every row; otherwise the row's status must match exactly.
//   - query is trimmed and matched case-insensitively as a substring of the
//     workflow name. Rows with a missing name never match a non-empty query.
// distinctStatuses(rows):
//   - statuses actually present in the data, with the three known statuses
//     (active, paused, failed) first and any others appended in encounter
//     order — so a new status added in Supabase never breaks the filter UI.

export function filterWorkflows(rows, { status = "all", query = "" } = {}) {
  const q = query.trim().toLowerCase();
  return (rows ?? []).filter((row) => {
    if (status !== "all" && row.status !== status) {
      return false;
    }
    if (q && !(row.name ?? "").toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });
}

export function distinctStatuses(rows) {
  const order = { active: 0, paused: 1, failed: 2 };
  const seen = [...new Set((rows ?? []).map((r) => r.status).filter(Boolean))];
  return seen.sort(
    (a, b) => (order[a] ?? 3) - (order[b] ?? 3)
  );
}
