export interface PasalItem {
  cat: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  code: string;
  desc: string;
  fine: number;
  time: number; // in months/minutes
  imp: number;  // in days
}

export interface CategoryInfo {
  key: 'ALL' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  title: string;
  badgeColor: string;
  desc?: string;
}

export interface ArrestRecord {
  id: string;
  suspectName: string;
  suspectId: string;
  officerName: string;
  officerBadge: string;
  partnerOfficer?: string;
  location?: string;
  evidenceUrl?: string;       // Primary / First evidence image
  evidenceUrls?: string[];    // Up to 10 evidence photos
  confiscatedItems?: string;
  chronology?: string;
  pasalCodes: string[];
  totalFine: number;
  totalJail: number;
  totalImpound: number;
  isCooperative: boolean;
  notes: string;
  timestamp: number;
}

export interface RoleplayPreset {
  id: string;
  category: 'Miranda' | 'Borgol & Tangkap' | 'Pemeriksaan / Frisk' | 'Tilang & Invoice' | 'Impound' | 'Senjata & Tazer';
  title: string;
  commands: {
    type: 'me' | 'do' | 'say' | 'b' | 'cmd';
    text: string;
  }[];
}

export type OfficerRankLevel = 
  | 'CHIEF OF POLICE [COP]'
  | 'ASSISTANT CHIEF [A/C]'
  | 'DEPUTY CHIEF [D/C]'
  | 'COMMANDER [CDR]'
  | 'CAPTAIN [CPT]'
  | 'CAPTAIN [CPT ]'
  | 'LIEUTENANT II [LT II]'
  | 'LIEUTENANT I [LT I]'
  | 'LIEUTENANT [LT]'
  | 'SERGEANT II [SGT II]'
  | 'SERGEANT I [SGT I]'
  | 'SERGEANT [SGT]'
  | 'SENIOR LEAD OFFICER [SLO]'
  | 'POLICE OFFICER III [PO III]'
  | 'POLICE OFFICER II [PO II]'
  | 'POLICE OFFICER I [PO I]'
  | 'CADET POLICE'
  | 'CADET [CDT]'
  // Backward compatibility alias:
  | 'Chief of Police'
  | 'Assistant Chief'
  | 'Deputy Chief'
  | 'Commander'
  | 'Captain'
  | 'Lieutenant'
  | 'Sergeant'
  | 'Senior Lead Officer'
  | 'Police Officer III'
  | 'Police Officer II'
  | 'Police Officer I'
  | 'Cadet';

export interface OfficerWarning {
  id: string;
  strikeNumber: number; // 1, 2, or 3
  reason: string;
  issuedBy: string;
  issuedByBadge?: string;
  issuedByRank?: string;
  timestamp: number;
}

export interface DischargeRecord {
  officerId: string;
  officerName: string;
  officerBadge: string;
  officerRank: string;
  officerDivision: string;
  reason: string;
  dischargedBy: string;
  dischargedByBadge?: string;
  dischargedByRank?: string;
  warningCountBeforeDischarge: number;
  timestamp: number;
}

export interface PromotionRecord {
  officerId: string;
  officerName: string;
  officerBadge: string;
  oldRank: string;
  newRank: string;
  division: string;
  reason?: string;
  promotedBy: string;
  promotedByBadge?: string;
  promotedByRank?: string;
  timestamp: number;
}

export interface OfficerAccount {
  id: string;
  name: string;
  badge: string;
  rank: OfficerRankLevel;
  division: string;
  pin: string; // Personal login PIN
  phone?: string;
  registeredAt: number;
  promotedBy?: string;
  lastLogin?: number;
  warnings?: OfficerWarning[];
  isDuty?: boolean;
  dutyStartTime?: number;
  dutyStatus?: DutyStatusCode;
  _updatedAt?: number;
}

export interface OfficerProfile {
  name: string;
  badge: string;
  rank: OfficerRankLevel;
  division: string;
  loginTime: number;
  isDuty?: boolean;
  dutyStartTime?: number;
  dutyStatus?: DutyStatusCode;
}

// Duty Status and Report Interface (8-1-1 On Duty / 8-1-0 Off Duty)
export type DutyStatusCode = '8-1-1' | '8-1-0' | '10-8' | '10-7' | '10-6' | '10-97';

export interface DutyLog {
  id: string;
  officerName: string;
  officerBadge: string;
  officerRank: string;
  division: string;
  status: DutyStatusCode;
  statusText: string;
  callsign?: string;
  partner?: string;
  vehicle?: string;
  sector?: string;
  notes?: string;
  timestamp: number;
  dutyStartTime?: number;
  dutyEndTime?: number;
  durationMinutes?: number;
  durationFormatted?: string;
  // Evidence photos
  onDutyPhoneImage?: string; // 1 foto HP sebelum on duty
  offDutyActivityImage1?: string; // Foto kegiatan 1 saat off duty
  offDutyActivityImage2?: string; // Foto kegiatan 2 saat off duty
  offDutyPhoneImage?: string; // 1 foto HP saat off duty
  evidenceImages?: string[]; // Array of attached evidence images
}

