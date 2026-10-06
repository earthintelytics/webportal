/**
 * Builds the multipart body for a form submission (contract "Forms", G31):
 * `answers` JSON, `device_time`, photos as `photo:<field_id>` and boundary
 * files as `file:<field_id>`. Used by the public link page and by "Add
 * member" inside the portal, so both fill the register the same way.
 */
export function submissionBody(answers, consent = null) {
  const body = new FormData();
  const plain = {};
  Object.entries(answers).forEach(([id, v]) => {
    if (Array.isArray(v) && v[0] instanceof File) {
      v.forEach((file, i) => body.append(`photo:${id}`, file, `${id}_${i + 1}_${file.name}`));
    } else if (v && v.file instanceof File) {
      if (v.geojson) plain[id] = v.geojson;
      else body.append(`file:${id}`, v.file, v.file.name);
    } else {
      plain[id] = v;
    }
  });
  body.append('answers', JSON.stringify(plain));
  if (consent) body.append('consent', JSON.stringify(consent));
  body.append('device_time', new Date().toISOString());
  return body;
}

/** Answers that can be kept on the phone as a draft (no files). */
export const draftable = (answers) => Object.fromEntries(
  Object.entries(answers).filter(([, v]) => !(Array.isArray(v) && v[0] instanceof File) && !(v && v.file instanceof File)),
);
