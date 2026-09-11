import { pushToFirestore } from '../services/firebaseRealtimeSync';

export interface GovCoreValueItem {
  id: string;
  title: string;
  subtitle: string;
  color: 'amber' | 'blue' | 'emerald' | 'purple' | 'rose' | 'cyan';
}

export interface GovQuickStatItem {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  color: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose' | 'cyan';
}

export interface GovSelectionPhaseItem {
  id: string;
  stepNumber: number;
  title: string;
  tag: string;
  description: string;
  color: 'blue' | 'amber' | 'emerald' | 'purple' | 'rose';
}

export interface GovMinistryItem {
  id: string;
  name: string;
  tag: string;
  description: string;
  quota: string;
  color: 'blue' | 'amber' | 'emerald' | 'rose' | 'purple' | 'cyan';
}

export interface GovernmentPortalConfig {
  id?: string;
  
  // 1. Header & Badges
  isOpen: boolean;
  badgeActiveText: string;
  badgeCategoryText: string;
  portalTitle: string;
  portalDescription: string;

  // 2. Maklumat / Pengumuman Terkini yang Bisa Diubah-ubah Atasan
  announcementHeadline: string;
  announcementContent: string;
  announcementLevel: 'NORMAL' | 'URGENT' | 'CRITICAL';
  announcementDate: string;
  announcementAuthor: string;

  // 3. Tab 1 - Visi & Nilai Kenegaraan
  visionTitle: string;
  visionDescription: string;
  coreValues: GovCoreValueItem[];
  quickStats: GovQuickStatItem[];

  // 4. Tab 2 - Persyaratan (IC & OOC)
  icSectionTitle: string;
  icSectionTag: string;
  icRequirements: string[];
  
  oocSectionTitle: string;
  oocSectionTag: string;
  oocRequirements: string[];

  // 5. Tab 3 - Alur Seleksi Masuk
  phasesHeaderTitle: string;
  phasesHeaderTag: string;
  phases: GovSelectionPhaseItem[];

  // 6. Tab 4 - Formasi Kementerian / Departemen
  ministriesHeaderTitle: string;
  ministriesHeaderTag: string;
  ministries: GovMinistryItem[];

  // 7. Saluran Pendaftaran & Kontak
  discordHotlineText: string;
  discordHotlineUrl: string;
  formRegistrationUrl: string;
  copyrightText: string;

  updatedAt: number;
  updatedBy?: string;
}

export const GOV_RECRUITMENT_STORAGE_KEY = 'hspd_government_portal_config_v1';
export const GOV_RECRUITMENT_UPDATED_EVENT = 'hspd-gov-portal-updated';

