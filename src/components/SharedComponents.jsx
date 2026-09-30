// UNUSED (2026-09-30): showed sample (invented) figures; no longer routed. Kept on purpose, not deleted — see docs/UNUSED_CODE.md before reusing or removing.
import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  MoreHorizontal, 
  User, 
  MapPin, 
  Search, 
  Calendar as CalendarIcon, 
  Filter, 
  ChevronDown, 
  Camera,
  Navigation
} from 'lucide-react';

export const SimpleCard = ({ children, title, subtitle, icon, className = "", headerAction }) => (
  <div className={`bg-white p-6 rounded-2xl border border-gray-100 ${className}`}>
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon && <div className="p-2 bg-gray-50 rounded-lg text-green-600">{icon}</div>}
        <div>
          {title && <h3 className="font-bold text-gray-900 text-[15px] tracking-tight leading-none mb-1">{title}</h3>}
          {subtitle && <p className="text-gray-400 text-[11px] font-bold">{subtitle}</p>}
        </div>
      </div>
      {headerAction ? headerAction : (
        <button className="text-gray-300 hover:text-gray-600">
          <MoreHorizontal size={18} />
        </button>
      )}
    </div>
    {children}
  </div>
);

export const FilterBar = ({ onSearch, filters = [] }) => (
  <div className="flex flex-wrap items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl mb-6">
    <div className="relative flex-1 min-w-[240px]">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
      <input 
        type="text" 
        placeholder="Search records, workers, plots or locations..." 
        className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-xl text-[13px] font-bold outline-none transition-all"
        onChange={(e) => onSearch?.(e.target.value)}
      />
    </div>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[12px] font-bold text-gray-500">
         <CalendarIcon size={14} />
         <input type="date" className="bg-transparent outline-none" defaultValue="2026-05-02" />
      </div>
      {filters.map((f, i) => (
        <div key={i} className="relative group">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-[12px] font-bold text-gray-600 hover:bg-gray-50 transition-all">
            {f.icon || <Filter size={14} />}
            <span>{f.label}</span>
            <ChevronDown size={14} className="text-gray-300" />
          </button>
        </div>
      ))}
      <button className="px-6 py-2.5 bg-green-700 text-white rounded-xl text-[11px] font-bold hover:bg-green-800 transition-all shadow-sm">
        Export PDF
      </button>
    </div>
  </div>
);

export const EvidenceThumbnail = ({ src, alt = "evidence" }) => (
  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 relative group cursor-pointer">
    <img src={src || 'https://images.unsplash.com/photo-1599305445671-ac291c95aba9?auto=format&fit=crop&q=80&w=150'} alt={alt} className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
       <Camera size={14} className="text-white" />
    </div>
  </div>
);

export const LocationBadge = ({ lat, lng }) => (
  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
    <Navigation size={10} className="text-blue-500 rotate-45" />
    {lat.toFixed(4)}, {lng.toFixed(4)}
  </div>
);

export const WorkerActivityTable = ({ data, columns }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/50">
          {columns.map(col => (
            <th key={col.key} className="text-[11px] font-bold text-gray-400 py-4 px-6 border-r border-gray-100 last:border-r-0">{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {data.map((row, i) => (
          <tr key={i} className="hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-b-0">
            {columns.map(col => (
              <td key={col.key} className="py-4 px-6 border-r border-gray-50 last:border-r-0">
                {col.render ? col.render(row[col.key], row) : (
                  <span className="text-[13px] font-bold text-gray-800">{row[col.key]}</span>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const GeospatialPreview = ({ title, status, points, full = false }) => (
  <div className={`relative ${full ? 'h-full' : 'aspect-[16/9]'} bg-gray-100 rounded-2xl overflow-hidden border border-gray-100`}>
    {/* Map Background Layer */}
    <div className="absolute inset-0 bg-[url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}')] bg-cover opacity-80"></div>
    
    {/* Overlay Layer for Plots (Floots) */}
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
       <polygon points="100,100 250,80 300,200 120,220" fill="#16A34A" stroke="#16A34A" strokeWidth="2" />
       <polygon points="400,150 550,130 600,250 420,270" fill="#D35400" stroke="#D35400" strokeWidth="2" />
       <polygon points="200,300 350,280 400,400 220,420" fill="#16A34A" stroke="#16A34A" strokeWidth="2" />
    </svg>

    <div className="absolute inset-0 bg-black/5"></div>
    
    <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
       <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100">
          <MapPin size={14} className="text-green-600" />
          <span className="text-[11px] font-bold text-gray-900">{title}</span>
       </div>
       <div className="flex flex-col gap-1 p-3 bg-white/90 rounded-xl border border-gray-100 shadow-sm w-48">
          <div className="text-[11px] font-bold text-gray-400 mb-2">Map Layers</div>
          {[
            { label: 'Active Plots', color: 'bg-green-500' },
            { label: 'Maintenance Zones', color: 'bg-orange-500' },
            { label: 'Verified Points', color: 'bg-blue-500' }
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 mb-1">
               <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
               <span className="text-[11px] font-bold text-gray-600">{item.label}</span>
            </div>
          ))}
       </div>
    </div>
    
    <div className="absolute inset-0 flex items-center justify-center">
       <div className="relative w-full h-full">
          {points?.map((p, i) => (
            <div 
              key={i} 
              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition-transform"
              style={{ top: p.y, left: p.x, backgroundColor: p.color || '#16A34A' }}
            >
               <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-700 text-white text-[11px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                 {p.label}
               </div>
            </div>
          ))}
       </div>
    </div>
    
    <div className="absolute bottom-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-gray-900/80 text-white rounded-lg text-[11px] font-bold tracking-[0.2em]">
      <div className="w-1 h-1 rounded-full bg-status-live animate-pulse"></div>
      Live Ops Stream
    </div>
  </div>
);

export const MetricTile = ({ label, value, unit, trend, color = "bg-green-600" }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100">
    <div className="text-[11px] font-bold text-gray-400 mb-3">{label}</div>
    <div className="flex items-baseline gap-2 mb-2">
      <div className="text-3xl font-bold text-gray-900 tracking-tighter italic">{value}</div>
      {unit && <div className="text-sm font-bold text-gray-400">{unit}</div>}
    </div>
    <div className={`h-1 w-8 rounded-full ${color}`}></div>
  </div>
);
