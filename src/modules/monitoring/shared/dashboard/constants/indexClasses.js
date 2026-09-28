/* Five-class legend bucketing for index values (label + colour). */
export const getIndexFiveClasses = (val, type) => {
  if (type === 'NDVI' || type === 'CVI' || type === 'EVI' || type === 'Chlorophyll') {
    if (val > 0.8)  return { color: '#14532D', label: 'Exceptional (0.8+)' };
    if (val > 0.7)  return { color: '#16A34A', label: 'Optimal (0.7–0.8)' };
    if (val > 0.55) return { color: '#86EFAC', label: 'Moderate (0.55–0.7)' };
    if (val > 0.45) return { color: '#EAB308', label: 'Transition (0.45–0.55)' };
    return { color: '#EF4444', label: 'Deficit (<=0.45)' };
  }
  if (type === 'NDMI' || type === 'LSWI' || type === 'WDI' || type === 'WaterStress' || type === 'Water') {
    if (val > 0.5)  return { color: '#1E3A8A', label: 'Waterlogged (>0.5)' };
    if (val > 0.42) return { color: '#2563EB', label: 'Adequate (0.42–0.5)' };
    if (val > 0.35) return { color: '#60A5FA', label: 'Moderate (0.35–0.42)' };
    if (val > 0.28) return { color: '#F59E0B', label: 'Mild Stress (0.28–0.35)' };
    return { color: '#DC2626', label: 'Severe Stress (<=0.28)' };
  }
  return { color: '#64748B', label: 'N/A' };
};

// ── Shared chart defaults ─────────────────────────────────────────────────
