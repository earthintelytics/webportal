/** Organisation settings shared by Onboarding and Organisations. */

export const CROP_LABELS = {
  ffb: 'Oil palm', sugarcane: 'Sugarcane', rice: 'Rice', cocoa: 'Cocoa',
  cassava: 'Cassava', maize: 'Maize', rubber: 'Rubber', cashew: 'Cashew',
};

// Index names stay in the admin (technical setting); clients never see them.
export const ALL_RS_INDICES = [
  { id: 'ndvi', label: 'NDVI · vegetation' },
  { id: 'evi', label: 'EVI · vegetation (dense canopy)' },
  { id: 'reci', label: 'RECI · leaf colour / nitrogen' },
  { id: 'ndmi', label: 'NDMI · canopy water' },
  { id: 'lswi', label: 'LSWI · surface water' },
  { id: 'ndwi', label: 'NDWI · open water / flooding' },
  { id: 'wdi', label: 'WDI · water deficit' },
  { id: 'ndre', label: 'NDRE · red-edge nitrogen' },
  { id: 'cvi', label: 'CVI · chlorophyll' },
  { id: 'savi', label: 'SAVI · soil-adjusted vegetation' },
  { id: 'rvi', label: 'RVI · radar biomass' },
  { id: 'dprvi', label: 'DpRVI · radar structure' },
  { id: 'smi', label: 'SMI · radar soil moisture' },
  { id: 'lai', label: 'LAI · leaf area (derived)' },
  { id: 'gndvi', label: 'GNDVI · green vegetation (derived)' },
  { id: 'msi', label: 'MSI · moisture stress (derived)' },
  { id: 'msavi2', label: 'MSAVI2 · early growth (derived)' },
  { id: 'vci', label: 'VCI · compared with normal (derived)' },
];

export const slugify = (text) => (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

// Organisation view = one dashboard for the company; crop view = a portal per licensed crop.
export const modulesForAccessModel = (model, crops, slug) => {
  const orgModules = slug ? [`custom-agromonitor-${slug}`] : [];
  const cropModules = (crops || []).map((c) => `rs-${c}`);
  if (model === 'organization') return orgModules;
  if (model === 'crop') return cropModules;
  return [...orgModules, ...cropModules];
};

export const ACCESS_MODELS = [
  { id: 'organization', label: 'Organisation dashboard', desc: 'One dashboard for the whole company, across its estates' },
  { id: 'crop', label: 'Crop portals', desc: 'A monitoring portal for each licensed crop' },
];
