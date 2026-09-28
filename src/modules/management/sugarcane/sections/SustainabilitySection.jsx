import React from 'react';
import { Globe, BarChart4, Wind } from 'lucide-react';
import { MetricTile, SimpleCard, GeospatialPreview, WorkerActivityTable } from '../../../../components/SharedComponents';

const SustainabilitySection = ({ carbonData, carbonColumns }) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full bg-gray-50/50 p-10">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <MetricTile label="Cane Carbon Stock" value="155k" unit="tCO2e" color="bg-green-600" />
          <MetricTile label="Soil Organic Carbon" value="4.8" unit="%" color="bg-green-600" />
          <MetricTile label="Bagasse Energy" value="2.4" unit="MW" color="bg-green-600" />
          <MetricTile label="Bonsucro Status" value="100" unit="%" color="bg-emerald-500" />
       </div>
       <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3 space-y-8">
             <SimpleCard title="Biomass Intelligence" icon={<Globe size={20} />}>
                <div className="h-[400px] relative rounded-2xl overflow-hidden border border-gray-100">
                   <GeospatialPreview title="Cane Biomass Intel" points={[]} full={true} />
                </div>
             </SimpleCard>
             <SimpleCard title="Carbon Verification Ledger" icon={<BarChart4 size={20} />}>
                <WorkerActivityTable data={carbonData} columns={carbonColumns} />
             </SimpleCard>
          </div>
          <div className="lg:w-1/3 space-y-8">
             <SimpleCard title="Energy Recovery" icon={<Wind size={20} />}>
                <div className="p-10 text-center bg-green-50/30 rounded-3xl border border-green-100 shadow-sm">
                   <div className="text-6xl font-black text-green-600 mb-2 tracking-tighter">88.4<span className="text-xl">%</span></div>
                   <div className="text-[11px] font-black text-green-700 uppercase tracking-widest leading-loose">Bagasse Co-generation Efficiency</div>
                </div>
             </SimpleCard>
          </div>
       </div>
    </div>
  );
};

export default SustainabilitySection;
