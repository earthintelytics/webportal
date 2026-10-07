/**
 * Admin console activity: how many changes are in flight (for the top
 * progress bar) and a short message after each one (the "Saved" toast).
 * The admin API helpers report here, so every page gets it without code.
 */
const listeners = new Set();
let busy = 0;

const emit = (event) => listeners.forEach((fn) => fn(event, busy));

export const onAdminActivity = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

/** Wraps one change request: progress while it runs, a message when it ends. */
export async function trackChange(promise, { success = 'Saved', quiet = false } = {}) {
  busy += 1; emit({ type: 'busy' });
  try {
    const result = await promise;
    if (!quiet) emit({ type: 'done', tone: 'good', text: success });
    return result;
  } catch (e) {
    if (!quiet) emit({ type: 'done', tone: 'warning', text: `Not saved: ${e.message}` });
    throw e;
  } finally {
    busy -= 1; emit({ type: 'busy' });
  }
}
