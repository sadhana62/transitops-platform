export default function KpiCard({ label, value, suffix, accent }) {
  return (
    <div className="min-w-0 rounded border border-base-700 bg-base-900 p-4 sm:p-5">
      <p className="mono truncate text-[10px] uppercase tracking-widest text-base-400">
        {label}
      </p>

      <p
        className="mt-2 break-words font-display text-2xl font-semibold sm:text-3xl"
        style={{ color: accent || '#e7ecef' }}
      >
        {value}
        {suffix ? (
          <span className="ml-1 text-base text-base-400 sm:text-lg">{suffix}</span>
        ) : null}
      </p>
    </div>
  );
}