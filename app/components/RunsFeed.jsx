import { runs } from "../data/dashboard";

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
        {runs.map((run) => (
          <li
            key={run.id}
            className={`border-l-2 ${BORDER[run.status]} bg-surface px-4 py-3`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink">{run.workflow}</p>
              <span className="font-data text-xs text-muted">{run.time}</span>
            </div>
            <p className="mt-1 text-xs text-muted">{run.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
