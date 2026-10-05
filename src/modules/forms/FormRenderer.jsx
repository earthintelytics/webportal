import { isShown, typeInfo } from './fieldTypes';
import { GpsPointInput, BoundaryWalkInput } from './inputs/GpsInputs';
import { PhotoInput, SignatureInput } from './inputs/MediaInputs';

const inputCls = 'w-full px-3.5 py-3 rounded-xl border border-gray-300 bg-white text-base text-gray-900 focus:border-green-600 focus:outline-none';

function Input({ field, value, onChange }) {
  switch (field.type) {
    case 'number':
      return <input type="number" inputMode="decimal" className={inputCls} value={value ?? ''} min={field.min ?? undefined} max={field.max ?? undefined} onChange={(e) => onChange(e.target.value)} />;
    case 'date':
      return <input type="date" className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'phone':
      return <input type="tel" inputMode="tel" className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'choice':
      return (
        <div className="space-y-2">
          {field.choices.map((c) => (
            <label key={c} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm">
              <input type="radio" name={field.id} checked={value === c} onChange={() => onChange(c)} /> {c}
            </label>
          ))}
        </div>
      );
    case 'multi_choice': {
      const list = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {field.choices.map((c) => (
            <label key={c} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm">
              <input type="checkbox" checked={list.includes(c)} onChange={() => onChange(list.includes(c) ? list.filter((x) => x !== c) : [...list, c])} /> {c}
            </label>
          ))}
        </div>
      );
    }
    case 'photo': return <PhotoInput value={value} onChange={onChange} max={field.max_photos || 1} />;
    case 'gps_point': return <GpsPointInput value={value} onChange={onChange} />;
    case 'boundary_walk': return <BoundaryWalkInput value={value} onChange={onChange} />;
    case 'signature': return <SignatureInput value={value} onChange={onChange} />;
    default:
      return <input type="text" className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
}

/**
 * Renders a form for filling in, phone-first. Used by the builder preview and
 * by the public page farmers open from a link.
 */
const FormRenderer = ({ fields, answers, onChange, errors = {} }) => (
  <div className="space-y-6">
    {fields.filter((f) => isShown(f, answers)).map((f) => {
      if (typeInfo(f.type).noAnswer) {
        return (
          <div key={f.id} className="pt-2">
            <h3 className="font-display text-lg font-semibold text-gray-900">{f.label}</h3>
            {f.help && <p className="text-sm text-gray-500 mt-1">{f.help}</p>}
          </div>
        );
      }
      return (
        <div key={f.id} className="space-y-2">
          <p className="text-sm font-semibold text-gray-900">{f.label}{f.required && <span className="text-red-700"> *</span>}</p>
          {f.help && <p className="text-xs text-gray-500">{f.help}</p>}
          <Input field={f} value={answers[f.id]} onChange={(v) => onChange({ ...answers, [f.id]: v })} />
          {errors[f.id] && <p className="text-xs text-red-700">{errors[f.id]}</p>}
        </div>
      );
    })}
  </div>
);

export default FormRenderer;
