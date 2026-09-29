// UNUSED (2026-09-29): replaced by modules/services/ServicePortal.jsx (same layout as organisation monitoring). Kept on purpose, not deleted — see docs/UNUSED_CODE.md in the root repo before reusing or removing.
import React, { useState } from 'react';
import SustainabilityPortal from '../SustainabilityPortal';
import {
  Trees,
  Maximize2,
  AlertCircle,
  CloudLightning,
  Activity,
  Database,
  TrendingUp,
  LayoutDashboard,
  BarChart4
} from 'lucide-react';
import {
  LayerSwitcher,
  LegendPanel,
  TimelineSlider,
  FloatingMetric,
  GISSidebar,
  TabPlaceholder
} from '../shared/GISComponents';

const ForestryPortal = (props) => {
  const [activeLayer, setActiveLayer] = useState('canopy');
  const [currentYear, setCurrentYear] = useState(2026);

  const layers = [
    { id: 'canopy', label: 'Canopy Height (LiDAR)', icon: <Trees size={14} /> },
    { id: 'disturbance', label: 'Disturbance Alerts', icon: <AlertCircle size={14} /> },
    { id: 'biodiversity', label: 'Biodiversity Index', icon: <Activity size={14} /> },
    { id: 'fire', label: 'Burn Severity', icon: <CloudLightning size={14} /> },
  ];

  const legendItems = [
    { label: 'Primary (40m+)', color: '#064e3b' },
    { label: 'Secondary (20-40m)', color: '#059669' },
    { label: 'Degraded / Clear', color: '#ef4444' },
    { label: 'Restoration Area', color: '#3b82f6' },
  ];

  return (
    <SustainabilityPortal 
      {...props} 
      title="Forestry Intel" 
      type="High Density"
    >
      {(activeTab) => activeTab === 'overview' ? (
        <TabPlaceholder icon={<LayoutDashboard size={22} />} label="Dashboard Hub" />
      ) : activeTab === 'plots' ? (
        <TabPlaceholder icon={<BarChart4 size={22} />} label="Plots Analytics" />
      ) : (
        <div className="w-full h-full relative pointer-events-none">
          {/* Floating HUD Elements */}
          <LayerSwitcher layers={layers} activeLayer={activeLayer} onToggle={setActiveLayer} />
          <LegendPanel title="Canopy Classification" items={legendItems} />
          <TimelineSlider currentYear={currentYear} onChange={setCurrentYear} />

          <div className="absolute right-8 top-32 z-[1050] pointer-events-auto flex flex-col gap-6">
            <GISSidebar title="Forest Inventory" icon={<Trees size={18} />}>
               <div className="space-y-6">
                  <FloatingMetric label="Total Biomass" value="1.2M" unit="TONNES" icon={<Database size={16}/>} color="emerald" />
                  <FloatingMetric label="Avg Height" value="32.4" unit="METERS" icon={<Maximize2 size={16}/>} color="blue" />
                  
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                     <div className="flex items-center gap-2 mb-4">
                        <AlertCircle size={14} className="text-red-500" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-white">Disturbance Events</span>
                     </div>
                     <div className="space-y-3">
                        {[
                          { event: 'Logging Detection', area: 'Zone D4', severity: 'High' },
                          { event: 'Encroachment', area: 'Zone F1', severity: 'Med' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                             <div>
                                <p className="text-[11px] font-bold text-red-400">{item.event}</p>
                                <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{item.area}</p>
                             </div>
                             <span className="text-[11px] font-black text-white uppercase tracking-widest">{item.severity}</span>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Sink Rate</span>
                        <TrendingUp size={14} className="text-emerald-500" />
                     </div>
                     <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white leading-none">12.8</span>
                        <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">t/ha/yr</span>
                     </div>
                  </div>
               </div>
            </GISSidebar>
          </div>

          <div className="absolute left-8 bottom-40 z-[1050] pointer-events-auto">
             <div className="gis-glass p-6 rounded-2xl w-64">
                <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4">Satellite Stream</p>
                <div className="flex items-center gap-4">
                   <div className="w-2 h-2 rounded-full bg-status-live animate-pulse"></div>
                   <div>
                      <p className="text-[12px] font-black text-white uppercase tracking-tighter">Sentinel-2 L2A</p>
                      <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mt-0.5">Last Sync: 14m ago</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </SustainabilityPortal>
  );
};


export default ForestryPortal;
