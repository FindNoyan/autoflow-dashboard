"use client";

import { useMemo, useState } from "react";
import WorkflowsTable from "./WorkflowsTable";
import WorkflowsFilter from "./WorkflowsFilter";
import WorkflowDetail from "./WorkflowDetail";
import { runs as demoRuns, workflows } from "../data/dashboard";
import { distinctStatuses, filterWorkflows } from "../../lib/workflows/filter";
import { sortWorkflows } from "../../lib/workflows/sort";
import {
  applyRetriedRuns,
  applyStatusOverrides,
  toggleWorkflowStatus,
} from "../../lib/workflows/actions";

// The workflows section: heading + filter controls + table + detail panel.
// Owns the filter, sort, and selected-workflow state. Accepts `items`
// ({ name, status, lastRun, successRate }) — the logged-in user's real
// rows; with no `items`, the public demo rows render. Accepts `runs`
// ({ id, workflow, time, status, detail }) — the logged-in user's real
// runs; with no `runs`, the public demo runs render. Clicking a workflow
// name opens its detail panel below the table; Close hides it. The
// selected workflow is looked up from the filtered + sorted rows, so a
// selection the current filter hides simply closes the panel.
// DashboardBody remounts this with a different `key` when switching
// between demo and real data, so a stale filter, sort, or selection never
// carries over. Rows are filtered first, then sorted, so sorting never
// resurrects a row the filter excluded.
// Pause / resume and retry are local UI state. `statusOverrides`
// (workflow name -> status) is kept here, because only this section
// uses it. `retriedRunIds` lives in DashboardBody instead, so a run
// retried in the workflow detail panel is also marked retried in the
// Recent runs feed, and vice versa. Both reset on login/logout (the
// section remounts, and DashboardBody clears the ids) or with the
// "Reset local changes" button. They change only what this browser
// session shows — a paused workflow keeps running for real, and a
// retried run is not re-executed — and they never write to the
// database. Filter counts and the detail panel read the overridden
// rows, so a paused workflow counts as paused everywhere.
export default function WorkflowsSection({
  items,
  runs,
  retriedRunIds = [],
  onRetryRun,
  onResetRetriedRuns,
}) {
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  // No sort until the user clicks a column header, so the initial order
  // stays exactly the data order the dashboard already showed.
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedName, setSelectedName] = useState(null);
  const [statusOverrides, setStatusOverrides] = useState({});

  const source = items ?? workflows;
  const runSource = runs ?? demoRuns;

  const displayed = useMemo(
    () => applyStatusOverrides(source, statusOverrides),
    [source, statusOverrides]
  );
  const displayedRuns = useMemo(
    () => applyRetriedRuns(runSource, retriedRunIds),
    [runSource, retriedRunIds]
  );
  const hasLocalChanges =
    Object.keys(statusOverrides).length > 0 || retriedRunIds.length > 0;

  const statuses = useMemo(() => distinctStatuses(displayed), [displayed]);
  const counts = useMemo(() => {
    const c = {};
    displayed.forEach((row) => {
      if (row.status) {
        c[row.status] = (c[row.status] ?? 0) + 1;
      }
    });
    return c;
  }, [displayed]);
  const filtered = useMemo(
    () => filterWorkflows(displayed, { status, query }),
    [displayed, status, query]
  );
  const sorted = useMemo(
    () =>
      sortKey
        ? sortWorkflows(filtered, { key: sortKey, direction: sortDirection })
        : filtered,
    [filtered, sortKey, sortDirection]
  );
  const selected = selectedName
    ? sorted.find((row) => row.name === selectedName) ?? null
    : null;

  const handleSortChange = (key) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // First click picks the useful direction: A-Z for names, most
      // recent first for last run (ascending minutes ago), and highest
      // rate first for success rate.
      setSortDirection(key === "successRate" ? "desc" : "asc");
    }
  };

  const clearFilters = () => {
    setStatus("all");
    setQuery("");
  };

  // Toggle from the row's current (already overridden) status, so
  // pausing then resuming returns the workflow to its real status.
  const handleToggleStatus = (flow) => {
    setStatusOverrides((prev) => ({
      ...prev,
      [flow.name]: toggleWorkflowStatus(flow.status),
    }));
  };

  const handleRetryRun = (run) => {
    onRetryRun?.(run);
  };

  const resetLocalChanges = () => {
    setStatusOverrides({});
    onResetRetriedRuns?.();
  };

  return (
    <section className="px-6 py-8 sm:px-8">
      <h2 className="font-display text-base font-semibold text-ink">
        Workflows
      </h2>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-xs text-muted">
          Pause, resume, and retry are local to this browser — they do not
          change your saved workflows.
        </p>
        {hasLocalChanges && (
          <button
            type="button"
            onClick={resetLocalChanges}
            className="text-xs text-muted underline hover:text-ink"
          >
            Reset local changes
          </button>
        )}
      </div>
      <WorkflowsFilter
        statuses={statuses}
        counts={counts}
        total={displayed.length}
        shown={filtered.length}
        status={status}
        query={query}
        onStatusChange={setStatus}
        onQueryChange={setQuery}
      />
      {sorted.length > 0 ? (
        <WorkflowsTable
          items={sorted}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          onSelect={(flow) => setSelectedName(flow.name)}
          onToggleStatus={handleToggleStatus}
        />
      ) : (
        <div className="mt-4 rounded-lg border border-line p-8 text-center">
          <p className="text-sm text-muted">
            No workflows match your filters.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-ink"
          >
            Clear filters
          </button>
        </div>
      )}
      {selected && (
        <WorkflowDetail
          workflow={selected}
          runs={displayedRuns}
          onClose={() => setSelectedName(null)}
          onRetryRun={handleRetryRun}
        />
      )}
    </section>
  );
}
