import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  Globe, 
  Activity, 
  CreditCard, 
  ClipboardList, 
  MessageSquare, 
  Target,
  Leaf, 
  Trees,
  Building2, 
  ShieldCheck, 
  User, 
  Users, 
  Settings, 
  LogOut, 
  Sparkles, 
  Layers, 
  ImagePlus, 
  Plus, 
  Trash2, 
  Pencil,
  Check, 
  X, 
  Lock, 
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Mail, 
  Shield 
} from 'lucide-react';
import { 
  OilPalmIcon, 
  RubberIcon, 
  SugarcaneIcon, 
  CashewIcon, 
  CocoaIcon, 
  CassavaIcon, 
  MaizeIcon, 
  RiceIcon, 
  DroneIcon, 
  SmallholderIcon 
} from '../components/CropIcons';
import { uploadOrganizationLogo } from '../services/adminApi';
import { changePassword } from '../services/authApi';

const CARD_PHOTOS = {
  'rs-ffb': '/crops/oil_palm.webp', 'management-ffb': '/crops/oil_palm.webp',
  'rs-maize': '/crops/maize.webp', 'management-maize': '/crops/maize.webp',
  'rs-rice': '/crops/rice.webp', 'management-rice': '/crops/rice.webp',
  'rs-cassava': '/crops/cassava.webp', 'management-cassava': '/crops/cassava.webp',
  'rs-cocoa': '/crops/cocoa.webp', 'management-cocoa': '/crops/cocoa.webp',
  'rs-sugarcane': '/crops/sugarcane.webp', 'management-sugarcane': '/crops/sugarcane.webp',
  'rs-cashew': '/crops/cashew.webp', 'management-cashew': '/crops/cashew.webp',
  'rs-rubber': '/crops/rubber.webp', 'management-rubber': '/crops/rubber.webp',
  'rs-drone': '/crops/drone.webp',
  'group-monitoring': '/crops/smallholder.webp', 'group-management': '/crops/smallholder.webp',
  'carbon-ffb': '/crops/estate_carbon.webp', 'carbon-groups': '/crops/group_carbon.webp',
  'forestry-intel': '/crops/forestry.webp', 'carbon-estimator': '/crops/estimator.webp',
  'land-restoration': '/crops/restoration.webp', 'eudr-check': '/crops/eudr.webp',
  'suitability-tool': '/crops/suitability.webp',
  'finance-hub': '/crops/finance.webp', 'advisor': '/crops/advisor.webp',
};

const photoFor = (id) => CARD_PHOTOS[id] || '/crops/oil_palm.webp';

