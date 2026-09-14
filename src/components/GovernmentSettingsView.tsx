import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sliders,
  Radio,
  Globe,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Shield,
  Stamp as StampIcon,
  Crown,
  Lock,
  ExternalLink,
  Save,
  RefreshCw,
  Eye,
  Bell,
  Check,
  X,
  Plus,
  HelpCircle,
  Copy,
  Clock,
  Sparkles,
  Layers,
  Users,
  MessageSquare
} from 'lucide-react';
import { OfficerProfile, OfficialDocument, SealType } from '../types';
import {
  getSavedGovDocumentWebhookConfig,
  saveGovDocumentWebhookConfig,
  testGovDocumentDiscordWebhook,
  getSavedGovRosterWebhookConfig,
  saveGovRosterWebhookConfig,
  testGovRosterDiscordWebhook,
  getSavedGovPinResetWebhookConfig,
  saveGovPinResetWebhookConfig,
  testGovPinResetDiscordWebhook,
  WebhookConfig
} from '../utils/discordWebhook';
import {
  getGovernmentPortalConfig,
  saveGovernmentPortalConfig,
  GovernmentPortalConfig,
  subscribeToGovernmentPortal
} from '../utils/governmentRecruitmentStorage';
import {
  getStateSecurityStatus,
  saveStateSecurityStatus,
  StateSecurityStatus,
  SecurityLevel,
  getGovernmentPermits,
  GovernmentPermit
} from '../utils/governmentOperationsStorage';

interface GovernmentSettingsViewProps {
  currentOfficer: OfficerProfile | null;
  onNavigateToDocuments?: (presetId?: string, initialData?: any) => void;
  onNavigateToHub?: () => void;
}

