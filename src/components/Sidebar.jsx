import React from 'react';
import { 
  LogOut,
  Grid
} from 'lucide-react';

const Sidebar = ({ activeSection, setActiveSection, currentCrop, onSignOut }) => {
  const menuItems = currentCrop.menu || [];
  const primaryColor = currentCrop.primaryColor || '#16A34A';

  return (
    <nav className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen shrink-0 z-50">
      <div className="p-8 flex flex-col items-center gap-2 shrink-0">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center p-3 border border-gray-100">
          <img src="/farmintelytics-logo.png" alt="Logo" className="w-full h-auto" />
        </div>
        <div className="text-center mt-3">
          <div className="font-black text-[15px] uppercase tracking-tighter text-gray-900">FarmIntelytics</div>
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">Management Node</div>
        </div>
      </div>

      <div className="flex-1 px-4 space-y-1 mt-4">
        <label className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] px-4 mb-3 block">Navigation</label>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
              activeSection === item.id 
                ? 'text-white' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
            style={{ 
              backgroundColor: activeSection === item.id ? primaryColor : 'transparent',
              boxShadow: activeSection === item.id ? `0 4px 12px -4px ${primaryColor}44` : 'none'
            }}
          >
            <div className={activeSection === item.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-900'}>
               {item.icon}
            </div>
            <span className="text-[13px] font-bold">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="p-6 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 mb-6">
          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center p-2 border border-gray-50">
            <img src={currentCrop.logo} alt="Crop" className="w-full h-auto" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-black text-gray-900 truncate uppercase tracking-tighter">{currentCrop.name}</div>
            <div className="text-[11px] text-gray-400 font-bold uppercase">Active Division</div>
          </div>
        </div>

        <button 
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-red-500 hover:text-white hover:bg-red-500 py-3 rounded-xl transition-all border border-red-100"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
