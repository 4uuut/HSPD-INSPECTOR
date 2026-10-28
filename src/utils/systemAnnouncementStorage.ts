import { pushToFirestore, syncCollectionWithFirestore } from '../services/firebaseRealtimeSync';
import { playSystemNotificationChime } from './systemNotificationAudio';

export type AnnouncementCategory = 'UPDATE' | 'MAINTENANCE' | 'ALERT' | 'DIRECTIVE' | 'FEATURE';
export type AnnouncementSeverity = 'NORMAL' | 'IMPORTANT' | 'URGENT' | 'CRITICAL';
export type AnnouncementAudience = 'GLOBAL' | 'HSPD' | 'GOVERNMENT' | 'CITIZEN';

export interface SystemAnnouncement {
  id: string;
  version: string;
  title: string;
  category: AnnouncementCategory;
  severity: AnnouncementSeverity;
  targetAudience: AnnouncementAudience;
  description: string;
  features: string[];
  improvements: string[];
  bugFixes: string[];
  publishedAt: number;
  publishedBy: string;
  publishedByBadge?: string;
  isBannerActive: boolean;
  discordBroadcasted?: boolean;
  viewCount?: number;
  acknowledgedBy?: string[];
}

export const SYSTEM_ANNOUNCEMENTS_STORAGE_KEY = 'hspd_system_announcements_v1';
export const DISMISSED_ANNOUNCEMENTS_KEY = 'hspd_dismissed_announcements_v1';

