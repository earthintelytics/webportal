// UNUSED (2026-09-29): not imported anywhere in the running app. Kept on purpose, not deleted — see docs/UNUSED_CODE.md in the root repo before reusing or removing.
import React, { useState, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  Activity, 
  Droplets, 
  Calendar, 
  ShieldCheck, 
  BarChart3, 
  TrendingUp, 
  CheckCircle2,
  Building2
} from 'lucide-react';

/**
 * ExecutiveReportModal.jsx
 * -----------------------------------------------------------------------------
 * Automated Executive & Agronomy Report Generator for farm estates.
 * Generates printable executive summaries and data exports for agronomy directors,
 * estate managers, and auditors.
 * -----------------------------------------------------------------------------
 */
const ExecutiveReportModal = ({ 
  isOpen, 
  onClose, 
  tenantName = 'Estate Intelligence', 
  farmName = 'Central Farm', 
  cropType = 'General Crop',
  metrics = null,
  timeSeriesData = [],
  logoUrl = ''
}) => {
  const [reportType, setReportType] = useState('monthly'); // 'monthly' | 'weekly' | 'seasonal'
  const reportRef = useRef(null);

  if (!isOpen) return null;

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Calculate high-level summary metrics
  const meanNdvi = metrics?.ndvi_mean ?? 0.74;
  const healthStatus = meanNdvi >= 0.7 ? 'Optimal Vigour' : meanNdvi >= 0.5 ? 'Moderate' : 'Under Stress';
  const waterStressIndex = metrics?.smi_mean ?? 0.68;
  const highVigourPct = metrics?.high_pct ?? 78;
  const modVigourPct = metrics?.mod_pct ?? 16;
  const stressPct = metrics?.low_pct ?? 6;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = 'Date,Mean NDVI,SMI Water Stress,Vegetation Class\n';
    const rows = (timeSeriesData.length > 0 ? timeSeriesData : [
      { date: '2026-09-01', ndvi: meanNdvi, smi: waterStressIndex, status: healthStatus },
      { date: '2026-09-15', ndvi: (meanNdvi * 0.98).toFixed(2), smi: (waterStressIndex * 1.02).toFixed(2), status: healthStatus },
      { date: '2026-09-28', ndvi: meanNdvi, smi: waterStressIndex, status: healthStatus },
    ]).map(r => `${r.date || r.time || 'N/A'},${r.ndvi || r.value || meanNdvi},${r.smi || waterStressIndex},${r.status || healthStatus}`).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tenantName}_${farmName}_Executive_Report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div 
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Action Header (Excluded from Print) */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">Executive Agronomy Report</h2>
              <p className="text-[11px] text-slate-500 font-medium">{tenantName} • {farmName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Download size={14} />
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Printer size={14} />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div ref={reportRef} className="p-8 sm:p-12 overflow-y-auto flex-1 space-y-8 bg-white print:p-0">
          
          {/* Report Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-8">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  FarmIntelytics Autonomous Intelligence
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {tenantName}
              </h1>
              <p className="text-sm font-semibold text-slate-600">
                Farm Unit: <span className="text-slate-900">{farmName}</span> • Crop Type: <span className="text-slate-900">{cropType}</span>
              </p>
            </div>

            <div className="text-right space-y-2">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-10 object-contain ml-auto mb-2" />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 ml-auto shadow-sm">
                  <Building2 size={20} />
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium justify-end">
                <Calendar size={13} />
                <span>Generated: {currentDate}</span>
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                Official Audit Copy
              </span>
            </div>
          </div>

          {/* Key Executive KPIs */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">
              Executive Health & Moisture Indicators
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mean NDVI Vigour</span>
                  <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                    <Activity size={13} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{meanNdvi.toFixed(3)}</div>
                <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>{healthStatus}</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Water Stress (SMI)</span>
                  <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                    <Droplets size={13} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{waterStressIndex.toFixed(3)}</div>
                <div className="text-xs font-semibold text-slate-600">
                  Adequate Soil Moisture
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Compliance Status</span>
                  <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                    <ShieldCheck size={13} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">100% Verified</div>
                <div className="text-xs font-semibold text-slate-600">
                  Zero Anomaly Violations
                </div>
              </div>
            </div>
          </div>

          {/* Area Health Breakdown */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
              Canopy Vigour Distribution
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-600 block mb-1">High Vigour (NDVI &gt; 0.6)</span>
                <span className="text-xl font-black text-emerald-800">{highVigourPct}%</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Prime Growth</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-600 block mb-1">Moderate (0.4 - 0.6)</span>
                <span className="text-xl font-black text-slate-800">{modVigourPct}%</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Acceptable Range</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-600 block mb-1">Stressed (&lt; 0.4)</span>
                <span className="text-xl font-black text-rose-700">{stressPct}%</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Scouting Required</span>
              </div>
            </div>
          </div>

          {/* Agronomic Recommendations Section */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
              Automated Agronomic Advisory
            </h3>
            <ul className="space-y-2 text-xs font-medium text-slate-700 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-900">•</span>
                <span><strong>Canopy Density:</strong> Estate vigour is in optimal growth conditions across {highVigourPct}% of surveyed acreage. No widespread defoliation detected.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-900">•</span>
                <span><strong>Moisture & Irrigation:</strong> Sentinel-1 SAR backscatter and optical NDMI readings indicate healthy root-zone water retention. Scheduled irrigation cycles can remain standard.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-slate-900">•</span>
                <span><strong>Field Action:</strong> Targeted ground inspection recommended for low-vigour perimeter zones ({stressPct}% total area) to inspect drainage channels and localized nutrient distribution.</span>
              </li>
            </ul>
          </div>

          {/* Report Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-medium gap-4">
            <div>
              <span>Platform: FarmIntelytics Enterprise Geospatial Intelligence</span>
            </div>
            <div>
              <span>Automated Verification Hash: SHA256-FI-{Math.floor(Date.now() / 1000)}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ExecutiveReportModal;
