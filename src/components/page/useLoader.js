import { useCallback, useEffect, useState } from 'react';

/**
 * Loads data for a page and tracks its state:
 *   state  loading | ready | not_connected (endpoint not built yet) | error
 * `reload()` fetches again. `load` must be stable (useCallback) or the page
 * reloads on every render.
 */
export function useLoader(load) {
  const [result, setResult] = useState({ state: 'loading', data: null, error: '' });
  const [run, setRun] = useState(0);

  useEffect(() => {
    let live = true;
    load()
      .then((data) => { if (live) setResult({ state: 'ready', data, error: '' }); })
      .catch((e) => { if (live) setResult({ state: e?.name === 'NotConnectedError' ? 'not_connected' : 'error', data: null, error: e?.message || 'Something went wrong' }); });
    return () => { live = false; };
  }, [load, run]);

  const reload = useCallback(() => {
    setResult((r) => ({ ...r, state: 'loading' }));
    setRun((n) => n + 1);
  }, []);

  return { ...result, reload };
}

/** Classifies an error the same way as useLoader. */
export const stateFromError = (e) => (e?.name === 'NotConnectedError' ? 'not_connected' : 'error');

export const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 focus:border-green-600 focus:outline-none';
