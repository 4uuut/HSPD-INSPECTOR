import { pushToFirestore } from '../services/firebaseRealtimeSync';
import { DEVELOPER_MASTER_PASSCODES } from './activityMonitoringStorage';

export const COMING_SOON_STORAGE_KEY = 'hspd_coming_soon_config_v1';
export const DEVELOPER_BYPASS_STORAGE_KEY = 'hspd_developer_bypass_active_v1';

export const SAWERIA_DONATION_URL = 'https://saweria.co/LinuxStore';

export interface ComingSoonConfig {
  isEnabled: boolean; // True = seluruh website terkunci Coming Soon kecuali mode pengembang
  title: string;
  headline: string;
  subheadline: string;
  description: string;
  donationUrl: string;
  donationButtonText: string;
  estimatedLaunchDate: string;
  contactDiscord: string;
  featuresPreview: {
    iconName: string;
    title: string;
    description: string;
    badge: string;
  }[];
  _updatedAt?: number;
  _updatedBy?: string;
}

export const DEFAULT_COMING_SOON_CONFIG: ComingSoonConfig = {
  isEnabled: true, // Default ON sesuai permintaan: website coming soon & fitur terkunci
  title: 'HIGH STATE POLICE DEPARTMENT • CAD/MDT SYSTEM',
  headline: 'WEBSITE SEDANG DALAM PENGEMBANGAN',
  subheadline: 'COMING SOON • TAHAP FINALISASI & INTEGRASI SISTEM',
  description: 'Portal MDC-CAD Kepolisian High State dan Sistem Layanan Kenegaraan sedang dipersiapkan untuk peluncuran resmi. Seluruh fitur publik dan terminal login dinas dinonaktifkan sementara demi stabilitas sistem dan audit keamanan data.',
  donationUrl: SAWERIA_DONATION_URL,
  donationButtonText: '☕ Donasi Pengembang Website (Saweria): saweria.co/LinuxStore',
  estimatedLaunchDate: 'Oktober 2026 • Grand Launching',
  contactDiscord: 'https://discord.gg/highstate',
  featuresPreview: [
    {
      iconName: 'Shield',
      title: 'MDC & Terminal Penindakan',
      description: 'Perhitungan pasal KUHP, BAP digital otomatis, integrasi denda pidana, dan siaran Discord webhook real-time.',
      badge: 'TERSEDIA SAAT RILIS'
    },
    {
      iconName: 'DollarSign',
      title: 'Kalkulator 6 Bonus Operasional',
      description: 'Insentif prestasi kasus penindakan, efiden brankas, tiket tilang, impound kendaraan, restok senjata & peleburan smelter.',
      badge: 'FITUR TERBARU v4.2.6'
    },
    {
      iconName: 'Globe',
      title: 'Portal Layanan Publik Warga',
      description: 'Pengajuan SKCK online, permohonan izin senjata api (WCL), dan verifikasi izin usaha komersial terakreditasi.',
      badge: 'LAYANAN WARGA'
    },
    {
      iconName: 'Lock',
      title: 'Audit Brankas Baja & Gudang Senjata',
      description: 'Stock opname mingguan sitaan narkotika, senjata api, amunisi, dan segregasi barang bukti aman.',
      badge: 'SECURITY CLEARANCE'
    },
    {
      iconName: 'Car',
      title: 'Sistem BOLO & Sitaan Impound Lot',
      description: 'Peringatan siaga darurat DPO buronan, registrasi pelanggaran lalu lintas, dan manajemen biaya derek kota.',
      badge: 'TRAFFIC PATROL'
    },
    {
      iconName: 'Users',
      title: 'Roster & Manajemen Personel Terpadu',
      description: 'Absensi mingguan otomatis, kontrol on/off duty dinas, PIN reset mandiri, dan catatan SP/kenaikan pangkat.',
      badge: 'HIGH COMMAND'
    }
  ]
};

// Valid Passcodes for Developer Bypass
export const DEVELOPER_VALID_PASSCODES = [
  'LinuxStore',
  'linuxstore',
  'LINUXSTORE',
  'DEV-HSPD-2026',
  'DEV-MASTER-ROOT',
  'root',
  'admin9999',
  'HSPD-DEV-99',
  '10-4'
];

export function getComingSoonConfig(): ComingSoonConfig {
  try {
    const raw = localStorage.getItem(COMING_SOON_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_COMING_SOON_CONFIG, ...parsed };
    }
  } catch {}
  return DEFAULT_COMING_SOON_CONFIG;
}

export function saveComingSoonConfig(config: ComingSoonConfig): void {
  try {
    localStorage.setItem(COMING_SOON_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('hspd-coming-soon-updated', { detail: config }));
    pushToFirestore('SYSTEM_CONFIGS', { id: 'COMING_SOON_CONFIG', ...config }, 'COMING_SOON_CONFIG').catch(() => {});
  } catch (e) {
    console.error('Failed to save coming soon config:', e);
  }
}

export function isDeveloperBypassActive(): boolean {
  try {
    return localStorage.getItem(DEVELOPER_BYPASS_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setDeveloperBypass(active: boolean): void {
  try {
    if (active) {
      localStorage.setItem(DEVELOPER_BYPASS_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(DEVELOPER_BYPASS_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent('hspd-developer-bypass-updated', { detail: active }));
  } catch (e) {
    console.error('Failed to update developer bypass:', e);
  }
}

export function exitDeveloperSession(forceLock: boolean = false): void {
  try {
    localStorage.removeItem(DEVELOPER_BYPASS_STORAGE_KEY);
    localStorage.removeItem('hspd_active_officer_v1');
    if (forceLock) {
      const current = getComingSoonConfig();
      const lockedConfig: ComingSoonConfig = { ...current, isEnabled: true };
      localStorage.setItem(COMING_SOON_STORAGE_KEY, JSON.stringify(lockedConfig));
      window.dispatchEvent(new CustomEvent('hspd-coming-soon-updated', { detail: lockedConfig }));
      pushToFirestore('SYSTEM_CONFIGS', { id: 'COMING_SOON_CONFIG', ...lockedConfig }, 'COMING_SOON_CONFIG').catch(() => {});
    }
    window.dispatchEvent(new CustomEvent('hspd-developer-bypass-updated', { detail: false }));
  } catch (e) {
    console.error('Failed to exit developer session:', e);
  }
}

export function resetDeveloperModeAndLock(): void {
  exitDeveloperSession(true);
}


export function verifyDeveloperPasscode(input: string): boolean {
  if (!input) return false;
  const clean = input.trim().toLowerCase();
  
  // Check against DEVELOPER_VALID_PASSCODES and DEVELOPER_MASTER_PASSCODES
  const isMatch = DEVELOPER_VALID_PASSCODES.some(code => code.toLowerCase() === clean) ||
    DEVELOPER_MASTER_PASSCODES.some(code => code.toLowerCase() === clean) ||
    clean === 'linuxstore';

  if (isMatch) {
    setDeveloperBypass(true);
    return true;
  }
  return false;
}

