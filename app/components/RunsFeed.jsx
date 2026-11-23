"use client";

import { useState } from "react";
import { runs } from "../data/dashboard";
import { applyRetriedRuns } from "../../lib/workflows/actions";

const BORDER = {
  success: "border-teal",
  failed: "border-red",
  running: "border-amber",
  retried: "border-amber",
};

// Renders the recent-runs feed. `items` overrides the demo runs — the
// dashboard passes the logged-in user's real runs (mapped to
// { id, workflow, time, status, detail }). With no `items`, demo data
// is shown. Unknown statuses fall back to the amber border.
// Clicking a run expands an inline detail: its status as text (the
// collapsed row shows it only as a border colour) and, for a failed
// run, a Retry button. `retriedRunIds` / `onRetryRun` come from
// DashboardBody, so a run retried here is also marked retried in the
// workflow detail panel, and vice versa. Retrying is local UI state
// only: it changes what this browser session shows and does not
// re-run anything or write to the database. A retried run shows no
// Retry button, so the same run cannot be retried twice.
export default function RunsFeed({ items, retriedRunIds = [], onRetryRun }) {
  const [expandedId, setExpandedId] = useState(null);
  const rows = applyRetriedRuns(items ?? runs, retriedRunIds);
  return (
    <section className="px-6 pb-10 sm:px-8">
      <h2 className="font-display text-base font-semibold text-ink">
        Recent runs
      </h2>
      <ul className="mt-4 space-y-3">
        {rows.map((run) => {
          const expanded = expandedId === run.id;
          return (
            <li
              key={run.id}
              className={`border-l-2 ${BORDER[run.status] || "border-amber"} bg-surface px-4 py-3`}
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedId((prev) => (prev === run.id ? null : run.id))
                }
                aria-expanded={expanded}
                aria-controls={`run-detail-${run.id}`}
                aria-label={`${expanded ? "Hide" : "Show"} details for ${run.workflow} run from ${run.time}`}
                className="block w-full text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-ink">{run.workflow}</p>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="font-data text-xs text-muted">
                      {run.time}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`inline-block text-xs text-muted transition-transform ${expanded ? "rotate-90" : ""}`}
                    >
                      ›
                    </span>
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">{run.detail}</p>
              </button>
              {expanded && (
                <div
                  id={`run-detail-${run.id}`}
                  className="mt-2 border-t border-line pt-2"
                >
                  <p className="text-xs text-muted">
                    Status:{" "}
                    <span className="capitalize text-ink">{run.status}</span>
                  </p>
                  {run.status === "failed" && (
                    <>
                      <button
                        type="button"
                        onClick={() => onRetryRun?.(run)}
                        aria-label={`Retry ${run.workflow} run from ${run.time}`}
                        className="mt-2 rounded-md border border-line px-2 py-0.5 text-xs text-muted hover:text-ink"
                      >
                        Retry
                      </button>
                      <p className="mt-1 text-xs text-muted">
                        Retrying is local to this browser — it does not
                        re-run anything.
                      </p>
                    </>
                  )}
                  {run.status === "retried" && (
                    <p className="mt-1 text-xs text-muted">
                      Marked for retry in this browser session.
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
