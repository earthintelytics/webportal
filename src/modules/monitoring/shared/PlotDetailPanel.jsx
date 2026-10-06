import { useState } from 'react';
import { X, MapPin, UserCheck } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import GroundScoutingModal from './GroundScoutingModal';

// Slide-in panel showing ONE plot's own data — not a Leaflet <Popup>, since
// with 1000+ dense polygons (Okomu) a popup anchored to a tiny plot is easy
// to lose track of and clips against the map edge. Pulls straight from the
// plot object already in plotsData (from /plots/intelligence) plus whatever
// pixel time-series handlePlotClick already fetched — no new backend calls.
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '2px' };
const labelStyle = { fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' };
const valueStyle = { fontSize: '15px', fontWeight: 800, color: '#0f172a' };

export default function PlotDetailPanel({ plot, series, indexLabel = 'Index', dashboardFilterKeys = [], onClose }) {
  const [scoutingModalOpen, setScoutingModalOpen] = useState(false);
  if (!plot) return null;

  const chartData = series && series.length > 0 ? {
    labels: series.map(s => s.date),
    datasets: [{
      label: indexLabel.toUpperCase(),
      data: series.map(s => s.value),
      borderColor: '#16a34a',
      backgroundColor: 'rgba(22,163,74,0.08)',
      fill: true,
      tension: 0.3,
      pointRadius: 2,
      spanGaps: true,
    }],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: '#f1f5f9' } },
    },
  };

  const syntheticAlert = {
    alert_id: `ALT-${plot.id}`,
    plot_id: String(plot.id),
    type: plot.indices?.uas_anomaly_score > 0.4 ? 'Spectral Canopy Stress' : 'Vegetation Anomaly',
    severity: plot.health?.toLowerCase().includes('critical') ? 'Critical' : 'Warning',
    message: `Spectral variance detected on plot ${plot.name || plot.id}. Health: ${plot.health || 'Moderate'}.`,
    status: 'open',
  };

  return (
    <>
      <div style={{
        position: 'absolute', top: '12px', right: '12px', bottom: '12px', width: '320px', maxWidth: 'calc(100% - 24px)',
        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 12px 32px rgba(15,23,42,0.18)',
        display: 'flex', flexDirection: 'column', zIndex: 1000, overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={16} color="#16a34a" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plot.name || plot.id}</p>
            <p style={{ margin: '2px 0 0', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>{plot.id}{plot.subfarm ? ` · ${plot.subfarm}` : ''}</p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#475569', display: 'flex', flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={fieldStyle}><span style={labelStyle}>Health</span><span style={{ ...valueStyle, color: plot.color || '#0f172a' }}>{plot.health || 'No Data'}</span></div>
            <div style={fieldStyle}><span style={labelStyle}>Area</span><span style={valueStyle}>{plot.area || '—'}</span></div>
            {plot.indices?.ndvi != null && <div style={fieldStyle}><span style={labelStyle}>NDVI</span><span style={valueStyle}>{plot.indices.ndvi.toFixed(3)}</span></div>}
            {plot.indices?.ndmi != null && <div style={fieldStyle}><span style={labelStyle}>NDMI</span><span style={valueStyle}>{plot.indices.ndmi.toFixed(3)}</span></div>}
            {plot.indices?.chlorophyll != null && <div style={fieldStyle}><span style={labelStyle}>Chlorophyll</span><span style={valueStyle}>{plot.indices.chlorophyll.toFixed(3)}</span></div>}
            {plot.indices?.uas_anomaly_score != null && <div style={fieldStyle}><span style={labelStyle}>Anomaly Score</span><span style={valueStyle}>{plot.indices.uas_anomaly_score.toFixed(3)}</span></div>}
          </div>

          {/* Action Ground Scout Button */}
          <button
            onClick={() => setScoutingModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.2s ease',
              boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
            }}
          >
            <UserCheck size={15} color="#4ade80" />
            <span>Dispatch / Verify Ground Scout</span>
          </button>

          {dashboardFilterKeys.length > 0 && plot.filters && Object.keys(plot.filters).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px', borderTop: '1px solid #f1f5f9' }}>
              {dashboardFilterKeys.filter(k => plot.filters[k] != null).map(k => (
                <div key={k} style={fieldStyle}><span style={labelStyle}>{k}</span><span style={{ ...valueStyle, fontSize: '13px' }}>{String(plot.filters[k])}</span></div>
              ))}
            </div>
          )}

          <div>
            <p style={{ ...labelStyle, marginBottom: '8px' }}>Time Series</p>
            {chartData ? (
              <div style={{ height: '160px' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>No time-series data for this pixel yet.</p>
            )}
          </div>
        </div>
      </div>

      {scoutingModalOpen && (
        <GroundScoutingModal
          alert={syntheticAlert}
          onClose={() => setScoutingModalOpen(false)}
          onAlertUpdated={() => setScoutingModalOpen(false)}
        />
      )}
    </>
  );
}

