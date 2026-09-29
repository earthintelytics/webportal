/**
 * Assistant scenarios — interim copy until the catalogue serves them
 * (docs/WORK_SPLIT.md, "Assistant scenarios"). The Assistant is an advisor,
 * not only a question box: each template is a what-if case with parameters
 * the user fills in. Scenarios come from the crop and service documents
 * (docs/crops, docs/services); none promises a certified or measured result.
 *
 * Param types: month, percent, number, weeks, estate, choice, text.
 * {name} in `question` is replaced by the filled value.
 */
const MONTH = { name: 'month', label: 'Month', type: 'month' };
const ESTATE = { name: 'estate', label: 'Estate', type: 'estate' };

export const SCENARIOS = {
  'crop:oil_palm': [
    { id: 'op-dry-spell', title: 'Dry spell', desc: 'Effect of a rainfall shortfall on palms and bunch production.', question: 'What if rainfall in {month} is {pct}% below normal on {estate}? What happens to the palms over the next months, which blocks are most exposed, and what should we do?', params: [MONTH, { name: 'pct', label: 'Below normal (%)', type: 'percent', default: 30 }, ESTATE] },
    { id: 'op-fertiliser-delay', title: 'Delay fertiliser', desc: 'What a later fertiliser round means for canopy and yield trend.', question: 'What if we delay the fertiliser round on {estate} by {weeks} weeks? What is the likely effect on leaf colour and the yield trend, and what are the risks?', params: [ESTATE, { name: 'weeks', label: 'Delay (weeks)', type: 'weeks', default: 4 }] },
    { id: 'op-replant', title: 'Replant old blocks', desc: 'Impact of replanting the oldest blocks on production and carbon.', question: 'What if we replant {area} ha of the oldest blocks on {estate} this year? What happens to production over the next 5 years and to the estate carbon estimate?', params: [{ name: 'area', label: 'Area (ha)', type: 'number', default: 200 }, ESTATE] },
  ],
  'crop:cocoa': [
    { id: 'cc-long-dry', title: 'Longer dry season', desc: 'A dry season one month longer than usual.', question: 'What if the dry season on {estate} lasts {weeks} weeks longer than usual? Which farms are most at risk, and what should farmers do before and during it?', params: [ESTATE, { name: 'weeks', label: 'Extra dry weeks', type: 'weeks', default: 4 }] },
    { id: 'cc-shade', title: 'Add shade trees', desc: 'Planting shade trees on exposed farms.', question: 'What if we plant shade trees on the most exposed cocoa farms on {estate} ({trees} trees per ha)? What changes for drought exposure, canopy and carbon over 5 years?', params: [ESTATE, { name: 'trees', label: 'Trees per ha', type: 'number', default: 20 }] },
  ],
  'crop:rubber': [
    { id: 'rb-long-wintering', title: 'Late refoliation', desc: 'Leaves come back later than usual after wintering.', question: 'What if refoliation on {estate} is {weeks} weeks later than usual? What does it mean for the tapping restart and for which blocks?', params: [ESTATE, { name: 'weeks', label: 'Later by (weeks)', type: 'weeks', default: 3 }] },
  ],
  'crop:cashew': [
    { id: 'cw-rain-flowering', title: 'Rain during flowering', desc: 'Rain and humidity in the flowering months.', question: 'What if there is {mm} mm of rain in {month}, during flowering, on {estate}? What is the risk to flowers and nut set, and what should be done?', params: [{ name: 'mm', label: 'Rain (mm)', type: 'number', default: 80 }, MONTH, ESTATE] },
  ],
  'crop:maize': [
    { id: 'mz-drought-tassel', title: 'Drought at tasselling', desc: 'Dry spell during the most sensitive stage.', question: 'What if there is no rain for {weeks} weeks around tasselling on {estate}? Which fields are exposed, how large could the yield loss be, and is irrigation worth it?', params: [{ name: 'weeks', label: 'Dry weeks', type: 'weeks', default: 2 }, ESTATE] },
    { id: 'mz-late-planting', title: 'Late planting', desc: 'Planting later than planned.', question: 'What if planting on {estate} is {weeks} weeks later than planned? How does it shift the stages, the top-dressing window and the drought risk?', params: [ESTATE, { name: 'weeks', label: 'Later by (weeks)', type: 'weeks', default: 3 }] },
  ],
  'crop:rice': [
    { id: 'rc-late-flood', title: 'Late flooding', desc: 'Fields flooded late after transplanting.', question: 'What if fields on {estate} are flooded {weeks} weeks late after transplanting? What is the effect on establishment and weeds, and which fields to prioritise?', params: [ESTATE, { name: 'weeks', label: 'Late by (weeks)', type: 'weeks', default: 2 }] },
  ],
  'crop:cassava': [
    { id: 'cv-drought', title: 'Long drought', desc: 'A drought of several weeks during root bulking.', question: 'What if there is a {weeks}-week drought during root bulking on {estate}? When does it start to cost yield, and what should we watch?', params: [{ name: 'weeks', label: 'Drought (weeks)', type: 'weeks', default: 4 }, ESTATE] },
  ],
  'crop:sugarcane': [
    { id: 'sc-cut-irrigation', title: 'Cut irrigation', desc: 'Less irrigation water during grand growth.', question: 'What if irrigation water on {estate} is cut by {pct}% during grand growth? Which fields suffer first, and how should the water be shared?', params: [ESTATE, { name: 'pct', label: 'Cut (%)', type: 'percent', default: 25 }] },
  ],
  'service:carbon-ffb': [
    { id: 'ec-replant', title: 'Replanting and carbon', desc: 'How replanting changes the estate carbon estimate.', question: 'What if we replant {area} ha on {estate} this year? How does the estate carbon estimate change now and over 10 years (as a range, with the method)?', params: [{ name: 'area', label: 'Area (ha)', type: 'number', default: 200 }, ESTATE] },
    { id: 'ec-conservation', title: 'Set aside conservation land', desc: 'Protecting an area and letting it regrow.', question: 'What if we set aside {area} ha on {estate} for natural regrowth? What could it add to the carbon estimate over 10 and 20 years, and what evidence would an auditor need?', params: [{ name: 'area', label: 'Area (ha)', type: 'number', default: 50 }, ESTATE] },
  ],
  'service:carbon-groups': [
    { id: 'gc-trees', title: 'Plant trees with members', desc: 'A tree-planting drive across member farms.', question: 'What if members of {estate} plant {trees} trees in total this season? What carbon gain range is realistic over 10 years, and what survival data do we need to collect?', params: [ESTATE, { name: 'trees', label: 'Trees planted', type: 'number', default: 5000 }] },
  ],
  'service:forestry-intel': [
    { id: 'fo-fire', title: 'Longer dry season and fire', desc: 'Fire risk when the dry season runs long.', question: 'What if the dry season on {estate} runs {weeks} weeks longer than usual? Which compartments face the highest fire risk, and where should patrols focus?', params: [ESTATE, { name: 'weeks', label: 'Extra dry weeks', type: 'weeks', default: 3 }] },
  ],
  'service:carbon-estimator': [
    { id: 'ce-compare', title: 'Compare land-use options', desc: 'Agroforestry vs regeneration vs business as usual.', question: 'For {area} ha on {estate}, compare business as usual, agroforestry and assisted natural regeneration over {years} years. Give carbon ranges, assumptions and main risks for each.', params: [{ name: 'area', label: 'Area (ha)', type: 'number', default: 100 }, ESTATE, { name: 'years', label: 'Years', type: 'number', default: 20 }] },
  ],
  'service:land-restoration': [
    { id: 'lr-dry-year', title: 'A dry year', desc: 'How a dry year affects recovering zones.', question: 'What if next year’s rainfall on {estate} is {pct}% below normal? Which restoration zones are at risk of setback, and what can be done now?', params: [ESTATE, { name: 'pct', label: 'Below normal (%)', type: 'percent', default: 25 }] },
  ],
  'service:eudr-check': [
    { id: 'eu-new-plots', title: 'New supplier plots', desc: 'What to check before buying from new plots.', question: 'We plan to source from new plots near {estate}. What must we check before the first shipment, which data do we need from the supplier, and what could make a plot fail?', params: [ESTATE] },
  ],
  'service:activity-ffb': [
    { id: 'fl-spray-rain', title: 'Spraying before rain', desc: 'Whether to spray when rain is forecast.', question: 'We plan to spray on {estate} and {mm} mm of rain is forecast within {hours} hours. Should we go ahead, delay or change the product, and why?', params: [ESTATE, { name: 'mm', label: 'Rain forecast (mm)', type: 'number', default: 15 }, { name: 'hours', label: 'Within (hours)', type: 'number', default: 12 }] },
  ],
  'service:advisor': [
    { id: 'ad-heavy-rain', title: 'Heavy rain next week', desc: 'What to do before a heavy-rain week.', question: 'Heavy rain ({mm} mm) is forecast next week on {estate}. What should we do in each type of field before, during and after it?', params: [{ name: 'mm', label: 'Rain (mm)', type: 'number', default: 100 }, ESTATE] },
  ],
};

/** How every scenario answer should be laid out (sent with the question). */
export const ANSWER_FORMAT =
  'Answer as an agronomy advisor. Structure: 1) Short answer. 2) Assumptions. 3) Expected effect, as ranges with how confident you are. 4) What to do, in order. 5) Data used from this organisation and its dates. 6) Limits. Use plain language. Do not claim certification, compliance or measured tonnes.';
