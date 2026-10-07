import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Link2, QrCode } from 'lucide-react';
import { fetchLinks, createLink, updateLink } from '../../services/formsApi';
import { Card, Field, PrimaryButton, SecondaryButton, StatusPill, ErrorNote, Modal } from '../../components/page/PageKit';
import { inputCls, stateFromError } from '../../components/page/useLoader';

const publicUrl = (link) => link.url || `${window.location.origin}/f/${link.token}`;

/** Links farmers open on their phones; the co-op can close a link at any time. */
const FormLinks = ({ form }) => {
  const [links, setLinks] = useState([]);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({ expires_at: '', max_submissions: '' });
  const [qr, setQr] = useState(null);
  const [copied, setCopied] = useState(null);

  const load = useCallback(() => {
    fetchLinks(form.id)
      .then((l) => { setLinks(Array.isArray(l) ? l : []); setState('ready'); })
      .catch((e) => { setState(stateFromError(e)); setError(e.message); });
  }, [form.id]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setError('');
    const today = new Date().toISOString().slice(0, 10);
    if (draft.expires_at && draft.expires_at < today) { setError('The closing date is in the past. Choose today or a later date.'); return; }
    if (draft.max_submissions !== '' && (!Number.isInteger(Number(draft.max_submissions)) || Number(draft.max_submissions) < 1)) { setError('Most answers must be a whole number of 1 or more, or left empty.'); return; }
    try {
      await createLink(form.id, { open: true, expires_at: draft.expires_at || null, max_submissions: draft.max_submissions ? Number(draft.max_submissions) : null });
      setDraft({ expires_at: '', max_submissions: '' });
      load();
    } catch (e) { setError(e.message); }
  };
  const toggle = async (link) => {
    setError('');
    try { await updateLink(link.id, { open: !link.open }); load(); } catch (e) { setError(e.message); }
  };
  const copy = async (link) => {
    try { await navigator.clipboard.writeText(publicUrl(link)); setCopied(link.id); setTimeout(() => setCopied(null), 1500); } catch { setError('Copy failed: select the link and copy it.'); }
  };
  const showQr = async (link) => setQr({ link, src: await QRCode.toDataURL(publicUrl(link), { width: 320, margin: 1 }) });

  if (state === 'not_connected') return <p className="text-sm text-gray-500">Form links are not connected yet.</p>;

  return (
    <div className="space-y-5">
      {error && <ErrorNote message={error} />}
      <Card className="p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-800">New link</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <Field label="Closes on (optional)"><input type="date" min={new Date().toISOString().slice(0, 10)} className={inputCls} value={draft.expires_at} onChange={(e) => setDraft({ ...draft, expires_at: e.target.value })} /></Field>
          <Field label="Most answers (optional)"><input type="number" min={1} className={inputCls} value={draft.max_submissions} onChange={(e) => setDraft({ ...draft, max_submissions: e.target.value })} /></Field>
          <PrimaryButton onClick={create}><Link2 size={15} />Create link</PrimaryButton>
        </div>
        <p className="text-xs text-gray-500">Anyone with the link can fill the form on a phone, without an account. Close the link when you no longer want answers.</p>
      </Card>

      {links.length === 0 && state === 'ready' && <p className="text-sm text-gray-500">No links yet.</p>}
      {links.map((link) => (
        <Card key={link.id} className="p-4 flex flex-wrap items-center gap-3">
          <StatusPill tone={link.open ? 'good' : 'neutral'}>{link.open ? 'Open' : 'Closed'}</StatusPill>
          <code className="text-xs text-gray-700 break-all flex-1 min-w-[200px]">{publicUrl(link)}</code>
          <span className="text-xs text-gray-500">{link.submissions_count ?? 0} answers{link.expires_at ? ` · closes ${link.expires_at.slice(0, 10)}` : ''}</span>
          <SecondaryButton onClick={() => copy(link)}><Copy size={14} />{copied === link.id ? 'Copied' : 'Copy'}</SecondaryButton>
          <SecondaryButton onClick={() => showQr(link)}><QrCode size={14} />QR code</SecondaryButton>
          <SecondaryButton onClick={() => toggle(link)}>{link.open ? 'Close link' : 'Reopen'}</SecondaryButton>
        </Card>
      ))}

      {qr && (
        <Modal title={form.title} onClose={() => setQr(null)} footer={<>
          <SecondaryButton onClick={() => setQr(null)}>Close</SecondaryButton>
          <a href={qr.src} download={`${form.title || 'form'}-qr.png`} className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-700 hover:bg-green-800">Download</a>
        </>}>
          <img src={qr.src} alt="QR code for the form link" className="mx-auto w-64 h-64" />
          <p className="text-xs text-gray-500 text-center break-all">{publicUrl(qr.link)}</p>
        </Modal>
      )}
    </div>
  );
};

export default FormLinks;
