import React, { useState } from 'react';
import {
   Leaf,
   Globe,
   Trees,
   Activity,
   ArrowLeft,
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
   Bell,
   ChevronLeft,
  Grid
} from 'lucide-react';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
   SimpleCard,
   MetricTile,
   WorkerActivityTable,
   GeospatialPreview,
   FilterBar
} from '../../../components/SharedComponents';

import OverviewSection from './sections/OverviewSection';
import GeospatialSection from './sections/GeospatialSection';
import PlotsSection from './sections/PlotsSection';

const GroupsSustainability = ({ onBack }) => {
   const [activeTab, setActiveTab] = useState('overview');
   const [activeLayer, setActiveLayer] = useState('Carbon Density');
   const [userName] = useState('Admin Manager');

   const carbonData = [
      { id: 'G-RICE-01', area: '4.2 HA', carbonStock: '124.2 tCO2e', health: '98%', landUse: 'Primary Forest', status: 'Verified' },
      { id: 'G-CAS-12', area: '2.8 HA', carbonStock: '42.8 tCO2e', health: '92%', landUse: 'Agroforestry', status: 'Active' },
      { id: 'G-FFB-09', area: '12.5 HA', carbonStock: '185.4 tCO2e', health: '95%', landUse: 'Industrial', status: 'Verified' },
   ];

   const columns = [
      { key: 'id', label: 'Plot ID' },
      { key: 'area', label: 'Land Area' },
      { key: 'landUse', label: 'Land Classification' },
      { key: 'carbonStock', label: 'Carbon Stock', render: (val) => <span className="text-[13px] font-bold text-emerald-600">{val}</span> },
      { key: 'health', label: 'Canopy Health', render: (val) => <span className="text-emerald-500 font-bold">{val}</span> },
      { key: 'status', label: 'MRV Status' },
   ];

   const renderContent = () => {
      switch (activeTab) {
         case 'geospatial':
            return <GeospatialSection activeLayer={activeLayer} setActiveLayer={setActiveLayer} />;
         case 'plots':
            return <PlotsSection carbonData={carbonData} columns={columns} />;
         default:
            return <OverviewSection />;
      }
   };

   return (
      <div className="h-screen flex flex-col bg-gray-50 text-gray-900 overflow-hidden font-sans antialiased">
         <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 z-[1100] shadow-sm">
            <div className="flex items-center gap-8">
               <button onClick={onBack} className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400 hover:text-gray-900"><ChevronLeft size={24} /></button>
               <div className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center p-2 shadow-lg ring-4 ring-emerald-50">
                  <Leaf className="text-white" size={24} />
               </div>
               <div>
                  <h1 className="text-lg font-black tracking-tighter leading-none uppercase text-gray-900">Smallholder Sustainability <span className="text-gray-400 font-medium ml-1">Center</span></h1>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600 mt-1">Sustainability Node: Active</p>
               </div>
            </div>

            <div className="flex items-center gap-10">
               <div className="flex items-center gap-4">
                  <div className="text-right">
                     <div className="text-[11px] font-bold text-gray-900 leading-none">{userName}</div>
                     <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Sustainability Auditor</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden ring-2 ring-emerald-50 shadow-sm">
                     <User size={20} className="text-gray-400" />
                  </div>
               </div>
            </div>
         </header>

         <div className="flex-1 flex overflow-hidden">
            <aside className="w-72 bg-white border-r border-gray-100 flex flex-col z-[1050]">
               <div className="flex-1 overflow-y-auto p-6 space-y-1.5">
                  <div className="text-[11px] font-bold text-gray-300 uppercase tracking-[0.3em] px-4 mb-4 italic">Sustainability Menu</div>
                  {[
                     { id: 'overview', label: 'Dashboard Hub', icon: <LayoutDashboard /> },
                     { id: 'geospatial', label: 'Geospatial Intel', icon: <MapIcon /> },
                     { id: 'plots', label: 'Plots Analytics', icon: <BarChart4 /> },
                  ].map(tab => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-xl translate-x-2' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                           }`}
                     >
                        {React.cloneElement(tab.icon, { size: 18 })}
                        <span className="text-[12px] font-bold uppercase tracking-widest">{tab.label}</span>
                     </button>
                  ))}
               </div>

               <div className="p-6 bg-gray-50/50 border-t border-gray-100 space-y-2">
                                    <button onClick={onBack} className="w-full bg-white text-gray-700 border border-gray-200 font-bold uppercase tracking-widest py-4 rounded-2xl text-[11px] flex items-center justify-center gap-3 hover:bg-gray-100 transition-all shadow-sm"><Grid size={16} /> Back to Hub</button>

               </div>
            </aside>

            <main className="flex-1 flex flex-col relative overflow-hidden bg-gray-50">
               {renderContent()}
            </main>
         </div>
      </div>
   );
};

export default GroupsSustainability;
