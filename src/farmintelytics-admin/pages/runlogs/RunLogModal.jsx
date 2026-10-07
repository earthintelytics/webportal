import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Modal, Button, Pill, Tabs } from '../../components/ui';
import ErrorBox from './ErrorBox';
import { statusOf, logStatus, fmtTime } from './logHelpers';
import { copyText } from '../../../utils/copyText';

const MAIN = ['job_name', 'timestamp', 'duration', 'plots_processed', 'error', 'status'];

/** One pipeline run record: summary with the error first, then every field, then the raw record. */
const RunLogModal = ({ log, onClose }) => {
  const [tab, setTab] = useState('summary');
  const [copied, setCopied] = useState(false);
  const record = Object.fromEntries(Object.entries(log).filter(([k]) => k !== '_minio_path'));
  const [label, tone] = statusOf(logStatus(log));
  const copy = () => copyText(JSON.stringify(record, null, 2)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});

  return (
    <Modal size="lg" title={log.job_name || 'Pipeline run'} text={log._minio_path} onClose={onClose}
      footer={<><Button variant="secondary" onClick={copy}>{copied ? <><Check size={14} />Copied</> : <><Copy size={14} />Copy record</>}</Button><Button onClick={onClose}>Close</Button></>}>
      <div className="flex items-center gap-3"><Pill tone={tone}>{label}</Pill><span className="text-sm text-gray-500">{fmtTime(log.timestamp)}</span></div>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'summary', label: 'Summary' }, { id: 'raw', label: 'Raw record' }]} />
      {tab === 'summary' ? (
        <>
          {log.error && <ErrorBox error={log.error} />}
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
            {[['Job', log.job_name || '—'], ['When', fmtTime(log.timestamp)], ['Took', log.duration != null ? `${Number(log.duration).toFixed(1)} s` : '—'], ['Blocks processed', log.plots_processed ?? '—']].map(([k, v]) => (
              <div key={k}><dt className="text-xs text-gray-500">{k}</dt><dd className="text-sm font-semibold text-gray-900 mt-0.5">{v}</dd></div>
            ))}
          </dl>
          <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
            {Object.entries(record).filter(([k]) => !MAIN.includes(k)).map(([k, v]) => (
              <div key={k} className="grid grid-cols-3 gap-4 px-4 py-2 text-xs">
                <span className="font-mono text-gray-500">{k}</span>
                <span className="col-span-2 font-mono text-gray-900 break-all">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <pre className="m-0 p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-800 whitespace-pre-wrap break-words max-h-[55vh] overflow-auto">{JSON.stringify(record, null, 2)}</pre>
      )}
    </Modal>
  );
};

export default RunLogModal;
