import React, { useState, useEffect } from 'react';
import { OfficerProfile, DutyStatusCode, DutyLog, isOfficerHighRank } from '../types';
import { 
  Radio, Shield, Power, Clock, User, CheckCircle2, 
  AlertCircle, Settings, Send, RefreshCw, X, Globe,
  CheckCheck, Timer, Calendar, ShieldCheck
} from 'lucide-react';
import { 
  getSavedDutyWebhookConfig, saveDutyWebhookConfig, 
  sendDutyReportToDiscord, testDutyDiscordWebhook, WebhookConfig 
} from '../utils/discordWebhook';
import { HSPD_LOGO_URL } from '../assets/logo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentOfficer: OfficerProfile;
  isDuty: boolean;
  dutyStartTime: number;
  onDutyStatusChanged: (newDutyState: boolean, newDutyStartTime: number) => void;
}

export const DutyControlModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentOfficer,
  isDuty,
  dutyStartTime,
  onDutyStatusChanged
}) => {
  const [selectedStatus, setSelectedStatus] = useState<DutyStatusCode>(isDuty ? '10-7' : '10-8');

  // Webhook settings modal inside
  const [showConfig, setShowConfig] = useState(false);
  const [dutyWebhookConfig, setDutyWebhookConfig] = useState<WebhookConfig>(() => getSavedDutyWebhookConfig());
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Live timer tick for real-time duty duration
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ type: 'success' | 'error'; message: string; shiftSummary?: string } | null>(null);

  // Sync default next state when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(isDuty ? '10-7' : '10-8');
      setSubmitFeedback(null);
      setCurrentTime(Date.now());
    }
  }, [isOpen, isDuty]);

  // Live second ticker while modal is open and on duty
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate live duty duration
  const elapsedMs = (isDuty && dutyStartTime > 0) ? Math.max(0, currentTime - dutyStartTime) : 0;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedHours = Math.floor(elapsedMinutes / 60);

  const displayHours = elapsedHours;
  const displayMinutes = elapsedMinutes % 60;
  const displaySeconds = elapsedSeconds % 60;

  let durationDetailedStr = '';
  if (displayHours > 0) {
    durationDetailedStr += `${displayHours} Jam `;
  }
  durationDetailedStr += `${displayMinutes} Menit ${displaySeconds} Detik`;

  const durationSimpleStr = `${displayHours > 0 ? `${displayHours} Jam ` : ''}${displayMinutes} Menit`;

  const startTimeStr = dutyStartTime > 0 
    ? new Date(dutyStartTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
    : '-';

  const endTimeStr = new Date(currentTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitFeedback(null);

    const now = Date.now();
    const finalElapsedMs = (isDuty && dutyStartTime > 0) ? Math.max(0, now - dutyStartTime) : 0;
    const finalMinutes = Math.floor(finalElapsedMs / 60000);
    const finalHours = Math.floor(finalMinutes / 60);
    const finalRemMins = finalMinutes % 60;
    const finalSeconds = Math.floor((finalElapsedMs % 60000) / 1000);

    const finalDurationFormatted = finalHours > 0 
      ? `${finalHours} Jam ${finalRemMins} Menit ${finalSeconds} Detik` 
      : `${finalRemMins} Menit ${finalSeconds} Detik`;

    const statusTexts: Record<DutyStatusCode, string> = {
      '10-8': '10-8 ON DUTY (Mulai Dinas / Siap Patroli)',
      '10-7': '10-7 OFF DUTY (Selesai Dinas / Lepas Piket)',
      '10-6': '10-6 BUSY (Sedang Penanganan Kasus / Sidang)',
      '10-97': '10-97 ON SCENE (Tiba di Lokasi Operasi)'
    };

    const dutyLog: DutyLog = {
      id: `duty-${Date.now()}`,
      officerName: currentOfficer.name,
      officerBadge: currentOfficer.badge,
      officerRank: currentOfficer.rank,
      division: currentOfficer.division || 'Patrol Division',
      status: selectedStatus,
      statusText: statusTexts[selectedStatus],
      timestamp: now,
      dutyStartTime: selectedStatus === '10-7' ? dutyStartTime : (selectedStatus === '10-8' ? now : undefined),
      dutyEndTime: selectedStatus === '10-7' ? now : undefined,
      durationMinutes: selectedStatus === '10-7' ? finalMinutes : undefined,
      durationFormatted: selectedStatus === '10-7' ? finalDurationFormatted : undefined
    };

    let webhookSuccess = true;
    let webhookMsg = '';

    if (dutyWebhookConfig.webhookUrl && dutyWebhookConfig.webhookUrl.trim()) {
      const res = await sendDutyReportToDiscord(dutyLog, dutyWebhookConfig);
      webhookSuccess = res.success;
      webhookMsg = res.message;
    }

    // Determine new isDuty state
    let newDutyState = isDuty;
    let newDutyStartTime = dutyStartTime;

    if (selectedStatus === '10-8') {
      newDutyState = true;
      newDutyStartTime = now;
    } else if (selectedStatus === '10-7') {
      newDutyState = false;
      newDutyStartTime = 0;
    }

    onDutyStatusChanged(newDutyState, newDutyStartTime);
    setIsSubmitting(false);

    if (dutyWebhookConfig.webhookUrl.trim() && !webhookSuccess) {
      setSubmitFeedback({
        type: 'error',
        message: `Status dinas lokal diperbarui, namun Discord Webhook gagal: ${webhookMsg}`
      });
    } else {
      setSubmitFeedback({
        type: 'success',
        message: `✅ Laporan status dinas [${selectedStatus}] berhasil diperbarui${dutyWebhookConfig.webhookUrl.trim() ? ' & terkirim ke Discord!' : '!'}`,
        shiftSummary: selectedStatus === '10-7' ? `Total Durasi Dinas: ${finalDurationFormatted} (Mulai: ${startTimeStr} - Selesai: ${endTimeStr})` : undefined
      });
      setTimeout(() => {
        onClose();
      }, selectedStatus === '10-7' ? 1800 : 1000);
    }
  };

  const handleSaveConfig = () => {
    saveDutyWebhookConfig(dutyWebhookConfig);
    setShowConfig(false);
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setTestStatus(null);
    const res = await testDutyDiscordWebhook(dutyWebhookConfig);
    setIsTestingWebhook(false);
    setTestStatus(res);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#161B22] border border-blue-900/60 rounded-xl max-w-lg w-full p-4 sm:p-5 shadow-2xl space-y-4 max-h-[94vh] overflow-y-auto font-mono">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="relative group shrink-0">
              <img
                src={HSPD_LOGO_URL}
                alt="HSPD Crest"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-contain drop-shadow-md border border-amber-500/40 bg-black/60 p-0.5"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-100 flex items-center gap-2">
                <span>Laporan Status Dinas (Duty Dispatch)</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  isDuty ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {isDuty ? '🟢 ON DUTY' : '🔴 OFF DUTY'}
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">
                Petugas: <strong className="text-gray-200">{currentOfficer.name}</strong> ({currentOfficer.badge}) • <span className="text-amber-400">{currentOfficer.rank}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isOfficerHighRank(currentOfficer.rank) && (
              <button
                type="button"
                onClick={() => setShowConfig(prev => !prev)}
                className={`p-1.5 rounded transition text-xs flex items-center gap-1 border ${
                  showConfig 
                    ? 'bg-amber-600 text-white border-amber-500' 
                    : 'bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border-amber-800'
                }`}
                title="Atur Webhook Khusus Duty Log (High Command Only)"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">👑 Webhook Duty</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FEEDBACK STATUS */}
        {submitFeedback && (
          <div className={`p-3 rounded-lg text-xs space-y-1 border ${
            submitFeedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800 text-rose-300'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              {submitFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{submitFeedback.message}</span>
            </div>
            {submitFeedback.shiftSummary && (
              <div className="text-[11px] text-emerald-200 pl-6 bg-black/30 p-1.5 rounded border border-emerald-800/40">
                {submitFeedback.shiftSummary}
              </div>
            )}
          </div>
        )}

        {/* DEDICATED DUTY WEBHOOK CONFIGURATION PANEL */}
        {showConfig && (
          <div className="p-3.5 bg-[#0D1117] border border-blue-900/80 rounded-lg space-y-3 text-xs animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="font-bold text-blue-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Pengaturan Discord Webhook Khusus Log Dinas
              </span>
              <span className="text-[10px] text-gray-500">Tersimpan di Browser</span>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-300 block mb-1">
                URL Discord Webhook (Channel Duty / Absensi Polisi):
              </label>
              <input
                type="text"
                value={dutyWebhookConfig.webhookUrl}
                onChange={(e) => setDutyWebhookConfig({ ...dutyWebhookConfig, webhookUrl: e.target.value })}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-200 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-300 block mb-1">
                  Nama Bot Discord:
                </label>
                <input
                  type="text"
                  value={dutyWebhookConfig.botName}
                  onChange={(e) => setDutyWebhookConfig({ ...dutyWebhookConfig, botName: e.target.value })}
                  placeholder="HSPD Duty Logger"
                  className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-300 block mb-1">
                  Avatar Bot URL:
                </label>
                <input
                  type="text"
                  value={dutyWebhookConfig.botAvatar}
                  onChange={(e) => setDutyWebhookConfig({ ...dutyWebhookConfig, botAvatar: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-200 outline-none"
                />
              </div>
            </div>

            {/* Test connection alert */}
            {testStatus && (
              <div className={`p-2 rounded text-[11px] flex items-center gap-1.5 border ${
                testStatus.success ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-rose-950/60 border-rose-800 text-rose-300'
              }`}>
                {testStatus.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                <span>{testStatus.message}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={isTestingWebhook || !dutyWebhookConfig.webhookUrl.trim()}
                className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-200 rounded text-[11px] flex items-center gap-1 transition"
              >
                {isTestingWebhook ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>Tes Sinyal Webhook</span>
              </button>

              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold transition"
              >
                Simpan Pengaturan
              </button>
            </div>
          </div>
        )}

        {/* STATUS SELECTION CARDS: 10-8 ON DUTY & 10-7 OFF DUTY ONLY */}
        <div>
          <label className="text-[11px] font-bold text-gray-300 uppercase block mb-2">
            Pilih Status Operasional Petugas:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 10-8 ON DUTY */}
            <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
              selectedStatus === '10-8'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500 shadow-lg shadow-emerald-950/30'
                : 'bg-[#0D1117] border-gray-800 hover:border-gray-700 text-gray-300'
            }`}>
              <input
                type="radio"
                name="dutyStatus"
                value="10-8"
                checked={selectedStatus === '10-8'}
                onChange={() => setSelectedStatus('10-8')}
                className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <div className="font-bold flex items-center gap-1.5 text-xs text-emerald-400">
                  <span>🟢 10-8 ON DUTY</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Mulai Piket / Siap Patroli</div>
              </div>
            </label>

            {/* 10-7 OFF DUTY */}
            <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
              selectedStatus === '10-7'
                ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-1 ring-rose-500 shadow-lg shadow-rose-950/30'
                : 'bg-[#0D1117] border-gray-800 hover:border-gray-700 text-gray-300'
            }`}>
              <input
                type="radio"
                name="dutyStatus"
                value="10-7"
                checked={selectedStatus === '10-7'}
                onChange={() => setSelectedStatus('10-7')}
                className="w-4 h-4 text-rose-500 focus:ring-rose-500"
              />
              <div>
                <div className="font-bold flex items-center gap-1.5 text-xs text-rose-400">
                  <span>🔴 10-7 OFF DUTY</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Selesai Dinas / Lepas Piket</div>
              </div>
            </label>
          </div>
        </div>

        {/* DETAILED DUTY DURATION RECAP CARD (DISPLAYED FOR 10-7 OFF DUTY & ACTIVE ON DUTY) */}
        {(selectedStatus === '10-7' || isDuty) && (
          <div className={`p-4 rounded-xl border space-y-3 transition ${
            selectedStatus === '10-7'
              ? 'bg-gradient-to-b from-[#1C1518] to-[#0D1117] border-rose-900/80 shadow-lg shadow-rose-950/20'
              : 'bg-gradient-to-b from-[#10221A] to-[#0D1117] border-emerald-900/80'
          }`}>
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Timer className={`w-4 h-4 ${selectedStatus === '10-7' ? 'text-rose-400' : 'text-emerald-400'}`} />
                <span className={selectedStatus === '10-7' ? 'text-rose-300' : 'text-emerald-300'}>
                  {selectedStatus === '10-7' ? 'REKAPITULASI SESI LEPAS DINAS (10-7 OFF DUTY)' : 'CATATAN WAKTU DINAS BERJALAN'}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                selectedStatus === '10-7' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {selectedStatus === '10-7' ? 'FINAL SHIFT RECAP' : 'LIVE SHIFT TIMER'}
              </span>
            </div>

            {/* Duration Display Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-[#0D1117] p-2.5 rounded-lg border border-gray-800 text-center">
                <div className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Mulai Dinas (10-8)</div>
                <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{startTimeStr}</span>
                </div>
              </div>

              <div className="bg-[#0D1117] p-2.5 rounded-lg border border-gray-800 text-center">
                <div className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Lepas Dinas (10-7)</div>
                <div className="text-xs font-bold text-rose-400 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{endTimeStr}</span>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border text-center ${
                selectedStatus === '10-7'
                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                  : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
              }`}>
                <div className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Total Lama Dinas</div>
                <div className="text-xs font-bold font-mono tracking-wide">
                  {durationDetailedStr || '0 Menit 0 Detik'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-gray-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>
                {selectedStatus === '10-7' 
                  ? 'Data durasi dinas di atas akan otomatis dicatat dan dikirimkan ke Discord Log Dinas.'
                  : 'Timer durasi dinas berjalan secara real-time selama Anda mengaktifkan status 10-8 ON DUTY.'}
              </span>
            </div>
          </div>
        )}

        {/* If selected 10-8 while previously off duty */}
        {selectedStatus === '10-8' && !isDuty && (
          <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/60 rounded-xl space-y-1.5 text-xs text-emerald-300">
            <div className="flex items-center gap-2 font-bold">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Mulai Sesi Dinas Baru (10-8 ON DUTY)</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Mengaktifkan status ini akan mencatat jam mulai dinas Anda sekarang (<code>{new Date().toLocaleTimeString('id-ID')} WIB</code>) dan mengirimkan notifikasi siap dinas ke Discord.
            </p>
          </div>
        )}

        {/* Discord Webhook Auto-Sync Indicator */}
        <div className="flex items-center justify-between p-2.5 bg-[#0D1117] border border-gray-800 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <Globe className={`w-3.5 h-3.5 ${dutyWebhookConfig.webhookUrl.trim() ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-gray-300 text-[11px]">
              {dutyWebhookConfig.webhookUrl.trim() 
                ? 'Webhook Discord Log Dinas: Siap Terkirim Otomatis' 
                : 'Webhook Discord belum diisi'}
            </span>
          </div>

          {!dutyWebhookConfig.webhookUrl.trim() ? (
            <button
              type="button"
              onClick={() => setShowConfig(true)}
              className="text-[10px] text-amber-400 hover:text-amber-300 underline font-bold"
            >
              + Isi URL Webhook
            </button>
          ) : (
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <CheckCheck className="w-3 h-3" /> Auto-Sync Active
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-5 py-2.5 text-white font-bold rounded-lg text-xs transition flex items-center gap-2 shadow-lg ${
              selectedStatus === '10-8'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses Laporan...</span>
              </>
            ) : (
              <>
                <Power className="w-3.5 h-3.5" />
                <span>
                  {selectedStatus === '10-8' ? '🟢 AKTIFKAN 10-8 (MULAI DINAS)' : '🔴 SELESAIKAN 10-7 (LEPAS DINAS)'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
