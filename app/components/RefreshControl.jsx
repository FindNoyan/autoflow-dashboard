// Refresh control (roadmap item 8): re-fetches the dashboard data and
// shows when the feed was last synced. Presentational only — the parent
// (DashboardBody) owns the fetch and the timestamp.
// - Logged in: refresh re-fetches workflows + runs from Supabase. While
//   it runs the button shows "Refreshing…" and is disabled; the old data
//   stays visible (no full-screen loading state).
// - Logged out (demo): the demo data is static, so refresh only updates
//   the "Last synced" time — the note under the button says so.
// The timestamp only updates after a successful fetch, never before.
// A failed refresh shows an inline error instead of wiping the page.
import { formatSyncTime } from "../../lib/workflows/formatSyncTime";

export default function RefreshControl({
  lastSynced,
  refreshing,
  refreshError,
  onRefresh,
  demo,
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-6 py-3 sm:px-8">
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        aria-busy={refreshing}
        className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-ink disabled:opacity-50"
      >
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
      <p role="status" className="text-sm text-muted">
        {lastSynced
          ? `Last synced: ${formatSyncTime(lastSynced)}`
          : "Not synced yet"}
      </p>
      {demo && (
        <p className="text-xs text-muted">
          Demo data is static — refresh only updates the sync time.
        </p>
      )}
      {refreshError && (
        <p role="alert" className="text-sm text-red">
          {refreshError}
        </p>
      )}
    </div>
  );
}
