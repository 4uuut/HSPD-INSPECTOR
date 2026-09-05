import { OfficerAccount, isAtasanRank } from '../types';
import { getDischargedOfficers, isOfficerDischarged, DischargedOfficerEntry } from '../utils/dischargeStorage';

export const HSPD_OFFICIAL_ROSTER: OfficerAccount[] = [
  // ==========================================
  // [COMMAND STAFF // RANK 6]
  // ==========================================
  {
    id: 'roster-jackie-xianlao-001',
    name: 'Jackie Xianlao',
    badge: '#001',
    rank: 'CHIEF OF POLICE [COP]',
    division: 'Executive Office / High Command',
    pin: '846201',
    phone: '555-0001',
    registeredAt: Date.now() - 86400000 * 90,
    promotedBy: 'SK Pengangkatan Markas Besar Kepolisian High State'
  },

  // ==========================================
  // [EXECUTIVE STAFF // RANK 5]
  // ==========================================
  {
    id: 'roster-damz-askara-002',
    name: 'Damz Askara',
    badge: '#002',
    rank: 'DEPUTY CHIEF [D/C]',
    division: 'High Command Staff / Executive Office',
    pin: '201982',
    phone: '555-0002',
    registeredAt: Date.now() - 86400000 * 75,
    promotedBy: 'SK Kepolisian HighState / Chief of Police'
  },
  {
    id: 'roster-wilona-costelo-003',
    name: 'Wilona Costelo',
    badge: '#003',
    rank: 'DEPUTY CHIEF [D/C]',
    division: 'High Command Staff / Executive Office',
    pin: '203841',
    phone: '555-0003',
    registeredAt: Date.now() - 86400000 * 70,
    promotedBy: 'SK Kepolisian HighState / Chief of Police'
  },

  // ==========================================
  // [FIELD COMMAND // RANK 4]
  // ==========================================
  {
    id: 'roster-matteo-stratton-401',
    name: 'Matteo Stratton',
    badge: '#401',
    rank: 'CAPTAIN [CPT]',
    division: 'Field Command Bureau',
    pin: '40101',
    phone: '555-0401',
    registeredAt: Date.now() - 86400000 * 50,
    promotedBy: 'High Command Executive Staff'
  },
  {
    id: 'roster-drego-tadashima-402',
    name: 'Drego Tadashima',
    badge: '#402',
    rank: 'CAPTAIN [CPT]',
    division: 'Field Command Bureau',
    pin: '40202',
    phone: '555-0402',
    registeredAt: Date.now() - 86400000 * 48,
    promotedBy: 'High Command Executive Staff'
  },
  {
    id: 'roster-ezio-silliwangi-403',
    name: 'Ezio Silliwangi',
    badge: '#403',
    rank: 'CAPTAIN [CPT]',
    division: 'Field Command Bureau',
    pin: '40303',
    phone: '555-0403',
    registeredAt: Date.now() - 86400000 * 45,
    promotedBy: 'High Command Executive Staff'
  },
  {
    id: 'roster-deren-askara-411',
    name: 'Deren Askara',
    badge: '#411',
    rank: 'LIEUTENANT II [LT II]',
    division: 'Field Training & Operations',
    pin: '41101',
    phone: '555-0411',
    registeredAt: Date.now() - 86400000 * 40,
    promotedBy: 'High Command Executive Staff'
  },
  {
    id: 'roster-grakiel-romanov-421',
    name: 'Grakiel Romanov',
    badge: '#421',
    rank: 'LIEUTENANT I [LT I]',
    division: 'Patrol Operations Bureau',
    pin: '42101',
    phone: '555-0421',
    registeredAt: Date.now() - 86400000 * 38,
    promotedBy: 'High Command Executive Staff'
  },
];

/**
 * Merges any incoming roster array (from localStorage or Firestore realtime)
 * with the official 56+ department officers so no official roster member is ever lost,
 * and user changes (especially PIN updates and promotions) are completely preserved.
 */
