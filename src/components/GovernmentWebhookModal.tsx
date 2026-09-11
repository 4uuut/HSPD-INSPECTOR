import React, { useState, useEffect } from 'react';
import { 
  X, Check, AlertTriangle, Send, Bot, Building2, 
  FileText, ShieldCheck, KeyRound, Radio, Eye, EyeOff, 
  RefreshCw, Sparkles, HelpCircle, ExternalLink, Globe
} from 'lucide-react';
import {
  getSavedDiscordBotConfig,
  saveDiscordBotConfig,
  getDiscordBotGatewayStatus,
  startDiscordBotGateway,
  stopDiscordBotGateway,
  sendGovOfficerAccountDm,
  getSavedGovRosterWebhookConfig,
  saveGovRosterWebhookConfig,
  testGovRosterDiscordWebhook,
  getSavedGovDocumentWebhookConfig,
  saveGovDocumentWebhookConfig,
  testGovDocumentDiscordWebhook,
  getSavedGovPinResetWebhookConfig,
  saveGovPinResetWebhookConfig,
  testGovPinResetDiscordWebhook,
  WebhookConfig
} from '../utils/discordWebhook';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const GovernmentWebhookModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'bot_dm' | 'roster' | 'documents' | 'pin'>('bot_dm');

  // Bot PM State
  const [botToken, setBotToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [botName, setBotName] = useState('Sekretariat Negara | High State');
  const [botAvatar, setBotAvatar] = useState('https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
  const [embedTitle, setEmbedTitle] = useState('🏛️ Kredensial Akun Portal Pemerintahan HighState');
  const [embedDesc, setEmbedDesc] = useState('Selamat bertugas! Akun dinas kenegaraan Anda telah resmi diterbitkan oleh Jajaran Eksekutif Negara. Gunakan kredensial di bawah ini untuk mengakses Portal Resmi Pemerintahan:');
  const [embedColor, setEmbedColor] = useState('#F59E0B');
  const [defaultNote, setDefaultNote] = useState('PENTING: Jaga kerahasiaan PIN ini. Jangan pernah berikan kepada siapapun. Pilih tab "🏛️ Portal Pemerintahan" pada saat masuk ke website.');

  // Bot Gateway Status
  const [gatewayStatus, setGatewayStatus] = useState<{
    isOnline: boolean;
    botUser: any;
    status: 'online' | 'offline';
    lastError: string | null;
  }>({
    isOnline: false,
    botUser: null,
    status: 'offline',
    lastError: null
  });
  const [isGatewayLoading, setIsGatewayLoading] = useState(false);

  // PM Testing State
  const [testTargetDiscord, setTestTargetDiscord] = useState('');
  const [isTestingDm, setIsTestingDm] = useState(false);
  const [testDmResult, setTestDmResult] = useState<{ success: boolean; message: string } | null>(null);

  // Webhooks State
  const [rosterConfig, setRosterConfig] = useState<WebhookConfig>(() => getSavedGovRosterWebhookConfig());
  const [docConfig, setDocConfig] = useState<WebhookConfig>(() => getSavedGovDocumentWebhookConfig());
  const [pinConfig, setPinConfig] = useState<WebhookConfig>(() => getSavedGovPinResetWebhookConfig());

  // Webhook Testing States
  const [testingWebhook, setTestingWebhook] = useState<'roster' | 'doc' | 'pin' | null>(null);
  const [testWebhookResult, setTestWebhookResult] = useState<{ success: boolean; message: string } | null>(null);

  // Save feedback state
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load configs on mount or open
  useEffect(() => {
    if (isOpen) {
      const savedBot = getSavedDiscordBotConfig();
      setBotToken(savedBot.botToken || '');
      setBotName(savedBot.botName || 'Sekretariat Negara | High State');
      setBotAvatar(savedBot.botAvatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
      setEmbedTitle(savedBot.embedTitle || '🏛️ Kredensial Akun Portal Pemerintahan HighState');
      setEmbedDesc(savedBot.embedDescription || 'Selamat bertugas! Akun dinas kenegaraan Anda telah resmi diterbitkan oleh Jajaran Eksekutif Negara. Gunakan kredensial di bawah ini untuk mengakses Portal Resmi Pemerintahan:');
      setEmbedColor(savedBot.embedColor || '#F59E0B');
      setDefaultNote(savedBot.defaultNote || 'PENTING: Jaga kerahasiaan PIN ini. Jangan pernah berikan kepada siapapun. Pilih tab "🏛️ Portal Pemerintahan" pada saat masuk ke website.');

      setRosterConfig(getSavedGovRosterWebhookConfig());
      setDocConfig(getSavedGovDocumentWebhookConfig());
      setPinConfig(getSavedGovPinResetWebhookConfig());

      checkBotStatus();
    }
  }, [isOpen]);

  const checkBotStatus = async () => {
    try {
      const status = await getDiscordBotGatewayStatus();
      setGatewayStatus({
        isOnline: status.isOnline,
        botUser: status.botUser,
        status: status.status,
        lastError: status.lastError
      });
    } catch {}
  };

  const handleConnectGateway = async () => {
    if (!botToken.trim()) {
      alert('Masukkan Bot Token terlebih dahulu!');
      return;
    }
    setIsGatewayLoading(true);
    try {
      // Save token first
      saveDiscordBotConfig({ botToken: botToken.trim() });
      const res = await startDiscordBotGateway(botToken.trim());
      if (res.success) {
        await checkBotStatus();
      } else {
        alert(res.message || 'Gagal menghubungkan bot');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsGatewayLoading(false);
    }
  };

  const handleDisconnectGateway = async () => {
    setIsGatewayLoading(true);
    try {
      await stopDiscordBotGateway();
      await checkBotStatus();
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsGatewayLoading(false);
    }
  };

  const handleTestDm = async () => {
    if (!testTargetDiscord.trim()) {
      setTestDmResult({ success: false, message: 'Masukkan Username atau User ID Discord penerima uji coba!' });
      return;
    }
    if (!botToken.trim()) {
      setTestDmResult({ success: false, message: 'Masukkan Bot Token terlebih dahulu!' });
      return;
    }

    setIsTestingDm(true);
    setTestDmResult(null);

    // Save configuration first so server uses the latest token
    saveDiscordBotConfig({
      botToken: botToken.trim(),
      botName: botName.trim(),
      botAvatar: botAvatar.trim(),
      embedTitle: embedTitle.trim(),
      embedDescription: embedDesc.trim(),
      embedColor: embedColor.trim(),
      defaultNote: defaultNote.trim()
    });

    try {
      const res = await sendGovOfficerAccountDm({
        targetDiscord: testTargetDiscord.trim(),
        officerName: 'Pejabat Uji Coba',
        badge: '#GOV-001',
        rank: 'STAFF AHLI EKSEKUTIF',
        division: 'SEKRETARIAT NEGARA',
        pin: '7788',
        registeredBy: 'Presiden / Wakil Presiden',
        registeredByRank: 'PIMPINAN NEGARA',
        customMessage: 'Ini adalah pesan uji coba integrasi Bot Discord PM Pemerintahan HighState.'
      });
      setTestDmResult(res);
    } catch (err: any) {
      setTestDmResult({ success: false, message: 'Terjadi kendala: ' + (err?.message || err) });
    } finally {
      setIsTestingDm(false);
    }
  };

  const handleTestRosterWebhook = async () => {
    setTestingWebhook('roster');
    setTestWebhookResult(null);
    try {
      const res = await testGovRosterDiscordWebhook(rosterConfig);
      setTestWebhookResult(res);
    } catch (e: any) {
      setTestWebhookResult({ success: false, message: e.message });
    } finally {
      setTestingWebhook(null);
    }
  };

  const handleTestDocWebhook = async () => {
    setTestingWebhook('doc');
    setTestWebhookResult(null);
    try {
      const res = await testGovDocumentDiscordWebhook(docConfig);
      setTestWebhookResult(res);
    } catch (e: any) {
      setTestWebhookResult({ success: false, message: e.message });
    } finally {
      setTestingWebhook(null);
    }
  };

  const handleTestPinWebhook = async () => {
    setTestingWebhook('pin');
    setTestWebhookResult(null);
    try {
      const res = await testGovPinResetDiscordWebhook(pinConfig);
      setTestWebhookResult(res);
    } catch (e: any) {
      setTestWebhookResult({ success: false, message: e.message });
    } finally {
      setTestingWebhook(null);
    }
  };

  const handleSaveAll = () => {
    // 1. Save Bot PM settings
    saveDiscordBotConfig({
      botToken: botToken.trim(),
      botName: botName.trim(),
      botAvatar: botAvatar.trim(),
      embedTitle: embedTitle.trim(),
      embedDescription: embedDesc.trim(),
      embedColor: embedColor.trim(),
      defaultNote: defaultNote.trim()
    });

    // 2. Save Webhook settings
    saveGovRosterWebhookConfig(rosterConfig);
    saveGovDocumentWebhookConfig(docConfig);
    saveGovPinResetWebhookConfig(pinConfig);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-[#10141C] border-2 border-amber-500/70 rounded-xl shadow-2xl shadow-amber-950/50 w-full max-w-3xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-950/80 via-[#181E29] to-yellow-950/60 border-b border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/80 flex items-center justify-center text-amber-400 shadow-inner">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-100 tracking-wide flex items-center gap-1.5">
                  PENGATURAN WEBHOOK & BOT DISCORD PEMERINTAHAN
                </h2>
                <span className="text-[10px] bg-amber-500 text-black font-black px-1.5 py-0.5 rounded font-mono">
                  EKSEKUTIF
                </span>
              </div>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Konfigurasi Bot PM untuk kirim akun login ke Discord pejabat baru, Webhook Roster, & Dokumen Kenegaraan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 pt-2 bg-[#0C0F16] border-b border-gray-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('bot_dm')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'bot_dm'
                ? 'border-amber-400 text-amber-300 bg-[#161B26]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span>🤖 Bot PM (Kirim Akun Anggota)</span>
            {gatewayStatus.isOnline && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'roster'
                ? 'border-amber-400 text-amber-300 bg-[#161B26]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>🏛️ Webhook Roster Pejabat</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'documents'
                ? 'border-amber-400 text-amber-300 bg-[#161B26]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>📄 Webhook Surat & Dokumen</span>
          </button>

          <button
            onClick={() => setActiveTab('pin')}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
              activeTab === 'pin'
                ? 'border-amber-400 text-amber-300 bg-[#161B26]'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>🔑 Webhook Audit Reset PIN</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: BOT PM CONFIGURATION */}
          {activeTab === 'bot_dm' && (
            <div className="space-y-4">
              {/* Live Bot Gateway Status Banner */}
              <div className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                gatewayStatus.isOnline 
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200' 
                  : 'bg-gray-900/60 border-gray-700 text-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                    gatewayStatus.isOnline ? 'bg-emerald-400 shadow-md shadow-emerald-400/50 animate-pulse' : 'bg-rose-500'
                  }`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">
                        STATUS GATEWAY BOT DISCORD: {gatewayStatus.isOnline ? 'ONLINE & SIAP KIRIM PM' : 'OFFLINE (REST ACTIVE)'}
                      </span>
                      {gatewayStatus.botUser && (
                        <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded border border-emerald-700/60 font-mono text-emerald-300">
                          @{gatewayStatus.botUser.username}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {gatewayStatus.isOnline 
                        ? 'Bot terhubung ke Gateway Discord. Pesan Pribadi (PM/DM) dapat dikirim langsung ke anggota.'
                        : 'Bot belum tersambung ke Gateway 24/7. Klik tombol di samping untuk mengaktifkan status Online.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {gatewayStatus.isOnline ? (
                    <button
                      type="button"
                      onClick={handleDisconnectGateway}
                      disabled={isGatewayLoading}
                      className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-600 rounded text-xs font-bold transition flex items-center gap-1"
                    >
                      {isGatewayLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                      <span>Putuskan</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectGateway}
                      disabled={isGatewayLoading || !botToken.trim()}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {isGatewayLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                      <span>Sambungkan Bot Online</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bot Token Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <KeyRound className="w-3.5 h-3.5" />
                    BOT TOKEN DISCORD (WAJIB UNTUK BOT PM)
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    Didapat dari Discord Developer Portal &gt; Applications &gt; Bot &gt; Reset/Copy Token
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={botToken}
                    onChange={e => setBotToken(e.target.value)}
                    placeholder="Contoh: MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.G_XXXX.XXXXXXXXXXXXXX..."
                    className="w-full bg-[#161B26] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs font-mono text-gray-100 pr-10 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-200"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  ⚠️ Pastikan di Discord Developer Portal pada menu <strong>Bot</strong>, centang <strong>Privileged Gateway Intents</strong> (<em>PRESENCE INTENT</em>, <em>SERVER MEMBERS INTENT</em>, dan <em>MESSAGE CONTENT INTENT</em>).
                </p>
              </div>

              {/* Bot Identity Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-300">Nama Bot PM di Discord</label>
                  <input
                    type="text"
                    value={botName}
                    onChange={e => setBotName(e.target.value)}
                    placeholder="Sekretariat Negara | High State"
                    className="w-full bg-[#161B26] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-300">Avatar URL Bot PM</label>
                  <input
                    type="text"
                    value={botAvatar}
                    onChange={e => setBotAvatar(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#161B26] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Embed Content Customization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-300">Judul Embed Pesan PM</label>
                  <input
                    type="text"
                    value={embedTitle}
                    onChange={e => setEmbedTitle(e.target.value)}
                    placeholder="🏛️ Kredensial Akun Portal Pemerintahan HighState"
                    className="w-full bg-[#161B26] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-300">Warna Aksen Embed (Hex / Gold)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={embedColor.startsWith('#') ? embedColor : '#F59E0B'}
                      onChange={e => setEmbedColor(e.target.value)}
                      className="w-8 h-8 rounded border border-gray-700 bg-transparent cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={embedColor}
                      onChange={e => setEmbedColor(e.target.value)}
                      placeholder="#F59E0B"
                      className="w-full bg-[#161B26] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-300">Teks Pembuka / Deskripsi Embed</label>
                <textarea
                  rows={2}
                  value={embedDesc}
                  onChange={e => setEmbedDesc(e.target.value)}
                  className="w-full bg-[#161B26] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-300">Catatan Keamanan & Petunjuk Login</label>
                <textarea
                  rows={2}
                  value={defaultNote}
                  onChange={e => setDefaultNote(e.target.value)}
                  className="w-full bg-[#161B26] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none"
                />
              </div>

              {/* LIVE TESTING OF PM BOT */}
              <div className="p-3.5 bg-amber-950/20 border border-amber-500/50 rounded-lg space-y-2 mt-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">
                    UJI COBA PENGIRIMAN PESAN PRIBADI (PM/DM) BOT
                  </span>
                </div>
                <p className="text-[11px] text-gray-300">
                  Uji coba apakah Bot Discord dapat mengirim pesan PM ke akun Discord Anda atau akun staf:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={testTargetDiscord}
                    onChange={e => setTestTargetDiscord(e.target.value)}
                    placeholder="Masukkan Username Discord (e.g. momo) atau User ID (e.g. 1045239...)"
                    className="flex-1 bg-[#161B26] border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleTestDm}
                    disabled={isTestingDm || !botToken.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow disabled:opacity-50 shrink-0"
                  >
                    {isTestingDm ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Kirim Uji Coba PM</span>
                  </button>
                </div>

                {testDmResult && (
                  <div className={`p-2.5 rounded text-xs mt-2 flex items-start gap-2 ${
                    testDmResult.success ? 'bg-emerald-950/60 border border-emerald-500/60 text-emerald-300' : 'bg-rose-950/60 border border-rose-500/60 text-rose-300'
                  }`}>
                    {testDmResult.success ? <Check className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                    <div>
                      <p className="font-semibold">{testDmResult.message}</p>
                      {!testDmResult.success && (
                        <p className="text-[10px] text-gray-300 mt-1">
                          Tips: Pastikan akun target sudah join server Discord yang sama dengan bot, dan mengaktifkan izin <em>Direct Messages</em> (Pesan Langsung) dari anggota server.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ROSTER WEBHOOK CONFIGURATION */}
          {activeTab === 'roster' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-lg text-xs text-blue-300">
                📢 Webhook ini digunakan untuk menyiarkan pengumuman resmi pengangkatan / pelantikan pejabat baru ke channel Discord resmi.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-200">URL Discord Webhook Roster Pemerintah</label>
                <input
                  type="text"
                  value={rosterConfig.webhookUrl}
                  onChange={e => setRosterConfig({ ...rosterConfig, webhookUrl: e.target.value })}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full bg-[#161B26] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs font-mono text-gray-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-300">Nama Bot Webhook</label>
                  <input
                    type="text"
                    value={rosterConfig.botName}
                    onChange={e => setRosterConfig({ ...rosterConfig, botName: e.target.value })}
                    placeholder="Biro Kepegawaian & Roster Negara"
                    className="w-full bg-[#161B26] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-300">Avatar URL Bot Webhook</label>
                  <input
                    type="text"
                    value={rosterConfig.botAvatar}
                    onChange={e => setRosterConfig({ ...rosterConfig, botAvatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-[#161B26] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#161B26] border border-gray-700/80 rounded-lg">
                <div>
                  <span className="text-xs font-bold text-gray-200 block">Otomatis Siarkan saat Anggota Baru Didaftarkan</span>
                  <span className="text-[11px] text-gray-400">Kirim embed SK Pelantikan otomatis ke channel Discord saat pejabat baru disimpan ke Roster.</span>
                </div>
                <input
                  type="checkbox"
                  checked={rosterConfig.autoSendOnSave}
                  onChange={e => setRosterConfig({ ...rosterConfig, autoSendOnSave: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestRosterWebhook}
                  disabled={testingWebhook === 'roster' || !rosterConfig.webhookUrl.trim()}
                  className="px-3.5 py-2 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/60 rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {testingWebhook === 'roster' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>🧪 Uji Coba Sinyal Webhook Roster</span>
                </button>
              </div>

              {testWebhookResult && (
                <div className={`p-2.5 rounded text-xs flex items-center gap-2 ${
                  testWebhookResult.success ? 'bg-emerald-950/60 border border-emerald-500/60 text-emerald-300' : 'bg-rose-950/60 border border-rose-500/60 text-rose-300'
                }`}>
                  {testWebhookResult.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{testWebhookResult.message}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DOCUMENTS WEBHOOK CONFIGURATION */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg text-xs text-amber-300">
                📜 Webhook ini digunakan untuk mengirimkan arsip surat keputusan, izin kenegaraan, dan dokumen resmi yang diterbitkan oleh Eksekutif Pemerintahan.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-200">URL Discord Webhook Surat & Dokumen Kenegaraan</label>
                <input
                  type="text"
                  value={docConfig.webhookUrl}
                  onChange={e => setDocConfig({ ...docConfig, webhookUrl: e.target.value })}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full bg-[#161B26] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs font-mono text-gray-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-300">Nama Bot Webhook</label>
                  <input
                    type="text"
                    value={docConfig.botName}
                    onChange={e => setDocConfig({ ...docConfig, botName: e.target.value })}
                    placeholder="Arsip & Dokumen Resmi Kenegaraan"
                    className="w-full bg-[#161B26] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-300">Avatar URL Bot Webhook</label>
                  <input
                    type="text"
                    value={docConfig.botAvatar}
                    onChange={e => setDocConfig({ ...docConfig, botAvatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-[#161B26] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#161B26] border border-gray-700/80 rounded-lg">
                <div>
                  <span className="text-xs font-bold text-gray-200 block">Otomatis Kirim saat Dokumen Diterbitkan</span>
                  <span className="text-[11px] text-gray-400">Kirim embed dokumen kenegaraan secara otomatis ke channel Discord saat tombol Terbitkan ditekan.</span>
                </div>
                <input
                  type="checkbox"
                  checked={docConfig.autoSendOnSave}
                  onChange={e => setDocConfig({ ...docConfig, autoSendOnSave: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestDocWebhook}
                  disabled={testingWebhook === 'doc' || !docConfig.webhookUrl.trim()}
                  className="px-3.5 py-2 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/60 rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {testingWebhook === 'doc' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>🧪 Uji Coba Sinyal Webhook Dokumen</span>
                </button>
              </div>

              {testWebhookResult && (
                <div className={`p-2.5 rounded text-xs flex items-center gap-2 ${
                  testWebhookResult.success ? 'bg-emerald-950/60 border border-emerald-500/60 text-emerald-300' : 'bg-rose-950/60 border border-rose-500/60 text-rose-300'
                }`}>
                  {testWebhookResult.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{testWebhookResult.message}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PIN AUDIT WEBHOOK CONFIGURATION */}
          {activeTab === 'pin' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-xs text-emerald-300">
                🔒 Webhook ini mencatat audit keamanan setiap kali terjadi perubahan atau reset PIN login pejabat kenegaraan.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-200">URL Discord Webhook Audit PIN Pejabat</label>
                <input
                  type="text"
                  value={pinConfig.webhookUrl}
                  onChange={e => setPinConfig({ ...pinConfig, webhookUrl: e.target.value })}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full bg-[#161B26] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs font-mono text-gray-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-300">Nama Bot Webhook</label>
                  <input
                    type="text"
                    value={pinConfig.botName}
                    onChange={e => setPinConfig({ ...pinConfig, botName: e.target.value })}
                    placeholder="Audit Sandi & Kredensial Negara"
                    className="w-full bg-[#161B26] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-300">Avatar URL Bot Webhook</label>
                  <input
                    type="text"
                    value={pinConfig.botAvatar}
                    onChange={e => setPinConfig({ ...pinConfig, botAvatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-[#161B26] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestPinWebhook}
                  disabled={testingWebhook === 'pin' || !pinConfig.webhookUrl.trim()}
                  className="px-3.5 py-2 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/60 rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {testingWebhook === 'pin' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>🧪 Uji Coba Sinyal Webhook Audit PIN</span>
                </button>
              </div>

              {testWebhookResult && (
                <div className={`p-2.5 rounded text-xs flex items-center gap-2 ${
                  testWebhookResult.success ? 'bg-emerald-950/60 border border-emerald-500/60 text-emerald-300' : 'bg-rose-950/60 border border-rose-500/60 text-rose-300'
                }`}>
                  {testWebhookResult.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{testWebhookResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#0A0D14] border-t border-gray-800 flex items-center justify-between gap-3">
          <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
            <span>💾 Pengaturan tersinkronisasi otomatis ke Database Cloud Firestore.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg font-bold transition"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-md shadow-amber-900/40 flex items-center gap-1.5 transition active:scale-95"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-black" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-black" />
                  <span>Simpan Seluruh Pengaturan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
