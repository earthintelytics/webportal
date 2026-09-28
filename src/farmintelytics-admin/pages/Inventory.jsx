import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, RefreshCw, Trash2, AlertCircle, CheckCircle, Search, FileJson, Layers, Building2, Server, HelpCircle, HardDrive, X, Eye, Copy, Activity } from 'lucide-react';
import { fetchOrganizations, fetchFarms, fetchMinioInventory, syncDatabaseWithMinio, deleteMinioObject, fetchMinioObjectContent } from '../../services/adminApi';
import { useConfirm } from '../components/ConfirmProvider';
import ErrorBanner from '../components/ErrorBanner';

const VIEWABLE_SUFFIXES = ['.json', '.geojson', '.yaml', '.yml', '.txt', '.csv'];
const isViewable = (key) => VIEWABLE_SUFFIXES.some(sfx => key.toLowerCase().endsWith(sfx));
// execution_logs/ objects are the same data the Logs page parses into rows —
// route there instead of duplicating a raw-JSON view of it here.
const isExecutionLog = (key) => key.startsWith('execution_logs/');

const Inventory = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [orgs, setOrgs] = useState([]);
  const [farms, setFarms] = useState([]);
  const [minioFiles, setMinioFiles] = useState([]);
  
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedFarm, setSelectedFarm] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('sync'); // 'sync' or 'files'
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [syncStats, setSyncStats] = useState(null);

  const [viewFile, setViewFile] = useState(null);
  const [viewContent, setViewContent] = useState('');
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState('');

  // Load organizations, farms, and MinIO inventory
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [o, f, m] = await Promise.all([
        fetchOrganizations(),
        fetchFarms(),
        fetchMinioInventory(selectedOrg, selectedFarm)
      ]);
      setOrgs(o);
      setFarms(f);
      setMinioFiles(m.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedOrg, selectedFarm]);

  // Handle manual database synchronization
  const handleSyncDatabase = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');
    setSyncStats(null);
    try {
      const res = await syncDatabaseWithMinio();
      setSyncStats(res);
      setSuccess(res.message || 'Database successfully synchronized with MinIO storage.');
      // Refresh inventory and farms list
      const [f, m] = await Promise.all([
        fetchFarms(),
        fetchMinioInventory(selectedOrg, selectedFarm)
      ]);
      setFarms(f);
      setMinioFiles(m.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  };

  // Handle viewing a JSON/GeoJSON/text object's content
  const handleViewObject = async (file) => {
    setViewFile(file);
    setViewContent('');
    setViewError('');
    setViewLoading(true);
    try {
      const res = await fetchMinioObjectContent(file.key);
      // Pretty-print JSON/GeoJSON; other text types render as-is.
      let content = res.content;
      if (file.key.toLowerCase().endsWith('.json') || file.key.toLowerCase().endsWith('.geojson')) {
        try { content = JSON.stringify(JSON.parse(res.content), null, 2); } catch (_) { /* not valid JSON — show raw */ }
      }
      setViewContent(content);
    } catch (e) {
      setViewError(e.message);
    } finally {
      setViewLoading(false);
    }
  };

  // Handle object deletion
  const handleDeleteObject = async (key) => {
    if (!(await confirm(`Permanently delete this object from MinIO?\n\nPath: ${key}\n\nIf this is a farm boundary file, the farm registry will be updated automatically.`))) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await deleteMinioObject(key);
      setSuccess(`File "${key.split('/').pop()}" successfully deleted.`);
      // Reload lists
      const [f, m] = await Promise.all([
        fetchFarms(),
        fetchMinioInventory(selectedOrg, selectedFarm)
      ]);
      setFarms(f);
      setMinioFiles(m.items || []);
    } catch (e) {
      setError(e.message);
    }
  };

  // Filter lists based on selected parameters and search terms
  const searchFilter = (file) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return file.key.toLowerCase().includes(s) || file.file_type.toLowerCase().includes(s);
  };

  const farmSearchFilter = (farm) => {
    if (selectedOrg && farm.company_id !== selectedOrg) return false;
    if (selectedFarm && farm.farm_id !== selectedFarm) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return farm.farm_name.toLowerCase().includes(s) || farm.farm_id.toLowerCase().includes(s);
  };

  // Group MinIO files statistics
  const totalSize = minioFiles.reduce((acc, f) => acc + f.size_bytes, 0);
  
  const typeStats = minioFiles.reduce((acc, f) => {
    const t = f.file_type;
    if (!acc[t]) {
      acc[t] = { count: 0, size: 0, file_type: t };
    }
    acc[t].count += 1;
    acc[t].size += f.size_bytes;
    return acc;
  }, {});

  const typeStatsList = Object.values(typeStats).sort((a, b) => b.size - a.size);

  const typeColors = {
    'Zarr Dataset': '#3b82f6',
    'Boundary (GeoJSON)': '#10b981',
    'Plots Health Data': '#8b5cf6',
    'GeoJSON Data': '#06b6d4',
    'Run Metadata': '#f59e0b',
    'JSON Data': '#64748b',
    'ZIP Archive': '#ec4899',
    'Parquet Data': '#f43f5e',
    'Image': '#eab308',
    'GeoTIFF Image': '#14b8a6',
    'YAML Config': '#374151',
    'Other': '#94a3b8'
  };

  const getPercentage = (size) => {
    if (totalSize === 0) return 0;
    return ((size / totalSize) * 100).toFixed(1);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Build Postgres/MinIO Comparison Table list
  const comparisonList = farms.filter(farmSearchFilter).map(farm => {
    // Expected boundary file in MinIO: {company_id}/inputs/{farm_id}/{farm_id}_farm.geojson
    const expectedPath = `${farm.company_id}/inputs/${farm.farm_id}/${farm.farm_id}_farm.geojson`;
    const recordedPath = farm.boundary_minio_path;
    
    // Check if either recorded path or expected path exists in MinIO files list
    const actualFile = minioFiles.find(f => f.key === recordedPath || f.key === expectedPath);
    
    let status = 'No Boundary';
    let color = '#64748b';
    let bg = '#f1f5f9';

    if (farm.boundary_uploaded) {
      if (actualFile) {
        status = 'Synced';
        color = '#16a34a';
        bg = 'rgba(22, 163, 74, 0.1)';
      } else {
        status = 'Missing in MinIO';
        color = '#ef4444';
        bg = 'rgba(239, 68, 68, 0.08)';
      }
    } else {
      if (actualFile) {
        status = 'Orphaned File (MinIO Only)';
        color = '#f59e0b';
        bg = 'rgba(245, 158, 11, 0.08)';
      }
    }

    return {
      farm,
      status,
      color,
      bg,
      path: actualFile ? actualFile.key : (recordedPath || expectedPath),
      size: actualFile ? formatSize(actualFile.size_bytes) : '-',
      lastModified: actualFile ? new Date(actualFile.last_modified).toLocaleString() : '-',
    };
  });

  const inputStyle = { padding: '10px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#1e293b', fontSize: '13px', fontWeight: 600, outline: 'none', fontFamily: "'Roboto', sans-serif", cursor: 'pointer' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: '#0f172a', fontSize: '20px', fontWeight: 800, margin: 0 }}>Data Sync & MinIO</h2>
          <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, margin: '4px 0 0' }}>Review database configurations and clean storage state</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleSyncDatabase} 
            disabled={syncing}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#2563eb', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(59,130,246,0.2)' }}
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Force Sync Registry'}
          </button>
          <button 
            onClick={loadData} 
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#475569', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Notifications */}
      <ErrorBanner message={error} onDismiss={() => setError('')} onRetry={loadData} />

      {success && (
        <div style={{ padding: '12px 16px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '10px', color: '#16a34a', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <CheckCircle size={15} />{success}
          <button onClick={() => setSuccess('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a' }}><X size={14} /></button>
        </div>
      )}

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={20} color="#16a34a" />
          </div>
          <div>
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Total Storage Objects</p>
            <p style={{ color: '#0f172a', fontSize: '20px', fontWeight: 800, margin: '2px 0 0' }}>{minioFiles.length}</p>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HardDrive size={20} color="#3b82f6" />
          </div>
          <div>
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Total Storage Footprint</p>
            <p style={{ color: '#0f172a', fontSize: '20px', fontWeight: 800, margin: '2px 0 0' }}>{formatSize(totalSize)}</p>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Server size={20} color="#f59e0b" />
          </div>
          <div>
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Postgres Farms</p>
            <p style={{ color: '#0f172a', fontSize: '20px', fontWeight: 800, margin: '2px 0 0' }}>{farms.length}</p>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} color="#a855f7" />
          </div>
          <div>
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Organizations</p>
            <p style={{ color: '#0f172a', fontSize: '20px', fontWeight: 800, margin: '2px 0 0' }}>{orgs.length}</p>
          </div>
        </div>
      </div>

      {/* Storage Distribution by Data Type Card */}
      {minioFiles.length > 0 && (
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ color: '#0f172a', fontSize: '14px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={15} color="#16a34a" />
              MinIO Storage Distribution by Data Type
            </h3>
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, margin: '4px 0 0' }}>Breakdown of the {formatSize(totalSize)} total storage footprint in MinIO</p>
          </div>

          {/* Progress Bar composite layout */}
          <div style={{ height: '20px', width: '100%', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', display: 'flex' }}>
            {typeStatsList.map(type => {
              const pct = parseFloat(getPercentage(type.size));
              if (pct <= 0) return null;
              return (
                <div 
                  key={type.file_type}
                  style={{
                    width: `${pct}%`,
                    background: typeColors[type.file_type] || '#94a3b8',
                    height: '100%',
                    transition: 'all 0.3s ease',
                  }}
                  title={`${type.file_type}: ${pct}% (${formatSize(type.size)})`}
                />
              );
            })}
          </div>

          {/* Grid of legend items */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px 24px' }}>
            {typeStatsList.map(type => {
              const pct = getPercentage(type.size);
              const color = typeColors[type.file_type] || '#94a3b8';
              return (
                <div key={type.file_type} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{type.file_type}</span>
                      <span style={{ color: '#0f172a' }}>{pct}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                      <span>{type.count} {type.count === 1 ? 'file' : 'files'}</span>
                      <span style={{ fontFamily: 'monospace' }}>{formatSize(type.size)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters & Search bar */}
      <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Organization</label>
            <select style={{ ...inputStyle, minWidth: '160px' }} value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}>
              <option value="">All Orgs</option>
              {orgs.map(o => <option key={o.schema_name} value={o.schema_name}>{o.display_name}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Farm Registry</label>
            <select style={{ ...inputStyle, minWidth: '160px' }} value={selectedFarm} onChange={e => setSelectedFarm(e.target.value)}>
              <option value="">All Farms</option>
              {farms.filter(f => !selectedOrg || f.company_id === selectedOrg).map(f => (
                <option key={f.farm_id} value={f.farm_id}>{f.farm_name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <label style={labelStyle}>Search</label>
            <Search size={14} style={{ position: 'absolute', left: '12px', bottom: '13px', color: '#64748b' }} />
            <input 
              placeholder={activeTab === 'sync' ? "Search sync records..." : "Search file keys or extensions..."}
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ ...inputStyle, width: '100%', paddingLeft: '36px', boxSizing: 'border-box' }} 
            />
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #cbd5e1', paddingBottom: '0' }}>
          <button 
            onClick={() => { setActiveTab('sync'); setSearch(''); }}
            style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'sync' ? '2px solid #16a34a' : '2px solid transparent', color: activeTab === 'sync' ? '#16a34a' : '#475569', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
          >
            Postgres vs MinIO Sync Health
          </button>
          <button 
            onClick={() => { setActiveTab('files'); setSearch(''); }}
            style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'files' ? '2px solid #16a34a' : '2px solid transparent', color: activeTab === 'files' ? '#16a34a' : '#475569', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
          >
            MinIO Raw Files Explorer
          </button>
        </div>

        {/* Table Rendering */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>Loading inventory statistics…</div>
        ) : activeTab === 'sync' ? (
          /* PostgreSQL vs MinIO Sync Health Table */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Farm</th>
                  <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Org</th>
                  <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Postgres Flag</th>
                  <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sync Indicator</th>
                  <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>MinIO Size</th>
                  <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sync Time</th>
                </tr>
              </thead>
              <tbody>
                {comparisonList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px 8px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>No matching sync records found.</td>
                  </tr>
                ) : (
                  comparisonList.map(({ farm, status, color, bg, path, size, lastModified }) => (
                    <tr key={farm.farm_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>{farm.farm_name}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{farm.farm_id}</div>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '12px', color: '#475569', fontWeight: 600 }}>{farm.company_name}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: farm.boundary_uploaded ? 'rgba(22, 163, 74, 0.08)' : '#f1f5f9', color: farm.boundary_uploaded ? '#16a34a' : '#64748b', border: `1px solid ${farm.boundary_uploaded ? 'rgba(22, 163, 74, 0.15)' : '#cbd5e1'}` }}>
                          {farm.boundary_uploaded ? 'Uploaded' : 'No Boundary'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', color, background: bg, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {status === 'Synced' && <CheckCircle size={10} />}
                          {status === 'Missing in MinIO' && <AlertCircle size={10} />}
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '11px', fontFamily: 'monospace', color: '#475569' }}>{size}</td>
                      <td style={{ padding: '12px 8px', fontSize: '11px', color: '#64748b' }}>{lastModified}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* MinIO Files list explorer */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>MinIO Key (Storage Path)</th>
                  <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>File Type</th>
                  <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Size</th>
                  <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last Modified</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {minioFiles.filter(searchFilter).length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px 8px', textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>No files found in MinIO bucket.</td>
                  </tr>
                ) : (
                  minioFiles.filter(searchFilter).map(file => (
                    <tr key={file.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px', maxWidth: '320px', wordBreak: 'break-all' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{file.key}</div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'rgba(59,130,246,0.08)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.15)' }}>
                          {file.file_type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '11px', fontFamily: 'monospace', color: '#475569' }}>{formatSize(file.size_bytes)}</td>
                      <td style={{ padding: '12px 8px', fontSize: '11px', color: '#64748b' }}>{new Date(file.last_modified).toLocaleString()}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {isExecutionLog(file.key) ? (
                            <button
                              onClick={() => navigate('/admin/logs', { state: { tab: 'pipeline', highlightKey: file.key } })}
                              style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#7c3aed', display: 'inline-flex', alignItems: 'center' }}
                              title="Open in Logs — parsed view of this execution log"
                            >
                              <Activity size={13} />
                            </button>
                          ) : isViewable(file.key) && (
                            <button
                              onClick={() => handleViewObject(file)}
                              style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#2563eb', display: 'inline-flex', alignItems: 'center' }}
                              title="View file content"
                            >
                              <Eye size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteObject(file.key)}
                            style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#ef4444', display: 'inline-flex', alignItems: 'center' }}
                            title="Delete Object from MinIO"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewFile && (
        <div
          onClick={() => setViewFile(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '760px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0' }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileJson size={16} color="#2563eb" />
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', wordBreak: 'break-all' }}>{viewFile.key}</div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                {viewContent && (
                  <button
                    onClick={() => navigator.clipboard?.writeText(viewContent)}
                    title="Copy content"
                    style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#475569', display: 'inline-flex' }}
                  >
                    <Copy size={13} />
                  </button>
                )}
                <button
                  onClick={() => setViewFile(null)}
                  style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#475569', display: 'inline-flex' }}
                >
                  <X size={13} />
                </button>
              </div>
            </div>
            <div style={{ padding: '16px 20px', overflow: 'auto', flex: 1 }}>
              {viewLoading && <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '13px' }}>Loading…</div>}
              {viewError && (
                <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#dc2626', fontSize: '13px' }}>
                  {viewError}
                </div>
              )}
              {!viewLoading && !viewError && (
                <pre style={{ margin: 0, fontSize: '11.5px', lineHeight: 1.6, color: '#0f172a', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{viewContent}</pre>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default Inventory;
