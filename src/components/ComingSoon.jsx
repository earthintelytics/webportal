// UNUSED (2026-09-29): not imported anywhere in the running app. Kept on purpose, not deleted — see docs/UNUSED_CODE.md in the root repo before reusing or removing.
import React from 'react';
import { 
  Zap, 
  ArrowLeft,
  LogOut,
  Clock
} from 'lucide-react';

const ComingSoon = ({ title, description, onSignOut }) => {
  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans antialiased text-gray-900">
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center p-2 border border-gray-100">
             <img src="/farmintelytics-logo.png" alt="Logo" className="w-full h-auto" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight text-black leading-none">{title}</h1>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 mt-1 italic">Intelligence Module in Development</p>
          </div>
        </div>
        <button 
          onClick={onSignOut}
          className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
        >
           <LogOut size={14} /> Sign Out
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-[3rem] border border-gray-100 p-20 flex flex-col items-center text-center shadow-sm max-w-2xl animate-in fade-in zoom-in-95 duration-700">
          <div className="w-24 h-24 rounded-[2rem] bg-gray-50 flex items-center justify-center text-gray-900 mb-10 border border-gray-100">
            <Clock size={42} className="text-gray-400" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase mb-6 italic">Engineering Node Initializing</h2>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.15em] leading-relaxed mb-10">
            {description} This module is currently undergoing high-fidelity synchronization with the central intelligence core. 
          </p>
          <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
            <div className="h-full bg-gray-900 w-1/3 animate-pulse"></div>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-gray-100 bg-white flex flex-col items-center">
        <div className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-200">Powered by Farmintelytics · Node v4.28 Alpha</div>
      </footer>
    </div>
  );
};

export default ComingSoon;
