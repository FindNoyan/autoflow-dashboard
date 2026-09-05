const RUNS = [
  { workflow: "New lead → CRM sync", time: "10:42 AM", status: "success" },
  { workflow: "Order fulfillment webhook", time: "10:15 AM", status: "failed" },
  { workflow: "Slack standup summary", time: "9:58 AM", status: "success" },
  { workflow: "Invoice reminder emails", time: "9:40 AM", status: "success" },
];

const BORDER = {
  success: "border-teal",
  failed: "border-red",
};

export default function RunsFeed() {
  return (
    <section className="px-6 pb-10 sm:px-8">
      <h2 className="font-display text-base font-semibold text-ink">
        Recent runs
      </h2>
      <ul className="mt-4 space-y-3">
        {RUNS.map((run, i) => (
          <li
            key={i}
            className={`border-l-2 ${BORDER[run.status]} bg-surface px-4 py-3`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink">{run.workflow}</p>
              <span className="font-data text-xs text-muted">{run.time}</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              {run.status === "success"
                ? "Completed without errors"
                : "Failed — webhook returned a 500"}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
