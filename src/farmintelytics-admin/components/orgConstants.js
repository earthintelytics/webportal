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

