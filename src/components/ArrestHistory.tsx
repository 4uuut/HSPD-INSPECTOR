import React, { useState, useEffect, useRef } from 'react';
import { ArrestRecord, OfficerProfile, isOfficerHighRank } from '../types';
import {
  FileText, Copy, Check, Trash2, Calendar, User, Shield, DollarSign,
  Send, Share2, Download, Upload, Search, Sparkles, AlertCircle,
  CheckCircle2, Globe, RefreshCw, FileSpreadsheet, Lock, Unlock, ExternalLink,
  Code, SlidersHorizontal, ChevronDown, ChevronUp, MapPin, Camera, Package, BadgeCheck, Image as ImageIcon,
  ShieldAlert, KeyRound, ArrowRight, ZoomIn, X, Clock
} from 'lucide-react';
import { 
  getSavedWebhookConfig, saveWebhookConfig, sendArrestRecordToDiscord, 
  testDiscordWebhook, WEBHOOK_STORAGE_KEY, BOT_NAME_KEY, BOT_AVATAR_KEY 
} from '../utils/discordWebhook';
import { 
  validateAuthorityPin, getAuthorityPinConfig, formatRemainingTime,
  AuthorityPinConfig 
} from '../utils/authorityPin';
import { AuthorityPinModal } from './AuthorityPinModal';
import { HSPD_LOGO_URL } from '../assets/logo';

interface Props {
  records: ArrestRecord[];
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  onImportRecords?: (records: ArrestRecord[]) => void;
  currentOfficer?: OfficerProfile | null;
  onSwitchOfficer?: () => void;
  onOpenAuthorityModal?: () => void;
}

