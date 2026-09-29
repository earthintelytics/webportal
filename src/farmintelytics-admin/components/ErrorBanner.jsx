import React, { useState } from 'react';
import { AlertCircle, RefreshCw, X, Copy, Check } from 'lucide-react';

const ErrorBanner = ({ message, onDismiss, onRetry }) => {
  const [copied, setCopied] = useState(false);
  if (!message) return null;

  // Extract clean text and optional request ID
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
    const copyText = reqId ? `${text} (Request ID: ${reqId})` : text;
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      padding: '12px 16px',
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '12px',
      color: '#991b1b',
      fontSize: '13px',
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      boxShadow: 'none',
    }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '8px',
        background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <AlertCircle size={16} style={{ color: '#dc2626' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 600, color: '#991b1b', lineHeight: 1.4, wordBreak: 'break-word' }}>
          {text}
        </p>
        {reqId && (
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#b91c1c', fontFamily: 'var(--font-mono)' }}>
            Request ID: {reqId}
          </p>
        )}
      </div>
      <button
        onClick={handleCopy}
        title="Copy error message"
        style={{
          display: 'flex', alignItems: 'center', gap: '4px', background: '#ffffff',
          border: '1px solid #fca5a5', borderRadius: '8px', padding: '5px 9px',
          cursor: 'pointer', color: '#b91c1c', fontSize: '11px', fontWeight: 700, flexShrink: 0,
        }}
      >
        {copied ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px', background: '#dc2626',
            border: 'none', borderRadius: '8px', padding: '6px 12px',
            cursor: 'pointer', color: '#ffffff', fontSize: '11px', fontWeight: 700, flexShrink: 0,
          }}
        >
          <RefreshCw size={11} /> Retry
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#991b1b', padding: '4px', borderRadius: '6px',
            flexShrink: 0, display: 'flex', alignItems: 'center',
          }}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;
