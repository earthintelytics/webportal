// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React from 'react';
import { Activity, Trees, Users, Shield, Leaf, Globe, ClipboardList } from 'lucide-react';
import { MetricTile, SimpleCard } from '../../../../components/SharedComponents';

const OverviewSection = ({ workerData }) => {
  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 overflow-y-auto h-full bg-gray-50/50">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricTile label="Total RCN Harvested" value="48.6" unit="MT" color="bg-orange-600" icon={<Activity size={24} />} />
        <MetricTile label="Trees Managed" value="12,482" unit="TREES" color="bg-orange-600" icon={<Trees size={24} />} />
        <MetricTile label="Active Workforce" value="42" unit="PERS" color="bg-orange-600" icon={<Users size={24} />} />
        <MetricTile label="Estate Health" value="94" unit="%" color="bg-emerald-500" icon={<Shield size={24} />} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <SimpleCard title="Sustainability Impact" icon={<Leaf size={20} />}>
            <div className="flex items-center justify-between mb-6">
               <div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Carbon Sequestered</div>
                  <div className="text-3xl font-black text-emerald-600">352,400 <span className="text-sm font-bold text-gray-300">tCO2e</span></div>
               </div>
               <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <Globe className="text-emerald-500" size={28} />
               </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 w-[72%]"></div>
            </div>
            <div className="mt-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest italic">Target: 500k tCO2e by 2027</div>
         </SimpleCard>
         <SimpleCard title="Recent Field Logs" icon={<ClipboardList size={20} />}>
            <div className="space-y-4">
               {workerData.slice(0, 4).map((w, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                     <div className="flex items-center gap-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-600"></div>
                        <span className="text-[12px] font-bold text-gray-800">{w.name} · {w.plot}</span>
                     </div>
                     <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{w.task}</span>
                  </div>
               ))}
            </div>
         </SimpleCard>
      </div>
    </div>
  );
};

export default OverviewSection;
