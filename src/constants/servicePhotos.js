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
  advisor: '/crops/advisor.webp',
  'smallholder-members': '/crops/smallholder.webp',
  'group-monitoring': '/crops/advisor.webp', 'smallholder-eudr': '/crops/eudr.webp',
  'rs-drone': '/crops/drone.webp',
};

// Services an organisation can be given at onboarding, grouped as on the hub.
// Crop suitability is a FarmIntelytics team tool and is never granted.
export const SERVICE_GROUPS = [
  { id: 'sustainability', label: 'Sustainability', services: [
    { id: 'carbon-ffb', label: 'Estate carbon', desc: 'Carbon stock and land-use change for estates' },
    { id: 'forestry-intel', label: 'Forestry intelligence', desc: 'Forest cover, condition and disturbance' },
    { id: 'carbon-estimator', label: 'Carbon estimator', desc: 'Estimates and scenarios before a project' },
    { id: 'land-restoration', label: 'Land restoration', desc: 'Restoration zones and recovery' },
    { id: 'eudr-check', label: 'EUDR check', desc: 'Deforestation evidence for EU buyers' },
  ] },
  { id: 'field-advisory', label: 'Field advisory', services: [
    { id: 'advisor', label: 'Farm AI advisor', desc: 'Weather and advice per field' },
  ] },
  { id: 'engine', label: 'Engine', services: [
    { id: 'rs-drone', label: 'Drone surveys', desc: 'Drone imagery with satellite context' },
  ] },
  { id: 'smallholder', label: 'Smallholder', services: [
    { id: 'smallholder-members', label: 'Members and parcels', desc: 'Registration forms the co-op designs, the member and parcel register, parcel checks' },
    { id: 'group-monitoring', label: 'Field monitoring', desc: 'Member farms from satellite' },
    { id: 'carbon-groups', label: 'Group carbon', desc: 'Carbon estimate per group and member' },
    { id: 'smallholder-eudr', label: 'EUDR passport', desc: 'Location and deforestation check per member' },
  ] },
];

// Packages: one click grants a set of services (e.g. Sustainable Land Management).
export const SERVICE_PACKAGES = [
  { id: 'slm', label: 'SLM programme', desc: 'Sustainable Land Management: restoration and advisor', services: ['land-restoration', 'advisor'] },
  { id: 'eudr-supply', label: 'EUDR supply chain', desc: 'EUDR check and evidence pack', services: ['eudr-check'] },
  { id: 'smallholder', label: 'Smallholder co-operative', desc: 'Members and parcels, field monitoring, group carbon and EUDR passport', services: ['smallholder-members', 'group-monitoring', 'carbon-groups', 'smallholder-eudr'] },
];
