import React, { useState, useEffect } from 'react';
import { 
  Shield, Calculator, Megaphone, BookOpen, FileText, 
  Radio, Award, User, LogOut, Lock, Sparkles,
  Users, ShieldAlert, KeyRound, Power, Clock, CheckCircle2, Sliders,
  Search, Car, Crosshair, Landmark, Flame, Stamp as StampIcon,
  UserCheck, Microscope, Cloud, Palette, Bell, Battery,
  Wifi, Signal, Smartphone, Monitor, ChevronRight, X, AlertTriangle,
  FileSpreadsheet, Zap, Volume2, ShieldCheck, Grid, Settings
} from 'lucide-react';
import { 
  OfficerProfile, OfficerAccount, OfficerRankLevel,
  isOfficerHighRank, isSupervisorOrAbove, ModuleAccessKey 
} from '../types';
import { DepartmentBrandingConfig } from '../utils/brandingStorage';
import { FirebaseSyncStatus } from '../services/firebaseRealtimeSync';
import { checkDirectRankClearance, hasActiveUnlockedSession } from '../utils/otpClearanceStorage';
import { HSPD_LOGO_URL } from '../assets/logo';

interface Props {
  currentOfficer: OfficerProfile;
  roster: OfficerAccount[];
  isDuty: boolean;
  dutyStartTime: number;
  activeNav: string;
  setActiveNav: (nav: any) => void;
  branding: DepartmentBrandingConfig;
  firebaseSync: FirebaseSyncStatus;
  pendingPinCount: number;
  authorityPin: string;
  onOpenDutyModal: () => void;
  onOpenBrandingModal: () => void;
  onOpenOtpModal: () => void;
  onOpenAuthorityPinModal: () => void;
  onOpenWebhookModal: () => void;
  onOpenPinAuditModal: () => void;
  onOpenExportAttendanceModal?: () => void;
  onLogout: () => void;
  viewMode: 'android' | 'desktop';
  onToggleViewMode: () => void;
  totalRecordsCount: number;
  totalDetectiveCasesCount: number;
  totalBoloCount: number;
}

