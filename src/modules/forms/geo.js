// Area of a lon/lat ring in hectares (spherical approximation; the backend recomputes it).
export function ringAreaHa(points) {
  if (!points || points.length < 3) return 0;
  const R = 6378137, rad = Math.PI / 180;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    sum += (b.lon - a.lon) * rad * (2 + Math.sin(a.lat * rad) + Math.sin(b.lat * rad));
  }
  return Math.abs((sum * R * R) / 2) / 10000;
}
