import { useState } from 'react';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import { fetchCarbonSummary } from '../../../services/smallholderApi';
import { PageHeader, Card, NotConnectedNote, ErrorNote, EmptyState, SecondaryButton } from '../../../components/page/PageKit';
import { useLoader } from '../../../components/page/useLoader';

const range = (r) => (r && r.low != null && r.high != null ? `${Math.round(r.low).toLocaleString()}–${Math.round(r.high).toLocaleString()} t` : '—');
const ha = (v) => (v != null ? `${Number(v).toFixed(1)} ha` : '—');

/**
 * Group carbon: an estimate per group and member, always as a range with the
 * method it came from. Not a certified or verified figure.
 */
const GroupCarbonPage = () => {
  const { data, state, error, reload } = useLoader(fetchCarbonSummary);
  const [open, setOpen] = useState({});

  const groups = data?.groups || [];

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = ['group,member,area_ha,carbon_low_t,carbon_high_t'];
    groups.forEach((g) => (g.members || []).forEach((m) => lines.push([g.name, m.name, m.area_ha, m.carbon_t?.low, m.carbon_t?.high].map(esc).join(','))));
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: 'group-carbon.csv' }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-10 space-y-8">
      <PageHeader
        title="Group carbon"
        text="Estimated carbon held in member farms, per group and per member. Figures are ranges from published factors for each crop and age; they are an estimate for planning, not a certified result."
        actions={<SecondaryButton onClick={exportCsv} disabled={!groups.length}><Download size={15} />Export</SecondaryButton>}
      />

      {state === 'not_connected' && <NotConnectedNote what="Group carbon" />}
      {state === 'error' && <ErrorNote message={error} onRetry={reload} />}
      {state === 'ready' && groups.length === 0 && (
        <EmptyState title="No estimate yet" text="Estimates appear once members have parcel boundaries with a crop and planting year." />
      )}

      {groups.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
              <tr><th className="px-5 py-3">Group / member</th><th className="px-5 py-3">Area</th><th className="px-5 py-3">Estimated carbon</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groups.map((g) => (
                <GroupRows key={g.id} group={g} open={!!open[g.id]} onToggle={() => setOpen((o) => ({ ...o, [g.id]: !o[g.id] }))} />
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {data?.method && (
        <details className="text-sm text-gray-600">
          <summary className="cursor-pointer text-gray-800 font-medium">How this is estimated</summary>
          <p className="mt-2 max-w-3xl">{data.method}</p>
          {data.factors_source && <p className="mt-1 text-gray-500">Factors: {data.factors_source}</p>}
        </details>
      )}
    </div>
  );
};

const GroupRows = ({ group, open, onToggle }) => (
  <>
    <tr className="cursor-pointer hover:bg-gray-50" onClick={onToggle}>
      <td className="px-5 py-3 font-semibold text-gray-900">
        <span className="inline-flex items-center gap-2">{open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}{group.name}</span>
      </td>
      <td className="px-5 py-3 font-mono text-gray-700">{ha(group.area_ha)}</td>
      <td className="px-5 py-3 font-mono text-gray-900">{range(group.carbon_t)}</td>
    </tr>
    {open && (group.members || []).map((m) => (
      <tr key={m.id} className="bg-gray-50/50">
        <td className="pl-12 pr-5 py-2.5 text-gray-700">{m.name}</td>
        <td className="px-5 py-2.5 font-mono text-gray-600">{ha(m.area_ha)}</td>
        <td className="px-5 py-2.5 font-mono text-gray-700">
          {range(m.carbon_t)}
          {!m.carbon_t && m.note && <span className="block font-sans text-xs text-gray-500">{m.note}</span>}
        </td>
      </tr>
    ))}
  </>
);

export default GroupCarbonPage;
