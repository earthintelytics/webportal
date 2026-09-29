// UNUSED (2026-09-29): replaced by modules/services/ServicePortal.jsx (same layout as organisation monitoring). Kept on purpose, not deleted — see docs/UNUSED_CODE.md in the root repo before reusing or removing.
import React from 'react';
import { Satellite, Map as MapIcon, AlertTriangle } from 'lucide-react';
import { SimpleCard, WorkerActivityTable, GeospatialPreview } from '../../../components/SharedComponents';

const SatelliteSection = ({ rsMetrics, columns }) => {
  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 overflow-y-auto h-full">
       <div className="max-w-4xl">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Satellite Analytics Node</h2>
          <p className="text-[15px] text-gray-400 font-medium mt-2">Advanced remote sensing indices for precise canopy stress and water deficit tracking.</p>
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             <SimpleCard title="Remote Sensing Analytics (Kofi Asare et al.)" icon={<Satellite size={20} />}>
                <WorkerActivityTable data={rsMetrics} columns={columns} />
             </SimpleCard>
          </div>
          <div className="space-y-6">
             <SimpleCard title="Stress Thresholds" icon={<AlertTriangle size={20} />}>
                <div className="space-y-4">
                   {[
                     { l: 'Severe Canopy Stress', v: 'NDRE < 0.15', c: 'text-red-500' },
                     { l: 'Water Deficit', v: 'LSWI < 0.20', c: 'text-blue-500' },
                     { l: 'Combined (VHI)', v: 'VHI < 35', c: 'text-orange-500' },
                   ].map(item => (
                     <div key={item.l} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                        <span className="text-[11px] font-black text-gray-900 uppercase">{item.l}</span>
                        <span className={`text-[12px] font-black ${item.c}`}>{item.v}</span>
                     </div>
                   ))}
                </div>
             </SimpleCard>
             <SimpleCard title="Yield Prediction Map" icon={<MapIcon size={20} />}>
                <div className="h-48 rounded-2xl overflow-hidden relative grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-crosshair">
                   <GeospatialPreview title="Bags/KG per Ha" points={[]} full={true} />
                </div>
             </SimpleCard>
          </div>
       </div>
    </div>
  );
};

export default SatelliteSection;
