/* Shared Chart.js options and dashboard lookup tables. */
export const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { font: { size: 11, weight: '600' }, padding: 16, usePointStyle: true }
    }
  },
  scales: {
    y: {
      grid: { color: 'rgba(0,0,0,0.04)', borderDash: [4, 4] },
      ticks: { font: { size: 11 } }
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 } }
    }
  }
};


export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Lowercase crop ids (as passed by the per-crop Monitoring wrappers) → display labels
export const CROP_CONFIG_KEYS = {
  rice: 'Rice', maize: 'Maize', cashew: 'Cashew', cocoa: 'Cocoa',
  ffb: 'Oil palm', oil_palm: 'Oil palm', rubber: 'Rubber',
  cassava: 'Cassava', sugarcane: 'Sugarcane',
};

/**
 * The single satellite-monitoring dashboard, used in two modes:
 *
 *   mode="crop"          one crop for the tenant — crop-specific legends
 *                        (own class breakpoints + agronomic wording), index
 *                        list narrowed to the crop's profile, rasters coloured
 *                        with that crop's interpretation.
 *   mode="organization"  the whole organization — generic legends built from
 *                        whatever indices exist in the tenant's archive.
 *
 * These were two near-identical 7,400-line files that had to be edited in
 * lockstep and had already drifted. Everything below is shared; the six
 * genuinely mode-dependent points each branch on `isOrg`.
 */
