import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polygon, ZoomControl } from 'react-leaflet';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
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
  const [panelOpen, setPanelOpen] = useState(true);
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

  // Known before any monitoring run: blocks, estates and area from the uploaded boundaries.
  const overview = useMemo(() => {
    const g = {};
    let area = 0;
    let withArea = 0;
    plotsData.forEach((p) => {
      const e = p.subfarm || 'No estate';
      g[e] = (g[e] || 0) + 1;
      const a = parseFloat(p.area_ha ?? p.area);
      if (Number.isFinite(a)) { area += a; withArea += 1; }
    });
    return { estates: Object.entries(g).sort((a, b) => b[1] - a[1]), area: withArea ? area : null };
  }, [plotsData]);
  const one = unitLabel === 'blocks' ? 'block' : unitLabel.replace(/s$/, '');

  if (!measures.length) {
    return <div className="p-10 text-sm text-gray-500">No measures with classes for this service yet. The admin sets them under Map classes.</div>;
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="flex-1 relative min-w-0">
        {/* Measure choice and the summary toggle, down the right edge of the map */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[1000] flex flex-col items-stretch gap-2">
          <button type="button" onClick={() => setPanelOpen((o) => !o)}
            title={panelOpen ? 'Hide the summary' : 'Show the summary'} aria-label={panelOpen ? 'Hide the summary' : 'Show the summary'}
            className="inline-flex items-center justify-center h-9 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
            {panelOpen ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
          </button>
          <div className="flex flex-col gap-1 bg-white border border-gray-200 rounded-xl p-1.5">
            {measures.map((x) => (
              <button key={x.key} type="button" onClick={() => setKey(x.key)} title={x.title || x.label}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold text-center ${x.key === m.key ? 'bg-[var(--brand-primary)] text-white' : 'text-gray-700 hover:bg-gray-100'}`}>{x.label}</button>
            ))}
          </div>
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
          <ResizeMap trigger={`${key}-${panelOpen}`} />
        </MapContainer>

        {/* Colour key, only once there are values to colour */}
        {stats && (
          <div className="absolute bottom-6 left-4 z-[1000] bg-white border border-gray-200 rounded-xl px-3 py-2.5 space-y-1.5 max-w-[240px]">
            <p className="text-xs font-semibold text-gray-900">{m.label}{m.unit ? ` (${m.unit})` : ''}</p>
            {(m.classes || []).map((c) => (
              <div key={c.label} className="flex items-center gap-2 text-xs text-gray-700">
                <span className="w-3 h-3 rounded-sm border border-black/20 shrink-0" style={{ background: c.hex }} />{c.label}
              </div>
            ))}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-sm border border-black shrink-0 bg-transparent" />No result yet
            </div>
          </div>
        )}
      </div>

      {panelOpen && <aside className="w-[360px] shrink-0 bg-white border-l border-gray-200 overflow-y-auto p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-xl font-semibold text-gray-900">Block summary</h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-gray-200 text-gray-600">{plotsData.length} {unitLabel}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{m.label}{m.unit ? ` (${m.unit})` : ''}: one value per {one}, from the latest result.</p>
        </div>

        {!stats ? (
          <>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">Waiting for the first results</p>
              <p className="text-sm text-gray-500 mt-1">Each {one} gets a value and a colour after the first monitoring run. Until then, this is what is set up.</p>
            </div>

            <dl className="grid grid-cols-3 gap-2">
              {[[unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1), plotsData.length], ['Estates', overview.estates.length], ['Hectares', overview.area != null ? Math.round(overview.area).toLocaleString() : '—']].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-gray-200 px-3 py-2.5">
                  <dt className="text-xs text-gray-500">{k}</dt>
                  <dd className="font-display text-lg font-semibold text-gray-900 tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>

            {overview.estates.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">{unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1)} per estate</h3>
                <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl">
                  {overview.estates.map(([e, n]) => (
                    <li key={e} className="flex justify-between px-3 py-2 text-sm"><span className="text-gray-800">{e}</span><span className="font-semibold text-gray-900 tabular-nums">{n}</span></li>
                  ))}
                </ul>
              </section>
            )}

            {(m.classes || []).length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">How {unitLabel} will be coloured</h3>
                <ul className="space-y-1.5">
                  {m.classes.map((c) => (
                    <li key={c.label} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 text-gray-800"><span className="w-3 h-3 rounded-sm border border-black/20 shrink-0" style={{ background: c.hex }} />{c.label}</span>
                      <span className="text-xs text-gray-400 tabular-nums">{c.range[0]} to {c.range[1]}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
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
      </aside>}
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
      key: e.key, label: e.short_label || e.label || e.key.toUpperCase(), title: e.description || e.label || e.short_label, unit: '',
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
