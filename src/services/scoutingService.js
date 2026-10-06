import { redirectToTenantSignIn } from './session';
/**
 * scoutingService.js
 * Offline-first ground scouting and closed-loop anomaly management service.
 * Supports localStorage queuing, background synchronization, and alert workflow transitions.
 */

import { tenantKey } from './session';
import { API_BASE } from './apiBase';


// Offline caches are kept per organisation, so another user signing in on the
// same device never syncs or sees this organisation's observations.
const OFFLINE_QUEUE = 'fi_scouting_offline_queue';
const OFFLINE_OBSERVATIONS = 'fi_scouting_local_cache';

function handleTenantAuthFailure() {
  redirectToTenantSignIn();
}

class OfflineError extends Error {}

/**
 * Network failure -> OfflineError (the action is queued); a refusal from the
 * server -> Error with its message (shown, never queued: retrying cannot help).
 */
async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const token = localStorage.getItem('fi_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new OfflineError('No connection');
  }
  if (res.status === 401 && !path.includes('/auth/login')) handleTenantAuthFailure();
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try { const d = await res.json(); msg = d.detail?.[0]?.msg || d.detail || d.message || msg; } catch { /* not JSON */ }
    throw new Error(typeof msg === 'string' ? msg : `Error ${res.status}`);
  }
  return res.json();
}

const me = () => localStorage.getItem('fi_full_name') || localStorage.getItem('fi_email') || '';

/** Past ground observations for a block or alert; the local copies when offline. */
export async function fetchScoutingObservations(plotId = null, alertId = null) {
  const params = new URLSearchParams();
  if (plotId) params.append('plot_id', plotId);
  if (alertId) params.append('alert_id', alertId);
  const qs = params.toString() ? `?${params.toString()}` : '';
  try {
    return await apiFetch(`/scouting/observations${qs}`);
  } catch (err) {
    if (err instanceof OfflineError) return getCachedObservations();
    throw err;
  }
}

// One alert action: sent now, or queued (in the server's own shape) when offline.
async function alertAction(type, alertId, path, body, queuedMessage) {
  try {
    return await apiFetch(path, { method: 'POST', ...(body ? { body: JSON.stringify(body) } : {}) });
  } catch (err) {
    if (!(err instanceof OfflineError)) throw err;
    queueOfflineAction({ type, alertId, path, body, timestamp: new Date().toISOString() });
    return { status: 'queued_offline', alert_id: alertId, message: queuedMessage };
  }
}

/** Assign a field scout to an alert. */
export const assignScout = (alertId, { scoutName, scoutContact = '', actionDeadline = null, notes = '' }) =>
  alertAction('ASSIGN_SCOUT', alertId, `/alerts/${alertId}/assign`,
    { scout_name: scoutName, scout_contact: scoutContact, action_deadline: actionDeadline, notes },
    'No connection: the assignment is saved on this device and sent when you are back online.');

/** Resolve an alert with what was found on the ground. */
export const resolveAlert = (alertId, { groundTruthCategory, resolutionNotes, resolvedBy = null }) =>
  alertAction('RESOLVE_ALERT', alertId, `/alerts/${alertId}/resolve`,
    { ground_truth_category: groundTruthCategory, resolution_notes: resolutionNotes, resolved_by: resolvedBy || me() || null },
    'No connection: the resolution is saved on this device and sent when you are back online.');

/** Dismiss an alert. */
export const dismissAlert = (alertId) =>
  alertAction('DISMISS_ALERT', alertId, `/alerts/${alertId}/dismiss`, null,
    'No connection: the dismissal is saved on this device and sent when you are back online.');

/**
 * Log a ground observation. Sent now when online; kept on this device and
 * sent later only when there is no connection. Nothing is assumed: values the
 * scout did not give stay empty.
 */
