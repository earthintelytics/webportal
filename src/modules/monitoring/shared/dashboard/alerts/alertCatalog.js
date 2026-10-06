/**
 * What each crop and service watches for, from the "Alerts" section of its
 * doc (docs/services/<service>.md, docs/services/<crop>-monitoring.md). The
 * pipeline writes the alerts (G29); this list explains, in the user's words,
 * what will raise one and what to do, so an empty page is never mistaken for
 * "everything is fine" before monitoring has run.
 *
 * Keyed by service id, or by crop type for crop portals.
 */
const w = (when, action) => ({ when, action });

export const ALERT_CATALOG = {
  // Crops
  oil_palm: { unit: 'block', watches: [
    w('Canopy thins by a quarter or more against its last 30 days', 'Inspect for dead palms, pests or disease'),
    w('Severe water shortage on two images in a row', 'Expect fewer bunches in the coming months; plan irrigation or mulching'),
    w('A block far below its normal condition for the season', 'Visit the block and compare with its neighbours'),
  ] },
  cocoa: { unit: 'farm', watches: [
    w('Canopy thins by a quarter or more against its last 30 days', 'Check for dieback, disease or clearing'),
    w('Severe dry-season stress (November to February)', 'Pod numbers may fall; shade and mulch where possible'),
    w('Forest cover lost inside or next to the farm', 'Review the farm for EUDR before the next delivery'),
  ] },
  rubber: { unit: 'block', watches: [
    w('Unusual leaf loss outside December to February', 'Check for leaf disease'),
    w('A block refoliates much later than the others', 'Inspect the block; delay tapping if needed'),
    w('Severe water shortage', 'Reduce tapping until the trees recover'),
  ] },
  cashew: { unit: 'orchard', watches: [
    w('Rain on 3 or more days in 14 during flowering', 'High risk of anthracnose: check orchards and consider spraying'),
    w('Weak leaf flush for the season', 'Check the orchard for pests, pruning and nutrition'),
    w('Severe water stress while nuts are filling (January to April)', 'Water young trees and mulch'),
  ] },
  maize: { unit: 'field', watches: [
    w('Poor emergence in weeks 2 to 4', 'Check the field and consider filling gaps'),
    w('Pale leaves in weeks 4 to 8, the top-dressing window', 'Consider nitrogen top-dressing'),
    w('Water shortage at tasselling (weeks 8 to 11)', 'The most sensitive stage: irrigate if you can'),
  ], note: 'These alerts need each field’s planting date (Farm data).' },
  rice: { unit: 'field', watches: [
    w('No standing water in the first 30 days after transplanting', 'Check irrigation and bunds'),
    w('Pale leaves during tillering', 'Consider nitrogen'),
    w('No clear satellite image for 3 weeks or more', 'The radar view is shown instead'),
  ] },
  cassava: { unit: 'field', watches: [
    w('Leaf cover drops by a quarter or more outside harvest', 'Check for mealybug, green mite or mosaic disease'),
    w('Severe water shortage for 3 weeks or more', 'Growth is slowing; expect a later harvest'),
  ] },
  sugarcane: { unit: 'field', watches: [
    w('Severe water stress during grand growth', 'Irrigate'),
    w('Growth behind normal at 4 to 9 months', 'Check irrigation, nutrition and pests'),
    w('High water demand for 7 days or more on an irrigated field', 'Increase irrigation for the week'),
  ] },
  // Services
  'carbon-ffb': { unit: 'block', watches: [
    w('Loss or fire in a conservation area', 'Send the estate team; record it for the carbon report'),
    w('Vegetation falls sharply outside replanting', 'Check the block for clearing or damage'),
    w('Peat or wet soil drying out for over 14 days', 'Close drainage gates and check water levels'),
  ] },
  'forestry-intel': { unit: 'compartment', watches: [
    w('Possible clearing detected', 'Send a patrol to the coordinates'),
    w('Active fire inside or within 1 km', 'Alert the fire team'),
    w('Canopy very dry in the dry season', 'High fire risk: increase patrols'),
    w('Disturbance within 500 m of the boundary', 'Check boundary markers and warn neighbours'),
  ] },
  'carbon-estimator': { unit: 'site', watches: [
    w('Expected gain below about 2 t CO₂e per hectare per year', 'Try denser or mixed native planting in the plan'),
    w('Slope above 20% without soil conservation', 'Add contour bunds or hedgerows to the plan'),
  ] },
  'land-restoration': { unit: 'zone', watches: [
    w('Fire or clearing in a zone', 'Visit the zone and record the damage'),
    w('No greening 12 months after planting while rainfall was normal', 'Check seedling survival'),
    w('No growth for 3 months in the rainy season', 'Check for grazing, compaction or unsuitable species'),
    w('Very dry soil in zones planted less than 6 months ago', 'Water or mulch the seedlings'),
  ] },
  'eudr-check': { unit: 'plot', watches: [
    w('Tree cover lost on or near a plot after 31 December 2020', 'Keep that plot’s harvest out of EU deliveries until reviewed'),
    w('A plot over 4 ha registered as a single point', 'A boundary is required: walk or upload it'),
    w('A plot overlaps a protected area', 'Review the plot before the due-diligence statement'),
    w('A plot boundary is invalid (crossing lines, missing farmer)', 'Re-survey and re-export'),
  ] },
  advisor: { unit: 'field', watches: [
    w('Water short and pale leaves at the same time', 'Irrigate first; do not apply nitrogen on dry soil'),
    w('3 or more rain days ahead with high humidity', 'Protect vulnerable fields before the rain'),
    w('The crop’s own warnings (see its monitoring alerts)', 'Follow the advice shown with each one'),
  ] },
  'group-monitoring': { unit: 'member farm', watches: [
    w('A farm much weaker than the rest of its group', 'Visit to check pests, disease or the household'),
    w('More than half of a group’s farms short of water at once', 'Check shared water points and canals'),
  ] },
  'carbon-groups': { unit: 'member farm', watches: [
    w('Tree cover dropped on a member parcel', 'Ask whether it is replanting or clearing'),
    w('Planting recorded but no recovery after 12 months', 'Check seedling survival'),
  ] },
  'smallholder-eudr': { unit: 'parcel', watches: [
    w('Forest on 31 December 2020 cleared since on a member parcel', 'Keep this member’s harvest out of EU deliveries until reviewed'),
  ] },
  'smallholder-members': { unit: 'parcel', watches: [
    w('Two members’ parcels overlap', 'Re-walk the boundary'),
  ] },
  'rs-drone': { unit: 'block', watches: [
    w('Missing stands above about 8% of target density', 'Export the gap list for the replanting team'),
    w('A ring of dead trees', 'Inspect roots and soil around the cluster'),
    w('Weed cover above about 25% in a young block', 'Schedule weeding'),
  ] },
};

ALERT_CATALOG.ffb = ALERT_CATALOG.oil_palm;

export const alertCatalogFor = (serviceId, cropType) => ALERT_CATALOG[serviceId] || ALERT_CATALOG[cropType] || { unit: 'block', watches: [] };

/** Backend severities in the words used on the map legends. */
export const SEVERITY = {
  Critical: { label: 'Act now', tone: 'critical', rank: 0 },
  Warning: { label: 'Watch', tone: 'warning', rank: 1 },
  Info: { label: 'For information', tone: 'info', rank: 2 },
};
