// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React from 'react';
import { Leaf, Activity } from 'lucide-react';
import { MetricTile, SimpleCard } from '../../../../components/SharedComponents';

const OverviewSection = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full bg-gray-50/50 p-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricTile label="Latex Yield" value="842" unit="KG" color="bg-cyan-600" />
        <MetricTile label="Avg DRC Content" value="32.4" unit="%" color="bg-cyan-600" />
        <MetricTile label="Active Tappers" value="128" unit="PERS" color="bg-cyan-600" />
        <MetricTile label="Estate Compliance" value="98" unit="%" color="bg-green-600" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <SimpleCard title="Sustainability Index" icon={<Leaf size={20} />}>
            <div className="p-10 bg-white rounded-3xl border border-gray-100 shadow-sm">
               <div className="text-5xl font-black text-cyan-600 mb-2 tracking-tighter">227,400 <span className="text-xl font-bold text-gray-300">tCO2e</span></div>
               <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Total Carbon Reserved</div>
            </div>
         </SimpleCard>
         <SimpleCard title="Efficiency Trends" icon={<Activity size={20} />}>
            <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/30">
               <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.2em] mb-4">Daily Tapping Velocity</p>
               <div className="flex justify-center items-center gap-6">
                  <div className="text-3xl font-black text-cyan-600">4.2 <span className="text-sm font-bold text-gray-300">KG/H</span></div>
                  <div className="w-px h-8 bg-gray-100"></div>
                  <div className="text-lg font-bold text-green-500">+12% vs LW</div>
               </div>
            </div>
         </SimpleCard>
      </div>
    </div>
  );
};

export default OverviewSection;
