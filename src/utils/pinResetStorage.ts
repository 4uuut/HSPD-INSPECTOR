import { PinResetRequest, PinResetStatus, OfficerProfile, OfficerAccount, isSupervisorOrAbove, isOfficerHighRank } from '../types';
import { 
  sendPinResetResolvedWebhookToDiscord, 
  sendPinResetAutoGrantedWebhookToDiscord, 
  sendPinResetRequestToDiscord 
} from './discordWebhook';
import { getAllOfficersDutyRegistry } from './officerDutyStorage';
import { pushAllToFirestore } from '../services/firebaseRealtimeSync';
import { HSPD_OFFICIAL_ROSTER, mergeWithOfficialRoster } from '../data/hspdOfficialRoster';

const STORAGE_KEY = 'HSPD_PIN_RESET_REQUESTS_V1';
const AUTO_GRANT_CONFIG_KEY = 'HSPD_PIN_RESET_AUTO_GRANT_CONFIG_V1';
const SUPERIOR_HEARTBEAT_KEY = 'HSPD_SUPERIOR_HEARTBEAT_TRACKER_V1';

export const ROSTER_STORAGE_KEYS = [
  'hspd_roster_database_v4',
  'hspd_roster_database_v3',
  'hspd_roster_database_v2',
  'hspd_roster_accounts_v1'
] as const;

export function isOfficerMatch(officer: OfficerAccount, searchIdentifier: string): boolean {
  if (!officer || !searchIdentifier) return false;
  const rawId = searchIdentifier.trim().toLowerCase();
  const rawName = (officer.name || '').trim().toLowerCase();
  const rawBadge = (officer.badge || '').trim().toLowerCase();

  // Strip non-alphanumerics for badge matching (e.g. '#102', '102', '[102]')
  const cleanIdDigits = rawId.replace(/[^a-z0-9]/g, '');
  const cleanBadgeDigits = rawBadge.replace(/[^a-z0-9]/g, '');

  if (cleanIdDigits && cleanBadgeDigits && cleanIdDigits === cleanBadgeDigits) {
    return true;
  }

  // Exact matches
  if (rawName === rawId || rawBadge === rawId) {
    return true;
  }

  // Substring matches in both directions
  if (rawName && rawId && (rawName.includes(rawId) || rawId.includes(rawName))) {
    return true;
  }

  // Check with hash prefix
  const withHash = rawId.startsWith('#') ? rawId : `#${rawId}`;
  if (rawBadge === withHash) {
    return true;
  }

  return false;
}

export function getRosterFromStorage(): OfficerAccount[] {
  try {
    for (const key of ROSTER_STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return mergeWithOfficialRoster(parsed);
        }
      }
    }
  } catch {}
  return mergeWithOfficialRoster(HSPD_OFFICIAL_ROSTER);
}

export function saveRosterToStorage(updatedRoster: OfficerAccount[]): OfficerAccount[] {
  const merged = mergeWithOfficialRoster(updatedRoster);
  try {
    const serialized = JSON.stringify(merged);
    ROSTER_STORAGE_KEYS.forEach(key => {
      try {
        localStorage.setItem(key, serialized);
      } catch {}
    });
    window.dispatchEvent(new CustomEvent('hspd-roster-updated', { detail: merged }));
    pushAllToFirestore('ROSTER', merged).catch(() => {});
  } catch (err) {
    console.error('Failed to save roster database to storage:', err);
  }
  return merged;
}

/**
 * Centrally updates an officer's PIN in the roster, persists to all localStorage keys,
 * broadcasts the update event, and pushes the updated roster to Cloud Firestore.
 */
export function updateOfficerPinInRoster(
  badgeOrName: string,
  newPin: string,
  officerName?: string
): { success: boolean; updatedRoster: OfficerAccount[] } {
  const trimmedPin = newPin.trim();
  if (!trimmedPin) return { success: false, updatedRoster: [] };

  const currentRoster = getRosterFromStorage();
  let updated = false;

  const updatedRoster = currentRoster.map(officer => {
    if (
      isOfficerMatch(officer, badgeOrName) || 
      (officerName && isOfficerMatch(officer, officerName))
    ) {
      updated = true;
      return {
        ...officer,
        pin: trimmedPin,
        _updatedAt: Date.now()
      };
    }
    return officer;
  });

  if (updated) {
    const saved = saveRosterToStorage(updatedRoster);
    return { success: true, updatedRoster: saved };
  }

  return { success: false, updatedRoster: currentRoster };
}