export const ALL_RANKS: OfficerRankLevel[] = [
  'CHIEF OF POLICE [COP]',
  'ASSISTANT CHIEF [A/C]',
  'DEPUTY CHIEF [D/C]',
  'COMMANDER [CDR]',
  'CAPTAIN [CPT]',
  'LIEUTENANT II [LT II]',
  'LIEUTENANT I [LT I]',
  'LIEUTENANT [LT]',
  'SERGEANT II [SGT II]',
  'SERGEANT I [SGT I]',
  'SERGEANT [SGT]',
  'SENIOR LEAD OFFICER [SLO]',
  'POLICE OFFICER III [PO III]',
  'POLICE OFFICER II [PO II]',
  'POLICE OFFICER I [PO I]',
  'CADET POLICE',
  'CADET [CDT]'
];

// Akses Penuh (Full High Command Management) ONLY for these 4 ranks:
// 1. CHIEF OF POLICE [COP]
// 2. ASSISTANT CHIEF [A/C]
// 3. DEPUTY CHIEF [D/C]
// 4. COMMANDER [CDR]
export const HIGH_COMMAND_RANKS: string[] = [
  'CHIEF OF POLICE [COP]',
  'Chief of Police',
  'ASSISTANT CHIEF [A/C]',
  'Assistant Chief',
  'DEPUTY CHIEF [D/C]',
  'Deputy Chief',
  'COMMANDER [CDR]',
  'Commander'
];

export const HIGH_RANKS: OfficerRankLevel[] = [
  'CHIEF OF POLICE [COP]',
  'ASSISTANT CHIEF [A/C]',
  'DEPUTY CHIEF [D/C]',
  'COMMANDER [CDR]'
];

export const PATROL_RANKS: OfficerRankLevel[] = [
  'CAPTAIN [CPT]',
  'LIEUTENANT II [LT II]',
  'LIEUTENANT I [LT I]',
  'LIEUTENANT [LT]',
  'SERGEANT II [SGT II]',
  'SERGEANT I [SGT I]',
  'SERGEANT [SGT]',
  'SENIOR LEAD OFFICER [SLO]',
  'POLICE OFFICER III [PO III]',
  'POLICE OFFICER II [PO II]',
  'POLICE OFFICER I [PO I]',
  'CADET POLICE',
  'CADET [CDT]'
];

export const isOfficerHighRank = (rank?: string): boolean => {
  if (!rank) return false;
  const r = rank.toUpperCase().trim();
  return (
    r.includes('CHIEF OF POLICE') ||
    r.includes('[COP]') ||
    r.includes('ASSISTANT CHIEF') ||
    r.includes('[A/C]') ||
    r.includes('DEPUTY CHIEF') ||
    r.includes('[D/C]') ||
    r.includes('COMMANDER') ||
    r.includes('[CDR]')
  );
};

// Aliases
export const isHighCommand = isOfficerHighRank;

/**
 * Check if officer is Supervisor / Command Staff (Captain or Lieutenant or above)
 * Authorized to generate OTP, approve destruction, manage confidential documents, and access vault.
 */
export const isSupervisorOrAbove = (rank?: string): boolean => {
  if (!rank) return false;
  const r = rank.toUpperCase().trim();
  return (
    isOfficerHighRank(rank) ||
    r.includes('COMMANDER') ||
    r.includes('[CDR]') ||
    r.includes('CAPTAIN') ||
    r.includes('[CPT]') ||
    r.includes('LIEUTENANT') ||
    r.includes('[LT]') ||
    r.includes('SERGEANT') ||
    r.includes('[SGT]') ||
    r.includes('SENIOR LEAD') ||
    r.includes('[SLO]')
  );
};

export const isCommandStaff = isSupervisorOrAbove;

/**
 * Rank Clearance Hierarchy Tier:
 * Tier 1: High Command (Chief of Police, Assistant Chief, Deputy Chief, Commander)
 * Tier 2: Command & Supervisory Staff (Captain, Lieutenant)
 * Tier 3: Field Supervisor (Sergeant, Senior Lead Officer)
 * Tier 4: Patrol Officers (Police Officer III, II, I)
 * Tier 5: Recruit / Cadet (Cadet)
 */
export const getRankHierarchyTier = (rank?: string): { tier: number; label: string; badgeColor: string } => {
  if (!rank) return { tier: 5, label: 'CADET / RECRUIT', badgeColor: 'text-gray-400 bg-gray-900/60 border-gray-700' };
  const r = rank.toUpperCase().trim();
  if (
    r.includes('CHIEF OF POLICE') || r.includes('[COP]') ||
    r.includes('ASSISTANT CHIEF') || r.includes('[A/C]') ||
    r.includes('DEPUTY CHIEF') || r.includes('[D/C]') ||
    r.includes('COMMANDER') || r.includes('[CDR]')
  ) {
    return { tier: 1, label: 'HIGH COMMAND [TIER 1]', badgeColor: 'text-amber-300 bg-amber-950/80 border-amber-500' };
  }
  if (r.includes('CAPTAIN') || r.includes('[CPT]') || r.includes('LIEUTENANT') || r.includes('[LT]')) {
    return { tier: 2, label: 'COMMAND STAFF / SUPERVISOR [TIER 2]', badgeColor: 'text-blue-300 bg-blue-950/80 border-blue-500' };
  }
  if (r.includes('SERGEANT') || r.includes('[SGT]') || r.includes('SENIOR LEAD') || r.includes('[SLO]')) {
    return { tier: 3, label: 'FIELD SUPERVISOR [TIER 3]', badgeColor: 'text-purple-300 bg-purple-950/80 border-purple-500' };
  }
  if (r.includes('POLICE OFFICER') || r.includes('[PO')) {
    return { tier: 4, label: 'PATROL OFFICER [TIER 4]', badgeColor: 'text-emerald-300 bg-emerald-950/80 border-emerald-500' };
  }
  return { tier: 5, label: 'CADET / RECRUIT [TIER 5]', badgeColor: 'text-gray-400 bg-gray-900/60 border-gray-700' };
};

