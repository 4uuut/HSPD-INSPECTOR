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
  | 'LIEUTENANT [LT]'
  | 'SERGEANT [SGT]'
  | 'SENIOR LEAD OFFICER [SLO]'
  | 'POLICE OFFICER III [PO III]'
  | 'POLICE OFFICER II [PO II]'
  | 'POLICE OFFICER I [PO I]'
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
  registeredAt: number;
  promotedBy?: string;
  lastLogin?: number;
  warnings?: OfficerWarning[];
}

export interface OfficerProfile {
  name: string;
  badge: string;
  rank: OfficerRankLevel;
  division: string;
  loginTime: number;
}

// Duty Status and Report Interface
export type DutyStatusCode = '10-8' | '10-7' | '10-6' | '10-97';

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
}

export const ALL_RANKS: OfficerRankLevel[] = [
  'CHIEF OF POLICE [COP]',
  'ASSISTANT CHIEF [A/C]',
  'DEPUTY CHIEF [D/C]',
  'COMMANDER [CDR]',
  'CAPTAIN [CPT]',
  'LIEUTENANT [LT]',
  'SERGEANT [SGT]',
  'SENIOR LEAD OFFICER [SLO]',
  'POLICE OFFICER III [PO III]',
  'POLICE OFFICER II [PO II]',
  'POLICE OFFICER I [PO I]',
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
  'LIEUTENANT [LT]',
  'SERGEANT [SGT]',
  'SENIOR LEAD OFFICER [SLO]',
  'POLICE OFFICER III [PO III]',
  'POLICE OFFICER II [PO II]',
  'POLICE OFFICER I [PO I]',
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
}

