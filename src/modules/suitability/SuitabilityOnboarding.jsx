import React, { useState } from 'react';
import { Building2, Globe, MapPin, Layers, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import DataFetchProgress from './components/DataFetchProgress';
import { onboardCompany, triggerDataPrefetch, fetchPrefetchProgress, fetchCompanyDataSummary } from './suitabilityApi';

const SuitabilityOnboarding = ({ onComplete }) => {
  const [step, setStep] = useState(1); // 1: Register, 2: Fetch, 3: Summary
  const [formData, setFormData] = useState({
    companyName: '',
    country: 'Nigeria',
    stateRegion: 'Edo State',
    estateName: 'Main Estate',
    isIrrigated: false,
    selectedCrops: ['oil_palm', 'cocoa', 'rubber', 'cashew']
  });

  const [jobId, setJobId] = useState(null);
  const [prefetchProgress, setPrefetchProgress] = useState(0);
  const [prefetchLayers, setPrefetchLayers] = useState([]);
  const [dataSummary, setDataSummary] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName) return;

    setIsSubmitting(true);
    const companyId = formData.companyName.toLowerCase().replace(/\s+/g, '_');

    // 1. Onboard Company
    await onboardCompany({
      company_id: companyId,
      company_name: formData.companyName,
      country: formData.country,
      state_region: formData.stateRegion,
      estates: [{ name: formData.estateName, area_ha: 2500.0 }],
      is_irrigated: formData.isIrrigated,
      crops_of_interest: formData.selectedCrops
    });

    // 2. Trigger Prefetch & move to Step 2
    const fetchJob = await triggerDataPrefetch(companyId);
    setJobId(fetchJob.job_id);
    setStep(2);
    setIsSubmitting(false);

    // Simulate animated prefetch progress
    let currentP = 0;
    const interval = setInterval(async () => {
      currentP += 20;
      if (currentP > 100) currentP = 100;
      setPrefetchProgress(currentP);

      const prog = await fetchPrefetchProgress(companyId, fetchJob.job_id);
      setPrefetchLayers(prog.layers);

      if (currentP >= 100) {
        clearInterval(interval);
        // Load Step 3 Data Summary
        const summary = await fetchCompanyDataSummary(companyId);
        setDataSummary(summary);
        setTimeout(() => {
          setStep(3);
        }, 600);
      }
    }, 600);
  };

  const toggleCrop = (cropId) => {
    setFormData(prev => {
      const exists = prev.selectedCrops.includes(cropId);
      return {
        ...prev,
        selectedCrops: exists
          ? prev.selectedCrops.filter(c => c !== cropId)
          : [...prev.selectedCrops, cropId]
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="max-w-3xl mx-auto w-full text-center mb-10">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
          <Sparkles size={32} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Organisation Onboarding — Suitability Tool
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto font-medium">
          Set up your organization boundary once. All satellite rainfall, DEM terrain, SoilGrids, and forest baseline layers load automatically.
        </p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold ${step === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            <span>1. Registration</span>
          </div>
          <div className="w-6 h-0.5 bg-slate-300" />
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold ${step === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            <span>2. Data Prefetch</span>
          </div>
          <div className="w-6 h-0.5 bg-slate-300" />
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            <span>3. Data Ready</span>
          </div>
        </div>
      </div>

      {/* Step 1: Form */}
      {step === 1 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-2xl mx-auto w-full shadow-sm">
          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Organisation / Company Name *
              </label>
              <div className="relative">
                <Building2 size={18} className="absolute left-4 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Okomu Oil Palm Company PLC"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Country *
                </label>
                <div className="relative">
                  <Globe size={18} className="absolute left-4 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  State / Region
                </label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={formData.stateRegion}
                    onChange={(e) => setFormData({ ...formData, stateRegion: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Main Estate / Farm Boundary Name
              </label>
              <input
                type="text"
                value={formData.estateName}
                onChange={(e) => setFormData({ ...formData, estateName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all font-medium"
              />
            </div>

            {/* Irrigated Toggle */}
            <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200 text-sm">Irrigated Operations Available?</div>
                <div className="text-slate-400 text-xs mt-0.5">Relaxes rainfall factor thresholds for paddy & sugarcane</div>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isIrrigated: !prev.isIrrigated }))}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${formData.isIrrigated ? 'bg-emerald-500' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.isIrrigated ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-emerald-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
            >
              <span>Confirm & Start Layer Prefetch</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Prefetch Progress */}
      {step === 2 && (
        <DataFetchProgress
          layers={prefetchLayers}
          overallProgress={prefetchProgress}
          estimatedRemaining={1}
        />
      )}

      {/* Step 3: Data Summary */}
      {step === 3 && dataSummary && (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-8 max-w-2xl mx-auto w-full shadow-2xl backdrop-blur-md">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-xl font-bold text-white">
              {dataSummary.estate_name || 'Estate Data Ready'}
            </h3>
            <p className="text-xs text-slate-400">
              8-Metric environmental prefetch summary verified for suitability analysis.
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {dataSummary.metrics?.map((m, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-200">{m.factor}</div>
                  <div className="text-[11px] text-slate-400">{m.label}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white text-sm">{m.value}</div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center justify-end gap-1"><CheckCircle2 size={12} /> Verified</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onComplete(formData.companyName.toLowerCase().replace(/\s+/g, '_'))}
            className="w-full py-4 bg-emerald-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
          >
            <span>Confirm & Open Crop Suitability Tool</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SuitabilityOnboarding;
