import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { fetchCompanies, fetchSuitabilityRuns } from './suitabilityApi';
import { HERO_PLACEHOLDERS } from '../../constants/heroPlaceholders';
import { Card, StatusPill, PrimaryButton, NotConnectedNote, ErrorNote, EmptyState } from '../../components/page/PageKit';
import { useLoader } from '../../components/page/useLoader';
import { CROPS, cropName, runStatus, CLASSES } from './suitabilityLabels';
import RunWizard from './pages/RunWizard';
import RunResult from './pages/RunResult';
import FactorGuide from './pages/FactorGuide';

const TABS = [['runs', 'Analyses'], ['crops', 'Crops'], ['guide', 'Factor guide']];

/**
 * Crop suitability: a FarmIntelytics team tool. Every organisation's
 * analyses in one list; the organisation is chosen when starting one.
 * Clients receive the reports. Thresholds and advice come from the admin.
 */
const SuitabilityPortal = ({ onBack, onSignOut }) => {
  const companies = useLoader(fetchCompanies);
  const [tab, setTab] = useState('runs');
  const [openRun, setOpenRun] = useState(null); // { runId, companyId }
  const [wizard, setWizard] = useState(null); // null | { crop }
  const orgs = companies.data || [];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && <button onClick={onBack} aria-label="Back to the hub" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><ArrowLeft size={18} /></button>}
            <div className="leading-tight">
              <p className="font-display text-base font-semibold">Crop suitability</p>
              <p className="text-xs text-[var(--text-muted)]">FarmIntelytics team</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onSignOut && <button onClick={onSignOut} className="px-4 py-2 rounded-[10px] text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Sign out</button>}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-10 py-10 space-y-8">
        {companies.state === 'not_connected' && <NotConnectedNote what="The suitability service" />}
        {companies.state === 'error' && <ErrorNote message={companies.error} onRetry={companies.reload} />}

        {openRun ? (
          <RunResult runId={openRun.runId} companyId={openRun.companyId} onBack={() => setOpenRun(null)} />
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight">Where each crop fits</h1>
                <p className="text-sm text-gray-500 mt-2 max-w-2xl">Which land suits which crop, how well, and what limits it, from rainfall, temperature, terrain, soil and flooding, with forest and protected land excluded.</p>
              </div>
              <PrimaryButton onClick={() => setWizard({ crop: null })} disabled={!orgs.length}><Plus size={15} />New analysis</PrimaryButton>
            </div>

            <nav className="flex gap-8 border-b border-gray-200">
              {TABS.map(([id, label]) => (
                <button key={id} onClick={() => setTab(id)} className={`-mb-px pb-3 border-b-2 text-sm font-medium ${tab === id ? 'border-green-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>{label}</button>
              ))}
            </nav>

            {tab === 'guide' ? <FactorGuide companyId="" /> : companies.state === 'ready' && (
              orgs.length ? <Runs orgs={orgs} view={tab} onOpen={setOpenRun} onNew={(crop) => setWizard({ crop })} />
                : <EmptyState title="No organisations yet" text="Onboard an organisation in the admin console first." />
            )}
          </>
        )}
      </main>

      {wizard && (
        <RunWizard orgs={orgs} initialCrop={wizard.crop} onClose={() => setWizard(null)} onStarted={(run, companyId) => { setWizard(null); setOpenRun({ runId: run.run_id, companyId }); }} />
      )}
    </div>
  );
};

// Every organisation's analyses in one list (the API answers per organisation).
function Runs({ orgs, view, onOpen, onNew }) {
  const load = useCallback(async () => {
    const lists = await Promise.all(orgs.map((o) => fetchSuitabilityRuns(o.company_id)
      .then((rs) => rs.map((r) => ({ ...r, company_id: r.company_id || o.company_id, company_name: o.company_name || o.company_id })))));
    return lists.flat();
  }, [orgs]);
  const { data, state, error, reload } = useLoader(load);
  useEffect(() => { const t = setInterval(reload, 30000); return () => clearInterval(t); }, [reload]);
  const runs = useMemo(() => [...(data || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [data]);
  const latest = useMemo(() => runs.reduce((m, r) => (m[r.crop] ? m : { ...m, [r.crop]: r }), {}), [runs]);

  if (state === 'not_connected') return <NotConnectedNote what="Suitability analyses" />;
  if (state === 'error') return <ErrorNote message={error} onRetry={reload} />;
  if (state === 'loading') return <p className="text-sm text-gray-500">Loading analyses…</p>;

  if (view === 'crops') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {CROPS.map((c) => {
          const r = latest[c.id];
          return (
            <button key={c.id} onClick={() => (r ? onOpen({ runId: r.run_id, companyId: r.company_id }) : onNew(c.id))} className="group text-left bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300">
              <div className="relative h-28 bg-gray-100 bg-cover bg-center" style={HERO_PLACEHOLDERS[c.photo] ? { backgroundImage: `url(${HERO_PLACEHOLDERS[c.photo]})` } : undefined}>
                <img src={c.photo} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover saturate-[0.9]" />
              </div>
              <div className="p-4">
                <p className="font-display font-semibold text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-500 mt-1">{r ? `Last: ${r.company_name}, ${new Date(r.created_at).toLocaleDateString()}` : 'No analysis yet: start one'}</p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  if (!runs.length) return <EmptyState title="No analyses yet" text="Start one with New analysis, or pick a crop on the Crops tab." />;
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
          <tr><th className="px-5 py-3">Organisation</th><th className="px-5 py-3">Crop</th><th className="px-5 py-3">Started</th><th className="px-5 py-3">Area</th><th className="px-5 py-3">Result</th><th className="px-5 py-3">Status</th></tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {runs.map((r) => {
            const [label, tone] = runStatus(r.status);
            const total = Object.values(r.classes_area_ha || {}).reduce((a, b) => a + (Number(b) || 0), 0);
            return (
              <tr key={r.run_id} onClick={() => onOpen({ runId: r.run_id, companyId: r.company_id })} className="cursor-pointer hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-900">{r.company_name}</td>
                <td className="px-5 py-3 font-semibold text-gray-900">{cropName(r.crop)}{r.variant ? <span className="font-normal text-gray-500"> · {r.variant}</span> : null}</td>
                <td className="px-5 py-3 text-gray-600">{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
                <td className="px-5 py-3 font-mono text-gray-700">{r.total_area_ha ? `${Math.round(r.total_area_ha).toLocaleString()} ha` : '—'}</td>
                <td className="px-5 py-3">
                  {total > 0 ? (
                    <div className="flex h-2.5 w-40 rounded-full overflow-hidden bg-gray-100" title={CLASSES.map((c) => `${c.label}: ${Math.round(((r.classes_area_ha?.[c.key] || 0) / total) * 100)}%`).join(' · ')}>
                      {CLASSES.map((c) => <span key={c.key} className={c.bar} style={{ width: `${((r.classes_area_ha?.[c.key] || 0) / total) * 100}%` }} />)}
                    </div>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-5 py-3"><StatusPill tone={tone}>{label}</StatusPill></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

export default SuitabilityPortal;
