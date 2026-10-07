import { NavLink } from 'react-router-dom';
import { Building2, LayoutGrid, Settings, LogOut, MapPin } from 'lucide-react';
import InstallAppButton from '../../components/InstallAppButton';
import { licensedServices } from './orgProfile';
import { paths } from '../../routes/paths';

/**
 * Frame of the organisation pages (/org/<tenant> and /org/<tenant>/settings):
 * the organisation's logo and name, the two pages as links, and sign out.
 */
const OrgShell = ({ profile, onSignOut, children }) => {
  // Field (parcels on the phone) for organisations with smallholder services.
  const hasField = licensedServices(profile).some((s) => s.id === 'smallholder-hub');
  const link = ({ isActive }) => `inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${isActive ? 'text-green-800 bg-green-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`;
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
              {profile.logoUrl ? <img src={profile.logoUrl} alt="" className="w-full h-full object-contain" /> : <Building2 size={20} className="text-gray-500" />}
            </div>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-gray-900 truncate">{profile.name}</p>
              <p className="text-xs text-gray-500 truncate">FarmIntelytics</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <InstallAppButton className="mr-1" />
            <NavLink end to={paths.orgHub(profile.tenant)} className={link}><LayoutGrid size={16} /><span className="hidden sm:inline">Services</span></NavLink>
            {hasField && <NavLink to={paths.orgField(profile.tenant)} className={link}><MapPin size={16} /><span className="hidden sm:inline">Field</span></NavLink>}
            <NavLink to={paths.orgSettings(profile.tenant)} className={link}><Settings size={16} /><span className="hidden sm:inline">Settings</span></NavLink>
            <button type="button" onClick={onSignOut} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100">
              <LogOut size={16} /><span className="hidden sm:inline">Sign out</span>
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">{children}</main>
    </div>
  );
};

export default OrgShell;
