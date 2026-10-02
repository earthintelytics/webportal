import React, { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal, RotateCcw, Check, AlertCircle, X, Info, FlaskConical, Target, ShieldCheck, Save } from 'lucide-react';
import { 
  fetchCropThresholds, 
  saveCropThreshold, 
  resetCropThreshold, 
  fetchOrganizations,
  fetchSuitabilityThresholds,
  saveSuitabilityThreshold
} from '../../services/adminApi';
import { useConfirm } from '../components/ConfirmProvider';
import ErrorBanner from '../components/ErrorBanner';

const CROPS = [
  { id: 'ffb', label: 'Oil Palm (FFB)' },
  { id: 'rice', label: 'Rice' },
  { id: 'maize', label: 'Maize' },
  { id: 'cocoa', label: 'Cocoa' },
  { id: 'cassava', label: 'Cassava' },
  { id: 'sugarcane', label: 'Sugarcane' },
  { id: 'rubber', label: 'Rubber' },
  { id: 'cashew', label: 'Cashew' },
];

const inputStyle = {
  width: '100%', padding: '7px 9px', background: '#ffffff', border: '1px solid #cbd5e1',
  borderRadius: '8px', color: '#0f172a', fontSize: '12px', fontWeight: 600,
  outline: 'none', boxSizing: 'border-box', fontFamily: "var(--font-sans)",
};
const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', letterSpacing: '0', marginBottom: '6px' };

