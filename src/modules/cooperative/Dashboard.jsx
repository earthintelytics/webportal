// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React, { useState } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  Activity, 
  ShieldCheck, 
  Globe, 
  ChevronLeft,
  User,
  Grid,
  LogOut
} from 'lucide-react';

import OverviewSection from './sections/OverviewSection';
import SustainabilitySection from './sections/SustainabilitySection';
import WorkforceSection from './sections/WorkforceSection';
import GeospatialSection from './sections/GeospatialSection';

const GroupsDashboard = ({ onSignOut, onBack }) => {
   const [activeTab, setActiveTab] = useState('overview');
   const [activeLayer, setActiveLayer] = useState('satellite');
   const [userName] = useState('Admin Manager');

   const renderContent = () => {
      switch (activeTab) {
         case 'geospatial':
            return <GeospatialSection activeLayer={activeLayer} setActiveLayer={setActiveLayer} />;
         case 'workforce':
            return <WorkforceSection />;
         case 'sustainability':
            return <SustainabilitySection />;
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
                  <Users className="text-white" size={24} />
               </div>
               <div>
                  <h1 className="text-lg font-black tracking-tighter leading-none uppercase text-gray-900">Groups <span className="text-emerald-600 ml-1">Management</span></h1>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 mt-1">Smallholder Hub · Active</p>
               </div>
            </div>

            <div className="flex items-center gap-6">
               <div className="flex items-center gap-4">
                  <div className="text-right">
                     <div className="text-[11px] font-bold text-gray-900">{userName}</div>
                     <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Lead Coordinator</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                     <User size={20} className="text-gray-400" />
                  </div>
               </div>
               <button 
                  onClick={onSignOut}
                  className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"
               >
                  <LogOut size={20} />
               </button>
            </div>
         </header>

         <div className="flex-1 flex overflow-hidden">
            <aside className="w-72 bg-white border-r border-gray-100 flex flex-col z-[1050]">
               <div className="flex-1 overflow-y-auto p-6 space-y-1.5">
                  <div className="text-[11px] font-bold text-gray-300 uppercase tracking-[0.3em] px-4 mb-4 italic">Management Menu</div>
                  {[
                     { id: 'overview', label: 'Cluster Hub', icon: <LayoutDashboard /> },
                     { id: 'geospatial', label: 'Spatial Intel', icon: <Globe /> },
                     { id: 'workforce', label: 'Member Logs', icon: <Activity /> },
                     { id: 'sustainability', label: 'MRV Ledger', icon: <ShieldCheck /> },
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

               <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                  <button onClick={onBack} className="w-full bg-white text-gray-700 border border-gray-200 font-bold uppercase tracking-widest py-4 rounded-2xl text-[11px] flex items-center justify-center gap-3 hover:bg-gray-100 transition-all shadow-sm"><Grid size={16} /> Hub Terminal</button>
               </div>
            </aside>

            <main className="flex-1 flex flex-col relative overflow-hidden bg-gray-50">
               {renderContent()}
            </main>
         </div>
      </div>
   );
};

export default GroupsDashboard;
