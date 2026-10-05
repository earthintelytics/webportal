import { useCallback, useState } from 'react';
import { fetchForms, fetchSubmissions, reviewSubmission } from '../../services/formsApi';
import { PageHeader, Card, NotConnectedNote, ErrorNote, EmptyState, StatusPill, Modal, PrimaryButton, SecondaryButton } from '../../components/page/PageKit';
import { inputCls, useLoader } from '../../components/page/useLoader';
import { typeInfo } from './fieldTypes';

const STATUS = {
  new: ['To review', 'info'],
  approved: ['Approved', 'good'],
  rejected: ['Rejected', 'neutral'],
  changes_requested: ['Changes asked', 'warning'],
};

const answerText = (field, v) => {
  if (v == null || v === '') return '—';
  if (field.type === 'gps_point') return `${v.lat?.toFixed(6)}, ${v.lon?.toFixed(6)}`;
  if (field.type === 'boundary_walk') return `${v.length} corners`;
  if (field.type === 'signature') return 'Signed';
  return Array.isArray(v) ? v.join(', ') : String(v);
};

/**
 * Answers farmers sent through form links. Approving copies mapped answers
 * into the member and parcel register and starts the parcel checks.
 */
const SubmissionsPage = ({ formId: initialFormId }) => {
  const [chosenForm, setFormId] = useState(initialFormId || '');
  const [status, setStatus] = useState('new');
  const [open, setOpen] = useState(null);

  // The forms, then the answers to the chosen one (the first form until one is chosen).
  const load = useCallback(async () => {
    const list = await fetchForms();
    const forms = Array.isArray(list) ? list : [];
    const formId = chosenForm || forms[0]?.id || '';
    const rows = formId ? await fetchSubmissions(formId, { status }) : [];
    return { forms, formId, rows: Array.isArray(rows) ? rows : [] };
  }, [chosenForm, status]);
  const { data, state, error, reload } = useLoader(load);
  const forms = data?.forms || [];
  const formId = data?.formId || chosenForm;
  const rows = data?.rows || [];
  const form = forms.find((f) => f.id === formId);

  return (
    <div className="p-10 space-y-8">
      <PageHeader title="Form answers" text="Review what farmers sent. Approve to add them to the member register, ask for changes, or reject." />
      {state === 'not_connected' && <NotConnectedNote what="Forms" />}
      {state === 'error' && <ErrorNote message={error} onRetry={reload} />}

      {forms.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <select className={`${inputCls} w-auto`} value={formId} onChange={(e) => setFormId(e.target.value)}>
            {forms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
          </select>
          <select className={`${inputCls} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
            {Object.entries(STATUS).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}
            <option value="all">All answers</option>
          </select>
        </div>
      )}

      {state === 'ready' && !forms.length && <EmptyState title="No forms yet" text="Create a form on the Forms page and send its link to farmers." />}
      {state === 'ready' && forms.length > 0 && rows.length === 0 && <EmptyState title="Nothing here" text="No answers with this status yet." />}

      {rows.length > 0 && form && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
              <tr><th className="px-5 py-3">Sent</th><th className="px-5 py-3">First answer</th><th className="px-5 py-3">Photos</th><th className="px-5 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((s) => {
                const first = form.fields.find((f) => !typeInfo(f.type).noAnswer);
                const [label, tone] = STATUS[s.status] || [s.status, 'neutral'];
                return (
                  <tr key={s.id} onClick={() => setOpen(s)} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700">{new Date(s.submitted_at).toLocaleString()}</td>
                    <td className="px-5 py-3 text-gray-900">{first ? answerText(first, s.answers?.[first.id]) : '—'}</td>
                    <td className="px-5 py-3 font-mono text-gray-700">{(s.photos || []).length}</td>
                    <td className="px-5 py-3"><StatusPill tone={tone}>{label}</StatusPill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {open && form && <SubmissionDialog form={form} submission={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); reload(); }} />}
    </div>
  );
};

const SubmissionDialog = ({ form, submission, onClose, onDone }) => {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState(null);
  const act = async (action) => {
    setBusy(true); setError('');
    try { await reviewSubmission(submission.id, action, note); onDone(); } catch (e) { setError(e.message); setBusy(false); }
  };
  const pending = submission.status === 'new' || submission.status === 'changes_requested';
  return (
    <Modal wide title={form.title} onClose={onClose} footer={pending ? <>
      <SecondaryButton disabled={busy} onClick={() => act('reject')}>Reject</SecondaryButton>
      <SecondaryButton disabled={busy || !note.trim()} onClick={() => act('request-changes')}>Ask for changes</SecondaryButton>
      <PrimaryButton disabled={busy} onClick={() => act('approve')}>Approve</PrimaryButton>
    </> : <SecondaryButton onClick={onClose}>Close</SecondaryButton>}>
      {error && <ErrorNote message={error} />}
      <dl className="divide-y divide-gray-100 border border-gray-200 rounded-xl">
        {form.fields.filter((f) => !typeInfo(f.type).noAnswer && f.type !== 'photo').map((f) => (
          <div key={f.id} className="px-4 py-2.5 grid grid-cols-2 gap-4 text-sm">
            <dt className="text-gray-500">{f.label}</dt>
            <dd className="text-gray-900">{answerText(f, submission.answers?.[f.id])}{f.maps_to && <span className="block text-xs text-gray-500">Goes to the register</span>}</dd>
          </div>
        ))}
      </dl>
      {(submission.photos || []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {submission.photos.map((src) => <button key={src} onClick={() => setPhoto(src)}><img src={src} alt="" className="w-24 h-24 object-cover rounded-lg border border-gray-200" /></button>)}
        </div>
      )}
      {pending && <textarea className={inputCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note to keep with the decision (needed when asking for changes)" />}
      {photo && (
        <div className="fixed inset-0 z-[1100] bg-slate-900/70 flex items-center justify-center p-6" onClick={() => setPhoto(null)}>
          <img src={photo} alt="" className="max-h-full max-w-full rounded-xl" />
        </div>
      )}
    </Modal>
  );
};

export default SubmissionsPage;