export interface PinResetAutoGrantConfig {
  autoGrantWhenSuperiorOffline: boolean; // default: true
  requireRosterMatch: boolean;          // default: true (only grant if in roster)
  defaultFallbackPin: string;            // default: '10-4'
  notifyDiscordOnAutoGrant: boolean;     // default: true
  offlineThresholdMinutes: number;       // default: 5 minutes of no superior heartbeat/duty
}

const DEFAULT_AUTO_GRANT_CONFIG: PinResetAutoGrantConfig = {
  autoGrantWhenSuperiorOffline: true,
  requireRosterMatch: true,
  defaultFallbackPin: '10-4',
  notifyDiscordOnAutoGrant: true,
  offlineThresholdMinutes: 5
};

const INITIAL_REQUESTS: PinResetRequest[] = [
  {
    id: 'req-init-1',
    officerName: 'Marcus Vance',
    officerBadge: '#102',
    officerRank: 'POLICE OFFICER II [PO II]',
    discordTag: 'marcus_vance#9012',
    reason: 'Lupa PIN login terminal MDT setelah update roster',
    requestedPin: '10-4',
    status: 'RESOLVED',
    createdAt: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    resolvedAt: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
    resolvedBy: 'Leonard Neave',
    resolvedByBadge: '#001',
    resolvedByRank: 'CHIEF OF POLICE [COP]',
    resolvedNewPin: '84621',
    resolutionNotes: 'Identitas telah diverifikasi via Discord Voice. PIN baru telah diset dan diserahkan.',
    webhookSent: true,
  },
  {
    id: 'req-init-2',
    officerName: 'Tommy Shelby',
    officerBadge: '#105',
    officerRank: 'CADET [CDT]',
    discordTag: 'tommy_cadet#1122',
    reason: 'Akun baru belum menerima kode PIN awal dari FTO / Supervisor',
    requestedPin: '7788',
    status: 'PENDING',
    createdAt: Date.now() - 1000 * 60 * 25, // 25 mins ago
    webhookSent: true,
  }
];

// ==============================================================
// 🔈 AUDIO NOTIFICATION HELPER (Synthesized Police Radio Beep)
// ==============================================================
export function playPoliceChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Dual-tone chime (587Hz -> 880Hz)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime);
    osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.12); // D6

    gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 0.4);
  } catch {
    // Ignore audio context auto-play blocks on silent user interactions
  }
}

