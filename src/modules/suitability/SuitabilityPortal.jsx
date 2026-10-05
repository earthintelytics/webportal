import React, { useState, useEffect } from 'react';
import { ArrowLeft, Target, Plus, Building2, Sparkles, Layers, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import CompanySelector from './components/CompanySelector';
import CropCard from './components/CropCard';
import SuitabilityCropAnalysis from './SuitabilityCropAnalysis';
import { SUITABILITY_CROPS } from './suitabilityCatalog';
import { fetchCompanies, fetchSuitabilityRuns } from './suitabilityApi';

const SuitabilityPortal = ({ onBack, onSignOut }) => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('okomu');
  const [runsMap, setRunsMap] = useState({});
  const [loading, setLoading] = useState(true);

  const [activeCropId, setActiveCropId] = useState(null);
  const [selectedRun, setSelectedRun] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const comps = await fetchCompanies();
      setCompanies(comps);

      const defaultCid = comps.length > 0 ? comps[0].company_id : (localStorage.getItem('fi_tenant') || 'okomu');
      setSelectedCompanyId(defaultCid);
      await loadRunsForCompany(defaultCid);
      setLoading(false);
    }
    loadData();
  }, []);

  const loadRunsForCompany = async (companyId) => {
    const allRuns = await fetchSuitabilityRuns(companyId);
    const map = {};
    allRuns.forEach(run => {
      if (!map[run.crop] || new Date(run.created_at) > new Date(map[run.crop].created_at)) {
        map[run.crop] = run;
      }
    });
    setRunsMap(map);
  };

  const handleSelectCompany = async (companyId) => {
    setSelectedCompanyId(companyId);
    await loadRunsForCompany(companyId);
  };

  if (activeCropId) {
    return (
      <SuitabilityCropAnalysis
        cropId={activeCropId}
        companyId={selectedCompanyId}
        initialRun={selectedRun}
        onBack={() => {
          setActiveCropId(null);
          setSelectedRun(null);
          loadRunsForCompany(selectedCompanyId);
        }}
        onOpenAiAdvisor={(run) => {
          window.location.hash = `#/portal/advisor?run_id=${run.run_id}`;
        }}
      />
    );
  }

  const currentCompany = companies.find(c => c.company_id === selectedCompanyId) || { company_id: selectedCompanyId, company_name: selectedCompanyId.toUpperCase() };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      {/* Portal Navbar matching CropDashboardLayout style */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                title="Back to Portal Hub"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 border border-green-200 flex items-center justify-center font-bold">
                <Target size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  Land Suitability Analysis
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  FAO Land Evaluation Framework • Multi-Criteria Decision Engine
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
          </div>
        </div>
      </header>

      {/* Main Content Area: 8-Crop Evaluation Models Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Crop Land Evaluation Models</h2>
            <p className="text-xs text-gray-600 mt-1 max-w-3xl leading-relaxed font-medium">
              Multi-criteria FAO biophysical assessment across soil, climate, radar flood dynamics, terrain, and statutory gates.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 self-start sm:self-auto">
            {SUITABILITY_CROPS.length} Supported Crop Engines
          </span>
        </div>

        {/* 8 Crop Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SUITABILITY_CROPS.map((crop) => (
            <CropCard
              key={crop.id}
              crop={crop}
              lastRun={runsMap[crop.id]}
              onClick={() => {
                setSelectedRun(null);
                setActiveCropId(crop.id);
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default SuitabilityPortal;
