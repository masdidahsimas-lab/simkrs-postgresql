export default function StatusBadge({ status = "pending" }) {
  const normalized = String(status).toLowerCase();

  const config =
    normalized === "approved" || normalized === "disetujui"
      ? {
          label: "Disetujui",
          style: "bg-emerald-50 text-emerald-700 ring-emerald-200",
          dot: "bg-emerald-500",
        }
      : normalized === "rejected" || normalized === "ditolak"
        ? {
            label: "Ditolak",
            style: "bg-red-50 text-red-700 ring-red-200",
            dot: "bg-red-500",
          }
        : {
            label: "Menunggu",
            style: "bg-amber-50 text-amber-700 ring-amber-200",
            dot: "bg-amber-500",
          };

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${config.style}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}