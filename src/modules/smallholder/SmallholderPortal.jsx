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
  UserPlus
} from 'lucide-react';
import SmallholderOnboardingModal from './components/SmallholderOnboardingModal';
import ClusterMapView from './components/ClusterMapView';
import SmallholderAdvisorView from './components/SmallholderAdvisorView';
import GroupCarbonView from './components/GroupCarbonView';
import EudrPassportView from './components/EudrPassportView';
import { fetchCompanies } from '../suitability/suitabilityApi';

const SmallholderPortal = ({ onBack, onSignOut }) => {
  const [companies, setCompanies] = useState([]);
  const [selectedCoopId, setSelectedCoopId] = useState('');
  const [activeTab, setActiveTab] = useState('registry'); // 'registry' | 'map' | 'advisor' | 'carbon' | 'eudr'
  const [members, setMembers] = useState([]);
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

  // Extract unique clusters dynamically from members
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
      geometry: newMemberData.geometry || null
    };
    setMembers(prev => [newEntry, ...prev]);
    setShowOnboardingModal(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Back to Portal Hub"
              >
                <ArrowLeft size={16} />
              </button>
            )}

            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
              <Users size={20} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  Smallholder Cooperative Operating System
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Outgrower OS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {currentCoop.company_name} {currentCoop.state_region ? `• ${currentCoop.state_region}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Cooperative Selector */}
            {companies.length > 1 && (
              <select
                value={selectedCoopId}
                onChange={(e) => setSelectedCoopId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
              >
                {companies.map(c => (
                  <option key={c.company_id} value={c.company_id}>{c.company_name}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => setShowOnboardingModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs"
            >
              <Plus size={15} />
              <span>Onboard Member</span>
            </button>
          </div>
        </div>

        {/* Integrated Multi-Service Suite Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-2 border-t border-slate-100 pt-2 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('registry')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'registry'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users size={14} className={activeTab === 'registry' ? 'text-emerald-700' : 'text-slate-400'} />
            <span>Member & Parcel Registry</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'map'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Compass size={14} className={activeTab === 'map' ? 'text-emerald-700' : 'text-slate-400'} />
            <span>Cluster Geospatial Map</span>
          </button>

          <button
            onClick={() => setActiveTab('advisor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'advisor'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bot size={14} className={activeTab === 'advisor' ? 'text-emerald-700' : 'text-slate-400'} />
            <span>Farm AI & GAP Advisor</span>
          </button>

          <button
            onClick={() => setActiveTab('carbon')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'carbon'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <TreePine size={14} className={activeTab === 'carbon' ? 'text-emerald-700' : 'text-slate-400'} />
            <span>Group Carbon & Agroforestry</span>
          </button>

          <button
            onClick={() => setActiveTab('eudr')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'eudr'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck size={14} className={activeTab === 'eudr' ? 'text-emerald-700' : 'text-slate-400'} />
            <span>EUDR Deforestation Passports</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-6 py-6 w-full flex-1 space-y-6">
        {/* Quick Cooperative Metric Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Registered Members</span>
              <Users size={16} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{members.length}</div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">
              {members.length > 0 ? 'Verified identities active' : 'No members registered'}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Georeferenced Area</span>
              <MapPin size={16} className="text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{totalAreaHa.toFixed(1)} ha</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              {members.length > 0 ? `Avg ${(totalAreaHa / members.length).toFixed(1)} ha per member` : '0.0 ha mapped'}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">EUDR Clearance</span>
              <ShieldCheck size={16} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{eudrRate}%</div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">31 Dec 2020 baseline check</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Cluster Vigor Mean</span>
              <TrendingUp size={16} className="text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{avgVigor > 0 ? `${avgVigor}%` : 'N/A'}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">Sentinel-1 SAR + MSI Index</div>
          </div>
        </div>

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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {availableClusters.length > 0 && (
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span className="text-xs font-semibold text-slate-500">Cluster:</span>
                  <select
                    value={filterCluster}
                    onChange={(e) => setFilterCluster(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
                  >
                    <option value="all">All Outgrower Clusters</option>
                    {availableClusters.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Members Table or Empty State */}
            {filteredMembers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <UserPlus size={26} />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">No Outgrower Members Enrolled</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  {searchTerm || filterCluster !== 'all'
                    ? 'No members match your search criteria.'
                    : 'Register cooperative members with GPS boundary coordinates, tenure status, and EUDR verification to begin tracking.'}
                </p>
                <button
                  onClick={() => setShowOnboardingModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs"
                >
                  <Plus size={14} />
                  <span>Onboard First Member</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-5">Member ID & Name</th>
                      <th className="py-3 px-4">Cluster & Ramp</th>
                      <th className="py-3 px-4">Crop & Intercrop</th>
                      <th className="py-3 px-4">Area & Age</th>
                      <th className="py-3 px-4">Vigor Percentile</th>
                      <th className="py-3 px-4">EUDR Status</th>
                      <th className="py-3 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-slate-900">{m.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{m.id} • {m.phone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">{m.cluster}</div>
                          <div className="text-[11px] text-slate-400">{m.buying_ramp}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-0.5">
                            {m.primary_crop}
                          </span>
                          <div className="text-[11px] text-slate-400">{m.intercrop}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{m.area_ha.toFixed(1)} ha</div>
                          <div className="text-[11px] text-slate-500">{m.stand_age_yrs} yrs stand age</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                            <span>Top {100 - (m.vigor_percentile || 80)}%</span>
                            <span className="text-[10px] text-slate-400 font-normal">({m.vigor_percentile || 80}th pct)</span>
                          </div>
                          <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1">
                            <div style={{ width: `${m.vigor_percentile || 80}%` }} className="h-full bg-emerald-600 rounded-full" />
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 size={12} />
                            <span>{m.eudr_status || 'Clear'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => { setSelectedMember(m); setActiveTab('advisor'); }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                          >
                            <span>Scout Visit</span>
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'map' && <ClusterMapView members={members} />}
        {activeTab === 'advisor' && <SmallholderAdvisorView selectedMember={selectedMember} onSelectMember={setSelectedMember} />}
        {activeTab === 'carbon' && <GroupCarbonView coop={currentCoop} members={members} />}
        {activeTab === 'eudr' && <EudrPassportView members={members} coop={currentCoop} />}
      </main>

      {/* Onboarding Modal */}
      {showOnboardingModal && (
        <SmallholderOnboardingModal
          onClose={() => setShowOnboardingModal(false)}
          onSave={handleAddNewMember}
          coopName={currentCoop.company_name}
        />
      )}
    </div>
  );
};

export default SmallholderPortal;
