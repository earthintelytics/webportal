// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React from 'react';
import { Globe, BarChart4, Wind } from 'lucide-react';
import { MetricTile, SimpleCard, GeospatialPreview, WorkerActivityTable } from '../../../../components/SharedComponents';

const SustainabilitySection = ({ carbonData, carbonColumns }) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full bg-gray-50/50 p-10">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <MetricTile label="Estate Carbon" value="227k" unit="tCO2e" color="bg-cyan-600" />
          <MetricTile label="Regen Biomass" value="84" unit="kT" color="bg-cyan-600" />
          <MetricTile label="Carbon Intensity" value="0.12" unit="t/kg" color="bg-cyan-600" />
          <MetricTile label="Compliance" value="100" unit="%" color="bg-green-600" />
       </div>
       <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3 space-y-8">
             <SimpleCard title="Biomass Analysis" icon={<Globe size={20} />}>
                <div className="h-[400px] relative rounded-2xl overflow-hidden border border-gray-100">
                   <GeospatialPreview title="Rubber Estate Carbon Map" points={[]} full={true} />
                </div>
             </SimpleCard>
             <SimpleCard title="Carbon Settlement" icon={<BarChart4 size={20} />}>
                <WorkerActivityTable data={carbonData} columns={carbonColumns} />
             </SimpleCard>
          </div>
          <div className="lg:w-1/3 space-y-8">
             <SimpleCard title="Emission Efficiency" icon={<Wind size={20} />}>
                <div className="p-10 text-center bg-cyan-50/30 rounded-3xl border border-cyan-100 shadow-sm">
                   <div className="text-6xl font-black text-cyan-600 mb-2 tracking-tighter">94.8<span className="text-xl">%</span></div>
                   <div className="text-[11px] font-black text-cyan-700 uppercase tracking-widest leading-loose">Processing Plant Efficiency</div>
                </div>
             </SimpleCard>
          </div>
       </div>
    </div>
  );
};

export default SustainabilitySection;
