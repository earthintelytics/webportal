import React, { useState } from 'react';
import { 
  X, 
  User, 
  MapPin, 
  FileText, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Compass, 
  Upload, 
  Sparkles,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

const SmallholderOnboardingModal = ({ onClose, onSave, coopName }) => {
  const [step, setStep] = useState(1); // 1: Profile | 2: GPS Walk | 3: Agronomic & Tenure | 4: Certifications

  const [formData, setFormData] = useState({
    farmer_name: '',
    phone: '',
    gender: 'Male',
    national_id: '',
    cluster: 'Cluster Alpha (Ovia North)',
    buying_ramp: 'Ramp 01 - Main Weighbridge',
    extension_officer: 'Mr. Jude Egharevba',
    area_ha: 2.8,
    boundary_method: 'gps_walk', // 'gps_walk' | 'centroid_radius'
    primary_crop: 'Oil Palm',
    intercrop: 'Cassava & Plantain',
    stand_age_yrs: 5,
    tree_count: 380,
    tenure_type: 'Customary Chief Consent',
    certification: 'RSPO IS',
  });

  const [areaWarning, setAreaWarning] = useState(null);

  const handleAreaChange = (val) => {
    const num = parseFloat(val) || 0;
    setFormData({ ...formData, area_ha: num });
    if (num > 10.0) {
      setAreaWarning('Area exceeds 10 ha typical threshold for smallholder outgrowers. Please verify boundary walk.');
    } else {
      setAreaWarning(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.farmer_name.trim()) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              {coopName} Outgrower Registry
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              Onboard Smallholder Member (Step {step} of 4)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-4 border-b border-slate-100 text-[11px] font-semibold text-center">
          <div className={`py-2.5 border-b-2 ${step === 1 ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40' : 'border-transparent text-slate-400'}`}>
            1. Farmer Profile
          </div>
          <div className={`py-2.5 border-b-2 ${step === 2 ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40' : 'border-transparent text-slate-400'}`}>
            2. GPS Boundary
          </div>
          <div className={`py-2.5 border-b-2 ${step === 3 ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40' : 'border-transparent text-slate-400'}`}>
            3. Tenure & Crop
          </div>
          <div className={`py-2.5 border-b-2 ${step === 4 ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40' : 'border-transparent text-slate-400'}`}>
            4. Certifications
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Farmer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Osaro Kenneth Osayande"
                  value={formData.farmer_name}
                  onChange={(e) => setFormData({ ...formData, farmer_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Primary Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+234 800 000 0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    National ID / Coop Union ID
                  </label>
                  <input
                    type="text"
                    placeholder="NIN-782910394"
                    value={formData.national_id}
                    onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Outgrower Cluster Assignment
                  </label>
                  <select
                    value={formData.cluster}
                    onChange={(e) => setFormData({ ...formData, cluster: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800"
                  >
                    <option value="Cluster Alpha (Ovia North)">Cluster Alpha (Ovia North)</option>
                    <option value="Cluster Beta (Iguobazuwa)">Cluster Beta (Iguobazuwa)</option>
                    <option value="Cluster Delta (Siluko Basin)">Cluster Delta (Siluko Basin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Assigned Buying Ramp / Depot
                  </label>
                  <select
                    value={formData.buying_ramp}
                    onChange={(e) => setFormData({ ...formData, buying_ramp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800"
                  >
                    <option value="Ramp 01 - Main Weighbridge">Ramp 01 - Main Weighbridge</option>
                    <option value="Ramp 03 - Uhiere Depot">Ramp 03 - Uhiere Depot</option>
                    <option value="Ramp 04 - Iguobazuwa Station">Ramp 04 - Iguobazuwa Station</option>
                    <option value="Ramp 07 - Siluko Jetty">Ramp 07 - Siluko Jetty</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Boundary Delineation Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, boundary_method: 'gps_walk' })}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      formData.boundary_method === 'gps_walk'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold mb-0.5">Mobile GPS Boundary Walk</div>
                    <div className="text-[11px] text-slate-500 font-normal">Walk perimeter with mobile app to log &ge; 4 GPS vertices.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, boundary_method: 'centroid_radius' })}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      formData.boundary_method === 'centroid_radius'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold mb-0.5">Centroid Point + Radius</div>
                    <div className="text-[11px] text-slate-500 font-normal">Fast capture for small plots with verified radius buffer.</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Measured Parcel Area (Hectares)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  max="100.0"
                  value={formData.area_ha}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
                {areaWarning && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
                    <AlertCircle size={15} className="shrink-0 text-amber-600" />
                    <span>{areaWarning}</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Automated Spatial Conflict Check Active</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Parcel polygon will be screened in real-time against neighboring member coordinates to prevent duplicate land claims.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Primary Crop
                  </label>
                  <select
                    value={formData.primary_crop}
                    onChange={(e) => setFormData({ ...formData, primary_crop: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800"
                  >
                    <option value="Oil Palm">Oil Palm</option>
                    <option value="Cocoa">Cocoa</option>
                    <option value="Rubber">Rubber</option>
                    <option value="Cashew">Cashew</option>
                    <option value="Rice">Rice</option>
                    <option value="Cassava">Cassava</option>
                    <option value="Maize">Maize</option>
                    <option value="Sugarcane">Sugarcane</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Stand Age (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.stand_age_yrs}
                    onChange={(e) => setFormData({ ...formData, stand_age_yrs: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Intercropping & Agroforestry Shade Matrix
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plantain, Terminalia ivorensis, Legume cover crop"
                  value={formData.intercrop}
                  onChange={(e) => setFormData({ ...formData, intercrop: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Land Tenure Documentation
                </label>
                <select
                  value={formData.tenure_type}
                  onChange={(e) => setFormData({ ...formData, tenure_type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800"
                >
                  <option value="Customary Chief Consent">Customary Community Chief Consent</option>
                  <option value="Formal Leasehold Agreement">Formal Registered Lease Agreement</option>
                  <option value="Statutory Certificate of Occupancy">Statutory Certificate of Occupancy (C of O)</option>
                  <option value="Family Inheritance Partition">Family Inheritance Partition Deed</option>
                </select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Certification Program
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['RSPO IS', 'Rainforest Alliance', 'Fairtrade', 'Organic Baseline'].map((cert) => (
                    <button
                      key={cert}
                      type="button"
                      onClick={() => setFormData({ ...formData, certification: cert })}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        formData.certification === cert
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold">{cert}</div>
                      <div className="text-[11px] text-slate-500 font-normal">Audit-ready documentation</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-700" />
                  <span>EUDR Due Diligence Passport Automated</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Onboarding automatically screens this parcel coordinates against the 31 Dec 2020 Forest Baseline map.
                </p>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <CheckCircle2 size={15} />
                <span>Complete Outgrower Onboarding</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SmallholderOnboardingModal;
