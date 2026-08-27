import React, { useState, useEffect } from 'react';
import { 
  OfficerProfile, OfficerAccount, isOfficerHighRank 
} from '../types';
import { 
  Shield, Lock, User, KeyRound, CheckCircle2, 
  AlertTriangle, ArrowRight, Eye, EyeOff, HelpCircle, 
  LogIn, BookOpen, MessageSquare, ShieldAlert,
  Sparkles
} from 'lucide-react';
import { HSPD_LOGO_URL } from '../assets/logo';
import { RecruitmentInfoPanel } from './RecruitmentInfoPanel';
import { RequestPinDiscordModal } from './RequestPinDiscordModal';
import { CaptchaVerification } from './CaptchaVerification';
import { getCustomBranding, subscribeToBranding, DepartmentBrandingConfig } from '../utils/brandingStorage';

interface Props {
  onLogin: (officer: OfficerProfile) => void;
  roster: OfficerAccount[];
  onRegisterOfficer?: (account: OfficerAccount) => void;
  onUpdateOfficerPin?: (badgeOrName: string, newPin: string) => boolean;
}

export const OfficerLogin: React.FC<Props> = ({ 
  onLogin, 
  roster,
  onUpdateOfficerPin
}) => {
  // Dynamic Branding State
  const [branding, setBranding] = useState<DepartmentBrandingConfig>(getCustomBranding());

  useEffect(() => {
    return subscribeToBranding(cfg => setBranding(cfg));
  }, []);

  // Mobile / layout navigation: 'auth' (right side) or 'recruitment' (left side on mobile)
  const [mobileView, setMobileView] = useState<'auth' | 'recruitment'>('auth');
  
  // LOGIN FORM STATE
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  // DISCORD PIN REQUEST MODAL STATE
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false);

  // 1. DIRECT CREDENTIALS LOGIN SUBMIT
  const handleDirectLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');

    const trimmedIdentifier = loginIdentifier.trim().toLowerCase();
    const cleanBadge = trimmedIdentifier.startsWith('#') ? trimmedIdentifier : `#${trimmedIdentifier}`;
    const trimmedPin = loginPin.trim();

    if (!trimmedIdentifier) {
      setLoginError('Silakan masukkan Nama Petugas atau Nomor Badge!');
      return;
    }

    if (!trimmedPin) {
      setLoginError('Silakan masukkan PIN pribadi akun Anda!');
      return;
    }

    if (!isCaptchaVerified) {
      setLoginError('⚠️ Harap selesaikan verifikasi "Saya bukan robot" di bawah sebelum masuk terminal!');
      return;
    }

    // Find officer in roster by exact or partial name, or badge
    const matched = roster.find(acc => 
      acc.name.toLowerCase() === trimmedIdentifier ||
      acc.badge.toLowerCase() === trimmedIdentifier ||
      acc.badge.toLowerCase() === cleanBadge ||
      acc.name.toLowerCase().includes(trimmedIdentifier)
    );

    if (!matched) {
      setLoginError(`Petugas "${loginIdentifier}" tidak terdaftar di database anggota kepolisian! Silakan hubungi Atasan di Discord jika Anda anggota baru.`);
      return;
    }

    // Verify PIN: check individual pin, or fallback for legacy accounts
    const accountPin = matched.pin ? matched.pin.trim() : '10-4';
    if (trimmedPin !== accountPin) {
      setLoginError(`PIN Keamanan salah untuk petugas ${matched.name} (${matched.badge})! Lupa PIN? Klik tombol pengajuan reset ke Discord di bawah.`);
      return;
    }

    setLoginSuccess(`✅ Otorisasi Berhasil! Selamat bertugas, ${matched.rank} ${matched.name}.`);

    setTimeout(() => {
      const profile: OfficerProfile = {
        name: matched.name,
        badge: matched.badge,
        rank: matched.rank,
        division: matched.division,
        loginTime: Date.now(),
      };
      onLogin(profile);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#090B10] text-gray-200 flex flex-col justify-center items-center p-3 sm:p-4 lg:p-6 selection:bg-blue-600 selection:text-white relative">
      {/* Dynamic Background Wallpaper with Custom Opacity and Blur */}
      {branding.backgroundWallpaper && (
        <div
          id="login-dynamic-wallpaper"
          className="fixed inset-0 pointer-events-none z-0 transition-all duration-300"
          style={{
            backgroundImage: `url(${branding.backgroundWallpaper})`,
            backgroundSize: branding.backgroundStyle === 'tile' ? 'auto' : (branding.backgroundStyle || 'cover'),
            backgroundRepeat: branding.backgroundStyle === 'tile' ? 'repeat' : 'no-repeat',
            backgroundPosition: 'center',
            opacity: branding.backgroundOpacity ?? 0.25,
            filter: branding.backgroundBlur ? `blur(${branding.backgroundBlur}px)` : 'none'
          }}
        />
      )}

      {/* Background Graphic Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none z-0"></div>

      <div className="w-full max-w-7xl relative z-10 space-y-4">
        {/* Top Navbar Header Bar */}
        <div className="bg-[#161B22]/95 backdrop-blur-md border border-gray-800 rounded-xl px-4 sm:px-6 py-3 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-amber-500/10 rounded-full blur-sm"></div>
              <img
                src={branding.logoUrl || HSPD_LOGO_URL}
                alt={`${branding.departmentName} Official Crest`}
                referrerPolicy="no-referrer"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-contain relative z-10 drop-shadow-md border border-amber-500/40 bg-black/60 p-0.5"
                onError={e => {
                  (e.target as HTMLImageElement).src = HSPD_LOGO_URL;
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-gray-100 tracking-tight flex items-center gap-1.5 font-sans">
                  <span>{branding.departmentName}</span>
                </h1>
                <span className="text-[10px] font-mono bg-amber-950/80 text-amber-300 border border-amber-700/60 px-1.5 py-0.5 rounded font-bold">
                  {branding.cadBadgeText}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono hidden sm:flex items-center gap-1.5">
                <span>{branding.agencyJurisdiction}</span>
                <span className="text-gray-600">•</span>
                <span className="text-emerald-400/90 font-medium">FREQ: {branding.radioFreq}</span>
              </p>
            </div>
          </div>

          {/* Right Status Badge */}
          <div className="flex items-center gap-2.5 font-mono text-xs">
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-[10px] text-green-400 flex items-center gap-1 font-bold">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                SYSTEM ONLINE 10-8
              </span>
              <span className="text-[9px] text-gray-500">{roster.length} Personel Terdaftar</span>
            </div>

            {/* Mobile View Switcher */}
            <div className="flex lg:hidden bg-gray-900 border border-gray-800 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMobileView('recruitment')}
                className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1 ${
                  mobileView === 'recruitment'
                    ? 'bg-amber-600 text-black shadow'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Info Rekrutmen</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileView('auth')}
                className={`px-2.5 py-1 rounded font-bold transition flex items-center gap-1 ${
                  mobileView === 'auth'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <LogIn className="w-3 h-3" />
                <span>Akses Login</span>
              </button>
            </div>
          </div>
        </div>

        {/* MAIN SPLIT GRID: LEFT = RECRUITMENT INFO, RIGHT = AUTH TERMINAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
          {/* ================= LEFT SIDE: RECRUITMENT INFO PANEL (~7 cols on desktop) ================= */}
          <div className={`lg:col-span-7 h-full ${mobileView === 'recruitment' ? 'block' : 'hidden lg:block'}`}>
            <RecruitmentInfoPanel />
          </div>

          {/* ================= RIGHT SIDE: AUTHENTICATION & LOGIN PORTAL (~5 cols on desktop) ================= */}
          <div className={`lg:col-span-5 ${mobileView === 'auth' ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-[#161B22] border border-gray-800 rounded-xl shadow-2xl overflow-hidden font-mono text-xs flex flex-col">
              {/* Terminal Title Bar */}
              <div className="border-b border-gray-800 bg-[#0D1117] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-blue-400" />
                  <h2 className="text-xs font-bold uppercase text-gray-100 font-mono tracking-tight">
                    MASUK TERMINAL DINAS KEPOLISIAN
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60 font-bold">
                  CAD v3.8
                </span>
              </div>

              {/* TAB CONTENT CONTAINER */}
              <div className="p-4 sm:p-5 space-y-4">
                {loginError && (
                  <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-lg text-rose-300 text-xs font-mono flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>{loginError}</div>
                  </div>
                )}

                {loginSuccess && (
                  <div className="p-3 bg-green-950/50 border border-green-800/80 rounded-lg text-green-300 text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <span>{loginSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleDirectLoginSubmit} className="space-y-4">
                  {/* Field 1: Nama / Badge */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      Nama Petugas / Nomor Badge <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="login-username"
                      autoFocus
                      value={loginIdentifier}
                      onChange={(e) => {
                        setLoginIdentifier(e.target.value);
                        setLoginError('');
                      }}
                      placeholder="Contoh: Leoarnd Neave atau #001"
                      className="w-full px-3 py-2.5 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none font-mono transition"
                      required
                    />
                    <span className="text-[10px] text-gray-500 block">
                      Gunakan Nama Lengkap Karakter In-Game atau Nomor Badge resmi Anda.
                    </span>
                  </div>

                  {/* Field 2: PIN Pribadi */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        PIN Pribadi Petugas <span className="text-rose-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsDiscordModalOpen(true)}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3 text-indigo-400" />
                        <span>Lupa / Ganti PIN?</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="login-pin"
                        value={loginPin}
                        onChange={(e) => {
                          setLoginPin(e.target.value);
                          setLoginError('');
                        }}
                        placeholder="Masukkan PIN pribadi akun Anda"
                        className="w-full pl-3 pr-10 py-2.5 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none font-mono transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-300 transition"
                        title={showPassword ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* CAPTCHA "Saya Bukan Robot" Verification Box */}
                  <div className="pt-1">
                    <CaptchaVerification
                      isVerified={isCaptchaVerified}
                      onVerify={(verified) => {
                        setIsCaptchaVerified(verified);
                        if (verified) setLoginError('');
                      }}
                    />
                  </div>

                  {/* Submit Login Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      id="btn-login-terminal"
                      disabled={!isCaptchaVerified}
                      className={`w-full py-2.5 font-bold text-xs rounded-lg transition shadow-lg flex items-center justify-center gap-2 font-mono ${
                        isCaptchaVerified
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 cursor-pointer'
                          : 'bg-gray-800 text-gray-400 border border-gray-700 cursor-not-allowed opacity-80'
                      }`}
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{isCaptchaVerified ? 'MASUK TERMINAL (10-8 ON DUTY)' : 'LENGKAPI CAPTCHA UNTUK MASUK'}</span>
                    </button>
                  </div>
                </form>

                {/* Information Policy */}
                <div className="pt-2 border-t border-gray-800/80 flex items-start gap-2 text-[10px] text-gray-500 leading-relaxed">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500/70 shrink-0 mt-0.5" />
                  <span>
                    <strong>Catatan Registrasi:</strong> Pendaftaran akun anggota baru dilakukan secara resmi oleh High Command / Supervisor melalui menu Manajemen Anggota.
                  </span>
                </div>
              </div>

              {/* Terminal Footer Info */}
              <div className="bg-[#0F1319] border-t border-gray-800 px-4 py-2 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span>HSPD SECURE MDT v3</span>
                <span>CENTRALIZED AUTHENTICATION</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DISCORD PIN REQUEST MODAL */}
      <RequestPinDiscordModal
        isOpen={isDiscordModalOpen}
        onClose={() => setIsDiscordModalOpen(false)}
        initialIdentifier={loginIdentifier}
        roster={roster}
        onUpdateOfficerPin={onUpdateOfficerPin}
        onPinAutoApplied={(appliedPin, identifier) => {
          setLoginPin(appliedPin);
          if (identifier && !loginIdentifier) {
            setLoginIdentifier(identifier);
          }
          setLoginSuccess(`✅ PIN baru (${appliedPin}) berhasil diterapkan secara otomatis! Silakan klik Masuk Terminal.`);
        }}
      />
    </div>
  );
};
