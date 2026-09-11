import { pushToFirestore } from '../services/firebaseRealtimeSync';

export type SecurityLevel = 1 | 2 | 3 | 4;

export interface StateSecurityStatus {
  level: SecurityLevel;
  levelTitle: string; // 'LEVEL 1: KONDISI NORMAL' | 'LEVEL 2: WASPADA' | 'LEVEL 3: SIAGA & JAM MALAM' | 'LEVEL 4: DARURAT MILITER'
  curfewActive: boolean;
  curfewHours: string; // e.g. '22:00 - 05:00 WIB'
  curfewZones: string; // e.g. 'Seluruh Kota Los Santos & Jalur Tol Utama'
  notes: string;
  updatedBy: string;
  updatedByRank: string;
  updatedAt: number;
}

export type PermitCategory = 
  | 'WEAPON'       // Izin Senjata Api Sipil (WCL)
  | 'BUSINESS'     // Izin Usaha / Komersial
  | 'EVENT'        // Izin Keramaian & Konvoi
  | 'PARDON'       // Grasi & Amnesti Narapidana
  | 'SECURITY'     // Izin Pengawalan VIP & Badan Keamanan Swasta
  | 'APPOINTMENT'; // Surat Keputusan Pengangkatan Pejabat

export type PermitStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';

export interface GovernmentPermit {
  id: string;
  permitNumber: string; // e.g. PERMIT/GOV-WCL/2026/042
  category: PermitCategory;
  title: string;
  applicantName: string;
  applicantId: string; // KTP / CID
  applicantPhone?: string;
  businessOrDetails: string; // Nama usaha atau seri senjata atau no perkara
  purpose: string;
  validUntil: string;
  feeAmount: number;
  status: PermitStatus;
  approvedBy?: string;
  approvedByRank?: string;
  approvedAt?: number;
  notes?: string;
  createdAt: number;
}

export type TreasuryType = 'INCOME' | 'EXPENSE';
export type TreasuryCategory = 
  | 'TAX'             // Pajak Usaha & Properti
  | 'WEAPON_FEE'      // Retribusi Izin Senjata Api
  | 'FINE'            // Denda Hukum & Tilang
  | 'POLICE_SUBSIDY'  // Subsidi Operasional Kepolisian HSPD
  | 'EMS_SUBSIDY'     // Subsidi Medis & Rumah Sakit
  | 'INFRASTRUCTURE'  // Pembangunan & Perawatan Kota
  | 'SALARY'          // Gaji Aparatur Sipil & Pejabat
  | 'OTHER';

export interface TreasuryTransaction {
  id: string;
  receiptNumber: string;
  type: TreasuryType;
  category: TreasuryCategory;
  title: string;
  amount: number;
  partyName: string; // Lembaga atau Warga pembayar/penerima
  notes?: string;
  recordedBy: string;
  recordedByRank?: string;
  timestamp: number;
}

export interface GovernmentAnnouncement {
  id: string;
  decreeNumber: string;
  title: string;
  level: SecurityLevel;
  targetScope: string;
  summary: string;
  clauses: string[];
  penalties: string;
  issuedBy: string;
  issuedByRank: string;
  publishedAt: number;
  discordSent?: boolean;
}

// STORAGE KEYS
const GOV_SECURITY_KEY = 'hspd_gov_security_status_v1';
const GOV_PERMITS_KEY = 'hspd_gov_permits_v1';
const GOV_TREASURY_KEY = 'hspd_gov_treasury_v1';
const GOV_ANNOUNCEMENTS_KEY = 'hspd_gov_announcements_v1';

// DEFAULT SEED DATA
export const DEFAULT_SECURITY_STATUS: StateSecurityStatus = {
  level: 1,
  levelTitle: 'LEVEL 1: KONDISI TERTIB & NORMAL',
  curfewActive: false,
  curfewHours: 'Tidak Ada Jam Malam',
  curfewZones: 'Seluruh Wilayah Hukum Negara HighState',
  notes: 'Aktivitas masyarakat sipil, perdagangan, dan lalu lintas berjalan normal 24 jam dengan pemantauan rutin patroli kepolisian.',
  updatedBy: 'Momo Hatakeyama',
  updatedByRank: 'PRESIDENT [RANK 6]',
  updatedAt: Date.now() - 3600000 * 24
};

