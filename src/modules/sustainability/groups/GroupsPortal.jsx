// UNUSED (2026-09-29): replaced by modules/services/ServicePortal.jsx (same layout as organisation monitoring). Kept on purpose, not deleted — see docs/UNUSED_CODE.md in the root repo before reusing or removing.
import React, { useState } from 'react';
import SustainabilityPortal from '../SustainabilityPortal';
import {
  Users,
  Sprout,
  TrendingUp,
  Award,
  Globe,
  CheckCircle2,
  Database,
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

const GroupsPortal = (props) => {
  const [activeLayer, setActiveLayer] = useState('farms');
  const [currentYear, setCurrentYear] = useState(2026);

  const layers = [
    { id: 'farms', label: 'Farm Polygons', icon: <Database size={14} /> },
    { id: 'biomass', label: 'Biomass Index', icon: <Sprout size={14} /> },
    { id: 'credits', label: 'Credit Eligibility', icon: <Award size={14} /> },
  ];

  const legendItems = [
    { label: 'Eligible (High Density)', color: '#10b981' },
    { label: 'Pending Verification', color: '#f59e0b' },
    { label: 'Ineligible (Low Cover)', color: '#64748b' },
  ];

  return (
    <SustainabilityPortal 
      {...props} 
      title="Smallholder Group" 
      type="Carbon"
    >
      {(activeTab) => activeTab === 'overview' ? (
        <TabPlaceholder icon={<LayoutDashboard size={22} />} label="Dashboard Hub" />
      ) : activeTab === 'plots' ? (
        <TabPlaceholder icon={<BarChart4 size={22} />} label="Plots Analytics" />
      ) : (
        <div className="w-full h-full relative pointer-events-none">
          {/* Floating HUD Elements */}
          <LayerSwitcher layers={layers} activeLayer={activeLayer} onToggle={setActiveLayer} />
          <LegendPanel title="Eligibility Status" items={legendItems} />
          <TimelineSlider currentYear={currentYear} onChange={setCurrentYear} />

          <div className="absolute right-8 top-32 z-[1050] pointer-events-auto flex flex-col gap-6">
            <GISSidebar title="Cooperative Intel" icon={<Users size={18} />}>
               <div className="space-y-6">
                  <FloatingMetric label="Active Farmers" value="1,240" unit="MEMBERS" icon={<Users size={16}/>} color="emerald" />
                  <FloatingMetric label="Aggregated Carbon" value="42.5k" unit="tCO2e" icon={<Globe size={16}/>} color="blue" />
                  
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                     <div className="flex items-center gap-2 mb-4">
                        <Award size={14} className="text-amber-500" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-white">Top Contributors</span>
                     </div>
                     <div className="space-y-3">
                        {[
                          { name: 'Olatunji K.', value: '124 t', rank: '01' },
                          { name: 'Abebe M.', value: '118 t', rank: '02' },
                          { name: 'Kofi A.', value: '115 t', rank: '03' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                             <div className="flex items-center gap-3">
                                <span className="text-[11px] font-black text-emerald-500">{item.rank}</span>
                                <span className="text-[11px] font-bold text-gray-300">{item.name}</span>
                             </div>
                             <span className="text-[11px] font-black text-white">{item.value}</span>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                     <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest block mb-2">Credit Readiness</span>
                     <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-white leading-none">82%</span>
                        <div className="px-3 py-1 bg-blue-500 text-white rounded-lg text-[11px] font-black uppercase tracking-widest">Market Ready</div>
                     </div>
                  </div>
               </div>
            </GISSidebar>
          </div>

          <div className="absolute left-8 bottom-40 z-[1050] pointer-events-auto">
             <div className="gis-glass p-6 rounded-2xl w-64">
                <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4">Group MRV Status</p>
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      <CheckCircle2 size={16} />
                   </div>
                   <div>
                      <p className="text-[12px] font-black text-white">Verification Active</p>
                      <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest mt-0.5">85% Plots Audited</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </SustainabilityPortal>
  );
};


export default GroupsPortal;