// ==============================================================
// ⚙️ AUTO-GRANT CONFIGURATION STORAGE
// ==============================================================
export function getPinResetAutoGrantConfig(): PinResetAutoGrantConfig {
  try {
    const raw = localStorage.getItem(AUTO_GRANT_CONFIG_KEY);
    if (!raw) return DEFAULT_AUTO_GRANT_CONFIG;
    return { ...DEFAULT_AUTO_GRANT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AUTO_GRANT_CONFIG;
  }
}

export function savePinResetAutoGrantConfig(cfg: Partial<PinResetAutoGrantConfig>): void {
  try {
    const current = getPinResetAutoGrantConfig();
    const updated = { ...current, ...cfg };
    localStorage.setItem(AUTO_GRANT_CONFIG_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('hspd-pin-autogrant-cfg-updated', { detail: updated }));
  } catch (err) {
    console.error('Failed to save PinReset auto grant config:', err);
  }
}

// ==============================================================
// 📡 SUPERIOR ONLINE / HEARTBEAT TRACKER
// ==============================================================
export function touchSuperiorHeartbeat(officer: OfficerProfile | null): void {
  if (!officer || !isSupervisorOrAbove(officer.rank)) return;
  try {
    const trackerData = {
      name: officer.name,
      badge: officer.badge,
      rank: officer.rank,
      lastSeen: Date.now()
    };
    localStorage.setItem(SUPERIOR_HEARTBEAT_KEY, JSON.stringify(trackerData));
    localStorage.setItem(`hspd_superior_pulse_${officer.badge.replace(/[^a-zA-Z0-9]/g, '')}`, Date.now().toString());
  } catch {}
}

export interface OnlineSuperiorInfo {
  name: string;
  badge: string;
  rank: string;
  lastSeen: number;
  isDuty?: boolean;
}

export function getOnlineSuperiorsList(roster?: OfficerAccount[]): OnlineSuperiorInfo[] {
  const result: OnlineSuperiorInfo[] = [];
  const now = Date.now();
  const thresholdMs = 1000 * 60 * 5; // 5 minutes

  // 1. Check current local officer session
  try {
    const sessionRaw = localStorage.getItem('HSPD_CURRENT_OFFICER_SESSION_V2') || localStorage.getItem('HSPD_OFFICER_SESSION');
    if (sessionRaw) {
      const parsed: OfficerProfile = JSON.parse(sessionRaw);
      if (parsed && isSupervisorOrAbove(parsed.rank)) {
        result.push({
          name: parsed.name,
          badge: parsed.badge,
          rank: parsed.rank,
          lastSeen: now,
          isDuty: true
        });
      }
    }
  } catch {}

  // 2. Check superior heartbeat tracker
  try {
    const hbRaw = localStorage.getItem(SUPERIOR_HEARTBEAT_KEY);
    if (hbRaw) {
      const hb = JSON.parse(hbRaw);
      if (hb && now - hb.lastSeen <= thresholdMs) {
        if (!result.some(r => r.badge.toLowerCase() === hb.badge.toLowerCase())) {
          result.push({
            name: hb.name,
            badge: hb.badge,
            rank: hb.rank,
            lastSeen: hb.lastSeen,
            isDuty: true
          });
        }
      }
    }
  } catch {}

  // 3. Check duty registry for active on-duty supervisors
  try {
    const registry = getAllOfficersDutyRegistry();
    const effectiveRoster = roster || getRosterFromStorage();
    for (const [key, state] of Object.entries(registry)) {
      if (state.isDuty) {
        // Find matching officer in roster
        const match = effectiveRoster.find(r => 
          r.badge.toLowerCase().replace(/[^a-z0-9]/g, '') === key ||
          r.name.toLowerCase().replace(/[^a-z0-9]/g, '') === key
        );
        if (match && isSupervisorOrAbove(match.rank)) {
          if (!result.some(r => r.badge.toLowerCase() === match.badge.toLowerCase())) {
            result.push({
              name: match.name,
              badge: match.badge,
              rank: match.rank,
              lastSeen: state.updatedAt || now,
              isDuty: true
            });
          }
        }
      }
    }
  } catch {}

  return result;
}

export function isAnySuperiorOnline(roster?: OfficerAccount[]): boolean {
  const superiors = getOnlineSuperiorsList(roster);
  return superiors.length > 0;
}

export const PIN_RESET_AUTO_ACCEPT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// ==============================================================
// 📋 PIN RESET REQUESTS REPOSITORY
// ==============================================================
export function getPinResetRequests(roster?: OfficerAccount[], onUpdateOfficerPin?: (badgeOrName: string, newPin: string) => boolean): PinResetRequest[] {
  try {
    // Run auto-approval check on pending requests past 10 minutes
    checkAndAutoApprovePendingRequests(roster, onUpdateOfficerPin);

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REQUESTS));
      return INITIAL_REQUESTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_REQUESTS;
  } catch (err) {
    console.error('Failed to read PIN reset requests from localStorage:', err);
    return INITIAL_REQUESTS;
  }
}

/**
 * Checks all pending PIN reset requests and automatically approves any request
 * that has been waiting for more than 10 minutes without superior action.
 */
