import React from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';

const FactorPopup = ({ field, onClose }) => {
  if (!field) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            {field.field_id?.slice(0, 2) || 'FL'}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{field.field_id}</h3>
            <span className="text-xs font-semibold text-emerald-600">Suitability Class: {field.overall_class}</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-4 font-medium">{field.summary}</p>

        <div className="space-y-2.5 bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 text-xs">
          <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2">Evaluated Agronomic Factors</div>
          <div className="flex justify-between py-1 border-b border-slate-200/50">
            <span className="text-slate-500">Limiting Factor:</span>
            <span className="font-semibold text-slate-800">{field.limiting_factors?.join(', ') || 'None'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/50">
            <span className="text-slate-500">S1 Area Share:</span>
            <span className="font-semibold text-emerald-600">{field.share?.S1 || 0}%</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/50">
            <span className="text-slate-500">S2 Area Share:</span>
            <span className="font-semibold text-lime-600">{field.share?.S2 || 0}%</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">S3 / N Area Share:</span>
            <span className="font-semibold text-amber-600">{(field.share?.S3 || 0) + (field.share?.N || 0)}%</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-xs hover:bg-emerald-700 transition-colors"
        >
          Close Detail View
        </button>
      </div>
    </div>
  );
};

export default FactorPopup;
