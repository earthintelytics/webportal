// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React from 'react';
import { Layers, X, Satellite, Map as MapIcon, Activity, CheckCircle2 } from 'lucide-react';
import { GeospatialPreview } from '../../../components/SharedComponents';

const GeospatialSection = ({ activeLayer, setActiveLayer }) => {
  return (
    <div className="flex-1 flex overflow-hidden animate-in fade-in duration-500">
      <div className="flex-1 relative">
        <GeospatialPreview title="Smallholder Spatial Registry" points={[{ x: '35%', y: '45%', color: '#16A34A', label: 'Cluster Alpha' }]} full={true} />
        <div className="absolute top-8 right-8 bottom-8 w-72 z-[1000] flex flex-col gap-6">
           <div className="bg-white/90 backdrop-blur-md border border-white shadow-2xl rounded-[2rem] flex flex-col overflow-hidden">
              <div className="p-6 flex items-center justify-between border-b border-gray-100 bg-white/50">
                 <div className="flex items-center gap-3"><Layers size={18} className="text-emerald-600" /><span className="text-[11px] font-bold uppercase tracking-widest">Map Layers</span></div>
                 <button className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
              </div>
              <div className="p-4 space-y-1">
                 {[
                   { id: 'satellite', label: 'Satellite Fusion', icon: <Satellite size={16}/> },
                   { id: 'plots', label: 'Plot Boundaries', icon: <MapIcon size={16}/> },
                   { id: 'health', label: 'Vegetation Health', icon: <Activity size={16}/> },
                 ].map(layer => (
                   <button 
                     key={layer.id} 
                     onClick={() => setActiveLayer(layer.id)}
                     className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                       activeLayer === layer.id ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'bg-transparent text-gray-400 hover:bg-gray-50'
                     }`}
                   >
                      <div className="flex items-center gap-3">
                         {layer.icon}
                         <span className="text-[11px] font-bold uppercase tracking-widest">{layer.label}</span>
                      </div>
                      {activeLayer === layer.id && <CheckCircle2 size={14} className="text-emerald-600" />}
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GeospatialSection;
