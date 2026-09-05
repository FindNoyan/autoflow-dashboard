const COLORS = {
  active: "bg-teal",
  paused: "bg-muted",
  failed: "bg-red",
};

export default function StatusDot({ status }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${COLORS[status]} ${
        status === "active" ? "status-dot--active" : ""
      }`}
    />
  );
}
