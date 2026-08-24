import { PinResetRequest, PinResetStatus, OfficerProfile } from '../types';
import { sendPinResetResolvedWebhookToDiscord } from './discordWebhook';

const STORAGE_KEY = 'HSPD_PIN_RESET_REQUESTS_V1';

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

export function getPinResetRequests(): PinResetRequest[] {
  try {
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

export function savePinResetRequests(requests: PinResetRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
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
  const updatedReq: PinResetRequest = {
    ...target,
    status: 'RESOLVED',
    resolvedAt: Date.now(),
    resolvedBy: superior.name,
    resolvedByBadge: superior.badge,
    resolvedByRank: superior.rank,
    resolvedNewPin: newPin.trim(),
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
