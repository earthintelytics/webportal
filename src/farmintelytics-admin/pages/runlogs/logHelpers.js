/** Logs page: status words and tones, and readable errors from tracebacks. */

export const STATUS = {
  pending: ['Waiting', 'warning'],
  processing: ['Running', 'info'],
  completed: ['Done', 'good'],
  success: ['Done', 'good'],
  partial: ['Partly done', 'warning'],
  failed: ['Failed', 'critical'],
};
export const statusOf = (s) => STATUS[String(s || 'pending').toLowerCase()] || [s || 'Unknown', 'neutral'];
export const logStatus = (log) => (log.status || (log.error ? 'failed' : 'completed')).toLowerCase();

/** The line that says what went wrong, plus the full text for copying. */
export function parseError(raw) {
  if (!raw) return null;
  let text = String(raw).trim();
  if (/^[[{]/.test(text)) {
    try {
      const p = JSON.parse(text);
      const v = p.message || p.error || p.detail;
      if (v) text = typeof v === 'string' ? v : JSON.stringify(v);
    } catch { /* keep the text */ }
  }
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd()).filter(Boolean);
  const title = [...lines].reverse().find((l) => /Error:|Exception:|HTTP |Failed:/.test(l)) || lines[lines.length - 1] || text;
  return { title: title.replace(/^Traceback.*$/i, '').trim() || text, full: text };
}

export const fmtTime = (t) => (t ? new Date(t).toLocaleString() : '—');
