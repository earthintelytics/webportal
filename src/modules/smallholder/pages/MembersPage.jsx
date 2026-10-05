import { useCallback, useState } from 'react';
import { Plus, Search, Download } from 'lucide-react';
import { fetchGroups, fetchMembers } from '../../../services/smallholderApi';
import { PageHeader, Card, NotConnectedNote, ErrorNote, EmptyState, StatusPill, PrimaryButton, SecondaryButton } from '../../../components/page/PageKit';
import { inputCls, useLoader } from '../../../components/page/useLoader';
import MemberDrawer from './MemberDrawer';
import AddMemberEntry from './AddMemberEntry';
import { EUDR_STATUS, MEMBER_STATUS } from '../smallholderLabels';

const PAGE_SIZE = 50;

/**
 * Members & parcels: the co-operative's register. Members arrive from the
 * co-op's own entry, uploads or approved form submissions (Forms page).
 */
const MembersPage = ({ onOpenForms, onOpenAnswers }) => {
  const [filters, setFilters] = useState({ q: '', group: 'all', status: 'all', eudr: 'all' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const [g, m] = await Promise.all([fetchGroups(), fetchMembers({ ...filters, page, page_size: PAGE_SIZE })]);
    return { groups: Array.isArray(g) ? g : [], rows: m?.rows || [], total: m?.total ?? (m?.rows || []).length };
  }, [filters, page]);
  const { data, state, error, reload } = useLoader(load);
  const groups = data?.groups || [];
  const rows = data?.rows || [];
  const total = data?.total || 0;

  const setFilter = (k, v) => { setPage(1); setFilters((f) => ({ ...f, [k]: v })); };

  const exportCsv = () => {
    const cols = ['code', 'name', 'phone', 'group_name', 'status', 'parcels_count', 'area_ha', 'eudr_status'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: 'members.csv' }).click();
    URL.revokeObjectURL(url);
  };

  const connected = state !== 'not_connected';

  return (
    <div className="p-10 space-y-8">
      <PageHeader
        title="Members and parcels"
        text="Every farmer in your co-operative, their group and their land. Members come from your registration form: fill it here, or send its link to farmers and approve their answers."
        actions={<>
          <SecondaryButton onClick={exportCsv} disabled={!rows.length}><Download size={15} />Export</SecondaryButton>
          <SecondaryButton onClick={onOpenAnswers}>Answers to review</SecondaryButton>
          <SecondaryButton onClick={onOpenForms}>Registration forms</SecondaryButton>
          <PrimaryButton onClick={() => setAdding(true)} disabled={!connected}><Plus size={15} />Add member</PrimaryButton>
        </>}
      />

      {state === 'not_connected' && <NotConnectedNote what="The member register" />}
      {state === 'error' && <ErrorNote message={error} onRetry={reload} />}

      {connected && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 bg-white">
            <Search size={15} className="text-gray-400" />
            <input value={filters.q} onChange={(e) => setFilter('q', e.target.value)} placeholder="Name, code or phone" className="text-sm outline-none w-52" />
          </label>
          <select value={filters.group} onChange={(e) => setFilter('group', e.target.value)} className={`${inputCls} w-auto`}>
            <option value="all">All groups</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className={`${inputCls} w-auto`}>
            <option value="all">Any status</option>
            {Object.entries(MEMBER_STATUS).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}
          </select>
          <select value={filters.eudr} onChange={(e) => setFilter('eudr', e.target.value)} className={`${inputCls} w-auto`}>
            <option value="all">Any EUDR result</option>
            {Object.entries(EUDR_STATUS).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </div>
      )}

      {state === 'ready' && rows.length === 0 && (
        <EmptyState
          title="No members yet"
          text="Add the first member with your registration form, send the form's link to farmers, or upload a member list under Your data."
          action={<PrimaryButton onClick={() => setAdding(true)}><Plus size={15} />Add member</PrimaryButton>}
        />
      )}

      {state === 'ready' && rows.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
              <tr>
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Group</th>
                <th className="px-5 py-3">Parcels</th>
                <th className="px-5 py-3">Area</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">EUDR check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((m) => {
                const [statusLabel, statusTone] = MEMBER_STATUS[m.status] || [m.status || '—', 'neutral'];
                const [eudrLabel, eudrTone] = EUDR_STATUS[m.eudr_status] || EUDR_STATUS.not_checked;
                return (
                  <tr key={m.id} onClick={() => setSelected(m)} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-500">{[m.code, m.phone].filter(Boolean).join(' · ')}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{m.group_name || '—'}</td>
                    <td className="px-5 py-3 text-gray-700 font-mono">{m.parcels_count ?? 0}</td>
                    <td className="px-5 py-3 text-gray-700 font-mono">{m.area_ha != null ? `${Number(m.area_ha).toFixed(2)} ha` : '—'}</td>
                    <td className="px-5 py-3"><StatusPill tone={statusTone}>{statusLabel}</StatusPill></td>
                    <td className="px-5 py-3"><StatusPill tone={eudrTone}>{eudrLabel}</StatusPill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {state === 'ready' && total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} members</span>
          <div className="flex gap-2">
            <SecondaryButton disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</SecondaryButton>
            <SecondaryButton disabled={page * PAGE_SIZE >= total} onClick={() => setPage((p) => p + 1)}>Next</SecondaryButton>
          </div>
        </div>
      )}

      {selected && <MemberDrawer member={selected} onClose={() => setSelected(null)} onSaved={reload} />}
      {adding && <AddMemberEntry onClose={() => setAdding(false)} onSaved={() => { setAdding(false); reload(); }} onDesign={() => { setAdding(false); onOpenForms?.(); }} />}
    </div>
  );
};

export default MembersPage;
