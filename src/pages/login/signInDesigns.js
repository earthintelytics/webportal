/**
 * The left-hand picture and words on each sign-in page, per service. Plain
 * words from each service's doc (docs/services/*.md): what the service tells
 * you, not how it is computed. Chosen by module id, so a service never shows
 * another service's sign-in.
 */
const d = (name, group, image, title, text) => ({ name, group, image, title, text });

export const SIGN_IN_DESIGNS = {
  oil_palm: d('Oil palm monitoring', 'Crop monitoring', '/crops/oil_palm.webp', 'Every block of your estate, every week',
    'See which blocks are healthy, which are short of water, and where to send the team first.'),
  cocoa: d('Cocoa monitoring', 'Crop monitoring', '/crops/cocoa.webp', 'Your cocoa farms, seen from above',
    'Canopy health, dry-season stress and clearing near your farms, farm by farm.'),
  rubber: d('Rubber monitoring', 'Crop monitoring', '/crops/rubber.webp', 'Leaf cover and tapping conditions',
    'Know when blocks lose leaves out of season and when water is short.'),
  cashew: d('Cashew monitoring', 'Crop monitoring', '/crops/cashew.webp', 'Orchard health through the season',
    'New growth, flowering weather and water stress while nuts fill.'),
  maize: d('Maize monitoring', 'Crop monitoring', '/crops/maize.webp', 'Each field, stage by stage',
    'Emergence, leaf colour in the top-dressing window and water at tasselling.'),
  rice: d('Rice monitoring', 'Crop monitoring', '/crops/rice.webp', 'Water and growth in every field',
    'Standing water, growth and leaf colour, even through cloudy weeks.'),
  cassava: d('Cassava monitoring', 'Crop monitoring', '/crops/cassava.webp', 'Leaf cover and stress per field',
    'Spot pests, disease and long dry spells before they cut the harvest.'),
  sugarcane: d('Sugarcane monitoring', 'Crop monitoring', '/crops/sugarcane.webp', 'Cane growth and water demand',
    'Which fields are behind, which need irrigation this week, and how much.'),
  drone: d('Drone surveys', 'Engine', '/crops/drone.webp', 'Your drone flights, turned into maps',
    'Missing stands, dead trees and weeds, next to the latest satellite view.'),
  estate_carbon: d('Estate carbon', 'Sustainability', '/crops/hero/estate_carbon.webp', 'The carbon your estate holds',
    'Biomass, land-use change and conservation areas, with honest ranges.'),
  forestry: d('Forestry', 'Sustainability', '/crops/hero/forestry.webp', 'Know when the forest changes',
    'Clearing, fire risk and canopy condition for every compartment.'),
  estimator: d('Carbon estimator', 'Sustainability', '/crops/hero/estimator.webp', 'What a site could hold',
    'Compare planting plans before you start a carbon project.'),
  restoration: d('Land restoration', 'Sustainability', '/crops/hero/restoration.webp', 'Is the land recovering?',
    'Greening, survival and damage in every restoration zone.'),
  eudr: d('EUDR check', 'Sustainability', '/crops/hero/eudr.webp', 'Evidence for EU buyers',
    'Where each plot is and whether forest was cleared after 2020.'),
  advisor: d('Farm advisor', 'Field advisory', '/crops/hero/advisor.webp', 'Advice for each field',
    'What to do this week, from your own monitoring data and the weather.'),
  smallholder: d('Smallholder', 'Co-operatives and outgrowers', '/crops/smallholder.webp', 'Your members and their land',
    'Register members and parcels, collect forms from the field, and follow every farm.'),
  group_carbon: d('Group carbon', 'Co-operatives and outgrowers', '/crops/hero/group_carbon.webp', 'Carbon across your members',
    'Estimates per group and member, with the method shown.'),
  organization: d('Your organisation', 'Organisation sign-in', '/crops/organization.webp', 'Your farms, all in one place',
    'Sign in to open the services your organisation uses.'),
};

// Module id → design.
const BY_MODULE = {
  'rs-ffb': 'oil_palm', 'rs-cashew': 'cashew', 'rs-sugarcane': 'sugarcane', 'rs-rice': 'rice',
  'rs-cocoa': 'cocoa', 'rs-rubber': 'rubber', 'rs-cassava': 'cassava', 'rs-maize': 'maize',
  'rs-drone': 'drone',
  'carbon-ffb': 'estate_carbon', 'forestry-intel': 'forestry', 'carbon-estimator': 'estimator',
  'land-restoration': 'restoration', 'eudr-check': 'eudr', advisor: 'advisor',
  'smallholder-hub': 'smallholder', 'group-management': 'smallholder', 'smallholder-members': 'smallholder',
  'smallholder-forms': 'smallholder', 'group-monitoring': 'smallholder', 'carbon-groups': 'group_carbon',
  'smallholder-eudr': 'eudr',
};

export const signInDesignFor = (moduleId) => SIGN_IN_DESIGNS[BY_MODULE[moduleId]] || SIGN_IN_DESIGNS.organization;
