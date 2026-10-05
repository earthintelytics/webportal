import { useState } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { fetchForms, createForm, saveForm } from '../../services/formsApi';
import { PageHeader, Card, NotConnectedNote, ErrorNote, EmptyState, PrimaryButton, SecondaryButton } from '../../components/page/PageKit';
import { useLoader } from '../../components/page/useLoader';
import FormBuilder from './FormBuilder';
import FormLinks from './FormLinks';

/**
 * Forms: the co-operative designs its own forms (what it asks farmers, with
 * photos and GPS), sends a link, and reviews answers on the Answers page.
 */
const FormsPage = ({ onOpenAnswers }) => {
  const { data, state, error, reload } = useLoader(fetchForms);
  const forms = Array.isArray(data) ? data : [];
  const [editing, setEditing] = useState(null); // null | 'new' | form
  const [tab, setTab] = useState('design');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const save = async (form) => {
    setSaving(true); setSaveError('');
    try {
      const saved = form.id ? await saveForm(form.id, form) : await createForm(form);
      setEditing(saved); setTab('links'); reload();
    } catch (e) { setSaveError(e.message); }
    setSaving(false);
  };

  if (editing) {
    const isNew = editing === 'new';
    return (
      <div className="p-10 space-y-6">
        <button onClick={() => { setEditing(null); setTab('design'); }} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"><ArrowLeft size={15} />All forms</button>
        <PageHeader title={isNew ? 'New form' : editing.title} />
        {!isNew && (
          <nav className="flex gap-8 border-b border-gray-200">
            {[['design', 'Design'], ['links', 'Links']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={`-mb-px pb-3 border-b-2 text-sm font-medium ${tab === id ? 'border-green-600 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>{label}</button>
            ))}
            <button onClick={() => onOpenAnswers?.(editing.id)} className="-mb-px pb-3 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-800">Answers</button>
          </nav>
        )}
        {(isNew || tab === 'design') && <FormBuilder key={isNew ? 'new' : editing.id} initial={isNew ? undefined : editing} onSave={save} onCancel={() => setEditing(null)} saving={saving} error={saveError} />}
        {!isNew && tab === 'links' && <FormLinks form={editing} />}
      </div>
    );
  }

  return (
    <div className="p-10 space-y-8">
      <PageHeader
        title="Forms"
        text="Design the forms your farmers fill in: questions, photos, location and field boundaries. Send a link; approved answers fill the member register."
        actions={<PrimaryButton onClick={() => setEditing('new')} disabled={state === 'not_connected'}><Plus size={15} />New form</PrimaryButton>}
      />
      {state === 'not_connected' && <NotConnectedNote what="Forms" />}
      {state === 'error' && <ErrorNote message={error} onRetry={reload} />}
      {state === 'ready' && forms.length === 0 && (
        <EmptyState title="No forms yet" text="Start with a member registration form: name, phone, group, a photo and a walked boundary." action={<PrimaryButton onClick={() => setEditing('new')}><Plus size={15} />New form</PrimaryButton>} />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {forms.map((f) => (
          <Card key={f.id} className="p-5 flex flex-col gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-gray-900">{f.title}</h3>
              {f.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{f.description}</p>}
            </div>
            <p className="text-xs text-gray-500">{(f.fields || []).length} fields · {f.submissions_count ?? 0} answers{f.updated_at ? ` · changed ${new Date(f.updated_at).toLocaleDateString()}` : ''}</p>
            <div className="flex gap-2 mt-auto">
              <SecondaryButton onClick={() => { setEditing(f); setTab('design'); }}>Edit</SecondaryButton>
              <SecondaryButton onClick={() => { setEditing(f); setTab('links'); }}>Links</SecondaryButton>
              <SecondaryButton onClick={() => onOpenAnswers?.(f.id)}>Answers</SecondaryButton>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FormsPage;
