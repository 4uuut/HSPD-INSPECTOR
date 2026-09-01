import { pushToFirestore } from '../services/firebaseRealtimeSync';

export interface CoreValueItem {
  id: string;
  title: string;
  subtitle: string;
  color: 'amber' | 'blue' | 'emerald' | 'purple' | 'rose' | 'cyan';
}

export interface QuickStatItem {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  color: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose' | 'cyan';
}

export interface SelectionPhaseItem {
  id: string;
  stepNumber: number;
  title: string;
  tag: string;
  description: string;
  color: 'blue' | 'amber' | 'emerald' | 'purple' | 'rose';
}

export interface CareerDivisionItem {
  id: string;
  name: string;
  tag: string;
  description: string;
  color: 'blue' | 'amber' | 'emerald' | 'rose' | 'purple' | 'cyan';
}

export interface RecruitmentPortalConfig {
  id?: string;
  
  // 1. Header & Badges
  isOpen: boolean;
  badgeActiveText: string;
  badgeCategoryText: string;
  portalTitle: string;
  portalDescription: string;

  // 2. Tab 1 - Overview & Core Values
  visionTitle: string;
  visionDescription: string;
  coreValues: CoreValueItem[];
  quickStats: QuickStatItem[];
  registrationNoticeTitle: string;
  registrationNoticeContent: string;

  // 3. Tab 2 - Requirements (IC & OOC)
  icSectionTitle: string;
  icSectionTag: string;
  icRequirements: string[];
  
  oocSectionTitle: string;
  oocSectionTag: string;
  oocRequirements: string[];

  // 4. Tab 3 - Selection Phases
  phasesHeaderTitle: string;
  phasesHeaderTag: string;
  phases: SelectionPhaseItem[];

  // 5. Tab 4 - Divisions & Hierarchy
  divisionsHeaderTitle: string;
  divisionsHeaderTag: string;
  divisions: CareerDivisionItem[];
  rankHierarchy: string[];

  // 6. Footer Info
  discordHotlineText: string;
  discordHotlineUrl: string;
  copyrightText: string;

  updatedAt: number;
  updatedBy?: string;
}

export const RECRUITMENT_STORAGE_KEY = 'hspd_recruitment_portal_config_v1';
export const RECRUITMENT_UPDATED_EVENT = 'hspd-recruitment-portal-updated';

