/**
 * Service catalogue: sustainability, field advisory and smallholder services.
 *
 * Every service opens in the same layout as organisation and crop monitoring
 * (CropDashboardLayout: header, sidebar, map, calendar, time slider, split
 * comparison, alerts, reports). A service only defines which sub-pages it
 * shows, in which order and under which names. Labels are plain, sentence
 * case, with no sensor or index names (docs/INFORMATION_PRESENTATION.md).
 *
 *   sidebar    left sidebar pages: analytics, crop-health, crop-yield,
 *              moisture-content, climate, land-restoration, alerts, and the
 *              service page kinds register, check, advice, members,
 *              forms, submissions, group-carbon, eudr-passport
 *   analytics  sub-tabs of the Overview page (overview, vigor-health,
 *              moisture-et, et-log, water-management, soil-nutrients)
 *   topTabs    always HEADER_TABS: Monitor, Reports, Verification, Assistant
 *
 * The backend catalogue (GET /crop-monitoring/catalogue/{id}, WORK_SPLIT.md)
 * has the same shape and replaces this copy when it is live.
 */
const HEADER_TABS = [
  { id: 'monitor', label: 'Monitor' },
  { id: 'reports', label: 'Reports' },
  { id: 'verification', label: 'Verification' },
  { id: 'ai-assistant', label: 'Assistant' },
];

