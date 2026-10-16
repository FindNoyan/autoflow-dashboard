import { stats } from "../data/dashboard";

export default function StatsRow() {
  return (
    <div className="grid grid-cols-2 divide-x divide-line border-b border-line sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="px-6 py-6">
          <p className="text-xs text-muted">{stat.label}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink">
            {stat.value}
          </p>
          <p className="mt-1 font-data text-xs text-muted">{stat.trend}</p>
        </div>
      ))}
    </div>
  );
}