export const DEFAULT_RECRUITMENT_PORTAL_CONFIG: RecruitmentPortalConfig = {
  id: 'active_recruitment_portal',
  isOpen: true,
  badgeActiveText: 'REKRUTMEN DIBUKA • BATCH KEPOLISIAN AKTIF',
  badgeCategoryText: 'POLICE ACADEMY',
  portalTitle: 'PORTAL INFORMASI & PENERIMAAN ANGGOTA HSPD',
  portalDescription: 'Bergabunglah dengan jajaran penegak hukum terdepan STATE OF HIGH STATE POLICE DEPARTMENT. Mengabdi dengan integritas, keberanian, dan profesionalisme tinggi.',

  visionTitle: 'VISI & NILAI UTAMA KEPOLISIAN (CORE VALUES)',
  visionDescription: 'State of HighState Police Department (HSPD) bertindak sebagai garda terdepan penegakan hukum pidana, ketertiban umum, dan perlindungan warga kota. Setiap personel dituntut menjunjung tinggi:',
  coreValues: [
    {
      id: 'val_integrity',
      title: 'INTEGRITY',
      subtitle: 'Jujur, adil, anti-korupsi',
      color: 'amber'
    },
    {
      id: 'val_honor',
      title: 'HONOR',
      subtitle: 'Kehormatan lencana dinas',
      color: 'blue'
    },
    {
      id: 'val_courage',
      title: 'COURAGE',
      subtitle: 'Siap siaga 24/7 di lapangan',
      color: 'emerald'
    }
  ],
  quickStats: [
    {
      id: 'stat_status',
      label: 'STATUS REKRUTMEN',
      value: 'OPEN BATCH',
      sublabel: 'Pendaftaran Aktif',
      color: 'emerald'
    },
    {
      id: 'stat_rank',
      label: 'PANGKAT AWAL',
      value: 'CADET [CDT]',
      sublabel: 'Probationary Period',
      color: 'blue'
    },
    {
      id: 'stat_radio',
      label: 'KODE RADIO UTAMA',
      value: 'FREQ 1111',
      sublabel: 'Dispatch Utama',
      color: 'amber'
    },
    {
      id: 'stat_auth',
      label: 'OTORISASI TERMINAL',
      value: 'HIGH COMMAND',
      sublabel: 'Supervisor Verified',
      color: 'purple'
    }
  ],
  registrationNoticeTitle: 'INFORMASI REGISTRASI AKUN TERMINAL MDT:',
  registrationNoticeContent: '• Pendaftaran Anggota Baru hanya dapat dibuatkan/disahkan oleh Pihak Atasan (High Command / FTO Supervisor) yang memiliki Passcode Resmi HQ.\n• Setelah didaftarkan oleh Atasan, anggota yang bersangkutan dapat mengubah PIN pribadi secara mandiri melalui tab "Ubah PIN Mandiri" di sebelah kanan portal ini kapan saja.',

  icSectionTitle: 'PERSYARATAN IN-CHARACTER (IC)',
  icSectionTag: 'WARGA KOTA',
  icRequirements: [
    'Usia Minimal: Berusia minimal 21 tahun saat mendaftar.',
    'Catatan Kriminal Bersih (Clean Record): Tidak memiliki riwayat kriminal berat atau hukuman penjara dalam kurun waktu terakhir (SKCK Polisi Sah).',
    'Lisensi & Surat Izin: Memiliki KTP HighState sah, Surat Izin Mengemudi (SIM A/C), serta izin kepemilikan senjata resmi.',
    'Kebugaran Fisik & Psikologis: Bebas narkoba, sehat jasmani dan rohani, mampu berpikir tenang dalam situasi baku tembak / high-stress.'
  ],

  oocSectionTitle: 'PERSYARATAN OUT-OF-CHARACTER (OOC)',
  oocSectionTag: 'ROLEPLAY DISCIPLINE',
  oocRequirements: [
    'Komunikasi & Voice: Memiliki mikrofon yang jelas, stabil, dan wajib aktif di Voice Channel Radio Discord saat bertugas.',
    'Pemahaman Roleplay Polisi: Wajib memahami SOP Kepolisian, Miranda Rights, 10-Signals, serta anti Powergaming (PG), Metagaming (MG), & Fail RP.',
    'Kedisiplinan & Sikap: Mampu mematuhi komando atasan, menghargai sesama rekan dan player publik, serta siap menerima sanksi surat peringatan (SP) jika melanggar SOP.',
    'Aktivitas & Jam Dinas: Bersedia memenuhi kuota minimal jam bertugas mingguan yang telah ditentukan divisi.'
  ],

  phasesHeaderTitle: '4 TAHAPAN SELEKSI POLICE ACADEMY',
  phasesHeaderTag: 'PROSES SELEKSI RESMI',
  phases: [
    {
      id: 'phase_1',
      stepNumber: 1,
      title: 'Tahap I: Pendaftaran & Seleksi Administrasi',
      tag: 'Form Online / Discord',
      description: 'Pengisian formulir rekrutmen, penyerahan identitas resmi, riwayat hidup, serta pengecekan latar belakang kriminal oleh divisi Internal Affairs.',
      color: 'blue'
    },
    {
      id: 'phase_2',
      stepNumber: 2,
      title: 'Tahap II: Ujian Tulis & Wawancara Psikologi',
      tag: 'Tes Pengetahuan',
      description: 'Ujian pengetahuan dasar mengenai Kitab Undang-Undang Pidana (Pasal Hukum), Kode Sandi Radio 10-Signals, prosedur penangkapan (Miranda Warning), serta wawancara mentalitas.',
      color: 'amber'
    },
    {
      id: 'phase_3',
      stepNumber: 3,
      title: 'Tahap III: Praktik EVOC & Uji Tembak (Shooting Range)',
      tag: 'Simulasi Lapangan',
      description: 'Uji kemampuan mengemudi kendaraan taktis (Emergency Vehicle Operations Course: PIT maneuver, boxing, high-speed pursuit) dan uji ketepatan menembak (Tazer, Combat Pistol, Carbine Rifle).',
      color: 'emerald'
    },
    {
      id: 'phase_4',
      stepNumber: 4,
      title: 'Tahap IV: Orientasi Lapangan Cadet (Field Training)',
      tag: 'Akademi Magang',
      description: 'Kandidat yang lulus dilantik sebagai CADET [CDT] dan bertugas patroli langsung di lapangan di bawah bimbingan dan evaluasi ketat dari Field Training Officer (FTO) sebelum promosi menjadi Police Officer I.',
      color: 'purple'
    }
  ],

  divisionsHeaderTitle: 'STRUKTUR DIVISI & JENJANG KARIR KEPOLISIAN',
  divisionsHeaderTag: '5 DIVISI UTAMA',
  divisions: [
    {
      id: 'div_patrol',
      name: 'Patrol Division (PD)',
      tag: 'CORE UNIT',
      description: 'Tulang punggung kepolisian untuk patroli perkotaan 24 jam, respon panggilan darurat 911, dan pengamanan pertama di TKP.',
      color: 'blue'
    },
    {
      id: 'div_traffic',
      name: 'Traffic Enforcement (TEU)',
      tag: 'LALU LINTAS',
      description: 'Unit pengawasan lalu lintas, operasi razia kelayakan berkendara, penindakan balap liar, dan pengawalan V.I.P.',
      color: 'amber'
    },
    {
      id: 'div_detective',
      name: 'Detective / CID',
      tag: 'INVESTIGASI',
      description: 'Penyelidikan kasus kejahatan besar, sindikat narkotika, perdagangan senjata ilegal, serta operasi penyamaran rahasia (undercover).',
      color: 'emerald'
    },
    {
      id: 'div_swat',
      name: 'S.W.A.T Tactical Unit',
      tag: 'ELITE FORCE',
      description: 'Unit taktis penanganan krisis berbahaya tingkat tinggi, pembebasan sandera, penjinakan bahan peledak, dan raid properti bersenjata berat.',
      color: 'rose'
    }
  ],
  rankHierarchy: [
    'CADET',
    'PO I',
    'PO II',
    'PO III',
    'SLO',
    'SERGEANT',
    'LIEUTENANT',
    'CAPTAIN',
    'COMMANDER',
    'DEPUTY CHIEF',
    'CHIEF OF POLICE'
  ],

  discordHotlineText: 'Discord Resmi HSPD',
  discordHotlineUrl: 'https://discord.gg',
  copyrightText: 'State of HighState Police Academy © 2026',

  updatedAt: 1700000000000,
  updatedBy: 'Komando Markas Besar'
};

