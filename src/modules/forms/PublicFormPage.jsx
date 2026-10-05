import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPublicForm, submitPublicForm } from '../../services/formsApi';
import FormRenderer from './FormRenderer';
import { validateAnswers } from './fieldTypes';

const draftKey = (token) => `fi_form_draft:${token}`;
const readDraft = (token) => { try { return JSON.parse(localStorage.getItem(draftKey(token)) || '{}'); } catch { return {}; } };

/**
 * The page a farmer opens from a co-operative's link: no account, phone-first.
 * Answers (not photos) are kept on the phone until sent, so a lost signal does
 * not lose the work.
 */
const PublicFormPage = () => {
  const { token } = useParams();
  const [form, setForm] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | closed | missing | sent
  const [answers, setAnswers] = useState(() => readDraft(token));
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    fetchPublicForm(token)
      .then((f) => { setForm(f); setState('ready'); })
      .catch((e) => setState(e.status === 410 ? 'closed' : 'missing'));
  }, [token]);

  // Keep a draft of everything except photos (files cannot be stored this way).
  const draftable = useMemo(() => Object.fromEntries(Object.entries(answers).filter(([, v]) => !(Array.isArray(v) && v[0] instanceof File))), [answers]);
  useEffect(() => { try { localStorage.setItem(draftKey(token), JSON.stringify(draftable)); } catch { /* storage full or blocked */ } }, [draftable, token]);

  const send = async () => {
    const errs = validateAnswers(form.fields, answers);
    setErrors(errs);
    if (Object.keys(errs).length) { setSendError('Some answers need attention.'); return; }
    setSending(true); setSendError('');
    const body = new FormData();
    const plain = {};
    Object.entries(answers).forEach(([id, v]) => {
      if (Array.isArray(v) && v[0] instanceof File) v.forEach((file, i) => body.append(`photo:${id}`, file, `${id}_${i + 1}_${file.name}`));
      else plain[id] = v;
    });
    body.append('answers', JSON.stringify(plain));
    body.append('device_time', new Date().toISOString());
    try {
      await submitPublicForm(token, body);
      localStorage.removeItem(draftKey(token));
      setState('sent');
    } catch (e) {
      setSendError(e.status === 410 ? 'This form has been closed.' : e.name === 'NotConnectedError' ? 'No connection. Your answers are kept on this phone; try again when you have signal.' : e.message);
    }
    setSending(false);
  };

  const shell = (children) => (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">{children}</div>
    </div>
  );

  if (state === 'loading') return shell(<p className="text-sm text-gray-500">Loading the form…</p>);
  if (state === 'closed') return shell(<Message title="This form is closed" text="The organisation that sent it is no longer collecting answers." />);
  if (state === 'missing') return shell(<Message title="Form not found" text="Check the link with the organisation that sent it." />);
  if (state === 'sent') return shell(<Message title="Thank you" text="Your answers were sent. The organisation will review them." />);

  return shell(
    <>
      <header className="flex items-center gap-3">
        {form.logo_url && <img src={form.logo_url} alt="" className="w-10 h-10 object-contain rounded-lg border border-gray-200 bg-white" />}
        <p className="text-sm text-gray-600">{form.organisation_name}</p>
      </header>
      <div>
        <h1 className="font-display text-2xl font-semibold">{form.title}</h1>
        {form.description && <p className="text-sm text-gray-600 mt-2">{form.description}</p>}
      </div>
      <FormRenderer fields={form.fields} answers={answers} onChange={setAnswers} errors={errors} />
      {sendError && <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{sendError}</p>}
      <button onClick={send} disabled={sending} className="w-full py-3.5 rounded-xl text-base font-semibold text-white bg-green-700 active:bg-green-800 disabled:opacity-50">{sending ? 'Sending…' : 'Send answers'}</button>
      <p className="text-xs text-gray-500 text-center">Sent with FarmIntelytics</p>
    </>,
  );
};

const Message = ({ title, text }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-7 mt-10 text-center">
    <h1 className="font-display text-2xl font-semibold">{title}</h1>
    <p className="text-sm text-gray-600 mt-2">{text}</p>
  </div>
);

export default PublicFormPage;
