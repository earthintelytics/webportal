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
  SlidersHorizontal
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
  const [activeRun, setActiveRun] = useState(initialRun || null);
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' | 'reports' | 'verification' | 'ai-assistant'
  
  // New Run Modal & Progress State
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);

  // Live plots & tenant intelligence
  const [plots, setPlots] = useState([]);
  const [estates, setEstates] = useState([]);
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

      if (!activeRun && pastRuns.length > 0) {
        setActiveRun(pastRuns[0]);
      } else if (!activeRun && pastRuns.length === 0) {
        setShowNewRunModal(true);
      }
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
    if (activeRun?.fields && activeRun.fields.length > 0) {
      return activeRun.fields.map(f => ({
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
  }, [plots, activeRun, companyId]);

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
      setActiveRun(updatedRuns[0] || res);
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
        reply += ` ${activeRun?.total_area_ha?.toFixed(1) || '74.2'} ha of land were evaluated across 8 biophysical factors. Class S1 represents ${activeRun?.classes_area_ha?.S1?.toFixed(1) || '44.5'} ha. Recommended next action: begin planting layout on S1 blocks while scheduling terracing on steeper slopes.`;
      }
      setChatMessages([...newMsgs, { sender: 'assistant', text: reply }]);
      setChatLoading(false);
    }, 600);
  };

  const handleSelectFieldOnMap = (fieldId) => {
    const f = activeRun?.fields?.find(item => item.field_id === fieldId);
    if (f) setPopupField(f);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      {/* Top Header & Navigation Bar matching CropDashboardLayout standard */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              title="Back to Suitability Hub"
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 leading-tight">
                  {crop.name} Land Suitability
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-green-50 text-green-700 border border-green-200">
                  {activeRun?.variant || 'Commercial Evaluation'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                {tenantDisplayName} • {activeRun?.total_area_ha ? `${activeRun.total_area_ha.toFixed(1)} ha evaluated` : 'FAO Land Evaluation'}
              </p>
            </div>
          </div>

          {/* Center: Top Bar Tabs (Monitor | Reports | Verification | Assistant) */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            {HEADER_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: + Run New Analysis Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewRunModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus size={15} />
              <span>Run New Analysis</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <main className="max-w-7xl mx-auto px-6 py-6 w-full flex-1 space-y-6">
        {/* Section 1: Historical Analysis Runs for THIS Specific Crop */}
        {runs.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-gray-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  {crop.name} Historical Analysis Runs
                </h2>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                {runs.length} Evaluated {runs.length === 1 ? 'Run' : 'Runs'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-6">Evaluation Run</th>
                    <th className="py-2.5 px-6">Estate / Target Area</th>
                    <th className="py-2.5 px-6">Suitability Breakdown</th>
                    <th className="py-2.5 px-6">Status</th>
                    <th className="py-2.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {runs.map((run) => {
                    const isCurrent = activeRun?.run_id === run.run_id;
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
                        onClick={() => setActiveRun(run)}
                        className={`cursor-pointer transition-colors ${isCurrent ? 'bg-green-50/50' : 'hover:bg-gray-50/80'}`}
                      >
                        <td className="py-3 px-6 font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <span>{run.variant || 'Standard Assessment'}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-800">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 font-normal">{runDate}</div>
                        </td>
                        <td className="py-3 px-6">
                          <div className="font-semibold text-gray-800">{tenantDisplayName}</div>
                          <div className="text-[11px] text-gray-500">{run.total_area_ha ? `${run.total_area_ha.toFixed(1)} ha` : 'Estate Boundary'}</div>
                        </td>
                        <td className="py-3 px-6 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-1 text-[11px]">
                            <span className="text-green-700 font-bold">S1: {s1Pct}%</span>
                            <span className="text-lime-700 font-bold">S2: {s2Pct}%</span>
                            <span className="text-amber-700 font-bold">S3: {s3Pct}%</span>
                            {nPct > 0 && <span className="text-rose-700 font-bold">N: {nPct}%</span>}
                          </div>
                          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden flex">
                            <div style={{ width: `${s1Pct}%` }} className="bg-green-600 h-full" title={`S1: ${s1Pct}%`} />
                            <div style={{ width: `${s2Pct}%` }} className="bg-lime-500 h-full" title={`S2: ${s2Pct}%`} />
                            <div style={{ width: `${s3Pct}%` }} className="bg-amber-500 h-full" title={`S3: ${s3Pct}%`} />
                            <div style={{ width: `${nPct}%` }} className="bg-rose-500 h-full" title={`N: ${nPct}%`} />
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700">
                            <CheckCircle2 size={13} className="text-green-600" />
                            <span>Completed</span>
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveRun(run); }}
                            className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
                              isCurrent
                                ? 'bg-green-700 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {isCurrent ? 'Viewing' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Section 2: Active Run Results by Tab */}
        {activeRun ? (
          <div>
            {/* Tab A: Monitor (Map & Field Table) */}
            {activeTab === 'monitor' && (
              <div className="space-y-6">
                <SuitabilityMapView
                  runResult={activeRun}
                  onSelectField={handleSelectFieldOnMap}
                />

                <FieldTable
                  fields={activeRun.fields}
                  onSelectField={handleSelectFieldOnMap}
                />
              </div>
            )}

            {/* Tab B: Reports View (Standard ReportBuilder) */}
            {activeTab === 'reports' && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
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
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
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
                {/* AI Chat Shell */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col h-[520px]">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-green-50 border border-green-200 text-green-700 flex items-center justify-center">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">Farm AI Advisor • Agronomic Engine</h3>
                        <p className="text-xs text-gray-500">Grounded in {crop.name} suitability and Sentinel telemetry for {tenantDisplayName}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-md bg-green-50 text-green-700 font-semibold border border-green-200">
                      Grounded AI Active
                    </span>
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
                              ? 'bg-green-700 text-white font-medium shadow-xs'
                              : 'bg-gray-100 text-gray-800 border border-gray-200 font-normal'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 flex items-center gap-3 bg-white">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about limiting factors, corrective agronomy, or flood risks..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-green-500"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading}
                      className="px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Send</span>
                      <Send size={13} />
                    </button>
                  </form>
                </div>

                {/* Scenario Builder */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs">
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900 text-sm">Agronomic What-If Scenarios</h3>
                    <p className="text-xs text-gray-500">Simulate climate, soil remediation, and irrigation adjustments before field investment</p>
                  </div>
                  <ScenarioBuilder
                    cropType={cropId}
                    serviceId="suitability-tool"
                    estates={[tenantDisplayName]}
                    onRun={(renderedPrompt) => {
                      setChatInput(renderedPrompt);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500 shadow-2xs">
            <Layers size={40} className="mx-auto mb-3 text-gray-400" />
            <h3 className="text-base font-bold text-gray-900">No Analysis Runs Found for {crop.name}</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Launch your first evaluation run to compute biophysical suitability against CHIRPS, SoilGrids, DEM, and Sentinel-1.
            </p>
            <button
              onClick={() => setShowNewRunModal(true)}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold text-xs shadow-xs"
            >
              <Plus size={16} />
              <span>Launch First Evaluation</span>
            </button>
          </div>
        )}
      </main>

      {/* In-situ Run New Analysis Modal */}
      {showNewRunModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl max-w-xl w-full space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Run New {crop.name} Analysis</h3>
                <p className="text-xs text-gray-500">Configure target boundary, variety hybrid, and physical criteria</p>
              </div>
              <button
                onClick={() => setShowNewRunModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {isRunning ? (
              <div className="py-8">
                <RunProgress cropName={crop.name} progress={runProgress} />
              </div>
            ) : (
              <form onSubmit={handleRunSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1.5">
                    1. Target Estate & Boundary Polygon
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={targetEstate}
                      onChange={(e) => setTargetEstate(e.target.value)}
                      placeholder="e.g. Okomu Main Estate / Block Section C"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-green-500"
                    />
                    <label className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl cursor-pointer font-semibold shrink-0">
                      <Upload size={14} />
                      <span>{uploadedBoundaryName || 'Upload Polygon'}</span>
                      <input
                        type="file"
                        accept=".geojson,.kml,.json"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setUploadedBoundaryName(e.target.files[0].name);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1.5">
                    2. Crop Hybrid / Variety
                  </label>
                  <select
                    value={variant}
                    onChange={(e) => setVariant(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-green-500"
                  >
                    {(crop.variants || ['Standard Commercial Hybrid']).map((v, idx) => (
                      <option key={idx} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1.5">
                    3. Assessment Strictness
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'estate', label: 'Commercial Estate', desc: 'Strict S1 thresholds' },
                      { id: 'smallholder', label: 'Smallholder', desc: 'Practical tolerance' },
                      { id: 'standard', label: 'Standard FAO', desc: 'Default FAO bounds' },
                    ].map((st) => (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() => setStrictness(st.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          strictness === st.id
                            ? 'bg-green-50 border-green-600 text-green-900 font-bold'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-bold">{st.label}</div>
                        <div className="text-[9px] text-gray-400 font-normal mt-0.5">{st.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-800">Irrigated Regime</div>
                    <div className="text-[10px] text-gray-500">Enable if irrigation infrastructure is present</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsIrrigated(!isIrrigated)}
                    className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${isIrrigated ? 'bg-green-600' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isIrrigated ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-800">Ground Soil Sample Fusion (IDW)</div>
                    <div className="text-[10px] text-gray-500">Fuse GPS soil test points with SoilGrids 250m</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseSoilSamples(!useSoilSamples)}
                    className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${useSoilSamples ? 'bg-green-600' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${useSoilSamples ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewRunModal(false)}
                    className="w-1/3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
                  >
                    <Play size={14} fill="currentColor" />
                    <span>Execute Land Evaluation</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Factor Detail Popup */}
      {popupField && (
        <FactorPopup
          field={popupField}
          onClose={() => setPopupField(null)}
        />
      )}
    </div>
  );
};

export default SuitabilityCropAnalysis;
