import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Send, X, AlertTriangle, CheckCircle2, User, 
  KeyRound, HelpCircle,
  Sparkles, CheckCircle, Zap, ShieldCheck, Copy, Check, ArrowRight,
  Clock, RefreshCw, Bot, Crown, Building2
} from 'lucide-react';
import { GovernmentAccount } from '../types';
import { 
  getGovernmentRoster, 
  isGovernmentMatch, 
  getGovOnlineLeadersList, 
  isAnyGovLeaderOnline, 
  executeGovPinResetSubmission, 
  autoApproveGovPinRequestDueToTimeout, 
  getGovPinResetRequests, 
  GOV_PIN_RESET_AUTO_ACCEPT_TIMEOUT_MS 
} from '../utils/governmentStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialIdentifier?: string;
  onPinApplied?: (newPin: string, officialName: string) => void;
}

export const GovernmentRequestPinModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialIdentifier = '',
  onPinApplied
}) => {
  const [officialName, setOfficialName] = useState('');
  const [officialBadge, setOfficialBadge] = useState('');
  const [discordTag, setDiscordTag] = useState('');
  const [reason, setReason] = useState('Lupa PIN login Portal Resmi Pemerintahan');
  const [customReason, setCustomReason] = useState('');
  const [requestedPin, setRequestedPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // Active Pending Ticket Tracking for 10-minute Bot Auto-Approval
  const [pendingTicket, setPendingTicket] = useState<{
    id: string;
    createdAt: number;
    officialName: string;
    badge: string;
    targetPin: string;
  } | null>(null);

  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(600); // 10 minutes = 600s

  // Auto-grant / Resolved result state
  const [autoGrantedData, setAutoGrantedData] = useState<{
    pin: string;
    officialName: string;
    badge: string;
    approvedByText?: string;
    isBotAutoApproved?: boolean;
  } | null>(null);

  const suggestionsRef = useRef<HTMLDivElement>(null);
  const roster = getGovernmentRoster();

  // Check online government leaders (President / Vice President / Ministers)
  const leadersOnline = useMemo(() => getGovOnlineLeadersList(roster), [roster, isOpen]);
  const isLeaderActive = leadersOnline.length > 0;

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setShowSuggestions(false);
      setAutoGrantedData(null);
      setPendingTicket(null);
      setCopiedPin(false);
      setCustomReason('');
      setRequestedPin('');
      setReason('Lupa PIN login Portal Resmi Pemerintahan');
      
      const initId = initialIdentifier.trim();
      if (initId) {
        setOfficialName(initId);
        const clean = initId.toLowerCase();
        const found = roster.find(r => isGovernmentMatch(r, clean));
        if (found) {
          setOfficialName(found.name);
          setOfficialBadge(found.badge);
          setDiscordTag(found.discordTag || '');
        } else {
          setOfficialBadge('');
          setDiscordTag('');
        }
      } else {
        setOfficialName('');
        setOfficialBadge('');
        setDiscordTag('');
      }
    }
  }, [isOpen, initialIdentifier, roster]);

  // 10-minute Countdown & Active Auto-Approval Poller
  useEffect(() => {
    if (!pendingTicket) return;

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - pendingTicket.createdAt;
      const remainingSec = Math.max(0, Math.ceil((GOV_PIN_RESET_AUTO_ACCEPT_TIMEOUT_MS - elapsedMs) / 1000));
      setTimeLeftSeconds(remainingSec);

      // Check current status in storage
      const allRequests = getGovPinResetRequests();
      const target = allRequests.find(r => r.id === pendingTicket.id);

      if (target && target.status === 'RESOLVED') {
        setAutoGrantedData({
          pin: target.resolvedNewPin || target.requestedPin || pendingTicket.targetPin || '10-4',
          officialName: target.officialName,
          badge: target.officialBadge,
          approvedByText: target.resolvedBy || 'Pimpinan Tinggi / Eksekutif',
          isBotAutoApproved: target.autoGranted ?? false
        });
        setPendingTicket(null);
        return;
      }

      // If 10 minutes (600s) reached -> trigger bot auto-approve
      if (remainingSec <= 0) {
        const autoResult = autoApproveGovPinRequestDueToTimeout(pendingTicket.id, pendingTicket.targetPin);
        setAutoGrantedData({
          pin: autoResult.pin || pendingTicket.targetPin || '10-4',
          officialName: pendingTicket.officialName,
          badge: pendingTicket.badge,
          approvedByText: 'BOT / SISTEM KEAMANAN (TIMEOUT 10 MENIT)',
          isBotAutoApproved: true
        });
        setPendingTicket(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingTicket]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter roster suggestions based on user input
  const matchingOfficials = useMemo(() => {
    const q = officialName.trim().toLowerCase();
    if (!q) return [];
    return roster.filter(r => 
      r.name.toLowerCase().includes(q) || 
      (r.badge || '').toLowerCase().includes(q) ||
      (r.rank || '').toLowerCase().includes(q)
    ).slice(0, 6);
  }, [officialName, roster]);

  // Check if current name exactly matches any official in roster
  const matchedOfficial = useMemo(() => {
    const q = officialName.trim().toLowerCase();
    if (!q) return null;
    return roster.find(r => isGovernmentMatch(r, q)) || null;
  }, [officialName, roster]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setAutoGrantedData(null);
    setPendingTicket(null);

    const trimmedName = officialName.trim();
    if (!trimmedName) {
      setErrorMessage('Nama Pejabat wajib diisi.');
      return;
    }

    if (!matchedOfficial) {
      setErrorMessage(`Pejabat dengan nama "${trimmedName}" tidak ditemukan dalam Jajaran Aparatur Pemerintahan.`);
      return;
    }

    if (requestedPin && requestedPin.trim().length < 3) {
      setErrorMessage('Usulan PIN baru minimal 3 karakter untuk standar keamanan.');
      return;
    }

    const finalReason = reason === 'Lainnya' 
      ? (customReason.trim() || 'Alasan khusus tidak disertakan.') 
      : reason;

    setIsSubmitting(true);
    try {
      const result = await executeGovPinResetSubmission({
        account: matchedOfficial,
        reason: finalReason,
        requestedNewPin: requestedPin.trim() || undefined,
        discordTag: discordTag.trim() || undefined
      });

      if (result.autoGranted) {
        setAutoGrantedData({
          pin: result.assignedPin || requestedPin.trim() || '10-4',
          officialName: matchedOfficial.name,
          badge: matchedOfficial.badge,
          approvedByText: 'BOT / SISTEM OTOMASI KENEGARAAN (PIMPINAN OFFLINE)',
          isBotAutoApproved: true
        });
      } else if (result.ticket) {
        setPendingTicket({
          id: result.ticket.id,
          createdAt: result.ticket.createdAt,
          officialName: matchedOfficial.name,
          badge: matchedOfficial.badge,
          targetPin: requestedPin.trim() || '10-4'
        });
        setTimeLeftSeconds(600);
      }
    } catch (err: any) {
      setErrorMessage(`Terjadi kesalahan saat memproses permohonan: ${err.message || 'Gagal terhubung'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyPinAndClose = (appliedPin: string) => {
    if (onPinApplied && matchedOfficial) {
      onPinApplied(appliedPin, matchedOfficial.name);
    }
    onClose();
  };

  const handleManualCheckStatus = () => {
    if (!pendingTicket) return;
    const allRequests = getGovPinResetRequests();
    const target = allRequests.find(r => r.id === pendingTicket.id);
    if (target && target.status === 'RESOLVED') {
      setAutoGrantedData({
        pin: target.resolvedNewPin || target.requestedPin || pendingTicket.targetPin || '10-4',
        officialName: target.officialName,
        badge: target.officialBadge,
        approvedByText: target.resolvedBy || 'Pimpinan Tinggi / Eksekutif',
        isBotAutoApproved: target.autoGranted ?? false
      });
      setPendingTicket(null);
    }
  };

  const handleSimulateBotAutoApprove = () => {
    if (!pendingTicket) return;
    const autoResult = autoApproveGovPinRequestDueToTimeout(pendingTicket.id, pendingTicket.targetPin);
    setAutoGrantedData({
      pin: autoResult.pin || pendingTicket.targetPin || '10-4',
      officialName: pendingTicket.officialName,
      badge: pendingTicket.badge,
      approvedByText: 'BOT / SISTEM KEAMANAN (ACCELERATED)',
      isBotAutoApproved: true
    });
    setPendingTicket(null);
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0B0E14] border border-amber-500/40 rounded-xl max-w-lg w-full shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col overflow-hidden text-gray-200">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-amber-950/70 via-[#161B22] to-amber-950/70 p-4 border-b border-amber-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-950/80 border border-amber-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-200 tracking-wide flex items-center gap-2">
                PENGAJUAN RESET / GANTI PIN LOGIN
              </h2>
              <p className="text-[11px] text-amber-400/80 font-mono">
                Sistem Otorisasi Kredensial Portal Resmi Pemerintahan & Discord
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STATUS BANNER PIMPINAN TINGGI */}
        <div className={`px-4 py-2.5 border-b text-xs flex items-center justify-between ${
          isLeaderActive 
            ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300' 
            : 'bg-amber-950/40 border-amber-800/40 text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isLeaderActive ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isLeaderActive ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <span className="font-semibold tracking-wide">
              {isLeaderActive 
                ? 'PIMPINAN TINGGI (PRESIDEN/WAPRES) SEDANG ONLINE' 
                : 'PIMPINAN TINGGI SEDANG OFFLINE • AUTO-GRANT AKTIF'}
            </span>
          </div>
          <span className="text-[11px] opacity-80 font-mono">
            {isLeaderActive ? 'Verifikasi Manual' : 'Akses Otomatis'}
          </span>
        </div>

        {/* NOTICE BOX: KEBIJAKAN TOLERANSI 10 MENIT */}
        {!autoGrantedData && !pendingTicket && (
          <div className="mx-4 mt-3 p-3 bg-amber-950/20 border border-amber-800/30 rounded-lg flex items-start gap-2.5 text-xs text-amber-200/90">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-300">Kebijakan Otorisasi Otomatis & Toleransi 10 Menit:</span>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Setelah Anda mengirim tiket, notifikasi akan dikirim ke Pimpinan & Discord. Jika Pimpinan tidak merespons selama 10 menit, 
                Bot Keamanan Negara akan <span className="text-amber-300 font-semibold">otomatis menyetujui sendiri</span> permohonan Anda.
              </p>
            </div>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-4 overflow-y-auto max-h-[72vh]">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-800/60 rounded-lg flex items-start gap-2.5 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* VIEW 1: AUTO-GRANTED / RESOLVED SUCCESS VIEW */}
          {autoGrantedData ? (
            <div className="py-2 space-y-4 animate-fadeIn">
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-center space-y-2">
                <div className="inline-flex p-3 rounded-full bg-emerald-900/40 border border-emerald-500/50 text-emerald-300 mb-1">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-emerald-200 tracking-wide">
                  {autoGrantedData.isBotAutoApproved 
                    ? 'LUPA PIN OTOMATIS DISETUJUI OLEH BOT / PIMPINAN!' 
                    : 'PERUBAHAN PIN TELAH DISETUJUI!'}
                </h3>
                <p className="text-xs text-gray-300 max-w-sm mx-auto">
                  Aparatur <span className="text-white font-semibold">{autoGrantedData.officialName}</span> ({autoGrantedData.badge}), 
                  PIN login akun kepresidenan / pemerintahan Anda telah aktif dan siap digunakan.
                </p>
              </div>

              {/* ACTIVE PIN BOX */}
              <div className="bg-[#090C10] border-2 border-amber-500/60 rounded-xl p-4 text-center relative overflow-hidden shadow-[0_0_25px_rgba(245,158,11,0.2)]">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                  PIN KEAMANAN LOGIN ANDA SAAT INI
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-bold tracking-widest text-amber-300 py-1">
                  {autoGrantedData.pin}
                </div>
                <div className="text-[11px] text-gray-400 mt-1 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Disahkan oleh: {autoGrantedData.approvedByText || 'Bot Keamanan Negara'}</span>
                </div>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(autoGrantedData.pin);
                      setCopiedPin(true);
                      setTimeout(() => setCopiedPin(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/60 rounded text-xs font-semibold text-amber-200 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPin ? 'Tersalin!' : 'Salin PIN'}</span>
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleApplyPinAndClose(autoGrantedData.pin)}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Terapkan PIN & Masuk Portal</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>

          ) : pendingTicket ? (
            /* VIEW 2: 10-MINUTE COUNTDOWN & ACTIVE PENDING TICKET */
            <div className="py-2 space-y-4 animate-fadeIn">
              <div className="p-4 bg-amber-950/30 border border-amber-700/50 rounded-xl text-center space-y-2">
                <div className="inline-flex p-3 rounded-full bg-amber-900/40 border border-amber-600/50 text-amber-400 animate-pulse mb-1">
                  <Clock className="w-7 h-7" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-amber-200">
                  TIKET TERBUKA & MENUNGGU KONFIRMASI
                </h3>
                <p className="text-xs text-gray-300 max-w-sm mx-auto">
                  Tiket reset PIN Anda telah diteruskan ke Discord & Pimpinan Tinggi. Jikalau tidak ada respon dalam 10 menit, 
                  sistem keamanan bot akan mengaktifkan PIN login secara otomatis.
                </p>

                {/* COUNTDOWN TIMER DISPLAY */}
                <div className="mt-3 inline-block bg-[#090C10] border border-amber-600/40 rounded-xl px-5 py-2">
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
                    WAKTU TUNGGU AUTO-GRANT
                  </div>
                  <div className="text-3xl sm:text-4xl font-mono font-black text-amber-400 tracking-wider">
                    {formatCountdown(timeLeftSeconds)}
                  </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden mt-3 border border-gray-800">
                  <div 
                    className="bg-amber-500 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, (timeLeftSeconds / 600) * 100))}%` }}
                  />
                </div>
              </div>

              {/* TICKET DETAILS BOX */}
              <div className="bg-[#111620] border border-gray-800 rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Pejabat:</span>
                  <span className="font-semibold text-white">{pendingTicket.officialName} ({pendingTicket.badge})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Usulan PIN Baru:</span>
                  <span className="font-mono text-amber-300 font-semibold">{pendingTicket.targetPin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status Notifikasi:</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Terkirim ke Discord
                  </span>
                </div>
              </div>

              {/* CONTROLS */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleManualCheckStatus}
                  className="w-full py-2.5 px-4 bg-amber-900/60 hover:bg-amber-800/80 border border-amber-700/60 text-amber-200 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Cek Status Otorisasi Sekarang</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateBotAutoApprove}
                  className="w-full py-2 px-4 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 font-medium rounded-lg text-[11px] flex items-center justify-center gap-2 transition-colors"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Auto-Approve Bot Langsung (Uji Bypass Waktu)</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-center text-xs text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Tutup jendela (Tiket tetap berjalan di background)
                </button>
              </div>
            </div>

          ) : (
            /* VIEW 3: INPUT FORM VIEW */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* NAMA PEJABAT FIELD WITH AUTOCOMPLETE */}
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Nama Pejabat In-Game / Identitas Akun <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={officialName}
                    onChange={(e) => {
                      setOfficialName(e.target.value);
                      setShowSuggestions(true);
                      const clean = e.target.value.trim().toLowerCase();
                      const match = roster.find(r => isGovernmentMatch(r, clean));
                      if (match) {
                        setOfficialBadge(match.badge);
                        setDiscordTag(match.discordTag || '');
                      }
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Contoh: Momo Hatakeyama atau #GOV-01"
                    className="w-full bg-[#111620] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors pl-8"
                    required
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                </div>

                {/* SUGGESTIONS LIST */}
                {showSuggestions && matchingOfficials.length > 0 && (
                  <div 
                    ref={suggestionsRef}
                    className="absolute z-30 left-0 right-0 mt-1 bg-[#161B22] border border-amber-900/60 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto"
                  >
                    <div className="p-1.5 bg-[#0D1117] border-b border-gray-800 text-[10px] text-gray-400 font-mono">
                      HASIL PENCARIAN DATABASE APARATUR PEMERINTAHAN:
                    </div>
                    {matchingOfficials.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setOfficialName(r.name);
                          setOfficialBadge(r.badge);
                          setDiscordTag(r.discordTag || '');
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-amber-950/40 border-b border-gray-800/50 flex items-center justify-between transition-colors text-xs"
                      >
                        <div>
                          <div className="font-semibold text-amber-200">{r.name}</div>
                          <div className="text-[10px] text-gray-400">{r.rank} • {r.division}</div>
                        </div>
                        <span className="font-mono text-[11px] bg-amber-950/60 text-amber-400 px-2 py-0.5 rounded border border-amber-800/40">
                          {r.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* CALLSIGN / BADGE & DISCORD TAG */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Callsign / Badge
                  </label>
                  <input
                    type="text"
                    value={officialBadge}
                    onChange={(e) => setOfficialBadge(e.target.value)}
                    placeholder="#GOV-01"
                    className="w-full bg-[#111620] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Username Discord (Opsional)
                  </label>
                  <input
                    type="text"
                    value={discordTag}
                    onChange={(e) => setDiscordTag(e.target.value)}
                    placeholder="@username"
                    className="w-full bg-[#111620] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* REASON DROPDOWN */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Alasan / Keterangan Permintaan <span className="text-amber-400">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#111620] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Lupa PIN login Portal Resmi Pemerintahan">Lupa PIN login dan tidak bisa mengakses portal pemerintahan</option>
                  <option value="Pembaruan berkala PIN demi kepatuhan keamanan negara">Pembaruan berkala PIN demi kepatuhan keamanan negara</option>
                  <option value="Curiga kredensial akun diketahui pihak lain / kompromi keamanan">Curiga kredensial akun diketahui pihak lain / kompromi keamanan</option>
                  <option value="Baru dilantik / mutasi jabatan dan membutuhkan inisialisasi PIN">Baru dilantik / mutasi jabatan dan membutuhkan inisialisasi PIN</option>
                  <option value="Lainnya">Lainnya (Tuliskan alasan khusus di bawah)</option>
                </select>

                {reason === 'Lainnya' && (
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Jelaskan alasan pengajuan reset PIN Anda secara detail..."
                    className="w-full mt-2 bg-[#111620] border border-gray-700 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none h-20"
                    required
                  />
                )}
              </div>

              {/* USULAN PIN BARU */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center justify-between">
                  <span>Usulan PIN Baru (Opsional)</span>
                  <span className="text-[10px] text-gray-400 font-mono">Min. 3 Digit</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={requestedPin}
                    onChange={(e) => setRequestedPin(e.target.value)}
                    placeholder="Contoh: 10-4 atau 1234 (Kosongkan jika default)"
                    className="w-full bg-[#111620] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500 pl-8 font-mono"
                  />
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Jika dikosongkan, bot atau atasan akan menetapkan PIN standar <span className="font-mono text-amber-300 font-bold">10-4</span>.
                </p>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengirim Tiket Permohonan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Permohonan & Buka Tiket Otorisasi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-[#090C10] p-3 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-500" />
            <span>PORTAL RESMI PEMERINTAH NEGARA</span>
          </div>
          <span>Sistem Otorisasi Multi-Faktor Terpadu</span>
        </div>

      </div>
    </div>
  );
};
