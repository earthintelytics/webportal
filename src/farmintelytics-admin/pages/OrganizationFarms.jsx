import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Plus, Trash2, X, Building2, Layers, UploadCloud, RefreshCw,
  Settings, Save, Sparkles, Eye, Map,
} from 'lucide-react';
import {
  fetchFarms, createFarm, deleteFarm, uploadBoundary,
  generateFarmConfig, fetchPipelineConfigContent, savePipelineConfig, deletePipelineConfig,
  fetchMinioObjectContent,
} from '../../services/adminApi';
import { useConfirm } from '../components/ConfirmProvider';
import ErrorBanner from '../components/ErrorBanner';
import { SENSOR_OPTIONS, toggleInList, chipStyle } from '../components/formHelpers';

// Everything for viewing/managing the farms that belong to one organization —
// list, add, delete, boundary upload/preview, per-farm pipeline config.
// Split out of Organizations.jsx so org CRUD and farm management aren't one
// 800+ line file; OrgDetailPanel is the only export the parent page needs.

// A tiny inline "add farm" form — deliberately not the full onboarding wizard
// (org, sensors, indices, dates, boundary all in one). This is for adding a
// *second* (or third...) farm/estate to an org that already exists, so it
// only asks for what's actually new: name, sensors, indices, boundary.
const QuickAddFarmForm = ({ org, farms = [], onSave, onCancel }) => {
  const [farmName, setFarmName] = useState('');
  const [sensors, setSensors] = useState(['sentinel-2', 'sentinel-1']);
  const [indices, setIndices] = useState(['NDVI', 'NDMI']);
  const [boundaryFile, setBoundaryFile] = useState(null);
  const [parentFarmId, setParentFarmId] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');

  const INDICES = ['NDVI', 'EVI', 'NDMI', 'RECI', 'NDWI', 'LSWI'];
  const toggle = (list, setList, v) => setList(toggleInList(list, v));

  // Existing parent_farm_id values already used among this org's farms — lets
  // an admin attach a new sub-farm to an Okomu-style merged group without
  // hand-editing YAML/DB rows later.
  const existingParents = [...new Set(
    farms.map(f => f.parent_farm_id).filter(Boolean)
  )];

  const handleSave = async () => {
    if (!farmName.trim() || !boundaryFile) return;
    setSaving(true);
    setUploadPercent(5);
    setStatusText('Creating farm entity…');
    setError('');
    const startTime = Date.now();

    try {
      const parent = farms.find(f => f.parent_farm_id === parentFarmId || f.farm_id === parentFarmId);
      const created = await createFarm({
        company_name: org.display_name,
        company_id: org.schema_name,
        farm_name: farmName,
        farm_id: '',
        parent_farm_id: parentFarmId || '',
        parent_farm_name: parentFarmId ? (parent?.parent_farm_name || parent?.farm_name || parentFarmId) : '',
        sensors, indices,
        processing_level: 'plot_level',
        cloud_cover_threshold: 10,
        start_date: null, end_date: null,
      });

      setUploadPercent(20);
      setStatusText('Uploading boundary GeoJSON…');

      await uploadBoundary(created.farm_id, boundaryFile, (prog) => {
        const pct = Math.max(20, Math.min(95, 20 + Math.round(prog.percent * 0.75)));
        setUploadPercent(pct);
        const elapsed = (Date.now() - startTime) / 1000;
        if (pct > 25 && elapsed > 1) {
          const totalEst = elapsed / ((pct - 20) / 75);
          const rem = Math.max(1, Math.round(totalEst - elapsed));
          const timeStr = rem >= 60 ? `~${Math.ceil(rem / 60)} min left` : `~${rem}s left`;
          setStatusText(`Uploading & Ingesting (${prog.percent}%) • ${timeStr}`);
        } else {
          setStatusText(`Uploading & Ingesting GeoJSON (${prog.percent}%)…`);
        }
      });

      setUploadPercent(100);
      setStatusText('Farm & boundary registered successfully!');
      setTimeout(() => {
        onSave();
      }, 500);
    } catch (e) {
      setError(e.message);
      setSaving(false);
      setUploadPercent(0);
      setStatusText('');
    }
  };

  const chipSm = (active) => chipStyle(active, '#15803d', 'sm');

  return (
    <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
      <ErrorBanner message={error} onDismiss={() => setError('')} />
      
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
          Farm / Estate Name *
        </label>
        <input
          placeholder="e.g. Okomu Main Estate"
          value={farmName}
          onChange={e => setFarmName(e.target.value)}
          disabled={saving}
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#0f172a', outline: 'none' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
          Sensors
        </label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {SENSOR_OPTIONS.map(s => <button key={s} type="button" disabled={saving} onClick={() => toggle(sensors, setSensors, s)} style={chipSm(sensors.includes(s))}>{s}</button>)}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
          Vegetation & Moisture Indices
        </label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {INDICES.map(i => <button key={i} type="button" disabled={saving} onClick={() => toggle(indices, setIndices, i)} style={chipSm(indices.includes(i))}>{i}</button>)}
        </div>
      </div>

      {existingParents.length > 0 && (
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
            Hierarchy / Parent Farm
          </label>
          <select
            value={parentFarmId}
            disabled={saving}
            onChange={e => setParentFarmId(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#0f172a', outline: 'none' }}
          >
            <option value="">Standalone farm (no parent)</option>
            {existingParents.map(pid => <option key={pid} value={pid}>Merge into: {pid}</option>)}
          </select>
        </div>
      )}

      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
          Farm Boundary (GeoJSON) *
        </label>
        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px',
          border: boundaryFile ? '1.5px solid #15803d' : '1.5px dashed #cbd5e1',
          borderRadius: '10px', cursor: saving ? 'default' : 'pointer', background: '#ffffff',
          transition: 'all 0.15s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <UploadCloud size={16} color={boundaryFile ? '#15803d' : '#64748b'} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: boundaryFile ? '#15803d' : '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {boundaryFile ? boundaryFile.name : 'Select boundary .geojson file'}
            </span>
          </div>
          {boundaryFile && (
            <span style={{ fontSize: '10px', fontWeight: 800, background: '#15803d', color: '#ffffff', padding: '2px 8px', borderRadius: '6px' }}>
              READY
            </span>
          )}
          <input type="file" disabled={saving} accept=".geojson,.json,application/geo+json" style={{ display: 'none' }} onChange={e => setBoundaryFile(e.target.files?.[0] || null)} />
        </label>
      </div>

      {saving && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 800 }}>
            <span style={{ color: '#15803d' }}>{statusText || 'Processing…'}</span>
            <span style={{ color: '#0f172a' }}>{uploadPercent}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${uploadPercent}%`, height: '100%', background: 'linear-gradient(90deg, #15803d, #22c55e)',
              borderRadius: '4px', transition: 'width 0.25s ease',
            }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          style={{ flex: 1, padding: '10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#334155', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !farmName.trim() || !boundaryFile}
          style={{
            flex: 2, padding: '10px', background: '#15803d', border: 'none', borderRadius: '10px',
            color: '#ffffff', cursor: (saving || !farmName.trim() || !boundaryFile) ? 'not-allowed' : 'pointer',
            fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: '0 2px 6px rgba(21,128,61,0.25)', opacity: (saving || !farmName.trim() || !boundaryFile) ? 0.6 : 1,
          }}
        >
          {saving ? (
            <>
              <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span>Adding ({uploadPercent}%)…</span>
            </>
          ) : (
            'Add Farm'
          )}
        </button>
      </div>
    </div>
  );
};

// Per-farm pipeline config editor. Each farm's YAML lives at
// "{farm_id}_config.yaml" in the shared configs folder (same one the
// Scheduler's config dropdown reads from) — this is the one place an admin
// edits it, no separate global "Configs Builder" page needed.
const FarmConfigModal = ({ farm, onClose }) => {
  const confirm = useConfirm();
  const filename = `${farm.farm_id}_config.yaml`;
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPipelineConfigContent(filename);
      setContent(data.content);
      setExists(true);
    } catch (e) {
      setExists(false);
      setContent('');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [farm.farm_id]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setMessage('');
    try {
      const data = await generateFarmConfig(farm.farm_id);
      setContent(data.content);
      setExists(true);
      setMessage('Generated from this farm\'s current settings.');
    } catch (e) { setError(e.message); }
    finally { setGenerating(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await savePipelineConfig({ filename, content });
      setExists(true);
      setMessage('Config saved.');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    if (!(await confirm(`Delete the pipeline config for ${farm.farm_name}? The scheduler can't run it until it's regenerated.`))) return;
    setDeleting(true);
    setError('');
    setMessage('');
    try {
      await deletePipelineConfig(filename);
      setContent('');
      setExists(false);
      setMessage('Config deleted.');
    } catch (e) { setError(e.message); }
    finally { setDeleting(false); }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: '640px', maxHeight: '85vh', background: '#ffffff',
        border: '1px solid #e2e8f0', borderRadius: '18px', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(15,23,42,0.2)', overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={16} color="#16a34a" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#0f172a', fontSize: '13px', fontWeight: 800, margin: 0 }}>{farm.farm_name} — Pipeline Config</p>
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, margin: '2px 0 0', fontFamily: 'monospace' }}>{filename}</p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#475569', display: 'flex' }}><X size={14} /></button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1 }}>
          <ErrorBanner message={error} onDismiss={() => setError('')} />
          {message && (
            <div style={{ padding: '10px 14px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '10px', color: '#16a34a', fontSize: '12px' }}>{message}</div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '12px' }}>Loading…</div>
          ) : !exists && !content ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <span>No config generated for this farm yet.</span>
              <button onClick={handleGenerate} disabled={generating} style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
                background: '#15803d', border: 'none', borderRadius: '10px', color: 'white',
                fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: generating ? 0.6 : 1,
              }}><Sparkles size={13} />{generating ? 'Generating…' : 'Generate from farm settings'}</button>
            </div>
          ) : (
            <>
              <textarea value={content} onChange={e => setContent(e.target.value)} style={{
                width: '100%', minHeight: '320px', padding: '14px', background: '#f8fafc', border: '1px solid #cbd5e1',
                borderRadius: '10px', color: '#15803d', fontFamily: 'monospace', fontSize: '12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleGenerate} disabled={generating} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px',
                  background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#334155',
                  fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: generating ? 0.6 : 1,
                }}><Sparkles size={13} />{generating ? 'Regenerating…' : 'Regenerate from farm settings'}</button>
                <button onClick={handleDelete} disabled={deleting} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px',
                  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#dc2626',
                  fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: deleting ? 0.6 : 1,
                }}><Trash2 size={13} />{deleting ? 'Deleting…' : 'Delete'}</button>
                <button onClick={handleSave} disabled={saving} style={{
                  marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
                  background: '#15803d', border: 'none', borderRadius: '10px', color: 'white',
                  fontSize: '12px', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.6 : 1,
                }}><Save size={13} />{saving ? 'Saving…' : 'Save Config'}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Fits the map view to the boundary once it loads — MapContainer needs a
// center/zoom up front, this corrects it as soon as real geometry is in.
const FitToBounds = ({ data }) => {
  const map = useMap();
  useEffect(() => {
    if (!data) return;
    try {
      const bounds = L.geoJSON(data).getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
    } catch { /* malformed geometry — leave default view */ }
  }, [data, map]);
  return null;
};

// Shows the boundary a farm is actually using right now, read straight from
// MinIO — not a re-upload form, just a look at what the pipeline reads.
const BoundaryViewModal = ({ farm, onClose }) => {
  const [geo, setGeo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchMinioObjectContent(farm.boundary_minio_path);
        const parsed = JSON.parse(res.content);
        if (!cancelled) setGeo(parsed);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [farm.boundary_minio_path]);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: '640px', height: '520px', background: '#ffffff',
        border: '1px solid #e2e8f0', borderRadius: '18px', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 24px 60px rgba(15,23,42,0.2)',
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Map size={16} color="#16a34a" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#0f172a', fontSize: '14px', fontWeight: 800, margin: 0 }}>{farm.farm_name} — Current Boundary</p>
            <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, margin: '2px 0 0', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{farm.boundary_minio_path}</p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#475569', display: 'flex', flexShrink: 0 }}><X size={14} /></button>
        </div>
        <div style={{ flex: 1, position: 'relative', background: '#f1f5f9' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Loading boundary…</div>
          )}
          {error && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#dc2626', fontSize: '13px', textAlign: 'center' }}>{error}</div>
            </div>
          )}
          {!loading && !error && geo && (
            <MapContainer center={[6.43, 5.27]} zoom={4} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
              <GeoJSON data={geo} style={{ color: '#22d3ee', weight: 2, fillOpacity: 0.15 }} />
              <FitToBounds data={geo} />
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
};

const FarmRow = ({ farm, onDelete, onReupload }) => {
  const fileRef = React.useRef(null);
  const [uploading, setUploading] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [boundaryViewOpen, setBoundaryViewOpen] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { await onReupload(farm.farm_id, file); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <div>
        <p style={{ color: '#0f172a', fontSize: '13px', fontWeight: 700, margin: 0 }}>{farm.farm_name}</p>
        <p style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, margin: '2px 0 0', fontFamily: 'monospace' }}>{farm.farm_id}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
          background: farm.boundary_uploaded ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.08)',
          color: farm.boundary_uploaded ? '#16a34a' : '#ef4444',
          border: `1px solid ${farm.boundary_uploaded ? 'rgba(22,163,74,0.2)' : 'rgba(239,68,68,0.15)'}`,
        }}>
          {farm.boundary_uploaded ? '✓ Boundary' : '✗ No Boundary'}
        </span>
        {farm.boundary_uploaded && (
          <button onClick={() => setBoundaryViewOpen(true)}
            title="View current boundary"
            style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '7px', padding: '5px', cursor: 'pointer', color: '#16a34a', display: 'flex' }}>
            <Eye size={13} />
          </button>
        )}
        <button onClick={() => setConfigOpen(true)}
          title="Edit pipeline config"
          style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '7px', padding: '5px', cursor: 'pointer', color: '#16a34a', display: 'flex' }}>
          <Settings size={13} />
        </button>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          title={farm.boundary_uploaded ? 'Re-upload boundary' : 'Upload boundary'}
          style={{ background: '#eff6ff', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '7px', padding: '5px', cursor: 'pointer', color: '#2563eb', display: 'flex' }}>
          {uploading ? <RefreshCw size={13} className="animate-spin" /> : <UploadCloud size={13} />}
        </button>
        <input ref={fileRef} type="file" accept=".geojson,.json,application/geo+json" style={{ display: 'none' }} onChange={handleFile} />
        <button onClick={() => onDelete(farm.farm_id)} style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: '7px', padding: '5px', cursor: 'pointer', color: '#ef4444', display: 'flex' }}>
          <Trash2 size={13} />
        </button>
      </div>
      {configOpen && <FarmConfigModal farm={farm} onClose={() => setConfigOpen(false)} />}
      {boundaryViewOpen && <BoundaryViewModal farm={farm} onClose={() => setBoundaryViewOpen(false)} />}
    </div>
  );
};

const OrgDetailPanel = ({ org, onClose }) => {
  const confirm = useConfirm();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setFarms(await fetchFarms(org.schema_name)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [org.schema_name]);

  const handleDeleteFarm = async (farmId) => {
    if (!(await confirm('Delete this farm and all its data?'))) return;
    try { await deleteFarm(farmId); await load(); }
    catch (e) { setError(e.message); }
  };

  const handleReupload = async (farmId, file) => {
    try { await uploadBoundary(farmId, file); await load(); }
    catch (e) { setError(e.message); }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '440px', maxWidth: '92vw', height: '100%', background: '#ffffff',
        borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 24px rgba(15,23,42,0.08)',
        animation: 'slideIn 0.2s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={18} color="#16a34a" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#0f172a', fontSize: '15px', fontWeight: 800, margin: 0 }}>{org.display_name}</p>
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, margin: '2px 0 0', fontFamily: 'monospace' }}>{org.schema_name}</p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#475569', display: 'flex' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={load} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} color="#16a34a" />
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Farms & Boundaries</span>
            </div>
            <button onClick={() => setAddOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: '11px', fontWeight: 700 }}>
              <Plus size={13} />{addOpen ? 'Cancel' : 'Add Farm'}
            </button>
          </div>

          {addOpen && <QuickAddFarmForm org={org} farms={farms} onCancel={() => setAddOpen(false)} onSave={() => { setAddOpen(false); load(); }} />}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '12px' }}>Loading…</div>
          ) : farms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '12px' }}>No farms yet — add one above.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {farms.map(farm => (
                <FarmRow key={farm.farm_id} farm={farm} onDelete={handleDeleteFarm} onReupload={handleReupload} />
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes slideIn { from { transform: translateX(24px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default OrgDetailPanel;
