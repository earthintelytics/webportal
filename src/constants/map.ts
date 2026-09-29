// UNUSED (2026-09-29): not imported anywhere in the running app. Kept on purpose, not deleted — see docs/UNUSED_CODE.md in the root repo before reusing or removing.
export const SATELLITE_TILE_URL = (import.meta.env.VITE_SATELLITE_TILE_URL as string) || "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
export const BOUNDARIES_TILE_URL = (import.meta.env.VITE_BOUNDARIES_TILE_URL as string) || "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
export const BASE_MAP_ATTRIBUTION = (import.meta.env.VITE_BASE_MAP_ATTRIBUTION as string) || "&copy; Esri";
