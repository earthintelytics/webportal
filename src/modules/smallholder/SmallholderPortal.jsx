import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  MapPin, 
  Plus, 
  ShieldCheck, 
  Sparkles, 
  TreePine, 
  FileCheck, 
  Layers, 
  Search, 
  Filter, 
  ChevronRight, 
  Bot, 
  Calendar, 
  Download, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Compass,
  UserPlus,
  LayoutGrid,
  FileSpreadsheet,
  Activity,
  ArrowRight
} from 'lucide-react';
import SmallholderOnboardingModal from './components/SmallholderOnboardingModal';
import ClusterMapView from './components/ClusterMapView';
import SmallholderAdvisorView from './components/SmallholderAdvisorView';
import GroupCarbonView from './components/GroupCarbonView';
import EudrPassportView from './components/EudrPassportView';
import { fetchCompanies } from '../suitability/suitabilityApi';

const SMALLHOLDER_SERVICES = [
  {
    id: 'registry',
    title: 'Member Onboarding & Parcel Registry',
    shortDesc: 'Register smallholder farmers, KYC profiles, and upload farm boundaries (.kml, .kmz, .shp, .zip, .geojson).',
    badge: 'Core Outgrower OS',
    badgeColor: 'bg-emerald-100 text-[#16a34a] border-emerald-200',
    icon: Users,
    photo: '/crops/smallholder.webp',
    action: 'Open Member Registry & Onboarding'
  },
  {
    id: 'map',
    title: 'Cluster Geospatial Map',
    shortDesc: 'Interactive GIS satellite map displaying farmer parcel polygons, buying ramps, and vigor heatmaps.',
    badge: 'Satellite GIS',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Compass,
    photo: '/crops/forestry.webp',
    action: 'Open Cluster Map'
  },
  {
    id: 'advisor',
    title: 'Smallholder GAP & AI Advisor',
    shortDesc: 'Good Agricultural Practices (GAP) advisory, cluster fertilizer timing, and scouting recommendations.',
    badge: 'Agronomic AI',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: Bot,
    photo: '/crops/advisor.webp',
    action: 'Open Farm Advisor'
  },
  {
    id: 'carbon',
    title: 'Group Carbon & Agroforestry',
    shortDesc: 'Cooperative biomass carbon stock estimation, shade tree counts, and additionality tracking.',
    badge: 'Carbon Offsets',
    badgeColor: 'bg-green-100 text-emerald-800 border-green-200',
    icon: TreePine,
    photo: '/crops/group_carbon.webp',
    action: 'Open Group Carbon'
  },
  {
    id: 'eudr',
    title: 'EUDR Deforestation Passports',
    shortDesc: 'Export-ready EUDR compliance passports, 31 Dec 2020 JRC Forest baseline screening, and geolocations.',
    badge: 'Statutory Compliance',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: ShieldCheck,
    photo: '/crops/eudr.webp',
    action: 'Open EUDR Passports'
  }
];

