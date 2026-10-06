import { licensedServices } from './orgProfile';
import OrganisationCard from './settings/OrganisationCard';
import TeamCard from './settings/TeamCard';
import PasswordCard from './settings/PasswordCard';

/** /org/<tenant>/settings: organisation, team and the person's own account. */
const OrgSettingsPage = ({ profile, onProfile }) => {
  const services = licensedServices(profile);
  const isAdmin = profile.role === 'admin';
  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-semibold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-2">Your organisation, who can sign in, and your password.</p>
      </div>
      <OrganisationCard profile={profile} services={services} canEdit={isAdmin} onLogo={(logoUrl) => onProfile({ ...profile, logoUrl })} />
      <TeamCard profile={profile} services={services} canEdit={isAdmin} />
      <PasswordCard profile={profile} />
    </>
  );
};

export default OrgSettingsPage;
