"use client";

// Filter controls for the workflows table: status toggle buttons + name search.
// Presentational — filter state lives in WorkflowsSection.
// `statuses` lists the statuses actually present in the data; `counts`
// maps each status to its row count and `total` is the unfiltered row count.
export default function WorkflowsFilter({
  statuses,
  counts,
  total,
  shown,
  status,
  query,
  onStatusChange,
  onQueryChange,
}) {
  const label = (s) =>
    s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div
        role="group"
        aria-label="Filter workflows by status"
        className="flex flex-wrap gap-2"
      >
        {["all", ...statuses].map((s) => {
          const isActive = status === s;
          const count = s === "all" ? total : counts[s] ?? 0;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onStatusChange(s)}
              aria-pressed={isActive}
              className={`rounded-md border px-3 py-1.5 text-sm capitalize ${
                isActive
                  ? "border-teal bg-teal text-background"
                  : "border-line text-muted hover:text-ink"
              }`}
            >
              {label(s)}{" "}
              <span className="font-data text-xs">({count})</span>
            </button>
          );
        })}
      </div>
      <div>
        <label htmlFor="workflow-search" className="sr-only">
          Search workflows
        </label>
        <input
          id="workflow-search"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search workflows…"
          className="w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-muted sm:w-64"
        />
      </div>
      <p role="status" className="text-xs text-muted sm:ml-auto">
        Showing {shown} of {total} workflows
      </p>
    </div>
