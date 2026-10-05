// Small shared bits duplicated between Onboarding's farm step and the
// Organizations quick-add-farm form, so the two don't drift independently.

export const SENSOR_OPTIONS = ['sentinel-2', 'sentinel-1', 'landsat-9'];

// Crops an organisation can be licensed for (Onboarding and Organizations).
export const ALL_CROPS = ['ffb', 'maize', 'rice', 'cocoa', 'rubber', 'cassava', 'sugarcane', 'cashew'];

export const toggleInList = (list, v) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

// size: 'sm' (compact, used in the Organizations quick-add form) | 'md' (default, Onboarding)
// Clean solid modern styling without muddy translucent backgrounds
export const chipStyle = (active, color = '#15803d', size = 'md') => ({
  padding: size === 'sm' ? '6px 12px' : '8px 16px',
  borderRadius: '8px', cursor: 'pointer',
  fontSize: size === 'sm' ? '11px' : '13px', fontWeight: 700,
  background: active ? '#15803d' : '#ffffff',
  border: active ? '1px solid #15803d' : '1px solid #cbd5e1',
  color: active ? '#ffffff' : '#334155',
  boxShadow: active ? '0 2px 4px rgba(21,128,61,0.2)' : '0 1px 2px rgba(0,0,0,0.04)',
  transition: 'all 0.15s ease',
  fontFamily: "'Inter', sans-serif",
});

// Text inputs and selects in the admin console (same look as Scheduler and AI settings).
export const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 outline-none focus:border-green-600 disabled:bg-gray-50';
