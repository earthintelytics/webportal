import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Crosshair, MapPin, Search, History, PencilLine, ClipboardCheck } from 'lucide-react';
import { fetchParcels } from '../../services/smallholderApi';
import { serviceCall, NotConnectedError } from '../../services/serviceClient';
import { fetchScoutingObservations, submitScoutingObservation } from '../../services/scoutingService';
import { tenantKey } from '../../services/session';
import GeometryPreview from '../../modules/forms/inputs/GeometryPreview';
import MapDrawInput from '../../modules/forms/inputs/MapDrawInput';
import { geometryAreaHa } from '../../modules/forms/geo';

const CROPS = ['Oil palm', 'Cocoa', 'Rubber', 'Cashew', 'Cassava', 'Maize', 'Rice', 'Sugarcane', 'Mixed (several crops)', 'Other'];
const inputCls = 'w-full px-3.5 py-3 rounded-xl border border-gray-300 bg-white text-base text-gray-900 focus:border-green-700 focus:outline-none';
const btn = 'inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold';

// Parcel changes made without signal (or before the server accepts them) wait here.
const PENDING = 'fi_parcel_updates';
const readPending = () => { try { return JSON.parse(localStorage.getItem(tenantKey(PENDING)) || '[]'); } catch { return []; } };
const writePending = (list) => { try { localStorage.setItem(tenantKey(PENDING), JSON.stringify(list)); } catch { /* storage unavailable */ } };
// Quiet: this page says itself whether the change was sent or kept on the phone.
const sendUpdate = (u) => serviceCall(`/smallholder/parcels/${u.id}`, { method: 'PATCH', body: { ...u.changes, source: 'field' }, quiet: true });
// The server refused the change itself (bad boundary, view-only account): keeping it would never succeed.
const refused = (e) => e?.status >= 400 && e?.status < 500;

// History entries in plain words: "Main crop: Cocoa → Oil palm".
const FIELD_LABEL = { crop: 'Main crop', crops: 'Crops', planting_year: 'Year planted', area_ha: 'Area (ha)', geometry: 'Boundary', tenure: 'Tenure', certification_tags: 'Certifications', notes: 'Notes' };
const SOURCE_LABEL = { field: 'from the field', form: 'from a form', admin: 'from the office' };
const show = (v) => (v == null || v === '' ? 'not recorded' : Array.isArray(v) ? (v.length ? v.join(', ') : 'none') : String(v));
const describeChanges = (changes = {}) => Object.entries(changes).map(([k, v]) => {
  const label = FIELD_LABEL[k] || k.replace(/_/g, ' ');
  if (k === 'geometry') return 'Boundary redrawn';
  if (v && typeof v === 'object' && !Array.isArray(v) && ('old' in v || 'new' in v)) return `${label}: ${show(v.old)} → ${show(v.new)}`;
  return `${label}: ${show(v)}`;
});

