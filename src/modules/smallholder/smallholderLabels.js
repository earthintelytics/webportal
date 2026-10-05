/** Plain labels and status tones for smallholder screens: [label, tone]. */
export const MEMBER_STATUS = {
  pending: ['Waiting for review', 'warning'],
  active: ['Active', 'good'],
  suspended: ['Suspended', 'neutral'],
};

// EUDR results come only from a real check (G29); until then every member is "Not checked".
export const EUDR_STATUS = {
  not_checked: ['Not checked', 'neutral'],
  pass: ['No deforestation found', 'good'],
  review: ['Needs review', 'warning'],
  fail: ['Deforestation found', 'critical'],
};

export const PARCEL_CHECK = {
  pending: ['Being checked', 'info'],
  ok: ['No problems found', 'good'],
  review: ['Needs review', 'warning'],
  failed: ['Problem found', 'critical'],
};