/**
 * Retrieve current active recruitment portal configuration from storage.
 */
export function getRecruitmentPortalConfig(): RecruitmentPortalConfig {
  try {
    const raw = localStorage.getItem(RECRUITMENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_RECRUITMENT_PORTAL_CONFIG,
          ...parsed,
          coreValues: Array.isArray(parsed.coreValues) ? parsed.coreValues : DEFAULT_RECRUITMENT_PORTAL_CONFIG.coreValues,
          quickStats: Array.isArray(parsed.quickStats) ? parsed.quickStats : DEFAULT_RECRUITMENT_PORTAL_CONFIG.quickStats,
          icRequirements: Array.isArray(parsed.icRequirements) ? parsed.icRequirements : DEFAULT_RECRUITMENT_PORTAL_CONFIG.icRequirements,
          oocRequirements: Array.isArray(parsed.oocRequirements) ? parsed.oocRequirements : DEFAULT_RECRUITMENT_PORTAL_CONFIG.oocRequirements,
          phases: Array.isArray(parsed.phases) ? parsed.phases : DEFAULT_RECRUITMENT_PORTAL_CONFIG.phases,
          divisions: Array.isArray(parsed.divisions) ? parsed.divisions : DEFAULT_RECRUITMENT_PORTAL_CONFIG.divisions,
          rankHierarchy: Array.isArray(parsed.rankHierarchy) ? parsed.rankHierarchy : DEFAULT_RECRUITMENT_PORTAL_CONFIG.rankHierarchy
        };
      }
    }
  } catch (e) {
    console.error('Failed to parse recruitment portal config from storage:', e);
  }
  return { ...DEFAULT_RECRUITMENT_PORTAL_CONFIG };
}

/**
 * Save customized recruitment portal configuration to storage & broadcast update event.
 */
export function saveRecruitmentPortalConfig(
  config: Partial<RecruitmentPortalConfig>,
  updatedBy?: string
): RecruitmentPortalConfig {
  const current = getRecruitmentPortalConfig();
  const updated: RecruitmentPortalConfig = {
    ...current,
    ...config,
    id: 'active_recruitment_portal',
    updatedAt: Date.now(),
    updatedBy: updatedBy || current.updatedBy || 'Atasan Komando Kepolisian'
  };

  try {
    localStorage.setItem(RECRUITMENT_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(RECRUITMENT_UPDATED_EVENT, { detail: updated }));
    }
    pushToFirestore('SYSTEM_CONFIGS', updated, 'recruitment_portal').catch(console.error);
  } catch (e) {
    console.error('Failed to save recruitment portal config:', e);
  }

  return updated;
}

/**
 * Reset recruitment portal to default official settings.
 */
export function resetRecruitmentPortalConfig(): RecruitmentPortalConfig {
  try {
    localStorage.setItem(RECRUITMENT_STORAGE_KEY, JSON.stringify(DEFAULT_RECRUITMENT_PORTAL_CONFIG));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(RECRUITMENT_UPDATED_EVENT, { detail: DEFAULT_RECRUITMENT_PORTAL_CONFIG }));
    }
    pushToFirestore('SYSTEM_CONFIGS', DEFAULT_RECRUITMENT_PORTAL_CONFIG, 'recruitment_portal').catch(console.error);
  } catch (e) {
    console.error('Failed to reset recruitment portal config:', e);
  }
  return { ...DEFAULT_RECRUITMENT_PORTAL_CONFIG };
}

/**
 * Subscribe to recruitment portal configuration updates.
 */
export function subscribeToRecruitmentPortal(
  callback: (config: RecruitmentPortalConfig) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = (e: any) => {
    if (e && e.detail) {
      callback(e.detail);
    } else {
      callback(getRecruitmentPortalConfig());
    }
  };

  window.addEventListener(RECRUITMENT_UPDATED_EVENT, handleUpdate);
  window.addEventListener('storage', (e) => {
    if (e.key === RECRUITMENT_STORAGE_KEY) {
      callback(getRecruitmentPortalConfig());
    }
  });

  return () => {
    window.removeEventListener(RECRUITMENT_UPDATED_EVENT, handleUpdate);
  };
}