// ==========================================
// 🔐 ONE-TIME PASSCODE (OTP) & CLEARANCE TYPES
// ==========================================
export type ModuleAccessKey = 
  | 'VAULT'             // Brankas & Audit Inventaris
  | 'DESTRUCTION'       // Peleburan & Pemusnahan Sitaan
  | 'OFFICIAL_DOCS'     // Dokumen Resmi & Surat Rahasia / WCL / SP
  | 'CASE_HISTORY'      // Riwayat Kasus & Berkas Penindakan
  | 'DETECTIVE'         // Kasus Detektif & CID Board
  | 'BOLO'              // Sistem BOLO & Sitaan Lalu Lintas (Patrol / PU Hub)
  | 'IAD'               // Internal Affairs & Disiplin Anggota
  | 'FORENSICS'         // Laboratorium Forensik & Balistik
  | 'DMV_CITIZEN'       // Database Sipil & Kendaraan DMV
  | 'SPECIAL_DIVISIONS' // Hub Divisi Khusus (SWAT, ASD, K-9, IAD, Academy)
  | 'UNIVERSAL';        // Master Access Sekali Pakai

export interface OneTimePasscode {
  id: string;
  code: string;                          // Format: OTP-VAULT-8492, OTP-LEBUR-1920, OTP-DOC-7721, OTP-ALL-9901
  module: ModuleAccessKey;
  moduleLabel: string;
  issuedToOfficerName: string;           // Nama bawahan penerima atau "Semua Personel (General Clearance)"
  issuedToBadge?: string;                // Badge bawahan misal "#215"
  issuedByOfficerName: string;
  issuedByBadge: string;
  issuedByRank: string;
  purpose: string;                       // Alasan/Penugasan: "Disposisi Audit Brankas Mingguan", "Izin Peleburan Narkoba Kasus #10"
  createdAt: number;
  expiresAt: number;
  durationMinutes: number;               // 0 = 1x pakai langsung hangus, 15, 30, 60, 120 menit
  maxUsage: number;                      // Default: 1 kali
  usageCount: number;                    // Jumlah kali digunakan
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';
  usedByOfficerName?: string;
  usedByBadge?: string;
  usedAt?: number;
}

export interface ModuleClearanceRule {
  key: ModuleAccessKey;
  title: string;
  description: string;
  minimumRankTier: number;               // 1 = High Command only, 2 = LT+, 3 = SGT+, 4 = PO I+, 5 = Cadet
  directAccessRanks: string[];           // Pangkat yang bisa akses langsung tanpa OTP
  allowOtpBypass: boolean;              // Apakah bisa dibuka dengan Kode OTP dari Atasan
  iconName: string;
}

// Valid HQ Terminal Passcodes given by supervisors
export const VALID_SUPERVISOR_PASSCODES = [
  '10-4',
  '911',
  'HSPD-HQ',
  'HSPD2024',
  'HIGHSTATE-PD',
  'HQ-ACCESS'
];

export interface AuthorityPinLog {
  id: string;
  pin: string;
  type: 'hourly_auto' | 'manual';
  generatedAt: number;
  expiresAt: number;
  setBy: string;
  setByBadge?: string;
  setByRank?: string;
  notes?: string;
}

export interface AuthorityPinConfig {
  currentPin: string;
  generatedAt: number;
  expiresAt: number;
  autoRotateHourly: boolean; // True = automatically rotates PIN every 60 minutes
  durationMinutes: number;   // Duration in minutes (defaults to 60 for hourly)
  mode: 'hourly_auto' | 'manual';
  setBy: string;
  setByBadge: string;
  setByRank: string;
  history: AuthorityPinLog[];
}

export type PinResetStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';

export interface PinResetRequest {
  id: string;
  officerName: string;
  officerBadge: string;
  officerRank?: string;
  discordTag?: string;
  reason: string;
  requestedPin?: string;
  status: PinResetStatus;
  createdAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
  resolvedByBadge?: string;
  resolvedByRank?: string;
  resolvedNewPin?: string;
  resolutionNotes?: string;
  webhookSent?: boolean;
  autoGranted?: boolean;
  autoGrantReason?: string;
}

// ==========================================
// 🔍 DETECTIVE & INVESTIGATION CASE TYPES
// ==========================================
export type CaseStatus = 'OPEN' | 'UNDER_INVESTIGATION' | 'WARRANT_ISSUED' | 'COLD_CASE' | 'SOLVED_CLOSED';
export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SuspectStatus = 'PERSON_OF_INTEREST' | 'SUSPECT' | 'WARRANT_ACTIVE' | 'ARRESTED' | 'CLEARED' | 'DECEASED';
export type EvidenceType = 'BALLISTICS' | 'NARCOTICS' | 'PHOTO' | 'DOCUMENT' | 'FINGERPRINT' | 'VEHICLE' | 'SURVEILLANCE_FOOTAGE' | 'AUDIO' | 'OTHER';

