import React, { useState, useEffect } from 'react';
import { OfficerProfile, OfficerAccount, isOfficerHighRank, isSupervisorOrAbove } from '../types';
import { DepartmentBrandingConfig } from '../utils/brandingStorage';
import { AuthorityPinConfig } from '../utils/authorityPin';
import { 
  Settings, Palette, KeyRound, Sliders, FileSpreadsheet, 
  Smartphone, Monitor, Shield, Radio, Sparkles, CheckCircle2, 
  Clock, Lock, Users, AlertTriangle, ExternalLink, RefreshCw, 
  Layers, HardDrive, Database, Bell, Terminal, Zap, Bot,
  Save, Upload, Image, Link, Check, Send, Maximize2, Minimize2,
  Eye, EyeOff, ShieldAlert, UserPlus, UserCheck, ChevronRight,
  MessageSquare, UserX, Award, HelpCircle, CheckCheck, Play, Square
} from 'lucide-react';
import { HSPD_LOGO_URL } from '../assets/logo';
import { 
  getSavedPinResetWebhookConfig, 
  savePinResetWebhookConfig, 
  saveRosterWebhookConfig,
  testPinResetDiscordWebhook,
  WebhookConfig,
  DEFAULT_PIN_RESET_WEBHOOK_URL,
  PRESET_DISCORD_BOT_LOGOS,
  getSavedDiscordBotConfig,
  saveDiscordBotConfig,
  DiscordBotConfig,
  getDiscordBotGatewayStatus,
  startDiscordBotGateway,
  stopDiscordBotGateway,
  sendOfficerDirectMessageViaBot
} from '../utils/discordWebhook';
import { BatchPinBroadcastModal } from './BatchPinBroadcastModal';