export const DEFAULT_GOVERNMENT_PORTAL_CONFIG: GovernmentPortalConfig = {
  id: 'active_government_portal',
  isOpen: true,
  badgeActiveText: 'REKRUTMEN APARATUR DIBUKA • SELEKSI TERBUKA NEGARA',
  badgeCategoryText: 'CIVIL SERVICE & EXECUTIVE SUITE',
  portalTitle: 'PORTAL INFORMASI & PENERIMAAN APARATUR NEGARA',
  portalDescription: 'Pusat Informasi Kenegaraan & Penerimaan Calon Aparatur Sipil Negara (ASN) serta Staf Khusus Eksekutif. Mengabdi untuk kedaulatan hukum, tata kelola transparan, dan kemakmuran seluruh rakyat.',

  announcementHeadline: 'MAKLUMAT KABINET: Pembukaan Seleksi Calon Aparatur Sipil Negara & Staf Pemerintahan',
  announcementContent: 'Kantor Kepresidenan & Sekretariat Negara mengumumkan pembukaan formasi Aparatur Pemerintahan untuk Departemen Kehakiman, Badan Pengelola Keuangan, dan Hubungan Masyarakat. Pendaftaran dilakukan secara terbuka bagi seluruh warga sipil yang memenuhi kualifikasi rekam jejak bersih (SKCK).',
  announcementLevel: 'NORMAL',
  announcementDate: 'Terkini / Aktif',
  announcementAuthor: 'Sekretariat Kabinet Pemerintahan Negara',

  visionTitle: 'PRINSIP & NILAI INTEGRITAS KENEGARAAN',
  visionDescription: 'Pemerintahan Negara Bagian berdiri di atas fondasi supremasi hukum, akuntabilitas anggaran publik, serta pelayanan birokrasi yang adil dan non-diskriminatif. Setiap aparatur negara memegang teguh prinsip:',
  coreValues: [
    {
      id: 'gov_val_law',
      title: 'SUPREMASI HUKUM',
      subtitle: 'Menegakkan undang-undang tanpa pandang bulu',
      color: 'amber'
    },
    {
      id: 'gov_val_transparency',
      title: 'AKUNTABILITAS & KAS',
      subtitle: 'Transparansi anggaran APBN & anti-korupsi',
      color: 'emerald'
    },
    {
      id: 'gov_val_diplomacy',
      title: 'ETIKA & DIPLOMASI',
      subtitle: 'Komunikasi persuasif dan kepemimpinan bijak',
      color: 'blue'
    },
    {
      id: 'gov_val_public',
      title: 'PENGABDIAN RAKYAT',
      subtitle: 'Mengutamakan kepentingan dan keamanan warga',
      color: 'purple'
    }
  ],
  quickStats: [
    {
      id: 'stat_apparatus',
      label: 'APARATUR AKTIF',
      value: '24',
      sublabel: 'Pejabat & Staf Khusus',
      color: 'amber'
    },
    {
      id: 'stat_ministries',
      label: 'KEMENTERIAN / BIRO',
      value: '5',
      sublabel: 'Departemen Pelayanan',
      color: 'blue'
    },
    {
      id: 'stat_permits',
      label: 'PERIZINAN TERDATA',
      value: '180+',
      sublabel: 'Usaha & Senjata Legal',
      color: 'emerald'
    },
    {
      id: 'stat_status',
      label: 'STATUS KEAMANAN',
      value: 'NORMAL',
      sublabel: 'Kondisi Kota Terkendali',
      color: 'purple'
    }
  ],

  icSectionTitle: 'PERSYARATAN IN-CHARACTER (IC)',
  icSectionTag: 'KUALIFIKASI KENEGARAAN',
  icRequirements: [
    'Warga Negara yang sah dan memiliki Kartu Tanda Penduduk (KTP / ID Card) terdaftar resmi.',
    'Berusia minimal 21 tahun (In-Character) dan berdomisili di wilayah hukum negara.',
    'Memiliki Surat Keterangan Catatan Kepolisian (SKCK) bersih tanpa riwayat tindak pidana berat (Felony).',
    'Memiliki pemahaman dasar tentang undang-undang, tata hukum negara, serta prosedur administrasi persuratan.',
    'Memiliki kemampuan komunikasi diplomatis, etika tinggi, dan berpakaian rapi resmi (Formal Suit).',
    'Bersedia menandatangani Pakta Integritas dan mengucap Sumpah Jabatan Kenegaraan.'
  ],

  oocSectionTitle: 'PERSYARATAN OUT-OF-CHARACTER (OOC)',
  oocSectionTag: 'ETIKA & KOMITMEN ROLEPLAY',
  oocRequirements: [
    'Memahami Rules Standar Roleplay (No Metagaming, No Powergaming, No Deathmatching, Respect Staff).',
    'Memiliki Microphone yang jelas dan bersedia aktif di Voice Chat Discord Pemerintahan.',
    'Menjaga sopan santun, integritas tinggi, dan dilarang menyalahgunakan wewenang (Abuse of Authority / Corrupt tanpa izin).',
    'Aktif berkontribusi secara konsisten dan mematuhi instruksi jajaran Atasan Kabinet.',
    'Dapat mengoperasikan formulir dokumen, studio administrasi, dan koordinasi radio kedinasan.'
  ],

  phasesHeaderTitle: 'TAHAPAN SELEKSI APARATUR NEGARA',
  phasesHeaderTag: 'SELEKSI TERPADU RESMI',
  phases: [
    {
      id: 'phase_1',
      stepNumber: 1,
      title: 'Pendaftaran & Berkas Administrasi',
      tag: 'BERKAS ONLINE',
      description: 'Pengisian formulir pendaftaran, verifikasi ID KTP, lampiran SKCK kepolisian, dan surat motivasi pengabdian.',
      color: 'blue'
    },
    {
      id: 'phase_2',
      stepNumber: 2,
      title: 'Wawancara Wawasan & Etika Kenegaraan',
      tag: 'INTERVIEW RESMI',
      description: 'Uji wawasan hukum, integritas, studi kasus diplomasi, serta komitmen pelayanan publik di hadapan tim penguji.',
      color: 'amber'
    },
    {
      id: 'phase_3',
      stepNumber: 3,
      title: 'Uji Administrasi & Tata Kelola Dokumen',
      tag: 'TES TEKNIS',
      description: 'Simulasi penerbitan izin usaha/senjata, pencatatan keuangan kas, dan penyusunan draf surat keputusan kenegaraan.',
      color: 'purple'
    },
    {
      id: 'phase_4',
      stepNumber: 4,
      title: 'Pelantikan & Pengucapan Sumpah Jabatan',
      tag: 'SUMPAH KENEGARAAN',
      description: 'Penerbitan Surat Keputusan (SK) resmi, pemberian nomor callsign (#GOV-XX), dan penempatan ke departemen terkait.',
      color: 'emerald'
    }
  ],

  ministriesHeaderTitle: 'FORMASI DEPARTEMEN & KEMENTERIAN NEGARA',
  ministriesHeaderTag: 'DIVISI KARIER',
  ministries: [
    {
      id: 'min_justice',
      name: 'Departemen Kehakiman & Hukum',
      tag: 'DEPT. OF JUSTICE',
      description: 'Mengawasi regulasi hukum, koordinasi persidangan, verifikasi pasal pidana, dan legalitas dokumen antar-instansi.',
      quota: '3 Formasi Tersedia',
      color: 'purple'
    },
    {
      id: 'min_treasury',
      name: 'Badan Pengelola Keuangan (BPPK / Treasury)',
      tag: 'STATE TREASURY',
      description: 'Mengelola buku kas anggaran pendapatan & belanja negara (APBN), penerimaan pajak usaha, dan subsidi publik.',
      quota: '2 Formasi Tersedia',
      color: 'emerald'
    },
    {
      id: 'min_permits',
      name: 'Dinas Perizinan & Tata Usaha Komersial',
      tag: 'LICENSING BUREAU',
      description: 'Melayani dan memverifikasi izin kepemilikan senjata api (WCL), izin usaha perdagangan (SIUP), dan izin keramaian.',
      quota: '4 Formasi Tersedia',
      color: 'amber'
    },
    {
      id: 'min_pr',
      name: 'Biro Hubungan Masyarakat & Protokoler',
      tag: 'PRESS & PROTOCOL',
      description: 'Menyusun maklumat kepresidenan, konferensi pers publik, pengawalan protokoler tamu negara, dan hubungan masyarakat.',
      quota: '3 Formasi Tersedia',
      color: 'blue'
    },
    {
      id: 'min_health',
      name: 'Dinas Kesehatan & Kesejahteraan Rakyat',
      tag: 'HEALTH & WELFARE',
      description: 'Mengatur regulasi fasilitas medis darurat kota, santunan bantuan sosial, dan ketahanan pangan publik.',
      quota: '2 Formasi Tersedia',
      color: 'rose'
    }
  ],

  discordHotlineText: 'Discord Resmi Balai Kota & Pemerintahan',
  discordHotlineUrl: 'https://discord.gg',
  formRegistrationUrl: 'https://discord.gg',
  copyrightText: 'State Executive Government Administration © 2026',

  updatedAt: Date.now(),
  updatedBy: 'Sekretariat Kepresidenan & Kabinet'
};

