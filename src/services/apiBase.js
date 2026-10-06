/** Where the portal finds the backend. Set per environment; every API client imports these. */
export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/farmintelytics-engine/agromonitoring';
export const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_BASE_URL || '/farmintelytics-engine/admin';
