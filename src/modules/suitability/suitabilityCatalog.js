/**
 * Agronomic Catalogue for Crop Suitability Analysis (G22)
 * Defines factor thresholds, relevance, variants, and photos for all supported crops.
 * Strict No-Emoji Policy — clean professional iconography.
 */

export const SUITABILITY_CROPS = [
  {
    id: 'oil_palm',
    name: 'Oil Palm',
    scientificName: 'Elaeis guineensis',
    relevance: 'High',
    relevanceColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    photo: '/crops/oil_palm.webp',
    variants: ['Hybrid Tenera (DxP)', 'Lowland Commercial', 'Drought-Tolerant Clonal'],
    keyFactors: [
      { name: 'Annual Rainfall', unit: 'mm/yr', optimal: '1800 - 2500', suitable: '1500 - 3000', marginal: '1200 - 1500', unsuitable: '< 1200' },
      { name: 'Dry Season Duration', unit: 'months', optimal: '< 2.0', suitable: '2.0 - 3.5', marginal: '3.5 - 4.5', unsuitable: '> 4.5' },
      { name: 'Mean Temperature', unit: '°C', optimal: '25 - 28', suitable: '22 - 32', marginal: '20 - 22', unsuitable: '< 20 / > 35' },
      { name: 'Slope', unit: 'degrees', optimal: '< 8°', suitable: '8 - 16°', marginal: '16 - 25°', unsuitable: '> 25°' },
      { name: 'Soil pH', unit: 'pH', optimal: '5.0 - 6.0', suitable: '4.2 - 6.5', marginal: '3.8 - 4.2', unsuitable: '< 3.8 / > 7.5' },
      { name: 'Soil Depth', unit: 'cm', optimal: '> 100', suitable: '75 - 100', marginal: '50 - 75', unsuitable: '< 50' },
    ],
    exclusions: ['Primary Forest (EUDR 2020)', 'Protected Reserves (WDPA)', 'Permanent Water Bodies']
  },
  {
    id: 'cocoa',
    name: 'Cocoa',
    scientificName: 'Theobroma cacao',
    relevance: 'High',
    relevanceColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    photo: '/crops/cocoa.webp',
    variants: ['Full Sun Hybrid', 'Shade-Grown Amazonia', 'Criollo Premium'],
    keyFactors: [
      { name: 'Annual Rainfall', unit: 'mm/yr', optimal: '1500 - 2000', suitable: '1200 - 2500', marginal: '1000 - 1200', unsuitable: '< 1000' },
      { name: 'Dry Season Duration', unit: 'months', optimal: '< 2.5', suitable: '2.5 - 3.5', marginal: '3.5 - 4.5', unsuitable: '> 4.5' },
      { name: 'Mean Temperature', unit: '°C', optimal: '24 - 28', suitable: '20 - 30', marginal: '18 - 20', unsuitable: '< 18 / > 33' },
      { name: 'Slope', unit: 'degrees', optimal: '< 12°', suitable: '12 - 20°', marginal: '20 - 30°', unsuitable: '> 30°' },
      { name: 'Soil pH', unit: 'pH', optimal: '6.0 - 7.0', suitable: '5.0 - 7.5', marginal: '4.5 - 5.0', unsuitable: '< 4.5 / > 8.0' },
    ],
    exclusions: ['Primary Forest (EUDR 2020)', 'Protected Reserves (WDPA)']
  },
  {
    id: 'rubber',
    name: 'Rubber',
    scientificName: 'Hevea brasiliensis',
    relevance: 'High',
    relevanceColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    photo: '/crops/rubber.webp',
    variants: ['PB 260 Commercial Clone', 'RRIM 600 High-Yield', 'GT 1 Late-Tapping'],
    keyFactors: [
      { name: 'Annual Rainfall', unit: 'mm/yr', optimal: '2000 - 3000', suitable: '1800 - 3500', marginal: '1500 - 1800', unsuitable: '< 1500' },
      { name: 'Dry Season Duration', unit: 'months', optimal: '< 3.0', suitable: '3.0 - 4.0', marginal: '4.0 - 5.0', unsuitable: '> 5.0' },
      { name: 'Mean Temperature', unit: '°C', optimal: '25 - 30', suitable: '22 - 32', marginal: '20 - 22', unsuitable: '< 20 / > 35' },
      { name: 'Slope', unit: 'degrees', optimal: '< 10°', suitable: '10 - 18°', marginal: '18 - 25°', unsuitable: '> 25°' },
      { name: 'Soil pH', unit: 'pH', optimal: '4.5 - 5.5', suitable: '4.0 - 6.5', marginal: '3.8 - 4.0', unsuitable: '< 3.8 / > 7.0' },
    ],
    exclusions: ['Primary Forest (EUDR 2020)', 'Protected Reserves (WDPA)']
  },
  {
    id: 'cashew',
    name: 'Cashew',
    scientificName: 'Anacardium occidentale',
    relevance: 'High',
    relevanceColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    photo: '/crops/cashew.webp',
    variants: ['Dwarf Hybrid Brazilian', 'Standard Tall Savannah', 'Drought-Hardy Clonal'],
    keyFactors: [
      { name: 'Annual Rainfall', unit: 'mm/yr', optimal: '800 - 1500', suitable: '600 - 1800', marginal: '500 - 600', unsuitable: '< 500 / > 2200' },
      { name: 'Dry Season Duration', unit: 'months', optimal: '3.0 - 5.0', suitable: '2.5 - 6.0', marginal: '1.5 - 2.5', unsuitable: '< 1.5' },
      { name: 'Mean Temperature', unit: '°C', optimal: '24 - 32', suitable: '20 - 35', marginal: '18 - 20', unsuitable: '< 18 / > 38' },
      { name: 'Slope', unit: 'degrees', optimal: '< 10°', suitable: '10 - 15°', marginal: '15 - 20°', unsuitable: '> 20°' },
      { name: 'Soil pH', unit: 'pH', optimal: '5.5 - 6.5', suitable: '5.0 - 7.5', marginal: '4.5 - 5.0', unsuitable: '< 4.5 / > 8.0' },
    ],
    exclusions: ['Protected Reserves (WDPA)']
  },
  {
    id: 'rice',
    name: 'Rice',
    scientificName: 'Oryza sativa',
    relevance: 'Medium-High',
    relevanceColor: 'bg-blue-50 text-blue-700 border-blue-200',
    photo: '/crops/rice.webp',
    variants: ['Irri Paddy Lowland', 'NERICA Upland Rainfed', 'Flood-Tolerant Deepwater'],
    keyFactors: [
      { name: 'Growing Season Rainfall', unit: 'mm/season', optimal: '> 1200', suitable: '900 - 1200', marginal: '600 - 900', unsuitable: '< 600' },
      { name: 'Mean Temperature', unit: '°C', optimal: '25 - 32', suitable: '20 - 35', marginal: '18 - 20', unsuitable: '< 18 / > 38' },
      { name: 'Slope', unit: 'degrees', optimal: '< 3°', suitable: '3 - 6°', marginal: '6 - 12°', unsuitable: '> 12°' },
      { name: 'Soil Clay Content', unit: '% clay', optimal: '> 35%', suitable: '25 - 35%', marginal: '15 - 25%', unsuitable: '< 15%' },
      { name: 'Soil pH', unit: 'pH', optimal: '5.5 - 6.8', suitable: '5.0 - 7.5', marginal: '4.5 - 5.0', unsuitable: '< 4.5 / > 8.0' },
    ],
    exclusions: ['Protected Reserves (WDPA)']
  },
  {
    id: 'maize',
    name: 'Maize',
    scientificName: 'Zea mays',
    relevance: 'Medium',
    relevanceColor: 'bg-amber-50 text-amber-700 border-amber-200',
    photo: '/crops/maize.webp',
    variants: ['Commercial Hybrid Yellow', 'Quality Protein Maize (QPM)', 'Drought Tolerant Open Pollinated'],
    keyFactors: [
      { name: 'Growing Season Rainfall', unit: 'mm/season', optimal: '600 - 900', suitable: '500 - 1100', marginal: '400 - 500', unsuitable: '< 400' },
      { name: 'Mean Temperature', unit: '°C', optimal: '22 - 30', suitable: '18 - 33', marginal: '15 - 18', unsuitable: '< 15 / > 35' },
      { name: 'Slope', unit: 'degrees', optimal: '< 6°', suitable: '6 - 12°', marginal: '12 - 18°', unsuitable: '> 18°' },
      { name: 'Soil pH', unit: 'pH', optimal: '6.0 - 7.2', suitable: '5.5 - 7.8', marginal: '5.0 - 5.5', unsuitable: '< 5.0 / > 8.0' },
    ],
    exclusions: ['Wetlands & Peatlands', 'Protected Reserves']
  },
  {
    id: 'cassava',
    name: 'Cassava',
    scientificName: 'Manihot esculenta',
    relevance: 'Medium',
    relevanceColor: 'bg-amber-50 text-amber-700 border-amber-200',
    photo: '/crops/cassava.webp',
    variants: ['TME 419 High Starch', 'TMS 98/0505 Biofortified', 'Traditional Local Variety'],
    keyFactors: [
      { name: 'Annual Rainfall', unit: 'mm/yr', optimal: '1000 - 2000', suitable: '800 - 2500', marginal: '600 - 800', unsuitable: '< 600' },
      { name: 'Mean Temperature', unit: '°C', optimal: '25 - 29', suitable: '20 - 32', marginal: '18 - 20', unsuitable: '< 18 / > 35' },
      { name: 'Slope', unit: 'degrees', optimal: '< 8°', suitable: '8 - 18°', marginal: '18 - 25°', unsuitable: '> 25°' },
      { name: 'Soil Depth', unit: 'cm', optimal: '> 60', suitable: '40 - 60', marginal: '25 - 40', unsuitable: '< 25' },
    ],
    exclusions: ['Permanently Waterlogged Soils']
  },
  {
    id: 'sugarcane',
    name: 'Sugarcane',
    scientificName: 'Saccharum officinarum',
    relevance: 'High',
    relevanceColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    photo: '/crops/sugarcane.webp',
    variants: ['Commercial Estate Ratoon', 'Irrigated High-Sucrose', 'Rainfed Savannah'],
    keyFactors: [
      { name: 'Annual Rainfall / Water', unit: 'mm/yr', optimal: '1500 - 2500', suitable: '1200 - 3000', marginal: '1000 - 1200', unsuitable: '< 1000' },
      { name: 'Mean Temperature', unit: '°C', optimal: '26 - 33', suitable: '20 - 35', marginal: '18 - 20', unsuitable: '< 18 / > 38' },
      { name: 'Slope', unit: 'degrees', optimal: '< 5°', suitable: '5 - 10°', marginal: '10 - 15°', unsuitable: '> 15°' },
      { name: 'Soil pH', unit: 'pH', optimal: '6.0 - 7.5', suitable: '5.5 - 8.0', marginal: '5.0 - 5.5', unsuitable: '< 5.0 / > 8.5' },
    ],
    exclusions: ['Protected Reserves (WDPA)']
  }
];

export const getCropById = (cropId) => SUITABILITY_CROPS.find(c => c.id === cropId) || SUITABILITY_CROPS[0];
