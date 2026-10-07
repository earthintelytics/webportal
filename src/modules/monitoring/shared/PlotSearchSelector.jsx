import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

// Type-ahead plot search — a native <select> with 1000+ plots (Okomu) is
// unusable, so this filters plotsData client-side by id/name substring and
// caps the rendered dropdown to keep the DOM light. Selecting a match reuses
// the existing handlePlotClick, so it plugs into the same selectedPlot /
// activePlotBounds map-zoom mechanism the polygon click handlers already use.
const MAX_RESULTS = 50;

// Everything a block can be found by: id, name, estate and the filter columns.
const haystack = (p) => [p.id, p.name, p.subfarm, p.division, ...Object.values(p.filters || {})].filter((v) => v != null).join(' ').toLowerCase();

export default function PlotSearchSelector({ plotsData = [], onSelect, placeholder = 'Find a block: ID, name, estate…' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const matches = q.length === 0 ? [] : plotsData
    .filter(p => haystack(p).includes(q))
    .slice(0, MAX_RESULTS);

  const handlePick = (plot) => {
    setQuery('');
    setOpen(false);
    // centroid of the plot's ring — same lat/lng shape handlePlotClick expects
    // from a Leaflet polygon click event
    const coords = plot.coords || [];
    if (coords.length === 0) return;
    const lat = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const lng = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    onSelect(plot, lat, lng);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', minWidth: '220px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px' }}>
        <Search size={14} color="#94a3b8" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          style={{ border: 'none', outline: 'none', fontSize: '12px', fontWeight: 600, color: '#0f172a', flex: 1, background: 'transparent' }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
            <X size={13} />
          </button>
        )}
      </div>
      {open && q.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, maxHeight: '260px', overflowY: 'auto',
          background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(15,23,42,0.12)', zIndex: 1200,
        }}>
          {matches.length === 0 ? (
            <p style={{ margin: 0, padding: '12px', fontSize: '12px', color: '#94a3b8' }}>No matching blocks.</p>
          ) : matches.map(p => (
            <button
              key={p.id}
              onClick={() => handlePick(p)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', background: 'none', border: 'none',
                borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '12px',
              }}
            >
              <span style={{ fontWeight: 800, color: '#0f172a' }}>{p.id}</span>
              {p.name && p.name !== p.id && <span style={{ color: '#64748b' }}> · {p.name}</span>}{p.subfarm && <span style={{ color: '#64748b' }}> · {p.subfarm}</span>}
            </button>
          ))}
          {plotsData.filter(p => haystack(p).includes(q)).length > MAX_RESULTS && (
            <p style={{ margin: 0, padding: '8px 12px', fontSize: '11px', color: '#94a3b8' }}>First {MAX_RESULTS} matches shown. Type more to narrow it.</p>
          )}
        </div>
      )}
    </div>
  );
}