export function checkAndAutoApprovePendingRequests(
  roster?: OfficerAccount[],
  onUpdateOfficerPin?: (badgeOrName: string, newPin: string) => boolean
): { updatedCount: number; resolvedRequests: PinResetRequest[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { updatedCount: 0, resolvedRequests: [] };
    const list: PinResetRequest[] = JSON.parse(raw);
    if (!Array.isArray(list)) return { updatedCount: 0, resolvedRequests: [] };

    const now = Date.now();
    const resolvedRequests: PinResetRequest[] = [];
    let hasChanges = false;
    const cfg = getPinResetAutoGrantConfig();

    const updatedList = list.map(req => {
      if (req.status === 'PENDING' && (now - req.createdAt >= PIN_RESET_AUTO_ACCEPT_TIMEOUT_MS)) {
        const targetPin = (req.requestedPin && req.requestedPin.trim()) ? req.requestedPin.trim() : cfg.defaultFallbackPin;
        hasChanges = true;

        // 1. Update roster PIN centrally (persists to storage, dispatches event, and syncs Firestore)
        updateOfficerPinInRoster(req.officerBadge, targetPin, req.officerName);
        if (onUpdateOfficerPin) {
          onUpdateOfficerPin(req.officerBadge || req.officerName, targetPin);
        }

        const resolvedReq: PinResetRequest = {
          ...req,
          status: 'RESOLVED',
          resolvedAt: now,
          resolvedBy: 'BOT / SISTEM OTOMATIS (TIMEOUT 10 MENIT)',
          resolvedByBadge: '#SYS-TIMEOUT-BOT',
          resolvedByRank: 'SYSTEM AUTOMATION BOT',
          resolvedNewPin: targetPin,
          resolutionNotes: 'Permintaan otomatis disetujui oleh Bot / Sistem Keamanan karena pihak Atasan tidak memberikan persetujuan dalam batas waktu 10 menit.',
          autoGranted: true,
          autoGrantReason: 'Timeout 10 Menit: Atasan Tidak Memberikan Respon (Auto-Approve by Bot)'
        };

        resolvedRequests.push(resolvedReq);

        // Notify Discord
        if (cfg.notifyDiscordOnAutoGrant) {
          sendPinResetAutoGrantedWebhookToDiscord({
            officerName: req.officerName,
            officerBadge: req.officerBadge,
            officerRank: req.officerRank,
            newPin: targetPin,
            reason: `[Auto-Approved by Bot (10 Min Timeout)]: ${req.reason}`
          }).catch(err => console.error('Discord auto-grant webhook err', err));
        }

        return resolvedReq;
      }
      return req;
    });

    if (hasChanges) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent('hspd-pin-requests-updated', { detail: updatedList }));
      } catch (e) {}
    }

    return { updatedCount: resolvedRequests.length, resolvedRequests };
  } catch (err) {
    console.error('Error in checkAndAutoApprovePendingRequests:', err);
    return { updatedCount: 0, resolvedRequests: [] };
  }
}

/**
 * Manually force auto-approve a single request if 10 minutes have elapsed
 */
