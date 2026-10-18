import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Send, X, AlertTriangle, CheckCircle2, User, 
  KeyRound, HelpCircle,
  Sparkles, CheckCircle, Zap, ShieldCheck, Copy, Check, ArrowRight,
  Clock, RefreshCw, Bot, Crown, Building2, Lock, Eye, EyeOff, Shield
} from 'lucide-react';
import { GovernmentAccount } from '../types';
import { 
  getGovernmentRoster, 
  isGovernmentMatch, 
  getGovOnlineLeadersList, 
  executeGovPinResetSubmission, 
  autoApproveGovPinRequestDueToTimeout, 
  getGovPinResetRequests, 
  GOV_PIN_RESET_AUTO_ACCEPT_TIMEOUT_MS,
  updateGovernmentPin
} from '../utils/governmentStorage';
import { sendOfficerDirectMessageViaBot } from '../utils/discordWebhook';
import { logDeveloperSystemActivity } from '../utils/activityMonitoringStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialIdentifier?: string;
  onPinApplied?: (newPin: string, officialName: string) => void;
}

type GovModalMode = 'DISCORD_CODE' | 'LEADER_TICKET';
type GovDiscordStep = 'INPUT_OFFICIAL' | 'ENTER_CODE' | 'NEW_PIN_FORM' | 'SUCCESS';

const GOV_COOLDOWN_KEY_PREFIX = 'hspd_gov_pin_cooldown_';
const GOV_SESSION_STORAGE_KEY = 'hspd_gov_pin_active_session_v2';

interface ActiveGovVerificationSession {
  officialName: string;
  badge: string;
  discordTag: string;
  code: string;
  sentAt: number;
  expiresAt: number;
}

function getGovCooldownRemainingSeconds(nameOrBadge: string): number {
  if (typeof window === 'undefined' || !nameOrBadge.trim()) return 0;
  try {
    const key = `${GOV_COOLDOWN_KEY_PREFIX}${nameOrBadge.toLowerCase().trim()}`;
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const expiresAt = parseInt(raw, 10);
    if (isNaN(expiresAt)) return 0;
    const diff = Math.ceil((expiresAt - Date.now()) / 1000);
    if (diff <= 0) {
      localStorage.removeItem(key);
      return 0;
    }
    return diff;
  } catch {
    return 0;
  }
}

function setGovCooldown(nameOrBadge: string, durationSeconds: number = 30 * 60) {
  if (typeof window === 'undefined' || !nameOrBadge.trim()) return;
  try {
    const key = `${GOV_COOLDOWN_KEY_PREFIX}${nameOrBadge.toLowerCase().trim()}`;
    const until = Date.now() + durationSeconds * 1000;
    localStorage.setItem(key, until.toString());
  } catch {}
}

function clearGovCooldown(nameOrBadge: string) {
  if (typeof window === 'undefined' || !nameOrBadge.trim()) return;
  try {
    const key = `${GOV_COOLDOWN_KEY_PREFIX}${nameOrBadge.toLowerCase().trim()}`;
    localStorage.removeItem(key);
  } catch {}
}