export const INITIAL_SYSTEM_ANNOUNCEMENTS: SystemAnnouncement[] = [
  {
    id: 'announcement-v4-3-1-radio-secrecy-bot-discord',
    version: 'v4.3.1',
    title: 'Pembaruan Sistem: Kerahasiaan Frekuensi Radio Taktis HSPD, Optimasi Dual-Portal Login & Penyiaran Bot Discord',
    category: 'UPDATE',
    severity: 'CRITICAL',
    targetAudience: 'GLOBAL',
    description: 'Pembaruan resmi sistem MDT HSPD v4.3.1: Menegakkan kerahasiaan frekuensi radio taktis kepolisian dengan menghapusnya dari portal publik, optimasi antarmuka login dinas aparatur POLISI & PEMERINTAH, sinkronisasi realtime pusat pengumuman sistem, serta penyiaran pembaruan otomatis menggunakan Bot Discord resmi langsung ke channel #changelog tanpa ketergantungan webhook.',
    features: [
      '1. Kerahasiaan Frekuensi Radio Taktis HSPD: Menghapus modul frekuensi taktis dari portal hukum publik demi menjaga integritas dan kerahasiaan operasional kepolisian',
      '2. Optimasi Dual-Portal Terminal Login: Kotak login kini dirancang khusus dan eksklusif untuk aparatur POLISI & PEMERINTAH (menghilangkan tombol layanan warga dari login box)',
      '3. Penyiaran Pembaruan Otomatis Bot Discord: Siaran live update & changelog rilis dikirimkan langsung oleh Bot Resmi HSPD ke channel #changelog (1547776898833326161) via Discord REST API tanpa webhook',
      '4. Pusat Pemberitahuan Sistem Realtime: Sinkronisasi instan live update dengan audio chime dan indikator status broadcast',
      '5. Portal Slide KUHP & Hak Miranda: Navigasi geser undang-undang pidana dan standar resmi pembacaan Hak Miranda dwibahasa'
    ],
    improvements: [
      'Pengiriman pesan Discord langsung menggunakan token bot REST API tanpa memerlukan konfigurasi webhook eksternal',
      'Peningkatan kestabilan sinkronisasi data antar browser dan Firestore database',
      'Antarmuka gelap profesional yang responsif di laptop dan HP'
    ],
    bugFixes: [
      'Perbaikan kendala tombol Push Discord yang sempat memblokir pengiriman karena meminta webhook URL',
      'Perbaikan riwayat pengumuman sistem agar selalu update ke versi rilis terbaru'
    ],
    publishedAt: Date.now(),
    publishedBy: 'Head of Core Developer',
    publishedByBadge: 'DEV-001',
    isBannerActive: true,
    discordBroadcasted: true,
    viewCount: 1,
    acknowledgedBy: []
  },
  {
    id: 'announcement-v4-3-0-kuhp-laws-citizen-portal',
    version: 'v4.3.0',
    title: 'Pembaruan Sistem: Portal Slide KUHP & Regulasi HSPD, Hak Miranda, & Pusat Layanan Warga',
    category: 'UPDATE',
    severity: 'IMPORTANT',
    targetAudience: 'GLOBAL',
    description: 'Pembaruan resmi sistem MDT HSPD v4.3.0: Menghadirkan portal slide interaktif Kitab Undang-Undang Hukum Pidana (KUHP) & SOP Kepolisian, tangga eskalasi kekuatan (Use of Force Continuum), pembacaan resmi Hak Miranda dwibahasa, modul frekuensi taktis & 10-Codes, tombol terpadu Layanan Warga, serta link Discord Kenegaraan Balai Kota.',
    features: [
      '1. Portal Slide Interaktif KUHP & Regulasi HSPD: Tombol navigasi geser (< dan >) di portal depan untuk meninjau Kitab Pidana & SOP Kepolisian tanpa harus login',
      '2. Hak Miranda (Miranda Warning) Resmi: Pedoman pembacaan hak tersangka penangkapan wajib sebelum BAP demi keabsahan berkas perkara di persidangan',
      '3. Tangga Penggunaan Kekuatan (Use of Force Continuum): 5 tingkatan eskalasi baku (Kehadiran Fisik, Komando Verbal, Borgol/Tangan Kosong, Less-Lethal Taser/Baton, dan Senjata Mematikan)',
      '4. Kitab Pasal KUHP Terpadu (Kategori A s/d I): Modul pencarian instan seluruh pasal pidana, denda maksimal, waktu kurungan penjara, dan status impound',
      '5. Protokol 10-Codes & Frekuensi Radio Taktis: Referensi cepat komunikasi radio lapangan (10-1 s/d CODE 0) dan kanal frekuensi radio taktis (1111 HQ, 1112 ATM, 1113 Bank Desa, 1114 Bank Pusat)',
      '6. Tombol Akses Cepat "LAYANAN WARGA": Warga sipil dapat langsung menekan tombol Layanan Warga di portal utama untuk perizinan SKCK, pelaporan pengaduan, dan cek buronan DPO',
      '7. Integrasi Discord Kenegaraan Balai Kota: Tautan resmi (https://discord.gg/THy6fzJvsw) langsung terhubung di portal aparatur negara'
    ],
    improvements: [
      'Pembersihan passcode dan tautan donasi yang tidak perlu pada portal dinas demi privasi sistem operasional',
      'Desain antarmuka gelap responsif yang sinkron antara laptop dan perangkat ponsel'
    ],
    bugFixes: [
      'Penyelarasan hak akses umum dan penonaktifan pembatasan mode coming soon',
      'Penghapusan tombol modifikasi pengumuman atasan dari halaman login publik demi sterilisasi keamanan'
    ],
    publishedAt: Date.now(),
    publishedBy: 'Head of Core Developer',
    publishedByBadge: 'DEV-001',
    isBannerActive: true,
    discordBroadcasted: false,
    viewCount: 1,
    acknowledgedBy: []
  },
  {
    id: 'announcement-v4-2-6-operational-bonus-engine',
    version: 'v4.2.6',
    title: 'Pembaruan Sistem: Modul Perhitungan Bonus Operasional 6 Kategori Prestasi Dinas HSPD',
    category: 'UPDATE',
    severity: 'IMPORTANT',
    targetAudience: 'GLOBAL',
    description: 'Pembaruan resmi sistem MDT HSPD v4.2.6: Menghadirkan kalkulator dan pusat komputasi bonus prestasi operasional lengkap untuk 6 kategori resmi: Kasus Penindakan, Pemasukan Efiden, Pemasukan Tilang, Pemasukan Impound, Sukses Perestokan Persenjataan, dan Peleburan Senjata, dengan fitur tarik data otomatis, ekspor slip resmi PNG/JPG, dan pengajuan klaim.',
    features: [
      '1. Kasus Penindakan: Reward flat per kasus BAP, persentase total denda pidana, dan insentif kooperatif',
      '2. Pemasukan Efiden: Reward foto barang bukti sah, senpi sitaan, narkotika per gram, dan persentase kas sitaan',
      '3. Pemasukan Tilang: Insentif tiket tilang sah dan komisi persentase denda pelanggaran lalin',
      '4. Pemasukan Impound: Insentif derek mobil/motor dan komisi tarif denda impound lot',
      '5. Restok Persenjataan: Misi logistik pengadaan dan pengawalan senjata dinas, peti amunisi, dan rompi balistik',
      '6. Peleburan Senjata: Nilai kompensasi scrap besi tua per senjata lebur dan reward Berita Acara resmi',
      'Slip Berita Acara Gambar & Teks: Ekspor instan dokumen resmi berbingkai emas serta format Discord/WhatsApp'
    ],
    improvements: [
      'Penyediaan tab navigasi "💰 Bonus Operasional" di desktop dan Android MDT Drawer',
      'Pintasan kalkulator estimasi bonus di panel Kalkulator Pasal, Hub Tilang, Brankas, dan Peleburan'
    ],
    bugFixes: [
      'Sinkronisasi nomor rekening bank personel langsung ke slip klaim bonus'
    ],
    publishedAt: Date.now(),
    publishedBy: 'Head of Core Developer',
    publishedByBadge: 'DEV-001',
    isBannerActive: true,
    discordBroadcasted: true,
    viewCount: 1,
    acknowledgedBy: []
  },
  {
    id: 'announcement-v4-2-5-attendance-duty-control',
    version: 'v4.2.5',
    title: 'Pembaruan Sistem: Modul Absensi Manual Mingguan Atasan & Tombol Kontrol On/Off Duty Roster Anggota',
    category: 'UPDATE',
    severity: 'IMPORTANT',
    targetAudience: 'GLOBAL',
    description: 'Pembaruan resmi sistem MDT HSPD v4.2.5: Menghadirkan Modul Rekap Absensi Manual Mingguan untuk Atasan dengan ikon resmi dinas lengkap (✅ Hadir, ❌ Absen, 📝 Izin, 🤒 Sakit, 🌴 Cuti, ⚪ Off/Libur) yang otomatis berganti mengikuti tanggal dan minggu kalender seterusnya, serta tombol khusus Force On/Off Duty di tabel roster anggota untuk menertibkan anggota yang sering lupa off-duty.',
    features: [
      'Modul Absensi Manual Mingguan Atasan: Tabel rekap absensi lengkap 7 hari (Senin - Minggu) per anggota dengan indikator ikon resmi ✅ Hadir, ❌ Absen, 📝 Izin, 🤒 Sakit, 🌴 Cuti, ⚪ Off/Libur',
      'Rotasi Tanggal Mingguan Otomatis & Berkelanjutan: Kalender mingguan otomatis berganti dinamis mengikuti hari dan minggu berjalan, serta kontrol navigasi minggu lalu, minggu ini, dan minggu berikutnya',
      'Tombol Cepat Force On / Off Duty untuk Atasan: Tombol langsung di kolom Status Dinas tabel roster ([🔴 Paksa OFF DUTY] & [🟢 Nyalakan ON DUTY]) dan menu Tindakan High Command untuk menertibkan petugas yang lupa off-duty',
      'Dialog Konfirmasi Aman & Bebas Iframe Freeze: Prosedur konfirmasi dinas via modal UI modern berperingatan jelas tanpa menggunakan popup browser yang rentan macet',
      'Pusat Audit & Sinkronisasi Real-Time: Perubahan absensi manual dan status dinas otomatis tersimpan permanen di penyimpanan lokal serta disinkronkan ke Firestore Cloud dan log audit sistem'
    ],
    improvements: [
      'Penyelarasan hak akses atasan dan High Command untuk pembaharuan absensi serta kontrol dinas',
      'Optimalisasi tampilan tabel absensi dinas mingguan di layar desktop dan mobile',
      'Fitur filter divisi dan pencarian cepat anggota pada lembar absensi'
    ],
    bugFixes: [
      'Solusi tuntas bagi anggota yang sering lupa mematikan status dinas (10-7) saat selesai bertugas',
      'Mencegah duplikasi data absensi mingguan pada pergantian tanggal antar-periode'
    ],
    publishedAt: Date.now(),
    publishedBy: 'Head of Core Developer',
    publishedByBadge: 'DEV-001',
    isBannerActive: true,
    discordBroadcasted: true,
    viewCount: 195
  },
  {
    id: 'announcement-v4-2-4-live',
    version: 'v4.2.4',
    title: 'Live Update: Integrasi Nomor Rekening Bank Dinas di Seluruh Modul Roster & Live Broadcast System Console',
    category: 'UPDATE',
    severity: 'IMPORTANT',
    targetAudience: 'GLOBAL',
    description: 'Pembaruan komprehensif sistem MDT HSPD v4.2.4: Mengintegrasikan nomor rekening bank dinas untuk penggajian dan verifikasi resmi seluruh personel kepolisian & balai kota, pengamanan ketat hak akses berkas perkara 7 divisi resmi kepolisian, serta penyempurnaan konsol live update pemberitahuan sistem pengembang secara real-time.',
    features: [
      'Integrasi Kolom Nomor Rekening Bank (BCA, Mandiri, BRI, BNI, dll) di Roster Kepolisian HSPD dan Balai Kota: Mendukung formulir tambah anggota baru, formulir edit personel, serta kartu identitas anggota',
      'Fitur 1-Click Copy Rekening Bank & Pencarian Cepat: Seluruh personel dapat menyalin nomor rekening dengan 1 klik dan mencari anggota langsung melalui nomor rekening bank',
      'Isolasi Hak Akses 7 Divisi Resmi Kepolisian: Setiap personel hanya dapat membuka berkas kasus milik divisinya sendiri (Patroli, Metro, SWAT, Detective/CID, Evidence, Air Support, PSD) dengan penjagaan hak akses ketat',
      'Core Developer Live Update System Console: Dilengkapi ticker siaran sistem live real-time, audio alert chime, push banner berjalan, serta pengiriman instan ke Discord Webhook',
      'Sinkronisasi Ekspor & Cetak Rekening: Data nomor rekening bank otomatis masuk ke berkas ekspor master akun, dokumen cetak/PDF, dan webhook Discord'
    ],
    improvements: [
      'Peningkatan enkripsi isolasi berkas perkara antar-divisi kepolisian',
      'Optimalisasi performa pemfilteran dan pencarian anggota di perangkat mobile dan desktop',
      'Sinkronisasi instan Firestore Cloud Realtime untuk seluruh siaran maklumat sistem'
    ],
    bugFixes: [
      'Perbaikan formulir tambah anggota Balai Kota yang sebelumnya belum menyertakan kolom nomor rekening bank',
      'Penyempurnaan validasi karakter pada input nomor rekening perbankan'
    ],
    publishedAt: Date.now() - 600000,
    publishedBy: 'Head of Core Developer',
    publishedByBadge: 'DEV-001',
    isBannerActive: false,
    discordBroadcasted: true,
    viewCount: 168
  },
  {
    id: 'announcement-v4-2-3-live',
    version: 'v4.2.3',
    title: 'Pembaruan Sistem MDT HSPD - Isolasi Privasi 7 Divisi Resmi & Integrasi Nomor Rekening Bank',
    category: 'UPDATE',
    severity: 'NORMAL',
    targetAudience: 'GLOBAL',
    description: 'Sistem operasional MDT HSPD telah ditingkatkan ke versi v4.2.3. Pembaruan ini menghadirkan isolasi ketat hak akses berkas kasus 7 divisi resmi kepolisian, integrasi kolom nomor rekening bank untuk penggajian dinas di seluruh modul roster, serta pusat kendali live pemberitahuan sistem pengembang.',
    features: [
      'Isolasi & Pembatasan Hak Akses 7 Divisi Resmi: Setiap personel hanya dapat melihat dan mengakses berkas kasus milik divisinya sendiri (Patrol, Metro, SWAT, Detective, Evidence, Air Support, PSD) dengan gerbang pengamanan resmi',
      'Informasi Nomor Rekening Bank Dinas: Penambahan kolom nomor rekening bank perbankan pada pendaftaran anggota baru, formulir edit personel, serta tabel profil anggota kepolisian dan balai kota',
      'Fitur 1-Click Copy Rekening & Pencarian Cepat: Personel dapat menyalin nomor rekening dengan 1 klik dan mencari anggota langsung melalui nomor rekening bank',
      'Core Developer Live Update System Console: Panel monitoring pengembang dilengkapi siaran maklumat sistem real-time, audit rilis, dan push banner notifikasi instan'
    ],
    improvements: [
      'Penyempurnaan enkripsi hak akses berkas operasional antar-divisi kepolisian',
      'Integrasi data rekening bank ke dalam berkas ekspor master akun, dokumen cetak/PDF, dan webhook rilis akun Discord',
      'Akselerasi performa pemfilteran roster anggota di perangkat mobile dan desktop'
    ],
    bugFixes: [
      'Perbaikan kendala akses silang di mana anggota divisi lain dapat membuka rincian berkas kasus khusus',
      'Sinkronisasi instan penambahan anggota baru tanpa perlu memuat ulang peramban'
    ],
    publishedAt: Date.now() - 3600000,
    publishedBy: 'Head of Core Developer',
    publishedByBadge: 'DEV-001',
    isBannerActive: false,
    discordBroadcasted: true,
    viewCount: 142
  },
  {
    id: 'announcement-v4-2-2',
    version: 'v4.2.2',
    title: 'Penyempurnaan Otentikasi Login, Sinkronisasi Instan Edit PIN & Central PIN Registry',
    category: 'UPDATE',
    severity: 'NORMAL',
    targetAudience: 'HSPD',
    description: 'Penyempurnaan keandalan otentikasi login, sinkronisasi instan PIN hasil edit di Roster Anggota, serta integrasi langsung permohonan lupa/ganti PIN ke database sehingga langsung aktif seketika tanpa jeda.',
    features: [
      'Sinkronisasi Instan Edit PIN Roster: PIN yang diubah melalui menu "Edit Petugas" di Roster Anggota langsung tersimpan ke Central PIN Registry dan Firestore',
      'Integrasi Otomatis Permohonan Lupa/Ganti PIN: PIN baru yang disetujui atasan otomatis masuk ke database roster dan aktif seketika di portal MDT',
      'Proteksi Anti-Overwrite PIN Resmi: Mengamankan PIN hasil kustomisasi petugas agar tidak pernah tertimpa kembali ke nilai default'
    ],
    improvements: [
      'Centralized Persistent PIN Registry diikat permanen dengan nomor badge dan ID akun',
      'Sinkronisasi Realtime Lintas Sesi untuk seluruh perubahan kredensial'
    ],
    bugFixes: [
      'Perbaikan kendala login setelah edit PIN di mana PIN baru belum langsung dikenali server',
      'Perbaikan fitur permohonan lupa PIN otomatis'
    ],
    publishedAt: Date.now() - 48 * 3600000,
    publishedBy: 'Core System Architect',
    publishedByBadge: 'DEV-001',
    isBannerActive: false,
    discordBroadcasted: true,
    viewCount: 310
  },
  {
    id: 'announcement-v4-2-1',
    version: 'v4.2.1',
    title: 'Proteksi Anti-Duplikasi Siaran Discord & Penyelarasan Jalur Channel Bot Resmi',
    category: 'UPDATE',
    severity: 'NORMAL',
    targetAudience: 'GLOBAL',
    description: 'Penyempurnaan transmisi siaran Discord dengan proteksi cerdas anti pesan ganda pada pengumuman changelog & ping monitor, pembaruan dinamis riwayat rilis, serta penegasan jalur Channel Resmi.',
    features: [
      'Proteksi Anti-Pesan Ganda (Deduplication Guard) Pengumuman & Ping Server',
      'Daftar Perubahan Dinamis Mengikuti Update Nyata di Panel Pengaturan',
      'Pemisahan Jalur Channel Changelog Rilis dan Channel Ping Monitor Status'
    ],
    improvements: [
      'Standardisasi avatar dan identitas resmi Bot High State di Discord',
      'Sinkronisasi status siaran lintas tab browser dan local storage'
    ],
    bugFixes: [
      'Perbaikan siaran pengumuman ganda saat pertama kali memuat web app'
    ],
    publishedAt: Date.now() - 96 * 3600000,
    publishedBy: 'System Infrastructure Lead',
    publishedByBadge: 'DEV-001',
    isBannerActive: false,
    discordBroadcasted: true,
    viewCount: 425
  }
];

