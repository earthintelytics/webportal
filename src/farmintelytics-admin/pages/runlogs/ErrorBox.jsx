import { useState } from 'react';
import { AlertTriangle, Copy, Check } from 'lucide-react';
import { parseError } from './logHelpers';
import { copyText } from '../../../utils/copyText';

/** An error: the one line that matters, and the full text to copy or expand. */
const ErrorBox = ({ error, compact = false }) => {
  const [copied, setCopied] = useState(false);
  const e = parseError(error);
  if (!e) return null;
  const copy = (ev) => {
    ev.stopPropagation();
    copyText(e.full).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
  };
  const copyBtn = (
    <button type="button" onClick={copy} className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md border border-red-200 bg-white text-xs font-semibold text-red-700">
      {copied ? <><Check size={12} />Copied</> : <><Copy size={12} />Copy</>}
    </button>
  );
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs text-red-800 max-w-full">
        <AlertTriangle size={13} className="shrink-0" />
        <span className="truncate font-mono flex-1">{e.title}</span>
        {copyBtn}
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-red-200 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-red-50 border-b border-red-200">
        <span className="flex items-center gap-2 text-sm font-semibold text-red-800"><AlertTriangle size={15} />{e.title}</span>
        {copyBtn}
      </div>
      <pre className="m-0 px-4 py-3 bg-gray-50 text-xs font-mono text-gray-800 whitespace-pre-wrap break-words max-h-60 overflow-auto">{e.full}</pre>
    </div>
  );
};

export default ErrorBox;