export function autoApproveSingleRequestDueToTimeout(
  requestId: string,
  roster?: OfficerAccount[],
  onUpdateOfficerPin?: (badgeOrName: string, newPin: string) => boolean
): { success: boolean; request?: PinResetRequest; pin?: string; message: string } {
  const current = getPinResetRequests(roster, onUpdateOfficerPin);
  const idx = current.findIndex(r => r.id === requestId);
  if (idx === -1) {
    return { success: false, message: 'Tiket pengajuan tidak ditemukan!' };
  }

  const target = current[idx];
  if (target.status === 'RESOLVED') {
    return {
      success: true,
      request: target,
      pin: target.resolvedNewPin || target.requestedPin || '10-4',
      message: 'Tiket ini telah disetujui sebelumnya.'
    };
  }

  const cfg = getPinResetAutoGrantConfig();
  const targetPin = (target.requestedPin && target.requestedPin.trim()) ? target.requestedPin.trim() : cfg.defaultFallbackPin;

  // 1. Update roster PIN centrally (persists to storage, dispatches event, and syncs Firestore)
  updateOfficerPinInRoster(target.officerBadge, targetPin, target.officerName);
  if (onUpdateOfficerPin) {
    onUpdateOfficerPin(target.officerBadge || target.officerName, targetPin);
  }

  const resolvedReq: PinResetRequest = {
    ...target,
    status: 'RESOLVED',
    resolvedAt: Date.now(),
    resolvedBy: 'BOT / SISTEM OTOMATIS (TIMEOUT 10 MENIT)',
    resolvedByBadge: '#SYS-TIMEOUT-BOT',
    resolvedByRank: 'SYSTEM AUTOMATION BOT',
    resolvedNewPin: targetPin,
    resolutionNotes: 'Permintaan otomatis disetujui oleh Bot / Sistem Keamanan setelah melewati batas waktu 10 menit.',
    autoGranted: true,
    autoGrantReason: 'Timeout 10 Menit: Atasan Tidak Memberikan Respon (Auto-Approve by Bot)'
  };

  current[idx] = resolvedReq;
  savePinResetRequests(current);

  if (cfg.notifyDiscordOnAutoGrant) {
    sendPinResetAutoGrantedWebhookToDiscord({
      officerName: target.officerName,
      officerBadge: target.officerBadge,
      officerRank: target.officerRank,
      newPin: targetPin,
      reason: `[Auto-Approved by Bot (10 Min Timeout)]: ${target.reason}`
    }).catch(err => console.error('Discord auto-grant webhook err', err));
  }

  return {
    success: true,
    request: resolvedReq,
    pin: targetPin,
    message: `Permintaan reset PIN untuk ${target.officerName} telah disetujui secara otomatis oleh sistem (Batas waktu 10 menit terlewati).`
  };
}

export function savePinResetRequests(requests: PinResetRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    window.dispatchEvent(new CustomEvent('hspd-pin-requests-updated', { detail: requests }));
    pushAllToFirestore('PIN_RESET_REQUESTS', requests).catch(() => {});
  } catch (err) {
    console.error('Failed to save PIN reset requests to localStorage:', err);
  }
}

export function addPinResetRequest(data: {
  officerName: string;
  officerBadge: string;
  officerRank?: string;
  discordTag?: string;
  reason: string;
  requestedPin?: string;
  webhookSent?: boolean;
}): PinResetRequest {
  const current = getPinResetRequests();
  const newReq: PinResetRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    officerName: data.officerName.trim(),
    officerBadge: data.officerBadge.trim(),
    officerRank: data.officerRank,
    discordTag: data.discordTag?.trim(),
    reason: data.reason.trim(),
    requestedPin: data.requestedPin?.trim() || undefined,
    status: 'PENDING',
    createdAt: Date.now(),
    webhookSent: data.webhookSent ?? true,
  };

  const updated = [newReq, ...current];
  savePinResetRequests(updated);

  // Broadcast realtime notification event for all open tabs
  try {
    window.dispatchEvent(new CustomEvent('hspd-pin-reset-requested', { detail: newReq }));
    localStorage.setItem('hspd_last_pin_request_alert', JSON.stringify({
      id: newReq.id,
      name: newReq.officerName,
      badge: newReq.officerBadge,
      rank: newReq.officerRank,
      reason: newReq.reason,
      requestedPin: newReq.requestedPin,
      timestamp: Date.now()
    }));
  } catch {}

  return newReq;
}

export function resolvePinResetRequest(
  requestId: string,
  newPin: string,
  superior: OfficerProfile,
  notes?: string
): { success: boolean; request?: PinResetRequest; message: string } {
  const current = getPinResetRequests();
  const idx = current.findIndex(r => r.id === requestId);
  if (idx === -1) {
    return { success: false, message: 'Tiket pengajuan tidak ditemukan!' };
  }

  const target = current[idx];
  const trimmedPin = newPin.trim();

  // 1. Update PIN in roster database (persists to storage, dispatches event, and syncs Firestore)
  updateOfficerPinInRoster(target.officerBadge, trimmedPin, target.officerName);

  const updatedReq: PinResetRequest = {
    ...target,
    status: 'RESOLVED',
    resolvedAt: Date.now(),
    resolvedBy: superior.name,
    resolvedByBadge: superior.badge,
    resolvedByRank: superior.rank,
    resolvedNewPin: trimmedPin,
    resolutionNotes: notes?.trim() || 'PIN disetujui & diperbarui langsung oleh High Command.'
  };

  current[idx] = updatedReq;
  savePinResetRequests(current);

  return { 
    success: true, 
    request: updatedReq, 
    message: `Permintaan reset PIN untuk ${target.officerName} berhasil diselesaikan!` 
  };
}

