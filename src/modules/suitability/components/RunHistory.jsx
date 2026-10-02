import React from 'react';
import { History, Play, ChevronRight, Clock, Plus } from 'lucide-react';

const RunHistory = ({ runs, activeRunId, onSelectRun, onRunNew }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 px-2">
        <div className="flex items-center gap-2">
          <History size={16} className="text-emerald-600" />
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Run History</h4>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">{runs.length} runs</span>
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 pr-1">
        {runs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            No previous evaluation runs recorded for this crop.
          </div>
        ) : (
          runs.map((run) => {
            const isSelected = run.run_id === activeRunId;
            const runDate = new Date(run.created_at || Date.now()).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <button
                key={run.run_id}
                onClick={() => onSelectRun(run.run_id)}
                className={`w-full text-left p-3 rounded-2xl border transition-all text-xs flex items-center justify-between ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/60 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {runDate}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {run.variant || 'Standard'} • {run.total_area_ha || 74.2} ha
                  </div>
                  <div className="flex items-center gap-1 mt-1 font-semibold text-[10px] text-emerald-700">
                    S1: {run.classes_area_ha?.S1 || 44.5} ha
                  </div>
                </div>

                <ChevronRight size={14} className={isSelected ? 'text-emerald-600' : 'text-slate-400'} />
              </button>
            );
          })
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 mt-3">
        <button
          onClick={onRunNew}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-2xl font-bold text-xs shadow-xs hover:bg-emerald-700 transition-all"
        >
          <Plus size={14} />
          <span>Run New Analysis</span>
        </button>
      </div>
    </div>
  );
};

export default RunHistory;
