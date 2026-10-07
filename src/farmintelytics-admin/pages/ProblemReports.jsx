import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, RotateCcw, Copy } from 'lucide-react';
import { fetchSupportReports, markSupportReport, fetchOrganizations } from '../../services/adminApi';
import { copyText } from '../../utils/copyText';
import ErrorBanner from '../components/ErrorBanner';
import { Page, Tabs, Empty, Loading, Pill, Button, Modal, Field } from '../components/ui';

const when = (d) => (d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const selectCls = 'px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 outline-none focus:border-green-600';

/**
 * Problem reports: what users sent with "Report this problem" in the portal
 * and the admin console, newest first. The team reads them here and marks
 * them handled.
 */
const ProblemReports = () => {
  const [reports, setReports] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [tab, setTab] = useState('open');
  const [org, setOrg] = useState('');
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [r, o] = await Promise.all([fetchSupportReports(), fetchOrganizations().catch(() => [])]);
      setReports(Array.isArray(r) ? r : []);
      setOrgs(Array.isArray(o) ? o : o?.items || []);
      setState('ready');
    } catch (e) { setError(e.message); setState('error'); }
  }, []);
  // load() is async: its state updates happen after the awaited requests
  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect

  const scoped = useMemo(() => reports.filter((r) => !org || (org === '__team' ? !r.company_id : r.company_id === org)), [reports, org]);
  const openCount = scoped.filter((r) => !r.is_handled).length;
  const shown = scoped.filter((r) => (tab === 'open' ? !r.is_handled : r.is_handled));
  const orgName = (id) => (id ? orgs.find((o) => o.schema_name === id)?.display_name || id : 'FarmIntelytics team');

  const mark = async (r, handled) => {
    setBusy(r.id); setError('');
    try {
      const updated = await markSupportReport(r.id, handled);
      setReports((list) => list.map((x) => (x.id === r.id ? { ...x, ...(updated || {}), is_handled: handled } : x)));
      if (open?.id === r.id) setOpen(null);
    } catch (e) { setError(e.message); } finally { setBusy(null); }
  };
  const copyDetails = async (r) => {
    const text = [`What: ${r.what}`, r.error && `Error: ${r.error}`, r.page && `Page: ${r.page}`, `From: ${r.sender_email} (${r.sender_role || r.sender_type})`, `Organisation: ${orgName(r.company_id)}`, `When: ${r.at || when(r.created_at)}`].filter(Boolean).join('\n');
    try { await copyText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setError('Copy failed: select the text and copy it.'); }
  };

  return (
    <Page eyebrow="Operations" title="Problem reports" text="What people sent with “Report this problem”, newest first. Mark a report handled once it is dealt with.">
      <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={load} />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <Tabs value={tab} onChange={setTab} tabs={[
          { id: 'open', label: 'To handle', count: openCount },
          { id: 'handled', label: 'Handled', count: scoped.length - openCount },
        ]} />
        <select className={selectCls} value={org} onChange={(e) => setOrg(e.target.value)} aria-label="Organisation">
          <option value="">All organisations</option>
          <option value="__team">FarmIntelytics team</option>
          {orgs.map((o) => <option key={o.schema_name} value={o.schema_name}>{o.display_name || o.schema_name}</option>)}
        </select>
      </div>

      {state === 'loading' ? <Loading>Loading reports…</Loading> : shown.length === 0 ? (
        <Empty>{tab === 'open' ? 'Nothing to handle. New reports appear here as soon as someone sends one.' : 'No handled reports yet.'}</Empty>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => (
            <li key={r.id} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <button type="button" onClick={() => setOpen(r)} className="text-left min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">{orgName(r.company_id)}</span>
                    <Pill tone={r.sender_type === 'team' ? 'info' : 'neutral'}>{r.sender_type === 'team' ? 'Team' : 'Client'}</Pill>
                    {r.error && <Pill tone="critical">Error</Pill>}
                  </div>
                  <p className="text-sm text-gray-800 mt-2 line-clamp-2">{r.what}</p>
                  <p className="text-xs text-gray-500 mt-2">{r.sender_email || 'Unknown sender'}{r.page ? ` · ${r.page}` : ''} · {when(r.created_at)}</p>
                  {r.is_handled && <p className="text-xs text-green-800 mt-1">Handled by {r.handled_by || 'the team'} · {when(r.handled_at)}</p>}
                </button>
                <div className="flex gap-2 shrink-0">
                  {r.is_handled
                    ? <Button variant="secondary" onClick={() => mark(r, false)} disabled={busy === r.id}><RotateCcw size={14} />Reopen</Button>
                    : <Button onClick={() => mark(r, true)} disabled={busy === r.id}><Check size={14} />{busy === r.id ? 'Saving…' : 'Mark handled'}</Button>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <Modal title="Problem report" text={`${orgName(open.company_id)} · ${when(open.created_at)}`} onClose={() => setOpen(null)} size="lg"
          footer={<>
            <Button variant="secondary" onClick={() => copyDetails(open)}><Copy size={14} />{copied ? 'Copied' : 'Copy details'}</Button>
            {open.is_handled
              ? <Button variant="secondary" onClick={() => mark(open, false)} disabled={busy === open.id}><RotateCcw size={14} />Reopen</Button>
              : <Button onClick={() => mark(open, true)} disabled={busy === open.id}><Check size={14} />Mark handled</Button>}
          </>}>
          <Field label="What happened"><p className="text-sm text-gray-800 whitespace-pre-wrap">{open.what}</p></Field>
          {open.error && <Field label="Error shown"><pre className="text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-3 whitespace-pre-wrap break-words max-h-60 overflow-auto">{open.error}</pre></Field>}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-gray-500">From</dt><dd className="text-gray-900">{open.sender_email || '—'}{open.sender_role ? ` (${open.sender_role})` : ''}</dd></div>
            <div><dt className="text-xs text-gray-500">Page</dt><dd className="text-gray-900 break-all">{open.page || '—'}</dd></div>
            <div><dt className="text-xs text-gray-500">Time on their device</dt><dd className="text-gray-900">{open.at || '—'}</dd></div>
            <div><dt className="text-xs text-gray-500">Status</dt><dd className="text-gray-900">{open.is_handled ? `Handled by ${open.handled_by || 'the team'}` : 'To handle'}</dd></div>
          </dl>
        </Modal>
      )}
    </Page>
  );
};

export default ProblemReports;
