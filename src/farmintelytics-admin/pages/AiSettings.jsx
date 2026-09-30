import { useEffect, useMemo, useState } from 'react';
import { KeyRound, BarChart3, Gauge, Check, Info, PlugZap } from 'lucide-react';
import { fetchAiSettings, saveAiSettings, saveAiProvider, testAiProvider, saveAiPrices, fetchAiUsage, fetchAiLimits, saveAiLimits, AiNotConnected } from '../../services/aiAdminApi';
import { fetchOrganizations } from '../../services/adminApi';

/**
 * AI settings (super admin): API keys and models, usage and cost, limits.
 * Keys are write-only: the page never receives a stored key back, only
 * whether one is set and its last four characters.
 */
const PROVIDERS = [
  { id: 'gemini', label: 'Google Gemini', hint: 'Key from Google AI Studio or Vertex AI' },
  { id: 'openai', label: 'OpenAI', hint: 'Key from platform.openai.com' },
  { id: 'anthropic', label: 'Anthropic Claude', hint: 'Key from console.anthropic.com' },
];
const FEATURES = [
  { id: 'assistant', label: 'Assistant (questions and scenarios)' },
  { id: 'reports', label: 'Report summaries and advice' },
  { id: 'advisor', label: 'Farm advisor wording' },
];
const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 outline-none focus:border-green-600';
const Card = ({ className = '', children }) => <div className={`bg-white rounded-2xl border border-gray-200 ${className}`}>{children}</div>;
const money = (v, cur = 'USD') => (v == null ? '—' : new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, maximumFractionDigits: 2 }).format(v));
const num = (v) => (v == null ? '—' : new Intl.NumberFormat().format(v));
const iso = (d) => d.toISOString().slice(0, 10);

function NotConnected() {
  return <div className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50/60 px-5 py-4 text-sm text-sky-900"><Info size={18} className="shrink-0 mt-0.5" /><div>The AI settings service is being connected. Until then the AI uses the keys set on the server, and usage is not recorded here.</div></div>;
}