interface Props {
  currentOfficer: OfficerProfile;
  roster: OfficerAccount[] | OfficerProfile[];
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
  onNavigateToTab?: (tab: string) => void;
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
  isAndroidMode,
  onNavigateToTab
}) => {
  const isHighRank = isOfficerHighRank(currentOfficer.rank);
  const isSupervisor = isSupervisorOrAbove(currentOfficer.rank);

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'display_screen' | 'bot_pm' | 'roster_mgmt' | 'security_auth' | 'branding'
  >('all');

  // Batch PIN Broadcast Modal State
  const [isBatchPinModalOpen, setIsBatchPinModalOpen] = useState(false);

  // ==========================================
  // 1. PENGATURAN TAMPILAN & SKALA LAYAR
  // ==========================================
  const [modalDisplayPref, setModalDisplayPref] = useState<'normal' | 'spacious' | 'fullscreen'>(() => {
    try {
      return (localStorage.getItem('hspd_display_modal_preference') as any) || 'normal';
    } catch {
      return 'normal';
    }
  });

  const [uiDensity, setUiDensity] = useState<'compact' | 'balanced' | 'spacious'>(() => {
    try {
      return (localStorage.getItem('hspd_ui_density') as any) || 'balanced';
    } catch {
      return 'balanced';
    }
  });

  const [avatarScale, setAvatarScale] = useState<'small' | 'medium' | 'large'>(() => {
    try {
      return (localStorage.getItem('hspd_avatar_display_size') as any) || 'medium';
    } catch {
      return 'medium';
    }
  });

  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsNativeFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsNativeFullscreen(true);
      }).catch((err) => {
        console.warn('Fullscreen denied:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsNativeFullscreen(false);
        }).catch((err) => {
          console.warn('Exit fullscreen failed:', err);
        });
      }
    }
  };

  const handleSaveModalDisplayPref = (val: 'normal' | 'spacious' | 'fullscreen') => {
    setModalDisplayPref(val);
    try {
      localStorage.setItem('hspd_display_modal_preference', val);
      window.dispatchEvent(new Event('hspd-display-settings-changed'));
    } catch {}
  };

  const handleSaveUiDensity = (val: 'compact' | 'balanced' | 'spacious') => {
    setUiDensity(val);
    try {
      localStorage.setItem('hspd_ui_density', val);
      window.dispatchEvent(new Event('hspd-display-settings-changed'));
    } catch {}
  };

  const handleSaveAvatarScale = (val: 'small' | 'medium' | 'large') => {
    setAvatarScale(val);
    try {
      localStorage.setItem('hspd_avatar_display_size', val);
      window.dispatchEvent(new Event('hspd-display-settings-changed'));
    } catch {}
  };

  // ==========================================
  // 2. DISCORD BOT PM & EMBED CONFIGURATION
  // ==========================================
  const [botConfig, setBotConfig] = useState<DiscordBotConfig>(() => getSavedDiscordBotConfig());
  const [showBotToken, setShowBotToken] = useState(false);
  const [isSavingBotConfig, setIsSavingBotConfig] = useState(false);
  const [isBotGatewayOnline, setIsBotGatewayOnline] = useState<boolean | null>(null);
  const [botGatewayInfo, setBotGatewayInfo] = useState<any>(null);
  const [isTogglingBotGateway, setIsTogglingBotGateway] = useState(false);
  const [botNotice, setBotNotice] = useState<{ success: boolean; message: string } | null>(null);
  const [testDmUserId, setTestDmUserId] = useState('');
  const [isSendingTestDm, setIsSendingTestDm] = useState(false);

  // Check bot gateway status on mount
  useEffect(() => {
    getDiscordBotGatewayStatus().then(res => {
      setIsBotGatewayOnline(res.isOnline);
      setBotGatewayInfo(res);
    }).catch(() => {
      setIsBotGatewayOnline(false);
    });
  }, []);

  const handleSaveBotConfig = () => {
    setIsSavingBotConfig(true);
    try {
      saveDiscordBotConfig(botConfig);
      setBotNotice({
        success: true,
        message: '✅ Konfigurasi Discord Bot PM berhasil disimpan dan diterapkan!'
      });
      setTimeout(() => setBotNotice(null), 5000);
    } catch (e: any) {
      setBotNotice({
        success: false,
        message: `Gagal menyimpan konfigurasi bot: ${e.message}`
      });
    }
    setIsSavingBotConfig(false);
  };

  const handleToggleBotGateway = async () => {
    setIsTogglingBotGateway(true);
    setBotNotice(null);
    try {
      if (isBotGatewayOnline) {
        const res = await stopDiscordBotGateway();
        setIsBotGatewayOnline(false);
        setBotNotice({
          success: res.success,
          message: res.message || 'Bot Gateway berhasil dinonaktifkan (Offline).'
        });
      } else {
        const res = await startDiscordBotGateway(botConfig.botToken);
        setIsBotGatewayOnline(res.success);
        setBotNotice({
          success: res.success,
          message: res.message || (res.success ? '⚡ Bot Gateway Discord BERHASIL MENYALA (ONLINE HIJAU)!' : 'Gagal menyalakan bot.')
        });
      }
      setTimeout(() => setBotNotice(null), 6000);
    } catch (e: any) {
      setBotNotice({
        success: false,
        message: `Error gateway bot: ${e.message}`
      });
    }
    setIsTogglingBotGateway(false);
  };

  const handleSendTestDm = async () => {
    if (!testDmUserId.trim()) {
      setBotNotice({
        success: false,
        message: 'Masukkan Discord User ID target (angka numerik) untuk menguji kiriman PM.'
      });
      return;
    }
    setIsSendingTestDm(true);
    setBotNotice(null);
    try {
      const res = await sendOfficerDirectMessageViaBot({
        discordUserId: testDmUserId.trim(),
        officerName: currentOfficer.name,
        officerBadge: currentOfficer.badge,
        officerRank: currentOfficer.rank,
        officerDivision: 'HQ High Command',
        pin: '10-4',
        customBotToken: botConfig.botToken,
        botName: botConfig.botName,
        botAvatar: botConfig.botAvatar,
        embedTitle: botConfig.embedTitle,
        embedDescription: botConfig.embedDescription,
        embedColor: botConfig.embedColor,
        footerText: botConfig.footerText,
        customNote: botConfig.defaultNote,
        messageType: 'custom_chat',
        customMessage: `[UJI COBA SISTEM SETTING & OTORITAS]\nIni adalah pesan uji coba dari atasan ${currentOfficer.rank} ${currentOfficer.name}. Konfigurasi Discord Bot PM berfungsi 100% normal dan siap digunakan!`
      });
      setBotNotice({
        success: res.success,
        message: res.message
      });
      setTimeout(() => setBotNotice(null), 8000);
    } catch (e: any) {
      setBotNotice({
        success: false,
        message: `Gagal mengirim tes PM: ${e.message}`
      });
    }
    setIsSendingTestDm(false);
  };

  const handleResetBotDefault = () => {
    setBotConfig({
      botToken: botConfig.botToken, // retain token if already typed
      botName: 'Cek Akun | High State',
      botAvatar: 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
      defaultNote: 'Jangan beritahu informasi ini kepada orang lain!',
      embedTitle: '✅ Berhasil!',
      embedDescription: 'Berikut adalah detail dari akun UCP Anda:',
      embedColor: '#00A8FF',
      footerText: 'Bot High State'
    });
    setBotNotice({
      success: true,
      message: 'Format Embed & Nama Bot PM dikembalikan ke default preset High State. Klik "Simpan Pengaturan Bot" untuk menerapkan.'
    });
    setTimeout(() => setBotNotice(null), 4000);
  };

  // ==========================================
  // 3. WEBHOOK PENGIRIMAN PIN AKUN & AUDIT
  // ==========================================
  const [pinWebhookConfig, setPinWebhookConfig] = useState<WebhookConfig>(() => getSavedPinResetWebhookConfig());
  const [isSavingPinWebhook, setIsSavingPinWebhook] = useState(false);
  const [isTestingPinWebhook, setIsTestingPinWebhook] = useState(false);
  const [pinWebhookNotice, setPinWebhookNotice] = useState<{ success: boolean; message: string } | null>(null);

  const handleSavePinWebhook = () => {
    setIsSavingPinWebhook(true);
    try {
      savePinResetWebhookConfig(pinWebhookConfig);
      saveRosterWebhookConfig(pinWebhookConfig);
      setPinWebhookNotice({
        success: true,
        message: '✅ Webhook pengiriman PIN akun & Roster berhasil disimpan dan disinkronkan ke database!'
      });
      setTimeout(() => setPinWebhookNotice(null), 5000);
    } catch (e: any) {
      setPinWebhookNotice({
        success: false,
        message: `Gagal menyimpan webhook: ${e.message}`
      });
    }
    setIsSavingPinWebhook(false);
  };

  const handleTestPinWebhook = async () => {
    setIsTestingPinWebhook(true);
    setPinWebhookNotice(null);
    try {
      const res = await testPinResetDiscordWebhook(pinWebhookConfig);
      setPinWebhookNotice({
        success: res.success,
        message: res.message
      });
      setTimeout(() => setPinWebhookNotice(null), 6000);
    } catch (err: any) {
      setPinWebhookNotice({
        success: false,
        message: `Error pengujian: ${err.message || 'Koneksi gagal'}`
      });
    }
    setIsTestingPinWebhook(false);
  };

  const handleResetPinWebhookDefault = () => {
    setPinWebhookConfig(prev => ({
      ...prev,
      webhookUrl: DEFAULT_PIN_RESET_WEBHOOK_URL
    }));
    setPinWebhookNotice({
      success: true,
      message: 'URL Webhook PIN dikembalikan ke endpoint default HSPD HQ. Klik Simpan untuk memperbarui.'
    });
    setTimeout(() => setPinWebhookNotice(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
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
                Pusat kendali pengaturan seluruh fitur, Discord Bot PM, skala layar, PIN Otoritas, Disposisi OTP, dan Branding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <span className="text-[11px] font-mono text-gray-400">Otorisasi Petugas:</span>
            <span className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold border ${
              isHighRank 
                ? 'bg-amber-950/80 text-amber-300 border-amber-700' 
                : isSupervisor
                  ? 'bg-blue-950/80 text-blue-300 border-blue-700'
                  : 'bg-gray-800 text-gray-300 border-gray-700'
            }`}>
              {isHighRank ? '★ HIGH COMMAND (FULL ACCESS)' : isSupervisor ? '🎖️ SUPERVISOR CLEARANCE' : 'POLICE PATROL'}
            </span>

            {/* Quick Fullscreen Button */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="px-2.5 py-1 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-200 border border-gray-700 text-[10.5px] font-mono flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Aktifkan / Matikan Tampilan Layar Penuh Native (F11)"
            >
              {isNativeFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-sky-400" />}
              <span>{isNativeFullscreen ? 'Layar Biasa' : 'Layar Penuh'}</span>
            </button>
          </div>
        </div>

        {/* --- SCREENSHOT AMBER / GOLD QUICK ACCESS TOOLBAR --- */}
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
              className="px-3.5 py-2.5 bg-[#17120A] hover:bg-[#241B0E] text-amber-300 border border-amber-600/80 hover:border-amber-400 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 shadow-md shadow-amber-950/40 group active:scale-95 cursor-pointer"
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
              className="px-3.5 py-2.5 bg-[#17120A] hover:bg-[#241B0E] text-amber-300 border border-amber-600/80 hover:border-amber-400 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 shadow-md shadow-amber-950/40 group active:scale-95 cursor-pointer"
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
              className="px-3.5 py-2.5 bg-[#17120A] hover:bg-[#241B0E] text-amber-300 border border-amber-600/80 hover:border-amber-400 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 shadow-md shadow-amber-950/40 group active:scale-95 cursor-pointer"
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

            {/* BUTTON 4: 🎛️ 👑 WEBHOOK + SETTINGS UNTUK MERUBAH WEBHOOK */}
            <div className="flex items-center -space-x-px shrink-0">
              <button
                id="btn-settings-webhook"
                type="button"
                onClick={onOpenWebhookModal}
                className="px-3 py-2.5 bg-[#17120A] hover:bg-[#241B0E] text-amber-300 border border-amber-600/80 hover:border-amber-400 rounded-l-lg text-xs font-bold font-mono transition flex items-center gap-2 shadow-md shadow-amber-950/40 group active:scale-95 cursor-pointer"
                title="Buka 14 Tab Integrasi Discord Webhook Studio (High Command)"
              >
                <Sliders className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                <div className="flex flex-col items-start text-left leading-tight">
                  <span className="text-[10px] text-amber-400/90 font-normal flex items-center gap-1">👑</span>
                  <span className="font-bold">WEBHOOK</span>
                </div>
              </button>
              <button
                id="btn-settings-webhook-config"
                type="button"
                onClick={() => {
                  const el = document.getElementById('section-pin-webhook');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    el.classList.add('ring-2', 'ring-amber-400');
                    setTimeout(() => el.classList.remove('ring-2', 'ring-amber-400'), 2500);
                  } else {
                    onOpenWebhookModal();
                  }
                }}
                className="p-2.5 bg-[#1f170c] hover:bg-[#2e2110] text-amber-300 border-y border-r border-amber-600/80 hover:border-amber-400 rounded-r-lg text-xs font-bold font-mono transition flex items-center justify-center shadow-md shadow-amber-950/40 group active:scale-95 cursor-pointer"
                title="Settings untuk merubah webhook di Pengaturan Sistem & Otoritas Komando"
              >
                <Settings className="w-4 h-4 text-amber-400 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* BUTTON 5: 🔑 👑 LOG PIN */}
            <button
              id="btn-settings-log-pin"
              type="button"
              onClick={onOpenPinAuditModal}
              className={`px-3.5 py-2.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 shadow-md group active:scale-95 cursor-pointer ${
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
              className="px-3.5 py-2.5 bg-[#17120A] hover:bg-[#241B0E] text-amber-300 border border-amber-600/80 hover:border-amber-400 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 shadow-md shadow-amber-950/40 group active:scale-95 cursor-pointer"
              title="Pengaturan Portal Informasi & Penerimaan Anggota Depan (High Command)"
            >
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition" />
              <div className="flex flex-col items-start text-left leading-tight">
                <span className="text-[10px] text-amber-400/90 font-normal flex items-center gap-1">👑 PORTAL</span>
                <span className="font-bold">REKRUTMEN</span>
              </div>
            </button>

            {/* BUTTON 7: ⚡ 👑 SEKALI KIRIM PIN BOT SEMUA AKUN */}
            <button
              id="btn-settings-batch-pin-bot"
              type="button"
              onClick={() => setIsBatchPinModalOpen(true)}
              className="px-3.5 py-2.5 bg-gradient-to-r from-sky-950 to-blue-950 hover:from-sky-900 hover:to-blue-900 text-sky-300 border border-sky-500/80 hover:border-sky-400 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 shadow-md shadow-sky-950/40 group active:scale-95 cursor-pointer"
              title="Sekali Kirim PIN Bot Login MDT ke Semua Akun Personel via Discord PM"
            >
              <Zap className="w-4 h-4 text-sky-400 group-hover:scale-110 transition animate-pulse" />
              <div className="flex flex-col items-start text-left leading-tight">
                <span className="text-[10px] text-sky-400/90 font-normal flex items-center gap-1">👑 SEKALI KIRIM</span>
                <span className="font-bold text-sky-200">PIN BOT ({roster.length} AKUN)</span>
              </div>
            </button>

            {/* EXTRA ACTION: EXPORT ATTENDANCE */}
            <button
              id="btn-settings-export-absen"
              type="button"
              onClick={onOpenExportAttendanceModal}
              className="px-3.5 py-2.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/80 hover:border-emerald-400 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 shrink-0 shadow-md shadow-emerald-950/40 group active:scale-95 cursor-pointer"
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

        {/* NAVIGATION CATEGORY TABS */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-gray-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'all'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-gray-900 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <span>🌟 Semua Pengaturan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('display_screen')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'display_screen'
                ? 'bg-sky-500 text-black shadow-md shadow-sky-500/20'
                : 'bg-gray-900 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>🖥️ Layar & Ukuran Tampilan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('bot_pm')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'bot_pm'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'bg-gray-900 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>🤖 Discord Bot PM & Webhook</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('roster_mgmt')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'roster_mgmt'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'bg-gray-900 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>👥 Roster & Disiplin Personel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('security_auth')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'security_auth'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                : 'bg-gray-900 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>🛡️ Keamanan, PIN & OTP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('branding')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeCategory === 'branding'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-gray-900 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>🎨 Branding & Portal</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: PENGATURAN TAMPILAN & SKALA LAYAR (FULL SCREEN / NORMAL)        */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'display_screen') && (
        <div id="section-screen-display-settings" className="bg-[#121620] border border-sky-800/70 rounded-xl p-4 sm:p-5 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-600/60 flex items-center justify-center text-sky-400">
                <Maximize2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    PENGATURAN UKURAN & SKALA TAMPILAN (FULL SCREEN & PROPORSI GAMBAR)
                  </h3>
                  <span className="text-[10px] bg-sky-950 text-sky-300 font-mono px-2 py-0.5 rounded border border-sky-700 font-bold">
                    RESPONSIF
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono">
                  Atur ukuran jendela pop-up modal, kepadatan tata letak, rasio gambar/foto, serta mode layar penuh agar nyaman dipandang
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 shadow-md shrink-0 active:scale-95 cursor-pointer ${
                isNativeFullscreen
                  ? 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-400 shadow-amber-950'
                  : 'bg-sky-600 hover:bg-sky-500 text-white border border-sky-400 shadow-sky-950'
              }`}
            >
              {isNativeFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{isNativeFullscreen ? 'TUTUP LAYAR PENUH (NORMAL)' : 'AKTIFKAN LAYAR PENUH (FULLSCREEN)'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Setting 1: Skala Pop-up Modal */}
            <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-200 uppercase flex items-center gap-1.5 font-mono">
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                  <span>Ukuran Jendela Modal:</span>
                </label>
                <span className="text-[10px] text-sky-400 font-mono font-bold uppercase">{modalDisplayPref}</span>
              </div>
              <p className="text-[11px] text-gray-400">
                Pilih ukuran modal default untuk PM Bot, Promosi, Tambah Anggota, dan Berkas Otoritas.
              </p>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleSaveModalDisplayPref('normal')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-mono font-bold border transition ${
                    modalDisplayPref === 'normal'
                      ? 'bg-sky-950 border-sky-500 text-sky-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveModalDisplayPref('spacious')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-mono font-bold border transition ${
                    modalDisplayPref === 'spacious'
                      ? 'bg-sky-950 border-sky-500 text-sky-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Lebar
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveModalDisplayPref('fullscreen')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-mono font-bold border transition ${
                    modalDisplayPref === 'fullscreen'
                      ? 'bg-sky-950 border-sky-500 text-sky-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Full Layar
                </button>
              </div>
            </div>

            {/* Setting 2: Kepadatan Layout (UI Density) */}
            <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-200 uppercase flex items-center gap-1.5 font-mono">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kepadatan Tata Letak:</span>
                </label>
                <span className="text-[10px] text-amber-400 font-mono font-bold uppercase">{uiDensity}</span>
              </div>
              <p className="text-[11px] text-gray-400">
                Sesuaikan jarak padding antar elemen tabel dan kartu formulir sesuai selera Anda.
              </p>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleSaveUiDensity('compact')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-mono font-bold border transition ${
                    uiDensity === 'compact'
                      ? 'bg-amber-950 border-amber-500 text-amber-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Kompak
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveUiDensity('balanced')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-mono font-bold border transition ${
                    uiDensity === 'balanced'
                      ? 'bg-amber-950 border-amber-500 text-amber-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Seimbang
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveUiDensity('spacious')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-mono font-bold border transition ${
                    uiDensity === 'spacious'
                      ? 'bg-amber-950 border-amber-500 text-amber-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Lapang
                </button>
              </div>
            </div>

            {/* Setting 3: Skala Gambar & Avatar Personel */}
            <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-200 uppercase flex items-center gap-1.5 font-mono">
                  <Image className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ukuran Foto & Avatar:</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">{avatarScale}</span>
              </div>
              <p className="text-[11px] text-gray-400">
                Skala tampilan foto petugas dan logo bot agar proporsional di mode layar mana pun.
              </p>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleSaveAvatarScale('small')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-mono font-bold border transition ${
                    avatarScale === 'small'
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  36px (Kecil)
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAvatarScale('medium')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-mono font-bold border transition ${
                    avatarScale === 'medium'
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  48px (Sedang)
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAvatarScale('large')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-mono font-bold border transition ${
                    avatarScale === 'large'
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  64px (Besar)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: KONFIGURASI LENGKAP DISCORD BOT PM & EMBED KOMANDO               */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'bot_pm') && (
        <div id="section-discord-bot-pm" className="bg-[#121620] border border-indigo-700/70 rounded-xl p-4 sm:p-5 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-500/60 flex items-center justify-center text-indigo-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    PENGATURAN DISCORD BOT PM & KUSTOMISASI EMBED
                  </h3>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold flex items-center gap-1 ${
                    isBotGatewayOnline
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500 animate-pulse'
                      : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isBotGatewayOnline ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                    <span>{isBotGatewayOnline ? 'BOT ONLINE (HIJAU)' : 'BOT OFFLINE'}</span>
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono">
                  Konfigurasi token bot, nama bot, avatar, warna aksen embed, dan pesan pembuka saat mengirim PM ke akun Discord personel
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleToggleBotGateway}
                disabled={isTogglingBotGateway}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer disabled:opacity-50 ${
                  isBotGatewayOnline
                    ? 'bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-200'
                    : 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-white'
                }`}
              >
                {isTogglingBotGateway ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : isBotGatewayOnline ? (
                  <Square className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{isBotGatewayOnline ? 'Matikan Gateway Bot' : '⚡ Nyalakan Bot (Online Hijau)'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetBotDefault}
                className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-mono transition"
                title="Reset format embed dan nama ke default"
              >
                Reset Default
              </button>

              <button
                type="button"
                onClick={handleSaveBotConfig}
                disabled={isSavingBotConfig}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-md shadow-indigo-950 cursor-pointer"
              >
                {isSavingBotConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Simpan Pengaturan Bot PM</span>
              </button>
            </div>
          </div>

          {/* Bot Feedback Notice */}
          {botNotice && (
            <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 font-mono animate-in fade-in ${
              botNotice.success 
                ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200' 
                : 'bg-rose-950/80 border-rose-500/80 text-rose-200'
            }`}>
              {botNotice.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{botNotice.message}</span>
            </div>
          )}

          {/* 2-Column Responsive Layout: Inputs on Left, Real-time Discord Preview on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column (Inputs & Controls) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Token Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-indigo-300 uppercase flex items-center justify-between font-mono">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Discord Bot Token (Privat & Rahasia):</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">Dari Discord Developer Portal</span>
                </label>
                <div className="relative">
                  <input
                    type={showBotToken ? 'text' : 'password'}
                    value={botConfig.botToken || ''}
                    onChange={(e) => setBotConfig(prev => ({ ...prev, botToken: e.target.value }))}
                    placeholder="Contoh: MTIzNDU2Nzg5MDEyMzQ1Njc4OQ..."
                    className="w-full pl-3 pr-10 py-2.5 bg-[#0D1117] border border-gray-700 focus:border-indigo-500 rounded-lg text-xs text-gray-100 font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBotToken(!showBotToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 p-1"
                    title={showBotToken ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showBotToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10.5px] text-gray-400">
                  Token ini disimpan di server lokal Anda dan digunakan untuk mengirim pesan langsung (PM/DM) serta menjaga status Bot Online (Hijau).
                </p>
              </div>

              {/* Bot Custom Name & Embed Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-200 uppercase font-mono flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Nama Bot PM:</span>
                  </label>
                  <input
                    type="text"
                    value={botConfig.botName}
                    onChange={(e) => setBotConfig(prev => ({ ...prev, botName: e.target.value }))}
                    placeholder="Cek Akun | High State"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-indigo-500 rounded-lg text-xs text-gray-100 font-mono outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-200 uppercase font-mono flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Warna Aksen Embed:</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={botConfig.embedColor || '#00A8FF'}
                      onChange={(e) => setBotConfig(prev => ({ ...prev, embedColor: e.target.value }))}
                      className="w-9 h-9 rounded border border-gray-700 bg-[#0D1117] cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={botConfig.embedColor || '#00A8FF'}
                      onChange={(e) => setBotConfig(prev => ({ ...prev, embedColor: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-indigo-500 rounded-lg text-xs text-gray-100 font-mono outline-none uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Color Presets */}
              <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
                <span className="text-gray-400">Preset Warna:</span>
                {[
                  { name: 'Sky Blue', hex: '#00A8FF' },
                  { name: 'High Command Gold', hex: '#EAB308' },
                  { name: 'Safe Emerald', hex: '#10B981' },
                  { name: 'Discipline Red', hex: '#F43F5E' },
                  { name: 'CID Purple', hex: '#8B5CF6' }
                ].map(p => (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => setBotConfig(prev => ({ ...prev, embedColor: p.hex }))}
                    className="px-2 py-0.5 rounded border border-gray-700 hover:border-gray-500 flex items-center gap-1 text-gray-300 bg-[#0D1117]"
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.hex }} />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>

              {/* Embed Title & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-200 uppercase font-mono">
                    Judul Embed:
                  </label>
                  <input
                    type="text"
                    value={botConfig.embedTitle || '✅ Berhasil!'}
                    onChange={(e) => setBotConfig(prev => ({ ...prev, embedTitle: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-indigo-500 rounded-lg text-xs text-gray-100 font-mono outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-200 uppercase font-mono">
                    Teks Footer Embed:
                  </label>
                  <input
                    type="text"
                    value={botConfig.footerText || 'Bot High State'}
                    onChange={(e) => setBotConfig(prev => ({ ...prev, footerText: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-indigo-500 rounded-lg text-xs text-gray-100 font-mono outline-none"
                  />
                </div>
              </div>

              {/* Embed Description Line */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-200 uppercase font-mono">
                  Deskripsi Pembuka Embed:
                </label>
                <input
                  type="text"
                  value={botConfig.embedDescription || 'Berikut adalah detail dari akun UCP Anda:'}
                  onChange={(e) => setBotConfig(prev => ({ ...prev, embedDescription: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-indigo-500 rounded-lg text-xs text-gray-100 font-mono outline-none"
                />
              </div>

              {/* Default Note */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-200 uppercase font-mono">
                  Teks Catatan / Note Embed:
                </label>
                <textarea
                  rows={2}
                  value={botConfig.defaultNote || ''}
                  onChange={(e) => setBotConfig(prev => ({ ...prev, defaultNote: e.target.value }))}
                  placeholder="Jangan beritahu informasi ini kepada orang lain!"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-indigo-500 rounded-lg text-xs text-gray-100 font-mono outline-none resize-none"
                />
              </div>

              {/* Bot Avatar Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-200 uppercase font-mono flex items-center justify-between">
                  <span>Logo / Avatar Bot:</span>
                  <span className="text-[10px] text-gray-400">Pilih preset atau masukkan tautan URL</span>
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={botConfig.botAvatar || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'}
                    alt="Bot Avatar"
                    className="w-10 h-10 rounded-full border border-indigo-500/50 p-0.5 bg-black/60 object-contain shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <input
                    type="url"
                    value={botConfig.botAvatar || ''}
                    onChange={(e) => setBotConfig(prev => ({ ...prev, botAvatar: e.target.value }))}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-indigo-500 rounded-lg text-xs text-gray-100 font-mono outline-none"
                  />
                </div>
                {/* Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {PRESET_DISCORD_BOT_LOGOS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setBotConfig(prev => ({ ...prev, botAvatar: preset.url }))}
                      className={`text-[10px] px-2 py-1 rounded border transition flex items-center gap-1 ${
                        botConfig.botAvatar === preset.url
                          ? 'bg-indigo-950 border-indigo-500 text-indigo-200 font-bold'
                          : 'bg-[#0D1117] border-gray-700 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <img src={preset.url} alt="" className="w-3 h-3 rounded-full object-contain" referrerPolicy="no-referrer" />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Direct Message Test Section */}
              <div className="p-3.5 bg-[#0D1117] border border-gray-800 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-gray-200 uppercase font-mono flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Uji Coba Pengiriman PM ke Discord Target:</span>
                  </span>
                  <span className="text-[10px] text-gray-500">17-20 Digit User ID</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={testDmUserId}
                    onChange={(e) => setTestDmUserId(e.target.value)}
                    placeholder="Masukkan Discord User ID (contoh: 842019283719001)"
                    className="flex-1 px-3 py-2 bg-[#161B22] border border-gray-700 focus:border-indigo-500 rounded-lg text-xs text-gray-100 font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestDm}
                    disabled={isSendingTestDm || !testDmUserId.trim()}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                  >
                    {isSendingTestDm ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Kirim Tes PM</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Real-time Discord PM Embed Preview */}
            <div className="lg:col-span-5 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 font-mono flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Pratinjau Live Pesan Discord PM:</span>
                </span>
                <span className="text-[10px] font-mono text-gray-500">Discord Client Replica</span>
              </div>

              {/* Discord Chat Box Frame */}
              <div className="bg-[#313338] border border-gray-700/60 rounded-xl p-3.5 text-gray-200 font-sans shadow-2xl space-y-3 flex-1">
                {/* Bot Profile Bar */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={botConfig.botAvatar || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'}
                      alt="Bot Avatar"
                      className="w-10 h-10 rounded-full bg-black/60 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#23A55A] border-2 border-[#313338]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white">{botConfig.botName || 'Cek Akun | High State'}</span>
                      <span className="text-[10px] bg-[#5865F2] text-white px-1.5 py-0.2 rounded font-bold">
                        BOT
                      </span>
                    </div>
                    <span className="text-[11px] text-[#949BA4]">Hari ini pukul 14:32</span>
                  </div>
                </div>

                {/* Simulated Mention Content */}
                <div className="text-xs text-[#DBDEE1]">
                  Halo! Berikut adalah detail dari akun UCP Anda:
                </div>

                {/* The Discord Embed Box */}
                <div
                  className="bg-[#2B2D31] rounded-lg p-3 border-l-4 space-y-2.5 max-w-sm"
                  style={{ borderLeftColor: botConfig.embedColor || '#00A8FF' }}
                >
                  <div className="font-bold text-sm text-white">
                    {botConfig.embedTitle || '✅ Berhasil!'}
                  </div>
                  <div className="text-xs text-[#DBDEE1]">
                    {botConfig.embedDescription || 'Berikut adalah detail dari akun UCP Anda:'}
                  </div>

                  {/* Fields Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <div className="text-[#949BA4] text-[10px] uppercase font-bold">UCP</div>
                      <div className="text-white font-medium">{currentOfficer.name}</div>
                    </div>
                    <div>
                      <div className="text-[#949BA4] text-[10px] uppercase font-bold">PIN CODE</div>
                      <div className="font-mono bg-[#1E1F22] px-1.5 py-0.5 rounded text-[#23A55A] inline-block font-bold">
                        10-4
                      </div>
                    </div>
                    <div>
                      <div className="text-[#949BA4] text-[10px] uppercase font-bold">BADGE & PANGKAT</div>
                      <div className="text-white text-[11px] truncate">
                        #{currentOfficer.badge} • {currentOfficer.rank}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#949BA4] text-[10px] uppercase font-bold">DIVISI</div>
                      <div className="text-white text-[11px]">Patrol Bureau</div>
                    </div>
                  </div>

                  {/* Note blockquote */}
                  <div className="pt-1 text-[11px] text-[#DBDEE1] border-l-2 border-gray-600 pl-2 italic">
                    <span className="font-bold text-[#FEE75C] not-italic block mb-0.5">Note:</span>
                    {botConfig.defaultNote || 'Jangan beritahu informasi ini kepada orang lain!'}
                  </div>

                  {/* Embed Footer */}
                  <div className="pt-2 border-t border-gray-700/40 flex items-center gap-1.5 text-[10px] text-[#949BA4]">
                    <img
                      src={botConfig.botAvatar || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png'}
                      alt=""
                      className="w-3.5 h-3.5 rounded-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <span>{botConfig.footerText || 'Bot High State'} • Hari ini pukul 14:32</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: WEBHOOK PENGIRIMAN PIN AKUN & AUDIT KEAMANAN                    */}
      {/* ========================================================================= */}
      {(activeCategory === 'all' || activeCategory === 'bot_pm' || activeCategory === 'security_auth') && (
        <div id="section-pin-webhook" className="bg-[#121620] border border-sky-800/80 rounded-xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-600/60 flex items-center justify-center text-sky-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <span>WEBHOOK PENGIRIMAN PIN AKUN & AUDIT KEAMANAN</span>
                  </h3>
                  <span className="text-[10px] bg-sky-950 text-sky-300 font-mono px-2 py-0.5 rounded border border-sky-700 font-bold">
                    BISA DIUBAH
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono">
                  Ubah endpoint webhook Discord yang bertugas menerima dan mendokumentasikan distribusi PIN akun serta reset PIN
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleResetPinWebhookDefault}
                className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-mono transition cursor-pointer"
                title="Reset URL Webhook ke default Markas Besar HSPD"
              >
                Default HQ
              </button>
              <button
                type="button"
                onClick={handleTestPinWebhook}
                disabled={isTestingPinWebhook || !pinWebhookConfig.webhookUrl.trim()}
                className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 border border-blue-600 text-blue-300 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                {isTestingPinWebhook ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Tes Ping Webhook</span>
              </button>
              <button
                type="button"
                onClick={handleSavePinWebhook}
                disabled={isSavingPinWebhook}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer"
              >
                {isSavingPinWebhook ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Simpan Webhook PIN</span>
              </button>
              {onOpenWebhookModal && (
                <button
                  type="button"
                  onClick={onOpenWebhookModal}
                  className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-600 text-indigo-300 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Buka 14 Tab Webhook Discord Studio Lengkap"
                >
                  <Settings className="w-3.5 h-3.5 text-indigo-400" />
                  <span>14 Tab Webhook</span>
                </button>
              )}
            </div>
          </div>

          {/* Status Notice */}
          {pinWebhookNotice && (
            <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 font-mono animate-in fade-in ${
              pinWebhookNotice.success 
                ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200' 
                : 'bg-rose-950/80 border-rose-500/80 text-rose-200'
            }`}>
              {pinWebhookNotice.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{pinWebhookNotice.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Field 1: URL Webhook Pengiriman PIN */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-sky-300 uppercase flex items-center justify-between font-mono">
                <span className="flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-sky-400" />
                  <span>URL Webhook Discord Pengiriman PIN Akun:</span>
                </span>
                <span className="text-[10px] text-gray-400 lowercase font-mono font-normal">
                  Format: https://discord.com/api/webhooks/ID/TOKEN
                </span>
              </label>
              <input
                type="url"
                value={pinWebhookConfig.webhookUrl}
                onChange={(e) => setPinWebhookConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full px-3.5 py-2.5 bg-[#0D1117] border border-gray-700 focus:border-sky-500 rounded-lg text-xs text-gray-100 font-mono outline-none"
              />
              <div className="text-[10.5px] text-gray-400 flex items-center justify-between">
                <span>Webhook ini menerima log audit saat PIN akun didistribusikan atau diubah oleh High Command.</span>
                <span className={pinWebhookConfig.webhookUrl.startsWith('https://discord.com/api/webhooks/') ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {pinWebhookConfig.webhookUrl.startsWith('https://discord.com/api/webhooks/') ? '✓ Format Valid' : '⚠️ Format Harus Discord Webhook'}
                </span>
              </div>
            </div>

            {/* Field 2: Nama Bot Pengirim PIN */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-300 uppercase flex items-center gap-1.5 font-mono">
                <Bot className="w-3.5 h-3.5 text-sky-400" />
                <span>Nama Bot Pengirim PIN Akun:</span>
              </label>
              <input
                type="text"
                value={pinWebhookConfig.botName || ''}
                onChange={(e) => setPinWebhookConfig(prev => ({ ...prev, botName: e.target.value }))}
                placeholder="Contoh: HSPD - Security & PIN Service"
                className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-sky-500 rounded-lg text-xs text-gray-100 font-mono outline-none"
              />
            </div>

            {/* Field 3: Auto Send Checkbox */}
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2.5 p-2 bg-[#0D1117] border border-gray-800 rounded-lg cursor-pointer hover:border-sky-700 transition">
                <input
                  type="checkbox"
                  checked={pinWebhookConfig.autoSendOnSave}
                  onChange={(e) => setPinWebhookConfig(prev => ({ ...prev, autoSendOnSave: e.target.checked }))}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-gray-700 bg-gray-900"
                />
                <div className="text-xs text-gray-300">
                  <span className="font-bold text-white block">Kirim Otomatis ke Webhook</span>
                  <span className="text-[10px] text-gray-400">Kirim pemberitahuan embed secara instan saat PIN akun diterbitkan</span>
                </div>
              </label>
            </div>

            {/* Field 4: Avatar URL & Preset Selector */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-bold text-gray-300 uppercase flex items-center justify-between font-mono">
                <span className="flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-sky-400" />
                  <span>Avatar / Logo Bot Webhook PIN:</span>
                </span>
                <span className="text-[10px] text-gray-400">Pilih preset atau masukkan URL custom</span>
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <img
                  src={pinWebhookConfig.botAvatar || HSPD_LOGO_URL}
                  alt="Bot Avatar"
                  className="w-12 h-12 rounded-full border border-sky-500/50 p-0.5 bg-black/60 object-contain shrink-0"
                  referrerPolicy="no-referrer"
                />
                <input
                  type="url"
                  value={pinWebhookConfig.botAvatar || ''}
                  onChange={(e) => setPinWebhookConfig(prev => ({ ...prev, botAvatar: e.target.value }))}
                  placeholder="https://... (URL gambar logo bot)"
                  className="flex-1 px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-sky-500 rounded-lg text-xs text-gray-100 font-mono outline-none w-full"
                />
              </div>

              {/* Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Preset Logo Bot:</span>
                {PRESET_DISCORD_BOT_LOGOS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setPinWebhookConfig(prev => ({ ...prev, botAvatar: preset.url }))}
                    className={`text-[10.5px] px-2 py-1 rounded border transition flex items-center gap-1.5 ${
                      pinWebhookConfig.botAvatar === preset.url
                        ? 'bg-sky-950 border-sky-500 text-sky-200 font-bold'
                        : 'bg-[#0D1117] border-gray-700 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <img src={preset.url} alt="" className="w-3.5 h-3.5 rounded-full object-contain" referrerPolicy="no-referrer" />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: PUSAT PENGATURAN & EDITAN SELURUH FITUR (ACTION CARDS GRID)      */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-200 font-mono uppercase flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Pusat Pengaturan & Editan Fitur Komando:</span>
          </h3>
          <span className="text-[11px] text-gray-400 font-mono">
            {roster.length} Personel Terdaftar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* CARD A: MANAJEMEN ROSTER & EDIT PANGKAT */}
          {(activeCategory === 'all' || activeCategory === 'roster_mgmt') && (
            <div className="bg-[#121620] border border-gray-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-emerald-700/60 transition shadow-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-700/70 text-emerald-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-gray-100 text-sm">Roster & Pangkat Personel</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
                    {roster.length} ANGGOTA
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Kelola kenaikan pangkat, mutasi unit divisi, update PIN personal, dan registrasi penambahan personel baru.
                </p>
                <div className="p-2.5 bg-black/40 rounded-lg border border-gray-800 space-y-1 text-[11px] font-mono text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pemberi SK:</span>
                    <span className="text-amber-300 font-bold">{currentOfficer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sinkronisasi:</span>
                    <span className="text-emerald-400 font-bold">Live Cloud Database</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab ? onNavigateToTab('roster') : alert('Navigasi ke menu Roster')}
                className="w-full py-2.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-200 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-md shadow-emerald-950/30"
              >
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>BUKA EDIT ROSTER & PANGKAT</span>
              </button>
            </div>
          )}

          {/* CARD B: DISIPLIN & SP PERSONEL */}
          {(activeCategory === 'all' || activeCategory === 'roster_mgmt') && (
            <div className="bg-[#121620] border border-gray-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-rose-700/60 transition shadow-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-rose-950/70 border border-rose-700/70 text-rose-400">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-gray-100 text-sm">Disiplin & Surat Peringatan (SP)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono font-bold">
                    INTERNAL AFFAIRS
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Penegakan kode etik personel, penetapan sanksi SP 1 / SP 2 / SP 3, pembebastugasan dinas, dan arsip pemecatan.
                </p>
                <div className="p-2.5 bg-black/40 rounded-lg border border-gray-800 space-y-1 text-[11px] font-mono text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sistem Sanksi:</span>
                    <span className="text-rose-400 font-bold">3 Strikes Rule</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Otoritas Sidang:</span>
                    <span className="text-amber-300 font-bold">Supervisor & HC</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab ? onNavigateToTab('roster') : alert('Navigasi ke menu Roster')}
                className="w-full py-2.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-200 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-md shadow-rose-950/30"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>KELOLA DISIPLIN & SANKSI SP</span>
              </button>
            </div>
          )}

          {/* CARD 1: LOGO & BRANDING */}
          {(activeCategory === 'all' || activeCategory === 'branding') && (
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
                className="w-full py-2.5 bg-amber-950/70 hover:bg-amber-900 border border-amber-600 text-amber-300 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-md shadow-amber-950/30"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>BUKA PENGATURAN BRANDING</span>
              </button>
            </div>
          )}

          {/* CARD 2: DISPOSISI KODE OTP */}
          {(activeCategory === 'all' || activeCategory === 'security_auth') && (
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
                    <span className="text-gray-400">Generator:</span>
                    <span className="text-amber-300 font-bold">Supervisor & Command</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Masa Berlaku:</span>
                    <span className="text-emerald-400">1x Pakai / Kadaluarsa</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenOtpModal}
                className="w-full py-2.5 bg-gradient-to-r from-amber-950/80 to-amber-900/80 hover:from-amber-900 hover:to-amber-800 border border-amber-500 text-amber-300 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-md shadow-amber-950/30"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>DISPOSISI KODE OTP BARU</span>
              </button>
            </div>
          )}

          {/* CARD 3: PIN OTORITAS KOMANDO */}
          {(activeCategory === 'all' || activeCategory === 'security_auth') && (
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
                  <span className="text-amber-300 font-extrabold text-sm tracking-widest bg-black px-2.5 py-0.5 rounded border border-amber-700/60">
                    {authorityPinConfig.currentPin}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenAuthorityPinModal}
                className="w-full py-2.5 bg-amber-950/70 hover:bg-amber-900 border border-amber-600 text-amber-300 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-md shadow-amber-950/30"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>KELOLA & ROTASI PIN</span>
              </button>
            </div>
          )}

          {/* CARD 4: DISCORD WEBHOOK INTEGRATION STUDIO */}
          {(activeCategory === 'all' || activeCategory === 'bot_pm') && (
            <div className="bg-[#121620] border border-gray-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-blue-700/60 transition shadow-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-950/70 border border-blue-700/70 text-blue-400">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-gray-100 text-sm">Discord Webhook Studio</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono font-bold">
                    14 TAB STUDIO
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Integrasikan endpoint Webhook Discord untuk penangkapan, duty report, bukti foto dinas, panic button, BOLO, & dokumen resmi.
                </p>
                <div className="p-2.5 bg-black/40 rounded-lg border border-gray-800 space-y-1 text-[11px] font-mono text-gray-400">
                  <div className="flex justify-between">
                    <span>Multi-Channel Webhook:</span>
                    <span className="text-emerald-400 font-bold">14 Channel Aktif</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lampiran Foto:</span>
                    <span className="text-emerald-400 font-bold">Multipart Upload</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenWebhookModal}
                className="w-full py-2.5 bg-blue-950/70 hover:bg-blue-900 border border-blue-600 text-blue-300 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-md shadow-blue-950/30"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>BUKA 14 TAB WEBHOOK DISCORD</span>
              </button>
            </div>
          )}

          {/* CARD 5: LOG & AUDIT RESET PIN PETUGAS */}
          {(activeCategory === 'all' || activeCategory === 'security_auth') && (
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
                className={`w-full py-2.5 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-md ${
                  pendingPinCount > 0
                    ? 'bg-amber-500 hover:bg-amber-400 text-black border border-amber-400 animate-pulse font-extrabold shadow-amber-500/40'
                    : 'bg-amber-950/70 hover:bg-amber-900 border border-amber-600 text-amber-300 shadow-amber-950/30'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>BUKA LOG TIKET PIN {pendingPinCount > 0 ? `(${pendingPinCount})` : ''}</span>
              </button>
            </div>
          )}

          {/* CARD 6: EKSPOR REKAP ABSENSI DINAS */}
          {(activeCategory === 'all' || activeCategory === 'roster_mgmt') && (
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
                className="w-full py-2.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-md shadow-emerald-950/30"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>BUKA EKSPORTIR ABSENSI</span>
              </button>
            </div>
          )}

          {/* CARD 7: PORTAL REKRUTMEN */}
          {(activeCategory === 'all' || activeCategory === 'branding') && (
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
                  Kelola teks pengumuman, status buka/tutup pendaftaran, syarat IC/OOC, tahapan seleksi akademi, dan divisi kepolisian yang tampil di login depan.
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
                className="w-full py-2.5 bg-gradient-to-r from-amber-950/90 to-amber-900/90 hover:from-amber-900 hover:to-amber-800 border border-amber-500 text-amber-300 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2 shadow-md shadow-amber-950/30 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>BUKA PENGATURAN PORTAL REKRUTMEN</span>
              </button>
            </div>
          )}

          {/* CARD 8: SEKALI KIRIM PIN BOT SEMUA AKUN */}
          {(activeCategory === 'all' || activeCategory === 'bot_pm' || activeCategory === 'security_auth') && (
            <div className="bg-[#121620] border border-sky-900/80 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-sky-500/80 transition shadow-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-sky-950/70 border border-sky-700/70 text-sky-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-gray-100 text-sm">Sekali Kirim PIN Bot</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono font-bold">
                    MASS DISPATCH
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Kirimkan kredensial login PIN secara otomatis dan serentak ke akun Discord seluruh personel kepolisian ({roster.length} Personel) via PM Bot Discord.
                </p>
                <div className="p-2.5 bg-black/40 rounded-lg border border-gray-800 space-y-1 text-[11px] font-mono text-gray-400">
                  <div className="flex justify-between">
                    <span>Total Personel Roster:</span>
                    <span className="text-sky-400 font-bold">{roster.length} Akun</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kanal Pengiriman:</span>
                    <span className="text-emerald-400 font-bold">Direct Message (PM) Bot</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchPinModalOpen(true)}
                className="w-full py-2.5 bg-gradient-to-r from-sky-900/90 to-blue-900/90 hover:from-sky-800 hover:to-blue-800 border border-sky-500 text-sky-200 rounded-lg text-xs font-bold font-mono transition flex items-center justify-center gap-2 shadow-md shadow-sky-950/30 active:scale-95 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>BUKA DISPATCH PIN BOT ({roster.length} AKUN)</span>
              </button>
            </div>
          )}
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
          className={`px-4 py-2.5 rounded-xl border text-xs font-bold font-mono transition flex items-center gap-2 shadow-md shrink-0 cursor-pointer active:scale-95 ${
            isAndroidMode
              ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
          }`}
        >
          {isAndroidMode ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          <span>GANTI KE {isAndroidMode ? 'MODE DESKTOP' : 'MODE ANDROID'}</span>
        </button>
      </div>

      {/* MODAL: SEKALI KIRIM PIN BOT SEMUA AKUN */}
      <BatchPinBroadcastModal
        isOpen={isBatchPinModalOpen}
        onClose={() => setIsBatchPinModalOpen(false)}
        roster={roster as OfficerAccount[]}
        currentOfficer={currentOfficer}
      />
    </div>
  );
};
