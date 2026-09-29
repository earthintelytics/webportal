// UNUSED (2026-09-29): not imported anywhere in the running app. Kept on purpose, not deleted — see docs/UNUSED_CODE.md in the root repo before reusing or removing.
import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Users, 
  Satellite, 
  Factory, 
  CheckCircle2, 
  TrendingUp, 
  Weight, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const KPICard = ({ label, value, icon, delta, deltaType }) => (
  <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5">
    <div className="flex justify-between items-start mb-2">
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</div>
      <div className="text-gray-300 dark:text-white/10">{icon}</div>
    </div>
    <div className="text-2xl font-bold">{value}</div>
    {delta && (
      <div className={`text-[11px] font-medium mt-1 ${deltaType === 'up' ? 'text-green-600' : 'text-red-600'}`}>
        {delta}
      </div>
    )}
  </div>
);

const FFBCounter = () => {
  const [count, setCount] = useState(142);
  const kgPerBunch = 14.0;
  const [isTapping, setIsTapping] = useState(false);

  const handleTap = () => {
    setCount(prev => prev + 1);
    setIsTapping(true);
    setTimeout(() => setIsTapping(false), 100);
  };

  const logs = [
    { worker: 'Adamu O.', block: 'F3', bunches: 142, weight: '1,988 kg', estimate: '2,020 kg', variance: '-1.6%' },
    { worker: 'Emeka M.', block: 'C3', bunches: 118, weight: '1,652 kg', estimate: '1,640 kg', variance: '+0.7%' },
    { worker: 'Yusuf U.', block: 'A2', bunches: 94, weight: '1,316 kg', estimate: '1,340 kg', variance: '-1.8%' },
    { worker: 'Chisom K.', block: 'D2', bunches: 71, weight: '994 kg', estimate: '1,080 kg', variance: '-8.0%' },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total FFB Today" value="6.62t" icon={<Sprout size={18}/>} delta="↑ 12% vs avg" deltaType="up" />
        <KPICard label="Active Harvesters" value="18" icon={<Users size={18}/>} />
        <KPICard label="Satellite Estimate" value="6.88t" icon={<Satellite size={18}/>} delta="-3.8% variance" deltaType="up" />
        <KPICard label="Mill Received" value="6.50t" icon={<Factory size={18}/>} delta="-1.8% transit loss" deltaType="down" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
           <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
           
           <h3 className="text-sm font-bold text-[#1A7A4A] mb-8 flex items-center gap-2">
             <Sprout size={16} />
             FFB Counting Interface — Block F3
           </h3>

           <div className="bg-green-50 dark:bg-green-900/10 w-full max-w-sm rounded-3xl p-10 border border-green-100 dark:border-green-900/20 relative">
              <div className="text-[11px] font-bold text-green-700 dark:text-green-400 mb-2 uppercase tracking-widest">Live Session · 3.4 hrs</div>
              <div className={`text-[80px] font-black text-[#1A7A4A] leading-none mb-2 transition-transform ${isTapping ? 'scale-110' : 'scale-100'}`}>
                {count}
              </div>
              <div className="text-lg font-bold text-green-800 dark:text-green-300 opacity-80">
                ≈ {(count * kgPerBunch).toLocaleString()} kg <span className="text-xs font-medium text-gray-500">est.</span>
              </div>
              
              <button 
                onClick={handleTap}
                className="w-full mt-8 bg-[#1A7A4A] text-white text-xl font-black py-6 rounded-2xl shadow-lg hover:bg-[#145C37] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                + 1 Bunch
              </button>
              <p className="mt-4 text-[11px] text-green-700/60 font-medium">Tap once per bunch · Shake to undo</p>
           </div>

           <div className="grid grid-cols-3 gap-4 w-full max-w-sm mt-8">
              <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-black/5">
                 <div className="text-[11px] font-bold text-gray-500 uppercase mb-1">Avg Bunch</div>
                 <div className="text-sm font-black">14.0 kg</div>
              </div>
              <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-black/5">
                 <div className="text-[11px] font-bold text-gray-500 uppercase mb-1">kg / hour</div>
                 <div className="text-sm font-black">585</div>
              </div>
              <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-black/5">
                 <div className="text-[11px] font-bold text-gray-500 uppercase mb-1">Session</div>
                 <div className="text-sm font-black">3.4h</div>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white dark:bg-white/5 p-5 rounded-xl border border-black/5 dark:border-white/5">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                 <TrendingUp size={16} className="text-[#1A7A4A]" />
                 Daily Harvest Log
              </h3>
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-[11px]">
                    <thead>
                       <tr className="text-[11px] font-bold text-gray-500 uppercase border-b border-black/5">
                          <th className="py-2 px-1">Harvester</th>
                          <th className="py-2 px-1">Block</th>
                          <th className="py-2 px-1">Bunches</th>
                          <th className="py-2 px-1">Weight</th>
                          <th className="py-2 px-1">Variance</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                       {logs.map((log, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5">
                             <td className="py-3 px-1 font-bold">{log.worker}</td>
                             <td className="py-3 px-1 text-gray-500">{log.block}</td>
                             <td className="py-3 px-1 font-bold">{log.bunches}</td>
                             <td className="py-3 px-1">{log.weight}</td>
                             <td className="py-3 px-1">
                                <span className={`px-1.5 py-0.5 rounded-full font-bold ${log.variance.startsWith('-') ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>
                                   {log.variance}
                                </span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl flex justify-between items-center border border-green-100">
                 <span className="text-[12px] font-bold text-green-800">Total Today</span>
                 <span className="text-xl font-black text-green-800">6,622 kg</span>
              </div>
           </div>

           <div className="bg-white dark:bg-white/5 p-5 rounded-xl border border-black/5 dark:border-white/5">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                 <Factory size={16} className="text-[#1A7A4A]" />
                 Mill Reconciliation
              </h3>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-[12px]">
                    <span className="text-gray-500">Farm dispatched</span>
                    <span className="font-bold">6,622 kg</span>
                 </div>
                 <div className="flex justify-between items-center text-[12px]">
                    <span className="text-gray-500">Mill received</span>
                    <span className="font-bold">6,501 kg</span>
                 </div>
                 <div className="flex justify-between items-center text-[12px] pt-2 border-t border-black/5">
                    <span className="text-gray-500">Variance</span>
                    <span className="text-green-600 font-bold">−1.8% ✓ Within tolerance</span>
                 </div>
                 <div className="flex justify-between items-center text-[12px]">
                    <span className="text-gray-500">Payment trigger</span>
                    <span className="text-green-600 font-bold flex items-center gap-1">
                       <CheckCircle2 size={12} /> Auto-created
                    </span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FFBCounter;
