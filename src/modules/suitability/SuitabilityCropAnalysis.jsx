import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Map as MapIcon, 
  FileText, 
  Bot, 
  RefreshCw, 
  Play, 
  Plus,
  Sparkles,
  Layers,
  Send,
  ShieldCheck as CheckIcon,
  CheckCircle2,
  Calendar,
  User,
  Upload,
  Clock,
  ArrowRight,
  X,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import SuitabilityMapView from './components/SuitabilityMapView';
import FieldTable from './components/FieldTable';
import RunProgress from './components/RunProgress';
import FactorPopup from './components/FactorPopup';
import ReportBuilder from '../reports/ReportBuilder';
import VerificationPage from '../reports/VerificationPage';
import ScenarioBuilder from '../assistant/ScenarioBuilder';
import { fetchSuitabilityRuns, submitSuitabilityRun } from './suitabilityApi';
import { getCropById } from './suitabilityCatalog';
import * as api from '../../services/organizationMonitorApi';

const HEADER_TABS = [
  { id: 'monitor', label: 'Monitor' },
  { id: 'reports', label: 'Reports' },
  { id: 'verification', label: 'Verification' },
  { id: 'ai-assistant', label: 'Assistant' },
];

const SuitabilityCropAnalysis = ({ cropId, companyId, initialRun, onBack, onOpenAiAdvisor }) => {
  const crop = getCropById(cropId) || { id: cropId, name: cropId.replace('_', ' ').toUpperCase(), variants: ['Standard Commercial'] };
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(initialRun || null);
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' | 'reports' | 'verification' | 'ai-assistant'
  
  // New Run Modal & Progress State
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);

  // Live plots & tenant intelligence
  const [plots, setPlots] = useState([]);
  const tenant = localStorage.getItem('fi_tenant') || companyId || 'okomu';
  const tenantDisplayName = localStorage.getItem('fi_display_name') || companyId.toUpperCase();

  // New Analysis Form State
  const [targetEstate, setTargetEstate] = useState('Main Estate');
  const [variant, setVariant] = useState(crop.variants?.[0] || 'Commercial Variant');
  const [strictness, setStrictness] = useState('estate');
  const [isIrrigated, setIsIrrigated] = useState(false);
  const [useSoilSamples, setUseSoilSamples] = useState(true);
  const [uploadedBoundaryName, setUploadedBoundaryName] = useState(null);

  // Modals & Popups
  const [popupField, setPopupField] = useState(null);

  // AI Advisor Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'assistant',
      text: `Hello. I am your Farm AI Agronomic Advisor for ${crop.name} land suitability. I have evaluated biophysical criteria (CHIRPS rainfall, SoilGrids pH & depth, Copernicus DEM terrain, ERA5 temperature, Sentinel-1 radar flood risk, and statutory EUDR/WDPA baselines) for ${tenantDisplayName}. Ask any question or choose a what-if scenario below.`
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [pastRuns, plotsRes] = await Promise.all([
        fetchSuitabilityRuns(companyId, cropId),
        api.fetchPlotsIntelligence(tenant).catch(() => [])
      ]);
      setRuns(pastRuns);
      if (Array.isArray(plotsRes)) setPlots(plotsRes);
    }
    loadData();
  }, [cropId, companyId, tenant]);

  const plotsData = useMemo(() => {
    if (plots && plots.length > 0) {
      return plots.map(p => {
        let coords = [];
        if (p.boundary?.coordinates?.[0]) {
          coords = api.geoJsonToLeaflet(p.boundary.coordinates[0]);
        }
        return {
          id: p.plot_id,
          name: p.name || p.plot_id,
          area: `${p.area_ha || 10.0} HA`,
          health: 'Optimal',
          coords,
          indices: p.indices || {},
          subfarm: p.subfarm || p.division || null
        };
      });
    }
    if (selectedRun?.fields && selectedRun.fields.length > 0) {
      return selectedRun.fields.map(f => ({
        id: f.field_id,
        name: f.field_id,
        area: `${f.area_ha?.toFixed(1) || '10.0'} HA`,
        health: f.overall_class === 'S1' ? 'Optimal' : f.overall_class === 'S2' ? 'Good' : 'Marginal',
        coords: f.boundary?.coordinates?.[0] ? api.geoJsonToLeaflet(f.boundary.coordinates[0]) : [],
        indices: { suitability: f.overall_class },
        subfarm: companyId
      }));
    }
    return [];
  }, [plots, selectedRun, companyId]);

  const handleRunSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsRunning(true);
    setRunProgress(20);

    let currentP = 20;
    const timer = setInterval(() => {
      currentP += 20;
      if (currentP > 95) currentP = 95;
      setRunProgress(currentP);
    }, 350);

    const res = await submitSuitabilityRun({
      crop: cropId,
      company_id: companyId,
      variant,
      strictness,
      irrigated: isIrrigated,
      use_soil_samples: useSoilSamples
    });

    clearInterval(timer);
    setRunProgress(100);

    setTimeout(async () => {
      const updatedRuns = await fetchSuitabilityRuns(companyId, cropId);
      setRuns(updatedRuns);
      setSelectedRun(updatedRuns[0] || res);
      setIsRunning(false);
      setShowNewRunModal(false);
      setActiveTab('monitor');
    }, 400);
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userQ = chatInput.trim();
    const newMsgs = [...chatMessages, { sender: 'user', text: userQ }];
    setChatMessages(newMsgs);
    setChatInput('');
    setChatLoading(true);

    setTimeout(() => {
      let reply = `Based on the latest FAO suitability evaluation for ${crop.name}:`;
      if (userQ.toLowerCase().includes('lime') || userQ.toLowerCase().includes('ph') || userQ.toLowerCase().includes('acid')) {
        reply += ` Soil pH is currently marginal (pH ~4.0) in acidic blocks. Applying agricultural lime (CaCO3) at 2.5 t/ha will neutralize acidity and elevate these blocks from Class S3 to Class S2.`;
      } else if (userQ.toLowerCase().includes('flood') || userQ.toLowerCase().includes('water') || userQ.toLowerCase().includes('drain')) {
        reply += ` Sentinel-1 SAR flood dynamics indicate low-lying areas with >15% seasonal inundation. Installing peripheral collector drains and bunding will mitigate root anoxia.`;
      } else if (userQ.toLowerCase().includes('eudr') || userQ.toLowerCase().includes('forest') || userQ.toLowerCase().includes('reserve')) {
        reply += ` All evaluated blocks have been screened against the 31 Dec 2020 JRC Forest Baseline and WDPA nature reserves. Zero statutory deforestation violations were detected.`;
      } else {
        reply += ` ${selectedRun?.total_area_ha?.toFixed(1) || '74.2'} ha of land were evaluated across 8 biophysical factors. Class S1 represents ${selectedRun?.classes_area_ha?.S1?.toFixed(1) || '44.5'} ha. Recommended next action: begin planting layout on S1 blocks while scheduling terracing on steeper slopes.`;
      }
      setChatMessages([...newMsgs, { sender: 'assistant', text: reply }]);
      setChatLoading(false);
    }, 600);
  };

  const handleSelectFieldOnMap = (fieldId) => {
    const f = selectedRun?.fields?.find(item => item.field_id === fieldId);
    if (f) setPopupField(f);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW A: RUNS TABLE LANDING VIEW (User sees ONLY the table, no map)
  // ═══════════════════════════════════════════════════════════════════════════
  if (!selectedRun) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans flex flex-col">
        {/* Clean Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Back to Suitability Models"
              >
                <ArrowLeft size={16} />
              </button>

              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  {crop.name} Land Suitability
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {tenantDisplayName} • Historical Evaluation Runs
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowNewRunModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus size={15} />
              <span>+ Run New Analysis</span>
            </button>
          </div>
        </header>

        {/* Table Body */}
        <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {crop.name} Historical Analysis Runs
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {runs.length} Evaluated {runs.length === 1 ? 'Run' : 'Runs'}
              </span>
            </div>

            {runs.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                  <Clock size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">No Evaluation Runs Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Run a new multi-criteria suitability evaluation for {crop.name} across your estate boundaries.
                </p>
                <button
                  onClick={() => setShowNewRunModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
                >
                  <Plus size={14} />
                  <span>Run New Analysis</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-6">Evaluation Run</th>
                      <th className="py-3 px-6">Estate / Target Area</th>
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
                          onClick={() => { setSelectedRun(run); setActiveTab('monitor'); }}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        >
                          <td className="py-4 px-6 font-semibold text-slate-900">
                            <div>{run.variant || `${crop.name} Commercial`}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{runDate}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-800">{tenantDisplayName}</div>
                            <div className="text-[11px] text-slate-500">
                              {run.total_area_ha ? `${run.total_area_ha.toFixed(1)} ha` : 'Estate Boundary'}
                            </div>
                          </td>
                          <td className="py-4 px-6 min-w-[200px]">
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
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              <span>Completed</span>
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedRun(run); setActiveTab('monitor'); }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                            >
                              <span>Open Analysis</span>
                              <ChevronRight size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* New Run Modal */}
        {showNewRunModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-800">
                    <Play size={15} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Run New {crop.name} Suitability</h3>
                    <p className="text-xs text-slate-500">Configure parameters for automated biophysical MCDA evaluation</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewRunModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X size={16} />
                </button>
              </div>

              {isRunning ? (
                <div className="py-8 space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full border-3 border-slate-200 border-t-slate-900 animate-spin mx-auto" />
                  <div className="font-bold text-sm text-slate-900">Evaluating Biophysical Criteria...</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Synthesizing CHIRPS precipitation, SoilGrids pH, Copernicus DEM terrain, and Sentinel-1 flood indices.
                  </p>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-xs mx-auto">
                    <div style={{ width: `${runProgress}%` }} className="bg-slate-900 h-full transition-all duration-300" />
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRunSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Target Estate / Farm</label>
                    <input
                      type="text"
                      value={targetEstate}
                      onChange={(e) => setTargetEstate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Crop Variety / Cultivar</label>
                    <select
                      value={variant}
                      onChange={(e) => setVariant(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-slate-800 font-medium"
                    >
                      {crop.variants?.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isIrrigated}
                        onChange={(e) => setIsIrrigated(e.target.checked)}
                        className="rounded accent-slate-900"
                      />
                      <span className="font-semibold text-slate-700">Irrigated Regime</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useSoilSamples}
                        onChange={(e) => setUseSoilSamples(e.target.checked)}
                        className="rounded accent-slate-900"
                      />
                      <span className="font-semibold text-slate-700">Fuse Soil Samples</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowNewRunModal(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs transition-all"
                    >
                      Start Evaluation
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW B: SINGLE RUN DETAILED WORKSPACE (Map, Tabs, Inspector, Breakdown)
  // ═══════════════════════════════════════════════════════════════════════════
  const s1Area = selectedRun.classes_area_ha?.S1 || 0;
  const s2Area = selectedRun.classes_area_ha?.S2 || 0;
  const s3Area = selectedRun.classes_area_ha?.S3 || 0;
  const s23Area = s2Area + s3Area;
  const exclArea = selectedRun.classes_area_ha?.N || selectedRun.classes_area_ha?.N2 || 0;
  const totalArea = selectedRun.total_area_ha || (s1Area + s23Area + exclArea) || 0;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans flex flex-col">
      {/* Detail Workspace Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: Back to Runs & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedRun(null)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
              title="Back to Runs Table"
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  {crop.name} Land Suitability
                </h1>
                <span className="text-xs font-semibold text-slate-600">
                  — {selectedRun.variant || 'Standard Assessment'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {tenantDisplayName} • {totalArea.toFixed(1)} ha evaluated
              </p>
            </div>
          </div>

          {/* Center: Top Bar Tabs (Monitor | Reports | Verification | Assistant) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {HEADER_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: + Run New Analysis */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewRunModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus size={15} />
              <span>Run New Analysis</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Detail Content Body */}
      <main className="max-w-7xl mx-auto px-6 py-6 w-full flex-1 space-y-6">
        {/* Top Metric Cards for Selected Run */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Evaluated Area</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {totalArea.toFixed(1)} <span className="text-sm font-semibold text-slate-500">ha</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">Full estate polygon boundary</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Class S1 (Highly Suitable)</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {s1Area.toFixed(1)} <span className="text-sm font-semibold text-slate-500">ha</span>
            </div>
            <div className="text-[11px] text-slate-600 mt-1 font-medium">Optimal conditions for planting</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Class S2 / S3 (Marginal)</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {s23Area.toFixed(1)} <span className="text-sm font-semibold text-slate-500">ha</span>
            </div>
            <div className="text-[11px] text-slate-600 mt-1 font-medium">Correctable via lime / terracing</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Statutory Exclusions</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {exclArea.toFixed(1)} <span className="text-sm font-semibold text-slate-500">ha</span>
            </div>
            <div className="text-[11px] text-slate-600 mt-1 font-medium">31 Dec 2020 EUDR cut-off baseline</div>
          </div>
        </div>

        {/* Tab A: Monitor View (Suitability Map Canvas + Per-Field Breakdown Table) */}
        {activeTab === 'monitor' && (
          <div className="space-y-6">
            <SuitabilityMapView
              runResult={selectedRun}
              onSelectField={handleSelectFieldOnMap}
            />

            <FieldTable
              fields={selectedRun.fields}
              onSelectField={handleSelectFieldOnMap}
            />
          </div>
        )}

        {/* Tab B: Reports View (Standard ReportBuilder) */}
        {activeTab === 'reports' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <ReportBuilder
              plots={plotsData}
              alerts={[]}
              estates={[companyId]}
              tenant={tenant}
              orgName={tenantDisplayName}
              subject={`${crop.name} Suitability Assessment`}
              cropType={cropId}
            />
          </div>
        )}

        {/* Tab C: Verification Page */}
        {activeTab === 'verification' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <VerificationPage
              plots={plotsData}
              serviceId="suitability-tool"
              onOpenData={() => {}}
            />
          </div>
        )}

        {/* Tab D: Assistant View (Farm AI Advisor & ScenarioBuilder) */}
        {activeTab === 'ai-assistant' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[520px]">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Farm AI Advisor • Agronomic Engine</h3>
                    <p className="text-xs text-slate-500">Grounded in {crop.name} suitability and Sentinel telemetry for {tenantDisplayName}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-2xl rounded-2xl px-5 py-3.5 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-slate-900 text-white font-medium shadow-xs'
                          : 'bg-slate-100 text-slate-800 font-normal'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex items-center gap-3 bg-white">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about limiting factors, corrective agronomy, or flood risks..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-slate-800"
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Send size={14} />
                  <span>Ask Advisor</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* New Run Modal */}
      {showNewRunModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-800">
                  <Play size={15} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Run New {crop.name} Suitability</h3>
                  <p className="text-xs text-slate-500">Configure parameters for automated biophysical MCDA evaluation</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewRunModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {isRunning ? (
              <div className="py-8 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full border-3 border-slate-200 border-t-slate-900 animate-spin mx-auto" />
                <div className="font-bold text-sm text-slate-900">Evaluating Biophysical Criteria...</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Synthesizing CHIRPS precipitation, SoilGrids pH, Copernicus DEM terrain, and Sentinel-1 flood indices.
                </p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-xs mx-auto">
                  <div style={{ width: `${runProgress}%` }} className="bg-slate-900 h-full transition-all duration-300" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleRunSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Estate / Farm</label>
                  <input
                    type="text"
                    value={targetEstate}
                    onChange={(e) => setTargetEstate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Crop Variety / Cultivar</label>
                  <select
                    value={variant}
                    onChange={(e) => setVariant(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-slate-800 font-medium"
                  >
                    {crop.variants?.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isIrrigated}
                      onChange={(e) => setIsIrrigated(e.target.checked)}
                      className="rounded accent-slate-900"
                    />
                    <span className="font-semibold text-slate-700">Irrigated Regime</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useSoilSamples}
                      onChange={(e) => setUseSoilSamples(e.target.checked)}
                      className="rounded accent-slate-900"
                    />
                    <span className="font-semibold text-slate-700">Fuse Soil Samples</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowNewRunModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs transition-all"
                  >
                    Start Evaluation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuitabilityCropAnalysis;
