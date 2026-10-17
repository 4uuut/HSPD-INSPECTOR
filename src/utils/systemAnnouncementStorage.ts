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
    isBannerActive: true,
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

    // Ensure the latest v4.2.4 announcement is present so users immediately see recent updates
    const hasLatestV424 = parsed.some(a => a.version === 'v4.2.4');
    if (!hasLatestV424) {
      const merged = [INITIAL_SYSTEM_ANNOUNCEMENTS[0], ...parsed.filter(a => a.id !== INITIAL_SYSTEM_ANNOUNCEMENTS[0].id)];
      saveSystemAnnouncements(merged);
      return merged;
    }

    return parsed;
  } catch (err) {
    console.error('Failed to parse system announcements:', err);
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