const IndexCard = ({ item, cropType, companyId, onSaved, onError }) => {
  const confirm = useConfirm();
  const [classes, setClasses] = useState(item.classes || []);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => { setClasses(item.classes || []); setDirty(false); }, [item]);

  const updateBound = (i, which, value) => {
    const v = value === '' || value === '-' ? value : parseFloat(value);
    setClasses(prev => prev.map((c, idx) => idx === i
      ? { ...c, range: which === 'lo' ? [v, c.range[1]] : [c.range[0], v] }
      : c));
    setDirty(true);
  };

  const updateLabel = (i, value) => {
    setClasses(prev => prev.map((c, idx) => idx === i ? { ...c, label: value } : c));
    setDirty(true);
  };

  const updateColor = (i, value) => {
    setClasses(prev => prev.map((c, idx) => idx === i ? { ...c, color: value } : c));
    setDirty(true);
  };

  const handleSave = async () => {
    const clean = classes.map(c => ({
      label: c.label,
      color: c.color,
      range: [Number(c.range[0]), Number(c.range[1])],
    }));
    if (clean.some(c => Number.isNaN(c.range[0]) || Number.isNaN(c.range[1]))) {
      onError('Every class needs a numeric from/to value.');
      return;
    }
    const inverted = clean.find(c => c.range[0] > c.range[1]);
    if (inverted) {
      onError(`"${inverted.label}" has a from value greater than its to value (${inverted.range[0]} > ${inverted.range[1]}).`);
      return;
    }
    setBusy(true);
    try {
      await saveCropThreshold({ crop_type: cropType, index_key: item.index_key, company_id: companyId, classes: clean });
      setDirty(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
      onSaved();
    } catch (e) { onError(e.message); }
    finally { setBusy(false); }
  };

  const handleReset = async () => {
    if (!(await confirm(`Reset ${item.label} back to the platform default for ${cropType}?`))) return;
    setBusy(true);
    try {
      await resetCropThreshold(cropType, item.index_key, companyId);
      onSaved();
    } catch (e) { onError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{item.label}</span>
            {item.calibrated
              ? <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '6px', background: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.2)', letterSpacing: '0' }}>Calibrated</span>
              : <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '6px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', letterSpacing: '0' }}>Platform default</span>}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
            {item.crop_label ? `${item.crop_label} — ` : ''}{item.full}
          </div>
          {item.formula && (
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>{item.formula}</div>
          )}
          {classes.length > 0 && (
            <div className="mt-3">
              <div className="flex h-3 rounded-full overflow-hidden border border-gray-200">
                {[...classes].sort((a, b) => Number(a.range?.[0]) - Number(b.range?.[0])).map((c, i) => (
                  <span key={i} title={`${c.label}: ${c.range?.[0]} to ${c.range?.[1]}`} style={{ background: c.color, flex: Math.max(0.05, Math.abs(Number(c.range?.[1]) - Number(c.range?.[0])) || 0.05) }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {[...classes].sort((a, b) => Number(b.range?.[0]) - Number(a.range?.[0])).map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-[11px] text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-sm border border-gray-200" style={{ background: c.color }} />{c.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {item.calibrated && (
            <button onClick={handleReset} disabled={busy} title="Reset to platform default"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
              <RotateCcw size={12} />Reset
            </button>
          )}
          <button onClick={handleSave} disabled={busy || !dirty}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: dirty ? 'pointer' : 'default',
              background: savedFlash ? '#16a34a' : dirty ? '#15803d' : '#e2e8f0',
              color: dirty || savedFlash ? 'white' : '#94a3b8' }}>
            <Check size={12} />{savedFlash ? 'Saved' : busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {item.notes && (
        <div style={{ display: 'flex', gap: '7px', padding: '9px 11px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', marginBottom: '12px' }}>
          <Info size={13} color="#64748b" style={{ flexShrink: 0, marginTop: '1px' }} />
          <span style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>{item.notes}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '18px 1fr 92px 92px', gap: '8px', alignItems: 'center' }}>
        <span />
        <span style={labelStyle}>Class label</span>
        <span style={labelStyle}>From</span>
        <span style={labelStyle}>To</span>
        {classes.map((c, i) => (
          <React.Fragment key={i}>
            <input
              type="color"
              value={c.color}
              onChange={e => updateColor(i, e.target.value)}
              title="Change class colour"
              style={{
                width: '18px', height: '18px', padding: 0, border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: '4px', cursor: 'pointer', background: 'none',
              }}
            />
            <input style={inputStyle} value={c.label} onChange={e => updateLabel(i, e.target.value)} />
            <input style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} type="number" step="any" value={c.range[0]} onChange={e => updateBound(i, 'lo', e.target.value)} />
            <input style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} type="number" step="any" value={c.range[1]} onChange={e => updateBound(i, 'hi', e.target.value)} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const SuitabilityCard = ({ cropType, companyId, onSaved, onError }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    async function loadSuitability() {
      setLoading(true);
      try {
        const res = await fetchSuitabilityThresholds(cropType, companyId);
        setData(res);
      } catch (err) {
        onError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSuitability();
  }, [cropType, companyId, onError]);

  const updateFactor = (index, field, value) => {
    setData(prev => {
      const updatedFactors = [...prev.factors];
      updatedFactors[index] = { ...updatedFactors[index], [field]: value };
      return { ...prev, factors: updatedFactors };
    });
  };

  const updateAction = (factorKey, value) => {
    setData(prev => ({
      ...prev,
      farmer_actions: {
        ...prev.farmer_actions,
        [factorKey]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSuitabilityThreshold({
        crop_type: cropType,
        company_id: companyId,
        relevance: data.relevance,
        variants: data.variants,
        factors: data.factors,
        farmer_actions: data.farmer_actions,
        exclusions: data.exclusions
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
      onSaved();
    } catch (e) {
      onError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading suitability thresholds…</div>;
  if (!data) return null;

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', borderBottom: '1px solid #f1f5f9', pb: '12px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} color="#16a34a" /> FAO Land Suitability & Farmer Language Settings
          </h3>
          <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0' }}>
            Configure factor evaluation bounds, farmer-understandable limiting interpretations, and practical field actions.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: 'none', borderRadius: '8px',
            fontSize: '12px', fontWeight: 700, cursor: 'pointer', background: savedFlash ? '#16a34a' : '#15803d', color: 'white'
          }}
        >
          <Save size={14} />
          {savedFlash ? 'Saved to DB' : saving ? 'Saving…' : 'Save Suitability Config'}
        </button>
      </div>

      {/* Factors Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>1. Factor Evaluation Bounds & Thresholds</div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '120px 70px 1fr 1fr 1fr 1fr', gap: '8px', alignItems: 'center' }}>
          <span style={labelStyle}>Factor</span>
          <span style={labelStyle}>Unit</span>
          <span style={labelStyle}>S1 Optimal</span>
          <span style={labelStyle}>S2 Suitable</span>
          <span style={labelStyle}>S3 Marginal</span>
          <span style={labelStyle}>N Unsuitable</span>

          {data.factors?.map((f, idx) => (
            <React.Fragment key={idx}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>{f.name}</span>
              <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>{f.unit}</span>
              <input style={inputStyle} value={f.optimal || ''} onChange={e => updateFactor(idx, 'optimal', e.target.value)} />
              <input style={inputStyle} value={f.suitable || ''} onChange={e => updateFactor(idx, 'suitable', e.target.value)} />
              <input style={inputStyle} value={f.marginal || ''} onChange={e => updateFactor(idx, 'marginal', e.target.value)} />
              <input style={inputStyle} value={f.unsuitable || ''} onChange={e => updateFactor(idx, 'unsuitable', e.target.value)} />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Farmer Language Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', pt: '12px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>2. Farmer-Understandable Language Interventions</div>
        <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
          These descriptions explain recommendations directly to farmers when a factor becomes limiting in their field table.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={labelStyle}>Slope / Terrain Action:</label>
            <input
              style={inputStyle}
              value={data.farmer_actions?.slope || 'Implement contour terracing & vetiver grass strips before planting'}
              onChange={e => updateAction('slope', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Rainfall / Dry Season Action:</label>
            <input
              style={inputStyle}
              value={data.farmer_actions?.rainfall || 'Install drip / supplementary irrigation; plant drought-resilient clone'}
              onChange={e => updateAction('rainfall', e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Soil pH / Texture Action:</label>
            <input
              style={inputStyle}
              value={data.farmer_actions?.soil_ph || 'Apply agricultural lime (2.5 t/ha) to raise pH above 5.0'}
              onChange={e => updateAction('soil_ph', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const CropThresholds = () => {
  const [tabMode, setTabMode] = useState('index'); // 'index' | 'suitability'
  const [crop, setCrop] = useState('ffb');
  const [companyId, setCompanyId] = useState('');
  const [orgs, setOrgs] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (tabMode !== 'index') return;
    setLoading(true);
    try {
      const data = await fetchCropThresholds(crop, companyId);
      const loaded = data.indices || [];
      setItems(loaded);
      setSelectedIndex(prev => (loaded.some(i => i.index_key === prev) ? prev : loaded[0]?.index_key || null));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [crop, companyId, tabMode]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetchOrganizations().then(setOrgs).catch(() => {}); }, []);

  const selectedItem = items.find(i => i.index_key === selectedIndex) || null;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <div>
        <h2 style={{ color: '#0f172a', fontSize: '20px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SlidersHorizontal size={20} color="#16a34a" /> Crop & Suitability Thresholds
        </h2>
        <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, margin: '4px 0 0' }}>
          Configure remote sensing index legend boundaries and land evaluation suitability factor thresholds for all crops.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
        <button
          onClick={() => setTabMode('index')}
          style={{
            padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none',
            background: tabMode === 'index' ? '#15803d' : '#f1f5f9',
            color: tabMode === 'index' ? 'white' : '#475569'
          }}
        >
          Crop Index Thresholds (NDVI / NDMI)
        </button>
        <button
          onClick={() => setTabMode('suitability')}
          style={{
            padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none',
            background: tabMode === 'suitability' ? '#15803d' : '#f1f5f9',
            color: tabMode === 'suitability' ? 'white' : '#475569'
          }}
        >
          Crop Suitability & Farmer Language Config
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ minWidth: '200px' }}>
          <label style={labelStyle}>Crop</label>
          <select style={{ ...inputStyle, padding: '9px 10px', cursor: 'pointer' }} value={crop} onChange={e => setCrop(e.target.value)}>
            {CROPS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div style={{ minWidth: '240px' }}>
          <label style={labelStyle}>Scope</label>
          <select style={{ ...inputStyle, padding: '9px 10px', cursor: 'pointer' }} value={companyId} onChange={e => setCompanyId(e.target.value)}>
            <option value="">All organizations (platform default)</option>
            {orgs.map(o => <option key={o.schema_name} value={o.schema_name}>{o.display_name} only</option>)}
          </select>
        </div>
      </div>

      <div style={{ maxWidth: '900px' }}><ErrorBanner message={error} onDismiss={() => setError('')} onRetry={load} /></div>

      {tabMode === 'index' ? (
        <>
          {!loading && items.length > 0 && (
            <div>
              <label style={labelStyle}>Index</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '900px' }}>
                {items.map(item => {
                  const active = item.index_key === selectedIndex;
                  return (
                    <button
                      key={item.index_key}
                      onClick={() => setSelectedIndex(item.index_key)}
                      style={{
                        padding: '7px 13px', borderRadius: '9px', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                        background: active ? '#15803d' : '#ffffff',
                        border: active ? '1px solid #15803d' : '1px solid #cbd5e1',
                        color: active ? '#ffffff' : '#334155',
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}
                    >
                      {item.label}
                      {item.calibrated && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: active ? '#bbf7d0' : '#16a34a' }} title="Calibrated" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading…</div>
          ) : (
            <div style={{ maxWidth: '900px' }}>
              {selectedItem && (
                <IndexCard
                  key={selectedItem.index_key}
                  item={selectedItem}
                  cropType={crop}
                  companyId={companyId}
                  onSaved={load}
                  onError={setError}
                />
              )}
            </div>
          )}
        </>
      ) : (
        <div style={{ maxWidth: '900px' }}>
          <SuitabilityCard
            cropType={crop}
            companyId={companyId}
            onSaved={() => {}}
            onError={setError}
          />
        </div>
      )}
    </div>
  );
};

export default CropThresholds;
