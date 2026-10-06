import { useSearchParams } from 'react-router-dom';
import { Building2, KeyRound, ShieldCheck, Users } from 'lucide-react';
import { licensedServices } from './orgProfile';
import OrganisationCard from './settings/OrganisationCard';
import TeamCard from './settings/TeamCard';
import PasswordCard from './settings/PasswordCard';
import RolesCard from './settings/RolesCard';

// Each section has its own address (?section=<id>). `admin` sections are not
// offered to analysts or viewers, and the server refuses them too (/team).
const SECTIONS = [
  { id: 'account', label: 'Your account', icon: KeyRound },
  { id: 'organisation', label: 'Organisation', icon: Building2 },
  { id: 'team', label: 'Team', icon: Users, admin: true },
  { id: 'roles', label: 'Roles and access', icon: ShieldCheck },
];

/** /org/<tenant>/settings: a sidebar of sections, limited by the person's role. */
const OrgSettingsPage = ({ profile, onProfile }) => {
  const [params, setParams] = useSearchParams();
  const services = licensedServices(profile);
  const isAdmin = profile.role === 'admin';
  const sections = SECTIONS.filter((s) => !s.admin || isAdmin);
  const current = sections.find((s) => s.id === params.get('section')) || sections[0];
  const open = (id) => setParams(id === sections[0].id ? {} : { section: id }, { replace: true });

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-semibold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-2">{isAdmin ? 'Your account, your organisation and who can sign in.' : 'Your account and your organisation.'}</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        <nav aria-label="Settings" className="w-full lg:w-60 shrink-0 lg:sticky lg:top-24">
          <ul className="flex lg:flex-col gap-1 overflow-x-auto">
            {sections.map(({ id, label, icon: Icon }) => (
              <li key={id} className="shrink-0">
                <button type="button" onClick={() => open(id)} aria-current={current.id === id ? 'page' : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-left ${current.id === id ? 'bg-green-50 text-green-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
                  <Icon size={16} />{label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex-1 min-w-0 w-full space-y-6">
          {current.id === 'account' && <PasswordCard profile={profile} services={services} />}
          {current.id === 'organisation' && <OrganisationCard profile={profile} services={services} canEdit={isAdmin} onLogo={(logoUrl) => onProfile({ ...profile, logoUrl })} />}
          {current.id === 'team' && isAdmin && <TeamCard profile={profile} services={services} canEdit />}
          {current.id === 'roles' && <RolesCard profile={profile} isAdmin={isAdmin} />}
        </div>
      </div>
    </>
  );
};

export default OrgSettingsPage;
