import React from 'react';
import { 
  Layers, 
  Info, 
  Calendar, 
  Map as MapIcon,
  Activity,
  Trees,
  Cloud,
  Satellite
} from 'lucide-react';

export const HUDPanel = ({ children, className = "" }) => (
  <div className={`gis-hud-panel gis-glass ${className}`}>
    {children}
  </div>
);

// Honest placeholder for a sidebar tab that isn't backed by real data yet —
// used instead of silently reusing another tab's content (or showing
// nothing) when a nav item is clicked.
export const TabPlaceholder = ({ icon, label }) => (
  <div className="w-full h-full flex items-center justify-center pointer-events-none">
    <HUDPanel className="p-10 flex flex-col items-center gap-4 pointer-events-auto">
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
        {icon}
      </div>
      <div className="text-center">
        <p className="text-[13px] font-black text-white uppercase tracking-widest">{label}</p>
        <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mt-2">Not yet available</p>
      </div>
    </HUDPanel>
  </div>
);

export const LayerSwitcher = ({ layers, activeLayer, onToggle }) => (
  <HUDPanel className="gis-layer-switcher">
    <div className="flex items-center gap-2 mb-4 px-2">
      <Layers size={16} className="text-emerald-500" />
      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Layer Explorer</span>
    </div>
    <div className="space-y-1">
      {layers.map(layer => (
        <button
          key={layer.id}
          onClick={() => onToggle(layer.id)}
          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
            activeLayer === layer.id ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            {layer.icon || <MapIcon size={14} />}
            <span className="text-[11px] font-bold uppercase tracking-widest">{layer.label}</span>
          </div>
          {activeLayer === layer.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
        </button>
      ))}
    </div>
  </HUDPanel>
);

export const LegendPanel = ({ title, items }) => (
  <HUDPanel className="gis-legend">
    <div className="flex items-center gap-2 mb-4">
      <Info size={14} className="text-emerald-500" />
      <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">{title}</span>
    </div>
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
          <span className="text-[11px] font-black uppercase text-gray-300">{item.label}</span>
        </div>
      ))}
    </div>
  </HUDPanel>
);

export const TimelineSlider = ({ currentYear, onChange }) => (
  <HUDPanel className="gis-timeline flex items-center gap-8">
    <div className="flex items-center gap-3">
      <Calendar size={18} className="text-emerald-500" />
      <div className="flex flex-col">
        <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest leading-none">Historical</span>
        <span className="text-[14px] font-black text-white leading-tight mt-1">{currentYear}</span>
      </div>
    </div>
    <div className="flex-1 px-4">
      <input 
        type="range" 
        min="2018" 
        max="2026" 
        value={currentYear} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-emerald-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
      />
      <div className="flex justify-between mt-2 px-1">
        {[2018, 2020, 2022, 2024, 2026].map(y => (
          <span key={y} className="text-[11px] font-black text-gray-500 uppercase tracking-tighter">{y}</span>
        ))}
      </div>
    </div>
  </HUDPanel>
);

export const FloatingMetric = ({ label, value, unit, icon, color = "emerald" }) => (
  <div className="flex flex-col p-6 bg-black/40 backdrop-blur-md border border-white/5 rounded-[1.5rem]">
    <div className="flex items-center gap-2 mb-3">
      <div className={`text-${color}-500`}>{icon}</div>
      <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</span>
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-black gis-metric-value text-white">{value}</span>
      <span className={`text-[11px] font-black text-${color}-500 uppercase tracking-widest`}>{unit}</span>
    </div>
  </div>
);

export const GISSidebar = ({ children, title, icon }) => (
  <HUDPanel className="gis-sidebar flex flex-col overflow-hidden pointer-events-auto">
    <div className="p-6 border-b border-white/5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-emerald-600/20 rounded-lg text-emerald-500">
          {icon}
        </div>
        <div>
          <h3 className="text-[12px] font-black uppercase tracking-widest text-white">{title}</h3>
          <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-0.5">Live Intelligence</p>
        </div>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
      {children}
    </div>
  </HUDPanel>
);