function ProvidersTab({ settings, setSettings, connected }) {
  const [keys, setKeys] = useState({});
  const [msg, setMsg] = useState({});
  const [busy, setBusy] = useState('');
  const prov = (id) => settings?.providers?.find(p => p.id === id) || { id, configured: false, enabled: false, models: [], default_model: '' };
  const saveKey = async (id) => {
    const key = (keys[id] || '').trim();
    if (key && key.length < 20) return setMsg(m => ({ ...m, [id]: 'This key looks too short.' }));
    setBusy(id);
    try { const r = await saveAiProvider(id, { ...(key ? { api_key: key } : {}), enabled: prov(id).enabled, default_model: prov(id).default_model }); setSettings(s => ({ ...s, providers: (s?.providers || []).filter(p => p.id !== id).concat(r) })); setKeys(k => ({ ...k, [id]: '' })); setMsg(m => ({ ...m, [id]: 'Saved.' })); }
    catch (e) { setMsg(m => ({ ...m, [id]: e instanceof AiNotConnected ? 'Not connected yet.' : e.message })); }
    finally { setBusy(''); }
  };
  const test = async (id) => {
    setBusy(id);
    try { const r = await testAiProvider(id); setMsg(m => ({ ...m, [id]: r.ok ? `Works (${r.latency_ms} ms).` : `Failed: ${r.message}` })); }
    catch (e) { setMsg(m => ({ ...m, [id]: e instanceof AiNotConnected ? 'Not connected yet.' : e.message })); }
    finally { setBusy(''); }
  };
  const updateProv = (id, patch) => setSettings(s => ({ ...s, providers: [...(s?.providers || []).filter(p => p.id !== id), { ...prov(id), ...patch }] }));
  const saveGeneral = async () => {
    try { await saveAiSettings({ default_provider: settings.default_provider, fallback_provider: settings.fallback_provider, features: settings.features }); setMsg(m => ({ ...m, general: 'Saved.' })); }
    catch (e) { setMsg(m => ({ ...m, general: e instanceof AiNotConnected ? 'Not connected yet.' : e.message })); }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {PROVIDERS.map(p => {
          const s = prov(p.id);
          return (
            <Card key={p.id} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">{p.label}</div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${s.configured ? 'bg-green-50 text-green-800 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{s.configured ? `Key set ···${s.key_last4 || ''}` : 'No key'}</span>
              </div>
              <label className="block space-y-1.5"><span className="text-xs font-semibold text-gray-700">{s.configured ? 'Replace key' : 'API key'}</span>
                <input type="password" autoComplete="off" className={inputCls} value={keys[p.id] || ''} onChange={e => setKeys(k => ({ ...k, [p.id]: e.target.value }))} placeholder={p.hint} />
              </label>
              <label className="block space-y-1.5"><span className="text-xs font-semibold text-gray-700">Model</span>
                {s.models?.length ? <select className={inputCls} value={s.default_model} onChange={e => updateProv(p.id, { default_model: e.target.value })}>{s.models.map(m => <option key={m}>{m}</option>)}</select>
                  : <input className={inputCls} value={s.default_model || ''} onChange={e => updateProv(p.id, { default_model: e.target.value })} placeholder="Model name" />}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-800"><input type="checkbox" className="w-4 h-4 accent-green-700" checked={Boolean(s.enabled)} onChange={e => updateProv(p.id, { enabled: e.target.checked })} />Allowed</label>
              <div className="flex gap-2">
                <button onClick={() => saveKey(p.id)} disabled={busy === p.id || !connected} className="px-4 py-2 rounded-xl bg-green-700 text-white text-sm font-semibold disabled:bg-gray-200 disabled:text-gray-500">Save</button>
                <button onClick={() => test(p.id)} disabled={busy === p.id || !s.configured || !connected} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 disabled:opacity-50"><PlugZap size={14} />Test</button>
              </div>
              {msg[p.id] && <div className="text-xs text-gray-600">{msg[p.id]}</div>}
            </Card>
          );
        })}
      </div>
      <Card className="p-6 space-y-4">
        <div className="text-sm font-semibold text-gray-900">Which AI to use</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[['default_provider', 'Main provider'], ['fallback_provider', 'Fallback if the main one fails']].map(([k, label]) => (
            <label key={k} className="block space-y-1.5"><span className="text-xs font-semibold text-gray-700">{label}</span>
              <select className={inputCls} value={settings?.[k] || ''} onChange={e => setSettings(s => ({ ...s, [k]: e.target.value }))}><option value="">None</option>{PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
            </label>
          ))}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-700">Where AI is used</div>
          {FEATURES.map(f => <label key={f.id} className="flex items-center gap-2 text-sm text-gray-800"><input type="checkbox" className="w-4 h-4 accent-green-700" checked={settings?.features?.[f.id] !== false} onChange={e => setSettings(s => ({ ...s, features: { ...(s?.features || {}), [f.id]: e.target.checked } }))} />{f.label}</label>)}
          <div className="text-xs text-gray-500">When AI is off or unavailable, pages fall back to plain template wording.</div>
        </div>
        <div className="flex items-center gap-3"><button onClick={saveGeneral} disabled={!connected} className="px-5 py-2.5 rounded-xl bg-green-700 text-white text-sm font-semibold disabled:bg-gray-200 disabled:text-gray-500">Save</button>{msg.general && <span className="text-xs text-gray-600">{msg.general}</span>}</div>
      </Card>
      <PricesCard settings={settings} setSettings={setSettings} connected={connected} />
    </div>
  );
}