export type SyndicateRole = 
  | 'BOSS'          // Level 1: Atasan Tertinggi / Don / Ketua Sindikat / Kingpin
  | 'UNDERBOSS'     // Level 2: Wakil Ketua / Consigliere / Tangan Kanan
  | 'CAPTAIN'       // Level 3: Letnan / Kapten / Kepala Cabang / Koordinator Lapangan
  | 'SOLDIER'       // Level 4: Anggota Inti / Eksekutor / Kurir / Enforcer
  | 'ASSOCIATE'     // Level 5: Informan / Street Hustler / Afiliasi / Binaan
  | 'OTHER';

export interface CaseSuspect {
  id: string;
  name: string;
  alias?: string;
  gangAffiliation?: string;
  role?: SyndicateRole;
  customRoleTitle?: string; // e.g. "Kepala Keuangan Sindikat", "Penyuplai Senjata Ilegal"
  hierarchyLevel?: number;  // 1: Boss, 2: Underboss, 3: Captain, 4: Soldier/Anggota, 5: Associate
  parentId?: string;        // ID of direct superior / atasan in the family tree
  status: SuspectStatus;
  mugshotUrl?: string;
  phone?: string;
  bountyReward?: number;
  charges?: string[];
  notes?: string;
}

export interface CaseEvidence {
  id: string;
  type: EvidenceType;
  title: string;
  description: string;
  collectedBy: string;
  collectedDate: string;
  imageUrl?: string;
  fileName?: string;
  fileSize?: string;
  storageLocation: string; // e.g. "Evidence Locker #A-14", "Digital Archive"
}

export interface CaseTimelineEvent {
  id: string;
  timestamp: number;
  dateFormatted: string;
  officer: string;
  description: string;
}

