import React from 'react';
import { 
  RefreshCw, 
  User, 
  Bell,
  Search,
  Settings,
  Calendar
} from 'lucide-react';

const TopBar = ({ title }) => {
  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center px-8 gap-8 shrink-0 z-40">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
           <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Management Module</h2>
           <div className="text-[18px] font-black text-gray-900 capitalize tracking-tight">{title}</div>
        </div>

        <div className="h-8 w-px bg-gray-100 hidden sm:block"></div>

        <div className="relative hidden xl:block w-72 group">
           <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors" />
           <input 
             type="text" 
             placeholder="Search records..." 
             className="w-full bg-gray-50 border border-transparent focus:border-gray-200 rounded-xl py-2 pl-12 pr-4 text-[13px] font-medium outline-none transition-all"
           />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-6">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-[11px] font-bold text-gray-600">
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-green-600 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
            <Settings size={20} />
          </button>
        </div>

        <div className="h-8 w-px bg-gray-100 mx-2"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[12px] font-bold text-gray-900">Farm Admin</div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Operations</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700 font-bold">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
