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
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'intelligence-layers', label: 'Member plots map' },
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
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'intelligence-layers', label: 'Restoration map' },
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
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'intelligence-layers', label: 'Plot map' },
      { id: 'land-restoration', label: 'Deforestation check' },
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
    sidebar: [
      { id: 'analytics', label: 'Overview' },
      { id: 'intelligence-layers', label: 'Field map' },
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
    sidebar: [
      { id: 'analytics', label: 'Overview' },
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
