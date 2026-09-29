import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2, Key, Activity, LayoutDashboard, LogOut, Menu, X,
  Clock, Database, Users, Rocket, SlidersHorizontal,
} from 'lucide-react';

import Onboarding from './pages/Onboarding';
import CropThresholds from './pages/CropThresholds';
import Organizations from './pages/Organizations';
import Credentials from './pages/Credentials';
import Logs from './pages/Logs';
import Scheduler from './pages/Scheduler';
import Inventory from './pages/Inventory';
import UsersPage from './pages/Users';
import { ConfirmProvider } from './components/ConfirmProvider';

// Grouped by what the team is doing: setting clients up, running the
// platform, or tuning how data is interpreted.
const NAV_GROUPS = [
  { label: 'Setup', items: [
    { id: 'onboarding',    label: 'Onboard organisation', icon: Rocket,    path: '/admin/onboarding' },
    { id: 'organizations', label: 'Organisations',        icon: Building2, path: '/admin/organizations' },
    { id: 'credentials',   label: 'Credentials',          icon: Key,       path: '/admin/credentials' },
    { id: 'users',         label: 'User accounts',        icon: Users,     path: '/admin/users' },
  ]},
  { label: 'Operations', items: [
    { id: 'scheduler',     label: 'Scheduler',            icon: Clock,     path: '/admin/scheduler' },
    { id: 'inventory',     label: 'Data & storage',       icon: Database,  path: '/admin/inventory' },
    { id: 'logs',          label: 'Logs',                 icon: Activity,  path: '/admin/logs' },
  ]},
  { label: 'Configuration', items: [
    { id: 'thresholds',    label: 'Crop thresholds',      icon: SlidersHorizontal, path: '/admin/thresholds' },
  ]},
];
const NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);

const AdminPortal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('fi_admin_token');
    if (!token) { navigate('/admin/login'); return; }
    setAdminEmail(localStorage.getItem('fi_admin_email') || 'superadmin');
  }, [navigate]);

  const handleSignOut = () => {
    localStorage.removeItem('fi_admin_token');
    localStorage.removeItem('fi_admin_email');
    navigate('/admin/login');
  };

  const activeId = NAV_ITEMS.find(n => location.pathname.startsWith(n.path))?.id || 'organizations';

  const activeItem = NAV_ITEMS.find(n => n.id === activeId);

  return (
    <ConfirmProvider>
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-main)] font-sans">

      {/* ── Sidebar ── */}
      <aside className={`relative flex flex-col shrink-0 bg-white border-r border-slate-200 transition-[width] duration-200 ${sidebarOpen ? 'w-64' : 'w-[68px]'}`}>
        <div className={`h-16 flex items-center gap-3 border-b border-slate-200 ${sidebarOpen ? 'px-5' : 'justify-center'}`}>
          <img src="/farmintelytics-logo.png" alt="FarmIntelytics" className="h-9 w-9 object-contain shrink-0" width="36" height="36" />
          {sidebarOpen && (
            <div className="leading-tight min-w-0">
              <p className="font-display text-sm font-semibold truncate">FarmIntelytics</p>
              <p className="text-xs text-[var(--text-muted)]">Admin console</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              {sidebarOpen && <p className="px-3 mb-2 text-xs font-medium text-slate-400">{group.label}</p>}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = activeId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.path)}
                      title={!sidebarOpen ? item.label : undefined}
                      className={`w-full flex items-center gap-3 rounded-[10px] text-sm transition-colors ${sidebarOpen ? 'px-3 py-2' : 'justify-center py-2.5'} ${
                        active ? 'bg-emerald-50 text-emerald-800 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <item.icon size={17} className={`shrink-0 ${active ? 'text-[var(--brand-primary)]' : ''}`} />
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200 space-y-1">
          {sidebarOpen && (
            <div className="px-3 py-2">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="text-sm text-slate-700 truncate">{adminEmail}</p>
            </div>
          )}
          <button onClick={() => navigate('/')} title="Platform hub"
            className={`w-full flex items-center gap-3 rounded-[10px] text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors ${sidebarOpen ? 'px-3 py-2' : 'justify-center py-2.5'}`}>
            <LayoutDashboard size={17} className="shrink-0" />{sidebarOpen && 'Platform hub'}
          </button>
          <button onClick={handleSignOut} title="Sign out"
            className={`w-full flex items-center gap-3 rounded-[10px] text-sm text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors ${sidebarOpen ? 'px-3 py-2' : 'justify-center py-2.5'}`}>
            <LogOut size={17} className="shrink-0" />{sidebarOpen && 'Sign out'}
          </button>
        </div>

        <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="absolute top-5 -right-3 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 z-30">
          {sidebarOpen ? <X size={12} /> : <Menu size={12} />}
        </button>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Slim breadcrumb: each page renders its own title, counts and actions */}
        <header className="shrink-0 h-12 flex items-center bg-white border-b border-slate-200 px-8 text-sm">
          <span className="text-slate-400">Admin console</span>
          {activeItem && <>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-slate-400">{NAV_GROUPS.find(g => g.items.includes(activeItem))?.label}</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="font-medium text-slate-800">{activeItem.label}</span>
          </>}
        </header>

        <main className="flex-1 overflow-auto">
          <Routes>
            <Route index element={<Navigate to="organizations" replace />} />
            <Route path="onboarding"    element={<Onboarding />} />
            <Route path="users"         element={<UsersPage />} />
            <Route path="organizations" element={<Organizations />} />
            <Route path="inventory"     element={<Inventory />} />
            <Route path="credentials"   element={<Credentials />} />
            <Route path="scheduler"     element={<Scheduler />} />
            <Route path="thresholds"    element={<CropThresholds />} />
            <Route path="logs"          element={<Logs />} />
          </Routes>
        </main>
      </div>
    </div>
    </ConfirmProvider>
  );
};

export default AdminPortal;
