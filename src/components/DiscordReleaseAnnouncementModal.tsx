import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Plus, Trash2, Send, CheckCircle2, AlertTriangle, 
  Sparkles, Wrench, Zap, Terminal, Copy, Check, Hash, RefreshCw, 
  Settings, Bot, ExternalLink, ShieldCheck, MessageSquare, Radio
} from 'lucide-react';
import { 
  CHANGELOG_WEBHOOK_STORAGE_KEY, 
  CHANGELOG_MENTION_ROLE_KEY 
} from '../utils/discordWebhook';

interface DiscordReleaseAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    name?: string;
    badge?: string;
    rank?: string;
  };
}

export const DiscordReleaseAnnouncementModal: React.FC<DiscordReleaseAnnouncementModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'commands' | 'settings'>('broadcast');

  // Form State
  const [version, setVersion] = useState('v3.2.0');
  const [title, setTitle] = useState('Pembaruan Sistem MDT HSPD');
  const [newFeatures, setNewFeatures] = useState<string[]>([
    'Tombol Tambah, Edit, dan Hapus Pasal Regulasi Hukum khusus Jajaran Atasan (High Command)',
    'Portal Akses Kalkulator Denda & Warga Sipil (Citizen Penal View)'
  ]);
  const [improvements, setImprovements] = useState<string[]>([
    'Integrasi Gateway Bot Discord 24/7 dengan dukungan pesan perintah server (CMD)',
    'Peningkatan kecepatan query pencarian pasal dan sinkronisasi realtime'
  ]);
  const [bugFixes, setBugFixes] = useState<string[]>([
    'Perbaikan otomatisasi port binding pada deployment Cloud Run',
    'Perbaikan normalisasi data lencana dan otentikasi login perwira'
  ]);
  const [extraNotes, setExtraNotes] = useState('Harap seluruh personel kepolisian menyegarkan (refresh) halaman MDT untuk memuat pembaharuan sistem terbaru.');
  const [mentionRole, setMentionRole] = useState('@everyone');

  // Inputs for adding new item
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [newImprovementInput, setNewImprovementInput] = useState('');
  const [newBugFixInput, setNewBugFixInput] = useState('');

  // Status & Bot Config
  const [botConfig, setBotConfig] = useState<any>({
    prefix: '!hspd',
    changelogChannelId: '',
    changelogMentionRole: '@everyone',
    dutyChannelId: '',
    rosterChannelId: ''
  });
  const [botStatus, setBotStatus] = useState<any>({ isOnline: false });
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);
  const [sendErrorMsg, setSendErrorMsg] = useState<string | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Load saved config on open
  useEffect(() => {
    if (isOpen) {
      loadBotConfig();
      const savedMention = localStorage.getItem(CHANGELOG_MENTION_ROLE_KEY);
      if (savedMention) setMentionRole(savedMention);
    }
  }, [isOpen]);

  const loadBotConfig = async () => {
    try {
      const res = await fetch('/api/discord/bot-config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setBotConfig(data.config);
          if (data.config.changelogMentionRole) {
            setMentionRole(data.config.changelogMentionRole);
          }
        }
        if (data.status) {
          setBotStatus(data.status);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch bot config:', e);
    }
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/discord/bot-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...botConfig,
          changelogMentionRole: mentionRole
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBotConfig(data.config);
        localStorage.setItem(CHANGELOG_MENTION_ROLE_KEY, mentionRole);
        setSendSuccessMsg('✅ Pengaturan Bot Server Discord berhasil disimpan!');
        setTimeout(() => setSendSuccessMsg(null), 3500);
      }
    } catch (err: any) {
      setSendErrorMsg(`Gagal menyimpan pengaturan: ${err.message}`);
      setTimeout(() => setSendErrorMsg(null), 3500);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSendAnnouncement = async () => {
    if (newFeatures.length === 0 && improvements.length === 0 && bugFixes.length === 0) {
      setSendErrorMsg('Harap masukkan minimal satu poin perubahan (Fitur Baru, Peningkatan, atau Perbaikan Bug)!');
      setTimeout(() => setSendErrorMsg(null), 3500);
      return;
    }

    setIsSending(true);
    setSendSuccessMsg(null);
    setSendErrorMsg(null);

    const savedWebhook = localStorage.getItem(CHANGELOG_WEBHOOK_STORAGE_KEY) || '';

    try {
      const res = await fetch('/api/discord/send-changelog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version,
          title,
          newFeatures,
          improvements,
          bugFixes,
          extraNotes,
          mentionRole,
          channelId: botConfig.changelogChannelId,
          webhookUrl: savedWebhook,
          authorName: currentUser?.name || 'High Command',
          authorBadge: currentUser?.badge || 'COMMAND',
          authorRank: currentUser?.rank || 'CHIEF OF POLICE'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSendSuccessMsg(data.message || 'Pembaruan berhasil dipublikasikan ke server Discord!');
      } else {
        setSendErrorMsg(data.message || 'Gagal mempublikasikan pembaruan ke Discord.');
      }
    } catch (err: any) {
      setSendErrorMsg(`Kendala jaringan: ${err.message || err}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Pusat Publikasi Pembaruan & Bot Discord
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {botStatus.isOnline ? '● Online 24/7' : '● Siaga'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Kirim pengumuman Fitur Baru, Peningkatan, dan Perbaikan Bug ke Discord server serta kelola settingan bot via CMD.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6">
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm transition ${
              activeTab === 'broadcast'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Kirim Pembaruan (Changelog)</span>
          </button>
          <button
            onClick={() => setActiveTab('commands')}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm transition ${
              activeTab === 'commands'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Daftar Perintah Server (CMD)</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm transition ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan Bot & Channel</span>
          </button>
        </div>

        {/* Notification Banner */}
        {sendSuccessMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{sendSuccessMsg}</span>
          </div>
        )}
        {sendErrorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{sendErrorMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: BROADCAST / KIRIM PEMBARUAN */}
          {activeTab === 'broadcast' && (
            <div className="space-y-4">
              {/* Auto Broadcast Status Alert Banner */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-start space-x-3 text-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-emerald-300 text-sm">Otomatisasi Penyiaran Pembaruan Aktif (Auto-Broadcast)</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-semibold">BOT AUTO-SEND</span>
                  </div>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    Setiap kali pembaruan sistem atau penambahan fitur baru dirilis, bot Discord secara <strong>otomatis menyiarkan pesan changelog ke channel Discord</strong> tanpa harus dikirim secara manual. Anda juga dapat menggunakan formulir di bawah untuk mempublikasikan catatan rilis kustom sewaktu-waktu.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Input Section */}
              <div className="lg:col-span-7 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Judul Rilis / Pengumuman
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="Pembaruan Sistem MDT HSPD"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Versi Sistem
                    </label>
                    <input
                      type="text"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="v3.2.0"
                    />
                  </div>
                </div>

                {/* 1. Fitur Baru */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> 🚀 Fitur Baru (New Features)
                    </span>
                    <span className="text-xs text-slate-500">{newFeatures.length} poin</span>
                  </div>
                  <div className="space-y-2 mb-3">
                    {newFeatures.map((item, idx) => (
                      <div key={idx} className="flex items-start space-x-2 bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-xs text-slate-200">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span className="flex-1">{item}</span>
                        <button
                          onClick={() => setNewFeatures(newFeatures.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newFeatureInput}
                      onChange={(e) => setNewFeatureInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newFeatureInput.trim()) {
                          setNewFeatures([...newFeatures, newFeatureInput.trim()]);
                          setNewFeatureInput('');
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      placeholder="Tambahkan fitur baru..."
                    />
                    <button
                      onClick={() => {
                        if (newFeatureInput.trim()) {
                          setNewFeatures([...newFeatures, newFeatureInput.trim()]);
                          setNewFeatureInput('');
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah
                    </button>
                  </div>
                </div>

                {/* 2. Peningkatan Sistem */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-4 h-4" /> ⚡ Peningkatan Sistem (Improvements)
                    </span>
                    <span className="text-xs text-slate-500">{improvements.length} poin</span>
                  </div>
                  <div className="space-y-2 mb-3">
                    {improvements.map((item, idx) => (
                      <div key={idx} className="flex items-start space-x-2 bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-xs text-slate-200">
                        <span className="text-amber-400 font-bold">•</span>
                        <span className="flex-1">{item}</span>
                        <button
                          onClick={() => setImprovements(improvements.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newImprovementInput}
                      onChange={(e) => setNewImprovementInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newImprovementInput.trim()) {
                          setImprovements([...improvements, newImprovementInput.trim()]);
                          setNewImprovementInput('');
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      placeholder="Tambahkan peningkatan performa..."
                    />
                    <button
                      onClick={() => {
                        if (newImprovementInput.trim()) {
                          setImprovements([...improvements, newImprovementInput.trim()]);
                          setNewImprovementInput('');
                        }
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah
                    </button>
                  </div>
                </div>

                {/* 3. Perbaikan Bug */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench className="w-4 h-4" /> 🛠️ Perbaikan Bug (Bug Fixes)
                    </span>
                    <span className="text-xs text-slate-500">{bugFixes.length} poin</span>
                  </div>
                  <div className="space-y-2 mb-3">
                    {bugFixes.map((item, idx) => (
                      <div key={idx} className="flex items-start space-x-2 bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-xs text-slate-200">
                        <span className="text-rose-400 font-bold">•</span>
                        <span className="flex-1">{item}</span>
                        <button
                          onClick={() => setBugFixes(bugFixes.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newBugFixInput}
                      onChange={(e) => setNewBugFixInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newBugFixInput.trim()) {
                          setBugFixes([...bugFixes, newBugFixInput.trim()]);
                          setNewBugFixInput('');
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                      placeholder="Tambahkan perbaikan bug..."
                    />
                    <button
                      onClick={() => {
                        if (newBugFixInput.trim()) {
                          setBugFixes([...bugFixes, newBugFixInput.trim()]);
                          setNewBugFixInput('');
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah
                    </button>
                  </div>
                </div>

                {/* Catatan Tambahan & Mention */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Catatan Tambahan
                    </label>
                    <textarea
                      rows={2}
                      value={extraNotes}
                      onChange={(e) => setExtraNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      placeholder="Instruksi untuk seluruh anggota..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Mention Target Ping
                    </label>
                    <select
                      value={mentionRole}
                      onChange={(e) => setMentionRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="@everyone">@everyone (Seluruh Server)</option>
                      <option value="@here">@here (Anggota Aktif)</option>
                      <option value="none">Tanpa Mention (Silent)</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Atau ketik ID role khusus via command <code className="text-blue-400">!hspd setping</code>.
                    </p>
                  </div>
                </div>

                {/* Send Button */}
                <div className="pt-2">
                  <button
                    onClick={handleSendAnnouncement}
                    disabled={isSending}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2 transition"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Sedang Mempublikasikan ke Server Discord...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>🚀 Publikasikan Pembaruan ke Server Discord</span>
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-slate-500 mt-2">
                    Target Channel: <span className="text-blue-400 font-mono">{botConfig.changelogChannelId ? `#${botConfig.changelogChannelId}` : 'Gunakan Webhook / Atur di Tab Settings'}</span>
                  </p>
                </div>
              </div>

              {/* Discord Live Preview Section */}
              <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> Tampilan Nyata di Discord (Preview)
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 font-mono">
                    #announcements
                  </span>
                </div>

                {/* Mock Discord Message */}
                <div className="bg-[#313338] rounded-xl p-4 text-slate-200 font-sans text-xs space-y-2 border border-slate-700/50 shadow-inner flex-1 flex flex-col justify-between">
                  <div>
                    {/* Bot header */}
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs border border-blue-400">
                        HP
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white text-sm">HSPD System Bot</span>
                          <span className="bg-[#5865F2] text-white text-[9px] font-bold px-1 rounded">BOT</span>
                          <span className="text-slate-400 text-[10px]">Hari ini pukul 20.00</span>
                        </div>
                        {mentionRole !== 'none' && (
                          <div className="text-blue-300 text-xs font-medium mt-0.5">
                            {mentionRole} <span className="text-slate-300 font-semibold">[ PENGUMUMAN PEMBARUAN SISTEM MDT HSPD ]</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Discord Embed Box */}
                    <div className="border-l-4 border-cyan-400 bg-[#2B2D31] rounded-r-lg p-3 space-y-2.5">
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-300">High State Police Department • Official System Release</span>
                      </div>

                      <div className="font-bold text-white text-sm">
                        📢 {title} • [{version}]
                      </div>

                      <div className="text-slate-300 text-[11px] leading-relaxed">
                        Catatan rilis pembaruan perangkat lunak dan operasional kepolisian telah resmi dirilis ke server.<br />
                        📅 <strong>Waktu Rilis:</strong> Hari ini<br />
                        👤 <strong>Dipublikasikan Oleh:</strong> <code className="bg-black/30 px-1 py-0.5 rounded text-blue-300">{currentUser?.name || 'High Command'}</code>
                      </div>

                      {newFeatures.length > 0 && (
                        <div>
                          <div className="font-bold text-emerald-400 text-xs flex items-center gap-1">
                            🚀 Fitur Baru (New Features)
                          </div>
                          <div className="mt-1 space-y-1 text-[11px] text-slate-300 pl-1">
                            {newFeatures.map((f, i) => (
                              <div key={i}>• {f}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {improvements.length > 0 && (
                        <div>
                          <div className="font-bold text-amber-400 text-xs flex items-center gap-1">
                            ⚡ Peningkatan Sistem (Improvements)
                          </div>
                          <div className="mt-1 space-y-1 text-[11px] text-slate-300 pl-1">
                            {improvements.map((f, i) => (
                              <div key={i}>• {f}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {bugFixes.length > 0 && (
                        <div>
                          <div className="font-bold text-rose-400 text-xs flex items-center gap-1">
                            🛠️ Perbaikan Bug (Bug Fixes)
                          </div>
                          <div className="mt-1 space-y-1 text-[11px] text-slate-300 pl-1">
                            {bugFixes.map((f, i) => (
                              <div key={i}>• {f}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {extraNotes && (
                        <div className="pt-1 border-t border-slate-700/60 text-[11px] text-slate-400">
                          📝 <strong>Catatan:</strong> {extraNotes}
                        </div>
                      )}

                      <div className="pt-2 flex items-center text-[10px] text-slate-400">
                        <span>HSPD MDC System • {version} • High State Government</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/40 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>💡 Desain embed berstandar Discord Webhook & Bot API</span>
                    <span className="text-emerald-400 font-semibold">100% Interaktif</span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* TAB 2: COMMANDS (CMD) REFERENCE */}
          {activeTab === 'commands' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/30 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-blue-400" />
                    Perintah Server Discord (Mendukung Simbol `!` atau `/`)
                  </h3>
                  <div className="flex items-center gap-1.5 bg-blue-500/20 border border-blue-500/40 px-2.5 py-1 rounded-full text-xs font-mono text-blue-300">
                    <span>Awalan: <strong>!</strong> atau <strong>/</strong></span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-1.5">
                  Anda dapat langsung mengontrol bot dari dalam server Discord menggunakan awalan tanda seru <strong>`!`</strong> maupun garis miring <strong>`/`</strong> (Slash Command), misalnya <code>/update fitur ...</code> atau <code>!hspd update fitur ...</code>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Pengumuman & Rilis */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm border-b border-slate-800 pb-2">
                    <Megaphone className="w-4 h-4" />
                    <span>Perintah Kirim Pembaruan (Changelog)</span>
                  </div>
                  
                  <div className="space-y-2.5">
                    {[
                      {
                        cmd: '!hspd update fitur <pesan>  |  /update fitur <pesan>',
                        desc: 'Kirim pengumuman rilis Fitur Baru ke channel pengumuman.',
                        example: '/update fitur Menambahkan tombol edit dan hapus pasal untuk atasan'
                      },
                      {
                        cmd: '!hspd update peningkatan <pesan>  |  /update peningkatan',
                        desc: 'Kirim rilis Peningkatan Sistem ke server.',
                        example: '/update peningkatan Optimalisasi sinkronisasi Firestore CAD'
                      },
                      {
                        cmd: '!hspd update bugfix <pesan>  |  /update bugfix <pesan>',
                        desc: 'Kirim pengumuman Perbaikan Bug ke server.',
                        example: '/update bugfix Memperbaiki bug kalkulator denda dan login PIN'
                      },
                      {
                        cmd: '!hspd changelog <v> | <fitur> | <peningkatan> | <fix>',
                        desc: 'Rilis changelog lengkap format multi-kategori.',
                        example: '!hspd changelog v3.2.0 | Fitur: Edit pasal | Peningkatan: Respons CAD | Fix: Port 8080'
                      },
                      {
                        cmd: '!hspd release  |  /release',
                        desc: 'Lihat panduan & template rilis cepat di Discord.',
                        example: '/release'
                      },
                      {
                        cmd: '!hspd test  |  /test',
                        desc: 'Kirim pesan uji coba ke channel pengumuman.',
                        example: '/test'
                      }
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <code className="text-emerald-300 font-mono font-semibold">{item.cmd}</code>
                          <button
                            onClick={() => handleCopy(item.example, `cmd-${i}`)}
                            className="text-slate-400 hover:text-white transition flex items-center gap-1"
                            title="Salin contoh"
                          >
                            {copiedCmd === `cmd-${i}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-slate-400 mt-1">{item.desc}</p>
                        <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                          Contoh: <span className="text-slate-300">{item.example}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Pengaturan Bot & Channel */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm border-b border-slate-800 pb-2">
                    <Settings className="w-4 h-4" />
                    <span>Perintah Pengaturan Bot (CMD Settings)</span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      {
                        cmd: '!hspd setchannel update #channel',
                        desc: 'Tentukan channel Discord tujuan untuk pengumuman pembaruan.',
                        example: '!hspd setchannel update #pengumuman-mdt'
                      },
                      {
                        cmd: '!hspd setchannel duty #channel',
                        desc: 'Tentukan channel Discord tujuan untuk log dinas/patroli.',
                        example: '!hspd setchannel duty #absensi-dinas'
                      },
                      {
                        cmd: '!hspd setchannel roster #channel',
                        desc: 'Tentukan channel Discord tujuan untuk perubahan anggota.',
                        example: '!hspd setchannel roster #roster-personel'
                      },
                      {
                        cmd: '!hspd setping @everyone / @here / none',
                        desc: 'Atur role yang di-mention saat mengirim pengumuman rilis.',
                        example: '!hspd setping @everyone'
                      },
                      {
                        cmd: '!hspd config',
                        desc: 'Tampilkan status semua channel & pengaturan bot saat ini.',
                        example: '!hspd config'
                      },
                      {
                        cmd: '!hspd status',
                        desc: 'Periksa status koneksi online, uptime, dan latency bot.',
                        example: '!hspd status'
                      }
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <code className="text-blue-300 font-mono font-semibold">{item.cmd}</code>
                          <button
                            onClick={() => handleCopy(item.example, `set-${i}`)}
                            className="text-slate-400 hover:text-white transition flex items-center gap-1"
                            title="Salin contoh"
                          >
                            {copiedCmd === `set-${i}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-slate-400 mt-1">{item.desc}</p>
                        <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                          Contoh: <span className="text-slate-300">{item.example}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tips & Izin */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-2">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Hak Akses & Keamanan Command
                </div>
                <p>
                  • Perintah setting seperti <code className="text-blue-300">!hspd setchannel</code> dan rilis <code className="text-emerald-300">!hspd update</code> secara otomatis diproteksi: hanya anggota dengan hak <strong>Administrator Server Discord</strong> atau perwira jajaran <strong>Atasan (High Command)</strong> yang terdaftar di Roster yang dapat mengeksekusinya.
                </p>
                <p>
                  • Anda juga dapat me-mention bot secara langsung (misal: <code className="text-blue-300">@HSPD Bot update fitur ...</code>) atau mengirim DM pribadi ke bot!
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS (PENGATURAN BOT) */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-400" />
                  Konfigurasi Channel Penyiaran Bot
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      📢 Channel ID Pembaruan & Changelog
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={botConfig.changelogChannelId || ''}
                          onChange={(e) => setBotConfig({ ...botConfig, changelogChannelId: e.target.value.trim() })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                          placeholder="123456789012345678"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Masukkan ID Channel Discord (bisa juga diatur langsung dari Discord menggunakan <code className="text-blue-400">!hspd setchannel update #channel</code>).
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      📋 Channel ID Absensi Dinas (Duty)
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={botConfig.dutyChannelId || ''}
                        onChange={(e) => setBotConfig({ ...botConfig, dutyChannelId: e.target.value.trim() })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                        placeholder="123456789012345678 (Opsional)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      👥 Channel ID Roster & Mutasi
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={botConfig.rosterChannelId || ''}
                        onChange={(e) => setBotConfig({ ...botConfig, rosterChannelId: e.target.value.trim() })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                        placeholder="123456789012345678 (Opsional)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        🏷️ Prefix Perintah
                      </label>
                      <input
                        type="text"
                        value={botConfig.prefix || '!hspd'}
                        onChange={(e) => setBotConfig({ ...botConfig, prefix: e.target.value.trim() })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                        placeholder="!hspd"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        🔔 Default Mention Ping
                      </label>
                      <input
                        type="text"
                        value={mentionRole}
                        onChange={(e) => setMentionRole(e.target.value.trim())}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                        placeholder="@everyone / none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleSaveConfig}
                    disabled={isSavingConfig}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl shadow text-xs flex items-center space-x-2 transition"
                  >
                    {isSavingConfig ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Simpan Pengaturan Bot</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Bot className="w-4 h-4 text-blue-400" />
            <span>High State Police Department • Discord Release Hub</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
