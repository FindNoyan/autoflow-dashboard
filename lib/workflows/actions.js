// Pure helpers for the pause / resume and retry actions (roadmap item 7).
// These only describe the next state — WorkflowsSection owns the state,
// so nothing here touches React, the DOM, or Supabase. The actions are
// local UI state: they change what the dashboard shows in this browser
// session and never write to the database, so a paused workflow here is
// still running in real life and a retried run is not re-executed.

export function toggleWorkflowStatus(status) {
  if (status === "paused" || status === "failed") {
    return "active";
  }
  return "paused";
}

export function actionLabelForStatus(status) {
  if (status === "paused" || status === "failed") {
    return "Resume";
  }
  return "Pause";
}

// Apply per-name status overrides ({ "Name": "paused" }) to a workflow
// list. Rows without an override are returned untouched; the input array
// is never mutated. A missing list returns an empty list.
export function applyStatusOverrides(rows, overrides) {
  if (!Array.isArray(rows)) {
    return [];
  }
  if (!overrides || Object.keys(overrides).length === 0) {
    return rows;
  }
  return rows.map((row) =>
    row && overrides[row.name]
      ? { ...row, status: overrides[row.name] }
      : row
  );
}

// Mark runs as retried: every run whose id is in `retriedIds` and whose
// status is "failed" becomes "retried". Runs that are not failed, and
// ids that match no run, are left alone, so calling this twice with the
// same id changes nothing the second time. The input array is never
// mutated.
export function applyRetriedRuns(runs, retriedIds) {
  if (!Array.isArray(runs)) {
    return [];
  }
  const ids = new Set(Array.isArray(retriedIds) ? retriedIds : []);
  if (ids.size === 0) {
    return runs;
  }
  return runs.map((run) =>
    run && ids.has(run.id) && run.status === "failed"
      ? { ...run, status: "retried" }
      : run
  );
}
