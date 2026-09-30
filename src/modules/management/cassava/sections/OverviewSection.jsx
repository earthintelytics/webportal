// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React from 'react';
import { Box, Activity } from 'lucide-react';
import { MetricTile, SimpleCard } from '../../../../components/SharedComponents';

const OverviewSection = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full bg-gray-50/50 p-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricTile label="Tuber Yield" value="24.8" unit="MT/Ha" color="bg-lime-600" />
        <MetricTile label="Starch Content" value="32.4" unit="%" color="bg-lime-600" />
        <MetricTile label="Total Area" value="1.2k" unit="HA" color="bg-lime-600" />
        <MetricTile label="Compliance" value="95" unit="%" color="bg-green-600" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <SimpleCard title="Processing Flow" icon={<Box size={20} />}>
            <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-white">
               <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.2em] mb-4">Processing Plant Queue</p>
               <div className="flex justify-center items-center gap-6">
                  <div className="flex flex-col items-center">
                     <div className="text-4xl font-black text-lime-600">1.2k</div>
                     <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">MT Pending</div>
                  </div>
                  <div className="w-px h-10 bg-gray-100"></div>
                  <div className="flex flex-col items-center">
                     <div className="text-4xl font-black text-lime-600">84%</div>
                     <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Efficiency</div>
                  </div>
               </div>
            </div>
         </SimpleCard>
         <SimpleCard title="Quality Trends" icon={<Activity size={20} />}>
            <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-white">
               <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.2em] mb-4">Starch Recovery Analysis</p>
               <div className="text-3xl font-black text-lime-700 tracking-tighter">32.4 <span className="text-sm font-bold text-gray-300">%</span></div>
               <div className="text-[11px] font-bold text-lime-800 uppercase tracking-widest mt-2">Optimal Recovery Range</div>
            </div>
         </SimpleCard>
      </div>
    </div>
  );
};

export default OverviewSection;
