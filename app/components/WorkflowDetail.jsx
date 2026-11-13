import StatusDot from "./StatusDot";
import { runsForWorkflow } from "../../lib/workflows/detail";

const BORDER = {
  success: "border-teal",
  failed: "border-red",
  running: "border-amber",
};

// The workflow detail panel: opened by clicking a workflow name in the
// table. Shows the workflow's summary (the same values as its table row)
// plus its recent runs, matched by name through runsForWorkflow. `runs`
// are { id, workflow, time, status, detail } — the same shape the Recent
// runs feed uses, so demo and real Supabase runs both work. With no runs
// for this workflow, the empty state renders instead of a blank list.
// `onClose` hides the panel. Unknown run statuses fall back to the amber
// border, same as RunsFeed.
export default function WorkflowDetail({ workflow, runs, onClose }) {
  const workflowRuns = runsForWorkflow(runs, workflow.name);
  return (
    <div
      role="region"
      aria-labelledby="workflow-detail-heading"
      className="mt-4 rounded-lg border border-line bg-surface px-4 py-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3
            id="workflow-detail-heading"
            className="font-display text-base font-semibold text-ink"
          >
            {workflow.name}
          </h3>
          <p className="mt-1 flex items-center gap-2 text-sm capitalize text-muted">
            <StatusDot status={workflow.status} />
            {workflow.status}
            <span className="font-data text-xs">
              · Last run {workflow.lastRun}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-ink"
        >
          Close
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-teal"
            style={{ width: `${workflow.successRate}%` }}
          />
        </div>
        <span className="font-data text-xs text-muted">
          {workflow.successRate}% success rate
        </span>
      </div>
      <h4 className="mt-4 text-sm font-semibold text-ink">Recent runs</h4>
      {workflowRuns.length > 0 ? (
        <ul className="mt-2 space-y-3">
          {workflowRuns.map((run) => (
            <li
              key={run.id}
              className={`border-l-2 ${BORDER[run.status] || "border-amber"} px-4 py-3`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm capitalize text-ink">{run.status}</p>
                <span className="font-data text-xs text-muted">{run.time}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{run.detail}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">
          No runs yet for this workflow.
        </p>
      )}
    </div>
  );
}