export function getSystemAnnouncements(): SystemAnnouncement[] {
  if (typeof window === 'undefined') return INITIAL_SYSTEM_ANNOUNCEMENTS;
  try {
    const raw = localStorage.getItem(SYSTEM_ANNOUNCEMENTS_STORAGE_KEY);
    if (!raw) {
      saveSystemAnnouncements(INITIAL_SYSTEM_ANNOUNCEMENTS);
      return INITIAL_SYSTEM_ANNOUNCEMENTS;
    }
    const parsed: SystemAnnouncement[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveSystemAnnouncements(INITIAL_SYSTEM_ANNOUNCEMENTS);
      return INITIAL_SYSTEM_ANNOUNCEMENTS;
    }

    // Merge any missing initial official announcements dynamically so user always gets the latest updates
    let hasChanges = false;
    let merged = [...parsed];

    for (const initAnn of INITIAL_SYSTEM_ANNOUNCEMENTS) {
      const existingIdx = merged.findIndex(a => a.id === initAnn.id || a.version === initAnn.version);
      if (existingIdx === -1) {
        merged.unshift(initAnn);
        hasChanges = true;
      } else {
        // If initial announcement has newer publishedAt or update, merge its updated content
        if (initAnn.publishedAt > (merged[existingIdx].publishedAt || 0)) {
          merged[existingIdx] = {
            ...merged[existingIdx],
            title: initAnn.title,
            description: initAnn.description,
            features: initAnn.features,
            improvements: initAnn.improvements,
            bugFixes: initAnn.bugFixes,
            publishedAt: initAnn.publishedAt,
            isBannerActive: initAnn.isBannerActive ?? merged[existingIdx].isBannerActive
          };
          hasChanges = true;
        }
      }
    }

    // Always sort by publishedAt descending so newest release is first
    merged.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));

    // Ensure at least the top announcement has active banner if all banners were inactive
    if (!merged.some(a => a.isBannerActive) && merged.length > 0) {
      merged[0].isBannerActive = true;
      hasChanges = true;
    }

    if (hasChanges) {
      saveSystemAnnouncements(merged);
    }

    return merged;
  } catch (err) {
    console.error('Failed to parse system announcements:', err);
    return INITIAL_SYSTEM_ANNOUNCEMENTS;
  }
}

