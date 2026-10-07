/**
 * Copy text to the clipboard. Browsers only offer navigator.clipboard on
 * secure (https) pages, so on http the text is copied through a hidden text
 * box instead. Resolves when copied, rejects when the browser refuses.
 */
export async function copyText(text) {
  const value = String(text ?? '');
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(value); return; } catch { /* fall back below */ }
  }
  const box = document.createElement('textarea');
  box.value = value;
  box.setAttribute('readonly', '');
  box.style.position = 'fixed';
  box.style.top = '-1000px';
  box.style.opacity = '0';
  document.body.appendChild(box);
  const active = document.activeElement;
  box.select();
  box.setSelectionRange(0, value.length);
  let ok;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  document.body.removeChild(box);
  if (active && typeof active.focus === 'function') active.focus();
  if (!ok) throw new Error('Copy is blocked by the browser');
}
