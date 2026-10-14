import { DivisionCaseFile, OfficerProfile, isOfficerHighRank } from '../types';

export type OfficialDivisionId = 
  | 'PATROL'
  | 'METRO'
  | 'SWAT'
  | 'DETECTIVE'
  | 'EVIDENCE'
  | 'AIR_SUPPORT'
  | 'PSD';

export interface OfficialDivisionMeta {
  id: OfficialDivisionId;
  name: string;
  shortName: string;
  code: string;
  prefix: string;
  tagline: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  badgeClass: string;
  activeBorderClass: string;
  colorGradient: string;
  accentHex: string;
}

export const OFFICIAL_DIVISIONS: OfficialDivisionMeta[] = [
  {
    id: 'PATROL',
    name: 'Patrol Division Unit',
    shortName: 'Patrol Unit',
    code: 'PDU',
    prefix: 'CASE-PDU',
    tagline: 'First Responders & Highway Patrol Interdiction',
    description: 'Patroli preventif kota, pengawasan lalu lintas, penanganan 10-80 pursuit, razia malam, dan unit respon darurat pertama.',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
    badgeBorder: 'border-blue-500',
    badgeClass: 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20',
    activeBorderClass: 'border-blue-500 text-blue-400 bg-blue-950/40 shadow-blue-500/10',
    colorGradient: 'from-blue-600 to-indigo-700',
    accentHex: '#3b82f6'
  },
  {
    id: 'METRO',
    name: 'Metro Division Unit',
    shortName: 'Metro Unit',
    code: 'MDU',
    prefix: 'CASE-MDU',
    tagline: 'Metropolitan Tactical Operations & K-9 Support',
    description: 'Penindakan taktis zona perkotaan metropolitan, pengerahan K-9 canine satwa pelacak, penekanan kejahatan jalanan, dan perimeter taktis.',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white',
    badgeBorder: 'border-indigo-500',
    badgeClass: 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20',
    activeBorderClass: 'border-indigo-500 text-indigo-400 bg-indigo-950/40 shadow-indigo-500/10',
    colorGradient: 'from-indigo-600 to-violet-800',
    accentHex: '#6366f1'
  },
  {
    id: 'SWAT',
    name: 'Special Weapon and Tactical (SWAT)',
    shortName: 'SWAT',
    code: 'SWAT',
    prefix: 'CASE-SWAT',
    tagline: 'High-Risk Tactical Assault & Hostage Rescue',
    description: 'Operasi penanganan perampokan Bank Pusat Pacific Standard & Bank Pedesaan, pembebasan sandera berisiko tinggi, dan penggerebekan markas kartel.',
    badgeBg: 'bg-rose-600',
    badgeText: 'text-white',
    badgeBorder: 'border-rose-500',
    badgeClass: 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20',
    activeBorderClass: 'border-rose-500 text-rose-400 bg-rose-950/40 shadow-rose-500/10',
    colorGradient: 'from-rose-600 to-red-800',
    accentHex: '#e11d48'
  },
  {
    id: 'DETECTIVE',
    name: 'Detective Bureau',
    shortName: 'Detective',
    code: 'DB',
    prefix: 'CASE-DB',
    tagline: 'Major Crimes, Homicide & Syndicate Investigation',
    description: 'Penyelidikan kasus pembunuhan, sindikat kartel terorganisir, penyadapan intelijen, audit TKP forensik mendalam, dan penerbitan surat perintah penangkapan (Warrant).',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-white',
    badgeBorder: 'border-amber-500',
    badgeClass: 'bg-amber-600 text-white border-amber-500 shadow-amber-500/20',
    activeBorderClass: 'border-amber-500 text-amber-400 bg-amber-950/40 shadow-amber-500/10',
    colorGradient: 'from-amber-600 to-orange-700',
    accentHex: '#d97706'
  },
  {
    id: 'EVIDENCE',
    name: 'Evidence Cell Management',
    shortName: 'Evidence Cell',
    code: 'ECM',
    prefix: 'CASE-ECM',
    tagline: 'Evidence Vault & Forensic Chain of Custody',
    description: 'Penyimpanan dan pencatatan barang bukti sitaan tindak pidana, sel brankas senjata gelap, sitaan narkotika, dan pengamanan rantai bukti (Chain of Custody).',
    badgeBg: 'bg-teal-600',
    badgeText: 'text-white',
    badgeBorder: 'border-teal-500',
    badgeClass: 'bg-teal-600 text-white border-teal-500 shadow-teal-500/20',
    activeBorderClass: 'border-teal-500 text-teal-400 bg-teal-950/40 shadow-teal-500/10',
    colorGradient: 'from-teal-600 to-emerald-800',
    accentHex: '#0d9488'
  },
  {
    id: 'AIR_SUPPORT',
    name: 'Air Support Unit',
    shortName: 'Air Support',
    code: 'ASU',
    prefix: 'CASE-ASU',
    tagline: 'Tactical Airborne Surveillance & Thermal Tracking',
    description: 'Pengawasan udara armada helikopter Maverick FLIR Thermal 4K, pemantauan pengejaran kecepatan tinggi, dukungan taktis cahaya malam, dan evakuasi medis darurat.',
    badgeBg: 'bg-sky-600',
    badgeText: 'text-white',
    badgeBorder: 'border-sky-500',
    badgeClass: 'bg-sky-600 text-white border-sky-500 shadow-sky-500/20',
    activeBorderClass: 'border-sky-500 text-sky-400 bg-sky-950/40 shadow-sky-500/10',
    colorGradient: 'from-sky-600 to-cyan-700',
    accentHex: '#0284c7'
  },
  {
    id: 'PSD',
    name: 'Professional Standards Division',
    shortName: 'PSD / Propam',
    code: 'PSD',
    prefix: 'CASE-PSD',
    tagline: 'Internal Affairs & Professional Accountability',
    description: 'Pengawasan kode etik kepolisian, investigasi laporan pelanggaran internal personel (Propam), penegakan disiplin, dan persidangan etik resmi korps HSPD.',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    badgeBorder: 'border-purple-500',
    badgeClass: 'bg-purple-600 text-white border-purple-500 shadow-purple-500/20',
    activeBorderClass: 'border-purple-500 text-purple-400 bg-purple-950/40 shadow-purple-500/10',
    colorGradient: 'from-purple-600 to-fuchsia-800',
    accentHex: '#9333ea'
  }
];

