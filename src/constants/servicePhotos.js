// Photo per crop and service (compressed WebP in /public/crops), shared by
// the hub cards and the admin onboarding cards so both show the same picture.
export const CROP_PHOTOS = {
  ffb: '/crops/oil_palm.webp', maize: '/crops/maize.webp', rice: '/crops/rice.webp', cassava: '/crops/cassava.webp',
  cocoa: '/crops/cocoa.webp', sugarcane: '/crops/sugarcane.webp', cashew: '/crops/cashew.webp', rubber: '/crops/rubber.webp',
};

export const SERVICE_PHOTOS = {
  'carbon-ffb': '/crops/estate_carbon.webp', 'carbon-groups': '/crops/group_carbon.webp',
  'forestry-intel': '/crops/forestry.webp', 'carbon-estimator': '/crops/estimator.webp',
  'land-restoration': '/crops/restoration.webp', 'eudr-check': '/crops/eudr.webp',
  'activity-ffb': '/crops/field_logs.webp', advisor: '/crops/advisor.webp',
};

// Services an organisation can be given at onboarding, grouped as on the hub.
export const SERVICE_GROUPS = [
  { id: 'sustainability', label: 'Sustainability', services: [
    { id: 'carbon-ffb', label: 'Estate carbon', desc: 'Carbon stock and land-use change for estates' },
    { id: 'carbon-groups', label: 'Group carbon', desc: 'Carbon for smallholder groups' },
    { id: 'forestry-intel', label: 'Forestry intelligence', desc: 'Forest cover, condition and disturbance' },
    { id: 'carbon-estimator', label: 'Carbon estimator', desc: 'Estimates and scenarios before a project' },
    { id: 'land-restoration', label: 'Land restoration', desc: 'Restoration zones and recovery' },
    { id: 'eudr-check', label: 'EUDR check', desc: 'Deforestation-free evidence for EU buyers' },
  ] },
  { id: 'field-advisory', label: 'Field advisory', services: [
    { id: 'activity-ffb', label: 'Field logs', desc: 'Field operations and scouting' },
    { id: 'advisor', label: 'Farm advisor', desc: 'Weather and advice per field' },
  ] },
];

// Packages: one click grants a set of services (e.g. Sustainable Land Management).
export const SERVICE_PACKAGES = [
  { id: 'slm', label: 'SLM programme', desc: 'Sustainable Land Management: restoration, advisor, field logs', services: ['land-restoration', 'advisor', 'activity-ffb'] },
  { id: 'eudr-supply', label: 'EUDR supply chain', desc: 'EUDR check with field logs for evidence', services: ['eudr-check', 'activity-ffb'] },
];
