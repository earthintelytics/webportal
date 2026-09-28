import React from 'react';
import { Globe, BarChart4 } from 'lucide-react';
import { MetricTile, SimpleCard, GeospatialPreview } from '../../../components/SharedComponents';

const OverviewSection = () => {
  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 overflow-y-auto h-full bg-gray-50/50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <MetricTile label="Aggregate Carbon Stock" value="352k" unit="tCO2e" color="bg-emerald-600" />
         <MetricTile label="Net Zero Progress" value="72" unit="%" color="bg-emerald-600" />
         <MetricTile label="Verification Grade" value="A+" unit="GRADE" color="bg-emerald-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <SimpleCard title="Geospatial Biomass Preview" icon={<Globe size={20} />}>
            <div className="h-[380px] rounded-2xl overflow-hidden">
               <GeospatialPreview title="Carbon Density Layer" points={[]} full={true} />
            </div>
         </SimpleCard>
         <SimpleCard title="Temporal Sequestration Trend" icon={<BarChart4 size={20} />}>
            <div className="p-10 text-center border-2 border-dashed border-gray-50 rounded-[2.5rem] h-full flex flex-col items-center justify-center">
               <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.3em]">Carbon Sequestration Charting</p>
            </div>
         </SimpleCard>
      </div>
    </div>
  );
};

export default OverviewSection;
