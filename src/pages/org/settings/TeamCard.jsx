import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardHeader, Button, IconButton, Pill, Note, Loading } from '../../../farmintelytics-admin/components/ui';
import { fetchTeam, addTeamMember, updateTeamMember, removeTeamMember } from '../../../services/teamApi';
import { NotConnectedError } from '../../../services/datasetsApi';
import { roleLabel } from '../orgProfile';
import MemberModal from './MemberModal';

const initials = (m) => (m.name || m.email || '?').split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/**
 * The organisation's accounts (GET/POST/PATCH/DELETE /team, G35). Only an
 * admin can change them, and never above the licence's account limit.
 */
const TeamCard = ({ profile, services, canEdit }) => {
  const [rows, setRows] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | not_connected | error
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | {} (new) | member
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    fetchTeam()
      .then((r) => { setRows(Array.isArray(r) ? r : []); setState('ready'); })
      .catch((e) => { setState(e instanceof NotConnectedError ? 'not_connected' : 'error'); setError(e.message); });
  }, []);

  const others = rows.filter((m) => m.email !== profile.email);
  const used = others.length + 1;
  const full = profile.maxAccounts != null && used >= profile.maxAccounts;

  const save = async (body) => {
    if (editing?.id) {
      const saved = await updateTeamMember(editing.id, body);
      setRows((r) => r.map((m) => (m.id === editing.id ? saved : m)));
    } else {
      const added = await addTeamMember(body);
      setRows((r) => [...r, added]);
    }
    setEditing(null);
  };
  const remove = async (id) => {
    setError('');
    try { await removeTeamMember(id); setRows((r) => r.filter((m) => m.id !== id)); } catch (e) { setError(e.message); }
    setRemoving(null);
  };

  const count = profile.maxAccounts != null ? `${used} of ${profile.maxAccounts} accounts used` : `${used} ${used === 1 ? 'account' : 'accounts'}`;

  return (
    <Card>
      <CardHeader
        title="Team"
        text={`Who can sign in for ${profile.name}. ${count}.`}
        actions={canEdit && state === 'ready' && <Button onClick={() => setEditing({})} disabled={full} title={full ? 'The licence account limit is reached' : undefined}><Plus size={15} />Add account</Button>}
      />
      <div className="p-6 space-y-4">
        {state === 'not_connected' && <Note>Adding accounts here is not switched on yet. Until it is, FarmIntelytics adds accounts for you.</Note>}
        {state === 'error' && <Note tone="warning">The team could not be loaded: {error}</Note>}
        {state === 'ready' && error && <Note tone="warning">{error}</Note>}
        {full && canEdit && <Note>Your licence allows {profile.maxAccounts} accounts and all are in use. Remove one, or ask FarmIntelytics for more.</Note>}

        {state === 'loading' ? <Loading>Loading the team…</Loading> : (
          <ul className="divide-y divide-gray-100">
            <li className="py-3 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-green-50 text-green-800 font-semibold text-sm flex items-center justify-center shrink-0">{initials({ name: profile.fullName, email: profile.email })}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{profile.fullName || profile.email}</p>
                <p className="text-xs text-gray-500 truncate">{profile.email}</p>
              </div>
              <Pill tone="good">You · {roleLabel(profile.role)}</Pill>
            </li>
            {others.map((m) => (
              <li key={m.id} className="py-3 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm flex items-center justify-center shrink-0">{initials(m)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{m.name || m.email}</p>
                  <p className="text-xs text-gray-500 truncate">{m.email} · {(m.services || []).length ? `${m.services.length} services` : 'All services'}</p>
                </div>
                <Pill>{roleLabel(m.role)}</Pill>
                {canEdit && (removing === m.id ? (
                  <span className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Remove?</span>
                    <Button variant="danger" className="!py-1.5" onClick={() => remove(m.id)}>Remove</Button>
                    <Button variant="ghost" className="!py-1.5" onClick={() => setRemoving(null)}>Keep</Button>
                  </span>
                ) : (
                  <span className="flex items-center">
                    <IconButton label="Edit" onClick={() => setEditing(m)}><Pencil size={15} /></IconButton>
                    <IconButton label="Remove" danger onClick={() => setRemoving(m.id)}><Trash2 size={15} /></IconButton>
                  </span>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>
      {editing && <MemberModal member={editing} services={services} onSave={save} onClose={() => setEditing(null)} />}
    </Card>
  );
};

export default TeamCard;