export interface DetectiveCase {
  id: string;
  caseNumber: string; // e.g. "HSPD-DB-26-001"
  title: string;
  summary: string;
  leadDetective: string;
  leadDetectiveBadge: string;
  assistingDetectives?: string[];
  division: string;
  status: CaseStatus;
  priority: CasePriority;
  incidentDate: string;
  location: string;
  suspects: CaseSuspect[];
  evidences: CaseEvidence[];
  timeline: CaseTimelineEvent[];
  warrantIssued?: boolean;
  warrantNumber?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

// ==========================================
// 🚗 VEHICLE IMPOUND & BOLO TYPES
// ==========================================
export interface ImpoundRecord {
  id: string;
  plateNumber: string;
  vehicleModel: string;
  color: string;
  ownerName: string;
  reason: string;
  impoundDays: number;
  impoundFee: number;
  officerName: string;
  officerBadge: string;
  status: 'IMPOUNDED' | 'RELEASED' | 'AUCTION';
  locationFound: string;
  timestamp: number;
}

export interface BoloAlert {
  id: string;
  type: 'PERSON' | 'VEHICLE' | 'WEAPON' | 'ALL_POINTS_BULLETIN';
  title: string;
  description: string;
  dangerLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME_ARMED_DANGEROUS';
  lastSeenLocation: string;
  issuedBy: string;
  issuedByBadge: string;
  active: boolean;
  timestamp: number;
}

// ==========================================
// 🛡️ TACTICAL / SWAT MISSION TYPES
// ==========================================
export interface TacticalOperation {
  id: string;
  codeName: string;
  targetLocation: string;
  threatLevel: 'CODE_RED' | 'CODE_BLACK' | 'HOSTAGE_SITUATION' | 'HIGH_RISK_RAID';
  commandingOfficer: string;
  operators: string[];
  breachPoint: string;
  tacticalPlan: string;
  status: 'PLANNING' | 'EXECUTING' | 'SECURED_COMPLETED' | 'STAND_DOWN';
  timestamp: number;
}

// ==========================================
// 🎖️ DIVISION CATEGORY DETECTION
// ==========================================
export type DivisionArchetype = 'COMMAND' | 'DETECTIVE' | 'SWAT' | 'TRAFFIC' | 'PATROL';

export function getDivisionArchetype(division?: string, rank?: string): DivisionArchetype {
  if (isOfficerHighRank(rank)) return 'COMMAND';
  
  const d = (division || '').toLowerCase();
  if (d.includes('detective') || d.includes('cid') || d.includes('investigasi') || d.includes('db') || d.includes('intel')) {
    return 'DETECTIVE';
  }
  if (d.includes('swat') || d.includes('tactical') || d.includes('k9') || d.includes('special')) {
    return 'SWAT';
  }
  if (d.includes('traffic') || d.includes('laka') || d.includes('patwal') || d.includes('highway')) {
    return 'TRAFFIC';
  }
  return 'PATROL';
}

// ==========================================
// 🏦 POLICE VAULT & ARMORY (WEEKLY 1X AUDIT)
// ==========================================
export type VaultSealStatus = 'INTACT_SECURED' | 'SEAL_BROKEN_DISCREPANCY' | 'UNDER_MAINTENANCE';

export interface VaultAuditLog {
  id: string;
  auditNumber: string;         // e.g. HSPD-VAULT-2026-W34
  weekLabel: string;           // e.g. "Minggu ke-34 (2026)"
  auditDate: string;           // YYYY-MM-DD
  auditorName: string;
  auditorBadge: string;
  auditorRank: string;
  witnessOfficer?: string;     // Saksi pendamping audit
  // Financial Asset Breakdown
  cashConfiscated: number;     // Kas Uang Sitaan ($)
  cleanCashFund: number;       // Kas Operasional Dinas ($)
  // Narcotics Seized Breakdown (Grams / Units)
  drugsSummary: {
    weedGrams: number;
    cocaineGrams: number;
    crackGrams: number;
    methGrams: number;
    pillsCount: number;
  };
  // Weapon Stock in Armory & Vault
  weaponsSummary: {
    handgunsCount: number;
    shotgunsCount: number;
    smgCount: number;
    rifleCount: number;
    heavyWeaponsCount: number;
  };
  // Ammunition in Armory (Rounds)
  ammoSummary: {
    pistolAmmo: number;
    shotgunShells: number;
    smgAmmo: number;
    rifleAmmo: number;
  };
  otherItemsNote?: string;     // Perhiasan, emas batangan, alat cetak uang palsu, dll
  vaultSealStatus: VaultSealStatus;
  auditNotes: string;
  evidencePhotos: string[];    // Foto fisik kondisi brankas & lemari senjata dari device
  timestamp: number;
  nextAuditDueDate: number;    // timestamp 7 hari ke depan
}

// ==========================================
// 💥 WEAPON & VEHICLE SMELTING / DESTRUCTION REGISTRY
// ==========================================
export type DestructionItemType = 'VEHICLE' | 'WEAPON' | 'NARCOTICS' | 'CONTRABAND';
export type DestructionStatus = 'PROPOSED_PENDING_APPROVAL' | 'APPROVED_SCHEDULED' | 'SMELTED_DESTROYED' | 'REJECTED_RETAINED';
export type DestructionReason = 
  | 'COURT_ORDER_INKRACHT'        // Putusan Pengadilan / Inkracht
  | 'ILLEGAL_SERIAL_ERASED'       // Senjata Ilegal Tanpa Izin & Serial Terhapus
  | 'UNCLAIMED_IMPOUND_EXPIRED'   // Sitaan Melebihi Batas Waktu (>30 Hari)
  | 'TOTAL_WRECK_UNSAFE'          // Kendaraan Hancur Total / Tidak Layak Jalan
  | 'CONTRABAND_HAZARDOUS';       // Barang Berbahaya / Narkotika Sitaan

export interface VehicleDestructionDetails {
  model: string;
  plateNumber: string;
  color: string;
  vin?: string;
  previousOwner?: string;
  chassisCondition?: string;
}

export interface WeaponDestructionDetails {
  weaponModel: string;
  serialNumber: string;
  isSerialScratched: boolean;
  caliber: string;
  confiscatedFrom?: string;
  quantity?: number;
}

export interface NarcoticsDestructionDetails {
  substance: string;
  weightGrams: number;
  packaging: string;
  burningMethod?: string;
}

export interface DestructionRegistryItem {
  id: string;
  destructionNumber: string;   // e.g. HSPD-SMELT-26-042
  itemType: DestructionItemType;
  title: string;
  caseNumber?: string;         // No. Kasus asal penyitaan
  vehicleDetails?: VehicleDestructionDetails;
  weaponDetails?: WeaponDestructionDetails;
  narcoticsDetails?: NarcoticsDestructionDetails;
  destructionReason: DestructionReason;
  reasonDescription: string;
  facilityLocation: string;    // e.g. "Los Santos Junkyard & Metal Smelter" / "Ocean Docks Incinerator"
  registeredBy: string;
  registeredByBadge: string;
  authorizedBy?: string;       // High Command yang menyetujui
  authorizedDate?: string;
  executorOfficer?: string;    // Petugas pelaksana peleburan
  courtOrderDocNumber?: string;// No. Berita Acara / Surat Penetapan Pengadilan
  status: DestructionStatus;
  scheduledDate: string;
  executedTimestamp?: number;
  beforePhotos: string[];      // Foto sebelum dilebur dari device
  afterPhotos: string[];       // Foto residu / setelah peleburan dari device
  notes?: string;
  timestamp: number;
}

// ==========================================
// HSPD OFFICIAL DOCUMENT STUDIO & GENERATOR
// ==========================================

export type DocumentCategory = 
  | 'SURAT_TUGAS'        // Surat Perintah Tugas / Operasi Khusus (Warrant of Operation)
  | 'IZIN_SENJATA'       // Surat Izin Senjata Api Sipil (Weapon Carry License / WCL)
  | 'SKCK'               // Surat Keterangan Catatan Kepolisian (Police Clearance Certificate)
  | 'SURAT_PERINGATAN'   // Surat Peringatan & Disiplin (SP1 / SP2 / SP3 Disciplinary Notice)
  | 'SK_PROMOSI'         // SK Pengangkatan Pangkat & Mutasi Divisi
  | 'IZIN_KERAMAIAN'     // Surat Izin Keramaian & Penutupan Jalan
  | 'BAP_INTEROGASI'     // Berita Acara Pemeriksaan & Interogasi Tersangka / Saksi
  | 'SURAT_JAMINAN_BAIL' // Surat Perjanjian Jaminan & Pelepasan Bersyarat (Bail Agreement)
  | 'SURAT_KEHILANGAN'   // Surat Tanda Penerimaan Laporan Kehilangan (Police Loss Report)
  | 'SURAT_PENYITAAN'    // Surat Perintah Penggeledahan & Penyitaan Barang Bukti
  | 'MEMO_INTERNAL'      // Nota Dinas / Perintah Pimpinan Harian
  | 'CUSTOM_BEBAS';      // Format Bebas / Blank Custom Official Document

export type DocumentClassification = 
  | 'BIASA'
  | 'TERBATAS'
  | 'RAHASIA'
  | 'SANGAT RAHASIA'
  | 'KILAT / URGENT';

export type SealType = 
  | 'HSPD_OFFICIAL'     // Official HSPD Headquarters Seal (Gold/Red)
  | 'CID_DETECTIVE'     // CID Criminal Investigation Division (Blue)
  | 'TRAFFIC_TEU'       // Traffic Enforcement & Licensing (Green/Blue)
  | 'INTERNAL_AFFAIRS'  // IAD Disciplinary Seal (Purple/Red)
  | 'HIGH_COMMAND'      // Chief of Police Stamp (Golden Seal)
  | 'APPROVED_PASSED'   // Approved / Lolos Uji (Emerald)
  | 'CONFIDENTIAL';     // Top Secret / Classified (Crimson)

export interface DocumentClause {
  id: string;
  clauseNumber?: string; // e.g. "Pasal 1", "Poin A", "1.", etc.
  title?: string;
  content: string;
}

export interface OfficialDocument {
  id: string;
  docNumber: string;               // e.g. "SP-TUGAS/HSPD-CID/VIII/2026/089"
  category: DocumentCategory;
  classification: DocumentClassification;
  title: string;                   // e.g. "SURAT PERINTAH OPERASI PENGGEREBEKAN"
  subject: string;                 // e.g. "Operasi Penindakan Sindikat Narkotika & Senjata Ilegal"
  date: string;                    // e.g. "25 Agustus 2026"
  validUntil?: string;             // e.g. "25 November 2026" or "Hingga Operasi Selesai"
  location: string;                // e.g. "Markas Besar HSPD, Mission Row, Los Santos"
  
