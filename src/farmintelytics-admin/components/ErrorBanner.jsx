import { useState } from 'react';
import { AlertCircle, RefreshCw, X, Copy, Check } from 'lucide-react';

/** One error message for the admin pages: what went wrong, copy, try again, close. */
const ErrorBanner = ({ message, onDismiss, onRetry }) => {
  const [copied, setCopied] = useState(false);
  if (!message) return null;

  let text = typeof message === 'string' ? message : (message?.message || String(message));
  let reqId = message?.requestId || message?.meta?.request_id || null;
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text);
      text = parsed.message || parsed.error?.message || parsed.error || parsed.detail || text;
      reqId = reqId || parsed.meta?.request_id;
    } catch {
      // keep text
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(reqId ? `${text} (Request ID: ${reqId})` : text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div role="alert" className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <AlertCircle size={18} className="shrink-0 text-red-700" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold leading-snug break-words">{text}</p>
        {reqId && <p className="mt-1 text-xs font-mono text-red-700">Request ID: {reqId}</p>}
      </div>
      <button type="button" onClick={handleCopy} className="inline-flex items-center gap-1 shrink-0 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">
        {copied ? <Check size={12} className="text-green-700" /> : <Copy size={12} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      {onRetry && (
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800">
          <RefreshCw size={12} /> Try again
        </button>
      )}
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Close" className="shrink-0 rounded-md p-1 text-red-700 hover:bg-red-100">
          <X size={15} />
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;
