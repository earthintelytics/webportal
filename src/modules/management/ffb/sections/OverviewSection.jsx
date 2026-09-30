// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React from 'react';
import { Leaf, Activity } from 'lucide-react';
import { MetricTile, SimpleCard } from '../../../../components/SharedComponents';

const OverviewSection = () => {
   return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricTile label="Total Bunches (AI)" value="1,248" unit="BUNCH" color="bg-green-600" />
            <MetricTile label="AI Confidence" value="99.2" unit="%" color="bg-green-600" />
            <MetricTile label="Loose Fruit" value="424" unit="KG" color="bg-orange-500" />
            <MetricTile label="Mill Extraction" value="21.4" unit="%" color="bg-green-600" />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SimpleCard title="Conservation Status" icon={<Leaf size={20} />}>
               <div className="text-4xl font-black text-green-600 mb-4 tracking-tighter">555,200 <span className="text-sm font-bold text-gray-300">tCO2e</span></div>
               <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Total Carbon Sequestered</div>
            </SimpleCard>
            <SimpleCard title="Detection Trends" icon={<Activity size={20} />}>
               <div className="p-10 text-center border-2 border-dashed border-gray-50 rounded-3xl">
                  <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.2em]">Computer Vision Insights</p>
               </div>
            </SimpleCard>
         </div>
      </div>
   );
};

export default OverviewSection;
