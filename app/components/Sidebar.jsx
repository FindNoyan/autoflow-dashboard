const LINKS = [
  { label: "Overview", active: true },
  { label: "Workflows" },
  { label: "Runs" },
  { label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-line px-5 py-6 sm:block">
      <p className="font-display text-lg font-semibold text-ink">AutoFlow</p>
      <nav className="mt-8 flex flex-col gap-1">
        {LINKS.map((link) => (
          <a
            key={link.label}
            href="#"
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              link.active
                ? "bg-surface text-ink"
                : "text-muted hover:bg-surface hover:text-ink"
            }`}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
