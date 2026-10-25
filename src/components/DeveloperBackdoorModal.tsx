import React, { useState } from 'react';
import { 
  Terminal, Lock, Shield, Cpu, KeyRound, AlertTriangle, 
  CheckCircle2, Sparkles, Activity, Eye, EyeOff, X, ArrowRight,
  Database, RefreshCw
} from 'lucide-react';
import { OfficerProfile } from '../types';
import { 
  DEVELOPER_MASTER_PASSCODES, 
  logDeveloperSystemActivity,
  synchronizeDpoAndDmvIntegrity 
} from '../utils/activityMonitoringStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDeveloperLogin: (profile: OfficerProfile) => void;
}

export const DeveloperBackdoorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onDeveloperLogin
}) => {
  const [passcode, setPasscode] = useState('');
  const [developerName, setDeveloperName] = useState('Lead System Developer');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanInput = passcode.trim();
    const isValid = DEVELOPER_MASTER_PASSCODES.some(
      code => code.toLowerCase() === cleanInput.toLowerCase()
    ) || cleanInput === '10-4' || cleanInput === 'admin';

    if (!isValid) {
      setErrorMsg('Kunci akses backdoor tidak valid! Masukkan passcode pengembang resmi.');
      return;
    }

    setIsSuccess(true);

    // Auto-run DPO parity integrity check
    try {
      synchronizeDpoAndDmvIntegrity();
    } catch {}

    logDeveloperSystemActivity({
      entity: 'SYSTEM',
      module: 'Developer Backdoor',
      action: 'SYSTEM_SYNC',
      title: 'Akses Backdoor Pengembang Web Diberikan',
      description: `Pengembang web (${developerName.trim() || 'Lead Developer'}) berhasil masuk melalui gerbang otorisasi backdoor.`,
      actor: developerName.trim() || 'Lead Developer',
      actorBadge: '#DEV-001',
      severity: 'SUCCESS'
    });

    setTimeout(() => {
      const devProfile: OfficerProfile = {
        name: developerName.trim() || 'Lead System Developer',
        badge: '#DEV-001',
        rank: 'CHIEF OF POLICE [CHIEF]',
        division: 'EXECUTIVE',
        loginTime: Date.now(),
        accountType: 'POLICE',
        isDeveloper: true,
        isDuty: true,
        dutyStartTime: Date.now(),
        dutyStatus: '10-8'
      };
      onDeveloperLogin(devProfile);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0B0F17] border-2 border-emerald-500/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative font-mono text-xs text-gray-200">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="bg-[#06090F] border-b border-gray-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-500 text-emerald-400 shadow-md">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase block">
                ROOT SYSTEM OVERSEER
              </span>
              <h3 className="text-sm font-black text-white">
                Backdoor Login Pengembang Web
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleVerify} className="p-5 space-y-4">
          <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
            Gerbang otentikasi pengembang aplikasi: Pantau seluruh log riwayat aktivitas <strong>Kepolisian HSPD</strong> & <strong>Pemerintahan</strong>, audit data DPO buronan, dan analisis grafik aktivitas secara langsung.
          </p>

          {errorMsg && (
            <div className="p-2.5 bg-rose-950/80 border border-rose-700 text-rose-200 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-500 text-emerald-200 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
              <span>Kredensial Pengembang Valid! Mengalihkan ke konsol pemantauan...</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] text-gray-300 font-bold block">
              Nama Alias Pengembang:
            </label>
            <input
              type="text"
              value={developerName}
              onChange={e => setDeveloperName(e.target.value)}
              placeholder="Lead System Developer"
              className="w-full bg-[#121824] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-gray-300 font-bold flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>Passcode Master Backdoor:</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                {showPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPass ? 'Sembunyikan' : 'Tampilkan'}</span>
              </button>
            </div>
            <input
              type={showPass ? 'text' : 'password'}
              value={passcode}
              onChange={e => {
                setPasscode(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Masukkan passcode master..."
              autoFocus
              className="w-full bg-[#121824] border border-emerald-500/60 rounded-lg px-3 py-2 text-xs text-emerald-300 placeholder-gray-600 focus:border-emerald-400 outline-none tracking-widest font-bold"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSuccess}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/60 transition disabled:opacity-50"
            >
              <span>Akses Backdoor Pengembang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
