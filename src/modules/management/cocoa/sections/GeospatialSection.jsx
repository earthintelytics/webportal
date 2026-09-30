// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React from 'react';
import { Layers, Satellite, Map as MapIcon, Activity, CheckCircle2 } from 'lucide-react';
import { GeospatialPreview, SimpleCard } from '../../../../components/SharedComponents';

const GeospatialSection = ({ activeLayer, setActiveLayer }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-220px)] animate-in fade-in slide-in-from-bottom-4 bg-gray-50/50 p-10">
       <div className="lg:w-3/4 h-full relative rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
          <GeospatialPreview title="Cocoa Estate Spatial Intel" points={[{ x: '35%', y: '45%', color: '#92400E', label: 'Active Block' }]} full={true} />
       </div>
       <div className="lg:w-1/4 flex flex-col gap-8 overflow-y-auto">
          <SimpleCard title="Map Layers" icon={<Layers size={20} />}>
             <div className="space-y-3">
                {[
                  { id: 'satellite', label: 'Satellite View', icon: <Satellite size={16}/> },
                  { id: 'plots', label: 'Cocoa Blocks', icon: <MapIcon size={16}/> },
                  { id: 'health', label: 'Vegetation Health', icon: <Activity size={16}/> },
                ].map(layer => (
                  <button 
                    key={layer.id} 
                    onClick={() => setActiveLayer(layer.id)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                      activeLayer === layer.id ? 'bg-amber-900 border-amber-900 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                     <div className="flex items-center gap-4">
                        {layer.icon}
                        <span className="text-sm font-black uppercase tracking-tight">{layer.label}</span>
                     </div>
                     {activeLayer === layer.id && <CheckCircle2 size={16} className="text-white/80" />}
                  </button>
                ))}
             </div>
          </SimpleCard>
       </div>
    </div>
  );
};

export default GeospatialSection;
