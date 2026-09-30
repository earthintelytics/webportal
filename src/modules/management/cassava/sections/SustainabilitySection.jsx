// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React from 'react';
import { Leaf, Trees, Activity, CheckCircle2, Globe, BarChart4 } from 'lucide-react';
import { MetricTile, SimpleCard, GeospatialPreview, WorkerActivityTable } from '../../../../components/SharedComponents';

const SustainabilitySection = () => {
  return (
    <div className="p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full bg-gray-50/50">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricTile label="Soil Health" value="A-" unit="INDEX" color="bg-lime-600" icon={<Leaf size={24} />} />
        <MetricTile label="Water Usage" value="Low" unit="INTENSITY" color="bg-lime-600" icon={<Activity size={24} />} />
        <MetricTile label="Land Quality" value="92" unit="%" color="bg-lime-600" icon={<Trees size={24} />} />
        <MetricTile label="Compliance" value="100" unit="%" color="bg-emerald-500" icon={<CheckCircle2 size={24} />} />
      </div>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3 space-y-8">
           <SimpleCard title="Land Degradation Monitor" icon={<Globe size={20} />}>
              <div className="h-[400px] relative rounded-2xl overflow-hidden border border-gray-100">
                 <GeospatialPreview title="Cassava Land Layer" points={[]} full={true} />
              </div>
           </SimpleCard>
        </div>
        <div className="lg:w-1/3 space-y-8">
           <SimpleCard title="Regenerative Index" icon={<BarChart4 size={20} />}>
              <div className="p-10 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                 <div className="text-5xl font-black text-lime-600 mb-2">94.2<span className="text-xl">%</span></div>
                 <div className="text-[11px] font-bold text-lime-950 uppercase tracking-widest">Adoption Rate</div>
              </div>
           </SimpleCard>
        </div>
      </div>
    </div>
  );
};

export default SustainabilitySection;