export const DEFAULT_PERMITS: GovernmentPermit[] = [
  {
    id: 'pmt-001',
    permitNumber: `WCL/GOV-EXEC/${new Date().getFullYear()}/012`,
    category: 'WEAPON',
    title: 'Izin Kepemilikan & Hak Membawa Senjata Api Sipil (WCL)',
    applicantName: 'Michael De Santa',
    applicantId: 'CID-78921445',
    applicantPhone: '555-0143',
    businessOrDetails: 'Combat Pistol 9mm (Seri: WEP-9MM-449102)',
    purpose: 'Perlindungan diri sah (Self Defense) di kawasan tempat tinggal & kantor bisnis.',
    validUntil: '1 Tahun (Hingga 2027)',
    feeAmount: 25000,
    status: 'APPROVED',
    approvedBy: 'Momo Hatakeyama',
    approvedByRank: 'PRESIDENT [RANK 6]',
    approvedAt: Date.now() - 3600000 * 48,
    notes: 'Telah lulus verifikasi SKCK Bersih dari HSPD dan uji tembak resmi.',
    createdAt: Date.now() - 3600000 * 72
  },
  {
    id: 'pmt-002',
    permitNumber: `BIZ/GOV-EXEC/${new Date().getFullYear()}/045`,
    category: 'BUSINESS',
    title: 'Izin Operasional Komersial Usaha Bahama Mamas Bar & Lounge',
    applicantName: 'Tony Prince',
    applicantId: 'CID-33829101',
    applicantPhone: '555-8821',
    businessOrDetails: 'Bahama Mamas Club & Entertainment (Del Perro)',
    purpose: 'Operasional hiburan musik, penyajian minuman berlisensi, dan event indoor.',
    validUntil: '6 Bulan (Evaluasi Berkala)',
    feeAmount: 50000,
    status: 'APPROVED',
    approvedBy: 'Momo Hatakeyama',
    approvedByRank: 'PRESIDENT [RANK 6]',
    approvedAt: Date.now() - 3600000 * 24,
    notes: 'Wajib menyediakan minimal 2 petugas security berlisensi di pintu masuk.',
    createdAt: Date.now() - 3600000 * 36
  },
  {
    id: 'pmt-003',
    permitNumber: `EVT/GOV-EXEC/${new Date().getFullYear()}/008`,
    category: 'EVENT',
    title: 'Izin Keramaian Festival & Pameran Otomotif LS Customs',
    applicantName: 'Franklin Clinton',
    applicantId: 'CID-55219902',
    applicantPhone: '555-0199',
    businessOrDetails: 'Area Parkir Pantai Vespucci Beach',
    purpose: 'Pameran mobil klasik, konser amal, dan bazaar UMKM.',
    validUntil: '3 Hari (Akhir Pekan)',
    feeAmount: 15000,
    status: 'PENDING',
    notes: 'Menunggu koordinasi pengamanan lalu lintas dari divisi TEU / Patrol HSPD.',
    createdAt: Date.now() - 3600000 * 6
  }
];

