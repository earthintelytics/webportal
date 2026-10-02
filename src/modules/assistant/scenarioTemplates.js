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
const ESTATE = { name: 'estate', label: 'Estate / Sector', type: 'estate' };

export const SCENARIOS = {
  'crop:oil_palm': [
    { 
      id: 'op-dry-spell', 
      title: 'Dry spell & bunch yield impact', 
      desc: 'Effect of rainfall shortfall on vegetative frond vitality and bunch initiation.', 
      question: 'What if rainfall in {month} is {pct}% below normal on {estate}? What happens to the palms over the next months, which blocks are most exposed, and what should we do?', 
      params: [MONTH, { name: 'pct', label: 'Below normal (%)', type: 'percent', default: 30 }, ESTATE],
      requiredData: ['14-day rainfall anomaly telemetry', 'Historical bunch census', 'Block canopy water deficit (NDMI)']
    },
    { 
      id: 'op-fertiliser-delay', 
      title: 'Delay fertilizer round', 
      desc: 'Impact of postponing NPK/Kieserite application on frond color and yield trend.', 
      question: 'What if we delay the fertiliser round on {estate} by {weeks} weeks? What is the likely effect on leaf colour and the yield trend, and what are the risks?', 
      params: [ESTATE, { name: 'weeks', label: 'Delay (weeks)', type: 'weeks', default: 4 }],
      requiredData: ['Soil nutrient history', 'Recent leaf sampling analyses', 'Vegetation index trend (EVI/NDVI)']
    },
    { 
      id: 'op-replant', 
      title: 'Replant mature blocks', 
      desc: 'Impact of replanting oldest blocks on 5-year production and estate carbon stocks.', 
      question: 'What if we replant {area} ha of the oldest blocks on {estate} this year? What happens to production over the next 5 years and to the estate carbon estimate?', 
      params: [{ name: 'area', label: 'Area (ha)', type: 'number', default: 200 }, ESTATE],
      requiredData: ['Block planting year records', 'Current yield per ha baseline', 'Above-ground biomass estimate']
    },
  ],
  'crop:cocoa': [
    { 
      id: 'cc-long-dry', 
      title: 'Extended dry season defense', 
      desc: 'Impact on pod cherelle wilt and soil moisture depletion.', 
      question: 'What if the dry season on {estate} lasts {weeks} weeks longer than usual? Which farms are most at risk, and what should farmers do before and during it?', 
      params: [ESTATE, { name: 'weeks', label: 'Extra dry weeks', type: 'weeks', default: 4 }],
      requiredData: ['Shade canopy density layer', 'Soil moisture retention profile', 'Cherelle development stage']
    },
    { 
      id: 'cc-shade', 
      title: 'Agroforestry shade tree integration', 
      desc: 'Planting native shade trees on exposed parcel borders.', 
      question: 'What if we plant shade trees on the most exposed cocoa farms on {estate} ({trees} trees per ha)? What changes for drought exposure, canopy and carbon over 5 years?', 
      params: [ESTATE, { name: 'trees', label: 'Trees per ha', type: 'number', default: 20 }],
      requiredData: ['Parcel boundary polygon', 'Baseline thermal stress index (LST)', 'Tree species compatibility']
    },
  ],
  'crop:rubber': [
    { 
      id: 'rb-long-wintering', 
      title: 'Late refoliation & tapping restart', 
      desc: 'Canopy recovery timelines and latex flow adjustments.', 
      question: 'What if refoliation on {estate} is {weeks} weeks later than usual? What does it mean for the tapping restart and for which blocks?', 
      params: [ESTATE, { name: 'weeks', label: 'Later by (weeks)', type: 'weeks', default: 3 }],
      requiredData: ['Clone variety records', 'Canopy flush NDVI timeseries', 'Bark consumption logs']
    },
  ],
  'crop:cashew': [
    { 
      id: 'cw-rain-flowering', 
      title: 'Rain during flowering stage', 
      desc: 'Humidity and flower blight risks during nut set.', 
      question: 'What if there is {mm} mm of rain in {month}, during flowering, on {estate}? What is the risk to flowers and nut set, and what should be done?', 
      params: [{ name: 'mm', label: 'Rain (mm)', type: 'number', default: 80 }, MONTH, ESTATE],
      requiredData: ['Flowering window phenology', 'Daily humidity telemetry', 'Anthracnose risk indices']
    },
  ],
  'crop:maize': [
    { 
      id: 'mz-drought-tassel', 
      title: 'Drought during tasselling stage', 
      desc: 'Critical water deficit during pollination and kernel set.', 
      question: 'What if there is no rain for {weeks} weeks around tasselling on {estate}? Which fields are exposed, how large could the yield loss be, and is irrigation worth it?', 
      params: [{ name: 'weeks', label: 'Dry weeks', type: 'weeks', default: 2 }, ESTATE],
      requiredData: ['Planting date / GDD calculation', 'Crop water stress index', 'Available irrigation volume']
    },
    { 
      id: 'mz-late-planting', 
      title: 'Delayed planting shift', 
      desc: 'Impact on growth stage calendar and top-dressing window.', 
      question: 'What if planting on {estate} is {weeks} weeks later than planned? How does it shift the stages, the top-dressing window and the drought risk?', 
      params: [ESTATE, { name: 'weeks', label: 'Later by (weeks)', type: 'weeks', default: 3 }],
      requiredData: ['Seasonal onset rainfall date', 'Hybrid maturity rating (CRM)', 'Nitrogen mineralization rate']
    },
  ],
  'crop:rice': [
    { 
      id: 'rc-late-flood', 
      title: 'Delayed paddy flooding', 
      desc: 'Effect on weed suppression and seedling tillering.', 
      question: 'What if fields on {estate} are flooded {weeks} weeks late after transplanting? What is the effect on establishment and weeds, and which fields to prioritise?', 
      params: [ESTATE, { name: 'weeks', label: 'Late by (weeks)', type: 'weeks', default: 2 }],
      requiredData: ['Paddy elevation / leveling map', 'Soil water saturation (NDWI)', 'Transplanting date logs']
    },
  ],
  'crop:cassava': [
    { 
      id: 'cv-drought', 
      title: 'Dry spell during tuber bulking', 
      desc: 'Starch accumulation and harvest timing recommendations.', 
      question: 'What if there is a {weeks}-week drought during root bulking on {estate}? When does it start to cost yield, and what should we watch?', 
      params: [{ name: 'weeks', label: 'Drought (weeks)', type: 'weeks', default: 4 }, ESTATE],
      requiredData: ['Tuber bulking stage milestone', 'Subsurface moisture probe / SMAP', 'Target starch content']
    },
  ],
  'crop:sugarcane': [
    { 
      id: 'sc-cut-irrigation', 
      title: 'Irrigation water curtailment', 
      desc: 'Biomass accumulation tradeoff and sucrose concentration.', 
      question: 'What if irrigation water on {estate} is cut by {pct}% during grand growth? Which fields suffer first, and how should the water be shared?', 
      params: [ESTATE, { name: 'pct', label: 'Cut (%)', type: 'percent', default: 25 }],
      requiredData: ['Actual evapotranspiration (ETa)', 'Soil water holding capacity', 'Field stalk height telemetry']
    },
  ],
  'service:carbon-ffb': [
    { 
      id: 'ec-replant', 
      title: 'Replanting carbon balance', 
      desc: '10-year biomass carbon stock trajectory and Tier-1 emissions.', 
      question: 'What if we replant {area} ha on {estate} this year? How does the estate carbon estimate change now and over 10 years (as a range, with the method)?', 
      params: [{ name: 'area', label: 'Area (ha)', type: 'number', default: 200 }, ESTATE],
      requiredData: ['Stand age distribution', 'Mean carbon stock per ha', 'Allometric biomass model']
    },
    { 
      id: 'ec-conservation', 
      title: 'HCV conservation set-aside', 
      desc: 'Assisted regeneration and carbon credit potential.', 
      question: 'What if we set aside {area} ha on {estate} for natural regrowth? What could it add to the carbon estimate over 10 and 20 years, and what evidence would an auditor need?', 
      params: [{ name: 'area', label: 'Area (ha)', type: 'number', default: 50 }, ESTATE],
      requiredData: ['Forest canopy cover baseline', 'Deforestation risk screening', 'High conservation value audit layer']
    },
  ],
  'service:carbon-groups': [
    { 
      id: 'gc-trees', 
      title: 'Cooperative agroforestry campaign', 
      desc: 'Smallholder aggregate carbon gain and tree survival tracking.', 
      question: 'What if members of {estate} plant {trees} trees in total this season? What carbon gain range is realistic over 10 years, and what survival data do we need to collect?', 
      params: [ESTATE, { name: 'trees', label: 'Trees planted', type: 'number', default: 5000 }],
      requiredData: ['Smallholder cluster boundaries', 'Tree nursery registry', 'Monitoring verification protocol']
    },
  ],
  'service:forestry-intel': [
    { 
      id: 'fo-fire', 
      title: 'Forest dry spell & wildfire risk', 
      desc: 'Fuel moisture depletion and patrol prioritization.', 
      question: 'What if the dry season on {estate} runs {weeks} weeks longer than usual? Which compartments face the highest fire risk, and where should patrols focus?', 
      params: [ESTATE, { name: 'weeks', label: 'Extra dry weeks', type: 'weeks', default: 3 }],
      requiredData: ['Fine fuel moisture code (FFMC)', 'Historical fire hotspot history', 'Canopy dryness index (NDII)']
    },
  ],
  'service:carbon-estimator': [
    { 
      id: 'ce-compare', 
      title: 'Land-use carbon scenario matrix', 
      desc: 'Agroforestry vs assisted regeneration vs business-as-usual.', 
      question: 'For {area} ha on {estate}, compare business as usual, agroforestry and assisted natural regeneration over {years} years. Give carbon ranges, assumptions and main risks for each.', 
      params: [{ name: 'area', label: 'Area (ha)', type: 'number', default: 100 }, ESTATE, { name: 'years', label: 'Years', type: 'number', default: 20 }],
      requiredData: ['Initial land cover classification', 'Soil organic carbon baseline', 'Project lifecycle timeline']
    },
  ],
  'service:land-restoration': [
    { 
      id: 'lr-dry-year', 
      title: 'Drought resilience in recovery zones', 
      desc: 'Vegetation recovery index setback and intervention planning.', 
      question: 'What if next year’s rainfall on {estate} is {pct}% below normal? Which restoration zones are at risk of setback, and what can be done now?', 
      params: [ESTATE, { name: 'pct', label: 'Below normal (%)', type: 'percent', default: 25 }],
      requiredData: ['Restoration parcel boundaries', 'Fractional vegetation cover (FVC)', 'Soil erosion susceptibility map']
    },
  ],
  'service:eudr-check': [
    { 
      id: 'eu-new-plots', 
      title: 'Supplier parcel onboarding audit', 
      desc: 'Post-2020 deforestation screening and due diligence checklist.', 
      question: 'We plan to source from new plots near {estate}. What must we check before the first shipment, which data do we need from the supplier, and what could make a plot fail?', 
      params: [ESTATE],
      requiredData: ['GPS coordinates / Polygon vertices', 'Dec 31 2020 Tree cover baseline', 'Legality & land tenure certificates']
    },
  ],
  'service:advisor': [
    { 
      id: 'ad-heavy-rain', 
      title: 'Heavy rain preparedness & drainage', 
      desc: 'Pre-rain drainage checks and post-rain fungal prevention.', 
      question: 'Heavy rain ({mm} mm) is forecast next week on {estate}. What should we do in each type of field before, during and after it?', 
      params: [{ name: 'mm', label: 'Rain (mm)', type: 'number', default: 100 }, ESTATE],
      requiredData: ['Topographic wetness index (TWI)', 'Estate drainage network capacity', 'Current root zone soil saturation']
    },
    { 
      id: 'ad-dry-spell', 
      title: 'Drought & heatwave defense plan', 
      desc: 'Mitigation strategies for upcoming extended dry periods.', 
      question: 'What if a dry spell with temperatures {deg}°C above normal hits {estate} for {weeks} weeks? What irrigation, mulching and canopy protective measures should be deployed?', 
      params: [{ name: 'deg', label: 'Temp rise (°C)', type: 'number', default: 3 }, { name: 'weeks', label: 'Duration (weeks)', type: 'weeks', default: 3 }, ESTATE],
      requiredData: ['14-day maximum temperature forecast', 'Canopy water stress index', 'Available water reservoir capacity']
    },
    { 
      id: 'ad-fert-timing', 
      title: 'Optimal fertilizer application window', 
      desc: 'Timing top-dressing with soil moisture to maximize uptake and eliminate runoff.', 
      question: 'We plan a top-dressing fertilizer round on {estate}. Based on current soil moisture and the 14-day weather forecast, when is the optimal application window to minimize runoff and maximize uptake?', 
      params: [ESTATE],
      requiredData: ['Topsoil moisture level (0-30cm)', '14-day precipitation forecast', 'Fertilizer formulation (NPK/Urea)']
    },
    { 
      id: 'ad-disease-risk', 
      title: 'Pest & fungal outbreak alert', 
      desc: 'Targeted preventive interventions for sustained high humidity conditions.', 
      question: 'High humidity is sustained across {estate}. Which crop blocks face the highest fungal or pest infestation risk, and what preventive cultural and biological controls should we apply?', 
      params: [ESTATE],
      requiredData: ['Relative humidity & dew point telemetry', 'Leaf wetness duration hours', 'Block history of fungal incidence']
    },
    { 
      id: 'ad-yield-optimization', 
      title: 'Closing block yield gaps', 
      desc: 'Root-cause diagnosis and ROI action plan for underperforming blocks.', 
      question: 'For the lower-performing blocks on {estate}, what are the top agronomic limiting factors (nutrients, water, soil compaction), and what corrective action plan will yield the highest ROI?', 
      params: [ESTATE],
      requiredData: ['Block yield distribution maps', 'Sentinel-2 NDVI/EVI historical trends', 'Soil chemical & physical survey data']
    },
  ],
};

/** How every scenario answer should be laid out (sent with the question). */
export const ANSWER_FORMAT =
  'Answer as an agronomy advisor. Structure: 1) Short answer. 2) Assumptions. 3) Expected effect, as ranges with how confident you are. 4) What to do, in order. 5) Data used from this organisation and its dates. 6) Limits. Use plain language. Do not claim certification, compliance or measured tonnes.';
