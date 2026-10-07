import { Layers, X } from 'lucide-react';
import LayerLegend from '../legends/LayerLegend';

const Toggle = ({ on, onChange, label }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
    className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${on ? 'bg-green-600' : 'bg-gray-300'}`}>
    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
  </button>
);

const Opacity = ({ value, onChange }) => (
  <label className="block pt-2 border-t border-gray-100">
    <span className="flex justify-between text-xs text-gray-600"><span>Opacity</span><span>{value}%</span></span>
    <input type="range" min="10" max="100" value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))}
      className="w-full h-1.5 mt-1 rounded-full appearance-none cursor-pointer bg-gray-100 accent-green-700" />
  </label>
);

const Row = ({ label, text, on, onChange, children }) => (
  <div className="border border-gray-200 rounded-xl p-3.5 space-y-2.5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {text && <p className="text-xs text-gray-500 mt-0.5">{text}</p>}
      </div>
      <Toggle on={on} onChange={onChange} label={label} />
    </div>
    {on && children}
  </div>
);

/**
 * The map layers of every map page, the same everywhere: the satellite
 * picture (its legend comes from the admin's map classes), outlines, and,
 * where the page has its own results, one "Colour by" choice whose legend
 * and map colours come from the same classes. Only layers with real data are
 * offered; a page passes no colour options when it has none.
 *
 * colourBy: { value, onChange, options: [{ id, label, layer, text }], empty }
 * children: anything only this page has (index legends, land cover change).
 */
const MapLayersPanel = ({ onClose, satellite, outlines, colourBy, cropType, unit = 'blocks', children }) => (
  <aside className="w-[300px] bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-y-auto z-10">
    <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
      <span className="flex items-center gap-2 font-display text-base font-semibold text-gray-900"><Layers size={18} className="text-green-700" />Map layers</span>
      <button type="button" onClick={onClose} aria-label="Close map layers" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"><X size={18} /></button>
    </div>
    <div className="p-4 space-y-3">
      {satellite && satellite.available && (
        <Row label="Satellite picture" text={satellite.text} on={satellite.on} onChange={satellite.onChange}>
          <Opacity value={satellite.opacity} onChange={satellite.setOpacity} />
          {satellite.legend || (
            <div className="pt-1 space-y-1">
              <div className="h-2.5 rounded-full" style={{ background: satellite.scale === 'water' ? 'linear-gradient(90deg,#B45309,#FDE68A,#93C5FD,#1D4ED8)' : 'linear-gradient(90deg,#B91C1C,#FDE68A,#86EFAC,#15803D)' }} />
              <div className="flex justify-between text-xs text-gray-500"><span>{satellite.scale === 'water' ? 'Dry' : 'Bare or stressed'}</span><span>{satellite.scale === 'water' ? 'Wet' : 'Healthy'}</span></div>
            </div>
          )}
        </Row>
      )}
      {satellite && !satellite.available && (
        <p className="text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl p-3">No satellite picture for this date yet. It appears after the first monitoring run.</p>
      )}
      {outlines && (
        <Row label={`Outlines of the ${unit}`} text="Click one to see its details" on={outlines.on} onChange={outlines.onChange}>
          <Opacity value={outlines.opacity} onChange={outlines.setOpacity} />
        </Row>
      )}
      {false && colourBy && (
        <div className="border border-gray-200 rounded-xl p-3.5 space-y-2.5">
          <p className="text-sm font-semibold text-gray-900">Colour the {unit} by</p>
          {colourBy.options.length ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => colourBy.onChange(null)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${!colourBy.value ? 'bg-green-50 border-green-600 text-green-800' : 'bg-white border-gray-300 text-gray-600'}`}>Nothing</button>
                {colourBy.options.map((o) => (
                  <button key={o.id} type="button" onClick={() => colourBy.onChange(o.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${colourBy.value === o.id ? 'bg-green-50 border-green-600 text-green-800' : 'bg-white border-gray-300 text-gray-600'}`}>{o.label}</button>
                ))}
              </div>
              {(() => {
                const o = colourBy.options.find((x) => x.id === colourBy.value);
                return o ? <>{o.text && <p className="text-xs text-gray-500">{o.text}</p>}<LayerLegend layer={o.layer} crop={cropType} /></> : null;
              })()}
            </>
          ) : <p className="text-xs text-gray-500">{colourBy.empty}</p>}
        </div>
      )}
      {children}
      <p className="text-xs text-gray-500 leading-relaxed">
        The calendar and time slider change the date of the satellite picture.
      </p>
    </div>
  </aside>
);

export default MapLayersPanel;
