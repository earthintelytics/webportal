import React, { useState, useMemo } from 'react';
import {
   Globe,
   Layers,
   LogOut,
   Satellite,
   Map as MapIcon,
   Activity,
   Zap,
   Droplets,
   Sun,
   Trees,
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
   Leaf,
   Download,
   ChevronRight,
   ChevronLeft,
   Users,
  Grid
} from 'lucide-react';
import { MapContainer, TileLayer, ZoomControl, Polygon, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
   SimpleCard,
   MetricTile,
   WorkerActivityTable
} from '../../../components/SharedComponents';
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

import OverviewSection from './sections/OverviewSection';
import GeospatialSection from './sections/GeospatialSection';
import PlotsSection from './sections/PlotsSection';

const CONFIG = {
   primaryColor: 'indigo',
   theme: 'Cooperative / Cluster Monitoring',
   indices: [
      { id: 'NDVI', label: 'Cluster Biomass (NDVI)', legend: 'Sparse - Dense', color: 'from-amber-50 to-emerald-900', active: true, opacity: 80 },
      { id: 'LST', label: 'Cluster Heat (LST)', legend: 'Cool - Hot', color: 'from-blue-200 to-red-600', active: false, opacity: 60 },
   ],
   kpis: [
      { label: 'Active Clusters', value: '42', unit: 'GROUPS', icon: <Users /> },
      { label: 'Avg Health', value: '78', unit: '%', icon: <Activity /> },
      { label: 'Input Coverage', value: '94', unit: '%', icon: <CheckCircle2 /> },
   ],
   layman: {
      health: 'Cluster performance is within seasonal norms. Input distribution completed.',
      stress: 'Localized stress detected in Northern clusters. Verification required.',
      yield: 'Aggregate cluster yield projected at 92% of target.'
   },
   drillDownType: 'Cluster Health Anomaly'
};

const GroupsMonitoring = ({ onBack, onSignOut }) => {
   const [activeTab, setActiveTab] = useState('overview');
   const [showLayerList, setShowLayerList] = useState(true);
   const [dateRange, setDateRange] = useState('Current Season Analytics');
   const [userName] = useState('Admin Manager');
   const [selectedPlot, setSelectedPlot] = useState(null);

   const [layers, setLayers] = useState([
      { id: 'google', label: 'Google Satellite', active: true, opacity: 100, legend: 'Natural Color', color: 'from-gray-500 to-gray-900', url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' },
      ...CONFIG.indices
   ]);

   const plots = [
      { id: `CL-NORTH-01`, area: '142 HA', health: '98%', status: 'Healthy', ndvi: 0.72, layman: CONFIG.layman.health, advice: 'No action needed.', history: [0.3, 0.45, 0.58, 0.72, 0.75, 0.72] },
      { id: `CL-SOUTH-04`, area: '88 HA', health: '35%', status: 'Stressed', ndvi: 0.35, layman: CONFIG.layman.stress, advice: 'Inspect and apply remediation.', history: [0.3, 0.32, 0.40, 0.38, 0.35, 0.33] },
   ];

   const columns = [
      { key: 'id', label: 'Cluster ID' },
      { key: 'area', label: 'Area' },
      { key: 'health', label: 'Health Score', render: (val) => <span className={`font-bold ${parseInt(val) < 40 ? 'text-red-500' : 'text-emerald-500'}`}>{val}</span> },
      { key: 'status', label: 'Status', render: (val) => <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-lg ${val === 'Stressed' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{val}</span> },
      { key: 'layman', label: 'Field Summary' },
      { key: 'action', label: 'Analysis', render: (_, row) => <button onClick={() => { setSelectedPlot(row); setActiveTab('geospatial'); }} className="text-sky-600 font-bold uppercase text-[11px] hover:underline">Drill Down</button> }
   ];

   const renderContent = () => {
      switch (activeTab) {
         case 'geospatial':
            return (
               <GeospatialSection 
                  layers={layers} 
                  setLayers={setLayers} 
                  plots={plots} 
                  selectedPlot={selectedPlot} 
                  setSelectedPlot={setSelectedPlot} 
                  showLayerList={showLayerList} 
                  setShowLayerList={setShowLayerList} 
                  config={CONFIG} 
               />
            );
         case 'plots':
            return <PlotsSection plots={plots} columns={columns} />;
         default:
            return <OverviewSection dateRange={dateRange} setDateRange={setDateRange} config={CONFIG} />;
      }
   };

   return (
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans antialiased">
         <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 z-[1100] shadow-sm">
            <div className="flex items-center gap-8">
               <div className="p-2"></div>
               <div className="w-11 h-11 bg-gray-900 rounded-xl flex items-center justify-center p-2 shadow-lg ring-4 ring-gray-50"><Satellite className="text-white" size={24} /></div>
               <div>
                  <h1 className="text-lg font-black tracking-tighter leading-none uppercase italic">Smallholder <span className="text-gray-400 font-medium ml-1">Geospatial Intelligence</span></h1>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600 mt-1 leading-none italic uppercase">Theme: {CONFIG.theme}</p>
               </div>
            </div>
            <div className="flex items-center gap-10">
               <div className="flex items-center gap-4">
                  <div className="text-right">
                     <div className="text-[11px] font-bold text-gray-900 leading-none italic uppercase">{userName}</div>
                     <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mt-1 italic">Enterprise Auditor</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden ring-2 ring-emerald-50 shadow-sm">
                     <User size={20} className="text-gray-400" />
                  </div>
               </div>
            </div>
         </header>
         <div className="flex-1 flex overflow-hidden">
            <aside className="sticky top-0 h-screen w-72 bg-white border-r border-gray-100 flex flex-col z-[1050]">
               <div className="flex-1 overflow-y-auto p-6 space-y-1.5">
                  <div className="text-[11px] font-bold text-gray-300 uppercase tracking-[0.3em] px-4 mb-4 leading-none italic">Analytical Center</div>
                  {[
                     { id: 'overview', label: 'Operational Center', icon: <LayoutDashboard /> },
                     { id: 'geospatial', label: 'Geospatial Intel', icon: <MapIcon /> },
                     { id: 'plots', label: 'Plots Analytics', icon: <BarChart4 /> },
                  ].map(tab => (
                     <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-xl translate-x-2' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}`}>{React.cloneElement(tab.icon, { size: 18 })}<span className="text-[12px] font-bold uppercase tracking-widest">{tab.label}</span></button>
                  ))}
               </div>
               <div className="p-6 bg-gray-50/50 border-t border-gray-100 space-y-2">
                  <button onClick={onSignOut} className="w-full bg-red-600 text-white font-bold uppercase tracking-widest py-4 rounded-2xl text-[11px] flex items-center justify-center gap-3 hover:bg-red-700 transition-all shadow-lg"><LogOut size={16} /> Sign Out</button>
               </div>
            </aside>
            <main className="flex-1 flex flex-col relative bg-gray-50">{renderContent()}</main>
         </div>
      </div>
   );
};

export default GroupsMonitoring;
