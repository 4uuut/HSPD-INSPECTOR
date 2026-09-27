/**
 * Centralized Persistent PIN Registry for HSPD MDT Officers
 * Guarantees that any PIN changed via:
 * 1. Edit Roster Anggota
 * 2. Lupa / Ganti PIN Modal
 * 3. Atasan Approval / Quick Accept
 * 4. Bot / Server Sync
 * is NEVER lost, overwritten by static official rosters, or reverted to '10-4'.
 */

import { OfficerAccount } from '../types';
import { pushToFirestore } from '../services/firebaseRealtimeSync';

export const OFFICER_PIN_REGISTRY_KEY = 'hspd_officer_custom_pins_v2';

interface PinEntry {
  pin: string;
  badge?: string;
  name?: string;
  id?: string;
  updatedAt: number;
}

type PinRegistryMap = Record<string, PinEntry>;

function normalizeKey(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function getStoredRegistry(): PinRegistryMap {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {};
  }
  try {
    const raw = localStorage.getItem(OFFICER_PIN_REGISTRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch {}
  return {};
}

function persistRegistry(map: PinRegistryMap): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(OFFICER_PIN_REGISTRY_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('hspd-pin-registry-updated', { detail: map }));
    // Persist to Cloud Firestore under system_configs
    pushToFirestore('SYSTEM_CONFIGS', { id: 'officer_pins', pins: map, updatedAt: Date.now() }, 'officer_pins').catch(() => {});
  } catch (err) {
    console.warn('[OfficerPinRegistry] Failed to save registry:', err);
  }
}

/**
 * Gets the custom PIN assigned to an officer by badge, name, or ID.
 */
export function getOfficerCustomPin(
  badgeOrName?: string,
  altName?: string,
  officerId?: string
): string | null {
  if (!badgeOrName && !altName && !officerId) return null;
  const reg = getStoredRegistry();

  // 1. Check ID
  if (officerId) {
    const normId = normalizeKey(officerId);
    if (normId && reg[`id_${normId}`]?.pin) {
      return reg[`id_${normId}`].pin;
    }
  }

  // 2. Check Badge
  const badgeDigits = (badgeOrName || '').replace(/[^0-9]/g, '');
  if (badgeDigits && reg[`badge_${badgeDigits}`]?.pin) {
    return reg[`badge_${badgeDigits}`].pin;
  }

  // 3. Check Name
  const normName = normalizeKey(altName || badgeOrName);
  if (normName && normName.length >= 3 && reg[`name_${normName}`]?.pin) {
    return reg[`name_${normName}`].pin;
  }

  return null;
}

/**
 * Centrally registers and persists a custom PIN for an officer.
 */
export function setOfficerCustomPin(
  badge: string,
  name: string,
  pin: string,
  officerId?: string
): void {
  const trimmedPin = String(pin || '').trim();
  if (!trimmedPin) return;

  const reg = getStoredRegistry();
  const entry: PinEntry = {
    pin: trimmedPin,
    badge: badge ? badge.trim() : undefined,
    name: name ? name.trim() : undefined,
    id: officerId ? officerId.trim() : undefined,
    updatedAt: Date.now()
  };

  const badgeDigits = (badge || '').replace(/[^0-9]/g, '');
  if (badgeDigits) {
    reg[`badge_${badgeDigits}`] = entry;
  }

  const normName = normalizeKey(name);
  if (normName && normName.length >= 3) {
    reg[`name_${normName}`] = entry;
  }

  if (officerId) {
    const normId = normalizeKey(officerId);
    if (normId) {
      reg[`id_${normId}`] = entry;
    }
  }

  persistRegistry(reg);
}

/**
 * Iterates through a roster and applies any saved custom PIN overrides
 * so no official roster merge can ever wipe them out.
 */
export function applyCustomPinOverrides(officers: OfficerAccount[]): OfficerAccount[] {
  if (!Array.isArray(officers) || officers.length === 0) return officers;
  const reg = getStoredRegistry();
  if (Object.keys(reg).length === 0) return officers;

  return officers.map(officer => {
    const customPin = getOfficerCustomPin(officer.badge, officer.name, officer.id);
    if (customPin && customPin !== officer.pin) {
      return {
        ...officer,
        pin: customPin
      };
    }
    return officer;
  });
}