/**
 * Retrieve current active government portal configuration from storage.
 */
export function getGovernmentPortalConfig(): GovernmentPortalConfig {
  try {
    const raw = localStorage.getItem(GOV_RECRUITMENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_GOVERNMENT_PORTAL_CONFIG,
          ...parsed,
          coreValues: Array.isArray(parsed.coreValues) ? parsed.coreValues : DEFAULT_GOVERNMENT_PORTAL_CONFIG.coreValues,
          quickStats: Array.isArray(parsed.quickStats) ? parsed.quickStats : DEFAULT_GOVERNMENT_PORTAL_CONFIG.quickStats,
          icRequirements: Array.isArray(parsed.icRequirements) ? parsed.icRequirements : DEFAULT_GOVERNMENT_PORTAL_CONFIG.icRequirements,
          oocRequirements: Array.isArray(parsed.oocRequirements) ? parsed.oocRequirements : DEFAULT_GOVERNMENT_PORTAL_CONFIG.oocRequirements,
          phases: Array.isArray(parsed.phases) ? parsed.phases : DEFAULT_GOVERNMENT_PORTAL_CONFIG.phases,
          ministries: Array.isArray(parsed.ministries) ? parsed.ministries : DEFAULT_GOVERNMENT_PORTAL_CONFIG.ministries
        };
      }
    }
  } catch (e) {
    console.error('Failed to parse government portal config from storage:', e);
  }
  return { ...DEFAULT_GOVERNMENT_PORTAL_CONFIG };
}

