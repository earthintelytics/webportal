import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';

const CropCard = ({ crop, lastRun, onClick }) => {
  const hasRuns = Boolean(lastRun);
  const lastRunDateStr = hasRuns
    ? new Date(lastRun.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Not evaluated yet';

  const photo = crop.photo || `/crops/${crop.id}.webp`;

  return (
    <button
      onClick={onClick}
      type="button"
      className="group flex flex-col text-left bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-200 hover:border-slate-300 hover:shadow-md cursor-pointer"
    >
      {/* Crop Photo Header (No Analyzed Badge) */}
      <div className="relative h-40 w-full overflow-hidden bg-slate-100">
        <img
          src={photo}
          alt={crop.name}
          loading="lazy"
          className="w-full h-full object-cover saturate-[0.9] transition-transform duration-500 group-hover:scale-[1.03]"
          onError={(e) => {
            e.target.src = '/crops/oil_palm.webp';
          }}
        />
      </div>

      {/* Card Content Body */}
      <div className="flex-1 flex flex-col justify-between p-5">
        <div>
          <p className="text-xs font-medium text-slate-500">{crop.scientificName || 'Land Evaluation Model'}</p>
          <h3 className="text-base font-bold text-slate-900 leading-snug mt-0.5 group-hover:text-slate-700 transition-colors">
            {crop.name} Suitability
          </h3>
          <p className="text-xs text-slate-600 mt-2 line-clamp-2">
            Multi-criteria FAO biophysical assessment across soil, climate, radar flood dynamics, and statutory gates.
          </p>
        </div>

        {/* Footer Link */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">{lastRunDateStr}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900 group-hover:text-slate-700">
            <span>Open model</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
};

export default CropCard;
