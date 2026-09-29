import React, { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal, RotateCcw, Check, AlertCircle, X, Info, FlaskConical } from 'lucide-react';
import { fetchCropThresholds, saveCropThreshold, resetCropThreshold, fetchOrganizations } from '../../services/adminApi';
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
    // These ranges drive live raster pixel classification on the map — an
    // inverted range (from > to) saved here would silently break the
    // legend and tile coloring for this index with no server-side check.
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
          {/* Live legend preview: exactly how the map legend and tiles will read, updated as classes are edited */}
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

const CropThresholds = () => {
  const [crop, setCrop] = useState('ffb');
  const [companyId, setCompanyId] = useState('');
  const [orgs, setOrgs] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCropThresholds(crop, companyId);
      const loaded = data.indices || [];
      setItems(loaded);
      // Keep the current selection if it still exists in the new list
      // (e.g. after a save/reset); otherwise default to the first index.
      setSelectedIndex(prev => (loaded.some(i => i.index_key === prev) ? prev : loaded[0]?.index_key || null));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [crop, companyId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetchOrganizations().then(setOrgs).catch(() => {}); }, []);

  const selectedItem = items.find(i => i.index_key === selectedIndex) || null;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <div>
        <h2 style={{ color: '#0f172a', fontSize: '20px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SlidersHorizontal size={20} color="#16a34a" /> Crop Index Thresholds
        </h2>
        <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, margin: '4px 0 0' }}>
          Calibrate the legend class boundaries for each crop against your ground truth.
        </p>
      </div>

      {/* Scientific-basis disclosure */}
      <div style={{ display: 'flex', gap: '10px', padding: '13px 15px', background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: '12px', maxWidth: '900px' }}>
        <FlaskConical size={16} color="#a16207" style={{ flexShrink: 0, marginTop: '1px' }} />
        <div style={{ fontSize: '12px', color: '#713f12', lineHeight: 1.6 }}>
          <strong>About these defaults.</strong> The index chosen for each crop follows established remote-sensing
          agronomy (e.g. NDWI for paddy flooding, red-edge indices for maize nitrogen, SAR for oil-palm stem structure),
          and the formulas are the standard published ones. The <strong>numeric class boundaries, however, are reasoned
          defaults — not field-validated</strong> for your varieties, soils or agro-ecological zone. Calibrate them here
          against yield records and field scouting. Saved values drive both the legend cards and the raster colouring.
        </div>
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

      <div style={{ maxWidth: '900px' }}><ErrorBanner message={error} onDismiss={() => setError('')} onRetry={load} /></div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading…</div>
      ) : (
        <div style={{ maxWidth: '900px' }}>
          {items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>No indices in this crop's profile.</div>
          )}
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
    </div>
  );
};

export default CropThresholds;
