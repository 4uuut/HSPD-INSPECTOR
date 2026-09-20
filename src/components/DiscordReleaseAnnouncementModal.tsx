import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Plus, Trash2, Send, CheckCircle2, AlertTriangle, 
  Sparkles, Wrench, Zap, Terminal, Copy, Check, Hash, RefreshCw, 
  Settings, Bot, ExternalLink, ShieldCheck, MessageSquare, Radio,
  Palette, Edit3, BookmarkCheck, FileSpreadsheet, RotateCcw
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
  const [version, setVersion] = useState('v3.4.0');
  const [title, setTitle] = useState('Hotfix MDT HSPD - Pemulihan Akun Jackie Xianlao, Reset PIN Instan, PM Bot & UI HP/PC');
  const [headerText, setHeaderText] = useState('[ PEMBERITAHUAN RESMI PEMBARUAN & PERBAIKAN SISTEM MDT HSPD ]');
  const [customDescription, setCustomDescription] = useState(
    'Pembaruan sistem darurat: Akun pimpinan Jackie Xianlao telah dipulihkan secara penuh, sistem Lupa PIN langsung aktif seketika tanpa delay, bot Discord otomatis mengirim PM berisikan akun & PIN baru, dan tombol-tombol yang sebelumnya tidak muncul pada mode HP (Android) maupun PC kini telah dinormalkan.'
  );
  const [embedColorHex, setEmbedColorHex] = useState('#F59E0B');

  const [newFeatures, setNewFeatures] = useState<string[]>([
    'Pemulihan & Proteksi Akun Chief of Police Jackie Xianlao (#001) dengan imunitas status pemecatan',
    'Aktivasi PIN Baru Seketika (Zero Delay): PIN yang baru di-reset langsung aktif detik itu juga untuk login ke MDT',
    'Otomatisasi Bot PM Discord: Bot kini langsung mengirimkan Pesan Pribadi (PM / DM) berisi Akun Login, Badge, dan PIN Baru ke akun Discord petugas',
    'Perbaikan Tampilan Mode HP (Android) & PC: Tombol CAD 911, menu drawer Semua Aplikasi, dan navigasi Pengaturan kini muncul sempurna'
  ]);
  const [improvements, setImprovements] = useState<string[]>([
    'Verifikasi otentikasi berlapis: sinkronisasi real-time multi-storage lokal, riwayat tiket, dan database cloud',
    'Akses Halaman Pengaturan (Settings) kini terbuka dan dapat diakses oleh seluruh tingkatan perwira patroli hingga komando',
    'Pemberitahuan embed Discord dengan format pesan dinamis yang dapat diacak agar tidak monoton dan tidak duplikat dengan log server'
  ]);
  const [bugFixes, setBugFixes] = useState<string[]>([
    'Perbaikan error tombol CAD 911 di ponsel yang sebelumnya tidak menampilkan halaman apapun',
    'Perbaikan nomor lencana tertimpa atau terhapus saat pembaruan PIN login petugas',
    'Penyelesaian runtime error database pada layanan roster dan otentikasi server'
  ]);
  const [extraNotes, setExtraNotes] = useState('Bagi personel atau pimpinan yang sebelumnya terkendala login, silakan langsung login dengan PIN baru atau gunakan fitur Lupa PIN untuk menerima PM otomatis dari Bot.');
  const [mentionRole, setMentionRole] = useState('@everyone');
  const [variationIndex, setVariationIndex] = useState(0);

  // Randomize & vary wording so message is never identical to previous announcements
  const shuffleAndVaryWording = () => {
    const nextIdx = (variationIndex + 1) % 3;
    setVariationIndex(nextIdx);

    if (nextIdx === 0) {
      setVersion('v3.4.0');
      setTitle('Instruksi Resmi Komando: Pemulihan Akun, Reset PIN Mandiri & Sinkronisasi Bot');
      setHeaderText('[ DIREKTIF RESMI KOMANDO TINGGI MDT KEPOLISIAN ]');
      setCustomDescription('Diumumkan kepada seluruh jajaran personel High State Police Department bahwa sistem otentikasi, alur pembaruan PIN login, dan integrasi pengiriman kredensial via PM bot Discord telah diperbarui dan berjalan normal.');
      setEmbedColorHex('#3B82F6');
      setNewFeatures([
        'Akun Pimpinan Jackie Xianlao (#001) telah dipulihkan secara penuh dengan status imunitas komando',
        'Pengaktifan PIN Baru Seketika: Anggota yang selesai di-reset PIN dapat langsung login detik itu juga tanpa jeda',
        'Layanan Bot PM Otomatis: Notifikasi privat Discord berisikan Nama UCP, Badge, dan PIN Baru langsung dikirim ke DM anggota',
        'Normalisasi Tombol Antarmuka: Tombol CAD 911, menu drawer, dan preferensi pengaturan kini tampil sempurna di Android dan Desktop'
      ]);
      setImprovements([
        'Multi-layer fallback security: Akun pimpinan dan anggota diproteksi dari kehilangan akses mendadak',
        'Penyegaran template pesan bot changelog agar unik, komunikatif, dan tidak monoton',
        'Akselerasi respon database server saat jam sibuk patroli'
      ]);
      setBugFixes([
        'Perbaikan blank screen pada tombol CAD 911 dan drawer aplikasi mobile',
        'Perbaikan duplikasi badge saat pembaruan PIN di database internal'
      ]);
      setExtraNotes('Seluruh personel yang bertugas harap memeriksa kembali status akun masing-masing.');
    } else if (nextIdx === 1) {
      setVersion('v3.4.0-Patch1');
      setTitle('Pemberitahuan Patch Sistem: Zero-Delay PIN Reset, Bot DM Delivery & Mobile Fix');
      setHeaderText('[ PATCH KEAMANAN & OPERASIONAL INFRASTRUKTUR MDT ]');
      setCustomDescription('Laporan implementasi perbaikan infrastruktur teknis Terminal MDT mencakup pemulihan akun penting, sinkronisasi kredensial instan, webhook PM bot, serta stabilitas antarmuka pengguna di berbagai resolusi layar.');
      setEmbedColorHex('#10B981');
      setNewFeatures([
        'Instant Credentials Push: Bot Discord langsung mengirimkan DM berisi Nama Karakter, Badge & PIN baru saat pengajuan disetujui',
        'Active PIN Auto-Grant: PIN baru otomatis diterapkan ke database lokal dan server secara simultan',
        'Restorasi Akun Jackie Xianlao: Perlindungan integritas data Chief of Police dari status non-aktif',
        'UI Mobile Responsive Fix: Perbaikan navigasi tombol CAD 911 dan drawer Semua Aplikasi di HP/PC'
      ]);
      setImprovements([
        'Penyempurnaan algoritma pencocokan akun (Account Matcher) dengan toleransi panggilan nama dan badge',
        'Optimalisasi memori peramban dan penanganan timeout Firestore',
        'Fitur variasi otomatis pengumuman Discord changelog'
      ]);
      setBugFixes([
        'Mengatasi kendala halaman kosong saat menekan tombol CAD 911 di Android MDT',
        'Memperbaiki inkonsistensi penulisan badge pada saat penggantian kata sandi'
      ]);
      setExtraNotes('Hubungi Supervisor atau Atasan jika Anda memerlukan bantuan sinkronisasi akun dinas.');
    } else {
      setVersion('v3.4.0-Live');
      setTitle('Pemberitahuan Lapangan: Fitur Lupa PIN Otomatis & Pembaruan Tampilan MDT');
      setHeaderText('[ PENGUMUMAN SEGERA UNTUK SELURUH PERSONEL KEPOLISIAN ]');
      setCustomDescription('Informasi penting terkait perbaikan fitur Lupa PIN, pengiriman kredensial via PM Bot Discord, serta perbaikan tombol-tombol yang sebelumnya tidak muncul di HP maupun PC.');
      setEmbedColorHex('#F59E0B');
      setNewFeatures([
        'Sekarang Lupa PIN langsung aktif! Setelah disahkan atasan atau sistem, Anda bisa langsung login tanpa hambatan',
        'Bot Discord akan langsung kirim PM (Direct Message) berisi detail akun dan PIN baru Anda',
        'Akun Jackie Xianlao telah dipulihkan dan dapat login kembali secara normal',
        'Semua tombol di HP dan PC (termasuk CAD 911 dan Setting) sekarang sudah berfungsi dan muncul normal'
      ]);
      setImprovements([
        'Kemudahan akses menu pengaturan untuk semua tingkatan rank',
        'Pesan pengumuman bot kini bervariasi dan dapat diacak agar tidak membosankan di Discord',
        'Koneksi bot Discord lebih stabil dan responsif'
      ]);
      setBugFixes([
        'Masalah layar kosong saat klik CAD 911 di ponsel telah teratasi sepenuhnya',
        'Bug nomor lencana berubah saat reset PIN telah diperbaiki'
      ]);
      setExtraNotes('Silakan login ke MDT sekarang dan manfaatkan fitur-fitur yang telah diperbarui!');
    }
  };

  // Preset Template loader so messages are tailored and never the same
  const applyPresetTemplate = (type: 'pin_reset_and_ui_hotfix' | 'weekly_recap_bot' | 'bugfix_security' | 'penal_calculator' | 'patrol_update') => {
    if (type === 'pin_reset_and_ui_hotfix') {
      setVersion('v3.4.0');
      setTitle('Hotfix MDT HSPD - Pemulihan Akun Jackie Xianlao, Reset PIN Instan, PM Bot & UI HP/PC');
      setHeaderText('[ PEMBERITAHUAN RESMI PEMBARUAN & PERBAIKAN SISTEM MDT HSPD ]');
      setCustomDescription('Pembaruan sistem darurat: Akun pimpinan Jackie Xianlao telah dipulihkan secara penuh, sistem Lupa PIN langsung aktif seketika tanpa delay, bot Discord otomatis mengirim PM berisikan akun & PIN baru, dan tombol-tombol yang sebelumnya tidak muncul pada mode HP (Android) maupun PC kini telah dinormalkan.');
      setEmbedColorHex('#F59E0B');
      setNewFeatures([
        'Pemulihan & Proteksi Akun Chief of Police Jackie Xianlao (#001) dengan imunitas status pemecatan',
        'Aktivasi PIN Baru Seketika (Zero Delay): PIN yang baru di-reset langsung aktif detik itu juga untuk login ke MDT',
        'Otomatisasi Bot PM Discord: Bot kini langsung mengirimkan Pesan Pribadi (PM / DM) berisi Akun Login, Badge, dan PIN Baru ke akun Discord petugas',
        'Perbaikan Tampilan Mode HP (Android) & PC: Tombol CAD 911, menu drawer Semua Aplikasi, dan navigasi Pengaturan kini muncul sempurna'
      ]);
      setImprovements([
        'Verifikasi otentikasi berlapis: sinkronisasi real-time multi-storage lokal, riwayat tiket, dan database cloud',
        'Akses Halaman Pengaturan (Settings) kini terbuka dan dapat diakses oleh seluruh tingkatan perwira patroli hingga komando',
        'Pemberitahuan embed Discord dengan format pesan dinamis yang dapat diacak agar tidak monoton dan tidak duplikat dengan log server'
      ]);
      setBugFixes([
        'Perbaikan error tombol CAD 911 di ponsel yang sebelumnya tidak menampilkan halaman apapun',
        'Perbaikan nomor lencana tertimpa atau terhapus saat pembaruan PIN login petugas',
        'Penyelesaian runtime error database pada layanan roster dan otentikasi server'
      ]);
      setExtraNotes('Bagi personel atau pimpinan yang sebelumnya terkendala login, silakan langsung login dengan PIN baru atau gunakan fitur Lupa PIN untuk menerima PM otomatis dari Bot.');
    } else if (type === 'weekly_recap_bot') {
      setVersion('v3.3.0');
      setTitle('Pembaruan Sistem MDT HSPD - Rekap Dinas & Integrasi Bot');
      setHeaderText('[ PENGUMUMAN PEMBARUAN SISTEM MDT HSPD ]');
      setCustomDescription('Rilis resmi penambahan fitur Rekap Mingguan Personel Kepolisian serta sinkronisasi bot Discord multifungsi.');
      setEmbedColorHex('#00A8FF');
      setNewFeatures([
        'Tombol Rekap Data Mingguan Operasional di Manajemen Anggota & Disiplin Personel',
        'Download Rekapitulasi Duty, Tilang, Impound, Kasus, dan Eviden dalam bentuk Excel (.xlsx)',
        'Cetak Laporan Format Dokumen Resmi Kepolisian & Salin Ringkasan Khusus Discord',
        'Perintah Discord Bot Baru: !pasal, !hitung, !bolo, !lookup, !duty, dan !sop'
      ]);
      setImprovements([
        'Kalkulasi waktu dinas realtime yang menghitung jam petugas on-duty aktif berjalan',
        'Pesan pengumuman bot Discord fleksibel dan kata-kata otomatis menyesuaikan rilis terkini',
        'Percepatan respon query laporan kepolisian hingga 3x lipat'
      ]);
      setBugFixes([
        'Penyelesaian masalah input isu (inp isu) pada modal dan form pendaftaran',
        'Perbaikan sinkronisasi channel rilis Discord saat siaran otomatis'
      ]);
      setExtraNotes('Harap seluruh High Command dan Officer memanfaatkan fitur Rekap Mingguan untuk evaluasi personel kepolisian.');
    } else if (type === 'bugfix_security') {
      setVersion('v3.3.1');
      setTitle('Patch Keamanan & Kestabilan Sistem MDT HSPD');
      setHeaderText('[ PEMBERITAHUAN PATCH PERBAIKAN SISTEM MDT ]');
      setCustomDescription('Pembaruan perbaikan kesalahan teknis (bug fixes), stabilitas database, dan pemeliharaan performa.');
      setEmbedColorHex('#E11D48');
      setNewFeatures([
        'Peningkatan logging sistem internal untuk mendeteksi anomali akses ilegal',
        'Auto-recovery koneksi websocket bot saat jaringan terputus'
      ]);
      setImprovements([
        'Optimalisasi konsumsi memori browser saat memuat data laporan berukuran besar',
        'Peningkatan akurasi waktu stempel pencatatan log'
      ]);
      setBugFixes([
        'Perbaikan input isu dan validasi karakter khusus pada form pencarian',
        'Perbaikan kendala kuota Firestore dengan mode cadangan lokal otomatis'
      ]);
      setExtraNotes('Sistem telah kembali stabil secara penuh. Tidak diperlukan tindakan tambahan dari personel.');
    } else if (type === 'penal_calculator') {
      setVersion('v3.2.5');
      setTitle('Pembaruan Regulasi KUHP & Kalkulator Denda MDT HSPD');
      setHeaderText('[ PEMBARUAN REGULASI & FITUR HUKUM MDT HSPD ]');
      setCustomDescription('Penyesuaian pasal-pasal pidana terbaru dan integrasi kalkulator denda cerdas untuk perwira patroli.');
      setEmbedColorHex('#10B981');
      setNewFeatures([
        'Katalog regulasi hukum interaktif dengan kategori pelanggaran lalu lintas dan pidana',
        'Kalkulator vonis denda dan masa kurungan dengan fitur potongan/diskon otomatis',
        'Pencarian pasal kilat melalui Discord bot menggunakan perintah /pasal'
      ]);
      setImprovements([
        'Tampilan rincian sita barang bukti (eviden) lebih informatif',
        'Penyeragaman format sita kendaraan bagi divisi lalu lintas'
      ]);
      setBugFixes([
        'Perbaikan rumus diskon denda pada vonis berlapis'
      ]);
      setExtraNotes('Silakan gunakan kalkulator ini saat memproses pelanggar hukum di lapangan.');
    } else if (type === 'patrol_update') {
      setVersion('v3.3.2');
      setTitle('Pembaruan Modul Patroli & Penugasan Unit Lapangan');
      setHeaderText('[ PENGUMUMAN UNIT & PATROLI OPERASIONAL MDT ]');
      setCustomDescription('Pembaruan sistem penugasan patroli, pemantauan status unit 10-8, dan koordinasi radio darurat.');
      setEmbedColorHex('#8B5CF6');
      setNewFeatures([
        'Pemantauan status patroli interaktif dengan kode status kepolisian terkini',
        'Integrasi tombol cepat Code 6 (Investigasi) dan 10-6 (Sibuk)',
        'Sinkronisasi roster dinas aktif ke channel Discord per 15 menit'
      ]);
      setImprovements([
        'Desain kartu petugas bertugas lebih ramping dan mudah dibaca saat operasi malam',
        'Peringatan otomatis jika petugas tidak aktif lebih dari batas waktu yang ditentukan'
      ]);
      setBugFixes([
        'Perbaikan kesalahan penentuan unit kendaraan patroli'
      ]);
      setExtraNotes('Seluruh petugas lapangan wajib memperbarui status dinas secara berkala.');
    }
  };

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
    const colorNum = parseInt(embedColorHex.replace('#', ''), 16) || 0x00A8FF;

    try {
      const res = await fetch('/api/discord/send-changelog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version,
          title,
          headerText,
          customDescription,
          embedColor: colorNum,
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
              
              {/* Dynamic Preset Switcher Bar */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    PILIH FORMAT PEMBARUAN DINAMIS (KATA-KATA OTOMATIS MENYESUAIKAN):
                  </span>
                  <span className="text-[11px] text-slate-400">Klik untuk memuat format rilis baru</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('pin_reset_and_ui_hotfix')}
                    className="px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-500/80 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer ring-1 ring-amber-500/30"
                  >
                    <span>🔥 Hotfix Akun, PIN & UI HP/PC</span>
                  </button>
                  <button
                    type="button"
                    onClick={shuffleAndVaryWording}
                    className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/80 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer ring-1 ring-cyan-500/30"
                    title="Acak kata-kata agar pesan unik dan tidak duplikat dengan log di Discord"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>🎲 Variasikan / Acak Kata-kata (Anti-Duplikat)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('weekly_recap_bot')}
                    className="px-3 py-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-600/70 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <span>📊 Rekap Mingguan & Bot Baru</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('bugfix_security')}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-600/70 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <span>🛠️ Patch Bug & Keamanan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('penal_calculator')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-200 border border-emerald-600/70 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <span>⚖️ KUHP & Kalkulator Denda</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('patrol_update')}
                    className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-200 border border-purple-600/70 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <span>🚓 Patroli & Unit Lapangan</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Input Section */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* Header Text & Description */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" /> Kalimat Judul Pembuka Bot (Header Bot)
                    </label>
                    <input
                      type="text"
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                      placeholder="Contoh: [ PENGUMUMAN PEMBARUAN SISTEM MDT HSPD ]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Kalimat ini ditampilkan di luar embed bersama target mention role (@everyone). Dapat disesuaikan dengan topik rilis terkini.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Deskripsi Pengantar Pesan Embed
                    </label>
                    <textarea
                      rows={2}
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      placeholder="Tuliskan pesan pembuka rilis yang tidak sama setiap pembaruan..."
                    />
                  </div>
                </div>

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

                {/* Catatan Tambahan, Warna, & Mention */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
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
                    <div className="mt-2 flex items-center justify-between bg-slate-950 border border-slate-700 rounded-xl p-2">
                      <span className="text-[11px] text-slate-300 flex items-center gap-1">
                        <Palette className="w-3.5 h-3.5 text-cyan-400" /> Warna Embed:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={embedColorHex}
                          onChange={(e) => setEmbedColorHex(e.target.value)}
                          className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-slate-400">{embedColorHex}</span>
                      </div>
                    </div>
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
                            {mentionRole} <span className="text-slate-200 font-bold">{headerText}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Discord Embed Box */}
                    <div 
                      className="rounded-r-lg p-3 space-y-2.5 bg-[#2B2D31]"
                      style={{ borderLeft: `4px solid ${embedColorHex}` }}
                    >
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-300">High State Police Department • Official System Release</span>
                      </div>

                      <div className="font-bold text-white text-sm">
                        📢 {title} • [{version}]
                      </div>

                      <div className="text-slate-300 text-[11px] leading-relaxed">
                        {customDescription || 'Catatan rilis pembaruan perangkat lunak, penyempurnaan operasional kepolisian, serta perbaikan kestabilan dan performa Terminal Mobile Data Computer (MDC) HSPD.'}<br />
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