const centre = (g) => {
  const ring = g?.type === 'Polygon' ? g.coordinates[0] : g?.type === 'MultiPolygon' ? g.coordinates[0][0] : g?.type === 'Point' ? [g.coordinates] : [];
  if (!ring.length) return null;
  return { lon: ring.reduce((s, c) => s + c[0], 0) / ring.length, lat: ring.reduce((s, c) => s + c[1], 0) / ring.length };
};
const km = (a, b) => {
  const r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

/**
 * Field page, made for a phone: find a parcel (search or nearest to me), open
 * it, see its history, record a visit or update it. Works without signal:
 * visits and updates are kept on the phone and sent when back online.
 */
const FieldPage = () => {
  const [parcels, setParcels] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [me, setMe] = useState(null);
  const [open, setOpen] = useState(null);
  const [pending, setPending] = useState(readPending);

  useEffect(() => {
    fetchParcels().then((fc) => setParcels(fc?.features || [])).catch((e) => setError(e instanceof NotConnectedError ? 'No connection: parcels open once you are online again.' : e.message));
  }, []);

  // Send changes kept on the phone whenever the page opens or the phone comes back online.
  const flush = useCallback(async () => {
    const list = readPending(); if (!list.length) return;
    const keep = [];
    for (const u of list) { try { await sendUpdate(u); } catch (e) { if (!refused(e)) keep.push(u); } }
    writePending(keep); setPending(keep);
  }, []);
  useEffect(() => { const t = setTimeout(flush, 0); window.addEventListener('online', flush); return () => { clearTimeout(t); window.removeEventListener('online', flush); }; }, [flush]);

  const locate = () => navigator.geolocation?.getCurrentPosition((p) => setMe({ lat: p.coords.latitude, lon: p.coords.longitude }), () => setError('Allow location to sort parcels by distance.'), { enableHighAccuracy: true, timeout: 20000 });

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    let rows = (parcels || []).map((f) => ({ f, c: centre(f.geometry) }));
    if (t) rows = rows.filter(({ f }) => [f.properties.member_name, f.properties.group_name, f.properties.crop, String(f.properties.id)].join(' ').toLowerCase().includes(t));
    if (me) rows = rows.map((r) => ({ ...r, d: r.c ? km(me, r.c) : Infinity })).sort((a, b) => a.d - b.d);
    return rows.slice(0, 200);
  }, [parcels, q, me]);

  if (open) return <ParcelView feature={open} onBack={() => setOpen(null)} onPending={() => setPending(readPending())} />;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-gray-900">Field</h1>
        <p className="text-sm text-gray-500 mt-1">Open a parcel on the farm to see its history, record a visit or update it.</p>
      </div>
      {pending.length > 0 && <p className="text-sm rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3">{pending.length} parcel update{pending.length > 1 ? 's' : ''} saved on this phone, sent when the connection allows.</p>}
      <div className="flex gap-2">
        <label className="flex-1 min-w-0 flex items-center gap-2 px-3.5 rounded-xl border border-gray-300 bg-white">
          <Search size={16} className="text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Member, group or crop" className="flex-1 min-w-0 py-3 text-base outline-none bg-transparent" />
        </label>
        <button type="button" onClick={locate} aria-label="Sort by nearest to me" className={`${btn} shrink-0 border border-gray-300 bg-white text-gray-800`}><Crosshair size={16} /><span className="hidden sm:inline">Nearest</span></button>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!parcels && !error && <p className="text-sm text-gray-500">Loading parcels…</p>}
      {parcels && parcels.length === 0 && <p className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-xl p-5 text-center">No parcels yet. They are added from the registration form or Members and parcels.</p>}
      {list.length > 0 && <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl bg-white">
        {list.map(({ f, d }) => (
          <li key={f.properties.id}>
            <button type="button" onClick={() => setOpen(f)} className="w-full text-left px-4 py-3.5 flex items-center gap-3 active:bg-gray-50">
              <MapPin size={18} className="text-green-700 shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-gray-900 truncate">{f.properties.member_name || `Parcel ${f.properties.id}`}</span>
                <span className="block text-xs text-gray-500 truncate">{[f.properties.group_name, f.properties.crop, f.properties.area_ha ? `${f.properties.area_ha} ha` : null].filter(Boolean).join(' · ')}</span>
              </span>
              {d != null && Number.isFinite(d) && <span className="text-xs text-gray-500 shrink-0">{d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`}</span>}
            </button>
          </li>
        ))}
      </ul>}
    </div>
  );
};

function ParcelView({ feature, onBack, onPending }) {
  const [pr, setPr] = useState(feature.properties);
  const plotId = `P${pr.id}`;
  const [tab, setTab] = useState('history');
  const [visits, setVisits] = useState(null);
  const [changes, setChanges] = useState(null); // server history of parcel updates (G68)
  const [msg, setMsg] = useState('');

  const loadHistory = useCallback(() => {
    fetchScoutingObservations(plotId).then((v) => setVisits(Array.isArray(v) ? v : [])).catch(() => setVisits([]));
    serviceCall(`/smallholder/parcels/${pr.id}/history`).then((h) => setChanges(Array.isArray(h) ? h : [])).catch(() => setChanges(null));
  }, [plotId, pr.id]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const timeline = useMemo(() => [
    ...(visits || []).map((v) => ({ at: v.observed_at || v.created_at, kind: 'Visit', text: [v.finding_type?.replace(/_/g, ' '), v.notes].filter(Boolean).join(': '), by: v.scout_name })),
    ...(changes || []).map((c) => ({ at: c.changed_at, kind: 'Update', lines: describeChanges(c.changes), notes: c.notes, by: [c.changed_by, SOURCE_LABEL[c.source]].filter(Boolean).join(' ') })),
  ].filter((e) => e.at).sort((a, b) => String(b.at).localeCompare(String(a.at))), [visits, changes]);

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700"><ArrowLeft size={16} />All parcels</button>
      <div>
        <h1 className="font-display text-2xl font-semibold text-gray-900">{pr.member_name || `Parcel ${pr.id}`}</h1>
        <p className="text-sm text-gray-500 mt-1">{[pr.group_name, pr.crop, pr.planting_year && `planted ${pr.planting_year}`, pr.area_ha && `${pr.area_ha} ha`].filter(Boolean).join(' · ') || 'No details yet'}</p>
      </div>
      {feature.geometry && <GeometryPreview geometry={feature.geometry} />}
      {msg && <p className="text-sm rounded-xl border border-green-200 bg-green-50 text-green-900 px-4 py-3">{msg}</p>}
      <div role="tablist" className="grid grid-cols-3 gap-2">
        {[['history', 'History', History], ['visit', 'Record a visit', ClipboardCheck], ['update', 'Update parcel', PencilLine]].map(([id, label, Icon]) => (
          <button key={id} role="tab" aria-selected={tab === id} type="button" onClick={() => { setTab(id); setMsg(''); }}
            className={`${btn} border ${tab === id ? 'border-green-700 bg-green-50 text-green-900' : 'border-gray-300 bg-white text-gray-700'}`}><Icon size={16} />{label}</button>
        ))}
      </div>

      {tab === 'history' && (
        <section className="space-y-2">
          {changes === null && <p className="text-xs text-gray-500">The record of parcel updates could not be loaded; visits are shown below.</p>}
          {visits === null ? <p className="text-sm text-gray-500">Loading…</p> : timeline.length === 0 ? (
            <p className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-xl p-5 text-center">No visits or updates recorded yet.</p>
          ) : (
            <ol className="border-l-2 border-gray-200 ml-2 space-y-4">
              {timeline.map((e, i) => (
                <li key={i} className="pl-4 relative">
                  <span className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full ${e.kind === 'Visit' ? 'bg-green-700' : 'bg-sky-600'}`} />
                  <p className="text-xs text-gray-500">{new Date(e.at).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {e.kind}{e.by ? ` · ${e.by}` : ''}</p>
                  {e.lines ? (
                    <ul className="text-sm text-gray-800 space-y-0.5">{e.lines.length ? e.lines.map((l) => <li key={l}>{l}</li>) : <li>—</li>}</ul>
                  ) : <p className="text-sm text-gray-800">{e.text || '—'}</p>}
                  {e.notes && <p className="text-sm text-gray-500 mt-0.5">“{e.notes}”</p>}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {tab === 'visit' && <VisitForm plotId={plotId} onDone={(t) => { setMsg(t); setTab('history'); loadHistory(); }} />}
      {tab === 'update' && <UpdateForm feature={{ ...feature, properties: pr }} onDone={(t, saved) => { if (saved) setPr((p) => ({ ...p, ...saved })); setMsg(t); setTab('history'); onPending(); loadHistory(); }} />}
    </div>
  );
}

function VisitForm({ plotId, onDone }) {
  const [f, setF] = useState({ findingType: 'healthy_normal', cropStage: '', notes: '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const pos = await new Promise((res) => navigator.geolocation ? navigator.geolocation.getCurrentPosition((p) => res(p.coords), () => res(null), { timeout: 8000 }) : res(null));
      const r = await submitScoutingObservation({ plotId, findingType: f.findingType, cropStage: f.cropStage, notes: f.notes, latitude: pos?.latitude, longitude: pos?.longitude });
      onDone(r.synced ? 'Visit recorded.' : 'No signal: the visit is saved on this phone and sent later.');
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block space-y-1.5"><span className="text-sm font-semibold text-gray-800">What did you find?</span>
        <select className={inputCls} value={f.findingType} onChange={(e) => setF({ ...f, findingType: e.target.value })}>
          <option value="healthy_normal">All looks fine</option><option value="water_stress">Short of water / wilting</option><option value="pest_infestation">Pests</option>
          <option value="fungal_disease">Disease on leaves</option><option value="nitrogen_deficiency">Yellow leaves (feeding)</option><option value="weed_competition">Many weeds</option>
        </select></label>
      <label className="block space-y-1.5"><span className="text-sm font-semibold text-gray-800">Growth stage <span className="font-normal text-gray-500">(optional)</span></span>
        <select className={inputCls} value={f.cropStage} onChange={(e) => setF({ ...f, cropStage: e.target.value })}>
          <option value="">Not noted</option><option value="Emergence">Young plants</option><option value="Vegetative">Growing</option><option value="Flowering">Flowering</option><option value="Grain/Fruit Filling">Fruit or grain forming</option><option value="Maturity / Harvest">Ready to harvest</option>
        </select></label>
      <label className="block space-y-1.5"><span className="text-sm font-semibold text-gray-800">Notes</span>
        <textarea rows={3} className={`${inputCls} resize-none`} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="What you saw and what was done" /></label>
      {err && <p className="text-sm text-red-700">{err}</p>}
      <button type="submit" disabled={busy} className={`${btn} w-full text-white bg-green-700 disabled:opacity-50`}>{busy ? 'Saving…' : 'Save visit'}</button>
    </form>
  );
}

function UpdateForm({ feature, onDone }) {
  const pr = feature.properties;
  const [f, setF] = useState({ crop: pr.crop || '', planting_year: pr.planting_year || '', notes: '' });
  const [geometry, setGeometry] = useState(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const year = new Date().getFullYear();
  const yearErr = f.planting_year && (!/^\d{4}$/.test(String(f.planting_year)) || f.planting_year < 1950 || f.planting_year > year) ? `Use a year between 1950 and ${year}.` : '';
  const submit = async (e) => {
    e.preventDefault(); if (yearErr) return; setBusy(true); setErr('');
    const changes = {};
    if (f.crop !== (pr.crop || '')) changes.crop = f.crop;
    if (String(f.planting_year) !== String(pr.planting_year || '')) changes.planting_year = f.planting_year ? Number(f.planting_year) : null;
    if (f.notes.trim()) changes.notes = f.notes.trim();
    if (geometry) changes.geometry = { type: geometry.type, coordinates: geometry.coordinates };
    if (!Object.keys(changes).length) { setErr('Nothing changed.'); setBusy(false); return; }
    const update = { id: pr.id, changes, at: new Date().toISOString() };
    try {
      const res = await sendUpdate(update);
      const saved = res && typeof res === 'object' ? { crop: res.crop, crops: res.crops, planting_year: res.planting_year, area_ha: res.area_ha } : null;
      onDone(res?.changes && !Object.keys(res.changes).length ? 'Nothing was different from what is recorded.' : 'Parcel updated. The change is kept in its history.', saved);
    } catch (e2) {
      if (refused(e2)) {
        setErr(e2.status === 403 ? 'Your account can view parcels but not change them.' : `Not saved: ${e2.message}`);
        return;
      }
      // No signal, or updating from the field not switched on yet: keep it on the phone.
      writePending([...readPending(), update]);
      onDone(e2 instanceof NotConnectedError ? 'Saved on this phone. It is sent when the connection (or parcel updating) is available.' : `Saved on this phone; the server said: ${e2.message}`);
    } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block space-y-1.5"><span className="text-sm font-semibold text-gray-800">Main crop</span>
        <select className={inputCls} value={f.crop} onChange={(e) => setF({ ...f, crop: e.target.value })}>
          <option value="">Not recorded</option>{CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
          {f.crop && !CROPS.includes(f.crop) && <option value={f.crop}>{f.crop}</option>}
        </select></label>
      <label className="block space-y-1.5"><span className="text-sm font-semibold text-gray-800">Year planted</span>
        <input inputMode="numeric" className={inputCls} value={f.planting_year} onChange={(e) => setF({ ...f, planting_year: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })} placeholder={`e.g. ${year - 5}`} />
        {yearErr && <span className="text-xs text-red-700">{yearErr}</span>}</label>
      <div className="space-y-1.5"><span className="text-sm font-semibold text-gray-800">Boundary <span className="font-normal text-gray-500">(redraw only if it changed)</span></span>
        <MapDrawInput shape="area" value={geometry} onChange={setGeometry} near={feature.geometry} />
        {geometry && <p className="text-xs text-gray-600">New area about {geometryAreaHa(geometry).toFixed(2)} ha.</p>}
      </div>
      <label className="block space-y-1.5"><span className="text-sm font-semibold text-gray-800">Notes</span>
        <textarea rows={2} className={`${inputCls} resize-none`} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Why it changed" /></label>
      {err && <p className="text-sm text-red-700">{err}</p>}
      <button type="submit" disabled={busy || !!yearErr} className={`${btn} w-full text-white bg-green-700 disabled:opacity-50`}>{busy ? 'Saving…' : 'Save update'}</button>
    </form>
  );
}

export default FieldPage;
