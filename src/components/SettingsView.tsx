import React, { useState } from 'react';
import { OfficerProfile, isOfficerHighRank, isSupervisorOrAbove } from '../types';
import { DepartmentBrandingConfig } from '../utils/brandingStorage';
import { AuthorityPinConfig } from '../utils/authorityPin';
import { 
  Settings, Palette, KeyRound, Sliders, FileSpreadsheet, 
  Smartphone, Monitor, Shield, Radio, Sparkles, CheckCircle2, 
  Clock, Lock, Users, AlertTriangle, ExternalLink, RefreshCw, 
  Layers, HardDrive, Database, Bell, Terminal, Zap
} from 'lucide-react';
import { HSPD_LOGO_URL } from '../assets/logo';

interface Props {
  currentOfficer: OfficerProfile;
  roster: OfficerProfile[];
  branding: DepartmentBrandingConfig;
  authorityPinConfig: AuthorityPinConfig;
  pinTimeRemaining: { text: string; isExpiringSoon: boolean };
  pendingPinCount: number;
  onOpenBrandingModal: () => void;
  onOpenOtpModal: () => void;
  onOpenAuthorityPinModal: () => void;
  onOpenWebhookModal: () => void;
  onOpenPinAuditModal: () => void;
  onOpenExportAttendanceModal: () => void;
  onOpenRecruitmentPortalModal?: () => void;
  onToggleViewMode: () => void;
  isAndroidMode: boolean;
}

