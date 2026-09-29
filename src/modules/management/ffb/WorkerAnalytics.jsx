import React from 'react';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Clock, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';

const StatCard = ({ label, value, subValue, delta, deltaType, icon }) => (
  <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{label}</div>
      <div className="text-gray-300 dark:text-white/10">{icon}</div>
    </div>
    <div className="text-3xl font-black tracking-tighter mb-1">{value}</div>
    <div className="flex items-center gap-2">
      <span className={`text-[11px] font-black ${deltaType === 'up' ? 'text-green-600' : 'text-red-600'}`}>
        {delta}
      </span>
      <span className="text-[11px] font-bold text-gray-400">{subValue}</span>
    </div>
  </div>
);

const WorkerAnalytics = () => {
  const topWorkers = [
    { name: 'Adamu Obi', id: 'W-042', bunches: 1420, efficiency: 98, rank: 1, avatar: 'AO' },
    { name: 'Emeka Musa', id: 'W-118', bunches: 1385, efficiency: 95, rank: 2, avatar: 'EM' },
    { name: 'Chisom Kalu', id: 'W-071', bunches: 1240, efficiency: 92, rank: 3, avatar: 'CK' },
  ];

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">Worker Analytics</h1>
          <p className="text-[13px] text-gray-500 mt-1 font-medium">Performance monitoring, attendance trends, and productivity insights</p>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white dark:bg-white/5 border border-black/5 px-5 py-2.5 rounded-xl text-[12px] font-bold shadow-sm hover:bg-gray-50 transition-all">
             <Filter size={16} /> Filters
          </button>
          <button className="flex items-center gap-2 bg-[#1A7A4A] text-white px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest shadow-lg hover:bg-[#145C37] transition-all active:scale-95">
             <Award size={16} /> Top Performers
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Workforce" value="1,247" subValue="Across all estates" delta="↑ 2.4%" deltaType="up" icon={<Users size={20}/>} />
        <StatCard label="Avg. Daily Attendance" value="88.6%" subValue="Last 30 days" delta="↓ 1.2%" deltaType="down" icon={<UserCheck size={20}/>} />
        <StatCard label="Productivity Rate" value="1.84t" subValue="Per worker/day" delta="↑ 5.8%" deltaType="up" icon={<TrendingUp size={20}/>} />
        <StatCard label="Anomaly Flags" value="12" subValue="Requiring review" delta="↑ 4" deltaType="down" icon={<ShieldAlert size={20}/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black tracking-tight">Attendance Trend</h3>
              <div className="flex gap-2">
                 <button className="px-3 py-1 bg-gray-100 dark:bg-white/10 rounded-lg text-[11px] font-bold">Week</button>
                 <button className="px-3 py-1 text-[11px] font-bold text-gray-400">Month</button>
                 <button className="px-3 py-1 text-[11px] font-bold text-gray-400">Year</button>
              </div>
           </div>
           
           <div className="h-[300px] relative">
              <div className="absolute inset-0 flex items-end justify-between px-10">
                 {[82, 85, 88, 86, 91, 89, 88].map((v, i) => (
                   <div key={i} className="flex flex-col items-center gap-4 group">
                      <div className="w-10 bg-[#1A7A4A]/20 rounded-xl relative overflow-hidden transition-all duration-500 hover:bg-[#1A7A4A]/30" style={{ height: '250px' }}>
                         <div className="absolute bottom-0 left-0 right-0 bg-[#1A7A4A] transition-all duration-1000 group-hover:bg-[#145C37] rounded-t-lg" style={{ height: `${v}%` }}></div>
                         <div className="absolute top-2 left-0 right-0 text-center text-[11px] font-black text-[#1A7A4A] opacity-0 group-hover:opacity-100 transition-opacity">{v}%</div>
                      </div>
                      <span className="text-[11px] font-bold text-gray-400">Mon, Tue, Wed, Thu, Fri, Sat, Sun'.split(', ')[i]</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-sm">
           <h3 className="text-lg font-black tracking-tight mb-8">Top Performers</h3>
           <div className="space-y-6">
              {topWorkers.map((worker, i) => (
                 <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-black/5 hover:border-[#1A7A4A]/30 transition-all cursor-pointer group">
                    <div className="relative">
                       <div className="w-12 h-12 rounded-xl bg-[#1A7A4A]/10 flex items-center justify-center font-black text-[#1A7A4A] group-hover:scale-110 transition-transform">
                          {worker.avatar}
                       </div>
                       <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#D4A017] text-white rounded-full flex items-center justify-center text-[11px] font-black border-2 border-white shadow-sm">
                          {worker.rank}
                       </div>
                    </div>
                    <div className="flex-1">
                       <div className="text-[14px] font-black tracking-tight">{worker.name}</div>
                       <div className="text-[11px] text-gray-500 font-bold">{worker.id} · {worker.bunches} bunches</div>
                    </div>
                    <div className="text-right">
                       <div className="text-[14px] font-black text-[#1A7A4A]">{worker.efficiency}%</div>
                       <div className="text-[11px] text-gray-400 font-bold uppercase">Efficiency</div>
                    </div>
                 </div>
              ))}
           </div>
           
           <div className="mt-8 pt-8 border-t border-black/5 space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg"><UserX size={16}/></div>
                    <div>
                       <div className="text-[12px] font-black text-red-700">8 Workers Absent</div>
                       <div className="text-[11px] text-red-600 font-bold">Unexcused today</div>
                    </div>
                 </div>
                 <button className="p-2 hover:bg-red-200 rounded-lg transition-colors"><ArrowUpRight size={16} className="text-red-700"/></button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerAnalytics;
