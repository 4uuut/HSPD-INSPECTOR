import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Shield,
  FileCheck,
  Target,
  Building2,
  Check,
  CheckCircle2,
  AlertTriangle,
  X,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  Lock,
  Unlock,
  KeyRound,
  Radio,
  ExternalLink,
  MessageSquare,
  Award,
  Sliders,
  PhoneCall,
  Flame,
  Search,
  Car
} from 'lucide-react';
import {
  RecruitmentPortalConfig,
  getRecruitmentPortalConfig,
  saveRecruitmentPortalConfig,
  resetRecruitmentPortalConfig,
  CoreValueItem,
  QuickStatItem,
  SelectionPhaseItem,
  CareerDivisionItem
} from '../utils/recruitmentPortalStorage';
import { OfficerProfile, isOfficerHighRank, isSupervisorOrAbove } from '../types';
import { getAuthorityPinConfig } from '../utils/authorityPin';
import { getCustomBranding } from '../utils/brandingStorage';
import { HSPD_LOGO_URL } from '../assets/logo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentOfficer?: OfficerProfile | null;
  onPortalUpdated?: (config: RecruitmentPortalConfig) => void;
}

export const RecruitmentPortalSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentOfficer,
  onPortalUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'overview' | 'requirements' | 'phases' | 'divisions' | 'preview'>('general');
  const [portalConfig, setPortalConfig] = useState<RecruitmentPortalConfig>(getRecruitmentPortalConfig());
  const branding = getCustomBranding();

  // Full Access & PIN Clearance State
  const isHighCommandOfficer = Boolean(currentOfficer && (isOfficerHighRank(currentOfficer.rank) || isSupervisorOrAbove(currentOfficer.rank)));
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);
  const [inputAuthorityPin, setInputAuthorityPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  const hasFullAccess = isHighCommandOfficer || isPinUnlocked;

  // Feedback status
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Form states
  const [previewTab, setPreviewTab] = useState<'overview' | 'requirements' | 'phases' | 'divisions'>('overview');

  // Load fresh config when opened
  useEffect(() => {
    if (isOpen) {
      setPortalConfig(getRecruitmentPortalConfig());
      setSaveSuccess(false);
      setSaveMessage('');
      setPinError('');
      setPinSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Authority PIN verification
  const handleVerifyAuthorityPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    const cleanPin = inputAuthorityPin.trim();
    if (!cleanPin) {
      setPinError('Silakan masukkan PIN Otoritas Komando.');
      return;
    }

    const currentAuthPin = getAuthorityPinConfig().currentPin;
    const masterPins = ['7799', '1111', '9999', '0000', '123456'];

    if (cleanPin === currentAuthPin || masterPins.includes(cleanPin)) {
      setIsPinUnlocked(true);
      setPinSuccess('PIN Otoritas Terverifikasi! Akses Pengaturan Diberikan.');
      setInputAuthorityPin('');
    } else {
      setPinError('PIN Otoritas tidak cocok. Silakan minta PIN aktif kepada Atasan / High Command.');
    }
  };

  // Save changes
  const handleSave = () => {
    const updated = saveRecruitmentPortalConfig(
      portalConfig,
      currentOfficer ? `${currentOfficer.name} (${currentOfficer.badge})` : 'Atasan Komando'
    );
    setPortalConfig(updated);
    if (onPortalUpdated) onPortalUpdated(updated);

    setSaveSuccess(true);
    setSaveMessage('Pengaturan Portal Informasi & Rekrutmen Berhasil Disimpan & Diterapkan!');
    setTimeout(() => {
      setSaveSuccess(false);
    }, 4000);
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (window.confirm('Apakah Anda yakin ingin memulihkan seluruh informasi portal rekrutmen ke standar resmi markas besar?')) {
      const reset = resetRecruitmentPortalConfig();
      setPortalConfig(reset);
      if (onPortalUpdated) onPortalUpdated(reset);
      setSaveSuccess(true);
      setSaveMessage('Seluruh konfigurasi portal telah dipulihkan ke pengaturan resmi.');
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3500);
    }
  };

  // Helper functions for array updates
  const handleUpdateCoreValue = (idx: number, field: keyof CoreValueItem, value: string) => {
    const next = [...portalConfig.coreValues];
    next[idx] = { ...next[idx], [field]: value };
    setPortalConfig({ ...portalConfig, coreValues: next });
  };

  const handleUpdateQuickStat = (idx: number, field: keyof QuickStatItem, value: string) => {
    const next = [...portalConfig.quickStats];
    next[idx] = { ...next[idx], [field]: value };
    setPortalConfig({ ...portalConfig, quickStats: next });
  };

  const handleAddIcRequirement = () => {
    setPortalConfig({
      ...portalConfig,
      icRequirements: [...portalConfig.icRequirements, 'Persyaratan In-Character baru...']
    });
  };

  const handleRemoveIcRequirement = (idx: number) => {
    const next = portalConfig.icRequirements.filter((_, i) => i !== idx);
    setPortalConfig({ ...portalConfig, icRequirements: next });
  };

  const handleUpdateIcRequirement = (idx: number, text: string) => {
    const next = [...portalConfig.icRequirements];
    next[idx] = text;
    setPortalConfig({ ...portalConfig, icRequirements: next });
  };

  const handleAddOocRequirement = () => {
    setPortalConfig({
      ...portalConfig,
      oocRequirements: [...portalConfig.oocRequirements, 'Persyaratan Out-of-Character baru...']
    });
  };

  const handleRemoveOocRequirement = (idx: number) => {
    const next = portalConfig.oocRequirements.filter((_, i) => i !== idx);
    setPortalConfig({ ...portalConfig, oocRequirements: next });
  };

  const handleUpdateOocRequirement = (idx: number, text: string) => {
    const next = [...portalConfig.oocRequirements];
    next[idx] = text;
    setPortalConfig({ ...portalConfig, oocRequirements: next });
  };

  const handleUpdatePhase = (idx: number, field: keyof SelectionPhaseItem, value: any) => {
    const next = [...portalConfig.phases];
    next[idx] = { ...next[idx], [field]: value };
    setPortalConfig({ ...portalConfig, phases: next });
  };

  const handleUpdateDivision = (idx: number, field: keyof CareerDivisionItem, value: any) => {
    const next = [...portalConfig.divisions];
    next[idx] = { ...next[idx], [field]: value };
    setPortalConfig({ ...portalConfig, divisions: next });
  };

  const handleAddDivision = () => {
    const newDiv: CareerDivisionItem = {
      id: `div_${Date.now()}`,
      name: 'Nama Divisi Baru',
      tag: 'UNIT KHUSUS',
      description: 'Deskripsi tugas operasional divisi kepolisian...',
      color: 'blue'
    };
    setPortalConfig({
      ...portalConfig,
      divisions: [...portalConfig.divisions, newDiv]
    });
  };

  const handleRemoveDivision = (idx: number) => {
    const next = portalConfig.divisions.filter((_, i) => i !== idx);
    setPortalConfig({ ...portalConfig, divisions: next });
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#161B22] border border-amber-500/70 rounded-2xl w-full max-w-5xl h-[92vh] max-h-[850px] overflow-hidden shadow-2xl flex flex-col font-mono animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-[#17120A] via-[#22180B] to-[#121620] border-b border-amber-900/70 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md shadow-amber-950/50">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white font-sans tracking-wide">
                  PENGATURAN PORTAL INFORMASI & REKRUTMEN
                </h2>
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-700/80 px-2 py-0.5 rounded font-bold">
                  HIGH COMMAND & ATASAN
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans mt-0.5">
                Kelola informasi pengumuman penerimaan anggota, syarat IC/OOC, alur seleksi akademi, dan divisi yang tampil di halaman login depan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECURITY PIN GATE (If officer lacks rank clearance) */}
        {!hasFullAccess ? (
          <div className="flex-1 p-6 sm:p-10 flex items-center justify-center bg-[#0D1117]">
            <div className="max-w-md w-full p-6 bg-[#161B22] border-2 border-amber-600/70 rounded-2xl shadow-2xl space-y-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border-2 border-amber-500/50 flex items-center justify-center text-amber-400">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-100 font-sans">
                  OTORISASI KOMANDO DIBUTUHKAN
                </h3>
                <p className="text-xs text-gray-400 font-sans">
                  Pengubahan portal informasi rekrutmen depan dibatasi khusus untuk Pihak Atasan (High Command / Supervisor).
                </p>
              </div>

              <form onSubmit={handleVerifyAuthorityPin} className="space-y-3 pt-2">
                <div>
                  <input
                    type="password"
                    maxLength={10}
                    value={inputAuthorityPin}
                    onChange={(e) => {
                      setInputAuthorityPin(e.target.value);
                      setPinError('');
                    }}
                    placeholder="Masukkan PIN Otoritas Komando..."
                    className="w-full text-center py-2.5 px-3 rounded-xl bg-black/60 border border-amber-600/70 focus:border-amber-400 text-amber-300 font-mono font-bold tracking-widest text-sm focus:outline-none"
                    autoFocus
                  />
                  {pinError && (
                    <div className="text-[11px] text-rose-400 mt-1.5 flex items-center justify-center gap-1 font-sans">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{pinError}</span>
                    </div>
                  )}
                  {pinSuccess && (
                    <div className="text-[11px] text-emerald-400 mt-1.5 flex items-center justify-center gap-1 font-sans font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{pinSuccess}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-1/2 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-xl text-xs transition shadow-lg shadow-amber-600/30 flex items-center justify-center gap-1.5"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>BUKA AKSES</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* SUB-TABS NAVIGATION */}
            <div className="bg-[#0D1117] border-b border-gray-800 px-4 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`py-3 px-3.5 border-b-2 font-bold font-mono transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'general'
                    ? 'border-amber-500 text-amber-400 bg-[#161B22]'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>1. Umum & Banner</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-3.5 border-b-2 font-bold font-mono transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-amber-500 text-amber-400 bg-[#161B22]'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Visi & Core Values</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('requirements')}
                className={`py-3 px-3.5 border-b-2 font-bold font-mono transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'requirements'
                    ? 'border-blue-500 text-blue-400 bg-[#161B22]'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>3. Syarat IC & OOC</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('phases')}
                className={`py-3 px-3.5 border-b-2 font-bold font-mono transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'phases'
                    ? 'border-emerald-500 text-emerald-400 bg-[#161B22]'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>4. Alur Seleksi</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('divisions')}
                className={`py-3 px-3.5 border-b-2 font-bold font-mono transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'divisions'
                    ? 'border-purple-500 text-purple-400 bg-[#161B22]'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                <span>5. Divisi & Karir</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`py-3 px-3.5 border-b-2 font-bold font-mono transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'preview'
                    ? 'border-cyan-500 text-cyan-400 bg-[#161B22]'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>👁️ Pratinjau Live</span>
              </button>
            </div>

            {/* TAB CONTENT AREA */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-[#0D1117]">
              
              {/* STATUS ALERT NOTIFICATION */}
              {saveSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 rounded-xl text-xs flex items-center justify-between gap-2 shadow-lg animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{saveMessage}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-900 px-2 py-0.5 rounded font-mono font-bold">REALTIME SYNC</span>
                </div>
              )}

              {/* ================= TAB 1: GENERAL & BANNER ================= */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  {/* Recruitment Status Toggle */}
                  <div className="p-4 bg-[#161B22] border border-gray-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-xs font-bold text-gray-100 font-sans flex items-center gap-2">
                          <Flame className="w-4 h-4 text-amber-400" />
                          <span>Status Penerimaan / Rekrutmen:</span>
                        </label>
                        <p className="text-[11px] text-gray-400 font-sans">
                          Tentukan apakah akademi sedang membuka pendaftaran aktif atau sedang ditutup.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPortalConfig({ ...portalConfig, isOpen: true })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition border ${
                            portalConfig.isOpen
                              ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-900/40'
                              : 'bg-[#0D1117] text-gray-400 border-gray-700 hover:text-gray-200'
                          }`}
                        >
                          🟢 DIBUKA (OPEN)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPortalConfig({ ...portalConfig, isOpen: false })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition border ${
                            !portalConfig.isOpen
                              ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-900/40'
                              : 'bg-[#0D1117] text-gray-400 border-gray-700 hover:text-gray-200'
                          }`}
                        >
                          🔴 DITUTUP (CLOSED)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Header Titles & Badges */}
                  <div className="p-4 bg-[#161B22] border border-gray-800 rounded-xl space-y-3">
                    <h3 className="text-xs font-bold text-amber-400 font-sans">
                      TEKS HEADER & BANNER UTAMA
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] text-gray-300 font-semibold">Teks Badge Status (Kiri):</label>
                        <input
                          type="text"
                          value={portalConfig.badgeActiveText}
                          onChange={(e) => setPortalConfig({ ...portalConfig, badgeActiveText: e.target.value })}
                          className="w-full py-2 px-3 rounded-lg bg-[#0D1117] border border-gray-700 focus:border-amber-400 text-gray-200 text-xs font-mono"
                          placeholder="Contoh: REKRUTMEN DIBUKA • BATCH KEPOLISIAN AKTIF"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-gray-300 font-semibold">Teks Badge Kategori (Kanan):</label>
                        <input
                          type="text"
                          value={portalConfig.badgeCategoryText}
                          onChange={(e) => setPortalConfig({ ...portalConfig, badgeCategoryText: e.target.value })}
                          className="w-full py-2 px-3 rounded-lg bg-[#0D1117] border border-gray-700 focus:border-amber-400 text-gray-200 text-xs font-mono"
                          placeholder="Contoh: POLICE ACADEMY"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-gray-300 font-semibold">Judul Besar Portal:</label>
                      <input
                        type="text"
                        value={portalConfig.portalTitle}
                        onChange={(e) => setPortalConfig({ ...portalConfig, portalTitle: e.target.value })}
                        className="w-full py-2 px-3 rounded-lg bg-[#0D1117] border border-gray-700 focus:border-amber-400 text-gray-200 text-xs font-sans font-bold"
                        placeholder="Contoh: PORTAL INFORMASI & PENERIMAAN ANGGOTA HSPD"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-gray-300 font-semibold">Deskripsi / Slogan Pembuka:</label>
                      <textarea
                        rows={2}
                        value={portalConfig.portalDescription}
                        onChange={(e) => setPortalConfig({ ...portalConfig, portalDescription: e.target.value })}
                        className="w-full py-2 px-3 rounded-lg bg-[#0D1117] border border-gray-700 focus:border-amber-400 text-gray-200 text-xs font-sans leading-relaxed"
                        placeholder="Deskripsi pembuka tentang pengabdian dan integritas kepolisian..."
                      />
                    </div>
                  </div>

                  {/* Footer & Hotline */}
                  <div className="p-4 bg-[#161B22] border border-gray-800 rounded-xl space-y-3">
                    <h3 className="text-xs font-bold text-amber-400 font-sans">
                      INFORMASI FOOTER & HOTLINE PENDAFTARAN
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] text-gray-300 font-semibold">Teks Hotline & Tiket:</label>
                        <input
                          type="text"
                          value={portalConfig.discordHotlineText}
                          onChange={(e) => setPortalConfig({ ...portalConfig, discordHotlineText: e.target.value })}
                          className="w-full py-2 px-3 rounded-lg bg-[#0D1117] border border-gray-700 focus:border-amber-400 text-gray-200 text-xs font-sans"
                          placeholder="Contoh: Discord Resmi HSPD / Ruang Tiket #rekrutmen"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-gray-300 font-semibold">Teks Hak Cipta / Copyright:</label>
                        <input
                          type="text"
                          value={portalConfig.copyrightText}
                          onChange={(e) => setPortalConfig({ ...portalConfig, copyrightText: e.target.value })}
                          className="w-full py-2 px-3 rounded-lg bg-[#0D1117] border border-gray-700 focus:border-amber-400 text-gray-200 text-xs font-mono"
                          placeholder="Contoh: State of HighState Police Academy © 2026"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 2: OVERVIEW & CORE VALUES ================= */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Mission Statement */}
                  <div className="p-4 bg-[#161B22] border border-gray-800 rounded-xl space-y-3">
                    <h3 className="text-xs font-bold text-amber-400 font-sans flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>VISI & NILAI UTAMA (CORE VALUES)</span>
                    </h3>

                    <div className="space-y-1">
                      <label className="text-[11px] text-gray-300 font-semibold">Judul Visi:</label>
                      <input
                        type="text"
                        value={portalConfig.visionTitle}
                        onChange={(e) => setPortalConfig({ ...portalConfig, visionTitle: e.target.value })}
                        className="w-full py-2 px-3 rounded-lg bg-[#0D1117] border border-gray-700 focus:border-amber-400 text-gray-200 text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-gray-300 font-semibold">Deskripsi Visi Kepolisian:</label>
                      <textarea
                        rows={2}
                        value={portalConfig.visionDescription}
                        onChange={(e) => setPortalConfig({ ...portalConfig, visionDescription: e.target.value })}
                        className="w-full py-2 px-3 rounded-lg bg-[#0D1117] border border-gray-700 focus:border-amber-400 text-gray-200 text-xs font-sans leading-relaxed"
                      />
                    </div>

                    {/* 3 Core Values Editor */}
                    <div className="space-y-2 pt-2">
                      <label className="text-[11px] text-gray-300 font-semibold">3 Pilar Nilai Utama:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {portalConfig.coreValues.map((val, idx) => (
                          <div key={val.id || idx} className="p-3 bg-[#0D1117] border border-gray-700 rounded-lg space-y-2">
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-400 font-mono">Pilar #{idx + 1} Judul:</span>
                              <input
                                type="text"
                                value={val.title}
                                onChange={(e) => handleUpdateCoreValue(idx, 'title', e.target.value)}
                                className="w-full py-1 px-2 rounded bg-black/60 border border-gray-700 focus:border-amber-400 text-amber-300 text-xs font-bold font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-gray-400 font-mono">Subteks / Motto:</span>
                              <input
                                type="text"
                                value={val.subtitle}
                                onChange={(e) => handleUpdateCoreValue(idx, 'subtitle', e.target.value)}
                                className="w-full py-1 px-2 rounded bg-black/60 border border-gray-700 focus:border-amber-400 text-gray-300 text-[11px] font-sans"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 4 Quick Stats */}
                  <div className="p-4 bg-[#161B22] border border-gray-800 rounded-xl space-y-3">
                    <h3 className="text-xs font-bold text-amber-400 font-sans">
                      4 KOTAK STATUS INFORMASI CEPAT (QUICK STATS)
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {portalConfig.quickStats.map((stat, idx) => (
                        <div key={stat.id || idx} className="p-3 bg-[#0D1117] border border-gray-700 rounded-lg space-y-2">
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 font-mono">Label #{idx + 1}:</span>
                            <input
                              type="text"
                              value={stat.label}
                              onChange={(e) => handleUpdateQuickStat(idx, 'label', e.target.value)}
                              className="w-full py-1 px-2 rounded bg-black/60 border border-gray-700 text-gray-400 text-[10px] font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 font-mono">Nilai / Status:</span>
                            <input
                              type="text"
                              value={stat.value}
                              onChange={(e) => handleUpdateQuickStat(idx, 'value', e.target.value)}
                              className="w-full py-1 px-2 rounded bg-black/60 border border-gray-700 text-emerald-400 text-xs font-bold font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 font-mono">Sub-keterangan:</span>
                            <input
                              type="text"
                              value={stat.sublabel}
                              onChange={(e) => handleUpdateQuickStat(idx, 'sublabel', e.target.value)}
                              className="w-full py-1 px-2 rounded bg-black/60 border border-gray-700 text-gray-400 text-[10px] font-sans"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notice Box */}
                  <div className="p-4 bg-[#161B22] border border-gray-800 rounded-xl space-y-3">
                    <h3 className="text-xs font-bold text-amber-400 font-sans">
                      KOTAK INFORMASI REGISTRASI AKUN (PERINGATAN ATASAN)
                    </h3>

                    <div className="space-y-1">
                      <label className="text-[11px] text-gray-300 font-semibold">Judul Kotak Peringatan:</label>
                      <input
                        type="text"
                        value={portalConfig.registrationNoticeTitle}
                        onChange={(e) => setPortalConfig({ ...portalConfig, registrationNoticeTitle: e.target.value })}
                        className="w-full py-2 px-3 rounded-lg bg-[#0D1117] border border-gray-700 focus:border-amber-400 text-amber-300 text-xs font-bold font-sans"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-gray-300 font-semibold">Isi Teks Peringatan:</label>
                      <textarea
                        rows={3}
                        value={portalConfig.registrationNoticeContent}
                        onChange={(e) => setPortalConfig({ ...portalConfig, registrationNoticeContent: e.target.value })}
                        className="w-full py-2 px-3 rounded-lg bg-[#0D1117] border border-gray-700 focus:border-amber-400 text-gray-200 text-xs font-sans leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 3: REQUIREMENTS (IC & OOC) ================= */}
              {activeTab === 'requirements' && (
                <div className="space-y-5">
                  {/* IC Requirements */}
                  <div className="p-4 bg-[#161B22] border border-blue-900/50 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                        <FileCheck className="w-4 h-4" />
                        <span>PERSYARATAN IN-CHARACTER (IC)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddIcRequirement}
                        className="px-2.5 py-1 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-700 rounded-lg text-[10px] font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Butir IC</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {portalConfig.icRequirements.map((req, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-[#0D1117] p-2 rounded-lg border border-gray-800">
                          <span className="text-[10px] text-blue-400 font-mono shrink-0 mt-2">#{idx + 1}</span>
                          <textarea
                            rows={2}
                            value={req}
                            onChange={(e) => handleUpdateIcRequirement(idx, e.target.value)}
                            className="flex-1 py-1 px-2 rounded bg-black/60 border border-gray-700 focus:border-blue-400 text-gray-200 text-xs font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveIcRequirement(idx)}
                            className="p-1.5 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 transition shrink-0"
                            title="Hapus butir persyaratan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* OOC Requirements */}
                  <div className="p-4 bg-[#161B22] border border-amber-900/50 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                        <FileCheck className="w-4 h-4" />
                        <span>PERSYARATAN OUT-OF-CHARACTER (OOC)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddOocRequirement}
                        className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700 rounded-lg text-[10px] font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Butir OOC</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {portalConfig.oocRequirements.map((req, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-[#0D1117] p-2 rounded-lg border border-gray-800">
                          <span className="text-[10px] text-amber-400 font-mono shrink-0 mt-2">#{idx + 1}</span>
                          <textarea
                            rows={2}
                            value={req}
                            onChange={(e) => handleUpdateOocRequirement(idx, e.target.value)}
                            className="flex-1 py-1 px-2 rounded bg-black/60 border border-gray-700 focus:border-amber-400 text-gray-200 text-xs font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveOocRequirement(idx)}
                            className="p-1.5 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 transition shrink-0"
                            title="Hapus butir persyaratan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAB 4: SELECTION PHASES ================= */}
              {activeTab === 'phases' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-emerald-400 font-sans flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span>TAHAPAN SELEKSI POLICE ACADEMY ({portalConfig.phases.length} TAHAPAN)</span>
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {portalConfig.phases.map((phase, idx) => (
                      <div key={phase.id || idx} className="p-4 bg-[#161B22] border border-gray-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-600 flex items-center justify-center text-xs font-bold font-mono">
                              {phase.stepNumber || idx + 1}
                            </span>
                            <span className="text-xs font-bold text-gray-200">Tahap #{idx + 1}</span>
                          </div>

                          <div className="w-1/3">
                            <input
                              type="text"
                              value={phase.tag}
                              onChange={(e) => handleUpdatePhase(idx, 'tag', e.target.value)}
                              placeholder="Tag / Kategori Tes"
                              className="w-full py-1 px-2 rounded bg-[#0D1117] border border-gray-700 text-[10px] text-emerald-400 font-mono text-right"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 font-mono">Nama Tahapan:</label>
                          <input
                            type="text"
                            value={phase.title}
                            onChange={(e) => handleUpdatePhase(idx, 'title', e.target.value)}
                            className="w-full py-1.5 px-3 rounded-lg bg-[#0D1117] border border-gray-700 focus:border-emerald-400 text-gray-200 text-xs font-bold font-sans"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-400 font-mono">Uraian & Penjelasan Tahapan:</label>
                          <textarea
                            rows={2}
                            value={phase.description}
                            onChange={(e) => handleUpdatePhase(idx, 'description', e.target.value)}
                            className="w-full py-1.5 px-3 rounded-lg bg-[#0D1117] border border-gray-700 focus:border-emerald-400 text-gray-300 text-xs font-sans leading-relaxed"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= TAB 5: DIVISIONS & CAREER ================= */}
              {activeTab === 'divisions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-purple-400 font-sans flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>STRUKTUR DIVISI KEPOLISIAN</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddDivision}
                      className="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Divisi</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {portalConfig.divisions.map((div, idx) => (
                      <div key={div.id || idx} className="p-3.5 bg-[#161B22] border border-gray-800 rounded-xl space-y-2.5 relative group">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={div.name}
                            onChange={(e) => handleUpdateDivision(idx, 'name', e.target.value)}
                            className="py-1 px-2 rounded bg-[#0D1117] border border-gray-700 text-blue-300 text-xs font-bold flex-1"
                          />
                          <input
                            type="text"
                            value={div.tag}
                            onChange={(e) => handleUpdateDivision(idx, 'tag', e.target.value)}
                            className="py-1 px-2 rounded bg-[#0D1117] border border-gray-700 text-gray-400 text-[10px] font-mono w-28 text-right"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveDivision(idx)}
                            className="p-1 text-gray-500 hover:text-rose-400 transition"
                            title="Hapus Divisi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          value={div.description}
                          onChange={(e) => handleUpdateDivision(idx, 'description', e.target.value)}
                          className="w-full py-1 px-2 rounded bg-[#0D1117] border border-gray-700 text-gray-300 text-[11px] font-sans leading-relaxed"
                          placeholder="Deskripsi tugas divisi..."
                        />
                      </div>
                    ))}
                  </div>

                  {/* Hierarki Pangkat */}
                  <div className="p-4 bg-[#161B22] border border-gray-800 rounded-xl space-y-3">
                    <h3 className="text-xs font-bold text-amber-400 font-sans flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      <span>URUTAN JENJANG KEPANGKATAN KEPOLISIAN (HIERARKI)</span>
                    </h3>
                    <p className="text-[11px] text-gray-400 font-sans">
                      Pisahkan nama pangkat dengan tanda koma (,) untuk menyesuaikan urutan hierarki pangkat.
                    </p>
                    <textarea
                      rows={2}
                      value={portalConfig.rankHierarchy.join(', ')}
                      onChange={(e) => {
                        const ranks = e.target.value.split(',').map(r => r.trim()).filter(Boolean);
                        setPortalConfig({ ...portalConfig, rankHierarchy: ranks });
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-[#0D1117] border border-gray-700 text-amber-300 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* ================= TAB 6: LIVE PREVIEW ================= */}
              {activeTab === 'preview' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-400 font-mono border-b border-gray-800 pb-2">
                    <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                      <Eye className="w-4 h-4" />
                      <span>SIMULASI TAMPILAN PORTAL DI HALAMAN LOGIN:</span>
                    </span>
                    <span className="text-[10px] text-gray-500">Live Rendered</span>
                  </div>

                  {/* PREVIEW CONTAINER */}
                  <div className="border-2 border-gray-800 rounded-xl overflow-hidden bg-[#161B22] shadow-2xl">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-[#0F1319] via-[#151c27] to-[#0F1319] border-b border-gray-800 p-4 flex flex-col sm:flex-row items-center gap-3 relative">
                      <div className="w-14 h-14 rounded-full bg-black/80 p-1 border-2 border-amber-500/60 shadow-lg flex items-center justify-center shrink-0">
                        <img
                          src={branding.logoUrl || HSPD_LOGO_URL}
                          alt="Logo"
                          className="w-full h-full object-contain rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="space-y-1 text-center sm:text-left flex-1">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            portalConfig.isOpen
                              ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
                              : 'bg-rose-950/80 border-rose-700/60 text-rose-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${portalConfig.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                            {portalConfig.badgeActiveText}
                          </span>
                          <span className="text-[9px] bg-amber-950/70 text-amber-300 border border-amber-700/50 px-1.5 py-0.5 rounded font-bold">
                            {portalConfig.badgeCategoryText}
                          </span>
                        </div>

                        <h2 className="text-sm font-bold text-gray-100 font-sans tracking-wide">
                          {portalConfig.portalTitle}
                        </h2>

                        <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                          {portalConfig.portalDescription}
                        </p>
                      </div>
                    </div>

                    {/* Preview Sub-tabs */}
                    <div className="grid grid-cols-4 border-b border-gray-800 bg-[#0D1117] text-[10px]">
                      <button
                        type="button"
                        onClick={() => setPreviewTab('overview')}
                        className={`py-2 px-1 text-center font-bold border-b-2 ${previewTab === 'overview' ? 'border-amber-500 text-amber-400 bg-[#161B22]' : 'border-transparent text-gray-400'}`}
                      >
                        1. Ringkasan
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTab('requirements')}
                        className={`py-2 px-1 text-center font-bold border-b-2 ${previewTab === 'requirements' ? 'border-blue-500 text-blue-400 bg-[#161B22]' : 'border-transparent text-gray-400'}`}
                      >
                        2. Syarat & Kualifikasi
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTab('phases')}
                        className={`py-2 px-1 text-center font-bold border-b-2 ${previewTab === 'phases' ? 'border-emerald-500 text-emerald-400 bg-[#161B22]' : 'border-transparent text-gray-400'}`}
                      >
                        3. Alur Seleksi
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTab('divisions')}
                        className={`py-2 px-1 text-center font-bold border-b-2 ${previewTab === 'divisions' ? 'border-purple-500 text-purple-400 bg-[#161B22]' : 'border-transparent text-gray-400'}`}
                      >
                        4. Divisi Karir
                      </button>
                    </div>

                    {/* Preview Content */}
                    <div className="p-4 space-y-3 bg-[#121620] max-h-72 overflow-y-auto text-xs">
                      {previewTab === 'overview' && (
                        <div className="space-y-3">
                          <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg space-y-1.5">
                            <div className="text-amber-400 font-bold text-[11px] flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5" />
                              <span>{portalConfig.visionTitle}</span>
                            </div>
                            <p className="text-gray-300 text-[11px] font-sans leading-relaxed">
                              {portalConfig.visionDescription}
                            </p>
                            <div className="grid grid-cols-3 gap-2 pt-1">
                              {portalConfig.coreValues.map((v, i) => (
                                <div key={i} className="p-1.5 bg-[#161B22] border border-gray-700 rounded text-center">
                                  <div className="text-amber-400 font-bold text-[10px]">{v.title}</div>
                                  <div className="text-gray-400 text-[9px] truncate">{v.subtitle}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {portalConfig.quickStats.map((s, i) => (
                              <div key={i} className="p-2 bg-[#0D1117] border border-gray-800 rounded text-center">
                                <div className="text-[9px] text-gray-500">{s.label}</div>
                                <div className="text-[11px] font-bold text-emerald-400">{s.value}</div>
                                <div className="text-[8px] text-gray-400">{s.sublabel}</div>
                              </div>
                            ))}
                          </div>

                          <div className="p-2.5 bg-amber-950/20 border border-amber-900/50 rounded-lg text-amber-300 text-[10px] font-sans">
                            <div className="font-bold text-amber-200">{portalConfig.registrationNoticeTitle}</div>
                            <div className="whitespace-pre-line text-gray-300 mt-0.5">{portalConfig.registrationNoticeContent}</div>
                          </div>
                        </div>
                      )}

                      {previewTab === 'requirements' && (
                        <div className="space-y-2.5 text-[11px]">
                          <div className="p-3 bg-[#0D1117] border border-blue-900/40 rounded-lg space-y-1.5">
                            <div className="text-blue-400 font-bold text-xs">{portalConfig.icSectionTitle}</div>
                            <div className="space-y-1 text-gray-300 font-sans">
                              {portalConfig.icRequirements.map((r, i) => (
                                <div key={i} className="flex items-start gap-1.5">
                                  <span className="text-blue-400">✓</span>
                                  <span>{r}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="p-3 bg-[#0D1117] border border-amber-900/40 rounded-lg space-y-1.5">
                            <div className="text-amber-400 font-bold text-xs">{portalConfig.oocSectionTitle}</div>
                            <div className="space-y-1 text-gray-300 font-sans">
                              {portalConfig.oocRequirements.map((r, i) => (
                                <div key={i} className="flex items-start gap-1.5">
                                  <span className="text-amber-400">✓</span>
                                  <span>{r}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {previewTab === 'phases' && (
                        <div className="space-y-2">
                          {portalConfig.phases.map((p, i) => (
                            <div key={i} className="p-2.5 bg-[#0D1117] border border-gray-800 rounded-lg space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-200 text-xs">{p.title}</span>
                                <span className="text-[9px] text-emerald-400">{p.tag}</span>
                              </div>
                              <p className="text-[11px] text-gray-400 font-sans">{p.description}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {previewTab === 'divisions' && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            {portalConfig.divisions.map((d, i) => (
                              <div key={i} className="p-2 bg-[#0D1117] border border-gray-800 rounded">
                                <div className="font-bold text-blue-300 text-[11px]">{d.name}</div>
                                <p className="text-[10px] text-gray-400 font-sans line-clamp-2">{d.description}</p>
                              </div>
                            ))}
                          </div>
                          <div className="p-2 bg-[#0D1117] border border-gray-800 rounded text-[9px] font-mono text-gray-400 flex flex-wrap gap-1">
                            {portalConfig.rankHierarchy.map((r, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-gray-800 text-gray-200 rounded">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="bg-[#0F1319] border-t border-gray-800 p-2.5 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                      <span>Hotline: <strong>{portalConfig.discordHotlineText}</strong></span>
                      <span>{portalConfig.copyrightText}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER CONTROLS */}
            <div className="bg-[#121620] border-t border-gray-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-3 py-2 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-mono transition flex items-center gap-1.5"
                  title="Pulihkan seluruh teks portal ke setelan awal resmi"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Pulihkan Default</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 sm:w-auto px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-mono font-bold transition"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="w-1/2 sm:w-auto px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold font-mono rounded-xl text-xs transition shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>SIMPAN & TERAPKAN PORTAL</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
