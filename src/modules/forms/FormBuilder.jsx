import { useState } from 'react';
import { ArrowDown, ArrowUp, Copy, GripVertical, Trash2 } from 'lucide-react';
import { FIELD_TYPES, newField, typeInfo, validateAnswers } from './fieldTypes';
import FieldEditor from './FieldEditor';
import FormRenderer from './FormRenderer';
import { Card, Field, PrimaryButton, SecondaryButton, ErrorNote } from '../../components/page/PageKit';
import { inputCls } from '../../components/page/useLoader';

/**
 * Design a form: add fields, order them (drag or arrows), set each one up, and
 * see it as a farmer will on a phone.
 */
const FormBuilder = ({ initial, onSave, onCancel, saving, error }) => {
  const [form, setForm] = useState(() => ({ title: '', description: '', fields: [], ...initial }));
  const [selectedId, setSelectedId] = useState(form.fields[0]?.id || null);
  const [dragId, setDragId] = useState(null);
  const [previewAnswers, setPreviewAnswers] = useState({});

  const fields = form.fields;
  const setFields = (next) => setForm((f) => ({ ...f, fields: next }));
  const selected = fields.find((f) => f.id === selectedId);

  const add = (type) => { const f = newField(type); setFields([...fields, f]); setSelectedId(f.id); };
  const move = (i, d) => { const next = [...fields]; const [x] = next.splice(i, 1); next.splice(i + d, 0, x); setFields(next); };
  const remove = (id) => {
    // Conditions that pointed at the removed field are dropped with it.
    setFields(fields.filter((f) => f.id !== id).map((f) => (f.show_if?.field === id ? { ...f, show_if: null } : f)));
    if (selectedId === id) setSelectedId(null);
  };
  const duplicate = (i) => { const copy = { ...fields[i], id: newField(fields[i].type).id }; const next = [...fields]; next.splice(i + 1, 0, copy); setFields(next); setSelectedId(copy.id); };
  const drop = (targetId) => {
    if (!dragId || dragId === targetId) return;
    const next = fields.filter((f) => f.id !== dragId);
    next.splice(next.findIndex((f) => f.id === targetId), 0, fields.find((f) => f.id === dragId));
    setFields(next); setDragId(null);
  };

  const problems = [
    !form.title.trim() && 'Give the form a title.',
    fields.filter((f) => !typeInfo(f.type).noAnswer).length === 0 && 'Add at least one question.',
    fields.some((f) => !f.label.trim()) && 'Every field needs a question.',
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {error && <ErrorNote message={error} />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Form title"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. New member registration" /></Field>
        <Field label="Description" hint="Shown to farmers at the top of the form."><input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px_340px] gap-6 items-start">
        <Card className="p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-800">Fields</p>
          {fields.length === 0 && <p className="text-sm text-gray-500">Add fields from the list below.</p>}
          <ul className="space-y-2">
            {fields.map((f, i) => (
              <li
                key={f.id} draggable
                onDragStart={() => setDragId(f.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(f.id)}
                onClick={() => setSelectedId(f.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer ${selectedId === f.id ? 'border-green-600 bg-green-50/40' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
              >
                <GripVertical size={15} className="text-gray-400 cursor-grab" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{f.label || 'Untitled'}{f.required && <span className="text-red-700"> *</span>}</p>
                  <p className="text-xs text-gray-500">{typeInfo(f.type).label}{f.maps_to ? ' · fills the register' : ''}{f.show_if ? ' · conditional' : ''}</p>
                </div>
                <button type="button" aria-label="Move up" disabled={i === 0} onClick={(e) => { e.stopPropagation(); move(i, -1); }} className="p-1 text-gray-500 disabled:opacity-30"><ArrowUp size={14} /></button>
                <button type="button" aria-label="Move down" disabled={i === fields.length - 1} onClick={(e) => { e.stopPropagation(); move(i, 1); }} className="p-1 text-gray-500 disabled:opacity-30"><ArrowDown size={14} /></button>
                <button type="button" aria-label="Duplicate" onClick={(e) => { e.stopPropagation(); duplicate(i); }} className="p-1 text-gray-500"><Copy size={14} /></button>
                <button type="button" aria-label="Remove" onClick={(e) => { e.stopPropagation(); remove(f.id); }} className="p-1 text-gray-500 hover:text-red-700"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600 mb-2">Add a field</p>
            <div className="flex flex-wrap gap-2">
              {FIELD_TYPES.map((t) => (
                <button key={t.type} type="button" onClick={() => add(t.type)} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50">{t.label}</button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          {selected ? <FieldEditor field={selected} fields={fields} onChange={(f) => setFields(fields.map((x) => (x.id === f.id ? f : x)))} /> : <p className="text-sm text-gray-500">Select a field to set it up.</p>}
        </Card>

        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Preview on a phone</p>
          <div className="mx-auto w-[320px] h-[600px] rounded-[2rem] border-8 border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-5 space-y-4">
              <h3 className="font-display text-xl font-semibold text-gray-900">{form.title || 'Form title'}</h3>
              {form.description && <p className="text-sm text-gray-600">{form.description}</p>}
              <FormRenderer fields={fields} answers={previewAnswers} onChange={setPreviewAnswers} errors={validateAnswers(fields, previewAnswers)} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {problems.length > 0 && <p className="text-sm text-amber-800 mr-auto">{problems[0]}</p>}
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
        <PrimaryButton disabled={problems.length > 0 || saving} onClick={() => onSave(form)}>{saving ? 'Saving…' : 'Save form'}</PrimaryButton>
      </div>
    </div>
  );
};

export default FormBuilder;
