import { OfficerProfile, DivisionCaseFile } from '../types';

export type OfficialDivisionKey = 
  | 'PATROL'
  | 'METRO'
  | 'SWAT'
  | 'DETECTIVE'
  | 'EVIDENCE'
  | 'AIR_SUPPORT'
  | 'PSD'
  | 'HIGH_COMMAND';

export interface OfficialDivisionConfig {
  key: OfficialDivisionKey;
  name: string;
  shortTag: string;
  emoji: string;
  badgeClass: string;
  badgeBorder: string;
  badgeBg: string;
  badgeText: string;
  colorHex: number;
  description: string;
  legacyAliases: string[];
}

export const OFFICIAL_DIVISIONS_CONFIG: Record<OfficialDivisionKey, OfficialDivisionConfig> = {
  PATROL: {
    key: 'PATROL',
    name: 'Patrol Division Unit',
    shortTag: 'PATROL',
    emoji: '🚓',
    badgeClass: 'bg-blue-600 text-white border-blue-500',
    badgeBorder: 'border-blue-500/60',
    badgeBg: 'bg-blue-950/40',
    badgeText: 'text-blue-400',
    colorHex: 0x2563EB,
    description: 'Unit patroli operasional utama, respon cepat darurat 911, dan pengamanan jalan raya 24 jam.',
    legacyAliases: ['patrol', 'patroli', 'patrol division', 'patrol division unit', 'field training bureau / patrol', 'patrol bureau', 'ted']
  },
  METRO: {
    key: 'METRO',
    name: 'Metro Division Unit',
    shortTag: 'METRO',
    emoji: '🛡️',
    badgeClass: 'bg-cyan-600 text-white border-cyan-500',
    badgeBorder: 'border-cyan-500/60',
    badgeBg: 'bg-cyan-950/40',
    badgeText: 'text-cyan-400',
    colorHex: 0x06B6D4,
    description: 'Divisi respon cepat metropolitan, penanganan kerusuhan massa, blokade perimeter, dan penindakan wilayah padat perkotaan.',
    legacyAliases: ['metro', 'metro division', 'metro division unit', 'metropolitan', 'k9', 'canine']
  },
  SWAT: {
    key: 'SWAT',
    name: 'Special Weapon and Tactical (SWAT)',
    shortTag: 'SWAT',
    emoji: '💥',
    badgeClass: 'bg-red-600 text-white border-red-500',
    badgeBorder: 'border-red-500/60',
    badgeBg: 'bg-red-950/40',
    badgeText: 'text-red-400',
    colorHex: 0xDC2626,
    description: 'Unit penyerbu taktis berkualifikasi khusus untuk perampokan bersenjata, operasi sandera, dan ancaman Code Red.',
    legacyAliases: ['swat', 'special weapon and tactical', 'special weapons and tactics', 'special weapon and tactical (swat)']
  },
  DETECTIVE: {
    key: 'DETECTIVE',
    name: 'Detective Bureau',
    shortTag: 'DETECTIVE',
    emoji: '🔍',
    badgeClass: 'bg-amber-600 text-white border-amber-500',
    badgeBorder: 'border-amber-500/60',
    badgeBg: 'bg-amber-950/40',
    badgeText: 'text-amber-400',
    colorHex: 0xD97706,
    description: 'Biro investigasi reserse kriminal mendalam, pengungkapan sindikat kejahatan terorganisir, dan analisis kasus perkara.',
    legacyAliases: ['detective', 'detective bureau', 'detective bureau / cid', 'cid', 'reserse']
  },
  EVIDENCE: {
    key: 'EVIDENCE',
    name: 'Evidence Cell Management',
    shortTag: 'EVIDENCE',
    emoji: '📦',
    badgeClass: 'bg-emerald-600 text-white border-emerald-500',
    badgeBorder: 'border-emerald-500/60',
    badgeBg: 'bg-emerald-950/40',
    badgeText: 'text-emerald-400',
    colorHex: 0x059669,
    description: 'Manajemen brankas barang bukti kriminal, administrasi sitaan uang/senjata, rantai pengawasan (chain of custody), dan pemusnahan sitaan.',
    legacyAliases: ['evidence', 'evidence cell', 'evidence cell management', 'barang bukti', 'vault', 'evidence vault']
  },
  AIR_SUPPORT: {
    key: 'AIR_SUPPORT',
    name: 'Air Support Unit',
    shortTag: 'AIR SUPPORT',
    emoji: '🚁',
    badgeClass: 'bg-sky-600 text-white border-sky-500',
    badgeBorder: 'border-sky-500/60',
    badgeBg: 'bg-sky-950/40',
    badgeText: 'text-sky-400',
    colorHex: 0x0284C7,
    description: 'Unit penerbang taktis kepolisian udara dengan sensor termal FLIR, pengawasan kejaran 10-80, dan evakuasi medis helikopter.',
    legacyAliases: ['air support', 'air support unit', 'asd', 'air support division', 'air support division (asd)', 'heli']
  },
  PSD: {
    key: 'PSD',
    name: 'Professional Standards Division',
    shortTag: 'PSD',
    emoji: '⚖️',
    badgeClass: 'bg-purple-600 text-white border-purple-500',
    badgeBorder: 'border-purple-500/60',
    badgeBg: 'bg-purple-950/40',
    badgeText: 'text-purple-400',
    colorHex: 0x7C3AED,
    description: 'Divisi pengawasan kode etik, sidang disiplin internal kepolisian, penegakan integritas, dan pemeriksaan pelanggaran SOP.',
    legacyAliases: ['psd', 'professional standards division', 'iad', 'internal affairs', 'internal affairs division', 'propam', 'etik', 'academy']
  },
  HIGH_COMMAND: {
    key: 'HIGH_COMMAND',
    name: 'Executive Office / High Command',
    shortTag: 'MABES',
    emoji: '👑',
    badgeClass: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-yellow-400',
    badgeBorder: 'border-yellow-500/60',
    badgeBg: 'bg-yellow-950/40',
    badgeText: 'text-yellow-400',
    colorHex: 0xEAB308,
    description: 'Pimpinan tertinggi Markas Besar Kepolisian HSPD (Chief of Police, Deputy Chief, Commander) pemegang supervisi seluruh divisi.',
    legacyAliases: ['high command', 'executive', 'mabes', 'chief of police', 'deputy chief']
  }
};

