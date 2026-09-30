// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React, { useState, useMemo, useEffect } from 'react';
import * as api from '../../services/organizationMonitorApi';
import { 
  Globe, 
  Layers, 
  Satellite, 
  Map as MapIcon, 
  Activity, 
  Zap, 
  Droplets, 
  Sun, 
  Trees, 
  ArrowLeft,
  LogOut,
  CheckCircle2,
  BarChart4,
  TrendingUp,
  LayoutDashboard,
  Calendar,
  Maximize2,
  Search,
  Filter,
  Shield,
  User,
  Bell,
  X,
  Info,
  Navigation,
  RefreshCw,
  FileText,
  History,
  Settings2,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  MapPin,
  LineChart,
  Waves,
  Thermometer,
  CloudRain,
  Leaf
} from 'lucide-react';
import { MapContainer, TileLayer, ZoomControl, Polygon, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== undefined) {
      map.setView(center, map.getZoom());
    }
  }, [map, center]);
  return null;
}
import { 
  SimpleCard, 
  MetricTile, 
  WorkerActivityTable 
} from '../../components/SharedComponents';
import { Line, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend as ChartLegend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  ChartLegend,
  Filler
);

// ── Literature-Based Crop Configurations ──────────────────────────────────────
const CROP_RS_CONFIG = {
  'Rice': {
    primaryColor: 'emerald',
    theme: 'Flooded / Water-Dependent',
    indices: [
      { id: 'NDWI', label: 'Water Index (NDWI)', legend: 'Dry - Flooded', color: 'from-blue-100 to-blue-700', active: true, opacity: 70 },
      { id: 'SAR', label: 'SAR (Flood Detection)', legend: 'Low - High Backscatter', color: 'from-gray-300 to-indigo-900', active: false, opacity: 60 },
      { id: 'NDVI', label: 'Vegetation (NDVI)', legend: 'Stressed - Healthy', color: 'from-red-400 via-yellow-300 to-emerald-600', active: false, opacity: 80 },
      { id: 'LSWI', label: 'Moisture (LSWI)', legend: 'Deficit - Adequate', color: 'from-orange-100 to-blue-500', active: false, opacity: 80 },
    ],
    kpis: [
      { label: 'Mean NDWI', value: '0.68', unit: 'FLOOD', icon: <Waves /> },
      { label: 'Irrigation Sync', value: '94', unit: '%', icon: <Droplets /> },
      { label: 'SAR Backscatter', value: '-12', unit: 'dB', icon: <Activity /> },
    ],
    layman: {
      health: 'Flooding is optimal. No water stress detected.',
      stress: 'Water levels dropping. Recommend irrigation check.',
      yield: 'Cumulative NDWI predicts yield within target range.'
    },
    drillDownType: 'Hydrology Anomaly'
  },
  'Maize': {
    primaryColor: 'yellow',
    theme: 'Nutrient / Nitrogen Focused',
    indices: [
      { id: 'GCVI', label: 'Nitrogen (GCVI)', legend: 'Deficient - Optimal', color: 'from-yellow-100 to-emerald-800', active: true, opacity: 80 },
      { id: 'NDRE', label: 'Chlorophyll (NDRE)', legend: 'Low - High Chlorophyll', color: 'from-gray-50 to-cyan-600', active: false, opacity: 80 },
      { id: 'NDVI', label: 'Biomass (NDVI)', legend: 'Stressed - Healthy', color: 'from-red-400 via-yellow-300 to-emerald-600', active: false, opacity: 80 },
      { id: 'VHI', label: 'Stress (VHI)', legend: 'Heat/Drought Risk', color: 'from-red-600 via-yellow-400 to-green-400', active: false, opacity: 70 },
    ],
    kpis: [
      { label: 'Nitrogen (GCVI)', value: '0.52', unit: 'INDEX', icon: <Zap /> },
      { label: 'VHI Stress', value: '82', unit: 'SCORE', icon: <Thermometer /> },
      { label: 'Soil Temp', value: '28', unit: '°C', icon: <Sun /> },
    ],
    layman: {
      health: 'Nitrogen levels are optimal for current growth stage.',
      stress: 'Possible Nitrogen deficiency detected. Check leaf tips.',
      yield: 'High tasselling NDVI correlates with above-average harvest.'
    },
    drillDownType: 'Nitrogen Profile'
  },
  'Cashew': {
    primaryColor: 'orange',
    theme: 'Phenology / Flushing Monitor',
    indices: [
      { id: 'NDVI_FLUSH', label: 'Leaf Flush (NDVI)', legend: 'Dormant - Flushing', color: 'from-amber-100 to-emerald-900', active: true, opacity: 80 },
      { id: 'EVI', label: 'Canopy Density (EVI)', legend: 'Thin - Dense', color: 'from-orange-50 to-green-700', active: false, opacity: 80 },
      { id: 'LST', label: 'Thermal Stress (LST)', legend: 'Cool - Hot Surface', color: 'from-blue-200 via-yellow-200 to-red-600', active: false, opacity: 60 },
    ],
    kpis: [
      { label: 'Flushing Status', value: 'ACTIVE', unit: 'STAGE', icon: <Leaf /> },
      { label: 'Canopy Coverage', value: '78', unit: '%', icon: <Trees /> },
      { label: 'Peak EVI', value: '0.45', unit: 'INDEX', icon: <BarChart4 /> },
    ],
    layman: {
      health: 'Seasonal flushing is on track. High nut potential.',
      stress: 'Delayed flushing detected. Possible water or root stress.',
      yield: 'Flush amplitude predicts 1.2 t/ha harvest potential.'
    },
    drillDownType: 'Canopy Health'
  },
  'Cocoa': {
    primaryColor: 'amber',
    theme: 'Shaded Perennial / Canopy Health',
    indices: [
      { id: 'NDRE', label: 'Chlorophyll (NDRE)', legend: 'Early Stress Detect', color: 'from-gray-100 to-teal-600', active: true, opacity: 80 },
      { id: 'EVI', label: 'Canopy Density (EVI)', legend: 'Thin - Dense', color: 'from-amber-50 to-emerald-900', active: false, opacity: 80 },
      { id: 'TWI', label: 'Wetness Index (TWI)', legend: 'Well Drained - Moist', color: 'from-stone-200 to-sky-600', active: false, opacity: 60 },
    ],
    kpis: [
      { label: 'Shade Quality', value: 'OPTIMAL', unit: 'DENSITY', icon: <Sun /> },
      { label: 'Pod Filling Index', value: '0.64', unit: 'NDRE', icon: <Zap /> },
      { label: 'Rainfall Received', value: '420', unit: 'mm/3mo', icon: <CloudRain /> },
    ],
    layman: {
      health: 'Canopy chlorophyll is stable. Good pod development.',
      stress: 'Chlorophyll decline detected. Inspect for Black Pod.',
      yield: 'Canopy activity predicts 450 kg/ha bean production.'
    },
    drillDownType: 'Physiological Status'
  }
};

