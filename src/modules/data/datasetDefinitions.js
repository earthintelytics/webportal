/**
 * Dataset definitions — interim copy.
 *
 * The source of truth is the backend catalogue (`GET /datasets`, contract in
 * docs/WORK_SPLIT.md). This file mirrors the seed in
 * docs/services/00-shared-principles.md section 3 and each crop/service
 * document's "Data to upload", in the same shape, so the page works before
 * the endpoint exists. Once `GET /datasets` answers, this file is not used.
 *
 * applies_to: 'crop:<key>' (oil_palm, cocoa, rubber, cashew, maize, rice,
 * cassava, sugarcane) or 'service:<module id>'.
 */
const FIELD_ID = {
  name: 'field_id', definition: 'Block or field ID exactly as registered with your boundary at onboarding',
  type: 'field_id', required: true, aliases: ['plot', 'plot id', 'plot_id', 'block', 'block id', 'block_id', 'field', 'field id', 'id', 'plot #', 'block no'], example: 'B12',
};
const ESTATE = {
  name: 'estate', definition: 'Estate the block belongs to (needed when block IDs repeat across your estates)',
  type: 'estate', required: false, aliases: ['estate', 'farm', 'site', 'location', 'estate name'], example: 'Main estate',
};
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const thisYear = new Date().getFullYear();

