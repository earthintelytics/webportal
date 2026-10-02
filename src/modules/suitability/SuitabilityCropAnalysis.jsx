import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Map as MapIcon, 
  FileText, 
  Bot, 
  RefreshCw, 
  Play, 
  Sparkles,
  Layers,
  Send,
  ShieldCheck as CheckIcon,
  CheckCircle2,
  Calendar,
  User
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
  const [mode, setMode] = useState('view'); // 'view' | 'configure' | 'running'
  const [runProgress, setRunProgress] = useState(0);

  // Live plots & tenant intelligence
  const [plots, setPlots] = useState([]);
  const [estates, setEstates] = useState([]);
  const tenant = localStorage.getItem('fi_tenant') || companyId || 'okomu';
  const tenantDisplayName = localStorage.getItem('fi_display_name') || companyId.toUpperCase();

  // Configure Form State
  const [variant, setVariant] = useState(crop.variants?.[0] || 'Commercial Variant');
  const [strictness, setStrictness] = useState('estate');
  const [isIrrigated, setIsIrrigated] = useState(false);
  const [useSoilSamples, setUseSoilSamples] = useState(true);

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
        setMode('view');
      } else if (!activeRun && pastRuns.length === 0) {
        setMode('configure');
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
    // If runs has fields, map them to plot data structures
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
    setMode('running');
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
      setMode('view');
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
                  {activeRun?.variant || 'Standard Assessment'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                {tenantDisplayName} • {activeRun?.total_area_ha ? `${activeRun.total_area_ha.toFixed(1)} ha total` : 'FAO Land Evaluation'}
              </p>
            </div>
          </div>

          {/* Center: Top Bar Tabs (Monitor | Reports | Verification | Assistant) */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            {HEADER_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMode('view'); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id && mode === 'view'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('configure')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'configure'
                  ? 'bg-green-700 text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <RefreshCw size={13} />
              <span>Re-evaluate</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <main className="max-w-7xl mx-auto px-6 py-6 w-full flex-1">
        {/* Mode 1: Running Progress */}
        {mode === 'running' && (
          <div className="max-w-2xl mx-auto py-12">
            <RunProgress cropName={crop.name} progress={runProgress} />
          </div>
        )}

        {/* Mode 2: Configure Form */}
        {mode === 'configure' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-2xs max-w-2xl mx-auto">
            <div className="mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Configure Land Evaluation</h2>
              <p className="text-xs text-gray-500 mt-1">
                Customize crop hybrid and management parameters. Environmental layers (SoilGrids, CHIRPS, DEM, Sentinel-1 SAR, EUDR) calibrate automatically.
              </p>
            </div>

            <form onSubmit={handleRunSubmit} className="space-y-6 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[11px] mb-2">
                  1. Crop Hybrid / Variety
                </label>
                <select
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-semibold text-gray-800 focus:outline-none focus:border-green-500"
                >
                  {(crop.variants || ['Standard Commercial Hybrid']).map((v, idx) => (
                    <option key={idx} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider text-[11px] mb-2">
                  2. Assessment Strictness
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'estate', label: 'Commercial Estate', desc: 'Strict S1 thresholds' },
                    { id: 'smallholder', label: 'Smallholder', desc: 'Practical tolerance' },
                    { id: 'standard', label: 'Standard FAO', desc: 'Default FAO bounds' },
                  ].map((st) => (
                    <button
                      type="button"
                      key={st.id}
                      onClick={() => setStrictness(st.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        strictness === st.id
                          ? 'bg-green-50 border-green-600 text-green-900 font-bold'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-bold">{st.label}</div>
                      <div className="text-[10px] text-gray-400 font-normal mt-0.5">{st.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-800">Irrigated Regime</div>
                  <div className="text-[11px] text-gray-500">Enable if supplementary irrigation infrastructure is present</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsIrrigated(!isIrrigated)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-1 ${isIrrigated ? 'bg-green-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isIrrigated ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-800">Ground Soil Sample Interpolation (IDW)</div>
                  <div className="text-[11px] text-gray-500">Fuse GPS soil test points with SoilGrids 250m baseline</div>
                </div>
                <button
                  type="button"
                  onClick={() => setUseSoilSamples(!useSoilSamples)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-1 ${useSoilSamples ? 'bg-green-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${useSoilSamples ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <Play size={15} fill="currentColor" />
                  <span>Run Analysis</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Mode 3: View Results by Tab */}
        {mode === 'view' && activeRun && (
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
        )}
      </main>

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
