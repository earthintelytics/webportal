import { useEffect, useState } from 'react';
import { API_BASE } from '../services/apiBase';

const cache = new Map(); // storage path -> object URL, for this page session

/**
 * A farmer photo kept in the organisation's private storage. It is fetched
 * through the API with the signed-in token (GET /smallholder/photos/file),
 * because an <img> cannot send the token and storage is not public.
 */
export function useSecurePhoto(path) {
  const [state, setState] = useState(() => (cache.has(path) ? { url: cache.get(path) } : { loading: !!path }));
  useEffect(() => {
    if (!path || cache.has(path)) return undefined;
    let live = true;
    fetch(`${API_BASE}/smallholder/photos/file?path=${encodeURIComponent(path)}`, { headers: { Authorization: `Bearer ${localStorage.getItem('fi_token') || ''}` } })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((b) => { const url = URL.createObjectURL(b); cache.set(path, url); if (live) setState({ url }); })
      .catch(() => { if (live) setState({ failed: true }); });
    return () => { live = false; };
  }, [path]);
  return state;
}

