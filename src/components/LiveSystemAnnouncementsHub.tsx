import React, { useState, useRef } from 'react';
import { 
  Megaphone, Plus, Trash2, Send, CheckCircle2, AlertTriangle, 
  Sparkles, Wrench, Zap, Terminal, Copy, Check, Hash, RefreshCw, 
  Settings, Bot, ExternalLink, ShieldCheck, MessageSquare, Radio,
  Bell, Eye, EyeOff, Flame, Layers, Clock, Users, Building2,
  Shield, CheckCheck, BookmarkCheck, ChevronDown, ChevronUp, AlertCircle,
  Volume2, Download, Upload
} from 'lucide-react';
import { 
  SystemAnnouncement, 
  AnnouncementCategory, 
  AnnouncementSeverity, 
  AnnouncementAudience,
  publishSystemAnnouncement, 
  deleteSystemAnnouncement, 
  toggleAnnouncementBanner,
  saveSystemAnnouncements
} from '../utils/systemAnnouncementStorage';
import { playSystemNotificationChime } from '../utils/systemNotificationAudio';
import { checkAndBroadcastLatestRelease } from '../utils/autoChangelogBroadcaster';
import { logDeveloperSystemActivity } from '../utils/activityMonitoringStorage';
import { OfficerProfile } from '../types';

interface Props {
  announcements: SystemAnnouncement[];
  onRefresh: () => void;
  currentOfficer: OfficerProfile | null;
  onOpenDiscordStudio?: () => void;
}

