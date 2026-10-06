import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { serviceCall } from '../../../../services/serviceClient';

const CHECK_MS = 5 * 60 * 1000;
const fmt = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * When this organisation's results were last updated: the latest finished
 * run (GET /data/latest), checked every 5 minutes so it changes by itself
 * after a scheduled run. Falls back to the newest satellite date on the time
 * slider; says "No results yet" when there is neither.
 */
const LastUpdated = ({ newestImageDate }) => {
  const [updatedAt, setUpdatedAt] = useState(null);
  useEffect(() => {
    let live = true;
    let t = null;
    const check = () => serviceCall('/data/latest')
      .then((d) => { if (live && d?.updated_at) setUpdatedAt(d.updated_at); })
      .catch((e) => { if (e?.name === 'NotConnectedError' && t) { clearInterval(t); t = null; } });
    t = setInterval(check, CHECK_MS);
    check();
    return () => { live = false; clearInterval(t); };
  }, []);

  const text = updatedAt ? `Results updated ${fmt(updatedAt)}`
    : newestImageDate ? `Latest satellite image ${fmt(newestImageDate)}` : 'No results yet';
  return (
    <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-200 flex items-center gap-2.5 shrink-0" title="Updates by itself after each monitoring run">
      <Calendar size={16} className="text-green-700" />
      <span className="text-sm font-semibold text-gray-700">{text}</span>
    </div>
  );
};

export default LastUpdated;