export const ArrestHistory: React.FC<Props> = ({
  records,
  onDeleteRecord,
  onClearAll,
  onImportRecords,
  currentOfficer,
  onSwitchOfficer,
  onOpenAuthorityModal,
}) => {
  // Authority PIN & Supervisor Clearance state
  const [supervisorBypass, setSupervisorBypass] = useState(false);
  const [supervisorPinInput, setSupervisorPinInput] = useState('');
  const [pinValidationResult, setPinValidationResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [isAuthorityModalOpen, setIsAuthorityModalOpen] = useState(false);
  const [authorityConfig, setAuthorityConfig] = useState<AuthorityPinConfig>(() => getAuthorityPinConfig());
  const [timeRemaining, setTimeRemaining] = useState(() => formatRemainingTime(authorityConfig.expiresAt));

  // Sync authority PIN config on timer tick
  useEffect(() => {
    const fresh = getAuthorityPinConfig();
    setAuthorityConfig(fresh);
    setTimeRemaining(formatRemainingTime(fresh.expiresAt));

    const interval = setInterval(() => {
      const current = getAuthorityPinConfig();
      setAuthorityConfig(current);
      setTimeRemaining(formatRemainingTime(current.expiresAt));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Webhook State
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem(WEBHOOK_STORAGE_KEY) || '');
  const [botName, setBotName] = useState(() => localStorage.getItem(BOT_NAME_KEY) || 'HSPD CAD System');
  const [botAvatar, setBotAvatar] = useState(() => localStorage.getItem(BOT_AVATAR_KEY) || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png');
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);

  // Sending status
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [webhookStatusMessage, setWebhookStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Clipboard & UI State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCooperative, setFilterCooperative] = useState<'all' | 'coop' | 'normal'>('all');
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<{ url: string; title: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save webhook settings to localStorage
  useEffect(() => {
    saveWebhookConfig({ webhookUrl, botName, botAvatar });
  }, [webhookUrl, botName, botAvatar]);

  // Copy handler
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Plain Text Report Format
  const formatReport = (r: ArrestRecord) => {
    const dateStr = new Date(r.timestamp).toLocaleString('id-ID');
    return `[HSPD ARREST REPORT - ${r.suspectName.toUpperCase()}]
Tanggal/Waktu : ${dateStr}
Nama Suspect  : ${r.suspectName} (ID In-Game: ${r.suspectId})
Petugas       : ${r.officerName} (Badge: ${r.officerBadge})${r.partnerOfficer ? ` | Partner: ${r.partnerOfficer}` : ''}
Lokasi TKP    : ${r.location || 'Los Santos'}
Barang Sitaan : ${r.confiscatedItems || 'Tidak ada'}
Bukti Evidence: ${r.evidenceUrl ? (r.evidenceUrl.startsWith('data:image/') ? '[Foto Bukti Terlampir]' : r.evidenceUrl) : 'Tidak ada'}
Pasal         : ${r.pasalCodes.join(', ')}
Total Denda   : $${r.totalFine.toLocaleString()} ${r.isCooperative ? '(-20% Kooperatif)' : ''}
Hukuman Sel   : ${r.totalJail} Bulan
Impound       : ${r.totalImpound} Hari
Kronologi     : ${r.chronology || r.notes || '-'}
Perintah /giveinvoice: /giveinvoice ${r.suspectId || r.suspectName.replace(/\s+/g, '_')} ${r.totalFine} ${r.pasalCodes.join(',')}
Perintah /arrest     : /arrest ${r.suspectId || r.suspectName.replace(/\s+/g, '_')} ${r.totalJail} ${r.totalFine} ${r.pasalCodes.join(',')}
------------------------------------------------`;
  };

  // Forum BBCode Report Format
  const formatBBCodeReport = (r: ArrestRecord) => {
    const dateStr = new Date(r.timestamp).toLocaleString('id-ID');
    const isImage = r.evidenceUrl && !r.evidenceUrl.startsWith('data:image/') && (
      r.evidenceUrl.includes('imgur.com') ||
      r.evidenceUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i)
    );

    return `[b][color=#0066cc][size=125][HSPD ARREST & CAD REPORT - ${r.suspectName.toUpperCase()}][/size][/color][/b]
[hr]
[b]Tanggal/Waktu:[/b] ${dateStr}
[b]Nama Tersangka (Suspect):[/b] ${r.suspectName} (ID In-Game: ${r.suspectId})
[b]Petugas Polisi Penindak:[/b] ${r.officerName} [Badge: ${r.officerBadge}]${r.partnerOfficer ? `\n[b]Petugas Rekan / Partner:[/b] ${r.partnerOfficer}` : ''}
[b]Lokasi Kejadian (TKP):[/b] ${r.location || 'Los Santos'}
[b]Barang Bukti Disita (Contraband):[/b] ${r.confiscatedItems || 'Tidak ada'}
[b]Pelanggaran Pasal:[/b] ${r.pasalCodes.join(', ')}
[b]Total Denda:[/b] $${r.totalFine.toLocaleString()} ${r.isCooperative ? '[color=#00aa00](Diskon Kooperatif 20%)[/color]' : ''}
[b]Hukuman Penjara:[/b] ${r.totalJail} Bulan
[b]Sita Kendaraan (Impound):[/b] ${r.totalImpound} Hari
[b]Kronologi / Keterangan Penangkapan:[/b]
${r.chronology || r.notes || '-'}
${r.evidenceUrl ? `\n[b]Bukti / Evidence (Foto / Video):[/b]\n${isImage ? `[img]${r.evidenceUrl}[/img]` : r.evidenceUrl.startsWith('data:image/') ? `[i][Foto Bukti Terlampir dari Perangkat][/i]` : `[url=${r.evidenceUrl}]Lihat Bukti Lampiran[/url]`}` : ''}
[hr]
[i]Laporan ini digenerate secara otomatis oleh HSPD CAD System.[/i]`;
  };

  // Send single record to Discord Webhook
  const handleSendToDiscord = async (record: ArrestRecord) => {
    if (!webhookUrl.trim()) {
      setShowWebhookConfig(true);
      setWebhookStatusMessage({
        type: 'error',
        text: 'Masukkan URL Discord Webhook terlebih dahulu pada pengaturan di bawah.'
      });
      return;
    }

    setSendingId(record.id);
    setWebhookStatusMessage(null);

    try {
      const res = await sendArrestRecordToDiscord(record, {
        webhookUrl,
        botName,
        botAvatar
      });

      if (res.success) {
        setWebhookStatusMessage({
          type: 'success',
          text: `✅ ${res.message}`
        });
      } else {
        setWebhookStatusMessage({
          type: 'error',
          text: `❌ ${res.message}`
        });
      }
      setTimeout(() => setWebhookStatusMessage(null), 5000);
    } catch (err: any) {
      console.error('Webhook error:', err);
      setWebhookStatusMessage({
        type: 'error',
        text: `Gagal mengirim ke Discord: ${err.message || 'Cek koneksi atau Webhook URL'}`
      });
    } finally {
      setSendingId(null);
    }
  };

  // Send all filtered/selected records to Discord Webhook
  const handleSendAllToDiscord = async () => {
    if (!webhookUrl.trim()) {
      setShowWebhookConfig(true);
      setWebhookStatusMessage({
        type: 'error',
        text: 'Masukkan URL Discord Webhook terlebih dahulu pada panel konfigurasi.'
      });
      return;
    }

    if (records.length === 0) return;

    if (!window.confirm(`Kirim seluruh ${records.length} riwayat kasus ke channel Discord Webhook?`)) {
      return;
    }

    setIsSendingAll(true);
    setWebhookStatusMessage(null);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        const res = await sendArrestRecordToDiscord(record, {
          webhookUrl,
          botName,
          botAvatar
        });

        if (res.success) {
          successCount++;
        } else {
          failCount++;
        }

        // Delay between posts
        await new Promise(r => setTimeout(r, 700));
      } catch (err) {
        failCount++;
      }
    }

    setIsSendingAll(false);
    if (failCount === 0) {
      setWebhookStatusMessage({
        type: 'success',
        text: `Sukses mengirim seluruh ${successCount} laporan kasus ke Discord!`
      });
    } else {
      setWebhookStatusMessage({
        type: 'error',
        text: `Selesai: ${successCount} berhasil, ${failCount} gagal dikirim.`
      });
    }
    setTimeout(() => setWebhookStatusMessage(null), 6000);
  };

  // Test Ping Webhook
  const handleTestPingWebhook = async () => {
    if (!webhookUrl.trim()) {
      setWebhookStatusMessage({
        type: 'error',
        text: 'Silakan isi URL Discord Webhook terlebih dahulu.'
      });
      return;
    }

    setIsTestingWebhook(true);
    setWebhookStatusMessage(null);

    try {
      const res = await testDiscordWebhook({
        webhookUrl,
        botName,
        botAvatar,
        autoSendOnSave: true
      });

      if (res.success) {
        setWebhookStatusMessage({
          type: 'success',
          text: res.message
        });
      } else {
        setWebhookStatusMessage({
          type: 'error',
          text: res.message
        });
      }
    } catch (err: any) {
      setWebhookStatusMessage({
        type: 'error',
        text: `Gagal mengirim ping: ${err.message}`
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (records.length === 0) return;

    const headers = [
      'Timestamp',
      'Tanggal/Waktu',
      'Nama Suspect',
      'ID In-Game',
      'Petugas Polisi',
      'Badge Petugas',
      'Partner Petugas',
      'Lokasi TKP',
      'Barang Sitaan',
      'Pasal',
      'Total Denda ($)',
      'Total Penjara (Bulan)',
      'Total Impound (Hari)',
      'Status Kooperatif',
      'Kronologi/Catatan',
      'Bukti Evidence URL'
    ];

    const rows = records.map(r => [
      r.timestamp,
      `"${new Date(r.timestamp).toLocaleString('id-ID')}"`,
      `"${(r.suspectName || '').replace(/"/g, '""')}"`,
      `"${(r.suspectId || '').replace(/"/g, '""')}"`,
      `"${(r.officerName || '').replace(/"/g, '""')}"`,
      `"${(r.officerBadge || '').replace(/"/g, '""')}"`,
      `"${(r.partnerOfficer || '').replace(/"/g, '""')}"`,
      `"${(r.location || '').replace(/"/g, '""')}"`,
      `"${(r.confiscatedItems || '').replace(/"/g, '""')}"`,
      `"${(r.pasalCodes || []).join('; ')}"`,
      r.totalFine,
      r.totalJail,
      r.totalImpound,
      r.isCooperative ? 'YA (-20%)' : 'TIDAK',
      `"${(r.chronology || r.notes || '').replace(/"/g, '""')}"`,
      `"${(r.evidenceUrl ? (r.evidenceUrl.startsWith('data:image/') ? '[Foto Upload]' : r.evidenceUrl) : '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HSPD_Arrest_Database_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `HSPD_CAD_Backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON Backup
  const handleImportJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && onImportRecords) {
          onImportRecords(parsed);
          alert(`Sukses memuat ${parsed.length} riwayat kasus dari file JSON.`);
        } else {
          alert('Format file JSON tidak valid untuk database penangkapan HSPD.');
        }
      } catch (err) {
        alert('Gagal membaca file JSON. Pastikan file valid.');
      }
    };
    reader.readAsText(file);
  };

  // Copy all reports to clipboard
  const copyAllReports = () => {
    const combined = filteredRecords.map(formatReport).join('\n\n');
    handleCopy(combined, 'all-reports');
  };

  // Filter records
  const filteredRecords = records.filter(r => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q ||
      r.suspectName.toLowerCase().includes(q) ||
      r.suspectId.toLowerCase().includes(q) ||
      r.officerName.toLowerCase().includes(q) ||
      r.officerBadge.toLowerCase().includes(q) ||
      (r.location && r.location.toLowerCase().includes(q)) ||
      r.pasalCodes.some(c => c.toLowerCase().includes(q));

    const matchCoop =
      filterCooperative === 'all' ||
      (filterCooperative === 'coop' && r.isCooperative) ||
      (filterCooperative === 'normal' && !r.isCooperative);

    return matchQuery && matchCoop;
  });

  // Calculate Cumulative Metrics
  const totalFineSum = records.reduce((acc, r) => acc + r.totalFine, 0);
  const totalJailSum = records.reduce((acc, r) => acc + r.totalJail, 0);
  const totalImpoundSum = records.reduce((acc, r) => acc + r.totalImpound, 0);

  // Check supervisor / high rank clearance
  const isHighRank = isOfficerHighRank(currentOfficer?.rank);
  const hasAccess = isHighRank || supervisorBypass;

  // Render Access Denied Lock Screen for field patrol officers requiring Authority PIN
  if (!hasAccess) {
    return (
      <div id="arrest-history-access-locked" className="p-5 sm:p-7 bg-[#161B22] border-2 border-amber-600/70 rounded-xl space-y-5 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600"></div>

        {/* Lock Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-gray-800 pb-4 text-center sm:text-left">
          <div className="relative group shrink-0">
            <div className="w-14 h-14 rounded-full bg-black/70 p-1 border-2 border-amber-500/60 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <img
                src={HSPD_LOGO_URL}
                alt="HSPD Crest"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-600 text-black p-1 rounded-full border border-black shadow">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/60 text-[10px] font-mono text-amber-300 font-bold">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>SOP KEAMANAN BERKAS INVESTIGASI POLISI</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-100 uppercase tracking-tight font-mono">
              VERIFIKASI PIN OTORITAS PEMBUKA BERKAS
            </h2>
            <p className="text-xs text-gray-400 font-mono">
              Arsip investigasi kasus, barang bukti kejahatan, dan Discord Webhook dilindungi oleh PIN Otoritas Atasan.
            </p>
          </div>
        </div>

        {/* Security Policy Information Card */}
        <div className="p-4 bg-[#0D1117] border border-gray-800 rounded-xl space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              <span>
                Petugas Aktif: <strong className="text-gray-100">{currentOfficer?.name || 'Petugas Patroli'}</strong> ({currentOfficer?.badge || '#000'})
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-gray-800 text-[10px] text-gray-300 border border-gray-700">
              Pangkat: {currentOfficer?.rank || 'Patrol Officer'}
            </span>
          </div>

          <div className="p-3 bg-amber-950/20 border border-amber-900/50 rounded-lg text-xs text-amber-300/90 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Sistem Pembaruan PIN Otoritas:</span>
            </div>
            <p className="text-[11px] text-gray-300">
              • PIN Otoritas <strong>hanya dapat dibuat oleh Pihak Atasan / High Command</strong> (Chief, Assistant Chief, Deputy Chief, Commander, Captain, Lieutenant, Sergeant).
              <br />
              • PIN diperbarui secara <strong>Otomatis setiap 1 Jam sekali</strong> atau diatur secara <strong>Manual oleh Atasan</strong>.
              <br />
              • Hubungi atasan yang sedang on-duty via Radio Kepolisian / Discord untuk mendapatkan kode PIN aktif saat ini.
            </p>
          </div>

          {/* Form Input PIN Otoritas */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const result = validateAuthorityPin(supervisorPinInput);
              setPinValidationResult(result);
              if (result.valid) {
                setSupervisorBypass(true);
              }
            }}
            className="pt-2 border-t border-gray-800 space-y-3"
          >
            <label className="block text-xs font-bold text-gray-200">
              MASUKKAN KODE PIN OTORITAS AKTIF DARI ATASAN:
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <KeyRound className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={supervisorPinInput}
                  onChange={(e) => {
                    setSupervisorPinInput(e.target.value);
                    setPinValidationResult(null);
                  }}
                  placeholder="Masukkan 6 Digit PIN Otoritas..."
                  className="w-full pl-9 pr-3 py-2.5 bg-[#161B22] border-2 border-gray-700 focus:border-amber-500 rounded-lg text-sm text-amber-300 font-mono tracking-widest outline-none font-bold uppercase"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs rounded-lg transition flex items-center justify-center gap-2 font-mono shadow-md shadow-amber-600/30 shrink-0"
              >
                <Unlock className="w-4 h-4" />
                <span>BUKA BERKAS KASUS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Validation Feedback Message */}
            {pinValidationResult && (
              <div
                className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 animate-in fade-in duration-150 ${
                  pinValidationResult.valid
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
                    : 'bg-rose-950/60 text-rose-300 border-rose-800'
                }`}
              >
                {pinValidationResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{pinValidationResult.message}</span>
              </div>
            )}
          </form>

          {/* Quick Actions Footer for Patrol / Supervisors */}
          <div className="pt-3 border-t border-gray-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            {onSwitchOfficer && (
              <button
                type="button"
                onClick={onSwitchOfficer}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded text-xs font-bold font-mono transition flex items-center gap-1.5 border border-gray-700"
              >
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Login Akun Pangkat Atasan</span>
              </button>
            )}

            {/* If current officer is actually supervisor/high rank but locked */}
            {isHighRank && (
              <button
                type="button"
                onClick={() => setIsAuthorityModalOpen(true)}
                className="px-3 py-1.5 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-700/60 rounded text-xs font-bold font-mono transition flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Buka Panel Manajemen PIN Atasan</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Manager if High Rank */}
        <AuthorityPinModal
          isOpen={isAuthorityModalOpen}
          onClose={() => setIsAuthorityModalOpen(false)}
          currentOfficer={currentOfficer}
          onPinUpdated={(newConf) => {
            setAuthorityConfig(newConf);
            setTimeRemaining(formatRemainingTime(newConf.expiresAt));
          }}
        />
      </div>
    );
  }

  return (
    <div id="arrest-history-root" className="space-y-3">
      {/* High Command Clearance Badge Bar & Authority PIN Controller */}
      <div className="bg-gradient-to-r from-amber-950/40 via-[#181d26] to-amber-950/40 border border-amber-700/60 rounded-lg px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs font-mono shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-amber-300 font-bold">
            {isHighRank ? 'OTORISASI HIGH COMMAND & SUPERVISOR AKTIF' : 'AKSES BERKAS DIBUKA DENGAN PIN OTORITAS'}
          </span>
          <span className="text-gray-500 hidden sm:inline">|</span>
          <span className="text-gray-300">
            Petugas: <strong>{currentOfficer?.name || 'Petugas'}</strong> ({currentOfficer?.rank || 'Patrol'} {currentOfficer?.badge || ''})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* High Command: Live PIN Display & Management Button */}
          {isHighRank ? (
            <button
              onClick={() => setIsAuthorityModalOpen(true)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold text-[11px] rounded transition flex items-center gap-1.5 shadow-sm shadow-amber-600/30"
              title="Klik untuk Kelola PIN Otoritas (Otomatis per 1 Jam / Manual)"
            >
              <KeyRound className="w-3.5 h-3.5 text-black" />
              <span>PIN OTORITAS: <strong className="underline tracking-wider">{authorityConfig.currentPin}</strong></span>
              <span className="text-[10px] bg-black/30 text-black px-1 rounded font-normal">
                {timeRemaining.text}
              </span>
            </button>
          ) : (
            <span className="text-[10px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
              PIN VALID • SISA WAKTU: {timeRemaining.text}
            </span>
          )}

          {supervisorBypass && (
            <button
              onClick={() => {
                setSupervisorBypass(false);
                setSupervisorPinInput('');
              }}
              className="px-2 py-1 text-[10px] text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition"
              title="Kunci kembali arsip berkas kasus"
            >
              Kunci Kembali
            </button>
          )}
        </div>
      </div>

      {/* Authority PIN Modal */}
      <AuthorityPinModal
        isOpen={isAuthorityModalOpen}
        onClose={() => setIsAuthorityModalOpen(false)}
        currentOfficer={currentOfficer}
        onPinUpdated={(newConf) => {
          setAuthorityConfig(newConf);
          setTimeRemaining(formatRemainingTime(newConf.expiresAt));
        }}
      />

      {/* SECTION 1: Header Bar with Actions */}
      <div className="bg-[#161B22] border border-gray-800 rounded-md p-3 shadow-xl space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h2 className="text-xs font-bold text-gray-100 uppercase tracking-tight">
                Database Riwayat Kasus & Integrasi Discord Webhook ({records.length})
              </h2>
            </div>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">
              Kelola arsip nama tersangka, petugas penangkap, bukti foto/kamera, ekspor CSV spreadsheet, dan integrasi Discord Webhook.
            </p>
          </div>

          {/* Quick Global Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono">
            {/* Toggle Discord Config */}
            <button
              onClick={() => setShowWebhookConfig(prev => !prev)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 transition border ${
                webhookUrl
                  ? 'bg-[#0D0F14] text-emerald-400 border-emerald-900/60 hover:bg-emerald-950/40'
                  : 'bg-amber-950/40 text-amber-300 border-amber-800 hover:bg-amber-900/50'
              }`}
            >
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>{webhookUrl ? 'DISCORD WEBHOOK (TERHUBUNG)' : 'SETUP DISCORD WEBHOOK'}</span>
              {showWebhookConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Send All to Discord */}
            {records.length > 0 && webhookUrl && (
              <button
                onClick={handleSendAllToDiscord}
                disabled={isSendingAll}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded flex items-center gap-1 transition shadow-sm shadow-indigo-500/20 disabled:opacity-50"
              >
                {isSendingAll ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>{isSendingAll ? 'MENGIRIM...' : 'KIRIM SEMUA KE DISCORD'}</span>
              </button>
            )}

            {/* Copy All MDC */}
            {records.length > 0 && (
              <button
                onClick={copyAllReports}
                className="px-2 py-1 bg-[#0D0F14] hover:bg-gray-800 text-gray-200 text-[10px] font-bold rounded flex items-center gap-1 border border-gray-700 transition"
              >
                {copiedId === 'all-reports' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === 'all-reports' ? 'DISALIN!' : 'COPY FORMAT MDC'}</span>
              </button>
            )}

            {/* Export CSV */}
            {records.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="px-2 py-1 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/80 text-[10px] font-bold rounded flex items-center gap-1 transition"
                title="Ekspor ke format Spreadsheet CSV"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                <span>EXPORT CSV</span>
              </button>
            )}

            {/* Backup JSON */}
            {records.length > 0 && (
              <button
                onClick={handleExportJSON}
                className="px-2 py-1 bg-[#0D0F14] hover:bg-gray-800 text-gray-300 border border-gray-800 text-[10px] font-bold rounded flex items-center gap-1 transition"
                title="Download backup JSON"
              >
                <Download className="w-3 h-3" />
                <span>JSON</span>
              </button>
            )}

            {/* Import JSON */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJSONFile}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-1 bg-[#0D0F14] hover:bg-gray-800 text-gray-300 border border-gray-800 text-[10px] font-bold rounded flex items-center gap-1 transition"
              title="Restore / Import JSON backup"
            >
              <Upload className="w-3 h-3" />
              <span>IMPORT</span>
            </button>

            {/* Clear All */}
            {records.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-2 py-1 bg-[#2D1214] hover:bg-rose-900/60 border border-rose-900 text-rose-300 text-[10px] font-bold rounded flex items-center gap-1 transition"
              >
                <Trash2 className="w-3 h-3" />
                <span>HAPUS</span>
              </button>
            )}
          </div>
        </div>

        {/* CUMULATIVE STATS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2 bg-[#0D0F14] border border-gray-800 rounded flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-500 uppercase">Total Kasus</span>
            <span className="font-mono font-bold text-xs text-blue-400">{records.length} Laporan</span>
          </div>
          <div className="p-2 bg-[#0D0F14] border border-gray-800 rounded flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-500 uppercase">Total Denda</span>
            <span className="font-mono font-bold text-xs text-green-400">${totalFineSum.toLocaleString()}</span>
          </div>
          <div className="p-2 bg-[#0D0F14] border border-gray-800 rounded flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-500 uppercase">Total Penjara</span>
            <span className="font-mono font-bold text-xs text-amber-400">{totalJailSum} Bulan</span>
          </div>
          <div className="p-2 bg-[#0D0F14] border border-gray-800 rounded flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-500 uppercase">Total Impound</span>
            <span className="font-mono font-bold text-xs text-rose-400">{totalImpoundSum} Hari</span>
          </div>
        </div>
      </div>

      {/* WEBHOOK STATUS NOTIFICATION BANNER */}
      {webhookStatusMessage && (
        <div
          className={`p-2.5 rounded-md text-xs font-mono flex items-center justify-between gap-2 border animate-in fade-in duration-200 ${
            webhookStatusMessage.type === 'success'
              ? 'bg-green-950/40 border-green-800 text-green-300'
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {webhookStatusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{webhookStatusMessage.text}</span>
          </div>
          <button
            onClick={() => setWebhookStatusMessage(null)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SECTION 2: DISCORD WEBHOOK INTEGRATION DRAWER */}
      {showWebhookConfig && (
        <div className="bg-[#161B22] border border-blue-900/60 rounded-md p-3.5 space-y-3 animate-in fade-in duration-200 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-gray-100 uppercase tracking-tight font-mono">
                PENGATURAN DISCORD WEBHOOK LAPORAN PENINDAKAN
              </h3>
            </div>
            <span className="text-[10px] font-mono text-gray-400">
              Format Embed Otomatis • Dukung Foto Bukti Base64 & URL
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
            {/* Webhook URL input */}
            <div className="md:col-span-6 space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block font-mono">
                Discord Webhook URL (Wajib)
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/123456789/xxxxxx..."
                className="w-full px-2.5 py-1.5 bg-[#0D0F14] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-200 placeholder:text-gray-600 outline-none font-mono"
              />
            </div>

            {/* Bot Name */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block font-mono">
                Nama Bot Pengirim
              </label>
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="HSPD CAD System"
                className="w-full px-2.5 py-1.5 bg-[#0D0F14] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-200 outline-none font-mono"
              />
            </div>

            {/* Bot Avatar URL */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 block font-mono">
                Avatar URL (Opsional)
              </label>
              <input
                type="text"
                value={botAvatar}
                onChange={(e) => setBotAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full px-2.5 py-1.5 bg-[#0D0F14] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-200 outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-800/80">
            <p className="text-[10px] text-gray-500 font-mono">
              💡 <em>Tips:</em> Anda juga dapat mengaktifkan <strong>"Kirim otomatis ke Discord Webhook saat simpan kasus"</strong> di Kalkulator Pasal.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestPingWebhook}
                disabled={isTestingWebhook || !webhookUrl.trim()}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-bold rounded flex items-center gap-1 transition font-mono border border-gray-700 disabled:opacity-40"
              >
                {isTestingWebhook ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 text-blue-400" />}
                <span>TES KONEKSI DISCORD</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: SEARCH & FILTER STRIP */}
      {records.length > 0 && (
        <div className="bg-[#161B22] border border-gray-800 rounded-md p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari suspect, nama polisi, badge, lokasi, atau pasal..."
              className="w-full pl-8 pr-2.5 py-1 bg-[#0D0F14] border border-gray-800 focus:border-blue-500 rounded text-xs text-gray-200 font-mono outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-[10px] font-mono w-full sm:w-auto overflow-x-auto">
            <span className="text-gray-500 uppercase mr-1">Status:</span>
            {[
              { id: 'all', label: 'SEMUA' },
              { id: 'coop', label: 'KOOPERATIF (-20%)' },
              { id: 'normal', label: 'NON-KOOPERATIF' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterCooperative(f.id as any)}
                className={`px-2 py-0.5 rounded transition ${
                  filterCooperative === f.id
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-[#0D0F14] border border-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: CASE RECORDS GRID */}
      {records.length === 0 ? (
        <div className="py-12 text-center bg-[#161B22] border border-gray-800 rounded-md p-6">
          <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2 stroke-[1.5]" />
          <h3 className="text-xs font-bold text-gray-300 uppercase">Belum ada riwayat kasus penindakan</h3>
          <p className="text-[11px] text-gray-500 mt-1 max-w-md mx-auto font-mono">
            Gunakan tab <strong>KALKULATOR PASAL</strong>, isi nama suspect, nama polisi yang menangkap, bukti foto kamera/sitaan, lalu simpan kasus.
          </p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="py-8 text-center bg-[#161B22] border border-gray-800 rounded-md p-4">
          <p className="text-xs text-gray-400 font-mono">
            Tidak ada riwayat kasus yang cocok dengan filter pencarian "{searchQuery}".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredRecords.map((r) => {
            const reportStr = formatReport(r);
            const bbCodeStr = formatBBCodeReport(r);
            const isCopied = copiedId === r.id;
            const isCopiedBB = copiedId === `bb-${r.id}`;
            const isSending = sendingId === r.id;
            const isBase64 = r.evidenceUrl && r.evidenceUrl.startsWith('data:image/');
            const isWebImage = r.evidenceUrl && !isBase64 && (
              r.evidenceUrl.includes('imgur.com') ||
              r.evidenceUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ||
              r.evidenceUrl.includes('discordapp.com') ||
              r.evidenceUrl.includes('media.discordapp.net')
            );
            const dateStr = new Date(r.timestamp).toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short'
            });

            return (
              <div
                key={r.id}
                className="bg-[#161B22] border border-gray-800 rounded-md p-3 space-y-2.5 hover:border-gray-700 transition shadow flex flex-col justify-between"
              >
                <div className="space-y-2">
                  {/* Top Bar: Date, Badge, and Cooperative Tag */}
                  <div className="flex items-center justify-between pb-1 border-b border-gray-800/80">
                    <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      {dateStr}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {r.isCooperative && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-green-950 text-green-400 border border-green-800/60">
                          KOOPERATIF (-20%)
                        </span>
                      )}
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#0D0F14] text-blue-400 border border-gray-800">
                        ID #{r.suspectId}
                      </span>
                    </div>
                  </div>

                  {/* Primary Header: NAMA SUSPECT (PROMINENT) */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-mono uppercase font-bold text-gray-500">Nama Tersangka / Suspect</div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                        <User className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>{r.suspectName}</span>
                      </h3>
                    </div>

                    {/* Location Badge if available */}
                    {r.location && (
                      <span className="text-[10px] font-mono text-gray-400 bg-[#0D0F14] px-2 py-0.5 rounded border border-gray-800 flex items-center gap-1 shrink-0">
                        <MapPin className="w-3 h-3 text-red-400" />
                        <span>{r.location}</span>
                      </span>
                    )}
                  </div>

                  {/* Officer Info Details: PETUGAS POLISI YANG NANGKAP */}
                  <div className="p-2 bg-[#0D0F14] border border-gray-800/80 rounded space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-gray-400 flex items-center gap-1">
                        <BadgeCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Petugas Penindak:</span>
                        <strong className="text-gray-100 font-bold">{r.officerName}</strong>
                      </span>
                      <span className="px-1.5 py-0.2 bg-black/40 border border-gray-700 text-amber-300 rounded font-bold">
                        {r.officerBadge}
                      </span>
                    </div>

                    {r.partnerOfficer && (
                      <div className="text-[10px] font-mono text-gray-400 flex items-center gap-1 pl-4.5">
                        <span>Partner / Rekan:</span>
                        <strong className="text-gray-200">{r.partnerOfficer}</strong>
                      </div>
                    )}
                  </div>

                  {/* Seized Items / Contraband if present */}
                  {r.confiscatedItems && (
                    <div className="p-1.5 bg-[#0D0F14] border border-amber-900/30 rounded text-[10px] font-mono text-gray-300 flex items-start gap-1.5">
                      <Package className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="text-amber-400 font-bold block text-[9px] uppercase">Barang Bukti Disita:</span>
                        <span className="text-gray-200 break-words">{r.confiscatedItems}</span>
                      </div>
                    </div>
                  )}

                  {/* Evidence links & photo gallery (up to 10 photos) */}
                  {((r.evidenceUrls && r.evidenceUrls.length > 0) || r.evidenceUrl) && (() => {
                    const photos = (r.evidenceUrls && r.evidenceUrls.length > 0) ? r.evidenceUrls : (r.evidenceUrl ? [r.evidenceUrl] : []);
                    return (
                      <div className="p-2 bg-[#0D0F14] border border-blue-900/40 rounded space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-blue-400 font-bold flex items-center gap-1">
                            <Camera className="w-3 h-3 text-blue-400" />
                            <span>Bukti / Evidence ({photos.length} Foto)</span>
                          </span>
                        </div>

                        {/* Interactive Image Gallery */}
                        <div className={`grid gap-1.5 ${photos.length === 1 ? 'grid-cols-1' : photos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                          {photos.map((photoUrl, pIdx) => {
                            const isPBase64 = photoUrl.startsWith('data:image/');
                            return (
                              <div 
                                key={pIdx}
                                className="relative group overflow-hidden rounded border border-gray-800 bg-black/60 aspect-[4/3] flex items-center justify-center cursor-pointer"
                                onClick={() => setSelectedPhotoPreview({ url: photoUrl, title: `Bukti Kasus #${pIdx + 1} - ${r.suspectName}` })}
                                title="Klik untuk memperbesar foto bukti"
                              >
                                <img
                                  src={photoUrl}
                                  alt={`Bukti Kasus #${pIdx + 1} ${r.suspectName}`}
                                  className="w-full h-full object-cover rounded group-hover:scale-105 transition"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <div className="absolute top-1 left-1 bg-black/70 text-white text-[8px] font-mono px-1 rounded">
                                  #{pIdx + 1}
                                </div>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                  <ZoomIn className="w-4 h-4" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Pasal Badges */}
                  <div>
                    <div className="text-[9px] font-mono uppercase text-gray-500 mb-1 font-bold">Pasal Pelanggaran:</div>
                    <div className="flex flex-wrap gap-1">
                      {r.pasalCodes.map(c => (
                        <span key={c} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#0D0F14] border border-gray-800 text-blue-300 font-bold">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Summary Metric Numbers */}
                  <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#090B10] border border-gray-800/80 rounded text-center font-mono text-xs">
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase block">Denda</span>
                      <span className="font-bold text-green-400 text-xs">${r.totalFine.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase block">Penjara</span>
                      <span className="font-bold text-amber-400 text-xs">{r.totalJail} Bln</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase block">Impound</span>
                      <span className="font-bold text-rose-400 text-xs">{r.totalImpound} Hari</span>
                    </div>
                  </div>

                  {/* Chronology / Notes if available */}
                  {(r.chronology || r.notes) && (
                    <div className="text-[10px] text-gray-400 font-mono bg-[#0D0F14] p-1.5 rounded border border-gray-800/60 space-y-0.5">
                      <span className="text-gray-300 font-bold block text-[9px] uppercase">Kronologi Kejadian:</span>
                      <p className="line-clamp-2 text-gray-300">{r.chronology || r.notes}</p>
                    </div>
                  )}
                </div>

                {/* Card Action Button Bar */}
                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-gray-800 gap-1.5">
                  {/* Send to Discord Button */}
                  <button
                    onClick={() => handleSendToDiscord(r)}
                    disabled={isSending}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded flex items-center justify-center gap-1 transition shadow-sm shadow-indigo-500/20 font-mono disabled:opacity-50"
                    title="Kirim laporan embed kasus ini ke Discord Webhook"
                  >
                    {isSending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    <span>{isSending ? 'MENGIRIM...' : 'KIRIM KE DISCORD'}</span>
                  </button>

                  {/* Copy Text MDC */}
                  <button
                    onClick={() => handleCopy(reportStr, r.id)}
                    className="px-2 py-1.5 bg-[#0D0F14] hover:bg-gray-800 text-gray-200 text-[10px] font-bold rounded flex items-center justify-center gap-1 border border-gray-700 transition font-mono"
                    title="Copy teks laporan MDC"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? 'DISALIN' : 'MDC'}</span>
                  </button>

                  {/* Copy BBCode Forum */}
                  <button
                    onClick={() => handleCopy(bbCodeStr, `bb-${r.id}`)}
                    className="px-2 py-1.5 bg-[#0D0F14] hover:bg-gray-800 text-gray-300 text-[10px] font-bold rounded flex items-center justify-center gap-1 border border-gray-800 transition font-mono"
                    title="Copy BBCode untuk forum SA-MP"
                  >
                    {isCopiedBB ? <Check className="w-3 h-3 text-green-400" /> : <Code className="w-3 h-3" />}
                    <span>{isCopiedBB ? 'DONE' : 'BBCODE'}</span>
                  </button>

                  {/* Delete Record */}
                  <button
                    onClick={() => onDeleteRecord(r.id)}
                    className="p-1.5 bg-[#2D1214] hover:bg-rose-900/80 text-rose-300 rounded border border-rose-900 transition"
                    title="Hapus baris laporan kasus ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL PHOTO PREVIEW LIGHTBOX MODAL */}
      {selectedPhotoPreview && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedPhotoPreview(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-[#161B22] border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-2.5 bg-[#0F1319] border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-gray-200 font-mono">
                  {selectedPhotoPreview.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhotoPreview(null)}
                className="w-6 h-6 rounded bg-gray-800 hover:bg-rose-900/60 text-gray-300 hover:text-rose-200 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-black flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={selectedPhotoPreview.url}
                alt="Full Preview Bukti"
                className="max-w-full max-h-[70vh] object-contain rounded"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="px-4 py-2 bg-[#0F1319] border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <span>Arsip Bukti Kepolisian HSPD MDC CAD</span>
              <button
                type="button"
                onClick={() => setSelectedPhotoPreview(null)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs"
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
