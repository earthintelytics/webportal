import React from 'react';
import { Search, Layers, ChevronRight, CheckCircle2, X, TrendingUp, Zap } from 'lucide-react';
import { MapContainer, TileLayer, ZoomControl, Polygon } from 'react-leaflet';
import { Line } from 'react-chartjs-2';

const GeospatialSection = ({ layers, setLayers, plots, selectedPlot, setSelectedPlot, showLayerList, setShowLayerList, config }) => {
  return (
    <div className="flex-1 flex flex-col relative animate-in fade-in duration-500 h-full">
       <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-[1010]">
          <div className="flex items-center gap-6 flex-1 max-w-4xl">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input type="text" placeholder="Locate Cluster..." className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-12 pr-4 text-[12px] font-bold outline-none focus:border-emerald-500 transition-all" />
             </div>
          </div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 italic">Sentinel-2 Multispectral Standard</div>
       </div>

       <div className="flex-1 bg-gray-200 relative overflow-hidden">
          <MapContainer center={[6.5244, 3.3792]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
             {layers.filter(l => l.active).map(layer => (
                <TileLayer key={layer.id} url={layer.url || "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"} opacity={layer.opacity / 100} />
             ))}
             {plots.map(plot => (
                <Polygon key={plot.id} positions={[[6.5244, 3.3792], [6.5264, 3.3792], [6.5264, 3.3812], [6.5244, 3.3812]]} pathOptions={{ color: '#10b981', fillOpacity: 0.2 }} eventHandlers={{ click: () => setSelectedPlot(plot) }} />
             ))}
             <ZoomControl position="bottomleft" />
          </MapContainer>

          <div className={`absolute top-4 right-4 z-[1000] flex flex-col transition-all duration-300 pointer-events-none ${showLayerList ? 'w-64' : 'w-12'}`}>
             <div className="bg-gray-900 text-white shadow-2xl rounded-none flex flex-col pointer-events-auto overflow-hidden border border-gray-800">
                <div className="p-3 flex items-center justify-between border-b border-gray-800 bg-black/50">
                   <div className={`flex items-center gap-2 ${!showLayerList && 'hidden'}`}>
                      <Layers size={14} className="text-emerald-500" />
                      <span className="text-[11px] font-bold uppercase tracking-widest leading-none text-white">GIS Intelligence</span>
                   </div>
                   <button onClick={() => setShowLayerList(!showLayerList)} className={`p-1.5 hover:bg-gray-800 rounded-none transition-all ${!showLayerList && 'w-full flex justify-center'}`}>
                      {showLayerList ? <ChevronRight size={14} /> : <Layers size={20} className="text-emerald-500" />}
                   </button>
                </div>
                {showLayerList && (
                   <div className="flex-1 overflow-y-auto p-4 space-y-5 animate-in fade-in duration-300">
                      {layers.map(layer => (
                         <div key={layer.id} className="space-y-2">
                            <button onClick={() => setLayers(layers.map(l => l.id === layer.id ? { ...l, active: !l.active } : l))} className="flex items-center gap-2 group text-left w-full">
                               <div className={`w-3 h-3 rounded-none border transition-all shrink-0 flex items-center justify-center ${layer.active ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'}`}>{layer.active && <CheckCircle2 size={8} className="text-black" />}</div>
                               <span className={`text-[11px] font-bold uppercase tracking-widest leading-tight ${layer.active ? 'text-emerald-400' : 'text-gray-500'}`}>{layer.label}</span>
                            </button>
                            {layer.active && (
                               <div className="pl-5 space-y-2">
                                  <div className="space-y-1">
                                     <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 uppercase tracking-widest"><span>{layer.legend}</span><span>{layer.opacity}%</span></div>
                                     <div className={`h-1 w-full rounded-none bg-gradient-to-r ${layer.color}`}></div>
                                  </div>
                               </div>
                            )}
                         </div>
                      ))}
                   </div>
                )}
             </div>

             {selectedPlot && showLayerList && (
                <div className="mt-4 bg-gray-900 border border-gray-800 rounded-none p-5 shadow-2xl animate-in slide-in-from-right-10 duration-500 pointer-events-auto flex flex-col gap-4">
                   <div className="flex justify-between items-start">
                      <div>
                         <div className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.2em] mb-1 leading-none italic">{config.drillDownType}</div>
                         <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none text-white">{selectedPlot.id}</h3>
                      </div>
                      <button onClick={() => setSelectedPlot(null)} className="p-1.5 hover:bg-gray-800 rounded-none transition-all text-gray-500"><X size={16} /></button>
                   </div>
                   <div className="bg-black/50 p-4 rounded-none border border-gray-800">
                      <div className="text-[11px] font-bold text-gray-500 uppercase mb-2 italic">Summary</div>
                      <p className="text-[11px] font-bold italic leading-tight text-emerald-100">"{selectedPlot.layman}"</p>
                   </div>
                   <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                         <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest leading-none italic">Trend</span>
                         <TrendingUp size={10} className="text-emerald-500" />
                      </div>
                      <div className="h-24 bg-black rounded-none p-2 border border-gray-800">
                         <Line
                            data={{
                               labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
                               datasets: [{ fill: true, data: selectedPlot.history, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.4, pointRadius: 0 }]
                            }}
                            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { display: false }, x: { grid: { display: false }, ticks: { font: { size: 6 } } } } }}
                         />
                      </div>
                   </div>
                   <div className="flex items-center gap-2 pt-3 border-t border-gray-800 space-y-2">
                      <Zap size={12} className="text-emerald-500" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300 italic leading-tight">{selectedPlot.advice}</span>
                   </div>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default GeospatialSection;