export const DEFAULT_TREASURY: TreasuryTransaction[] = [
  {
    id: 'tx-001',
    receiptNumber: `TRX/TAX/${new Date().getFullYear()}/001`,
    type: 'INCOME',
    category: 'TAX',
    title: 'Penerimaan Pajak Usaha Komersial & Properti Tahunan',
    amount: 350000,
    partyName: 'Asosiasi Pengusaha Kota HighState',
    notes: 'Penyetoran pajak terpadu kuartal pertama tahun anggaran berjalan.',
    recordedBy: 'Momo Hatakeyama',
    recordedByRank: 'PRESIDENT [RANK 6]',
    timestamp: Date.now() - 3600000 * 96
  },
  {
    id: 'tx-002',
    receiptNumber: `TRX/SUB/${new Date().getFullYear()}/002`,
    type: 'EXPENSE',
    category: 'POLICE_SUBSIDY',
    title: 'Penyaluran Subsidi Operasional & Armada Patroli HSPD',
    amount: 150000,
    partyName: 'HighState Police Department (HSPD)',
    notes: 'Pengadaan amunisi taktis, perawatan kendaraan armada patroli, dan logistik lapangan.',
    recordedBy: 'Momo Hatakeyama',
    recordedByRank: 'PRESIDENT [RANK 6]',
    timestamp: Date.now() - 3600000 * 48
  },
  {
    id: 'tx-003',
    receiptNumber: `TRX/LIC/${new Date().getFullYear()}/003`,
    type: 'INCOME',
    category: 'WEAPON_FEE',
    title: 'Retribusi Penerbitan Lisensi Izin Senjata Api Sipil (WCL)',
    amount: 25000,
    partyName: 'Michael De Santa',
    notes: 'Biaya sertifikasi dan administrasi izin senjata api kategori perlindungan diri.',
    recordedBy: 'Momo Hatakeyama',
    recordedByRank: 'PRESIDENT [RANK 6]',
    timestamp: Date.now() - 3600000 * 24
  }
];

export const DEFAULT_ANNOUNCEMENTS: GovernmentAnnouncement[] = [
  {
    id: 'anc-001',
    decreeNumber: `DEKRIT/PRESIDEN/${new Date().getFullYear()}/001`,
    title: 'Maklumat Kenegaraan: Sinergi Ketertiban Umum & Penegakan Regulasi Izin Usaha',
    level: 1,
    targetScope: 'Seluruh Wilayah Hukum Negara HighState',
    summary: 'Instruksi resmi Presiden Negara HighState mengenai pemutihan izin usaha, kepatuhan pembayaran retribusi, dan kewajiban pelaporan izin senjata legal.',
    clauses: [
      'Seluruh pelaku usaha diwajibkan memperbarui Surat Izin Komersial melalui Kantor Pemerintahan sebelum batas waktu kuartal.',
      'Warga sipil pemegang senjata api wajib menunjukkan lisensi WCL resmi saat pemeriksaan di tempat oleh aparat kepolisian HSPD.',
      'Pemerintah menjamin perlindungan hukum dan fasilitas umum bagi seluruh warga yang mematuhi hukum dan peraturan perundang-undangan.'
    ],
    penalties: 'Pelanggaran izin usaha dikenakan denda administratif $10.000 hingga penyegelan sementara tempat usaha.',
    issuedBy: 'Momo Hatakeyama',
    issuedByRank: 'PRESIDENT [RANK 6]',
    publishedAt: Date.now() - 3600000 * 12,
    discordSent: true
  }
];

// --- GETTERS & SETTERS ---

// 1. Security Status
export function getStateSecurityStatus(): StateSecurityStatus {
  try {
    const raw = localStorage.getItem(GOV_SECURITY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.level) return parsed;
    }
  } catch {}
  return DEFAULT_SECURITY_STATUS;
}

export function saveStateSecurityStatus(status: StateSecurityStatus): void {
  try {
    localStorage.setItem(GOV_SECURITY_KEY, JSON.stringify(status));
    window.dispatchEvent(new CustomEvent('gov-security-status-updated', { detail: status }));
    pushToFirestore('GOV_SECURITY', { id: 'current', ...status }, 'current').catch(() => {});
  } catch {}
}

