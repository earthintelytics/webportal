import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Shield, ChevronRight, Activity } from 'lucide-react';
import { adminLogin } from '../services/adminApi';

const AdminLogin = () => {
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
        navigate('/admin/organizations');
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
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Roboto', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.2,
        backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: '460px',
        margin: '0 24px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '14px',
            marginBottom: '16px'
          }}>
            <img src="/farmintelytics-logo.png" alt="Logo" style={{ height: '56px', width: 'auto' }} />
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.03em' }}>FarmIntelytics</h2>
              <p style={{ fontSize: '11px', fontWeight: 900, color: '#16a34a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.22em' }}>Admin Control</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(15,23,42,0.05)',
        }}>
          {/* Status indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '32px', padding: '10px 16px',
            background: 'rgba(22,163,74,0.06)',
            border: '1px solid rgba(22,163,74,0.15)',
            borderRadius: '12px',
          }}>
            <Activity size={14} color="#16a34a" />
            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Authorized Administrative Access Only
            </span>
          </div>

          {error && (
            <div style={{
              marginBottom: '20px', padding: '12px 16px',
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: '12px', color: '#dc2626', fontSize: '13px', fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Admin Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '14px 14px 14px 44px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px', color: '#0f172a',
                    fontSize: '14px', fontWeight: 600,
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'all 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#16a34a'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Access Code */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                Admin Access Code
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type={showCode ? 'text' : 'password'} required
                  placeholder="••••••••••••"
                  value={code} onChange={e => setCode(e.target.value)}
                  style={{
                    width: '100%', padding: '14px 48px 14px 44px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px', color: '#0f172a',
                    fontSize: '14px', fontWeight: 600,
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'all 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#16a34a'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowCode(!showCode)} style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                  display: 'flex', alignItems: 'center',
                }}>
                  {showCode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '16px',
              background: loading ? 'rgba(22,163,74,0.5)' : '#15803d',
              border: 'none', borderRadius: '14px',
              color: 'white', fontSize: '13px', fontWeight: 800,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(22,163,74,0.25)',
              transition: 'all 0.2s',
            }}>
              {loading ? (
                <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <><span>Authenticate</span><ChevronRight size={16} /></>
              )}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          © 2026 FarmIntelytics Systems
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminLogin;
