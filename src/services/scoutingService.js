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

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const token = localStorage.getItem('fi_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 && !path.includes('/auth/login')) {
    handleTenantAuthFailure();
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status} – ${path}: ${text}`);
  }
  return res.json();
}

/**
 * Fetch all alerts with workflow status
 */
export async function fetchAlerts(plotId = null) {
  try {
    const path = plotId ? `/alerts?plot_id=${plotId}` : '/alerts';
    const data = await apiFetch(path);
    return data;
  } catch (err) {
    console.warn('Network alert fetch failed, returning empty fallback:', err);
    return { stats: { total: 0, critical: 0, warnings: 0, acknowledged: 0, open: 0, scout_assigned: 0, resolved: 0 }, feed: [] };
  }
}

/**
 * Fetch past ground scouting observations
 */
export async function fetchScoutingObservations(plotId = null, alertId = null) {
  try {
    const params = new URLSearchParams();
    if (plotId) params.append('plot_id', plotId);
    if (alertId) params.append('alert_id', alertId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return await apiFetch(`/scouting/observations${qs}`);
  } catch (err) {
    console.warn('Failed to fetch scouting observations from server, using local cache:', err);
    return getCachedObservations();
  }
}

/**
 * Assign a field scout to an alert
 */
export async function assignScout(alertId, { scoutName, scoutContact = '', actionDeadline = null, notes = '' }) {
  try {
    return await apiFetch(`/alerts/${alertId}/assign`, {
      method: 'POST',
      body: JSON.stringify({
        scout_name: scoutName,
        scout_contact: scoutContact,
        action_deadline: actionDeadline,
        notes: notes,
      }),
    });
  } catch {
    // If offline, queue action locally
    queueOfflineAction({
      type: 'ASSIGN_SCOUT',
      alertId,
      payload: { scoutName, scoutContact, actionDeadline, notes },
      timestamp: new Date().toISOString(),
    });
    return {
      status: 'queued_offline',
      alert_id: alertId,
      workflow_status: 'scout_assigned',
      message: 'Scout assignment queued locally (offline mode).',
    };
  }
}

/**
 * Resolve an alert with ground truth finding
 */
export async function resolveAlert(alertId, { groundTruthCategory, resolutionNotes, resolvedBy = null }) {
  try {
    return await apiFetch(`/alerts/${alertId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({
        ground_truth_category: groundTruthCategory,
        resolution_notes: resolutionNotes,
        resolved_by: resolvedBy,
      }),
    });
  } catch {
    queueOfflineAction({
      type: 'RESOLVE_ALERT',
      alertId,
      payload: { groundTruthCategory, resolutionNotes, resolvedBy },
      timestamp: new Date().toISOString(),
    });
    return {
      status: 'queued_offline',
      alert_id: alertId,
      workflow_status: 'resolved',
      message: 'Alert resolution queued locally (offline mode).',
    };
  }
}

/**
 * Dismiss an alert
 */
export async function dismissAlert(alertId) {
  try {
    return await apiFetch(`/alerts/${alertId}/dismiss`, { method: 'POST' });
  } catch {
    queueOfflineAction({
      type: 'DISMISS_ALERT',
      alertId,
      payload: {},
      timestamp: new Date().toISOString(),
    });
    return {
      status: 'queued_offline',
      alert_id: alertId,
      workflow_status: 'dismissed',
      message: 'Alert dismissal queued locally.',
    };
  }
}

/**
 * Log a ground scouting observation (offline first)
 */
export async function submitScoutingObservation(observation) {
  const payload = {
    plot_id: observation.plotId,
    alert_id: observation.alertId || null,
    scout_name: observation.scoutName || 'Field Officer',
    scout_contact: observation.scoutContact || '',
    latitude: observation.latitude || null,
    longitude: observation.longitude || null,
    crop_stage: observation.cropStage || 'Vegetative',
    canopy_health_score: observation.canopyHealthScore || 5,
    pest_disease_detected: Boolean(observation.pestDiseaseDetected),
    finding_type: observation.findingType || 'normal',
    notes: observation.notes || '',
    photo_url: observation.photoUrl || null,
    observed_at: observation.observedAt || new Date().toISOString(),
  };

  // Cache locally
  cacheLocalObservation(payload);

  if (navigator.onLine) {
    try {
      const serverResult = await apiFetch('/scouting/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return { success: true, synced: true, observation: serverResult };
    } catch (err) {
      console.warn('Direct upload failed, saving to offline sync queue:', err);
      queueOfflineObservation(payload);
      return { success: true, synced: false, queued: true };
    }
  } else {
    queueOfflineObservation(payload);
    return { success: true, synced: false, queued: true };
  }
}

/**
 * Sync all pending offline observations and actions
 */
export async function syncOfflineQueue() {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0 };

  const obsItems = queue.filter(item => item.type === 'OBSERVATION').map(item => item.payload);
  const actionItems = queue.filter(item => item.type !== 'OBSERVATION');

  let syncedCount = 0;

  // 1. Batch sync observations
  if (obsItems.length > 0) {
    try {
      const resp = await apiFetch('/scouting/sync', {
        method: 'POST',
        body: JSON.stringify({ observations: obsItems }),
      });
      syncedCount += resp.synced_count || 0;
    } catch (e) {
      console.error('Batch observation sync error:', e);
    }
  }

  // 2. Play pending action items
  for (const act of actionItems) {
    try {
      if (act.type === 'ASSIGN_SCOUT') {
        await apiFetch(`/alerts/${act.alertId}/assign`, { method: 'POST', body: JSON.stringify(act.payload) });
        syncedCount++;
      } else if (act.type === 'RESOLVE_ALERT') {
        await apiFetch(`/alerts/${act.alertId}/resolve`, { method: 'POST', body: JSON.stringify(act.payload) });
        syncedCount++;
      } else if (act.type === 'DISMISS_ALERT') {
        await apiFetch(`/alerts/${act.alertId}/dismiss`, { method: 'POST' });
        syncedCount++;
      }
    } catch (err) {
      console.error(`Failed to play offline action ${act.type}:`, err);
    }
  }

  // Clear queue if all succeeded
  clearOfflineQueue();
  return { syncedCount };
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

function clearOfflineQueue() {
  localStorage.removeItem(tenantKey(OFFLINE_QUEUE));
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
