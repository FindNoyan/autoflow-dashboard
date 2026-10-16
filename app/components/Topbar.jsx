import { workspaceName } from "../data/dashboard";

export default function Topbar() {
  return (
    <header className="flex items-center justify-between border-b border-line px-6 py-4 sm:px-8">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">
          Overview
        </h1>
        <p className="text-sm text-muted">Workspace: {workspaceName}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-md border border-line px-3 py-1.5 font-data text-xs text-muted">
          Last synced 2m ago
        </span>
        <div className="h-8 w-8 rounded-full bg-teal/20 border border-teal/40" />
      </div>
    </header>
  );
}
