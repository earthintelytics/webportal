import React from 'react';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';

const DataFetchProgress = ({ layers, overallProgress, estimatedRemaining }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <Loader2 size={28} className="animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-1">
          Automated Geospatial Layer Prefetch
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Fetching 9 high-resolution satellite, elevation, soil, and climate datasets for your estate boundary automatically.
        </p>
      </div>

      {/* Overall Progress bar */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-slate-700">Overall Data Pipeline Completion</span>
          <span className="text-emerald-600 font-bold text-sm">{overallProgress}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-emerald-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
          <span>Processing CHIRPS, ERA5, Copernicus DEM & SoilGrids</span>
          <span className="flex items-center gap-1"><Clock size={12} /> ~{estimatedRemaining || 2} min remaining</span>
        </div>
      </div>

      {/* Layer breakdown list */}
      <div className="space-y-3">
        {layers.map((layerItem, idx) => {
          const isDone = layerItem.progress === 100;
          return (
            <div key={idx} className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDone ? (
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                ) : (
                  <Loader2 size={18} className="text-emerald-500 animate-spin shrink-0" />
                )}
                <div>
                  <div className="text-xs font-semibold text-slate-800">{layerItem.layer}</div>
                  <div className="text-[11px] text-slate-400">{layerItem.message}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${layerItem.progress}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 w-10 text-right">{layerItem.progress}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DataFetchProgress;
