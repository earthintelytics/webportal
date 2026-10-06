import { hexOf, legendFor, useLayerLegends } from './layerLegends';

/** Legend rows for a layer: colour, label, range and unit. */
export default function LayerLegend({ layer, crop }) {
  useLayerLegends();
  const l = legendFor(layer, crop);
  if (!l) return null;
  return (
    <div className="space-y-1.5 pt-1 border-t border-gray-50">
      {[...l.classes].reverse().map((c) => (
        <div key={c.label} className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: hexOf(c) }} />
          <span className="text-xs text-gray-600"><span className="font-semibold text-gray-800">{c.label}</span> · {c.range[0]}–{c.range[1]} {l.unit}</span>
        </div>
      ))}
    </div>
  );
}
