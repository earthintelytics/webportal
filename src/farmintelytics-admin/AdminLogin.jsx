import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { adminLogin } from '../services/adminApi';

// Also used as the gate for the internal platform hub (`/`): pass onSuccess
// to stay on the current page instead of opening the admin console.
const AdminLogin = ({ onSuccess = null, context = 'admin' }) => {
  const isHub = context === 'hub';
  const navigate = useNavigate();
  const [email, setEmail] = useState('superadmin@farmintelytics.com');
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminLogin(email, code);
      if (res.status === 'success' && res.token) {
        localStorage.setItem('fi_admin_token', res.token);
        localStorage.setItem('fi_admin_email', res.email);
        if (onSuccess) onSuccess(); else navigate('/admin/organizations');
      } else {
        setError(res.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)] font-sans px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src="/farmintelytics-logo.png" alt="FarmIntelytics" className="h-10 w-10 object-contain" width="40" height="40" />
          <div className="leading-tight">
            <p className="font-display text-base font-semibold">FarmIntelytics</p>
            <p className="text-xs text-[var(--text-muted)]">{isHub ? 'Platform hub' : 'Admin console'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--border-light)] p-8 sm:p-10">
          <p className="text-sm font-medium text-[var(--brand-primary)]">{isHub ? 'FarmIntelytics team' : 'Super-admin access'}</p>
          <h2 className="font-display text-3xl font-semibold mt-1">Sign in</h2>
          <p className="text-sm text-[var(--text-muted)] mt-2">{isHub ? 'Internal access to every crop and organisation service.' : 'Manage organisations, farms, logins and schedules.'}</p>

          {error && (
            <div className="mt-6 p-3.5 rounded-[10px] border border-red-200 bg-red-50 text-sm text-red-800">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-[10px] border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Access code</label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showCode ? 'text' : 'password'} required
                  placeholder="••••••••••••"
                  value={code} onChange={e => setCode(e.target.value)}
                  className="w-full rounded-[10px] border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
                />
                <button type="button" onClick={() => setShowCode(!showCode)}
                  aria-label={showCode ? 'Hide access code' : 'Show access code'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
                  {showCode ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-[10px] bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">© {new Date().getFullYear()} FarmIntelytics</p>
      </div>
    </div>
  );
};

export default AdminLogin;
