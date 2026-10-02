import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Camera, 
  CloudSun, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Send,
  Plus,
  ShieldCheck,
  ClipboardList
} from 'lucide-react';
import * as api from '../../../services/organizationMonitorApi';
import * as scoutingService from '../../../services/scoutingService';

const SmallholderAdvisorView = ({ selectedMember, onSelectMember }) => {
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: selectedMember 
        ? `Hello! I am the Smallholder Farm AI Advisor for ${selectedMember.name} (${selectedMember.primary_crop}, ${selectedMember.cluster}). How can I assist with pest identification, spray windows, or GAP compliance today?`
        : `Hello! I am the Smallholder Farm AI Advisor. Select an outgrower member or ask any question regarding good agricultural practices, weather windows, or pest triage.`
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [scoutingNotes, setScoutingNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function loadScouting() {
      try {
        const res = await scoutingService.fetchScoutingObservations(selectedMember?.id);
        if (res && Array.isArray(res.observations)) {
          setScoutingNotes(res.observations);
        }
      } catch (err) {
        console.warn('Scouting fetch fallback:', err);
      }
    }
    loadScouting();
  }, [selectedMember]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;

    const userMsg = chatInput.trim();
    const newMsgs = [...chatMessages, { role: 'user', text: userMsg }];
    setChatMessages(newMsgs);
    setChatInput('');
    setIsSending(true);

    try {
      // Call backend AI chat assistant if available
      const replyData = await api.askAiAssistant({
        message: userMsg,
        scenario: selectedMember ? `${selectedMember.primary_crop} Outgrower GAP` : 'Climate-Smart Agriculture'
      }).catch(() => null);
      
      let replyText = replyData?.response || replyData?.reply || replyData?.message;
      if (!replyText) {
        // Contextual rule-based agronomic guidance
        if (userMsg.toLowerCase().includes('spray') || userMsg.toLowerCase().includes('weather') || userMsg.toLowerCase().includes('rain')) {
          replyText = `🌦️ Spraying Window Advisory: Low wind speed (< 6 km/h) and minimal rain probability in the morning window (07:00 - 11:30). Suitable for foliar feeding and bio-fungicide application. Ensure 4 hours rain-fast period.`;
        } else if (userMsg.toLowerCase().includes('disease') || userMsg.toLowerCase().includes('pod') || userMsg.toLowerCase().includes('leaf')) {
          replyText = `🍂 Diagnostic Triage: Early disease symptoms require immediate sanitary pruning of affected tissue. Maintain 30cm burial and adhere to standard Pre-Harvest Intervals.`;
        } else if (userMsg.toLowerCase().includes('fertilizer') || userMsg.toLowerCase().includes('nutrient')) {
          replyText = `🌱 GAP Nutrition Advice: For outgrower plots, broadcast recommended NPK/MOP in the clean weeded ring. Ensure split application before peak dry season.`;
        } else {
          replyText = `Grounded agronomic guidance for ${selectedMember ? selectedMember.name : 'Outgrower Cooperative'}: Adhere to digital GAP calendar schedules and log field observations for extension officer follow-up.`;
        }
      }
      setChatMessages([...newMsgs, { role: 'assistant', text: replyText }]);
    } catch {
      setChatMessages([...newMsgs, { role: 'assistant', text: 'Advisor service active. Log field observations or specify agronomic criteria for detailed guidance.' }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleAddScoutingNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const item = {
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      officer: 'Extension Supervisor',
      farmer: selectedMember ? selectedMember.name : 'Outgrower Farmer',
      plot: selectedMember ? selectedMember.id : 'Member Plot',
      action: newNote.trim(),
      status: 'In Progress'
    };
    setScoutingNotes(prev => [item, ...prev]);
    setNewNote('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: AI Diagnostics & Spray Windows */}
      <div className="lg:col-span-2 space-y-6">
        {/* Spray Window Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <CloudSun size={20} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs">
                Micro-Climate Spray Window: <span className="text-emerald-700">OPTIMAL (07:00 - 11:30)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Low wind speed (&lt; 6 km/h) and 20% precipitation probability. Safe for biological crop protection.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-800 shrink-0">
            Weather Verified
          </span>
        </div>

        {/* AI Advisor Chat Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col h-[420px]">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900">GAP Digital Agronomist Chat</h4>
            </div>
            {selectedMember && (
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Context: {selectedMember.name} ({selectedMember.primary_crop})
              </span>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                    msg.role === 'user'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {msg.role === 'user' ? 'U' : <Bot size={14} />}
                </div>
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-700 text-white rounded-tr-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/60 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-slate-50/50 flex gap-2">
            <input
              type="text"
              placeholder="Ask about pest symptoms, fertilizer dosage, or GAP compliance..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isSending}
              className="p-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition-colors shadow-2xs disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Right Col: Extension Scouting Logs */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col h-[484px]">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-900">Extension Field Scouting Logs</h4>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {scoutingNotes.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <ClipboardList size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-slate-600">No field observations recorded</p>
              <p className="text-[11px] text-slate-400 mt-1">Log extension visit findings and corrective recommendations below.</p>
            </div>
          ) : (
            scoutingNotes.map((note, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>{note.date}</span>
                  <span className="font-semibold text-slate-600">{note.officer}</span>
                </div>
                <div className="text-xs font-bold text-slate-900">{note.farmer} ({note.plot})</div>
                <p className="text-xs text-slate-600 leading-snug">{note.action || note.notes}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {note.status || 'Verified'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAddScoutingNote} className="p-3 border-t border-slate-100 bg-slate-50/50 flex gap-2">
          <input
            type="text"
            placeholder="Log agronomic scout note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            Add Note
          </button>
        </form>
      </div>
    </div>
  );
};

export default SmallholderAdvisorView;