const MonitoringPortal = ({ cropName, onSignOut, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showLayerList, setShowLayerList] = useState(true);
  const [dateRange, setDateRange] = useState('Last 6 Months');
  const [userName] = useState('Admin Manager');
  const [selectedPlot, setSelectedPlot] = useState(null);

  // Derive config based on current crop
  const config = useMemo(() => CROP_RS_CONFIG[cropName] || CROP_RS_CONFIG['Maize'], [cropName]);
  
  const [layers, setLayers] = useState([
    { id: 'google', label: 'Google Satellite', active: true, opacity: 100, legend: 'Natural Color', color: 'from-gray-500 to-gray-900', url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' },
    ...config.indices
  ]);

  const [plots, setPlots] = useState([]);

  useEffect(() => {
    let active = true;
    async function loadPlots() {
      try {
        const res = await api.fetchPlotsIntelligence();
        if (active) {
          const mappedPlots = res.map(p => {
            let coords = [];
            if (p.boundary && p.boundary.coordinates && p.boundary.coordinates[0]) {
              coords = api.geoJsonToLeaflet(p.boundary.coordinates[0]);
            } else {
              coords = [
                [6.43, 5.27],
                [6.435, 5.27],
                [6.435, 5.275],
                [6.43, 5.275]
              ];
            }
            const ndviVal = p.indices?.ndvi ?? 0.48;
            return {
              id: p.plot_id,
              name: p.name || p.plot_id,
              area: `${p.area_ha || 10.0} HA`,
              health: ndviVal > 0.7 ? '98%' : ndviVal > 0.55 ? '75%' : '35%',
              status: ndviVal > 0.55 ? 'Healthy' : 'Stressed',
              ndvi: ndviVal,
              savi: p.indices?.savi ?? null,
              ndwi: p.indices?.ndwi ?? null,
              cumulative_rainfall_14d: p.indices?.cumulative_rainfall_14d ?? null,
              layman: ndviVal > 0.55 ? config.layman.health : config.layman.stress,
              advice: ndviVal > 0.55 ? 'No action needed.' : 'Inspect and apply remediation.',
              history: [0.3, 0.45, 0.58, ndviVal - 0.05, ndviVal, ndviVal],
              coords
            };
          });
          setPlots(mappedPlots);
        }
      } catch (err) {
        console.error("Failed to load plots for crop portal:", err);
      }
    }
    loadPlots();
    return () => { active = false; };
  }, [cropName, config]);

  const columns = [
    { key: 'id', label: 'Plot ID' },
    { key: 'area', label: 'Area' },
    { key: 'health', label: 'Health Score', render: (val) => <span className={`font-bold ${parseInt(val) < 40 ? 'text-red-500' : 'text-emerald-500'}`}>{val}</span> },
    { key: 'status', label: 'Status', render: (val) => <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${val === 'Stressed' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{val}</span> },
    { key: 'layman', label: 'Field Summary' },
    { key: 'action', label: 'Drill Down', render: (_, row) => <button onClick={() => { setSelectedPlot(row); setActiveTab('geospatial'); }} className="text-sky-600 font-bold text-[11px] hover:underline">View History</button> }
  ];

  const mapCenter = useMemo(() => {
    if (plots && plots.length > 0 && plots[0].coords && plots[0].coords.length > 0) {
      return plots[0].coords[0];
    }
    return [6.43, 5.27];
  }, [plots]);

  const renderContent = () => {
    switch (activeTab) {
      case 'geospatial':
        return (
          <div className="flex-1 flex flex-col relative animate-in fade-in duration-500">
             <div className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-[1010]">
                <div className="flex items-center gap-6 flex-1 max-w-4xl">
                   <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="text" placeholder={`Locate ${cropName} Plot...`} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-12 pr-4 text-[13px] font-bold outline-none focus:border-emerald-500 transition-all" />
                   </div>
                </div>
                <div className="text-[11px] font-bold tracking-[0.2em] text-gray-400 italic">Scientific Standard: Sentinel-2 Multispectral</div>
             </div>

             <div className="flex-1 bg-gray-200 relative overflow-hidden">
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                   <MapRecenter center={mapCenter} />
                   {layers.filter(l => l.active).map(layer => (
                     <TileLayer key={layer.id} url={layer.url || "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"} opacity={layer.opacity / 100} />
                   ))}
                   {plots.map(plot => (
                     <Polygon key={plot.id} positions={plot.coords} pathOptions={{ color: '#10b981', fillOpacity: 0.2 }} eventHandlers={{ click: () => setSelectedPlot(plot) }} />
                   ))}
                   <ZoomControl position="bottomleft" />
                </MapContainer>
                
                <div className="absolute top-8 right-8 bottom-8 w-64 z-[1000] flex flex-col gap-4 pointer-events-none">
                   <div className="bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] flex flex-col pointer-events-auto overflow-hidden">
                      <div className="p-5 flex items-center justify-between border-b border-gray-50">
                         <div className="flex items-center gap-2">
                            <Layers size={16} className="text-gray-900" />
                            <span className="text-[11px] font-bold leading-none">Remote Sensing Legend</span>
                         </div>
                         <button onClick={() => setShowLayerList(!showLayerList)} className="p-2 hover:bg-gray-50 rounded-full transition-all"><Settings2 size={16} className="text-gray-400" /></button>
                      </div>
                      {showLayerList && (
                        <div className="flex-1 overflow-y-auto p-5 space-y-6 animate-in slide-in-from-right-4 duration-300">
                           {layers.map(layer => (
                             <div key={layer.id} className="space-y-3">
                                <button onClick={() => setLayers(layers.map(l => l.id === layer.id ? { ...l, active: !l.active } : l))} className="flex items-center gap-3 group text-left">
                                   <div className={`w-4 h-4 rounded border-2 transition-all shrink-0 flex items-center justify-center ${layer.active ? 'bg-green-700 border-green-700' : 'border-gray-200'}`}>{layer.active && <CheckCircle2 size={10} className="text-white" />}</div>
                                   <span className={`text-[11px] font-bold leading-tight ${layer.active ? 'text-gray-900' : 'text-gray-300'}`}>{layer.label}</span>
                                </button>
                                {layer.active && (
                                  <div className="pl-7 space-y-3">
                                     <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[11px] font-bold text-gray-400"><span>{layer.legend}</span><span>{layer.opacity}%</span></div>
                                        <div className={`h-1.5 w-full rounded-full bg-gradient-to-r ${layer.color}`}></div>
                                     </div>
                                     <input type="range" min="0" max="100" value={layer.opacity} onChange={(e) => setLayers(layers.map(l => l.id === layer.id ? { ...l, opacity: e.target.value } : l))} className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-gray-900" />
                                  </div>
                                )}
                             </div>
                           ))}
                        </div>
                      )}
                   </div>

                   {selectedPlot && (
                     <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-right-10 duration-500 pointer-events-auto flex flex-col gap-6">
                        <div className="flex justify-between items-start">
                           <div>
                              <div className="text-[11px] font-bold text-emerald-600 tracking-[0.3em] mb-1 leading-none italic">{config.drillDownType}</div>
                              <h3 className="text-2xl font-bold italic tracking-tighter leading-none">{selectedPlot.id}</h3>
                           </div>
                           <button onClick={() => setSelectedPlot(null)} className="p-2 hover:bg-gray-50 rounded-full transition-all text-gray-300"><X size={18} /></button>
                        </div>
                        <div className="bg-green-700 p-5 rounded-3xl text-white">
                           <div className="text-[11px] font-bold text-gray-400 mb-2 italic">Layman Summary</div>
                           <p className="text-[13px] font-bold italic leading-tight">"{selectedPlot.layman}"</p>
                        </div>
                        <div className="space-y-3">
                           <div className="flex items-center justify-between px-1">
                              <span className="text-[11px] font-bold text-gray-400 leading-none italic">Temporal Trajectory</span>
                              <TrendingUp size={12} className="text-emerald-500" />
                           </div>
                           <div className="h-32 bg-gray-50 rounded-2xl p-2">
                              <Line 
                                data={{
                                  labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
                                  datasets: [{ fill: true, data: selectedPlot.history, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.4, pointRadius: 0 }]
                                }} 
                                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { grid: { display: false }, ticks: { font: { size: 8 } } } } }}
                              />
                           </div>
                        </div>
                        <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                           <Zap size={14} className="text-emerald-500" />
                           <span className="text-[11px] font-bold text-emerald-700 italic leading-tight">{selectedPlot.advice}</span>
                        </div>
                     </div>
                   )}
                </div>
             </div>
          </div>
        );
      case 'plots':
        return (
          <div className="p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full">
             <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
                <div>
                   <h2 className="text-4xl font-bold text-gray-900 tracking-tighter italic">{cropName} Analytical Ledger</h2>
                   <p className="text-[14px] text-gray-400 font-medium mt-1">Literature-validated remote sensing outputs aggregated per farm block</p>
                </div>
                <div className="flex gap-4">
                   <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                      <Search size={16} className="text-gray-400" />
                      <input type="text" placeholder="Search Plot ID..." className="outline-none text-[12px] font-bold w-48" />
                   </div>
                </div>
             </div>
             <SimpleCard title="Verified Farm Data" icon={<Shield size={20} />}>
                <WorkerActivityTable data={plots} columns={columns} />
             </SimpleCard>
          </div>
        );
      default:
        return (
          <div className="p-10 space-y-10 animate-in fade-in duration-500 overflow-y-auto h-full">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><Calendar size={20} /></div>
                  <div>
                     <div className="text-[11px] font-bold text-gray-400 leading-none italic">Crop Theme: {config.theme}</div>
                     <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="text-lg font-bold italic outline-none bg-transparent cursor-pointer mt-1">
                        <option>Current Season Analytics</option>
                        <option>Historical Time-Series</option>
                     </select>
                  </div>
               </div>
               <div className="flex gap-4">
                  <button className="px-6 py-2.5 bg-green-700 text-white text-[11px] font-bold rounded-xl shadow-lg">Generate Report</button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {config.kpis.map((kpi, i) => (
                 <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 group hover:shadow-2xl transition-all">
                    <div className="w-14 h-14 bg-green-700 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                       {React.cloneElement(kpi.icon, { size: 24 })}
                    </div>
                    <div>
                       <div className="text-[11px] font-bold text-gray-400 mb-1 italic">{kpi.label}</div>
                       <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold italic tracking-tighter">{kpi.value}</span>
                          <span className="text-[12px] font-bold text-gray-300">{kpi.unit}</span>
                       </div>
                    </div>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <SimpleCard title={`${cropName} Growth Trajectory`} icon={<TrendingUp size={20} />}>
                  <div className="h-[300px] mt-6">
                     <Line data={{
                        labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
                        datasets: [
                          { label: 'Mean NDVI', data: [0.4, 0.45, 0.6, 0.74, 0.72, 0.68], borderColor: '#10b981', tension: 0.4, fill: true, backgroundColor: 'rgba(16, 185, 129, 0.05)' },
                          { label: 'Nutrient/Water Proxy', data: [0.35, 0.38, 0.42, 0.55, 0.52, 0.48], borderColor: '#3b82f6', tension: 0.4, borderDash: [5, 5] }
                        ]
                     }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10, weight: 'bold' } } } } }} />
                  </div>
               </SimpleCard>

               <SimpleCard title="Physiological Health Matrix" icon={<Activity size={20} />}>
                  <div className="h-[300px] mt-6 flex items-center justify-center">
                     <Radar 
                        data={{
                          labels: ['NDVI', 'NDRE', 'LSWI', 'LST', 'VHI', 'EVI'],
                          datasets: [{
                            label: 'Active Blocks Mean',
                            data: [85, 74, 62, 45, 90, 80],
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            borderColor: '#10b981',
                            pointBackgroundColor: '#10b981',
                          }]
                        }}
                        options={{
                          scales: { r: { angleLines: { display: false }, suggestedMin: 0, suggestedMax: 100, ticks: { display: false } } },
                          plugins: { legend: { display: false } }
                        }}
                     />
                  </div>
               </SimpleCard>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans antialiased">
      <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-[1100] shadow-sm">
         <div className="flex items-center gap-10">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-400 leading-none">Intelligence Platform</span>
              <span className="text-[14px] font-bold tracking-tight mt-1">FarmIntelytics</span>
            </div>

            <div className="w-px h-8 bg-gray-100"></div>

            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-green-700 rounded-xl flex items-center justify-center p-2 shadow-lg ring-4 ring-gray-50"><Satellite className="text-white" size={20} /></div>
               <div>
                  <h1 className="text-lg font-bold tracking-tighter leading-none italic">{cropName} <span className="text-gray-400 font-medium ml-1">Geospatial Intelligence</span></h1>
                  <p className="text-[11px] font-bold tracking-[0.2em] text-emerald-600 mt-1 leading-none italic">Theme: {config.theme}</p>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="text-right">
               <div className="text-[11px] font-bold text-gray-900 leading-none italic">{userName}</div>
               <div className="text-[11px] font-bold text-emerald-600 mt-1 italic">Enterprise Auditor</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden ring-2 ring-emerald-50"><User size={20} className="text-gray-400" /></div>
         </div>
      </header>
      <div className="flex-1 flex overflow-hidden">
         <aside className="sticky top-0 h-screen w-80 bg-white border-r border-gray-100 flex flex-col z-[1050] shadow-2xl">
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
               <div className="text-[11px] font-bold text-gray-300 tracking-[0.3em] px-4 mb-4 leading-none italic">Intelligence Nodes</div>
               {[
                 { id: 'overview', label: 'Dashboard Hub', icon: <LayoutDashboard /> },
                 { id: 'geospatial', label: 'Geospatial Intel', icon: <MapIcon /> },
                 { id: 'plots', label: 'Plots Analytics', icon: <BarChart4 /> },
               ].map(tab => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all ${activeTab === tab.id ? 'bg-green-700 text-white shadow-xl translate-x-2' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}`}>{React.cloneElement(tab.icon, { size: 18 })}<span className="text-[12px] font-bold">{tab.label}</span></button>
               ))}
            </div>
            <div className="p-6 bg-gray-50/50 border-t border-gray-100">
               <button onClick={onSignOut} className="w-full bg-red-500 text-white font-bold py-5 rounded-2xl text-[11px] flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-xl"><LogOut size={16} /> Sign Out</button>
            </div>
         </aside>
         <main className="flex-1 flex flex-col relative bg-gray-50">{renderContent()}</main>
      </div>
    </div>
  );
};

export default MonitoringPortal;
