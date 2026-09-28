import React, { useState } from 'react';
import { 
  Map as MapIcon, 
  Users, 
  Layout, 
  AlertCircle, 
  MoreVertical,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus
} from 'lucide-react';

const KPICard = ({ icon, label, value, delta, deltaType, valueColor }) => (
  <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5 relative">
    <div className="absolute top-3 right-3 text-gray-300 dark:text-white/10">{icon}</div>
    <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</div>
    <div className={`text-2xl font-bold ${valueColor || 'text-gray-900 dark:text-white'}`}>{value}</div>
    <div className={`text-[10.5px] mt-1 font-medium flex items-center gap-1 ${
      deltaType === 'up' ? 'text-green-600' : deltaType === 'down' ? 'text-red-600' : 'text-gray-500'
    }`}>
      {delta}
    </div>
  </div>
);

const Workforce = () => {
  const [activeTab, setActiveTab] = useState('map');

  const blocks = [
    { id: 'F3', workers: 22, status: 'Active', color: 'bg-green-600/40', pos: { left: '12%', top: '14%', w: '23%', h: '32%' } },
    { id: 'C3', workers: 8, status: 'Active', color: 'bg-green-600/30', pos: { left: '40%', top: '10%', w: '21%', h: '28%' } },
    { id: 'D2', workers: 0, status: 'Alert', color: 'bg-amber-600/40', pos: { left: '63%', top: '20%', w: '20%', h: '30%' }, alert: true },
    { id: 'A2', workers: 7, status: 'Active', color: 'bg-green-600/25', pos: { left: '16%', top: '54%', w: '26%', h: '30%' } },
    { id: 'B1', workers: 5, status: 'Flagged', color: 'bg-red-600/30', pos: { left: '48%', top: '56%', w: '24%', h: '30%' }, flagged: true },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<CheckCircle2 size={18}/>} label="Workers In" value="42" delta="of 50 assigned" valueColor="text-green-600" />
        <KPICard icon={<AlertCircle size={18}/>} label="Absent Today" value="8" delta="SMS auto-sent" valueColor="text-red-600" />
        <KPICard icon={<Clock size={18}/>} label="Active Tasks" value="11" delta="2 behind schedule" />
        <KPICard icon={<AlertCircle size={18}/>} label="AI Anomalies" value="3" delta="Flagged today" valueColor="text-amber-600" />
      </div>

      <div className="bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 overflow-hidden">
        <div className="flex border-b border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-black/10 p-1">
          {[
            { id: 'map', label: 'Live Map', icon: <MapIcon size={14}/> },
            { id: 'kanban', label: 'Task Board', icon: <Layout size={14}/> },
            { id: 'attendance', label: 'Attendance', icon: <Users size={14}/> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-white/10 text-[#1A7A4A] dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 min-h-[400px]">
          {activeTab === 'map' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 relative h-[350px] bg-emerald-950 rounded-xl overflow-hidden border border-black/10">
                <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                {blocks.map(block => (
                  <div 
                    key={block.id}
                    className={`absolute border-2 rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer transition-all hover:scale-105 ${block.color} ${
                      block.alert ? 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 
                      block.flagged ? 'border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 
                      'border-white/20'
                    }`}
                    style={block.pos}
                  >
                    <span className="text-white font-bold text-[14px]">{block.id}</span>
                    <span className="text-white/70 text-[11px] uppercase font-bold tracking-tighter">
                      {block.alert ? '⚠ Alert' : `${block.workers} workers`}
                    </span>
                  </div>
                ))}
                
                {/* Simulated worker dots */}
                <div className="absolute w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white shadow-sm top-[20%] left-[15%]"></div>
                <div className="absolute w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white shadow-sm top-[30%] left-[25%]"></div>
                <div className="absolute w-2.5 h-2.5 bg-red-400 rounded-full border-2 border-white shadow-sm top-[60%] left-[50%] animate-bounce"></div>
                
                <div className="absolute bottom-4 left-4 flex gap-4 bg-black/40 backdrop-blur-md px-3 py-2 rounded-lg text-[9.5px] text-white/70 border border-white/10">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400"></span>Active</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span>Flagged</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span>Boundary</span>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="bg-gray-50 dark:bg-black/10 p-4 rounded-xl border border-black/5">
                    <h4 className="text-[11px] font-bold text-gray-500 uppercase mb-3">Today's Presence</h4>
                    <div className="grid grid-cols-3 gap-2">
                       <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg text-center border border-green-100">
                          <div className="text-xl font-black text-green-600">42</div>
                          <div className="text-[11px] font-bold text-green-700">IN</div>
                       </div>
                       <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg text-center border border-red-100">
                          <div className="text-xl font-black text-red-600">8</div>
                          <div className="text-[11px] font-bold text-red-700">ABSENT</div>
                       </div>
                       <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg text-center border border-amber-100">
                          <div className="text-xl font-black text-amber-600">3</div>
                          <div className="text-[11px] font-bold text-amber-700">FLAGGED</div>
                       </div>
                    </div>
                 </div>

                 <div className="overflow-hidden rounded-xl border border-black/5">
                    <table className="w-full text-left text-[11px]">
                       <thead className="bg-gray-50 dark:bg-black/20">
                          <tr><th className="p-2">Worker</th><th className="p-2">Block</th><th className="p-2">Status</th></tr>
                       </thead>
                       <tbody className="divide-y divide-black/5">
                          <tr className="hover:bg-gray-50 dark:hover:bg-white/5"><td className="p-2 font-bold">Adamu O.</td><td className="p-2 text-gray-500 font-medium">F3</td><td className="p-2"><span className="text-green-600 font-bold">Active</span></td></tr>
                          <tr className="hover:bg-gray-50 dark:hover:bg-white/5"><td className="p-2 font-bold">Emeka M.</td><td className="p-2 text-gray-500 font-medium">C3</td><td className="p-2"><span className="text-green-600 font-bold">Active</span></td></tr>
                          <tr className="hover:bg-gray-50 dark:hover:bg-white/5"><td className="p-2 font-bold text-red-600">Fatima T.</td><td className="p-2 text-gray-500 font-medium">B1</td><td className="p-2"><span className="text-red-600 font-bold">Out of Bounds</span></td></tr>
                       </tbody>
                    </table>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'kanban' && (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[
                { title: 'To Do', count: 4, tasks: ['Fertilize Block A2', 'Prune Block E1', 'Soil Sample B4'] },
                { title: 'In Progress', count: 3, tasks: [{ t: 'Harvest Block F3', p: 67, w: 'Adamu Obi' }, { t: 'Spray Block C3', p: 40, w: 'Emeka Musa' }] },
                { title: 'Awaiting Approval', count: 5, tasks: ['Spray Block B1', 'Harvest Block A2'] },
              ].map(col => (
                <div key={col.title} className="min-w-[280px] flex-1 bg-gray-50 dark:bg-black/10 rounded-xl p-3 border border-black/5">
                  <div className="flex justify-between items-center mb-4 px-1">
                    <h4 className="text-[11px] font-black uppercase text-gray-500">{col.title}</h4>
                    <span className="bg-gray-200 dark:bg-white/10 px-2 py-0.5 rounded-full text-[11px] font-bold">{col.count}</span>
                  </div>
                  <div className="space-y-3">
                    {col.tasks.map((task, i) => (
                      <div key={i} className="bg-white dark:bg-white/5 p-3 rounded-lg border border-black/5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                        <div className="text-[12px] font-bold mb-1 group-hover:text-[#1A7A4A]">{typeof task === 'string' ? task : task.t}</div>
                        {task.p && (
                          <div className="mt-2">
                             <div className="flex justify-between text-[11px] mb-1">
                                <span className="text-gray-500">{task.w}</span>
                                <span className="font-bold">{task.p}%</span>
                             </div>
                             <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-[#1A7A4A] rounded-full" style={{ width: `${task.p}%` }}></div>
                             </div>
                          </div>
                        )}
                        {!task.p && <div className="text-[11px] text-gray-500">Medium priority · 2.4 ha</div>}
                      </div>
                    ))}
                    <button className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-gray-300 dark:border-white/10 rounded-lg text-[11px] text-gray-500 hover:bg-white dark:hover:bg-white/5 transition-colors">
                       <Plus size={12} /> Add Task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Workforce;