  // Issuing Authority (Pihak Pertama / Pejabat Penerbit)
  issuerName: string;
  issuerBadge: string;
  issuerRank: string;
  issuerRole: string;              // e.g. "Kepala Divisi Kriminal / CID Commander"
  
  // Recipient / Subject (Pihak Kedua / Penerima / Subjek)
  recipientName: string;
  recipientId?: string;            // Citizen ID / Badge / KTP
  recipientPhone?: string;
  recipientRoleOrStatus?: string;  // e.g. "Warga Sipil / Pemohon Izin", "Petugas Lapangan", "Tersangka"
  recipientAddress?: string;
  
  // Core Body Content
  openingText: string;             // Opening preamble
  clauses: DocumentClause[];       // Detailed bullet points, legal grounds, or task steps
  closingText: string;             // Concluding statement
  notes?: string;                  // Additional notes / disclaimer
  
  // Seals & Stamps to Display
  primarySeal: SealType;
  secondarySeal?: SealType;
  sealDisplayMode?: 'preset' | 'custom' | 'both';
  customSealImage?: string;        // Base64 / URL stempel kustom dari device
  customSealRotation?: number;     // e.g. -8 deg
  customSealOpacity?: number;      // e.g. 0.85
  customSealScale?: number;        // e.g. 1.0 (100px - 180px)
  customSealColorFilter?: 'original' | 'red' | 'blue' | 'purple' | 'gold' | 'black';
  
  // Paper & Watermark
  showWatermark: boolean;
  watermarkOpacity?: number;       // e.g. 0.12 (12%)
  watermarkSize?: number;          // e.g. 440
  customWatermarkImage?: string;   // Kustom watermark atau default Logo HSPD
  customHeaderLogo?: string;       // Kustom kop surat logo atau default Logo HSPD
  paperTexture?: 'security_parchment' | 'clean_white' | 'vintage_linen' | 'cream_bond';
  paperBorderType?: 'official_guilloche' | 'double_line' | 'gold_accent' | 'minimal';
  showQrVerification: boolean;
  
  // Signatures configuration
  issuerSignatureTitle: string;    // e.g. "Pejabat Pemberi Perintah,"
  issuerSignatureStyle: 'handwriting1' | 'handwriting2' | 'formal' | 'badge_stamp' | 'blank';
  issuerSignatureType?: 'font' | 'upload' | 'draw' | 'blank';
  issuerSignatureImage?: string;   // Base64 upload / digital canvas
  
  recipientSignatureTitle?: string; // e.g. "Penerima Perintah / Pemohon,"
  recipientSignatureName?: string;
  recipientSignatureStyle?: 'handwriting1' | 'handwriting2' | 'formal' | 'badge_stamp' | 'blank';
  recipientSignatureType?: 'font' | 'upload' | 'draw' | 'blank';
  recipientSignatureImage?: string; // Base64 upload / digital canvas
  showRecipientSignature?: boolean; // Tampilkan / Sembunyikan tanda tangan pihak penerima (default: true)
  
  acknowledgedByTitle?: string;    // e.g. "Mengetahui & Menyetujui,"
  acknowledgedByName?: string;     // e.g. "Leoarnd Neave"
  acknowledgedByRank?: string;     // e.g. "CHIEF OF POLICE [COP]"
  acknowledgedByRole?: string;     // e.g. "Kepala Kepolisian HighState"
  acknowledgedSignatureType?: 'font' | 'upload' | 'draw';
  acknowledgedSignatureImage?: string;
  
