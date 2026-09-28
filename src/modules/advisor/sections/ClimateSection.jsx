import React from 'react';
import { Calendar, Trees, Info, Activity } from 'lucide-react';
import { SimpleCard } from '../../../components/SharedComponents';

const ClimateSection = () => {
  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 overflow-y-auto h-full">
       <div className="max-w-4xl">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Long-term Climate Pattern</h2>
          <p className="text-[15px] text-gray-400 font-medium mt-2 leading-relaxed">
             Regional growing cycle analysis based on 20-year historical data. Predictable patterns of wet spring and dry summer facilitate strategic cultivar selection.
          </p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SimpleCard title="Seasonal Rainfall Model" icon={<Calendar size={20} />}>
             <div className="p-8 text-center bg-blue-50/50 rounded-3xl border border-blue-100">
                <div className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-4">Current Cycle Status</div>
                <div className="text-4xl font-black text-blue-900 italic tracking-tighter">Wet Growing Season</div>
                <p className="text-[11px] text-blue-600 font-bold mt-2 uppercase tracking-widest leading-none">Optimal for pod development</p>
             </div>
          </SimpleCard>
          <SimpleCard title="Cultivar Recommendation" icon={<Trees size={20} />}>
             <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                   <div className="text-[11px] font-black text-emerald-600 uppercase mb-1">Recommended</div>
                   <div className="text-lg font-black text-gray-900">Hybrid Series-4 Cocoa</div>
                   <p className="text-[11px] text-gray-400 font-bold uppercase mt-1">High drought tolerance · 12-month cycle</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <div className="text-[11px] font-black text-gray-400 uppercase mb-1">Alternative</div>
                   <div className="text-lg font-black text-gray-600">Amelonado Selection</div>
                </div>
             </div>
          </SimpleCard>
          <SimpleCard title="Socioeconomic Constraints" icon={<Info size={20} />}>
             <div className="text-[12px] font-bold text-gray-400 leading-relaxed italic uppercase">
                Local labor availability peaks in dry season. Logistics costs increase by 14% during wet cycle peak (JUL-AUG).
             </div>
          </SimpleCard>
       </div>

       <SimpleCard title="Historical Vegetation Health (VHI)" icon={<Activity size={20} />}>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-50 rounded-[2.5rem]">
             <p className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em]">Historical VHI Composite Chart (2004-2026)</p>
          </div>
       </SimpleCard>
    </div>
  );
};

export default ClimateSection;
