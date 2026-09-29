// UNUSED (2026-09-29): replaced by modules/services/ServicePortal.jsx (same layout as organisation monitoring). Kept on purpose, not deleted — see docs/UNUSED_CODE.md in the root repo before reusing or removing.
import React from 'react';
import { Search, Download, CreditCard } from 'lucide-react';

const LedgerSection = ({ transactions }) => {
  return (
    <div className="p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto h-full bg-gray-50/50">
       <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
             <div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-900">Immutable Settlement Ledger</h3>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Real-time cryptographic audit trail</p>
             </div>
             <div className="flex gap-4">
                <button className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all text-gray-400"><Search size={18} /></button>
                <button className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all text-gray-400"><Download size={18} /></button>
             </div>
          </div>
          <div className="divide-y divide-gray-50">
             {transactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between p-8 bg-white hover:bg-gray-50 transition-all group">
                   <div className="flex items-center gap-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${tx.s === 'Settled' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                         <CreditCard size={28} />
                      </div>
                      <div>
                         <div className="text-[16px] font-bold uppercase text-gray-900 leading-none">{tx.p}</div>
                         <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2 italic">{tx.id} • {tx.date}</div>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-[20px] font-black italic text-gray-900 leading-none">{tx.a}</div>
                      <div className={`text-[11px] font-bold uppercase tracking-widest mt-2 ${tx.s === 'Settled' ? 'text-emerald-600' : 'text-amber-600'}`}>{tx.s}</div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

export default LedgerSection;
