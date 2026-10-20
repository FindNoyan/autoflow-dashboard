import StatusDot from "./StatusDot";
import { workflows } from "../data/dashboard";

// Renders just the workflows table — no heading or section wrapper.
// WorkflowsSection owns the section heading and filter controls.
// `items` overrides the demo workflows — the dashboard passes the
// logged-in user's real workflows (mapped to
// { name, status, lastRun, successRate }). With no `items`, demo data
// is shown.
export default function WorkflowsTable({ items }) {
  const rows = items ?? workflows;
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-line">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-surface text-xs text-muted">
            <th scope="col" className="px-4 py-3 font-normal">Name</th>
            <th scope="col" className="px-4 py-3 font-normal">Status</th>
            <th scope="col" className="px-4 py-3 font-normal">Last run</th>
            <th scope="col" className="px-4 py-3 font-normal">Success rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((flow) => (
            <tr key={flow.name} className="hover:bg-surface/60">
              <td className="px-4 py-3 text-ink">{flow.name}</td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-2 capitalize text-muted">
                  <StatusDot status={flow.status} />
                  {flow.status}
                </span>
              </td>
              <td className="px-4 py-3 font-data text-xs text-muted">
                {flow.lastRun}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-teal"
                      style={{ width: `${flow.successRate}%` }}
                    />
                  </div>
                  <span className="font-data text-xs text-muted">
                    {flow.successRate}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
