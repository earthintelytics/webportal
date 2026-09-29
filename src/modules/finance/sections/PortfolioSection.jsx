// UNUSED (2026-09-29): not imported anywhere in the running app. Kept on purpose, not deleted — see docs/UNUSED_CODE.md in the root repo before reusing or removing.
import React from 'react';
import { Landmark } from 'lucide-react';

const PortfolioSection = () => {
  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-500 overflow-y-auto h-full bg-gray-50/50">
       <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 border border-gray-100">
             <Landmark size={32} className="text-gray-300" />
          </div>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 mb-2">Portfolio Node Management</h3>
          <p className="text-gray-400 font-bold uppercase text-[11px] tracking-[0.3em] max-w-md">Comprehensive asset classification and reserve fund allocation layer</p>
       </div>
    </div>
  );
};

export default PortfolioSection;
