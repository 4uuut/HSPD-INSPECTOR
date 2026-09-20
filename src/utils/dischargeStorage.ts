import { OfficerAccount } from '../types';
import { pushToFirestore, deleteFromFirestore } from '../services/firebaseRealtimeSync';

export interface DischargedOfficerEntry {
  id: string;
  badge: string;
  name: string;
  rank?: string;
  division?: string;
  reason: string;
  dischargedAt: number;
  dischargedBy?: string;
  dischargedByBadge?: string;
  dischargedByRank?: string;
}

export interface PurgedOfficerRecord {
  id?: string;
  badge?: string;
  name?: string;
  purgedAt: number;
}

export const DISCHARGED_STORAGE_KEY = 'hspd_discharged_officers_v1';
export const DISCHARGED_STORAGE_BACKUP_KEY = 'hspd_discharged_officers_backup';
export const PURGED_OFFICERS_STORAGE_KEY = 'hspd_permanently_purged_officers_v1';

function normalizeBadge(badge: string): string {
  return (badge || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
}

function normalizeName(name: string): string {
  return (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Get all permanently purged officer records (officers whose records were erased permanently).
 * These officers must NEVER be seeded or brought back to the active roster.
 */
export function getPermanentlyPurgedOfficers(): PurgedOfficerRecord[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(PURGED_OFFICERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return [];
}

/**
 * Mark an officer as permanently purged from the police department.
 */
export function addPermanentlyPurgedOfficer(officer: { id?: string; badge?: string; name?: string }): void {
  if (!officer) return;
  const targetId = (officer.id || '').trim();
  const targetName = (officer.name || '').trim();
  const targetBadge = (officer.badge || '').trim();
  if (!targetId && !targetName && !targetBadge) return;

  // Protect Chief of Police Jackie Xianlao
  if (normalizeName(targetName).includes('jackie')) return;

  try {
    const list = getPermanentlyPurgedOfficers();
    const cleanName = normalizeName(targetName);
    const cleanId = targetId.toLowerCase();

    const exists = list.some(item => {
      if (cleanId && item.id && item.id.toLowerCase() === cleanId) return true;
      if (cleanName && item.name && normalizeName(item.name) === cleanName) return true;
      return false;
    });

    if (!exists) {
      const updated = [
        ...list,
        {
          id: targetId || undefined,
          name: targetName || undefined,
          badge: targetBadge || undefined,
          purgedAt: Date.now()
        }
      ];
      localStorage.setItem(PURGED_OFFICERS_STORAGE_KEY, JSON.stringify(updated));
      pushToFirestore('SYSTEM_CONFIGS', {
        id: 'purged_officers',
        key: 'purged_officers',
        data: { list: updated },
        updatedAt: Date.now()
      }).catch(() => {});
    }
  } catch {}
}

/**
 * Check if an officer was permanently purged.
 * Matches strictly by permanent ID or IC Name.
 * NEVER matches solely by badge so that the badge can be freely reassigned to another person.
 */
export function isOfficerPermanentlyPurged(
  officer: { id?: string; badge?: string; name?: string },
  purgedList?: PurgedOfficerRecord[]
): boolean {
  if (!officer) return false;
  const targetId = (officer.id || '').toLowerCase().trim();
  const targetName = normalizeName(officer.name || '');

  if (targetName.includes('jackie xianlao') || targetName === 'jackie' || targetId.includes('jackie-xianlao')) {
    return false;
  }

  const list = purgedList || getPermanentlyPurgedOfficers();
  if (!list || list.length === 0) return false;

  for (const item of list) {
    if (targetId && item.id && item.id.toLowerCase().trim() === targetId) {
      return true;
    }
    const itemName = normalizeName(item.name || '');
    if (targetName && itemName) {
      if (targetName === itemName) return true;
      if (targetName.replace(/\s+/g, '') === itemName.replace(/\s+/g, '')) return true;
    }
  }
  return false;
}

/**
 * Get all discharged officer records from local storage.
 */
export function getDischargedOfficers(): DischargedOfficerEntry[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(DISCHARGED_STORAGE_KEY) || localStorage.getItem(DISCHARGED_STORAGE_BACKUP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Auto-heal / restore Jackie Xianlao if previously accidentally added
        const cleaned = parsed.filter(item => {
          const n = normalizeName(item.name || '');
          const id = (item.id || '').toLowerCase().trim();
          if (n.includes('jackie') || id.includes('jackie')) {
            return false;
          }
          return true;
        });
        if (cleaned.length !== parsed.length) {
          saveDischargedOfficers(cleaned, true);
        }
        return cleaned;
      }
    }
  } catch (err) {
    console.error('Failed to parse discharged officers from storage', err);
  }
  return [];
}

/**
 * Persist the discharged officers list to local storage and push to Cloud Firestore.
 */
export function saveDischargedOfficers(list: DischargedOfficerEntry[], syncToCloud = true): void {
  try {
    const serialized = JSON.stringify(list);
    localStorage.setItem(DISCHARGED_STORAGE_KEY, serialized);
    localStorage.setItem(DISCHARGED_STORAGE_BACKUP_KEY, serialized);
    window.dispatchEvent(new CustomEvent('hspd-discharged-updated', { detail: list }));

    if (syncToCloud) {
      pushToFirestore('SYSTEM_CONFIGS', {
        id: 'discharged_officers',
        key: 'discharged_officers',
        data: { list },
        updatedAt: Date.now()
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Failed to save discharged officers to storage', err);
  }
}

/**
 * Checks if a given officer has been officially discharged/pecat.
 * Matches by officer ID, badge number (normalizing digits), or officer full name.
 * If names differ, does NOT match by badge alone to allow badge reuse!
 */
export function isOfficerDischarged(
  officer: { id?: string; badge?: string; name?: string },
  list?: DischargedOfficerEntry[]
): boolean {
  if (!officer) return false;

  const targetId = (officer.id || '').toLowerCase().trim();
  const targetBadge = normalizeBadge(officer.badge || '');
  const targetName = normalizeName(officer.name || '');

  // CRITICAL IMMUNITY: Chief of Police Jackie Xianlao is active High Command and must NEVER be marked as discharged
  if (
    targetName.includes('jackie xianlao') ||
    targetName === 'jackie' ||
    targetId.includes('jackie-xianlao')
  ) {
    return false;
  }

  const dischargedList = list || getDischargedOfficers();
  if (!dischargedList || dischargedList.length === 0) return false;

  for (const entry of dischargedList) {
    // 1. Direct ID match
    if (targetId && entry.id && entry.id.toLowerCase().trim() === targetId) {
      return true;
    }

    // 2. Name match (case-insensitive & trimmed)
    const entryName = normalizeName(entry.name);
    if (targetName && entryName) {
      if (targetName === entryName) return true;
      if (targetName.replace(/\s+/g, '') === entryName.replace(/\s+/g, '')) return true;
    }

    // 3. Badge digit match (e.g. '#002' equals '002' or '2')
    // CRITICAL: Only match badge if names are NOT conflicting!
    // If a new or existing officer with a different name uses this badge, they are NOT discharged!
    const hasConflictingNames = Boolean(
      entryName && targetName &&
      entryName !== targetName &&
      !entryName.includes(targetName) &&
      !targetName.includes(entryName)
    );

    if (!hasConflictingNames) {
      const entryBadge = normalizeBadge(entry.badge);
      if (targetBadge && entryBadge) {
        if (targetBadge === entryBadge) return true;
        const numTarget = parseInt(targetBadge, 10);
        const numEntry = parseInt(entryBadge, 10);
        if (!isNaN(numTarget) && !isNaN(numEntry) && numTarget === numEntry) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Record a new officer discharge / pemecatan.
 * Adds to the discharged officers archive and ensures they cannot be resurrected by official seeds.
 */
export function recordOfficerDischarge(entry: DischargedOfficerEntry): DischargedOfficerEntry[] {
  const current = getDischargedOfficers();
  // Filter out duplicate existing entries for the same badge/id
  const filtered = current.filter(item => !isOfficerDischarged(item, [entry]));
  const updated = [entry, ...filtered];
  saveDischargedOfficers(updated, true);
  return updated;
}

/**
 * Restore / Re-hire a previously discharged officer (removes from blacklist).
 */
export function restoreDischargedOfficer(identifier: string): DischargedOfficerEntry[] {
  const current = getDischargedOfficers();
  const cleanId = identifier.trim().toLowerCase();
  const cleanBadge = normalizeBadge(identifier);

  const updated = current.filter(item => {
    if (item.id && item.id.toLowerCase() === cleanId) return false;
    if (normalizeBadge(item.badge) === cleanBadge) return false;
    if (normalizeName(item.name) === cleanId) return false;
    return true;
  });

  saveDischargedOfficers(updated, true);
  return updated;
}

/**
 * Delete a specific discharged officer record from history/archive.
 * CRITICAL FIX: When deleting history, the officer is PERMANENTLY purged.
 * Their record is NOT moved back to active roster; they are added to permanently purged
 * so that official roster baseline seeds NEVER re-add them.
 */
export function deleteDischargedOfficerHistory(target: string | DischargedOfficerEntry): DischargedOfficerEntry[] {
  const current = getDischargedOfficers();
  let targetId = '';
  let targetBadge = '';
  let targetName = '';

  let matchedEntry: DischargedOfficerEntry | undefined;

  if (typeof target === 'object' && target !== null) {
    targetId = (target.id || '').trim().toLowerCase();
    targetBadge = normalizeBadge(target.badge || '');
    targetName = normalizeName(target.name || '');
    matchedEntry = target;
  } else {
    const str = typeof target === 'string' ? target : '';
    targetId = str.trim().toLowerCase();
    targetBadge = normalizeBadge(str);
    targetName = normalizeName(str);
  }

  const updated = current.filter(item => {
    const isIdMatch = Boolean(targetId && item.id && item.id.toLowerCase() === targetId);
    const isBadgeMatch = Boolean(targetBadge && normalizeBadge(item.badge) === targetBadge);
    const isNameMatch = Boolean(targetName && normalizeName(item.name) === targetName);

    if (isIdMatch || (isBadgeMatch && isNameMatch) || (isNameMatch && !targetBadge)) {
      if (!matchedEntry) matchedEntry = item;
      return false;
    }
    return true;
  });

  // Save updated discharged list
  saveDischargedOfficers(updated, true);

  // Permanently purge so baseline seeds never recreate this officer
  const purgePayload = {
    id: matchedEntry?.id || targetId || undefined,
    badge: matchedEntry?.badge || targetBadge || undefined,
    name: matchedEntry?.name || targetName || undefined
  };
  addPermanentlyPurgedOfficer(purgePayload);

  // Delete from Cloud Firestore ROSTER collection
  if (purgePayload.id) {
    deleteFromFirestore('ROSTER', purgePayload.id).catch(() => {});
  }
  if (purgePayload.badge) {
    const cleanB = normalizeBadge(purgePayload.badge);
    deleteFromFirestore('ROSTER', `officer_${cleanB}`).catch(() => {});
    deleteFromFirestore('ROSTER', cleanB).catch(() => {});
  }

  // Remove from all local roster storage keys
  const ROSTER_KEYS = ['hspd_roster_database_v5', 'hspd_roster_database_v4', 'hspd_roster_database_v3', 'hspd_roster_database_v2', 'hspd_roster_accounts_v1'];
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    ROSTER_KEYS.forEach(key => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const filteredRoster = parsed.filter((o: any) => {
              if (purgePayload.id && o.id && o.id.toLowerCase() === purgePayload.id.toLowerCase()) return false;
              if (purgePayload.name && o.name && normalizeName(o.name) === normalizeName(purgePayload.name)) return false;
              return true;
            });
            localStorage.setItem(key, JSON.stringify(filteredRoster));
          }
        }
      } catch {}
    });
    window.dispatchEvent(new Event('hspd-roster-updated'));
  }

  return updated;
}

/**
 * Clear all discharged officer history records from the archive permanently.
 * All currently discharged officers are moved to permanently purged so they never reappear in roster.
 */
export function clearAllDischargedOfficersHistory(): DischargedOfficerEntry[] {
  const current = getDischargedOfficers();
  current.forEach(item => {
    addPermanentlyPurgedOfficer(item);
    if (item.id) deleteFromFirestore('ROSTER', item.id).catch(() => {});
    if (item.badge) {
      const cleanB = normalizeBadge(item.badge);
      deleteFromFirestore('ROSTER', `officer_${cleanB}`).catch(() => {});
    }
  });

  saveDischargedOfficers([], true);
  return [];
}