export async function submitScoutingObservation(observation) {
  const payload = {
    plot_id: observation.plotId,
    alert_id: observation.alertId || null,
    scout_name: observation.scoutName || me(),
    scout_contact: observation.scoutContact || '',
    latitude: observation.latitude ?? null,
    longitude: observation.longitude ?? null,
    crop_stage: observation.cropStage || null,
    canopy_health_score: observation.canopyHealthScore ?? null,
    pest_disease_detected: Boolean(observation.pestDiseaseDetected),
    finding_type: observation.findingType || 'normal',
    notes: observation.notes || '',
    photo_url: observation.photoUrl || null,
    observed_at: observation.observedAt || new Date().toISOString(),
  };
  if (!payload.scout_name) throw new Error('Enter the name of the person who scouted.');
  cacheLocalObservation(payload);
  try {
    const serverResult = await apiFetch('/scouting/create', { method: 'POST', body: JSON.stringify(payload) });
    return { success: true, synced: true, observation: serverResult };
  } catch (err) {
    if (!(err instanceof OfflineError)) throw err;
    queueOfflineObservation(payload);
    return { success: true, synced: false, queued: true };
  }
}

/**
 * Sends everything saved on this device. Items that arrive are removed; items
 * the server refuses are removed and reported (they would never succeed);
 * items that could not be sent for lack of connection stay for next time.
 * Returns { syncedCount, refused: [message], remaining }.
 */
export async function syncOfflineQueue() {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0, refused: [], remaining: 0 };
  const keep = [];
  const refused = [];
  let syncedCount = 0;

  const obs = queue.filter((i) => i.type === 'OBSERVATION');
  if (obs.length) {
    try {
      const resp = await apiFetch('/scouting/sync', { method: 'POST', body: JSON.stringify({ observations: obs.map((i) => i.payload) }) });
      syncedCount += resp.synced_count ?? obs.length;
    } catch (err) {
      if (err instanceof OfflineError) keep.push(...obs);
      else refused.push(`${obs.length} observation${obs.length > 1 ? 's' : ''}: ${err.message}`);
    }
  }

  for (const act of queue.filter((i) => i.type !== 'OBSERVATION')) {
    if (!act.path) { refused.push(`An old saved action (${act.type}) could not be sent; please do it again.`); continue; }
    try {
      await apiFetch(act.path, { method: 'POST', ...(act.body ? { body: JSON.stringify(act.body) } : {}) });
      syncedCount++;
    } catch (err) {
      if (err instanceof OfflineError) keep.push(act);
      else refused.push(`${act.type.replace('_', ' ').toLowerCase()} on alert ${act.alertId}: ${err.message}`);
    }
  }

  saveOfflineQueue(keep);
  return { syncedCount, refused, remaining: keep.length };
}

// ─── Local Storage Helpers ──────────────────────────────────────────────────

function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(tenantKey(OFFLINE_QUEUE));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function queueOfflineObservation(payload) {
  const queue = getOfflineQueue();
  queue.push({ type: 'OBSERVATION', payload, timestamp: new Date().toISOString() });
  localStorage.setItem(tenantKey(OFFLINE_QUEUE), JSON.stringify(queue));
}

function queueOfflineAction(action) {
  const queue = getOfflineQueue();
  queue.push(action);
  localStorage.setItem(tenantKey(OFFLINE_QUEUE), JSON.stringify(queue));
}

function saveOfflineQueue(items) {
  if (items.length) localStorage.setItem(tenantKey(OFFLINE_QUEUE), JSON.stringify(items));
  else localStorage.removeItem(tenantKey(OFFLINE_QUEUE));
}

export function getPendingSyncCount() {
  return getOfflineQueue().length;
}

function cacheLocalObservation(obs) {
  try {
    const raw = localStorage.getItem(tenantKey(OFFLINE_OBSERVATIONS));
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(obs);
    localStorage.setItem(tenantKey(OFFLINE_OBSERVATIONS), JSON.stringify(list.slice(0, 50)));
  } catch (e) {
    console.debug('Failed to cache observation locally:', e);
  }
}

function getCachedObservations() {
  try {
    const raw = localStorage.getItem(tenantKey(OFFLINE_OBSERVATIONS));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
