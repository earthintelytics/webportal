import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { serviceCall } from '../../../../services/serviceClient';

const CHECK_MS = 5 * 60 * 1000;

/**
 * Tells the user when a pipeline run has finished since the page loaded
 * (contract "Data freshness", G42: GET /data/latest → { updated_at }), so maps,
 * KPIs and tables can be refreshed. Shows nothing until the endpoint exists.
 */
const NewResultsBanner = ({ farmId }) => {
  const first = useRef(null);
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    let live = true;
    const check = () => serviceCall(`/data/latest${farmId ? `?farm_id=${encodeURIComponent(farmId)}` : ''}`)
      .then((d) => {
        if (!live || !d?.updated_at) return;
        if (first.current == null) first.current = d.updated_at;
        else if (d.updated_at !== first.current) setFresh(true);
      })
      .catch(() => {});
    check();
    const t = setInterval(check, CHECK_MS);
    return () => { live = false; clearInterval(t); };
  }, [farmId]);

  if (!fresh) return null;
  return (
    <div className="flex items-center justify-between gap-4 px-8 py-2.5 bg-sky-50 border-b border-sky-200 text-sm text-sky-900">
      <span>New results are in from the latest satellite run.</span>
      <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 bg-white font-medium">
        <RefreshCw size={14} />Refresh
      </button>
    </div>
  );
};

export default NewResultsBanner;
