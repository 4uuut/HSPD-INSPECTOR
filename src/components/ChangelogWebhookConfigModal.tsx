import React, { useState, useEffect } from 'react';
import { 
  X, MessageSquare, Send, CheckCircle2, AlertCircle, 
  ExternalLink, Sparkles, Shield, RefreshCw, Key
} from 'lucide-react';
import { 
  CHANGELOG_WEBHOOK_STORAGE_KEY, 
  CHANGELOG_MENTION_ROLE_KEY
} from '../utils/discordWebhook';
import { syncAllWebhooksToFirestore } from '../services/firebaseRealtimeSync';
import { checkAndBroadcastLatestRelease, LATEST_APP_RELEASE } from '../utils/autoChangelogBroadcaster';
import { SystemAnnouncement } from '../utils/systemAnnouncementStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pendingAnnouncement?: SystemAnnouncement | null;
  currentNotice?: SystemAnnouncement | null;
  onSuccessBroadcast?: (msg: string) => void;
}

export const ChangelogWebhookConfigModal: React.FC<Props> = ({
  isOpen,
  onClose,
  pendingAnnouncement,
  currentNotice,
  onSuccessBroadcast
}) => {
  const activeNotice = currentNotice || pendingAnnouncement;
  const [webhookUrl, setWebhookUrl] = useState('');
  const [mentionRole, setMentionRole] = useState('@everyone');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(CHANGELOG_WEBHOOK_STORAGE_KEY) || '';
      const savedMention = localStorage.getItem(CHANGELOG_MENTION_ROLE_KEY) || '@everyone';
      setWebhookUrl(saved);
      setMentionRole(savedMention);
      setTestStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveOnly = () => {
    const trimmed = webhookUrl.trim();
    if (trimmed && !trimmed.startsWith('https://discord.com/api/webhooks/')) {
      setTestStatus({
        success: false,
        message: 'Format URL Webhook tidak valid. Pastikan dimulai dengan https://discord.com/api/webhooks/...'
      });
      return;
    }

    if (trimmed) {
      localStorage.setItem(CHANGELOG_WEBHOOK_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(CHANGELOG_WEBHOOK_STORAGE_KEY);
    }
    localStorage.setItem(CHANGELOG_MENTION_ROLE_KEY, mentionRole);

    try {
      syncAllWebhooksToFirestore();
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('hspd-webhook-updated'));
    } catch {}

    setTestStatus({
      success: true,
      message: '✅ Konfigurasi Webhook Discord berhasil disimpan & disinkronkan ke Cloud!'
    });

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleTestOrBroadcast = async () => {
    const trimmed = webhookUrl.trim();
    if (!trimmed || !trimmed.startsWith('https://discord.com/api/webhooks/')) {
      setTestStatus({
        success: false,
        message: 'Masukkan URL Discord Webhook yang valid terlebih dahulu.'
      });
      return;
    }

    setIsTesting(true);
    setTestStatus(null);

    // Save configuration first
    localStorage.setItem(CHANGELOG_WEBHOOK_STORAGE_KEY, trimmed);
    localStorage.setItem(CHANGELOG_MENTION_ROLE_KEY, mentionRole);
    try {
      syncAllWebhooksToFirestore();
      window.dispatchEvent(new Event('storage'));
    } catch {}

    try {
      const targetPayload = activeNotice ? {
        version: activeNotice.version,
        title: activeNotice.title,
        headerText: `[ SIARAN RESMI PEMBARUAN SISTEM ${activeNotice.version} ]`,
        customDescription: activeNotice.description,
        newFeatures: activeNotice.features,
        improvements: activeNotice.improvements,
        bugFixes: activeNotice.bugFixes,
        mentionRole: mentionRole
      } : {
        ...LATEST_APP_RELEASE,
        mentionRole: mentionRole
      };

      const res = await checkAndBroadcastLatestRelease(true, targetPayload);
      if (res.success) {
        setTestStatus({
          success: true,
          message: `✅ Berhasil! Pengumuman (${targetPayload.version}) telah terkirim ke channel Discord Anda.`
        });
        if (onSuccessBroadcast) {
          onSuccessBroadcast(`Berhasil disiarkan ke Discord (#${targetPayload.version})!`);
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setTestStatus({
          success: false,
          message: `❌ ${res.message}`
        });
      }
    } catch (err: any) {
      setTestStatus({
        success: false,
        message: `❌ Gagal mengirim: ${err.message || 'Kesalahan jaringan'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0C121A] border border-cyan-500/50 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl shadow-cyan-950/40 text-gray-200 font-sans text-xs">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0E1B26] to-[#0A131C] p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-600/60 text-cyan-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <span>KONFIGURASI SALURAN WEBHOOK DISCORD</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-2 py-0.5 rounded font-bold">
                  LIVE UPDATE & PENGUMUMAN
                </span>
              </h3>
              <p className="text-[11px] text-gray-400 font-mono">
                Menghubungkan pusat pemberitahuan live ke channel Discord server Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 font-mono">
          {/* Guide Steps */}
          <div className="p-3 bg-[#080E16] border border-cyan-900/40 rounded-xl space-y-2 text-[11px] text-gray-300">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cara Mendapatkan Webhook URL Discord:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-gray-400 font-sans text-[11px] pl-1">
              <li>Buka server Discord Anda & pilih channel yang diinginkan (misal: <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded">#pengumuman</code> atau <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded">#update-sistem</code>).</li>
              <li>Klik ikon <strong>Edit Channel (Ikon Gear ⚙️)</strong> → Pilih menu <strong>Integrations (Integrasi)</strong>.</li>
              <li>Klik <strong>Webhooks</strong> → <strong>New Webhook (Buat Webhook)</strong> → Klik <strong>Copy Webhook URL</strong>.</li>
              <li>Tempelkan URL Webhook yang disalin ke kolom isian di bawah ini.</li>
            </ol>
          </div>

          {/* Input Webhook URL */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-300 flex items-center justify-between">
              <span>DISCORD WEBHOOK URL :</span>
              <span className={webhookUrl.startsWith('https://discord.com/api/webhooks/') ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {webhookUrl.startsWith('https://discord.com/api/webhooks/') ? '✓ Format Discord Valid' : 'Format Webhook Diperlukan'}
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/1234567890/token_webhook_anda..."
                className="w-full px-3 py-2.5 bg-[#070D14] border border-gray-700 focus:border-cyan-500 rounded-lg text-xs text-white placeholder:text-gray-600 outline-none transition font-mono"
              />
            </div>
          </div>

          {/* Mention Role Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-300">
              NOTIFIKASI MENTION ROLE SAAT PENGUMUMAN :
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: '@everyone', val: '@everyone' },
                { label: '@here', val: '@here' },
                { label: 'Role Warga', val: '<@&123456789>' },
                { label: 'Tanpa Mention', val: 'none' }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setMentionRole(opt.val)}
                  className={`py-2 px-2 rounded-lg font-bold text-center text-[10px] transition border cursor-pointer ${
                    mentionRole === opt.val
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                      : 'bg-[#080D14] text-gray-400 hover:text-gray-200 border-gray-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Message Alert */}
          {testStatus && (
            <div className={`p-3 rounded-lg border flex items-start gap-2 text-xs font-mono ${
              testStatus.success 
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200' 
                : 'bg-rose-950/80 border-rose-600 text-rose-200'
            }`}>
              {testStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{testStatus.message}</div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="bg-[#090F16] border-t border-gray-800 p-4 flex flex-wrap items-center justify-between gap-2.5 font-mono">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-300 text-xs font-bold transition cursor-pointer"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveOnly}
              className="px-3.5 py-2 rounded-lg bg-[#14202C] hover:bg-[#1B2C3D] border border-cyan-700/60 text-cyan-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Simpan Saja</span>
            </button>

            <button
              type="button"
              onClick={handleTestOrBroadcast}
              disabled={isTesting || !webhookUrl.trim()}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 cursor-pointer active:scale-95"
            >
              <Send className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Sedang Mengirim...' : (activeNotice ? 'Simpan & Siarkan Sekarang' : 'Simpan & Tes Kirim ke Discord')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