export const GovernmentRequestPinModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialIdentifier = '',
  onPinApplied
}) => {
  const [activeMode, setActiveMode] = useState<GovModalMode>('DISCORD_CODE');
  const [discordStep, setDiscordStep] = useState<GovDiscordStep>('INPUT_OFFICIAL');

  // Step 1: Official identification & Discord
  const [officialName, setOfficialName] = useState('');
  const [officialBadge, setOfficialBadge] = useState('');
  const [discordTag, setDiscordTag] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [dmStatusNotice, setDmStatusNotice] = useState<string | null>(null);

  // 30-Minute Cooldown tracker
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // Step 2: 5-digit verification code
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '']);
  const [codeTimeLeftSeconds, setCodeTimeLeftSeconds] = useState<number>(600); // 10 minutes
  const [codeError, setCodeError] = useState<string | null>(null);
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3: New PIN form
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [pinFormError, setPinFormError] = useState<string | null>(null);

  // Step 4: Success
  const [appliedPinValue, setAppliedPinValue] = useState<string>('');
  const [copiedPin, setCopiedPin] = useState(false);

  // Ticket mode fallback
  const [reason, setReason] = useState('Lupa PIN login Portal Resmi Pemerintahan');
  const [customReason, setCustomReason] = useState('');
  const [requestedPin, setRequestedPin] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketErrorMessage, setTicketErrorMessage] = useState('');
  const [pendingTicket, setPendingTicket] = useState<{
    id: string;
    createdAt: number;
    officialName: string;
    badge: string;
    targetPin: string;
  } | null>(null);
  const [ticketTimeLeftSeconds, setTicketTimeLeftSeconds] = useState<number>(600);
  const [autoGrantedData, setAutoGrantedData] = useState<{
    pin: string;
    officialName: string;
    badge: string;
    approvedByText?: string;
    isBotAutoApproved?: boolean;
  } | null>(null);

  const suggestionsRef = useRef<HTMLDivElement>(null);
  const prevIsOpenRef = useRef(false);
  const roster = getGovernmentRoster();

  // Check matched official
  const matchedOfficial = useMemo(() => {
    const q = officialName.trim().toLowerCase();
    if (!q) return null;
    return roster.find(r => isGovernmentMatch(r, q)) || null;
  }, [officialName, roster]);

  const matchingOfficials = useMemo(() => {
    const q = officialName.trim().toLowerCase();
    if (!q) return [];
    return roster.filter(r => 
      r.name.toLowerCase().includes(q) || 
      (r.badge || '').toLowerCase().includes(q) ||
      (r.rank || '').toLowerCase().includes(q)
    ).slice(0, 6);
  }, [officialName, roster]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const updateCooldownStatus = (targetName: string, targetBadge?: string) => {
    const cd1 = getGovCooldownRemainingSeconds(targetName);
    const cd2 = targetBadge ? getGovCooldownRemainingSeconds(targetBadge) : 0;
    setCooldownSeconds(Math.max(cd1, cd2));
  };

  // Cooldown ticker
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Initialize values ONLY when modal opens
  useEffect(() => {
    if (!prevIsOpenRef.current && isOpen) {
      setActiveMode('DISCORD_CODE');
      setCodeError(null);
      setPinFormError(null);
      setDmStatusNotice(null);
      setNewPin('');
      setConfirmPin('');
      setShowNewPin(false);
      setIsSavingPin(false);
      setAppliedPinValue('');
      setCopiedPin(false);
      setTicketErrorMessage('');
      setAutoGrantedData(null);
      setPendingTicket(null);
      setCustomReason('');
      setRequestedPin('');
      setReason('Lupa PIN login Portal Resmi Pemerintahan');

      const initId = initialIdentifier.trim();
      let detectedName = initId;
      let detectedBadge = '';
      let detectedDiscord = '';

      if (initId) {
        const clean = initId.toLowerCase();
        const found = roster.find(r => isGovernmentMatch(r, clean));
        if (found) {
          detectedName = found.name;
          detectedBadge = found.badge;
          detectedDiscord = found.discordTag || '';
        }
      }

      setOfficialName(detectedName);
      setOfficialBadge(detectedBadge);
      setDiscordTag(detectedDiscord);

      // Check ongoing session
      let restored = false;
      try {
        const raw = sessionStorage.getItem(GOV_SESSION_STORAGE_KEY);
        if (raw) {
          const sess: ActiveGovVerificationSession = JSON.parse(raw);
          const remaining = Math.ceil((sess.expiresAt - Date.now()) / 1000);
          if (remaining > 0 && (!detectedName || sess.officialName.toLowerCase() === detectedName.toLowerCase())) {
            setOfficialName(sess.officialName);
            setOfficialBadge(sess.badge);
            setDiscordTag(sess.discordTag);
            setGeneratedCode(sess.code);
            setCodeTimeLeftSeconds(remaining);
            setDiscordStep('ENTER_CODE');
            restored = true;
          } else {
            sessionStorage.removeItem(GOV_SESSION_STORAGE_KEY);
          }
        }
      } catch {}

      if (!restored) {
        setDiscordStep('INPUT_OFFICIAL');
        setGeneratedCode('');
        setCodeDigits(['', '', '', '', '']);
        updateCooldownStatus(detectedName, detectedBadge);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialIdentifier, roster]);

  useEffect(() => {
    if (matchedOfficial) {
      setOfficialBadge(matchedOfficial.badge);
      if (matchedOfficial.discordTag) {
        setDiscordTag(matchedOfficial.discordTag);
      }
      updateCooldownStatus(matchedOfficial.name, matchedOfficial.badge);
    } else if (officialName.trim()) {
      updateCooldownStatus(officialName.trim());
    }
  }, [officialName, matchedOfficial]);

  // 10-MINUTE VERIFICATION COUNTDOWN & 30-MINUTE COOLDOWN ENFORCER
  useEffect(() => {
    if (discordStep !== 'ENTER_CODE') return;

    const interval = setInterval(() => {
      setCodeTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          const targetKey = officialName.trim() || officialBadge.trim();
          if (targetKey) {
            setGovCooldown(targetKey, 30 * 60);
            if (matchedOfficial?.badge) setGovCooldown(matchedOfficial.badge, 30 * 60);
            if (matchedOfficial?.name) setGovCooldown(matchedOfficial.name, 30 * 60);
            setCooldownSeconds(30 * 60);
          }
          try {
            sessionStorage.removeItem(GOV_SESSION_STORAGE_KEY);
          } catch {}
          setDiscordStep('INPUT_OFFICIAL');
          setCodeError('⏳ BATAS WAKTU 10 MENIT HABIS: Kode verifikasi kedaluwarsa. Sistem memberlakukan jeda keamanan 30 menit sebelum permohonan baru dapat diajukan.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [discordStep, officialName, officialBadge, matchedOfficial]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOfficial = (official: GovernmentAccount) => {
    setOfficialName(official.name);
    setOfficialBadge(official.badge);
    setDiscordTag(official.discordTag || '');
    setShowSuggestions(false);
    updateCooldownStatus(official.name, official.badge);
  };

  // SEND 5-DIGIT CODE, JUMP INSTANTLY TO ENTER_CODE, SEND BOT DM IN BACKGROUND
  const handleSendGovDiscordVerificationCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCodeError(null);
    setDmStatusNotice(null);

    const trimmedName = officialName.trim();
    if (!trimmedName) {
      setCodeError('Nama Pejabat Pemerintah wajib diisi!');
      return;
    }

    const activeCd = Math.max(
      getGovCooldownRemainingSeconds(trimmedName),
      matchedOfficial ? getGovCooldownRemainingSeconds(matchedOfficial.badge) : 0
    );
    if (activeCd > 0) {
      setCooldownSeconds(activeCd);
      setCodeError(`⏳ PERMOHONAN DITOLAK: Anda sedang dalam masa jeda keamanan 30 menit. Silakan tunggu ${formatCountdown(activeCd)} lagi.`);
      return;
    }

    const targetOfficial = matchedOfficial || roster.find(r => isGovernmentMatch(r, trimmedName));
    if (!targetOfficial) {
      setCodeError(`Pejabat "${trimmedName}" tidak ditemukan di database Roster Balai Kota/Pemerintahan!`);
      return;
    }

    const resolvedDiscord = (targetOfficial.discordTag || discordTag || '').replace(/^@+/, '').trim();
    if (!resolvedDiscord) {
      setCodeError(`Akun Discord untuk pejabat "${targetOfficial.name}" (${targetOfficial.badge}) belum terdaftar di Roster!`);
      return;
    }

    const currentBadge = targetOfficial.badge || '#GOV-01';

    // 1. Generate 5-digit code
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    setGeneratedCode(code);
    setCodeDigits(['', '', '', '', '']);
    setCodeTimeLeftSeconds(600);

    // 2. Persist active session
    const sessionObj: ActiveGovVerificationSession = {
      officialName: targetOfficial.name,
      badge: currentBadge,
      discordTag: resolvedDiscord,
      code,
      sentAt: Date.now(),
      expiresAt: Date.now() + 600 * 1000
    };
    try {
      sessionStorage.setItem(GOV_SESSION_STORAGE_KEY, JSON.stringify(sessionObj));
    } catch {}

    // 3. IMMEDIATELY transition to ENTER_CODE step
    setDiscordStep('ENTER_CODE');
    setTimeout(() => {
      digitInputRefs.current[0]?.focus();
    }, 100);

    // 4. Dispatch DM in background
    setIsSendingCode(true);
    sendOfficerDirectMessageViaBot({
      officerName: targetOfficial.name,
      badge: currentBadge,
      discordUsername: resolvedDiscord,
      messageType: 'verification',
      verificationCode: code,
      pin: code,
      title: '🏛️ KODE VERIFIKASI RESET PIN PEMERINTAHAN',
      customMessage: `Halo Yang Terhormat **${targetOfficial.name}** (\`${currentBadge}\`)!\n\nBerikut adalah 5 digit kode verifikasi Anda:\n\n# 🔢 **\`${code}\`**\n\nMasukkan kode 5 digit di atas pada portal. Kode berlaku selama 10 menit (delay 30 menit jika tidak dimasukkan).`
    }).then((dmResult) => {
      if (dmResult.success) {
        setDmStatusNotice(`✅ Bot berhasil mengirimkan 5 digit kode verifikasi ke DM Discord @${resolvedDiscord}!`);
      } else {
        setDmStatusNotice(`⚠️ Notifikasi Server: ${dmResult.message}. Anda dapat menggunakan kode bantuan.`);
      }
    }).catch(() => {
      setDmStatusNotice('Peringatan: Bot Discord offline atau DM tertutup. Kode bantuan tetap aktif.');
    }).finally(() => {
      setIsSendingCode(false);
    });

    logDeveloperSystemActivity({
      module: 'GOVERNMENT',
      action: 'PIN_AUDIT',
      title: `Pengiriman Kode Verifikasi Pejabat: ${targetOfficial.name} (${currentBadge})`,
      description: `Kode 5 digit verifikasi dikirimkan ke DM Discord: @${resolvedDiscord}`,
      entity: 'GOVERNMENT',
      actor: targetOfficial.name,
      actorBadge: currentBadge,
      severity: 'INFO'
    });
  };

  const handleDigitChange = (index: number, val: string) => {
    setCodeError(null);
    const cleaned = val.replace(/[^0-9]/g, '');

    if (cleaned.length >= 5) {
      const five = cleaned.slice(0, 5).split('');
      setCodeDigits(five);
      verifyEnteredCode(five.join(''));
      return;
    }

    const nextDigits = [...codeDigits];
    nextDigits[index] = cleaned.slice(-1);
    setCodeDigits(nextDigits);

    if (cleaned && index < 4) {
      digitInputRefs.current[index + 1]?.focus();
    }

    const completeCode = nextDigits.join('');
    if (completeCode.length === 5 && !nextDigits.includes('')) {
      verifyEnteredCode(completeCode);
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  const verifyEnteredCode = (entered: string) => {
    const cleanEntered = entered.trim().replace(/[^0-9]/g, '');
    let expectedCode = generatedCode.trim().replace(/[^0-9]/g, '');

    if (!expectedCode) {
      try {
        const raw = sessionStorage.getItem(GOV_SESSION_STORAGE_KEY);
        if (raw) {
          const sess: ActiveGovVerificationSession = JSON.parse(raw);
          if (sess.code) {
            expectedCode = sess.code.trim().replace(/[^0-9]/g, '');
            setGeneratedCode(sess.code);
          }
        }
      } catch {}
    }

    if (codeTimeLeftSeconds <= 0) {
      setCodeError('Kode verifikasi telah kedaluwarsa. Silakan periksa masa cooldown.');
      return;
    }

    if (cleanEntered.length === 5 && cleanEntered === expectedCode) {
      setCodeError(null);
      try {
        sessionStorage.removeItem(GOV_SESSION_STORAGE_KEY);
      } catch {}
      clearGovCooldown(officialName);
      if (matchedOfficial) clearGovCooldown(matchedOfficial.badge);
      setCooldownSeconds(0);
      setDiscordStep('NEW_PIN_FORM');
    } else {
      setCodeError('❌ Kode verifikasi 5 digit tidak cocok. Silakan periksa DM Discord Anda.');
    }
  };

  const handleSaveAndApplyGovPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinFormError(null);

    const trimmedNewPin = newPin.trim();
    if (!trimmedNewPin) {
      setPinFormError('PIN Baru tidak boleh kosong!');
      return;
    }

    if (trimmedNewPin.length < 3) {
      setPinFormError('PIN Baru minimal 3 karakter demi kepatuhan keamanan.');
      return;
    }

    if (trimmedNewPin !== confirmPin.trim()) {
      setPinFormError('Konfirmasi PIN Baru tidak cocok! Periksa kembali.');
      return;
    }

    setIsSavingPin(true);

    try {
      const targetIdentifier = officialBadge.trim() || officialName.trim();
      const updateResult = updateGovernmentPin(targetIdentifier, trimmedNewPin);

      if (!updateResult.success) {
        throw new Error(updateResult.message);
      }

      if (onPinApplied) {
        onPinApplied(trimmedNewPin, officialName.trim());
      }

      logDeveloperSystemActivity({
        module: 'GOVERNMENT',
        action: 'PIN_AUDIT',
        title: `PIN Baru Pejabat Diaktifkan: ${officialName} (${officialBadge})`,
        description: `PIN login pemerintahan berhasil diperbarui melalui verifikasi DM Discord.`,
        entity: 'GOVERNMENT',
        actor: officialName.trim(),
        actorBadge: officialBadge.trim(),
        severity: 'INFO'
      });

      setAppliedPinValue(trimmedNewPin);
      setDiscordStep('SUCCESS');
    } catch (err: any) {
      setPinFormError(`Gagal memperbarui PIN: ${err?.message || err}`);
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleDirectGovLogin = () => {
    if (appliedPinValue && onPinApplied) {
      onPinApplied(appliedPinValue, officialName || officialBadge);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150 font-mono text-xs">
      <div className="bg-[#14120C] border border-amber-600/50 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#0D0B07] border-b border-amber-900/50 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-amber-200 uppercase tracking-tight flex items-center gap-1.5 font-sans">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>PEMULIHAN PIN APARATUR PEMERINTAHAN</span>
              </h3>
              <p className="text-[10px] text-amber-400/80 font-mono">
                Verifikasi Bot Discord 5-Digit & Sinkronisasi Database Negara
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="bg-[#0A0805] px-4 pt-2 border-b border-amber-950 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMode('DISCORD_CODE')}
            className={`pb-2.5 px-3 font-mono text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeMode === 'DISCORD_CODE'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>KODE VERIFIKASI DISCORD (5 DIGIT)</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-950 text-amber-300 border border-amber-700/60">
              UTAMA
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('LEADER_TICKET')}
            className={`pb-2.5 px-3 font-mono text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeMode === 'LEADER_TICKET'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Tiket Manual</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {activeMode === 'DISCORD_CODE' && (
            <div className="space-y-4">
              {/* Stepper Header */}
              <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[10px]">
                <div className={`py-1.5 px-1 rounded border ${
                  discordStep === 'INPUT_OFFICIAL'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold'
                    : 'bg-[#18140B] border-amber-950 text-gray-500'
                }`}>
                  1. Nama Pejabat
                </div>
                <div className={`py-1.5 px-1 rounded border ${
                  discordStep === 'ENTER_CODE'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold'
                    : 'bg-[#18140B] border-amber-950 text-gray-500'
                }`}>
                  2. Kode DM (5 Digit)
                </div>
                <div className={`py-1.5 px-1 rounded border ${
                  discordStep === 'NEW_PIN_FORM'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-[#18140B] border-amber-950 text-gray-500'
                }`}>
                  3. PIN Baru
                </div>
                <div className={`py-1.5 px-1 rounded border ${
                  discordStep === 'SUCCESS'
                    ? 'bg-green-950/80 border-green-500 text-green-300 font-bold'
                    : 'bg-[#18140B] border-amber-950 text-gray-500'
                }`}>
                  4. Siap Login
                </div>
              </div>

              {dmStatusNotice && (
                <div className="p-3 bg-amber-950/40 border border-amber-500/60 rounded-xl text-amber-200 text-xs flex items-center justify-between gap-2 shadow">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{dmStatusNotice}</span>
                  </span>
                  <button onClick={() => setDmStatusNotice(null)} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
                </div>
              )}

              {codeError && (
                <div className="p-3 bg-rose-950/60 border border-rose-700 rounded-xl text-rose-200 text-xs flex items-center gap-2 shadow">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{codeError}</span>
                </div>
              )}

              {/* STEP 1: INPUT NAMA PEJABAT */}
              {discordStep === 'INPUT_OFFICIAL' && (
                <form onSubmit={handleSendGovDiscordVerificationCode} className="space-y-4">
                  <div className="p-3.5 bg-gradient-to-r from-amber-950/30 to-yellow-950/30 border border-amber-700/50 rounded-xl space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-amber-300 text-xs">
                      <Bot className="w-4 h-4 text-amber-400" />
                      <span>Verifikasi Otentikasi Bot Discord</span>
                    </div>
                    <p className="text-gray-300 text-[11px] font-sans leading-relaxed">
                      Masukkan nama pejabat Anda di bawah ini. Bot akan langsung mengirimkan <strong>5 digit kode verifikasi</strong> ke DM Discord yang terdaftar di Roster Balai Kota.
                    </p>
                  </div>

                  {/* 30-Minute Cooldown Warning Card */}
                  {cooldownSeconds > 0 && (
                    <div className="p-3.5 bg-red-950/80 border-2 border-red-500 rounded-xl space-y-1.5 text-red-200 shadow-lg animate-pulse">
                      <div className="font-bold flex items-center gap-2 text-red-400 text-xs">
                        <Clock className="w-4 h-4 text-red-400 animate-spin" />
                        <span>MASA JEDA KEAMANAN (DELAY COOLDOWN 30 MENIT) AKTIF</span>
                      </div>
                      <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                        Kode verifikasi sebelumnya tidak dimasukkan dalam 10 menit. Sistem keamanan memberlakukan jeda 30 menit sebelum permohonan baru dapat diajukan.
                      </p>
                      <div className="pt-1 flex items-center justify-between text-xs font-mono">
                        <span className="text-gray-400">Sisa Waktu Jeda:</span>
                        <span className="px-2.5 py-0.5 rounded bg-black border border-red-500 text-red-300 font-bold text-sm">
                          {formatCountdown(cooldownSeconds)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 relative" ref={suggestionsRef}>
                    <label className="text-[11px] font-bold uppercase text-amber-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        Nama Pejabat In-Game <span className="text-rose-400">*</span>
                      </span>
                      {matchedOfficial && (
                        <span className="text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Roster Terdaftar
                        </span>
                      )}
                    </label>

                    <input
                      type="text"
                      required
                      value={officialName}
                      onChange={(e) => {
                        setOfficialName(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Contoh: Momo Hatakeyama atau #GOV-01"
                      className="w-full px-3 py-2.5 bg-[#0E0C08] border border-amber-900/60 focus:border-amber-500 rounded-xl text-xs text-amber-100 placeholder:text-gray-600 outline-none font-mono transition"
                    />

                    {showSuggestions && matchingOfficials.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A150D] border border-amber-500/60 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto">
                        {matchingOfficials.map((official) => (
                          <div
                            key={official.id || official.badge}
                            onClick={() => handleSelectOfficial(official)}
                            className="p-2 hover:bg-amber-950/60 cursor-pointer border-b border-amber-900/40 last:border-0 flex items-center justify-between transition"
                          >
                            <div>
                              <div className="font-bold text-amber-100 text-xs">{official.name}</div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                {official.badge} • {official.rank}
                              </div>
                            </div>
                            {official.discordTag && (
                              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60">
                                @{official.discordTag.replace(/^@+/, '')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Auto-detected Roster Info Card (No manual input needed) */}
                  {matchedOfficial ? (
                    <div className="p-3 bg-[#120E08] border border-amber-500/50 rounded-xl space-y-2 font-mono text-xs shadow-inner">
                      <div className="flex items-center justify-between text-gray-400 text-[10px] pb-1.5 border-b border-amber-950">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          PEJABAT DITEMUKAN DI ROSTER
                        </span>
                        <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60">
                          TERDAFTAR
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-sans">Callsign & Jabatan:</span>
                          <strong className="text-white text-xs">{matchedOfficial.badge} • {matchedOfficial.rank}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-sans">Username Discord Tujuan DM:</span>
                          {matchedOfficial.discordTag ? (
                            <strong className="text-amber-300 text-xs">@{matchedOfficial.discordTag.replace(/^@+/, '')}</strong>
                          ) : (
                            <span className="text-rose-400 text-[11px] font-sans font-bold">Belum terdaftar di Roster</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : officialName.trim() ? (
                    <div className="p-3 bg-[#120E08] border border-amber-900/60 rounded-xl text-gray-400 text-xs font-sans flex items-center gap-2">
                      <Bot className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Sistem akan mencari akun Discord milik <strong>"{officialName}"</strong> langsung dari database Roster Balai Kota.</span>
                    </div>
                  ) : null}

                  <div className="pt-2 border-t border-amber-900/50 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-mono cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingCode || !officialName.trim() || cooldownSeconds > 0}
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-50 text-black font-black rounded-xl text-xs font-mono transition flex items-center gap-1.5 shadow-lg shadow-amber-950/60 cursor-pointer"
                    >
                      {isSendingCode ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>MENGIRIM KODE KE DM...</span>
                        </>
                      ) : cooldownSeconds > 0 ? (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>TUNGGU JEDA ({formatCountdown(cooldownSeconds)})</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>KIRIM KODE KE DM DISCORD</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: MASUKKAN KODE 5 ANGKA (LANGSUNG TERBUKA SETELAH TEKAN KIRIM KODE) */}
              {discordStep === 'ENTER_CODE' && (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-b from-[#1C160B] to-[#0E0C08] border border-amber-500/60 rounded-2xl text-center space-y-2 shadow-xl">
                    <div className="inline-flex p-2.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-400">
                      <Bot className="w-6 h-6 animate-pulse" />
                    </div>
                    <h4 className="font-bold text-sm text-amber-200 font-sans">
                      MASUKKAN KODE VERIFIKASI 5 ANGKA
                    </h4>
                    <p className="text-xs text-gray-300 font-sans max-w-sm mx-auto">
                      Bot telah mengirimkan 5 angka kode verifikasi ke DM Discord akun:
                      <br />
                      <strong className="text-amber-300 font-mono text-sm">
                        @{discordTag ? discordTag.replace(/^@+/, '') : officialName}
                      </strong>
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 border border-amber-900/60 text-[11px] font-mono text-gray-200 shadow">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>Batas Waktu: <strong className="text-amber-300">{formatCountdown(codeTimeLeftSeconds)}</strong></span>
                      <span className="text-gray-500">•</span>
                      <span className="text-[10px] text-gray-400">Delay 30m jika habis</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-center text-xs font-bold uppercase text-amber-300 font-mono">
                      Ketik 5 Digit Angka Verifikasi:
                    </label>
                    <div className="flex items-center justify-center gap-2.5 sm:gap-3">
                      {codeDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={el => { digitInputRefs.current[idx] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleDigitChange(idx, e.target.value)}
                          onKeyDown={e => handleDigitKeyDown(idx, e)}
                          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black font-mono rounded-xl bg-[#0A0805] border-2 border-amber-900/80 focus:border-amber-400 text-amber-200 outline-none shadow-inner transition"
                        />
                      ))}
                    </div>
                  </div>


                  <div className="pt-2 border-t border-amber-900/50 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setDiscordStep('INPUT_OFFICIAL')}
                      className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-mono cursor-pointer"
                    >
                      ← Ganti Akun
                    </button>
                    <button
                      type="button"
                      onClick={() => verifyEnteredCode(codeDigits.join(''))}
                      disabled={codeDigits.join('').length !== 5}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-black rounded-xl text-xs font-mono transition shadow-lg cursor-pointer"
                    >
                      VERIFIKASI KODE
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: FORMAT PENGUBAHAN PIN YANG BARU */}
              {discordStep === 'NEW_PIN_FORM' && (
                <form onSubmit={handleSaveAndApplyGovPin} className="space-y-4">
                  <div className="p-3.5 bg-gradient-to-r from-amber-950/60 to-yellow-950/60 border border-amber-500/60 rounded-xl space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-300 text-xs">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Verifikasi Pejabat Berhasil!</span>
                    </div>
                    <p className="text-gray-300 text-[11px] font-sans">
                      Identitas pejabat <strong>{officialName}</strong> ({officialBadge}) telah terkonfirmasi. Tentukan PIN login baru Anda:
                    </p>
                  </div>

                  {pinFormError && (
                    <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{pinFormError}</span>
                    </div>
                  )}

                  <div className="space-y-3 font-mono">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase text-amber-200 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          PIN Login Baru (Min. 3 Karakter) <span className="text-rose-400">*</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowNewPin(!showNewPin)}
                          className="text-gray-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          {showNewPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showNewPin ? 'Sembunyikan' : 'Tampilkan'}</span>
                        </button>
                      </label>
                      <input
                        type={showNewPin ? 'text' : 'password'}
                        required
                        value={newPin}
                        onChange={e => setNewPin(e.target.value)}
                        placeholder="Contoh: 10-4 atau 59281"
                        className="w-full px-3 py-2.5 bg-[#0A0805] border border-amber-900/80 focus:border-amber-400 rounded-xl text-sm text-amber-300 placeholder:text-gray-600 outline-none font-mono transition tracking-wider"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase text-amber-200 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        Konfirmasi PIN Login Baru <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type={showNewPin ? 'text' : 'password'}
                        required
                        value={confirmPin}
                        onChange={e => setConfirmPin(e.target.value)}
                        placeholder="Ketik ulang PIN baru"
                        className="w-full px-3 py-2.5 bg-[#0A0805] border border-amber-900/80 focus:border-amber-400 rounded-xl text-sm text-amber-300 placeholder:text-gray-600 outline-none font-mono transition tracking-wider"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-amber-900/50 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDiscordStep('ENTER_CODE')}
                      className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-xs font-mono cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingPin || !newPin.trim() || newPin !== confirmPin}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-950/60 text-xs font-mono cursor-pointer"
                    >
                      {isSavingPin ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>MENYIMPAN...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>SIMPAN & TERAPKAN PIN BARU</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 4: SUKSES */}
              {discordStep === 'SUCCESS' && (
                <div className="p-4 bg-gradient-to-b from-amber-950/80 to-[#120E08] border-2 border-amber-500 rounded-2xl text-amber-200 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/50">
                      <ShieldCheck className="w-7 h-7 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-amber-300 font-sans">
                        PIN BARU PEJABAT BERHASIL DIAKTIFKAN!
                      </h4>
                      <p className="text-[10px] text-amber-400/80 font-mono">
                        Tersinkronisasi otomatis ke Database Roster & Cloud Firestore.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-black/70 border border-amber-500/60 rounded-xl space-y-2 font-mono">
                    <div className="flex items-center justify-between text-xs border-b border-amber-900/50 pb-2">
                      <span className="text-gray-400">Pejabat:</span>
                      <strong className="text-white">{officialName} ({officialBadge})</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">PIN Login Baru:</span>
                      <strong className="text-lg font-black text-amber-400 px-3 py-1 rounded bg-[#100D06] border border-amber-500/80">
                        {appliedPinValue}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDirectGovLogin}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>LANGSUNG MASUK KE PORTAL PEMERINTAHAN</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeMode === 'LEADER_TICKET' && (
            <div className="text-center py-4 space-y-2 text-xs text-gray-400">
              <Shield className="w-6 h-6 text-amber-400 mx-auto" />
              <p>Tiket manual diteruskan langsung ke Ruang Sidang Eksekutif.</p>
              <button
                type="button"
                onClick={() => setActiveMode('DISCORD_CODE')}
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-black font-bold text-xs"
              >
                Gunakan Verifikasi Bot Discord (5 Digit)
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#090C10] p-3 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-500" />
            <span>PORTAL RESMI BALAI KOTA & PEMERINTAHAN</span>
          </div>
          <span>Sistem Keamanan Kredensial Terpadu • 10m Timeout / 30m Cooldown</span>
        </div>
      </div>
    </div>
  );
};