export const DATASET_DEFINITIONS = [
  {
    id: 'oil-palm-planting-year', name: 'Block planting year', applies_to: ['crop:oil_palm', 'service:carbon-ffb'],
    why: 'Separates young from mature palms, so maps, alerts and wording fit the age of each block.',
    unlocks: ['Young vs mature palms on the map', 'Age-aware alerts', 'Estate carbon by age'], due: 'once', grain: 'per field',
    columns: [FIELD_ID, ESTATE,
      { name: 'planting_year', definition: 'Year the palms in this block were planted', type: 'year', required: true, range: [1950, thisYear], aliases: ['year planted', 'planting year', 'yop', 'year of planting', 'planted'], example: '2012' },
      { name: 'palms_per_ha', definition: 'Stand density', type: 'number', unit: 'palms/ha', required: false, range: [50, 250], aliases: ['density', 'palms/ha', 'stand per ha'], example: '136' },
      { name: 'variety', definition: 'Planting material or variety', type: 'text', required: false, aliases: ['variety', 'material', 'progeny'], example: 'Tenera' },
    ],
  },
  {
    id: 'oil-palm-monthly-ffb', name: 'Monthly FFB per block', applies_to: ['crop:oil_palm'],
    why: 'Real harvest figures calibrate the yield trend, so production pages show your numbers, not a model guess.',
    unlocks: ['Calibrated yield trend', 'Production page', 'Monthly report'], due: 'monthly', grain: 'per field and month',
    columns: [FIELD_ID, ESTATE,
      { name: 'month', definition: 'Harvest month', type: 'month', required: true, aliases: ['month', 'period', 'harvest month', 'date'], example: '2026-08' },
      { name: 'ffb_tonnes', definition: 'Fresh fruit bunches harvested in the month', type: 'number', unit: 't', required: true, range: [0, 5000], aliases: ['ffb', 'tonnes', 'ffb (t)', 'yield', 'harvest t', 'weight'], example: '42.5' },
      { name: 'area_harvested_ha', definition: 'Area harvested in the month', type: 'number', unit: 'ha', required: false, range: [0, 10000], aliases: ['area', 'ha harvested', 'area (ha)'], example: '30' },
    ],
  },
  {
    id: 'cashew-flowering-months', name: 'Flowering months', applies_to: ['crop:cashew'],
    why: 'Flowering differs by zone; your months make the flowering-weather page and alerts follow your season.',
    unlocks: ['Flowering weather page', 'Flowering alerts'], due: 'season', grain: 'per estate or zone',
    columns: [
      { name: 'zone', definition: 'Estate or zone these months apply to (leave empty for all)', type: 'text', required: false, aliases: ['zone', 'estate', 'area'], example: 'North' },
      { name: 'flowering_start', definition: 'Month flowering usually starts', type: 'choice', choices: MONTHS, required: true, aliases: ['start', 'from', 'flowering start'], example: 'November' },
      { name: 'flowering_end', definition: 'Month flowering usually ends', type: 'choice', choices: MONTHS, required: true, aliases: ['end', 'to', 'flowering end'], example: 'February' },
    ],
  },
  {
    id: 'planting-dates', name: 'Planting dates and irrigation', applies_to: ['crop:maize', 'crop:rice', 'crop:cassava'],
    why: 'Planting dates tell each field’s stage, so alerts fire at the right time (top-dressing, tasselling, early flooding).',
    unlocks: ['Stage tracker', 'Stage-aware alerts', 'Irrigation page for irrigated fields'], due: 'season', grain: 'per field and season',
    columns: [FIELD_ID, ESTATE,
      { name: 'season', definition: 'Season name or year', type: 'text', required: true, aliases: ['season', 'campaign', 'year'], example: '2026 main' },
      { name: 'planting_date', definition: 'Date planted (or transplanted for rice)', type: 'date', required: true, aliases: ['planting date', 'sowing date', 'date planted', 'transplanting date'], example: '2026-04-15' },
      { name: 'irrigated', definition: 'Is the field irrigated?', type: 'yesno', required: false, aliases: ['irrigated', 'irrigation'], example: 'yes' },
    ],
  },
  {
    id: 'sugarcane-crop-cycle', name: 'Crop cycle per field', applies_to: ['crop:sugarcane'],
    why: 'Plant crop or ratoon and the cut date set the stage, so drying-off before harvest is read as planned, not stress.',
    unlocks: ['Stage-aware water wording', 'Drying-off tracking', 'Harvest planning'], due: 'season', grain: 'per field and cycle',
    columns: [FIELD_ID, ESTATE,
      { name: 'cycle', definition: 'Plant crop or ratoon number', type: 'choice', choices: ['Plant', 'Ratoon 1', 'Ratoon 2', 'Ratoon 3', 'Ratoon 4+'], required: true, aliases: ['cycle', 'ratoon', 'crop class'], example: 'Ratoon 1' },
      { name: 'planting_or_cut_date', definition: 'Planting date, or last cut date for ratoons', type: 'date', required: true, aliases: ['planting date', 'cut date', 'start date'], example: '2025-11-02' },
      { name: 'planned_harvest_month', definition: 'Month harvest is planned', type: 'month', required: false, aliases: ['harvest month', 'planned harvest'], example: '2026-10' },
      { name: 'irrigation_method', definition: 'How the field is irrigated', type: 'choice', choices: ['None', 'Furrow', 'Sprinkler', 'Drip', 'Centre pivot'], required: false, aliases: ['irrigation', 'irrigation method'], example: 'Furrow' },
    ],
  },
  {
    id: 'cocoa-farm-type', name: 'Farm type and group', applies_to: ['crop:cocoa', 'service:carbon-groups'],
    why: 'Estates and smallholder groups are reported differently; this groups your farms correctly.',
    unlocks: ['Report grouping', 'Group pages'], due: 'once', grain: 'per field',
    columns: [FIELD_ID, ESTATE,
      { name: 'farm_type', definition: 'Estate or smallholder', type: 'choice', choices: ['Estate', 'Smallholder'], required: true, aliases: ['type', 'farm type'], example: 'Smallholder' },
      { name: 'group', definition: 'Cooperative, community or group name', type: 'text', required: false, aliases: ['group', 'cooperative', 'community', 'society'], example: 'Ahafo Coop 3' },
    ],
  },
  {
    id: 'rubber-refoliation', name: 'Wintering and refoliation dates', applies_to: ['crop:rubber'],
    why: 'Leaf fall is normal in wintering; your dates stop false alarms and help plan the tapping restart.',
    unlocks: ['Wintering timeline', 'Tapping restart planning'], due: 'season', grain: 'per field',
    columns: [FIELD_ID, ESTATE,
      { name: 'wintering_start', definition: 'Date leaf fall started', type: 'date', required: true, aliases: ['wintering', 'leaf fall'], example: '2026-01-10' },
      { name: 'refoliation_date', definition: 'Date new leaves were back', type: 'date', required: false, aliases: ['refoliation', 'new leaves'], example: '2026-03-01' },
    ],
  },
  {
    id: 'soil-samples', name: 'Soil samples', applies_to: ['crop:oil_palm', 'crop:cocoa', 'crop:rubber', 'crop:cashew', 'crop:maize', 'crop:rice', 'crop:cassava', 'crop:sugarcane', 'service:advisor'],
    why: 'Your lab results replace coarse global soil maps near each sample in suitability and soil advice.',
    unlocks: ['Suitability engine', 'Soil advice'], due: 'once', grain: 'per sample',
    columns: [
      { name: 'sample_id', definition: 'Your sample code', type: 'text', required: true, aliases: ['sample', 'sample id', 'code'], example: 'S-014' },
      { name: 'lat', definition: 'Latitude of the sample (decimal degrees)', type: 'number', required: true, range: [-90, 90], aliases: ['lat', 'latitude', 'y'], example: '6.4321' },
      { name: 'lon', definition: 'Longitude of the sample (decimal degrees)', type: 'number', required: true, range: [-180, 180], aliases: ['lon', 'lng', 'longitude', 'x'], example: '5.2711' },
      { name: 'date', definition: 'Sampling date', type: 'date', required: true, aliases: ['date', 'sampling date'], example: '2026-02-20' },
      { name: 'ph', definition: 'Soil pH (water)', type: 'number', required: true, range: [2, 11], aliases: ['ph', 'ph (h2o)', 'ph water'], example: '5.4' },
      { name: 'organic_carbon_pct', definition: 'Organic carbon', type: 'number', unit: '%', required: false, range: [0, 60], aliases: ['oc', 'organic carbon', 'soc', 'oc %'], example: '1.8' },
      { name: 'sand_pct', definition: 'Sand content', type: 'number', unit: '%', required: false, range: [0, 100], aliases: ['sand', 'sand %'], example: '55' },
      { name: 'clay_pct', definition: 'Clay content', type: 'number', unit: '%', required: false, range: [0, 100], aliases: ['clay', 'clay %'], example: '25' },
      { name: 'depth_cm', definition: 'Sampling depth', type: 'number', unit: 'cm', required: false, range: [0, 300], aliases: ['depth', 'depth (cm)'], example: '30' },
    ],
  },
  {
    id: 'eudr-plot-register', name: 'EUDR plot register', applies_to: ['service:eudr-check', 'crop:oil_palm', 'crop:cocoa', 'crop:rubber'],
    why: 'Tells us which plots supply which commodity and producer, so the deforestation check and export cover the right plots.',
    unlocks: ['EUDR check scope', 'Due-diligence export'], due: 'once', grain: 'per field',
    columns: [FIELD_ID, ESTATE,
      { name: 'commodity', definition: 'EUDR commodity from this plot', type: 'choice', choices: ['Oil palm', 'Cocoa', 'Rubber'], required: true, aliases: ['commodity', 'crop', 'product'], example: 'Cocoa' },
      { name: 'producer_name', definition: 'Producer or farmer name', type: 'text', required: true, aliases: ['producer', 'farmer', 'owner', 'name'], example: 'Kwame Mensah' },
      { name: 'country_iso', definition: 'Country of production (2-letter ISO code)', type: 'text', required: true, aliases: ['country', 'iso', 'country code'], example: 'GH' },
      { name: 'production_start_date', definition: 'Date production on this plot started', type: 'date', required: false, aliases: ['start date', 'production start'], example: '2015-01-01' },
    ],
  },
  {
    id: 'restoration-planting', name: 'Planting records', applies_to: ['service:land-restoration', 'service:carbon-groups'],
    why: 'What was planted where and when is the starting point for measuring recovery.',
    unlocks: ['Recovery since planting', 'Restoration report'], due: 'season', grain: 'per zone and date',
    columns: [
      { ...FIELD_ID, name: 'zone_id', definition: 'Restoration zone or plot ID as registered', aliases: ['zone', 'zone id', 'site', 'plot'] },
      { name: 'date', definition: 'Planting date', type: 'date', required: true, aliases: ['date', 'planting date'], example: '2026-06-01' },
      { name: 'species', definition: 'Species planted', type: 'text', required: true, aliases: ['species', 'tree', 'seedling'], example: 'Terminalia superba' },
      { name: 'seedlings_planted', definition: 'Number of seedlings planted', type: 'number', required: true, range: [0, 10000000], aliases: ['seedlings', 'number planted', 'count'], example: '1200' },
    ],
  },
  {
    id: 'restoration-survival', name: 'Survival surveys', applies_to: ['service:land-restoration', 'service:carbon-groups'],
    why: 'Counts from the field are the only real measure of survival; satellites cannot count seedlings.',
    unlocks: ['Survival rate per zone'], due: 'season', grain: 'per zone and survey',
    columns: [
      { ...FIELD_ID, name: 'zone_id', definition: 'Restoration zone or plot ID as registered', aliases: ['zone', 'zone id', 'site', 'plot'] },
      { name: 'survey_date', definition: 'Survey date', type: 'date', required: true, aliases: ['date', 'survey date'], example: '2026-09-10' },
      { name: 'sample_count', definition: 'Seedlings checked', type: 'number', required: true, range: [1, 1000000], aliases: ['checked', 'sampled', 'sample'], example: '200' },
      { name: 'alive_count', definition: 'Seedlings alive', type: 'number', required: true, range: [0, 1000000], aliases: ['alive', 'surviving'], example: '164' },
    ],
  },
  {
    id: 'field-operations', name: 'Field operations', applies_to: ['service:advisor'],
    why: 'What was done in each block, so it can be checked against what the satellite shows.',
    unlocks: ['Operations log', 'Blocks not visited', 'Spraying-before-rain check'], due: 'monthly', grain: 'per field and date',
    columns: [FIELD_ID, ESTATE,
      { name: 'date', definition: 'Date of the operation', type: 'date', required: true, aliases: ['date', 'day'], example: '2026-09-21' },
      { name: 'operation', definition: 'What was done', type: 'choice', choices: ['Harvest', 'Spray', 'Prune', 'Fertilise', 'Weed', 'Scout'], required: true, aliases: ['operation', 'activity', 'task', 'job'], example: 'Fertilise' },
      { name: 'done_by', definition: 'Team or person', type: 'text', required: false, aliases: ['team', 'by', 'worker', 'gang'], example: 'Gang 4' },
      { name: 'notes', definition: 'Notes', type: 'text', required: false, aliases: ['notes', 'remarks', 'comment'], example: 'NPK 15-15-15, 2 kg/palm' },
    ],
  },
  {
    id: 'carbon-plot-inventory', name: 'Carbon plot inventory', applies_to: ['service:carbon-ffb', 'service:carbon-groups', 'service:carbon-estimator', 'service:forestry-intel'],
    why: 'Tree measurements from sample plots calibrate the satellite carbon estimate.',
    unlocks: ['Calibrated carbon estimate'], due: 'once', grain: 'per sample plot and date',
    columns: [FIELD_ID, ESTATE,
      { name: 'date', definition: 'Measurement date', type: 'date', required: true, aliases: ['date'], example: '2026-05-12' },
      { name: 'plot_size_m2', definition: 'Size of the sample plot', type: 'number', unit: 'm²', required: true, range: [1, 100000], aliases: ['plot size', 'area m2'], example: '400' },
      { name: 'trees_measured', definition: 'Trees measured in the sample plot', type: 'number', required: true, range: [0, 100000], aliases: ['trees', 'count'], example: '18' },
      { name: 'mean_dbh_cm', definition: 'Mean trunk diameter at breast height', type: 'number', unit: 'cm', required: true, range: [1, 500], aliases: ['dbh', 'diameter'], example: '38' },
      { name: 'mean_height_m', definition: 'Mean tree height', type: 'number', unit: 'm', required: false, range: [0.5, 90], aliases: ['height'], example: '11' },
    ],
  },
];

const CROP_KEY = { ffb: 'oil_palm', oil_palm: 'oil_palm', 'oil palm': 'oil_palm' };

/** Scope keys for a portal: its crop, its service, or (organisation view) the organisation's crops. */
export function scopeKeys({ cropType, serviceId }) {
  if (serviceId) return [`service:${serviceId}`];
  if (cropType) return [`crop:${CROP_KEY[cropType] || cropType}`];
  let crops;
  try { crops = JSON.parse(localStorage.getItem('fi_allowed_crops') || '[]'); } catch { crops = []; }
  return (Array.isArray(crops) ? crops : []).map(c => `crop:${CROP_KEY[c] || c}`);
}

export const datasetsForScope = (all, keys) => all.filter(d => (d.applies_to || []).some(k => keys.includes(k)));
