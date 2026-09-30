// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React from 'react';
import { Leaf, ThermometerSun } from 'lucide-react';
import { MetricTile, SimpleCard } from '../../../../components/SharedComponents';

const OverviewSection = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full bg-gray-50/50 p-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricTile label="Net Yield" value="5.8" unit="t/ha" color="bg-teal-600" icon={<Leaf size={24} />} />
        <MetricTile label="Head Rice Yield" value="64.2" unit="%" color="bg-teal-600" icon={<Leaf size={24} />} />
        <MetricTile label="Harvest Moisture" value="21.3" unit="%" color="bg-teal-600" icon={<ThermometerSun size={24} />} />
        <MetricTile label="Plot Compliance" value="96" unit="%" color="bg-green-600" icon={<Leaf size={24} />} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <SimpleCard title="Sustainability Index" icon={<Leaf size={20} />}>
            <div className="p-10 bg-white rounded-3xl border border-gray-100 shadow-sm">
               <div className="text-5xl font-black text-teal-600 mb-2 tracking-tighter">105,400 <span className="text-xl font-bold text-gray-300">tCO2e</span></div>
               <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Total Carbon Sequestered</div>
            </div>
         </SimpleCard>
         <SimpleCard title="Drying Station" icon={<ThermometerSun size={20} />}>
            <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/30">
               <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.2em]">Live Moisture Sensor Data Stream</p>
               <div className="mt-4 flex justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-status-live animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-status-live animate-pulse delay-75"></div>
                  <div className="w-2 h-2 rounded-full bg-status-live animate-pulse delay-150"></div>
               </div>
            </div>
         </SimpleCard>
      </div>
    </div>
  );
};

export default OverviewSection;
