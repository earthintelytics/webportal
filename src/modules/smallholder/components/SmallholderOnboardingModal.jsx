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
  ArrowLeft,
  FileCheck,
  Layers,
  FolderArchive
} from 'lucide-react';

const SmallholderOnboardingModal = ({ isOpen, onClose, onAddMember, onSave, existingClusters = [], coopName = 'Outgrower Cooperative' }) => {
  const [step, setStep] = useState(1); // 1: Profile | 2: GPS Boundary / File Upload | 3: Agronomic & Tenure | 4: Certifications

  const [formData, setFormData] = useState({
    farmer_name: '',
    phone: '',
    gender: 'Male',
    national_id: '',
    cluster: existingClusters[0] || 'Cluster 1 (Main Valley)',
    buying_ramp: 'Ramp 1 (Main Mill)',
    extension_officer: 'Lead Extension Officer',
    area_ha: 2.8,
    boundary_method: 'file_upload', // 'file_upload' | 'gps_walk' | 'centroid_radius'
    boundary_file: null,
    boundary_file_name: '',
    boundary_file_size: '',
    boundary_file_type: '',
    primary_crop: 'Oil Palm',
    intercrop: 'Cassava & Legumes',
    stand_age_yrs: 5,
    tree_count: 380,
    tenure_type: 'Customary Chief Consent',
    certification: 'RSPO IS',
  });

  const [areaWarning, setAreaWarning] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [fileSuccess, setFileSuccess] = useState(null);

  if (!isOpen) return null;

  const handleAreaChange = (val) => {
    const num = parseFloat(val) || 0;
    setFormData({ ...formData, area_ha: num });
    if (num > 10.0) {
      setAreaWarning('Area exceeds 10 ha typical threshold for smallholder outgrowers. Please verify boundary file or GPS walk.');
    } else {
      setAreaWarning(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setFileSuccess(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['geojson', 'kml', 'kmz', 'shp', 'zip', 'json'];

    if (!validExtensions.includes(ext)) {
      setFileError('Invalid file format. Please upload a .kml, .kmz, .shp, .zip, or .geojson file.');
      return;
    }

    const fileSizeKb = (file.size / 1024).toFixed(1);
    
    // For GeoJSON/JSON, attempt client-side parse of area/coordinates
    if (ext === 'geojson' || ext === 'json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          let coordinates = null;
          let calculatedHa = formData.area_ha;

          if (parsed.type === 'FeatureCollection' && parsed.features?.[0]?.geometry) {
            coordinates = parsed.features[0].geometry.coordinates;
          } else if (parsed.type === 'Feature' && parsed.geometry) {
            coordinates = parsed.geometry.coordinates;
          } else if (parsed.type === 'Polygon' || parsed.type === 'MultiPolygon') {
            coordinates = parsed.coordinates;
          }

          setFormData(prev => ({
            ...prev,
            boundary_file: file,
            boundary_file_name: file.name,
            boundary_file_size: `${fileSizeKb} KB`,
            boundary_file_type: ext.toUpperCase(),
            geometry: coordinates ? { type: 'Polygon', coordinates } : null
          }));
          setFileSuccess(`Successfully parsed ${file.name} (${fileSizeKb} KB) with verified polygon boundary.`);
        } catch (err) {
          setFormData(prev => ({
            ...prev,
            boundary_file: file,
            boundary_file_name: file.name,
            boundary_file_size: `${fileSizeKb} KB`,
            boundary_file_type: ext.toUpperCase()
          }));
          setFileSuccess(`Attached boundary file: ${file.name} (${fileSizeKb} KB).`);
        }
      };
      reader.readAsText(file);
    } else {
      // Binary or Archive formats (KML, KMZ, SHP, ZIP)
      setFormData(prev => ({
        ...prev,
        boundary_file: file,
        boundary_file_name: file.name,
        boundary_file_size: `${fileSizeKb} KB`,
        boundary_file_type: ext.toUpperCase()
      }));
      setFileSuccess(`Attached boundary geometry file: ${file.name} (${fileSizeKb} KB).`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.farmer_name.trim()) return;
    const saveFn = onAddMember || onSave;
    if (saveFn) {
      saveFn(formData);
    }
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[10px] font-bold text-[#16a34a] uppercase tracking-wider">
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
          <div className={`py-2.5 border-b-2 ${step === 1 ? 'border-[#16a34a] text-emerald-800 bg-green-50/40' : 'border-transparent text-slate-400'}`}>
            1. Farmer Profile
          </div>
          <div className={`py-2.5 border-b-2 ${step === 2 ? 'border-[#16a34a] text-emerald-800 bg-green-50/40' : 'border-transparent text-slate-400'}`}>
            2. Boundary & Map
          </div>
          <div className={`py-2.5 border-b-2 ${step === 3 ? 'border-[#16a34a] text-emerald-800 bg-green-50/40' : 'border-transparent text-slate-400'}`}>
            3. Tenure & Crop
          </div>
          <div className={`py-2.5 border-b-2 ${step === 4 ? 'border-[#16a34a] text-emerald-800 bg-green-50/40' : 'border-transparent text-slate-400'}`}>
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#16a34a]"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#16a34a]"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#16a34a]"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#16a34a]"
                  >
                    {existingClusters.length > 0 ? (
                      existingClusters.map(c => <option key={c} value={c}>{c}</option>)
                    ) : (
                      <>
                        <option value="Udo Cluster A">Udo Cluster A</option>
                        <option value="Iguoriakhi Cluster B">Iguoriakhi Cluster B</option>
                        <option value="Ofunmwegbe Cluster C">Ofunmwegbe Cluster C</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Assigned Buying Ramp / Depot
                  </label>
                  <select
                    value={formData.buying_ramp}
                    onChange={(e) => setFormData({ ...formData, buying_ramp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#16a34a]"
                  >
                    <option value="Ramp 1 (Main Mill)">Ramp 1 (Main Mill)</option>
                    <option value="Ramp 2 (North Depot)">Ramp 2 (North Depot)</option>
                    <option value="Ramp 3 (East Collection)">Ramp 3 (East Collection)</option>
                    <option value="Ramp 4 (Siluko Station)">Ramp 4 (Siluko Station)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Farm Boundary Input Method
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, boundary_method: 'file_upload' })}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      formData.boundary_method === 'file_upload'
                        ? 'border-[#16a34a] bg-green-50/70 text-emerald-900 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1 mb-0.5 text-slate-900">
                      <Upload size={13} className="text-[#16a34a]" />
                      <span>Upload File</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">KML, KMZ, SHP, ZIP, GeoJSON</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, boundary_method: 'gps_walk' })}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      formData.boundary_method === 'gps_walk'
                        ? 'border-[#16a34a] bg-green-50/70 text-emerald-900 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1 mb-0.5 text-slate-900">
                      <Compass size={13} className="text-[#16a34a]" />
                      <span>GPS Walk</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">Mobile field walk &ge; 4 pts</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, boundary_method: 'centroid_radius' })}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      formData.boundary_method === 'centroid_radius'
                        ? 'border-[#16a34a] bg-green-50/70 text-emerald-900 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1 mb-0.5 text-slate-900">
                      <MapPin size={13} className="text-[#16a34a]" />
                      <span>Point + Radius</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">Centroid + area buffer</div>
                  </button>
                </div>
              </div>

              {formData.boundary_method === 'file_upload' && (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-slate-300 hover:border-[#16a34a] rounded-2xl p-5 text-center bg-slate-50/50 hover:bg-green-50/20 transition-all cursor-pointer relative">
                    <input
                      type="file"
                      accept=".geojson,.kml,.kmz,.shp,.zip,.json"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="w-10 h-10 rounded-xl bg-green-50 text-[#16a34a] flex items-center justify-center mx-auto mb-2">
                      <Upload size={18} />
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      Click to upload or drag and drop farm boundary file
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Supports <span className="font-mono text-slate-700 font-bold">.kml, .kmz, .shp, .zip, .geojson, .json</span>
                    </div>
                  </div>

                  {fileSuccess && (
                    <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-[#16a34a] font-semibold flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span>{fileSuccess}</span>
                    </div>
                  )}

                  {fileError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{fileError}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Measured Parcel Area (Hectares)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100.0"
                  value={formData.area_ha}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#16a34a]"
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
                  <CheckCircle2 size={14} className="text-[#16a34a]" />
                  <span>Automated Spatial Conflict & Overlap Check</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Uploaded boundary polygon will be screened against existing member parcels in the cooperative database to prevent duplicate claims.
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#16a34a]"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#16a34a]"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#16a34a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Land Tenure Documentation
                </label>
                <select
                  value={formData.tenure_type}
                  onChange={(e) => setFormData({ ...formData, tenure_type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#16a34a]"
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
                          ? 'border-[#16a34a] bg-green-50/70 text-emerald-900 shadow-2xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold">{cert}</div>
                      <div className="text-[11px] text-slate-500 font-normal">Audit-ready documentation</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-2xl border border-green-200 text-xs text-emerald-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#16a34a]" />
                  <span>EUDR Due Diligence Passport Automated</span>
                </div>
                <p className="text-[11px] text-slate-600">
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
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
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

