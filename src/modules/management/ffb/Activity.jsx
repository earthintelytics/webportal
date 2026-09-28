import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Eye,
  MapPin,
  ShieldCheck,
  Calendar,
  ChevronRight
} from 'lucide-react';

const Activity = () => {
  const approvals = [
    { 
      id: 1, 
      worker: 'Adamu Obi', 
      type: 'Herbicide Spray', 
      block: 'D2', 
      details: '1.8 ha · 9L Glyphosate · GPS ±8m', 
      time: '13:44',
      status: 'pending',
      badges: ['GPS accurate', 'Evidence OK', 'Block match']
    },
    { 
      id: 2, 
      worker: 'Yusuf Umeh', 
      type: 'Harvesting', 
      block: 'F3', 
      details: '2.1 ha · GPS ±32m · 3 photos', 
      time: '12:05',
      status: 'review',
      badges: ['GPS Drift detected', 'Photos OK']
    },
    { 
      id: 3, 
      worker: 'Chisom Kalu', 
      type: 'Planting', 
      block: 'B1', 
      details: '0.9 ha · Missing evidence photo', 
      time: '11:30',
      status: 'flagged',
      badges: ['Evidence incomplete']
    },
  ];

  const timeline = [
    { title: 'FFB Harvest — Block F3 · 1.84t', sub: 'Adamu Obi · ✓ Approved · 09:15 · SHA256: a3f2…', type: 'approved' },
    { title: 'Spraying — Block C3 · 2.4 ha', sub: 'Emeka Musa · ✓ Approved · 10:30 · 12L Glyphosate', type: 'approved' },
    { title: 'Fertilizing — Block A2 · 1.6 ha', sub: 'Chisom Kalu · ⏳ Pending review · 11:48', type: 'pending' },
    { title: 'Planting — Block B1 · Rejected', sub: 'Evidence photo missing — resubmit required · 12:20', type: 'rejected' },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Activities Today</div>
          <div className="text-2xl font-bold">38</div>
        </div>
        <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Pending Approval</div>
          <div className="text-2xl font-bold text-amber-600">12</div>
        </div>
        <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Approved</div>
          <div className="text-2xl font-bold text-green-600">21</div>
        </div>
        <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Rejected</div>
          <div className="text-2xl font-bold text-red-600">5</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#1A7A4A]" />
              Approval Queue
            </h3>
            <span className="text-[11px] text-gray-500 font-medium">Swipe to Approve</span>
          </div>
          
          <div className="space-y-3">
            {approvals.map(item => (
              <div key={item.id} className="bg-white dark:bg-white/5 p-4 rounded-xl border border-black/5 dark:border-white/5 hover:border-[#1A7A4A]/30 transition-all cursor-pointer shadow-sm group">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center font-bold text-[12px] text-[#1A7A4A] shrink-0">
                    {item.worker.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-[#1A7A4A] transition-colors">{item.type} · Block {item.block}</div>
                      <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1"><Clock size={10} /> {item.time}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{item.worker} · {item.details}</div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.badges.map((b, i) => (
                        <span key={i} className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full border ${
                          b.includes('accurate') || b.includes('OK') || b.includes('match') 
                            ? 'bg-green-50 text-green-700 border-green-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {b}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                       <button className="flex-1 bg-[#1A7A4A] text-white text-[11px] font-bold py-1.5 rounded-lg hover:bg-[#145C37] transition-colors shadow-sm flex items-center justify-center gap-1.5">
                          <CheckCircle2 size={13} /> Approve
                       </button>
                       <button className="flex-1 bg-red-50 dark:bg-red-900/10 text-red-600 text-[11px] font-bold py-1.5 rounded-lg border border-red-100 hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5">
                          <XCircle size={13} /> Reject
                       </button>
                       <button className="p-1.5 bg-gray-100 dark:bg-white/5 rounded-lg border border-black/5 hover:bg-gray-200 transition-colors">
                          <Eye size={14} className="text-gray-500" />
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 p-5 rounded-xl border border-black/5 dark:border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Clock size={16} className="text-[#1A7A4A]" />
              Activity Timeline
            </h3>
            <button className="text-[11px] font-bold text-[#1A7A4A] flex items-center gap-1 hover:underline">
               Full History <ChevronRight size={12} />
            </button>
          </div>
          
          <div className="flex-1 space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-gray-100 dark:before:bg-white/5">
            {timeline.map((item, i) => (
              <div key={i} className="relative pl-7 group">
                <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-[#242420] shadow-sm z-10 transition-transform group-hover:scale-110 ${
                  item.type === 'approved' ? 'bg-green-500' :
                  item.type === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                }`}></div>
                <div className="text-[12.5px] font-bold text-gray-900 dark:text-gray-100">{item.title}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{item.sub}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4 flex items-center gap-2">
               <ShieldCheck size={14} /> Audit Trail
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-500 font-medium">Harvest F3 — a3f2c7d4…</span>
                <span className="text-green-600 font-black">✓ INTACT</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-500 font-medium">Spray C3 — b8e1a9f3…</span>
                <span className="text-green-600 font-black">✓ INTACT</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-500 font-medium">Fertilize A2 — c4d7b2e1…</span>
                <span className="text-amber-500 font-black uppercase">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Activity;
