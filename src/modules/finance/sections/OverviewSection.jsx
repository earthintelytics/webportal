import React from 'react';
import { Landmark, UserCheck, ShieldCheck, History, TrendingUp, PieChart, Wallet } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { MetricTile, SimpleCard } from '../../../components/SharedComponents';

const OverviewSection = ({ stats, barData, doughnutData }) => {
  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 overflow-y-auto h-full bg-gray-50/50">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         {stats.map((s, i) => (
            <MetricTile key={i} label={s.label} value={s.value} unit={s.unit} color={s.color} icon={s.icon} />
         ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-10">
            <SimpleCard title="Revenue Stream Optimization" icon={<TrendingUp size={24} />}>
               <div className="h-[400px] mt-10">
                  <Bar 
                    data={barData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: { 
                        y: { display: false },
                        x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 } } }
                      }
                    }} 
                  />
               </div>
            </SimpleCard>
         </div>
         <div className="space-y-10">
            <div className="bg-emerald-600 text-white p-10 rounded-[3rem] shadow-xl flex flex-col group relative overflow-hidden">
               <ShieldCheck className="absolute -right-10 -bottom-10 text-white opacity-10" size={200} />
               <div className="flex justify-between items-start mb-12">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur shadow-inner"><Wallet size={32} /></div>
                  <div className="text-[11px] font-bold uppercase tracking-widest italic bg-white/20 px-5 py-2 rounded-full">Reserve Node</div>
               </div>
               <div className="text-[11px] font-bold uppercase tracking-widest opacity-60 mb-2">Available Reserve Balance</div>
               <div className="text-5xl font-black italic tracking-tighter mb-12 leading-none">₦142M</div>
               <button className="w-full bg-white text-emerald-600 font-bold uppercase tracking-widest py-5 rounded-2xl text-[12px] shadow-2xl hover:bg-emerald-50 transition-all">Distribute Funds</button>
            </div>
            <SimpleCard title="Expense Allocation" icon={<PieChart size={24} />}>
               <div className="h-[250px] relative mt-10">
                  <Doughnut 
                    data={doughnutData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      cutout: '80%'
                    }} 
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <div className="text-4xl font-black text-gray-900 tracking-tighter">100%</div>
                     <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Audited</div>
                  </div>
               </div>
            </SimpleCard>
         </div>
      </div>
    </div>
  );
};

export default OverviewSection;
