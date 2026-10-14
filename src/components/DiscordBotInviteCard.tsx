import React, { useState, useEffect } from 'react';
import { 
  Bot, Check, Copy, ExternalLink, ShieldCheck, Sparkles, 
  ChevronDown, ChevronUp, Terminal, HelpCircle, CheckCircle2, XCircle
} from 'lucide-react';
import { extractClientIdFromToken, generateDiscordBotInviteUrl } from '../utils/discordWebhook';

interface Props {
  botToken?: string;
  botName?: string;
  theme?: 'sky' | 'emerald';
}

export const DiscordBotInviteCard: React.FC<Props> = ({
  botToken = '',
  botName = 'HSPD MDT Bot',
  theme = 'sky'
}) => {
  const detectedId = extractClientIdFromToken(botToken);
  const [clientId, setClientId] = useState(detectedId);
  const [includeBotScope, setIncludeBotScope] = useState(true);
  const [includeCommandsScope, setIncludeCommandsScope] = useState(true);
  const [isAdminPerm, setIsAdminPerm] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);

  // Auto-fill client ID if token changes and client ID is empty or was previously auto-detected
  useEffect(() => {
    const newDetected = extractClientIdFromToken(botToken);
    if (newDetected && (!clientId || clientId === detectedId)) {
      setClientId(newDetected);
    }
  }, [botToken]);

  const activeScopes: string[] = [];
  if (includeBotScope) activeScopes.push('bot');
  if (includeCommandsScope) activeScopes.push('applications.commands');

  const permissions = isAdminPerm ? 8 : 534723950656; // 8 = Administrator, 534723950656 = Recommended bot perms

  const inviteUrl = clientId.trim() 
    ? generateDiscordBotInviteUrl({
        clientId: clientId.trim(),
        scopes: activeScopes,
        permissions
      })
    : '';

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isEmerald = theme === 'emerald';
  const accentBorder = isEmerald ? 'border-emerald-500/50' : 'border-sky-500/50';
  const accentText = isEmerald ? 'text-emerald-400' : 'text-sky-400';
  const accentBg = isEmerald ? 'bg-emerald-950/60' : 'bg-sky-950/60';
  const buttonPrimary = isEmerald 
    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/50' 
    : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-sky-950/50';

  return (
    <div className={`p-4 rounded-xl border ${accentBorder} ${accentBg} space-y-4 font-sans text-xs`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-black/60 border border-gray-700 ${accentText}`}>
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-100 flex items-center gap-1.5 font-mono">
              <span>GENERATOR LINK UNDANG BOT (OAUTH2 INVITE)</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${isEmerald ? 'bg-emerald-900/60 text-emerald-300' : 'bg-sky-900/60 text-sky-300'}`}>
                Allow Developer
              </span>
            </h4>
            <p className="text-[11px] text-gray-400">
              Menghasilkan link otorisasi Discord resmi untuk mengundang bot Anda ke server dengan izin &quot;Allow developer&quot;.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowManualGuide(!showManualGuide)}
          className="text-[11px] text-gray-300 hover:text-white flex items-center gap-1 transition px-2.5 py-1 bg-gray-800/80 hover:bg-gray-700 rounded-lg border border-gray-700"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>{showManualGuide ? 'Tutup Panduan' : 'Lihat Langkah Portal'}</span>
          {showManualGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Manual Step Guide Accordion */}
      {showManualGuide && (
        <div className="p-3.5 bg-black/70 rounded-lg border border-gray-700/80 space-y-2.5 text-gray-300 animate-fadeIn">
          <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LANGKAH MANUAL DI DISCORD DEVELOPER PORTAL:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-gray-300 leading-relaxed">
            <li>
              Buka <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline font-bold inline-flex items-center gap-0.5">Discord Developer Portal <ExternalLink className="w-2.5 h-2.5" /></a> dan pilih Bot Anda.
            </li>
            <li>
              Pilih menu <strong>OAuth2</strong> &gt; <strong>URL Generator</strong> di bilah navigasi kiri.
            </li>
            <li>
              Pada bagian <strong>SCOPES</strong>, centang 2 pilihan ini:
              <ul className="list-disc list-inside ml-4 mt-0.5 text-gray-400 space-y-0.5 font-mono text-[10px]">
                <li><code className="text-emerald-400">bot</code> &rarr; Menghasilkan &quot;Add a bot to a server&quot;</li>
                <li><code className="text-emerald-400">applications.commands</code> &rarr; Menghasilkan &quot;Create commands&quot;</li>
              </ul>
            </li>
            <li>
              Pada bagian <strong>BOT PERMISSIONS</strong> di bawahnya, centang <strong>Administrator</strong> (atau <em>Send Messages</em>, <em>Embed Links</em>, <em>Read Message History</em>).
            </li>
            <li>
              Salin link yang muncul di bagian paling bawah (<strong>GENERATED URL</strong>), lalu buka di browser untuk mengundang bot ke server Discord Anda.
            </li>
          </ol>
        </div>
      )}

      {/* Input Application/Client ID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-200 block font-mono">
              APPLICATION / CLIENT ID DISCORD:
            </label>
            {detectedId && (
              <span className="text-[10px] text-emerald-400 font-mono">
                ✓ Terdeteksi dari Bot Token
              </span>
            )}
          </div>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value.trim())}
            placeholder="Contoh: 1250559001234567890 (17-20 digit angka)"
            className="w-full px-3 py-2 bg-[#0B0F17] border border-gray-700 focus:border-sky-500 rounded-lg text-xs text-gray-100 outline-none font-mono"
          />
          <span className="text-[10px] text-gray-400 block">
            ID ini otomatis diambil dari segmen pertama Bot Token Anda, atau bisa disalin langsung dari <strong>General Information &gt; Application ID</strong> di portal Discord.
          </span>
        </div>

        {/* Scope Checkboxes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-200 block font-mono">
            PILIHAN SCOPES &amp; IZIN (ALLOW DEVELOPER):
          </label>
          <div className="bg-[#0B0F17] border border-gray-700 rounded-lg p-2.5 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={includeBotScope}
                onChange={(e) => setIncludeBotScope(e.target.checked)}
                className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
              />
              <span className="font-mono text-[11px]">
                Scope <code>bot</code> <span className="text-gray-400">(Add a bot to a server)</span>
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={includeCommandsScope}
                onChange={(e) => setIncludeCommandsScope(e.target.checked)}
                className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
              />
              <span className="font-mono text-[11px]">
                Scope <code>applications.commands</code> <span className="text-gray-400">(Create commands)</span>
              </span>
            </label>
            <div className="border-t border-gray-800 pt-1.5 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">Hak Akses Server:</span>
              <button
                type="button"
                onClick={() => setIsAdminPerm(!isAdminPerm)}
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold transition ${
                  isAdminPerm ? 'bg-amber-950/80 text-amber-300 border border-amber-600/70' : 'bg-gray-800 text-gray-300'
                }`}
              >
                {isAdminPerm ? 'Administrator (Recommended)' : 'Standard Messages'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Realistic Discord Authorization Modal Preview (Matching User Screenshot) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-400 font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>TAMPILAN DIALOG DISCORD YANG AKAN MUNCUL (SESUAI GAMBAR):</span>
          </span>
          <span className="text-[10px] text-gray-500 italic">
            *Persis seperti otorisasi yang Anda tanyakan
          </span>
        </div>

        {/* Discord-style Card Simulation */}
        <div className="bg-[#2B2D31] border border-[#1E1F22] rounded-xl p-4 sm:p-5 text-gray-200 shadow-2xl max-w-md mx-auto font-sans">
          <p className="text-xs sm:text-sm text-gray-300 font-medium mb-3">
            This will allow the developer of <strong className="text-white font-bold">{botName || 'Bot Kita'}</strong> to:
          </p>

          <div className="space-y-2.5 pb-4 border-b border-[#35373C]">
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-[#5865F2] flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
              </div>
              <span className="text-xs sm:text-sm text-gray-100 font-medium">Add a bot to a server</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-[#5865F2] flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
              </div>
              <span className="text-xs sm:text-sm text-gray-100 font-medium">Create commands</span>
            </div>

            <div className="flex items-center gap-2.5 opacity-60">
              <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center shrink-0">
                <span className="text-[10px] text-gray-300 font-bold leading-none">&times;</span>
              </div>
              <span className="text-xs sm:text-sm text-gray-400 font-medium">
                Solve a mystery with Scooby and the gang <span className="text-[9px] text-gray-500 font-mono">(joke Discord)</span>
              </span>
            </div>
          </div>

          <div className="pt-3.5 space-y-2">
            <label className="text-xs font-bold text-gray-200 block">
              Add to server:
            </label>
            <div className="w-full bg-[#1E1F22] border border-[#35373C] rounded-lg px-3 py-2 text-xs text-gray-400 flex items-center justify-between">
              <span>Select a server</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-[10px] text-gray-400">
              This requires you to have <strong>Manage Server</strong> permission in the server.
            </p>
          </div>
        </div>
      </div>

      {/* Generated Link & Direct Action Buttons */}
      <div className="pt-2 border-t border-gray-800 space-y-2.5">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            readOnly
            value={inviteUrl || 'Masukkan Application / Client ID bot di atas untuk melihat link...'}
            className="w-full sm:flex-1 px-3 py-2 bg-[#0B0F17] border border-gray-700 rounded-lg text-xs text-gray-300 font-mono select-all outline-none"
          />
          <button
            type="button"
            onClick={handleCopy}
            disabled={!inviteUrl}
            className="w-full sm:w-auto px-3.5 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-200 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin!' : 'Salin Link'}</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[11px] text-gray-400">
            {inviteUrl ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Link otorisasi siap digunakan! Klik tombol di samping untuk langsung mengundang bot.
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                ⚠️ Masukkan Client ID atau Bot Token untuk membuat link otomatis.
              </span>
            )}
          </span>

          <a
            href={inviteUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!inviteUrl) {
                e.preventDefault();
              }
            }}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition ${
              inviteUrl ? `${buttonPrimary} cursor-pointer active:scale-95` : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>Undang Bot ke Server Sekarang (Add to Server)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
