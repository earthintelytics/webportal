/**
 * Builds the multipart body for a form submission (contract "Forms", G31):
 * `answers` JSON, `device_time` and photos as `photo:<field_id>`. Every
 * geometry (drawn, walked, GPS or read from a boundary file) is sent as
 * GeoJSON in the answers. Used by the public link page and by "Add
 * member" inside the portal, so both fill the register the same way.
 */
import { toServerGeometry } from './geo';

export function submissionBody(answers, consent = null) {
  const body = new FormData();
  const plain = {};
  Object.entries(answers).forEach(([id, v]) => {
    if (Array.isArray(v) && v[0] instanceof File) {
      v.forEach((file, i) => body.append(`photo:${id}`, file, `${id}_${i + 1}_${file.name}`));
    } else if (v && v.geometry && v.file_name) {
      // Boundary file, already read on the phone: send the area itself.
      plain[id] = { ...v.geometry, source: 'file', file_name: v.file_name };
    } else {
      // GPS points and walked boundaries go as GeoJSON (forms.py, G54).
      const g = toServerGeometry(v);
      plain[id] = g === undefined ? v : g;
    }
  });
  body.append('answers', JSON.stringify(plain));
  if (consent) body.append('consent', JSON.stringify(consent));
  body.append('device_time', new Date().toISOString());
  return body;
}

/** Answers that can be kept on the phone as a draft (no files). */
export const draftable = (answers) => Object.fromEntries(
  Object.entries(answers).filter(([, v]) => !(Array.isArray(v) && v[0] instanceof File)),
);
