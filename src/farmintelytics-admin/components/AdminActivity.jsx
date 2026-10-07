import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { onAdminActivity } from './activityBus';

/** Thin progress bar while a change is saving, and a short message after it. */
const AdminActivity = () => {
  const [busy, setBusy] = useState(0);
  const [toast, setToast] = useState(null);
  useEffect(() => {
    let timer;
    const off = onAdminActivity((event, n) => {
      setBusy(n);
      if (event.type === 'done') {
        setToast(event);
        clearTimeout(timer);
        timer = setTimeout(() => setToast(null), event.tone === 'good' ? 2500 : 6000);
      }
    });
    return () => { off(); clearTimeout(timer); };
  }, []);
  return (
    <>
      {busy > 0 && <div role="progressbar" aria-label="Saving" className="fixed top-0 inset-x-0 h-1 z-[2000] bg-green-100 overflow-hidden"><div className="h-full w-1/3 bg-green-700 animate-pulse" /></div>}
      {toast && (
        <div role="status" className={`fixed bottom-6 right-6 z-[2000] max-w-sm flex items-start gap-2.5 px-4 py-3 rounded-xl border bg-white text-sm ${toast.tone === 'good' ? 'border-green-200 text-green-900' : 'border-amber-200 text-amber-900'}`}>
          {toast.tone === 'good' ? <CheckCircle2 size={18} className="text-green-700 shrink-0" /> : <AlertTriangle size={18} className="text-amber-600 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}
    </>
  );
};

export default AdminActivity;