export const SERVICE_CATALOG = {
  // ── Sustainability ────────────────────────────────────────────────────────
  'carbon-ffb': {
    title: 'Estate carbon',
    subtitle: 'Carbon stock and land-use change',
    overviewTitle: 'Estate carbon',
    overviewText: 'How much carbon the estate holds, block by block, and where land use has changed since the baseline.',
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'crop-health', label: 'Biomass and growth' },
      { id: 'land-restoration', label: 'Land-use change' },
      { id: 'climate', label: 'Weather' },
      { id: 'alerts', label: 'Canopy loss alerts' },
    ],
    analytics: [
      { id: 'overview', label: 'Overview' },
      { id: 'vigor-health', label: 'Biomass and growth' },
      { id: 'soil-nutrients', label: 'Soil' },
    ],
    topTabs: HEADER_TABS,
  },
  'forestry-intel': {
    title: 'Forestry intelligence',
    subtitle: 'Forest cover, condition and disturbance',
    overviewTitle: 'Forest overview',
    overviewText: 'Where forest is healthy, where it is stressed, and where it has been cleared or disturbed.',
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'crop-health', label: 'Canopy condition' },
      { id: 'moisture-content', label: 'Canopy moisture' },
      { id: 'land-restoration', label: 'Forest cover change' },
      { id: 'climate', label: 'Weather' },
      { id: 'alerts', label: 'Disturbance alerts' },
    ],
    analytics: [
      { id: 'overview', label: 'Overview' },
      { id: 'vigor-health', label: 'Canopy condition' },
      { id: 'moisture-et', label: 'Canopy moisture' },
    ],
    topTabs: HEADER_TABS,
  },
  'carbon-estimator': {
    title: 'Carbon estimator',
    subtitle: 'Carbon estimates and scenarios',
    overviewTitle: 'Carbon estimate',
    overviewText: 'An estimate of the carbon a site could hold under different plans, before a project starts.',
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'land-restoration', label: 'Land cover today' },
      { id: 'climate', label: 'Weather' },
    ],
    analytics: [
      { id: 'overview', label: 'Overview' },
      { id: 'vigor-health', label: 'Biomass and growth' },
    ],
    topTabs: HEADER_TABS,
  },
  'land-restoration': {
    title: 'Land restoration',
    subtitle: 'Restoration sites and recovery',
    overviewTitle: 'Restoration overview',
    overviewText: 'Where land is degraded, where it is recovering, and how vegetation and moisture respond over time.',
    register: {
      title: 'Restoration zones', file: 'restoration-zones',
      text: 'Every restoration zone with its area. Planting and survival come from your planting records and surveys (Settings, Your data).',
      columns: [{ id: 'block', label: 'Zone' }, { id: 'estate', label: 'Site' }, { id: 'area', label: 'Area' }],
    },
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'register', label: 'Zone register' },
      { id: 'land-restoration', label: 'Restoration zones' },
      { id: 'crop-health', label: 'Vegetation recovery' },
      { id: 'moisture-content', label: 'Soil moisture' },
      { id: 'climate', label: 'Weather' },
      { id: 'alerts', label: 'Degradation alerts' },
    ],
    analytics: [
      { id: 'overview', label: 'Overview' },
      { id: 'vigor-health', label: 'Vegetation recovery' },
      { id: 'moisture-et', label: 'Moisture' },
    ],
    topTabs: HEADER_TABS,
  },
  'eudr-check': {
    title: 'EUDR check',
    subtitle: 'Deforestation evidence for EU buyers',
    overviewTitle: 'EUDR overview',
    overviewText: 'Where each supplying plot is, and whether forest was cleared there after 31 December 2020.',
    register: {
      title: 'Plot register', file: 'eudr-plot-register',
      text: 'Every plot that supplies EU buyers: estate, area, geolocation and the result of the deforestation check since 31 December 2020.',
      note: 'Until the deforestation check has run for a plot, it shows "Not checked": no plot is marked deforestation-free without a real check.',
      columns: [{ id: 'block', label: 'Plot' }, { id: 'estate', label: 'Estate' }, { id: 'area', label: 'Area' }, { id: 'geolocation', label: 'Geolocation' }, { id: 'status', label: 'Check result' }],
    },
    check: {
      title: 'Deforestation check',
      text: 'For each plot: was it forest on 31 December 2020, has any been cleared since, does it overlap a protected area, and on what evidence.',
    },
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'register', label: 'Plot register' },
      { id: 'check', label: 'Deforestation check' },
      { id: 'land-restoration', label: 'Land cover change' },
      { id: 'alerts', label: 'Deforestation alerts' },
    ],
    analytics: [
      { id: 'overview', label: 'Overview' },
    ],
    topTabs: HEADER_TABS,
  },

  // ── Field advisory ────────────────────────────────────────────────────────
  'advisor': {
    title: 'Farm AI advisor',
    subtitle: 'Weather and advice per field',
    overviewTitle: 'Advisory overview',
    overviewText: 'Crop condition, water and weather, turned into advice for each field.',
    advice: {
      title: 'This week',
      text: 'What to do in each field this week, most urgent first, with the reason behind it.',
    },
    sidebar: [
      { id: 'advice', label: 'This week' },
      { id: 'analytics', label: 'Overview' },
      { id: 'crop-health', label: 'Crop condition' },
      { id: 'moisture-content', label: 'Water' },
      { id: 'climate', label: 'Weather' },
      { id: 'alerts', label: 'Advisories' },
    ],
    analytics: [
      { id: 'overview', label: 'Overview' },
      { id: 'vigor-health', label: 'Crop growth' },
      { id: 'moisture-et', label: 'Water use' },
      { id: 'water-management', label: 'Irrigation' },
    ],
    topTabs: HEADER_TABS,
  },

  // ── Smallholder (opened from the Smallholder hub) ─────────────────────────
  'smallholder-members': {
    title: 'Members and parcels',
    subtitle: 'Smallholder',
    overviewTitle: 'Member parcels',
    overviewText: 'Every member parcel on the map, with its condition from satellite.',
    sidebar: [
      { id: 'members', label: 'Members and parcels' },
      { id: 'forms', label: 'Registration forms' },
      { id: 'submissions', label: 'Answers to review' },
      { id: 'analytics', label: 'Parcel map' },
    ],
    analytics: [{ id: 'overview', label: 'Overview' }],
    topTabs: HEADER_TABS,
  },
  'group-monitoring': {
    title: 'Field monitoring',
    subtitle: 'Smallholder',
    overviewTitle: 'Member farms',
    overviewText: 'How member farms are doing across groups, from satellite, and which ones need a visit.',
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'crop-health', label: 'Crop health' },
      { id: 'moisture-content', label: 'Water' },
      { id: 'climate', label: 'Weather' },
      { id: 'alerts', label: 'Alerts' },
    ],
    analytics: [
      { id: 'overview', label: 'Overview' },
      { id: 'vigor-health', label: 'Crop health' },
      { id: 'moisture-et', label: 'Water' },
    ],
    topTabs: HEADER_TABS,
  },
  'carbon-groups': {
    title: 'Group carbon',
    subtitle: 'Smallholder',
    overviewTitle: 'Group carbon',
    overviewText: 'Member farms, vegetation and land-use change behind the carbon estimate for each group.',
    sidebar: [
      { id: 'group-carbon', label: 'Carbon by group' },
      { id: 'analytics', label: 'Overview' },
      { id: 'crop-health', label: 'Farm condition' },
      { id: 'land-restoration', label: 'Land-use change' },
      { id: 'alerts', label: 'Alerts' },
    ],
    analytics: [
      { id: 'overview', label: 'Overview' },
      { id: 'vigor-health', label: 'Biomass and growth' },
    ],
    topTabs: HEADER_TABS,
  },
  'smallholder-eudr': {
    title: 'EUDR passport',
    subtitle: 'Smallholder',
    overviewTitle: 'Member parcels',
    overviewText: 'Member parcels and forest-cover change since 31 December 2020.',
    sidebar: [
      { id: 'eudr-passport', label: 'EUDR passport' },
      { id: 'analytics', label: 'Parcel map' },
      { id: 'land-restoration', label: 'Land cover change' },
      { id: 'alerts', label: 'Deforestation alerts' },
    ],
    analytics: [{ id: 'overview', label: 'Overview' }],
    topTabs: HEADER_TABS,
  },

  // ── Engine ────────────────────────────────────────────────────────────────
  'rs-drone': {
    title: 'Drone surveys',
    subtitle: 'Drone imagery with satellite context',
    overviewTitle: 'Survey overview',
    overviewText: 'Detailed drone surveys, next to the latest satellite view of the same fields.',
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'crop-health', label: 'Canopy problems' },
      { id: 'alerts', label: 'Survey alerts' },
    ],
    analytics: [{ id: 'overview', label: 'Overview' }],
    topTabs: HEADER_TABS,
  },
};

export const isServiceModule = (id) => Boolean(SERVICE_CATALOG[id]);
