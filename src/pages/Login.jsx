import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Grid
} from 'lucide-react';
import { login, fetchCropMonitoringConfig } from '../services/organizationMonitorApi';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { HERO_PLACEHOLDERS } from '../constants/heroPlaceholders';
import { clearTenantAccount } from '../services/session';
import { demoAccounts } from '../constants/demoAccounts';
import { signInDesignFor } from './login/signInDesigns';

// ─── Main Login Component (Clean White Background Theme) ─────────────────────
const Login = ({ onLogin, moduleId, onBack, defaultEmail = '', defaultCode = '' }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [accessCode, setAccessCode] = useState(defaultCode);
  const [error, setError] = useState('');
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const currentDesign = signInDesignFor(moduleId);
  const demos = demoAccounts('tenant');

  useEffect(() => {
    setEmail(defaultEmail);
    setAccessCode(defaultCode);
  }, [defaultEmail, defaultCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await login(email, accessCode);
      if (response.status === 'success' && response.token && response.tenant) {
        // Explicitly clear any previous session data for 100% portal isolation
        // Replace any previous client account; a team login stays signed in.
        clearTenantAccount();

        localStorage.setItem('fi_token', response.token);
        localStorage.setItem('fi_email', response.email);
        localStorage.setItem('fi_tenant', response.tenant);
        localStorage.setItem('fi_role', response.role || 'admin');
        if (response.full_name) localStorage.setItem('fi_full_name', response.full_name);
        else localStorage.removeItem('fi_full_name');
        
        try {
          const config = await fetchCropMonitoringConfig();
          if (config?.display_name) localStorage.setItem('fi_display_name', config.display_name);
          if (Array.isArray(config?.modules)) localStorage.setItem('fi_allowed_modules', JSON.stringify(config.modules));
          if (Array.isArray(config?.allowed_crops)) localStorage.setItem('fi_allowed_crops', JSON.stringify(config.allowed_crops));
          if (Array.isArray(config?.map_center)) localStorage.setItem('fi_map_center', JSON.stringify(config.map_center));
          if (config?.max_accounts != null) localStorage.setItem('fi_max_accounts', String(config.max_accounts));
          else localStorage.removeItem('fi_max_accounts');
        } catch {
          localStorage.removeItem('fi_display_name');
          localStorage.removeItem('fi_allowed_modules');
          localStorage.removeItem('fi_allowed_crops');
          localStorage.removeItem('fi_map_center');
        }
        onLogin();
      } else {
        setError(response.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      // A network failure ("Failed to fetch") means the server could not be
      // reached, not that the details were wrong.
      const offline = err instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(err?.message || '');
      setError(offline
        ? 'FarmIntelytics could not be reached. Check your internet connection and try again in a moment.'
        : err.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white text-[var(--text-main)] font-sans">
      {/* ── Left: crop photograph, full height, caption on a soft gradient ── */}
      <aside
        className="relative lg:w-1/2 min-h-[260px] lg:min-h-screen overflow-hidden bg-slate-100 bg-cover bg-center"
        style={{ backgroundImage: HERO_PLACEHOLDERS[currentDesign.image] ? `url(${HERO_PLACEHOLDERS[currentDesign.image]})` : undefined }}
      >
        {currentDesign.image.startsWith('/crops/hero/') && (
          <img
            src={currentDesign.image.replace('/crops/hero/', '/crops/')}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center saturate-[0.85]"
            fetchpriority="high"
          />
        )}
        <img
          src={currentDesign.image}
          alt={currentDesign.name}
          className={`absolute inset-0 w-full h-full object-cover object-center saturate-[0.85] transition-opacity duration-500 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}
          fetchpriority="high"
          onLoad={() => setHeroLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
        <div className="relative h-full flex flex-col justify-end p-8 lg:p-14 text-white">
          <span className="self-start mb-4 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-medium">
            {currentDesign.group}
          </span>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold leading-tight max-w-lg">
            {currentDesign.title}
          </h1>
          <p className="mt-3 text-sm lg:text-base text-white/85 leading-relaxed max-w-lg">
            {currentDesign.text}
          </p>
        </div>
      </aside>

      {/* ── Right: sign-in ─────────────────────────────────────────────────── */}
      <main className="lg:w-1/2 flex flex-col px-6 sm:px-12 lg:px-16 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/farmintelytics-logo.png" alt="FarmIntelytics" className="h-9 w-9 object-contain" width="36" height="36" />
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold">FarmIntelytics</p>
              <p className="text-xs text-[var(--text-muted)]">{currentDesign.name}</p>
            </div>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] border border-[var(--border-light)] text-sm font-medium hover:bg-[var(--bg-main)] transition-colors"
            >
              <Grid size={15} /> <span className="hidden sm:inline">Back to</span> hub
            </button>
          )}
        </header>

        <div className="flex-1 flex items-center justify-center py-12">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[var(--border-light)] p-8 sm:p-10">
            <p className="text-sm font-medium text-[var(--brand-primary)]">Authorised portal</p>
            <h2 className="font-display text-3xl font-semibold mt-1">Sign in</h2>
            <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
              Use your organisation's email and password to open <span className="font-medium text-[var(--text-main)]">{currentDesign.name}</span>.
            </p>

            {error && (
              <div className="mt-6 p-3.5 rounded-[10px] border border-red-200 bg-red-50 text-sm text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="you@organisation.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-[10px] border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium">Password</label>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={accessCode}
                    onChange={e => setAccessCode(e.target.value)}
                    className="w-full rounded-[10px] border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-[10px] bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign in <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            {demos.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
                <span>Demo account:</span>
                {demos.map((d) => (
                  <button key={d.email} type="button" onClick={() => { setEmail(d.email); setAccessCode(d.code); setError(''); }}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] bg-white hover:bg-[var(--bg-main)] text-[var(--text-main)] font-medium">
                    {d.label || d.email}
                  </button>
                ))}
              </div>
            )}

          </div>
        </div>

        <ForgotPasswordModal
          isOpen={forgotModalOpen}
          onClose={() => setForgotModalOpen(false)}
          initialEmail={email}
          onSuccess={(em, pw) => {
            setEmail(em);
            setAccessCode(pw);
          }}
        />

        <footer className="text-xs text-slate-400">© {new Date().getFullYear()} FarmIntelytics</footer>
      </main>
    </div>
  );
};

export default Login;



