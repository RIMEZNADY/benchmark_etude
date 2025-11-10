type KpiCardProps = {
  label: string;
  value: string;
  description?: string;
};

export function KpiCard({ label, value, description }: KpiCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-primary-700">{value}</p>
      {description ? (
        <p className="mt-3 text-sm text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

