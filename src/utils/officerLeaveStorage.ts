import { OfficerLeaveRecord, LeaveApprovalStatus, isOfficerHighRank } from '../types';
import { getLocalDateString } from './attendanceExport';
import { pushToFirestore, deleteFromFirestore } from '../services/firebaseRealtimeSync';

export const OFFICER_LEAVES_STORAGE_KEY = 'hspd_officer_leaves_history_v1';

/**
 * Loads all officer leave records from localStorage
 */
export function getSavedOfficerLeaves(): OfficerLeaveRecord[] {
  try {
    const raw = localStorage.getItem(OFFICER_LEAVES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load officer leaves', e);
  }
  return [];
}

/**
 * Persists leave records to localStorage, dispatches update event, and pushes to Firestore
 */
export function saveOfficerLeaves(leaves: OfficerLeaveRecord[]) {
  try {
    localStorage.setItem(OFFICER_LEAVES_STORAGE_KEY, JSON.stringify(leaves));
    window.dispatchEvent(new CustomEvent('hspd-officer-leaves-updated', { detail: leaves }));
  } catch (e) {
    console.error('Failed to save officer leaves to localStorage', e);
  }
}

/**
 * Calculates number of calendar days between two dates inclusive
 */
export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 1;
  try {
    const s = new Date(startDateStr);
    const e = new Date(endDateStr);
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, isNaN(diffDays) ? 1 : diffDays);
  } catch {
    return 1;
  }
}

/**
 * Checks if a date falls within a leave range inclusive
 */
export function isDateWithinRange(checkDateStr: string, startDateStr: string, endDateStr: string): boolean {
  if (!checkDateStr || !startDateStr || !endDateStr) return false;
  return checkDateStr >= startDateStr && checkDateStr <= endDateStr;
}

/**
 * Checks if an officer has an active approved leave for today or a specific date
 */