const ALL_SERVICE_CATALOG = [
  { id: 'rs-ffb', title: 'Oil Palm Monitoring', group: 'crops', crop: 'Oil Palm', description: 'Multispectral canopy vitality, water deficit and yield forecast telemetry.', icon: <OilPalmIcon /> },
  { id: 'rs-rubber', title: 'Rubber Monitoring', group: 'crops', crop: 'Rubber', description: 'Latex vegetation indices, canopy vigor and tapping moisture index.', icon: <RubberIcon /> },
  { id: 'rs-cocoa', title: 'Cocoa Monitoring', group: 'crops', crop: 'Cocoa', description: 'Shade-canopy density, stress detection and parcel boundary screening.', icon: <CocoaIcon /> },
  { id: 'rs-rice', title: 'Rice Monitoring', group: 'crops', crop: 'Rice', description: 'Paddy flooding cycles, vegetative stage tracking and biomass density.', icon: <RiceIcon /> },
  { id: 'rs-maize', title: 'Maize Monitoring', group: 'crops', crop: 'Maize', description: 'Hybrid crop vigor, water stress and seasonal yield tracking.', icon: <MaizeIcon /> },
  { id: 'rs-cassava', title: 'Cassava Monitoring', group: 'crops', crop: 'Cassava', description: 'Tuber canopy stress, nitrogen assimilation and harvest timing.', icon: <CassavaIcon /> },
  { id: 'rs-sugarcane', title: 'Sugarcane Monitoring', group: 'crops', crop: 'Sugarcane', description: 'Biomass accumulation, moisture deficit and ripening indicators.', icon: <SugarcaneIcon /> },
  { id: 'rs-cashew', title: 'Cashew Monitoring', group: 'crops', crop: 'Cashew', description: 'Orchard canopy health, vegetative flush and yield indicators.', icon: <CashewIcon /> },
  { id: 'rs-drone', title: 'Drone Inspection', group: 'crops', crop: 'Aerial Recon', description: 'Ultra-high-resolution aerial surveys and orthomosaic anomalies.', icon: <DroneIcon /> },
  { id: 'group-monitoring', title: 'Smallholder Cooperative Hub', group: 'crops', crop: 'Cooperative OS', description: 'Integrated outgrower OS: member onboarding, geospatial cluster map, GAP advisor, group carbon & EUDR passports.', icon: <SmallholderIcon /> },

  // Sustainability & Compliance
  { id: 'eudr-check', title: 'EUDR Deforestation Check', group: 'sustainability', crop: 'Compliance', description: 'Post-2020 forest loss screening, boundary verification and audit packs.', icon: <Globe />, badge: 'EU Compliance' },
  { id: 'carbon-ffb', title: 'Estate Carbon Accounting', group: 'sustainability', crop: 'Carbon', description: 'Aboveground biomass stocks, IPCC Tier-1 carbon flux and trend lines.', icon: <Leaf />, badge: 'Carbon Suite' },
  { id: 'forestry-intel', title: 'Forestry Intelligence', group: 'sustainability', crop: 'Forests', description: 'Canopy density mapping, high-conservation area protection and tree cover.', icon: <Trees /> },
  { id: 'carbon-estimator', title: 'Carbon Potential Estimator', group: 'sustainability', crop: 'Carbon', description: 'Scenario modeling for afforestation, agroforestry and carbon sequestration.', icon: <Activity /> },
  { id: 'land-restoration', title: 'Land Restoration & Soil', group: 'sustainability', crop: 'Restoration', description: 'Degraded land rehabilitation monitoring and vegetation recovery.', icon: <Leaf /> },

  // Advisory & Operations
  { id: 'suitability-tool', title: 'Crop Suitability Tool', group: 'advisory', crop: 'Planning & Evaluation', description: 'Soil, climate, and MCDA crop suitability analysis for 8 major crops.', icon: <Target />, badge: 'Agronomic Model' },
  { id: 'advisor', title: 'Farm AI Advisor', group: 'advisory', crop: 'AI Intelligence', description: 'Multi-LLM agronomic advisory grounded in your real estate telemetry and weather.', icon: <MessageSquare />, badge: 'AI Powered' },
];

