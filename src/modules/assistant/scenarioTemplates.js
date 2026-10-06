/**
 * Assistant scenarios — interim copy until the catalogue serves them
 * (docs/WORK_SPLIT.md, "Assistant scenarios"). The Assistant is an advisor,
 * not only a question box: each template is a what-if case with parameters
 * the user fills in. Scenarios come from the crop and service documents
 * (docs/services); none promises a certified or measured result.
 *
 * Param types: month, percent, number, weeks, estate, choice, text.
 * {name} in `question` is replaced by the filled value.
 */
const MONTH = { name: 'month', label: 'Month', type: 'month' };
const ESTATE = { name: 'estate', label: 'Estate', type: 'estate' };

export const SCENARIOS = {
  'crop:oil_palm': [
    { 
      id: 'op-dry-spell', 
      title: 'Dry spell and the harvest', 
      desc: 'What less rain does to the palms and to bunches in the months after.', 
      question: 'What if rainfall in {month} is {pct}% below normal on {estate}? What happens to the palms over the next months, which blocks are most exposed, and what should we do?', 
      params: [MONTH, { name: 'pct', label: 'Below normal (%)', type: 'percent', default: 30 }, ESTATE],
      requiredData: ['Rain in the last 14 days against normal', 'Past bunch counts', 'Water in the canopy per block']
    },
    { 
      id: 'op-fertiliser-delay', 
      title: 'Delay the fertiliser round', 
      desc: 'What putting off fertiliser does to leaf colour and the harvest.', 
      question: 'What if we delay the fertiliser round on {estate} by {weeks} weeks? What is the likely effect on leaf colour and the harvest trend, and what are the risks?', 
      params: [ESTATE, { name: 'weeks', label: 'Delay (weeks)', type: 'weeks', default: 4 }],
      requiredData: ['Soil test results', 'Recent leaf analyses', 'Crop health trend']
    },
    { 
      id: 'op-replant', 
      title: 'Replant the oldest blocks', 
      desc: "Production over the next 5 years and the estate's carbon.", 
      question: 'What if we replant {area} ha of the oldest blocks on {estate} this year? What happens to production over the next 5 years and to the estate carbon estimate?', 
      params: [{ name: 'area', label: 'Area (ha)', type: 'number', default: 200 }, ESTATE],
      requiredData: ['Planting year per block', 'Current yield per hectare', 'Biomass estimate']
    },
  ],
  'crop:cocoa': [
    { 
      id: 'cc-long-dry', 
      title: 'A longer dry season', 
      desc: 'Which farms lose young pods and soil water first, and what to do.', 
      question: 'What if the dry season on {estate} lasts {weeks} weeks longer than usual? Which farms are most at risk, and what should farmers do before and during it?', 
      params: [ESTATE, { name: 'weeks', label: 'Extra dry weeks', type: 'weeks', default: 4 }],
      requiredData: ['Shade cover', 'How well the soil holds water', 'Young pod stage']
    },
    { 
      id: 'cc-shade', 
      title: 'Plant shade trees', 
      desc: 'Shade trees on the most exposed farms: drought, canopy and carbon.', 
      question: 'What if we plant shade trees on the most exposed cocoa farms on {estate} ({trees} trees per ha)? What changes for drought exposure, canopy and carbon over 5 years?', 
      params: [ESTATE, { name: 'trees', label: 'Trees per ha', type: 'number', default: 20 }],
      requiredData: ['Parcel boundary', 'Heat on the parcel', 'Which shade trees suit']
    },
  ],
  'crop:rubber': [
    { 
      id: 'rb-long-wintering', 
      title: 'Leaves come back late', 
      desc: 'When tapping can restart, and in which blocks.', 
      question: 'What if refoliation on {estate} is {weeks} weeks later than usual? What does it mean for the tapping restart and for which blocks?', 
      params: [ESTATE, { name: 'weeks', label: 'Later by (weeks)', type: 'weeks', default: 3 }],
      requiredData: ['Clone per block', 'Leaf flush over time', 'Tapping records']
    },
  ],
  'crop:cashew': [
    { 
      id: 'cw-rain-flowering', 
      title: 'Rain during flowering', 
      desc: 'Risk of flower disease and fewer nuts.', 
      question: 'What if there is {mm} mm of rain in {month}, during flowering, on {estate}? What is the risk to flowers and nut set, and what should be done?', 
      params: [{ name: 'mm', label: 'Rain (mm)', type: 'number', default: 80 }, MONTH, ESTATE],
      requiredData: ['Flowering months', 'Daily humidity', 'Anthracnose risk']
    },
  ],
  'crop:maize': [
    { 
      id: 'mz-drought-tassel', 
      title: 'Drought at tasselling', 
      desc: 'Water shortage while the maize flowers and fills its grain.', 
      question: 'What if there is no rain for {weeks} weeks around tasselling on {estate}? Which fields are exposed, how large could the yield loss be, and is irrigation worth it?', 
      params: [{ name: 'weeks', label: 'Dry weeks', type: 'weeks', default: 2 }, ESTATE],
      requiredData: ['Planting date', 'Water stress', 'Water available for irrigation']
    },
    { 
      id: 'mz-late-planting', 
      title: 'Planting later than planned', 
      desc: 'How the growth stages, fertiliser timing and drought risk shift.', 
      question: 'What if planting on {estate} is {weeks} weeks later than planned? How does it shift the growth stages, the time to apply fertiliser, and the drought risk?', 
      params: [ESTATE, { name: 'weeks', label: 'Later by (weeks)', type: 'weeks', default: 3 }],
      requiredData: ['When the rains started', 'Variety maturity', 'Soil nitrogen release']
    },
  ],
  'crop:rice': [
    { 
      id: 'rc-late-flood', 
      title: 'Fields flooded late', 
      desc: 'Effect on young plants and weeds, and which fields come first.', 
      question: 'What if fields on {estate} are flooded {weeks} weeks late after transplanting? What is the effect on establishment and weeds, and which fields to prioritise?', 
      params: [ESTATE, { name: 'weeks', label: 'Late by (weeks)', type: 'weeks', default: 2 }],
      requiredData: ['Field levelling', 'Standing water', 'Transplanting dates']
    },
  ],
  'crop:cassava': [
    { 
      id: 'cv-drought', 
      title: 'Dry spell while roots grow', 
      desc: 'When it starts to cost yield and the best time to harvest.', 
      question: 'What if there is a {weeks}-week drought during root bulking on {estate}? When does it start to cost yield, and what should we watch?', 
      params: [{ name: 'weeks', label: 'Drought (weeks)', type: 'weeks', default: 4 }, ESTATE],
      requiredData: ['Tuber growth stage', 'Soil moisture below the surface', 'Target starch content']
    },
  ],
  'crop:sugarcane': [
    { 
      id: 'sc-cut-irrigation', 
      title: 'Less irrigation water', 
      desc: 'Which fields suffer first and how to share the water.', 
      question: 'What if irrigation water on {estate} is cut by {pct}% while the cane grows fastest? Which fields suffer first, and how should the water be shared?', 
      params: [ESTATE, { name: 'pct', label: 'Cut (%)', type: 'percent', default: 25 }],
      requiredData: ['Water the crop is using', 'How well the soil holds water', 'Cane height per field']
    },
  ],
  'service:carbon-ffb': [
    { 
      id: 'ec-replant', 
      title: 'Replanting and carbon', 
      desc: 'How the carbon estimate changes now and over 10 years.', 
      question: 'What if we replant {area} ha on {estate} this year? How does the estate carbon estimate change now and over 10 years (as a range, with the method)?', 
      params: [{ name: 'area', label: 'Area (ha)', type: 'number', default: 200 }, ESTATE],
      requiredData: ['Age of the stands', 'Carbon per hectare', 'Tree measurements']
    },
    { 
      id: 'ec-conservation', 
      title: 'Set land aside to regrow', 
      desc: 'Carbon it could add over 10 and 20 years, and the evidence needed.', 
      question: 'What if we set aside {area} ha on {estate} for natural regrowth? What could it add to the carbon estimate over 10 and 20 years, and what evidence would an auditor need?', 
      params: [{ name: 'area', label: 'Area (ha)', type: 'number', default: 50 }, ESTATE],
      requiredData: ['Forest cover today', 'Deforestation risk', 'High conservation value areas']
    },
  ],
  'service:carbon-groups': [
    { 
      id: 'gc-trees', 
      title: 'Members plant trees', 
      desc: 'Realistic carbon gain and the survival records to keep.', 
      question: 'What if members of {estate} plant {trees} trees in total this season? What carbon gain range is realistic over 10 years, and what survival data do we need to collect?', 
      params: [ESTATE, { name: 'trees', label: 'Trees planted', type: 'number', default: 5000 }],
      requiredData: ['Member farm boundaries', 'Nursery records', 'How planting will be checked']
    },
  ],
  'service:forestry-intel': [
    { 
      id: 'fo-fire', 
      title: 'Longer dry season and fire', 
      desc: 'Where fire risk is highest and where to patrol.', 
      question: 'What if the dry season on {estate} runs {weeks} weeks longer than usual? Which compartments face the highest fire risk, and where should patrols focus?', 
      params: [ESTATE, { name: 'weeks', label: 'Extra dry weeks', type: 'weeks', default: 3 }],
      requiredData: ['Dryness of fallen leaves', 'Past fires', 'Canopy dryness']
    },
  ],
  'service:carbon-estimator': [
    { 
      id: 'ce-compare', 
      title: 'Compare land-use plans', 
      desc: 'Business as usual, trees with crops, or natural regrowth.', 
      question: 'For {area} ha on {estate}, compare business as usual, agroforestry and assisted natural regeneration over {years} years. Give carbon ranges, assumptions and main risks for each.', 
      params: [{ name: 'area', label: 'Area (ha)', type: 'number', default: 100 }, ESTATE, { name: 'years', label: 'Years', type: 'number', default: 20 }],
      requiredData: ['Land cover at the start', 'Soil carbon at the start', 'Project timeline']
    },
  ],
  'service:land-restoration': [
    { 
      id: 'lr-dry-year', 
      title: 'A dry year in restoration zones', 
      desc: 'Which zones could lose ground and what to do now.', 
      question: 'What if next year’s rainfall on {estate} is {pct}% below normal? Which restoration zones are at risk of setback, and what can be done now?', 
      params: [ESTATE, { name: 'pct', label: 'Below normal (%)', type: 'percent', default: 25 }],
      requiredData: ['Zone boundaries', 'Share of ground covered by plants', 'Erosion risk']
    },
  ],
  'service:eudr-check': [
    { 
      id: 'eu-new-plots', 
      title: 'New supplier plots', 
      desc: 'What to check before the first shipment and what makes a plot fail.', 
      question: 'We plan to source from new plots near {estate}. What must we check before the first shipment, which data do we need from the supplier, and what could make a plot fail?', 
      params: [ESTATE],
      requiredData: ['Plot location or boundary', 'Tree cover on 31 December 2020', 'Land and legality documents']
    },
  ],
  'service:advisor': [
    { 
      id: 'ad-heavy-rain', 
      title: 'Heavy rain is coming', 
      desc: 'Drains to check before, and disease to prevent after.', 
      question: 'Heavy rain ({mm} mm) is forecast next week on {estate}. What should we do in each type of field before, during and after it?', 
      params: [{ name: 'mm', label: 'Rain (mm)', type: 'number', default: 100 }, ESTATE],
      requiredData: ['Low, wet ground', 'Drains on the estate', 'How wet the root zone is']
    },
    { 
      id: 'ad-dry-spell', 
      title: 'Dry, hot weeks ahead', 
      desc: 'Water, mulch and shade to protect the crop.', 
      question: 'What if {weeks} dry weeks with temperatures {deg}°C above normal hit {estate}? What should we do with water, mulch and shade to protect the crop?', 
      params: [{ name: 'deg', label: 'Hotter than normal by (°C)', type: 'number', default: 3 }, { name: 'weeks', label: 'How long (weeks)', type: 'weeks', default: 3 }, ESTATE],
      requiredData: ['Heat in the next 14 days', 'Water stress in the canopy', 'Water stored for irrigation']
    },
    { 
      id: 'ad-fert-timing', 
      title: 'Best time to apply fertiliser', 
      desc: 'When soil and weather mean less is washed away.', 
      question: 'We plan to apply fertiliser on {estate}. From the soil moisture now and the weather for the next 14 days, when is the best time so that less is washed away and more is taken up?', 
      params: [ESTATE],
      requiredData: ['Topsoil moisture', 'Rain in the next 14 days', 'Fertiliser type']
    },
    { 
      id: 'ad-disease-risk', 
      title: 'Humid weather and disease', 
      desc: 'Blocks most at risk and what to do to prevent it.', 
      question: 'It has been humid for a while on {estate}. Which blocks are most at risk of disease or pests, and what can we do to prevent it without chemicals first?', 
      params: [ESTATE],
      requiredData: ['Humidity', 'Hours the leaves stay wet', 'Past disease per block']
    },
    { 
      id: 'ad-yield-optimization', 
      title: 'Low-yield blocks', 
      desc: 'What holds them back and which fixes pay most.', 
      question: 'For the blocks on {estate} that yield least, what holds them back most (nutrients, water, compacted soil), and which fixes give the most return for the cost?', 
      params: [ESTATE],
      requiredData: ['Yield per block', 'Crop health over past years', 'Soil survey']
    },
  ],
};

/** How every scenario answer should be laid out (sent with the question). */
export const ANSWER_FORMAT =
  'Answer as an agronomy advisor. Structure: 1) Short answer. 2) Assumptions. 3) Expected effect, as ranges with how confident you are. 4) What to do, in order. 5) Data used from this organisation and its dates. 6) Limits. Use plain language. Do not claim certification, compliance or measured tonnes.';
