import { geometryAreaHa, toServerGeometry } from './geo';

/**
 * Field types a co-operative can put in a form (contract "Forms", G31), and
 * the register columns a field can fill when a submission is approved.
 */
export const FIELD_TYPES = [
  { type: 'text', label: 'Short text' },
  { type: 'number', label: 'Number', range: true },
  { type: 'choice', label: 'One choice', choices: true },
  { type: 'multi_choice', label: 'Several choices', choices: true },
  { type: 'date', label: 'Date' },
  { type: 'phone', label: 'Phone number' },
  { type: 'photo', label: 'Photo', photos: true },
  { type: 'draw_point', label: 'Point on a map', geo: 'point' },
  { type: 'draw_line', label: 'Line on a map', geo: 'line' },
  { type: 'draw_polygon', label: 'Area on a map (draw or upload)', geo: 'area', area: true },
  { type: 'gps_point', label: 'GPS point', geo: 'point' },
  { type: 'boundary_walk', label: 'Walked boundary', geo: 'area', area: true },
  { type: 'boundary_file', label: 'Boundary file', geo: 'area', area: true },
  { type: 'signature', label: 'Signature' },
  { type: 'section', label: 'Section heading', noAnswer: true },
];

export const typeInfo = (type) => FIELD_TYPES.find((t) => t.type === type) || FIELD_TYPES[0];

// Where an answer goes in the register when the co-op approves the submission.
export const MAPS_TO = [
  { value: '', label: 'Keep with the submission only' },
  { value: 'member.name', label: 'Member: name', types: ['text'] },
  { value: 'member.phone', label: 'Member: phone', types: ['phone', 'text'] },
  { value: 'member.national_id', label: 'Member: national ID', types: ['text'] },
  { value: 'member.group', label: 'Member: group', types: ['choice', 'text'] },
  { value: 'member.photo', label: 'Member: photo', types: ['photo'] },
  { value: 'parcel.geometry', label: 'Parcel: boundary', types: ['draw_polygon', 'boundary_walk', 'boundary_file'] },
  { value: 'parcel.point', label: 'Parcel: location (point)', types: ['draw_point', 'gps_point'] },
  { value: 'parcel.crop', label: 'Parcel: crop', types: ['choice', 'text'] },
  { value: 'parcel.planting_year', label: 'Parcel: planting year', types: ['number'] },
  { value: 'parcel.tenure', label: 'Parcel: land tenure', types: ['choice', 'text'] },
];

export const mapOptionsFor = (type) => MAPS_TO.filter((m) => !m.types || m.types.includes(type));

let counter = 0;
export const newField = (type) => ({
  id: `f_${Date.now().toString(36)}_${(counter++).toString(36)}`,
  type,
  label: typeInfo(type).label,
  help: '',
  required: false,
  choices: typeInfo(type).choices ? ['Option 1', 'Option 2'] : [],
  min: null,
  max: null,
  max_photos: typeInfo(type).photos ? 1 : null,
  show_if: null,
  maps_to: '',
});

/** Is this field shown, given the answers so far? */
export const isShown = (field, answers) => {
  if (!field.show_if?.field) return true;
  const v = answers[field.show_if.field];
  return Array.isArray(v) ? v.includes(field.show_if.equals) : v === field.show_if.equals;
};

/** Returns { fieldId: message } for required / range problems. */
export function validateAnswers(fields, answers) {
  const errors = {};
  fields.forEach((f) => {
    if (typeInfo(f.type).noAnswer || !isShown(f, answers)) return;
    const v = answers[f.id];
    const empty = v == null || v === '' || (Array.isArray(v) && v.length === 0);
    if (f.required && empty) { errors[f.id] = 'Required'; return; }
    if (empty) return;
    if (f.type === 'number') {
      const n = Number(v);
      if (Number.isNaN(n)) errors[f.id] = 'Enter a number';
      else if (f.min != null && n < f.min) errors[f.id] = `At least ${f.min}`;
      else if (f.max != null && n > f.max) errors[f.id] = `At most ${f.max}`;
    }
    if (f.type === 'phone' && !/^\+?[0-9 ()-]{7,20}$/.test(v)) errors[f.id] = 'Use digits and an optional +';
    if (f.type === 'boundary_walk' && (!Array.isArray(v) || v.length < 3)) errors[f.id] = 'Walk at least 3 corners';
    if (f.type === 'boundary_file' && v?.error) errors[f.id] = v.error;
    // Area limits in hectares (the server checks them again).
    if (typeInfo(f.type).area && (f.min != null || f.max != null) && !errors[f.id]) {
      const g = f.type === 'boundary_walk' ? toServerGeometry(v) : f.type === 'boundary_file' ? v?.geometry : v;
      const ha = g ? geometryAreaHa(g) : 0;
      if (ha && f.min != null && ha < f.min) errors[f.id] = `The area is ${ha.toFixed(2)} ha; it must be at least ${f.min} ha`;
      else if (ha && f.max != null && ha > f.max) errors[f.id] = `The area is ${ha.toFixed(2)} ha; it must be at most ${f.max} ha`;
    }
  });
  return errors;
}

/**
 * A starting point for a co-operative's registration form: member details
 * and one parcel. The co-op changes it freely in the builder.
 */
export function starterRegistrationForm() {
  const f = (type, label, extra = {}) => ({ ...newField(type), label, ...extra });
  return {
    title: 'Member registration',
    description: 'Register a farmer and their farm.',
    purpose: 'registration',
    fields: [
      f('section', 'The farmer'),
      f('text', 'Full name', { required: true, maps_to: 'member.name' }),
      f('phone', 'Phone number', { maps_to: 'member.phone' }),
      f('text', 'National ID', { maps_to: 'member.national_id' }),
      f('text', 'Group or community', { maps_to: 'member.group' }),
      f('photo', 'Photo of the farmer', { maps_to: 'member.photo' }),
      f('section', 'The farm'),
      // A choice, so every parcel's crop can be used by monitoring, EUDR and carbon.
      f('choice', 'Main crop on this farm', { required: true, maps_to: 'parcel.crop', choices: ['Oil palm', 'Cocoa', 'Rubber', 'Cashew', 'Cassava', 'Maize', 'Rice', 'Sugarcane', 'Mixed (several crops)', 'Other'] }),
      f('number', 'Year planted', { min: 1950, max: new Date().getFullYear(), maps_to: 'parcel.planting_year' }),
      f('draw_polygon', 'The farm boundary', { help: 'Tap the corners on the map, or upload a GeoJSON, KML, KMZ or zipped shapefile.', maps_to: 'parcel.geometry' }),
      f('signature', 'Signature of the farmer'),
    ],
  };
}
