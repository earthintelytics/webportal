// UNUSED (2026-09-29): not imported anywhere in the running app. Kept on purpose, not deleted — see docs/UNUSED_CODE.md in the root repo before reusing or removing.
import React from 'react';
import { Globe, BarChart4 } from 'lucide-react';
import { MetricTile, SimpleCard, GeospatialPreview } from '../../../../components/SharedComponents';

const OverviewSection = () => {
  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 overflow-y-auto h-full bg-gray-50/50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <MetricTile label="Total Forest Carbon" value="4.2M" unit="tCO2e" color="bg-emerald-600" />
         <MetricTile label="Conservation Rate" value="99.2" unit="%" color="bg-emerald-600" />
         <MetricTile label="Biodiversity Index" value="8.4" unit="SCORE" color="bg-emerald-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <SimpleCard title="Canopy Density Matrix" icon={<Globe size={20} />}>
            <div className="h-[380px] rounded-2xl overflow-hidden border border-gray-100">
               <GeospatialPreview title="Forestry Mask Layer" points={[]} full={true} />
            </div>
         </SimpleCard>
         <SimpleCard title="Carbon Accumulation Trend" icon={<BarChart4 size={20} />}>
            <div className="p-10 text-center bg-white rounded-3xl border border-gray-100 shadow-sm h-full flex flex-col items-center justify-center">
               <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.3em]">Forest Sequestration Charting</p>
               <div className="text-2xl font-black text-emerald-600 mt-4">+2.4% vs L.Y.</div>
            </div>
         </SimpleCard>
      </div>
    </div>
  );
};

export default OverviewSection;
