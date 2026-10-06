import { useCallback, useState } from 'react';
import { fetchSuitabilityThresholds } from '../../../services/adminApi';
import { Card, NotConnectedNote, ErrorNote, EmptyState } from '../../../components/page/PageKit';
import { useLoader } from '../../../components/page/useLoader';
import { CROPS } from '../suitabilityLabels';

/**
 * The factor ranges and advice in use for a crop, read from the admin
 * settings (read-only here; edit them in Admin → Map classes and suitability).
 */
const FactorGuide = ({ companyId, cropId }) => {
  const [picked, setCrop] = useState(CROPS[0]);
  const crop = (cropId && CROPS.find((c) => c.id === cropId)) || picked;
  const load = useCallback(() => fetchSuitabilityThresholds(crop.admin, companyId || ''), [crop, companyId]);
  const { data, state, error, reload } = useLoader(load);
  const factors = data?.factors || [];
  const actions = Object.entries(data?.farmer_actions || {}).filter(([, v]) => v);

  return (
    <div className="space-y-6">
      {!cropId && <div className="flex flex-wrap gap-2">
        {CROPS.map((c) => (
          <button key={c.id} type="button" onClick={() => setCrop(c)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${crop.id === c.id ? 'bg-green-50 border-green-600 text-green-800' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}>{c.name}</button>
        ))}
      </div>}
      {state === 'not_connected' && <NotConnectedNote what="Suitability settings" />}
      {state === 'error' && <ErrorNote message={error} onRetry={reload} />}
      {state === 'ready' && factors.length === 0 && <EmptyState title="No factors set" text="Set the factor ranges for this crop in Admin → Map classes and suitability." />}
      {factors.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
              <tr><th className="px-5 py-3">Factor</th><th className="px-5 py-3">Well suited</th><th className="px-5 py-3">Suited</th><th className="px-5 py-3">Marginal</th><th className="px-5 py-3">Not suited</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {factors.map((f) => (
                <tr key={f.name}>
                  <td className="px-5 py-3"><p className="font-semibold text-gray-900">{f.name}</p><p className="text-xs text-gray-500">{f.unit}</p></td>
                  {['optimal', 'suitable', 'marginal', 'unsuitable'].map((k) => <td key={k} className="px-5 py-3 font-mono text-gray-700">{f[k] || '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {actions.length > 0 && (
        <Card className="p-5 space-y-2">
          <p className="text-sm font-semibold text-gray-800">Advice shown when a factor limits a field</p>
          {actions.map(([k, v]) => <p key={k} className="text-sm text-gray-700"><span className="text-gray-500">{k.replace('_', ' ')}:</span> {v}</p>)}
        </Card>
      )}
      <p className="text-xs text-gray-500">Read-only. The FarmIntelytics team edits these in Admin → Map classes and suitability.</p>
    </div>
  );
};

export default FactorGuide;
