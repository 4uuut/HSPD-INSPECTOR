import { OfficerAccount } from '../types';
import { pushToFirestore } from '../services/firebaseRealtimeSync';

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

export const DISCHARGED_STORAGE_KEY = 'hspd_discharged_officers_v1';
export const DISCHARGED_STORAGE_BACKUP_KEY = 'hspd_discharged_officers_backup';

function normalizeBadge(badge: string): string {
  return (badge || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
}

function normalizeName(name: string): string {
  return (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Get all discharged officer records from local storage.
 */
export function getDischargedOfficers(): DischargedOfficerEntry[] {
  try {
    const raw = localStorage.getItem(DISCHARGED_STORAGE_KEY) || localStorage.getItem(DISCHARGED_STORAGE_BACKUP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
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
 */
export function isOfficerDischarged(
  officer: { id?: string; badge?: string; name?: string },
  list?: DischargedOfficerEntry[]
): boolean {
  if (!officer) return false;
  const dischargedList = list || getDischargedOfficers();
  if (!dischargedList || dischargedList.length === 0) return false;

  const targetId = (officer.id || '').toLowerCase().trim();
  const targetBadge = normalizeBadge(officer.badge || '');
  const targetName = normalizeName(officer.name || '');

  for (const entry of dischargedList) {
    // 1. Direct ID match
    if (targetId && entry.id && entry.id.toLowerCase().trim() === targetId) {
      return true;
    }

    // 2. Badge digit match (e.g. '#002' equals '002' or '2')
    const entryBadge = normalizeBadge(entry.badge);
    if (targetBadge && entryBadge) {
      if (targetBadge === entryBadge) return true;
      const numTarget = parseInt(targetBadge, 10);
      const numEntry = parseInt(entryBadge, 10);
      if (!isNaN(numTarget) && !isNaN(numEntry) && numTarget === numEntry) {
        return true;
      }
    }

    // 3. Name match (case-insensitive & trimmed)
    const entryName = normalizeName(entry.name);
    if (targetName && entryName) {
      if (targetName === entryName) return true;
      if (targetName.replace(/\s+/g, '') === entryName.replace(/\s+/g, '')) return true;
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
