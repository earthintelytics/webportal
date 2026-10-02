import React, { useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';

const SmallholderAdvisorView = ({ selectedMember, onSelectMember }) => {
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: selectedMember 
        ? `Hello! I am the Smallholder Farm AI Advisor for ${selectedMember.name} (${selectedMember.primary_crop}, ${selectedMember.cluster}). How can I assist with pest identification, spray windows, or GAP compliance today?`
        : `Hello! I am the Smallholder Farm AI Advisor. Select a member plot or ask any question regarding good agricultural practices, weather windows, or pest triage.`
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [scoutingNotes, setScoutingNotes] = useState([
    { date: '28 Sep 2026', officer: 'Jude Egharevba', farmer: 'Emmanuel Osagie', plot: 'MEM-OK-0142', action: 'Recommended ring weeding and potassium application before dry season.', status: 'Completed' },
    { date: '21 Sep 2026', officer: 'Blessing Okon', farmer: 'Festus Igbinedion', plot: 'MEM-OK-0144', action: 'Investigated tapping panel dryness. Advised 2-week rest from tapping.', status: 'In Progress' }
  ]);
  const [newNote, setNewNote] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    const newMsgs = [...chatMessages, { role: 'user', text: userMsg }];
    setChatMessages(newMsgs);
    setChatInput('');

    setTimeout(() => {
      let reply = '';
      if (userMsg.toLowerCase().includes('spray') || userMsg.toLowerCase().includes('weather') || userMsg.toLowerCase().includes('rain')) {
        reply = `🌦️ Spraying Window Advisory: Current 48h forecast indicates 20% rain chance tomorrow morning between 07:00 and 11:00. This is an OPTIMAL window for foliar feeding and bio-fungicide application. Ensure 4 hours rain-fast period before afternoon showers.`;
      } else if (userMsg.toLowerCase().includes('disease') || userMsg.toLowerCase().includes('pod') || userMsg.toLowerCase().includes('black')) {
        reply = `🍂 Visual Diagnostic Triage: Early signs of Cocoa Black Pod (Phytophthora) require immediate sanitary pruning of infected pods. Bury affected pods 30cm below soil. Do not apply synthetic fungicides within 14 days of harvest (Pre-Harvest Interval adherence).`;
      } else if (userMsg.toLowerCase().includes('fertilizer') || userMsg.toLowerCase().includes('potassium') || userMsg.toLowerCase().includes('yield')) {
        reply = `🌱 GAP Nutrition Advice: For mature Oil Palm outgrower plots, broadcast 1.5 kg MOP (Muriate of Potash) per palm along the weeded clean weeded circle. Split into two rounds before peak dry season.`;
      } else {
        reply = `Grounded agronomic guidance for ${selectedMember ? selectedMember.name : 'Smallholder Cooperative'}: Follow the digital GAP seasonal timetable. Next scheduled extension visit is set for next Tuesday.`;
      }
      setChatMessages([...newMsgs, { role: 'assistant', text: reply }]);
    }, 600);
  };

  const handleAddScoutingNote = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const item = {
      date: 'Today',
      officer: 'Extension Supervisor',
      farmer: selectedMember ? selectedMember.name : 'Cluster Outgrower',
      plot: selectedMember ? selectedMember.id : 'Cluster Plot',
      action: newNote.trim(),
      status: 'In Progress'
    };
    setScoutingNotes([item, ...scoutingNotes]);
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
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Smallholder Farm AI Copilot
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">Zero Technical Acronyms • Farmer Language</span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles size={12} />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-lg text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-700 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <input
              type="text"
              placeholder="Ask advice on pests, spray windows, or fertilizer timing..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="p-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition-colors shadow-xs"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Right Col: Extension Scouting Logs & GAP Timetable */}
      <div className="space-y-6">
        {/* GAP Timetable Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-emerald-600" />
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Digital GAP Seasonal Calendar
            </h4>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-900">Current Phase: Post-Rainfall Maintenance</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Circle slashing, frond pruning & potassium boost.</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-900">Upcoming: Dry Season Preparation</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Mulching around weeded circles; firebreak establishment.</div>
            </div>
          </div>
        </div>

        {/* Extension Scouting Visit Logger */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-emerald-600" />
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Extension Scouting Logs
              </h4>
            </div>
            <span className="text-[10px] font-bold text-slate-400">{scoutingNotes.length} Visits</span>
          </div>

          <form onSubmit={handleAddScoutingNote} className="mb-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Log field visit note & action item..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold"
              >
                Log
              </button>
            </div>
          </form>

          <div className="space-y-2 overflow-y-auto max-h-48">
            {scoutingNotes.map((note, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>{note.date} • {note.officer}</span>
                  <span className="font-bold text-emerald-700">{note.status}</span>
                </div>
                <div className="font-medium text-slate-800">{note.action}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Farmer: {note.farmer} ({note.plot})</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmallholderAdvisorView;
