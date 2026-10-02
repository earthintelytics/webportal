import React from 'react';
import { ShieldCheck, Download, FileText, CheckCircle2, Globe, AlertCircle } from 'lucide-react';

const EudrPassportView = ({ members, coop }) => {
  const handleDownloadGeoJson = (m) => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            member_id: m.id,
            farmer_name: m.name,
            commodity: m.primary_crop,
            area_ha: m.area_ha,
            eudr_cutoff_date: '2020-12-31',
            baseline_status: 'Deforestation-Free Confirmed',
            certification: m.certification,
            cooperative: coop.name
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [5.312, 6.442],
                [5.318, 6.442],
                [5.319, 6.438],
                [5.311, 6.437],
                [5.312, 6.442]
              ]
            ]
          }
        }
      ]
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EUDR_Passport_${m.id}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* EUDR Compliance Overview Banner */}
      <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={20} className="text-emerald-400" />
            <h3 className="text-lg font-bold">EUDR Deforestation-Free Clearance Ledger</h3>
          </div>
          <p className="text-xs text-emerald-200 max-w-2xl leading-relaxed">
            All member polygons in {coop.name} are verified against the 31 December 2020 ESA WorldCover & JRC Global Forest Cover baseline. Certified ready for EU customs declaration.
          </p>
        </div>
        <div className="bg-emerald-800/80 border border-emerald-700 p-3.5 rounded-xl text-center shrink-0">
          <div className="text-2xl font-black text-white">100%</div>
          <div className="text-[10px] text-emerald-200 uppercase tracking-wider font-bold">Clearance Rate</div>
        </div>
      </div>

      {/* Member Passports List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-900">Member EUDR Due Diligence Passports</h4>
            <p className="text-xs text-slate-500">Download audited GeoJSON packages for export terminal clearance</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-6">Member ID & Name</th>
                <th className="py-3 px-4">Cluster</th>
                <th className="py-3 px-4">Commodity</th>
                <th className="py-3 px-4">Hectares</th>
                <th className="py-3 px-4">2020 Forest Baseline</th>
                <th className="py-3 px-4">Deforestation Risk</th>
                <th className="py-3 px-6 text-right">EUDR Due Diligence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-slate-900">
                    <div>{m.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{m.id}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">{m.cluster}</td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-800">{m.primary_crop}</td>
                  <td className="py-3.5 px-4">{m.area_ha} ha</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                      <CheckCircle2 size={13} />
                      <span>Zero Loss Post-2020</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      0.0% Negligible
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => handleDownloadGeoJson(m)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                    >
                      <Download size={13} />
                      <span>EUDR Passport</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EudrPassportView;