export const ORDERED_OFFICIAL_DIVISIONS: OfficialDivisionConfig[] = [
  OFFICIAL_DIVISIONS_CONFIG.PATROL,
  OFFICIAL_DIVISIONS_CONFIG.METRO,
  OFFICIAL_DIVISIONS_CONFIG.SWAT,
  OFFICIAL_DIVISIONS_CONFIG.DETECTIVE,
  OFFICIAL_DIVISIONS_CONFIG.EVIDENCE,
  OFFICIAL_DIVISIONS_CONFIG.AIR_SUPPORT,
  OFFICIAL_DIVISIONS_CONFIG.PSD,
];

/**
 * Normalizes any string representation of a division to OfficialDivisionKey
 */
export function normalizeDivisionKey(divStr?: string | null): OfficialDivisionKey {
  if (!divStr) return 'PATROL';
  const clean = divStr.toLowerCase().trim();

  for (const div of Object.values(OFFICIAL_DIVISIONS_CONFIG)) {
    if (clean === div.key.toLowerCase()) return div.key;
    if (clean === div.name.toLowerCase()) return div.key;
    if (div.legacyAliases.some(alias => clean.includes(alias.toLowerCase()))) {
      return div.key;
    }
  }

  if (clean.includes('patrol')) return 'PATROL';
  if (clean.includes('metro')) return 'METRO';
  if (clean.includes('swat')) return 'SWAT';
  if (clean.includes('detective') || clean.includes('cid')) return 'DETECTIVE';
  if (clean.includes('evidence')) return 'EVIDENCE';
  if (clean.includes('air') || clean.includes('asd')) return 'AIR_SUPPORT';
  if (clean.includes('standard') || clean.includes('psd') || clean.includes('iad') || clean.includes('propam')) return 'PSD';
  if (clean.includes('command') || clean.includes('chief') || clean.includes('executive')) return 'HIGH_COMMAND';

  return 'PATROL';
}

/**
 * Checks whether an officer has High Command supervisory rank
 */
export function isHighCommandOfficer(officer?: OfficerProfile | null): boolean {
  if (!officer) return false;
  const rank = (officer.rank || '').toUpperCase();
  const div = (officer.division || '').toLowerCase();
  const badge = (officer.badge || '').replace(/[^0-9]/g, '');

  if (badge === '001' || badge === '002' || badge === '003') return true;

  return (
    rank.includes('CHIEF OF POLICE') ||
    rank.includes('[COP]') ||
    rank.includes('ASSISTANT CHIEF') ||
    rank.includes('[A/C]') ||
    rank.includes('DEPUTY CHIEF') ||
    rank.includes('[D/C]') ||
    rank.includes('COMMANDER') ||
    rank.includes('[CDR]') ||
    rank.includes('CAPTAIN') ||
    rank.includes('[CPT]') ||
    div.includes('high command') ||
    div.includes('executive office') ||
    div.includes('mabes')
  );
}

/**
 * Checks whether an officer can access/view a specific case file.
 * Rule: Only officers belonging to that division (or High Command leadership) can see it!
 */
export function canOfficerAccessCaseFile(
  officer: OfficerProfile | null | undefined, 
  caseFileOrDivision: DivisionCaseFile | string
): boolean {
  if (!officer) return false;

  // High command leadership holds overarching supervisory clearance across all divisions
  if (isHighCommandOfficer(officer)) return true;

  const caseDivStr = typeof caseFileOrDivision === 'string' 
    ? caseFileOrDivision 
    : caseFileOrDivision.division;

  const officerKey = normalizeDivisionKey(officer.division);
  const caseKey = normalizeDivisionKey(caseDivStr);

  return officerKey === caseKey;
}

/**
 * Returns full official division name from any division string
 */
export function getDivisionDisplayName(divStr?: string | null): string {
  const key = normalizeDivisionKey(divStr);
  return OFFICIAL_DIVISIONS_CONFIG[key]?.name || 'Patrol Division Unit';
}

/**
 * Returns division theme styling
 */
export function getDivisionTheme(divStr?: string | null) {
  const key = normalizeDivisionKey(divStr);
  const cfg = OFFICIAL_DIVISIONS_CONFIG[key] || OFFICIAL_DIVISIONS_CONFIG.PATROL;
  return {
    key: cfg.key,
    name: cfg.name,
    shortTag: cfg.shortTag,
    emoji: cfg.emoji,
    badgeClass: cfg.badgeClass,
    badge: cfg.badgeClass,
    border: cfg.badgeBorder,
    bg: cfg.badgeBg,
    text: cfg.badgeText,
    colorHex: cfg.colorHex,
    description: cfg.description
  };
}
