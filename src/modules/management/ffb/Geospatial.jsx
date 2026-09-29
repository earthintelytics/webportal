import React, { useState } from 'react';
import { 
  Map as MapIcon, 
  Layers, 
  Maximize2, 
  Search, 
  Filter, 
  Navigation,
  Satellite,
  Thermometer,
  Droplets,
  Wind
} from 'lucide-react';

const Geospatial = () => {
  const [activeLayer, setActiveLayer] = useState('ndvi');

  const layers = [
    { id: 'ndvi', label: 'NDVI Vegetation', icon: <Satellite size={14}/> },
    { id: 'moisture', label: 'Soil Moisture', icon: <Droplets size={14}/> },
    { id: 'thermal', label: 'Thermal Index', icon: <Thermometer size={14}/> },
    { id: 'wind', label: 'Wind Analysis', icon: <Wind size={14}/> },
  ];

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">Geospatial Intelligence</h1>
          <p className="text-[13px] text-gray-500 mt-1 font-medium">Advanced GIS mapping and satellite analysis for precision agriculture</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-black/5 p-1 rounded-2xl shadow-sm">
          {layers.map(layer => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
                activeLayer === layer.id 
                  ? 'bg-[#1A7A4A] text-white shadow-lg' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {layer.icon}
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="relative h-[650px] bg-slate-900 rounded-[2.5rem] overflow-hidden border-8 border-white dark:border-white/5 shadow-2xl">
             {/* Map Placeholder with NDVI-like visual */}
             <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/7.342,3.891,14,0/1200x800?access_token=pk.eyJ1IjoiYW50aWdyYXZpdHkiLCJhIjoiY2xwYnhndG1nMG9nODJpcG1zYnN3bjZ0byJ9.5-6q-1N_2V_L9l-5_uV-lA')] bg-cover bg-center opacity-60"></div>
             
             {/* Heatmap overlay simulation */}
             <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 via-yellow-500/20 to-red-500/30 backdrop-blur-[1px]"></div>
             
             {/* UI Overlays */}
             <div className="absolute top-6 left-6 space-y-2">
                <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-xl flex flex-col gap-2">
                   <button className="p-3 bg-[#1A7A4A] text-white rounded-xl shadow-lg"><Layers size={20}/></button>
                   <button className="p-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"><Maximize2 size={20}/></button>
                   <button className="p-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"><Navigation size={20}/></button>
                </div>
             </div>

             <div className="absolute top-6 right-6">
                <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 shadow-xl flex items-center gap-4">
                   <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                      <span className="text-[11px] font-black uppercase tracking-wider">Live Tracking</span>
                   </div>
                   <div className="h-4 w-px bg-gray-200"></div>
                   <div className="text-[11px] font-black uppercase tracking-wider text-gray-500">47 Workers active</div>
                </div>
             </div>

             <div className="absolute bottom-8 right-8">
                <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md p-5 rounded-3xl border border-white/20 shadow-2xl w-64">
                   <div className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4">Legend: NDVI Index</div>
                   <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                         <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-green-700"></div> Very Healthy</span>
                         <span className="text-gray-400">0.8 - 1.0</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-bold">
                         <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-green-500"></div> Healthy</span>
                         <span className="text-gray-400">0.6 - 0.8</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-bold">
                         <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-yellow-500"></div> Moderate</span>
                         <span className="text-gray-400">0.4 - 0.6</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-bold">
                         <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-red-500"></div> Critical</span>
                         <span className="text-gray-400">0.0 - 0.4</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 mb-6 flex items-center gap-2">
                 <Search size={16} /> Block Explorer
              </h3>
              <div className="relative mb-6">
                 <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input type="text" placeholder="Search Plot or Block..." className="w-full bg-gray-50 dark:bg-black/20 border border-black/5 rounded-xl py-3 pl-11 pr-4 text-[12px] font-bold outline-none focus:ring-2 focus:ring-[#1A7A4A]/20" />
              </div>
              
              <div className="space-y-2">
                 {[
                   { id: 'F3', hectares: 284.2, health: 0.84, status: 'Healthy' },
                   { id: 'C3', hectares: 156.5, health: 0.72, status: 'Healthy' },
                   { id: 'D2', hectares: 210.8, health: 0.45, status: 'Watch', critical: true },
                   { id: 'A2', hectares: 312.0, health: 0.78, status: 'Healthy' },
                   { id: 'B1', hectares: 184.2, health: 0.38, status: 'Stress', critical: true },
                 ].map(block => (
                    <div key={block.id} className="p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-black/5 hover:border-[#1A7A4A]/30 transition-all cursor-pointer group">
                       <div className="flex justify-between items-start mb-2">
                          <div className="font-black text-lg group-hover:text-[#1A7A4A] transition-colors">{block.id}</div>
                          <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-full ${block.critical ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>{block.status}</span>
                       </div>
                       <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-2">
                          <span>{block.hectares} Hectares</span>
                          <span className={block.critical ? 'text-red-500' : 'text-[#1A7A4A]'}>NDVI {block.health}</span>
                       </div>
                       <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${block.critical ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${block.health * 100}%` }}></div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-[#1A7A4A] p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                 <Satellite size={80} />
              </div>
              <h3 className="text-lg font-black tracking-tight mb-2 relative z-10">Satellite Sync</h3>
              <p className="text-[12px] opacity-80 mb-6 font-medium relative z-10">Last pass: 2.5 hours ago. Sentinel-2 L2A processed successfully.</p>
              <button className="w-full bg-white text-[#1A7A4A] py-3 rounded-xl text-[12px] font-black uppercase tracking-widest shadow-lg hover:bg-gray-100 transition-all active:scale-95 relative z-10">
                 Request High-Res
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Geospatial;
