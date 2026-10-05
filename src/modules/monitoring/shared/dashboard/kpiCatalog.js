/**
 * Overview KPI cards per crop and service. Each portal lists the questions its
 * users ask (docs/services/*.md, docs/services/*-monitoring.md); every value is computed
 * from real data only. A KPI without data says why instead of showing a
 * number. Condition classes come from the admin's map classes for the index
 * (Crop thresholds), never from a fixed table.
 *
 * compute(ctx) → { value, sub } | { missing: 'why' }
 * ctx = { plots, stats, alerts, unitLabel, classify(plot, key), primaryKey, waterKey, latestPass }
 */

const n = (v) => (v == null || Number.isNaN(Number(v)) ? null : Number(v));
const fmtHa = (v) => `${Math.round(v).toLocaleString()} ha`;

function totalArea(ctx) {
  const fromStats = n(ctx.stats?.total_area_ha);
  if (fromStats != null) return fromStats;
  const areas = ctx.plots.map((p) => parseFloat(p.area)).filter((v) => !Number.isNaN(v));
  return areas.length && areas.length === ctx.plots.length ? areas.reduce((a, b) => a + b, 0) : null;
}

// Share of blocks in the best / worst admin class for an index.
function classShares(ctx, key) {
  if (!key) return null;
  const classes = ctx.plots.map((p) => ctx.classify(p, key)).filter(Boolean);
  if (!classes.length) return null;
  const count = (rank) => classes.filter((c) => c.rank === rank).length;
  return { total: classes.length, best: count('best'), worst: count('worst'), bestLabel: classes.find((c) => c.rank === 'best')?.label, worstLabel: classes.find((c) => c.rank === 'worst')?.label };
}

export const KPI_DEFS = {
  area: {
    label: 'Area monitored',
    compute: (ctx) => {
      const a = totalArea(ctx);
      if (!ctx.plots.length && a == null) return { missing: 'No boundaries registered yet' };
      return { value: a != null ? fmtHa(a) : '—', sub: `${ctx.plots.length} ${ctx.unitLabel}` };
    },
  },
  condition: {
    label: 'In good condition',
    compute: (ctx) => {
      const s = classShares(ctx, ctx.primaryKey);
      if (!s) return { missing: ctx.primaryKey ? 'Waiting for the first satellite results' : 'Map classes not set by the admin yet' };
      return { value: `${s.best} of ${s.total}`, sub: s.worst ? `${s.worst} need attention${s.worstLabel ? ` (${s.worstLabel.toLowerCase()})` : ''}` : 'None need attention' };
    },
  },
  water: {
    label: 'Short of water',
    compute: (ctx) => {
      const s = classShares(ctx, ctx.waterKey);
      if (!s) return { missing: ctx.waterKey ? 'Waiting for the first satellite results' : 'No water layer for this crop' };
      return { value: `${s.worst} of ${s.total}`, sub: s.worst ? 'Check irrigation, drainage or rainfall' : 'No block short of water' };
    },
  },
  alerts: {
    label: 'Open alerts',
    compute: (ctx) => {
      const open = (ctx.alerts || []).filter((a) => !['Resolved', 'Dismissed', 'resolved', 'dismissed'].includes(a.status));
      const urgent = open.filter((a) => /critical/i.test(a.severity || a.level || '')).length;
      return { value: String(open.length), sub: urgent ? `${urgent} to act on now` : open.length ? 'None urgent' : 'Nothing open' };
    },
  },
  carbon: {
    label: 'Carbon (estimate)',
    compute: (ctx) => {
      const d = n(ctx.stats?.average_carbon_density_tco2e_ha);
      const a = totalArea(ctx);
      if (d == null) return { missing: 'Estimate not produced yet' };
      return { value: a != null ? `${Math.round(d * a).toLocaleString()} t` : `${d.toFixed(1)} t/ha`, sub: `${d.toFixed(1)} t CO₂e per ha, before calibration` };
    },
  },
  eudr: {
    label: 'Deforestation check',
    compute: (ctx) => {
      const checked = ctx.plots.filter((p) => p.eudrStatus && p.eudrStatus !== 'not_checked');
      if (!checked.length) return { value: `0 of ${ctx.plots.length}`, sub: 'Not checked yet: no plot is marked clear without a check' };
      const fail = checked.filter((p) => p.eudrStatus === 'fail').length;
      const review = checked.filter((p) => p.eudrStatus === 'review').length;
      return { value: `${checked.length} of ${ctx.plots.length}`, sub: fail || review ? `${fail} deforestation found · ${review} to review` : 'No deforestation found' };
    },
  },
  geolocation: {
    label: 'Geolocation complete',
    compute: (ctx) => {
      if (!ctx.plots.length) return { missing: 'No plots registered yet' };
      const needPolygon = ctx.plots.filter((p) => (parseFloat(p.area) || 0) > 4 && (p.coords || []).length < 4).length;
      const ok = ctx.plots.length - needPolygon;
      return { value: `${ok} of ${ctx.plots.length}`, sub: needPolygon ? `${needPolygon} plots over 4 ha need a polygon` : 'Every plot has the location EU rules ask for' };
    },
  },
  latest: {
    label: 'Latest satellite view',
    compute: (ctx) => (ctx.latestPass ? { value: ctx.latestPass, sub: 'Maps and figures are from this date' } : { missing: 'No satellite results yet' }),
  },
};

/** Default KPIs for crop portals; services override them in their catalogue entry (`kpis`). */
export const CROP_KPIS = ['area', 'condition', 'water', 'alerts'];

export const SERVICE_KPIS = {
  'carbon-ffb': ['area', 'carbon', { id: 'condition', label: 'Biomass growing well' }, 'alerts'],
  'forestry-intel': ['area', { id: 'condition', label: 'Canopy in good condition' }, { id: 'water', label: 'Canopy short of water' }, { id: 'alerts', label: 'Disturbances open' }],
  'carbon-estimator': ['area', 'carbon', 'latest'],
  'land-restoration': ['area', { id: 'condition', label: 'Zones recovering' }, { id: 'water', label: 'Zones short of water' }, 'alerts'],
  'eudr-check': ['area', 'eudr', 'geolocation', { id: 'alerts', label: 'Deforestation alerts' }],
  advisor: ['area', { id: 'condition', label: 'Fields doing well' }, 'water', { id: 'alerts', label: 'Advice to act on' }],
  'group-monitoring': ['area', { id: 'condition', label: 'Farms doing well' }, { id: 'water', label: 'Farms short of water' }, { id: 'alerts', label: 'Farms to visit' }],
  'carbon-groups': ['area', 'carbon', { id: 'condition', label: 'Farms keeping tree cover' }, 'alerts'],
  'smallholder-members': ['area', { id: 'condition', label: 'Parcels doing well' }, 'alerts', 'latest'],
  'smallholder-eudr': ['area', 'eudr', 'geolocation', { id: 'alerts', label: 'Deforestation alerts' }],
  'rs-drone': ['area', { id: 'condition', label: 'Canopy in good condition' }, 'alerts', 'latest'],
};

// What a block is called in each service.
export const UNIT_LABEL = {
  'land-restoration': 'zones', 'eudr-check': 'plots', 'forestry-intel': 'compartments',
  'group-monitoring': 'member farms', 'carbon-groups': 'member farms', 'smallholder-members': 'parcels',
  'smallholder-eudr': 'parcels',
};

export function kpisFor(serviceId) {
  const list = (serviceId && SERVICE_KPIS[serviceId]) || CROP_KPIS;
  return list.map((k) => (typeof k === 'string' ? { id: k } : k)).filter((k) => KPI_DEFS[k.id]);
}