const SmallholderPortal = ({ onBack, onSignOut }) => {
  const [companies, setCompanies] = useState([]);
  const [selectedCoopId, setSelectedCoopId] = useState('');
  const [viewMode, setViewMode] = useState('hub'); // 'hub' | 'service'
  const [activeTab, setActiveTab] = useState('registry'); // 'registry' | 'map' | 'advisor' | 'carbon' | 'eudr'
  const [members, setMembers] = useState([
    {
      id: 'MEM-OKO-0001',
      name: 'Emmanuel Adeyemi',
      phone: '+234 803 123 4567',
      cluster: 'Udo Cluster A',
      buying_ramp: 'Ramp 1 (Main Mill)',
      primary_crop: 'Oil Palm',
      intercrop: 'Cassava / Legumes',
      area_ha: 3.8,
      stand_age_yrs: 6,
      eudr_status: 'Clear',
      certification: 'RSPO IS',
      vigor_percentile: 88,
      sar_rvi: 0.81,
      status: 'Active',
      last_scouted: 'Yesterday'
    },
    {
      id: 'MEM-OKO-0002',
      name: 'Grace Oviawe',
      phone: '+234 802 987 6543',
      cluster: 'Udo Cluster A',
      buying_ramp: 'Ramp 1 (Main Mill)',
      primary_crop: 'Oil Palm',
      intercrop: 'Cover Crops',
      area_ha: 2.4,
      stand_age_yrs: 4,
      eudr_status: 'Clear',
      certification: 'RSPO IS',
      vigor_percentile: 92,
      sar_rvi: 0.84,
      status: 'Active',
      last_scouted: '3 days ago'
    },
    {
      id: 'MEM-OKO-0003',
      name: 'Osasere Igbinedion',
      phone: '+234 814 555 7890',
      cluster: 'Iguoriakhi Cluster B',
      buying_ramp: 'Ramp 2 (North Depot)',
      primary_crop: 'Oil Palm',
      intercrop: 'Maize',
      area_ha: 5.1,
      stand_age_yrs: 8,
      eudr_status: 'Clear',
      certification: 'Fairtrade',
      vigor_percentile: 79,
      sar_rvi: 0.74,
      status: 'Active',
      last_scouted: '1 week ago'
    },
    {
      id: 'MEM-OKO-0004',
      name: 'Blessing Okon',
      phone: '+234 805 222 3456',
      cluster: 'Ofunmwegbe Cluster C',
      buying_ramp: 'Ramp 3 (East Collection)',
      primary_crop: 'Cocoa',
      intercrop: 'Plantain Shade',
      area_ha: 4.2,
      stand_age_yrs: 5,
      eudr_status: 'Clear',
      certification: 'Rainforest Alliance',
      vigor_percentile: 84,
      sar_rvi: 0.78,
      status: 'Active',
      last_scouted: '4 days ago'
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCluster, setFilterCluster] = useState('all');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load real companies/cooperatives from backend
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const comps = await fetchCompanies();
        if (isMounted && Array.isArray(comps) && comps.length > 0) {
          setCompanies(comps);
          const activeTenant = localStorage.getItem('fi_tenant') || comps[0].company_id;
          const match = comps.find(c => c.company_id === activeTenant) || comps[0];
          setSelectedCoopId(match.company_id);
        } else if (isMounted) {
          const defaultCoop = { company_id: 'default', company_name: 'Outgrower Cooperative Union', country: 'Nigeria', state_region: 'Edo State', estates: [] };
          setCompanies([defaultCoop]);
          setSelectedCoopId('default');
        }
      } catch (err) {
        console.error('Error fetching cooperatives:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const currentCoop = companies.find(c => c.company_id === selectedCoopId) || companies[0] || {
    company_id: selectedCoopId || 'coop',
    company_name: 'Outgrower Cooperative Society',
    state_region: 'Main Region',
    estates: []
  };

  const totalAreaHa = members.reduce((sum, m) => sum + (parseFloat(m.area_ha) || 0), 0);
  const clearEudrMembers = members.filter(m => m.eudr_status === 'Clear').length;
  const eudrRate = members.length > 0 ? ((clearEudrMembers / members.length) * 100).toFixed(1) : '100.0';
  const avgVigor = members.length > 0 
    ? Math.round(members.reduce((sum, m) => sum + (m.vigor_percentile || 80), 0) / members.length)
    : 0;

  const availableClusters = Array.from(new Set(members.map(m => m.cluster).filter(Boolean)));

  const filteredMembers = members.filter(m => {
    const matchesSearch = (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.primary_crop || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCluster = filterCluster === 'all' || (m.cluster || '').includes(filterCluster);
    return matchesSearch && matchesCluster;
  });

  const handleAddNewMember = (newMemberData) => {
    const newEntry = {
      id: `MEM-${(selectedCoopId || 'COOP').substring(0, 3).toUpperCase()}-${String(members.length + 1).padStart(4, '0')}`,
      name: newMemberData.farmer_name,
      phone: newMemberData.phone || '+234 800 000 0000',
      cluster: newMemberData.cluster || 'Cluster 1',
      buying_ramp: newMemberData.buying_ramp || 'Ramp Depot',
      primary_crop: newMemberData.primary_crop || 'Oil Palm',
      intercrop: newMemberData.intercrop || 'Agroforestry mix',
      area_ha: parseFloat(newMemberData.area_ha) || 2.5,
      stand_age_yrs: parseInt(newMemberData.stand_age_yrs) || 4,
      eudr_status: 'Clear',
      certification: newMemberData.certification || 'RSPO IS',
      vigor_percentile: 85,
      sar_rvi: 0.76,
      status: 'Active',
      last_scouted: 'Today',
      boundary_file_name: newMemberData.boundary_file_name || null,
      geometry: newMemberData.geometry || null
    };
    setMembers(prev => [newEntry, ...prev]);
    setShowOnboardingModal(false);
  };

  const handleOpenService = (serviceId) => {
    setActiveTab(serviceId);
    setViewMode('service');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 1: SMALLHOLDER MULTI-SERVICE HUB LAUNCHPAD (Organization-style)
  // ═══════════════════════════════════════════════════════════════════════════
  if (viewMode === 'hub') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
        {/* Hub Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs px-6 lg:px-10 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Back to Platform Hub"
              >
                <ArrowLeft size={17} />
              </button>
            )}

            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
              <Users size={22} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg font-bold text-slate-900 tracking-tight">
                  Smallholder Cooperative Operating System
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Outgrower OS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {currentCoop.company_name} {currentCoop.state_region ? `• ${currentCoop.state_region}` : ''}
              </p>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10 w-full flex-1 space-y-8">
          {/* Welcome Banner */}
          <div className="relative rounded-3xl p-8 lg:p-10 overflow-hidden bg-white border border-slate-200 shadow-xs">
            <div className="max-w-2xl relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-4">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Smallholder & Outgrower Operations Suite</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-slate-900 tracking-tight leading-tight">
                Cooperative Services & <br />
                <span className="text-emerald-700">Outgrower Intelligence Hub</span>
              </h2>
              <p className="mt-3 text-sm lg:text-base text-slate-600 leading-relaxed">
                Select an outgrower service below to manage member onboarding, inspect cluster GIS satellite telemetry, consult the agronomic GAP advisor, evaluate group carbon stocks, or export verified EUDR deforestation passports.
              </p>
            </div>
          </div>

          {/* 5 Service Cards Grid (Matching TenantHub photographic design) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SMALLHOLDER_SERVICES.map(svc => {
              return (
                <div
                  key={svc.id}
                  onClick={() => handleOpenService(svc.id)}
                  className="group relative flex flex-col bg-white border border-slate-200 hover:border-slate-400 rounded-3xl overflow-hidden cursor-pointer transition-colors"
                >
                  {/* Photo Thumbnail */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={svc.photo}
                      alt={svc.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/crops/smallholder.webp'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-700 shadow-xs border border-white/40">
                      {svc.badge}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex-1 flex flex-col p-5">
                    <h3 className="font-display text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {svc.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">
                      {svc.shortDesc}
                    </p>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                      <span className="flex items-center gap-1.5">
                        {svc.action}
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 2: DEDICATED SERVICE DRILL-DOWN VIEW (With Back to Smallholder Hub)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('hub')}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Back to Smallholder Hub"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Hub</span>
            </button>

            <div className="w-10 h-10 rounded-xl bg-[#16a34a] text-white flex items-center justify-center font-bold shadow-xs">
              <Users size={20} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  Smallholder Cooperative Operating System
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-[#16a34a] border border-green-200">
                  Outgrower OS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {currentCoop.company_name} {currentCoop.state_region ? `• ${currentCoop.state_region}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowOnboardingModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
            >
              <Plus size={15} />
              <span>Onboard Member</span>
            </button>
          </div>
        </div>

        {/* Integrated Multi-Service Suite Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-2 border-t border-slate-100 pt-2 pb-2 overflow-x-auto">
          {SMALLHOLDER_SERVICES.map(svc => {
            const Icon = svc.icon;
            const isActive = activeTab === svc.id;
            return (
              <button
                key={svc.id}
                onClick={() => setActiveTab(svc.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-green-50 text-[#16a34a] border border-green-200 shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[#16a34a]' : 'text-slate-400'} />
                <span>{svc.title}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-6 py-6 w-full flex-1 space-y-6">
        {/* Tab Views */}
        {activeTab === 'registry' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            {/* Table Filters & Search */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search farmer name, ID, or crop..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#16a34a]"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                  <Filter size={14} />
                  <span>Cluster:</span>
                </div>
                <select
                  value={filterCluster}
                  onChange={(e) => setFilterCluster(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#16a34a]"
                >
                  <option value="all">All Clusters</option>
                  {availableClusters.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <button
                  onClick={() => setShowOnboardingModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                >
                  <UserPlus size={14} />
                  <span>+ Onboard Farmer</span>
                </button>
              </div>
            </div>

            {/* Members Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Member ID & Name</th>
                    <th className="py-3 px-4">Cluster & Ramp</th>
                    <th className="py-3 px-4">Crop & Area</th>
                    <th className="py-3 px-4">EUDR Status</th>
                    <th className="py-3 px-4">Canopy Vigor</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        No members found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{m.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{m.id} • {m.phone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{m.cluster}</div>
                          <div className="text-[11px] text-slate-500">{m.buying_ramp}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{m.primary_crop} ({m.area_ha} ha)</div>
                          <div className="text-[11px] text-slate-500">{m.intercrop} • {m.stand_age_yrs} yrs</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-[#16a34a] border border-green-200">
                            <CheckCircle2 size={11} />
                            <span>EUDR Deforestation-Free</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div style={{ width: `${m.vigor_percentile}%` }} className="bg-[#16a34a] h-full" />
                            </div>
                            <span className="font-bold text-slate-800 text-[11px]">{m.vigor_percentile}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedMember(m)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 hover:bg-[#16a34a] text-[#16a34a] hover:text-white border border-green-200 transition-colors shadow-2xs"
                          >
                            View Parcel
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <ClusterMapView 
            members={members}
            coopName={currentCoop.company_name}
            onSelectMember={(m) => setSelectedMember(m)}
          />
        )}

        {activeTab === 'advisor' && (
          <SmallholderAdvisorView 
            members={members}
            coopName={currentCoop.company_name}
          />
        )}

        {activeTab === 'carbon' && (
          <GroupCarbonView 
            members={members}
            coopName={currentCoop.company_name}
          />
        )}

        {activeTab === 'eudr' && (
          <EudrPassportView 
            members={members}
            coopName={currentCoop.company_name}
          />
        )}
      </main>

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-green-50 text-[#16a34a] flex items-center justify-center font-bold">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedMember.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedMember.id} • {selectedMember.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Cluster Group</span>
                <span className="font-bold text-slate-800">{selectedMember.cluster}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Buying Ramp</span>
                <span className="font-bold text-slate-800">{selectedMember.buying_ramp}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Farm Size</span>
                <span className="font-bold text-slate-800">{selectedMember.area_ha} Hectares</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Stand Age</span>
                <span className="font-bold text-slate-800">{selectedMember.stand_age_yrs} Years</span>
              </div>
            </div>

            <div className="p-3.5 bg-green-50/70 border border-green-200 rounded-xl flex items-center gap-3 text-xs">
              <ShieldCheck size={20} className="text-[#16a34a] shrink-0" />
              <div>
                <span className="font-bold text-[#16a34a] block">EUDR 2020 Deforestation Screened</span>
                <span className="text-slate-600 text-[11px]">Zero forest disturbance detected on polygon since 31 Dec 2020 baseline.</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close Parcel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      <SmallholderOnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onAddMember={handleAddNewMember}
        existingClusters={availableClusters}
      />
    </div>
  );
};

export default SmallholderPortal;
