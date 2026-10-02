import React, { useState } from 'react';
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
  Compass
} from 'lucide-react';
import SmallholderOnboardingModal from './components/SmallholderOnboardingModal';
import ClusterMapView from './components/ClusterMapView';
import SmallholderAdvisorView from './components/SmallholderAdvisorView';
import GroupCarbonView from './components/GroupCarbonView';
import EudrPassportView from './components/EudrPassportView';

// Seeded Smallholder Cooperatives
const COOPERATIVES = [
  { id: 'okomu-outgrowers', name: 'Okomu Outgrower Cooperative Society', region: 'Edo State, Nigeria', members: 480, area_ha: 1840.0 },
  { id: 'presco-union', name: 'Presco Smallholder Oil Palm Union', region: 'Delta State, Nigeria', members: 360, area_ha: 1420.0 },
  { id: 'ovia-agroforestry', name: 'Ovia River Cocoa & Agroforestry Cooperative', region: 'Edo State, Nigeria', members: 408, area_ha: 1590.0 },
];

// Seeded Member Outgrower Registry
const INITIAL_MEMBERS = [
  {
    id: 'MEM-OK-0142',
    name: 'Emmanuel Osagie',
    phone: '+234 803 219 4410',
    cluster: 'Cluster Alpha (Ovia North)',
    buying_ramp: 'Ramp 03 - Uhiere Depot',
    primary_crop: 'Oil Palm',
    intercrop: 'Cassava / Maize (Young stage)',
    area_ha: 3.8,
    stand_age_yrs: 6,
    eudr_status: 'Clear',
    certification: 'RSPO IS',
    vigor_percentile: 92,
    sar_rvi: 0.74,
    status: 'Active',
    last_scouted: '28 Sep 2026'
  },
  {
    id: 'MEM-OK-0143',
    name: 'Grace Adesewa',
    phone: '+234 812 449 8812',
    cluster: 'Cluster Alpha (Ovia North)',
    buying_ramp: 'Ramp 01 - Main Weighbridge',
    primary_crop: 'Cocoa',
    intercrop: 'Plantain / Terminalia Shade',
    area_ha: 2.4,
    stand_age_yrs: 12,
    eudr_status: 'Clear',
    certification: 'Rainforest Alliance',
    vigor_percentile: 88,
    sar_rvi: 0.81,
    status: 'Active',
    last_scouted: '29 Sep 2026'
  },
  {
    id: 'MEM-OK-0144',
    name: 'Festus Igbinedion',
    phone: '+234 705 330 9182',
    cluster: 'Cluster Beta (Iguobazuwa)',
    buying_ramp: 'Ramp 04 - Iguobazuwa Station',
    primary_crop: 'Rubber',
    intercrop: 'None (Pure Stand)',
    area_ha: 4.5,
    stand_age_yrs: 8,
    eudr_status: 'Clear',
    certification: 'Fairtrade',
    vigor_percentile: 64,
    sar_rvi: 0.62,
    status: 'Needs Scouting',
    last_scouted: '21 Sep 2026'
  },
  {
    id: 'MEM-OK-0145',
    name: 'Blessing Chukwuma',
    phone: '+234 806 771 2291',
    cluster: 'Cluster Beta (Iguobazuwa)',
    buying_ramp: 'Ramp 04 - Iguobazuwa Station',
    primary_crop: 'Oil Palm',
    intercrop: 'Legume Cover (Mucuna)',
    area_ha: 3.1,
    stand_age_yrs: 5,
    eudr_status: 'Clear',
    certification: 'RSPO IS',
    vigor_percentile: 95,
    sar_rvi: 0.78,
    status: 'Active',
    last_scouted: '30 Sep 2026'
  },
  {
    id: 'MEM-OK-0146',
    name: 'Tariq Al-Mansoor',
    phone: '+234 802 990 1154',
    cluster: 'Cluster Delta (Siluko Basin)',
    buying_ramp: 'Ramp 07 - Siluko Jetty',
    primary_crop: 'Rice',
    intercrop: 'Dry season Vegetables',
    area_ha: 2.0,
    stand_age_yrs: 1,
    eudr_status: 'Clear',
    certification: 'Organic Baseline',
    vigor_percentile: 78,
    sar_rvi: 0.85,
    status: 'Active',
    last_scouted: '01 Oct 2026'
  }
];

