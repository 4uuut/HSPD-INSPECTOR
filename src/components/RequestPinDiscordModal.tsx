import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Send, X, AlertTriangle, CheckCircle2, Shield, User, 
  KeyRound, MessageSquare, HelpCircle,
  Sparkles, CheckCircle, Zap, ShieldCheck, Copy, Check, ArrowRight,
  Clock, RefreshCw, Bot
} from 'lucide-react';
import { OfficerAccount } from '../types';
import { HSPD_LOGO_URL } from '../assets/logo';
import { 
  executePinResetSubmission, 
  getOnlineSuperiorsList, 
  getPinResetAutoGrantConfig,
  getPinResetRequests,
  autoApproveSingleRequestDueToTimeout,
  PIN_RESET_AUTO_ACCEPT_TIMEOUT_MS,
  playPoliceChime
} from '../utils/pinResetStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialIdentifier?: string;
  roster: OfficerAccount[];
  onUpdateOfficerPin?: (badgeOrName: string, newPin: string) => boolean;
  onPinAutoApplied?: (pin: string, identifier: string) => void;
}

export const RequestPinDiscordModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialIdentifier = '',
  roster,
  onUpdateOfficerPin,
  onPinAutoApplied
}) => {
  const [officerName, setOfficerName] = useState('');
  const [officerBadge, setOfficerBadge] = useState('');
  const [discordTag, setDiscordTag] = useState('');
  const [reason, setReason] = useState('Lupa PIN login MDT CAD');
  const [requestedPin, setRequestedPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // Active Pending Ticket Tracking for 10-minute Bot Auto-Approval
  const [pendingTicket, setPendingTicket] = useState<{
    id: string;
    createdAt: number;
    officerName: string;
    badge: string;
    targetPin: string;
  } | null>(null);

  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(600); // 10 minutes = 600s

  // Auto-grant / Resolved result state
  const [autoGrantedData, setAutoGrantedData] = useState<{
    pin: string;
    officerName: string;
    badge: string;
    approvedByText?: string;
    isBotAutoApproved?: boolean;
  } | null>(null);

  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Check online superiors & auto grant config
  const superiorsOnline = useMemo(() => getOnlineSuperiorsList(roster), [roster, isOpen]);
  const isSuperiorActive = superiorsOnline.length > 0;
  const autoGrantCfg = getPinResetAutoGrantConfig();

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setShowSuggestions(false);
      setAutoGrantedData(null);
      setPendingTicket(null);
      setCopiedPin(false);
      
      const initId = initialIdentifier.trim();
      if (initId) {
        setOfficerName(initId);
        // Look up in roster
        const clean = initId.toLowerCase();
        const cleanBadge = clean.startsWith('#') ? clean : `#${clean}`;
        const found = roster.find(r => 
          r.name.toLowerCase() === clean || 
          r.badge.toLowerCase() === clean || 
          r.badge.toLowerCase() === cleanBadge
        );
        if (found) {
          setOfficerName(found.name);
          setOfficerBadge(found.badge);
        } else {
          setOfficerBadge('');
        }
      } else {
        setOfficerName('');
        setOfficerBadge('');
      }
    }
  }, [isOpen, initialIdentifier, roster]);

  // 10-minute Countdown & Active Auto-Approval Poller
  useEffect(() => {
    if (!pendingTicket) return;

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - pendingTicket.createdAt;
      const remainingSec = Math.max(0, Math.ceil((PIN_RESET_AUTO_ACCEPT_TIMEOUT_MS - elapsedMs) / 1000));
      setTimeLeftSeconds(remainingSec);

      // Check current status in storage or trigger 10-min timeout auto-approve
      const allRequests = getPinResetRequests(roster, onUpdateOfficerPin);
      const target = allRequests.find(r => r.id === pendingTicket.id);

      if (target && target.status === 'RESOLVED') {
        // Superior accepted or system approved
        playPoliceChime();
        setAutoGrantedData({
          pin: target.resolvedNewPin || target.requestedPin || pendingTicket.targetPin || '10-4',
          officerName: target.officerName,
          badge: target.officerBadge,
          approvedByText: target.resolvedBy || 'Atasan / High Command',
          isBotAutoApproved: target.autoGranted ?? false
        });
        setPendingTicket(null);
        return;
      }

      // If 10 minutes (600s) reached -> trigger bot auto-approve
      if (remainingSec <= 0) {
        const autoResult = autoApproveSingleRequestDueToTimeout(pendingTicket.id, roster, onUpdateOfficerPin);
        playPoliceChime();
        setAutoGrantedData({
          pin: autoResult.pin || pendingTicket.targetPin || '10-4',
          officerName: pendingTicket.officerName,
          badge: pendingTicket.badge,
          approvedByText: 'BOT / SISTEM KEAMANAN (TIMEOUT 10 MENIT)',
          isBotAutoApproved: true
        });
        setPendingTicket(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingTicket, roster, onUpdateOfficerPin]);

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
  const matchingOfficers = useMemo(() => {
    const q = officerName.trim().toLowerCase();
    if (!q) return [];
    return roster.filter(r => 
      r.name.toLowerCase().includes(q) || 
      r.badge.toLowerCase().includes(q) ||
      r.rank.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [officerName, roster]);

  // Check if current name exactly matches any officer in roster
  const matchedOfficer = useMemo(() => {
    const q = officerName.trim().toLowerCase();
    if (!q) return null;
    return roster.find(r => 
      r.name.toLowerCase() === q || 
      r.badge.toLowerCase() === q ||
      r.badge.toLowerCase() === (q.startsWith('#') ? q : `#${q}`)
    ) || null;
  }, [officerName, roster]);

  // Handle manual typing in Name field
  const handleNameInputChange = (val: string) => {
    setOfficerName(val);
    setShowSuggestions(true);

    const clean = val.trim().toLowerCase();
    const cleanBadge = clean.startsWith('#') ? clean : `#${clean}`;
    
    // Check if there is an exact name or badge match
    const exactMatch = roster.find(r => 
      r.name.toLowerCase() === clean || 
      r.badge.toLowerCase() === clean || 
      r.badge.toLowerCase() === cleanBadge
    );

    if (exactMatch) {
      setOfficerBadge(exactMatch.badge);
    }
  };

  // Handle selecting an officer from suggestions list
  const handleSelectOfficer = (officer: OfficerAccount) => {
    setOfficerName(officer.name);
    setOfficerBadge(officer.badge);
    setShowSuggestions(false);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setAutoGrantedData(null);
    setPendingTicket(null);

    const trimmedName = officerName.trim();
    const trimmedBadge = officerBadge.trim() || (matchedOfficer ? matchedOfficer.badge : '-');
    const trimmedReason = reason.trim();

    if (!trimmedName) {
      setErrorMessage('Nama Petugas In-Game wajib diisi!');
      return;
    }

    if (!trimmedReason) {
      setErrorMessage('Alasan permintaan reset/ubah PIN wajib dicantumkan!');
      return;
    }

    // Try finding rank from roster
    const matched = matchedOfficer || roster.find(r => 
      r.name.toLowerCase() === trimmedName.toLowerCase() ||
      (trimmedBadge !== '-' && r.badge.toLowerCase() === trimmedBadge.toLowerCase())
    );

    setIsSubmitting(true);

    try {
      const result = await executePinResetSubmission({
        officerName: trimmedName,
        officerBadge: matched ? matched.badge : (trimmedBadge !== '-' ? trimmedBadge : '-'),
        officerRank: matched ? matched.rank : undefined,
        discordTag: discordTag.trim() || undefined,
        reason: trimmedReason,
        requestedPin: requestedPin.trim() || undefined,
        roster,
        onUpdateOfficerPin
      });

      if (result.success) {
        if (result.isAutoGranted) {
          // Instant auto grant (e.g. offline atasan)
          setAutoGrantedData({
            pin: result.pin,
            officerName: trimmedName,
            badge: matched ? matched.badge : trimmedBadge,
            approvedByText: 'SISTEM OTOMATIS (HIGH COMMAND OFFLINE)',
            isBotAutoApproved: true
          });
        } else {
          // Start 10-minute pending countdown tracker
          setPendingTicket({
            id: result.request.id,
            createdAt: result.request.createdAt,
            officerName: trimmedName,
            badge: matched ? matched.badge : trimmedBadge,
            targetPin: result.pin
          });
          setTimeLeftSeconds(600);
        }
      } else {
        setErrorMessage(result.message || 'Gagal memproses permohonan.');
      }
    } catch (err: any) {
      setErrorMessage(`Terjadi kesalahan sistem: ${err.message || 'Cek koneksi'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyPinAndLogin = () => {
    if (autoGrantedData && onPinAutoApplied) {
      onPinAutoApplied(autoGrantedData.pin, autoGrantedData.officerName || autoGrantedData.badge);
    }
    onClose();
  };

  const handleCopyPin = () => {
    if (autoGrantedData?.pin) {
      navigator.clipboard.writeText(autoGrantedData.pin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2500);
    }
  };

  // Manual Check Now helper
  const handleManualCheckStatus = () => {
    if (!pendingTicket) return;
    const allRequests = getPinResetRequests(roster, onUpdateOfficerPin);
    const target = allRequests.find(r => r.id === pendingTicket.id);
    if (target && target.status === 'RESOLVED') {
      playPoliceChime();
      setAutoGrantedData({
        pin: target.resolvedNewPin || target.requestedPin || pendingTicket.targetPin || '10-4',
        officerName: target.officerName,
        badge: target.officerBadge,
        approvedByText: target.resolvedBy || 'Atasan / High Command',
        isBotAutoApproved: target.autoGranted ?? false
      });
      setPendingTicket(null);
    }
  };

  // Instant Simulate 10-minute Timeout (for fast testing / demo)
  const handleSimulate10MinTimeout = () => {
    if (!pendingTicket) return;
    const autoResult = autoApproveSingleRequestDueToTimeout(pendingTicket.id, roster, onUpdateOfficerPin);
    playPoliceChime();
    setAutoGrantedData({
      pin: autoResult.pin || pendingTicket.targetPin || '10-4',
      officerName: pendingTicket.officerName,
      badge: pendingTicket.badge,
      approvedByText: 'BOT / SISTEM OTOMATIS (TIMEOUT 10 MENIT)',
      isBotAutoApproved: true
    });
    setPendingTicket(null);
  };

  // Format seconds to mm:ss
  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150 font-mono text-xs">
      <div className="bg-[#161B22] border border-blue-600/50 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#0F1319] border-b border-gray-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group shrink-0">
              <img
                src={HSPD_LOGO_URL}
                alt="HSPD Crest"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-contain border border-blue-500/50 bg-black/60 p-0.5"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-100 uppercase tracking-tight flex items-center gap-1.5 font-sans">
                <KeyRound className="w-4 h-4 text-blue-400" />
                <span>PENGAJUAN RESET / GANTI PIN LOGIN</span>
              </h3>
              <p className="text-[10px] text-gray-400 font-mono">
                Sistem Otorisasi Kredensial MDT Terpadu & Webhook Discord
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Superior Online Status Indicator */}
        <div className={`px-4 py-2 text-[11px] font-sans border-b flex items-center justify-between gap-2 ${
          isSuperiorActive 
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
            : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isSuperiorActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-bold">
              {isSuperiorActive ? 'HIGH COMMAND SEDANG ONLINE' : 'HIGH COMMAND SEDANG OFFLINE'}
            </span>
          </div>
          <div className="text-[10px] font-mono text-gray-300 text-right">
            {isSuperiorActive ? (
              <span>{superiorsOnline[0].name} ({superiorsOnline[0].badge}) • Verifikasi Manual</span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                Auto-Grant Akses Otomatis Aktif
              </span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Information Notice */}
          <div className="p-3 bg-blue-950/30 border border-blue-800/60 rounded-lg text-[11px] text-blue-300 space-y-1 leading-relaxed">
            <div className="font-bold flex items-center gap-1.5 text-blue-200">
              <Shield className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Kebijakan Otorisasi Otomatis & Toleransi 10 Menit</span>
            </div>
            <p className="text-gray-300 text-[10px] font-sans">
              Setelah Anda mengirim tiket Lupa PIN, tiket akan diteruskan ke Atasan & Discord. <strong>Jikalau Atasan tidak menyetujui selama 10 menit, Bot / Sistem Keamanan akan otomatis menyetujui sendiri</strong> permohonan Anda dan mengaktifkan PIN login baru.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. AUTO-GRANTED / RESOLVED SUCCESS STATE */}
          {autoGrantedData ? (
            <div className="p-4 bg-gradient-to-b from-emerald-950/80 to-[#0F171F] border-2 border-emerald-500 rounded-2xl text-emerald-200 space-y-3.5 shadow-xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/50">
                  {autoGrantedData.isBotAutoApproved ? (
                    <Bot className="w-6 h-6 animate-pulse text-emerald-400" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  )}
                </div>
                <div>
                  <div className="font-extrabold text-sm text-emerald-300 font-sans">
                    {autoGrantedData.isBotAutoApproved 
                      ? 'LUPA PIN OTOMATIS DISETUJUI OLEH BOT / SISTEM!' 
                      : 'LUPA PIN TELAH DISETUJUI OLEH ATASAN!'}
                  </div>
                  <div className="text-[10px] text-emerald-400/80 font-mono">
                    {autoGrantedData.approvedByText || 'Sistem Otorisasi Terpadu'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-black/60 border border-emerald-600/40 rounded-xl space-y-2 text-center">
                <div className="text-[11px] text-gray-300">
                  PIN login MDT untuk petugas <strong className="text-white">{autoGrantedData.officerName}</strong> ({autoGrantedData.badge}) telah aktif:
                </div>
                <div className="inline-flex items-center gap-3 bg-emerald-950 border-2 border-emerald-500/80 px-4 py-1.5 rounded-xl text-emerald-300 font-mono text-lg font-extrabold tracking-widest shadow-lg">
                  <span>{autoGrantedData.pin}</span>
                  <button
                    type="button"
                    onClick={handleCopyPin}
                    className="text-emerald-400 hover:text-white p-1 rounded transition cursor-pointer"
                    title="Salin PIN"
                  >
                    {copiedPin ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[10px] text-gray-400">
                  {autoGrantedData.isBotAutoApproved 
                    ? 'Disetujui otomatis karena melewati batas toleransi 10 menit / Atasan offline. Laporan audit telah tersimpan.'
                    : 'PIN telah disetujui & disahkan oleh Atasan. Silakan langsung login ke terminal.'}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyPinAndLogin}
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>GUNAKAN PIN & LOGIN SEKARANG</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : pendingTicket ? (
            /* 2. ACTIVE 10-MINUTE PENDING COUNTDOWN STATE */
            <div className="p-4 bg-gradient-to-b from-[#111c2e] to-[#0d131a] border-2 border-blue-500/70 rounded-2xl text-blue-100 space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/40">
                    <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-blue-200 font-sans">
                      TIKET LUPA PIN SEDANG DIPROSES
                    </div>
                    <div className="text-[10px] text-blue-300/80 font-mono">
                      Menunggu Persetujuan Atasan atau Auto-Approve Bot
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-700/60 font-bold">
                    PENDING
                  </span>
                </div>
              </div>

              {/* 10-Minute Live Countdown Box */}
              <div className="p-3.5 bg-black/60 border border-blue-700/50 rounded-xl space-y-2.5 text-center">
                <div className="flex items-center justify-center gap-2 text-xs text-amber-300 font-bold font-sans">
                  <Bot className="w-4 h-4 text-amber-400" />
                  <span>WAKTU HITUNG MUNDUR AUTO-APPROVE BOT (10 MENIT):</span>
                </div>

                <div className="inline-flex items-center justify-center bg-blue-950/80 border-2 border-amber-500/80 px-6 py-2 rounded-xl shadow-inner">
                  <span className="font-mono text-3xl font-black text-amber-300 tracking-wider">
                    {formatCountdown(timeLeftSeconds)}
                  </span>
                </div>

                {/* Progress bar (10 mins = 600s) */}
                <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-amber-400 h-full transition-all duration-1000"
                    style={{ width: `${Math.max(0, Math.min(100, ((600 - timeLeftSeconds) / 600) * 100))}%` }}
                  />
                </div>

                <p className="text-[11px] text-gray-300 leading-relaxed font-sans text-left bg-blue-950/30 p-2.5 rounded-lg border border-blue-800/40">
                  ⚡ <strong>Jikalau Atasan tidak menyetujui selama 10 menit</strong>, Bot / Sistem Keamanan secara otomatis menyetujui sendiri dan mengaktifkan PIN Anda seketika tanpa perlu tindakan manual.
                </p>
              </div>

              {/* Target Details */}
              <div className="p-2.5 bg-black/40 border border-gray-800 rounded-lg text-[10px] text-gray-300 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-400">Petugas:</span>
                  <span className="font-bold text-white">{pendingTicket.officerName} ({pendingTicket.badge})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Usulan PIN:</span>
                  <span className="font-bold text-emerald-400 font-mono">{pendingTicket.targetPin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status Notifikasi:</span>
                  <span className="text-blue-300">Tersiar ke Discord Webhook & Layar Atasan</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualCheckStatus}
                  className="w-full sm:flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 text-xs font-mono cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Cek Status Sekarang</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulate10MinTimeout}
                  className="w-full sm:flex-1 py-2 px-3 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/60 text-amber-200 hover:text-white font-bold rounded-lg transition flex items-center justify-center gap-1.5 text-xs font-mono cursor-pointer"
                  title="Simulasikan batas waktu 10 menit terlewati untuk langsung menyetujui via Bot"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Auto-Approve Bot Langsung</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition text-xs font-mono cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : (
            /* 3. INPUT FORM */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Field 1: Nama Petugas */}
              <div className="space-y-1 relative" ref={suggestionsRef}>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    Nama Petugas In-Game <span className="text-rose-400">*</span>
                  </label>
                  {matchedOfficer ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      {matchedOfficer.rank} ({matchedOfficer.badge})
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-500">
                      Ketik bebas / pilih dari roster
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => handleNameInputChange(e.target.value)}
                    onFocus={() => {
                      if (officerName.trim().length > 0) setShowSuggestions(true);
                    }}
                    placeholder="Ketik nama petugas (Contoh: Leonard Neave)..."
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none font-mono transition"
                    required
                  />
                  {officerName && (
                    <button
                      type="button"
                      onClick={() => {
                        setOfficerName('');
                        setOfficerBadge('');
                        setShowSuggestions(false);
                      }}
                      className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Suggestions List */}
                {showSuggestions && matchingOfficers.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#161B22] border border-blue-600/60 rounded-lg shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                    <div className="px-2.5 py-1.5 bg-[#0D1117] text-[10px] font-bold text-gray-400 border-b border-gray-800 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-blue-400">
                        <Sparkles className="w-3 h-3" />
                        Saran Anggota dari Database Roster:
                      </span>
                      <span>Klik untuk pilih</span>
                    </div>
                    {matchingOfficers.map((officer) => (
                      <button
                        key={officer.id}
                        type="button"
                        onClick={() => handleSelectOfficer(officer)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-900/30 border-b border-gray-800/50 last:border-0 flex items-center justify-between transition group cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-gray-200 group-hover:text-blue-300 flex items-center gap-1.5">
                            <span>{officer.name}</span>
                            <span className="text-[10px] text-amber-400 font-normal">({officer.rank})</span>
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            Divisi: {officer.division || 'Patrol'}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800/60 font-bold">
                            {officer.badge}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Field 2: Badge & Discord Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      Nomor Badge / Lencana
                    </label>
                    <span className="text-[9px] text-gray-500">
                      {matchedOfficer ? 'Otomatis Terisi' : 'Bebas / Opsional'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={officerBadge}
                    onChange={(e) => setOfficerBadge(e.target.value)}
                    placeholder="Contoh: #001 atau 101"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none font-mono transition"
                  />
                  <span className="text-[9px] text-gray-500 block">
                    {matchedOfficer 
                      ? '✅ Terisi otomatis dari database. Bisa disesuaikan jika perlu.' 
                      : 'Bebas ketik nomor lencana atau kosongkan jika belum punya.'}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    Username / ID Discord
                  </label>
                  <input
                    type="text"
                    value={discordTag}
                    onChange={(e) => setDiscordTag(e.target.value)}
                    placeholder="Contoh: @username / user#1234"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none font-mono transition"
                  />
                </div>
              </div>

              {/* Field 3: Alasan Permintaan */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  Alasan / Keterangan Permintaan <span className="text-rose-400">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 outline-none font-mono transition mb-1.5"
                >
                  <option value="Lupa PIN login MDT CAD">Lupa PIN login MDT CAD</option>
                  <option value="Permintaan Pembaruan PIN demi Keamanan">Permintaan Pembaruan PIN demi Keamanan</option>
                  <option value="Akun Baru Belum Menerima PIN Login">Akun Baru Belum Menerima PIN Login</option>
                  <option value="PIN Terkunci / Butuh Bantuan Atasan">PIN Terkunci / Butuh Bantuan Atasan</option>
                  <option value="Lainnya (Ketik Manual)">Lainnya (Tuliskan di bawah)</option>
                </select>
                {reason === 'Lainnya (Ketik Manual)' && (
                  <textarea
                    rows={2}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Tuliskan alasan pengajuan secara rinci..."
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none font-mono"
                    required
                  />
                )}
              </div>

              {/* Field 4: Usulan PIN Baru (Opsional) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    PIN Baru yang Diajukan (Opsional)
                  </label>
                  <span className="text-[9px] text-gray-500">Opsional</span>
                </div>
                <input
                  type="text"
                  value={requestedPin}
                  onChange={(e) => setRequestedPin(e.target.value)}
                  placeholder="Contoh: 84621 atau 10-4 (Opsional)"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none font-mono transition"
                />
                <span className="text-[10px] text-gray-400 block font-sans">
                  PIN ini akan disahkan Atasan atau otomatis diaktifkan oleh Bot setelah 10 menit.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition text-xs font-mono cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 text-xs font-mono cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSubmitting ? 'MENGIRIM LUPA PIN...' : 'KIRIM LUPA PIN'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#0F1319] border-t border-gray-800 px-4 py-2 flex items-center justify-between text-[10px] text-gray-500 font-mono">
          <span>Target: Discord Webhook Channel & High Command HQ</span>
          <span>HSPD Security Desk</span>
        </div>
      </div>
    </div>
  );
};
