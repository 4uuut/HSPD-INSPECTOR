import React, { useState, useEffect } from 'react';
import { 
  KeyRound, Copy, Check, RefreshCw, Clock, Shield, Sparkles, 
  Lock, Unlock, AlertCircle, CheckCircle2, Sliders, Radio, History,
  Share2, X, ChevronRight, Zap, Info
} from 'lucide-react';
import { 
  AuthorityPinConfig, 
  getAuthorityPinConfig, 
  rotateAuthorityPinHourly, 
  setManualAuthorityPin, 
  toggleAutoRotateHourly, 
  formatRemainingTime, 
  formatAuthorityPinBroadcast 
} from '../utils/authorityPin';
import { OfficerProfile } from '../types';
import { HSPD_LOGO_URL } from '../assets/logo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentOfficer?: OfficerProfile | null;
  onPinUpdated?: (newConfig: AuthorityPinConfig) => void;
}

export const AuthorityPinModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentOfficer,
  onPinUpdated
}) => {
  const [config, setConfig] = useState<AuthorityPinConfig>(() => getAuthorityPinConfig());
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedBroadcast, setCopiedBroadcast] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'manual' | 'history'>('current');

  // Manual PIN form states
  const [manualPinInput, setManualPinInput] = useState('');
  const [manualDuration, setManualDuration] = useState<number>(60);
  const [manualNotes, setManualNotes] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Live timer tick every 1 second
  const [timeRemaining, setTimeRemaining] = useState(() => formatRemainingTime(config.expiresAt));

  useEffect(() => {
    if (!isOpen) return;

    // Load fresh config on open
    const fresh = getAuthorityPinConfig();
    setConfig(fresh);
    setTimeRemaining(formatRemainingTime(fresh.expiresAt));

    const interval = setInterval(() => {
      const current = getAuthorityPinConfig();
      setConfig(current);
      setTimeRemaining(formatRemainingTime(current.expiresAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyPin = () => {
    navigator.clipboard.writeText(config.currentPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(null as any), 2000);
  };

  const handleCopyBroadcast = () => {
    const text = formatAuthorityPinBroadcast(config, currentOfficer?.name);
    navigator.clipboard.writeText(text);
    setCopiedBroadcast(true);
    setTimeout(() => setCopiedBroadcast(false), 2500);
  };

  const handleRotateNow = () => {
    const updated = rotateAuthorityPinHourly(
      currentOfficer ? {
        name: currentOfficer.name,
        badge: currentOfficer.badge,
        rank: currentOfficer.rank
      } : undefined
    );
    setConfig(updated);
    setTimeRemaining(formatRemainingTime(updated.expiresAt));
    if (onPinUpdated) onPinUpdated(updated);
    
    setActionSuccessMessage(`✅ PIN Otoritas Baru (${updated.currentPin}) berhasil digenerate untuk 1 jam ke depan!`);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const handleToggleAutoRotate = (enabled: boolean) => {
    const updated = toggleAutoRotateHourly(enabled);
    setConfig(updated);
    setTimeRemaining(formatRemainingTime(updated.expiresAt));
    if (onPinUpdated) onPinUpdated(updated);

    setActionSuccessMessage(enabled 
      ? '✅ Mode Rotasi Otomatis Setiap 1 Jam AKTIF!' 
      : '⚠️ Mode Rotasi Otomatis DIMATIKAN. PIN akan tetap manual.'
    );
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const handleApplyManualPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPinInput.trim()) {
      alert('Masukkan kode PIN manual terlebih dahulu.');
      return;
    }

    const updated = setManualAuthorityPin(
      manualPinInput,
      manualDuration,
      currentOfficer ? {
        name: currentOfficer.name,
        badge: currentOfficer.badge,
        rank: currentOfficer.rank
      } : undefined,
      manualNotes.trim() || undefined
    );

    setConfig(updated);
    setTimeRemaining(formatRemainingTime(updated.expiresAt));
    if (onPinUpdated) onPinUpdated(updated);

    setManualPinInput('');
    setManualNotes('');
    setActiveTab('current');
    setActionSuccessMessage(`✅ PIN Manual (${updated.currentPin}) berhasil ditetapkan!`);
    setTimeout(() => setActionSuccessMessage(null), 4500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150 font-mono text-xs">
      <div className="bg-[#161B22] border border-amber-500/50 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header Modal */}
        <div className="bg-[#0F1319] border-b border-gray-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative group shrink-0">
              <img
                src={HSPD_LOGO_URL}
                alt="HSPD Official Emblem"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-contain drop-shadow-md border border-amber-500/50 bg-black/60 p-0.5"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-gray-100 uppercase tracking-tight flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>MANAJEMEN PIN OTORITAS BERKAS</span>
                </h3>
                <span className="text-[10px] font-mono bg-amber-950/80 text-amber-300 border border-amber-700/60 px-1.5 py-0.5 rounded font-bold">
                  HIGH COMMAND ONLY
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Pusat kendali PIN pembuka berkas investigasi kasus (Otomatis per 1 Jam / Manual oleh Atasan)
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

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 border-b border-gray-800 bg-[#0D1117] text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab('current')}
            className={`py-2.5 px-2 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
              activeTab === 'current'
                ? 'border-amber-500 text-amber-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">1. PIN Aktif & Rotasi 1 Jam</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`py-2.5 px-2 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">2. Set PIN Manual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2.5 px-2 flex items-center justify-center gap-1.5 font-bold transition border-b-2 ${
              activeTab === 'history'
                ? 'border-purple-500 text-purple-400 bg-[#161B22]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">3. Riwayat Log PIN ({config.history?.length || 0})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Action Notification */}
          {actionSuccessMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-300 rounded-lg flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
          )}

          {/* TAB 1: PIN AKTIF & KONTROL ROTASI OTOMATIS 1 JAM */}
          {activeTab === 'current' && (
            <div className="space-y-4">
              {/* Highlight Card PIN Display */}
              <div className="p-4 sm:p-5 bg-gradient-to-b from-[#0D1117] via-[#121824] to-[#0D1117] border-2 border-amber-500/60 rounded-xl space-y-3 shadow-xl relative overflow-hidden text-center">
                <div className="absolute top-2 left-3 flex items-center gap-1.5 text-[10px] text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{config.mode === 'hourly_auto' ? 'MODE ROTASI OTOMATIS (1 JAM)' : 'MODE MANUAL ATASAN'}</span>
                </div>

                <div className="pt-4 pb-1">
                  <div className="text-[11px] text-gray-400 font-mono uppercase tracking-widest">
                    KODE PIN OTORITAS PEMBUKA BERKAS SAAT INI
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono tracking-widest my-2 select-all drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                    {config.currentPin}
                  </div>
                  
                  {/* Countdown Timer & Progress Bar */}
                  <div className="max-w-md mx-auto space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-300">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Sisa Waktu Berlaku:</span>
                      </span>
                      <span className={`font-bold font-mono ${timeRemaining.isExpired ? 'text-rose-400' : 'text-amber-300'}`}>
                        {timeRemaining.text}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          timeRemaining.percentRemaining < 20 
                            ? 'bg-rose-500' 
                            : timeRemaining.percentRemaining < 50 
                              ? 'bg-amber-500' 
                              : 'bg-emerald-500'
                        }`}
                        style={{ width: `${timeRemaining.percentRemaining}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={handleCopyPin}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-amber-600/20"
                  >
                    {copiedPin ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
                    <span>{copiedPin ? 'PIN DISALIN!' : 'SALIN KODE PIN'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRotateNow}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg transition flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4 text-amber-400" />
                    <span>GENERATE PIN BARU SEKARANG</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyBroadcast}
                    className="px-4 py-2 bg-[#1C2128] hover:bg-blue-900/40 text-blue-300 border border-blue-700/50 rounded-lg transition flex items-center gap-1.5"
                  >
                    {copiedBroadcast ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-blue-400" />}
                    <span>{copiedBroadcast ? 'FORMAT SIARAN DISALIN!' : 'SALIN PESAN SIARAN RADIO/DC'}</span>
                  </button>
                </div>
              </div>

              {/* Hourly Auto-Rotation Settings Control */}
              <div className="p-4 bg-[#0D1117] border border-gray-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-gray-200 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Rotasi Otomatis Setiap 1 Jam (Auto-Hourly Rotation)</span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Sistem akan memperbarui PIN Otoritas secara otomatis setiap 60 menit sekali untuk mencegah kebocoran arsip kasus.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoRotateHourly}
                      onChange={(e) => handleToggleAutoRotate(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-lg text-[11px] text-gray-300 space-y-1">
                  <div className="text-gray-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <span>Informasi Penerbit PIN Terakhir:</span>
                  </div>
                  <div className="font-mono text-gray-200">
                    Oleh: <strong>{config.setBy}</strong> ({config.setByRank || 'HIGH COMMAND'} {config.setByBadge || ''}) pada {new Date(config.generatedAt).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SET PIN MANUAL OLEH ATASAN */}
          {activeTab === 'manual' && (
            <form onSubmit={handleApplyManualPin} className="space-y-4">
              <div className="p-3 bg-blue-950/30 border border-blue-900/60 rounded-lg text-[11px] text-blue-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-200">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Tetapkan Kode PIN Khusus (Manual Override)</span>
                </div>
                <p className="text-gray-400">
                  Atasan dapat menetapkan kode PIN kustom tertentu (misal untuk operasi investigasi khusus atau penugasan regu tertentu) dengan durasi masa berlaku yang dapat disesuaikan.
                </p>
              </div>

              <div className="space-y-3 bg-[#0D1117] border border-gray-800 rounded-xl p-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 uppercase block">
                    Kode PIN Otoritas Baru:
                  </label>
                  <input
                    type="text"
                    required
                    value={manualPinInput}
                    onChange={(e) => setManualPinInput(e.target.value.toUpperCase())}
                    placeholder="Contoh: 994201 atau CID-SECRET"
                    className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 focus:border-amber-500 rounded-lg text-sm text-amber-300 font-mono tracking-widest outline-none"
                  />
                  <span className="text-[10px] text-gray-500">
                    Bisa berupa 4-8 angka atau kombinasi huruf & angka.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 uppercase block">
                    Durasi Masa Berlaku:
                  </label>
                  <select
                    value={manualDuration}
                    onChange={(e) => setManualDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-200 font-mono outline-none"
                  >
                    <option value={30}>30 Menit</option>
                    <option value={60}>1 Jam (Standar Operasional)</option>
                    <option value={120}>2 Jam</option>
                    <option value={360}>6 Jam (Shift Kerja)</option>
                    <option value={720}>12 Jam</option>
                    <option value={1440}>24 Jam (1 Hari Penuh)</option>
                    <option value={0}>Permanen (Tanpa Kadaluwarsa sampai diganti kembali)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-300 uppercase block">
                    Catatan / Alasan Penerbitan Manual (Opsional):
                  </label>
                  <input
                    type="text"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Contoh: Operasi Raid Narkoba / Otorisasi Unit CID"
                    className="w-full px-3 py-2 bg-[#161B22] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-200 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('current')}
                  className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-amber-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>SIMPAN & AKTIFKAN PIN MANUAL</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: RIWAYAT / AUDIT LOG GENERASI PIN */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-gray-400 text-[11px] pb-1 border-b border-gray-800">
                <span>Daftar 10 Aktivitas Pembuatan & Rotasi PIN Terakhir</span>
                <span className="text-amber-400 font-bold">{config.history?.length || 0} Catatan</span>
              </div>

              {(!config.history || config.history.length === 0) ? (
                <div className="p-8 text-center text-gray-500">Belum ada riwayat rotasi PIN.</div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto">
                  {config.history.map((log, idx) => (
                    <div
                      key={log.id || idx}
                      className="p-3 bg-[#0D1117] border border-gray-800 hover:border-gray-700 rounded-lg flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-400 font-mono text-sm px-2 py-0.5 bg-black/50 rounded border border-amber-900/60">
                            {log.pin}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            log.type === 'hourly_auto'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                              : 'bg-blue-950/60 text-blue-300 border border-blue-800/60'
                          }`}>
                            {log.type === 'hourly_auto' ? 'Rotasi Otomatis (1 Jam)' : 'Manual Atasan'}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {log.notes || 'Penerbitan PIN Otoritas'}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          Dibuat oleh: <strong className="text-gray-300">{log.setBy}</strong> ({log.setByRank || 'HQ'} {log.setByBadge || ''})
                        </div>
                      </div>

                      <div className="text-right text-[10px] text-gray-400 font-mono shrink-0">
                        <div>{new Date(log.generatedAt).toLocaleDateString('id-ID')}</div>
                        <div className="text-gray-500">{new Date(log.generatedAt).toLocaleTimeString('id-ID')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="bg-[#0F1319] border-t border-gray-800 px-5 py-3 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>HighState Police MDT Archive Security Layer v2</span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
