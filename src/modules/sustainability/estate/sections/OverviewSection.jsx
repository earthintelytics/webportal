// UNUSED (2026-09-29): not imported anywhere in the running app. Kept on purpose, not deleted — see docs/UNUSED_CODE.md in the root repo before reusing or removing.
import React from 'react';
import { Globe, BarChart4 } from 'lucide-react';
import { MetricTile, SimpleCard, GeospatialPreview } from '../../../../components/SharedComponents';

const OverviewSection = ({ carbonData }) => {
  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 overflow-y-auto h-full bg-gray-50/50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <MetricTile label="Estate Carbon Stock" value="1.2M" unit="tCO2e" color="bg-emerald-600" />
         <MetricTile label="Net Zero Progress" value="64" unit="%" color="bg-emerald-600" />
         <MetricTile label="Verification Grade" value="A" unit="GRADE" color="bg-emerald-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <SimpleCard title="Estate Biomass Preview" icon={<Globe size={20} />}>
            <div className="h-[380px] rounded-2xl overflow-hidden border border-gray-100">
               <GeospatialPreview title="Carbon Density Layer" points={[]} full={true} />
            </div>
         </SimpleCard>
         <SimpleCard title="Temporal Sequestration Trend" icon={<BarChart4 size={20} />}>
            <div className="p-10 text-center bg-white rounded-3xl border border-gray-100 shadow-sm h-full flex flex-col items-center justify-center">
               <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.3em]">Estate Sequestration Charting</p>
               <div className="text-2xl font-black text-emerald-600 mt-4">+8.2% vs L.Y.</div>
            </div>
         </SimpleCard>
      </div>
    </div>
  );
};

export default OverviewSection;