// 2. Permits
export function getGovernmentPermits(): GovernmentPermit[] {
  try {
    const raw = localStorage.getItem(GOV_PERMITS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_PERMITS;
}

export function saveGovernmentPermits(permits: GovernmentPermit[]): void {
  try {
    localStorage.setItem(GOV_PERMITS_KEY, JSON.stringify(permits));
    window.dispatchEvent(new CustomEvent('gov-permits-updated', { detail: permits }));
    pushToFirestore('GOV_PERMITS', { id: 'all_permits', items: permits, updatedAt: Date.now() }, 'all_permits').catch(() => {});
  } catch {}
}

export function addGovernmentPermit(permit: Omit<GovernmentPermit, 'id' | 'createdAt'>): GovernmentPermit {
  const all = getGovernmentPermits();
  const newPermit: GovernmentPermit = {
    ...permit,
    id: `pmt-${Date.now()}`,
    createdAt: Date.now()
  };
  const updated = [newPermit, ...all];
  saveGovernmentPermits(updated);
  return newPermit;
}

export function updateGovernmentPermit(id: string, updates: Partial<GovernmentPermit>): GovernmentPermit[] {
  const all = getGovernmentPermits();
  const updated = all.map(p => p.id === id ? { ...p, ...updates } : p);
  saveGovernmentPermits(updated);
  return updated;
}

export function deleteGovernmentPermit(id: string): GovernmentPermit[] {
  const all = getGovernmentPermits();
  const updated = all.filter(p => p.id !== id);
  saveGovernmentPermits(updated);
  return updated;
}

// 3. Treasury
export function getTreasuryTransactions(): TreasuryTransaction[] {
  try {
    const raw = localStorage.getItem(GOV_TREASURY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_TREASURY;
}

export function saveTreasuryTransactions(transactions: TreasuryTransaction[]): void {
  try {
    localStorage.setItem(GOV_TREASURY_KEY, JSON.stringify(transactions));
    window.dispatchEvent(new CustomEvent('gov-treasury-updated', { detail: transactions }));
    pushToFirestore('GOV_TREASURY', { id: 'all_treasury', items: transactions, updatedAt: Date.now() }, 'all_treasury').catch(() => {});
  } catch {}
}

export function addTreasuryTransaction(tx: Omit<TreasuryTransaction, 'id' | 'timestamp'>): TreasuryTransaction {
  const all = getTreasuryTransactions();
  const newTx: TreasuryTransaction = {
    ...tx,
    id: `tx-${Date.now()}`,
    timestamp: Date.now()
  };
  const updated = [newTx, ...all];
  saveTreasuryTransactions(updated);
  return newTx;
}

export function deleteTreasuryTransaction(id: string): TreasuryTransaction[] {
  const all = getTreasuryTransactions();
  const updated = all.filter(t => t.id !== id);
  saveTreasuryTransactions(updated);
  return updated;
}

// 4. Announcements
export function getGovernmentAnnouncements(): GovernmentAnnouncement[] {
  try {
    const raw = localStorage.getItem(GOV_ANNOUNCEMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_ANNOUNCEMENTS;
}

export function saveGovernmentAnnouncements(announcements: GovernmentAnnouncement[]): void {
  try {
    localStorage.setItem(GOV_ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
    window.dispatchEvent(new CustomEvent('gov-announcements-updated', { detail: announcements }));
    pushToFirestore('GOV_ANNOUNCEMENTS', { id: 'all_announcements', items: announcements, updatedAt: Date.now() }, 'all_announcements').catch(() => {});
  } catch {}
}

export function addGovernmentAnnouncement(item: Omit<GovernmentAnnouncement, 'id' | 'publishedAt'>): GovernmentAnnouncement {
  const all = getGovernmentAnnouncements();
  const newItem: GovernmentAnnouncement = {
    ...item,
    id: `anc-${Date.now()}`,
    publishedAt: Date.now()
  };
  const updated = [newItem, ...all];
  saveGovernmentAnnouncements(updated);
  return newItem;
}

export function deleteGovernmentAnnouncement(id: string): GovernmentAnnouncement[] {
  const all = getGovernmentAnnouncements();
  const updated = all.filter(a => a.id !== id);
  saveGovernmentAnnouncements(updated);
  return updated;
}