export function autoGrantPinResetRequest(
  requestId: string,
  newPin: string,
  reason?: string
): { success: boolean; request?: PinResetRequest; message: string } {
  const current = getPinResetRequests();
  const idx = current.findIndex(r => r.id === requestId);
  if (idx === -1) {
    return { success: false, message: 'Tiket pengajuan tidak ditemukan!' };
  }

  const target = current[idx];
  const trimmedPin = newPin.trim();

  // 1. Update PIN in roster database (persists to storage, dispatches event, and syncs Firestore)
  updateOfficerPinInRoster(target.officerBadge, trimmedPin, target.officerName);

  const updatedReq: PinResetRequest = {
    ...target,
    status: 'RESOLVED',
    resolvedAt: Date.now(),
    resolvedBy: 'SISTEM OTOMATIS (HIGH COMMAND OFFLINE)',
    resolvedByBadge: '#SYS-AUTO',
    resolvedByRank: 'SYSTEM AUTOMATION [AI/AUTO-DISPATCH]',
    resolvedNewPin: trimmedPin,
    resolutionNotes: reason?.trim() || 'PIN login disahkan secara otomatis oleh sistem karena seluruh Supervisor/High Command sedang tidak login di website.',
    autoGranted: true,
    autoGrantReason: 'Atasan Tidak Login Website (Offline Fallback Auto-Grant)'
  };

  current[idx] = updatedReq;
  savePinResetRequests(current);

  return {
    success: true,
    request: updatedReq,
    message: `Akses otomatis diberikan! PIN baru "${trimmedPin}" telah aktif untuk ${target.officerName}.`
  };
}

export function rejectPinResetRequest(
  requestId: string,
  superior: OfficerProfile,
  reason?: string
): { success: boolean; request?: PinResetRequest; message: string } {
  const current = getPinResetRequests();
  const idx = current.findIndex(r => r.id === requestId);
  if (idx === -1) {
    return { success: false, message: 'Tiket pengajuan tidak ditemukan!' };
  }

  const target = current[idx];
  const updatedReq: PinResetRequest = {
    ...target,
    status: 'REJECTED',
    resolvedAt: Date.now(),
    resolvedBy: superior.name,
    resolvedByBadge: superior.badge,
    resolvedByRank: superior.rank,
    resolutionNotes: reason?.trim() || 'Permintaan ditolak oleh High Command (Data/Kredensial tidak valid).'
  };

  current[idx] = updatedReq;
  savePinResetRequests(current);

  return { 
    success: true, 
    request: updatedReq, 
    message: `Permintaan reset PIN untuk ${target.officerName} telah ditolak.` 
  };
}

export function updatePinResetRequest(updated: PinResetRequest): boolean {
  const current = getPinResetRequests();
  const idx = current.findIndex(r => r.id === updated.id);
  if (idx === -1) return false;
  current[idx] = updated;
  savePinResetRequests(current);
  return true;
}

export function deletePinResetRequest(requestId: string): boolean {
  const current = getPinResetRequests();
  const filtered = current.filter(r => r.id !== requestId);
  if (filtered.length !== current.length) {
    savePinResetRequests(filtered);
    return true;
  }
  return false;
}

export function getPendingPinResetCount(): number {
  const current = getPinResetRequests();
  return current.filter(r => r.status === 'PENDING').length;
}

