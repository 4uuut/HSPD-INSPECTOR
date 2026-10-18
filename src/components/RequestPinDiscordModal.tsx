import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Send, X, AlertTriangle, CheckCircle2, Shield, User, 
  KeyRound, MessageSquare, HelpCircle,
  Sparkles, CheckCircle, Zap, ShieldCheck, Copy, Check, ArrowRight,
  Clock, RefreshCw, Bot, Eye, EyeOff, Lock
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
  playPoliceChime,
  updateOfficerPinInRoster
} from '../utils/pinResetStorage';
import { setOfficerCustomPin } from '../utils/officerPinRegistry';
import { sendOfficerDirectMessageViaBot } from '../utils/discordWebhook';
import { pushToFirestore } from '../services/firebaseRealtimeSync';
import { logDeveloperSystemActivity } from '../utils/activityMonitoringStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialIdentifier?: string;
  roster: OfficerAccount[];
  onUpdateOfficerPin?: (badgeOrName: string, newPin: string) => boolean;
  onPinAutoApplied?: (pin: string, identifier: string) => void;
}

type ModalFlowMode = 'DISCORD_CODE' | 'SUPERIOR_TICKET';
type DiscordCodeStep = 'INPUT_OFFICER' | 'ENTER_CODE' | 'NEW_PIN_FORM' | 'SUCCESS';

// Storage keys
const COOLDOWN_KEY_PREFIX = 'hspd_pin_cooldown_';
const ACTIVE_SESSION_STORAGE_KEY = 'hspd_pin_active_session_v2';

interface ActiveVerificationSession {
  officerName: string;
  badge: string;
  discordTag: string;
  code: string;
  sentAt: number;
  expiresAt: number;
}

