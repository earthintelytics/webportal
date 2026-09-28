import React from 'react';
import { Layers, Satellite, Globe, Leaf, Trees, Zap, CheckCircle2 } from 'lucide-react';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import { SimpleCard } from '../../../components/SharedComponents';

const GeospatialSection = ({ activeLayer, setActiveLayer }) => {
  return (
    <div className="flex-1 relative flex overflow-hidden animate-in fade-in duration-500 h-full">
       <div className="flex-1 bg-gray-200 relative">
          <MapContainer center={[6.5244, 3.3792]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
             <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
             <ZoomControl position="bottomright" />
          </MapContainer>
          
          <div className="absolute top-8 left-8 right-8 z-[1000] flex justify-between pointer-events-none">
             <div className="pointer-events-auto flex gap-4">
                <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-white shadow-xl flex items-center gap-6">
                   <Satellite size={18} className="text-emerald-600" />
                   <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Active Layer</div>
                      <div className="text-[12px] font-black text-gray-900 leading-none">{activeLayer}</div>
                   </div>
                </div>
             </div>
          </div>

          <div className="absolute top-28 left-8 z-[1000] w-72 pointer-events-auto">
             <SimpleCard title="Map Selection" icon={<Layers size={18} />}>
                <div className="space-y-1.5">
                   {[
                     { id: 'Satellite', label: 'Optical Fusion', icon: <Globe size={14}/>, color: 'bg-gray-500' },
                     { id: 'Carbon Density', label: 'Carbon Heatmap', icon: <Leaf size={14}/>, color: 'bg-emerald-500' },
                     { id: 'Forestry Mask', label: 'HCS Forest Mask', icon: <Trees size={14}/>, color: 'bg-green-600' },
                     { id: 'Degradation', label: 'Forest Degradation', icon: <Zap size={14}/>, color: 'bg-orange-500' },
                   ].map(layer => (
                     <button 
                       key={layer.id} 
                       onClick={() => setActiveLayer(layer.id)}
                       className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                         activeLayer === layer.id ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm' : 'bg-white border-transparent text-gray-400 hover:bg-gray-50'
                       }`}
                     >
                        <div className="flex items-center gap-3">
                           <div className={`w-2 h-2 rounded-full ${layer.color}`}></div>
                           <span className="text-[12px] font-bold">{layer.label}</span>
                        </div>
                        {activeLayer === layer.id && <CheckCircle2 size={14} className="text-emerald-600" />}
                     </button>
                   ))}
                </div>
             </SimpleCard>
          </div>
       </div>
    </div>
  );
};

export default GeospatialSection;
