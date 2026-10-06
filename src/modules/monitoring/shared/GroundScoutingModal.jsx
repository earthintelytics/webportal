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

export default function GroundScoutingModal({ alert, onClose, onAlertUpdated }) {
  const [activeTab, setActiveTab] = useState('dispatch'); // 'dispatch' | 'observation' | 'resolve' | 'history'
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(getPendingSyncCount());
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [pastObservations, setPastObservations] = useState([]);
  const [loadingPast, setLoadingPast] = useState(false);

  // Dispatch form state
  const [scoutName, setScoutName] = useState(alert?.assigned_scout_name || '');
  const [scoutContact, setScoutContact] = useState(alert?.assigned_scout_contact || '');
  const [deadline, setDeadline] = useState(alert?.action_deadline || '');
  const [dispatchNotes, setDispatchNotes] = useState(alert?.scouting_notes || '');

  // Observation form state
  const [cropStage, setCropStage] = useState('Vegetative');
  const [canopyScore, setCanopyScore] = useState(5);
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
        .catch((e) => console.warn('Could not load past observations:', e))
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
    try {
      const res = await syncOfflineQueue();
      setPendingSync(getPendingSyncCount());
      setSuccessMsg(`Synced ${res.syncedCount} queued items successfully.`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!scoutName.trim()) return;
    setSubmitting(true);
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
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogObservation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitScoutingObservation({
        plotId: alert.plot_id,
        alertId: alert.alert_id,
        scoutName: scoutName || 'Field Scout',
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
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    setSubmitting(true);
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
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    if (!window.confirm('Are you sure you want to dismiss this anomaly alert?')) return;
    setSubmitting(true);
    try {
      await dismissAlert(alert.alert_id);
      if (onAlertUpdated) onAlertUpdated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${alert.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-wide">Plot anomaly action hub</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                  {alert.alert_id}
                </span>
              </div>
              <p className="text-xs text-slate-400">Plot #{alert.plot_id} · {alert.type}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Connectivity Badge */}
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isOnline ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-amber-950/80 text-amber-400 border border-amber-800'}`}>
              {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
              <span>{isOnline ? 'Cloud Synced' : 'Offline Mode'}</span>
            </div>
            {pendingSync > 0 && (
              <button
                onClick={handleSyncNow}
                disabled={submitting}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm"
                title="Sync offline queue"
              >
                <RefreshCw size={12} className={submitting ? 'animate-spin' : ''} />
                <span>{pendingSync} Pending</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Anomaly Brief Banner */}
        <div className="px-6 py-3 bg-slate-50 border-b border-gray-100 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-2 truncate max-w-md">
            <span className="font-semibold text-slate-900">Satellite Signal:</span>
            <span className="truncate">{alert.message}</span>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0">
            <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
              alert.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
              alert.status === 'scout_assigned' ? 'bg-blue-100 text-blue-800' :
              alert.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              {alert.status ? alert.status.replace('_', ' ').toUpperCase() : 'OPEN'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-white">
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'dispatch' ? 'border-emerald-600 text-emerald-600 bg-emerald-50/30' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserCheck size={16} />
            <span>1. Dispatch Scout</span>
          </button>
          <button
            onClick={() => setActiveTab('observation')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'observation' ? 'border-emerald-600 text-emerald-600 bg-emerald-50/30' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Camera size={16} />
            <span>2. Ground Truth Log</span>
          </button>
          <button
            onClick={() => setActiveTab('resolve')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'resolve' ? 'border-emerald-600 text-emerald-600 bg-emerald-50/30' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 size={16} />
            <span>3. Resolve & Close</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'history' ? 'border-emerald-600 text-emerald-600 bg-emerald-50/30' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <History size={16} />
            <span>4. Observation History</span>
          </button>
        </div>

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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Field Scout / Agronomist Name</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / WhatsApp Contact</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Scouting Target Date / Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Scouting Directives / Instructions</label>
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
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Dismiss false alarm
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Crop growth stage</label>
                <select
                  value={cropStage}
                  onChange={(e) => setCropStage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="Emergence">Emergence / Seedling</option>
                  <option value="Vegetative">Vegetative growth</option>
                  <option value="Flowering">Flowering / Booting</option>
                  <option value="Grain/Fruit Filling">Grain / Fruit Filling</option>
                  <option value="Maturity / Harvest">Maturity / Harvest</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary finding</label>
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
                <label className="text-xs font-semibold text-slate-700">Canopy Health Score (1 = Dead, 10 = Optimal)</label>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{canopyScore}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={canopyScore}
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
              <label htmlFor="pestCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                Pest or Disease active symptoms observed on field inspection
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Field notes & ground evidence</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Verified ground truth category</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution summary & agronomic actions taken</label>
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
              <div className="flex items-center space-x-2 text-[11px] text-slate-500">
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
              <div className="flex items-center justify-center py-10 text-xs text-slate-400 space-x-2">
                <RefreshCw size={16} className="animate-spin text-emerald-600" />
                <span>Loading ground observations...</span>
              </div>
            ) : pastObservations.length === 0 ? (
              <div className="text-center py-10">
                <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-700">No ground observations yet</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1">
                  Field scouts have not yet recorded direct observations for Plot #{alert.plot_id}. Use Tab 1 or 2 to log one.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastObservations.map((obs, idx) => (
                  <div key={obs.observation_id || idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">{obs.scout_name || 'Field Officer'}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 uppercase">
                          {obs.finding_type ? obs.finding_type.replace('_', ' ') : 'Observation'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">{obs.observed_at || 'Recently'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                      <div><span className="text-slate-400">Crop Stage:</span> <span className="font-semibold text-slate-700">{obs.crop_stage || 'N/A'}</span></div>
                      <div><span className="text-slate-400">Canopy Health:</span> <span className="font-semibold text-slate-700">{obs.canopy_health_score}/10</span></div>
                      {obs.pest_disease_detected && (
                        <div className="col-span-2 text-red-600 font-semibold flex items-center space-x-1">
                          <AlertTriangle size={12} />
                          <span>Pest/Disease Symptoms Reported</span>
                        </div>
                      )}
                    </div>

                    {obs.notes && (
                      <p className="text-slate-600 text-[11px] italic bg-slate-100/60 p-2 rounded-lg">
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
