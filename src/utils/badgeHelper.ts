import { OfficerAccount } from '../types';
import { getRosterFromStorage } from './pinResetStorage';
import { HSPD_OFFICIAL_ROSTER } from '../data/hspdOfficialRoster';
import { getDischargedOfficers, isOfficerDischarged, isOfficerPermanentlyPurged, getPermanentlyPurgedOfficers } from './dischargeStorage';

export interface BadgeDetectionResult {
  badge: string;
  cleanDigits: string;
  formattedBadge: string;
  numericValue: number | null;
  isAvailable: boolean;
  status: 'available' | 'used_active' | 'used_discharged' | 'available_discharged_reusable';
  officerName?: string;
  officerRank?: string;
  badgeSource?: 'official_roster' | 'new_member' | 'discharged';
  isNewMember?: boolean;
  isOfficial?: boolean;
  message: string;
}

/**
 * Normalizes any badge string (e.g. "007", "7", "#007", "Badge 7") into clean digits and formatted #000 string
 */
export function normalizeBadgeFormat(rawBadge: string): { cleanDigits: string; formattedBadge: string; numericValue: number | null } {
  if (!rawBadge) return { cleanDigits: '', formattedBadge: '', numericValue: null };
  const cleanDigits = rawBadge.replace(/[^0-9]/g, '').trim();
  if (!cleanDigits) {
    const trimmed = rawBadge.trim();
    return {
      cleanDigits: trimmed.toLowerCase(),
      formattedBadge: trimmed.startsWith('#') ? trimmed : `#${trimmed}`,
      numericValue: null
    };
  }
  const numericValue = parseInt(cleanDigits, 10);
  const formattedBadge = `#${cleanDigits.padStart(3, '0')}`;
  return { cleanDigits, formattedBadge, numericValue };
}

/**
 * Detects whether a badge number is newly added, old/official, in discharged archives, or available.
 * Provides real-time feedback for Add and Edit officer forms.
 */