  createdAt: number;
  updatedAt: number;
}

// ========================================================
// 🚨 CAD & LIVE 911 DISPATCH EMERGENCY TERMINAL TYPES
// ========================================================
export type Call911Priority = 'CODE 1 (LOW)' | 'CODE 2 (MEDIUM)' | 'CODE 3 (URGENT)' | 'CODE 99 (OFFICER DOWN)';
export type Call911Status = 'PENDING' | 'DISPATCHED' | 'ON_SCENE' | 'RESOLVED' | 'CANCELLED';

export interface Emergency911Call {
  id: string;
  callNumber: string;               // e.g. "CAD-2026-0891"
  callerName: string;               // e.g. "Anonymous Citizen" / "John Doe"
  callerPhone?: string;
  location: string;                 // e.g. "Legion Square / Integrity Way"
  postalCode?: string;              // e.g. "7014"
  title: string;                    // e.g. "10-90 Bank Robbery in Progress"
  details: string;                  // e.g. "4 suspects with automatic weapons, hostage spotted inside"
  priority: Call911Priority;
  status: Call911Status;
  assignedUnits: string[];          // e.g. ["LINCOLN-1", "ADAM-12", "AIR-1"]
  timestamp: number;
  resolvedAt?: number;
  resolutionNotes?: string;
}

export interface PanicAlert {
  id: string;
  officerName: string;
  officerBadge: string;
  officerRank: string;
  callsign: string;
  location: string;
  postalCode?: string;
  timestamp: number;
  acknowledgedBy: string[];
  status: 'ACTIVE' | 'RESOLVED';
}

export interface CadUnit {
  id: string;
  callsign: string;                 // e.g. "1-ADAM-12"
  primaryOfficerName: string;
  primaryOfficerBadge: string;
  partnerOfficerName?: string;
  partnerOfficerBadge?: string;
  division: string;
  vehicleType: string;              // e.g. "Vapid Stanier Cruiser", "Scout SUV", "Buffalo STX Interceptor", "Maverick ASD Helo"
  status: DutyStatusCode;
  statusText: string;
  assignedCallNumber?: string;
  lastLocation: string;
  updatedAt: number;
}

export interface PursuitTrackerState {
  id: string;
  targetVehicle: string;            // e.g. "Black Karin Sultan (Plate: 84JFK92)"
  suspectCount: number;
  lastLocation: string;
  headingDirection: string;         // e.g. "Northbound on Olympic Fwy"
  codeLevel: 'CODE 2' | 'CODE 3';
  primaryUnit: string;              // Callsign
  secondaryUnits: string[];
  airUnitCallsign?: string;
  isPitAuthorized: boolean;
  isSpikeAuthorized: boolean;
  isBoxingAuthorized: boolean;
  status: 'ACTIVE' | '10-15_APPREHENDED' | '10-99_CRASHED' | '10-22_LOST';
  startedAt: number;
  updatedAt: number;
}

// ========================================================
// ⭐ SPECIALIZED DIVISIONS DATA STRUCTURES
// ========================================================

// 1. ASD (Air Support Division)
export interface AsdHelicopter {
  id: string;
  tailNumber: string;               // e.g. "AIR-ONE (N911LS)"
  model: string;                    // e.g. "Buckingham Police Maverick"
  status: 'AVAILABLE' | 'IN_AIR_PATROL' | 'MAINTENANCE' | 'REFUELING';
  pilotName: string;
  pilotBadge: string;
  tacticalObserverName?: string;
  fuelPercentage: number;
  flirThermalMode: 'NORMAL' | 'THERMAL_WHITE_HOT' | 'THERMAL_BLACK_HOT' | 'NIGHT_VISION';
  searchlightActive: boolean;
  altitudeFeet: number;
  currentSector: string;
}

// 2. K-9 Unit (Canine Division)
export interface K9Partner {
  id: string;
  dogName: string;                  // e.g. "K-9 Zeus", "K-9 Bella", "K-9 Rex"
  breed: string;                    // e.g. "Belgian Malinois", "German Shepherd", "Dutch Shepherd"
  handlerName: string;
  handlerBadge: string;
  specialization: 'NARCOTICS & WEAPONS' | 'EXPLOSIVES & IED' | 'SEARCH & TRACKING' | 'TACTICAL PATROL';
  certificationStatus: 'CERTIFIED' | 'IN_TRAINING' | 'VET_LEAVE';
  totalDeployments: number;
  totalFinds: number;
  totalBites: number;
  healthStatus: 'OPTIMAL' | 'FATIGUED' | 'MINOR_INJURY' | 'MEDICAL_ATTENTION';
  lastVetCheckDate: string;
}

export interface K9DeploymentLog {
  id: string;
  dogName: string;
  handlerName: string;
  location: string;
  targetType: 'VEHICLE_SNIFF' | 'BUILDING_SWEEP' | 'FUGITIVE_TRACKING' | 'CROWD_CONTROL';
  resultStatus: 'POSITIVE_HIT' | 'NEGATIVE_CLEAR' | 'SUSPECT_APPREHENDED';
  findingsSummary: string;
  timestamp: number;
}

// 3. SWAT / Tactical Unit
export interface SwatOperation {
  id: string;
  opCode: string;                   // e.g. "OP-BLACKOUT-09"
  missionType: 'HOSTAGE_RESCUE' | 'BARRICADED_SUSPECT' | 'HIGH_RISK_WARRANT' | 'BANK_ROBBERY' | 'VIP_ESCORT';
  threatLevel: 'CODE_RED' | 'CODE_BLACK' | 'HIGH';
  teamLeadName: string;
  teamLeadBadge: string;
  assignedOperators: string[];
  breachingPlan: 'EXPLOSIVE_C4' | 'BATTERING_RAM' | 'SHOTGUN_BREACH' | 'STEALTH_LOCKPICK' | 'GAS_ENTRY';
  status: 'BRIEFING' | 'STAGED' | 'EXECUTING' | 'ALL_CLEAR' | 'MISSION_ABORT';
  targetLocation: string;
  hostageCount: number;
  armedSuspectCount: number;
  createdAt: number;
  notes: string;
}

// 4. Internal Affairs Division (IAD)
export interface IadComplaint {
  id: string;
  caseNumber: string;               // e.g. "IAD-2026-042"
  complainantName: string;          // Civilian or Officer
  complainantType: 'CIVILIAN' | 'OFFICER_INTERNAL' | 'ANONYMOUS';
  accusedOfficerName: string;
  accusedOfficerBadge: string;
  accusedOfficerRank: string;
  allegationCategory: 'EXCESSIVE_FORCE' | 'CORRUPTION' | 'UNPROFESSIONAL_CONDUCT' | 'EVIDENCE_TAMPERING' | 'UNAUTHORIZED_WEAPON_DISCHARGE' | 'PROCEDURAL_VIOLATION';
  incidentDate: string;
  incidentLocation: string;
  narrative: string;
  evidenceLinks?: string;
  investigatorName: string;
  status: 'PENDING_REVIEW' | 'UNDER_INVESTIGATION' | 'FORMAL_HEARING' | 'SUSTAINED' | 'EXONERATED' | 'UNFOUNDED';
  recommendedSanction?: 'WRITTEN_REPRIMAND' | 'STRIKE_WARNING' | 'SUSPENSION_DUTY' | 'DEMOTION' | 'DISHONORABLE_DISCHARGE';
  createdAt: number;
  resolvedAt?: number;
}

// 5. Police Academy / FTO
export interface CadetEvaluation {
  id: string;
  cadetName: string;
  cadetBadge: string;
  ftoName: string;
  ftoBadge: string;
  phase: 'PHASE 1 (OBSERVATION)' | 'PHASE 2 (BASIC PATROL)' | 'PHASE 3 (SOLO SHADOW)' | 'FINAL EVALUATION';
  drivingScore: number;             // 1-5
  radioCommsScore: number;          // 1-5
  pasalApplicationScore: number;    // 1-5
  tacticalShootScore: number;       // 1-5
  mirandaRightsScore: number;       // 1-5
  overallGrade: 'OUTSTANDING' | 'SATISFACTORY' | 'NEEDS_IMPROVEMENT' | 'UNSATISFACTORY';
  notes: string;
  recommendation: 'PASS_TO_NEXT_PHASE' | 'GRADUATE_TO_PO1' | 'RE_EVALUATE' | 'ACADEMY_DISMISSAL';
  evaluatedAt: number;
}

// 6. TED (Traffic Enforcement Division / Satlantas)
export interface TedTrafficRecord {
  id: string;
  driverName: string;
  driverLicense: string;
  vehiclePlate: string;
  vehicleModel: string;
  clockedSpeedMph: number;
  speedLimitMph: number;
  bacLevel: number;                 // Blood Alcohol Content, e.g. 0.08
  violations: string[];
  totalFine: number;
  officerName: string;
  officerBadge: string;
  actionTaken: 'WARNING' | 'CITATION_ISSUED' | 'DUI_ARREST' | 'VEHICLE_IMPOUNDED';
  location: string;
  timestamp: number;
}

// ========================================================
// 🔍 DMV & CITIZEN DATABASE TYPES
// ========================================================
export type DriverLicenseStatus = 'VALID' | 'SUSPENDED' | 'REVOKED' | 'NONE';
export type GunLicenseStatus = 'VALID_WCL' | 'VALID_CCW' | 'REVOKED' | 'NONE';

export interface CitizenProfile {
  id: string;
  citizenId: string;                // e.g. "LS-90142"
  fullName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  phoneNumber: string;
  address: string;
  avatarUrl?: string;
  driverLicenseStatus: DriverLicenseStatus;
  driverPoints: number;
  gunLicenseStatus: GunLicenseStatus;
  isWantedBolo: boolean;
  wantedReason?: string;
  registeredVehicles: {
    plate: string;
    model: string;
    color: string;
    status: 'ACTIVE' | 'IMPOUNDED' | 'STOLEN';
  }[];
  priorArrests: {
    recordId: string;
    charges: string;
    jailSentenceMinutes: number;
    fineAmount: number;
    arrestingOfficer: string;
    timestamp: number;
  }[];
  notes?: string;
}

// ========================================================
// 🔬 EVIDENCE & FORENSICS LAB TYPES
// ========================================================
export type ForensicAnalysisType = 'BALLISTICS_MATCH' | 'GSR_SWAB_TEST' | 'DRUG_PURITY_TEST' | 'FINGERPRINT_LATENT' | 'FINGERPRINT_SCAN' | 'DNA_MATCH';
export type ForensicMatchResult = 'POSITIVE_MATCH' | 'NEGATIVE_INCONCLUSIVE' | 'CONFIRMED_CONTRABAND' | 'NEGATIVE_MATCH' | 'INCONCLUSIVE';

export interface ForensicAnalysis {
  id: string;
  labNumber: string;                // e.g. "LAB-2026-110"
  caseReference: string;            // e.g. "CAS-2026-0012"
  examinerName: string;
  examinerBadge: string;
  analysisType: ForensicAnalysisType;
  sampleDescription: string;
  findings: string;
  matchResult: ForensicMatchResult;
  matchTarget?: string;             // e.g. "Matched to Glock 19 (Serial: HSPD-9921)" or "Citizen ID LS-90142"
  timestamp: number;
}