const SmallholderPortal = ({ onBack, onSignOut }) => {
  const [selectedCoopId, setSelectedCoopId] = useState('okomu-outgrowers');
  const [activeTab, setActiveTab] = useState('registry'); // 'registry' | 'map' | 'advisor' | 'carbon' | 'eudr'
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCluster, setFilterCluster] = useState('all');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const currentCoop = COOPERATIVES.find(c => c.id === selectedCoopId) || COOPERATIVES[0];

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.primary_crop.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCluster = filterCluster === 'all' || m.cluster.includes(filterCluster);
    return matchesSearch && matchesCluster;
  });

  const handleAddNewMember = (newMemberData) => {
    const newEntry = {
      id: `MEM-OK-0${members.length + 143}`,
      name: newMemberData.farmer_name,
      phone: newMemberData.phone || '+234 800 000 0000',
      cluster: newMemberData.cluster || 'Cluster Alpha (Ovia North)',
      buying_ramp: newMemberData.buying_ramp || 'Ramp 01 - Main Weighbridge',
      primary_crop: newMemberData.primary_crop || 'Oil Palm',
      intercrop: newMemberData.intercrop || 'Agroforestry mix',
      area_ha: parseFloat(newMemberData.area_ha) || 2.5,
      stand_age_yrs: parseInt(newMemberData.stand_age_yrs) || 4,
      eudr_status: 'Clear',
      certification: newMemberData.certification || 'RSPO IS',
      vigor_percentile: 85,
      sar_rvi: 0.76,
      status: 'Active',
      last_scouted: 'Today'
    };
    setMembers([newEntry, ...members]);
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
                {currentCoop.name} • {currentCoop.region}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Cooperative Selector */}
            <select
              value={selectedCoopId}
              onChange={(e) => setSelectedCoopId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
            >
              {COOPERATIVES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

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
            <div className="text-2xl font-bold text-slate-900 mt-2">{members.length + 475}</div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">100% verified identities</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Georeferenced Area</span>
              <MapPin size={16} className="text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{currentCoop.area_ha.toFixed(1)} ha</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">Avg 2.8 ha per smallholder</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">EUDR Clearance</span>
              <ShieldCheck size={16} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">98.8%</div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">31 Dec 2020 baseline clear</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Cluster Vigor Mean</span>
              <TrendingUp size={16} className="text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">84.2%</div>
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

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs font-semibold text-slate-500">Cluster:</span>
                <select
                  value={filterCluster}
                  onChange={(e) => setFilterCluster(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
                >
                  <option value="all">All Outgrower Clusters</option>
                  <option value="Alpha">Cluster Alpha</option>
                  <option value="Beta">Cluster Beta</option>
                  <option value="Delta">Cluster Delta</option>
                </select>
              </div>
            </div>

            {/* Members Table */}
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
                          <span>Top {100 - m.vigor_percentile}%</span>
                          <span className="text-[10px] text-slate-400 font-normal">({m.vigor_percentile}th pct)</span>
                        </div>
                        <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1">
                          <div style={{ width: `${m.vigor_percentile}%` }} className="h-full bg-emerald-600 rounded-full" />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 size={12} />
                          <span>{m.eudr_status}</span>
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
          </div>
        )}

        {activeTab === 'map' && <ClusterMapView members={members} />}
        {activeTab === 'advisor' && <SmallholderAdvisorView selectedMember={selectedMember} onSelectMember={setSelectedMember} />}
        {activeTab === 'carbon' && <GroupCarbonView coop={currentCoop} />}
        {activeTab === 'eudr' && <EudrPassportView members={members} coop={currentCoop} />}
      </main>

      {/* Onboarding Modal */}
      {showOnboardingModal && (
        <SmallholderOnboardingModal
          onClose={() => setShowOnboardingModal(false)}
          onSave={handleAddNewMember}
          coopName={currentCoop.name}
        />
      )}
    </div>
  );
};

export default SmallholderPortal;
