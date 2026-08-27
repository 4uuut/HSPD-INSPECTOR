import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Send, X, AlertTriangle, CheckCircle2, Shield, User, 
  KeyRound, MessageSquare, HelpCircle,
  Sparkles, CheckCircle
} from 'lucide-react';
import { OfficerAccount } from '../types';
import { HSPD_LOGO_URL } from '../assets/logo';
import { sendPinResetRequestToDiscord, getSavedPinResetWebhookConfig } from '../utils/discordWebhook';
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
  const [officerName, setOfficerName] = useState('');
  const [officerBadge, setOfficerBadge] = useState('');
  const [discordTag, setDiscordTag] = useState('');
  const [reason, setReason] = useState('Lupa PIN login MDT CAD');
  const [requestedPin, setRequestedPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Initialize values when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
      setShowSuggestions(false);
      
      const initId = initialIdentifier.trim();
      if (initId) {
        setOfficerName(initId);
        // Look up in roster
        const clean = initId.toLowerCase();
        const cleanBadge = clean.startsWith('#') ? clean : `#${clean}`;
        const found = roster.find(r => 
          r.name.toLowerCase() === clean || 
          r.badge.toLowerCase() === clean || 
          r.badge.toLowerCase() === cleanBadge
        );
        if (found) {
          setOfficerName(found.name);
          setOfficerBadge(found.badge);
        } else {
          setOfficerBadge('');
        }
      } else {
        setOfficerName('');
        setOfficerBadge('');
      }
    }
  }, [isOpen, initialIdentifier, roster]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter roster suggestions based on user input
  const matchingOfficers = useMemo(() => {
    const q = officerName.trim().toLowerCase();
    if (!q) return [];
    return roster.filter(r => 
      r.name.toLowerCase().includes(q) || 
      r.badge.toLowerCase().includes(q) ||
      r.rank.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [officerName, roster]);

  // Check if current name exactly matches any officer in roster
  const matchedOfficer = useMemo(() => {
    const q = officerName.trim().toLowerCase();
    if (!q) return null;
    return roster.find(r => 
      r.name.toLowerCase() === q || 
      r.badge.toLowerCase() === q ||
      r.badge.toLowerCase() === (q.startsWith('#') ? q : `#${q}`)
    ) || null;
  }, [officerName, roster]);

  // Handle manual typing in Name field
  const handleNameInputChange = (val: string) => {
    setOfficerName(val);
    setShowSuggestions(true);

    const clean = val.trim().toLowerCase();
    const cleanBadge = clean.startsWith('#') ? clean : `#${clean}`;
    
    // Check if there is an exact name or badge match
    const exactMatch = roster.find(r => 
      r.name.toLowerCase() === clean || 
      r.badge.toLowerCase() === clean ||
      r.badge.toLowerCase() === cleanBadge
    );

    if (exactMatch) {
      // Auto-fill badge from database
      setOfficerBadge(exactMatch.badge);
    }
  };

  // Handle selecting an officer from suggestions list
  const handleSelectOfficer = (officer: OfficerAccount) => {
    setOfficerName(officer.name);
    setOfficerBadge(officer.badge);
    setShowSuggestions(false);
  };

  if (!isOpen) return null;

  const webhookConfig = getSavedPinResetWebhookConfig();
  const hasWebhook = Boolean(webhookConfig.webhookUrl && webhookConfig.webhookUrl.trim().startsWith('http'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedName = officerName.trim();
    const trimmedBadge = officerBadge.trim() || (matchedOfficer ? matchedOfficer.badge : '-');
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
    const matched = matchedOfficer || roster.find(r => 
      r.name.toLowerCase() === trimmedName.toLowerCase() ||
      (trimmedBadge !== '-' && r.badge.toLowerCase() === trimmedBadge.toLowerCase())
    );

    setIsSubmitting(true);

    try {
      // Save locally to Superiors' Audit Log as well
      addPinResetRequest({
        officerName: trimmedName,
        officerBadge: matched ? matched.badge : (trimmedBadge !== '-' ? trimmedBadge : '-'),
        officerRank: matched ? matched.rank : undefined,
        discordTag: discordTag.trim() || undefined,
        reason: trimmedReason,
        requestedPin: requestedPin.trim() || undefined,
        webhookSent: hasWebhook,
      });

      const res = await sendPinResetRequestToDiscord({
        officerName: trimmedName,
        officerBadge: matched ? matched.badge : (trimmedBadge !== '-' ? trimmedBadge : '-'),
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
              Ketik nama Anda di bawah. Jika nama sudah terdaftar di database Roster, <strong>nomor badge & pangkat akan terisi otomatis</strong>. Anda juga bebas mengetik manual jika data belum tercatat.
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
                <div>3. Atasan akan memverifikasi permohonan dan memperbarui PIN akun Anda.</div>
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
              {/* Field 1: Nama Petugas (Manual input + live smart suggestions & auto-fill) */}
              <div className="space-y-1 relative" ref={suggestionsRef}>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    Nama Petugas In-Game <span className="text-rose-400">*</span>
                  </label>
                  {matchedOfficer ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      {matchedOfficer.rank} ({matchedOfficer.badge})
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-500">
                      Ketik bebas / pilih dari roster
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => handleNameInputChange(e.target.value)}
                    onFocus={() => {
                      if (officerName.trim().length > 0) setShowSuggestions(true);
                    }}
                    placeholder="Ketik nama petugas (Contoh: Leoarnd Neave)..."
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none font-mono transition"
                    required
                  />
                  {officerName && (
                    <button
                      type="button"
                      onClick={() => {
                        setOfficerName('');
                        setOfficerBadge('');
                        setShowSuggestions(false);
                      }}
                      className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Suggestions List */}
                {showSuggestions && matchingOfficers.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#161B22] border border-blue-600/60 rounded-lg shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                    <div className="px-2.5 py-1.5 bg-[#0D1117] text-[10px] font-bold text-gray-400 border-b border-gray-800 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-blue-400">
                        <Sparkles className="w-3 h-3" />
                        Saran Anggota dari Database Roster:
                      </span>
                      <span>Klik untuk pilih</span>
                    </div>
                    {matchingOfficers.map((officer) => (
                      <button
                        key={officer.id}
                        type="button"
                        onClick={() => handleSelectOfficer(officer)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-900/30 border-b border-gray-800/50 last:border-0 flex items-center justify-between transition group"
                      >
                        <div>
                          <div className="font-bold text-gray-200 group-hover:text-blue-300 flex items-center gap-1.5">
                            <span>{officer.name}</span>
                            <span className="text-[10px] text-amber-400 font-normal">({officer.rank})</span>
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            Divisi: {officer.division || 'Patrol'}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800/60 font-bold">
                            {officer.badge}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Field 2: Badge & Discord Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      Nomor Badge / Lencana
                    </label>
                    <span className="text-[9px] text-gray-500">
                      {matchedOfficer ? 'Otomatis Terisi' : 'Bebas / Opsional'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={officerBadge}
                    onChange={(e) => setOfficerBadge(e.target.value)}
                    placeholder="Contoh: #001 atau 101"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none font-mono transition"
                  />
                  <span className="text-[9px] text-gray-500 block">
                    {matchedOfficer 
                      ? '✅ Terisi otomatis dari database. Bisa disesuaikan jika perlu.' 
                      : 'Bebas ketik nomor lencana atau kosongkan jika belum punya.'}
                  </span>
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
              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition text-xs font-mono"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 text-xs font-mono"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Mengirim...' : 'KIRIM KE DISCORD WEBHOOK'}</span>
                </button>
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

