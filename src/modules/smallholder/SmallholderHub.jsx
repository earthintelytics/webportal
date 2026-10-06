import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { HERO_PLACEHOLDERS } from '../../constants/heroPlaceholders';
import { SMALLHOLDER_SERVICES } from '../registry';

/**
 * Smallholder hub: the co-operative's services as photo cards. Each card opens
 * its service in the standard portal layout (`/portal/<id>`). A client sees
 * only the services its organisation is licensed for; the team sees all.
 */
const SMALLHOLDER_CARDS = [
  { id: 'smallholder-members', title: 'Members and parcels', text: 'Design your registration form, send it to farmers or fill it yourself, and keep one register of members and their land.', photo: '/crops/smallholder.webp' },
  { id: 'group-monitoring', title: 'Farm monitoring', text: 'How each member farm is doing, from satellite, and which need a visit.', photo: '/crops/advisor.webp' },
  { id: 'carbon-groups', title: 'Group carbon', text: 'Carbon estimated for each member farm, added up per group, all in one table.', photo: '/crops/group_carbon.webp' },
  { id: 'smallholder-eudr', title: 'EUDR passport', text: 'The deforestation check for each member farm, managed for the whole group in one place.', photo: '/crops/eudr.webp' },
];

const isTeam = () => Boolean(localStorage.getItem('fi_admin_token')) && !localStorage.getItem('fi_token');

const SmallholderHub = ({ onBack, onSignOut }) => {
  const navigate = useNavigate();
  let allowed = [];
  try { allowed = JSON.parse(localStorage.getItem('fi_allowed_modules') || '[]') || []; } catch { allowed = []; }
  const cards = SMALLHOLDER_CARDS.filter((c) => SMALLHOLDER_SERVICES.includes(c.id) && (isTeam() || allowed.includes(c.id)));
  const orgName = localStorage.getItem('fi_display_name') || '';

  const open = (id) => {
    sessionStorage.setItem('fi_smallholder_hub', '1');
    navigate(`/portal/${id}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && <button onClick={onBack} aria-label="Back" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><ArrowLeft size={18} /></button>}
            <div className="leading-tight">
              <p className="font-display text-base font-semibold">Smallholder</p>
              {orgName && <p className="text-xs text-[var(--text-muted)]">{orgName}</p>}
            </div>
          </div>
          {onSignOut && <button onClick={onSignOut} className="px-4 py-2 rounded-[10px] text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Sign out</button>}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-10 py-14 space-y-10">
        <section className="max-w-2xl">
          <p className="text-sm font-medium text-[var(--brand-primary)]">Co-operatives and outgrowers</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight mt-2">Your members, their land, one place.</h1>
          <p className="text-base text-[var(--text-muted)] leading-relaxed mt-4">Register farmers and parcels, collect information with your own forms, follow how farms are doing, and prepare carbon and EUDR evidence.</p>
        </section>

        {cards.length === 0 ? (
          <p className="text-sm text-gray-600 bg-white border border-dashed border-gray-300 rounded-2xl px-6 py-10 text-center">No smallholder services are enabled for your organisation yet. Contact your administrator.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((c) => (
              <button key={c.id} onClick={() => open(c.id)} className="group flex flex-col text-left bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
                <div className="relative h-36 w-full overflow-hidden bg-gray-100 bg-cover bg-center" style={HERO_PLACEHOLDERS[c.photo] ? { backgroundImage: `url(${HERO_PLACEHOLDERS[c.photo]})` } : undefined}>
                  <img src={c.photo} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover saturate-[0.9] transition-transform duration-500 group-hover:scale-[1.03]" />
                </div>
                <div className="flex-1 flex flex-col p-5">
                  <h3 className="font-display text-lg font-semibold text-gray-900">{c.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{c.text}</p>
                  <span className="mt-5 flex items-center gap-1.5 text-sm font-medium text-[var(--brand-primary)]">Open<ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SmallholderHub;
