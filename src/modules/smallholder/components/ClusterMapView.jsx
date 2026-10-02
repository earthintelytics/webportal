import React, { useState } from 'react';
import { Layers, AlertTriangle, CheckCircle2, Compass, ShieldAlert, Sparkles, User, MapPin } from 'lucide-react';

const CLUSTERS = [
  { id: 'alpha', name: 'Cluster Alpha (Ovia North)', members: 184, area: 680.0, avg_vigor: '91%', rvi: '0.78 (Optimal)' },
  { id: 'beta', name: 'Cluster Beta (Iguobazuwa)', members: 142, area: 540.0, avg_vigor: '78%', rvi: '0.64 (Moderate)' },
  { id: 'delta', name: 'Cluster Delta (Siluko Basin)', members: 154, area: 620.0, avg_vigor: '84%', rvi: '0.72 (Good)' },
];

const ClusterMapView = ({ members }) => {
  const [activeLayer, setActiveLayer] = useState('vigor'); // 'vigor' | 'sar_rvi' | 'eudr'
  const [selectedCluster, setSelectedCluster] = useState('alpha');
  const [selectedPlot, setSelectedPlot] = useState(members[0] || null);

  return (
    <div className="space-y-6">
      {/* Cluster Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CLUSTERS.map(cl => (
          <div
            key={cl.id}
            onClick={() => setSelectedCluster(cl.id)}
            className={`bg-white border rounded-2xl p-4 cursor-pointer transition-all ${
              selectedCluster === cl.id
                ? 'border-emerald-600 shadow-md ring-1 ring-emerald-500/20'
                : 'border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 text-sm">{cl.name}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {cl.members} Plots
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">Total Area</span>
                <span className="font-semibold text-slate-800">{cl.area} ha</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Canopy Vigor</span>
                <span className="font-semibold text-emerald-700">{cl.avg_vigor}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Geospatial Map Canvas */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col h-[520px]">
        {/* Layer Pill Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Outgrower Cluster Layers:</span>
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: 'vigor', label: 'Parcel Vigor & Ranking' },
              { id: 'sar_rvi', label: 'Sentinel-1 Radar RVI (Cloud-Penetrating)' },
              { id: 'eudr', label: '2020 Forest Baseline Screening' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveLayer(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeLayer === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Map Canvas with Satellite Texture */}
        <div className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
            style={{ backgroundImage: `url('/crops/smallholder.webp')` }}
          />

          {/* Render Member Plots */}
          <div className="relative z-10 w-full h-full p-8 flex items-center justify-center">
            <svg className="w-full h-full max-w-xl max-h-[380px]" viewBox="0 0 600 400">
              {/* Plot 1: Emmanuel Osagie */}
              <g
                onClick={() => setSelectedPlot(members[0])}
                className="cursor-pointer transition-all hover:opacity-90"
              >
                <polygon
                  points="50,60 260,50 270,180 40,190"
                  fill={activeLayer === 'sar_rvi' ? '#0284c7' : '#16a34a'}
                  fillOpacity={selectedPlot?.id === members[0]?.id ? '0.85' : '0.6'}
                  stroke={selectedPlot?.id === members[0]?.id ? '#ffffff' : '#ffffff44'}
                  strokeWidth={selectedPlot?.id === members[0]?.id ? '3.5' : '1.5'}
                />
                <text x="150" y="115" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">
                  {members[0]?.name || 'Plot 01'}
                </text>
                <text x="150" y="135" fill="#a7f3d0" fontSize="10" textAnchor="middle">
                  {members[0]?.area_ha} ha • {members[0]?.primary_crop}
                </text>
              </g>

              {/* Plot 2: Grace Adesewa */}
              <g
                onClick={() => setSelectedPlot(members[1])}
                className="cursor-pointer transition-all hover:opacity-90"
              >
                <polygon
                  points="290,50 540,60 550,190 280,180"
                  fill={activeLayer === 'sar_rvi' ? '#0369a1' : '#15803d'}
                  fillOpacity={selectedPlot?.id === members[1]?.id ? '0.85' : '0.6'}
                  stroke={selectedPlot?.id === members[1]?.id ? '#ffffff' : '#ffffff44'}
                  strokeWidth={selectedPlot?.id === members[1]?.id ? '3.5' : '1.5'}
                />
                <text x="415" y="115" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">
                  {members[1]?.name || 'Plot 02'}
                </text>
                <text x="415" y="135" fill="#ecfccb" fontSize="10" textAnchor="middle">
                  {members[1]?.area_ha} ha • {members[1]?.primary_crop}
                </text>
              </g>

              {/* Plot 3: Festus Igbinedion (Outlier) */}
              <g
                onClick={() => setSelectedPlot(members[2])}
                className="cursor-pointer transition-all hover:opacity-90"
              >
                <polygon
                  points="30,210 270,200 260,350 20,340"
                  fill={activeLayer === 'sar_rvi' ? '#38bdf8' : '#eab308'}
                  fillOpacity={selectedPlot?.id === members[2]?.id ? '0.85' : '0.6'}
                  stroke={selectedPlot?.id === members[2]?.id ? '#ffffff' : '#ffffff44'}
                  strokeWidth={selectedPlot?.id === members[2]?.id ? '3.5' : '1.5'}
                />
                <text x="145" y="270" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">
                  {members[2]?.name || 'Plot 03'}
                </text>
                <text x="145" y="290" fill="#fef3c7" fontSize="10" textAnchor="middle">
                  {members[2]?.area_ha} ha • Needs Scouting
                </text>
              </g>

              {/* Plot 4: Blessing Chukwuma */}
              <g
                onClick={() => setSelectedPlot(members[3])}
                className="cursor-pointer transition-all hover:opacity-90"
              >
                <polygon
                  points="290,200 550,210 540,360 280,350"
                  fill={activeLayer === 'sar_rvi' ? '#0284c7' : '#16a34a'}
                  fillOpacity={selectedPlot?.id === members[3]?.id ? '0.85' : '0.6'}
                  stroke={selectedPlot?.id === members[3]?.id ? '#ffffff' : '#ffffff44'}
                  strokeWidth={selectedPlot?.id === members[3]?.id ? '3.5' : '1.5'}
                />
                <text x="415" y="270" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">
                  {members[3]?.name || 'Plot 04'}
                </text>
                <text x="415" y="290" fill="#a7f3d0" fontSize="10" textAnchor="middle">
                  {members[3]?.area_ha} ha • {members[3]?.primary_crop}
                </text>
              </g>
            </svg>
          </div>

          {/* Selected Plot Detail Card */}
          {selectedPlot && (
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 text-slate-900 text-xs shadow-xl max-w-xs z-20 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{selectedPlot.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{selectedPlot.id}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                  {selectedPlot.primary_crop}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">Area</span>
                  <span className="font-semibold text-slate-800">{selectedPlot.area_ha} ha</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Vigor Rank</span>
                  <span className="font-bold text-emerald-700">Top {100 - selectedPlot.vigor_percentile}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">SAR RVI Index</span>
                  <span className="font-semibold text-sky-700">{selectedPlot.sar_rvi} (Cloud-Free)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Certification</span>
                  <span className="font-semibold text-slate-800">{selectedPlot.certification}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider mb-0.5">
                  Agronomic Guidance:
                </span>
                {selectedPlot.status === 'Needs Scouting' ? (
                  <span className="text-amber-700 font-medium">
                    Outlier distress detected. Dispatch extension agronomist to check for localized nutrient deficit or drainage blockage.
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium">
                    Canopy density optimal. Proceed with standard scheduled harvesting.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClusterMapView;