export const AndroidMdtView: React.FC<Props> = ({
  currentOfficer,
  roster,
  isDuty,
  dutyStartTime,
  activeNav,
  setActiveNav,
  branding,
  firebaseSync,
  pendingPinCount,
  authorityPin,
  onOpenDutyModal,
  onOpenBrandingModal,
  onOpenOtpModal,
  onOpenAuthorityPinModal,
  onOpenWebhookModal,
  onOpenPinAuditModal,
  onOpenExportAttendanceModal,
  onLogout,
  viewMode,
  onToggleViewMode,
  totalRecordsCount,
  totalDetectiveCasesCount,
  totalBoloCount
}) => {
  const [isAppDrawerOpen, setIsAppDrawerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [batteryLevel, setBatteryLevel] = useState(95);

  const isHighRank = isOfficerHighRank(currentOfficer.rank);
  const isSupervisor = isSupervisorOrAbove(currentOfficer.rank);
  const hasFullAccess = isHighRank || isSupervisor;

  // Live time ticker for Android Status Bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format duty time
  const elapsedDutyMinutes = (isDuty && dutyStartTime > 0) ? Math.floor((Date.now() - dutyStartTime) / 60000) : 0;
  const elapsedDutyHours = Math.floor(elapsedDutyMinutes / 60);
  const remMinutes = elapsedDutyMinutes % 60;
  const dutyDurationStr = `${elapsedDutyHours > 0 ? `${elapsedDutyHours}j ` : ''}${remMinutes}m`;

  // All MDT Police Apps definitions for Android Grid Drawer
  const allApps = [
    { 
      id: 'calc', 
      title: 'Kalkulator Pasal', 
      desc: 'Denda, Waktu Kurungan & Tiket',
      icon: Calculator, 
      color: 'from-blue-600 to-indigo-700',
      badge: 'UTAMA',
      badgeColor: 'bg-blue-950 text-blue-300 border-blue-700'
    },
    { 
      id: 'dispatch', 
      title: 'CAD 911 & Panic', 
      desc: 'Panggilan Darurat & Peta Patroli',
      icon: Radio, 
      color: 'from-rose-600 to-red-800',
      moduleKey: 'DISPATCH' as ModuleAccessKey,
      badge: 'LIVE',
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-700'
    },
    { 
      id: 'traffic', 
      title: 'BOLO & Sitaan Kendaraan', 
      desc: `DPO Plat Nomor & Impound (${totalBoloCount})`,
      icon: Car, 
      color: 'from-amber-600 to-orange-700',
      moduleKey: 'BOLO' as ModuleAccessKey,
      badge: `${totalBoloCount} Aktif`,
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-700'
    },
    { 
      id: 'dmv', 
      title: 'Data Sipil & DMV', 
      desc: 'Cek KTP, SIM, Catatan & Sidik Jari',
      icon: UserCheck, 
      color: 'from-teal-600 to-emerald-700',
      moduleKey: 'DMV_CITIZEN' as ModuleAccessKey,
      badge: 'DATABASE',
      badgeColor: 'bg-teal-950 text-teal-300 border-teal-700'
    },
    { 
      id: 'detective', 
      title: 'Kasus Detektif', 
      desc: `Berkas & Investigasi (${totalDetectiveCasesCount})`,
      icon: Search, 
      color: 'from-purple-600 to-indigo-800',
      moduleKey: 'DETECTIVE' as ModuleAccessKey,
      badge: `${totalDetectiveCasesCount} Kasus`,
      badgeColor: 'bg-purple-950 text-purple-300 border-purple-700'
    },
    { 
      id: 'divisions', 
      title: 'Divisi Khusus HSPD', 
      desc: 'SWAT, DB, Traffic & K9 Unit',
      icon: Award, 
      color: 'from-cyan-600 to-blue-800',
      moduleKey: 'SPECIAL_DIVISIONS' as ModuleAccessKey
    },
    { 
      id: 'forensics', 
      title: 'Laboratorium Forensik', 
      desc: 'Uji Balistik, DNA & Zat Terlarang',
      icon: Microscope, 
      color: 'from-fuchsia-600 to-pink-800',
      moduleKey: 'FORENSICS' as ModuleAccessKey
    },
    { 
      id: 'documents', 
      title: 'Surat & Dokumen Resmi', 
      desc: 'SK, Surat Tugas, BAP & Izin Senjata',
      icon: StampIcon, 
      color: 'from-sky-600 to-cyan-800',
      moduleKey: 'OFFICIAL_DOCS' as ModuleAccessKey
    },
    { 
      id: 'vault', 
      title: 'Brankas & Audit Barang Bukti', 
      desc: 'Penyimpanan Senjata & Narkotika',
      icon: Landmark, 
      color: 'from-amber-700 to-yellow-800',
      moduleKey: 'VAULT' as ModuleAccessKey
    },
    { 
      id: 'destruction', 
      title: 'Peleburan Barang Bukti', 
      desc: 'Pemusnahan & Berita Acara',
      icon: Flame, 
      color: 'from-red-700 to-rose-900',
      moduleKey: 'DESTRUCTION' as ModuleAccessKey
    },
    { 
      id: 'megaphone', 
      title: 'Megaphone Studio', 
      desc: 'Perintah Pengejaran & Pengumuman /M',
      icon: Megaphone, 
      color: 'from-orange-600 to-amber-700'
    },
    { 
      id: 'rp', 
      title: 'Hak Miranda & RP Police', 
      desc: 'Teks RP, Miranda Rights & SOP',
      icon: BookOpen, 
      color: 'from-blue-700 to-indigo-900'
    },
    { 
      id: 'sop', 
      title: 'SOP & Kode 10 Kepolisian', 
      desc: 'Standar Operasional & Kode Radio',
      icon: Radio, 
      color: 'from-emerald-700 to-teal-900'
    },
    { 
      id: 'history', 
      title: 'Riwayat Penindakan', 
      desc: `Semua Log Penangkapan (${totalRecordsCount})`,
      icon: FileText, 
      color: 'from-gray-700 to-slate-800',
      moduleKey: 'CASE_HISTORY' as ModuleAccessKey,
      badge: `${totalRecordsCount} Log`,
      badgeColor: 'bg-gray-800 text-gray-300 border-gray-600'
    },
    ...(isHighRank ? [
      { 
        id: 'roster', 
        title: 'Roster Anggota Kepolisian', 
        desc: `Manajemen ${roster.length} Personel HSPD`,
        icon: Users, 
        color: 'from-amber-600 to-yellow-700',
        badge: 'COMMAND',
        badgeColor: 'bg-amber-950 text-amber-300 border-amber-600'
      }
    ] : []),
    { 
      id: 'settings', 
      title: 'Setting & Otoritas Komando', 
      desc: 'Branding, Webhook, OTP, PIN & Export Absen',
      icon: Settings, 
      color: 'from-amber-700 to-yellow-900',
      badge: 'SETTING',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-600'
    }
  ];

  const handleSelectApp = (id: string) => {
    setActiveNav(id);
    setIsAppDrawerOpen(false);
  };

  return (
    <div className="w-full">
      {/* 1. ANDROID TOP STATUS BAR */}
      <div className="bg-[#080B10] border-b border-gray-800/80 px-3 py-1 flex items-center justify-between text-[11px] font-mono text-gray-400 select-none">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-200">{currentTime || '12:00'}</span>
          <span className="text-gray-600">•</span>
          <span className="text-[10px] text-amber-400 font-bold tracking-tight">HSPD-MDT 5G</span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Cloud Database Sync Status */}
          <div className="flex items-center gap-1 text-[10px]" title="Firestore Cloud Real-time">
            <Cloud className={`w-3 h-3 ${firebaseSync.connected ? 'text-cyan-400' : 'text-gray-500'}`} />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="flex items-center gap-1 text-[10px] text-green-400">
            <Signal className="w-3 h-3" />
            <span>{branding.radioFreq || '91.4'}</span>
          </div>

          <div className="flex items-center gap-1 text-gray-300">
            <span className="text-[10px] font-bold">95%</span>
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* 2. ANDROID ACTION BAR (HEADER MOBILE) */}
      <div className="bg-[#121620] border-b border-gray-800 px-3 py-2 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <img
            src={branding.logoUrl || HSPD_LOGO_URL}
            alt="HSPD Crest"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-contain border border-amber-500/50 bg-black/60 p-0.5 shadow-sm"
          />
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-xs tracking-tight">
                {branding.departmentCode} <span className="text-amber-400">{branding.subTitle}</span>
              </span>
              <span className="text-[8px] bg-amber-950/80 text-amber-300 px-1 py-0.2 rounded border border-amber-700 font-mono font-bold">
                MOBILE MDT
              </span>
            </div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1">
              <span className="font-bold text-gray-200">{currentOfficer.name}</span>
              <span className="text-gray-600">•</span>
              <span className="text-amber-400 font-mono font-bold">{currentOfficer.badge}</span>
            </div>
          </div>
        </div>

        {/* Right Header Buttons on Mobile */}
        <div className="flex items-center gap-1.5">
          {/* Quick Duty Status Switch */}
          <button
            type="button"
            onClick={onOpenDutyModal}
            className={`px-2 py-1 rounded-lg border font-mono text-[11px] font-bold flex items-center gap-1 transition shadow-sm ${
              isDuty
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                : 'bg-rose-950/90 border-rose-500 text-rose-300 ring-1 ring-rose-500/40'
            }`}
            title="Ubah status tugas 10-8 / 10-7"
          >
            <Power className="w-3 h-3" />
            <span>{isDuty ? '10-8' : '10-7'}</span>
            {isDuty && <span className="text-[9px] text-emerald-200">({dutyDurationStr})</span>}
          </button>

          {/* Desktop/Android Switcher Toggle */}
          <button
            type="button"
            onClick={onToggleViewMode}
            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg border border-gray-700 transition"
            title="Beralih ke Tampilan Desktop Mode"
          >
            <Monitor className="w-4 h-4 text-blue-400" />
          </button>

          {/* All Apps Drawer Button */}
          <button
            type="button"
            onClick={() => setIsAppDrawerOpen(true)}
            className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-md shadow-blue-600/30 flex items-center justify-center"
            title="Buka Menu Aplikasi Police MDC (App Drawer)"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. ANDROID QUICK ACTION PILLS (HORIZONTAL SCROLLER) */}
      <div className="bg-[#0E121A] border-b border-gray-800/90 px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {/* Quick Drawer Button */}
        <button
          type="button"
          onClick={() => setIsAppDrawerOpen(true)}
          className="px-2.5 py-1 rounded-full bg-blue-950/80 border border-blue-700 text-blue-300 text-[10px] font-bold whitespace-nowrap flex items-center gap-1 shrink-0"
        >
          <Grid className="w-3 h-3" />
          <span>Semua Menu ({allApps.length})</span>
        </button>

        {/* CAD 911 Quick Pill */}
        <button
          type="button"
          onClick={() => setActiveNav('dispatch')}
          className={`px-2.5 py-1 rounded-full border text-[10px] font-bold whitespace-nowrap flex items-center gap-1 shrink-0 ${
            activeNav === 'dispatch'
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-gray-800/80 text-gray-300 border-gray-700'
          }`}
        >
          <Radio className="w-3 h-3 text-rose-400" />
          <span>CAD 911</span>
        </button>

        {/* BOLO Quick Pill */}
        <button
          type="button"
          onClick={() => setActiveNav('traffic')}
          className={`px-2.5 py-1 rounded-full border text-[10px] font-bold whitespace-nowrap flex items-center gap-1 shrink-0 ${
            activeNav === 'traffic'
              ? 'bg-amber-600 text-white border-amber-500'
              : 'bg-gray-800/80 text-gray-300 border-gray-700'
          }`}
        >
          <Car className="w-3 h-3 text-amber-400" />
          <span>BOLO ({totalBoloCount})</span>
        </button>

        {/* DMV Quick Pill */}
        <button
          type="button"
          onClick={() => setActiveNav('dmv')}
          className={`px-2.5 py-1 rounded-full border text-[10px] font-bold whitespace-nowrap flex items-center gap-1 shrink-0 ${
            activeNav === 'dmv'
              ? 'bg-teal-600 text-white border-teal-500'
              : 'bg-gray-800/80 text-gray-300 border-gray-700'
          }`}
        >
          <UserCheck className="w-3 h-3 text-teal-400" />
          <span>Sipil & DMV</span>
        </button>

        {/* Megaphone Quick Pill */}
        <button
          type="button"
          onClick={() => setActiveNav('megaphone')}
          className={`px-2.5 py-1 rounded-full border text-[10px] font-bold whitespace-nowrap flex items-center gap-1 shrink-0 ${
            activeNav === 'megaphone'
              ? 'bg-orange-600 text-white border-orange-500'
              : 'bg-gray-800/80 text-gray-300 border-gray-700'
          }`}
        >
          <Megaphone className="w-3 h-3 text-orange-400" />
          <span>Megaphone /M</span>
        </button>

        {/* Supervisor OTP Quick Pill */}
        {isSupervisor && (
          <button
            type="button"
            onClick={onOpenOtpModal}
            className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-600 text-amber-300 text-[10px] font-bold whitespace-nowrap flex items-center gap-1 shrink-0"
          >
            <KeyRound className="w-3 h-3 text-amber-400" />
            <span>Disposisi OTP</span>
          </button>
        )}

        {/* Supervisor & High Command: Log Tiket Reset PIN */}
        {isSupervisor && (
          <button
            type="button"
            onClick={onOpenPinAuditModal}
            className={`px-2.5 py-1 rounded-full border text-[10px] font-bold whitespace-nowrap flex items-center gap-1 shrink-0 transition ${
              pendingPinCount > 0 
                ? 'bg-amber-500 text-black border-amber-400 font-extrabold animate-pulse shadow-md shadow-amber-500/40' 
                : 'bg-amber-950/80 border-amber-700 text-amber-300'
            }`}
            title="Log Tiket Lupa PIN & Verifikasi Webhook"
          >
            <KeyRound className="w-3 h-3" />
            <span>LOG PIN {pendingPinCount > 0 ? `(${pendingPinCount} PENDING)` : ''}</span>
          </button>
        )}

        {/* High Rank Only: Webhook / Export */}
        {isHighRank && onOpenExportAttendanceModal && (
          <button
            type="button"
            onClick={onOpenExportAttendanceModal}
            className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-[10px] font-bold whitespace-nowrap flex items-center gap-1 shrink-0"
          >
            <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
            <span>Export Absen</span>
          </button>
        )}

        {/* Setting Quick Pill */}
        <button
          type="button"
          onClick={() => setActiveNav('settings')}
          className={`px-2.5 py-1 rounded-full border text-[10px] font-bold whitespace-nowrap flex items-center gap-1 shrink-0 ${
            activeNav === 'settings'
              ? 'bg-amber-600 text-white border-amber-500'
              : 'bg-amber-950/80 text-amber-300 border-amber-700'
          }`}
        >
          <Settings className="w-3 h-3 text-amber-400" />
          <span>Setting & Otoritas</span>
        </button>
      </div>

      {/* 4. ANDROID APP DRAWER MODAL / SHEET */}
      {isAppDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-150">
          <div className="bg-[#121622] border-t border-blue-900/60 rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Drawer Drag Indicator & Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#161B26]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Grid className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">POLICE MDT APP DRAWER</h3>
                  <p className="text-[10px] text-gray-400 font-mono">Pilih modul tugas kepolisian yang ingin dibuka</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAppDrawerOpen(false)}
                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Officer Quick Profile Banner inside Drawer */}
            <div className="px-4 py-2.5 bg-black/40 border-b border-gray-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-gray-400">Petugas:</span>
                <span className="font-bold text-white">{currentOfficer.name}</span>
                <span className="text-amber-400 font-bold">[{currentOfficer.badge}]</span>
              </div>
              <span className="text-[10px] text-blue-400 font-mono">{currentOfficer.rank}</span>
            </div>

            {/* Application Grid */}
            <div className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5 flex-1 font-mono">
              {allApps.map(app => {
                const Icon = app.icon;
                const isActive = activeNav === app.id;

                let isLocked = false;
                let hasOtpActive = false;
                if ((app as any).moduleKey) {
                  const clearance = checkDirectRankClearance((app as any).moduleKey, currentOfficer);
                  hasOtpActive = Boolean(hasActiveUnlockedSession((app as any).moduleKey, currentOfficer?.badge));
                  isLocked = !clearance.hasClearance && !hasOtpActive;
                }

                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleSelectApp(app.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 relative group ${
                      isActive
                        ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-900/30'
                        : isLocked
                          ? 'bg-gray-900/60 border-gray-800/80 opacity-75 hover:border-amber-700/50'
                          : 'bg-[#181E2C] border-gray-800 hover:border-gray-700 hover:bg-gray-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${app.color} text-white shadow-sm`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {isLocked ? (
                        <span className="text-[9px] bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded border border-amber-800 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" />
                          <span>LOCKED</span>
                        </span>
                      ) : app.badge ? (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${app.badgeColor || 'bg-gray-800 text-gray-300 border-gray-700'}`}>
                          {app.badge}
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <div className={`font-bold text-xs ${isActive ? 'text-blue-300' : 'text-white'}`}>
                        {app.title}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                        {app.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Command Actions in Drawer */}
            <div className="p-3 bg-[#0E121A] border-t border-gray-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleViewMode}
                  className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <Monitor className="w-3.5 h-3.5 text-blue-400" />
                  <span>Mode Desktop</span>
                </button>

                {hasFullAccess && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAppDrawerOpen(false);
                      onOpenBrandingModal();
                    }}
                    className="px-2.5 py-1.5 bg-amber-950/80 border border-amber-700 text-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    <span>Branding</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAppDrawerOpen(false);
                  onLogout();
                }}
                className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Ganti Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ANDROID FIXED BOTTOM NAVIGATION DOCK */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#10141D]/95 backdrop-blur-md border-t border-gray-800 px-2 py-1.5 flex items-center justify-around text-[10px] font-mono shadow-2xl">
        {/* Tab 1: Kalkulator */}
        <button
          type="button"
          onClick={() => setActiveNav('calc')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition min-w-[56px] ${
            activeNav === 'calc'
              ? 'text-blue-400 font-bold'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Calculator className={`w-5 h-5 mb-0.5 ${activeNav === 'calc' ? 'scale-110 text-blue-400' : ''}`} />
          <span>Kalkulator</span>
        </button>

        {/* Tab 2: CAD 911 Dispatch */}
        <button
          type="button"
          onClick={() => setActiveNav('dispatch')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition min-w-[56px] ${
            activeNav === 'dispatch'
              ? 'text-rose-400 font-bold'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Radio className={`w-5 h-5 mb-0.5 ${activeNav === 'dispatch' ? 'scale-110 text-rose-400' : ''}`} />
          <span>CAD 911</span>
        </button>

        {/* Tab 3: BOLO & Sitaan */}
        <button
          type="button"
          onClick={() => setActiveNav('traffic')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition min-w-[56px] ${
            activeNav === 'traffic'
              ? 'text-amber-400 font-bold'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Car className={`w-5 h-5 mb-0.5 ${activeNav === 'traffic' ? 'scale-110 text-amber-400' : ''}`} />
          <span>BOLO</span>
        </button>

        {/* Tab 4: Sipil DMV */}
        <button
          type="button"
          onClick={() => setActiveNav('dmv')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition min-w-[56px] ${
            activeNav === 'dmv'
              ? 'text-teal-400 font-bold'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <UserCheck className={`w-5 h-5 mb-0.5 ${activeNav === 'dmv' ? 'scale-110 text-teal-400' : ''}`} />
          <span>DMV</span>
        </button>

        {/* Tab 5: All Apps Menu / Drawer */}
        <button
          type="button"
          onClick={() => setIsAppDrawerOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg transition min-w-[56px] text-gray-400 hover:text-white group"
        >
          <div className="w-5 h-5 mb-0.5 rounded bg-blue-600/30 group-hover:bg-blue-600 flex items-center justify-center text-blue-300 group-hover:text-white transition">
            <Grid className="w-3.5 h-3.5" />
          </div>
          <span>Menu</span>
        </button>
      </div>
    </div>
  );
};
