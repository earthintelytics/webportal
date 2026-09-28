import React from 'react';
import { Sun, CloudRain, AlertTriangle, Satellite, Map as MapIcon } from 'lucide-react';
import { SimpleCard, WorkerActivityTable, GeospatialPreview } from '../../../components/SharedComponents';

const WeatherSection = ({ weatherAdvice, rsMetrics, columns }) => {
  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 overflow-y-auto h-full">
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
         <div className="max-w-2xl">
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Weather Decision Engine</h2>
            <p className="text-[15px] text-gray-400 font-medium mt-2">Real-time adaptive alerts to protect crops and optimize field operations.</p>
         </div>
         <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-8">
            <div className="flex items-center gap-3">
               <Sun className="text-orange-500" size={24} />
               <div>
                  <div className="text-[11px] font-black text-gray-400 uppercase leading-none">Local Temp</div>
                  <div className="text-xl font-black text-gray-900 leading-none mt-1">31°C</div>
               </div>
            </div>
            <div className="w-px h-8 bg-gray-100"></div>
            <div className="flex items-center gap-3">
               <CloudRain className="text-blue-500" size={24} />
               <div>
                  <div className="text-[11px] font-black text-gray-400 uppercase leading-none">Precip. Prob</div>
                  <div className="text-xl font-black text-gray-900 leading-none mt-1">12%</div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {weatherAdvice.map((advice, i) => (
           <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                 {React.cloneElement(advice.icon, { size: 80 })}
              </div>
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2.5 bg-gray-50 rounded-xl">
                    {React.cloneElement(advice.icon, { size: 18 })}
                 </div>
                 <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{advice.status}</div>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight leading-none">{advice.title}</h3>
              <p className="text-[13px] text-gray-500 font-medium leading-relaxed italic">{advice.detail}</p>
           </div>
         ))}
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

export default WeatherSection;
