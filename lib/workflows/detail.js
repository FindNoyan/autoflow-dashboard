// Pure helper for the workflow detail view: pick out one workflow's runs.
// `runs` are { id, workflow, time, status, detail } — the same shape the
// Recent runs feed uses. Matching is by exact workflow name, so a run only
// ever shows under its own workflow. Null-safe: a missing runs list or a
// missing name returns an empty list instead of throwing, and the input
// array is never mutated.
export function runsForWorkflow(runs, workflowName) {
  if (!Array.isArray(runs) || !workflowName) {
    return [];
  }
  return runs.filter((run) => run && run.workflow === workflowName);
}