export function mergeWithOfficialRoster(
  incoming: OfficerAccount[] = [],
  dischargedOverride?: DischargedOfficerEntry[]
): OfficerAccount[] {
  // Read list of discharged/pecat officers so they are never resurrected
  const dischargedList = dischargedOverride || getDischargedOfficers();

  // Canonical registry map: canonicalKey -> OfficerAccount
  const officersMap = new Map<string, OfficerAccount>();

  const getCanonicalKey = (officer: Partial<OfficerAccount>): string => {
    if (officer.id) return officer.id.toLowerCase().trim();
    if (officer.badge) {
      const cleanDigits = officer.badge.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
      if (cleanDigits) return `badge_${cleanDigits}`;
    }
    if (officer.name) return `name_${officer.name.toLowerCase().trim().replace(/\s+/g, '_')}`;
    return `item_${Math.random()}`;
  };

  // 1. Seed with official officers ONLY IF THEY ARE NOT DISCHARGED
  HSPD_OFFICIAL_ROSTER.forEach(official => {
    if (isOfficerDischarged(official, dischargedList)) {
      return; // Do NOT seed discharged officer
    }
    const key = getCanonicalKey(official);
    officersMap.set(key, { ...official });
  });

  // 2. Helper to find existing officer by ID, Badge, or Name
  const findExistingKey = (item: OfficerAccount): string | null => {
    const cleanId = item.id ? item.id.toLowerCase().trim() : '';
    const cleanBadge = (item.badge || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
    const cleanName = (item.name || '').toLowerCase().trim();

    const normalizeName = (n: string) => {
      return n.toLowerCase()
        .replace(/\(.*?\)/g, '') // remove parenthesized remarks like (WARN 2), (Special Guest)
        .replace(/[^a-z0-9]/g, '')
        .trim();
    };
    const normCleanName = normalizeName(cleanName);

    for (const [key, existing] of officersMap.entries()) {
      if (cleanId && existing.id && existing.id.toLowerCase().trim() === cleanId) {
        return key;
      }
      const existingBadgeDigits = (existing.badge || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
      if (cleanBadge && existingBadgeDigits && cleanBadge === existingBadgeDigits) {
        return key;
      }

      // CRITICAL GUARD: If both records have badge numbers and they do not match,
      // they CANNOT be the same officer! (e.g. Officer #217 is NOT Officer #101)
      if (cleanBadge && existingBadgeDigits && cleanBadge !== existingBadgeDigits) {
        continue;
      }

      const existingName = (existing.name || '').toLowerCase().trim();
      if (cleanName && (cleanName === existingName || cleanName.replace(/\s+/g, '') === existingName.replace(/\s+/g, ''))) {
        return key;
      }
      if (normCleanName && normCleanName === normalizeName(existingName)) {
        return key;
      }
      // Only handle typo aliases when BOTH tokens of the specific officer name are present
      // (e.g. "Leoanrd Neave" vs "Leonard Neave" #101) - never cross-match different officers!
      if (cleanName && cleanName.includes('neave') && existingName.includes('neave')) {
        return key;
      }
    }
    return null;
  };

  // 3. Overlay incoming records (filtering out any discharged officer)
  if (Array.isArray(incoming)) {
    incoming.forEach(item => {
      if (!item || isOfficerDischarged(item, dischargedList)) return;
      const existingKey = findExistingKey(item);

      if (existingKey && officersMap.has(existingKey)) {
        const existing = officersMap.get(existingKey)!;
        const updated: OfficerAccount = {
          ...existing,
          ...item,
          name: item.name || existing.name,
          badge: existing.badge || item.badge, // preserve official badge format
          rank: item.rank || existing.rank,
          division: item.division || existing.division,
          // CRITICAL: user's PIN modification is strictly preserved
          pin: (item.pin !== undefined && String(item.pin).trim() !== '') ? String(item.pin).trim() : existing.pin,
          phone: item.phone || existing.phone,
          // CRITICAL: Discord Tag & Target User ID strictly preserved
          discordTag: (item.discordTag !== undefined && item.discordTag !== null && String(item.discordTag).trim() !== '') 
            ? String(item.discordTag).trim() 
            : existing.discordTag,
          promotedBy: item.promotedBy || existing.promotedBy,
          warnings: Array.isArray(item.warnings) && item.warnings.length > 0 ? item.warnings : (existing.warnings || []),
          _updatedAt: item._updatedAt || Date.now()
        };
        officersMap.set(existingKey, updated);
      } else {
        // Only accept if officer is an Atasan rank OR newly registered from Discord
        // Old static subordinate officers (PO I, PO II, PO III, SGT, Cadet) are discarded
        const isAtasan = isAtasanRank(item.rank);
        const isNewlyDiscordRegistered = Boolean(
          (item.promotedBy?.includes('Discord') || item.discordTag) &&
          (item.registeredAt ? item.registeredAt > 1788632600000 : false)
        );

        if (isAtasan || isNewlyDiscordRegistered) {
          const newKey = getCanonicalKey(item);
          officersMap.set(newKey, {
            ...item,
            pin: item.pin ? String(item.pin).trim() : '10-4',
            discordTag: item.discordTag ? String(item.discordTag).trim() : undefined,
            warnings: item.warnings || []
          });
        }
      }
    });
  }

  // 4. Return unique set of officers in deterministic order
  const uniqueOfficers = Array.from(officersMap.values());
  
  // Keep official ordering at top, followed by any custom officers
  const officialBadgeOrder = new Map<string, number>();
  HSPD_OFFICIAL_ROSTER.forEach((off, idx) => {
    const cleanDigits = off.badge.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
    officialBadgeOrder.set(cleanDigits, idx);
  });

  return uniqueOfficers.sort((a, b) => {
    const digitsA = (a.badge || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
    const digitsB = (b.badge || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
    const idxA = officialBadgeOrder.has(digitsA) ? officialBadgeOrder.get(digitsA)! : 9999;
    const idxB = officialBadgeOrder.has(digitsB) ? officialBadgeOrder.get(digitsB)! : 9999;
    if (idxA !== idxB) return idxA - idxB;
    return (b.registeredAt || 0) - (a.registeredAt || 0);
  });
}

