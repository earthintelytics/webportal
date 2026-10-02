import React from 'react';
import { TreePine, TrendingUp, ShieldCheck, Sparkles, Download, ArrowUpRight } from 'lucide-react';

const GroupCarbonView = ({ coop }) => {
  return (
    <div className="space-y-6">
      {/* Carbon Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Group Carbon Stock</span>
            <TreePine size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">14,280 t CO₂e</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">+4.2% annual agroforestry sequestration</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Shade Tree Retention</span>
            <TrendingUp size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">38.5%</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Multi-strata canopy density</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Insetting Verification</span>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">Tier 1 Verified</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">IPCC Good Practice Guidance compliant</div>
        </div>
      </div>

      {/* Carbon Ledger & Cluster Aggregation Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-900">Cooperative Group Carbon Ledger</h4>
            <p className="text-xs text-slate-500">Verified biomass growth and tree cover retention per outgrower cluster</p>
          </div>
          <button className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all">
            <Download size={14} />
            <span>Export Insetting Audit CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-6">Outgrower Cluster</th>
                <th className="py-3 px-4">Member Farms</th>
                <th className="py-3 px-4">Total Hectares</th>
                <th className="py-3 px-4">Baseline Carbon (2020)</th>
                <th className="py-3 px-4">Current Carbon (2026)</th>
                <th className="py-3 px-4">Annual Net Gain</th>
                <th className="py-3 px-6 text-right">Insetting Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-6 font-bold text-slate-900">Cluster Alpha (Ovia North)</td>
                <td className="py-3.5 px-4 font-semibold text-slate-800">184 Farms</td>
                <td className="py-3.5 px-4">680.0 ha</td>
                <td className="py-3.5 px-4">4,820 t CO₂e</td>
                <td className="py-3.5 px-4 font-bold text-emerald-800">5,410 t CO₂e</td>
                <td className="py-3.5 px-4 text-emerald-700 font-bold">+98.3 t/yr</td>
                <td className="py-3.5 px-6 text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Verified Inset
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-6 font-bold text-slate-900">Cluster Beta (Iguobazuwa)</td>
                <td className="py-3.5 px-4 font-semibold text-slate-800">142 Farms</td>
                <td className="py-3.5 px-4">540.0 ha</td>
                <td className="py-3.5 px-4">3,640 t CO₂e</td>
                <td className="py-3.5 px-4 font-bold text-emerald-800">4,020 t CO₂e</td>
                <td className="py-3.5 px-4 text-emerald-700 font-bold">+63.3 t/yr</td>
                <td className="py-3.5 px-6 text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Verified Inset
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-6 font-bold text-slate-900">Cluster Delta (Siluko Basin)</td>
                <td className="py-3.5 px-4 font-semibold text-slate-800">154 Farms</td>
                <td className="py-3.5 px-4">620.0 ha</td>
                <td className="py-3.5 px-4">4,310 t CO₂e</td>
                <td className="py-3.5 px-4 font-bold text-emerald-800">4,850 t CO₂e</td>
                <td className="py-3.5 px-4 text-emerald-700 font-bold">+90.0 t/yr</td>
                <td className="py-3.5 px-6 text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Verified Inset
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GroupCarbonView;
