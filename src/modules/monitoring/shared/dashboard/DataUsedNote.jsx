import { useCallback } from 'react';
import { Info } from 'lucide-react';
import { useLoader } from '../../../../components/page/useLoader';
import { serviceCall } from '../../../../services/serviceClient';

// Which run a service's results come from (G55).
const KIND_BY_SERVICE = { 'eudr-check': 'eudr_check', 'smallholder-eudr': 'parcel_check' };
const CONFIDENCE = { high: 'High', medium: 'Medium', low: 'Low' };

/**
 * "Data used and limits" for the results on this page: where they came from,
 * how far to trust them and what they cannot say (GET /data/meta). Hidden
 * until the endpoint is on the server; says so when nothing was recorded.
 */
const DataUsedNote = ({ serviceId }) => {
  const kind = KIND_BY_SERVICE[serviceId] || 'monitoring_run';
  const load = useCallback(() => serviceCall(`/data/meta?kind=${kind}`), [kind]);
  const { data, state } = useLoader(load);
  if (state !== 'ready' || !data) return null;
  const sources = (data.sources || []).map((s) => (s.date ? `${s.name} (${s.date})` : s.name));
  return (
    <details className="bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm text-gray-700">
      <summary className="cursor-pointer flex items-center gap-2 font-semibold text-gray-900">
        <Info size={15} className="text-gray-500" /> Data used and limits
        <span className="ml-auto text-xs font-medium text-gray-500">
          Confidence: {CONFIDENCE[data.confidence] || 'not assessed'}
        </span>
      </summary>
      <div className="mt-3 space-y-2">
        <p><span className="font-semibold">Sources:</span> {sources.length ? sources.join('; ') : 'not recorded for this run'}</p>
        {data.finished_at && <p><span className="font-semibold">Latest run:</span> {new Date(data.finished_at).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
        {data.confidence_reason && <p><span className="font-semibold">Why this confidence:</span> {data.confidence_reason}</p>}
        {data.limits?.length > 0 && (
          <ul className="list-disc pl-5 text-gray-600">{data.limits.map((l) => <li key={l}>{l}</li>)}</ul>
        )}
      </div>
    </details>
  );
};

export default DataUsedNote;