/**
 * Force-sync official announcements from INITIAL_SYSTEM_ANNOUNCEMENTS
 * Useful when users want to immediately pull the latest releases from system core.
 */
export function forceSyncOfficialAnnouncements(): SystemAnnouncement[] {
  if (typeof window === 'undefined') return INITIAL_SYSTEM_ANNOUNCEMENTS;
  try {
    const raw = localStorage.getItem(SYSTEM_ANNOUNCEMENTS_STORAGE_KEY);
    const existing: SystemAnnouncement[] = raw ? JSON.parse(raw) : [];
    
    // Filter out official IDs from existing so we get fresh official data
    const officialIds = new Set(INITIAL_SYSTEM_ANNOUNCEMENTS.map(a => a.id));
    const officialVersions = new Set(INITIAL_SYSTEM_ANNOUNCEMENTS.map(a => a.version));
    
    const userCustomOnly = existing.filter(a => !officialIds.has(a.id) && !officialVersions.has(a.version));
    const merged = [...INITIAL_SYSTEM_ANNOUNCEMENTS, ...userCustomOnly];
    merged.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));

    saveSystemAnnouncements(merged);
    return merged;
  } catch {
    saveSystemAnnouncements(INITIAL_SYSTEM_ANNOUNCEMENTS);
    return INITIAL_SYSTEM_ANNOUNCEMENTS;
  }
}

