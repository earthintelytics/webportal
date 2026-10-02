import React from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert, ChevronRight } from 'lucide-react';

const FieldTable = ({ fields, onSelectField }) => {
  const getActionRecommendation = (field) => {
    if (field.limiting_factors.some(f => f.toLowerCase().includes('slope'))) {
      return 'Implement contour terracing & vetiver grass strips before planting';
    }
    if (field.limiting_factors.some(f => f.toLowerCase().includes('dry season') || f.toLowerCase().includes('rainfall'))) {
      return 'Install drip / supplementary irrigation; plant drought-resilient clone';
    }
    if (field.limiting_factors.some(f => f.toLowerCase().includes('ph') || f.toLowerCase().includes('soil'))) {
      return 'Apply agricultural lime (2.5 t/ha) to raise pH above 5.0';
    }
    return 'Optimal conditions — proceed with standard planting density';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h4 className="text-base font-bold text-slate-900">Per-Field Suitability Breakdown</h4>
          <p className="text-xs text-slate-500">Limiting factors and practical farmer interventions per parcel</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200/60 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
            <tr>
              <th className="py-3.5 px-6">Field / Block</th>
              <th className="py-3.5 px-4">Class</th>
              <th className="py-3.5 px-4 text-center">S1 %</th>
              <th className="py-3.5 px-4 text-center">S2 %</th>
              <th className="py-3.5 px-4 text-center">S3 %</th>
              <th className="py-3.5 px-4 text-center">N %</th>
              <th className="py-3.5 px-6">Main Limiting Factor</th>
              <th className="py-3.5 px-6">Recommended Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fields.map((field, idx) => {
              const s1 = field.share?.S1 || 0;
              const s2 = field.share?.S2 || 0;
              const s3 = field.share?.S3 || 0;
              const n = field.share?.N || 0;
              const action = getActionRecommendation(field);

              return (
                <tr
                  key={idx}
                  onClick={() => onSelectField && onSelectField(field.field_id)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {field.field_id}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                      field.overall_class === 'S1' ? 'bg-emerald-100 text-emerald-800' :
                      field.overall_class === 'S2' ? 'bg-lime-100 text-lime-800' :
                      field.overall_class === 'S3' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {field.overall_class}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-medium text-slate-700">{s1}%</td>
                  <td className="py-4 px-4 text-center font-medium text-slate-700">{s2}%</td>
                  <td className="py-4 px-4 text-center font-medium text-slate-700">{s3}%</td>
                  <td className="py-4 px-4 text-center font-medium text-slate-700">{n}%</td>
                  <td className="py-4 px-6 font-medium text-slate-800">
                    {field.limiting_factors.length > 0 && field.limiting_factors[0] !== 'None' ? (
                      <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                        <AlertCircle size={14} className="shrink-0" />
                        {field.limiting_factors.join(', ')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                        <CheckCircle2 size={14} className="shrink-0" />
                        None (Ideal)
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-600 max-w-xs">
                    {action}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FieldTable;
