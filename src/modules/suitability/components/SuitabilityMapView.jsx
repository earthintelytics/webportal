import React, { useState } from 'react';
import { Layers, Info, CheckCircle, AlertTriangle, AlertOctagon, HelpCircle, ShieldCheck } from 'lucide-react';

const MAP_LAYERS = [
  { id: 'overview', label: 'Suitability Overview' },
  { id: 'rainfall', label: 'Rainfall (CHIRPS)' },
  { id: 'soil', label: 'Soil pH & Depth (SoilGrids)' },
  { id: 'slope', label: 'Slope & Terrain (DEM / TWI)' },
  { id: 'temp', label: 'Temperature (ERA5)' },
  { id: 'flood', label: 'Radar Flood & Water (Sentinel-1)' },
  { id: 'exclusions', label: 'Statutory Exclusions (EUDR / WDPA)' }
];

const SuitabilityMapView = ({ runResult, onSelectField }) => {
  const [activeLayer, setActiveLayer] = useState('overview');
  const fields = runResult?.fields || [];
  const [selectedFieldId, setSelectedFieldId] = useState(fields[0]?.field_id || null);

  const currentField = fields.find(f => f.field_id === selectedFieldId) || fields[0] || null;

  const getFieldFillColor = (f, layer) => {
    if (!f) return '#16a34a';
    if (layer === 'rainfall') return '#3b82f6';
    if (layer === 'soil') return '#a855f7';
    if (layer === 'slope') return '#f97316';
    if (layer === 'temp') return '#eab308';
    if (layer === 'flood') return '#06b6d4';
    if (layer === 'exclusions') return '#10b981';

    switch (f.overall_class) {
      case 'S1': return '#16a34a';
      case 'S2': return '#84cc16';
      case 'S3': return '#f59e0b';
      case 'N':
      case 'N1':
      case 'N2': return '#e11d48';
      default: return '#16a34a';
    }
  };

  // Helper to layout N fields dynamically in SVG canvas (600x400)
  const getDynamicFieldPoints = (index, total) => {
    if (total === 1) {
      return { points: '60,60 540,60 540,340 60,340', cx: 300, cy: 190 };
    }
    if (total === 2) {
      if (index === 0) return { points: '40,50 280,45 285,345 45,350', cx: 160, cy: 190 };
      return { points: '310,45 560,50 555,350 315,345', cx: 435, cy: 190 };
    }
    if (total === 3) {
      if (index === 0) return { points: '40,40 280,30 285,185 45,190', cx: 160, cy: 110 };
      if (index === 1) return { points: '310,30 560,40 555,190 315,185', cx: 435, cy: 110 };
      return { points: '140,215 460,215 450,370 150,370', cx: 300, cy: 290 };
    }
    if (total === 4) {
      if (index === 0) return { points: '40,40 280,30 290,180 30,190', cx: 155, cy: 110 };
      if (index === 1) return { points: '300,30 560,40 570,200 295,180', cx: 430, cy: 115 };
      if (index === 2) return { points: '20,210 280,200 270,360 10,350', cx: 140, cy: 280 };
      return { points: '300,200 575,220 560,370 290,360', cx: 430, cy: 285 };
    }
    // More than 4: dynamic grid layout
    const cols = total > 6 ? 3 : 2;
    const rows = Math.ceil(total / cols);
    const c = index % cols;
    const r = Math.floor(index / cols);
    const colW = 520 / cols;
    const rowH = 310 / rows;
    const x1 = 40 + c * colW + 8;
    const y1 = 40 + r * rowH + 8;
    const x2 = x1 + colW - 16;
    const y2 = y1 + rowH - 16;
    return {
      points: `${x1},${y1} ${x2},${y1 + 4} ${x2 - 4},${y2} ${x1 + 4},${y2 - 4}`,
      cx: (x1 + x2) / 2,
      cy: (y1 + y2) / 2
    };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col h-[520px]">
      {/* Map Control Pill Bar */}
      <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between gap-3 overflow-x-auto border-b border-slate-800">
        <div className="flex items-center gap-2 shrink-0">
          <Layers size={15} className="text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Criteria Layers:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {MAP_LAYERS.map(tab => (
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

      {/* Main Interactive Map Canvas */}
      <div className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Satellite Imagery Background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
          style={{ backgroundImage: `url('/crops/suitability_palm.webp')` }}
        />

        {/* Dynamic Polygons SVG Layer */}
        {fields.length > 0 ? (
          <div className="relative z-10 w-full h-full p-8 flex items-center justify-center">
            <svg className="w-full h-full max-w-xl max-h-[380px]" viewBox="0 0 600 400">
              {fields.map((field, idx) => {
                const geom = getDynamicFieldPoints(idx, fields.length);
                const isSelected = selectedFieldId === field.field_id || (!selectedFieldId && idx === 0);
                const fillColor = getFieldFillColor(field, activeLayer);

                return (
                  <g
                    key={field.field_id || idx}
                    onClick={() => {
                      setSelectedFieldId(field.field_id);
                      if (onSelectField) onSelectField(field.field_id);
                    }}
                    className="cursor-pointer transition-all hover:opacity-90 group"
                  >
                    <polygon
                      points={geom.points}
                      fill={fillColor}
                      fillOpacity={isSelected ? '0.85' : '0.65'}
                      stroke={isSelected ? '#ffffff' : '#ffffff44'}
                      strokeWidth={isSelected ? '3.5' : '1.5'}
                    />
                    <text
                      x={geom.cx}
                      y={geom.cy - 6}
                      fill="#ffffff"
                      fontSize={fields.length > 4 ? '11' : '13'}
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {field.field_id} ({field.overall_class || 'S1'})
                    </text>
                    <text
                      x={geom.cx}
                      y={geom.cy + 12}
                      fill="#ecfdf5"
                      fontSize={fields.length > 4 ? '9' : '11'}
                      textAnchor="middle"
                    >
                      {field.area_ha ? `${field.area_ha.toFixed(1)} ha` : ''} • Class {field.overall_class || 'S1'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="relative z-10 text-center text-slate-400 p-8 max-w-md">
            <Layers size={40} className="mx-auto mb-3 text-slate-600 opacity-60" />
            <p className="text-sm font-semibold text-slate-300">No evaluated field boundaries to render.</p>
            <p className="text-xs text-slate-500 mt-1">Run an evaluation model to compute biophysical suitability layers.</p>
          </div>
        )}

        {/* Legend Box */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700/80 text-white text-[11px] space-y-1.5 shadow-lg z-20">
          <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
            FAO Suitability Classes
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-[#16a34a]" />
            <span className="text-slate-200">S1 — Highly Suitable</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-[#84cc16]" />
            <span className="text-slate-200">S2 — Moderately Suitable</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-[#f59e0b]" />
            <span className="text-slate-200">S3 — Marginally Suitable</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-[#e11d48]" />
            <span className="text-slate-200">N — Unsuitable / Statutory Excluded</span>
          </div>
        </div>

        {/* Selected Field Detail Card */}
        {currentField && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 text-slate-900 text-xs shadow-xl max-w-xs z-20 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900 text-sm">{currentField.field_id}</span>
              <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] text-white ${
                currentField.overall_class === 'S1' ? 'bg-emerald-600' :
                currentField.overall_class === 'S2' ? 'bg-lime-600' :
                currentField.overall_class === 'S3' ? 'bg-amber-600' : 'bg-rose-600'
              }`}>
                {currentField.overall_class}
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {currentField.summary || 'Biophysical land evaluation verified.'}
            </p>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
              <span className="font-semibold text-slate-700 text-[10px] uppercase tracking-wider block mb-1">
                Limiting Factors:
              </span>
              <span className="text-slate-600 text-[11px]">
                {(currentField.limiting_factors && currentField.limiting_factors.length > 0)
                  ? currentField.limiting_factors.join(', ')
                  : 'None (Optimal Conditions)'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuitabilityMapView;