const TenantHub = ({ onSelectModule, onSignOut }) => {
  const [mainView, setMainView] = useState('services'); // 'services' | 'settings'
  const [activeTab, setActiveTab] = useState('all');
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef(null);

  const [tenantInfo, setTenantInfo] = useState({
    tenant: '',
    displayName: 'Organization Workspace',
    email: '',
    role: 'Admin',
    allowedModules: [],
    allowedCrops: [],
    logoUrl: ''
  });

  // Local state for team members
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, email: 'agronomy@okomu.com', name: 'Agronomy Lead', role: 'Lead Agronomist', services: ['rs-ffb', 'rs-rubber', 'advisor'] },
    { id: 2, email: 'sustainability@okomu.com', name: 'Sustainability Officer', role: 'Compliance Manager', services: ['eudr-check', 'carbon-ffb', 'forestry-intel'] },
  ]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    name: '',
    role: 'Field Operator',
    password: '',
    assignedServices: []
  });

  // Edit member modal state
  const [editingMember, setEditingMember] = useState(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    try {
      const tenant = localStorage.getItem('fi_tenant') || '';
      const displayName = localStorage.getItem('fi_display_name') || tenant || 'Organization Workspace';
      const email = localStorage.getItem('fi_email') || '';
      const role = localStorage.getItem('fi_role') || 'Admin';
      const logoUrl = localStorage.getItem('fi_logo_url') || '';
      
      let allowedModules = [];
      const rawModules = localStorage.getItem('fi_allowed_modules');
      if (rawModules) allowedModules = JSON.parse(rawModules);

      let allowedCrops = [];
      const rawCrops = localStorage.getItem('fi_allowed_crops');
      if (rawCrops) allowedCrops = JSON.parse(rawCrops);

      setTenantInfo({
        tenant,
        displayName,
        email,
        role,
        allowedModules,
        allowedCrops,
        logoUrl
      });
    } catch (err) {
      console.error('Failed to load tenant profile:', err);
    }
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const tenantSlug = tenantInfo.tenant || 'okomu';
      const res = await uploadOrganizationLogo(tenantSlug, file);
      const newUrl = res?.logo_url || URL.createObjectURL(file);
      setTenantInfo(prev => ({ ...prev, logoUrl: newUrl }));
      localStorage.setItem('fi_logo_url', newUrl);
    } catch (err) {
      const localUrl = URL.createObjectURL(file);
      setTenantInfo(prev => ({ ...prev, logoUrl: localUrl }));
      localStorage.setItem('fi_logo_url', localUrl);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleAddTeamMember = (e) => {
    e.preventDefault();
    if (!newUserForm.email) return;
    const member = {
      id: Date.now(),
      email: newUserForm.email,
      name: newUserForm.name || newUserForm.email.split('@')[0],
      role: newUserForm.role,
      services: newUserForm.assignedServices.length > 0 ? newUserForm.assignedServices : tenantInfo.allowedModules
    };
    setTeamMembers(prev => [...prev, member]);
    setShowAddUserModal(false);
    setNewUserForm({ email: '', name: '', role: 'Field Operator', password: '', assignedServices: [] });
  };

  const handleSaveEditMember = (e) => {
    e.preventDefault();
    if (!editingMember) return;
    setTeamMembers(prev => prev.map(m => m.id === editingMember.id ? editingMember : m));
    setEditingMember(null);
  };

  const handleDeleteMember = (id) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordSuccess(false);
      }, 5000);
    } catch (err) {
      setPasswordError(err?.message || 'Failed to update password. Please verify your current password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const allowedSet = new Set(tenantInfo.allowedModules || []);
  const allowedCropsSet = new Set(tenantInfo.allowedCrops || []);

  const licensedModules = ALL_SERVICE_CATALOG.filter(service => {
    if (allowedSet.size > 0 && allowedSet.has(service.id)) return true;
    if (service.id.startsWith('rs-')) {
      const cropKey = service.id.replace('rs-', '');
      if (allowedCropsSet.has(cropKey)) return true;
    }
    if (allowedSet.size === 0) return true;
    return false;
  });

  const allTiles = [...licensedModules];

  const tabs = [
    { id: 'all', label: 'All Licensed Services', count: allTiles.length },
    { id: 'crops', label: 'Crop Portals', count: allTiles.filter(t => t.group === 'crops').length },
    { id: 'sustainability', label: 'Sustainability & EUDR', count: allTiles.filter(t => t.group === 'sustainability').length },
    { id: 'advisory', label: 'AI Advisory & Logs', count: allTiles.filter(t => t.group === 'advisory').length },
  ].filter(t => t.id === 'all' || t.count > 0);

  const displayedTiles = activeTab === 'all' 
    ? allTiles 
    : allTiles.filter(t => t.group === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()} title="Click to upload logo">
              <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden shadow-xs">
                {tenantInfo.logoUrl ? (
                  <img src={tenantInfo.logoUrl} alt={tenantInfo.displayName} className="w-full h-full object-contain rounded-[14px]" />
                ) : (
                  <Building2 className="w-6 h-6 text-slate-700" />
                )}
              </div>
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold text-white rounded-2xl transition-all">
                Upload
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg font-bold text-slate-900 tracking-tight">{tenantInfo.displayName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Active Subscription
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Enterprise Service Launchpad</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Standalone View Switching Nav Links (No background, font color green when active) */}
            <button
              onClick={() => setMainView('services')}
              className={`text-sm font-bold transition-colors flex items-center gap-2 py-1.5 ${
                mainView === 'services' ? 'text-emerald-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={16} className={mainView === 'services' ? 'text-emerald-700' : 'text-slate-500'} />
              <span>Services & Portals</span>
            </button>

            <button
              onClick={() => setMainView('settings')}
              className={`text-sm font-bold transition-colors flex items-center gap-2 py-1.5 ${
                mainView === 'settings' ? 'text-emerald-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings size={16} className={mainView === 'settings' ? 'text-emerald-700' : 'text-slate-500'} />
              <span>Settings</span>
            </button>

            {onSignOut && (
              <button 
                onClick={onSignOut}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 border border-slate-200 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        {mainView === 'services' ? (
          <>
            {/* Welcome Hero Banner */}
            <div className="relative rounded-3xl p-8 lg:p-10 mb-10 overflow-hidden bg-white border border-slate-200 shadow-xs">
              <div className="max-w-2xl relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Licensed Enterprise Suite</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 tracking-tight leading-tight">
                  Welcome to your <br />
                  <span className="text-emerald-700">
                    Agronomic Intelligence Hub
                  </span>
                </h2>
                <p className="mt-3 text-sm lg:text-base text-slate-600 leading-relaxed">
                  Select any of your organization's licensed services below to monitor field vegetative health, run EUDR audit checks, track carbon flux, or consult your AI agronomist.
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-xs font-medium">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span><strong>{tenantInfo.allowedCrops?.length || 0}</strong> Crops Licensed</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    <span><strong>{allTiles.length}</strong> Active Services</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Signed in as: <strong className="text-slate-800 font-semibold">{tenantInfo.email || tenantInfo.tenant}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Filters */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-8">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {tabs.map(tab => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                        active 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${active ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedTiles.map(service => {
                const photo = photoFor(service.id);
                return (
                  <div
                    key={service.id}
                    onClick={() => onSelectModule(service.id)}
                    className="group relative flex flex-col bg-white border border-slate-200 hover:border-slate-400 rounded-3xl overflow-hidden cursor-pointer transition-colors"
                  >
                    {/* Photo Thumbnail */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                      <img
                        src={photo}
                        alt={service.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                      

                    </div>

                    {/* Card Body */}
                    <div className="flex-1 flex flex-col p-5">
                      <h3 className="font-display text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {service.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">
                        {service.description}
                      </p>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                        <span className="flex items-center gap-1.5">
                          Open Service
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Consolidated Settings View */
          <div className="space-y-8">
            {/* Settings Header */}
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900">Settings</h2>
              <p className="text-xs text-slate-500 mt-1">
                Manage organization profile, team members, access roles, and account security credentials.
              </p>
            </div>

            {/* 1. Organization & Branding Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-5">
                  <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                      {tenantInfo.logoUrl ? (
                        <img src={tenantInfo.logoUrl} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <Building2 size={36} className="text-slate-400" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-white rounded-2xl transition-all">
                      Change
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-900">{tenantInfo.displayName}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">Organization Identifier: {tenantInfo.tenant}</p>
                    <p className="text-xs text-emerald-700 font-semibold mt-1">Enterprise Subscription Active</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <ImagePlus size={15} />
                  <span>{logoUploading ? 'Uploading Logo...' : 'Upload Brand Logo'}</span>
                </button>
              </div>

              {/* Subscription Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="text-xs text-slate-500 font-medium">Licensed Crops</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">{tenantInfo.allowedCrops?.length || 0}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(tenantInfo.allowedCrops || []).map(c => (
                      <span key={c} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700 uppercase">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="text-xs text-slate-500 font-medium">Active Services</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">{allTiles.length}</p>
                  <p className="text-xs text-slate-500 mt-2">Full access to monitoring, EUDR & AI Advisor</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="text-xs text-slate-500 font-medium">Registered Team Users</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">{teamMembers.length + 1}</p>
                  <p className="text-xs text-slate-500 mt-2">Multi-seat team management active</p>
                </div>
              </div>
            </div>

            {/* 2. Team Members & Roles Section */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900">Organization Team Members</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Assign custom service permissions and operator roles</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
                >
                  <Plus size={15} />
                  <span>Add Team Member</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 mt-4">
                {/* Current Admin Account */}
                <div className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs">
                      ADMIN
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{tenantInfo.email}</p>
                      <p className="text-xs text-slate-500">Primary Tenant Administrator &middot; All Services</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Primary Owner
                  </span>
                </div>

                {/* Team Members */}
                {teamMembers.map(member => (
                  <div key={member.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">{member.name}</p>
                          <span className="text-xs text-slate-400 font-mono">({member.email})</span>
                        </div>
                        <p className="text-xs text-slate-500">Role: <strong className="text-slate-700">{member.role}</strong> &middot; {member.services.length} Services Assigned</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingMember(member)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors"
                        title="Edit team member"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors"
                        title="Remove user"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Password & Security Section (Directly inside Settings) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
              <div className="pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">Password & Security</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Manage your account credentials and workspace security settings</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
                {/* Account Details Side Card */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Account Overview</h4>
                    
                    <div>
                      <span className="block text-[11px] text-slate-500 font-medium">Signed In User</span>
                      <span className="text-xs font-bold text-slate-900 break-all">{tenantInfo.email || 'user@organization.com'}</span>
                    </div>

                    <div>
                      <span className="block text-[11px] text-slate-500 font-medium">Organization Workspace</span>
                      <span className="text-xs font-mono font-bold text-slate-900 uppercase">{tenantInfo.tenant}</span>
                    </div>

                    <div>
                      <span className="block text-[11px] text-slate-500 font-medium">Role & Privileges</span>
                      <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {tenantInfo.role || 'Primary Tenant Administrator'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Check size={14} className="text-emerald-600" />
                        <span>256-bit TLS Encrypted Session</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Change Password Form */}
                <div className="lg:col-span-8">
                  <div className="max-w-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <KeyRound size={16} className="text-slate-700" />
                      <h4 className="text-sm font-bold text-slate-900">Change Password</h4>
                    </div>

                    {passwordError && (
                      <div className="flex items-start gap-2 p-3.5 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="flex items-start gap-2 p-3.5 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                        <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                        <span>Password updated successfully! Your new password is now active.</span>
                      </div>
                    )}

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Password</label>
                        <div className="relative">
                          <input
                            type={showCurrent ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            placeholder="Enter your current password"
                            required
                            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 pr-10 focus:border-emerald-700 focus:outline-none shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrent(!showCurrent)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
                          <div className="relative">
                            <input
                              type={showNew ? 'text' : 'password'}
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              placeholder="Min. 8 characters"
                              required
                              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 pr-10 focus:border-emerald-700 focus:outline-none shadow-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNew(!showNew)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
                          <div className="relative">
                            <input
                              type={showConfirm ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={e => setConfirmPassword(e.target.value)}
                              placeholder="Re-enter new password"
                              required
                              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 pr-10 focus:border-emerald-700 focus:outline-none shadow-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirm(!showConfirm)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={passwordSaving}
                          className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2"
                        >
                          <Lock size={14} />
                          <span>{passwordSaving ? 'Updating Password...' : 'Save New Password'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Team Member Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 lg:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">Add Team Member</h3>
                <p className="text-xs text-slate-500 mt-0.5">Invite an operator or manager to your workspace</p>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddTeamMember} className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="operator@company.com"
                  value={newUserForm.email}
                  onChange={e => setNewUserForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name / Title</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe (Agronomy)"
                  value={newUserForm.name}
                  onChange={e => setNewUserForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role</label>
                <select
                  value={newUserForm.role}
                  onChange={e => setNewUserForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none shadow-xs"
                >
                  <option value="Lead Agronomist">Lead Agronomist</option>
                  <option value="Sustainability Manager">Sustainability Manager</option>
                  <option value="Field Supervisor">Field Supervisor</option>
                  <option value="Operator">Operator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Assign Specific Services</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {allTiles.map(svc => {
                    const checked = newUserForm.assignedServices.includes(svc.id);
                    return (
                      <label key={svc.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            const updated = e.target.checked
                              ? [...newUserForm.assignedServices, svc.id]
                              : newUserForm.assignedServices.filter(x => x !== svc.id);
                            setNewUserForm(f => ({ ...f, assignedServices: updated }));
                          }}
                          className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                        />
                        <span className="truncate">{svc.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                >
                  Invite User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 lg:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">Edit Team Member</h3>
                <p className="text-xs text-slate-500 mt-0.5">Update user name, role, and assigned services</p>
              </div>
              <button onClick={() => setEditingMember(null)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditMember} className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={editingMember.email}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name / Title</label>
                <input
                  type="text"
                  required
                  value={editingMember.name}
                  onChange={e => setEditingMember(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role</label>
                <select
                  value={editingMember.role}
                  onChange={e => setEditingMember(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none shadow-xs"
                >
                  <option value="Lead Agronomist">Lead Agronomist</option>
                  <option value="Sustainability Manager">Sustainability Manager</option>
                  <option value="Field Supervisor">Field Supervisor</option>
                  <option value="Operator">Operator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Assigned Services</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {allTiles.map(svc => {
                    const checked = (editingMember.services || []).includes(svc.id);
                    return (
                      <label key={svc.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            const current = editingMember.services || [];
                            const updated = e.target.checked
                              ? [...current, svc.id]
                              : current.filter(x => x !== svc.id);
                            setEditingMember(prev => ({ ...prev, services: updated }));
                          }}
                          className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                        />
                        <span className="truncate">{svc.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantHub;