export const LiveSystemAnnouncementsHub: React.FC<Props> = ({
  announcements,
  onRefresh,
  currentOfficer,
  onOpenDiscordStudio
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterAudience, setFilterAudience] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(announcements[0]?.id || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isBroadcastingId, setIsBroadcastingId] = useState<string | null>(null);

  // New Announcement Form State
  const [version, setVersion] = useState('v4.2.4');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('UPDATE');
  const [severity, setSeverity] = useState<AnnouncementSeverity>('IMPORTANT');
  const [targetAudience, setTargetAudience] = useState<AnnouncementAudience>('GLOBAL');
  const [description, setDescription] = useState('');
  
  const [features, setFeatures] = useState<string[]>(['']);
  const [improvements, setImprovements] = useState<string[]>(['']);
  const [bugFixes, setBugFixes] = useState<string[]>(['']);
  
  const [isBannerActive, setIsBannerActive] = useState(true);
  const [broadcastToDiscord, setBroadcastToDiscord] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick preset template applicator
  const applyPresetTemplate = (templateKey: 'bank_roster' | 'division_isolation' | 'maintenance' | 'hotfix' | 'directive') => {
    if (templateKey === 'bank_roster') {
      setVersion('v4.2.4');
      setTitle('Pembaruan Sistem: Integrasi Nomor Rekening Bank Dinas di Seluruh Modul Roster');
      setCategory('UPDATE');
      setSeverity('IMPORTANT');
      setTargetAudience('GLOBAL');
      setDescription('Integrasi menyeluruh informasi nomor rekening bank resmi untuk seluruh personel dinas kepolisian dan aparatur Balai Kota guna mendukung transparansi penggajian, tunjangan dinas, dan identitas resmi.');
      setFeatures([
        'Kolom Nomor Rekening Bank pada Tambah Anggota Baru & Edit Personel di Roster Kepolisian & Balai Kota',
        'Tombol 1-Click Salin Nomor Rekening dengan indikator visual hijau',
        'Pencarian Cepat Anggota langsung menggunakan Nomor Rekening Bank',
        'Ekspor dan Cetak Akun otomatis memuat nomor rekening bank dinas'
      ]);
      setImprovements([
        'Sinkronisasi instan nomor rekening bank ke Firestore Cloud Realtime',
        'Tampilan kartu ID dan profil petugas memuat informasi nomor rekening terverifikasi'
      ]);
      setBugFixes([
        'Perbaikan kendala formulir balai kota yang sebelumnya belum memiliki kolom rekening'
      ]);
      playSystemNotificationChime('IMPORTANT');
    } else if (templateKey === 'division_isolation') {
      setVersion('v4.2.4');
      setTitle('Pengamanan Hak Akses: Isolasi Berkas Perkara 7 Divisi Resmi Kepolisian');
      setCategory('UPDATE');
      setSeverity('IMPORTANT');
      setTargetAudience('HSPD');
      setDescription('Penegakan kepatuhan privasi dan kerahasiaan berkas perkara: setiap divisi kepolisian (Patroli, Metro, SWAT, Detective/CID, Evidence, Air Support, PSD) hanya dapat melihat dan mengelola kasus divisinya sendiri.');
      setFeatures([
        'Isolasi ketat berkas perkara 7 Divisi Resmi Kepolisian',
        'Peringatan pengamanan jika petugas non-divisi mencoba mengakses berkas khusus',
        'Penyelarasan hak akses High Command untuk supervisi lintas divisi'
      ]);
      setImprovements(['Audit akses berkas perkara dicatat otomatis ke log telemetri pengembang']);
      setBugFixes(['Mencegah kebocoran berkas investigasi khusus Detektif & CID']);
      playSystemNotificationChime('IMPORTANT');
    } else if (templateKey === 'maintenance') {
      setVersion('v4.2.5');
      setTitle('Jadwal Pemeliharaan Server & Sinkronisasi Database Firestore');
      setCategory('MAINTENANCE');
      setSeverity('URGENT');
      setTargetAudience('GLOBAL');
      setDescription('Pemberitahuan pemeliharaan server terjadwal untuk optimalisasi basis data, pembersihan cache telemetri, dan peningkatan kapasitas realtime listener.');
      setFeatures(['Peningkatan bandwidth sinkronisasi data antar-perangkat']);
      setImprovements(['Akselerasi respon query pencarian buronan DPO dan DMV']);
      setBugFixes(['Stabilisasi koneksi gateway WebSocket Discord Bot']);
      playSystemNotificationChime('URGENT');
    } else if (templateKey === 'hotfix') {
      setVersion('v4.2.4-hotfix');
      setTitle('Hotfix Darurat: Optimalisasi Validasi Kredensial & Form Submisi');
      setCategory('ALERT');
      setSeverity('CRITICAL');
      setTargetAudience('GLOBAL');
      setDescription('Patch perbaikan darurat diterapkan seketika untuk mengatasi kendala submisi formulir dan memastikan kestabilan seluruh sesi login.');
      setFeatures(['Penerapan hotfix keamanan secara live']);
      setImprovements(['Validasi payload input sebelum pengiriman ke server']);
      setBugFixes(['Perbaikan galat validasi token sesi saat jaringan tidak stabil']);
      playSystemNotificationChime('CRITICAL');
    } else if (templateKey === 'directive') {
      setVersion('DIR-2026-01');
      setTitle('Instruksi Resmi Pimpinan: Standar Operasional Pengisian Data & Kepatuhan Rekening Dinas');
      setCategory('DIRECTIVE');
      setSeverity('IMPORTANT');
      setTargetAudience('HSPD');
      setDescription('Instruksi dinas resmi mewajibkan seluruh perwira dan staf untuk memeriksa kelengkapan nomor rekening bank dan nomor telepon pada profil roster masing-masing.');
      setFeatures(['Pemberlakuan audit kepatuhan profil roster seluruh anggota']);
      setImprovements(['Penyelarasan nomor badge dan rekening perbankan terverifikasi']);
      setBugFixes(['Pencegahan data rekening ganda pada database dinas']);
      playSystemNotificationChime('IMPORTANT');
    }
  };

  // Export announcements to JSON file
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(announcements, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `hspd_system_announcements_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setActionNotice('📥 Berkas JSON maklumat sistem berhasil diunduh!');
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Import announcements from JSON file
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          saveSystemAnnouncements(parsed);
          onRefresh();
          setActionNotice(`✅ Berhasil mengimpor ${parsed.length} maklumat sistem!`);
          setTimeout(() => setActionNotice(null), 4000);
        } else {
          alert('Format berkas JSON tidak valid.');
        }
      } catch (err: any) {
        alert('Gagal membaca berkas JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Helpers for dynamic list items
  const handleAddItem = (type: 'features' | 'improvements' | 'bugFixes') => {
    if (type === 'features') setFeatures([...features, '']);
    if (type === 'improvements') setImprovements([...improvements, '']);
    if (type === 'bugFixes') setBugFixes([...bugFixes, '']);
  };

  const handleUpdateItem = (type: 'features' | 'improvements' | 'bugFixes', index: number, value: string) => {
    if (type === 'features') {
      const updated = [...features];
      updated[index] = value;
      setFeatures(updated);
    }
    if (type === 'improvements') {
      const updated = [...improvements];
      updated[index] = value;
      setImprovements(updated);
    }
    if (type === 'bugFixes') {
      const updated = [...bugFixes];
      updated[index] = value;
      setBugFixes(updated);
    }
  };

  const handleRemoveItem = (type: 'features' | 'improvements' | 'bugFixes', index: number) => {
    if (type === 'features') setFeatures(features.filter((_, i) => i !== index));
    if (type === 'improvements') setImprovements(improvements.filter((_, i) => i !== index));
    if (type === 'bugFixes') setBugFixes(bugFixes.filter((_, i) => i !== index));
  };

  // Submit New Announcement
  const handleSubmitAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Judul pemberitahuan sistem wajib diisi!');
      return;
    }
    if (!description.trim()) {
      alert('Deskripsi pembaruan wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanFeatures = features.map(f => f.trim()).filter(Boolean);
      const cleanImprovements = improvements.map(i => i.trim()).filter(Boolean);
      const cleanBugFixes = bugFixes.map(b => b.trim()).filter(Boolean);

      const published = publishSystemAnnouncement({
        version: version.trim() || 'v4.2.4',
        title: title.trim(),
        category,
        severity,
        targetAudience,
        description: description.trim(),
        features: cleanFeatures,
        improvements: cleanImprovements,
        bugFixes: cleanBugFixes,
        publishedBy: currentOfficer?.name || 'Core Developer',
        publishedByBadge: currentOfficer?.badge || 'DEV-001',
        isBannerActive,
        discordBroadcasted: broadcastToDiscord
      });

      // Log Developer Activity
      logDeveloperSystemActivity({
        module: 'SYSTEM_ANNOUNCEMENT',
        action: 'SYSTEM_ANNOUNCEMENT',
        title: `Pemberitahuan Sistem Diterbitkan: ${published.version} - ${published.title}`,
        description: `Kategori: ${category} | Urgensi: ${severity} | Sasaran: ${targetAudience}`,
        entity: 'SYSTEM',
        actor: currentOfficer?.name || 'Lead Developer',
        actorBadge: currentOfficer?.badge || 'DEV-001',
        severity: 'INFO'
      });

      // Optionally Broadcast to Discord
      if (broadcastToDiscord) {
        checkAndBroadcastLatestRelease(true, {
          version: published.version,
          title: published.title,
          headerText: `[ PEMBERITAHUAN RESMI PEMBARUAN & SISTEM TERBARU ${published.version} ]`,
          customDescription: published.description,
          newFeatures: cleanFeatures,
          improvements: cleanImprovements,
          bugFixes: cleanBugFixes
        }).catch(err => console.warn('Discord broadcast notice:', err));
      }

      onRefresh();
      setIsCreateOpen(false);
      setActionNotice(`🚀 Berhasil menerbitkan maklumat sistem ${published.version} secara live!`);
      setTimeout(() => setActionNotice(null), 5000);

      // Reset form
      setTitle('');
      setDescription('');
      setFeatures(['']);
      setImprovements(['']);
      setBugFixes(['']);
    } catch (err: any) {
      alert(`Gagal menerbitkan pengumuman: ${err.message || 'Kesalahan sistem'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active marquee banner
  const handleToggleBanner = (id: string, currentState: boolean) => {
    toggleAnnouncementBanner(id, !currentState);
    onRefresh();
    setActionNotice(!currentState ? '📢 Banner pemberitahuan sistem diaktifkan secara global di seluruh portal!' : 'Banner pemberitahuan dinonaktifkan.');
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Delete announcement
  const handleDelete = (id: string, title: string) => {
    if (confirm(`Yakin ingin menghapus arsip pemberitahuan sistem: "${title}"?`)) {
      deleteSystemAnnouncement(id);
      onRefresh();
      setActionNotice('🗑️ Pemberitahuan berhasil dihapus dari sistem.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  // Broadcast to Discord Webhook
  const handlePushDiscord = async (item: SystemAnnouncement) => {
    setIsBroadcastingId(item.id);
    try {
      const res = await checkAndBroadcastLatestRelease(true, {
        version: item.version,
        title: item.title,
        headerText: `[ SIARAN RESMI PEMBARUAN SISTEM ${item.version} ]`,
        customDescription: item.description,
        newFeatures: item.features,
        improvements: item.improvements,
        bugFixes: item.bugFixes
      });

      if (res.success) {
        setActionNotice(`✅ Siaran pemberitahuan ${item.version} berhasil dikirim ke saluran Webhook Discord!`);
      } else {
        alert(res.message);
      }
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      alert(`Gagal menyiarkan ke Discord: ${err.message}`);
    } finally {
      setIsBroadcastingId(null);
    }
  };

  // Format to Discord Markdown for quick copy
  const handleCopyDiscordMarkdown = (item: SystemAnnouncement) => {
    let md = `## 📢 **[ PEMBERITAHUAN RESMI SISTEM ${item.version} ]**\n`;
    md += `### **${item.title}**\n\n`;
    md += `> 📌 **Kategori:** \`${item.category}\` • **Urgensi:** \`${item.severity}\` • **Sasaran:** \`${item.targetAudience}\`\n`;
    md += `> 🕒 **Waktu Rilis:** \`${new Date(item.publishedAt).toLocaleString('id-ID')}\`\n\n`;
    md += `${item.description}\n\n`;

    if (item.features && item.features.length > 0) {
      md += `### ✨ **Fitur & Peningkatan Baru:**\n`;
      item.features.forEach(f => {
        md += `- ${f}\n`;
      });
      md += `\n`;
    }

    if (item.improvements && item.improvements.length > 0) {
      md += `### 🛠️ **Penyempurnaan Sistem:**\n`;
      item.improvements.forEach(imp => {
        md += `- ${imp}\n`;
      });
      md += `\n`;
    }

    if (item.bugFixes && item.bugFixes.length > 0) {
      md += `### 🐛 **Perbaikan Bug & Optimalisasi:**\n`;
      item.bugFixes.forEach(b => {
        md += `- ${b}\n`;
      });
      md += `\n`;
    }

    md += `---\n*Diterbitkan oleh Tim Pengembang Inti (Core Developer) MDT HSPD*`;

    navigator.clipboard.writeText(md);
    setCopiedId(item.id);
    setActionNotice(`📋 Teks rilis Discord untuk versi ${item.version} berhasil disalin!`);
    setTimeout(() => {
      setCopiedId(null);
      setActionNotice(null);
    }, 3500);
  };

  // Filtered List
  const filteredAnnouncements = announcements.filter(item => {
    if (filterAudience !== 'ALL' && item.targetAudience !== filterAudience) return false;
    if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const mTitle = item.title.toLowerCase().includes(q);
      const mVer = item.version.toLowerCase().includes(q);
      const mDesc = item.description.toLowerCase().includes(q);
      if (!mTitle && !mVer && !mDesc) return false;
    }
    return true;
  });

  const activeBannerItem = announcements.find(a => a.isBannerActive);

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* ================= TOP METRIC & LIVE BROADCAST STATUS ================= */}
      <div className="p-4 bg-gradient-to-r from-[#07130F] via-[#0C1B14] to-[#0A1218] border border-emerald-500/40 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Megaphone className="w-6 h-6 stroke-[2] animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2 font-mono">
                <span>PUSAT SIARAN & LIVE PEMBERITAHUAN SISTEM TERBARU</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/60 font-bold">
                  LIVE BROADCASTER
                </span>
              </h2>
            </div>
            <p className="text-xs text-gray-400 font-sans mt-0.5 max-w-3xl">
              Publikasikan pembaruan fitur, maklumat rilis patch, pengumuman pemeliharaan server, dan notifikasi real-time yang langsung tersiar ke seluruh portal pengguna & Discord.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJson}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            type="button"
            id="btn-create-announcement"
            onClick={() => setIsCreateOpen(!isCreateOpen)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black rounded-xl text-xs font-mono transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/60 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-black stroke-[2.5]" />
            <span>BUAT PEMBERITAHUAN BARU</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-2 bg-[#0F1720] hover:bg-[#152332] text-gray-300 hover:text-white border border-gray-700/80 rounded-xl text-xs font-mono transition flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
            title="Cadangkan Maklumat Sistem ke Berkas JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Backup JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-[#0F1720] hover:bg-[#152332] text-gray-300 hover:text-white border border-gray-700/80 rounded-xl text-xs font-mono transition flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
            title="Impor Maklumat Sistem dari Berkas JSON"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Impor JSON</span>
          </button>

          {onOpenDiscordStudio && (
            <button
              type="button"
              onClick={onOpenDiscordStudio}
              className="px-3 py-2 bg-[#0F1E19] hover:bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
              title="Buka Studio Pembuat Rilis Discord Webhook"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>STUDIO DISCORD</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            className="p-2 bg-[#121922] hover:bg-[#1A2330] text-gray-300 border border-gray-700 rounded-xl transition cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Action Toast / Feedback notice */}
      {actionNotice && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 text-emerald-200 rounded-xl flex items-center gap-2 font-mono text-xs shadow-lg animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Live Active Marquee Banner Indicator Card */}
      {activeBannerItem && (
        <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-[#0A1218] border border-emerald-500/60 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-900/80 text-emerald-300 font-bold border border-emerald-600">
                  BANNER BERJALAN AKTIF: {activeBannerItem.version}
                </span>
                <span className="font-bold text-gray-100 text-xs">
                  {activeBannerItem.title}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                {activeBannerItem.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggleBanner(activeBannerItem.id, true)}
            className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-300 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer"
          >
            Nonaktifkan Banner
          </button>
        </div>
      )}

      {/* ================= FORM: BUAT PEMBERITAHUAN BARU ================= */}
      {isCreateOpen && (
        <form onSubmit={handleSubmitAnnouncement} className="p-5 bg-[#0C1218] border border-emerald-500/50 rounded-2xl space-y-4 shadow-2xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Formulir Penerbitan Pemberitahuan & Maklumat Sistem</h3>
                <p className="text-[10px] text-gray-400 font-mono">Disiarkan langsung ke seluruh portal dan terhubung ke webhook rilis</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="text-gray-400 hover:text-white text-sm p-1 rounded-lg hover:bg-gray-800 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* QUICK TEMPLATES PICKER */}
          <div className="p-3 bg-[#080D12] border border-emerald-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Template Cepat Rilis Sistem (1-Klik Isi Form):
              </span>
              <span className="text-[10px] text-gray-500 hidden sm:inline">Pilih template untuk mengisi otomatis seluruh formulir</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
              <button
                type="button"
                onClick={() => applyPresetTemplate('bank_roster')}
                className="px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-300 font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
              >
                💳 Rekening Bank & Roster
              </button>
              <button
                type="button"
                onClick={() => applyPresetTemplate('division_isolation')}
                className="px-2.5 py-1 rounded bg-blue-950/80 hover:bg-blue-900 border border-blue-600/70 text-blue-300 font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
              >
                🛡️ Isolasi 7 Divisi Polisi
              </button>
              <button
                type="button"
                onClick={() => applyPresetTemplate('maintenance')}
                className="px-2.5 py-1 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-600/70 text-purple-300 font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
              >
                🛠️ Pemeliharaan Server
              </button>
              <button
                type="button"
                onClick={() => applyPresetTemplate('hotfix')}
                className="px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-600/70 text-rose-300 font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
              >
                ⚡ Hotfix Kritis
              </button>
              <button
                type="button"
                onClick={() => applyPresetTemplate('directive')}
                className="px-2.5 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-600/70 text-amber-300 font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
              >
                📢 Instruksi Operasional
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
            {/* Version */}
            <div>
              <label className="block text-[11px] font-bold text-gray-300 mb-1">
                Versi Rilis Sistem: <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={version}
                onChange={e => setVersion(e.target.value)}
                placeholder="v4.2.4"
                className="w-full bg-[#141B24] border border-gray-700 rounded-lg px-3 py-2 text-emerald-300 focus:outline-none focus:border-emerald-400 font-bold"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-gray-300 mb-1">
                Kategori Rilis:
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full bg-[#141B24] border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-emerald-400"
              >
                <option value="UPDATE">UPDATE (Pembaruan Fitur)</option>
                <option value="MAINTENANCE">MAINTENANCE (Pemeliharaan)</option>
                <option value="ALERT">ALERT (Peringatan Sistem)</option>
                <option value="DIRECTIVE">DIRECTIVE (Instruksi Resmi)</option>
                <option value="FEATURE">FEATURE (Fitur Spesial)</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-gray-300">
                  Tingkat Urgensi:
                </label>
                <button
                  type="button"
                  onClick={() => playSystemNotificationChime(severity)}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono cursor-pointer"
                  title="Putar nada uji lonceng notifikasi audio"
                >
                  <Volume2 className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>Uji Nada</span>
                </button>
              </div>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as any)}
                className="w-full bg-[#141B24] border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-emerald-400"
              >
                <option value="NORMAL">NORMAL (Rilis Reguler)</option>
                <option value="IMPORTANT">IMPORTANT (Penting / Operasional)</option>
                <option value="URGENT">URGENT (Pemberitahuan Mendesak)</option>
                <option value="CRITICAL">CRITICAL (Kritis / Hotfix Segera)</option>
              </select>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-[11px] font-bold text-gray-300 mb-1">
                Sasaran Pengguna:
              </label>
              <select
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value as any)}
                className="w-full bg-[#141B24] border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-emerald-400"
              >
                <option value="GLOBAL">SEMUA PENGGUNA (Global Portal)</option>
                <option value="HSPD">KEPOLISIAN HSPD (Roster & Divisi)</option>
                <option value="GOVERNMENT">BALAI KOTA (Aparatur Negara)</option>
                <option value="CITIZEN">WARGA SIPIL (Pelayanan Publik)</option>
              </select>
            </div>

            {/* Title */}
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-[11px] font-bold text-gray-300 mb-1">
                Judul Maklumat / Rilis Pembaruan: <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Contoh: Pembaruan Sistem MDT HSPD - Penambahan Fitur Live Broadcast & Keamanan Operasi"
                className="w-full bg-[#141B24] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-emerald-400 font-sans text-xs"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-[11px] font-bold text-gray-300 mb-1">
                Uraian Lengkap / Catatan Rilis: <span className="text-emerald-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Tuliskan gambaran umum pembaruan, alasan perubahan, atau dampak operasional bagi petugas..."
                className="w-full bg-[#141B24] border border-gray-700 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-emerald-400 font-sans text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* DYNAMIC LISTS: FITUR BARU, IMPROVEMENTS, BUG FIXES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-800">
            {/* Features */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Fitur & Penambahan Baru:
                </span>
                <button
                  type="button"
                  onClick={() => handleAddItem('features')}
                  className="text-[10px] text-emerald-300 hover:text-white px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-700 font-mono"
                >
                  + Tambah Poin
                </button>
              </div>
              <div className="space-y-1.5">
                {features.map((item, idx) => (
                  <div key={`feat-${idx}`} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={item}
                      onChange={e => handleUpdateItem('features', idx, e.target.value)}
                      placeholder={`Poin fitur #${idx + 1}...`}
                      className="w-full bg-[#141B24] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-400"
                    />
                    {features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem('features', idx)}
                        className="p-1.5 text-gray-500 hover:text-red-400"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Improvements */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-400 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5" /> Penyempurnaan Sistem:
                </span>
                <button
                  type="button"
                  onClick={() => handleAddItem('improvements')}
                  className="text-[10px] text-cyan-300 hover:text-white px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-700 font-mono"
                >
                  + Tambah Poin
                </button>
              </div>
              <div className="space-y-1.5">
                {improvements.map((item, idx) => (
                  <div key={`imp-${idx}`} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={item}
                      onChange={e => handleUpdateItem('improvements', idx, e.target.value)}
                      placeholder={`Penyempurnaan #${idx + 1}...`}
                      className="w-full bg-[#141B24] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-400"
                    />
                    {improvements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem('improvements', idx)}
                        className="p-1.5 text-gray-500 hover:text-red-400"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bug Fixes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Perbaikan Bug:
                </span>
                <button
                  type="button"
                  onClick={() => handleAddItem('bugFixes')}
                  className="text-[10px] text-amber-300 hover:text-white px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-700 font-mono"
                >
                  + Tambah Poin
                </button>
              </div>
              <div className="space-y-1.5">
                {bugFixes.map((item, idx) => (
                  <div key={`bug-${idx}`} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={item}
                      onChange={e => handleUpdateItem('bugFixes', idx, e.target.value)}
                      placeholder={`Perbaikan bug #${idx + 1}...`}
                      className="w-full bg-[#141B24] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-400"
                    />
                    {bugFixes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem('bugFixes', idx)}
                        className="p-1.5 text-gray-500 hover:text-red-400"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BROADCAST OPTIONS & SUBMIT */}
          <div className="pt-3 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs font-mono">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isBannerActive}
                  onChange={e => setIsBannerActive(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 text-emerald-500 focus:ring-0"
                />
                <span className="text-gray-200">Aktifkan sebagai Banner Berjalan Global</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={broadcastToDiscord}
                  onChange={e => setBroadcastToDiscord(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 text-indigo-500 focus:ring-0"
                />
                <span className="text-indigo-300">Siarkan Langsung ke Discord Webhook</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold font-mono transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black rounded-xl text-xs font-mono transition shadow-lg shadow-emerald-950/60 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Menerbitkan...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-black stroke-[2.5]" />
                    <span>TERBITKAN & SIARKAN LIVE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ================= SEARCH & FILTER BAR ================= */}
      <div className="p-3 bg-[#0B1015] border border-gray-800 rounded-xl flex flex-wrap items-center justify-between gap-3 font-mono">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari rilis sistem berdasarkan versi, judul, fitur..."
            className="w-full bg-[#141B24] border border-gray-700 rounded-lg px-3 py-1.5 text-gray-200 text-xs focus:outline-none focus:border-emerald-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-gray-400 hover:text-white px-2"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Audience Filter */}
          <select
            value={filterAudience}
            onChange={e => setFilterAudience(e.target.value)}
            className="bg-[#141B24] border border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-300 text-xs focus:outline-none focus:border-emerald-400 cursor-pointer"
          >
            <option value="ALL">Semua Sasaran</option>
            <option value="GLOBAL">Global</option>
            <option value="HSPD">HSPD (Polisi)</option>
            <option value="GOVERNMENT">Pemerintahan</option>
            <option value="CITIZEN">Warga Sipil</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-[#141B24] border border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-300 text-xs focus:outline-none focus:border-emerald-400 cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="UPDATE">Update</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="ALERT">Alert</option>
            <option value="DIRECTIVE">Directive</option>
            <option value="FEATURE">Feature</option>
          </select>

          <span className="text-[11px] text-gray-400">
            Total: <strong className="text-emerald-400">{filteredAnnouncements.length}</strong> Maklumat
          </span>
        </div>
      </div>

      {/* ================= ANNOUNCEMENTS LIST / FEED ================= */}
      <div className="space-y-3">
        {filteredAnnouncements.length === 0 ? (
          <div className="p-8 text-center bg-[#0C1118] border border-gray-800 rounded-2xl space-y-2">
            <Megaphone className="w-10 h-10 text-gray-600 mx-auto" />
            <h4 className="font-bold text-gray-300">Belum ada maklumat sistem yang sesuai</h4>
            <p className="text-gray-500 text-xs font-mono">Sesuaikan kata kunci pencarian atau gunakan tombol "Buat Pemberitahuan Baru" di atas.</p>
          </div>
        ) : (
          filteredAnnouncements.map((item, idx) => {
            const isExpanded = expandedId === item.id;
            const dateStr = new Date(item.publishedAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const getSeverityBadge = (s: AnnouncementSeverity) => {
              switch (s) {
                case 'CRITICAL':
                  return 'bg-red-950 text-red-300 border-red-700';
                case 'URGENT':
                  return 'bg-orange-950 text-orange-300 border-orange-700';
                case 'IMPORTANT':
                  return 'bg-amber-950 text-amber-300 border-amber-600';
                default:
                  return 'bg-emerald-950 text-emerald-300 border-emerald-700';
              }
            };

            const getCategoryBadge = (c: AnnouncementCategory) => {
              switch (c) {
                case 'MAINTENANCE':
                  return 'bg-purple-950 text-purple-300 border-purple-700';
                case 'ALERT':
                  return 'bg-rose-950 text-rose-300 border-rose-700';
                case 'DIRECTIVE':
                  return 'bg-blue-950 text-blue-300 border-blue-700';
                case 'FEATURE':
                  return 'bg-cyan-950 text-cyan-300 border-cyan-700';
                default:
                  return 'bg-emerald-950 text-emerald-300 border-emerald-700';
              }
            };

            return (
              <div
                key={item.id ? `${item.id}-${idx}` : `ann-${idx}`}
                className={`bg-[#0A1016] border rounded-2xl p-4 sm:p-5 transition shadow-lg ${
                  item.isBannerActive
                    ? 'border-emerald-500/80 ring-1 ring-emerald-500/40 shadow-emerald-950/20'
                    : 'border-gray-800/90 hover:border-gray-700'
                }`}
              >
                {/* Header Row: Version, Badges & Quick Action Controls */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500 text-black font-black font-mono text-xs shadow-sm">
                        {item.version}
                      </span>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getCategoryBadge(item.category)}`}>
                        {item.category}
                      </span>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${getSeverityBadge(item.severity)}`}>
                        {item.severity}
                      </span>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141B24] text-gray-300 border border-gray-700">
                        Target: {item.targetAudience}
                      </span>

                      {item.isBannerActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500 flex items-center gap-1 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          BANNER AKTIF
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                      <span>{item.title}</span>
                    </h3>

                    <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span>{dateStr}</span>
                      </span>
                      <span>•</span>
                      <span>Oleh: <strong className="text-gray-200">{item.publishedBy}</strong> ({item.publishedByBadge || 'DEV'})</span>
                      {item.viewCount && (
                        <>
                          <span>•</span>
                          <span className="text-gray-400 flex items-center gap-1">
                            <Eye className="w-3 h-3 text-cyan-400" />
                            <span>{item.viewCount} Dilihat</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Tools */}
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    {/* Toggle Active Banner */}
                    <button
                      type="button"
                      onClick={() => handleToggleBanner(item.id, item.isBannerActive)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        item.isBannerActive
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 hover:bg-emerald-900'
                          : 'bg-[#141B24] border-gray-700 text-gray-400 hover:text-emerald-300 hover:border-emerald-600'
                      }`}
                      title={item.isBannerActive ? 'Nonaktifkan dari Banner Berjalan' : 'Jadikan Banner Berjalan di Seluruh Aplikasi'}
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>{item.isBannerActive ? 'Banner Aktif' : 'Pasang Banner'}</span>
                    </button>

                    {/* Push to Discord Webhook */}
                    <button
                      type="button"
                      disabled={isBroadcastingId === item.id}
                      onClick={() => handlePushDiscord(item)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 hover:text-white transition flex items-center gap-1 cursor-pointer text-[11px] font-bold disabled:opacity-50"
                      title="Siarkan langsung ke Webhook Discord #changelog"
                    >
                      {isBroadcastingId === item.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>DISCORD</span>
                    </button>

                    {/* Copy Markdown Text */}
                    <button
                      type="button"
                      onClick={() => handleCopyDiscordMarkdown(item)}
                      className="p-1.5 rounded-lg bg-[#141B24] hover:bg-[#1A2330] border border-gray-700 text-gray-400 hover:text-white transition cursor-pointer"
                      title="Salin Format Teks Discord Markdown"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-800/60 text-red-400 hover:text-white transition cursor-pointer"
                      title="Hapus Maklumat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Expand/Collapse Toggle */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="p-1.5 rounded-lg bg-[#141B24] hover:bg-[#1A2330] border border-gray-700 text-gray-300 transition cursor-pointer"
                      title={isExpanded ? 'Tutup Rincian' : 'Buka Rincian Lengkap'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Description Text */}
                <p className="text-xs text-gray-300 font-sans mt-3 leading-relaxed border-t border-gray-800/80 pt-2.5">
                  {item.description}
                </p>

                {/* Detailed Breakdown (Features, Improvements, Fixes) */}
                {isExpanded && (
                  <div className="mt-3.5 pt-3 border-t border-gray-800/80 space-y-3 font-sans animate-in fade-in duration-150">
                    {/* Features */}
                    {item.features && item.features.length > 0 && (
                      <div className="p-3 bg-[#0E151E] border border-emerald-950/80 rounded-xl space-y-1.5">
                        <span className="font-bold text-emerald-400 text-xs flex items-center gap-1 font-mono">
                          <Sparkles className="w-3.5 h-3.5" /> FITUR & PENAMBAHAN BARU:
                        </span>
                        <ul className="space-y-1 pl-1">
                          {item.features.map((feat, fIdx) => (
                            <li key={fIdx} className="text-gray-300 text-xs flex items-start gap-2 leading-relaxed">
                              <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Improvements */}
                    {item.improvements && item.improvements.length > 0 && (
                      <div className="p-3 bg-[#0E151E] border border-cyan-950/80 rounded-xl space-y-1.5">
                        <span className="font-bold text-cyan-400 text-xs flex items-center gap-1 font-mono">
                          <Wrench className="w-3.5 h-3.5" /> PENYEMPURNAAN SISTEM:
                        </span>
                        <ul className="space-y-1 pl-1">
                          {item.improvements.map((imp, iIdx) => (
                            <li key={iIdx} className="text-gray-300 text-xs flex items-start gap-2 leading-relaxed">
                              <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                              <span>{imp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Bug Fixes */}
                    {item.bugFixes && item.bugFixes.length > 0 && (
                      <div className="p-3 bg-[#0E151E] border border-amber-950/80 rounded-xl space-y-1.5">
                        <span className="font-bold text-amber-400 text-xs flex items-center gap-1 font-mono">
                          <Zap className="w-3.5 h-3.5" /> PERBAIKAN BUG & OPTIMALISASI:
                        </span>
                        <ul className="space-y-1 pl-1">
                          {item.bugFixes.map((bug, bIdx) => (
                            <li key={bIdx} className="text-gray-300 text-xs flex items-start gap-2 leading-relaxed">
                              <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                              <span>{bug}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
