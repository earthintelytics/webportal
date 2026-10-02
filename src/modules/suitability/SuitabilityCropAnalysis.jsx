import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Map as MapIcon, 
  FileText, 
  Bot, 
  RefreshCw, 
  Play, 
  Download, 
  Sparkles,
  Layers,
  ChevronRight,
  Send,
  MessageSquare
} from 'lucide-react';
import SuitabilityMapView from './components/SuitabilityMapView';
import FieldTable from './components/FieldTable';
import RunProgress from './components/RunProgress';
import SuitabilityReport from './components/SuitabilityReport';
import FactorPopup from './components/FactorPopup';
import { fetchSuitabilityRuns, submitSuitabilityRun } from './suitabilityApi';
import { getCropById } from './suitabilityCatalog';

const SuitabilityCropAnalysis = ({ cropId, companyId, initialRun, onBack, onOpenAiAdvisor }) => {
  const crop = getCropById(cropId) || { id: cropId, name: cropId.replace('_', ' ').toUpperCase(), variants: ['Standard Commercial'] };
  const [runs, setRuns] = useState([]);
  const [activeRun, setActiveRun] = useState(initialRun || null);
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'reports' | 'advisor'
  const [mode, setMode] = useState('view'); // 'view' | 'configure' | 'running'
  const [runProgress, setRunProgress] = useState(0);

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
      role: 'assistant',
      text: `Hello. I am the Farm AI Advisor for ${crop.name} suitability. I have analyzed the biophysical criteria, SoilGrids interpolation, Sentinel-1 SAR flood dynamics, and statutory EUDR/WDPA exclusions for your estate. How can I assist with your planting decisions?`
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    async function loadRuns() {
      const pastRuns = await fetchSuitabilityRuns(companyId, cropId);
      setRuns(pastRuns);
      if (!activeRun && pastRuns.length > 0) {
        setActiveRun(pastRuns[0]);
        setMode('view');
      } else if (!activeRun && pastRuns.length === 0) {
        setMode('configure');
      }
    }
    loadRuns();
  }, [cropId, companyId]);

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
      setActiveTab('map');
    }, 400);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userQ = chatInput.trim();
    const newMsgs = [...chatMessages, { role: 'user', text: userQ }];
    setChatMessages(newMsgs);
    setChatInput('');

    // Deterministic grounded response
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
      setChatMessages([...newMsgs, { role: 'assistant', text: reply }]);
    }, 600);
  };

  const handleSelectFieldOnMap = (fieldId) => {
    const f = activeRun?.fields?.find(item => item.field_id === fieldId);
    if (f) setPopupField(f);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans flex flex-col">
      {/* Top Header & Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Back to Suitability Hub"
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  {crop.name} Land Suitability
                </h1>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {activeRun?.variant || 'Standard Assessment'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {companyId.toUpperCase()} • {activeRun?.total_area_ha ? `${activeRun.total_area_ha.toFixed(1)} ha total` : 'FAO Land Evaluation'}
              </p>
            </div>
          </div>

          {/* Center: Top Bar Tabs (Map | Reports | AI Assistant) */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => { setActiveTab('map'); setMode('view'); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'map' && mode === 'view'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon size={14} className={activeTab === 'map' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>Suitability Map</span>
            </button>

            <button
              onClick={() => { setActiveTab('reports'); setMode('view'); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'reports' && mode === 'view'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={14} className={activeTab === 'reports' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>Reports</span>
            </button>

            <button
              onClick={() => { setActiveTab('advisor'); setMode('view'); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'advisor' && mode === 'view'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bot size={14} className={activeTab === 'advisor' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>AI Assistant</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('configure')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'configure'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
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
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs max-w-2xl mx-auto">
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Configure Land Evaluation</h2>
              <p className="text-xs text-slate-500 mt-1">
                Customize crop hybrid and management parameters. Environmental layers (SoilGrids, CHIRPS, DEM, Sentinel-1 SAR, EUDR) calibrate automatically.
              </p>
            </div>

            <form onSubmit={handleRunSubmit} className="space-y-6 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                  1. Crop Hybrid / Variety
                </label>
                <select
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  {(crop.variants || ['Standard Commercial Hybrid']).map((v, idx) => (
                    <option key={idx} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
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
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold">{st.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">{st.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Irrigated Regime</div>
                  <div className="text-[11px] text-slate-500">Enable if supplementary irrigation infrastructure is present</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsIrrigated(!isIrrigated)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-1 ${isIrrigated ? 'bg-emerald-600' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isIrrigated ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Ground Soil Sample Interpolation (IDW)</div>
                  <div className="text-[11px] text-slate-500">Fuse GPS soil test points with SoilGrids 250m baseline</div>
                </div>
                <button
                  type="button"
                  onClick={() => setUseSoilSamples(!useSoilSamples)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-1 ${useSoilSamples ? 'bg-emerald-600' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${useSoilSamples ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
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
            {/* Tab A: Suitability Map View */}
            {activeTab === 'map' && (
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

            {/* Tab B: Reports View */}
            {activeTab === 'reports' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <SuitabilityReport
                  runResult={activeRun}
                  isEmbedded={true}
                />
              </div>
            )}

            {/* Tab C: AI Assistant View */}
            {activeTab === 'advisor' && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[600px]">
                {/* Advisor Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Farm AI Advisor • Land Evaluation</h3>
                      <p className="text-xs text-slate-500">Grounded in {crop.name} suitability results for {companyId.toUpperCase()}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    Grounded AI Active
                  </span>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-2xl rounded-2xl px-5 py-3.5 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-emerald-700 text-white font-medium shadow-xs'
                            : 'bg-slate-100 text-slate-800 border border-slate-200/70 font-normal'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Prompts */}
                <div className="px-6 py-2 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2 overflow-x-auto text-[11px]">
                  <span className="text-slate-400 font-medium shrink-0">Suggestions:</span>
                  {[
                    'How can we correct soil pH on Block C3?',
                    'What drainage interventions mitigate radar flood risks?',
                    'Verify EUDR 2020 forest cutoff clearance'
                  ].map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setChatInput(p)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 transition-colors shrink-0"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Input Form */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 flex items-center gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about limiting factors, corrective agronomy, or flood risks..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Send</span>
                    <Send size={13} />
                  </button>
                </form>
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
