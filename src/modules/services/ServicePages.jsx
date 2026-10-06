import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Lightbulb, ArrowRight, Info } from 'lucide-react';
import { serviceCall } from '../../services/serviceClient';

/**
 * Service page kinds: Check, Log, Advice (docs/services/00-shared-principles.md).
 * Same design as every page. Each reads its backend endpoint from the shared
 * contract (docs/WORK_SPLIT.md) and says so honestly until it exists.
 */
const getJson = (path) => serviceCall(path);

const Header = ({ title, text, icon }) => (
  <div className="flex items-start gap-4">
    <span className="w-11 h-11 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-700 shrink-0">{icon}</span>
    <div>
      <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h2>
      <p className="text-sm text-gray-500 font-medium mt-2 max-w-2xl">{text}</p>
    </div>
  </div>
);
const Note = ({ children }) => <div className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50/60 px-5 py-4 text-sm text-sky-900"><Info size={18} className="shrink-0 mt-0.5" /><div>{children}</div></div>;
const Card = ({ className = '', children }) => <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}>{children}</div>;

const CHECK = {
  pass: ['No deforestation found', 'bg-green-50 text-green-800 border-green-200'],
  review: ['Needs review', 'bg-amber-50 text-amber-800 border-amber-200'],
  fail: ['Deforestation found', 'bg-red-50 text-red-700 border-red-200'],
  not_checked: ['Not checked', 'bg-gray-50 text-gray-600 border-gray-200'],
};

// Check: per-plot result with the evidence behind it (EUDR)
export function CheckPage({ page, plots, onOpenData }) {
  const [results, setResults] = useState(null);
  const [connected, setConnected] = useState(true);
  const [picked, setPicked] = useState(null);
  useEffect(() => {
    let active = true;
    getJson('/eudr/plots').then(r => { if (active) setResults(Array.isArray(r) ? r : []); }).catch(() => { if (active) { setConnected(false); setResults([]); } });
    return () => { active = false; };
  }, []);
  const rows = useMemo(() => (plots || []).map(p => ({ plot: p, r: (results || []).find(x => String(x.plot_id) === String(p.id)) || { status: 'not_checked' } })), [plots, results]);
  const counts = rows.reduce((c, x) => ({ ...c, [x.r.status]: (c[x.r.status] || 0) + 1 }), {});
  const sel = rows.find(x => x.plot.id === picked) || rows[0];

  return (
    <div className="p-10 space-y-8">
      <Header title={page.title} text={page.text} icon={<ShieldCheck size={20} />} />
      {!connected && <Note>The check is being rebuilt on the EU reference forest map (JRC GFC2020), yearly tree-cover loss and radar alerts. Until it runs, every plot shows <strong>Not checked</strong>; nothing is marked deforestation-free without a real check.</Note>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(CHECK).map(([k, [label]]) => (
          <Card key={k} className="px-5 py-4"><div className="text-xs font-semibold text-gray-600">{label}</div><div className="text-2xl font-bold text-gray-900 mt-1">{counts[k] || 0}</div></Card>
        ))}
      </div>
      {rows.length === 0 ? (
        <Card className="p-10 text-center text-sm text-gray-600">No registered plots yet. Plots appear once their boundaries are uploaded, and the commodity per plot comes from the EUDR plot register (<button onClick={onOpenData} className="font-semibold text-green-700 hover:underline">Farm data</button>).</Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600"><tr><th className="px-5 py-3">Plot</th><th className="px-5 py-3">Estate</th><th className="px-5 py-3">Result</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(({ plot, r }) => (
                  <tr key={plot.id} onClick={() => setPicked(plot.id)} className={`cursor-pointer ${sel?.plot.id === plot.id ? 'bg-green-50/40' : 'hover:bg-gray-50'}`}>
                    <td className="px-5 py-3 font-semibold text-gray-900">{plot.name || plot.id}</td>
                    <td className="px-5 py-3 text-gray-700">{plot.subfarm || '—'}</td>
                    <td className="px-5 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${CHECK[r.status]?.[1] || CHECK.not_checked[1]}`}>{CHECK[r.status]?.[0] || 'Not checked'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          {sel && (
            <Card className="p-6 space-y-4">
              <div className="text-sm font-semibold text-gray-900">Evidence: {sel.plot.name || sel.plot.id}</div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[['Forest on 31 Dec 2020', sel.r.forest_2020_pct != null ? `${sel.r.forest_2020_pct}%` : '—'], ['Loss after cut-off', sel.r.loss_after_cutoff_ha != null ? `${sel.r.loss_after_cutoff_ha} ha${sel.r.loss_year ? ` (${sel.r.loss_year})` : ''}` : '—'], ['Protected area overlap', sel.r.protected_overlap != null ? String(sel.r.protected_overlap) : '—'], ['Geolocation', sel.r.geolocation || (sel.plot.coords?.length > 2 ? 'polygon' : 'point')], ['Checked on', sel.r.checked_at ? new Date(sel.r.checked_at).toLocaleDateString() : '—']].map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-gray-500">{k}</dt><dd className="font-semibold text-gray-900">{v}</dd></div>
                ))}
              </dl>
              <div className="text-xs text-gray-500">Sources: {(sel.r.sources || []).join(', ') || 'shown here once the check has run'}.</div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

const SEV = { Critical: ['Act now', 'bg-red-50 text-red-700 border-red-200'], Warning: ['This week', 'bg-amber-50 text-amber-800 border-amber-200'] };
export function AdvicePage({ page, alerts, onAsk }) {
  const active = (alerts || []).filter(a => a.status === 'Active' || !a.status);
  const sorted = [...active].sort((a, b) => (a.severity === 'Critical' ? 0 : 1) - (b.severity === 'Critical' ? 0 : 1));
  return (
    <div className="p-10 space-y-8">
      <Header title={page.title} text={page.text} icon={<Lightbulb size={20} />} />
      <Note>Built from your live alerts. Advice written for each crop and stage (for example, top-dress now because the window closes next week) comes with the advisor rules being connected; meanwhile ask the Assistant for a what-if on any field.</Note>
      {sorted.length === 0 ? (
        <Card className="p-10 text-center text-sm text-gray-600">Nothing needs action this week. New alerts from the monitoring pipeline appear here as advice.</Card>
      ) : (
        <div className="space-y-3">
          {sorted.map(a => {
            const [label, cls] = SEV[a.severity] || ['Keep an eye on', 'bg-gray-50 text-gray-700 border-gray-200'];
            return (
              <Card key={a.id} className="p-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{label}</span><span className="text-sm font-semibold text-gray-900">{a.plot}{a.estate ? ` · ${a.estate}` : ''}</span></div>
                  <p className="text-sm text-gray-700 mt-2">{a.desc}</p>
                  <p className="text-xs text-gray-500 mt-1">{a.category} · {a.date}</p>
                </div>
                <button onClick={() => onAsk?.(`What should we do about this on ${a.plot}: ${a.desc}`)} className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-green-700 border border-green-200 hover:bg-green-50">Ask the advisor <ArrowRight size={14} /></button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
