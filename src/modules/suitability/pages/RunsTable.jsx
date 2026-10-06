import { Card, StatusPill } from '../../../components/page/PageKit';
import { cropName, runStatus, CLASSES } from '../suitabilityLabels';

const when = (t) => (t ? new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/** Analyses as a table; `showCrop` is off inside a crop's own page. */
const RunsTable = ({ runs, onOpen, showCrop = true }) => (
  <Card className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
        <tr>
          <th className="px-5 py-3">Organisation</th>
          {showCrop && <th className="px-5 py-3">Crop</th>}
          <th className="px-5 py-3">Variety or system</th>
          <th className="px-5 py-3 whitespace-nowrap">Started</th>
          <th className="px-5 py-3 text-right">Area</th>
          <th className="px-5 py-3">Result</th>
          <th className="px-5 py-3">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {runs.map((r) => {
          const [label, tone] = runStatus(r.status);
          const total = Object.values(r.classes_area_ha || {}).reduce((a, b) => a + (Number(b) || 0), 0);
          return (
            <tr key={r.run_id} onClick={() => onOpen(r)} className="cursor-pointer hover:bg-gray-50">
              <td className="px-5 py-3 text-gray-900">{r.company_name}</td>
              {showCrop && <td className="px-5 py-3 font-semibold text-gray-900">{cropName(r.crop)}</td>}
              <td className="px-5 py-3 text-gray-600">{r.variant || 'Standard'}</td>
              <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{when(r.created_at)}</td>
              <td className="px-5 py-3 font-mono text-gray-700 text-right whitespace-nowrap">{r.total_area_ha ? `${Math.round(r.total_area_ha).toLocaleString()} ha` : '—'}</td>
              <td className="px-5 py-3">
                {total > 0 ? (
                  <div className="flex h-2.5 w-36 rounded-full overflow-hidden bg-gray-100" title={CLASSES.map((c) => `${c.label}: ${Math.round(((r.classes_area_ha?.[c.key] || 0) / total) * 100)}%`).join(' · ')}>
                    {CLASSES.map((c) => <span key={c.key} className={c.bar} style={{ width: `${((r.classes_area_ha?.[c.key] || 0) / total) * 100}%` }} />)}
                  </div>
                ) : <span className="text-gray-400">—</span>}
              </td>
              <td className="px-5 py-3"><StatusPill tone={tone}>{label}</StatusPill></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </Card>
);

export default RunsTable;
