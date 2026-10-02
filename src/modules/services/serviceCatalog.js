/**
 * Service catalogue: sustainability, field advisory and finance services.
 *
 * Every service opens in the same layout as organisation and crop monitoring
 * (CropDashboardLayout: header, sidebar, map, calendar, time slider, split
 * comparison, alerts, reports). A service defines which specialized sub-pages it
 * shows, in which order and under which names without redundant map tabs.
 *
 *   sidebar    left sidebar pages   (analytics, register, check, log, advice, crop-health,
 *              crop-yield, moisture-content, climate, land-restoration, alerts)
 *   analytics  sub-tabs of the Overview page (overview, vigor-health,
 *              moisture-et, et-log, water-management, soil-nutrients)
 *   topTabs    always HEADER_TABS: Monitor, Reports, Verification, Assistant
 */
const HEADER_TABS = [
  { id: 'monitor', label: 'Monitor' },
  { id: 'reports', label: 'Reports' },
  { id: 'verification', label: 'Verification' },
  { id: 'ai-assistant', label: 'Assistant' },
];

export const SERVICE_CATALOG = {
  'carbon-ffb': {
    title: 'Estate Carbon',
    subtitle: 'Carbon stock and land-use change',
    overviewTitle: 'Estate carbon overview',
    overviewText: 'Vegetation, biomass and land-use signals behind the estate carbon stock, from Sentinel-2, Landsat and Sentinel-1.',
    sidebar: [
      { id: 'analytics', label: 'Carbon overview' },
      { id: 'crop-health', label: 'Biomass & canopy vigour' },
      { id: 'land-restoration', label: 'Land-use & biomass flux' },
      { id: 'climate', label: 'Carbon climate telemetry' },
      { id: 'alerts', label: 'Canopy loss alerts' },
    ],
    analytics: [
      { id: 'overview', label: 'Carbon overview' },
      { id: 'vigor-health', label: 'Biomass & growth' },
      { id: 'soil-nutrients', label: 'Soil carbon signals' },
    ],
    topTabs: HEADER_TABS,
  },
  'carbon-groups': {
    title: 'Group Carbon',
    subtitle: 'Carbon for smallholder groups',
    overviewTitle: 'Group carbon overview',
    overviewText: 'Member plots, vegetation and land-use change across each smallholder cooperative group.',
    register: {
      title: 'Groups and members', file: 'group-members',
      text: 'Member plots by group, with area. Group and member names come from the group membership data you upload (Settings, Your data).',
      columns: [{ id: 'block', label: 'Plot' }, { id: 'estate', label: 'Group' }, { id: 'area', label: 'Area' }],
    },
    sidebar: [
      { id: 'analytics', label: 'Group overview' },
      { id: 'register', label: 'Groups & members' },
      { id: 'crop-health', label: 'Plot vegetative condition' },
      { id: 'land-restoration', label: 'Land-use changes' },
      { id: 'alerts', label: 'Group alerts' },
    ],
    analytics: [
      { id: 'overview', label: 'Overview' },
      { id: 'vigor-health', label: 'Biomass & growth' },
    ],
    topTabs: HEADER_TABS,
  },
  'forestry-intel': {
    title: 'Forestry Intelligence',
    subtitle: 'Forest cover, condition and disturbance',
    overviewTitle: 'Forestry canopy overview',
    overviewText: 'Canopy condition, moisture and forest-cover change from optical and radar satellites.',
    sidebar: [
      { id: 'analytics', label: 'Forest overview' },
      { id: 'crop-health', label: 'Canopy condition' },
      { id: 'moisture-content', label: 'Canopy moisture' },
      { id: 'land-restoration', label: 'Forest cover change' },
      { id: 'climate', label: 'Forest climate' },
      { id: 'alerts', label: 'Disturbance alerts' },
    ],
    analytics: [
      { id: 'overview', label: 'Overview' },
      { id: 'vigor-health', label: 'Canopy vigour' },
      { id: 'moisture-et', label: 'Canopy moisture' },
    ],
    topTabs: HEADER_TABS,
  },
  'carbon-estimator': {
    title: 'Carbon Estimator',
    subtitle: 'Carbon estimates and scenarios',
    overviewTitle: 'Carbon scenario estimate',
    overviewText: 'Vegetation and land-cover inputs used to estimate carbon for a site, with scenarios.',
    sidebar: [
      { id: 'analytics', label: 'Estimate overview' },
      { id: 'land-restoration', label: 'Land cover baseline' },
      { id: 'climate', label: 'Site climate' },
    ],
    analytics: [
      { id: 'overview', label: 'Overview' },
      { id: 'vigor-health', label: 'Biomass & growth' },
    ],
    topTabs: HEADER_TABS,
  },
  'land-restoration': {
    title: 'Land Restoration',
    subtitle: 'Restoration sites and recovery',
    overviewTitle: 'Restoration overview',
    overviewText: 'Where land is degraded, where it is recovering, and how vegetation and moisture respond over time.',
    register: {
      title: 'Restoration zones', file: 'restoration-zones',
      text: 'Every restoration zone with its area. Planting and survival come from your planting records and surveys (Settings, Your data).',
      columns: [{ id: 'block', label: 'Zone' }, { id: 'estate', label: 'Site' }, { id: 'area', label: 'Area' }],
    },
    sidebar: [
      { id: 'analytics', label: 'Restoration overview' },
      { id: 'register', label: 'Zone register' },
      { id: 'land-restoration', label: 'Restoration zones' },
      { id: 'crop-health', label: 'Vegetation recovery' },
      { id: 'moisture-content', label: 'Soil moisture' },
      { id: 'climate', label: 'Restoration climate' },
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
    title: 'EUDR Check',
    subtitle: 'Deforestation-free evidence (EUDR)',
    overviewTitle: 'EUDR compliance overview',
    overviewText: 'Plot geolocation and forest-cover change since the 31 December 2020 cut-off, for oil palm, cocoa and rubber supply.',
    register: {
      title: 'Plot register', file: 'eudr-plot-register',
      text: 'Every plot that supplies EU buyers: estate, area, geolocation and the result of the deforestation check since 31 December 2020.',
      note: 'The deforestation check is evaluated on the EU reference forest map and loss data. Until it runs, every plot shows "Not checked": no plot is marked deforestation-free without a real check.',
      columns: [{ id: 'block', label: 'Plot' }, { id: 'estate', label: 'Estate' }, { id: 'area', label: 'Area' }, { id: 'geolocation', label: 'Geolocation' }, { id: 'status', label: 'Check result' }],
    },
    check: {
      title: 'Deforestation check',
      text: 'For each plot: was it forest on 31 December 2020, has any been cleared since, does it overlap a protected area, and on what evidence.',
    },
    sidebar: [
      { id: 'analytics', label: 'Compliance overview' },
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
  'advisor': {
    title: 'Farm AI Advisor',
    subtitle: 'Unified Agronomic AI & Multi-Service Report Engine',
    overviewTitle: 'Farm AI Advisor',
    overviewText: 'Single enterprise AI intelligence engine and executive report builder across all your licensed crops and services.',
    sidebar: [],
    analytics: [],
    topTabs: [
      { id: 'ai-assistant', label: 'AI Assistant & Scenarios' },
      { id: 'reports', label: 'Multi-Service Reports' },
    ],
    isAiOnly: true,
  },
  'suitability-tool': {
    title: 'Crop Suitability Analysis',
    subtitle: 'Agronomic Soil, Climate & MCDA Suitability Tool',
    overviewTitle: 'Crop Suitability Engine',
    overviewText: 'Evaluate land suitability for 8 major crops based on soil pH, rainfall, temperature, elevation, slope, and drainage with customizable MCDA weights.',
    sidebar: [
      { id: 'suitability-eval', label: 'Suitability Analysis' },
    ],
    analytics: [
      { id: 'overview', label: 'Evaluation Engine' },
    ],
    topTabs: HEADER_TABS,
  },
  'group-monitoring': {
    title: 'Smallholder Monitoring',
    subtitle: 'Member farms across your groups',
    overviewTitle: 'Groups overview',
    overviewText: 'How member farms are doing across groups, from satellite, with the farms that need a visit.',
    sidebar: [
      { id: 'analytics', label: 'Groups overview' },
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
  'rs-drone': {
    title: 'Drone Surveys',
    subtitle: 'Drone imagery with satellite context',
    overviewTitle: 'Survey overview',
    overviewText: 'High-resolution drone surveys with contextual multi-spectral satellite intelligence.',
    sidebar: [
      { id: 'analytics', label: 'Survey overview' },
      { id: 'crop-health', label: 'Canopy anomalies' },
      { id: 'alerts', label: 'Survey alerts' },
    ],
    analytics: [{ id: 'overview', label: 'Overview' }],
    topTabs: HEADER_TABS,
  },
  'finance-hub': {
    title: 'Central Ledger',
    subtitle: 'Farm production and payments',
    overviewTitle: 'Ledger overview',
    overviewText: 'Production signals per block that feed farmer statements and payments.',
    sidebar: [
      { id: 'analytics', label: 'Ledger overview' },
      { id: 'crop-yield', label: 'Production outlook' },
      { id: 'alerts', label: 'Payment alerts' },
    ],
    analytics: [
      { id: 'overview', label: 'Overview' },
    ],
    topTabs: HEADER_TABS,
  },
};

export const isServiceModule = (id) => Boolean(SERVICE_CATALOG[id]);
