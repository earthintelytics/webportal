import React from 'react';
import { Activity, Sprout } from 'lucide-react';
import { MetricTile, SimpleCard } from '../../../../components/SharedComponents';

const OverviewSection = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full bg-gray-50/50 p-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricTile label="Yield Prediction" value="4,820" unit="MT" color="bg-amber-800" />
        <MetricTile label="Tree Count" value="124k" unit="TREES" color="bg-amber-800" />
        <MetricTile label="Fermentation Status" value="92" unit="%" color="bg-amber-800" />
        <MetricTile label="Compliance" value="98" unit="%" color="bg-green-600" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <SimpleCard title="Batch Quality" icon={<Activity size={20} />}>
            <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-white">
               <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.2em] mb-4">Fermentation Lab Queue</p>
               <div className="flex justify-center items-center gap-4">
                  <div className="text-3xl font-black text-amber-800">12</div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Batches Pending</div>
               </div>
            </div>
         </SimpleCard>
         <SimpleCard title="Cycle Tracker" icon={<Sprout size={20} />}>
            <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-white">
               <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.2em] mb-4">Harvest Cycle Timeline</p>
               <div className="flex justify-center items-center gap-4">
                  <div className="text-3xl font-black text-amber-600 italic">Phase 2</div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Mid-Crop Peak</div>
               </div>
            </div>
         </SimpleCard>
      </div>
    </div>
  );
};

export default OverviewSection;
