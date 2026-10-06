import { Plus, X } from 'lucide-react';
import { typeInfo, mapOptionsFor } from './fieldTypes';
import { Field } from '../../components/page/PageKit';
import { inputCls } from '../../components/page/useLoader';

const num = (v) => (v === '' || v == null ? null : Number(v));

/** Settings of one field: label, help, required, choices, range, photos, condition, register column. */
const FieldEditor = ({ field, fields, onChange }) => {
  const info = typeInfo(field.type);
  const set = (k, v) => onChange({ ...field, [k]: v });
  const earlier = fields.slice(0, fields.findIndex((f) => f.id === field.id)).filter((f) => ['choice', 'multi_choice'].includes(f.type));
  const condField = earlier.find((f) => f.id === field.show_if?.field);

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-green-700">{info.label}</p>
      <Field label={info.noAnswer ? 'Heading' : 'Question'}><input className={inputCls} value={field.label} onChange={(e) => set('label', e.target.value)} /></Field>
      <Field label="Help text" hint="Shown under the question, e.g. what to photograph."><input className={inputCls} value={field.help} onChange={(e) => set('help', e.target.value)} /></Field>

      {!info.noAnswer && (
        <label className="flex items-center gap-2 text-sm text-gray-800">
          <input type="checkbox" checked={field.required} onChange={(e) => set('required', e.target.checked)} /> Answer required
        </label>
      )}

      {info.choices && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-800">Choices</p>
          {field.choices.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputCls} value={c} onChange={(e) => set('choices', field.choices.map((x, j) => (j === i ? e.target.value : x)))} />
              <button type="button" aria-label="Remove choice" disabled={field.choices.length <= 1} onClick={() => set('choices', field.choices.filter((_, j) => j !== i))} className="px-2 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40"><X size={14} /></button>
            </div>
          ))}
          <button type="button" onClick={() => set('choices', [...field.choices, `Option ${field.choices.length + 1}`])} className="inline-flex items-center gap-1 text-sm text-green-700 font-medium"><Plus size={14} />Add choice</button>
        </div>
      )}

      {info.range && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Lowest allowed"><input className={inputCls} type="number" value={field.min ?? ''} onChange={(e) => set('min', num(e.target.value))} /></Field>
          <Field label="Highest allowed"><input className={inputCls} type="number" value={field.max ?? ''} onChange={(e) => set('max', num(e.target.value))} /></Field>
        </div>
      )}

      {info.area && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Smallest area (ha)" hint="Optional"><input className={inputCls} type="number" min={0} step="any" value={field.min ?? ''} onChange={(e) => set('min', num(e.target.value))} /></Field>
          <Field label="Largest area (ha)" hint="Optional"><input className={inputCls} type="number" min={0} step="any" value={field.max ?? ''} onChange={(e) => set('max', num(e.target.value))} /></Field>
        </div>
      )}

      {info.photos && (
        <Field label="Photos allowed"><input className={inputCls} type="number" min={1} max={10} value={field.max_photos ?? 1} onChange={(e) => set('max_photos', Math.min(10, Math.max(1, Number(e.target.value) || 1)))} /></Field>
      )}

      {earlier.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-800">Show only when</p>
          <div className="grid grid-cols-2 gap-3">
            <select className={inputCls} value={field.show_if?.field || ''} onChange={(e) => set('show_if', e.target.value ? { field: e.target.value, equals: earlier.find((f) => f.id === e.target.value)?.choices[0] } : null)}>
              <option value="">Always show</option>
              {earlier.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            {condField && (
              <select className={inputCls} value={field.show_if.equals} onChange={(e) => set('show_if', { ...field.show_if, equals: e.target.value })}>
                {condField.choices.map((c) => <option key={c} value={c}>is “{c}”</option>)}
              </select>
            )}
          </div>
        </div>
      )}

      {!info.noAnswer && (
        <Field label="Fills in the register" hint="When you approve a submission, this answer is copied to the member or parcel.">
          <select className={inputCls} value={field.maps_to || ''} onChange={(e) => set('maps_to', e.target.value)}>
            {mapOptionsFor(field.type).map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </Field>
      )}
    </div>
  );
};

export default FieldEditor;
