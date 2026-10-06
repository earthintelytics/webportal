import { useState } from 'react';
import { fetchForms, createForm, addEntry } from '../../../services/formsApi';
import { starterRegistrationForm, validateAnswers } from '../../forms/fieldTypes';
import { submissionBody } from '../../forms/submission';
import { consentText, consentRecord } from '../../forms/consent';
import FormRenderer from '../../forms/FormRenderer';
import { Modal, PrimaryButton, SecondaryButton, ErrorNote, NotConnectedNote } from '../../../components/page/PageKit';
import { useLoader } from '../../../components/page/useLoader';

const registrationForm = (forms) => (Array.isArray(forms) ? forms : []).find((f) => f.purpose === 'registration') || null;

/**
 * Add member: fills the co-operative's own registration form (the one it
 * designed under Registration forms, the same form farmers get by link), so
 * every member and parcel enters the register the same way.
 */
const AddMemberEntry = ({ onClose, onSaved, onDesign }) => {
  const { data, state, error, reload } = useLoader(fetchForms);
  const form = registrationForm(data);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const org = localStorage.getItem('fi_display_name') || '';

  const createStarter = async () => {
    setBusy(true); setSaveError('');
    try { await createForm(starterRegistrationForm()); reload(); } catch (e) { setSaveError(e.message); }
    setBusy(false);
  };

  const save = async () => {
    const errs = validateAnswers(form.fields, answers);
    setErrors(errs);
    if (Object.keys(errs).length) { setSaveError('Some answers need attention.'); return; }
    if (!agreed) { setSaveError('Confirm that the farmer agreed before saving.'); return; }
    setBusy(true); setSaveError('');
    try { await addEntry(form.id, submissionBody(answers, consentRecord(org, `staff:${localStorage.getItem('fi_email') || ''}`))); onSaved(); } catch (e) { setSaveError(e.message); setBusy(false); }
  };

  return (
    <Modal
      wide
      title={form ? form.title : 'Add member'}
      onClose={onClose}
      footer={form ? <>
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save member'}</PrimaryButton>
      </> : <SecondaryButton onClick={onClose}>Close</SecondaryButton>}
    >
      {state === 'not_connected' && <NotConnectedNote what="Registration forms" />}
      {state === 'error' && <ErrorNote message={error} onRetry={reload} />}
      {saveError && <ErrorNote message={saveError} />}
      {state === 'ready' && !form && (
        <div className="space-y-4 text-sm text-gray-700">
          <p>Members are added with your registration form, the same one farmers fill from a link. You do not have one yet.</p>
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={createStarter} disabled={busy}>Start from our registration form</PrimaryButton>
            <SecondaryButton onClick={onDesign}>Design my own</SecondaryButton>
          </div>
          <p className="text-xs text-gray-500">The starting form asks for name, phone, national ID, group, a photo, the crop, the year planted and the farm boundary. You can change every question.</p>
        </div>
      )}
      {form && (
        <>
          {form.description && <p className="text-sm text-gray-600">{form.description}</p>}
          <FormRenderer fields={form.fields} answers={answers} onChange={setAnswers} errors={errors} />
          <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700">
            <input type="checkbox" className="mt-1" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span><strong>The farmer agreed to this:</strong> “{consentText(org)}”</span>
          </label>
        </>
      )}
    </Modal>
  );
};

export default AddMemberEntry;
