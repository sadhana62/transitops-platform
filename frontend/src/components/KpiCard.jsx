export default function KpiCard({ label, value, suffix, accent }) {
  return (
    <div className="rounded border border-base-700 bg-base-900 p-4">
      <p className="mono text-[10px] uppercase tracking-widest text-base-400">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold" style={{ color: accent || '#e7ecef' }}>
        {value}
        {suffix ? <span className="ml-1 text-lg text-base-400">{suffix}</span> : null}
      </p>
    </div>
  );
}
