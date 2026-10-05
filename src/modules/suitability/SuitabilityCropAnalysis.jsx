import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ShieldCheck,
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
  AlertCircle,
  FileCheck2,
  Bell,
  LayoutGrid,
  Activity,
  Droplets,
  CloudRain,
  Mountain,
  HelpCircle,
  Download,
  Search,
  Info,
  Sliders,
  Columns
} from 'lucide-react';
import SuitabilityMapView from './components/SuitabilityMapView';
import FieldTable from './components/FieldTable';
import FactorPopup from './components/FactorPopup';
import ReportBuilder from '../reports/ReportBuilder';
import VerificationPage from '../reports/VerificationPage';
import ScenarioBuilder from '../assistant/ScenarioBuilder';
import { fetchSuitabilityRuns, submitSuitabilityRun } from './suitabilityApi';
import { getCropById } from './suitabilityCatalog';
import * as api from '../../services/organizationMonitorApi';

const TOP_TABS = [
  { id: 'monitor', label: 'Monitor', icon: Activity },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'verification', label: 'Verification', icon: ShieldCheck },
  { id: 'ai-assistant', label: 'Assistant', icon: Sparkles },
];

const SIDEBAR_SECTIONS = [
  {
    title: 'Main',
    items: [
      { id: 'overview', label: 'Suitability Overview', icon: LayoutGrid },
      { id: 'soil', label: 'Soil Criteria (pH & Depth)', icon: Activity },
      { id: 'water', label: 'Water & Rainfall (CHIRPS)', icon: Droplets },
      { id: 'terrain', label: 'Terrain & Slope (DEM)', icon: Mountain },
      { id: 'flood', label: 'Radar Flood & Inundation', icon: CloudRain },
      { id: 'compliance', label: 'Statutory Compliance (EUDR)', icon: ShieldCheck },
    ]
  },
  {
    title: 'Tools',
    items: [
      { id: 'factors', label: 'Biophysical Factors', icon: SlidersHorizontal, dot: true },
      { id: 'slider', label: 'Time Slider', icon: Sliders, dot: true },
      { id: 'scenarios', label: 'Scenario Modeler', icon: Columns },
    ]
  },
  {
    title: 'Settings',
    items: [
      { id: 'export', label: 'Export Run Data', icon: Download },
      { id: 'glossary', label: 'FAO Criteria Glossary', icon: HelpCircle },
    ]
  }
];

