import { 
  GovernmentAccount, 
  GovernmentRankLevel, 
  GovernmentDivision, 
  ALL_GOVERNMENT_RANKS, 
  ALL_GOVERNMENT_DIVISIONS 
} from '../types';
import { syncCollectionWithFirestore, pushToFirestore, deleteFromFirestore } from '../services/firebaseRealtimeSync';

export const GOVERNMENT_ROSTER_STORAGE_KEY = 'hspd_government_roster_v1';

// Pre-seeded Official Government Leadership
export const DEFAULT_GOVERNMENT_ROSTER: GovernmentAccount[] = [
  {
    id: 'gov-momo-hatakeyama-01',
    name: 'Momo Hatakeyama',
    badge: '#GOV-01',
    rank: 'PRESIDENT [RANK 6]',
    division: 'Government Affairs Official',
    pin: '10-4',
    phone: '555-0001',
    discordTag: '@momo_president',
    registeredAt: Date.now() - 30 * 24 * 3600 * 1000,
    registeredBy: 'State Constitution / Executive Mandate',
    _updatedAt: Date.now()
  }
];

export function getGovernmentRoster(): GovernmentAccount[] {
  if (typeof window === 'undefined') return DEFAULT_GOVERNMENT_ROSTER;
  try {
    const raw = localStorage.getItem(GOVERNMENT_ROSTER_STORAGE_KEY);
    if (!raw) {
      saveGovernmentRoster(DEFAULT_GOVERNMENT_ROSTER);
      return DEFAULT_GOVERNMENT_ROSTER;
    }
    const parsed: GovernmentAccount[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveGovernmentRoster(DEFAULT_GOVERNMENT_ROSTER);
      return DEFAULT_GOVERNMENT_ROSTER;
    }

    // Ensure Momo Hatakeyama is always guaranteed in the government roster
    const hasMomo = parsed.some(g => 
      (g.name || '').toLowerCase().trim() === 'momo hatakeyama' || 
      (g.badge || '').toLowerCase().trim() === '#gov-01'
    );
    if (!hasMomo) {
      const merged = [DEFAULT_GOVERNMENT_ROSTER[0], ...parsed];
      saveGovernmentRoster(merged);
      return merged;
    }

    return parsed;
  } catch (err) {
    console.error('Failed to read government roster from storage:', err);
    return DEFAULT_GOVERNMENT_ROSTER;
  }
}

export function saveGovernmentRoster(roster: GovernmentAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GOVERNMENT_ROSTER_STORAGE_KEY, JSON.stringify(roster));
    window.dispatchEvent(new CustomEvent('hspd-gov-roster-updated', { detail: roster }));
    // Asynchronously push to Cloud Firestore
    syncCollectionWithFirestore('GOVERNMENT_ROSTER' as any, roster, true).catch(() => {});
  } catch (err) {
    console.error('Failed to save government roster to storage:', err);
  }
}

