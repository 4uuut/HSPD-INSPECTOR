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

  // 2. Helper to find existing officer by ID, Name, or Badge
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
      // 1. Direct ID match
      if (cleanId && existing.id && existing.id.toLowerCase().trim() === cleanId) {
        return key;
      }

      const existingName = (existing.name || '').toLowerCase().trim();
      const existingNormName = normalizeName(existingName);

      // 2. NAME MATCH (HIGHEST PRIORITY FOR IC IDENTITY):
      // An IC officer is uniquely identified by their character name.
      // If the name matches, it IS the same officer, even if their badge number was changed/re-assigned!
      if (cleanName && existingName) {
        if (cleanName === existingName || cleanName.replace(/\s+/g, '') === existingName.replace(/\s+/g, '')) {
          return key;
        }
        if (normCleanName && normCleanName.length >= 4 && normCleanName === existingNormName) {
          return key;
        }
      }

      // Typo alias check for specific officers
      if (cleanName && cleanName.includes('neave') && existingName.includes('neave')) {
        return key;
      }

      // 3. BADGE MATCH:
      // If badge numbers match exactly, and names do not conflict with two completely different names
      const existingBadgeDigits = (existing.badge || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
      if (cleanBadge && existingBadgeDigits && cleanBadge === existingBadgeDigits) {
        if (!cleanName || !existingName || cleanName === existingName || normCleanName === existingNormName) {
          return key;
        }
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
          badge: item.badge || existing.badge, // CRITICAL: use updated badge if provided (e.g. #002)
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
        // Exclude old hardcoded mock names that were purged
        const normName = (item.name || '').toLowerCase().trim();
        const isOldMock = [
          'alvert canizares', 'bian alexander', 'boris layasa', 'briella bimantara',
          'carlos gallarado', 'cecep alexsander', 'corvin gravermourn', 'dadang darmawan',
          'dendi pablo', 'edes fernandes', 'eiser romanov', 'eliel gravermourn',
          'gerry roach', 'gondrong carregado', 'gorgon xianlao', 'jack kingston',
          'jalisco michoacana', 'jeesyln claurissa', 'jems giantenk', 'jimmy hops',
          'jon oliver', 'keii claude', 'kenzo velows', 'kyle satorue', 'kyloo askara',
          'leoanrd neave', 'lexa arvella', 'luix ziyen', 'luna haller', 'marchel leonerd',
          'michaell anderson', 'moeses clausius', 'moji junior', 'morale lammar',
          'omar bradley', 'oscar hernandez', 'peter schmaicel', 'rafa gharui',
          'rafferty linnix', 'ramsey beningthon', 'rejjie kei', 'rize izumi',
          'shalom cuirras', 'shiko alexanderz', 'stephen oscar', 'syns askara',
          'theo leviathan', 'thomas olise', 'udin phystachio', 'van tamayuki',
          'viggo bonapattem', 'wesley gravemourn', 'yukai escobar', 'zaydan kusuma', 'zayy choper'
        ].includes(normName);

        const isLegitNewMember = Boolean(
          (item.registeredAt && item.registeredAt > 1700000000000) ||
          item.promotedBy?.includes('SK Pengangkatan') ||
          item.promotedBy?.includes('High Command') ||
          item.id?.startsWith('roster-') ||
          (item.pin && item.pin !== '10-4')
        );

        if (!isOldMock || isAtasanRank(item.rank) || item.promotedBy?.includes('Discord') || isLegitNewMember) {
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

  // 4. Strict deduplication pass by character name:
  // An officer character name is strictly unique. If two entries share the same normalized name,
  // consolidate into the single most up-to-date entry.
  const nameRegistry = new Map<string, OfficerAccount>();
  for (const officer of officersMap.values()) {
    const normName = (officer.name || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    if (!normName) continue;

    if (nameRegistry.has(normName)) {
      const existing = nameRegistry.get(normName)!;
      const existingTime = existing._updatedAt || existing.registeredAt || 0;
      const curTime = officer._updatedAt || officer.registeredAt || 0;

      // Prefer the more recently updated record or the one with custom user data (discordTag, custom division)
      const preferred = curTime >= existingTime ? { ...existing, ...officer } : { ...officer, ...existing };
      nameRegistry.set(normName, preferred);
    } else {
      nameRegistry.set(normName, officer);
    }
  }

  const uniqueOfficers = Array.from(nameRegistry.values());
  
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

