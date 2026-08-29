import { OfficerAccount } from '../types';

/**
 * Calculates the next available badge number for a given rank or general sequence,
 * ensuring no duplicate badges and following HSPD departmental numbering conventions.
 * 
 * HSPD Department Conventions:
 * - High Command (001 - 003)
 * - Cadets / Recruit Academy (004 - 099, starts at 030+ for new recruits)
 * - Police Officer I (101 - 199, starts at 131+)
 * - Police Officer II (201 - 249, starts at 202+)
 * - Police Officer III / SLO (250 - 299)
 * - Sergeants (301 - 399, starts at 316+)
 * - Field Command / Captains / Lieutenants (401 - 499, starts at 422+)
 * - Detective Bureau / CID (501 - 599)
 */
export function getNextAvailableBadge(roster: OfficerAccount[] = [], rank: string = 'CADET [CDT]'): string {
  const existingBadgesLower = new Set(
    roster.map(o => (o.badge || '').toLowerCase().trim())
  );

  const upperRank = (rank || '').toUpperCase();

  let minRange = 1;
  let maxRange = 99;
  let defaultBase = 30; // Cadet official roster currently ends at #029 (Omar Bradley)

  if (upperRank.includes('CADET') || upperRank.includes('CDT')) {
    minRange = 4;
    maxRange = 99;
    defaultBase = 30;
  } else if (upperRank.includes('POLICE OFFICER I') || upperRank.includes('PO I')) {
    minRange = 100;
    maxRange = 199;
    defaultBase = 131; // PO I ends at #130
  } else if (upperRank.includes('POLICE OFFICER II') || upperRank.includes('PO II')) {
    minRange = 200;
    maxRange = 249;
    defaultBase = 202;
  } else if (upperRank.includes('POLICE OFFICER III') || upperRank.includes('PO III') || upperRank.includes('SLO') || upperRank.includes('SENIOR LEAD')) {
    minRange = 250;
    maxRange = 299;
    defaultBase = 251;
  } else if (upperRank.includes('SERGEANT') || upperRank.includes('SGT')) {
    minRange = 300;
    maxRange = 399;
    defaultBase = 316; // Sergeants end at #315
  } else if (upperRank.includes('LIEUTENANT') || upperRank.includes('LT')) {
    minRange = 410;
    maxRange = 499;
    defaultBase = 422;
  } else if (upperRank.includes('CAPTAIN') || upperRank.includes('CPT')) {
    minRange = 400;
    maxRange = 409;
    defaultBase = 404;
  } else if (upperRank.includes('DETECTIVE') || upperRank.includes('CID')) {
    minRange = 500;
    maxRange = 599;
    defaultBase = 501;
  } else if (upperRank.includes('CHIEF') || upperRank.includes('COMMANDER') || upperRank.includes('COP') || upperRank.includes('D/C') || upperRank.includes('A/C')) {
    minRange = 1;
    maxRange = 99;
    defaultBase = 4;
  } else {
    // Default fallback
    minRange = 1;
    maxRange = 99;
    defaultBase = 30;
  }

  // Scan roster to find highest existing number within this rank category
  let maxFound = 0;
  roster.forEach(o => {
    if (!o.badge) return;
    const clean = o.badge.replace(/^#/, '').trim();
    const match = clean.match(/^\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num >= minRange && num <= maxRange) {
        if (num > maxFound) {
          maxFound = num;
        }
      }
    }
  });

  // Calculate starting candidate number
  let candidateNum = maxFound > 0 ? maxFound + 1 : defaultBase;

  const formatBadge = (num: number): string => {
    return `#${String(num).padStart(3, '0')}`;
  };

  // Ensure no collisions with any existing officer
  while (existingBadgesLower.has(formatBadge(candidateNum).toLowerCase())) {
    candidateNum++;
  }

  return formatBadge(candidateNum);
}
