import React from 'react';
import { Zap, TrendingUp } from 'lucide-react';
import { MetricTile, SimpleCard } from '../../../../components/SharedComponents';

const OverviewSection = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full bg-gray-50/50 p-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricTile label="Avg Yield" value="6.4" unit="MT/Ha" color="bg-yellow-500" />
        <MetricTile label="Moisture Level" value="14.2" unit="%" color="bg-yellow-500" />
        <MetricTile label="Total Harvest" value="842" unit="MT" color="bg-yellow-500" />
        <MetricTile label="Compliance" value="99" unit="%" color="bg-green-600" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <SimpleCard title="Silo Monitoring" icon={<Zap size={20} />}>
            <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-white">
               <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.2em] mb-4">Storage Capacity Feed</p>
               <div className="flex justify-center items-center gap-6">
                  <div className="flex flex-col items-center">
                     <div className="text-4xl font-black text-yellow-600">82%</div>
                     <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Silo A</div>
                  </div>
                  <div className="w-px h-10 bg-gray-100"></div>
                  <div className="flex flex-col items-center">
                     <div className="text-4xl font-black text-yellow-600">45%</div>
                     <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Silo B</div>
                  </div>
               </div>
            </div>
         </SimpleCard>
         <SimpleCard title="Market Forecast" icon={<TrendingUp size={20} />}>
            <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-white">
               <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.2em] mb-4">Regional Price Analysis</p>
               <div className="text-3xl font-black text-green-600 tracking-tighter">+$12.40 <span className="text-sm font-bold text-gray-300">/ MT</span></div>
               <div className="text-[11px] font-bold text-green-700 uppercase tracking-widest mt-2">Upward Trend Forecasted</div>
            </div>
         </SimpleCard>
      </div>
    </div>
  );
};

export default OverviewSection;
