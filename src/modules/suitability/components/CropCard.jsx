import React from 'react';
import { ArrowRight } from 'lucide-react';

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
      className="group flex flex-col text-left bg-white rounded-2xl border border-slate-200 hover:border-[#16a34a]/60 overflow-hidden cursor-pointer"
    >
      {/* Crop Photo Header */}
      <div className="relative h-40 w-full overflow-hidden bg-slate-100">
        <img
          src={photo}
          alt={crop.name}
          loading="lazy"
          className="w-full h-full object-cover saturate-[0.9]"
          onError={(e) => {
            e.target.src = '/crops/oil_palm.webp';
          }}
        />
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-700 shadow-xs border border-white/40">
          {crop.variants?.length || 1} Cultivars
        </div>
      </div>

      {/* Card Content Body */}
      <div className="flex-1 flex flex-col justify-between p-5">
        <div>
          <p className="text-xs font-medium text-slate-500 italic">{crop.scientificName || 'Land Evaluation Model'}</p>
          <h3 className="text-base font-bold text-slate-900 leading-snug mt-0.5 group-hover:text-[#16a34a] transition-colors">
            {crop.name} Suitability
          </h3>
        </div>

        {/* Footer Link */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">{lastRunDateStr}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800 group-hover:text-[#16a34a] transition-colors">
            <span>Open model</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
};

export default CropCard;

