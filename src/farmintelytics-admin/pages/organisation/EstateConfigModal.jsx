import { useEffect, useState } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { generateFarmConfig, fetchPipelineConfigContent, savePipelineConfig, deletePipelineConfig } from '../../../services/adminApi';
import { useConfirm } from '../../components/ConfirmProvider';
import { Button, Modal, Note, Loading } from '../../components/ui';

/**
 * The pipeline settings file for one estate ({farm_id}_config.yaml, read by
 * the scheduler). Generated from the estate's settings; editable here.
 */
const EstateConfigModal = ({ farm, onClose }) => {
  const confirm = useConfirm();
  const filename = `${farm.farm_id}_config.yaml`;
  const [content, setContent] = useState('');
  const [state, setState] = useState('loading'); // loading | none | ready
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let live = true;
    fetchPipelineConfigContent(filename)
      .then((d) => { if (live) { setContent(d.content); setState('ready'); } })
      .catch(() => { if (live) setState('none'); });
    return () => { live = false; };
  }, [filename]);

  const run = async (kind, fn) => {
    setBusy(kind); setError(''); setNotice('');
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  const generate = () => run('generate', async () => { const d = await generateFarmConfig(farm.farm_id); setContent(d.content); setState('ready'); setNotice("Made from the estate's current settings."); });
  // Basic checks before saving: not empty, and the estate's own id is in it.
  const save = () => {
    if (!content.trim()) { setError('The settings are empty. Use "Make from the estate" first.'); return; }
    if (!content.includes(farm.farm_id)) { setError(`These settings do not mention this estate (${farm.farm_id}). Make them again from the estate.`); return; }
    return run('save', async () => { await savePipelineConfig({ filename, content }); setNotice('Saved.'); });
  };
  const remove = async () => {
    if (!(await confirm(`Delete the pipeline settings for ${farm.farm_name}? The scheduler cannot run this estate until they are made again.`))) return;
    run('delete', async () => { await deletePipelineConfig(filename); setContent(''); setState('none'); setNotice('Deleted.'); });
  };

  return (
    <Modal size="lg" title="Pipeline settings" text={`${farm.farm_name} · ${filename}`} onClose={onClose}
      footer={state === 'ready' ? <>
        <Button variant="danger" onClick={remove} disabled={!!busy}><Trash2 size={14} />Delete</Button>
        <Button variant="secondary" onClick={generate} disabled={!!busy}><Sparkles size={14} />{busy === 'generate' ? 'Making…' : 'Make again from settings'}</Button>
        <Button onClick={save} disabled={!!busy}>{busy === 'save' ? 'Saving…' : 'Save'}</Button>
      </> : <Button variant="secondary" onClick={onClose}>Close</Button>}>
      {error && <Note tone="warning">{error}</Note>}
      {notice && <Note tone="good">{notice}</Note>}
      {state === 'loading' && <Loading />}
      {state === 'none' && (
        <div className="text-center py-8 space-y-4">
          <p className="text-sm text-gray-600">This estate has no pipeline settings yet.</p>
          <Button onClick={generate} disabled={!!busy}><Sparkles size={14} />{busy ? 'Making…' : "Make from the estate's settings"}</Button>
        </div>
      )}
      {state === 'ready' && (
        <textarea value={content} onChange={(e) => setContent(e.target.value)} spellCheck={false}
          className="w-full min-h-[340px] p-4 rounded-xl border border-gray-300 bg-gray-50 font-mono text-xs text-gray-800 outline-none focus:border-green-600 resize-y" />
      )}
    </Modal>
  );
};

export default EstateConfigModal;