export function getActiveLeaveForOfficer(
  badgeOrName: string, 
  officerName?: string, 
  targetDateStr?: string
): OfficerLeaveRecord | null {
  const leaves = getSavedOfficerLeaves();
  const dateStr = targetDateStr || getLocalDateString();
  const normBadge = (badgeOrName || '').toLowerCase().replace(/#/g, '').trim();
  const normName = (officerName || badgeOrName || '').toLowerCase().trim();

  const found = leaves.find(l => {
    if (l.status !== 'APPROVED') return false;
    const lBadge = (l.officerBadge || '').toLowerCase().replace(/#/g, '').trim();
    const lName = (l.officerName || '').toLowerCase().trim();
    const isOfficer = (normBadge && lBadge && normBadge === lBadge) || (normName && lName && normName === lName);
    if (!isOfficer) return false;

    return isDateWithinRange(dateStr, l.startDate, l.endDate);
  });

  return found || null;
}

/**
 * Checks if an officer has any approved leave that overlaps with a date range (timestamp range)
 */
export function getApprovedLeavesInDateRange(
  officerBadge: string,
  officerName: string,
  startMs: number,
  endMs: number
): OfficerLeaveRecord[] {
  const leaves = getSavedOfficerLeaves();
  const normBadge = (officerBadge || '').toLowerCase().replace(/#/g, '').trim();
  const normName = (officerName || '').toLowerCase().trim();

  return leaves.filter(l => {
    if (l.status !== 'APPROVED') return false;
    const lBadge = (l.officerBadge || '').toLowerCase().replace(/#/g, '').trim();
    const lName = (l.officerName || '').toLowerCase().trim();
    const isOfficer = (normBadge && lBadge && normBadge === lBadge) || (normName && lName && normName === lName);
    if (!isOfficer) return false;

    // Convert leave start and end to ms
    const sMs = new Date(l.startDate + 'T00:00:00').getTime();
    const eMs = new Date(l.endDate + 'T23:59:59').getTime();

    // Check overlap with [startMs, endMs]
    return sMs <= endMs && eMs >= startMs;
  });
}

/**
 * Submits a new leave request (IZIN CUTI SAPD)
 */
export function createOfficerLeaveRequest(data: {
  officerName: string;
  officerBadge: string;
  officerRank: string;
  division?: string;
  reason: string;
  startDate: string;
  endDate: string;
  autoApproveBy?: { name: string; badge: string; rank: string };
  approvalNotes?: string;
}): OfficerLeaveRecord {
  const leaves = getSavedOfficerLeaves();
  const days = calculateDaysBetween(data.startDate, data.endDate);
  const now = Date.now();

  const isAutoApprove = Boolean(data.autoApproveBy);

  const newRecord: OfficerLeaveRecord = {
    id: `leave_${now}_${Math.random().toString(36).substring(2, 7)}`,
    officerName: data.officerName.trim(),
    officerBadge: data.officerBadge.trim(),
    officerRank: data.officerRank.trim(),
    division: data.division || 'Patrol Division',
    reason: data.reason.trim(),
    startDate: data.startDate,
    endDate: data.endDate,
    totalDays: days,
    status: isAutoApprove ? 'APPROVED' : 'PENDING',
    approvedBy: isAutoApprove ? data.autoApproveBy?.name : undefined,
    approvedBadge: isAutoApprove ? data.autoApproveBy?.badge : undefined,
    approvedRank: isAutoApprove ? data.autoApproveBy?.rank : undefined,
    approvedAt: isAutoApprove ? now : undefined,
    approvalNotes: isAutoApprove ? (data.approvalNotes || 'Disetujui otomatis oleh Atasan saat pembuatan') : undefined,
    requestedAt: now
  };

  const updated = [newRecord, ...leaves];
  saveOfficerLeaves(updated);

  pushToFirestore('OFFICER_LEAVES', newRecord, newRecord.id).catch(() => {});
  return newRecord;
}

/**
 * ACC / Menyetujui Pengajuan Cuti oleh Atasan
 */
export function approveOfficerLeave(
  leaveId: string,
  approver: { name: string; badge: string; rank: string },
  notes?: string
): OfficerLeaveRecord | null {
  const leaves = getSavedOfficerLeaves();
  const idx = leaves.findIndex(l => l.id === leaveId);
  if (idx === -1) return null;

  const now = Date.now();
  const updatedRecord: OfficerLeaveRecord = {
    ...leaves[idx],
    status: 'APPROVED',
    approvedBy: approver.name,
    approvedBadge: approver.badge,
    approvedRank: approver.rank,
    approvedAt: now,
    approvalNotes: notes?.trim() || 'Disetujui oleh Atasan'
  };

  const updated = [...leaves];
  updated[idx] = updatedRecord;
  saveOfficerLeaves(updated);

  pushToFirestore('OFFICER_LEAVES', updatedRecord, updatedRecord.id).catch(() => {});
  return updatedRecord;
}

/**
 * Menolak Pengajuan Cuti oleh Atasan
 */
export function rejectOfficerLeave(
  leaveId: string,
  rejecter: { name: string; badge: string; rank: string },
  rejectionReason?: string
): OfficerLeaveRecord | null {
  const leaves = getSavedOfficerLeaves();
  const idx = leaves.findIndex(l => l.id === leaveId);
  if (idx === -1) return null;

  const now = Date.now();
  const updatedRecord: OfficerLeaveRecord = {
    ...leaves[idx],
    status: 'REJECTED',
    rejectedBy: `${rejecter.name} (${rejecter.rank})`,
    rejectedAt: now,
    rejectionReason: rejectionReason?.trim() || 'Ditolak oleh Atasan'
  };

  const updated = [...leaves];
  updated[idx] = updatedRecord;
  saveOfficerLeaves(updated);

  pushToFirestore('OFFICER_LEAVES', updatedRecord, updatedRecord.id).catch(() => {});
  return updatedRecord;
}

/**
 * Menghapus data izin cuti
 */
export function deleteOfficerLeave(leaveId: string) {
  const leaves = getSavedOfficerLeaves();
  const filtered = leaves.filter(l => l.id !== leaveId);
  saveOfficerLeaves(filtered);
  deleteFromFirestore('OFFICER_LEAVES', leaveId).catch(() => {});
}

/**
 * Format string tanggal lokal Indonesia (contoh: 03/10/2026 atau 3 Oktober 2026)
 */
export function formatIndoDateDisplay(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } catch {}
  return dateStr;
}

/**
 * Formats leave record into the exact text format requested by the user:
 * ```    IZIN CUTI SAPD```
 * ```Nama Petugas  : 
 * Reason : 
 * Dari Tanggal  : 
 * Hingga Tanggal: 
 * Total Durasi Cuti  : 
 * ```
 */
export function formatOfficerLeaveText(leave: OfficerLeaveRecord): string {
  const startFmt = formatIndoDateDisplay(leave.startDate);
  const endFmt = formatIndoDateDisplay(leave.endDate);

  let accText = '⏳ MENUNGGU ACC ATASAN';
  if (leave.status === 'APPROVED') {
    accText = `✅ TELAH DI-ACC OLEH: ${leave.approvedBy || 'Atasan'} (${leave.approvedRank || 'High Command'})`;
  } else if (leave.status === 'REJECTED') {
    accText = `❌ DITOLAK OLEH: ${leave.rejectedBy || 'Atasan'}${leave.rejectionReason ? ` (Alasan: ${leave.rejectionReason})` : ''}`;
  }

  return `\`\`\`    IZIN CUTI SAPD\`\`\`
\`\`\`Nama Petugas  : ${leave.officerName} [${leave.officerBadge}]
Reason : ${leave.reason}
Dari Tanggal  : ${startFmt}
Hingga Tanggal: ${endFmt}
Total Durasi Cuti  : ${leave.totalDays} Hari

Pangkat / Divisi   : ${leave.officerRank} • ${leave.division || 'Patrol Division'}
Status ACC Atasan  : ${accText}
\`\`\``;
}
