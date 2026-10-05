// Small shared bits duplicated between Onboarding's farm step and the
// Organizations quick-add-farm form, so the two don't drift independently.

export const SENSOR_OPTIONS = ['sentinel-2', 'sentinel-1', 'landsat-9'];

// Crops an organisation can be licensed for (Onboarding and Organizations).
export const ALL_CROPS = ['ffb', 'maize', 'rice', 'cocoa', 'rubber', 'cassava', 'sugarcane', 'cashew'];

export const toggleInList = (list, v) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);


// Text inputs and selects in the admin console (same look as Scheduler and AI settings).
export const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 outline-none focus:border-green-600 disabled:bg-gray-50';