export function saveSystemAnnouncements(announcements: SystemAnnouncement[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SYSTEM_ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
    window.dispatchEvent(new CustomEvent('hspd-system-announcements-updated', { detail: announcements }));
    // Asynchronously push to Cloud Firestore
    syncCollectionWithFirestore('SYSTEM_ANNOUNCEMENTS' as any, announcements, true).catch(() => {});
  } catch (err) {
    console.error('Failed to save system announcements:', err);
  }
}

export function publishSystemAnnouncement(
  data: Omit<SystemAnnouncement, 'id' | 'publishedAt'>
): SystemAnnouncement {
  const current = getSystemAnnouncements();
  
  // If the new announcement has isBannerActive = true, optionally demote older active banners
  let updatedList = current;
  if (data.isBannerActive) {
    updatedList = current.map(item => ({
      ...item,
      isBannerActive: false
    }));
  }

  const cleanVersion = data.version.trim() || `v4.${Date.now().toString().slice(-3)}`;
  const cleanId = `announcement-${cleanVersion.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

  const newAnnouncement: SystemAnnouncement = {
    ...data,
    id: cleanId,
    version: cleanVersion,
    publishedAt: Date.now(),
    viewCount: 1,
    acknowledgedBy: []
  };

  const finalPool = [newAnnouncement, ...updatedList];
  saveSystemAnnouncements(finalPool);
  pushToFirestore('SYSTEM_ANNOUNCEMENTS' as any, newAnnouncement).catch(() => {});

  // Trigger real-time audio chime alert
  playSystemNotificationChime(data.severity || 'IMPORTANT');

  return newAnnouncement;
}

export function deleteSystemAnnouncement(id: string): void {
  const current = getSystemAnnouncements();
  const filtered = current.filter(a => a.id !== id);
  saveSystemAnnouncements(filtered);
}

export function toggleAnnouncementBanner(id: string, active: boolean): void {
  const current = getSystemAnnouncements();
  const updated = current.map(a => {
    if (a.id === id) {
      return { ...a, isBannerActive: active };
    }
    // If activating this banner, deactivate other banners to maintain focus
    if (active) {
      return { ...a, isBannerActive: false };
    }
    return a;
  });
  saveSystemAnnouncements(updated);
}

export function getActiveBannerAnnouncement(): SystemAnnouncement | null {
  const list = getSystemAnnouncements();
  const dismissed = getDismissedAnnouncementIds();
  return list.find(a => a.isBannerActive && !dismissed.includes(a.id)) || null;
}

export function getDismissedAnnouncementIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function dismissAnnouncementBanner(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getDismissedAnnouncementIds();
    if (!current.includes(id)) {
      sessionStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify([...current, id]));
      window.dispatchEvent(new CustomEvent('hspd-system-announcements-updated', { detail: getSystemAnnouncements() }));
    }
  } catch {}
}

export function markAnnouncementRead(id: string, officerName?: string): void {
  const current = getSystemAnnouncements();
  const updated = current.map(a => {
    if (a.id === id) {
      const ack = a.acknowledgedBy || [];
      const newAck = officerName && !ack.includes(officerName) ? [...ack, officerName] : ack;
      return {
        ...a,
        viewCount: (a.viewCount || 0) + 1,
        acknowledgedBy: newAck
      };
    }
    return a;
  });
  saveSystemAnnouncements(updated);
}
