/** Storage page calculations: sizes, file-type shares, registry vs storage. */

const VIEWABLE = ['.json', '.geojson', '.yaml', '.yml', '.txt', '.csv'];
export const isViewable = (key) => VIEWABLE.some((s) => key.toLowerCase().endsWith(s));
// Execution logs are parsed on the Logs page; open them there.
export const isExecutionLog = (key) => key.startsWith('execution_logs/');

export function formatSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024, units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${parseFloat((bytes / k ** i).toFixed(i ? 1 : 0))} ${units[i]}`;
}

// Bar segment colours per file type (Tailwind classes, not hex).
export const TYPE_COLOURS = {
  'Zarr Dataset': 'bg-sky-500', 'Boundary (GeoJSON)': 'bg-green-600', 'Plots Health Data': 'bg-violet-500',
  'GeoJSON Data': 'bg-cyan-500', 'Run Metadata': 'bg-amber-500', 'JSON Data': 'bg-gray-500', 'ZIP Archive': 'bg-pink-500',
  'Parquet Data': 'bg-rose-500', Image: 'bg-yellow-500', 'GeoTIFF Image': 'bg-teal-500', 'YAML Config': 'bg-gray-700', Other: 'bg-gray-400',
};

export function typeShares(files) {
  const total = files.reduce((a, f) => a + f.size_bytes, 0);
  const byType = files.reduce((acc, f) => {
    const t = (acc[f.file_type] ||= { type: f.file_type, count: 0, size: 0 });
    t.count += 1; t.size += f.size_bytes;
    return acc;
  }, {});
  return { total, list: Object.values(byType).sort((a, b) => b.size - a.size).map((t) => ({ ...t, pct: total ? (t.size / total) * 100 : 0 })) };
}

// Registry (database) against storage, per estate: is each boundary where the registry says?
export const SYNC_STATUS = {
  synced: ['In step', 'good'],
  missing: ['Missing from storage', 'critical'],
  orphan: ['In storage only', 'warning'],
  none: ['No boundary', 'neutral'],
};

export function registryVsStorage(farms, files) {
  return farms.map((farm) => {
    const expected = `${farm.company_id}/inputs/${farm.farm_id}/${farm.farm_id}_farm.geojson`;
    const file = files.find((f) => f.key === farm.boundary_minio_path || f.key === expected);
    const status = farm.boundary_uploaded ? (file ? 'synced' : 'missing') : (file ? 'orphan' : 'none');
    return { farm, status, path: file?.key || farm.boundary_minio_path || expected, size: file ? formatSize(file.size_bytes) : '—', modified: file ? new Date(file.last_modified).toLocaleString() : '—' };
  });
}