/**
 * Save customized government portal configuration to storage & broadcast update event.
 */
export function saveGovernmentPortalConfig(
  config: Partial<GovernmentPortalConfig>,
  updatedBy?: string
): GovernmentPortalConfig {
  const current = getGovernmentPortalConfig();
  const updated: GovernmentPortalConfig = {
    ...current,
    ...config,
    id: 'active_government_portal',
    updatedAt: Date.now(),
    updatedBy: updatedBy || current.updatedBy || 'Atasan Kabinet Pemerintahan'
  };

  try {
    localStorage.setItem(GOV_RECRUITMENT_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GOV_RECRUITMENT_UPDATED_EVENT, { detail: updated }));
    }
    pushToFirestore('SYSTEM_CONFIGS', updated, 'gov_recruitment_portal').catch(console.error);
  } catch (e) {
    console.error('Failed to save government portal config:', e);
  }

  return updated;
}

/**
 * Reset government portal to default official settings.
 */
export function resetGovernmentPortalConfig(): GovernmentPortalConfig {
  try {
    localStorage.setItem(GOV_RECRUITMENT_STORAGE_KEY, JSON.stringify(DEFAULT_GOVERNMENT_PORTAL_CONFIG));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GOV_RECRUITMENT_UPDATED_EVENT, { detail: DEFAULT_GOVERNMENT_PORTAL_CONFIG }));
    }
    pushToFirestore('SYSTEM_CONFIGS', DEFAULT_GOVERNMENT_PORTAL_CONFIG, 'gov_recruitment_portal').catch(console.error);
  } catch (e) {
    console.error('Failed to reset government portal config:', e);
  }
  return { ...DEFAULT_GOVERNMENT_PORTAL_CONFIG };
}

/**
 * Subscribe to government portal configuration updates.
 */
export function subscribeToGovernmentPortal(
  callback: (config: GovernmentPortalConfig) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = (e: any) => {
    if (e && e.detail) {
      callback(e.detail);
    } else {
      callback(getGovernmentPortalConfig());
    }
  };

  window.addEventListener(GOV_RECRUITMENT_UPDATED_EVENT, handleUpdate);
  window.addEventListener('storage', (e) => {
    if (e.key === GOV_RECRUITMENT_STORAGE_KEY) {
      callback(getGovernmentPortalConfig());
    }
  });

  return () => {
    window.removeEventListener(GOV_RECRUITMENT_UPDATED_EVENT, handleUpdate);
  };
}
