import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { onAdminActivity } from './activityBus';
import { API_BASE, ADMIN_API_BASE } from '../../services/apiBase';
import { copyText } from '../../utils/copyText';

// Sends a problem report to the FarmIntelytics team (POST /support/reports,
// FINDINGS G61). Until that endpoint exists the details are copied instead.
async function sendReport(report) {
  const admin = window.location.pathname.startsWith('/admin');
  const token = localStorage.getItem(admin ? 'fi_admin_token' : 'fi_token');
  try {
    const res = await fetch(`${admin ? ADMIN_API_BASE : API_BASE}/support/reports`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(report),
    });
    if (res.ok) return 'sent';
  } catch { /* offline or not built yet */ }
  try { await copyText(JSON.stringify(report, null, 2)); return 'copied'; } catch { return 'failed'; }
}

/**
 * Feedback for every change, in the admin console and the portal: a thin
 * progress bar while it saves, then "Saved" or the reason it was not saved
 * with a button to report the problem to the FarmIntelytics team.
 */
const AdminActivity = () => {
  const [busy, setBusy] = useState(0);
  const [toast, setToast] = useState(null);
  const [reported, setReported] = useState('');
  useEffect(() => {
    let timer;
    const off = onAdminActivity((event, n) => {
      setBusy(n);
      if (event.type === 'done') {
        setToast(event); setReported('');
        clearTimeout(timer);
        if (event.tone === 'good') timer = setTimeout(() => setToast(null), 2500);
      }
    });
    return () => { off(); clearTimeout(timer); };
  }, []);
  const report = async () => { setReported('sending'); setReported(await sendReport(toast.report)); };
  return (
    <>
      {busy > 0 && <div role="progressbar" aria-label="Saving" className="fixed top-0 inset-x-0 h-1 z-[2000] bg-green-100 overflow-hidden"><div className="h-full w-1/3 bg-green-700 animate-pulse" /></div>}
      {toast && (
        <div role={toast.tone === 'good' ? 'status' : 'alert'} className={`fixed bottom-6 right-6 z-[2000] max-w-sm px-4 py-3 rounded-xl border bg-white text-sm ${toast.tone === 'good' ? 'border-green-200 text-green-900' : 'border-amber-200 text-amber-900'}`}>
          <div className="flex items-start gap-2.5">
            {toast.tone === 'good' ? <CheckCircle2 size={18} className="text-green-700 shrink-0" /> : <AlertTriangle size={18} className="text-amber-600 shrink-0" />}
            <span className="flex-1">{toast.text}</span>
            {toast.tone !== 'good' && <button type="button" onClick={() => setToast(null)} aria-label="Close" className="text-gray-500 hover:text-gray-800"><X size={16} /></button>}
          </div>
          {toast.report && (
            <div className="mt-2 pl-7">
              {!reported && <button type="button" onClick={report} className="text-sm font-semibold text-green-800 underline">Report this problem</button>}
              {reported === 'sending' && <span className="text-xs text-gray-500">Sending…</span>}
              {reported === 'sent' && <span className="text-xs text-green-800">Sent to the FarmIntelytics team. Thank you.</span>}
              {reported === 'copied' && <span className="text-xs text-gray-700">Reporting is not switched on yet. The details are copied: paste them in an email to the FarmIntelytics team.</span>}
              {reported === 'failed' && <span className="text-xs text-gray-700">Could not send or copy the details. Please tell the FarmIntelytics team what you were doing.</span>}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AdminActivity;
