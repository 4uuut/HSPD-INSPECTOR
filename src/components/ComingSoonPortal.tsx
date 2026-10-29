import React, { useState } from 'react';
import { 
  Shield, Lock, Sparkles, Terminal, KeyRound, ArrowRight,
  ExternalLink, Copy, Check, Heart, Coffee, AlertTriangle,
  CheckCircle2, Flame, DollarSign, Globe, Car, Users,
  Activity, RefreshCw, X, Eye, EyeOff
} from 'lucide-react';
import { HSPD_LOGO_URL } from '../assets/logo';
import { 
  ComingSoonConfig, 
  getComingSoonConfig, 
  SAWERIA_DONATION_URL, 
  verifyDeveloperPasscode, 
  setDeveloperBypass 
} from '../utils/comingSoonStorage';
import { OfficerProfile } from '../types';

interface Props {
  onBypassSuccess: (developerProfile?: OfficerProfile) => void;
}

export const ComingSoonPortal: React.FC<Props> = ({ onBypassSuccess }) => {
  const [config, setConfig] = useState<ComingSoonConfig>(() => getComingSoonConfig());
  const [copiedDonation, setCopiedDonation] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [developerNameInput, setDeveloperNameInput] = useState('Lead System Developer');
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState(false);

  // Copy donation link
  const handleCopyDonationUrl = () => {
    navigator.clipboard.writeText(config.donationUrl || SAWERIA_DONATION_URL);
    setCopiedDonation(true);
    setTimeout(() => setCopiedDonation(false), 2500);
  };

  // Open Saweria donation in new tab
  const handleOpenSaweria = () => {
    window.open(config.donationUrl || SAWERIA_DONATION_URL, '_blank', 'noopener,noreferrer');
  };

  // Submit developer passcode
  const handleDeveloperAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanInput = passcodeInput.trim();
    const isSuccess = verifyDeveloperPasscode(cleanInput);

    if (!isSuccess) {
      setAuthError('Kunci akses pengembang tidak valid! Masukkan passcode pengembang resmi.');
      return;
    }

    setAuthSuccess(true);
    setTimeout(() => {
      const devProfile: OfficerProfile = {
        name: developerNameInput.trim() || 'Lead Developer (LinuxStore)',
        badge: '#DEV-01',
        rank: 'CHIEF OF POLICE [COP]',
        division: 'HEAD OF CORE DEVELOPER',
        loginTime: Date.now(),
        isDeveloper: true,
        accountType: 'POLICE'
      };
      setDeveloperBypass(true);
      setShowDeveloperModal(false);
      onBypassSuccess(devProfile);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-gray-200 font-sans relative overflow-x-hidden flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Background High-Tech Grid & Lighting Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.15),rgba(255,255,255,0))]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px]" />
        <div 
          className="absolute inset-0 opacity-[0.035]" 
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* Top Status Bar */}
      <header className="relative z-10 border-b border-gray-800/80 bg-[#0B0E15]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setShowDeveloperModal(true)}
            className="relative cursor-pointer select-none group"
            title="State of HighState Police Department"
          >
            <img 
              src={HSPD_LOGO_URL} 
              alt="HSPD Logo" 
              className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(245,158,11,0.4)] group-hover:scale-105 transition-transform" 
            />
            <div className="absolute -inset-1 rounded-full border border-amber-500/40 animate-ping pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black tracking-wider text-white font-mono">
                HIGH STATE POLICE DEPARTMENT
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-950 text-amber-300 border border-amber-600 font-bold">
                MDC-CAD
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono">
              STATE OF HIGHSTATE • TERMINAL SECURE GATEWAY
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-600/60 text-amber-300 text-[10px] font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>STATUS: DALAM TAHAP PENGEMBANGAN</span>
          </div>
        </div>
      </header>

      {/* Main Content Hero */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center text-center space-y-8">
        
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-950/80 via-black/80 to-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold shadow-xl animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>SISTEM DALAM TAHAP PENGEMBANGAN AKHIR • COMING SOON</span>
        </div>

        {/* Big Headline */}
        <div className="space-y-3 max-w-3xl">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            WEBSITE RESMI <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
              SEDANG DALAM PENGEMBANGAN
            </span>
          </h1>
          <p className="text-xs sm:text-base text-gray-300 leading-relaxed font-sans max-w-2xl mx-auto">
            {config.description}
          </p>
        </div>

        {/* ================= PRIMARY CALL TO ACTION: DONASI SAWERIA ================= */}
        <div className="w-full max-w-2xl p-5 sm:p-7 rounded-3xl bg-gradient-to-b from-[#131A26] to-[#0D121B] border-2 border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.2)] space-y-4">
          <div className="flex items-center justify-center gap-2 text-amber-300 text-xs font-mono font-bold tracking-wider uppercase">
            <Coffee className="w-4 h-4 text-amber-400" />
            <span>DUKUNGAN PENGEMBANGAN WEBSITE</span>
          </div>

          <h2 className="text-lg sm:text-2xl font-black text-white">
            Bantu Traktir Kopi & Dukung Server Developer
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto">
            Website dan sistem MDT ini terus dikembangkan secara intensif oleh <strong>LinuxStore</strong>. Setiap apresiasi dan donasi Anda sangat berarti untuk pemeliharaan server, fitur baru, dan rilis penuh.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {/* Direct Saweria Donation Button */}
            <button
              type="button"
              onClick={handleOpenSaweria}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm sm:text-base font-mono transition flex items-center justify-center gap-2.5 shadow-xl shadow-amber-950 cursor-pointer active:scale-95 group"
            >
              <Coffee className="w-5 h-5 text-black group-hover:rotate-12 transition-transform stroke-[2.5]" />
              <span>Donasi Pengembang (Saweria)</span>
              <ExternalLink className="w-4 h-4 text-black stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* ================= SNEAK PEEK / FITUR YANG AKAN HADIR ================= */}
        <div className="w-full space-y-4 pt-4">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
              PREVIEW MODUL RESMI
            </span>
            <h3 className="text-lg sm:text-2xl font-black text-white">
              Fitur Lengkap Yang Segera Dapat Digunakan
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            {config.featuresPreview.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-[#0B0F16] border border-gray-800/80 hover:border-amber-500/40 p-4 rounded-2xl space-y-2.5 transition shadow-lg relative overflow-hidden group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                    {idx === 0 && <Shield className="w-4 h-4" />}
                    {idx === 1 && <DollarSign className="w-4 h-4" />}
                    {idx === 2 && <Globe className="w-4 h-4" />}
                    {idx === 3 && <Lock className="w-4 h-4" />}
                    {idx === 4 && <Car className="w-4 h-4" />}
                    {idx === 5 && <Users className="w-4 h-4" />}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60">
                    {item.badge}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white font-mono">{item.title}</h4>
                  <p className="text-[11px] text-gray-400 font-sans mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/80 bg-[#07090E] px-4 sm:px-8 py-5 text-center text-xs font-mono text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div 
          onClick={() => setShowDeveloperModal(true)}
          className="flex items-center gap-2 cursor-pointer group hover:text-amber-400 transition-colors select-none"
          title="Klik untuk membuka Login Mode Pengembang"
        >
          <Shield className="w-4 h-4 text-amber-400 group-hover:scale-110 group-hover:text-amber-300 transition-all" />
          <span className="group-hover:underline">High State Police Department • CAD/MDT Operational Network 2026</span>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <a
            href={SAWERIA_DONATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-400 flex items-center gap-1 transition"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <span>Saweria LinuxStore</span>
          </a>
        </div>
      </footer>

      {/* ================= MODAL GERBANG MODE PENGEMBANG ================= */}
      {showDeveloperModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0D1219] border-2 border-amber-500/60 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 font-mono relative">
            <button
              type="button"
              onClick={() => {
                setShowDeveloperModal(false);
                setAuthError('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-gray-800 pb-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow">
                <Terminal className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">GERBANG MODE PENGEMBANG</h3>
                <p className="text-[10px] text-amber-400">Bypass Kunci Coming Soon Website</p>
              </div>
            </div>

            <form onSubmit={handleDeveloperAuthSubmit} className="space-y-4 text-xs">
              <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                Masukkan Passcode Otoritas Pengembang Resmi untuk membuka gerbang mode pengembang dan mengakses seluruh fitur sistem.
              </p>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Nama Identitas Pengembang:</label>
                <input
                  type="text"
                  value={developerNameInput}
                  onChange={(e) => setDeveloperNameInput(e.target.value)}
                  className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Kunci Akses / Passcode Pengembang:</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    autoFocus
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    placeholder="Masukkan Passcode Pengembang..."
                    className="w-full bg-black/60 border border-amber-500/50 rounded-xl px-3 py-2.5 text-amber-300 font-bold outline-none focus:border-amber-400 font-mono text-sm tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Verifikasi berhasil! Mengaktifkan Mode Pengembang...</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDeveloperModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={authSuccess}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-950 active:scale-95"
                >
                  <span>Masuk Mode Pengembang</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
