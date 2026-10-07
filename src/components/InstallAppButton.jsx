import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';

/** "Install app": shown only when the phone offers to install FarmIntelytics. */
const InstallAppButton = ({ className = '' }) => {
  const [offer, setOffer] = useState(() => (typeof window !== 'undefined' ? window.__fiInstallPrompt || null : null));
  useEffect(() => {
    const on = () => setOffer(window.__fiInstallPrompt || null);
    const done = () => { window.__fiInstallPrompt = null; setOffer(null); };
    window.addEventListener('fi-install-available', on);
    window.addEventListener('appinstalled', done);
    return () => { window.removeEventListener('fi-install-available', on); window.removeEventListener('appinstalled', done); };
  }, []);
  if (!offer) return null;
  const install = async () => { offer.prompt(); try { await offer.userChoice; } finally { window.__fiInstallPrompt = null; setOffer(null); } };
  return (
    <button type="button" onClick={install} aria-label="Install app" title="Install app" className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-green-800 border border-green-200 bg-green-50 hover:bg-green-100 ${className}`}>
      <Smartphone size={16} /><span className="hidden sm:inline">Install app</span>
    </button>
  );
};

export default InstallAppButton;