/**
 * Normalizes any string representation of a division to one of the 7 OfficialDivisionIds.
 */
export function normalizeToDivisionId(div?: string | null): OfficialDivisionId {
  if (!div) return 'PATROL';
  const clean = div.toLowerCase().trim();

  // 1. SWAT
  if (clean.includes('swat') || clean.includes('special weapon')) {
    return 'SWAT';
  }

  // 2. Metro Division Unit
  if (clean.includes('metro') || clean.includes('mdu') || clean.includes('k9') || clean.includes('canine') || clean.includes('anjing')) {
    return 'METRO';
  }

  // 3. Air Support Unit
  if (clean.includes('air') || clean.includes('asu') || clean.includes('asd') || clean.includes('heli') || clean.includes('udara') || clean.includes('flight')) {
    return 'AIR_SUPPORT';
  }

  // 4. Detective Bureau
  if (clean.includes('detective') || clean.includes('cid') || clean.includes('investigasi') || clean.includes('db') || clean.includes('reskrim') || clean.includes('intel')) {
    return 'DETECTIVE';
  }

  // 5. Evidence Cell Management
  if (clean.includes('evidence') || clean.includes('ecm') || clean.includes('bukti') || clean.includes('forensic') || clean.includes('cell') || clean.includes('sitaan')) {
    return 'EVIDENCE';
  }

  // 6. Professional Standards Division
  if (clean.includes('professional') || clean.includes('standards') || clean.includes('psd') || clean.includes('iad') || clean.includes('propam') || clean.includes('etik') || clean.includes('internal affairs')) {
    return 'PSD';
  }

  // 7. Patrol Division Unit (and default for academy / regular traffic)
  if (clean.includes('patrol') || clean.includes('pdu') || clean.includes('ted') || clean.includes('traffic') || clean.includes('satlantas') || clean.includes('academy') || clean.includes('fto') || clean === 'pu') {
    return 'PATROL';
  }

  return 'PATROL';
}

/**
 * Get official metadata object for a division by its ID or raw division string.
 */
export function getDivisionMeta(div?: string | null): OfficialDivisionMeta {
  const divId = normalizeToDivisionId(div);
  return OFFICIAL_DIVISIONS.find(d => d.id === divId) || OFFICIAL_DIVISIONS[0];
}

/**
 * Check if the officer has High Command oversight (Chief of Police, Deputy Chief, Commander, Developer).
 * High Command members have cross-divisional oversight to inspect and audit all 7 divisions.
 */
export function isOfficerCrossDivisionAuthorized(officer?: OfficerProfile | null): boolean {
  if (!officer) return false;
  if (officer.isDeveloper) return true;
  if (isOfficerHighRank(officer.rank)) return true;
  return false;
}

/**
 * Determines whether an officer is authorized to view case files of a target division.
 * RULE: Regular division members CAN ONLY view case files of their own division.
 * Other divisions are completely locked / invisible.
 */
export function canOfficerAccessDivision(
  officer: OfficerProfile | null | undefined,
  targetDivision: OfficialDivisionId | string
): boolean {
  if (!officer) return false;
  // Developer & High Command can access all divisions
  if (isOfficerCrossDivisionAuthorized(officer)) return true;

  const officerDivId = normalizeToDivisionId(officer.division);
  const targetDivId = normalizeToDivisionId(targetDivision);

  return officerDivId === targetDivId;
}

/**
 * Checks whether an officer is authorized to view a specific case file.
 * RULE: Case file belongs to a division, only that division can see it!
 */
export function canOfficerAccessCaseFile(
  officer: OfficerProfile | null | undefined,
  caseFile: DivisionCaseFile
): boolean {
  if (!officer) return false;
  if (isOfficerCrossDivisionAuthorized(officer)) return true;

  const officerDivId = normalizeToDivisionId(officer.division);
  const caseDivId = normalizeToDivisionId(caseFile.division);

  return officerDivId === caseDivId;
}

/**
 * Filters a list of case files to only those the current officer is authorized to view.
 */
export function filterAuthorizedCaseFiles(
  caseFiles: DivisionCaseFile[],
  officer: OfficerProfile | null | undefined
): DivisionCaseFile[] {
  if (!officer) return [];
  if (isOfficerCrossDivisionAuthorized(officer)) {
    return caseFiles;
  }
  const officerDivId = normalizeToDivisionId(officer.division);
  return caseFiles.filter(c => normalizeToDivisionId(c.division) === officerDivId);
}
