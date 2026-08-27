import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Lock, Unlock, KeyRound, Sparkles, Copy, Check,
  Radio, CheckCircle2, AlertTriangle, AlertCircle, Award, Landmark,
  Flame, FileText, Stamp, Search, UserCheck, ArrowRight, RefreshCw, X
} from 'lucide-react';
import { 
  ModuleAccessKey, 
  OfficerProfile, 
  OfficerAccount, 
  isSupervisorOrAbove, 
  getRankHierarchyTier 
} from '../types';
import { 
  checkDirectRankClearance, 
  hasActiveUnlockedSession, 
  validateAndConsumeOtp, 
  clearUnlockedSession, 
  formatOtpRequestRadioMessage,
  MODULE_CLEARANCE_RULES,
  ActiveOtpSession
} from '../utils/otpClearanceStorage';
import { OtpGeneratorModal } from './OtpGeneratorModal';

interface Props {
  moduleKey: ModuleAccessKey;
  currentOfficer: OfficerProfile | null;
  roster?: OfficerAccount[];
  children: React.ReactNode;
  onSessionUnlocked?: () => void;
}

export const ModuleClearanceGuard: React.FC<Props> = ({
  moduleKey,
  currentOfficer,
  roster = [],
  children,
  onSessionUnlocked
}) => {
  const rule = MODULE_CLEARANCE_RULES[moduleKey] || MODULE_CLEARANCE_RULES.VAULT;
  
  // Rank direct clearance check
  const rankCheck = checkDirectRankClearance(moduleKey, currentOfficer);
  const isSupervisor = isSupervisorOrAbove(currentOfficer?.rank);
  const officerTier = getRankHierarchyTier(currentOfficer?.rank);

  // Active OTP session state
  const [activeSession, setActiveSession] = useState<ActiveOtpSession | null>(() => 
    hasActiveUnlockedSession(moduleKey, currentOfficer?.badge)
  );

  // Input states for locked screen
  const [otpInput, setOtpInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [copiedRadioMsg, setCopiedRadioMsg] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<string>('');

  // Check active session periodically
  useEffect(() => {
    const check = () => {
      const sess = hasActiveUnlockedSession(moduleKey, currentOfficer?.badge);
      setActiveSession(sess);
      if (sess) {
        const diffMs = sess.expiresAt - Date.now();
        if (diffMs > 0) {
          const mins = Math.floor(diffMs / 60000);
          const secs = Math.floor((diffMs % 60000) / 1000);
          setSessionTimeLeft(`${mins}:${String(secs).padStart(2, '0')}`);
        } else {
          setSessionTimeLeft('Selesai');
        }
      }
    };

    check();
    const timer = setInterval(check, 1000);
    window.addEventListener('hspd-active-session-changed', check);

    return () => {
      clearInterval(timer);
      window.removeEventListener('hspd-active-session-changed', check);
    };
  }, [moduleKey, currentOfficer]);

  // Handle OTP Submission
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOfficer) return;
    setIsVerifying(true);
    setValidationResult(null);

    setTimeout(() => {
      const res = validateAndConsumeOtp(otpInput, moduleKey, currentOfficer);
      setValidationResult(res);
      setIsVerifying(false);

      if (res.valid) {
        const fresh = hasActiveUnlockedSession(moduleKey, currentOfficer.badge);
        setActiveSession(fresh);
        if (onSessionUnlocked) onSessionUnlocked();
      }
    }, 400);
  };

  const handleLockAgain = () => {
    if (currentOfficer) {
      clearUnlockedSession(moduleKey, currentOfficer.badge);
      setActiveSession(null);
      setOtpInput('');
      setValidationResult(null);
    }
  };

  const handleCopyRadioRequest = () => {
    if (!currentOfficer) return;
    const text = formatOtpRequestRadioMessage(moduleKey, currentOfficer);
    navigator.clipboard.writeText(text);
    setCopiedRadioMsg(true);
    setTimeout(() => setCopiedRadioMsg(false), 2500);
  };

  // Determine if unlocked
  const isUnlocked = rankCheck.hasClearance || !!activeSession;

  // IF UNLOCKED: Show top clearance banner + children
  if (isUnlocked) {
    return (
      <div className="space-y-3">
        {/* Security Clearance Header Strip */}
        <div className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono transition shadow-sm ${
          activeSession
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
            : rankCheck.hasClearance && isSupervisor
              ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
              : 'bg-[#141820] border-blue-500/40 text-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
              activeSession 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}>
              <Unlock className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold">
                <span>{rule.title}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-sans bg-black/40 border border-gray-700">
                  {activeSession ? 'OTORISASI OTP AKTIF' : 'CLEARANCE LANGSUNG'}
                </span>
              </div>
              <div className="text-[10px] text-gray-400 font-sans">
                {activeSession ? (
                  <span>
                    Mandat Disposisi dari: <strong className="text-emerald-300">{activeSession.authorizedByRank} {activeSession.authorizedBy}</strong> (Kode: {activeSession.otpCode} • Sisa Sesi: {sessionTimeLeft})
                  </span>
                ) : (
                  <span>
                    Akses Kewenangan Pangkat: <strong className="text-amber-300">{currentOfficer?.rank}</strong> ({officerTier.label})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isSupervisor && (
              <button
                type="button"
                onClick={() => setIsOtpModalOpen(true)}
                className="px-2.5 py-1 bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-700/60 rounded-lg text-[11px] font-bold font-sans transition flex items-center gap-1"
                title="Terbitkan Kode Akses Sekali Pakai untuk Petugas Lain"
              >
                <KeyRound className="w-3 h-3 text-amber-400" />
                <span>+ TERBITKAN OTP</span>
              </button>
            )}

            {activeSession && (
              <button
                type="button"
                onClick={handleLockAgain}
                className="px-2.5 py-1 bg-gray-800 hover:bg-rose-950/80 text-gray-300 hover:text-rose-200 border border-gray-700 hover:border-rose-700 rounded-lg text-[11px] font-sans transition flex items-center gap-1"
                title="Kunci kembali modul ini dan akhiri sesi otorisasi"
              >
                <Lock className="w-3 h-3 text-rose-400" />
                <span>Kunci Sesi</span>
              </button>
            )}
          </div>
        </div>

        {/* Render the actual guarded child component */}
        {children}

        {/* Modal for supervisor to generate OTP */}
        <OtpGeneratorModal
          isOpen={isOtpModalOpen}
          onClose={() => setIsOtpModalOpen(false)}
          currentOfficer={currentOfficer}
          roster={roster}
          defaultModule={moduleKey}
        />
      </div>
    );
  }

  // IF LOCKED: Show High-Polish Security Shield & OTP Entry Portal
  return (
    <div className="max-w-3xl mx-auto my-6 p-4 sm:p-8 bg-[#0F1318] border border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-950/40 font-sans text-gray-200 relative overflow-hidden animate-fadeIn">
      
      {/* Decorative Gold Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Shield & Restricted Notice */}
      <div className="text-center space-y-3 pb-6 border-b border-gray-800/80">
        <div className="inline-flex p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-2xl text-amber-400 shadow-inner">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>
        
        <div>
          <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60 uppercase tracking-wider mb-1.5">
            RESTRICTED ACCESS LEVEL 2+
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-100 tracking-tight">
            {rule.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto mt-1">
            {rule.description}
          </p>
        </div>
      </div>

      {/* Clearance Level Explanation & Who Can Access */}
      <div className="my-6 p-4 bg-[#141820] border border-gray-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-gray-300 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>PANGKAT YANG DAPAT MENGAKSES LANGSUNG:</span>
          </span>
          <span className="text-[10px] font-mono bg-blue-950/60 text-blue-300 px-2 py-0.5 rounded border border-blue-800/60">
            MINIMAL TIER {rule.minimumRankTier}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {rule.directAccessRanks.map((r, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-[#0A0D12] text-amber-300/90 text-xs font-mono font-bold rounded border border-amber-700/40"
            >
              ★ {r}
            </span>
          ))}
        </div>

        <div className="pt-2 border-t border-gray-800 text-xs text-gray-400 flex items-center justify-between flex-wrap gap-2">
          <div>
            Pangkat Anda Saat Ini: <strong className="text-gray-200">{currentOfficer?.rank || 'Cadet'}</strong> ({officerTier.label})
          </div>
          <div className="text-amber-400 font-medium">
            Status: Perlu Kode Akses Sekali Pakai (OTP) dari Atasan
          </div>
        </div>
      </div>

      {/* Verification Feedback Banner */}
      {validationResult && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between mb-4 animate-fadeIn ${
          validationResult.valid
            ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
            : 'bg-rose-950/80 border-rose-500/80 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {validationResult.valid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{validationResult.message}</span>
          </div>
          <button onClick={() => setValidationResult(null)} className="text-gray-400 hover:text-gray-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* OTP Input Form */}
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
            Masukkan Kode Akses Sekali Pakai (OTP dari Atasan)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.toUpperCase())}
                placeholder="Contoh: OTP-BRK-8492 atau 10-4"
                className="w-full bg-[#141820] border-2 border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm font-mono tracking-widest text-amber-300 placeholder-gray-600 focus:outline-none shadow-inner"
              />
              <KeyRound className="w-4 h-4 text-gray-500 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
            
            <button
              type="submit"
              disabled={isVerifying || !otpInput.trim()}
              className="py-3 px-6 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl transition shadow-lg shadow-amber-950/60 flex items-center justify-center gap-2 shrink-0"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>MEMVERIFIKASI...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>BUKA AKSES MODUL</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-1.5">
            *Setiap kode OTP diterbitkan resmi oleh Atasan (Lieutenant / Captain / High Command) melalui MDT.
          </p>
        </div>

        {/* Quick Helper Actions */}
        <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyRadioRequest}
            className="w-full sm:w-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-medium transition flex items-center justify-center gap-2 border border-gray-700"
            title="Salin pesan permohonan disposisi OTP untuk dikirimkan ke Radio 1111 / Discord / In-game Chat"
          >
            {copiedRadioMsg ? <Check className="w-4 h-4 text-emerald-400" /> : <Radio className="w-4 h-4 text-amber-400" />}
            <span>{copiedRadioMsg ? 'FORMAT PERMOHONAN TERSALIN!' : 'SALIN REQUEST KE RADIO ATASAN'}</span>
          </button>

          {isSupervisor && (
            <button
              type="button"
              onClick={() => setIsOtpModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 bg-amber-950/70 hover:bg-amber-900 text-amber-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-amber-700/60"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>👑 SAYA ATASAN / BUAT KODE OTP</span>
            </button>
          )}
        </div>
      </form>

      {/* Modal for supervisor to generate OTP */}
      <OtpGeneratorModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        currentOfficer={currentOfficer}
        roster={roster}
        defaultModule={moduleKey}
      />
    </div>
  );
};
