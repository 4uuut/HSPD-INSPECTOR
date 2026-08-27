import React, { useState } from 'react';
import { 
  Plus, Shield, AlertTriangle, Flame, 
  Crosshair, Check, Copy, Zap, X, Send, Radio
} from 'lucide-react';
import { SwatOperation, OfficerProfile } from '../../types';
import { saveSwatOps } from '../../utils/specializedDivisionsStorage';
import { sendDiscordLog, getDiscordWebhookConfig } from '../../utils/discordWebhook';

interface SwatTacticalPanelProps {
  swatOps: SwatOperation[];
  onUpdateOps: (ops: SwatOperation[]) => void;
  currentOfficer: OfficerProfile | null;
}

export const SwatTacticalPanel: React.FC<SwatTacticalPanelProps> = ({
  swatOps,
  onUpdateOps,
  currentOfficer
}) => {
  const [isNewOpModal, setIsNewOpModal] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Form states
  const [opCode, setOpCode] = useState('');
  const [missionType, setMissionType] = useState<'HOSTAGE_RESCUE' | 'BARRICADED_SUSPECT' | 'HIGH_RISK_WARRANT' | 'BANK_ROBBERY' | 'VIP_ESCORT'>('HIGH_RISK_WARRANT');
  const [threatLevel, setThreatLevel] = useState<'HIGH' | 'CODE_RED' | 'CODE_BLACK'>('CODE_RED');
  const [targetLocation, setTargetLocation] = useState('');
  const [breachingPlan, setBreachingPlan] = useState<'EXPLOSIVE_C4' | 'BATTERING_RAM' | 'SHOTGUN_BREACH' | 'STEALTH_LOCKPICK' | 'GAS_ENTRY'>('EXPLOSIVE_C4');
  const [assignedOperators, setAssignedOperators] = useState('Pointman (Shield), Breacher (C4), Assaulter 1, Assaulter 2, Sniper Overwatch');
  const [hostageCount, setHostageCount] = useState(0);
  const [armedSuspectCount, setArmedSuspectCount] = useState(3);
  const [notes, setNotes] = useState('');

  // Selected Active Operation for Live Commander Dashboard
  const [selectedOpId, setSelectedOpId] = useState<string | null>(swatOps[0]?.id || null);
  const activeOp = swatOps.find(o => o.id === selectedOpId) || swatOps[0];

  // Live Incident Counters
  const [liveHostagesSecured, setLiveHostagesSecured] = useState(0);
  const [liveSuspectsNeutralized, setLiveSuspectsNeutralized] = useState(0);
  const [liveSuspectsInCustody, setLiveSuspectsInCustody] = useState(0);
  const [liveBreachCountdown, setLiveBreachCountdown] = useState<number | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleCreateSwatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opCode.trim() || !targetLocation.trim()) return;

    const newOp: SwatOperation = {
      id: `swat-op-${Date.now()}`,
      opCode: opCode.trim().toUpperCase(),
      missionType,
      threatLevel,
      teamLeadName: currentOfficer?.name || 'SWAT Commander',
      teamLeadBadge: currentOfficer?.badge || '#SWAT-01',
      assignedOperators: assignedOperators.split(',').map(s => s.trim()).filter(Boolean),
      breachingPlan,
      status: 'EXECUTING',
      targetLocation: targetLocation.trim(),
      hostageCount,
      armedSuspectCount,
      createdAt: Date.now(),
      notes: notes.trim()
    };

    const updated = [newOp, ...swatOps];
    onUpdateOps(updated);
    saveSwatOps(updated);
    setSelectedOpId(newOp.id);
    setIsNewOpModal(false);

    // Reset Form
    setOpCode('');
    setTargetLocation('');
    setNotes('');
  };

  const handleToggleStatus = (opId: string, nextStatus: any) => {
    const updated = swatOps.map(op => op.id === opId ? { ...op, status: nextStatus } : op);
    onUpdateOps(updated);
    saveSwatOps(updated);
  };

  const handleTriggerCountdown = () => {
    setLiveBreachCountdown(3);
    const interval = setInterval(() => {
      setLiveBreachCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendAarDiscord = async (op: SwatOperation) => {
    const cfg = getDiscordWebhookConfig();
    if (!cfg.webhookUrl) {
      alert('Webhook Discord belum disetting.');
      return;
    }

    const success = await sendDiscordLog(cfg.webhookUrl, {
      title: `⚡ SWAT AFTER-ACTION REPORT (AAR): ${op.opCode}`,
      description: `Laporan Penyelesaian Operasi Taktis SWAT HSPD di ${op.targetLocation}`,
      color: 0xdc2626,
      fields: [
        { name: 'Kode Operasi', value: `\`${op.opCode}\``, inline: true },
        { name: 'Jenis Misi', value: op.missionType, inline: true },
        { name: 'Status Akhir', value: `**${op.status}**`, inline: true },
        { name: 'Metode Dobrak', value: op.breachingPlan, inline: true },
        { name: 'Sandera Selamat', value: `${liveHostagesSecured} Orang`, inline: true },
        { name: 'Pelaku Ditahan/Lumpuh', value: `${liveSuspectsInCustody} Ditahan / ${liveSuspectsNeutralized} Dilumpuhkan`, inline: true },
        { name: 'Tim Operator', value: op.assignedOperators.join(', ') || 'SWAT Tactical Squad', inline: false },
        { name: 'Catatan Komandan', value: op.notes || 'Operasi selesai sesuai SOP SWAT.', inline: false },
        { name: 'Komandan SWAT', value: `${op.teamLeadName} (${op.teamLeadBadge})`, inline: true }
      ]
    });

    if (success) {
      alert('✅ Laporan Taktis SWAT (AAR) berhasil dikirim ke Webhook Discord!');
    }
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
            <span>SATUAN TAKTIS SWAT (SPECIAL WEAPONS AND TACTICS)</span>
          </h3>
          <p className="text-[11px] text-gray-400">
            Penanganan sandera, terorisme, penyerbuan perampokan bank, dan penangkapan target berisiko tinggi (Code Red / Code 99).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewOpModal(true)}
          className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-md shadow-red-600/30"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ OPERASI SWAT BARU</span>
        </button>
      </div>

      {/* Live Incident Commander Board */}
      {activeOp && (
        <div className="p-4 bg-[#141820] border-2 border-red-800/80 rounded-2xl space-y-3.5 shadow-2xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded bg-red-950 text-red-300 border border-red-700 font-mono font-bold text-xs">
                {activeOp.opCode}
              </span>
              <span className="font-bold text-gray-100 text-sm">{activeOp.missionType}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold">
                {activeOp.threatLevel}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
                activeOp.status === 'ALL_CLEAR'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : 'bg-red-600 text-white animate-pulse'
              }`}>
                STATUS: {activeOp.status}
              </span>
              <button
                type="button"
                onClick={() => handleToggleStatus(activeOp.id, activeOp.status === 'EXECUTING' ? 'ALL_CLEAR' : 'EXECUTING')}
                className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs font-bold border border-gray-700"
              >
                Ubah Status
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Live Hostage & Suspect Counters */}
            <div className="p-3 bg-[#0A0D12] rounded-xl border border-gray-800 space-y-2 font-mono">
              <div className="text-[10px] font-bold text-gray-400">PENGENDALIAN SANDERA & PELAKU:</div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-xs">Sandera Selamat:</span>
                <div className="flex items-center gap-1.5">
                  <button 
                    type="button"
                    onClick={() => setLiveHostagesSecured(Math.max(0, liveHostagesSecured - 1))}
                    className="w-6 h-6 rounded bg-gray-800 text-gray-200 font-bold hover:bg-gray-700"
                  >-</button>
                  <span className="font-bold text-emerald-400 text-sm px-1.5">{liveHostagesSecured}</span>
                  <button 
                    type="button"
                    onClick={() => setLiveHostagesSecured(liveHostagesSecured + 1)}
                    className="w-6 h-6 rounded bg-gray-800 text-gray-200 font-bold hover:bg-gray-700"
                  >+</button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-xs">Pelaku Ditahan:</span>
                <div className="flex items-center gap-1.5">
                  <button 
                    type="button"
                    onClick={() => setLiveSuspectsInCustody(Math.max(0, liveSuspectsInCustody - 1))}
                    className="w-6 h-6 rounded bg-gray-800 text-gray-200 font-bold hover:bg-gray-700"
                  >-</button>
                  <span className="font-bold text-blue-400 text-sm px-1.5">{liveSuspectsInCustody}</span>
                  <button 
                    type="button"
                    onClick={() => setLiveSuspectsInCustody(liveSuspectsInCustody + 1)}
                    className="w-6 h-6 rounded bg-gray-800 text-gray-200 font-bold hover:bg-gray-700"
                  >+</button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-xs">Pelaku Dilumpuhkan:</span>
                <div className="flex items-center gap-1.5">
                  <button 
                    type="button"
                    onClick={() => setLiveSuspectsNeutralized(Math.max(0, liveSuspectsNeutralized - 1))}
                    className="w-6 h-6 rounded bg-gray-800 text-gray-200 font-bold hover:bg-gray-700"
                  >-</button>
                  <span className="font-bold text-rose-400 text-sm px-1.5">{liveSuspectsNeutralized}</span>
                  <button 
                    type="button"
                    onClick={() => setLiveSuspectsNeutralized(liveSuspectsNeutralized + 1)}
                    className="w-6 h-6 rounded bg-gray-800 text-gray-200 font-bold hover:bg-gray-700"
                  >+</button>
                </div>
              </div>
            </div>

            {/* Tactical Plan & Breaching Info */}
            <div className="p-3 bg-[#0A0D12] rounded-xl border border-gray-800 space-y-1.5 font-sans">
              <div className="text-[10px] font-bold text-gray-400 font-mono">RENCANA PENYERBUAN TAKTIS:</div>
              <div>📍 Target: <strong className="text-gray-100">{activeOp.targetLocation}</strong></div>
              <div>💥 Metode Dobrak: <strong className="text-amber-400 font-mono">{activeOp.breachingPlan}</strong></div>
              <div className="text-gray-400 text-[11px]">
                🛡️ Susunan Tim (Stack): {activeOp.assignedOperators.join(' ➔ ')}
              </div>
            </div>

            {/* Fast Action Buttons & Countdown */}
            <div className="p-3 bg-[#0A0D12] rounded-xl border border-gray-800 space-y-2 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold text-gray-400 font-mono mb-1.5">TOMBOL TAKTIS CEPAT:</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={handleTriggerCountdown}
                    className="p-1.5 bg-red-700 hover:bg-red-600 text-white font-bold rounded text-xs flex items-center justify-center gap-1 font-mono shadow"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>{liveBreachCountdown !== null ? `HIT IN: ${liveBreachCountdown}s` : 'BREACH 3-2-1'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy('[SWAT TACTICAL] ROOM CLEAR! ALL OPERATORS SECURE.', 'roomclear')}
                    className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded text-xs flex items-center justify-center gap-1 font-mono"
                  >
                    <span>{copiedText === 'roomclear' ? 'Tersalin!' : 'ROOM CLEAR'}</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSendAarDiscord(activeOp)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 font-mono shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Laporan AAR SWAT ke Discord</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SWAT Operations Archive Grid */}
      <div className="space-y-2">
        <div className="font-bold text-gray-300 text-xs">DAFTAR OPERASI & BRIEFING TAKTIS SWAT:</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {swatOps.map((op) => (
            <div
              key={op.id}
              onClick={() => setSelectedOpId(op.id)}
              className={`p-3.5 rounded-xl border transition cursor-pointer space-y-2 ${
                op.id === selectedOpId
                  ? 'bg-[#181E29] border-red-500 shadow-md ring-1 ring-red-500/50'
                  : 'bg-[#141820] border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-red-400 bg-red-950 px-1.5 py-0.5 rounded border border-red-900">
                    {op.opCode}
                  </span>
                  <span className="font-bold text-gray-200 text-xs">{op.missionType}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  op.status === 'ALL_CLEAR'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-red-600 text-white'
                }`}>
                  {op.status}
                </span>
              </div>

              <div className="text-[11px] text-gray-400 space-y-0.5">
                <div>📍 Lokasi: <strong className="text-gray-200">{op.targetLocation}</strong></div>
                <div>💥 Metode: {op.breachingPlan}</div>
              </div>

              <p className="text-[11px] text-gray-300 line-clamp-1 italic">
                "{op.notes || 'Nihil catatan khusus'}"
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* New SWAT Modal */}
      {isNewOpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn font-sans">
          <div className="w-full max-w-md bg-[#0F1318] border border-red-500/60 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="font-bold text-red-400 text-sm">BUAT OPERASI PENYERBUAN SWAT BARU</span>
              <button onClick={() => setIsNewOpModal(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateSwatSubmit} className="space-y-3">
              <div>
                <label className="block text-gray-300 font-bold mb-1">Kode Sandi Operasi *</label>
                <input
                  type="text"
                  required
                  value={opCode}
                  onChange={(e) => setOpCode(e.target.value)}
                  placeholder="Contoh: OP-VIPER-STRIKE"
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Jenis Misi</label>
                  <select
                    value={missionType}
                    onChange={(e) => setMissionType(e.target.value as any)}
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                  >
                    <option value="HIGH_RISK_WARRANT">HIGH RISK WARRANT</option>
                    <option value="HOSTAGE_RESCUE">HOSTAGE RESCUE</option>
                    <option value="BARRICADED_SUSPECT">BARRICADED SUSPECT</option>
                    <option value="BANK_ROBBERY">BANK ROBBERY CODE RED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Tingkat Ancaman</label>
                  <select
                    value={threatLevel}
                    onChange={(e) => setThreatLevel(e.target.value as any)}
                    className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                  >
                    <option value="CODE_RED">CODE RED (Senjata Otomatis)</option>
                    <option value="HIGH">HIGH THREAT</option>
                    <option value="CODE_BLACK">CODE BLACK (Ekstrem/Teror)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Lokasi Target Penyerbuan *</label>
                <input
                  type="text"
                  required
                  value={targetLocation}
                  onChange={(e) => setTargetLocation(e.target.value)}
                  placeholder="Contoh: Gudang Docks Terminal 4"
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                />
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Rencana Dobrak (Breaching)</label>
                <select
                  value={breachingPlan}
                  onChange={(e) => setBreachingPlan(e.target.value as any)}
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200 font-mono"
                >
                  <option value="EXPLOSIVE_C4">EXPLOSIVE C4 (Peledakan Kusen Pintu)</option>
                  <option value="BATTERING_RAM">BATTERING RAM (Dobrak Manual Besi)</option>
                  <option value="SHOTGUN_BREACH">SHOTGUN BREACH (Tembak Engsel)</option>
                  <option value="GAS_ENTRY">GAS ENTRY (Granat Asap & Flashbang)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 font-bold mb-1">Catatan Taktis & Sniper</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Posisi sniper di atap utara, tim breacher masuk dari pintu samping..."
                  className="w-full bg-[#141820] border border-gray-700 rounded-lg p-2 text-gray-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                <button type="button" onClick={() => setIsNewOpModal(false)} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-red-600 text-white font-bold rounded-lg">Luncurkan Briefing SWAT</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
