import { useEffect, useState } from 'react';
import { ArrowLeft, FileDown, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchSuitabilityRun, generateReportPdf } from '../../../services/suitabilityApi';
import { fetchSuitabilityThresholds } from '../../../services/adminApi';
import { Card, StatusPill, SecondaryButton, ErrorNote, EmptyState } from '../../../components/page/PageKit';
import { CLASSES, classLabel, classTone, runStatus, isFinished, cropName, adviceFor, CROPS } from '../suitabilityLabels';

const POLL_MS = 5000;
// Shares may arrive as fractions (0–1) or percentages.
const pct = (v) => { const n = Number(v) || 0; return Math.round(n <= 1 ? n * 100 : n); };
const ha = (v) => (v != null ? `${Number(v).toLocaleString(undefined, { maximumFractionDigits: 1 })} ha` : '—');

/**
 * One analysis: its real status (re-checked until it finishes), area per
 * class, the result map when the pipeline produced one, and every field with
 * its limiting factor and the advice set in the admin.
 */
const RunResult = ({ runId, companyId, onBack }) => {
  const [run, setRun] = useState(null);
  const [error, setError] = useState('');
  const [actions, setActions] = useState({});
  const [pdf, setPdf] = useState({ busy: false, msg: '' });

  useEffect(() => {
    let live = true;
    let timer;
    const load = () => fetchSuitabilityRun(runId)
      .then((r) => { if (!live) return; setRun(r); setError(''); if (!isFinished(r.status)) timer = setTimeout(load, POLL_MS); })
      .catch((e) => { if (live) setError(e.message); });
    load();
    return () => { live = false; clearTimeout(timer); };
  }, [runId]);

  useEffect(() => {
    if (!run?.crop) return undefined;
    let live = true;
    const admin = CROPS.find((c) => c.id === run.crop)?.admin || run.crop;
    fetchSuitabilityThresholds(admin, companyId).then((d) => { if (live) setActions(d?.farmer_actions || {}); }).catch(() => {});
    return () => { live = false; };
  }, [run?.crop, companyId]);

  const report = async () => {
    setPdf({ busy: true, msg: '' });
    try {
      const r = await generateReportPdf(runId);
      if (r?.pdf_url && r.status === 'ready') window.open(r.pdf_url, '_blank', 'noopener');
      setPdf({ busy: false, msg: r?.status === 'ready' ? '' : 'The report is being prepared.' });
    } catch (e) { setPdf({ busy: false, msg: e.message }); }
  };

  const back = <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"><ArrowLeft size={15} />All analyses</button>;
  if (error && !run) return <div className="space-y-6">{back}<ErrorNote message={error} /></div>;
  if (!run) return <div className="space-y-6">{back}<p className="text-sm text-gray-500">Loading the analysis…</p></div>;

  const [statusLabel, statusTone] = runStatus(run.status);
  const total = Object.values(run.classes_area_ha || {}).reduce((a, b) => a + (Number(b) || 0), 0) || Number(run.total_area_ha) || 0;
  const done = isFinished(run.status) && run.status !== 'failed';

  return (
    <div className="space-y-8">
      {back}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-green-700">{cropName(run.crop)}{run.variant ? ` · ${run.variant}` : ''}</p>
          <h2 className="font-display text-3xl font-semibold text-gray-900 tracking-tight mt-1">Where {cropName(run.crop).toLowerCase()} fits</h2>
          <p className="text-sm text-gray-500 mt-2">{[run.irrigated ? 'Irrigated' : 'Rain-fed', run.strictness && `${run.strictness} thresholds`, run.created_at && new Date(run.created_at).toLocaleString()].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill tone={statusTone}>{statusLabel}{!isFinished(run.status) && run.progress != null ? ` · ${run.progress}%` : ''}</StatusPill>
          {done && <SecondaryButton onClick={report} disabled={pdf.busy}><FileDown size={15} />{pdf.busy ? 'Preparing…' : 'Report (PDF)'}</SecondaryButton>}
        </div>
      </div>
      {pdf.msg && <p className="text-sm text-gray-600">{pdf.msg}</p>}

      {!isFinished(run.status) && (
        <Card className="p-6 flex items-center gap-3 text-sm text-gray-700">
          <RefreshCw size={16} className="animate-spin text-green-700" />
          The pipeline is working on this analysis. This page updates by itself.
        </Card>
      )}
      {run.status === 'failed' && <ErrorNote message="This analysis failed in the pipeline. Start it again, or check Admin → Logs." />}

      {done && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CLASSES.map((c) => {
              const v = Number(run.classes_area_ha?.[c.key] || 0);
              return (
                <Card key={c.key} className="p-5">
                  <StatusPill tone={c.tone}>{c.label}</StatusPill>
                  <p className="font-mono text-2xl text-gray-900 mt-3">{ha(v)}</p>
                  <p className="text-xs text-gray-500 mt-1">{total ? `${Math.round((v / total) * 100)} % of the area` : '—'}</p>
                </Card>
              );
            })}
          </div>

          {run.tiles?.result ? (
            <Card className="overflow-hidden">
              <div className="h-[420px]">
                <MapContainer center={[0, 0]} zoom={2} className="h-full w-full">
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Esri" />
                  <TileLayer url={run.tiles.result} opacity={0.75} />
                </MapContainer>
              </div>
              <div className="flex flex-wrap gap-4 px-5 py-3 border-t border-gray-100 text-xs text-gray-600">
                {CLASSES.map((c) => <span key={c.key} className="inline-flex items-center gap-1.5"><span className={`w-3 h-3 rounded-sm ${c.bar}`} />{c.label}</span>)}
              </div>
            </Card>
          ) : (
            <p className="text-sm text-gray-500">The result map appears here when the pipeline produces its map layer for this analysis.</p>
          )}

          {(run.fields || []).length === 0 ? <EmptyState title="No field results" text="This analysis has no per-field breakdown." /> : (
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
                  <tr><th className="px-5 py-3">Field</th><th className="px-5 py-3">Result</th><th className="px-5 py-3">Share of the field</th><th className="px-5 py-3">What limits it</th><th className="px-5 py-3">What to do</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {run.fields.map((f) => {
                    const advice = (f.limiting_factors || []).map((x) => adviceFor(x, actions)).find(Boolean);
                    return (
                      <tr key={f.field_id}>
                        <td className="px-5 py-3 font-semibold text-gray-900">{f.field_id}</td>
                        <td className="px-5 py-3"><StatusPill tone={classTone(f.overall_class)}>{classLabel(f.overall_class)}</StatusPill></td>
                        <td className="px-5 py-3">
                          <div className="flex h-2.5 w-40 rounded-full overflow-hidden bg-gray-100">
                            {CLASSES.map((c) => <span key={c.key} className={c.bar} style={{ width: `${pct(f.share?.[c.key])}%` }} />)}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-700">{(f.limiting_factors || []).join(', ') || 'Nothing'}</td>
                        <td className="px-5 py-3 text-gray-700">{advice || (f.limiting_factors?.length ? <span className="text-gray-400">Set advice in Admin → Map classes and suitability</span> : 'Plant as usual')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}

          <details className="text-sm text-gray-600">
            <summary className="cursor-pointer text-gray-800 font-medium">How this was worked out</summary>
            <p className="mt-2 max-w-3xl">FAO land evaluation: each factor (rainfall and dry season from CHIRPS, temperature from ERA5-Land, slope and wetness from the Copernicus 30 m terrain model, soil from SoilGrids 250 m, flooding from radar) is scored for the crop with the thresholds set in the admin; forest on 31 December 2020 (JRC GFC2020), protected areas (WDPA) and river banks are excluded. Soil at 250 m and rainfall at 5 km make this a planning screen, not a field survey.</p>
          </details>
        </>
      )}
    </div>
  );
};

export default RunResult;