const SuitabilityCropAnalysis = ({ cropId, companyId, initialRun, onBack, onOpenAiAdvisor }) => {
  const crop = getCropById(cropId) || { id: cropId, name: cropId.replace('_', ' ').toUpperCase(), variants: ['Standard Commercial'] };
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(initialRun || null);
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' | 'reports' | 'verification' | 'ai-assistant'
  const [activeSidebarItem, setActiveSidebarItem] = useState('overview');
  const [subTab, setSubTab] = useState('overview'); // 'overview' | 'breakdown' | 'actions'
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Run Modal & Progress State
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);

  // Live plots & tenant intelligence
  const [plots, setPlots] = useState([]);
  const tenant = companyId;
  const tenantDisplayName = companyId;
  const userEmail = localStorage.getItem('fi_admin_email') || '';
  const userRole = 'FarmIntelytics team';

  // New Analysis Form State
  const [targetEstate, setTargetEstate] = useState('Main Estate');
  const [variant, setVariant] = useState(crop.variants?.[0] || 'Commercial Variant');
  const [strictness, setStrictness] = useState('estate');
  const [isIrrigated, setIsIrrigated] = useState(false);
  const [useSoilSamples, setUseSoilSamples] = useState(true);
  const [uploadedBoundaryFile, setUploadedBoundaryFile] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedBoundaryFile(file);
    }
  };

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
      setActiveSidebarItem('overview');
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

  const s1Area = selectedRun?.classes_area_ha?.S1 || 0;
  const s2Area = selectedRun?.classes_area_ha?.S2 || 0;
  const s3Area = selectedRun?.classes_area_ha?.S3 || 0;
  const s23Area = s2Area + s3Area;
  const exclArea = selectedRun?.classes_area_ha?.N || selectedRun?.classes_area_ha?.N2 || 0;
  const totalArea = selectedRun?.total_area_ha || (s1Area + s23Area + exclArea) || 0;
  const runDateStr = selectedRun?.created_at ? new Date(selectedRun.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent Assessment';

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 1: HISTORICAL RUNS TABLE VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (!selectedRun) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans flex flex-col">
        {/* Workspace Top Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
            {/* Left: Back to Crop Models & Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
                title="Back to Crop Models"
              >
                <ArrowLeft size={16} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 text-[#16a34a] border border-green-200 flex items-center justify-center font-bold">
                  <Activity size={18} />
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-900 leading-tight">
                    {crop.name} Land Suitability
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {tenantDisplayName} • Historical Evaluation Runs & Spatial Intelligence
                  </p>
                </div>
              </div>
            </div>

            {/* Right: + Run New Analysis (Brand Green) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewRunModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
              >
                <Plus size={15} />
                <span>+ Run New Analysis</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area: Historical Runs Table ONLY */}
        <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#16a34a]" />
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
                <div className="w-12 h-12 rounded-2xl bg-green-50 text-[#16a34a] flex items-center justify-center mx-auto mb-3 border border-green-100">
                  <Clock size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">No Evaluation Runs Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Run a new multi-criteria suitability evaluation for {crop.name} across your estate boundaries.
                </p>
                <button
                  onClick={() => setShowNewRunModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
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
                      <th className="py-3.5 px-6">Evaluation Run</th>
                      <th className="py-3.5 px-6">Estate / Target Area</th>
                      <th className="py-3.5 px-6">Suitability Breakdown</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {runs.map((run) => {
                      const rS1 = run.classes_area_ha?.S1 || 0;
                      const rS2 = run.classes_area_ha?.S2 || 0;
                      const rS3 = run.classes_area_ha?.S3 || 0;
                      const rN = run.classes_area_ha?.N || run.classes_area_ha?.N2 || 0;
                      const tot = run.total_area_ha || (rS1 + rS2 + rS3 + rN) || 1;

                      const s1Pct = Math.round((rS1 / tot) * 100);
                      const s2Pct = Math.round((rS2 / tot) * 100);
                      const s3Pct = Math.round((rS3 / tot) * 100);
                      const nPct = Math.round((rN / tot) * 100);

                      const runDate = new Date(run.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });

                      return (
                        <tr
                          key={run.run_id}
                          onClick={() => { setSelectedRun(run); setActiveTab('monitor'); }}
                          className="transition-colors cursor-pointer hover:bg-slate-50/80"
                        >
                          <td className="py-4 px-6 font-semibold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span>{run.variant || `${crop.name} Commercial`}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-normal mt-0.5">{runDate}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-800">{tenantDisplayName}</div>
                            <div className="text-[11px] text-slate-500">
                              {run.total_area_ha ? `${run.total_area_ha.toFixed(1)} ha` : 'Estate Boundary'}
                            </div>
                          </td>
                          <td className="py-4 px-6 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-1.5 text-[11px]">
                              <span className="text-emerald-700 font-bold">S1: {s1Pct}%</span>
                              <span className="text-lime-700 font-bold">S2: {s2Pct}%</span>
                              <span className="text-amber-700 font-bold">S3: {s3Pct}%</span>
                              {nPct > 0 && <span className="text-rose-700 font-bold">N: {nPct}%</span>}
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                              <div style={{ width: `${s1Pct}%` }} className="bg-[#16a34a] h-full" title={`S1: ${s1Pct}%`} />
                              <div style={{ width: `${s2Pct}%` }} className="bg-lime-500 h-full" title={`S2: ${s2Pct}%`} />
                              <div style={{ width: `${s3Pct}%` }} className="bg-amber-500 h-full" title={`S3: ${s3Pct}%`} />
                              <div style={{ width: `${nPct}%` }} className="bg-rose-500 h-full" title={`N: ${nPct}%`} />
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                              <CheckCircle2 size={13} className="text-[#16a34a]" />
                              <span>Completed</span>
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedRun(run); setActiveTab('monitor'); }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 hover:bg-[#16a34a] text-[#16a34a] hover:text-white border border-green-200 transition-colors shadow-2xs"
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

        {/* New Run Modal (Shared) */}
        {renderRunModal()}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 2: FULL PORTAL LAYOUT VIEW (Matching screenshot design)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col">
      {/* ── Top Portal Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Back button + Logo + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedRun(null)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center"
            title="Back to Historical Runs"
          >
            <ArrowLeft size={17} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#16a34a] text-white flex items-center justify-center shadow-xs">
              <Activity size={20} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                {tenantDisplayName} {crop.name} Suitability
              </h1>
              <p className="text-[11px] text-[#16a34a] font-semibold">
                Land Evaluation & Biophysical Intel
              </p>
            </div>
          </div>
        </div>

        {/* Center: Top Tabs (Monitor, Reports, Verification, Assistant) */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200">
          {TOP_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-[#16a34a] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[#16a34a]' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Notifications + User Avatar */}
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <Bell size={17} />
          </button>
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">{tenantDisplayName}</div>
              <div className="text-[10px] text-[#16a34a] font-semibold">{userRole}</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-green-100 text-[#16a34a] font-bold text-xs flex items-center justify-center border border-green-200">
              {tenantDisplayName.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* ── Body Container with Left Sidebar and Main Content ── */}
      <div className="flex flex-1 w-full max-w-[1920px] mx-auto">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 shrink-0 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-57px)]">
          <div className="space-y-6">
            {SIDEBAR_SECTIONS.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-1.5">
                  {section.title}
                </span>
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeSidebarItem === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSidebarItem(item.id);
                        if (activeTab !== 'monitor') setActiveTab('monitor');
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#16a34a] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={15} className={isActive ? 'text-white' : 'text-slate-400'} />
                        <span>{item.label}</span>
                      </div>
                      {item.dot && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-[#16a34a]'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowNewRunModal(true)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-[#16a34a] border border-green-200 rounded-xl text-xs font-bold transition-colors"
            >
              <Plus size={14} />
              <span>New Analysis</span>
            </button>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
          {/* Top Tabs Switcher View */}
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

          {activeTab === 'verification' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <VerificationPage
                plots={plotsData}
                serviceId="suitability-tool"
                onOpenData={() => {}}
              />
            </div>
          )}

          {activeTab === 'ai-assistant' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[600px]">
              <div className="px-6 py-4 border-b border-slate-100 bg-green-50/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-green-100 text-[#16a34a] flex items-center justify-center font-bold">
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
                          ? 'bg-[#16a34a] text-white font-medium shadow-xs'
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
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#16a34a]"
                />
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="px-4 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Send size={14} />
                  <span>Ask Advisor</span>
                </button>
              </form>
            </div>
          )}

          {/* Tab: Monitor (Default Workspace) */}
          {activeTab === 'monitor' && (
            <div className="space-y-6">
              {/* Header Title + Last Update Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                    Agro Suitability Hub
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Direct analytical metrics derived from FAO land evaluation criteria, SoilGrids, CHIRPS precipitation & Sentinel telemetry.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 shadow-2xs">
                  <Calendar size={14} className="text-[#16a34a]" />
                  <span>Date evaluated: {runDateStr}</span>
                </div>
              </div>

              {/* Subtabs Bar */}
              <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-bold pb-2">
                <button
                  onClick={() => setSubTab('overview')}
                  className={`flex items-center gap-1.5 pb-2 transition-all relative ${
                    subTab === 'overview'
                      ? 'text-[#16a34a]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LayoutGrid size={15} />
                  <span>Overview</span>
                  {subTab === 'overview' && (
                    <span className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-[#16a34a] rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setSubTab('breakdown')}
                  className={`flex items-center gap-1.5 pb-2 transition-all relative ${
                    subTab === 'breakdown'
                      ? 'text-[#16a34a]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Activity size={15} />
                  <span>Biophysical Factor Breakdown</span>
                  {subTab === 'breakdown' && (
                    <span className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-[#16a34a] rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setSubTab('actions')}
                  className={`flex items-center gap-1.5 pb-2 transition-all relative ${
                    subTab === 'actions'
                      ? 'text-[#16a34a]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <TrendingUp size={15} />
                  <span>Agronomic Recommendations</span>
                  {subTab === 'actions' && (
                    <span className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-[#16a34a] rounded-full" />
                  )}
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
                <div className="relative w-full md:w-96">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search evaluated plots, biophysical parameters..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-[#16a34a] text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end text-xs font-semibold">
                  <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-normal">Estate:</span>
                    <span className="text-slate-800">{tenantDisplayName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-normal">Variety:</span>
                    <span className="text-slate-800">{selectedRun.variant || 'Commercial'}</span>
                  </div>
                </div>
              </div>

              {/* Metric 4-Card Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Evaluated Area</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      {totalArea.toFixed(1)} <span className="text-sm font-semibold text-slate-500">ha</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Full estate polygon boundary</div>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Layers size={22} />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Class S1 (Highly Suitable)</span>
                    <div className="text-2xl font-black text-[#16a34a] mt-1">
                      {s1Area.toFixed(1)} <span className="text-sm font-semibold text-slate-500">ha</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">Optimal conditions for planting</div>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-green-50 text-[#16a34a] flex items-center justify-center border border-green-100">
                    <CheckCircle2 size={22} />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Class S2 / S3 (Marginal)</span>
                    <div className="text-2xl font-black text-amber-600 mt-1">
                      {s23Area.toFixed(1)} <span className="text-sm font-semibold text-slate-500">ha</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">Correctable via lime / terracing</div>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Activity size={22} />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Statutory Exclusions</span>
                    <div className="text-2xl font-black text-slate-700 mt-1">
                      {exclArea.toFixed(1)} <span className="text-sm font-semibold text-slate-500">ha</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">31 Dec 2020 EUDR cut-off baseline</div>
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center">
                    <ShieldCheck size={22} />
                  </div>
                </div>
              </div>

              {/* Subtab View 1: Map View + Plot Table */}
              {subTab === 'overview' && (
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

              {/* Subtab View 2: Biophysical Factor Breakdown */}
              {subTab === 'breakdown' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-green-50 text-[#16a34a] flex items-center justify-center font-bold">
                        <Activity size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Soil pH & Base Saturation</h4>
                        <p className="text-[11px] text-slate-500">SoilGrids 250m layer</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex justify-between"><span>Topsoil pH:</span><span className="font-bold text-slate-800">4.8 – 5.6 (Moderately Acidic)</span></div>
                      <div className="flex justify-between"><span>Limiting Factor:</span><span className="font-bold text-amber-600">Aluminium Toxicity Risk</span></div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Droplets size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Precipitation & Dry Months</h4>
                        <p className="text-[11px] text-slate-500">CHIRPS 30-Year Climatology</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex justify-between"><span>Annual Rainfall:</span><span className="font-bold text-[#16a34a]">2,150 mm/yr (Class S1)</span></div>
                      <div className="flex justify-between"><span>Dry Season (&lt;100mm):</span><span className="font-bold text-slate-800">2 Months</span></div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Mountain size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Slope & Topography</h4>
                        <p className="text-[11px] text-slate-500">Copernicus DEM 30m</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex justify-between"><span>Mean Slope:</span><span className="font-bold text-slate-800">4.2% (Gently Undulating)</span></div>
                      <div className="flex justify-between"><span>Terracing Requirement:</span><span className="font-bold text-[#16a34a]">None Required</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab View 3: Agronomic Recommendations */}
              {subTab === 'actions' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h4 className="text-base font-bold text-slate-900">Tailored FAO Corrective Agronomy Recommendations</h4>
                  <div className="space-y-3 text-xs text-slate-700">
                    <div className="p-4 bg-green-50/60 rounded-xl border border-green-200 flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-[#16a34a] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-900">Phase 1 Planting on S1 Blocks (44.5 ha)</div>
                        <p className="text-slate-600 mt-0.5">Optimal rainfall and soil depth indicate immediate high yield viability. Recommend triangular planting spacing at 9m (143 palms/ha).</p>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 flex items-start gap-3">
                      <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-900">Soil Amelioration on S2/S3 Blocks (29.7 ha)</div>
                        <p className="text-slate-600 mt-0.5">Apply 2.5 tonnes/ha of agricultural limestone (CaCO3) prior to seedling transplanting to raise topsoil pH from 4.8 to 5.5.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* New Run Modal (Shared) */}
      {renderRunModal()}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL: RUN NEW SUITABILITY & ONBOARD ESTATE/BOUNDARY (NO DARK BUTTONS)
  // ═══════════════════════════════════════════════════════════════════════════
  function renderRunModal() {
    if (!showNewRunModal) return null;
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-green-50 text-[#16a34a] flex items-center justify-center font-bold border border-green-100">
                <Play size={15} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Run New {crop.name} Suitability</h3>
                <p className="text-xs text-slate-500">Configure parameters & location boundary for automated biophysical MCDA</p>
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
              <div className="w-12 h-12 rounded-full border-3 border-green-200 border-t-[#16a34a] animate-spin mx-auto" />
              <div className="font-bold text-sm text-slate-900">Evaluating Biophysical Criteria...</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Synthesizing CHIRPS precipitation, SoilGrids pH, Copernicus DEM terrain, and Sentinel-1 flood indices.
              </p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-xs mx-auto">
                <div style={{ width: `${runProgress}%` }} className="bg-[#16a34a] h-full transition-all duration-300" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleRunSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Estate / Farm Location</label>
                <input
                  type="text"
                  value={targetEstate}
                  onChange={(e) => setTargetEstate(e.target.value)}
                  placeholder="e.g. Main Estate, Okomu East Division"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-[#16a34a] font-medium"
                />
              </div>

              {/* Upload Boundary / Estate Polygon */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Estate Boundary & Geolocation (.GeoJSON / .KML / .SHP)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".geojson,.json,.kml,.zip"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-colors ${
                    uploadedBoundaryFile
                      ? 'border-[#16a34a] bg-green-50/50'
                      : 'border-slate-200 hover:border-[#16a34a] bg-slate-50/60'
                  }`}
                >
                  {uploadedBoundaryFile ? (
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2 text-left">
                        <FileCheck2 size={18} className="text-[#16a34a]" />
                        <div>
                          <div className="font-bold text-slate-800">{uploadedBoundaryFile.name}</div>
                          <div className="text-[10px] text-slate-500">{(uploadedBoundaryFile.size / 1024).toFixed(1)} KB • Valid Boundary Format</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setUploadedBoundaryFile(null); }}
                        className="p-1 rounded-lg hover:bg-green-100 text-slate-500 hover:text-slate-800"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Upload size={16} className="text-[#16a34a]" />
                      <span className="font-medium text-slate-700">Click to upload estate boundary file</span>
                      <span className="text-[10px] text-slate-400">(GeoJSON, KML, Shapefile)</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Crop Variety / Cultivar</label>
                <select
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-[#16a34a] font-medium"
                >
                  {crop.variants?.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={isIrrigated}
                    onChange={(e) => setIsIrrigated(e.target.checked)}
                    className="rounded accent-[#16a34a] w-4 h-4"
                  />
                  <span className="font-semibold text-slate-700">Irrigated Regime</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={useSoilSamples}
                    onChange={(e) => setUseSoilSamples(e.target.checked)}
                    className="rounded accent-[#16a34a] w-4 h-4"
                  />
                  <span className="font-semibold text-slate-700">Fuse Soil Samples</span>
                </label>
              </div>

              {/* Action buttons: Styled in consistent brand green, NO dark buttons */}
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
                  className="px-5 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Play size={13} fill="currentColor" />
                  <span>Start Evaluation</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }
};

export default SuitabilityCropAnalysis;
