import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

const STAGES = [
  'Rainfall & climate regime classification',
  'Temperature normals & stress reclassification',
  'Slope & terrain contour analysis (Copernicus DEM 30m)',
  'Soil pH & texture classification (SoilGrids 250m)',
  'Forest 2020 baseline & exclusion masking (JRC GFC2020)',
  'Protected areas & reserve buffer masking (WDPA)',
  'FAO Law of Minimum factor combination',
  'Raster COG tile rendering'
];

const RunProgress = ({ cropName, progress }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm max-w-xl mx-auto text-center">
      <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5 border border-emerald-100 shadow-xs">
        <Sparkles size={32} className="animate-pulse" />
      </div>

      <h3 className="text-2xl font-bold text-slate-900 mb-2">
        Evaluating {cropName} Land Suitability
      </h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-8">
        Combining multi-factor requirements according to the FAO Framework for Land Evaluation.
      </p>

      {/* Main Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span className="text-slate-700">Analysis Progress</span>
          <span className="text-emerald-600 font-extrabold text-base">{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200/50">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out shadow-xs"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stages list */}
      <div className="space-y-2 text-left bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
        {STAGES.map((stageName, idx) => {
          const targetPercent = Math.round(((idx + 1) / STAGES.length) * 100);
          const isDone = progress >= targetPercent;
          const isCurrent = progress < targetPercent && progress >= targetPercent - 15;

          return (
            <div key={idx} className="flex items-center justify-between text-xs py-1">
              <span className={`font-medium ${isDone ? 'text-slate-800' : isCurrent ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                {stageName}
              </span>
              {isDone ? (
                <CheckCircle2 size={14} className="text-emerald-600" />
              ) : isCurrent ? (
                <Loader2 size={13} className="text-emerald-600 animate-spin" />
              ) : (
                <span className="text-slate-300 text-[11px]">0%</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RunProgress;
