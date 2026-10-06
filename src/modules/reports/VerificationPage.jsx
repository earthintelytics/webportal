import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Download, Info, ChevronDown } from 'lucide-react';

/**
 * Verification page (design: docs/services/reports-and-verification.md):
 * "can we prove it?" A checklist with evidence per check, what the client
 * still has to provide, and an evidence pack. A check that did not run is
 * "Not checked", never "Passed".
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/farmintelytics-engine/agromonitoring';
const STATUS = {
  passed: ['Passed', 'bg-green-50 text-green-800 border-green-200'],
  review: ['Needs review', 'bg-amber-50 text-amber-800 border-amber-200'],
  failed: ['Failed', 'bg-red-50 text-red-700 border-red-200'],
  not_checked: ['Not checked', 'bg-gray-50 text-gray-600 border-gray-200'],
};
const KINDS = {
  boundary: 'Boundaries and geolocation',
  eudr: 'EUDR deforestation-free supply',
  carbon: 'Carbon estimate evidence',
  restoration: 'Restoration progress evidence',
};
const Card = ({ className = '', children }) => <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}>{children}</div>;

function localChecks(kind, plots) {
  const polys = plots.filter(p => (p.coords || []).length >= 4);
  const open = polys.filter(p => { const c = p.coords; const a = c[0], b = c[c.length - 1]; return a && b && (a[0] !== b[0] || a[1] !== b[1]); });
  const big = plots.filter(p => (parseFloat(p.area) || 0) > 4 && (p.coords || []).length < 4);
  const checks = [
    { id: 'boundary', name: 'Every plot has a valid boundary', status: plots.length === 0 ? 'not_checked' : polys.length === plots.length && !open.length ? 'passed' : 'review',
      why: plots.length === 0 ? 'No individual plots are registered yet.' : `${polys.length} of ${plots.length} plots have a polygon${open.length ? `; ${open.length} are not closed` : ''}.`, evidence: { sources: ['Boundaries uploaded at onboarding'] } },
    { id: 'geolocation', name: 'Plots over 4 ha have a polygon, not a point', status: plots.length === 0 ? 'not_checked' : big.length ? 'failed' : 'passed',
      why: plots.length === 0 ? 'No individual plots are registered yet.' : big.length ? `${big.length} plots over 4 ha have no polygon.` : 'All plots over 4 ha are polygons.', evidence: { sources: ['EUDR Article 9 geolocation rule'] } },
  ];
  if (kind === 'eudr') checks.push(
    { id: 'forest2020', name: 'No forest cleared after 31 December 2020', status: 'not_checked', why: 'The check is being rebuilt on the EU reference forest map and yearly loss data.', evidence: { sources: ['JRC GFC2020', 'Hansen Global Forest Change', 'RADD alerts'] } },
    { id: 'protected', name: 'No overlap with protected areas', status: 'not_checked', why: 'Protected-area data (WDPA) is being connected.', evidence: { sources: ['WDPA'] } },
  );
  if (kind === 'carbon') checks.push({ id: 'method', name: 'Method, factors and calibration recorded', status: 'not_checked', why: 'Carbon figures are uncalibrated estimates until plot inventory data is uploaded.', evidence: { sources: ['IPCC Tier 1 factors'] } });
  if (kind === 'restoration') checks.push({ id: 'survival', name: 'Survival backed by field surveys', status: 'not_checked', why: 'Survival comes from the client’s survey uploads (Farm data).', evidence: { sources: ['Survival surveys'] } });
  return checks;
}

export default function VerificationPage({ plots, serviceId, onOpenData }) {
  const defaultKind = serviceId === 'eudr-check' ? 'eudr' : ['carbon-ffb', 'carbon-groups', 'carbon-estimator'].includes(serviceId) ? 'carbon' : serviceId === 'land-restoration' ? 'restoration' : 'boundary';
  const [kind, setKind] = useState(defaultKind);
  const [remote, setRemote] = useState(null);
  const [open, setOpen] = useState(null);
  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('fi_token');
    fetch(`${API_BASE}/verification?kind=${kind}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => (r.ok && (r.headers.get('content-type') || '').includes('json') ? r.json() : null))
      .then(d => { if (active) setRemote(d); }).catch(() => { if (active) setRemote(null); });
    return () => { active = false; };
  }, [kind]);
  const checks = useMemo(() => remote?.checks || localChecks(kind, plots || []), [remote, kind, plots]);
  const outstanding = remote?.outstanding || (kind === 'eudr' ? [{ item: 'EUDR plot register (commodity, producer, country per plot)', dataset: 'eudr-plot-register' }, { item: 'Legality documents and supplier declarations (kept by you, listed in the due-diligence statement)' }]
    : kind === 'carbon' ? [{ item: 'Carbon plot inventory for calibration', dataset: 'carbon-plot-inventory' }] : kind === 'restoration' ? [{ item: 'Planting records and survival surveys', dataset: 'restoration-survival' }] : []);

  const pack = () => {
    const fc = { type: 'FeatureCollection', properties: { kind, generated: new Date().toISOString(), checks: checks.map(c => ({ name: c.name, status: c.status, why: c.why })) },
      features: (plots || []).filter(p => (p.coords || []).length >= 4).map(p => ({ type: 'Feature', properties: { plot: p.name || p.id, estate: p.subfarm || null, area: p.area }, geometry: { type: 'Polygon', coordinates: [p.coords.map(([lat, lon]) => [lon, lat])] } })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(fc)], { type: 'application/geo+json' }));
    Object.assign(document.createElement('a'), { href: url, download: `verification-${kind}.geojson` }).click();
    URL.revokeObjectURL(url);
  };
  const counts = checks.reduce((m, c) => ({ ...m, [c.status]: (m[c.status] || 0) + 1 }), {});

  return (
    <div className="p-10 space-y-8">
      <div className="flex items-start gap-4">
        <span className="w-11 h-11 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-700 shrink-0"><ShieldCheck size={20} /></span>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Verification</h2>
          <p className="text-sm text-gray-500 font-medium mt-2 max-w-2xl">The evidence behind a claim someone else will check: a buyer, an auditor or a lender. Each check says what it found and on what data.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(KINDS).map(([k, label]) => <button key={k} onClick={() => setKind(k)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${kind === k ? 'bg-green-50 border-green-600 text-green-800' : 'bg-white border-gray-300 text-gray-600'}`}>{label}</button>)}
      </div>
      {!remote && <div className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50/60 px-5 py-4 text-sm text-sky-900"><Info size={18} className="shrink-0 mt-0.5" /><div>Boundary and geolocation checks run here on your registered plots. Checks that need the verification service show <strong>Not checked</strong> until it is connected; nothing is marked passed without a real check.</div></div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(STATUS).map(([k, [label]]) => <Card key={k} className="px-5 py-4"><div className="text-xs font-semibold text-gray-600">{label}</div><div className="text-2xl font-bold text-gray-900 mt-1">{counts[k] || 0}</div></Card>)}
      </div>

      <Card className="divide-y divide-gray-100">
        {checks.map(c => (
          <div key={c.id} className="p-5">
            <button onClick={() => setOpen(o => o === c.id ? null : c.id)} className="w-full flex items-start justify-between gap-4 text-left">
              <div>
                <div className="flex items-center gap-2"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS[c.status]?.[1]}`}>{STATUS[c.status]?.[0]}</span><span className="text-sm font-semibold text-gray-900">{c.name}</span></div>
                <p className="text-sm text-gray-600 mt-1.5">{c.why}</p>
              </div>
              <ChevronDown size={16} className={`text-gray-400 mt-1 transition-transform ${open === c.id ? 'rotate-180' : ''}`} />
            </button>
            {open === c.id && (
              <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 p-4 text-sm text-gray-700 space-y-1">
                <div><span className="font-semibold">Data used:</span> {(c.evidence?.sources || []).join(', ') || '—'}</div>
                <div><span className="font-semibold">Checked:</span> {c.ran_at ? new Date(c.ran_at).toLocaleString() : c.status === 'not_checked' ? 'not yet' : 'now, on your registered plots'}</div>
              </div>
            )}
          </div>
        ))}
      </Card>

      {outstanding.length > 0 && (
        <Card className="p-6 space-y-3">
          <div className="text-sm font-semibold text-gray-900">Still needed from you</div>
          <ul className="space-y-2">{outstanding.map(o => <li key={o.item} className="flex items-center justify-between gap-4 text-sm text-gray-700"><span>{o.item}</span>{o.dataset && <button onClick={() => onOpenData?.(o.dataset)} className="shrink-0 text-sm font-semibold text-green-700 hover:underline">Add in Farm data</button>}</li>)}</ul>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button onClick={pack} disabled={!(plots || []).length} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-500"><Download size={15} />Download evidence (GeoJSON)</button>
        <span className="text-xs text-gray-500">Plots with their check results. The full PDF pack comes with the verification service.</span>
      </div>
    </div>
  );
}
