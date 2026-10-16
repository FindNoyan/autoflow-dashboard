import StatusDot from "./StatusDot";
import { workflows } from "../data/dashboard";

export default function WorkflowsTable() {
  return (
    <section className="px-6 py-8 sm:px-8">
      <h2 className="font-display text-base font-semibold text-ink">
        Workflows
      </h2>
      <div className="mt-4 overflow-hidden rounded-lg border border-line">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface text-xs text-muted">
              <th className="px-4 py-3 font-normal">Name</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Last run</th>
              <th className="px-4 py-3 font-normal">Success rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {workflows.map((flow) => (
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
    </section>
  );
}
