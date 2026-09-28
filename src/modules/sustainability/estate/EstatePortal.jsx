import React, { useState } from 'react';
import SustainabilityPortal from '../SustainabilityPortal';
import {
  ShieldCheck,
  Map as MapIcon,
  BarChart4,
  AlertTriangle,
  Zap,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import {
  LayerSwitcher,
  LegendPanel,
  TimelineSlider,
  FloatingMetric,
  GISSidebar,
  TabPlaceholder
} from '../shared/GISComponents';

const EstatePortal = (props) => {
  const [activeLayer, setActiveLayer] = useState('carbon');
  const [currentYear, setCurrentYear] = useState(2026);

  const layers = [
    { id: 'satellite', label: 'True Color Sat', icon: <MapIcon size={14} /> },
    { id: 'ndvi', label: 'Vegetation (NDVI)', icon: <Zap size={14} /> },
    { id: 'carbon', label: 'Carbon Density', icon: <BarChart4 size={14} /> },
  ];

  const legendItems = [
    { label: 'High Carbon (250+ t/ha)', color: '#064e3b' },
    { label: 'Moderate (100-250 t/ha)', color: '#059669' },
    { label: 'Low/Transition', color: '#34d399' },
    { label: 'Hotspot / Loss', color: '#ef4444' },
  ];

  return (
    <SustainabilityPortal 
      {...props} 
      title="Industrial Estate" 
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
          <LegendPanel title="Carbon Density Scale" items={legendItems} />
          <TimelineSlider currentYear={currentYear} onChange={setCurrentYear} />

          <div className="absolute right-8 top-32 z-[1050] pointer-events-auto flex flex-col gap-6">
            <GISSidebar title="Estate Analytics" icon={<BarChart4 size={18} />}>
               <div className="space-y-6">
                  <FloatingMetric label="Aggregate Stock" value="11.4k" unit="tCO2e" icon={<Zap size={16}/>} />
                  <FloatingMetric label="Sequestration" value="+840" unit="t/YR" icon={<TrendingUp size={16}/>} color="emerald" />
                  
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                     <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={14} className="text-amber-500" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-white">Carbon Loss Alerts</span>
                     </div>
                     <div className="space-y-3">
                        {[
                          { area: 'Sector B-12', loss: '-12.4t', reason: 'Stress' },
                          { area: 'Sector D-05', loss: '-4.2t', reason: 'Thinning' },
                        ].map((alert, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                             <span className="text-[11px] font-bold text-red-400">{alert.area}</span>
                             <span className="text-[11px] font-black text-white">{alert.loss}</span>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                     <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest block mb-2">ESG Score</span>
                     <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-white leading-none">94.2</span>
                        <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Grade A+</span>
                     </div>
                  </div>
               </div>
            </GISSidebar>
          </div>

          <div className="absolute left-8 bottom-40 z-[1050] pointer-events-auto">
             <div className="gis-glass p-6 rounded-2xl w-64">
                <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4">Verification Status</p>
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                      <ShieldCheck size={16} />
                   </div>
                   <div>
                      <p className="text-[12px] font-black text-white">IPCC Tier 2 Verified</p>
                      <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Expires May 2027</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </SustainabilityPortal>
  );
};


export default EstatePortal;