export function detectBadgeStatus(
  badgeInput: string,
  roster: OfficerAccount[] = [],
  currentEditingOfficer?: OfficerAccount | null
): BadgeDetectionResult {
  const { cleanDigits, formattedBadge, numericValue } = normalizeBadgeFormat(badgeInput);

  if (!badgeInput || badgeInput.trim() === '' || badgeInput.trim() === '#') {
    return {
      badge: badgeInput,
      cleanDigits: '',
      formattedBadge: '',
      numericValue: null,
      isAvailable: false,
      status: 'available',
      message: 'Ketik nomor badge untuk verifikasi ketersediaan'
    };
  }

  // If currently editing this officer and the badge is unchanged, it is their own active badge
  if (currentEditingOfficer) {
    const editNorm = normalizeBadgeFormat(currentEditingOfficer.badge);
    if (
      (editNorm.formattedBadge && editNorm.formattedBadge.toLowerCase() === formattedBadge.toLowerCase()) ||
      (editNorm.numericValue !== null && numericValue !== null && editNorm.numericValue === numericValue)
    ) {
      return {
        badge: badgeInput,
        cleanDigits,
        formattedBadge,
        numericValue,
        isAvailable: true,
        status: 'available',
        officerName: currentEditingOfficer.name,
        officerRank: currentEditingOfficer.rank,
        message: `Badge aktif milik ${currentEditingOfficer.name}`
      };
    }
  }

  // 1. Compile all active officers across state, localStorage, and official seed
  const activePool: OfficerAccount[] = [];
  const seenIds = new Set<string>();

  const addToPool = (list: OfficerAccount[]) => {
    if (!Array.isArray(list)) return;
    list.forEach(item => {
      if (!item) return;
      const idKey = (item.id || item.badge || item.name || '').toLowerCase().trim();
      if (idKey && !seenIds.has(idKey)) {
        seenIds.add(idKey);
        activePool.push(item);
      }
    });
  };

  addToPool(roster);
  try {
    addToPool(getRosterFromStorage());
  } catch {}
  addToPool(HSPD_OFFICIAL_ROSTER);

  // Check active officers
  for (const officer of activePool) {
    if (!officer.badge) continue;
    // Skip if it's the officer being edited
    if (currentEditingOfficer) {
      if (
        (currentEditingOfficer.id && officer.id && currentEditingOfficer.id.toLowerCase().trim() === officer.id.toLowerCase().trim()) ||
        (currentEditingOfficer.name && officer.name && currentEditingOfficer.name.toLowerCase().trim() === officer.name.toLowerCase().trim())
      ) {
        continue;
      }
    }

    const offNorm = normalizeBadgeFormat(officer.badge);
    const matchesNumber = numericValue !== null && offNorm.numericValue !== null && numericValue === offNorm.numericValue;
    const matchesFormatted = formattedBadge.toLowerCase() === offNorm.formattedBadge.toLowerCase();

    if (matchesNumber || matchesFormatted) {
      // Determine if newly added member or official roster
      const isOfficial = HSPD_OFFICIAL_ROSTER.some(
        o => (o.name && officer.name && o.name.toLowerCase().trim() === officer.name.toLowerCase().trim())
      );
      const isNewMember = !isOfficial || Boolean(officer.registeredAt && officer.registeredAt > 1700000000000);

      return {
        badge: badgeInput,
        cleanDigits,
        formattedBadge,
        numericValue,
        isAvailable: false,
        status: 'used_active',
        officerName: officer.name,
        officerRank: officer.rank,
        badgeSource: isNewMember ? 'new_member' : 'official_roster',
        isNewMember,
        isOfficial,
        message: isNewMember
          ? `⚠️ Terpakai oleh ${officer.name} (${officer.rank || 'Petugas'}) • Anggota Baru Ditambahkan`
          : `⚠️ Terpakai oleh ${officer.name} (${officer.rank || 'Petugas'}) • Anggota Resmi/Lama`
      };
    }
  }

  // 2. Check discharged officer archive
  try {
    const dischargedList = getDischargedOfficers();
    for (const discharged of dischargedList) {
      if (!discharged.badge) continue;
      const disNorm = normalizeBadgeFormat(discharged.badge);
      const matchesNumber = numericValue !== null && disNorm.numericValue !== null && numericValue === disNorm.numericValue;
      const matchesFormatted = formattedBadge.toLowerCase() === disNorm.formattedBadge.toLowerCase();

      if (matchesNumber || matchesFormatted) {
        return {
          badge: badgeInput,
          cleanDigits,
          formattedBadge,
          numericValue,
          isAvailable: true, // FREED AND REUSABLE!
          status: 'available_discharged_reusable',
          officerName: discharged.name,
          officerRank: discharged.rank,
          badgeSource: 'discharged',
          isNewMember: false,
          isOfficial: false,
          message: `✅ Badge ${formattedBadge} tersedia untuk dialokasikan kembali (sebelumnya digunakan oleh eks-petugas ${discharged.name} yang telah diberhentikan).`
        };
      }
    }
  } catch {}

  // 3. Available!
  return {
    badge: badgeInput,
    cleanDigits,
    formattedBadge,
    numericValue,
    isAvailable: true,
    status: 'available',
    message: `✅ Badge ${formattedBadge} tersedia (Belum pernah digunakan)`
  };
}

/**
 * Calculates the next available badge number.
 * 
 * 1. If previousBadge is provided (e.g. after saving an officer and clicking "+ Simpan & Tambah Lagi"),
 *    it strictly follows from previousBadge: previous number + 1, skipping any already taken numbers.
 *    Example: #004 -> #005, #005 -> #006, #099 -> #100, CDT-04 -> CDT-05.
 * 
 * 2. If previousBadge is NOT provided (e.g. opening form or rank change), it scans officers of the same rank,
 *    finds the highest badge number in that rank, and suggests max + 1.
 *    If no officers of that rank exist, it starts at the departmental standard base (e.g. #004 for Cadets,
 *    #101 for PO I, #201 for PO II, etc.) and finds the next available badge.
 */
