/**
 * Service catalogue: sustainability, field advisory and finance services.
 *
 * Every service opens in the same layout as organisation and crop monitoring
 * (CropDashboardLayout: header, sidebar, map, calendar, time slider, split
 * comparison, alerts, reports). A service only defines which sub-pages it
 * shows, in which order and under which names:
 *
 *   sidebar    left sidebar pages   (analytics, intelligence-layers, crop-health,
 *              crop-yield, moisture-content, climate, land-restoration, alerts)
 *   analytics  sub-tabs of the Overview page (overview, vigor-health,
 *              moisture-et, et-log, water-management, soil-nutrients)
 *   topTabs    always HEADER_TABS: Monitor, Reports, Verification, Assistant
 *
 * What each sub-page should contain per service is the next research step
 * (docs/FINDINGS.md, S-series); until then each sub-page shows the shared page.
 */
// The same four header tabs on every remote-sensing portal (crops,
// organisations, services); only their contents change per service.
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
      { id: 'analytics', label: 'Overview' },
      { id: 'intelligence-layers', label: 'Carbon map' },
      { id: 'crop-health', label: 'Biomass & vigour' },
      { id: 'land-restoration', label: 'Land-use change' },
      { id: 'climate', label: 'Climate' },
      { id: 'alerts', label: 'Alerts' },
    ],
    analytics: [
      { id: 'overview', label: 'Overview' },
      { id: 'vigor-health', label: 'Biomass & growth' },
      { id: 'soil-nutrients', label: 'Soil carbon signals' },
    ],
    topTabs: HEADER_TABS,
  },
  'carbon-groups': {
    title: 'Group Carbon',
    subtitle: 'Carbon for smallholder groups',
    overviewTitle: 'Group carbon overview',
    overviewText: 'Member plots, vegetation and land-use change across each smallholder group.',
    register: {
      title: 'Groups and members', file: 'group-members',
      text: 'Member plots by group, with area. Group and member names come from the group membership data you upload (Settings, Your data).',
      columns: [{ id: 'block', label: 'Plot' }, { id: 'estate', label: 'Group' }, { id: 'area', label: 'Area' }],
    },
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'intelligence-layers', label: 'Member plots map' },
      { id: 'register', label: 'Groups & members' },
      { id: 'crop-health', label: 'Plot condition' },
      { id: 'land-restoration', label: 'Land-use change' },
      { id: 'alerts', label: 'Alerts' },
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
    overviewTitle: 'Forest overview',
    overviewText: 'Canopy condition, moisture and forest-cover change from optical and radar satellites.',
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'intelligence-layers', label: 'Forest map' },
      { id: 'crop-health', label: 'Canopy condition' },
      { id: 'moisture-content', label: 'Canopy moisture' },
      { id: 'land-restoration', label: 'Forest cover change' },
      { id: 'climate', label: 'Climate' },
      { id: 'alerts', label: 'Disturbance alerts' },
    ],
    analytics: [
      { id: 'overview', label: 'Overview' },
      { id: 'vigor-health', label: 'Canopy vigour' },
      { id: 'moisture-et', label: 'Moisture' },
    ],
    topTabs: HEADER_TABS,
  },
  'carbon-estimator': {
    title: 'Carbon Estimator',
    subtitle: 'Carbon estimates and scenarios',
    overviewTitle: 'Carbon estimate',
    overviewText: 'Vegetation and land-cover inputs used to estimate carbon for a site, with scenarios.',
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'intelligence-layers', label: 'Site map' },
      { id: 'land-restoration', label: 'Land cover' },
      { id: 'climate', label: 'Climate' },
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
      { id: 'analytics', label: 'Overview' },
      { id: 'intelligence-layers', label: 'Restoration map' },
      { id: 'register', label: 'Zone register' },
      { id: 'land-restoration', label: 'Restoration zones' },
      { id: 'crop-health', label: 'Vegetation recovery' },
      { id: 'moisture-content', label: 'Moisture' },
      { id: 'climate', label: 'Climate' },
      { id: 'alerts', label: 'Alerts' },
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
    overviewTitle: 'EUDR overview',
    overviewText: 'Plot geolocation and forest-cover change since the 31 December 2020 cut-off, for oil palm, cocoa and rubber supply.',
    register: {
      title: 'Plot register', file: 'eudr-plot-register',
      text: 'Every plot that supplies EU buyers: estate, area, geolocation and the result of the deforestation check since 31 December 2020.',
      note: 'The deforestation check is being rebuilt on the EU reference forest map and loss data. Until it runs, every plot shows "Not checked": no plot is marked deforestation-free without a real check.',
      columns: [{ id: 'block', label: 'Plot' }, { id: 'estate', label: 'Estate' }, { id: 'area', label: 'Area' }, { id: 'geolocation', label: 'Geolocation' }, { id: 'status', label: 'Check result' }],
    },
    check: {
      title: 'Deforestation check',
      text: 'For each plot: was it forest on 31 December 2020, has any been cleared since, does it overlap a protected area, and on what evidence.',
    },
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'intelligence-layers', label: 'Plot map' },
      { id: 'register', label: 'Plot register' },
      { id: 'check', label: 'Deforestation check' },
      { id: 'land-restoration', label: 'Land cover change' },
      { id: 'alerts', label: 'Alerts' },
    ],
    analytics: [
      { id: 'overview', label: 'Overview' },
    ],
    topTabs: HEADER_TABS,
  },
  'activity-ffb': {
    title: 'Field Logs',
    subtitle: 'Field operations and scouting',
    overviewTitle: 'Field operations overview',
    overviewText: 'Field condition from satellite, next to the operations and scouting recorded for each block.',
    log: {
      title: 'Operations log', dataset: 'field-operations',
      text: 'What was done in each block, when and by whom: harvesting, spraying, pruning, fertiliser and scouting.',
      types: ['Harvest', 'Spray', 'Prune', 'Fertilise', 'Weed', 'Scout'],
    },
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'intelligence-layers', label: 'Field map' },
      { id: 'log', label: 'Operations log' },
      { id: 'crop-health', label: 'Field condition' },
      { id: 'climate', label: 'Weather' },
      { id: 'alerts', label: 'Field alerts' },
    ],
    analytics: [
      { id: 'overview', label: 'Overview' },
      { id: 'vigor-health', label: 'Growth' },
    ],
    topTabs: HEADER_TABS,
  },
  'advisor': {
    title: 'Farm Advisor',
    subtitle: 'Weather and field advice',
    overviewTitle: 'Advisory overview',
    overviewText: 'Crop condition, water and weather, turned into advice for each field.',
    advice: {
      title: 'This week',
      text: 'What to do in each field this week, most urgent first, with the reason behind it.',
    },
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'advice', label: 'This week' },
      { id: 'intelligence-layers', label: 'Advisory map' },
      { id: 'crop-health', label: 'Crop condition' },
      { id: 'moisture-content', label: 'Water' },
      { id: 'climate', label: 'Weather & climate' },
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
  'group-monitoring': {
    title: 'Smallholder Monitoring',
    subtitle: 'Member farms across your groups',
    overviewTitle: 'Groups overview',
    overviewText: 'How member farms are doing across groups, from satellite, with the farms that need a visit.',
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'intelligence-layers', label: 'Member farms map' },
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
    overviewText: 'Drone survey imagery is not connected yet; until it is, this view shows the satellite picture of the same fields.',
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'intelligence-layers', label: 'Survey map' },
      { id: 'crop-health', label: 'Crop health' },
      { id: 'alerts', label: 'Alerts' },
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
      { id: 'analytics', label: 'Overview' },
      { id: 'intelligence-layers', label: 'Farm map' },
      { id: 'crop-yield', label: 'Production outlook' },
      { id: 'alerts', label: 'Alerts' },
    ],
    analytics: [
      { id: 'overview', label: 'Overview' },
    ],
    topTabs: HEADER_TABS,
  },
};

export const isServiceModule = (id) => Boolean(SERVICE_CATALOG[id]);
