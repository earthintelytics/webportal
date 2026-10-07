import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polygon, ZoomControl } from 'react-leaflet';
import { FitBoundsToPlots, ResizeMap, ZoomToPlot } from '../map/MapHelpers';
import { hexOf, legendFor, useLayerLegends } from '../legends/layerLegends';

const fmt = (v, d = 2) => (v == null ? '—' : Number(v).toFixed(d));

/**
 * Block summary: one value per block for the chosen measure, coloured by the
 * admin's classes, with the statistics beside it (average, middle, range, how
 * many blocks fall in each class, the lowest blocks and averages per estate).
 * The one view where blocks are filled, because comparing them is its purpose.
 *
 * measures: [{ key, label, unit, classes: [{ label, range: [a, b], hex }], valueOf(plot) }]
 */
export default function BlockSummaryPage({ plotsData = [], measures = [], basemapUrl, basemapAttribution, basemapMaxNativeZoom, defaultMapCenter, farmBoundary, filterEstate, unitLabel = 'blocks' }) {
  const [key, setKey] = useState(measures[0]?.key || null);
  const [found, setFound] = useState(null);
  const m = measures.find((x) => x.key === key) || measures[0];

  const rows = useMemo(() => (m ? plotsData.map((p) => ({ p, v: m.valueOf(p) })) : []), [plotsData, m]);
  const withValue = rows.filter((r) => r.v != null);
  const classOf = (v) => (m?.classes || []).find((c) => v >= c.range[0] && v <= c.range[1]) || null;

  const stats = useMemo(() => {
    if (!withValue.length) return null;
    const vals = withValue.map((r) => r.v).sort((a, b) => a - b);
    const mid = vals.length % 2 ? vals[(vals.length - 1) / 2] : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2;
    return { n: vals.length, mean: vals.reduce((a, b) => a + b, 0) / vals.length, median: mid, min: vals[0], max: vals[vals.length - 1] };
  }, [withValue]);

  const perClass = (m?.classes || []).map((c) => ({ ...c, count: withValue.filter((r) => classOf(r.v) === c).length }));
  const maxCount = Math.max(1, ...perClass.map((c) => c.count));
  const lowest = [...withValue].sort((a, b) => a.v - b.v).slice(0, 5);
  const perEstate = useMemo(() => {
    const g = {};
    withValue.forEach(({ p, v }) => { const e = p.subfarm || 'No estate'; (g[e] ||= []).push(v); });
    return Object.entries(g).map(([e, vs]) => ({ estate: e, n: vs.length, mean: vs.reduce((a, b) => a + b, 0) / vs.length })).sort((a, b) => a.mean - b.mean);
  }, [withValue]);

  if (!measures.length) {
    return <div className="p-10 text-sm text-gray-500">No measures with classes for this service yet. The admin sets them under Map classes.</div>;
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="flex-1 relative min-w-0">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex flex-wrap justify-center gap-2 bg-white border border-gray-200 rounded-xl p-1.5">
          {measures.map((x) => (
            <button key={x.key} type="button" onClick={() => setKey(x.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${x.key === m.key ? 'bg-green-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>{x.label}</button>
          ))}
        </div>
        <MapContainer center={defaultMapCenter} zoom={13} maxZoom={22} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer key={basemapUrl} url={basemapUrl} attribution={basemapAttribution} maxZoom={22} maxNativeZoom={basemapMaxNativeZoom} />
          {rows.map(({ p, v }) => {
            const c = v == null ? null : classOf(v);
            return p.coords?.length ? (
              <Polygon key={p.id} positions={p.coords} eventHandlers={{ click: () => setFound(p) }}
                pathOptions={{ color: '#000000', weight: 1.5, fillColor: c?.hex || 'transparent', fillOpacity: c ? 0.7 : 0 }} />
            ) : null;
          })}
          <FitBoundsToPlots plotsData={plotsData} farmBoundary={farmBoundary} refitKey={filterEstate} />
          <ZoomToPlot plot={found} />
          <ZoomControl position="bottomright" />
          <ResizeMap trigger={key} />
        </MapContainer>
      </div>

      <aside className="w-[340px] shrink-0 bg-white border-l border-gray-200 overflow-y-auto p-5 space-y-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-gray-900">Block summary</h2>
          <p className="text-sm text-gray-500 mt-1">{m.label}{m.unit ? ` (${m.unit})` : ''}: one value per {unitLabel === 'blocks' ? 'block' : unitLabel.replace(/s$/, '')}, latest result.</p>
        </div>

        {!stats ? (
          <p className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-xl p-4">No results for these {unitLabel} yet. They appear after the first monitoring run.</p>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-3">
              {[['Average', fmt(stats.mean)], ['Middle value', fmt(stats.median)], ['Lowest', fmt(stats.min)], ['Highest', fmt(stats.max)]].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-gray-200 px-3 py-2.5"><dt className="text-xs text-gray-500">{k}</dt><dd className="font-display text-lg font-semibold text-gray-900">{v}</dd></div>
              ))}
            </dl>
            <p className="text-xs text-gray-500">{stats.n} of {plotsData.length} {unitLabel} have a result.</p>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">How the {unitLabel} spread</h3>
              {perClass.map((c) => (
                <div key={c.label} className="space-y-1">
                  <div className="flex justify-between text-xs"><span className="text-gray-700">{c.label} <span className="text-gray-400">{c.range[0]}–{c.range[1]}</span></span><span className="font-semibold text-gray-900">{c.count}</span></div>
                  <div className="h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full" style={{ width: `${(c.count / maxCount) * 100}%`, background: c.hex }} /></div>
                </div>
              ))}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">Lowest {unitLabel}</h3>
              <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl">
                {lowest.map(({ p, v }) => (
                  <li key={p.id}><button type="button" onClick={() => setFound(p)} className="w-full flex justify-between px-3 py-2 text-sm hover:bg-gray-50">
                    <span className="text-gray-800">{p.name || p.id}{p.subfarm ? <span className="text-gray-400"> · {p.subfarm}</span> : null}</span><span className="font-semibold text-gray-900">{fmt(v)}</span>
                  </button></li>
                ))}
              </ul>
            </section>

            {perEstate.length > 1 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Average per estate</h3>
                <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl">
                  {perEstate.map((e) => (
                    <li key={e.estate} className="flex justify-between px-3 py-2 text-sm"><span className="text-gray-800">{e.estate} <span className="text-gray-400">· {e.n}</span></span><span className="font-semibold text-gray-900">{fmt(e.mean)}</span></li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

/** Measures for the page from the crop's index legends and the shared layer classes. */
// eslint-disable-next-line react-refresh/only-export-components
export function useBlockMeasures({ cropProfileEntries = [], blockValue, cropType, telemetryById = {} }) {
  useLayerLegends();
  const fromIndices = cropProfileEntries
    .filter((e) => Array.isArray(e.legend) && e.legend.length)
    .map((e) => ({
      key: e.key, label: e.short_label || e.label || e.key.toUpperCase(), unit: '',
      classes: [...e.legend].filter((l) => Array.isArray(l.range)).sort((a, b) => a.range[0] - b.range[0]).map((l) => ({ label: l.label, range: l.range, hex: l.color || hexOf(l) })),
      valueOf: (p) => blockValue(p, e.key),
    }));
  const layer = (k, label, field) => {
    const l = legendFor(k, cropType);
    if (!l) return null;
    const vals = Object.values(telemetryById).some((t) => t?.[field] != null);
    if (!vals) return null;
    return { key: k, label, unit: l.unit, classes: l.classes.map((c) => ({ label: c.label, range: c.range, hex: hexOf(c) })), valueOf: (p) => telemetryById[p.id]?.[field] ?? null };
  };
  return [...fromIndices, layer('rain', 'Rain', 'rainfall_mm'), layer('heat', 'Surface heat', 'surface_lst_celsius')].filter(Boolean);
}
