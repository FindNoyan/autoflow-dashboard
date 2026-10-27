"use client";

import { useMemo, useState } from "react";
import WorkflowsTable from "./WorkflowsTable";
import WorkflowsFilter from "./WorkflowsFilter";
import { workflows } from "../data/dashboard";
import { distinctStatuses, filterWorkflows } from "../../lib/workflows/filter";
import { sortWorkflows } from "../../lib/workflows/sort";

// The workflows section: heading + filter controls + table.
// Owns the filter and sort state. Accepts `items` ({ name, status, lastRun,
// successRate }) — the logged-in user's real rows; with no `items`,
// the public demo rows render.
// DashboardBody remounts this with a different `key` when switching
// between demo and real data, so a stale filter or sort never carries over.
// Rows are filtered first, then sorted, so sorting never resurrects a
// row the filter excluded.
export default function WorkflowsSection({ items }) {
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  // No sort until the user clicks a column header, so the initial order
  // stays exactly the data order the dashboard already showed.
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const source = items ?? workflows;

  const statuses = useMemo(() => distinctStatuses(source), [source]);
  const counts = useMemo(() => {
    const c = {};
    source.forEach((row) => {
      if (row.status) {
        c[row.status] = (c[row.status] ?? 0) + 1;
      }
    });
    return c;
  }, [source]);
  const filtered = useMemo(
    () => filterWorkflows(source, { status, query }),
    [source, status, query]
  );
  const sorted = useMemo(
    () =>
      sortKey
        ? sortWorkflows(filtered, { key: sortKey, direction: sortDirection })
        : filtered,
    [filtered, sortKey, sortDirection]
  );

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

  return (
    <section className="px-6 py-8 sm:px-8">
      <h2 className="font-display text-base font-semibold text-ink">
        Workflows
      </h2>
      <WorkflowsFilter
        statuses={statuses}
        counts={counts}
        total={source.length}
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
    </section>
  );
}
