import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Chip, Empty } from '../../farmintelytics-admin/components/ui';
import { paths } from '../../routes/paths';
import { licensedServices, SERVICE_TABS } from './orgProfile';

/** /org/<tenant>: the services this organisation was given at onboarding. */
const OrgServicesPage = ({ profile }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const services = licensedServices(profile);
  const tabs = SERVICE_TABS.map((t) => ({ ...t, count: t.id === 'all' ? services.length : services.filter((s) => s.group === t.id).length }))
    .filter((t) => t.id === 'all' || t.count > 0);
  const shown = tab === 'all' ? services : services.filter((s) => s.group === tab);
  const first = (profile.fullName || '').split(' ')[0];

  const open = (id) => {
    navigate(paths.service(id, profile.tenant));
  };

  return (
    <>
      {/* A light welcome band: who you are, what you have, today's date. */}
      <div className="rounded-2xl border border-green-100 bg-gradient-to-r from-green-50 via-white to-white px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-green-800">{profile.name}</p>
          <h1 className="font-display text-3xl font-semibold text-gray-900 tracking-tight mt-1">{first ? `Welcome, ${first}` : 'Your services'}</h1>
          <p className="text-sm text-gray-500 mt-2">Open a service to see your farms, results and reports.</p>
        </div>
        <dl className="flex gap-3">
          {[['Services', services.length], ['Crops', (profile.crops || []).length], ['Today', new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' })]].map(([k, v]) => (
            <div key={k} className="min-w-[88px] rounded-xl bg-white border border-gray-200 px-4 py-3">
              <dt className="text-xs text-gray-500">{k}</dt>
              <dd className="font-display text-xl font-semibold text-gray-900 mt-0.5">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {tabs.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => <Chip key={t.id} on={tab === t.id} onClick={() => setTab(t.id)}>{t.label} · {t.count}</Chip>)}
        </div>
      )}

      {services.length === 0 ? (
        <Empty>No services are set up for {profile.name} yet. FarmIntelytics adds them during onboarding; contact your FarmIntelytics team.</Empty>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {shown.map((s) => (
            <button key={s.id} type="button" onClick={() => open(s.id)}
              className="group text-left flex flex-col bg-white border border-gray-200 hover:border-gray-400 rounded-2xl overflow-hidden">
              <div className="h-40 bg-gray-100 overflow-hidden">
                {s.photo && <img src={s.photo} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />}
              </div>
              <div className="flex-1 flex flex-col p-5">
                <h3 className="font-display text-base font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1.5 text-sm text-gray-500 leading-relaxed flex-1">{s.text}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-green-700">
                  Open <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default OrgServicesPage;
