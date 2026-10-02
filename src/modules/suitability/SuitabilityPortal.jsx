import React, { useState, useEffect } from 'react';
import { ArrowLeft, Target, Plus, Building2, Sparkles, Layers, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import CompanySelector from './components/CompanySelector';
import CropCard from './components/CropCard';
import SuitabilityOnboarding from './SuitabilityOnboarding';
import SuitabilityCropAnalysis from './SuitabilityCropAnalysis';
import { SUITABILITY_CROPS } from './suitabilityCatalog';
import { fetchCompanies, fetchSuitabilityRuns } from './suitabilityApi';

const SuitabilityPortal = ({ onBack, onSignOut }) => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('okomu');
  const [runs, setRuns] = useState([]);
  const [runsMap, setRunsMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [activeCropId, setActiveCropId] = useState(null);
  const [selectedRun, setSelectedRun] = useState(null);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [showNewRunModal, setShowNewRunModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const comps = await fetchCompanies();
      setCompanies(comps);

      if (comps.length > 0) {
        const defaultCid = comps[0].company_id;
        setSelectedCompanyId(defaultCid);
        await loadRunsForCompany(defaultCid);
      } else {
        setIsOnboarding(true);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const loadRunsForCompany = async (companyId) => {
    const allRuns = await fetchSuitabilityRuns(companyId);
    setRuns(allRuns);
    const map = {};
    allRuns.forEach(run => {
      if (!map[run.crop] || new Date(run.created_at) > new Date(map[run.crop].created_at)) {
        map[run.crop] = run;
      }
    });
    setRunsMap(map);
  };

  const handleSelectCompany = async (companyId) => {
    setSelectedCompanyId(companyId);
    await loadRunsForCompany(companyId);
  };

  const handleOnboardingComplete = async (newCompanyId) => {
    setIsOnboarding(false);
    const comps = await fetchCompanies();
    setCompanies(comps);
    setSelectedCompanyId(newCompanyId);
    await loadRunsForCompany(newCompanyId);
  };

  const handleOpenRun = (run) => {
    setSelectedRun(run);
    setActiveCropId(run.crop);
  };

  if (isOnboarding) {
    return <SuitabilityOnboarding onComplete={handleOnboardingComplete} />;
  }

  if (activeCropId) {
    return (
      <SuitabilityCropAnalysis
        cropId={activeCropId}
        companyId={selectedCompanyId}
        initialRun={selectedRun}
        onBack={() => {
          setActiveCropId(null);
          setSelectedRun(null);
          loadRunsForCompany(selectedCompanyId);
        }}
        onOpenAiAdvisor={(run) => {
          window.location.hash = `#/portal/advisor?run_id=${run.run_id}`;
        }}
      />
    );
  }

  const currentCompany = companies.find(c => c.company_id === selectedCompanyId) || companies[0];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans flex flex-col">
      {/* Portal Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Back to Portal Hub"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                <Target size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Land Suitability Analysis
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  FAO Framework Land Evaluation • Multi-Criteria Decision Engine
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <CompanySelector
              companies={companies}
              selectedCompanyId={selectedCompanyId}
              onSelectCompany={handleSelectCompany}
              onTriggerOnboarding={() => setIsOnboarding(true)}
            />
            <button
              onClick={() => {
                setActiveCropId('oil_palm');
                setSelectedRun(null);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs"
            >
              <Plus size={16} />
              <span>Run New Analysis</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1 space-y-8">
        {/* Section 1: Recent Analysis Runs Table */}
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Analysis Runs</h2>
              <p className="text-xs text-slate-500">Completed biophysical evaluations for {currentCompany?.company_name || selectedCompanyId}</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {runs.length} Evaluated {runs.length === 1 ? 'Run' : 'Runs'}
            </span>
          </div>

          {runs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p className="text-sm font-medium">No previous suitability runs recorded for this estate.</p>
              <p className="text-xs mt-1">Select a crop model below to execute your first land evaluation.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-6">Analysis Run</th>
                    <th className="py-3 px-6">Crop</th>
                    <th className="py-3 px-6">Target Estate / Area</th>
                    <th className="py-3 px-6">Suitability Breakdown</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {runs.map((run) => {
                    const s1Area = run.classes_area_ha?.S1 || 0;
                    const s2Area = run.classes_area_ha?.S2 || 0;
                    const s3Area = run.classes_area_ha?.S3 || 0;
                    const nArea = run.classes_area_ha?.N || run.classes_area_ha?.N2 || 0;
                    const tot = run.total_area_ha || (s1Area + s2Area + s3Area + nArea) || 1;

                    const s1Pct = Math.round((s1Area / tot) * 100);
                    const s2Pct = Math.round((s2Area / tot) * 100);
                    const s3Pct = Math.round((s3Area / tot) * 100);
                    const nPct = Math.round((nArea / tot) * 100);

                    const runDate = new Date(run.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });

                    return (
                      <tr
                        key={run.run_id}
                        onClick={() => handleOpenRun(run)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-6 font-medium text-slate-900">
                          <div>{run.variant || 'Standard Assessment'}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{runDate}</div>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {run.crop?.replace('_', ' ').replace('-', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="font-semibold text-slate-800">{currentCompany?.company_name || 'Main Estate'}</div>
                          <div className="text-[11px] text-slate-500">{run.total_area_ha ? `${run.total_area_ha.toFixed(1)} ha` : 'Estate Boundary'}</div>
                        </td>
                        <td className="py-3.5 px-6 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-1 text-[11px]">
                            <span className="text-emerald-700 font-bold">S1: {s1Pct}%</span>
                            <span className="text-lime-700 font-bold">S2: {s2Pct}%</span>
                            <span className="text-amber-700 font-bold">S3: {s3Pct}%</span>
                            {nPct > 0 && <span className="text-rose-700 font-bold">N: {nPct}%</span>}
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                            <div style={{ width: `${s1Pct}%` }} className="bg-emerald-600 h-full" title={`S1: ${s1Pct}%`} />
                            <div style={{ width: `${s2Pct}%` }} className="bg-lime-500 h-full" title={`S2: ${s2Pct}%`} />
                            <div style={{ width: `${s3Pct}%` }} className="bg-amber-500 h-full" title={`S3: ${s3Pct}%`} />
                            <div style={{ width: `${nPct}%` }} className="bg-rose-500 h-full" title={`N: ${nPct}%`} />
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>Completed</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800">
                            <span>Open Analysis</span>
                            <ArrowRight size={14} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section 2: Crop Evaluation Models Grid */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Crop Evaluation Models</h2>
              <p className="text-xs text-slate-500">Select any crop to view requirements or run new evaluations</p>
            </div>
            <span className="text-xs font-medium text-slate-500">{SUITABILITY_CROPS.length} Supported Crops</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SUITABILITY_CROPS.map((crop) => (
              <CropCard
                key={crop.id}
                crop={crop}
                lastRun={runsMap[crop.id]}
                onClick={() => {
                  setSelectedRun(runsMap[crop.id] || null);
                  setActiveCropId(crop.id);
                }}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SuitabilityPortal;