export const SettingsView: React.FC<Props> = ({
  currentOfficer,
  roster,
  branding,
  authorityPinConfig,
  pinTimeRemaining,
  pendingPinCount,
  onOpenBrandingModal,
  onOpenOtpModal,
  onOpenAuthorityPinModal,
  onOpenWebhookModal,
  onOpenPinAuditModal,
  onOpenExportAttendanceModal,
  onOpenRecruitmentPortalModal,
  onToggleViewMode,
  isAndroidMode
}) => {
  const isHighRank = isOfficerHighRank(currentOfficer.rank);
  const isSupervisor = isSupervisorOrAbove(currentOfficer.rank);
  const hasFullAccess = isHighRank || isSupervisor;

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. TOP HEADER & SCREENSHOT REPLICA GOLDEN TOOLBAR */}
      <div className="bg-[#121620] border border-gray-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>PENGATURAN SISTEM & OTORITAS KOMANDO</span>
                <span className="text-[10px] bg-amber-950 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-800 font-bold">
                  HIGH COMMAND & SUPERVISOR
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                Pusat kendali integrasi Discord Webhook, PIN Otoritas, Disposisi OTP, dan Personalisasi Branding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-[11px] font-mono text-gray-400">Otorisasi Petugas:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              isHighRank 
                ? 'bg-amber-950/80 text-amber-300 border-amber-700' 
                : isSupervisor
                  ? 'bg-blue-950/80 text-blue-300 border-blue-700'
                  : 'bg-gray-800 text-gray-300 border-gray-700'
            }`}>
              {isHighRank ? '★ HIGH COMMAND (FULL ACCESS)' : isSupervisor ? '🎖️ SUPERVISOR CLEARANCE' : 'POLICE PATROL'}
            </span>
          </div>
        </div>

        {/* --- EXACT SCREENSHOT AMBER / GOLD BUTTONS TOOLBAR --- */}
        <div className="bg-[#0B0D12] border border-amber-900/60 rounded-xl p-2.5 sm:p-3 shadow-inner">
          <div className="text-[10px] font-mono text-amber-400/80 mb-2 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" />
              TOOLBAR AKSES CEPAT KOMANDO (SESUAI DOKUMEN SISTEM):
            </span>
            <span className="text-[9px] text-gray-500">Klik tombol untuk mengeksekusi modul terkait</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1">
            {/* BUTTON 1: 🎨 👑 LOGO & BG */}
            <button
              id="btn-settings-logo-bg"
              type="button"
              onClick={onOpenBrandingModal}
              className="px-3.5 py-2.5 bg-[#17120A] hover:bg-[#241B0E] text-amber-300 border border-amber-600/80 hover:border-amber-400 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 shadow-md shadow-amber-950/40 group active:scale-95"
              title="Pengaturan Logo & Background Wallpaper (Full Access)"
            >
              <Palette className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition" />
              <div className="flex flex-col items-start text-left leading-tight">
                <span className="text-[10px] text-amber-400/90 font-normal flex items-center gap-1">👑 LOGO</span>
                <span className="font-bold">& BG</span>
              </div>
            </button>

            {/* BUTTON 2: 🔑 DISPOSISI OTP */}
            <button
              id="btn-settings-otp-disposition"
              type="button"
              onClick={onOpenOtpModal}
              className="px-3.5 py-2.5 bg-[#17120A] hover:bg-[#241B0E] text-amber-300 border border-amber-600/80 hover:border-amber-400 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 shadow-md shadow-amber-950/40 group active:scale-95"
              title="Disposisi Kode Akses Sekali Pakai (OTP) untuk Petugas Lapangan"
            >
              <KeyRound className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
              <div className="flex flex-col items-start text-left leading-tight">
                <span className="font-bold text-amber-300 tracking-wide">DISPOSISI</span>
                <span className="text-[10px] text-amber-400 font-normal">OTP</span>
              </div>
            </button>

            {/* BUTTON 3: 🔑 👑 PIN OTORITAS */}
            <button
              id="btn-settings-authority-pin"
              type="button"
              onClick={onOpenAuthorityPinModal}
              className="px-3.5 py-2.5 bg-[#17120A] hover:bg-[#241B0E] text-amber-300 border border-amber-600/80 hover:border-amber-400 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 shadow-md shadow-amber-950/40 group active:scale-95"
              title="Kelola PIN Otoritas Pembuka Berkas (Rotasi Otomatis / Manual)"
            >
              <KeyRound className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition" />
              <div className="flex flex-col items-start text-left leading-tight">
                <span className="text-[10px] text-amber-400/90 font-normal flex items-center gap-1">👑 PIN</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-wider">OTORITAS: {authorityPinConfig.currentPin}</span>
                  <span className="text-[9px] bg-black/60 px-1 py-0.2 rounded text-amber-200 border border-amber-700/60">
                    {pinTimeRemaining.text}
                  </span>
                </div>
              </div>
            </button>

            {/* BUTTON 4: 🎛️ 👑 WEBHOOK */}
            <button
              id="btn-settings-webhook"
              type="button"
              onClick={onOpenWebhookModal}
              className="px-3.5 py-2.5 bg-[#17120A] hover:bg-[#241B0E] text-amber-300 border border-amber-600/80 hover:border-amber-400 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 shadow-md shadow-amber-950/40 group active:scale-95"
              title="Pengaturan Integrasi Discord Webhook (High Command)"
            >
              <Sliders className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
              <div className="flex flex-col items-start text-left leading-tight">
                <span className="text-[10px] text-amber-400/90 font-normal flex items-center gap-1">👑</span>
                <span className="font-bold">WEBHOOK</span>
              </div>
            </button>

            {/* BUTTON 5: 🔑 👑 LOG PIN */}
            <button
              id="btn-settings-log-pin"
              type="button"
              onClick={onOpenPinAuditModal}
              className={`px-3.5 py-2.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 shadow-md group active:scale-95 ${
                pendingPinCount > 0
                  ? 'bg-amber-500 text-black border border-amber-400 font-extrabold animate-pulse shadow-amber-500/50'
                  : 'bg-[#17120A] hover:bg-[#241B0E] text-amber-300 border border-amber-600/80 hover:border-amber-400 shadow-amber-950/40'
              }`}
              title="Audit Log Permohonan Reset PIN & Otorisasi Webhook Discord"
            >
              <KeyRound className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
              <div className="flex flex-col items-start text-left leading-tight">
                <span className="text-[10px] font-normal flex items-center gap-1">👑 LOG</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold">PIN</span>
                  {pendingPinCount > 0 && (
                    <span className="px-1 py-0.2 bg-black text-amber-300 text-[9px] rounded font-bold">
                      {pendingPinCount}
                    </span>
                  )}
                </div>
              </div>
            </button>

            {/* BUTTON 6: 👑 PORTAL REKRUTMEN */}
            <button
              id="btn-settings-recruitment-portal"
              type="button"
              onClick={onOpenRecruitmentPortalModal}
              className="px-3.5 py-2.5 bg-[#17120A] hover:bg-[#241B0E] text-amber-300 border border-amber-600/80 hover:border-amber-400 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 shadow-md shadow-amber-950/40 group active:scale-95"
              title="Pengaturan Portal Informasi & Penerimaan Anggota Depan (High Command)"
            >
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition" />
              <div className="flex flex-col items-start text-left leading-tight">
                <span className="text-[10px] text-amber-400/90 font-normal flex items-center gap-1">👑 PORTAL</span>
                <span className="font-bold">REKRUTMEN</span>
              </div>
            </button>

            {/* EXTRA ACTION: EXPORT ATTENDANCE */}
            <button
              id="btn-settings-export-absen"
              type="button"
              onClick={onOpenExportAttendanceModal}
              className="px-3.5 py-2.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/80 hover:border-emerald-400 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 shadow-md shadow-emerald-950/40 group active:scale-95"
              title="Ekspor Rekap Absensi & Jam Dinas Petugas (Excel/CSV/Print)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
              <div className="flex flex-col items-start text-left leading-tight">
                <span className="text-[10px] text-emerald-400/90 font-normal">REKAP</span>
                <span className="font-bold">ABSENSI</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 2. DETAILED CONFIGURATION CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* CARD 1: LOGO & BRANDING */}
        <div className="bg-[#121620] border border-gray-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-amber-700/60 transition shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-700/70 text-amber-400">
                  <Palette className="w-4 h-4" />
                </div>
                <span className="font-bold text-gray-100 text-sm">Logo & Wallpaper</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold">
                BRANDING
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Kustomisasi logo resmi kesatuan, wallpaper latar belakang, nama departemen, teks badge CAD, dan frekuensi radio.
            </p>
            <div className="p-2.5 bg-black/40 rounded-lg border border-gray-800 flex items-center gap-3 text-[11px] font-mono">
              <img 
                src={branding.logoUrl || HSPD_LOGO_URL} 
                alt="Logo" 
                className="w-8 h-8 rounded-full border border-amber-500/40 p-0.5 bg-black/60 object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <div className="text-gray-200 font-bold truncate">{branding.departmentName}</div>
                <div className="text-gray-400 text-[10px]">Freq Radio: <span className="text-emerald-400 font-bold">{branding.radioFreq}</span></div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenBrandingModal}
            className="w-full py-2 bg-amber-950/70 hover:bg-amber-900 border border-amber-600 text-amber-300 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>BUKA PENGATURAN BRANDING</span>
          </button>
        </div>

        {/* CARD 2: DISPOSISI KODE OTP */}
        <div className="bg-[#121620] border border-gray-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-amber-700/60 transition shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-700/70 text-amber-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <span className="font-bold text-gray-100 text-sm">Disposisi Kode OTP</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono font-bold">
                CLEARANCE
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Generate kode OTP akses sementara (15-60 menit) untuk petugas membuka modul sensitif (Brankas, Forensik, Detektif).
            </p>
            <div className="p-2.5 bg-black/40 rounded-lg border border-gray-800 space-y-1 text-[11px] font-mono text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-500">Generator:</span>
                <span className="text-amber-300 font-bold">Supervisor & Command</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Masa Berlaku:</span>
                <span className="text-emerald-400">1x Pakai / Kadaluarsa</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenOtpModal}
            className="w-full py-2 bg-gradient-to-r from-amber-950/80 to-amber-900/80 hover:from-amber-900 hover:to-amber-800 border border-amber-500 text-amber-300 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>DISPOSISI KODE OTP BARU</span>
          </button>
        </div>

        {/* CARD 3: PIN OTORITAS KOMANDO */}
        <div className="bg-[#121620] border border-gray-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-amber-700/60 transition shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-700/70 text-amber-400">
                  <Lock className="w-4 h-4" />
                </div>
                <span className="font-bold text-gray-100 text-sm">PIN Otoritas Komando</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
                {pinTimeRemaining.text}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              PIN pengaman utama untuk otorisasi brankas barang bukti, peleburan, dan dokumen komando berotasi otomatis setiap 1 jam.
            </p>
            <div className="p-2.5 bg-black/40 rounded-lg border border-gray-800 flex items-center justify-between text-[11px] font-mono">
              <span className="text-gray-400">PIN Aktif Saat Ini:</span>
              <span className="text-amber-300 font-extrabold text-sm tracking-widest bg-black px-2 py-0.5 rounded border border-amber-700/60">
                {authorityPinConfig.currentPin}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAuthorityPinModal}
            className="w-full py-2 bg-amber-950/70 hover:bg-amber-900 border border-amber-600 text-amber-300 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>KELOLA & ROTASI PIN</span>
          </button>
        </div>

        {/* CARD 4: DISCORD WEBHOOK INTEGRATION */}
        <div className="bg-[#121620] border border-gray-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-blue-700/60 transition shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-950/70 border border-blue-700/70 text-blue-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <span className="font-bold text-gray-100 text-sm">Discord Webhook</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono font-bold">
                DISCORD BOT
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Integrasikan endpoint Webhook Discord untuk pengiriman log penangkapan, duty report 10-8/10-7 beserta bukti foto, panic button, & audit PIN.
            </p>
            <div className="p-2.5 bg-black/40 rounded-lg border border-gray-800 space-y-1 text-[11px] font-mono text-gray-400">
              <div className="flex justify-between">
                <span>Multi-Channel Webhook:</span>
                <span className="text-emerald-400 font-bold">Aktif</span>
              </div>
              <div className="flex justify-between">
                <span>Lampiran Foto Dinas:</span>
                <span className="text-emerald-400 font-bold">Multipart Upload</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenWebhookModal}
            className="w-full py-2 bg-blue-950/70 hover:bg-blue-900 border border-blue-600 text-blue-300 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>KONFIGURASI WEBHOOK</span>
          </button>
        </div>

        {/* CARD 5: LOG & AUDIT RESET PIN PETUGAS */}
        <div className="bg-[#121620] border border-gray-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-amber-700/60 transition shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-700/70 text-amber-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <span className="font-bold text-gray-100 text-sm">Audit Reset PIN Petugas</span>
              </div>
              {pendingPinCount > 0 ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono font-bold animate-pulse">
                  {pendingPinCount} PENDING
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 font-mono">
                  0 PENDING
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Daftar permohonan pemulihan PIN login petugas kepolisian. Supervisor dan High Rank dapat memverifikasi dan menyetujui reset PIN.
            </p>
            <div className="p-2.5 bg-black/40 rounded-lg border border-gray-800 space-y-1 text-[11px] font-mono text-gray-400">
              <div className="flex justify-between">
                <span>Notifikasi Real-time:</span>
                <span className="text-emerald-400 font-bold">Aktif</span>
              </div>
              <div className="flex justify-between">
                <span>Audit Trail:</span>
                <span className="text-blue-300 font-bold">Tercatat</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenPinAuditModal}
            className={`w-full py-2 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2 ${
              pendingPinCount > 0
                ? 'bg-amber-500 hover:bg-amber-400 text-black border border-amber-400 animate-pulse font-extrabold'
                : 'bg-amber-950/70 hover:bg-amber-900 border border-amber-600 text-amber-300'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>BUKA LOG TIKET PIN {pendingPinCount > 0 ? `(${pendingPinCount})` : ''}</span>
          </button>
        </div>

        {/* CARD 6: EKSPOR REKAP ABSENSI MINGGUAN */}
        <div className="bg-[#121620] border border-gray-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-emerald-700/60 transition shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-700/70 text-emerald-400">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <span className="font-bold text-gray-100 text-sm">Rekap Absensi Dinas</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
                LAPORAN
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Ekspor rekapitulasi data jam dinas seluruh personel ({roster.length} Personel) ke format Excel (.xlsx), CSV, ZIP, atau Cetak Dokumen Resmi.
            </p>
            <div className="p-2.5 bg-black/40 rounded-lg border border-gray-800 space-y-1 text-[11px] font-mono text-gray-400">
              <div className="flex justify-between">
                <span>Format Didukung:</span>
                <span className="text-emerald-400 font-bold">Excel, CSV, Print</span>
              </div>
              <div className="flex justify-between">
                <span>Filter Shift:</span>
                <span className="text-blue-300 font-bold">Mingguan / Bulanan</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenExportAttendanceModal}
            className="w-full py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>BUKA EKSPORTIR ABSENSI</span>
          </button>
        </div>

        {/* CARD 7: PORTAL INFORMASI & REKRUTMEN */}
        <div className="bg-[#121620] border border-gray-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-amber-700/60 transition shadow-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-700/70 text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-bold text-gray-100 text-sm">Portal Rekrutmen Depan</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold">
                POLICE ACADEMY
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Kelola teks pengumuman, status buka/tutup pendaftaran, syarat IC/OOC, tahapan seleksi akademi, dan divisi kepolisian yang tampil di halaman login depan.
            </p>
            <div className="p-2.5 bg-black/40 rounded-lg border border-gray-800 space-y-1 text-[11px] font-mono text-gray-400">
              <div className="flex justify-between">
                <span>Otorisasi Akses:</span>
                <span className="text-amber-300 font-bold">Atasan / High Command</span>
              </div>
              <div className="flex justify-between">
                <span>Pratinjau:</span>
                <span className="text-emerald-400 font-bold">Live Synchronized</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenRecruitmentPortalModal}
            className="w-full py-2 bg-gradient-to-r from-amber-950/90 to-amber-900/90 hover:from-amber-900 hover:to-amber-800 border border-amber-500 text-amber-300 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2 shadow-md shadow-amber-950/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>BUKA PENGATURAN PORTAL REKRUTMEN</span>
          </button>
        </div>
      </div>

      {/* 3. VIEW MODE SWITCHER & RUNTIME ENVIRONMENT INFO */}
      <div className="bg-[#121620] border border-gray-800 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-950/70 border border-blue-700/70 text-blue-400">
            {isAndroidMode ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <span>Mode Tampilan Interface:</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                isAndroidMode ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-blue-950 text-blue-300 border-blue-700'
              }`}>
                {isAndroidMode ? '📱 ANDROID MOBILE MDT' : '🖥️ DESKTOP POLICE CAD'}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              {isAndroidMode 
                ? 'Mode Android dioptimalkan untuk layar ponsel dengan App Drawer, bottom dock, & sentuhan jari responsif.' 
                : 'Mode Desktop dioptimalkan untuk monitor komputer dengan multi-tab navigation dan dense layout.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleViewMode}
          className={`px-4 py-2.5 rounded-xl border text-xs font-bold font-mono transition flex items-center gap-2 shadow-md shrink-0 ${
            isAndroidMode
              ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
          }`}
        >
          {isAndroidMode ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          <span>GANTI KE {isAndroidMode ? 'MODE DESKTOP' : 'MODE ANDROID'}</span>
        </button>
      </div>
    </div>
  );
};
