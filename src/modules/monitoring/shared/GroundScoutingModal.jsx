import { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  UserCheck,
  Send,
  CheckCircle2,
  Camera,
  Wifi,
  WifiOff,
  ShieldCheck,
  FileText,
  RefreshCw,
  Check,
  History
} from 'lucide-react';
import {
  assignScout,
  resolveAlert,
  dismissAlert,
  submitScoutingObservation,
  fetchScoutingObservations,
  syncOfflineQueue,
  getPendingSyncCount
} from '../../../services/scoutingService';

/**
 * Field visit for one block. With a real open alert: send someone, record
 * what they found, close the alert. Without one (visitOnly): record a visit.
 * Full screen on a phone; saved on the device when there is no signal.
 */
export default function GroundScoutingModal({ alert, onClose, onAlertUpdated, visitOnly = false }) {
  const [activeTab, setActiveTab] = useState(visitOnly ? 'observation' : 'dispatch'); // 'dispatch' | 'observation' | 'resolve' | 'history'
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(getPendingSyncCount());
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [pastObservations, setPastObservations] = useState([]);
  const [loadingPast, setLoadingPast] = useState(false);

  // Dispatch form state
  const [scoutName, setScoutName] = useState(alert?.assigned_scout_name || '');
  const [scoutContact, setScoutContact] = useState(alert?.assigned_scout_contact || '');
  const [deadline, setDeadline] = useState(alert?.action_deadline || '');
  const [dispatchNotes, setDispatchNotes] = useState(alert?.scouting_notes || '');

  // Observation form state
  // Nothing assumed: stage and score stay empty until the scout sets them.
  const [cropStage, setCropStage] = useState('');
  const [canopyScore, setCanopyScore] = useState(null);
  const [pestDetected, setPestDetected] = useState(false);
  const [findingType, setFindingType] = useState('pest_infestation');
  const [obsNotes, setObsNotes] = useState('');

  // Resolve form state
  const [resolveCategory, setResolveCategory] = useState(alert?.ground_truth_category || 'pest_infestation');
  const [resolveNotes, setResolveNotes] = useState(alert?.resolution_notes || '');

  useEffect(() => {
    if (activeTab === 'history' && alert?.plot_id) {
      setLoadingPast(true);
      fetchScoutingObservations(alert.plot_id, alert.alert_id)
        .then((res) => {
          setPastObservations(Array.isArray(res) ? res : []);
        })
        .catch((e) => setErrorMsg(`Past observations could not be loaded: ${e.message}`))
        .finally(() => setLoadingPast(false));
    }
  }, [activeTab, alert?.plot_id, alert?.alert_id]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSyncNow = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await syncOfflineQueue();
      setPendingSync(getPendingSyncCount());
      setSuccessMsg(`${res.syncedCount} sent.${res.remaining ? ` ${res.remaining} still waiting for a connection.` : ''}`);
      if (res.refused.length) setErrorMsg(`Not accepted: ${res.refused.join(' · ')}`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!scoutName.trim()) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await assignScout(alert.alert_id, {
        scoutName,
        scoutContact,
        actionDeadline: deadline || null,
        notes: dispatchNotes,
      });
      setSuccessMsg(res.message || 'Scout assigned successfully.');
      setPendingSync(getPendingSyncCount());
      if (onAlertUpdated) onAlertUpdated();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogObservation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      await submitScoutingObservation({
        plotId: alert.plot_id,
        alertId: visitOnly ? null : alert.alert_id,
        scoutName,
        scoutContact,
        cropStage,
        canopyHealthScore: canopyScore,
        pestDiseaseDetected: pestDetected,
        findingType,
        notes: obsNotes,
      });
      setSuccessMsg('Ground observation recorded.');
      setPendingSync(getPendingSyncCount());
      if (onAlertUpdated) onAlertUpdated();
      setTimeout(() => {
        setSuccessMsg('');
        setActiveTab('resolve');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await resolveAlert(alert.alert_id, {
        groundTruthCategory: resolveCategory,
        resolutionNotes: resolveNotes,
      });
      setSuccessMsg(res.message || 'Alert marked as resolved.');
      setPendingSync(getPendingSyncCount());
      if (onAlertUpdated) onAlertUpdated();
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const [confirmDismiss, setConfirmDismiss] = useState(false);
  const handleDismiss = async () => {
    // Two clicks instead of a browser pop-up: the button asks first.
    if (!confirmDismiss) { setConfirmDismiss(true); return; }
    setSubmitting(true);
    setErrorMsg('');
    try {
      await dismissAlert(alert.alert_id);
      if (onAlertUpdated) onAlertUpdated();
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-stretch sm:items-center justify-center sm:p-4 bg-gray-900/30">
      <div className="relative w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto bg-white sm:rounded-2xl border border-gray-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 bg-white">
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-gray-900">{visitOnly ? 'Record a field visit' : 'Act on this alert'}</p>
            <p className="text-xs text-gray-500 truncate">Block {alert.plot_name || alert.plot_id}{!visitOnly && alert.type ? ` · ${alert.type}` : ''}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${isOnline ? 'bg-green-50 text-green-800 border-green-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
              {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
              {isOnline ? 'Online' : 'No signal: saved on this device'}
            </span>
            {pendingSync > 0 && (
              <button onClick={handleSyncNow} disabled={submitting} title="Send the visits saved without signal"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white bg-green-700 hover:bg-green-800">
                <RefreshCw size={12} className={submitting ? 'animate-spin' : ''} />{pendingSync} to send
              </button>
            )}
            <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"><X size={20} /></button>
          </div>
        </div>

        {!isOnline && <p className="sm:hidden px-5 py-2 text-xs bg-amber-50 text-amber-900 border-b border-amber-200">No signal: what you record is saved on this phone and sent later.</p>}

        {/* The alert, in its own words */}
        {!visitOnly && (
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-start justify-between gap-3 text-sm text-gray-700">
            <span>{alert.message}</span>
            <span className="shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold bg-white border border-gray-200 text-gray-700">
              {({ open: 'Open', scout_assigned: 'Someone sent', resolved: 'Closed', dismissed: 'Dismissed' })[alert.status] || 'Open'}
            </span>
          </div>
        )}

        {/* Steps */}
        <div role="tablist" className="flex overflow-x-auto border-b border-gray-200 bg-white">
          {!visitOnly && (
          <button type="button" onClick={() => setActiveTab('dispatch')} aria-selected={activeTab === 'dispatch'} role="tab"
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 ${activeTab === 'dispatch' ? 'border-green-700 text-green-800' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
            <UserCheck size={16} /><span>Send someone</span>
          </button>
          )}
          <button type="button" onClick={() => setActiveTab('observation')} aria-selected={activeTab === 'observation'} role="tab"
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 ${activeTab === 'observation' ? 'border-green-700 text-green-800' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
            <Camera size={16} /><span>What was found</span>
          </button>
          {!visitOnly && (
          <button type="button" onClick={() => setActiveTab('resolve')} aria-selected={activeTab === 'resolve'} role="tab"
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 ${activeTab === 'resolve' ? 'border-green-700 text-green-800' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
            <CheckCircle2 size={16} /><span>Close the alert</span>
          </button>
          )}
          <button type="button" onClick={() => setActiveTab('history')} aria-selected={activeTab === 'history'} role="tab"
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 ${activeTab === 'history' ? 'border-green-700 text-green-800' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
            <History size={16} /><span>Past visits</span>
          </button>
        </div>

        {errorMsg && (
          <div role="alert" className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start justify-between gap-3">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg('')} className="font-semibold shrink-0">Close</button>
          </div>
        )}

        {/* Feedback Message */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 animate-fade-in">
            <Check size={16} className="text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: Dispatch Scout Form */}
        {activeTab === 'dispatch' && (
          <form onSubmit={handleDispatch} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Field Scout / Agronomist Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Okoye"
                  value={scoutName}
                  onChange={(e) => setScoutName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone / WhatsApp Contact</label>
                <input
                  type="text"
                  placeholder="e.g. +234 803 123 4567"
                  value={scoutContact}
                  onChange={(e) => setScoutContact(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Scouting Target Date / Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Scouting Directives / Instructions</label>
              <textarea
                rows={3}
                placeholder="Specify specific quadrant or visual symptoms to inspect on the ground..."
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleDismiss}
                className="text-xs text-red-700 hover:text-red-800 font-medium"
              >
                {confirmDismiss ? 'Click again to dismiss this alert' : 'Dismiss false alarm'}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <Send size={14} />
                <span>{submitting ? 'Dispatching...' : 'Assign & Notify Scout'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Ground Truth Observation Form */}
        {activeTab === 'observation' && (
          <form onSubmit={handleLogObservation} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Crop growth stage</label>
                <select
                  value={cropStage}
                  onChange={(e) => setCropStage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="">Not noted</option>
                  <option value="Emergence">Emergence / Seedling</option>
                  <option value="Vegetative">Vegetative growth</option>
                  <option value="Flowering">Flowering / Booting</option>
                  <option value="Grain/Fruit Filling">Grain / Fruit Filling</option>
                  <option value="Maturity / Harvest">Maturity / Harvest</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Primary finding</label>
                <select
                  value={findingType}
                  onChange={(e) => setFindingType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="pest_infestation">Pest / Caterpillar / Borer Infestation</option>
                  <option value="fungal_disease">Fungal / Foliar Blight</option>
                  <option value="nitrogen_deficiency">Nitrogen / Chlorosis Deficiency</option>
                  <option value="water_stress">Severe Moisture Deficit / Wilting</option>
                  <option value="weed_competition">High weed density</option>
                  <option value="healthy_normal">Healthy / Normal (False Alarm)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-700">Canopy Health Score (1 = Dead, 10 = Optimal)</label>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{canopyScore == null ? 'Not scored' : `${canopyScore}/10`}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={canopyScore ?? 5}
                onChange={(e) => setCanopyScore(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="pestCheck"
                checked={pestDetected}
                onChange={(e) => setPestDetected(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="pestCheck" className="text-xs text-gray-700 font-medium cursor-pointer">
                Pest or Disease active symptoms observed on field inspection
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Field notes & ground evidence</label>
              <textarea
                rows={3}
                placeholder="Describe leaf symptoms, soil condition, or estimated affected percentage..."
                value={obsNotes}
                onChange={(e) => setObsNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <Camera size={14} />
                <span>{submitting ? 'Saving...' : 'Record Observation'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Resolve & Verify Form */}
        {activeTab === 'resolve' && (
          <form onSubmit={handleResolve} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Verified ground truth category</label>
              <select
                value={resolveCategory}
                onChange={(e) => setResolveCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="pest_infestation">Confirmed Pest Infestation (Treated)</option>
                <option value="disease_outbreak">Confirmed Disease Outbreak (Fungicide Applied)</option>
                <option value="fertilizer_deficiency">Nutrient Deficiency (Top-dressing Scheduled)</option>
                <option value="water_stress">Water Stress (Irrigation Dispatched)</option>
                <option value="weed_pressure">Weed Pressure (Weeding Initiated)</option>
                <option value="false_alarm">False Anomaly / Cloud Artifact (Resolved)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Resolution summary & agronomic actions taken</label>
              <textarea
                rows={4}
                required
                placeholder="Document corrective treatment applied, chemical formulation, or reason for closure..."
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2 text-[11px] text-gray-500">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Will record closure timestamp & update MRV audit logs</span>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                <span>{submitting ? 'Resolving...' : 'Confirm Ground Resolution'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Observation History */}
        {activeTab === 'history' && (
          <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto">
            {loadingPast ? (
              <div className="flex items-center justify-center py-10 text-xs text-gray-400 space-x-2">
                <RefreshCw size={16} className="animate-spin text-emerald-600" />
                <span>Loading ground observations...</span>
              </div>
            ) : pastObservations.length === 0 ? (
              <div className="text-center py-10">
                <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-700">No ground observations yet</p>
                <p className="text-[11px] text-gray-500 max-w-xs mx-auto mt-1">
                  Field scouts have not yet recorded direct observations for Plot #{alert.plot_id}. Use Tab 1 or 2 to log one.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastObservations.map((obs, idx) => (
                  <div key={obs.observation_id || idx} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-800">{obs.scout_name || 'Field Officer'}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 ">
                          {obs.finding_type ? obs.finding_type.replace('_', ' ') : 'Observation'}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400">{obs.observed_at || 'Recently'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 bg-white p-2 rounded-lg border border-gray-100">
                      <div><span className="text-gray-400">Crop Stage:</span> <span className="font-semibold text-gray-700">{obs.crop_stage || 'N/A'}</span></div>
                      <div><span className="text-gray-400">Canopy Health:</span> <span className="font-semibold text-gray-700">{obs.canopy_health_score}/10</span></div>
                      {obs.pest_disease_detected && (
                        <div className="col-span-2 text-red-600 font-semibold flex items-center space-x-1">
                          <AlertTriangle size={12} />
                          <span>Pest/Disease Symptoms Reported</span>
                        </div>
                      )}
                    </div>

                    {obs.notes && (
                      <p className="text-gray-600 text-[11px] italic bg-gray-100/60 p-2 rounded-lg">
                        "{obs.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