// Helpers for 30-minute cooldown
function getOfficerCooldownRemainingSeconds(nameOrBadge: string): number {
  if (typeof window === 'undefined' || !nameOrBadge.trim()) return 0;
  try {
    const key = `${COOLDOWN_KEY_PREFIX}${nameOrBadge.toLowerCase().trim()}`;
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

function setOfficerCooldown(nameOrBadge: string, durationSeconds: number = 30 * 60) {
  if (typeof window === 'undefined' || !nameOrBadge.trim()) return;
  try {
    const key = `${COOLDOWN_KEY_PREFIX}${nameOrBadge.toLowerCase().trim()}`;
    const until = Date.now() + durationSeconds * 1000;
    localStorage.setItem(key, until.toString());
  } catch {}
}

function clearOfficerCooldown(nameOrBadge: string) {
  if (typeof window === 'undefined' || !nameOrBadge.trim()) return;
  try {
    const key = `${COOLDOWN_KEY_PREFIX}${nameOrBadge.toLowerCase().trim()}`;
    localStorage.removeItem(key);
  } catch {}
}

export const RequestPinDiscordModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialIdentifier = '',
  roster,
  onUpdateOfficerPin,
  onPinAutoApplied
}) => {
  // Main mode selector: Discord Bot 5-Digit Verification (Default) vs Superior Ticket
  const [activeMode, setActiveMode] = useState<ModalFlowMode>('DISCORD_CODE');
  const [discordStep, setDiscordStep] = useState<DiscordCodeStep>('INPUT_OFFICER');

  // Step 1: Officer identification & Discord target
  const [officerName, setOfficerName] = useState('');
  const [officerBadge, setOfficerBadge] = useState('');
  const [discordTag, setDiscordTag] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [dmStatusNotice, setDmStatusNotice] = useState<string | null>(null);

  // 30-minute Cooldown tracker
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // Step 2: 5-digit verification code
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '']);
  const [codeTimeLeftSeconds, setCodeTimeLeftSeconds] = useState<number>(600); // 10 minutes (600s)
  const [codeError, setCodeError] = useState<string | null>(null);
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3: New PIN form
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [pinFormError, setPinFormError] = useState<string | null>(null);

  // Step 4: Success data
  const [appliedPinValue, setAppliedPinValue] = useState<string>('');
  const [copiedPin, setCopiedPin] = useState(false);

  // Superior Ticket Mode fallback states
  const [reason, setReason] = useState('Lupa PIN login MDT CAD');
  const [requestedPin, setRequestedPin] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketErrorMessage, setTicketErrorMessage] = useState('');
  const [pendingTicket, setPendingTicket] = useState<{
    id: string;
    createdAt: number;
    officerName: string;
    badge: string;
    targetPin: string;
  } | null>(null);
  const [ticketTimeLeftSeconds, setTicketTimeLeftSeconds] = useState<number>(600);
  const [autoGrantedData, setAutoGrantedData] = useState<{
    pin: string;
    officerName: string;
    badge: string;
    approvedByText?: string;
    isBotAutoApproved?: boolean;
  } | null>(null);

  const suggestionsRef = useRef<HTMLDivElement>(null);
  const prevIsOpenRef = useRef(false);

  // Check online superiors
  const superiorsOnline = useMemo(() => getOnlineSuperiorsList(roster), [roster, isOpen]);
  const isSuperiorActive = superiorsOnline.length > 0;

  // Filter roster suggestions based on user input
  const matchingOfficers = useMemo(() => {
    const q = officerName.trim().toLowerCase();
    if (!q) return [];
    return roster.filter(r => 
      r.name.toLowerCase().includes(q) || 
      r.badge.toLowerCase().includes(q) ||
      (r.rank && r.rank.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [officerName, roster]);

  // Check exact matched officer from roster
  const matchedOfficer = useMemo(() => {
    const q = officerName.trim().toLowerCase();
    if (!q) return null;
    return roster.find(r => 
      r.name.toLowerCase() === q || 
      r.badge.toLowerCase() === q ||
      r.badge.toLowerCase() === (q.startsWith('#') ? q : `#${q}`)
    ) || null;
  }, [officerName, roster]);

  // Format seconds to mm:ss
  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Check active cooldown for current officer name / badge
  const updateCooldownStatus = (targetName: string, targetBadge?: string) => {
    const cd1 = getOfficerCooldownRemainingSeconds(targetName);
    const cd2 = targetBadge ? getOfficerCooldownRemainingSeconds(targetBadge) : 0;
    const maxCd = Math.max(cd1, cd2);
    setCooldownSeconds(maxCd);
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

  // Initialize values ONLY when modal opens (not on every background roster update!)
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
      
      const initId = initialIdentifier.trim();
      let detectedName = initId;
      let detectedBadge = '';
      let detectedDiscord = '';

      if (initId) {
        const clean = initId.toLowerCase();
        const cleanBadge = clean.startsWith('#') ? clean : `#${clean}`;
        const found = roster.find(r => 
          r.name.toLowerCase() === clean || 
          r.badge.toLowerCase() === clean || 
          r.badge.toLowerCase() === cleanBadge
        );
        if (found) {
          detectedName = found.name;
          detectedBadge = found.badge;
          detectedDiscord = found.discordTag || '';
        }
      }

      setOfficerName(detectedName);
      setOfficerBadge(detectedBadge);
      setDiscordTag(detectedDiscord);

      // Check for an ongoing active session from sessionStorage
      let restoredSession = false;
      try {
        const raw = sessionStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
        if (raw) {
          const sess: ActiveVerificationSession = JSON.parse(raw);
          const remaining = Math.ceil((sess.expiresAt - Date.now()) / 1000);
          if (remaining > 0 && (!detectedName || sess.officerName.toLowerCase() === detectedName.toLowerCase())) {
            setOfficerName(sess.officerName);
            setOfficerBadge(sess.badge);
            setDiscordTag(sess.discordTag);
            setGeneratedCode(sess.code);
            setCodeTimeLeftSeconds(remaining);
            setDiscordStep('ENTER_CODE');
            restoredSession = true;
          } else {
            sessionStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
          }
        }
      } catch {}

      if (!restoredSession) {
        setDiscordStep('INPUT_OFFICER');
        setGeneratedCode('');
        setCodeDigits(['', '', '', '', '']);
        updateCooldownStatus(detectedName, detectedBadge);
      }
    }

    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialIdentifier, roster]);

  // Whenever officerName changes, update cooldown and badge/discord auto-detection
  useEffect(() => {
    if (matchedOfficer) {
      setOfficerBadge(matchedOfficer.badge);
      if (matchedOfficer.discordTag) {
        setDiscordTag(matchedOfficer.discordTag);
      }
      updateCooldownStatus(matchedOfficer.name, matchedOfficer.badge);
    } else if (officerName.trim()) {
      updateCooldownStatus(officerName.trim());
    }
  }, [officerName, matchedOfficer]);

  // =========================================================================
  // 10-MINUTE VERIFICATION COUNTDOWN & 30-MINUTE COOLDOWN ENFORCER
  // =========================================================================
  useEffect(() => {
    if (discordStep !== 'ENTER_CODE') return;

    const interval = setInterval(() => {
      setCodeTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // 10 minutes reached without code -> ENFORCE 30-MINUTE COOLDOWN
          const targetKey = officerName.trim() || officerBadge.trim();
          if (targetKey) {
            setOfficerCooldown(targetKey, 30 * 60);
            if (matchedOfficer?.badge) setOfficerCooldown(matchedOfficer.badge, 30 * 60);
            if (matchedOfficer?.name) setOfficerCooldown(matchedOfficer.name, 30 * 60);
            setCooldownSeconds(30 * 60);
          }
          try {
            sessionStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
          } catch {}
          setDiscordStep('INPUT_OFFICER');
          setCodeError('⏳ BATAS WAKTU 10 MENIT HABIS: Kode verifikasi telah kedaluwarsa. Sistem keamanan memberlakukan jeda (delay cooldown) selama 30 menit sebelum Anda dapat meminta kode baru.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [discordStep, officerName, officerBadge, matchedOfficer]);

  // Countdown for Ticket mode (10 minutes)
  useEffect(() => {
    if (!pendingTicket) return;

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - pendingTicket.createdAt;
      const remainingSec = Math.max(0, Math.ceil((PIN_RESET_AUTO_ACCEPT_TIMEOUT_MS - elapsedMs) / 1000));
      setTicketTimeLeftSeconds(remainingSec);

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
        return;
      }

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

  // Handle selecting an officer from suggestions list
  const handleSelectOfficer = (officer: OfficerAccount) => {
    setOfficerName(officer.name);
    setOfficerBadge(officer.badge);
    setDiscordTag(officer.discordTag || '');
    setShowSuggestions(false);
    updateCooldownStatus(officer.name, officer.badge);
  };

  // =========================================================================
  // STEP 1 -> STEP 2: GENERATE CODE, JUMP TO ENTER_CODE INSTANTLY, DISPATCH BOT DM
  // =========================================================================
  const handleSendDiscordVerificationCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCodeError(null);
    setDmStatusNotice(null);

    const trimmedName = officerName.trim();
    if (!trimmedName) {
      setCodeError('Nama Petugas In-Game wajib diisi!');
      return;
    }

    // Check 30-minute cooldown
    const activeCd = Math.max(
      getOfficerCooldownRemainingSeconds(trimmedName),
      matchedOfficer ? getOfficerCooldownRemainingSeconds(matchedOfficer.badge) : 0
    );
    if (activeCd > 0) {
      setCooldownSeconds(activeCd);
      setCodeError(`⏳ PERMOHONAN DITOLAK: Anda sedang dalam masa jeda keamanan 30 menit. Silakan tunggu ${formatCountdown(activeCd)} lagi sebelum meminta kode baru.`);
      return;
    }

    // Auto-detect officer account from Roster
    const targetOfficer = matchedOfficer || roster.find(r => 
      r.name.toLowerCase() === trimmedName.toLowerCase() ||
      r.badge.toLowerCase() === trimmedName.toLowerCase() ||
      r.badge.toLowerCase() === (trimmedName.startsWith('#') ? trimmedName.toLowerCase() : `#${trimmedName.toLowerCase()}`)
    );

    if (!targetOfficer) {
      setCodeError(`Petugas "${trimmedName}" tidak ditemukan di database Roster Anggota! Pilih nama yang sesuai dari rekomendasi.`);
      return;
    }

    const resolvedDiscord = (targetOfficer.discordTag || discordTag || '').replace(/^@+/, '').trim();
    if (!resolvedDiscord) {
      setCodeError(`Akun Discord untuk ${targetOfficer.name} (${targetOfficer.badge}) belum terdaftar di Roster Anggota! Harap lengkapi username Discord pada data Roster terlebih dahulu.`);
      return;
    }

    const currentTargetBadge = targetOfficer.badge || '-';

    // 1. Generate 5-digit numeric verification code (10000 - 99999)
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    setGeneratedCode(code);
    setCodeDigits(['', '', '', '', '']);
    setCodeTimeLeftSeconds(600); // 10 minutes

    // 2. Persist active session to sessionStorage so re-renders or refreshes never wipe the code!
    const sessionObj: ActiveVerificationSession = {
      officerName: targetOfficer.name,
      badge: currentTargetBadge,
      discordTag: resolvedDiscord,
      code,
      sentAt: Date.now(),
      expiresAt: Date.now() + 600 * 1000
    };
    try {
      sessionStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(sessionObj));
    } catch {}

    // 3. IMMEDIATELY transition to ENTER_CODE step (no waiting on network delay!)
    setDiscordStep('ENTER_CODE');
    setTimeout(() => {
      digitInputRefs.current[0]?.focus();
    }, 100);

    // 4. Dispatch DM via Bot asynchronously in background
    setIsSendingCode(true);
    sendOfficerDirectMessageViaBot({
      officerName: targetOfficer.name,
      badge: currentTargetBadge,
      discordUsername: resolvedDiscord,
      messageType: 'verification',
      verificationCode: code,
      pin: code,
      title: '🔐 KODE VERIFIKASI RESET PIN LOGIN MDT',
      customMessage: `Halo **${targetOfficer.name}** (\`${currentTargetBadge}\`)!\n\nBerikut adalah 5 digit kode verifikasi untuk reset PIN login MDT HSPD Anda:\n\n# 🔢 **\`${code}\`**\n\nMasukkan kode 5 digit di atas pada website MDT. Kode berlaku selama 10 menit (delay cooldown 30 menit jika tidak dimasukkan).`
    }).then((dmResult) => {
      if (dmResult.success) {
        setDmStatusNotice(`✅ Bot berhasil mengirimkan 5 digit kode verifikasi ke DM Discord @${resolvedDiscord}!`);
      } else {
        setDmStatusNotice(`⚠️ Notifikasi Server: ${dmResult.message}. Anda tetap dapat menggunakan kode bantuan.`);
      }
    }).catch((err: any) => {
      setDmStatusNotice(`Peringatan: Bot Discord mungkin offline atau DM tertutup. Kode bantuan tetap dapat digunakan.`);
    }).finally(() => {
      setIsSendingCode(false);
    });

    // 5. Log developer activity
    logDeveloperSystemActivity({
      module: 'PIN_OVERRIDE',
      action: 'PIN_AUDIT',
      title: `Pengiriman Kode Verifikasi Lupa PIN: ${targetOfficer.name} (${currentTargetBadge})`,
      description: `Kode 5 digit dikirimkan ke DM Discord: @${resolvedDiscord}`,
      entity: 'HSPD',
      actor: targetOfficer.name,
      actorBadge: currentTargetBadge,
      severity: 'INFO'
    });
  };

  // =========================================================================
  // STEP 2: DIGIT BOXES CHANGE & VERIFY CODE
  // =========================================================================
  const handleDigitChange = (index: number, val: string) => {
    setCodeError(null);
    const cleaned = val.replace(/[^0-9]/g, '');

    // Handle paste of 5 digits directly
    if (cleaned.length >= 5) {
      const five = cleaned.slice(0, 5).split('');
      setCodeDigits(five);
      verifyEnteredCode(five.join(''));
      return;
    }

    const nextDigits = [...codeDigits];
    nextDigits[index] = cleaned.slice(-1);
    setCodeDigits(nextDigits);

    // Auto-advance focus to next digit
    if (cleaned && index < 4) {
      digitInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 5 digits are entered
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

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    if (pasted.length >= 5) {
      const five = pasted.slice(0, 5).split('');
      setCodeDigits(five);
      verifyEnteredCode(five.join(''));
    } else if (pasted.length > 0) {
      const nextDigits = [...codeDigits];
      for (let i = 0; i < pasted.length && i < 5; i++) {
        nextDigits[i] = pasted[i];
      }
      setCodeDigits(nextDigits);
    }
  };

  const verifyEnteredCode = (entered: string) => {
    const cleanEntered = entered.trim().replace(/[^0-9]/g, '');
    let expectedCode = generatedCode.trim().replace(/[^0-9]/g, '');

    // Fallback: Recover from sessionStorage if state was lost
    if (!expectedCode) {
      try {
        const raw = sessionStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
        if (raw) {
          const sess: ActiveVerificationSession = JSON.parse(raw);
          if (sess.code) {
            expectedCode = sess.code.trim().replace(/[^0-9]/g, '');
            setGeneratedCode(sess.code);
          }
        }
      } catch {}
    }

    if (codeTimeLeftSeconds <= 0) {
      setCodeError('Kode verifikasi 5 angka telah kedaluwarsa. Silakan periksa masa cooldown.');
      return;
    }

    if (cleanEntered.length === 5 && cleanEntered === expectedCode) {
      playPoliceChime();
      setCodeError(null);
      // Successful verification: clear session and clear any cooldown
      try {
        sessionStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      } catch {}
      clearOfficerCooldown(officerName);
      if (matchedOfficer) clearOfficerCooldown(matchedOfficer.badge);
      setCooldownSeconds(0);

      // Advance to Step 3: FORMAT PENGUBAHAN PIN YANG BARU
      setDiscordStep('NEW_PIN_FORM');
    } else {
      setCodeError('❌ Kode verifikasi 5 digit tidak cocok. Silakan periksa pesan DM Discord Anda.');
    }
  };

  // =========================================================================
  // STEP 3 -> STEP 4: SAVE NEW PIN & SYNC TO DATABASE & FIRESTORE
  // =========================================================================
  const handleSaveAndApplyNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinFormError(null);

    const trimmedNewPin = newPin.trim();
    const trimmedConfirmPin = confirmPin.trim();

    if (!trimmedNewPin) {
      setPinFormError('PIN Baru tidak boleh kosong!');
      return;
    }

    if (trimmedNewPin.length < 3) {
      setPinFormError('PIN Baru minimal 3 karakter/digit demi keamanan.');
      return;
    }

    if (trimmedNewPin !== trimmedConfirmPin) {
      setPinFormError('Konfirmasi PIN Baru tidak cocok! Periksa kembali.');
      return;
    }

    setIsSavingPin(true);

    try {
      const targetBadge = officerBadge.trim() || (matchedOfficer ? matchedOfficer.badge : '-');
      const targetName = officerName.trim();

      // 1. Centrally update PIN in Central Registry & LocalStorage
      setOfficerCustomPin(targetBadge, targetName, trimmedNewPin);
      const updateResult = updateOfficerPinInRoster(targetBadge, trimmedNewPin, targetName);

      // 2. Push directly to Firestore Cloud Database
      const updatedAccount = updateResult.updatedRoster.find(o => 
        o.name.toLowerCase() === targetName.toLowerCase() ||
        o.badge.toLowerCase() === targetBadge.toLowerCase()
      );

      if (updatedAccount) {
        if (discordTag.trim() && updatedAccount.discordTag !== discordTag.trim()) {
          updatedAccount.discordTag = discordTag.trim();
        }
        await pushToFirestore('ROSTER', updatedAccount, updatedAccount.id).catch(() => {});
      }

      // 3. Trigger parent callbacks for active React states
      if (onUpdateOfficerPin) {
        onUpdateOfficerPin(targetBadge, trimmedNewPin);
      }
      if (onPinAutoApplied) {
        onPinAutoApplied(trimmedNewPin, targetName);
      }

      // 4. Log to System Activity Audit
      logDeveloperSystemActivity({
        module: 'PIN_OVERRIDE',
        action: 'PIN_AUDIT',
        title: `PIN Berhasil Diperbarui via Discord Bot: ${targetName} (${targetBadge})`,
        description: `PIN login baru (${trimmedNewPin}) telah aktif dan disinkronkan ke Cloud Firestore database.`,
        entity: 'HSPD',
        actor: targetName,
        actorBadge: targetBadge,
        severity: 'INFO'
      });

      // 5. Send confirmation DM to user's Discord
      const resolvedDiscord = (discordTag.trim() || (matchedOfficer?.discordTag || '')).replace(/^@+/, '');
      if (resolvedDiscord) {
        sendOfficerDirectMessageViaBot({
          officerName: targetName,
          badge: targetBadge,
          discordUsername: resolvedDiscord,
          pin: trimmedNewPin,
          messageType: 'credentials',
          title: '✅ PIN LOGIN MDT HSPD BERHASIL DIPERBARUI',
          customNote: 'PIN login Anda telah berhasil diperbarui melalui verifikasi 5 digit kode Discord dan langsung aktif di seluruh terminal MDT.'
        }).catch(() => {});
      }

      playPoliceChime();
      setAppliedPinValue(trimmedNewPin);
      setDiscordStep('SUCCESS');
    } catch (err: any) {
      setPinFormError(`Gagal menyimpan PIN baru: ${err?.message || err}`);
    } finally {
      setIsSavingPin(false);
    }
  };

  // =========================================================================
  // STEP 4: APPLY TO LOGIN FORM & CLOSE
  // =========================================================================
  const handleDirectLogin = () => {
    if (appliedPinValue && onPinAutoApplied) {
      onPinAutoApplied(appliedPinValue, officerName || officerBadge);
    }
    onClose();
  };

  const handleCopyAppliedPin = () => {
    if (appliedPinValue) {
      navigator.clipboard.writeText(appliedPinValue);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2500);
    }
  };

  // =========================================================================
  // FALLBACK TICKET MODE HANDLERS (Secondary Tab)
  // =========================================================================
  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketErrorMessage('');
    setAutoGrantedData(null);
    setPendingTicket(null);

    const trimmedName = officerName.trim();
    const trimmedBadge = officerBadge.trim() || (matchedOfficer ? matchedOfficer.badge : '-');

    if (!trimmedName) {
      setTicketErrorMessage('Nama Petugas In-Game wajib diisi!');
      return;
    }

    setIsSubmittingTicket(true);
    try {
      const result = await executePinResetSubmission({
        officerName: trimmedName,
        officerBadge: trimmedBadge,
        officerRank: matchedOfficer?.rank,
        discordTag: discordTag.trim() || undefined,
        reason: reason.trim() || 'Lupa PIN login MDT CAD',
        requestedPin: requestedPin.trim() || undefined,
        roster,
        onUpdateOfficerPin
      });

      if (result.success) {
        if (result.isAutoGranted) {
          setAutoGrantedData({
            pin: result.pin,
            officerName: trimmedName,
            badge: trimmedBadge,
            approvedByText: 'SISTEM OTOMATIS (HIGH COMMAND OFFLINE)',
            isBotAutoApproved: true
          });
        } else {
          setPendingTicket({
            id: result.request.id,
            createdAt: result.request.createdAt,
            officerName: trimmedName,
            badge: trimmedBadge,
            targetPin: result.pin
          });
          setTicketTimeLeftSeconds(600);
        }
      } else {
        setTicketErrorMessage(result.message || 'Gagal memproses permohonan tiket.');
      }
    } catch (err: any) {
      setTicketErrorMessage(`Terjadi kesalahan sistem: ${err.message || 'Cek koneksi'}`);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleApplyTicketPinAndLogin = () => {
    if (autoGrantedData) {
      const targetPin = autoGrantedData.pin.trim();
      const targetBadge = autoGrantedData.badge || autoGrantedData.officerName;
      const targetName = autoGrantedData.officerName || autoGrantedData.badge;

      setOfficerCustomPin(targetBadge, targetName, targetPin);
      updateOfficerPinInRoster(targetBadge, targetPin, targetName);

      if (onUpdateOfficerPin) onUpdateOfficerPin(targetBadge, targetPin);
      if (onPinAutoApplied) onPinAutoApplied(targetPin, targetName);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150 font-mono text-xs">
      <div className="bg-[#12171F] border border-blue-600/50 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#0A0E14] border-b border-gray-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
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
                <span>PEMULIHAN / GANTI PIN LOGIN</span>
              </h3>
              <p className="text-[10px] text-gray-400 font-mono">
                Verifikasi Bot Discord 5-Digit & Sinkronisasi Database Realtime
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

        {/* Tab Navigation: Discord Bot 5-Digit (Primary) vs Ticket Permohonan (Secondary) */}
        <div className="bg-[#080C10] px-4 pt-2 border-b border-gray-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMode('DISCORD_CODE')}
            className={`pb-2.5 px-3 font-mono text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeMode === 'DISCORD_CODE'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>KODE VERIFIKASI DISCORD (5 DIGIT)</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-950 text-blue-300 border border-blue-700/60">
              UTAMA
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('SUPERIOR_TICKET')}
            className={`pb-2.5 px-3 font-mono text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeMode === 'SUPERIOR_TICKET'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Tiket Atasan / Manual</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">

          {/* ========================================================================= */}
          {/* MODE 1: DISCORD 5-DIGIT VERIFICATION FLOW (REQUESTED BY USER)             */}
          {/* ========================================================================= */}
          {activeMode === 'DISCORD_CODE' && (
            <div className="space-y-4">
              {/* Progress Steps Header */}
              <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[10px]">
                <div className={`py-1.5 px-1 rounded border ${
                  discordStep === 'INPUT_OFFICER'
                    ? 'bg-blue-950/80 border-blue-500 text-blue-300 font-bold'
                    : 'bg-[#0D1219] border-gray-800 text-gray-400'
                }`}>
                  1. Nama Petugas
                </div>
                <div className={`py-1.5 px-1 rounded border ${
                  discordStep === 'ENTER_CODE'
                    ? 'bg-blue-950/80 border-blue-500 text-blue-300 font-bold'
                    : 'bg-[#0D1219] border-gray-800 text-gray-400'
                }`}>
                  2. Kode DM (5 Digit)
                </div>
                <div className={`py-1.5 px-1 rounded border ${
                  discordStep === 'NEW_PIN_FORM'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-[#0D1219] border-gray-800 text-gray-400'
                }`}>
                  3. PIN Baru
                </div>
                <div className={`py-1.5 px-1 rounded border ${
                  discordStep === 'SUCCESS'
                    ? 'bg-green-950/80 border-green-500 text-green-300 font-bold'
                    : 'bg-[#0D1219] border-gray-800 text-gray-400'
                }`}>
                  4. Siap Login
                </div>
              </div>

              {/* Status Message / Error Banner */}
              {dmStatusNotice && (
                <div className="p-3 bg-blue-950/40 border border-blue-500/60 rounded-xl text-blue-200 text-xs flex items-center justify-between gap-2 shadow">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>{dmStatusNotice}</span>
                  </span>
                  <button onClick={() => setDmStatusNotice(null)} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
                </div>
              )}

              {codeError && (
                <div className="p-3 bg-rose-950/60 border border-rose-700 rounded-xl text-rose-200 text-xs flex items-center gap-2 shadow">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="leading-relaxed">{codeError}</span>
                </div>
              )}

              {/* STEP 1: INPUT NAMA PETUGAS */}
              {discordStep === 'INPUT_OFFICER' && (
                <form onSubmit={handleSendDiscordVerificationCode} className="space-y-4">
                  <div className="p-3.5 bg-gradient-to-r from-blue-950/30 to-indigo-950/30 border border-blue-700/50 rounded-xl space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-blue-300 text-xs">
                      <Bot className="w-4 h-4 text-blue-400" />
                      <span>Verifikasi Otomatis Bot Discord</span>
                    </div>
                    <p className="text-gray-300 text-[11px] font-sans leading-relaxed">
                      Cukup masukkan nama petugas Anda di bawah ini. Bot Discord akan langsung mengirimkan <strong>5 digit kode verifikasi</strong> ke DM Discord yang sudah terdaftar di Roster Anggota.
                    </p>
                  </div>

                  {/* 30-Minute Cooldown Active Card */}
                  {cooldownSeconds > 0 && (
                    <div className="p-3.5 bg-red-950/80 border-2 border-red-500 rounded-xl space-y-1.5 text-red-200 shadow-lg animate-pulse">
                      <div className="font-bold flex items-center gap-2 text-red-400 text-xs">
                        <Clock className="w-4 h-4 text-red-400 animate-spin" />
                        <span>MASA JEDA KEAMANAN (DELAY COOLDOWN 30 MENIT) SEDANG AKTIF</span>
                      </div>
                      <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                        Kode verifikasi sebelumnya tidak dimasukkan dalam batas waktu 10 menit. Demi menjaga keamanan operasional, permohonan kode baru dibatasi selama 30 menit.
                      </p>
                      <div className="pt-1 flex items-center justify-between text-xs font-mono">
                        <span className="text-gray-400">Sisa Waktu Jeda:</span>
                        <span className="px-2.5 py-0.5 rounded bg-black border border-red-500 text-red-300 font-bold text-sm">
                          {formatCountdown(cooldownSeconds)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Input Nama Petugas dengan Autocomplete */}
                  <div className="space-y-1 relative" ref={suggestionsRef}>
                    <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        Nama Petugas In-Game <span className="text-rose-400">*</span>
                      </span>
                      {matchedOfficer && (
                        <span className="text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Roster Terverifikasi
                        </span>
                      )}
                    </label>

                    <input
                      type="text"
                      required
                      value={officerName}
                      onChange={(e) => {
                        setOfficerName(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Ketik nama petugas (Contoh: Jane Doe atau #102)"
                      className="w-full px-3 py-2.5 bg-[#0A0E14] border border-gray-700 focus:border-blue-500 rounded-xl text-xs text-gray-100 placeholder:text-gray-600 outline-none font-mono transition"
                    />

                    {/* Autocomplete Suggestions Dropdown */}
                    {showSuggestions && matchingOfficers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#0F141C] border border-blue-500/60 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto">
                        <div className="p-1.5 text-[9px] text-gray-400 uppercase tracking-wider font-bold border-b border-gray-800 bg-[#080B0F]">
                          Pilih Petugas dari Roster:
                        </div>
                        {matchingOfficers.map((officer) => (
                          <div
                            key={officer.id || officer.badge}
                            onClick={() => handleSelectOfficer(officer)}
                            className="p-2 hover:bg-blue-950/60 cursor-pointer border-b border-gray-800/60 last:border-0 flex items-center justify-between transition"
                          >
                            <div>
                              <div className="font-bold text-gray-100 text-xs">{officer.name}</div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                {officer.badge} • {officer.rank}
                              </div>
                            </div>
                            {officer.discordTag && (
                              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-700/60">
                                @{officer.discordTag.replace(/^@+/, '')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Auto-detected Roster Info Card (No manual input needed) */}
                  {matchedOfficer ? (
                    <div className="p-3 bg-[#0B1017] border border-blue-500/50 rounded-xl space-y-2 font-mono text-xs shadow-inner">
                      <div className="flex items-center justify-between text-gray-400 text-[10px] pb-1.5 border-b border-gray-800">
                        <span className="font-bold text-blue-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          DATA ANGGOTA DITEMUKAN DI ROSTER
                        </span>
                        <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60">
                          TERDAFTAR
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-sans">Nomor Lencana & Pangkat:</span>
                          <strong className="text-white text-xs">{matchedOfficer.badge} • {matchedOfficer.rank}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-sans">Username Discord Tujuan DM:</span>
                          {matchedOfficer.discordTag ? (
                            <strong className="text-indigo-300 text-xs flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-indigo-400" />
                              @{matchedOfficer.discordTag.replace(/^@+/, '')}
                            </strong>
                          ) : (
                            <span className="text-rose-400 text-[11px] font-sans font-bold">Belum terdaftar di Roster</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : officerName.trim() ? (
                    <div className="p-3 bg-[#0B1017] border border-gray-800 rounded-xl text-gray-400 text-xs font-sans flex items-center gap-2">
                      <Bot className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Sistem akan mencari username Discord milik <strong>"{officerName}"</strong> langsung dari database Roster Anggota.</span>
                    </div>
                  ) : null}

                  {/* Highlight Info Box */}
                  <div className="p-3 bg-[#0A0E14] border border-gray-800 rounded-xl text-[11px] text-gray-300 space-y-1 font-sans">
                    <div className="flex items-center justify-between text-gray-400 font-mono text-[10px]">
                      <span>Kanal Pengiriman:</span>
                      <span className="text-emerald-400 font-bold">DM / Private Message Bot Discord</span>
                    </div>
                    <p className="text-gray-400 text-[10px]">
                      Batas waktu memasukkan kode adalah <strong>10 menit</strong>. Jika tidak dimasukkan, sistem menerapkan <strong>delay 30 menit</strong>.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 border-t border-gray-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition text-xs font-mono cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingCode || !officerName.trim() || cooldownSeconds > 0}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/50 text-xs font-mono cursor-pointer"
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

              {/* STEP 2: MASUKKAN 5 DIGIT KODE VERIFIKASI (LANGSUNG AKTIF KETIKA KIRIM KODE DITEKAN) */}
              {discordStep === 'ENTER_CODE' && (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-b from-[#0D1420] to-[#0A0E14] border border-blue-500/60 rounded-2xl text-center space-y-2 shadow-xl">
                    <div className="inline-flex p-2.5 rounded-full bg-blue-500/10 border border-blue-500/40 text-blue-400">
                      <Bot className="w-6 h-6 animate-pulse" />
                    </div>
                    <h4 className="font-bold text-sm text-white font-sans">
                      MASUKKAN KODE VERIFIKASI 5 ANGKA
                    </h4>
                    <p className="text-xs text-gray-300 font-sans max-w-sm mx-auto">
                      Bot Discord telah mengirimkan pesan kode verifikasi 5 angka ke DM akun:
                      <br />
                      <strong className="text-indigo-300 font-mono text-sm">
                        @{discordTag ? discordTag.replace(/^@+/, '') : officerName}
                      </strong>
                    </p>

                    {/* Live 10-Minute Countdown Timer */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 border border-amber-500/60 text-[11px] font-mono text-gray-200 shadow">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>Batas Waktu: <strong className="text-amber-300 font-bold">{formatCountdown(codeTimeLeftSeconds)}</strong></span>
                      <span className="text-gray-500">•</span>
                      <span className="text-[10px] text-gray-400">Delay 30m jika habis</span>
                    </div>
                  </div>

                  {/* 5-Digit Inputs with auto-tabbing and paste */}
                  <div className="space-y-2">
                    <label className="block text-center text-xs font-bold uppercase text-gray-300 font-mono">
                      Ketik 5 Digit Angka yang Dikirim Bot:
                    </label>
                    <div className="flex items-center justify-center gap-2.5 sm:gap-3" onPaste={handleDigitPaste}>
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
                          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black font-mono rounded-xl bg-[#090D12] border-2 border-gray-700 focus:border-blue-500 focus:bg-[#0E1522] text-white outline-none shadow-inner transition select-all"
                        />
                      ))}
                    </div>
                  </div>


                  {/* Actions */}
                  <div className="pt-2 border-t border-gray-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setDiscordStep('INPUT_OFFICER')}
                      className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-mono cursor-pointer"
                    >
                      ← Ganti Akun / Nama
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => verifyEnteredCode(codeDigits.join(''))}
                        disabled={codeDigits.join('').length !== 5}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs font-mono transition shadow-lg cursor-pointer"
                      >
                        VERIFIKASI KODE
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: FORMAT PENGUBAHAN PIN YANG BARU */}
              {discordStep === 'NEW_PIN_FORM' && (
                <form onSubmit={handleSaveAndApplyNewPin} className="space-y-4">
                  <div className="p-3.5 bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/60 rounded-xl space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-300 text-xs">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Verifikasi Identitas Berhasil!</span>
                    </div>
                    <p className="text-gray-300 text-[11px] font-sans">
                      Identitas Discord petugas <strong>{officerName}</strong> ({officerBadge}) telah terkonfirmasi. Silakan tentukan format PIN login baru Anda:
                    </p>
                  </div>

                  {pinFormError && (
                    <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{pinFormError}</span>
                    </div>
                  )}

                  <div className="space-y-3 font-mono">
                    {/* PIN Baru */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-emerald-400" />
                          PIN Login Baru (4 - 6 Digit/Karakter) <span className="text-rose-400">*</span>
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
                        placeholder="Masukkan PIN baru (contoh: 84920 atau 10-4)"
                        className="w-full px-3 py-2.5 bg-[#0A0E14] border border-gray-700 focus:border-emerald-500 rounded-xl text-sm text-emerald-300 placeholder:text-gray-600 outline-none font-mono transition tracking-wider"
                      />
                    </div>

                    {/* Konfirmasi PIN Baru */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                        Konfirmasi PIN Login Baru <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type={showNewPin ? 'text' : 'password'}
                        required
                        value={confirmPin}
                        onChange={e => setConfirmPin(e.target.value)}
                        placeholder="Ketik ulang PIN baru di atas"
                        className="w-full px-3 py-2.5 bg-[#0A0E14] border border-gray-700 focus:border-emerald-500 rounded-xl text-sm text-emerald-300 placeholder:text-gray-600 outline-none font-mono transition tracking-wider"
                      />
                    </div>

                    {/* Match Validation Chip */}
                    {newPin && confirmPin && (
                      <div className="flex items-center gap-1.5 text-xs">
                        {newPin === confirmPin ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            PIN Cocok & Siap Diaktifkan
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            PIN Tidak Cocok! Periksa kembali.
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDiscordStep('ENTER_CODE')}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition text-xs font-mono cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingPin || !newPin.trim() || newPin !== confirmPin}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-black font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/60 text-xs font-mono cursor-pointer"
                    >
                      {isSavingPin ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>MENYIMPAN & SINKRON DATABASE...</span>
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

              {/* STEP 4: SUCCESS & READY TO LOGIN */}
              {discordStep === 'SUCCESS' && (
                <div className="p-4 bg-gradient-to-b from-emerald-950/80 to-[#0B121A] border-2 border-emerald-500 rounded-2xl text-emerald-200 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/50">
                      <ShieldCheck className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-emerald-300 font-sans">
                        PIN BARU BERHASIL DIAKTIFKAN!
                      </h4>
                      <p className="text-[10px] text-emerald-400/80 font-mono">
                        Tersinkronisasi otomatis ke Database Roster & Cloud Firestore.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-black/70 border border-emerald-500/60 rounded-xl space-y-2 font-mono">
                    <div className="flex items-center justify-between text-xs border-b border-emerald-900/50 pb-2">
                      <span className="text-gray-400">Petugas:</span>
                      <strong className="text-white">{officerName} ({officerBadge})</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">PIN Login Baru:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-emerald-400 px-3 py-1 rounded bg-[#0A1118] border border-emerald-500/80 tracking-wider">
                          {appliedPinValue}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyAppliedPin}
                          className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 transition cursor-pointer"
                          title="Salin PIN Baru"
                        >
                          {copiedPin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-300 font-sans leading-relaxed">
                    Kredensial login Anda telah diperbarui. Klik tombol di bawah untuk langsung menerapkan PIN ke layar login terminal.
                  </div>

                  <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-end gap-2 font-mono">
                    <button
                      type="button"
                      onClick={handleDirectLogin}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/70 cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>LANGSUNG MASUK KE TERMINAL MDT</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 2: TIKET OTORISASI ATASAN (SECONDARY FALLBACK)                       */}
          {/* ========================================================================= */}
          {activeMode === 'SUPERIOR_TICKET' && (
            <div className="space-y-4">
              {/* Superior Online Banner */}
              <div className={`px-4 py-2 text-[11px] font-sans rounded-xl border flex items-center justify-between gap-2 ${
                isSuperiorActive 
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
                  : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isSuperiorActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="font-bold">
                    {isSuperiorActive ? 'ATASAN SEDANG ONLINE' : 'ATASAN SEDANG OFFLINE'}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-gray-300 text-right">
                  {isSuperiorActive ? (
                    <span>Verifikasi Manual</span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      Auto-Grant Aktif (10 Menit)
                    </span>
                  )}
                </div>
              </div>

              {ticketErrorMessage && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{ticketErrorMessage}</span>
                </div>
              )}

              {/* Resolved / Auto-Granted State */}
              {autoGrantedData ? (
                <div className="p-4 bg-gradient-to-b from-emerald-950/80 to-[#0F171F] border-2 border-emerald-500 rounded-2xl text-emerald-200 space-y-3.5 shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    <div>
                      <div className="font-extrabold text-sm text-emerald-300 font-sans">
                        TIKET LUPA PIN DISETUJUI!
                      </div>
                      <div className="text-[10px] text-emerald-400/80 font-mono">
                        Disetujui oleh: {autoGrantedData.approvedByText}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-black/60 border border-emerald-500/60 rounded-xl space-y-2 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-300">PIN Login Baru:</span>
                      <strong className="text-lg text-emerald-400 font-mono px-3 py-1 bg-[#0A1016] border border-emerald-500/60 rounded">
                        {autoGrantedData.pin}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyTicketPinAndLogin}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>TERAPKAN PIN & LANGSUNG LOGIN</span>
                  </button>
                </div>
              ) : pendingTicket ? (
                /* Pending Countdown State */
                <div className="p-4 bg-[#0A0E14] border border-amber-500/60 rounded-2xl space-y-3 text-center">
                  <Clock className="w-7 h-7 text-amber-400 mx-auto animate-pulse" />
                  <h4 className="font-bold text-sm text-amber-300 font-sans">
                    MENUNGGU PERSETUJUAN ATASAN
                  </h4>
                  <p className="text-xs text-gray-300 font-sans">
                    Tiket sedang diproses. Jika dalam 10 menit tidak direspons, Bot akan otomatis menyetujui.
                  </p>
                  <div className="text-xl font-mono font-bold text-amber-400">
                    {formatCountdown(ticketTimeLeftSeconds)}
                  </div>
                </div>
              ) : (
                /* Ticket Submission Form */
                <form onSubmit={handleTicketSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      Nama Petugas
                    </label>
                    <input
                      type="text"
                      required
                      value={officerName}
                      onChange={e => setOfficerName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3 py-2 bg-[#0A0E14] border border-gray-700 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                      Alasan Pengajuan
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0A0E14] border border-gray-700 rounded-lg text-xs text-white"
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-800 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingTicket}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingTicket ? 'MENGIRIM...' : 'KIRIM TIKET'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#0A0E14] border-t border-gray-800 px-4 py-2 flex items-center justify-between text-[10px] text-gray-500 font-mono">
          <span>Discord Bot Gateway • MDT HSPD</span>
          <span>Security Protocol v4.2 • 10m Timeout / 30m Cooldown</span>
        </div>
      </div>
    </div>
  );
};
