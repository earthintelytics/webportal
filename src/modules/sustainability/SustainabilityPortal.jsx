// UNUSED (2026-09-29): replaced by modules/services/ServicePortal.jsx (same layout as organisation monitoring). Kept on purpose, not deleted — see docs/UNUSED_CODE.md in the root repo before reusing or removing.
import React, { useState } from 'react';
import { 
  Leaf, 
  Globe, 
  Trees, 
  Activity, 
  ArrowLeft,
  LogOut,
  Layers,
  Satellite,
  CheckCircle2,
  BarChart4,
  TrendingUp,
  Wind,
  Droplets,
  Zap,
  LayoutDashboard,
  Calendar,
  Map as MapIcon,
  Maximize2,
  Search,
  Filter,
  Eye,
  Shield,
  User,
  Bell
} from 'lucide-react';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  SimpleCard, 
  MetricTile, 
  WorkerActivityTable, 
  GeospatialPreview, 
  FilterBar 
} from '../../components/SharedComponents';

import OverviewSection from './sections/OverviewSection';
import GeospatialSection from './sections/GeospatialSection';
import PlotsSection from './sections/PlotsSection';

import './styles/GISTheme.css';
import { 
  HUDPanel 
} from './shared/GISComponents';

const SustainabilityPortal = ({ title, type, onSignOut, onBack, children, sidebarItems = [] }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [userName] = useState('Admin Manager');

  // Default sidebar items if none provided
  const defaultItems = [
    { id: 'overview', label: 'Dashboard Hub', icon: <LayoutDashboard size={18}/> },
    { id: 'geospatial', label: 'Geospatial Intel', icon: <MapIcon size={18}/> },
    { id: 'plots', label: 'Plots Analytics', icon: <BarChart4 size={18}/> },
  ];

  const itemsToRender = sidebarItems.length > 0 ? sidebarItems : defaultItems;

  return (
    <div className="h-screen flex flex-col gis-theme overflow-hidden font-sans antialiased relative">
      {/* Background Map Container */}
      <div className="gis-map-container">
        <MapContainer 
          center={[6.5244, 3.3792]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        </MapContainer>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none"></div>
        <div className="gis-scanline"></div>
      </div>

      {/* Premium Top Navigation HUD */}
      <header className="h-20 flex items-center justify-between px-8 z-[1100] relative pointer-events-none">
         <div className="flex items-center gap-10 pointer-events-auto">
            <button onClick={onBack} className="flex items-center gap-2 group">
               <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-black transition-all backdrop-blur-md">
                  <ArrowLeft size={18} />
               </div>
               <div className="flex flex-col text-left">
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 leading-none">Exit to Hub</span>
                  <span className="text-[14px] font-black tracking-tight mt-1 text-white">FarmIntelytics</span>
               </div>
            </button>

            <div className="w-px h-8 bg-white/10"></div>

            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center p-2">
                  <Leaf className="text-white" size={20} />
               </div>
               <div>
                  <h1 className="text-lg font-black tracking-tighter leading-none text-white">{title} <span className="text-emerald-500 italic font-medium ml-1">{type} Intelligence</span></h1>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500 mt-1">Satellite Intelligence: Active</p>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-8 pointer-events-auto">
            <div className="flex items-center gap-4">
               <div className="text-right">
                  <div className="text-[11px] font-black text-white leading-none">{userName}</div>
                  <div className="text-[11px] font-black text-emerald-500 uppercase tracking-widest mt-1">Lead Carbon Auditor</div>
               </div>
               <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden backdrop-blur-md">
                  <User size={20} className="text-gray-400" />
               </div>
            </div>
            <button onClick={onSignOut} className="p-3 bg-red-600/20 text-red-500 border border-red-500/30 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-lg backdrop-blur-md">
               <LogOut size={18} />
            </button>
         </div>
      </header>

      {/* Sidebar Navigation HUD */}
      <div className="absolute left-8 top-32 z-[1050] pointer-events-auto flex flex-col gap-4">
         <HUDPanel className="p-2 space-y-1 w-64">
            <div className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] px-4 py-2">Navigation Node</div>
            {itemsToRender.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  activeTab === tab.id 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-gray-500 hover:bg-white/5 hover:text-white'
                }`}
              >
                 {React.cloneElement(tab.icon, { size: 16 })}
                 <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
         </HUDPanel>
      </div>

      {/* Main Content Area - Overlay on Map */}
      <main className="flex-1 flex flex-col relative z-[1000] overflow-hidden pointer-events-none">
         <div className="flex-1 w-full relative">
            {typeof children === 'function' ? children(activeTab) : children}
         </div>
      </main>
    </div>
  );
};



export default SustainabilityPortal;