function PricesCard({ settings, setSettings, connected }) {
  const [msg, setMsg] = useState('');
  const prices = settings?.prices || [];
  const set = (i, patch) => setSettings(s => ({ ...s, prices: prices.map((p, j) => (j === i ? { ...p, ...patch } : p)) }));
  const save = async () => {
    if (prices.some(p => !p.model || p.input_per_1m < 0 || p.output_per_1m < 0)) return setMsg('Every row needs a model and non-negative prices.');
    try { await saveAiPrices(prices); setMsg('Saved.'); } catch (e) { setMsg(e instanceof AiNotConnected ? 'Not connected yet.' : e.message); }
  };
  return (
    <Card className="p-6 space-y-4">
      <div><div className="text-sm font-semibold text-gray-900">Prices used to work out cost</div><div className="text-xs text-gray-500 mt-1">Per million tokens, from each provider's price page. Providers change prices, so keep these current; cost figures use this table.</div></div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs font-semibold text-gray-500"><tr><th className="py-2">Provider</th><th className="py-2">Model</th><th className="py-2">Input (per 1M)</th><th className="py-2">Output (per 1M)</th><th className="py-2">Currency</th></tr></thead>
        <tbody className="divide-y divide-gray-100">
          {prices.map((p, i) => (
            <tr key={i}>
              <td className="py-2 pr-2"><select className={inputCls} value={p.provider} onChange={e => set(i, { provider: e.target.value })}>{PROVIDERS.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}</select></td>
              <td className="py-2 pr-2"><input className={inputCls} value={p.model} onChange={e => set(i, { model: e.target.value })} /></td>
              <td className="py-2 pr-2"><input type="number" min="0" step="0.01" className={inputCls} value={p.input_per_1m} onChange={e => set(i, { input_per_1m: Number(e.target.value) })} /></td>
              <td className="py-2 pr-2"><input type="number" min="0" step="0.01" className={inputCls} value={p.output_per_1m} onChange={e => set(i, { output_per_1m: Number(e.target.value) })} /></td>
              <td className="py-2"><input className={inputCls} value={p.currency || 'USD'} onChange={e => set(i, { currency: e.target.value.toUpperCase().slice(0, 3) })} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-3">
        <button onClick={() => setSettings(s => ({ ...s, prices: [...prices, { provider: 'gemini', model: '', input_per_1m: 0, output_per_1m: 0, currency: 'USD' }] }))} className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700">Add model</button>
        <button onClick={save} disabled={!connected} className="px-5 py-2 rounded-xl bg-green-700 text-white text-sm font-semibold disabled:bg-gray-200 disabled:text-gray-500">Save prices</button>
        {msg && <span className="text-xs text-gray-600">{msg}</span>}
      </div>
    </Card>
  );
}

function UsageTab({ connected, orgNames }) {
  const [range, setRange] = useState(() => { const t = new Date(); const f = new Date(t); f.setDate(1); return { from: iso(f), to: iso(t) }; });
  const [group, setGroup] = useState('organisation');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!connected) return undefined;
    let active = true;
    fetchAiUsage({ ...range, group }).then(d => { if (active) { setData(d); setError(''); } }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [range, group, connected]);
  const tot = data?.totals || {};
  const cur = data?.currency || 'USD';
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input type="date" className="px-3 py-2 rounded-xl border border-gray-300 text-sm" value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} />
        <span className="text-sm text-gray-500">to</span>
        <input type="date" className="px-3 py-2 rounded-xl border border-gray-300 text-sm" value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} />
        <span className="text-xs font-semibold text-gray-500 ml-2">Group by</span>
        {[['organisation', 'Organisation'], ['user', 'User'], ['feature', 'Feature'], ['model', 'Model'], ['day', 'Day']].map(([id, label]) => (
          <button key={id} onClick={() => setGroup(id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${group === id ? 'bg-green-50 border-green-600 text-green-800' : 'bg-white border-gray-300 text-gray-600'}`}>{label}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['Requests', num(tot.requests)], ['Input tokens', num(tot.input_tokens)], ['Output tokens', num(tot.output_tokens)], ['Cost', money(tot.cost, cur)]].map(([k, v]) => (
          <Card key={k} className="px-5 py-4"><div className="text-xs font-semibold text-gray-600">{k}</div><div className="text-2xl font-bold text-gray-900 mt-1">{connected ? v : '—'}</div></Card>
        ))}
      </div>
      {error && <div className="text-sm text-red-700">{error}</div>}
      <Card className="overflow-hidden">
        {!connected || !data?.rows?.length ? <div className="p-10 text-center text-sm text-gray-500">{connected ? 'No AI use in this period.' : 'Usage appears here once the AI settings service records it.'}</div> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600"><tr><th className="px-5 py-3 capitalize">{group}</th><th className="px-5 py-3">Requests</th><th className="px-5 py-3">Tokens in / out</th><th className="px-5 py-3">Cost</th><th className="px-5 py-3">Of limit</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {data.rows.map(r => (
                <tr key={r.key}>
                  <td className="px-5 py-3 font-semibold text-gray-900">{group === 'organisation' ? (orgNames[r.key] || r.key) : r.label || r.key}</td>
                  <td className="px-5 py-3">{num(r.requests)}</td>
                  <td className="px-5 py-3">{num(r.input_tokens)} / {num(r.output_tokens)}</td>
                  <td className="px-5 py-3">{money(r.cost, cur)}</td>
                  <td className="px-5 py-3">{r.limit_pct == null ? '—' : <span className={r.limit_pct >= 100 ? 'text-red-700 font-semibold' : r.limit_pct >= 80 ? 'text-amber-700 font-semibold' : ''}>{Math.round(r.limit_pct)}%</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function LimitsTab({ connected, orgs }) {
  const [limits, setLimits] = useState({ org_limits: [], user_daily_requests: null, alert_at_pct: 80, on_exceed: 'fallback' });
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (!connected) return undefined;
    let active = true;
    fetchAiLimits().then(d => { if (active && d) setLimits(l => ({ ...l, ...d })); }).catch(() => {});
    return () => { active = false; };
  }, [connected]);
  const orgLimit = (id) => limits.org_limits.find(o => o.company_id === id) || { company_id: id, monthly_budget: '', monthly_tokens: '' };
  const setOrg = (id, patch) => setLimits(l => ({ ...l, org_limits: [...l.org_limits.filter(o => o.company_id !== id), { ...orgLimit(id), ...patch }] }));
  const save = async () => {
    const bad = limits.org_limits.some(o => (o.monthly_budget !== '' && Number(o.monthly_budget) < 0) || (o.monthly_tokens !== '' && Number(o.monthly_tokens) < 0));
    if (bad || (limits.user_daily_requests != null && limits.user_daily_requests < 0) || limits.alert_at_pct < 1 || limits.alert_at_pct > 100) return setMsg('Limits must be positive, and the alert level between 1 and 100%.');
    try { await saveAiLimits(limits); setMsg('Saved.'); } catch (e) { setMsg(e instanceof AiNotConnected ? 'Not connected yet.' : e.message); }
  };
  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="text-sm font-semibold text-gray-900">For everyone</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-gray-700">Requests per user per day</span><input type="number" min="0" className={inputCls} value={limits.user_daily_requests ?? ''} onChange={e => setLimits(l => ({ ...l, user_daily_requests: e.target.value === '' ? null : Number(e.target.value) }))} placeholder="No limit" /></label>
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-gray-700">Warn at (% of a limit)</span><input type="number" min="1" max="100" className={inputCls} value={limits.alert_at_pct} onChange={e => setLimits(l => ({ ...l, alert_at_pct: Number(e.target.value) }))} /></label>
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-gray-700">When a limit is reached</span>
            <select className={inputCls} value={limits.on_exceed} onChange={e => setLimits(l => ({ ...l, on_exceed: e.target.value }))}><option value="fallback">Keep working with template wording</option><option value="block">Stop AI until next period</option></select>
          </label>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="px-6 pt-5 pb-3 text-sm font-semibold text-gray-900">Per organisation (monthly)</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600"><tr><th className="px-6 py-3">Organisation</th><th className="px-6 py-3">Budget</th><th className="px-6 py-3">Tokens</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {orgs.map(o => { const l = orgLimit(o.schema_name); return (
              <tr key={o.schema_name}>
                <td className="px-6 py-3 font-semibold text-gray-900">{o.display_name || o.schema_name}</td>
                <td className="px-6 py-3"><input type="number" min="0" step="0.01" className={inputCls} value={l.monthly_budget} onChange={e => setOrg(o.schema_name, { monthly_budget: e.target.value })} placeholder="No limit" /></td>
                <td className="px-6 py-3"><input type="number" min="0" className={inputCls} value={l.monthly_tokens} onChange={e => setOrg(o.schema_name, { monthly_tokens: e.target.value })} placeholder="No limit" /></td>
              </tr>
            ); })}
          </tbody>
        </table>
      </Card>
      <div className="flex items-center gap-3"><button onClick={save} disabled={!connected} className="px-5 py-2.5 rounded-xl bg-green-700 text-white text-sm font-semibold disabled:bg-gray-200 disabled:text-gray-500"><Check size={15} className="inline mr-1" />Save limits</button>{msg && <span className="text-xs text-gray-600">{msg}</span>}</div>
    </div>
  );
}

export default function AiSettings() {
  const [tab, setTab] = useState('providers');
  const [settings, setSettings] = useState(null);
  const [connected, setConnected] = useState(true);
  const [orgs, setOrgs] = useState([]);
  useEffect(() => {
    let active = true;
    fetchAiSettings().then(s => { if (active) setSettings(s); }).catch(() => { if (active) { setConnected(false); setSettings({ providers: [], prices: [], features: {} }); } });
    fetchOrganizations().then(o => { if (active) setOrgs(Array.isArray(o) ? o : o?.items || []); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const orgNames = useMemo(() => Object.fromEntries(orgs.map(o => [o.schema_name, o.display_name || o.schema_name])), [orgs]);
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div>
          <p className="text-sm font-medium text-green-700">Configuration</p>
          <h1 className="font-display text-3xl font-semibold text-gray-900 tracking-tight mt-1">AI settings</h1>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl">Which AI the platform uses, its keys, what it costs, who uses it, and the limits for each organisation.</p>
        </div>
        {!connected && <NotConnected />}
        <div className="flex border-b border-gray-200">
          {[['providers', 'Providers and keys', <KeyRound size={15} key="k" />], ['usage', 'Usage and cost', <BarChart3 size={15} key="u" />], ['limits', 'Limits', <Gauge size={15} key="l" />]].map(([id, label, icon]) => (
            <button key={id} onClick={() => setTab(id)} className={`-mb-px flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold ${tab === id ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>{icon}{label}</button>
          ))}
        </div>
        {tab === 'providers' && settings && <ProvidersTab settings={settings} setSettings={setSettings} connected={connected} />}
        {tab === 'usage' && <UsageTab connected={connected} orgNames={orgNames} />}
        {tab === 'limits' && <LimitsTab connected={connected} orgs={orgs} />}
      </div>
    </div>
  );
}
