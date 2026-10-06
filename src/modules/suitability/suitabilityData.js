/**
 * The client's own data that makes a suitability analysis better, per crop
 * (docs/services/suitability.md §3 and §2b). Each entry points at a Farm data
 * dataset (modules/data/datasetDefinitions.js), so the client uploads it once
 * in Farm data and every analysis for their organisation uses it.
 *
 * level: 'most' = changes the answer most for this crop; 'helps' = improves it.
 */
const SOIL = { dataset: 'soil-samples', level: 'most', why: 'Replaces the global soil map near each sample: pH, texture and depth decide most classes.' };
const WEATHER = { dataset: 'weather-station', level: 'helps', why: 'Measured rain and temperature replace regional estimates near each station.' };
const HARVEST = { dataset: 'harvest-history', level: 'helps', why: 'Past yields check the result: well-rated land with poor harvests is flagged for review.' };

export const SUITABILITY_DATA = {
  oil_palm: [SOIL, { ...WEATHER, level: 'most', why: 'The length of the dry season decides oil palm; your own rain records make it exact.' },
    { dataset: 'oil-palm-monthly-ffb', level: 'helps', why: 'Bunch yields per block show which land has really performed.' }],
  cocoa: [SOIL, { ...WEATHER, level: 'most', why: 'Cocoa is sensitive to dry months and heat; station records sharpen both.' }, HARVEST],
  rubber: [SOIL, WEATHER, HARVEST],
  cashew: [SOIL, { ...WEATHER, level: 'most', why: 'Cashew needs a clear dry season for flowering; station records show it exactly.' }, HARVEST],
  maize: [SOIL, { dataset: 'planting-dates', level: 'most', why: 'Planting dates and irrigation tell rain-fed from irrigated potential.' }, WEATHER, HARVEST],
  rice: [SOIL, { dataset: 'planting-dates', level: 'most', why: 'Irrigation and planting dates decide whether lowland fields can hold water.' }, WEATHER, HARVEST],
  cassava: [SOIL, HARVEST, WEATHER],
  sugarcane: [SOIL, { dataset: 'sugarcane-crop-cycle', level: 'most', why: 'Irrigation method per field changes how much rain the cane needs.' }, WEATHER, HARVEST],
};

export const dataForCrop = (cropId) => SUITABILITY_DATA[cropId] || [SOIL, WEATHER, HARVEST];
