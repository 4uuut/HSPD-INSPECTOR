import { DutyStatusCode, OfficerAccount } from '../types';
import { pushToFirestore } from '../services/firebaseRealtimeSync';

export interface OfficerDutyState {
  isDuty: boolean;
  dutyStartTime: number;
  dutyStatus: DutyStatusCode;
  officerName?: string;
  officerBadge?: string;
  updatedAt?: number;
}

const REGISTRY_STORAGE_KEY = 'hspd_duty_registry_all_officers_v2';

export function normalizeOfficerIdentifier(badgeOrName: string): string {
  if (!badgeOrName) return 'unknown';
  const clean = badgeOrName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean || 'unknown';
}

export function getOfficerDutyStorageKey(badgeOrName: string): string {
  return `hspd_duty_officer_${normalizeOfficerIdentifier(badgeOrName)}`;
}

/**
 * Loads the complete multi-officer duty registry
 */
export function getAllOfficersDutyRegistry(): Record<string, OfficerDutyState> {
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read all officers duty registry', e);
  }
  return {};
}

/**
 * Retrieves the isolated duty state for a specific officer.
 * Guaranteed not to mix or overwrite states of other officers.
 */
export function getOfficerDutyState(
  badgeOrName: string, 
  roster?: OfficerAccount[],
  officerName?: string
): OfficerDutyState {
  if (!badgeOrName && !officerName) {
    return { isDuty: false, dutyStartTime: 0, dutyStatus: '8-1-0' };
  }

  const key1 = normalizeOfficerIdentifier(badgeOrName);
  const key2 = officerName ? normalizeOfficerIdentifier(officerName) : '';

  // 1. Check registry first
  const registry = getAllOfficersDutyRegistry();
  if (registry[key1]) {
    const entry = registry[key1];
    return {
      isDuty: !!entry.isDuty,
      dutyStartTime: typeof entry.dutyStartTime === 'number' && entry.dutyStartTime > 0 ? entry.dutyStartTime : 0,
      dutyStatus: (entry.dutyStatus as DutyStatusCode) || (entry.isDuty ? '8-1-1' : '8-1-0'),
      officerName: entry.officerName,
      officerBadge: entry.officerBadge,
      updatedAt: entry.updatedAt
    };
  }

  if (key2 && registry[key2]) {
    const entry = registry[key2];
    return {
      isDuty: !!entry.isDuty,
      dutyStartTime: typeof entry.dutyStartTime === 'number' && entry.dutyStartTime > 0 ? entry.dutyStartTime : 0,
      dutyStatus: (entry.dutyStatus as DutyStatusCode) || (entry.isDuty ? '8-1-1' : '8-1-0'),
      officerName: entry.officerName,
      officerBadge: entry.officerBadge,
      updatedAt: entry.updatedAt
    };
  }

  // 2. Check dedicated per-officer localStorage key
  try {
    const individualRaw = localStorage.getItem(getOfficerDutyStorageKey(badgeOrName));
    if (individualRaw) {
      const parsed = JSON.parse(individualRaw);
      return {
        isDuty: !!parsed.isDuty,
        dutyStartTime: typeof parsed.dutyStartTime === 'number' && parsed.dutyStartTime > 0 ? parsed.dutyStartTime : 0,
        dutyStatus: (parsed.dutyStatus as DutyStatusCode) || (parsed.isDuty ? '8-1-1' : '8-1-0'),
        officerName: parsed.officerName,
        officerBadge: parsed.officerBadge
      };
    }
  } catch (e) {
    console.error('Failed to read individual officer duty key', e);
  }

  // 3. Fallback to roster account property if present
  if (roster && Array.isArray(roster)) {
    const cleanBadge = (badgeOrName || '').toLowerCase().replace(/#/g, '');
    const cleanName = (officerName || badgeOrName || '').toLowerCase();
    
    const found = roster.find(r => 
      r.badge.toLowerCase().replace(/#/g, '') === cleanBadge ||
      r.name.toLowerCase() === cleanName ||
      (r.name && cleanName && r.name.toLowerCase().includes(cleanName))
    );
    if (found && typeof found.isDuty === 'boolean') {
      return {
        isDuty: found.isDuty,
        dutyStartTime: found.dutyStartTime || 0,
        dutyStatus: (found.dutyStatus as DutyStatusCode) || (found.isDuty ? '8-1-1' : '8-1-0'),
        officerName: found.name,
        officerBadge: found.badge
      };
    }
  }

  // Default state for officer: not on duty until they turn it on
  return {
    isDuty: false,
    dutyStartTime: 0,
    dutyStatus: '8-1-0'
  };
}

/**
 * Saves the duty state strictly isolated for the specified officer.
 * Ensures other officers remain in their respective states and timers without interference.
 */
export function saveOfficerDutyState(
  badgeOrName: string, 
  stateOrIsDuty: OfficerDutyState | boolean,
  dutyStartTime?: number,
  dutyStatus?: DutyStatusCode | string,
  officerName?: string
) {
  if (!badgeOrName && !officerName) return;

  const key = normalizeOfficerIdentifier(badgeOrName || officerName || '');
  let finalState: OfficerDutyState;

  if (typeof stateOrIsDuty === 'object') {
    finalState = {
      isDuty: !!stateOrIsDuty.isDuty,
      dutyStartTime: typeof stateOrIsDuty.dutyStartTime === 'number' && stateOrIsDuty.dutyStartTime > 0 ? stateOrIsDuty.dutyStartTime : 0,
      dutyStatus: (stateOrIsDuty.dutyStatus as DutyStatusCode) || (stateOrIsDuty.isDuty ? '8-1-1' : '8-1-0'),
      officerName: stateOrIsDuty.officerName || officerName,
      officerBadge: stateOrIsDuty.officerBadge || badgeOrName,
      updatedAt: Date.now()
    };
  } else {
    const isDuty = !!stateOrIsDuty;
    finalState = {
      isDuty,
      dutyStartTime: isDuty ? (typeof dutyStartTime === 'number' && dutyStartTime > 0 ? dutyStartTime : Date.now()) : 0,
      dutyStatus: (dutyStatus as DutyStatusCode) || (isDuty ? '8-1-1' : '8-1-0'),
      officerName: officerName,
      officerBadge: badgeOrName,
      updatedAt: Date.now()
    };
  }

  try {
    // 1. Update individual key
    localStorage.setItem(getOfficerDutyStorageKey(badgeOrName), JSON.stringify(finalState));

    // 2. Update multi-officer registry without touching other officers!
    const registry = getAllOfficersDutyRegistry();
    registry[key] = finalState;
    if (officerName) {
      const nameKey = normalizeOfficerIdentifier(officerName);
      registry[nameKey] = finalState;
    }
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(registry));

    // Sync to Firestore
    pushToFirestore('SYSTEM_CONFIGS', { id: 'duty_registry', registry }, 'duty_registry').catch(console.error);

    // 3. Dispatch isolated event for intra-app live synchronization
    window.dispatchEvent(new CustomEvent('hspd-officer-duty-changed', {
      detail: {
        badgeOrName,
        key,
        state: finalState
      }
    }));
  } catch (e) {
    console.error('Failed to save officer duty state to localStorage', e);
  }
}

export function formatDutyDuration(isDuty: boolean, dutyStartTime: number, now: number = Date.now()): {
  shortStr: string;
  detailedStr: string;
  hours: number;
  minutes: number;
  seconds: number;
} {
  if (!isDuty || !dutyStartTime || dutyStartTime <= 0) {
    return {
      shortStr: '0m',
      detailedStr: '0 Menit 0 Detik',
      hours: 0,
      minutes: 0,
      seconds: 0
    };
  }

  const elapsedMs = Math.max(0, now - dutyStartTime);
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  const shortStr = `${hours > 0 ? `${hours}j ` : ''}${minutes}m`;
  let detailedStr = '';
  if (hours > 0) {
    detailedStr += `${hours} Jam `;
  }
  detailedStr += `${minutes} Menit ${seconds} Detik`;

  return {
    shortStr,
    detailedStr,
    hours,
    minutes,
    seconds
  };
}

