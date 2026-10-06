import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { fetchCompanies, fetchSuitabilityRuns } from '../../services/suitabilityApi';
import { HERO_PLACEHOLDERS } from '../../constants/heroPlaceholders';
import { PrimaryButton, NotConnectedNote, ErrorNote, EmptyState } from '../../components/page/PageKit';
import { useLoader } from '../../components/page/useLoader';
import { CROPS, CLASSES } from './suitabilityLabels';
import RunWizard from './pages/RunWizard';
import RunResult from './pages/RunResult';
import FactorGuide from './pages/FactorGuide';
import RunsTable from './pages/RunsTable';
import CropDataPanel from './pages/CropDataPanel';

const CROP_TABS = [['runs', 'Analyses'], ['data', 'Data that improves it'], ['factors', 'Factors and advice']];
const Tabs = ({ tabs, value, onChange }) => (
  <nav className="flex gap-8 border-b border-gray-200 overflow-x-auto">
    {tabs.map(([id, label, count]) => (
      <button key={id} onClick={() => onChange(id)} className={`-mb-px pb-3 border-b-2 text-sm font-medium whitespace-nowrap ${value === id ? 'border-green-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
        {label}{count != null && <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{count}</span>}
      </button>
    ))}
  </nav>
);

/**
 * Crop suitability (FarmIntelytics team tool). Crops first: each crop has its
 * own analyses, the client data that improves them, and its factors. An
 * analysis opens its result, AI summary and report. Clients receive reports.
 */
const SuitabilityPortal = ({ onBack, onSignOut }) => {
  const companies = useLoader(fetchCompanies);
  const orgs = useMemo(() => companies.data || [], [companies.data]);
  const [cropId, setCropId] = useState(null);
  const [tab, setTab] = useState('crops');
  const [cropTab, setCropTab] = useState('runs');
  const [openRun, setOpenRun] = useState(null);
  const [wizard, setWizard] = useState(null);

  const load = useCallback(async () => {
    const lists = await Promise.all(orgs.map((o) => fetchSuitabilityRuns(o.company_id)
      .then((rs) => rs.map((r) => ({ ...r, company_id: r.company_id || o.company_id, company_name: o.company_name || o.company_id })))));
    return lists.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [orgs]);
  const runsLoader = useLoader(load);
  const { reload } = runsLoader;
  useEffect(() => { const t = setInterval(reload, 30000); return () => clearInterval(t); }, [reload]);
  const runs = useMemo(() => runsLoader.data || [], [runsLoader.data]);
  const crop = CROPS.find((c) => c.id === cropId);
  const cropRuns = runs.filter((r) => r.crop === cropId || r.crop === crop?.admin);
  const open = (r) => setOpenRun({ runId: r.run_id, companyId: r.company_id });
  const back = openRun ? () => setOpenRun(null) : crop ? () => setCropId(null) : onBack;

  const body = () => {
    if (companies.state === 'not_connected') return <NotConnectedNote what="The suitability service" />;
    if (companies.state === 'error') return <ErrorNote message={companies.error} onRetry={companies.reload} />;
    if (companies.state === 'ready' && !orgs.length) return <EmptyState title="No organisations yet" text="Onboard an organisation in the admin console first." />;
    if (openRun) return <RunResult runId={openRun.runId} companyId={openRun.companyId} onBack={() => setOpenRun(null)} />;
    const runsState = runsLoader.state === 'not_connected' ? <NotConnectedNote what="Suitability analyses" />
      : runsLoader.state === 'error' ? <ErrorNote message={runsLoader.error} onRetry={reload} />
        : runsLoader.state === 'loading' ? <p className="text-sm text-gray-500">Loading analyses…</p> : null;

    if (crop) {
      return (
        <>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={crop.photo} alt="" className="w-16 h-16 rounded-2xl object-cover" />
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight">{crop.name}</h1>
                <p className="text-sm text-gray-500 mt-1">Where {crop.name.toLowerCase()} fits, for every organisation.</p>
              </div>
            </div>
            <PrimaryButton onClick={() => setWizard({ crop: crop.id })}><Plus size={15} />New {crop.name.toLowerCase()} analysis</PrimaryButton>
          </div>
          <Tabs tabs={CROP_TABS.map(([id, l]) => [id, l, id === 'runs' ? cropRuns.length : null])} value={cropTab} onChange={setCropTab} />
          {cropTab === 'runs' && (runsState || (cropRuns.length
            ? <RunsTable runs={cropRuns} onOpen={open} showCrop={false} />
            : <EmptyState title={`No ${crop.name.toLowerCase()} analyses yet`} text="Start one with the button above. The client's data on the next tab makes it sharper." />))}
          {cropTab === 'data' && <CropDataPanel crop={crop} />}
          {cropTab === 'factors' && <FactorGuide companyId="" cropId={crop.id} />}
        </>
      );
    }

    return (
      <>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Where each crop fits</h1>
            <p className="text-sm text-gray-500 mt-2 max-w-2xl">Choose a crop to see its analyses, start a new one, and see which client data improves it. Rainfall, temperature, terrain, soil and flooding are scored; forest and protected land are excluded.</p>
          </div>
        </div>
        <Tabs tabs={[['crops', 'Crops'], ['all', 'All analyses', runs.length]]} value={tab} onChange={setTab} />
        {tab === 'all' ? (runsState || (runs.length ? <RunsTable runs={runs} onOpen={open} /> : <EmptyState title="No analyses yet" text="Choose a crop to start one." />)) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CROPS.map((c) => {
              const mine = runs.filter((r) => r.crop === c.id || r.crop === c.admin);
              const last = mine[0];
              const total = last ? Object.values(last.classes_area_ha || {}).reduce((a, b) => a + (Number(b) || 0), 0) : 0;
              return (
                <button key={c.id} onClick={() => { setCropId(c.id); setCropTab('runs'); }} className="group text-left bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-400">
                  <div className="relative h-32 bg-gray-100 bg-cover bg-center" style={HERO_PLACEHOLDERS[c.photo] ? { backgroundImage: `url(${HERO_PLACEHOLDERS[c.photo]})` } : undefined}>
                    <img src={c.photo} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-display font-semibold text-gray-900">{c.name}</p>
                      <span className="text-xs text-gray-500">{mine.length ? `${mine.length} ${mine.length === 1 ? 'analysis' : 'analyses'}` : 'None yet'}</span>
                    </div>
                    {total > 0 ? (
                      <div className="flex h-2 rounded-full overflow-hidden bg-gray-100" title={`Latest: ${last.company_name}`}>
                        {CLASSES.map((k) => <span key={k.key} className={k.bar} style={{ width: `${((last.classes_area_ha?.[k.key] || 0) / total) * 100}%` }} />)}
                      </div>
                    ) : <div className="h-2 rounded-full bg-gray-100" />}
                    <p className="text-xs text-gray-500 truncate">{last ? `Latest: ${last.company_name}` : 'Open to start the first analysis'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {back && <button onClick={back} aria-label="Back" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><ArrowLeft size={18} /></button>}
            <div className="leading-tight">
              <p className="font-display text-base font-semibold">Crop suitability{crop && !openRun ? ` · ${crop.name}` : ''}</p>
              <p className="text-xs text-[var(--text-muted)]">FarmIntelytics team</p>
            </div>
          </div>
          {onSignOut && <button onClick={onSignOut} className="px-4 py-2 rounded-[10px] text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Sign out</button>}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 lg:px-10 py-10 space-y-8">{body()}</main>
      {wizard && (
        <RunWizard orgs={orgs} initialCrop={wizard.crop} onClose={() => setWizard(null)}
          onStarted={(run, companyId) => { setWizard(null); reload(); setOpenRun({ runId: run.run_id, companyId }); }} />
      )}
    </div>
  );
};

export default SuitabilityPortal;