export const GovernmentSettingsView: React.FC<GovernmentSettingsViewProps> = ({
  currentOfficer,
  onNavigateToDocuments,
  onNavigateToHub
}) => {
  // Navigation Category Tabs
  const [activeCategory, setActiveCategory] = useState<
    'webhook' | 'announcement' | 'forms' | 'discord' | 'authority'
  >('webhook');

  // Feedback Banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // =========================================================================
  // 1. WEBHOOK STATE (PEMERINTAHAN)
  // =========================================================================
  const [docWebhook, setDocWebhook] = useState<WebhookConfig>(getSavedGovDocumentWebhookConfig);
  const [rosterWebhook, setRosterWebhook] = useState<WebhookConfig>(getSavedGovRosterWebhookConfig);
  const [pinWebhook, setPinWebhook] = useState<WebhookConfig>(getSavedGovPinResetWebhookConfig);

  const [testingWebhookKey, setTestingWebhookKey] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ [key: string]: { success: boolean; msg: string } }>({});

  const handleTestWebhook = async (key: 'doc' | 'roster' | 'pin') => {
    setTestingWebhookKey(key);
    try {
      let res: { success: boolean; message: string };
      if (key === 'doc') {
        saveGovDocumentWebhookConfig(docWebhook);
        res = await testGovDocumentDiscordWebhook(docWebhook);
      } else if (key === 'roster') {
        saveGovRosterWebhookConfig(rosterWebhook);
        res = await testGovRosterDiscordWebhook(rosterWebhook);
      } else {
        saveGovPinResetWebhookConfig(pinWebhook);
        res = await testGovPinResetDiscordWebhook(pinWebhook);
      }

      setTestResult(prev => ({
        ...prev,
        [key]: { success: res.success, msg: res.message }
      }));
      showFeedback(res.success ? 'success' : 'error', res.message);
    } catch (err: any) {
      setTestResult(prev => ({
        ...prev,
        [key]: { success: false, msg: err.message || 'Gagal mengirim webhook tes.' }
      }));
      showFeedback('error', err.message || 'Gagal mengirim tes webhook.');
    } finally {
      setTestingWebhookKey(null);
    }
  };

  const handleSaveAllWebhooks = () => {
    saveGovDocumentWebhookConfig(docWebhook);
    saveGovRosterWebhookConfig(rosterWebhook);
    saveGovPinResetWebhookConfig(pinWebhook);
    showFeedback('success', 'Seluruh konfigurasi Webhook Pemerintahan berhasil disimpan!');
  };

  // =========================================================================
  // 2. MAKLUMAT & PENGUMUMAN DEPAN LOGIN
  // =========================================================================
  const [portalConfig, setPortalConfig] = useState<GovernmentPortalConfig>(getGovernmentPortalConfig);
  const [editHeadline, setEditHeadline] = useState(portalConfig.announcementHeadline);
  const [editContent, setEditContent] = useState(portalConfig.announcementContent);
  const [editLevel, setEditLevel] = useState(portalConfig.announcementLevel);
  const [editAuthor, setEditAuthor] = useState(portalConfig.announcementAuthor);
  const [editDate, setEditDate] = useState(portalConfig.announcementDate);
  const [editIsOpen, setEditIsOpen] = useState(portalConfig.isOpen);
  const [editBadgeText, setEditBadgeText] = useState(portalConfig.badgeActiveText);

  useEffect(() => {
    return subscribeToGovernmentPortal(cfg => {
      setPortalConfig(cfg);
      setEditHeadline(cfg.announcementHeadline);
      setEditContent(cfg.announcementContent);
      setEditLevel(cfg.announcementLevel);
      setEditAuthor(cfg.announcementAuthor);
      setEditDate(cfg.announcementDate);
      setEditIsOpen(cfg.isOpen);
      setEditBadgeText(cfg.badgeActiveText);
    });
  }, []);

  const handleSaveAnnouncement = () => {
    const updated = saveGovernmentPortalConfig({
      announcementHeadline: editHeadline,
      announcementContent: editContent,
      announcementLevel: editLevel,
      announcementAuthor: editAuthor,
      announcementDate: editDate,
      isOpen: editIsOpen,
      badgeActiveText: editBadgeText
    }, currentOfficer?.name);

    setPortalConfig(updated);
    showFeedback('success', 'Maklumat & Pengumuman Depan Login berhasil diperbarui dan disinkronkan ke layar publik!');
  };

  const handleResetAnnouncement = () => {
    setEditHeadline('MAKLUMAT KABINET: Pembukaan Seleksi Calon Aparatur Sipil Negara & Staf Pemerintahan');
    setEditContent('Kantor Kepresidenan & Sekretariat Negara mengumumkan pembukaan formasi Aparatur Pemerintahan untuk Departemen Kehakiman, Badan Pengelola Keuangan, dan Hubungan Masyarakat. Pendaftaran dilakukan secara terbuka bagi seluruh warga sipil yang memenuhi kualifikasi rekam jejak bersih (SKCK).');
    setEditLevel('NORMAL');
    setEditAuthor('Sekretariat Kabinet Pemerintahan Negara');
    setEditDate('Terkini / Aktif');
    setEditIsOpen(true);
    setEditBadgeText('REKRUTMEN APARATUR DIBUKA • SELEKSI TERBUKA NEGARA');
    showFeedback('info', 'Formulir maklumat di-reset ke draf standar.');
  };

  // =========================================================================
  // 3. DAFTAR / FORMULIR SELESAI & PERIZINAN
  // =========================================================================
  const [formUrl, setFormUrl] = useState(portalConfig.formRegistrationUrl);
  const [permitsList, setPermitsList] = useState<GovernmentPermit[]>(getGovernmentPermits);

  const handleSaveFormSettings = () => {
    const updated = saveGovernmentPortalConfig({
      formRegistrationUrl: formUrl
    }, currentOfficer?.name);
    setPortalConfig(updated);
    showFeedback('success', 'URL Formulir Pendaftaran / Berkas Kenegaraan berhasil disimpan!');
  };

  // =========================================================================
  // 4. DISCORD KENEGARAAN & HUBUNGAN MASYARAKAT
  // =========================================================================
  const [discordHotlineUrl, setDiscordHotlineUrl] = useState(portalConfig.discordHotlineUrl);
  const [discordHotlineText, setDiscordHotlineText] = useState(portalConfig.discordHotlineText);
  const [copyrightText, setCopyrightText] = useState(portalConfig.copyrightText);

  const handleSaveDiscordGov = () => {
    const updated = saveGovernmentPortalConfig({
      discordHotlineUrl,
      discordHotlineText,
      copyrightText
    }, currentOfficer?.name);
    setPortalConfig(updated);
    showFeedback('success', 'Pengaturan Komunitas & Discord Kenegaraan berhasil disimpan!');
  };

  // =========================================================================
  // 5. OTORITAS PUSAT & PERTAHANAN (DEFCON)
  // =========================================================================
  const [secStatus, setSecStatus] = useState<StateSecurityStatus>(getStateSecurityStatus);
  const [curfewActive, setCurfewActive] = useState(secStatus.curfewActive);
  const [curfewHours, setCurfewHours] = useState(secStatus.curfewHours);
  const [secNotes, setSecNotes] = useState(secStatus.notes);

  const handleSaveSecurity = (level: SecurityLevel) => {
    const levelTitles: Record<SecurityLevel, string> = {
      1: 'LEVEL 1: KONDISI TERTIB & NORMAL',
      2: 'LEVEL 2: WASPADA & PENINGKATAN PATROLI',
      3: 'LEVEL 3: SIAGA TINGGI & JAM MALAM',
      4: 'LEVEL 4: DARURAT MILITER & LOCKDOWN'
    };

    const newSec: StateSecurityStatus = {
      level,
      levelTitle: levelTitles[level],
      curfewActive,
      curfewHours: curfewActive ? curfewHours : 'Tidak Ada Jam Malam',
      curfewZones: curfewActive ? 'Seluruh Wilayah Hukum Kota & Jalur Tol' : 'Normal',
      notes: secNotes,
      updatedBy: currentOfficer?.name || 'Pejabat Negara',
      updatedByRank: currentOfficer?.rank || 'EXECUTIVE',
      updatedAt: Date.now()
    };

    saveStateSecurityStatus(newSec);
    setSecStatus(newSec);
    showFeedback('success', `Status Kesiagaan Negara berhasil diubah menjadi ${newSec.levelTitle}!`);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Alert Feedback */}
      {feedback && (
        <div className={`p-3 rounded-lg border flex items-center justify-between shadow-xl animate-in fade-in ${
          feedback.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200' :
          feedback.type === 'error' ? 'bg-rose-950/90 border-rose-500 text-rose-200' :
          'bg-blue-950/90 border-blue-500 text-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
            <span className="font-bold">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER BANNER: SETTING & OTORITAS PEMERINTAHAN */}
      <div className="bg-gradient-to-r from-[#18140B] via-[#221B0E] to-[#120F08] border border-amber-500/60 rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/30 shrink-0 border border-amber-300">
              <Settings className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-gray-100 tracking-tight flex items-center gap-2">
                  PENGATURAN & OTORITAS PUSAT PEMERINTAHAN
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-sm">
                  GOVERNMENT SETTINGS
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Konfigurasi terpadu Webhook Discord, Maklumat Depan Login, Formulir Kenegaraan, dan Status Kesiagaan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToHub && (
              <button
                type="button"
                onClick={onNavigateToHub}
                className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/60 text-amber-200 rounded-lg flex items-center gap-1.5 transition font-bold"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Balai Pemerintahan</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveAllWebhooks}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black rounded-lg shadow-md hover:scale-105 transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-black" />
              <span>Simpan Semua</span>
            </button>
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div className="mt-5 pt-3 border-t border-amber-500/20 grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCategory('webhook')}
            className={`px-3 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
              activeCategory === 'webhook'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-black/50 text-gray-300 hover:bg-black/80 hover:text-amber-200 border border-amber-900/40'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>🌐 Webhook Discord</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('announcement')}
            className={`px-3 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
              activeCategory === 'announcement'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-black/50 text-gray-300 hover:bg-black/80 hover:text-amber-200 border border-amber-900/40'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>📢 Pengumuman Login</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('forms')}
            className={`px-3 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
              activeCategory === 'forms'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-black/50 text-gray-300 hover:bg-black/80 hover:text-amber-200 border border-amber-900/40'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>📋 Formulir Selesai</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('discord')}
            className={`px-3 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
              activeCategory === 'discord'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-black/50 text-gray-300 hover:bg-black/80 hover:text-amber-200 border border-amber-900/40'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>🏛️ Discord Kenegaraan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('authority')}
            className={`px-3 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
              activeCategory === 'authority'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-black/50 text-gray-300 hover:bg-black/80 hover:text-amber-200 border border-amber-900/40'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>👑 Otoritas & DEFCON</span>
          </button>
        </div>
      </div>

      {/* TAB 1: WEBHOOK DISCORD PEMERINTAHAN */}
      {activeCategory === 'webhook' && (
        <div className="space-y-4">
          <div className="bg-[#161B22] border border-gray-800 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-gray-100">
                  Integrasi Webhook Discord Pemerintahan Kenegaraan
                </h2>
              </div>
              <span className="text-[10px] text-gray-400">
                Pemberitahuan otomatis ke saluran Discord in-game (Arsip Dokumen, Roster Aparatur, & Notifikasi PIN)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {/* 1. Dokumen Kenegaraan */}
              <div className="p-3.5 bg-[#0D1117] rounded-lg border border-amber-700/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-gray-200">1. Webhook Dokumen Kenegaraan</span>
                  </div>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docWebhook.autoSendOnSave}
                      onChange={e => setDocWebhook({ ...docWebhook, autoSendOnSave: e.target.checked })}
                      className="rounded border-gray-700 bg-gray-900 text-amber-500 focus:ring-0"
                    />
                    <span className="text-[10px] text-gray-300">Auto-Kirim</span>
                  </label>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-0.5">URL Discord Webhook:</label>
                  <input
                    type="url"
                    value={docWebhook.webhookUrl}
                    onChange={e => setDocWebhook({ ...docWebhook, webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 rounded text-[11px] text-gray-200 outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Nama Bot:</label>
                    <input
                      type="text"
                      value={docWebhook.botName}
                      onChange={e => setDocWebhook({ ...docWebhook, botName: e.target.value })}
                      className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-[10px] text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Avatar URL:</label>
                    <input
                      type="url"
                      value={docWebhook.botAvatar}
                      onChange={e => setDocWebhook({ ...docWebhook, botAvatar: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-[10px] text-gray-200"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-gray-400 truncate max-w-[200px]">
                    {testResult['doc'] ? (testResult['doc'].success ? '✅ Terkoneksi' : '❌ Gagal') : 'Belum diuji'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTestWebhook('doc')}
                    disabled={testingWebhookKey === 'doc'}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded text-[10px] flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>{testingWebhookKey === 'doc' ? 'Menguji...' : 'Tes Webhook'}</span>
                  </button>
                </div>
              </div>

              {/* 2. Roster Pejabat */}
              <div className="p-3.5 bg-[#0D1117] rounded-lg border border-gray-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-bold text-gray-200">2. Webhook Roster Pejabat Kenegaraan</span>
                  </div>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rosterWebhook.autoSendOnSave}
                      onChange={e => setRosterWebhook({ ...rosterWebhook, autoSendOnSave: e.target.checked })}
                      className="rounded border-gray-700 bg-gray-900 text-blue-500 focus:ring-0"
                    />
                    <span className="text-[10px] text-gray-300">Auto-Kirim</span>
                  </label>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-0.5">URL Discord Webhook:</label>
                  <input
                    type="url"
                    value={rosterWebhook.webhookUrl}
                    onChange={e => setRosterWebhook({ ...rosterWebhook, webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 rounded text-[11px] text-gray-200 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Nama Bot:</label>
                    <input
                      type="text"
                      value={rosterWebhook.botName}
                      onChange={e => setRosterWebhook({ ...rosterWebhook, botName: e.target.value })}
                      className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-[10px] text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Avatar URL:</label>
                    <input
                      type="url"
                      value={rosterWebhook.botAvatar}
                      onChange={e => setRosterWebhook({ ...rosterWebhook, botAvatar: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-[10px] text-gray-200"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-gray-400 truncate max-w-[200px]">
                    {testResult['roster'] ? (testResult['roster'].success ? '✅ Terkoneksi' : '❌ Gagal') : 'Belum diuji'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTestWebhook('roster')}
                    disabled={testingWebhookKey === 'roster'}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-[10px] flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>{testingWebhookKey === 'roster' ? 'Menguji...' : 'Tes Webhook'}</span>
                  </button>
                </div>
              </div>

              {/* 3. PIN Reset Pejabat */}
              <div className="p-3.5 bg-[#0D1117] rounded-lg border border-gray-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-bold text-gray-200">3. Webhook Reset & Permohonan PIN</span>
                  </div>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pinWebhook.autoSendOnSave}
                      onChange={e => setPinWebhook({ ...pinWebhook, autoSendOnSave: e.target.checked })}
                      className="rounded border-gray-700 bg-gray-900 text-purple-500 focus:ring-0"
                    />
                    <span className="text-[10px] text-gray-300">Auto-Kirim</span>
                  </label>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-0.5">URL Discord Webhook:</label>
                  <input
                    type="url"
                    value={pinWebhook.webhookUrl}
                    onChange={e => setPinWebhook({ ...pinWebhook, webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 rounded text-[11px] text-gray-200 outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Nama Bot:</label>
                    <input
                      type="text"
                      value={pinWebhook.botName}
                      onChange={e => setPinWebhook({ ...pinWebhook, botName: e.target.value })}
                      className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-[10px] text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Avatar URL:</label>
                    <input
                      type="url"
                      value={pinWebhook.botAvatar}
                      onChange={e => setPinWebhook({ ...pinWebhook, botAvatar: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-2 py-1 bg-[#161B22] border border-gray-700 rounded text-[10px] text-gray-200"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-gray-400 truncate max-w-[200px]">
                    {testResult['pin'] ? (testResult['pin'].success ? '✅ Terkoneksi' : '❌ Gagal') : 'Belum diuji'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTestWebhook('pin')}
                    disabled={testingWebhookKey === 'pin'}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-[10px] flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>{testingWebhookKey === 'pin' ? 'Menguji...' : 'Tes Webhook'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAllWebhooks}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black rounded-lg shadow hover:scale-105 transition flex items-center gap-1.5"
              >
                <Save className="w-4 h-4 text-black" />
                <span>Simpan Pengaturan Webhook</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UBAH PENGUMUMAN DI DEPAN LOGIN */}
      {activeCategory === 'announcement' && (
        <div className="space-y-4">
          <div className="bg-[#161B22] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-gray-100">
                  Ubah Pengumuman & Maklumat di Depan Halaman Login
                </h2>
              </div>
              <span className="text-[10px] text-amber-400 font-bold">
                Tampil di Layar Depan OfficerLogin & Publik
              </span>
            </div>

            {/* LIVE PREVIEW BANNER */}
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">
                👁️ PRATINJAU LANGSUNG (LIVE PREVIEW DEPAN LOGIN):
              </label>
              <div className={`p-4 rounded-xl border ${
                editLevel === 'CRITICAL' ? 'bg-rose-950/80 border-rose-600/80 text-rose-100' :
                editLevel === 'URGENT' ? 'bg-amber-950/80 border-amber-600/80 text-amber-100' :
                'bg-blue-950/80 border-blue-600/80 text-blue-100'
              } shadow-lg font-sans space-y-2`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">📢</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/50 border border-white/20">
                      MAKLUMAT {editLevel}
                    </span>
                    <span className="text-xs font-bold font-mono text-white">
                      {editHeadline || 'Judul Maklumat Belum Diisi'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-300 font-mono">
                    {editDate} • {editAuthor}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-gray-200">
                  {editContent || 'Isi pengumuman maklumat akan tampil di sini.'}
                </p>
              </div>
            </div>

            {/* FORM INPUTS */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-gray-400 block mb-1">Judul / Headline Maklumat * :</label>
                  <input
                    type="text"
                    value={editHeadline}
                    onChange={e => setEditHeadline(e.target.value)}
                    placeholder="Contoh: MAKLUMAT KABINET: Pembukaan Seleksi Calon Aparatur..."
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-100 font-bold outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Tingkat Urgensi / Level :</label>
                  <select
                    value={editLevel}
                    onChange={e => setEditLevel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-amber-300 font-bold outline-none"
                  >
                    <option value="NORMAL">NORMAL (Informasi Rutin)</option>
                    <option value="URGENT">URGENT (Penting & Cepat)</option>
                    <option value="CRITICAL">CRITICAL (Darurat / Khusus)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Isi Pesan Maklumat Lengkap * :</label>
                <textarea
                  rows={4}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  placeholder="Tuliskan isi maklumat lengkap yang ingin diumumkan di depan halaman login..."
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-200 outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Penerbit / Instansi Pembuat :</label>
                  <input
                    type="text"
                    value={editAuthor}
                    onChange={e => setEditAuthor(e.target.value)}
                    placeholder="Sekretariat Kepresidenan & Kabinet"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Masa Berlaku / Tanggal :</label>
                  <input
                    type="text"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    placeholder="Terkini / Aktif"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-200"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#0D1117] rounded-lg border border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-200 block">Status Rekrutmen Aparatur Sipil</span>
                  <span className="text-[10px] text-gray-400">Aktifkan untuk membuka badge seleksi terbuka di layar depan</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditIsOpen(!editIsOpen)}
                    className={`px-3 py-1 rounded text-xs font-bold border transition ${
                      editIsOpen
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                        : 'bg-rose-950 text-rose-300 border-rose-600'
                    }`}
                  >
                    {editIsOpen ? '✅ REKRUTMEN BUKA' : '🔒 REKRUTMEN TUTUP'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={handleResetAnnouncement}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs"
              >
                Reset ke Standar
              </button>
              <button
                type="button"
                onClick={handleSaveAnnouncement}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black rounded-lg shadow-lg hover:scale-105 transition flex items-center gap-1.5 text-xs"
              >
                <Save className="w-4 h-4 text-black" />
                <span>Simpan & Terapkan ke Depan Login</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DAFTAR / FORMULIR SELESAI */}
      {activeCategory === 'forms' && (
        <div className="space-y-4">
          <div className="bg-[#161B22] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-gray-100">
                  Manajemen Formulir Selesai, Izin & Dokumen Kenegaraan
                </h2>
              </div>
              <span className="text-[10px] text-gray-400">
                Total {permitsList.length} Izin / Dokumen Kenegaraan
              </span>
            </div>

            {/* FORM REGISTRATION URL CONFIG */}
            <div className="p-3.5 bg-[#0D1117] rounded-lg border border-gray-800 space-y-2">
              <label className="text-xs font-bold text-amber-300 block">
                Tautan / Link Formulir Pendaftaran Selesai (Portal Publik):
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formUrl}
                  onChange={e => setFormUrl(e.target.value)}
                  placeholder="https://discord.gg/..."
                  className="flex-1 px-3 py-2 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-100 outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleSaveFormSettings}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-xs"
                >
                  Simpan Link
                </button>
              </div>
              <p className="text-[10px] text-gray-400">
                Link ini akan diklik oleh masyarakat sipil saat menekan tombol "Daftar / Isi Formulir Sekarang" di portal penerimaan.
              </p>
            </div>

            {/* DAFTAR FORMULIR & IZIN SELESAI / DISAHKAN */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-200">
                  Daftar Formulir Selesai & Izin Resmi Kenegaraan:
                </h3>
                {onNavigateToDocuments && (
                  <button
                    type="button"
                    onClick={() => onNavigateToDocuments()}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline font-mono"
                  >
                    + Terbitkan Formulir Baru di Studio Dokumen
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-800">
                <table className="w-full text-left">
                  <thead className="bg-[#0D1117] text-[10px] text-gray-400 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">No. Berkas</th>
                      <th className="py-2.5 px-3">Nama Pemohon / Organisasi</th>
                      <th className="py-2.5 px-3">Kategori Izin</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Berlaku Hingga</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 text-[11px]">
                    {permitsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-gray-500">
                          Belum ada formulir izin yang selesai dicatat.
                        </td>
                      </tr>
                    ) : (
                      permitsList.slice(0, 8).map(pmt => (
                        <tr key={pmt.id} className="hover:bg-[#1f242c] transition">
                          <td className="py-2 px-3 font-mono font-bold text-amber-300">
                            {pmt.id}
                          </td>
                          <td className="py-2 px-3 text-gray-200 font-bold">
                            {pmt.applicantName}
                          </td>
                          <td className="py-2 px-3 text-gray-300">
                            {pmt.title}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                              pmt.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border-emerald-600' :
                              pmt.status === 'REJECTED' ? 'bg-rose-950 text-rose-300 border-rose-600' :
                              'bg-amber-950 text-amber-300 border-amber-600'
                            }`}>
                              {pmt.status === 'APPROVED' ? 'DISETUJUI' : pmt.status === 'REJECTED' ? 'DITOLAK' : 'PENDING'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-400 font-mono text-[10px]">
                            {pmt.validUntil}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {onNavigateToDocuments && (
                              <button
                                type="button"
                                onClick={() => onNavigateToDocuments('PRES_WCL')}
                                className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-[10px]"
                              >
                                Buka Berkas
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DISCORD KENEGARAAN & HUBUNGAN MASYARAKAT */}
      {activeCategory === 'discord' && (
        <div className="space-y-4">
          <div className="bg-[#161B22] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-gray-100">
                  Konfigurasi Komunitas & Discord Kenegaraan
                </h2>
              </div>
              <span className="text-[10px] text-gray-400">
                Pusat Komunikasi & Pengaduan Rakyat
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">
                  URL Server Discord Kenegaraan (Invite Link) * :
                </label>
                <input
                  type="url"
                  value={discordHotlineUrl}
                  onChange={e => setDiscordHotlineUrl(e.target.value)}
                  placeholder="https://discord.gg/highstate-gov"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">
                  Teks Label Tombol Discord Kenegaraan :
                </label>
                <input
                  type="text"
                  value={discordHotlineText}
                  onChange={e => setDiscordHotlineText(e.target.value)}
                  placeholder="Discord Resmi Balai Kota & Pemerintahan"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-200 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-1">
                Teks Hak Cipta & Lembaga Negara (Footer Publik) :
              </label>
              <input
                type="text"
                value={copyrightText}
                onChange={e => setCopyrightText(e.target.value)}
                placeholder="State Executive Government Administration © 2026"
                className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded text-xs text-gray-200"
              />
            </div>

            <div className="p-3 bg-[#0D1117] rounded-lg border border-gray-800 space-y-1">
              <span className="text-xs font-bold text-amber-300 block">Panduan Integrasi Discord Kenegaraan:</span>
              <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                Tautan Discord ini otomatis muncul di bagian footer portal login dan panel aspirasi masyarakat sipil. Warga kota dapat menggunakan tautan ini untuk mengikuti pengumuman jam malam, sidang terbuka kehakiman, dan permohonan lisensi.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={handleSaveDiscordGov}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs"
              >
                Simpan Konfigurasi Discord Kenegaraan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: OTORITAS PUSAT & DEFCON STATUS */}
      {activeCategory === 'authority' && (
        <div className="space-y-4">
          <div className="bg-[#161B22] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-gray-100">
                  Otoritas Pusat, Stempel Kenegaraan & Status Kesiagaan (DEFCON)
                </h2>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                secStatus.level === 1 ? 'bg-emerald-950 text-emerald-300 border-emerald-500' :
                secStatus.level === 2 ? 'bg-amber-950 text-amber-300 border-amber-500' :
                secStatus.level === 3 ? 'bg-orange-950 text-orange-300 border-orange-500' :
                'bg-rose-950 text-rose-300 border-rose-500'
              }`}>
                {secStatus.levelTitle}
              </span>
            </div>

            {/* DEFCON BUTTON SELECTION */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">
                Pilih Tingkat Kesiagaan & Keamanan Negara:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveSecurity(1)}
                  className={`p-3 rounded-lg border text-left transition ${
                    secStatus.level === 1
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500'
                      : 'bg-[#0D1117] border-gray-800 text-gray-300 hover:border-emerald-700'
                  }`}
                >
                  <div className="text-xs font-bold text-emerald-400 mb-1">DEFCON 1: KONDISI NORMAL</div>
                  <div className="text-[10px] text-gray-400">Situasi aman, ketertiban umum kondusif tanpa pembatasan wilayah.</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveSecurity(2)}
                  className={`p-3 rounded-lg border text-left transition ${
                    secStatus.level === 2
                      ? 'bg-amber-950/80 border-amber-500 text-amber-200 ring-2 ring-amber-500'
                      : 'bg-[#0D1117] border-gray-800 text-gray-300 hover:border-amber-700'
                  }`}
                >
                  <div className="text-xs font-bold text-amber-400 mb-1">DEFCON 2: PENINGKATAN PATROLI</div>
                  <div className="text-[10px] text-gray-400">Peningkatan patroli gabungan kepolisian dan pengawasan area vital.</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveSecurity(3)}
                  className={`p-3 rounded-lg border text-left transition ${
                    secStatus.level === 3
                      ? 'bg-orange-950/80 border-orange-500 text-orange-200 ring-2 ring-orange-500'
                      : 'bg-[#0D1117] border-gray-800 text-gray-300 hover:border-orange-700'
                  }`}
                >
                  <div className="text-xs font-bold text-orange-400 mb-1">DEFCON 3: SIAGA TINGGI & JAM MALAM</div>
                  <div className="text-[10px] text-gray-400">Pemberlakuan jam malam warga sipil dan razia berkala di jalan raya.</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveSecurity(4)}
                  className={`p-3 rounded-lg border text-left transition ${
                    secStatus.level === 4
                      ? 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500'
                      : 'bg-[#0D1117] border-gray-800 text-gray-300 hover:border-rose-700'
                  }`}
                >
                  <div className="text-xs font-bold text-rose-400 mb-1">DEFCON 4: DARURAT MILITER</div>
                  <div className="text-[10px] text-gray-400">Lockdown total, pembatasan ketat akses masuk keluar perbatasan negara.</div>
                </button>
              </div>
            </div>

            {/* JAM MALAM TOGGLE */}
            <div className="p-3.5 bg-[#0D1117] rounded-lg border border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={curfewActive}
                    onChange={e => setCurfewActive(e.target.checked)}
                    className="rounded border-gray-700 bg-gray-900 text-amber-500"
                  />
                  <span className="font-bold text-xs text-gray-200">Aktifkan Jam Malam (Curfew)</span>
                </label>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  Warga di luar jam dilarang beraktivitas di jalanan umum
                </span>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">Rentang Jam Malam:</label>
                <input
                  type="text"
                  value={curfewHours}
                  disabled={!curfewActive}
                  onChange={e => setCurfewHours(e.target.value)}
                  placeholder="22:00 - 05:00 WIB"
                  className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200 disabled:opacity-40"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">Catatan Perintah Eksekutif:</label>
                <input
                  type="text"
                  value={secNotes}
                  onChange={e => setSecNotes(e.target.value)}
                  placeholder="Instruksi khusus kepada kepolisian & garda nasional..."
                  className="w-full px-2.5 py-1.5 bg-[#161B22] border border-gray-700 rounded text-xs text-gray-200"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => handleSaveSecurity(secStatus.level)}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black rounded-lg text-xs"
              >
                Terapkan Perintah Kesiagaan & Otoritas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
