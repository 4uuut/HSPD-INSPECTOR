import React, { useState, useEffect, useRef } from 'react';
import { OfficerAccount, OfficerProfile } from '../types';
import { 
  X, Bot, Send, Zap, CheckCircle2, AlertCircle, AlertTriangle, 
  RefreshCw, Shield, Users, Radio, Save, Terminal, ExternalLink,
  Lock, Eye, EyeOff, Search
} from 'lucide-react';
import { 
  sendOfficerDirectMessageViaBot,
  sendBatchPinBroadcastLogToDiscord,
  getDiscordBotGatewayStatus,
  startDiscordBotGateway,
  getSavedSuperiorDmMessage,
  saveSuperiorDmMessage,
  getSavedDiscordBotConfig
} from '../utils/discordWebhook';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  roster: OfficerAccount[];
  currentOfficer: OfficerProfile | OfficerAccount;
}

interface LogEntry {
  id: string;
  time: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  badge?: string;
  name?: string;
}

export const BatchPinBroadcastModal: React.FC<Props> = ({
  isOpen,
  onClose,
  roster,
  currentOfficer
}) => {
  const [customMessage, setCustomMessage] = useState<string>(() => getSavedSuperiorDmMessage());
  const [savedMsgNotice, setSavedMsgNotice] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'valid_id' | 'missing_id'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Bot status
  const [botStatus, setBotStatus] = useState<{ isConnected: boolean; isOnline: boolean; botTag?: string }>({
    isConnected: false,
    isOnline: false
  });
  const [isActivatingBot, setIsActivatingBot] = useState(false);

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const pauseRef = useRef(false);
  const abortRef = useRef(false);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Check bot status on open
  useEffect(() => {
    if (isOpen) {
      const status = getDiscordBotGatewayStatus();
      setBotStatus(status);
      setCustomMessage(getSavedSuperiorDmMessage());
      setIsExecuting(false);
      setIsCompleted(false);
      setShowConfirm(false);
      setCurrentIndex(0);
      setSuccessCount(0);
      setFailedCount(0);
      setSkippedCount(0);
      setLogs([]);
      abortRef.current = false;
      pauseRef.current = false;
    }
  }, [isOpen]);

  // Auto scroll terminal
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen) return null;

  // Filter accounts with clean numeric Discord IDs
  const officersWithValidId = roster.filter(o => {
    const raw = (o.discordTag || '').trim();
    const cleanId = raw.replace(/\D/g, '');
    return cleanId.length >= 16;
  });

  const officersWithoutId = roster.filter(o => {
    const raw = (o.discordTag || '').trim();
    const cleanId = raw.replace(/\D/g, '');
    return cleanId.length < 16;
  });

  // Displayed officers list
  const filteredOfficers = roster.filter(o => {
    const raw = (o.discordTag || '').trim();
    const cleanId = raw.replace(/\D/g, '');
    const hasValid = cleanId.length >= 16;

    if (filterType === 'valid_id' && !hasValid) return false;
    if (filterType === 'missing_id' && hasValid) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = o.name.toLowerCase().includes(q);
      const matchBadge = o.badge.toLowerCase().includes(q);
      const matchRank = o.rank.toLowerCase().includes(q);
      return matchName || matchBadge || matchRank;
    }
    return true;
  });

  // Handle Quick Bot Activation
  const handleActivateBot = async () => {
    setIsActivatingBot(true);
    try {
      await startDiscordBotGateway();
      const st = getDiscordBotGatewayStatus();
      setBotStatus(st);
    } catch {}
    setIsActivatingBot(false);
  };

  // Save current message as default
  const handleSaveMessage = () => {
    saveSuperiorDmMessage(customMessage);
    setSavedMsgNotice('✅ Pesan atasan tersimpan sebagai default!');
    setTimeout(() => setSavedMsgNotice(null), 3500);
  };

  // Launch Mass Dispatch
  const handleStartDispatch = async () => {
    setShowConfirm(false);
    setIsExecuting(true);
    setIsCompleted(false);
    setIsPaused(false);
    abortRef.current = false;
    pauseRef.current = false;
    setCurrentIndex(0);
    setSuccessCount(0);
    setFailedCount(0);
    setSkippedCount(0);
    setLogs([]);

    const timestampStr = () => new Date().toLocaleTimeString('id-ID');

    addLog('info', `🚀 Memulai proses pengiriman PIN massal via Bot Discord ke seluruh akun personel...`);
    addLog('info', `📊 Total Akun: ${roster.length} personel | Siap kirim (Valid ID): ${officersWithValidId.length} | Tanpa ID: ${officersWithoutId.length}`);

    let localSuccess = 0;
    let localFailed = 0;
    let localSkipped = 0;

    for (let i = 0; i < roster.length; i++) {
      if (abortRef.current) {
        addLog('warning', `🛑 Pengiriman PIN massal dihentikan oleh pengguna.`);
        break;
      }

      // Check pause
      while (pauseRef.current) {
        await new Promise(r => setTimeout(r, 400));
        if (abortRef.current) break;
      }

      const officer = roster[i];
      setCurrentIndex(i + 1);

      const raw = (officer.discordTag || '').trim();
      const cleanId = raw.replace(/\D/g, '');

      if (!cleanId || cleanId.length < 16) {
        localSkipped++;
        setSkippedCount(localSkipped);
        addLog(
          'warning', 
          `[${officer.badge}] ${officer.name}: DILEWATI (Tidak memiliki Discord User ID numerik: "${officer.discordTag || 'KOSONG'}")`,
          officer.badge,
          officer.name
        );
        continue;
      }

      // Send Bot PM
      try {
        addLog('info', `[${officer.badge}] Mengirim kredensial PIN ke ${officer.name} (Discord ID: ${cleanId})...`);
        const res = await sendOfficerDirectMessageViaBot({
          userId: cleanId,
          officerName: officer.name,
          pin: officer.pin || '10-4',
          badge: officer.badge,
          rank: officer.rank,
          division: officer.division,
          customMessage: customMessage.trim() || undefined,
          messageType: 'credentials'
        });

        if (res.success) {
          localSuccess++;
          setSuccessCount(localSuccess);
          addLog(
            'success', 
            `[${officer.badge}] ${officer.name}: BERHASIL TERKIRIM KE PM DISCORD (${cleanId})`,
            officer.badge,
            officer.name
          );
        } else {
          localFailed++;
          setFailedCount(localFailed);
          addLog(
            'error', 
            `[${officer.badge}] ${officer.name}: GAGAL - ${res.message}`,
            officer.badge,
            officer.name
          );
        }
      } catch (err: any) {
        localFailed++;
        setFailedCount(localFailed);
        addLog(
          'error', 
          `[${officer.badge}] ${officer.name}: ERROR - ${err.message || 'Koneksi terputus'}`,
          officer.badge,
          officer.name
        );
      }

      // 600ms safety delay to avoid Discord rate limits
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    setIsExecuting(false);
    setIsCompleted(true);
    addLog('info', `🏁 Selesai! Hasil: ${localSuccess} Terkirim, ${localFailed} Gagal, ${localSkipped} Dilewati.`);

    // Automatically send batch audit log to PIN Webhook
    try {
      addLog('info', `📡 Mengirim laporan audit broadcast ke Webhook Pengiriman PIN Akun...`);
      const webhookRes = await sendBatchPinBroadcastLogToDiscord({
        superiorName: currentOfficer.name,
        superiorBadge: currentOfficer.badge,
        superiorRank: currentOfficer.rank,
        totalOfficers: roster.length,
        successCount: localSuccess,
        failedCount: localFailed,
        skippedCount: localSkipped,
        customMessage: customMessage.trim() || undefined
      });
      if (webhookRes.success) {
        addLog('success', `✅ Log audit massal berhasil dikirim ke Webhook Discord!`);
      } else {
        addLog('warning', `⚠️ Webhook notice: ${webhookRes.message}`);
      }
    } catch (e: any) {
      addLog('warning', `⚠️ Gagal mengirim log audit ke webhook: ${e.message}`);
    }
  };

  const addLog = (type: LogEntry['type'], message: string, badge?: string, name?: string) => {
    const newEntry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      time: new Date().toLocaleTimeString('id-ID'),
      type,
      message,
      badge,
      name
    };
    setLogs(prev => [...prev, newEntry]);
  };

  const handleTogglePause = () => {
    pauseRef.current = !isPaused;
    setIsPaused(!isPaused);
    addLog('info', isPaused ? '▶️ Melanjutkan pengiriman PIN...' : '⏸️ Pengiriman PIN dijeda sementara.');
  };

  const handleAbort = () => {
    abortRef.current = true;
    setIsExecuting(false);
    addLog('error', '🛑 Pengiriman dihentikan oleh pengguna.');
  };

  const progressPercent = roster.length > 0 ? Math.round((currentIndex / roster.length) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#161B22] border border-sky-600/80 rounded-xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden text-gray-100">
        
        {/* MODAL HEADER */}
        <div className="p-4 bg-gradient-to-r from-sky-950 via-[#0D1117] to-blue-950 border-b border-sky-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-600/20 border border-sky-500/60 flex items-center justify-center text-sky-400 shadow-md shadow-sky-950">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-sky-200 tracking-wide">
                  SEKALI KIRIM PIN BOT SEMUA AKUN
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-sky-950 text-sky-300 border border-sky-700/60">
                  MASS DISPATCH
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Kirim PIN login terminal MDT ke akun Discord seluruh personel kepolisian secara serentak via Bot
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">

          {/* TOP STATS & BOT STATUS */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center gap-3">
              <div className="p-2 rounded bg-sky-950 text-sky-400 border border-sky-800">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Total Akun Roster</div>
                <div className="text-base font-bold text-white font-mono">{roster.length} Personel</div>
              </div>
            </div>

            <div className="p-3 bg-[#0D1117] border border-emerald-900/50 rounded-lg flex items-center gap-3">
              <div className="p-2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-emerald-400 uppercase">Siap Kirim (Valid ID)</div>
                <div className="text-base font-bold text-emerald-300 font-mono">{officersWithValidId.length} Akun</div>
              </div>
            </div>

            <div className="p-3 bg-[#0D1117] border border-amber-900/50 rounded-lg flex items-center gap-3">
              <div className="p-2 rounded bg-amber-950 text-amber-400 border border-amber-800">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-amber-400 uppercase">Tanpa Discord ID</div>
                <div className="text-base font-bold text-amber-300 font-mono">{officersWithoutId.length} Akun</div>
              </div>
            </div>

            {/* Status Bot */}
            <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded border ${botStatus.isOnline ? 'bg-emerald-950 text-emerald-400 border-emerald-700' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Gateway Bot</div>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span className={`w-2 h-2 rounded-full ${botStatus.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                    <span className={botStatus.isOnline ? 'text-emerald-300' : 'text-gray-400'}>
                      {botStatus.isOnline ? 'Online (Hijau)' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
              {!botStatus.isOnline && (
                <button
                  type="button"
                  onClick={handleActivateBot}
                  disabled={isActivatingBot}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition flex items-center gap-1"
                >
                  {isActivatingBot ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  <span>Nyalakan</span>
                </button>
              )}
            </div>
          </div>

          {/* SUPERIOR CUSTOM MESSAGE TO ATTACH */}
          <div className="p-3 bg-sky-950/20 border border-sky-900/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-sky-300 uppercase flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <span>Pesan / Instruksi Tambahan dari Atasan di PM Discord:</span>
              </label>
              <div className="flex items-center gap-2">
                {savedMsgNotice && (
                  <span className="text-[11px] text-emerald-400 font-bold">{savedMsgNotice}</span>
                )}
                <button
                  type="button"
                  onClick={handleSaveMessage}
                  disabled={!customMessage.trim()}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Simpan pesan ini sebagai pesan default atasan"
                >
                  <Save className="w-3 h-3" />
                  <span>Simpan Pesan Ini</span>
                </button>
              </div>
            </div>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              disabled={isExecuting}
              rows={2}
              placeholder="Contoh: Berikut adalah PIN login terminal MDT HSPD Anda. Harap segera login dan selalu patuhi SOP dinas!"
              className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-sky-500 rounded text-xs text-gray-100 outline-none resize-y font-sans disabled:opacity-50"
            />
            <div className="text-[10px] text-gray-400 flex items-center justify-between">
              <span>Pesan ini akan disematkan di dalam kotak embed Discord PM setiap personel bersama kredensial UCP & PIN masing-masing.</span>
              <span className="font-mono">{customMessage.length} karakter</span>
            </div>
          </div>

          {/* EXECUTION PROGRESS & LOG TERMINAL (IF EXECUTING OR COMPLETED) */}
          {(isExecuting || isCompleted || logs.length > 0) && (
            <div className="space-y-2 p-3 bg-[#0D1117] border border-sky-700/60 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-sky-300 font-mono uppercase">
                    {isExecuting ? 'PROGRES DISPATCH MASSAL BERJALAN...' : 'LAPORAN HASIL DISPATCH PIN'}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-emerald-400 font-bold">🟢 {successCount} Sukses</span>
                  <span className="text-rose-400 font-bold">🔴 {failedCount} Gagal</span>
                  <span className="text-amber-400 font-bold">⚪ {skippedCount} Dilewati</span>
                  <span className="text-sky-300 font-bold">{progressPercent}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-sky-500 to-emerald-500 h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Live Terminal Log */}
              <div className="h-44 overflow-y-auto bg-black/60 border border-gray-800 rounded p-2.5 font-mono text-[11px] space-y-1">
                {logs.map((log) => {
                  let colorClass = 'text-gray-300';
                  if (log.type === 'success') colorClass = 'text-emerald-400';
                  if (log.type === 'warning') colorClass = 'text-amber-400';
                  if (log.type === 'error') colorClass = 'text-rose-400';
                  if (log.type === 'info') colorClass = 'text-sky-300';

                  return (
                    <div key={log.id} className="flex items-start gap-2 leading-tight">
                      <span className="text-gray-600 select-none shrink-0">[{log.time}]</span>
                      <span className={colorClass}>{log.message}</span>
                    </div>
                  );
                })}
                <div ref={terminalBottomRef} />
              </div>

              {/* Controls while executing */}
              {isExecuting && (
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTogglePause}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold transition"
                  >
                    {isPaused ? '▶️ Lanjutkan' : '⏸️ Jeda'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAbort}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold transition"
                  >
                    🛑 Batalkan Sisa
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PERSONNEL PREVIEW TABLE & FILTER */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-[#0D1117] p-1 border border-gray-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition ${filterType === 'all' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Semua ({roster.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('valid_id')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition ${filterType === 'valid_id' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Siap Kirim ({officersWithValidId.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('missing_id')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition ${filterType === 'missing_id' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Tanpa ID ({officersWithoutId.length})
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari personel / badge..."
                  className="pl-8 pr-3 py-1.5 bg-[#0D1117] border border-gray-800 rounded text-xs text-gray-200 outline-none focus:border-sky-500 w-full sm:w-56"
                />
              </div>
            </div>

            {/* Table */}
            <div className="border border-gray-800 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#0D1117] text-gray-400 text-[10px] font-bold uppercase sticky top-0 border-b border-gray-800 z-10">
                  <tr>
                    <th className="p-2.5">Badge & Nama</th>
                    <th className="p-2.5">Pangkat / Divisi</th>
                    <th className="p-2.5">PIN Terdaftar</th>
                    <th className="p-2.5">Discord ID</th>
                    <th className="p-2.5 text-center">Status Dispatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono text-[11px]">
                  {filteredOfficers.map((officer) => {
                    const raw = (officer.discordTag || '').trim();
                    const cleanId = raw.replace(/\D/g, '');
                    const hasValidId = cleanId.length >= 16;

                    return (
                      <tr key={officer.id || officer.badge} className="hover:bg-gray-800/40">
                        <td className="p-2 font-bold text-gray-200">
                          <span className="text-sky-400 mr-1.5">[{officer.badge}]</span>
                          <span className="font-sans font-medium">{officer.name}</span>
                        </td>
                        <td className="p-2 text-gray-300 font-sans text-[10.5px]">
                          <div>{officer.rank}</div>
                          <div className="text-gray-500 text-[9.5px]">{officer.division}</div>
                        </td>
                        <td className="p-2">
                          <span className="bg-black/50 text-amber-300 px-2 py-0.5 rounded border border-amber-900/60 font-bold">
                            {officer.pin || '10-4'}
                          </span>
                        </td>
                        <td className="p-2 text-gray-400">
                          {hasValidId ? (
                            <span className="text-emerald-400 font-bold">{cleanId}</span>
                          ) : (
                            <span className="text-amber-400/80 italic text-[10px]">
                              {raw ? raw : 'Belum diisi'}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {hasValidId ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold font-sans">
                              <CheckCircle2 className="w-3 h-3" />
                              Siap Kirim
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold font-sans">
                              <AlertTriangle className="w-3 h-3" />
                              Akan Dilewati
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredOfficers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-500 font-sans">
                        Tidak ada anggota yang cocok dengan pencarian / filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CONFIRMATION PROMPT */}
          {showConfirm && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-600 rounded-lg space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-200 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>KONFIRMASI EKSEKUSI PENGIRIMAN PIN BOT MASSAL:</span>
              </div>
              <p className="text-xs text-rose-100/90 leading-relaxed font-sans">
                Anda akan mengirimkan PIN akun login MDT ke <strong>{officersWithValidId.length} personel</strong> kepolisian melalui Pesan Pribadi (PM) Bot Discord secara serentak. Tindakan ini memerlukan otorisasi komando tinggi. Pastikan bot dalam kondisi online.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleStartDispatch}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-950"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>YA, MULAI EKSEKUSI SEKARANG</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 bg-[#0D1117] border-t border-gray-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-400">
            {isExecuting ? (
              <span className="text-sky-400 flex items-center gap-1.5 font-bold animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Sedang mengirim {currentIndex} dari {roster.length} akun...
              </span>
            ) : isCompleted ? (
              <span className="text-emerald-400 font-bold">
                ✅ Pengiriman massal selesai ({successCount} terkirim)!
              </span>
            ) : (
              <span>👑 Otoritas: {currentOfficer.rank} {currentOfficer.name}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExecuting}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 rounded-lg text-xs font-bold transition"
            >
              {isCompleted ? 'Tutup' : 'Batal'}
            </button>

            {!isCompleted && !isExecuting && (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={officersWithValidId.length === 0}
                className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-sky-600/30 disabled:opacity-40 active:scale-95 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>SEKALI KIRIM PIN KE SEMUA AKUN</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
