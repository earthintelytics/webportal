import { serviceCall } from './serviceClient';

/** GET /verification?kind= → { checks, outstanding }, or null when the backend has no result yet. */
export const fetchVerification = (kind) => serviceCall(`/verification?kind=${encodeURIComponent(kind)}`).catch(() => null);
