// UNUSED (2026-09-29): not imported anywhere in the running app. Kept on purpose, not deleted — see docs/UNUSED_CODE.md in the root repo before reusing or removing.
import React from 'react';
import { Calendar, TrendingUp, Activity, Users, CheckCircle2 } from 'lucide-react';
import { SimpleCard } from '../../../../components/SharedComponents';
import { Line, Radar } from 'react-chartjs-2';

const OverviewSection = ({ dateRange, setDateRange, config }) => {
  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 overflow-y-auto h-full bg-gray-50/50">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><Calendar size={20} /></div>
            <div>
               <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none italic">Theme: {config.theme}</div>
               <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="text-lg font-black italic uppercase outline-none bg-transparent cursor-pointer mt-1">
                  <option>Current Season Analytics</option>
                  <option>Historical Time-Series</option>
               </select>
            </div>
         </div>
         <div className="flex gap-4">
            <button className="px-6 py-2.5 bg-gray-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-lg">Download Report</button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {config.kpis.map((kpi, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6 group hover:shadow-2xl transition-all">
               <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  {React.cloneElement(kpi.icon, { size: 24 })}
               </div>
               <div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1 italic">{kpi.label}</div>
                  <div className="flex items-baseline gap-1">
                     <span className="text-3xl font-black italic tracking-tighter uppercase">{kpi.value}</span>
                     <span className="text-[12px] font-bold text-gray-300">{kpi.unit}</span>
                  </div>
               </div>
            </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <SimpleCard title="Cluster Growth Trajectory" icon={<TrendingUp size={20} />}>
            <div className="h-[300px] mt-6">
               <Line data={{
                  labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
                  datasets: [
                     { label: 'Mean NDVI', data: [0.4, 0.45, 0.6, 0.74, 0.72, 0.68], borderColor: '#10b981', tension: 0.4, fill: true, backgroundColor: 'rgba(16, 185, 129, 0.05)' },
                     { label: 'Nutrient/Water Proxy', data: [0.35, 0.38, 0.42, 0.55, 0.52, 0.48], borderColor: '#3b82f6', tension: 0.4, borderDash: [5, 5] }
                  ]
               }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10, weight: 'bold' } } } } }} />
            </div>
         </SimpleCard>

         <SimpleCard title="Physiological Health Matrix" icon={<Activity size={20} />}>
            <div className="h-[300px] mt-6 flex items-center justify-center">
               <Radar
                  data={{
                     labels: ['NDVI', 'NDRE', 'LSWI', 'LST', 'VHI', 'EVI'],
                     datasets: [{
                        label: 'Active Clusters Mean',
                        data: [85, 74, 62, 45, 90, 80],
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderColor: '#10b981',
                        pointBackgroundColor: '#10b981',
                     }]
                  }}
                  options={{
                     scales: { r: { angleLines: { display: false }, suggestedMin: 0, suggestedMax: 100, ticks: { display: false } } },
                     plugins: { legend: { display: false } }
                  }}
               />
            </div>
         </SimpleCard>
      </div>
    </div>
  );
};

export default OverviewSection;
