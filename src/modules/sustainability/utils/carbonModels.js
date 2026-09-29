// UNUSED (2026-09-29): replaced by modules/services/ServicePortal.jsx (same layout as organisation monitoring). Kept on purpose, not deleted — see docs/UNUSED_CODE.md in the root repo before reusing or removing.
/**
 * Carbon Logic Engine
 * Implements IPCC Tier 1 defaults and Remote Sensing proxies for carbon estimation.
 */

// IPCC Tier 1 Default Biomass Factors (tonnes dry matter per hectare)
// Source: IPCC 2006 Guidelines for National Greenhouse Gas Inventories
export const IPCC_DEFAULTS = {
  FOREST: {
    TROPICAL_RAINFOREST: 310,
    TROPICAL_MOIST: 260,
    TROPICAL_DRY: 160,
    SUBTROPICAL: 130,
    TEMPERATE: 120,
    BOREAL: 80
  },
  CROPLAND: {
    ANNUAL: 5,
    PERENNIAL: 63, // e.g., Oil Palm, Rubber (weighted average over cycle)
    AGROFORESTRY: 45
  },
  GRASSLAND: {
    TROPICAL: 8,
    TEMPERATE: 3
  }
};

// Carbon Fraction of Dry Matter (IPCC default: 0.47)
export const CARBON_FRACTION = 0.47;

// CO2 to Carbon molecular weight ratio (44/12)
export const CO2_RATIO = 3.67;

/**
 * Calculates Carbon Stock (tCO2e) based on area and land type
 * @param {number} areaInHa 
 * @param {string} category (e.g., 'FOREST', 'CROPLAND')
 * @param {string} subCategory (e.g., 'TROPICAL_RAINFOREST')
 * @returns {number} tCO2e
 */
export const calculateStockIPCC = (areaInHa, category, subCategory) => {
  const biomassFactor = IPCC_DEFAULTS[category]?.[subCategory] || 0;
  const carbon = areaInHa * biomassFactor * CARBON_FRACTION;
  return carbon * CO2_RATIO;
};

/**
 * Estimates AGB (Above Ground Biomass) from NDVI
 * Formula: AGB = a * (NDVI / (1 - NDVI))^b [Empirical proxy]
 * Note: This is a placeholder for a calibrated local model.
 */
export const estimateAGBfromNDVI = (ndvi, landType = 'FOREST') => {
  if (ndvi < 0.1) return 0;
  
  // Coefficients vary by vegetation type
  const coefs = {
    FOREST: { a: 150, b: 1.2 },
    CROPLAND: { a: 40, b: 1.1 },
    GRASSLAND: { a: 10, b: 1.0 }
  };
  
  const { a, b } = coefs[landType] || coefs.FOREST;
  return a * Math.pow(ndvi / (1.0001 - ndvi), b);
};

/**
 * Estimates Annual Sequestration Rate (tCO2e/ha/yr)
 * Based on growth phase and management practices
 */
export const estimateSequestrationRate = (landType, age = 5, practice = 'STANDARD') => {
  let rate = 0;
  
  if (landType === 'FOREST') {
    // Sigmoid growth curve proxy
    rate = 15 * (1 - Math.exp(-0.1 * age)); 
  } else if (landType === 'CROPLAND') {
    rate = 6; 
  }
  
  if (practice === 'REGENERATIVE') rate *= 1.25;
  if (practice === 'LOW_INPUT') rate *= 0.9;
  
  return rate;
};
