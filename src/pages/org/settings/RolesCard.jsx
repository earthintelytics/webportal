import { Check, Minus } from 'lucide-react';
import { Card, CardHeader } from '../../../farmintelytics-admin/components/ui';
import { ROLES } from '../orgProfile';

// What each role can do. Mirrors the server's guard (LicenceGuardMiddleware
// and the /team admin check), so this table never promises more than the
// server allows.
const ACTIONS = [
  { label: 'See maps, alerts, charts and reports', roles: ['admin', 'analyst', 'viewer'] },
  { label: 'Ask the Assistant', roles: ['admin', 'analyst', 'viewer'] },
  { label: 'Create and download reports', roles: ['admin', 'analyst', 'viewer'] },
  { label: 'Mark alerts as seen', roles: ['admin', 'analyst'] },
  { label: 'Upload farm data and boundaries', roles: ['admin', 'analyst'] },
  { label: 'Change form links and review submissions', roles: ['admin', 'analyst'] },
  { label: 'Add, change and remove accounts', roles: ['admin'] },
  { label: 'Change the logo', roles: ['admin'] },
];

/** The three roles side by side, with the signed-in person's own role marked. */
const RolesCard = ({ profile, isAdmin }) => (
  <Card>
    <CardHeader
      title="Roles and access"
      text={isAdmin ? 'What each role can do. Change someone’s role under Team.' : 'What each role can do. Your organisation’s admin sets your role.'}
    />
    <div className="p-6 overflow-x-auto">
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="text-left">
            <th className="pb-3 font-semibold text-gray-600">Action</th>
            {ROLES.map((r) => (
              <th key={r.id} className="pb-3 w-28 text-center font-semibold text-gray-900">
                {r.label}
                {profile.role === r.id && <span className="block text-xs font-medium text-green-800">You</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {ACTIONS.map((a) => (
            <tr key={a.label}>
              <td className="py-3 text-gray-700">{a.label}</td>
              {ROLES.map((r) => (
                <td key={r.id} className={`py-3 text-center ${profile.role === r.id ? 'bg-green-50' : ''}`}>
                  {a.roles.includes(r.id)
                    ? <Check size={16} className="inline text-green-700" aria-label="Yes" />
                    : <Minus size={16} className="inline text-gray-300" aria-label="No" />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-4">An admin can also limit an account to some of your services. Services your organisation does not have stay closed for every role.</p>
    </div>
  </Card>
);

export default RolesCard;
