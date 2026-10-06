import { KPI_DEFS, kpisFor } from './kpiCatalog';

/** The Overview KPI cards for one crop or service, from real data only. */
const KpiCards = ({ serviceId, cropType, ctx }) => {
  const kpis = kpisFor(serviceId, cropType);
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${kpis.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
      {kpis.map(({ id, label }) => {
        const def = KPI_DEFS[id];
        const r = def.compute(ctx);
        return (
          <div key={id} className="bg-white p-6 rounded-2xl border border-gray-200">
            <p className="text-sm font-medium text-gray-600">{label || def.label}</p>
            {r.missing ? (
              <>
                <p className="font-mono text-2xl text-gray-300 mt-3">—</p>
                <p className="text-xs text-gray-500 mt-2">{r.missing}</p>
              </>
            ) : (
              <>
                <p className="font-mono text-2xl text-gray-900 mt-3">{r.value}</p>
                {r.sub && <p className="text-xs text-gray-500 mt-2">{r.sub}</p>}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default KpiCards;
