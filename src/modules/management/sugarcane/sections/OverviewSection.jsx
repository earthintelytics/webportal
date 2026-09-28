import React from 'react';
import { Leaf, Scale } from 'lucide-react';
import { MetricTile, SimpleCard } from '../../../../components/SharedComponents';

const OverviewSection = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full bg-gray-50/50 p-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricTile label="Total Tonnage (Day)" value="428" unit="MT" color="bg-green-600" />
        <MetricTile label="Harvested Area" value="142" unit="HA" color="bg-green-600" />
        <MetricTile label="Avg Ratoon Age" value="2.4" unit="YRS" color="bg-green-600" />
        <MetricTile label="Logistics Health" value="94" unit="%" color="bg-emerald-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <SimpleCard title="Carbon Footprint" icon={<Leaf size={20} />}>
            <div className="p-10 bg-white rounded-3xl border border-gray-100 shadow-sm">
               <div className="text-5xl font-black text-green-600 mb-2 tracking-tighter">155,200 <span className="text-xl font-bold text-gray-300">tCO2e</span></div>
               <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Total Biomass Reservoir</div>
            </div>
         </SimpleCard>
         <SimpleCard title="Mill Gate Scale" icon={<Scale size={20} />}>
            <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/30">
               <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.2em] mb-4">Live Weighbridge Feed</p>
               <div className="flex justify-center items-center gap-6">
                  <div className="text-3xl font-black text-green-600">42.8 <span className="text-sm font-bold text-gray-300">MT</span></div>
                  <div className="w-px h-8 bg-gray-100"></div>
                  <div className="text-lg font-bold text-green-700">Truck #928</div>
               </div>
            </div>
         </SimpleCard>
      </div>
    </div>
  );
};

export default OverviewSection;
