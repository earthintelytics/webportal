// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React from 'react';
import { Satellite, Map as MapIcon, Zap, CheckCircle2, Layers } from 'lucide-react';
import { SimpleCard, GeospatialPreview } from '../../../../components/SharedComponents';

const GeospatialSection = ({ activeLayer, setActiveLayer }) => {
   return (
      <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-220px)] animate-in fade-in slide-in-from-bottom-4">
         <div className="lg:w-3/4 h-full relative">
            <GeospatialPreview title="Oil Palm Geospatial Intel" points={[{ x: '40%', y: '50%', color: '#16A34A', label: 'High Density Block' }]} full={true} />
         </div>
         <div className="lg:w-1/4 flex flex-col gap-6 overflow-y-auto">
            <SimpleCard title="Layer Selector" icon={<Layers size={18} />}>
               <div className="space-y-2">
                  {[
                     { id: 'satellite', label: 'Satellite View', icon: <Satellite size={14} /> },
                     { id: 'plots', label: 'Block Map', icon: <MapIcon size={14} /> },
                     { id: 'maturity', label: 'Bunch Maturity', icon: <Zap size={14} /> },
                  ].map(layer => (
                     <button
                        key={layer.id}
                        onClick={() => setActiveLayer(layer.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${activeLayer === layer.id ? 'bg-green-50 border-green-200 text-green-900' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                           }`}
                     >
                        <div className="flex items-center gap-3">
                           {layer.icon}
                           <span className="text-[12px] font-bold">{layer.label}</span>
                        </div>
                        {activeLayer === layer.id && <CheckCircle2 size={14} className="text-green-600" />}
                     </button>
                  ))}
               </div>
            </SimpleCard>
         </div>
      </div>
   );
};

export default GeospatialSection;