export function normalizeGovString(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

export function isGovernmentMatch(account: GovernmentAccount, identifier: string): boolean {
  if (!account || !identifier) return false;
  const rawId = identifier.trim().toLowerCase();
  const cleanBadge = rawId.startsWith('#') ? rawId : `#${rawId}`;
  const normId = normalizeGovString(identifier);

  const accBadge = (account.badge || '').toLowerCase().trim();
  const accName = (account.name || '').toLowerCase().trim();
  const normName = normalizeGovString(account.name);
  const normBadge = normalizeGovString(account.badge);

  if (accBadge === rawId || accBadge === cleanBadge) return true;
  if (normBadge && normBadge === normId) return true;
  if (accName === rawId) return true;
  if (normName && normName === normId) return true;
  if (accName.includes(rawId) && rawId.length >= 3) return true;

  return false;
}

export function addGovernmentAccount(
  newOfficer: Omit<GovernmentAccount, 'id' | 'registeredAt'>
): { success: boolean; message: string; account?: GovernmentAccount } {
  const current = getGovernmentRoster();
  const trimmedName = (newOfficer.name || '').trim();
  const trimmedBadge = (newOfficer.badge || '').trim();
  const cleanBadge = trimmedBadge.startsWith('#') ? trimmedBadge : `#${trimmedBadge}`;
  const trimmedPin = (newOfficer.pin || '').trim() || '10-4';

  if (!trimmedName) {
    return { success: false, message: 'Nama Pejabat Pemerintah tidak boleh kosong!' };
  }
  if (!trimmedBadge) {
    return { success: false, message: 'Nomor Badge / Callsign Pemerintah tidak boleh kosong!' };
  }

  // Check duplicate badge
  const normBadge = normalizeGovString(cleanBadge);
  const duplicateBadge = current.find(g => normalizeGovString(g.badge) === normBadge);
  if (duplicateBadge) {
    return { 
      success: false, 
      message: `Nomor Callsign "${cleanBadge}" sudah digunakan oleh pejabat ${duplicateBadge.name}! Gunakan nomor lain.` 
    };
  }

  // Check duplicate name
  const normName = normalizeGovString(trimmedName);
  const duplicateName = current.find(g => normalizeGovString(g.name) === normName);
  if (duplicateName) {
    return { 
      success: false, 
      message: `Nama "${trimmedName}" sudah terdaftar dalam jajaran Pejabat Pemerintah (${duplicateName.badge}, ${duplicateName.rank})!` 
    };
  }

  const createdAccount: GovernmentAccount = {
    id: `gov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: trimmedName,
    badge: cleanBadge,
    rank: newOfficer.rank || 'STAFF [RANK 1]',
    division: newOfficer.division || 'Government Affairs Official',
    pin: trimmedPin,
    phone: newOfficer.phone?.trim() || '',
    discordTag: newOfficer.discordTag?.trim() || '',
    registeredAt: Date.now(),
    registeredBy: newOfficer.registeredBy || 'Presidential Appointment',
    _updatedAt: Date.now()
  };

  const updated = [createdAccount, ...current];
  saveGovernmentRoster(updated);
  pushToFirestore('GOVERNMENT_ROSTER' as any, createdAccount).catch(() => {});

  return { 
    success: true, 
    message: `Berhasil mengangkat ${createdAccount.name} (${createdAccount.badge}) sebagai ${createdAccount.rank} di divisi ${createdAccount.division}!`,
    account: createdAccount 
  };
}

export function updateGovernmentAccount(
  updated: GovernmentAccount
): { success: boolean; message: string } {
  const current = getGovernmentRoster();
  const index = current.findIndex(g => g.id === updated.id || normalizeGovString(g.name) === normalizeGovString(updated.name));
  if (index === -1) {
    return { success: false, message: 'Data pejabat tidak ditemukan di database!' };
  }

  // Prevent duplicate badge with another account
  const cleanBadge = updated.badge.startsWith('#') ? updated.badge : `#${updated.badge}`;
  const conflict = current.find((g, i) => i !== index && normalizeGovString(g.badge) === normalizeGovString(cleanBadge));
  if (conflict) {
    return { success: false, message: `Nomor Badge "${cleanBadge}" sudah digunakan oleh pejabat ${conflict.name}!` };
  }

  const finalized: GovernmentAccount = {
    ...updated,
    badge: cleanBadge,
    _updatedAt: Date.now()
  };

  current[index] = finalized;
  saveGovernmentRoster(current);
  pushToFirestore('GOVERNMENT_ROSTER' as any, finalized).catch(() => {});

  return { success: true, message: `Data pejabat ${finalized.name} berhasil diperbarui!` };
}

export function deleteGovernmentAccount(
  idOrBadge: string
): { success: boolean; message: string } {
  const current = getGovernmentRoster();
  const target = current.find(g => g.id === idOrBadge || g.badge === idOrBadge);
  if (!target) {
    return { success: false, message: 'Pejabat tidak ditemukan!' };
  }

  // Prevent deleting President Momo Hatakeyama
  if (target.name.toLowerCase().includes('momo hatakeyama') || target.badge === '#GOV-01' || target.rank.includes('RANK 6')) {
    return { success: false, message: 'Jabatan Presiden Negara (Momo Hatakeyama) tidak dapat dihapus dari sistem!' };
  }

  const filtered = current.filter(g => g.id !== target.id);
  saveGovernmentRoster(filtered);
  deleteFromFirestore('GOVERNMENT_ROSTER' as any, target.id).catch(() => {});

  return { success: true, message: `Pejabat ${target.name} (${target.badge}) telah dinonaktifkan dari aparatur pemerintahan.` };
}

export function getNextAvailableGovBadge(): string {
  const current = getGovernmentRoster();
  const badges = current
    .map(g => {
      const m = (g.badge || '').match(/#?GOV-(\d+)/i);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter(n => n > 0);
  const max = badges.length > 0 ? Math.max(...badges) : 0;
  const nextNum = max + 1;
  return `#GOV-${String(nextNum).padStart(2, '0')}`;
}

export function subscribeToGovernmentRoster(callback: (roster: GovernmentAccount[]) => void): () => void {
  const handler = (e: any) => {
    callback(e.detail || getGovernmentRoster());
  };
  window.addEventListener('hspd-gov-roster-updated', handler);
  window.addEventListener('storage', () => callback(getGovernmentRoster()));
  return () => {
    window.removeEventListener('hspd-gov-roster-updated', handler);
    window.removeEventListener('storage', () => callback(getGovernmentRoster()));
  };
}
