import React, { useState } from 'react';
import { 
  Send, X, AlertTriangle, CheckCircle2, Shield, User, 
  KeyRound, MessageSquare, ExternalLink, HelpCircle, Copy, Check
} from 'lucide-react';
import { OfficerAccount } from '../types';
import { HSPD_LOGO_URL } from '../assets/logo';
import { sendPinResetRequestToDiscord, getSavedWebhookConfig } from '../utils/discordWebhook';
import { addPinResetRequest } from '../utils/pinResetStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialIdentifier?: string;
  roster: OfficerAccount[];
}

export const RequestPinDiscordModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialIdentifier = '',
  roster
}) => {
  const [officerName, setOfficerName] = useState(initialIdentifier);
  const [officerBadge, setOfficerBadge] = useState('');
  const [discordTag, setDiscordTag] = useState('');
  const [reason, setReason] = useState('Lupa PIN login MDT');
  const [requestedPin, setRequestedPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedFormat, setCopiedFormat] = useState(false);

  if (!isOpen) return null;

  const webhookConfig = getSavedWebhookConfig();
  const hasWebhook = Boolean(webhookConfig.webhookUrl && webhookConfig.webhookUrl.trim().startsWith('http'));

  const handleOfficerSelect = (val: string) => {
    setOfficerName(val);
    const clean = val.trim().toLowerCase();
    const cleanBadge = clean.startsWith('#') ? clean : `#${clean}`;
    const found = roster.find(r => 
      r.name.toLowerCase() === clean || 
      r.badge.toLowerCase() === clean || 
      r.badge.toLowerCase() === cleanBadge ||
      r.name.toLowerCase().includes(clean)
    );
    if (found) {
      setOfficerName(found.name);
      setOfficerBadge(found.badge);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedName = officerName.trim();
    const trimmedBadge = officerBadge.trim() || 'Cadet / Unassigned';
    const trimmedReason = reason.trim();

    if (!trimmedName) {
      setErrorMessage('Nama Petugas In-Game wajib diisi!');
      return;
    }

    if (!trimmedReason) {
      setErrorMessage('Alasan permintaan reset/ubah PIN wajib dicantumkan!');
      return;
    }

    // Try finding rank from roster
    const matched = roster.find(r => 
      r.name.toLowerCase() === trimmedName.toLowerCase() ||
      r.badge.toLowerCase() === trimmedBadge.toLowerCase()
    );

    setIsSubmitting(true);

    try {
      // Save locally to Superiors' Audit Log as well
      addPinResetRequest({
        officerName: trimmedName,
        officerBadge: matched ? matched.badge : trimmedBadge,
        officerRank: matched ? matched.rank : undefined,
        discordTag: discordTag.trim() || undefined,
        reason: trimmedReason,
        requestedPin: requestedPin.trim() || undefined,
        webhookSent: hasWebhook,
      });

      const res = await sendPinResetRequestToDiscord({
        officerName: trimmedName,
        officerBadge: matched ? matched.badge : trimmedBadge,
        rank: matched ? matched.rank : undefined,
        reason: trimmedReason,
        requestedNewPin: requestedPin.trim() || undefined,
        discordTag: discordTag.trim() || undefined
      });

      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          setIsSubmitting(false);
        }, 500);
      } else {
        // Even if webhook fails, ticket is recorded in internal audit log
        setSuccessMessage(`Permintaan telah dicatat ke Log Sistem Atasan. ${res.message}`);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrorMessage(`Terjadi kesalahan pengiriman: ${err.message || 'Cek koneksi'}`);
      setIsSubmitting(false);
    }
  };

  const formatCopyText = `🚨 **PERMINTAAN RESET / PENGUBAHAN PIN MDT**
👤 **Nama Petugas**: ${officerName || '[Nama In-Game]'}
👮 **Nomor Badge**: ${officerBadge || '[Badge #]'}
💬 **Discord**: ${discordTag || '[Discord Tag]'}
🔒 **PIN Baru yang Diajukan**: ${requestedPin || '[PIN Baru]'}
📝 **Alasan**: ${reason || 'Lupa PIN login MDT'}
Waktu: ${new Date().toLocaleString('id-ID')}`;

  const handleCopyDiscordFormat = () => {
    navigator.clipboard.writeText(formatCopyText);
    setCopiedFormat(true);
    setTimeout(() => setCopiedFormat(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150 font-mono text-xs">
      <div className="bg-[#161B22] border border-blue-600/50 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#0F1319] border-b border-gray-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group shrink-0">
              <img
                src={HSPD_LOGO_URL}
                alt="HSPD Crest"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-contain border border-blue-500/50 bg-black/60 p-0.5"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-100 uppercase tracking-tight flex items-center gap-1.5 font-sans">
                <KeyRound className="w-4 h-4 text-blue-400" />
                <span>PENGAJUAN RESET / GANTI PIN KE DISCORD</span>
              </h3>
              <p className="text-[10px] text-gray-400 font-mono">
                Teruskan permohonan pembaruan PIN login ke Webhook Discord Atasan
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

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Information Notice */}
          <div className="p-3 bg-blue-950/30 border border-blue-800/60 rounded-lg text-[11px] text-blue-300 space-y-1 leading-relaxed">
            <div className="font-bold flex items-center gap-1.5 text-blue-200">
              <Shield className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Sistem Keamanan & Otorisasi PIN Terpusat</span>
            </div>
            <p className="text-gray-300">
              Demi keamanan data MDT, pengubahan kode PIN login diproses melalui pengesahan <strong>High Command / Supervisor</strong> via notifikasi Webhook Discord.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage ? (
            <div className="p-4 bg-emerald-950/60 border border-emerald-600 rounded-xl text-emerald-200 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Permintaan Berhasil Terkirim ke Discord!</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {successMessage}
              </p>
              <div className="p-2.5 bg-black/40 border border-emerald-800/60 rounded-lg text-[11px] text-gray-300 space-y-1 font-mono">
                <div className="text-emerald-400 font-bold">Langkah Selanjutnya:</div>
                <div>1. Buka server Discord Kepolisian HighState.</div>
                <div>2. Cek channel tiket / command atau hubungi Atasan yang sedang On-Duty.</div>
                <div>3. Atasan akan memperbarui PIN Anda melalui menu Roster Management.</div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-lg transition"
                >
                  Tutup & Kembali ke Login
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Field 1: Nama Petugas */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  Nama Petugas In-Game <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => handleOfficerSelect(e.target.value)}
                  placeholder="Contoh: Leoarnd Neave, Marcus Vance..."
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none font-mono transition"
                  required
                />
              </div>

              {/* Field 2: Badge & Discord Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    Nomor Badge (Lencana)
                  </label>
                  <input
                    type="text"
                    value={officerBadge}
                    onChange={(e) => setOfficerBadge(e.target.value)}
                    placeholder="Contoh: #001 atau #101"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none font-mono transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    Username / ID Discord
                  </label>
                  <input
                    type="text"
                    value={discordTag}
                    onChange={(e) => setDiscordTag(e.target.value)}
                    placeholder="Contoh: @username / user#1234"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none font-mono transition"
                  />
                </div>
              </div>

              {/* Field 3: Alasan Permintaan */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  Alasan / Keterangan Permintaan <span className="text-rose-400">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 outline-none font-mono transition mb-1.5"
                >
                  <option value="Lupa PIN login MDT CAD">Lupa PIN login MDT CAD</option>
                  <option value="Permintaan Pembaruan PIN demi Keamanan">Permintaan Pembaruan PIN demi Keamanan</option>
                  <option value="Akun Baru Belum Menerima PIN Login">Akun Baru Belum Menerima PIN Login</option>
                  <option value="PIN Terkunci / Butuh Bantuan Atasan">PIN Terkunci / Butuh Bantuan Atasan</option>
                  <option value="Lainnya (Ketik Manual)">Lainnya (Tuliskan di bawah)</option>
                </select>
                {reason === 'Lainnya (Ketik Manual)' && (
                  <textarea
                    rows={2}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Tuliskan alasan pengajuan secara rinci..."
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none font-mono"
                    required
                  />
                )}
              </div>

              {/* Field 4: Usulan PIN Baru (Opsional) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    PIN Baru yang Diajukan (Opsional)
                  </label>
                  <span className="text-[9px] text-gray-500">Opsional</span>
                </div>
                <input
                  type="text"
                  value={requestedPin}
                  onChange={(e) => setRequestedPin(e.target.value)}
                  placeholder="Contoh: 84621 atau 10-4 (Opsional)"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none font-mono transition"
                />
                <span className="text-[10px] text-gray-500 block">
                  Atasan akan menetapkan PIN ini setelah melakukan verifikasi akun Anda.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleCopyDiscordFormat}
                  className="w-full sm:w-auto px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition flex items-center justify-center gap-1.5 text-xs font-mono"
                  title="Salin format teks untuk ditempel manual di Discord"
                >
                  {copiedFormat ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFormat ? 'Format Tersalin!' : 'Salin Format Teks'}</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Mengirim...' : 'KIRIM KE DISCORD WEBHOOK'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#0F1319] border-t border-gray-800 px-4 py-2 flex items-center justify-between text-[10px] text-gray-500 font-mono">
          <span>Target: Discord Webhook Channel</span>
          <span>HSPD Security Desk</span>
        </div>
      </div>
    </div>
  );
};
