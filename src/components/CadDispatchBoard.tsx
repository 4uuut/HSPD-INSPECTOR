import React, { useState, useEffect } from 'react';
import { 
  Radio, AlertTriangle, ShieldAlert, PhoneCall, Volume2, 
  MapPin, CheckCircle2, User, Clock, Plus, Search, 
  Flame, Crosshair, RefreshCw, Copy, Check, Car, Zap, 
  Compass, AlertCircle, Shield, X, ArrowUpRight, Send
} from 'lucide-react';
import { 
  OfficerProfile, 
  Emergency911Call, 
  PanicAlert, 
  CadUnit, 
  PursuitTrackerState, 
  Call911Priority, 
  Call911Status,
  DutyStatusCode 
} from '../types';
import { 
  getSavedCadCalls, 
  saveCadCalls, 
  getSavedPanicAlerts, 
  savePanicAlerts, 
  getSavedCadUnits, 
  saveCadUnits, 
  getSavedPursuit, 
  savePursuit,
  playEmergencySirenSound 
} from '../utils/cadDispatchStorage';
import { sendDiscordLog, getDiscordWebhookConfig } from '../utils/discordWebhook';

interface Props {
  currentOfficer: OfficerProfile | null;
}

export const CadDispatchBoard: React.FC<Props> = ({ currentOfficer }) => {
  // State
  const [calls, setCalls] = useState<Emergency911Call[]>(() => getSavedCadCalls());
  const [panicAlerts, setPanicAlerts] = useState<PanicAlert[]>(() => getSavedPanicAlerts());
  const [units, setUnits] = useState<CadUnit[]>(() => getSavedCadUnits());
  const [pursuit, setPursuit] = useState<PursuitTrackerState | null>(() => getSavedPursuit());

  // UI state
  const [activeTab, setActiveTab] = useState<'calls' | 'units' | 'pursuit' | 'panic'>('calls');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isNewCallModalOpen, setIsNewCallModalOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // New Call Form State
  const [newCallTitle, setNewCallTitle] = useState('');
  const [newCallCaller, setNewCallCaller] = useState('');
  const [newCallPhone, setNewCallPhone] = useState('');
  const [newCallLocation, setNewCallLocation] = useState('');
  const [newCallPostal, setNewCallPostal] = useState('');
  const [newCallDetails, setNewCallDetails] = useState('');
  const [newCallPriority, setNewCallPriority] = useState<Call911Priority>('CODE 3 (URGENT)');

  // Panic Button State
  const [isPanicTriggered, setIsPanicTriggered] = useState(false);
  const [panicLocationInput, setPanicLocationInput] = useState('');

  // Sync listener
  useEffect(() => {
    const handleCallsUpdate = () => setCalls(getSavedCadCalls());
    const handlePanicUpdate = () => setPanicAlerts(getSavedPanicAlerts());
    const handleUnitsUpdate = () => setUnits(getSavedCadUnits());
    const handlePursuitUpdate = () => setPursuit(getSavedPursuit());

    window.addEventListener('hspd-cad-calls-updated', handleCallsUpdate);
    window.addEventListener('hspd-panic-alerts-updated', handlePanicUpdate);
    window.addEventListener('hspd-cad-units-updated', handleUnitsUpdate);
    window.addEventListener('hspd-pursuit-updated', handlePursuitUpdate);

    return () => {
      window.removeEventListener('hspd-cad-calls-updated', handleCallsUpdate);
      window.removeEventListener('hspd-panic-alerts-updated', handlePanicUpdate);
      window.removeEventListener('hspd-cad-units-updated', handleUnitsUpdate);
      window.removeEventListener('hspd-pursuit-updated', handlePursuitUpdate);
    };
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Trigger Panic Button
  const handleTriggerPanic = () => {
    if (!currentOfficer) return;
    playEmergencySirenSound();
    setIsPanicTriggered(true);

    const alert: PanicAlert = {
      id: `panic-${Date.now()}`,
      officerName: currentOfficer.name,
      officerBadge: currentOfficer.badge,
      officerRank: currentOfficer.rank,
      callsign: `LINCOLN-${currentOfficer.badge.replace(/\D/g, '') || '1'}`,
      location: panicLocationInput.trim() || 'Posisi Terakhir Petugas / GPS Emergency Distress',
      postalCode: 'GPS-AUTO',
      timestamp: Date.now(),
      acknowledgedBy: [],
      status: 'ACTIVE'
    };

    const updated = [alert, ...panicAlerts];
    setPanicAlerts(updated);
    savePanicAlerts(updated);

    // Send to Discord Webhook
    const webhook = getDiscordWebhookConfig();
    if (webhook?.webhookUrl) {
      sendDiscordLog(webhook.webhookUrl, {
        title: '🚨 10-99 CODE RED: OFFICER PANIC BUTTON TRIGGERED!',
        description: `**PETUGAS DALAM BAHAYA KRITIS!**\n👤 **Petugas:** ${currentOfficer.rank} ${currentOfficer.name} (${currentOfficer.badge})\n📍 **Lokasi:** ${alert.location}\n⏰ **Waktu:** ${new Date().toLocaleTimeString('id-ID')}\n\n*Semua unit yang bertugas (10-8) diwajibkan segera merespons Code 3 ke koordinat.*`,
        color: 0xff0000
      });
    }

    setTimeout(() => setIsPanicTriggered(false), 3000);
  };

  const handleAcknowledgePanic = (id: string) => {
    if (!currentOfficer) return;
    const updated = panicAlerts.map(a => {
      if (a.id === id) {
        const acks = a.acknowledgedBy.includes(currentOfficer.name)
          ? a.acknowledgedBy
          : [...a.acknowledgedBy, `${currentOfficer.badge} ${currentOfficer.name}`];
        return { ...a, acknowledgedBy: acks };
      }
      return a;
    });
    setPanicAlerts(updated);
    savePanicAlerts(updated);
  };

  const handleResolvePanic = (id: string) => {
    const updated = panicAlerts.map(a => a.id === id ? { ...a, status: 'RESOLVED' as const } : a);
    setPanicAlerts(updated);
    savePanicAlerts(updated);
  };

  // Create New Call
  const handleCreateCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCallTitle.trim() || !newCallLocation.trim()) return;

    const callNum = `CAD-${new Date().getFullYear()}-${String(calls.length + 891).padStart(4, '0')}`;
    const newCall: Emergency911Call = {
      id: `call-${Date.now()}`,
      callNumber: callNum,
      callerName: newCallCaller.trim() || 'Warga Sipil (911 Dispatch)',
      callerPhone: newCallPhone.trim() || '555-0911',
      location: newCallLocation.trim(),
      postalCode: newCallPostal.trim() || 'LS-AREA',
      title: newCallTitle.trim(),
      details: newCallDetails.trim() || 'Panggilan darurat masuk melalui hotline kepolisian 911.',
      priority: newCallPriority,
      status: 'PENDING',
      assignedUnits: [],
      timestamp: Date.now()
    };

    const updated = [newCall, ...calls];
    setCalls(updated);
    saveCadCalls(updated);

    // Reset Form
    setNewCallTitle('');
    setNewCallCaller('');
    setNewCallPhone('');
    setNewCallLocation('');
    setNewCallPostal('');
    setNewCallDetails('');
    setIsNewCallModalOpen(false);

    // Webhook broadcast
    const webhook = getDiscordWebhookConfig();
    if (webhook?.webhookUrl) {
      sendDiscordLog(webhook.webhookUrl, {
        title: `📢 911 EMERGENCY CALL: ${newCall.title}`,
        description: `📞 **Pelapor:** ${newCall.callerName} (${newCall.callerPhone})\n📍 **Lokasi:** ${newCall.location} (Postal: ${newCall.postalCode})\n⚠️ **Prioritas:** ${newCall.priority}\n📝 **Detail:** ${newCall.details}`,
        color: newCall.priority.includes('CODE 3') || newCall.priority.includes('99') ? 0xff3b30 : 0xffa500
      });
    }
  };

  // Assign Unit to Call
  const handleAssignUnitToCall = (callId: string, unitCallsign: string) => {
    const updatedCalls = calls.map(c => {
      if (c.id === callId) {
        const unitsList = c.assignedUnits.includes(unitCallsign)
          ? c.assignedUnits
          : [...c.assignedUnits, unitCallsign];
        return { ...c, assignedUnits: unitsList, status: 'DISPATCHED' as Call911Status };
      }
      return c;
    });
    setCalls(updatedCalls);
    saveCadCalls(updatedCalls);

    // Update Unit Status
    const updatedUnits = units.map(u => {
      if (u.callsign === unitCallsign) {
        return {
          ...u,
          status: '10-97' as DutyStatusCode,
          statusText: `10-97 En Route / On Scene Call #${calls.find(c => c.id === callId)?.callNumber}`,
          assignedCallNumber: calls.find(c => c.id === callId)?.callNumber,
          updatedAt: Date.now()
        };
      }
      return u;
    });
    setUnits(updatedUnits);
    saveCadUnits(updatedUnits);
  };

  // Update Call Status
  const handleUpdateCallStatus = (callId: string, newStatus: Call911Status) => {
    const updated = calls.map(c => {
      if (c.id === callId) {
        return {
          ...c,
          status: newStatus,
          resolvedAt: newStatus === 'RESOLVED' ? Date.now() : c.resolvedAt
        };
      }
      return c;
    });
    setCalls(updated);
    saveCadCalls(updated);
  };

  // Toggle Pursuit Authorizations
  const handleTogglePursuitAuth = (field: 'isPitAuthorized' | 'isSpikeAuthorized' | 'isBoxingAuthorized') => {
    if (!pursuit) return;
    const updated: PursuitTrackerState = {
      ...pursuit,
      [field]: !pursuit[field],
      updatedAt: Date.now()
    };
    setPursuit(updated);
    savePursuit(updated);
  };

  // Filtered Calls
  const filteredCalls = calls.filter(c => {
    const matchSearch = (
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.callNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.callerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchPriority = filterPriority === 'ALL' || c.priority.includes(filterPriority);
    const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchSearch && matchPriority && matchStatus;
  });

  const activePanicCount = panicAlerts.filter(a => a.status === 'ACTIVE').length;

  return (
    <div className="space-y-4 font-mono text-xs text-gray-200">
      
      {/* Top Banner: Emergency Panic & Dispatch HUD */}
      <div className="p-4 bg-gradient-to-r from-[#141820] via-[#10141D] to-[#1C161D] border border-gray-800 rounded-2xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-950/40">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 uppercase tracking-wider">
                CENTRAL CAD 911 TERMINAL
              </span>
              {activePanicCount > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white animate-bounce">
                  🚨 {activePanicCount} PANIC ACTIVE!
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-100 mt-0.5 tracking-tight">
              Live Dispatch & Emergency Response Center
            </h2>
            <p className="text-[11px] text-gray-400 font-sans">
              Monitoring panggilan 911, aktivasi Panic Button 10-99 darurat, koordinasi pengejaran kendaraan, dan tracking status unit patroli.
            </p>
          </div>
        </div>

        {/* Action Controls: Panic Button + Add Call */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 10-99 PANIC BUTTON */}
          <div className="flex items-center gap-1.5 bg-[#0A0D12] p-1.5 rounded-xl border border-rose-800/80 shadow-inner">
            <input
              type="text"
              value={panicLocationInput}
              onChange={(e) => setPanicLocationInput(e.target.value)}
              placeholder="Input lokasi darurat..."
              className="bg-[#141820] text-[11px] px-2.5 py-1.5 rounded-lg border border-gray-700 text-rose-200 placeholder-gray-500 w-36 lg:w-44 focus:outline-none focus:border-rose-500 font-sans"
            />
            <button
              type="button"
              onClick={handleTriggerPanic}
              className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition flex items-center gap-1.5 shadow-lg ${
                isPanicTriggered
                  ? 'bg-red-600 text-white animate-ping'
                  : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white border border-red-500 shadow-red-950/60'
              }`}
              title="Aktivasi 10-99 Officer Down / Panic Distress Siren ke Seluruh Unit"
            >
              <Volume2 className="w-4 h-4 text-white" />
              <span>🚨 10-99 PANIC!</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsNewCallModalOpen(true)}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-950/50"
          >
            <Plus className="w-4 h-4" />
            <span>+ PANGGILAN 911</span>
          </button>
        </div>
      </div>

      {/* Active Panic Alert Notification Strip (if any active) */}
      {panicAlerts.filter(a => a.status === 'ACTIVE').map((alert) => (
        <div 
          key={alert.id}
          className="p-3 bg-red-950/80 border-2 border-red-500 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-200 shadow-xl shadow-red-950/60 animate-pulse"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/30 border border-red-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-red-300 animate-bounce" />
            </div>
            <div>
              <div className="font-bold text-xs flex items-center gap-1.5 text-white">
                <span>[10-99 CODE RED DISTRESS]</span>
                <span className="text-red-300">{alert.officerRank} {alert.officerName} ({alert.officerBadge})</span>
                <span className="text-[10px] bg-black/60 px-1.5 py-0.2 rounded border border-red-700">
                  Callsign: {alert.callsign}
                </span>
              </div>
              <div className="text-[11px] text-red-300/90 font-sans flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <strong>{alert.location}</strong>
                </span>
                <span>• Respon Unit: {alert.acknowledgedBy.length > 0 ? alert.acknowledgedBy.join(', ') : 'Menunggu respon unit terdekat...'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleAcknowledgePanic(alert.id)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>10-4 EN ROUTE</span>
            </button>
            <button
              onClick={() => handleResolvePanic(alert.id)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-gray-700"
            >
              <Check className="w-3.5 h-3.5" />
              <span>10-99 CLEAR</span>
            </button>
          </div>
        </div>
      ))}

      {/* Sub Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('calls')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'calls'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-800/80 hover:bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Panggilan 911 ({calls.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('units')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'units'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-800/80 hover:bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Unit CAD Aktif ({units.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pursuit')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'pursuit'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-gray-800/80 hover:bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Pengejaran Code 3 {pursuit?.status === 'ACTIVE' && <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>}</span>
          </button>
        </div>

        <div className="text-[11px] text-gray-500 hidden sm:block">
          CAD Auto-sync: Terhubung ke Radio 1111 / Discord MDT
        </div>
      </div>

      {/* TAB 1: 911 CALLS LIST */}
      {activeTab === 'calls' && (
        <div className="space-y-3">
          {/* Filters & Search */}
          <div className="p-3 bg-[#141820] border border-gray-800 rounded-xl flex flex-wrap items-center justify-between gap-2.5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nomor CAD, judul panggilan, lokasi, atau pelapor..."
                className="w-full bg-[#0A0D12] border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-[#0A0D12] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none"
              >
                <option value="ALL">Semua Prioritas</option>
                <option value="CODE 3">CODE 3 (URGENT)</option>
                <option value="CODE 2">CODE 2 (MEDIUM)</option>
                <option value="CODE 1">CODE 1 (LOW)</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#0A0D12] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">PENDING (Menunggu Unit)</option>
                <option value="DISPATCHED">DISPATCHED</option>
                <option value="ON_SCENE">ON_SCENE (Di TKP)</option>
                <option value="RESOLVED">RESOLVED (Selesai)</option>
              </select>
            </div>
          </div>

          {/* Call Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredCalls.map((call) => {
              const radioMsg = `[CAD-911] ${call.callNumber} | ${call.priority} | ${call.title} | LOC: ${call.location} | UNITS: ${call.assignedUnits.join(', ') || 'NONE'}`;
              return (
                <div
                  key={call.id}
                  className={`p-3.5 rounded-xl border transition flex flex-col justify-between gap-3 ${
                    call.status === 'RESOLVED'
                      ? 'bg-[#10141A]/60 border-gray-800/80 text-gray-400'
                      : call.priority.includes('CODE 3') || call.priority.includes('99')
                        ? 'bg-gradient-to-br from-rose-950/30 to-[#12161F] border-rose-700/60 shadow-md'
                        : 'bg-[#141820] border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Card Header: Number & Priority */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-100 text-xs">{call.callNumber}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          call.priority.includes('CODE 3') || call.priority.includes('99')
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : call.priority.includes('CODE 2')
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}>
                          {call.priority}
                        </span>
                      </div>

                      {/* Status Dropdown */}
                      <select
                        value={call.status}
                        onChange={(e) => handleUpdateCallStatus(call.id, e.target.value as Call911Status)}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold border focus:outline-none ${
                          call.status === 'RESOLVED'
                            ? 'bg-gray-800 text-gray-400 border-gray-700'
                            : call.status === 'ON_SCENE'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : call.status === 'DISPATCHED'
                                ? 'bg-blue-950 text-blue-300 border-blue-700'
                                : 'bg-amber-950 text-amber-300 border-amber-700 animate-pulse'
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="DISPATCHED">DISPATCHED</option>
                        <option value="ON_SCENE">ON_SCENE</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </div>

                    {/* Title & Details */}
                    <div>
                      <h3 className="font-bold text-gray-100 text-sm leading-snug">
                        {call.title}
                      </h3>
                      <p className="text-xs text-gray-300 font-sans mt-1">
                        {call.details}
                      </p>
                    </div>

                    {/* Meta info: Location & Caller */}
                    <div className="p-2 bg-[#0A0D12] rounded-lg border border-gray-800 space-y-1 text-[11px] font-sans">
                      <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{call.location} <strong className="font-mono text-gray-400">(Postal: {call.postalCode || 'N/A'})</strong></span>
                      </div>
                      <div className="flex items-center justify-between text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-500" />
                          Pelapor: {call.callerName} ({call.callerPhone || '555-0911'})
                        </span>
                        <span className="font-mono text-[10px] text-gray-500">
                          {new Date(call.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Assigned Units */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-gray-400 font-bold">UNIT TERJUN:</span>
                      {call.assignedUnits.length > 0 ? (
                        call.assignedUnits.map((u, i) => (
                          <span key={i} className="px-1.5 py-0.2 rounded bg-blue-950/80 text-blue-300 border border-blue-800 text-[10px] font-bold">
                            🚔 {u}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-amber-400 italic">Belum ada unit yang menerima panggilan</span>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Controls */}
                  <div className="pt-2 border-t border-gray-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {units.map(u => (
                        <button
                          key={u.id}
                          onClick={() => handleAssignUnitToCall(call.id, u.callsign)}
                          className="px-2 py-0.5 rounded bg-gray-800 hover:bg-blue-900 text-gray-300 hover:text-blue-200 border border-gray-700 text-[10px] font-mono transition"
                          title={`Tugaskan unit ${u.callsign} ke panggilan ini`}
                        >
                          +{u.callsign}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(radioMsg, call.id)}
                      className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-[11px] font-medium transition flex items-center gap-1 border border-gray-700"
                      title="Salin pesan radio panggilan 911 untuk Radio 1111 / Discord"
                    >
                      {copiedText === call.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                      <span>{copiedText === call.id ? 'Tersalin' : 'Radio'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE UNITS STATUS CAD BOARD */}
      {activeTab === 'units' && (
        <div className="space-y-3">
          <div className="p-3 bg-[#141820] border border-gray-800 rounded-xl flex items-center justify-between">
            <span className="font-bold text-gray-200 text-xs">
              STATUS PATROLI UNIT AKTIF LAPANGAN (ROSTER REALTIME)
            </span>
            <span className="text-[11px] text-emerald-400 font-bold">
              {units.filter(u => u.status === '8-1-1' || u.status === '10-8').length} Unit Siap Tugas (8-1-1)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {units.map((unit) => {
              const isOnDuty = unit.status === '8-1-1' || unit.status === '10-8';
              const is1097 = unit.status === '10-97';
              return (
                <div
                  key={unit.id}
                  className="p-3.5 bg-[#141820] border border-gray-800 rounded-xl space-y-2.5 hover:border-gray-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isOnDuty 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700' 
                          : is1097
                            ? 'bg-blue-950 text-blue-400 border border-blue-700'
                            : 'bg-amber-950 text-amber-400 border border-amber-700'
                      }`}>
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-100 text-xs">{unit.callsign}</div>
                        <div className="text-[10px] text-gray-400">{unit.division}</div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isOnDuty
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : is1097
                          ? 'bg-blue-950 text-blue-300 border border-blue-700'
                          : 'bg-amber-950 text-amber-300 border border-amber-700'
                    }`}>
                      {unit.status}
                    </span>
                  </div>

                  <div className="p-2 bg-[#0A0D12] rounded-lg border border-gray-800 space-y-1 text-[11px] font-sans">
                    <div className="text-gray-200">
                      👮 <strong>{unit.primaryOfficerName}</strong> ({unit.primaryOfficerBadge})
                      {unit.partnerOfficerName && (
                        <span className="text-gray-400"> + {unit.partnerOfficerName} ({unit.partnerOfficerBadge})</span>
                      )}
                    </div>
                    <div className="text-gray-400 flex items-center gap-1">
                      <Car className="w-3 h-3 text-gray-500" />
                      {unit.vehicleType}
                    </div>
                    <div className="text-amber-300/90 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      {unit.lastLocation}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-400 font-mono italic">{unit.statusText}</span>
                    <span className="text-gray-500 font-mono">
                      {new Date(unit.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CODE 3 PURSUIT TRACKER */}
      {activeTab === 'pursuit' && (
        <div className="space-y-4">
          {pursuit && pursuit.status === 'ACTIVE' ? (
            <div className="p-4 bg-gradient-to-r from-red-950/60 via-[#141820] to-neutral-900 border-2 border-red-600 rounded-2xl shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold shadow-lg shadow-red-950">
                    <Flame className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-red-900 text-red-200 border border-red-700 uppercase">
                      CODE 3 HIGH SPEED PURSUIT ACTIVE
                    </span>
                    <h3 className="text-base font-extrabold text-white mt-0.5">
                      {pursuit.targetVehicle}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const updated: PursuitTrackerState = { ...pursuit, status: '10-15_APPREHENDED', updatedAt: Date.now() };
                      setPursuit(updated);
                      savePursuit(updated);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>10-15 TERSANGKA TANGKAP</span>
                  </button>
                  <button
                    onClick={() => {
                      const updated: PursuitTrackerState = { ...pursuit, status: '10-22_LOST', updatedAt: Date.now() };
                      setPursuit(updated);
                      savePursuit(updated);
                    }}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-gray-700"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>10-22 LOST VISUAL</span>
                  </button>
                </div>
              </div>

              {/* Pursuit Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#0A0D12] rounded-xl border border-gray-800 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">LOKASI & ARAH LAJU:</span>
                  <div className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-amber-400" />
                    <span>{pursuit.headingDirection}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 font-sans">
                    {pursuit.lastLocation}
                  </div>
                </div>

                <div className="p-3 bg-[#0A0D12] rounded-xl border border-gray-800 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">UNIT TERLIBAT:</span>
                  <div className="text-xs text-gray-200 font-bold">
                    Primary: <span className="text-blue-300">{pursuit.primaryUnit}</span>
                  </div>
                  <div className="text-[11px] text-gray-400">
                    Secondary: {pursuit.secondaryUnits.join(', ')} • Air: {pursuit.airUnitCallsign || 'N/A'}
                  </div>
                </div>

                <div className="p-3 bg-[#0A0D12] rounded-xl border border-gray-800 space-y-2">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">OTORISASI TAKTIS:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => handleTogglePursuitAuth('isPitAuthorized')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                        pursuit.isPitAuthorized 
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-600' 
                          : 'bg-gray-800 text-gray-500 border-gray-700'
                      }`}
                    >
                      PIT: {pursuit.isPitAuthorized ? '✅ DISETUJUI' : '❌ DILARANG'}
                    </button>
                    <button
                      onClick={() => handleTogglePursuitAuth('isSpikeAuthorized')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                        pursuit.isSpikeAuthorized 
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-600' 
                          : 'bg-gray-800 text-gray-500 border-gray-700'
                      }`}
                    >
                      SPIKE STRIP: {pursuit.isSpikeAuthorized ? '✅ DISETUJUI' : '❌ DILARANG'}
                    </button>
                    <button
                      onClick={() => handleTogglePursuitAuth('isBoxingAuthorized')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                        pursuit.isBoxingAuthorized 
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-600' 
                          : 'bg-gray-800 text-gray-500 border-gray-700'
                      }`}
                    >
                      BOXING: {pursuit.isBoxingAuthorized ? '✅ DISETUJUI' : '❌ DILARANG'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#141820] border border-gray-800 rounded-2xl space-y-3">
              <Car className="w-12 h-12 text-gray-600 mx-auto" />
              <h3 className="text-base font-bold text-gray-300">Tidak Ada Pengejaran Code 3 Aktif</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto font-sans">
                Tekan tombol di bawah bila terjadi pengejaran kecepatan tinggi terhadap buronan bersenjata atau pelanggar lalu lintas berat.
              </p>
              <button
                onClick={() => {
                  const newPursuit: PursuitTrackerState = {
                    id: `pursuit-${Date.now()}`,
                    targetVehicle: 'Declasse Granger 3600LX (Plat: 09KLS91)',
                    suspectCount: 2,
                    lastLocation: 'Innocence Blvd / Strawberry Ave',
                    headingDirection: 'Southbound to Davis',
                    codeLevel: 'CODE 3',
                    primaryUnit: '1-ADAM-12',
                    secondaryUnits: ['2-TOM-2'],
                    airUnitCallsign: 'AIR-1',
                    isPitAuthorized: true,
                    isSpikeAuthorized: true,
                    isBoxingAuthorized: false,
                    status: 'ACTIVE',
                    startedAt: Date.now(),
                    updatedAt: Date.now()
                  };
                  setPursuit(newPursuit);
                  savePursuit(newPursuit);
                }}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-red-950"
              >
                + MULAI TRACKING PENGEJARAN BARU (CODE 3)
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL: CREATE 911 CALL */}
      {isNewCallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0F1318] border border-blue-500/60 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-950/80 to-[#141820] border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <PhoneCall className="w-4 h-4" />
                <span>INPUT PANGGILAN DARURAT 911 BARU</span>
              </div>
              <button onClick={() => setIsNewCallModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCall} className="p-4 space-y-3 font-sans text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Judul / Kode Kejadian *</label>
                <input
                  type="text"
                  required
                  value={newCallTitle}
                  onChange={(e) => setNewCallTitle(e.target.value)}
                  placeholder="Contoh: 10-90 Perampokan Toko Bersenjata / 10-71 Shots Fired"
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Nama Pelapor</label>
                  <input
                    type="text"
                    value={newCallCaller}
                    onChange={(e) => setNewCallCaller(e.target.value)}
                    placeholder="Warga / Saksi Mata"
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={newCallPhone}
                    onChange={(e) => setNewCallPhone(e.target.value)}
                    placeholder="555-0199"
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-gray-300 font-bold mb-1">Lokasi TKP *</label>
                  <input
                    type="text"
                    required
                    value={newCallLocation}
                    onChange={(e) => setNewCallLocation(e.target.value)}
                    placeholder="Contoh: Legion Square / Strawberry Ave"
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={newCallPostal}
                    onChange={(e) => setNewCallPostal(e.target.value)}
                    placeholder="7014"
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Tingkat Prioritas Respon</label>
                <select
                  value={newCallPriority}
                  onChange={(e) => setNewCallPriority(e.target.value as Call911Priority)}
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:outline-none font-mono"
                >
                  <option value="CODE 3 (URGENT)">🚨 CODE 3 (URGENT - Sirene & Rotator)</option>
                  <option value="CODE 2 (MEDIUM)">⚠️ CODE 2 (MEDIUM - Respon Cepat Tanpa Sirene)</option>
                  <option value="CODE 1 (LOW)">🔵 CODE 1 (LOW - Rutin / Non-Darurat)</option>
                  <option value="CODE 99 (OFFICER DOWN)">🔥 CODE 99 (OFFICER DOWN / DARURAT MAKSIMAL)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Detail & Keterangan Tambahan</label>
                <textarea
                  rows={3}
                  value={newCallDetails}
                  onChange={(e) => setNewCallDetails(e.target.value)}
                  placeholder="Ciri-ciri pelaku, kendaraan, jumlah sandera, jenis senjata..."
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCallModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg font-medium hover:bg-gray-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>PUBLIKASIKAN KE CAD 911</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
