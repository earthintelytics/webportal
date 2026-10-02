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
  const [selectedFieldId, setSelectedFieldId] = useState('BLOCK-A1');

  const fields = runResult?.fields || [
    { field_id: 'BLOCK-A1', overall_class: 'S1', share: { S1: 85, S2: 15 }, limiting_factors: ['None'], summary: 'Highly suitable optimal soil & moisture' },
    { field_id: 'BLOCK-B2', overall_class: 'S2', share: { S1: 40, S2: 60 }, limiting_factors: ['Dry season spell (3.4 mo)'], summary: 'Moderately suitable due to dry season spell' },
    { field_id: 'BLOCK-C3', overall_class: 'S3', share: { S3: 80, N: 20 }, limiting_factors: ['Slope (avg 18°)'], summary: 'Marginally suitable; contour terracing required' },
    { field_id: 'BLOCK-D4', overall_class: 'S1', share: { S1: 92, S2: 8 }, limiting_factors: ['None'], summary: 'Highly suitable optimal conditions' }
  ];

  const currentField = fields.find(f => f.field_id === selectedFieldId) || fields[0];

  const getFieldFillColor = (f, layer) => {
    if (layer === 'rainfall') {
      return '#3b82f6'; // Blue for rainfall
    } else if (layer === 'soil') {
      return '#a855f7'; // Purple for soil pH
    } else if (layer === 'slope') {
      return '#f97316'; // Orange for slope/terrain
    } else if (layer === 'temp') {
      return '#eab308'; // Amber for temp
    } else if (layer === 'flood') {
      return '#06b6d4'; // Cyan for radar flood
    } else if (layer === 'exclusions') {
      return '#10b981'; // Green for 100% compliant
    }

    // Default: Overall Suitability Class
    switch (f.overall_class) {
      case 'S1': return '#16a34a'; // Emerald
      case 'S2': return '#84cc16'; // Lime
      case 'S3': return '#f59e0b'; // Amber
      case 'N':
      case 'N1':
      case 'N2': return '#e11d48'; // Rose
      default: return '#16a34a';
    }
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

        {/* Map Grid Polygons SVG Layer */}
        <div className="relative z-10 w-full h-full p-8 flex items-center justify-center">
          <svg className="w-full h-full max-w-xl max-h-[380px]" viewBox="0 0 600 400">
            {/* Field 1: BLOCK-A1 */}
            <g
              onClick={() => { setSelectedFieldId('BLOCK-A1'); if (onSelectField) onSelectField('BLOCK-A1'); }}
              className="cursor-pointer transition-all hover:opacity-90 group"
            >
              <polygon
                points="40,40 280,30 290,180 30,190"
                fill={getFieldFillColor(fields[0] || { overall_class: 'S1' }, activeLayer)}
                fillOpacity={selectedFieldId === 'BLOCK-A1' ? '0.85' : '0.65'}
                stroke={selectedFieldId === 'BLOCK-A1' ? '#ffffff' : '#ffffff44'}
                strokeWidth={selectedFieldId === 'BLOCK-A1' ? '3.5' : '1.5'}
              />
              <text x="140" y="110" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">BLOCK-A1 (S1)</text>
              <text x="140" y="130" fill="#a7f3d0" fontSize="11" textAnchor="middle">24.5 ha • Highly Suitable</text>
            </g>

            {/* Field 2: BLOCK-B2 */}
            <g
              onClick={() => { setSelectedFieldId('BLOCK-B2'); if (onSelectField) onSelectField('BLOCK-B2'); }}
              className="cursor-pointer transition-all hover:opacity-90 group"
            >
              <polygon
                points="300,30 560,40 570,200 295,180"
                fill={getFieldFillColor(fields[1] || { overall_class: 'S2' }, activeLayer)}
                fillOpacity={selectedFieldId === 'BLOCK-B2' ? '0.85' : '0.65'}
                stroke={selectedFieldId === 'BLOCK-B2' ? '#ffffff' : '#ffffff44'}
                strokeWidth={selectedFieldId === 'BLOCK-B2' ? '3.5' : '1.5'}
              />
              <text x="430" y="110" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">BLOCK-B2 (S2)</text>
              <text x="430" y="130" fill="#ecfccb" fontSize="11" textAnchor="middle">21.0 ha • Moderately Suitable</text>
            </g>

            {/* Field 3: BLOCK-C3 */}
            <g
              onClick={() => { setSelectedFieldId('BLOCK-C3'); if (onSelectField) onSelectField('BLOCK-C3'); }}
              className="cursor-pointer transition-all hover:opacity-90 group"
            >
              <polygon
                points="20,210 280,200 270,360 10,350"
                fill={getFieldFillColor(fields[2] || { overall_class: 'S3' }, activeLayer)}
                fillOpacity={selectedFieldId === 'BLOCK-C3' ? '0.85' : '0.65'}
                stroke={selectedFieldId === 'BLOCK-C3' ? '#ffffff' : '#ffffff44'}
                strokeWidth={selectedFieldId === 'BLOCK-C3' ? '3.5' : '1.5'}
              />
              <text x="140" y="280" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">BLOCK-C3 (S3)</text>
              <text x="140" y="300" fill="#fef3c7" fontSize="11" textAnchor="middle">18.2 ha • Slope Limit (18°)</text>
            </g>

            {/* Field 4: BLOCK-D4 */}
            <g
              onClick={() => { setSelectedFieldId('BLOCK-D4'); if (onSelectField) onSelectField('BLOCK-D4'); }}
              className="cursor-pointer transition-all hover:opacity-90 group"
            >
              <polygon
                points="300,200 575,220 560,370 290,360"
                fill={getFieldFillColor(fields[3] || { overall_class: 'S1' }, activeLayer)}
                fillOpacity={selectedFieldId === 'BLOCK-D4' ? '0.85' : '0.65'}
                stroke={selectedFieldId === 'BLOCK-D4' ? '#ffffff' : '#ffffff44'}
                strokeWidth={selectedFieldId === 'BLOCK-D4' ? '3.5' : '1.5'}
              />
              <text x="430" y="280" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">BLOCK-D4 (S1)</text>
              <text x="430" y="300" fill="#a7f3d0" fontSize="11" textAnchor="middle">22.7 ha • Highly Suitable</text>
            </g>
          </svg>
        </div>

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