// ==============================================================
// 🚀 SMART PIN SUBMISSION PIPELINE (AUTO-GRANT vs MANUAL REVIEW)
// ==============================================================
export async function executePinResetSubmission(params: {
  officerName: string;
  officerBadge: string;
  officerRank?: string;
  discordTag?: string;
  reason: string;
  requestedPin?: string;
  roster: OfficerAccount[];
  onUpdateOfficerPin?: (badgeOrName: string, newPin: string) => boolean;
}): Promise<{
  success: boolean;
  isAutoGranted: boolean;
  pin: string;
  message: string;
  request: PinResetRequest;
}> {
  const { officerName, officerBadge, officerRank, discordTag, reason, requestedPin, roster, onUpdateOfficerPin } = params;
  const cfg = getPinResetAutoGrantConfig();
  const superiorOnline = isAnySuperiorOnline(roster);

  // Determine candidate PIN
  const targetPin = (requestedPin && requestedPin.trim()) ? requestedPin.trim() : cfg.defaultFallbackPin;

  // Check matching officer in roster
  const cleanName = officerName.trim().toLowerCase();
  const cleanBadge = officerBadge.trim().toLowerCase();
  const matchedOfficer = roster.find(r => 
    isOfficerMatch(r, officerBadge) ||
    isOfficerMatch(r, officerName)
  );

  const finalBadge = matchedOfficer ? matchedOfficer.badge : (officerBadge.trim() || '-');
  const finalRank = matchedOfficer ? matchedOfficer.rank : officerRank;

  // SCENARIO 1: SUPERIOR IS OFFLINE & AUTO-GRANT IS ENABLED -> AUTO GRANT ACCESS
  if (cfg.autoGrantWhenSuperiorOffline && !superiorOnline) {
    // 1. Update PIN in roster centrally (persists to storage, dispatches event, and syncs Firestore)
    updateOfficerPinInRoster(finalBadge, targetPin, officerName);
    if (onUpdateOfficerPin) {
      onUpdateOfficerPin(finalBadge || officerName, targetPin);
    }

    // 2. Create and auto-resolve ticket
    const createdReq = addPinResetRequest({
      officerName,
      officerBadge: finalBadge,
      officerRank: finalRank,
      discordTag,
      reason,
      requestedPin: targetPin,
      webhookSent: true
    });

    const resolveRes = autoGrantPinResetRequest(
      createdReq.id,
      targetPin,
      `Akses & PIN otomatis diberikan oleh sistem karena Atasan/High Command sedang tidak login di website.`
    );

    // 3. Send Auto-Grant Discord Webhook
    if (cfg.notifyDiscordOnAutoGrant) {
      sendPinResetAutoGrantedWebhookToDiscord({
        officerName,
        officerBadge: finalBadge,
        officerRank: finalRank,
        newPin: targetPin,
        reason
      }).catch(err => console.error('Discord auto-grant webhook err', err));
    }

    return {
      success: true,
      isAutoGranted: true,
      pin: targetPin,
      message: `Akses Otomatis Diberikan! Karena seluruh Atasan/High Command sedang tidak login di website, PIN baru "${targetPin}" telah langsung diaktifkan untuk akun Anda.`,
      request: resolveRes.request || createdReq
    };
  }

  // SCENARIO 2: SUPERIOR IS ONLINE (OR AUTO-GRANT DISABLED) -> MANUAL REVIEW
  const createdReq = addPinResetRequest({
    officerName,
    officerBadge: finalBadge,
    officerRank: finalRank,
    discordTag,
    reason,
    requestedPin: targetPin,
    webhookSent: true
  });

  // Play audio chime for local feedback & broadcast
  playPoliceChime();

  // Send pending request webhook to Discord
  const webhookRes = await sendPinResetRequestToDiscord({
    officerName,
    officerBadge: finalBadge,
    rank: finalRank,
    reason,
    requestedNewPin: targetPin,
    discordTag
  });

  return {
    success: true,
    isAutoGranted: false,
    pin: targetPin,
    message: superiorOnline 
      ? `Permintaan reset PIN telah diteruskan ke Atasan yang sedang login/aktif di website serta disiarkan ke Discord untuk verifikasi manual.`
      : (webhookRes.message || `Permintaan telah dicatat dan dikirim ke Discord Atasan.`),
    request: createdReq
  };
}