export function getNextAvailableBadge(
  roster: OfficerAccount[] = [],
  rank: string = 'CADET [CDT]',
  previousBadge?: string
): string {
  // 1. Gather all existing badges across active sources: passed roster, storage, official (excluding discharged and purged)
  const allOfficers: OfficerAccount[] = [];
  const seenKeys = new Set<string>();

  const dischargedList = getDischargedOfficers();
  const purgedList = getPermanentlyPurgedOfficers();

  const ingest = (list: OfficerAccount[]) => {
    if (!Array.isArray(list)) return;
    list.forEach(o => {
      if (!o) return;
      if (isOfficerDischarged(o, dischargedList) || isOfficerPermanentlyPurged(o, purgedList)) {
        return; // Exclude discharged and purged so their badges can be recycled
      }
      const k = (o.id || o.badge || o.name || '').toLowerCase().trim();
      if (k && !seenKeys.has(k)) {
        seenKeys.add(k);
        allOfficers.push(o);
      }
    });
  };

  ingest(roster);
  try {
    ingest(getRosterFromStorage());
  } catch {}
  ingest(HSPD_OFFICIAL_ROSTER);

  const usedNumbers = new Set<number>();
  const usedBadgeStrings = new Set<string>();

  allOfficers.forEach(o => {
    if (!o.badge) return;
    const norm = normalizeBadgeFormat(o.badge);
    if (norm.numericValue !== null) {
      usedNumbers.add(norm.numericValue);
    }
    if (norm.formattedBadge) {
      usedBadgeStrings.add(norm.formattedBadge.toLowerCase());
    }
    usedBadgeStrings.add(o.badge.toLowerCase().trim());
  });

  const formatBadge = (num: number, minDigits: number = 3, prefix: string = '#'): string => {
    const padded = String(num).padStart(Math.max(minDigits, 3), '0');
    return prefix ? `${prefix}${padded}` : `#${padded}`;
  };

  // =========================================================================
  // PRIORITY 1: Follow directly from previousBadge if provided
  // Example: #004 -> #005, #005 -> #006, #040 -> #041, #100 -> #101
  // =========================================================================
  if (previousBadge && previousBadge.trim() !== '' && previousBadge.trim() !== '#') {
    const rawTrimmed = previousBadge.trim();
    // Match trailing numbers: e.g. "#004" -> prefix="#", digits="004"
    const trailingMatch = rawTrimmed.match(/^(.*?)(\d+)$/);
    if (trailingMatch) {
      const prefix = trailingMatch[1] || '#';
      const digits = trailingMatch[2];
      const padLen = Math.max(prefix === '#' ? 3 : digits.length, digits.length, 3);
      const parsedNum = parseInt(digits, 10);
      let candidateNum = parsedNum + 1;

      let candidateStr = `${prefix}${String(candidateNum).padStart(padLen, '0')}`;
      while (
        usedNumbers.has(candidateNum) ||
        usedBadgeStrings.has(candidateStr.toLowerCase()) ||
        usedBadgeStrings.has(String(candidateNum))
      ) {
        candidateNum++;
        candidateStr = `${prefix}${String(candidateNum).padStart(padLen, '0')}`;
      }
      return candidateStr;
    }

    const normPrev = normalizeBadgeFormat(rawTrimmed);
    if (normPrev.numericValue !== null) {
      let candidateNum = normPrev.numericValue + 1;
      while (
        usedNumbers.has(candidateNum) ||
        usedBadgeStrings.has(formatBadge(candidateNum).toLowerCase()) ||
        usedBadgeStrings.has(String(candidateNum))
      ) {
        candidateNum++;
      }
      return formatBadge(candidateNum);
    }
  }

  // =========================================================================
  // PRIORITY 2: Rank-based determination
  // =========================================================================
  const upperRank = (rank || '').toUpperCase();

  let minRange = 4;
  let maxRange = 99;
  let defaultBase = 4;

  if (upperRank.includes('CADET') || upperRank.includes('CDT')) {
    minRange = 4; // #001..#003 are High Command (Chief & Deputy Chiefs)
    maxRange = 99;
    defaultBase = 4;
  } else if (upperRank.includes('POLICE OFFICER I') || upperRank.includes('PO I')) {
    minRange = 100;
    maxRange = 199;
    defaultBase = 101;
  } else if (upperRank.includes('POLICE OFFICER II') || upperRank.includes('PO II')) {
    minRange = 200;
    maxRange = 249;
    defaultBase = 201;
  } else if (upperRank.includes('POLICE OFFICER III') || upperRank.includes('PO III') || upperRank.includes('SLO') || upperRank.includes('SENIOR LEAD')) {
    minRange = 250;
    maxRange = 299;
    defaultBase = 251;
  } else if (upperRank.includes('SERGEANT') || upperRank.includes('SGT')) {
    minRange = 300;
    maxRange = 399;
    defaultBase = 301;
  } else if (upperRank.includes('LIEUTENANT') || upperRank.includes('LT')) {
    minRange = 410;
    maxRange = 499;
    defaultBase = 411;
  } else if (upperRank.includes('CAPTAIN') || upperRank.includes('CPT')) {
    minRange = 400;
    maxRange = 409;
    defaultBase = 401;
  } else if (upperRank.includes('DETECTIVE') || upperRank.includes('CID')) {
    minRange = 500;
    maxRange = 599;
    defaultBase = 501;
  } else if (upperRank.includes('CHIEF') || upperRank.includes('COMMANDER') || upperRank.includes('COP') || upperRank.includes('D/C') || upperRank.includes('A/C')) {
    minRange = 1;
    maxRange = 99;
    defaultBase = 4;
  }

  // Scan pool to find highest existing number among officers OF THIS RANK
  let maxFoundInRankRange = 0;
  allOfficers.forEach(o => {
    if (!o.badge) return;
    const offRank = (o.rank || '').toUpperCase();
    // Only consider officers that belong to this rank category or within range
    const isSameRankCategory = 
      (upperRank.includes('CADET') && (offRank.includes('CADET') || offRank.includes('CDT'))) ||
      (upperRank.includes('PO I') && offRank.includes('PO I')) ||
      (upperRank.includes('PO II') && offRank.includes('PO II')) ||
      (upperRank.includes('PO III') && offRank.includes('PO III')) ||
      (upperRank.includes('SERGEANT') && offRank.includes('SERGEANT')) ||
      (upperRank.includes('LIEUTENANT') && offRank.includes('LIEUTENANT')) ||
      (upperRank.includes('CAPTAIN') && offRank.includes('CAPTAIN')) ||
      (upperRank.includes('DETECTIVE') && offRank.includes('DETECTIVE'));

    const norm = normalizeBadgeFormat(o.badge);
    if (norm.numericValue !== null) {
      const num = norm.numericValue;
      if (isSameRankCategory && num >= minRange && num <= maxRange) {
        if (num > maxFoundInRankRange) {
          maxFoundInRankRange = num;
        }
      }
    }
  });

  // Calculate starting candidate number:
  let candidateNum = maxFoundInRankRange > 0 ? maxFoundInRankRange + 1 : defaultBase;

  // Ensure no collisions with ANY existing officer (new, old, or discharged)
  while (
    usedNumbers.has(candidateNum) ||
    usedBadgeStrings.has(formatBadge(candidateNum).toLowerCase()) ||
    usedBadgeStrings.has(String(candidateNum))
  ) {
    candidateNum++;
  }

  return formatBadge(candidateNum);
}

