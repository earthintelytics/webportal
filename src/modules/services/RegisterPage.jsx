import { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';

/**
 * Register page kind: one row per registered plot/block with the columns a
 * service needs (docs/services/00-shared-principles.md, page kinds). Columns
 * come from the service catalogue entry (`register`). Values the backend does
 * not provide yet show as "Not checked" / "—", never as a pass.
 */
const STATUS = {
  pass: ['No deforestation found', 'bg-green-50 text-green-800 border-green-200'],
  review: ['Needs review', 'bg-amber-50 text-amber-800 border-amber-200'],
  fail: ['Deforestation found', 'bg-red-50 text-red-700 border-red-200'],
  not_checked: ['Not checked', 'bg-gray-50 text-gray-600 border-gray-200'],
};

function cell(col, plot) {
  switch (col.id) {
    case 'block': return <span className="font-semibold text-gray-900">{plot.name || plot.id}</span>;
    case 'estate': return plot.subfarm || '—';
    case 'area': return plot.area ? plot.area.replace(' HA', ' ha') : '—';
    case 'geolocation': {
      const ha = parseFloat(plot.area) || 0;
      const polygon = plot.coords?.length > 2;
      const ok = polygon || ha <= 4;
      return <span className={ok ? 'text-gray-700' : 'text-amber-800 font-semibold'}>{polygon ? 'Polygon' : 'Point'}{!ok ? ' (polygon required > 4 ha)' : ''}</span>;
    }
    case 'status': {
      const [label, cls] = STATUS[plot.eudrStatus || 'not_checked'];
      return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>;
    }
    default: return plot[col.id] ?? '—';
  }
}

const RegisterPage = ({ register, plots }) => {
  const [q, setQ] = useState('');
  const rows = useMemo(() => (plots || []).filter(p => !q || `${p.name} ${p.id} ${p.subfarm || ''}`.toLowerCase().includes(q.toLowerCase())), [plots, q]);
  const cols = register.columns;
  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [cols.map(c => esc(c.label)).join(','), ...rows.map(p => cols.map(c => esc(c.id === 'status' ? (STATUS[p.eudrStatus || 'not_checked'][0]) : c.id === 'block' ? (p.name || p.id) : c.id === 'estate' ? p.subfarm : c.id === 'area' ? p.area : c.id === 'geolocation' ? (p.coords?.length > 2 ? 'Polygon' : 'Point') : p[c.id])).join(','))];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: `${register.file || 'register'}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{register.title}</h2>
          <p className="text-sm text-gray-500 font-medium mt-2 max-w-2xl">{register.text}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white"><Search size={15} className="text-gray-400" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" className="text-sm outline-none w-40" /></label>
          <button onClick={exportCsv} disabled={!rows.length} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"><Download size={15} />Export</button>
        </div>
      </div>
      {register.note && <div className="rounded-2xl border border-sky-200 bg-sky-50/60 px-5 py-4 text-sm text-sky-900">{register.note}</div>}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-600">No registered plots yet. Plots appear here once their boundaries are uploaded at onboarding.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600"><tr>{cols.map(c => <th key={c.id} className="px-5 py-3">{c.label}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">{rows.map(p => <tr key={p.id}>{cols.map(c => <td key={c.id} className="px-5 py-3 text-gray-700">{cell(c, p)}</td>)}</tr>)}</tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-gray-500">{rows.length} of {(plots || []).length} plots.</p>
    </div>
  );
};

export default RegisterPage;
