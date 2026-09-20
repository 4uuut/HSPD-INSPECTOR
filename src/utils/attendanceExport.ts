import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { OfficerAccount } from '../types';
import { getAllOfficersDutyRegistry, getOfficerDutyState, formatDutyDuration } from './officerDutyStorage';
import { getSavedTrafficCitations } from './trafficCitationStorage';
import { getSavedImpounds } from './boloImpoundStorage';
import { getSavedDetectiveCases } from './detectiveCaseStorage';
import { getSavedVaultAuditLogs } from './vaultAndDestructionStorage';
import { HSPD_LOGO_URL } from '../assets/logo';
import { pushToFirestore } from '../services/firebaseRealtimeSync';

export interface WeeklyOperationsSummary {
  periodLabel: string;
  totalDutyOfficers: number;
  totalDutyHours: number;
  totalDutyMinutes: number;
  totalCitationsCount: number;
  totalCitationsFine: number;
  totalImpoundsCount: number;
  totalImpoundsFee: number;
  totalCasesCount: number;
  totalEvidenceCount: number;
  officerBreakdown: Array<{
    badge: string;
    name: string;
    rank: string;
    division: string;
    dutyHoursFormatted: string;
    dutyMinutes: number;
    dutyShifts: number;
    citationsCount: number;
    citationsFine: number;
    impoundsCount: number;
    casesCount: number;
    evidenceCount: number;
  }>;
}

export function getWeeklyOperationsSummary(
  roster: OfficerAccount[],
  sessions: DutySession[],
  startMs: number,
  endMs: number,
  label: string
): WeeklyOperationsSummary {
  const citations = getSavedTrafficCitations().filter(c => {
    const t = c.timestamp || 0;
    return t >= startMs && t <= endMs;
  });

  const impounds = getSavedImpounds().filter(imp => {
    const t = imp.timestamp || 0;
    return t >= startMs && t <= endMs;
  });

  const cases = getSavedDetectiveCases().filter(cs => {
    const t = cs.createdAt || 0;
    return t >= startMs && t <= endMs;
  });

  // Calculate evidence counts across detective cases and vault
  let directEvidenceCount = 0;
  cases.forEach(cs => {
    if (Array.isArray(cs.evidences)) {
      directEvidenceCount += cs.evidences.length;
    }
  });

  const vaultAudits = getSavedVaultAuditLogs().filter(v => {
    const t = v.timestamp || 0;
    return t >= startMs && t <= endMs;
  });
  vaultAudits.forEach(v => {
    if (Array.isArray(v.evidencePhotos)) {
      directEvidenceCount += v.evidencePhotos.length;
    }
  });

  const summaries = generateAttendanceSummaries(roster, sessions, startMs, endMs);
  let totalDutyMinutes = 0;
  summaries.forEach(s => {
    totalDutyMinutes += s.totalDutyMinutes || 0;
  });

  const officerBreakdown = summaries.map(s => {
    const normBadge = (s.badge || '').toLowerCase().replace(/#/g, '').trim();
    const normName = (s.name || '').toLowerCase().trim();

    const officerCitations = citations.filter(c => {
      const cBadge = (c.officerBadge || '').toLowerCase().replace(/#/g, '').trim();
      const cName = (c.officerName || '').toLowerCase().trim();
      return (normBadge && cBadge === normBadge) || (normName && cName.includes(normName));
    });

    const officerImpounds = impounds.filter(i => {
      const iBadge = (i.officerBadge || '').toLowerCase().replace(/#/g, '').trim();
      const iName = (i.officerName || '').toLowerCase().trim();
      return (normBadge && iBadge === normBadge) || (normName && iName.includes(normName));
    });

    const officerCases = cases.filter(cs => {
      const lBadge = (cs.leadDetectiveBadge || '').toLowerCase().replace(/#/g, '').trim();
      const lName = (cs.leadDetective || '').toLowerCase().trim();
      const isAssisting = Array.isArray(cs.assistingDetectives) && cs.assistingDetectives.some(a => 
        (normBadge && a.toLowerCase().includes(normBadge)) || (normName && a.toLowerCase().includes(normName))
      );
      return (normBadge && lBadge === normBadge) || (normName && lName.includes(normName)) || isAssisting;
    });

    let officerEvCount = 0;
    officerCases.forEach(cs => {
      if (Array.isArray(cs.evidences)) {
        officerEvCount += cs.evidences.filter(ev => {
          const col = (ev.collectedBy || '').toLowerCase();
          return (normBadge && col.includes(normBadge)) || (normName && col.includes(normName));
        }).length;
      }
    });

    const totalCitationsFine = officerCitations.reduce((acc, c) => acc + (Number(c.totalFine) || 0), 0);

    return {
      badge: s.badge,
      name: s.name,
      rank: s.rank,
      division: s.division,
      dutyHoursFormatted: s.totalDutyFormatted,
      dutyMinutes: s.totalDutyMinutes,
      dutyShifts: s.totalShifts,
      citationsCount: officerCitations.length,
      citationsFine: totalCitationsFine,
      impoundsCount: officerImpounds.length,
      casesCount: officerCases.length,
      evidenceCount: officerEvCount
    };
  });

  const totalCitationsFine = citations.reduce((acc, c) => acc + (Number(c.totalFine) || 0), 0);
  const totalImpoundsFee = impounds.reduce((acc, i) => acc + (Number(i.impoundFee) || 0), 0);

  return {
    periodLabel: label,
    totalDutyOfficers: summaries.filter(s => s.totalDutyMinutes > 0).length,
    totalDutyHours: Math.floor(totalDutyMinutes / 60),
    totalDutyMinutes,
    totalCitationsCount: citations.length,
    totalCitationsFine,
    totalImpoundsCount: impounds.length,
    totalImpoundsFee,
    totalCasesCount: cases.length,
    totalEvidenceCount: directEvidenceCount,
    officerBreakdown
  };
}

export interface DutySession {
  id: string;
  officerBadge: string;
  officerName: string;
  officerRank: string;
  division: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  durationFormatted: string;
  notes?: string;
  dateStr: string; // YYYY-MM-DD
}

export interface OfficerAttendanceSummary {
  badge: string;
  name: string;
  rank: string;
  division: string;
  phone?: string;
  registeredDate: string;
  currentStatus: string;
  isCurrentlyDuty: boolean;
  activeDutyMinutes: number;
  totalCompletedDutyMinutes: number;
  totalDutyMinutes: number; // completed + active
  totalDutyFormatted: string;
  totalShifts: number;
  daysActiveCount: number;
  lastActiveTime: number;
  lastActiveFormatted: string;
  attendanceStatus: 'SANGAT AKTIF' | 'AKTIF' | 'CUKUP' | 'KURANG AKTIF' | 'BELUM DINAS';
  sessions: DutySession[];
}

export type ExportDateRangeType = 'current_week' | 'last_week' | 'last_7_days' | 'last_14_days' | 'current_month' | 'all_time' | 'custom';

export const ATTENDANCE_STORAGE_KEY = 'hspd_duty_sessions_history_v1';

/**
 * Loads all recorded duty sessions from localStorage
 */
export function getSavedDutySessions(): DutySession[] {
  try {
    const raw = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load duty sessions', e);
  }
  return [];
}

/**
 * Saves a completed duty session to history
 */
export function recordDutySession(session: Omit<DutySession, 'id' | 'dateStr'>): DutySession {
  const sessions = getSavedDutySessions();
  const dateObj = new Date(session.startTime || Date.now());
  const dateStr = dateObj.toISOString().split('T')[0];
  
  const newSession: DutySession = {
    ...session,
    id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    dateStr
  };

  const updated = [newSession, ...sessions].slice(0, 2000); // keep up to 2000 records
  try {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('hspd-duty-sessions-updated', { detail: updated }));
    pushToFirestore('DUTY_SESSIONS', newSession, newSession.id).catch(() => {});
  } catch (e) {
    console.error('Failed to save duty session', e);
  }
  return newSession;
}

/**
 * Helper to get date boundaries based on range preset
 */
export function getDateRangeTimestamps(
  rangeType: ExportDateRangeType,
  customStart?: string,
  customEnd?: string
): { startMs: number; endMs: number; label: string } {
  const now = new Date();
  
  if (rangeType === 'current_week') {
    const d = new Date(now);
    const day = d.getDay(); // 0 is Sunday, 1 is Monday
    const diffToMon = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diffToMon);
    d.setHours(0, 0, 0, 0);
    const startMs = d.getTime();
    const endMs = now.getTime();
    return {
      startMs,
      endMs,
      label: `Minggu Ini (${d.toLocaleDateString('id-ID')} - ${now.toLocaleDateString('id-ID')})`
    };
  }

  if (rangeType === 'last_week') {
    const d = new Date(now);
    const day = d.getDay();
    const diffToMon = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diffToMon - 7);
    d.setHours(0, 0, 0, 0);
    const startMs = d.getTime();
    const endD = new Date(d);
    endD.setDate(endD.getDate() + 6);
    endD.setHours(23, 59, 59, 999);
    return {
      startMs,
      endMs: endD.getTime(),
      label: `Minggu Lalu (${d.toLocaleDateString('id-ID')} - ${endD.toLocaleDateString('id-ID')})`
    };
  }

  if (rangeType === 'last_7_days') {
    const startD = new Date(now);
    startD.setDate(startD.getDate() - 7);
    startD.setHours(0, 0, 0, 0);
    return {
      startMs: startD.getTime(),
      endMs: now.getTime(),
      label: `7 Hari Terakhir (${startD.toLocaleDateString('id-ID')} - ${now.toLocaleDateString('id-ID')})`
    };
  }

  if (rangeType === 'last_14_days') {
    const startD = new Date(now);
    startD.setDate(startD.getDate() - 14);
    startD.setHours(0, 0, 0, 0);
    return {
      startMs: startD.getTime(),
      endMs: now.getTime(),
      label: `14 Hari Terakhir (${startD.toLocaleDateString('id-ID')} - ${now.toLocaleDateString('id-ID')})`
    };
  }

  if (rangeType === 'current_month') {
    const startD = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return {
      startMs: startD.getTime(),
      endMs: now.getTime(),
      label: `Bulan Ini (${startD.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})`
    };
  }

  if (rangeType === 'custom' && customStart && customEnd) {
    const startD = new Date(customStart);
    startD.setHours(0, 0, 0, 0);
    const endD = new Date(customEnd);
    endD.setHours(23, 59, 59, 999);
    return {
      startMs: startD.getTime(),
      endMs: endD.getTime(),
      label: `Kustom (${startD.toLocaleDateString('id-ID')} - ${endD.toLocaleDateString('id-ID')})`
    };
  }

  // default all time
  return {
    startMs: 0,
    endMs: now.getTime() + 86400000,
    label: `Seluruh Catatan (All Time)`
  };
}

/**
 * Builds structured attendance summaries for all officers in roster
 */
export function generateAttendanceSummaries(
  roster: OfficerAccount[],
  sessions: DutySession[],
  startMs: number,
  endMs: number
): OfficerAttendanceSummary[] {
  const now = Date.now();
  const allRegistry = getAllOfficersDutyRegistry();

  // Filter sessions within date range
  const filteredSessions = sessions.filter(s => {
    const time = s.startTime || 0;
    return time >= startMs && time <= endMs;
  });

  return roster.map(officer => {
    const dutyState = getOfficerDutyState(officer.badge, roster, officer.name);
    
    // Find all sessions for this officer
    const officerSessions = filteredSessions.filter(s => 
      s.officerBadge.toLowerCase().replace(/#/g, '') === officer.badge.toLowerCase().replace(/#/g, '') ||
      s.officerName.toLowerCase() === officer.name.toLowerCase()
    );

    let completedMinutes = 0;
    const daysSet = new Set<string>();
    let lastActive = officer.lastLogin || officer.registeredAt || 0;

    officerSessions.forEach(s => {
      completedMinutes += s.durationMinutes || 0;
      if (s.dateStr) daysSet.add(s.dateStr);
      if (s.endTime && s.endTime > lastActive) {
        lastActive = s.endTime;
      }
    });

    let activeMinutes = 0;
    if (dutyState.isDuty && dutyState.dutyStartTime > 0) {
      activeMinutes = Math.max(0, Math.floor((now - dutyState.dutyStartTime) / 60000));
      if (dutyState.dutyStartTime > lastActive) {
        lastActive = now;
      }
    }

    const totalMinutes = completedMinutes + activeMinutes;
    const totalHours = Math.floor(totalMinutes / 60);
    const remMins = totalMinutes % 60;
    const totalDutyFormatted = totalHours > 0 ? `${totalHours} Jam ${remMins} Mnt` : `${remMins} Menit`;

    // Attendance grading status
    let attendanceStatus: OfficerAttendanceSummary['attendanceStatus'] = 'BELUM DINAS';
    if (totalMinutes >= 600) { // >= 10 Hours
      attendanceStatus = 'SANGAT AKTIF';
    } else if (totalMinutes >= 300) { // >= 5 Hours
      attendanceStatus = 'AKTIF';
    } else if (totalMinutes >= 120) { // >= 2 Hours
      attendanceStatus = 'CUKUP';
    } else if (totalMinutes > 0) {
      attendanceStatus = 'KURANG AKTIF';
    }

    const regDateObj = new Date(officer.registeredAt || Date.now());
    const regDateStr = regDateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    let lastActiveFormatted = '-';
    if (lastActive > 0) {
      lastActiveFormatted = new Date(lastActive).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    let currentStatusText = '8-1-0 (OFF DUTY)';
    if (dutyState.isDuty) {
      currentStatusText = dutyState.dutyStatus ? `${dutyState.dutyStatus} (ON DUTY)` : '8-1-1 (ON DUTY)';
    }

    return {
      badge: officer.badge,
      name: officer.name,
      rank: officer.rank,
      division: officer.division || 'Patrol Division',
      phone: officer.phone || '-',
      registeredDate: regDateStr,
      currentStatus: currentStatusText,
      isCurrentlyDuty: dutyState.isDuty,
      activeDutyMinutes: activeMinutes,
      totalCompletedDutyMinutes: completedMinutes,
      totalDutyMinutes: totalMinutes,
      totalDutyFormatted,
      totalShifts: officerSessions.length + (dutyState.isDuty ? 1 : 0),
      daysActiveCount: daysSet.size,
      lastActiveTime: lastActive,
      lastActiveFormatted,
      attendanceStatus,
      sessions: officerSessions
    };
  });
}

/**
 * Universal Download File Helper for browser/iframe
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * 1. EXPORT TO EXCEL (.XLSX)
 */
export function exportAttendanceToExcel(
  summaries: OfficerAttendanceSummary[],
  rangeLabel: string,
  filterDivision: string = 'ALL'
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Rekapitulasi Absensi & Jam Dinas
  const rekapData = summaries.map((s, idx) => ({
    'No': idx + 1,
    'Badge / NIK': s.badge,
    'Nama Lengkap Petugas': s.name,
    'Pangkat / Jabatan': s.rank,
    'Divisi': s.division,
    'Nomor Telepon': s.phone,
    'Total Durasi Dinas': s.totalDutyFormatted,
    'Total Menit': s.totalDutyMinutes,
    'Total Shift': s.totalShifts,
    'Hari Aktif': `${s.daysActiveCount} Hari`,
    'Status Dinas Terkini': s.currentStatus,
    'Predikat Absensi': s.attendanceStatus,
    'Aktivitas Terakhir': s.lastActiveFormatted,
    'Tanggal Terdaftar': s.registeredDate
  }));

  const wsRekap = XLSX.utils.json_to_sheet(rekapData);

  // Set column widths
  wsRekap['!cols'] = [
    { wch: 5 },  // No
    { wch: 12 }, // Badge
    { wch: 28 }, // Nama
    { wch: 26 }, // Pangkat
    { wch: 22 }, // Divisi
    { wch: 15 }, // Phone
    { wch: 20 }, // Total Durasi
    { wch: 12 }, // Total Menit
    { wch: 12 }, // Total Shift
    { wch: 12 }, // Hari Aktif
    { wch: 20 }, // Status Terkini
    { wch: 16 }, // Predikat
    { wch: 22 }, // Terakhir Aktif
    { wch: 16 }  // Terdaftar
  ];

  XLSX.utils.book_append_sheet(wb, wsRekap, 'Rekapitulasi Absensi');

  // Sheet 2: Log Rincian Shift Dinas
  const shiftRows: any[] = [];
  let shiftCounter = 1;

  summaries.forEach(s => {
    s.sessions.forEach(sess => {
      shiftRows.push({
        'No': shiftCounter++,
        'Badge': s.badge,
        'Nama Petugas': s.name,
        'Pangkat': s.rank,
        'Divisi': s.division,
        'Tanggal Shift': sess.dateStr,
        'Waktu Mulai': sess.startTime ? new Date(sess.startTime).toLocaleTimeString('id-ID') : '-',
        'Waktu Selesai': sess.endTime ? new Date(sess.endTime).toLocaleTimeString('id-ID') : '-',
        'Durasi Shift': sess.durationFormatted || `${sess.durationMinutes || 0} Menit`,
        'Catatan / Sektor': sess.notes || 'Patroli Rutin'
      });
    });
  });

  if (shiftRows.length === 0) {
    shiftRows.push({
      'No': 1,
      'Badge': '-',
      'Nama Petugas': 'Belum ada log sesi tercatat dalam rentang waktu ini',
      'Pangkat': '-',
      'Divisi': '-',
      'Tanggal Shift': '-',
      'Waktu Mulai': '-',
      'Waktu Selesai': '-',
      'Durasi Shift': '-',
      'Catatan / Sektor': '-'
    });
  }

  const wsShifts = XLSX.utils.json_to_sheet(shiftRows);
  wsShifts['!cols'] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 26 },
    { wch: 24 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 24 }
  ];
  XLSX.utils.book_append_sheet(wb, wsShifts, 'Rincian Log Shift');

  // Generate Excel buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const cleanDate = new Date().toISOString().split('T')[0];
  const filename = `REKAP_ABSEN_HSPD_${cleanDate}_${filterDivision === 'ALL' ? 'SEMUA_DIVISI' : filterDivision.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  triggerFileDownload(blob, filename);
  return filename;
}

/**
 * 2. EXPORT TO CSV (.CSV)
 */
export function exportAttendanceToCSV(
  summaries: OfficerAttendanceSummary[],
  rangeLabel: string,
  filterDivision: string = 'ALL'
) {
  const headers = [
    'No',
    'Badge',
    'Nama Petugas',
    'Pangkat',
    'Divisi',
    'Nomor Telepon',
    'Total Durasi Dinas',
    'Total Menit',
    'Total Shift',
    'Hari Aktif',
    'Status Terkini',
    'Predikat',
    'Aktivitas Terakhir',
    'Tanggal Terdaftar'
  ];

  const rows = summaries.map((s, idx) => [
    idx + 1,
    `"${s.badge}"`,
    `"${s.name}"`,
    `"${s.rank}"`,
    `"${s.division}"`,
    `"${s.phone}"`,
    `"${s.totalDutyFormatted}"`,
    s.totalDutyMinutes,
    s.totalShifts,
    `"${s.daysActiveCount} Hari"`,
    `"${s.currentStatus}"`,
    `"${s.attendanceStatus}"`,
    `"${s.lastActiveFormatted}"`,
    `"${s.registeredDate}"`
  ]);

  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const cleanDate = new Date().toISOString().split('T')[0];
  const filename = `REKAP_ABSEN_HSPD_${cleanDate}.csv`;
  triggerFileDownload(blob, filename);
  return filename;
}

/**
 * 3. EXPORT TO ZIP ARCHIVE (.ZIP)
 * Includes Excel (.xlsx), CSV (.csv), Summary Report (.txt), and Raw Data (.json)
 */
export async function exportAttendanceToZip(
  summaries: OfficerAttendanceSummary[],
  rangeLabel: string,
  filterDivision: string = 'ALL'
): Promise<string> {
  const zip = new JSZip();
  const cleanDate = new Date().toISOString().split('T')[0];
  const folderName = `LAPORAN_ABSENSI_HSPD_${cleanDate}`;
  const folder = zip.folder(folderName) || zip;

  // 1. Add Excel File to ZIP
  const wb = XLSX.utils.book_new();
  const rekapData = summaries.map((s, idx) => ({
    'No': idx + 1,
    'Badge / NIK': s.badge,
    'Nama Lengkap Petugas': s.name,
    'Pangkat / Jabatan': s.rank,
    'Divisi': s.division,
    'Nomor Telepon': s.phone,
    'Total Durasi Dinas': s.totalDutyFormatted,
    'Total Menit': s.totalDutyMinutes,
    'Total Shift': s.totalShifts,
    'Hari Aktif': `${s.daysActiveCount} Hari`,
    'Status Dinas Terkini': s.currentStatus,
    'Predikat Absensi': s.attendanceStatus,
    'Aktivitas Terakhir': s.lastActiveFormatted,
    'Tanggal Terdaftar': s.registeredDate
  }));
  const wsRekap = XLSX.utils.json_to_sheet(rekapData);
  XLSX.utils.book_append_sheet(wb, wsRekap, 'Rekapitulasi Absensi');
  const excelArrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  folder.file(`Rekap_Absensi_HSPD_${cleanDate}.xlsx`, excelArrayBuffer);

  // 2. Add CSV File to ZIP
  const csvHeaders = ['No', 'Badge', 'Nama Petugas', 'Pangkat', 'Divisi', 'Telepon', 'Durasi Dinas', 'Total Menit', 'Total Shift', 'Hari Aktif', 'Status', 'Predikat', 'Terakhir Aktif', 'Terdaftar'];
  const csvRows = summaries.map((s, idx) => [
    idx + 1, `"${s.badge}"`, `"${s.name}"`, `"${s.rank}"`, `"${s.division}"`, `"${s.phone}"`, `"${s.totalDutyFormatted}"`, s.totalDutyMinutes, s.totalShifts, `"${s.daysActiveCount}"`, `"${s.currentStatus}"`, `"${s.attendanceStatus}"`, `"${s.lastActiveFormatted}"`, `"${s.registeredDate}"`
  ]);
  const csvContent = '\uFEFF' + [csvHeaders.join(','), ...csvRows.map(r => r.join(','))].join('\r\n');
  folder.file(`Rekap_Absensi_HSPD_${cleanDate}.csv`, csvContent);

  // 3. Add Human-Readable Text Summary Report (.txt)
  const totalOfficers = summaries.length;
  const activeOfficers = summaries.filter(s => s.totalDutyMinutes > 0).length;
  const totalAccumulatedMinutes = summaries.reduce((acc, s) => acc + s.totalDutyMinutes, 0);
  const totalHours = Math.floor(totalAccumulatedMinutes / 60);
  const remMinutes = totalAccumulatedMinutes % 60;
  
  const textSummary = `
================================================================================
           HIGH STATE POLICE DEPARTMENT (HSPD) - OFFICIAL MDT SYSTEM
                 REKAPITULASI & LAPORAN ABSENSI DINAS PETUGAS
================================================================================
Tanggal Cetak       : ${new Date().toLocaleString('id-ID')}
Periode Laporan     : ${rangeLabel}
Filter Divisi       : ${filterDivision === 'ALL' ? 'Semua Divisi Kepolisian' : filterDivision}
Total Personel      : ${totalOfficers} Petugas
Personel Berdinas   : ${activeOfficers} Petugas (${totalOfficers > 0 ? Math.round((activeOfficers / totalOfficers) * 100) : 0}%)
Akumulasi Jam Dinas : ${totalHours} Jam ${remMinutes} Menit

--------------------------------------------------------------------------------
DAFTAR PERINGKAT & PREDIKAT ABSENSI PERSONEL:
--------------------------------------------------------------------------------
${summaries.map((s, idx) => {
  return `${String(idx + 1).padStart(2, ' ')}. [${s.badge.padEnd(6, ' ')}] ${s.name.padEnd(25, ' ')} | ${s.rank.padEnd(24, ' ')} | ${s.division.padEnd(18, ' ')} | ${s.totalDutyFormatted.padEnd(16, ' ')} | ${s.attendanceStatus}`;
}).join('\n')}

================================================================================
Dokumen ini dihasilkan secara otomatis oleh Sistem MDT Terpadu HSPD.
Arsip Resmi Kepolisian Negara Bagian San Andreas.
================================================================================
`;
  folder.file(`RINGKASAN_LAPORAN_ABSENSI_${cleanDate}.txt`, textSummary.trim());

  // 4. Add Raw JSON Data (.json)
  folder.file(`raw_attendance_data_${cleanDate}.json`, JSON.stringify(summaries, null, 2));

  // Generate ZIP Blob
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const filename = `PAKET_ABSENSI_MINGGUAN_HSPD_${cleanDate}.zip`;
  triggerFileDownload(zipBlob, filename);
  return filename;
}

/**
 * 4. EXPORT TO PRINTABLE HTML DOCUMENT (.HTML)
 */
export function exportAttendanceToHTML(
  summaries: OfficerAttendanceSummary[],
  rangeLabel: string,
  filterDivision: string = 'ALL'
) {
  const totalOfficers = summaries.length;
  const activeOfficers = summaries.filter(s => s.totalDutyMinutes > 0).length;
  const totalAccumulatedMinutes = summaries.reduce((acc, s) => acc + s.totalDutyMinutes, 0);
  const totalHours = Math.floor(totalAccumulatedMinutes / 60);
  const remMinutes = totalAccumulatedMinutes % 60;

  const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Absensi Dinas HSPD - ${rangeLabel}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .container { max-width: 1200px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 24px; }
    .header-logo { display: flex; align-items: center; gap: 16px; }
    .logo-img { width: 64px; height: 64px; border-radius: 50%; }
    .title h1 { margin: 0; font-size: 22px; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; }
    .title p { margin: 4px 0 0 0; font-size: 13px; color: #64748b; font-weight: 500; }
    .meta-box { background: #f1f5f9; padding: 12px 18px; border-radius: 8px; font-size: 12px; border: 1px solid #cbd5e1; text-align: right; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; text-align: center; }
    .stat-card .val { font-size: 20px; font-weight: bold; color: #1e3a8a; }
    .stat-card .lbl { font-size: 11px; color: #64748b; text-transform: uppercase; margin-top: 4px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 16px; }
    th { background: #1e3a8a; color: #fff; text-align: left; padding: 10px 8px; font-weight: 600; text-transform: uppercase; font-size: 11px; }
    td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .badge-tag { background: #0f172a; color: #f8fafc; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-family: monospace; }
    .badge-rank { color: #b45309; font-weight: 600; }
    .badge-status { padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold; }
    .status-sangat-aktif { background: #dcfce7; color: #166534; }
    .status-aktif { background: #e0e7ff; color: #3730a3; }
    .status-cukup { background: #fef9c3; color: #854d0e; }
    .status-kurang { background: #fee2e2; color: #991b1b; }
    .status-belum { background: #f1f5f9; color: #64748b; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
    @media print {
      body { padding: 0; background: #fff; }
      .container { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo">
        <img src="${HSPD_LOGO_URL}" alt="HSPD Crest" class="logo-img">
        <div class="title">
          <h1>High State Police Department</h1>
          <p>Laporan Resmi Absensi & Jam Dinas Mingguan Personel</p>
        </div>
      </div>
      <div class="meta-box">
        <div><strong>Periode:</strong> ${rangeLabel}</div>
        <div><strong>Divisi:</strong> ${filterDivision === 'ALL' ? 'Semua Divisi' : filterDivision}</div>
        <div><strong>Waktu Cetak:</strong> ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="val">${totalOfficers}</div>
        <div class="lbl">Total Personel</div>
      </div>
      <div class="stat-card">
        <div class="val">${activeOfficers}</div>
        <div class="lbl">Personel Berdinas</div>
      </div>
      <div class="stat-card">
        <div class="val">${totalHours}j ${remMinutes}m</div>
        <div class="lbl">Total Akumulasi Jam</div>
      </div>
      <div class="stat-card">
        <div class="val">${activeOfficers > 0 ? Math.round(totalAccumulatedMinutes / activeOfficers) : 0} Mnt</div>
        <div class="lbl">Rata-Rata per Petugas</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 30px;">No</th>
          <th style="width: 80px;">Badge</th>
          <th>Nama Petugas</th>
          <th>Pangkat</th>
          <th>Divisi</th>
          <th>Total Jam Dinas</th>
          <th>Shift</th>
          <th>Hari</th>
          <th>Status Terkini</th>
          <th>Predikat</th>
        </tr>
      </thead>
      <tbody>
        ${summaries.map((s, idx) => {
          let statusClass = 'status-belum';
          if (s.attendanceStatus === 'SANGAT AKTIF') statusClass = 'status-sangat-aktif';
          else if (s.attendanceStatus === 'AKTIF') statusClass = 'status-aktif';
          else if (s.attendanceStatus === 'CUKUP') statusClass = 'status-cukup';
          else if (s.attendanceStatus === 'KURANG AKTIF') statusClass = 'status-kurang';

          return `<tr>
            <td>${idx + 1}</td>
            <td><span class="badge-tag">${s.badge}</span></td>
            <td><strong>${s.name}</strong></td>
            <td><span class="badge-rank">${s.rank}</span></td>
            <td>${s.division}</td>
            <td><strong>${s.totalDutyFormatted}</strong></td>
            <td>${s.totalShifts}x</td>
            <td>${s.daysActiveCount} Hari</td>
            <td>${s.currentStatus}</td>
            <td><span class="badge-status ${statusClass}">${s.attendanceStatus}</span></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <div class="footer">
      <div>MDT Integrated System • High State Police Department</div>
      <div>Dokumen Sah Kepolisian Negara Bagian San Andreas</div>
    </div>
  </div>

  <div class="no-print" style="text-align: center; margin-top: 20px;">
    <button onclick="window.print()" style="background: #1e3a8a; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-weight: bold; cursor: pointer;">
      🖨️ Cetak / Simpan PDF
    </button>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const cleanDate = new Date().toISOString().split('T')[0];
  const filename = `LAPORAN_ABSEN_HSPD_${cleanDate}.html`;
  triggerFileDownload(blob, filename);
  return filename;
}

/**
 * EXPORT REKAP DATA DINAS MINGGUAN (DUTY, TILANG, IMPOUND, KASUS, EVIDEN)
 * Menghasilkan Spreadsheet Excel dengan lembar ringkasan mingguan lengkap beserta breakdown per personel.
 */
export function exportWeeklyOperationsToExcel(
  summary: WeeklyOperationsSummary,
  filterDivision: string = 'ALL'
): string {
  const wb = XLSX.utils.book_new();

  // 1. SHEET RINGKASAN MINGGUAN
  const overviewRows = [
    { 'INDIKATOR OPERASIONAL MINGGUAN': 'Periode Laporan', 'JUMLAH / STATISTIK': summary.periodLabel },
    { 'INDIKATOR OPERASIONAL MINGGUAN': 'Filter Divisi', 'JUMLAH / STATISTIK': filterDivision === 'ALL' ? 'Semua Divisi Kepolisian' : filterDivision },
    { 'INDIKATOR OPERASIONAL MINGGUAN': 'Personel Aktif Berdinas', 'JUMLAH / STATISTIK': `${summary.totalDutyOfficers} Petugas` },
    { 'INDIKATOR OPERASIONAL MINGGUAN': 'Akumulasi Jam Dinas', 'JUMLAH / STATISTIK': `${summary.totalDutyHours} Jam ${summary.totalDutyMinutes % 60} Menit` },
    { 'INDIKATOR OPERASIONAL MINGGUAN': 'Total Upload / Terbitan Surat Tilang (Citations)', 'JUMLAH / STATISTIK': `${summary.totalCitationsCount} Berkas (Total Denda: $${summary.totalCitationsFine.toLocaleString()})` },
    { 'INDIKATOR OPERASIONAL MINGGUAN': 'Total Upload / Penyitaan Kendaraan (Impounds)', 'JUMLAH / STATISTIK': `${summary.totalImpoundsCount} Unit (Total Biaya Sita: $${summary.totalImpoundsFee.toLocaleString()})` },
    { 'INDIKATOR OPERASIONAL MINGGUAN': 'Total Upload Berkas Kasus Investigasi (Detective Cases)', 'JUMLAH / STATISTIK': `${summary.totalCasesCount} Kasus` },
    { 'INDIKATOR OPERASIONAL MINGGUAN': 'Total Upload Barang Bukti / Eviden (Evidence Items)', 'JUMLAH / STATISTIK': `${summary.totalEvidenceCount} Barang Bukti Terdaftar` },
    { 'INDIKATOR OPERASIONAL MINGGUAN': 'Waktu Cetak Dokumen', 'JUMLAH / STATISTIK': new Date().toLocaleString('id-ID') }
  ];

  const wsOverview = XLSX.utils.json_to_sheet(overviewRows);
  wsOverview['!cols'] = [{ wch: 55 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Ringkasan Jumlah Mingguan');

  // 2. SHEET REKAP PER PERSONEL
  const filteredBreakdown = filterDivision === 'ALL'
    ? summary.officerBreakdown
    : summary.officerBreakdown.filter(o => o.division.toLowerCase() === filterDivision.toLowerCase());

  const officerRows = filteredBreakdown.map((o, idx) => ({
    'No': idx + 1,
    'Badge': o.badge,
    'Nama Petugas': o.name,
    'Pangkat': o.rank,
    'Divisi': o.division,
    'Jam Dinas': o.dutyHoursFormatted,
    'Jumlah Shift': o.dutyShifts,
    'Upload Tilang (Citations)': o.citationsCount,
    'Total Denda Tilang ($)': o.citationsFine,
    'Upload Impound (Sita Kendaraan)': o.impoundsCount,
    'Upload Berkas Kasus': o.casesCount,
    'Upload Eviden (Barang Bukti)': o.evidenceCount
  }));

  const wsOfficers = XLSX.utils.json_to_sheet(officerRows);
  wsOfficers['!cols'] = [
    { wch: 5 },
    { wch: 10 },
    { wch: 25 },
    { wch: 22 },
    { wch: 18 },
    { wch: 15 },
    { wch: 14 },
    { wch: 24 },
    { wch: 22 },
    { wch: 28 },
    { wch: 20 },
    { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(wb, wsOfficers, 'Rekap per Personel');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const cleanDate = new Date().toISOString().split('T')[0];
  const filename = `REKAP_MINGGUAN_HSPD_DUTY_TILANG_IMPOUND_KASUS_${cleanDate}.xlsx`;
  triggerFileDownload(blob, filename);
  return filename;
}

/**
 * EXPORT REKAP DATA DINAS MINGGUAN KE FORMAT DOKUMEN CETAK / RESMI KEPOLISIAN (.HTML / PDF)
 */
export function exportWeeklyOperationsToDocument(
  summary: WeeklyOperationsSummary,
  filterDivision: string = 'ALL'
): string {
  const filteredBreakdown = filterDivision === 'ALL'
    ? summary.officerBreakdown
    : summary.officerBreakdown.filter(o => o.division.toLowerCase() === filterDivision.toLowerCase());

  const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Rekapitulasi Operasional Mingguan HSPD - ${summary.periodLabel}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 24px; background: #f8fafc; color: #0f172a; }
    .container { max-width: 1000px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 18px; margin-bottom: 20px; }
    .header-logo { display: flex; align-items: center; gap: 16px; }
    .logo-img { width: 68px; height: 68px; border-radius: 50%; object-fit: contain; }
    .title h1 { margin: 0; font-size: 22px; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px; }
    .title p { margin: 4px 0 0; font-size: 13px; color: #475569; font-weight: 600; }
    .meta-box { background: #f1f5f9; padding: 12px 18px; border-radius: 8px; font-size: 12px; border: 1px solid #cbd5e1; text-align: right; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; text-align: center; }
    .summary-card .val { font-size: 22px; font-weight: bold; color: #0369a1; }
    .summary-card .lbl { font-size: 11px; color: #64748b; text-transform: uppercase; margin-top: 4px; font-weight: 700; }
    .summary-card .sub { font-size: 10px; color: #059669; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 14px; }
    th { background: #0f172a; color: #fff; text-align: left; padding: 9px 8px; font-weight: 600; text-transform: uppercase; font-size: 10px; }
    td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .badge-tag { background: #0f172a; color: #f8fafc; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-family: monospace; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
    @media print {
      body { padding: 0; background: #fff; }
      .container { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-logo">
        <img src="${HSPD_LOGO_URL}" alt="HSPD Crest" class="logo-img">
        <div class="title">
          <h1>High State Police Department</h1>
          <p>Laporan Rekapitulasi Mingguan: Duty, Tilang, Impound, Kasus & Eviden</p>
        </div>
      </div>
      <div class="meta-box">
        <div><strong>Periode:</strong> ${summary.periodLabel}</div>
        <div><strong>Divisi:</strong> ${filterDivision === 'ALL' ? 'Semua Divisi Kepolisian' : filterDivision}</div>
        <div><strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="val">${summary.totalDutyHours}j ${summary.totalDutyMinutes % 60}m</div>
        <div class="lbl">Total Jam Dinas</div>
        <div class="sub">${summary.totalDutyOfficers} Personel Aktif</div>
      </div>
      <div class="summary-card">
        <div class="val">${summary.totalCitationsCount}</div>
        <div class="lbl">Upload Surat Tilang</div>
        <div class="sub">$${summary.totalCitationsFine.toLocaleString()} Total Denda</div>
      </div>
      <div class="summary-card">
        <div class="val">${summary.totalImpoundsCount}</div>
        <div class="lbl">Upload Sita Kendaraan</div>
        <div class="sub">$${summary.totalImpoundsFee.toLocaleString()} Total Biaya</div>
      </div>
      <div class="summary-card">
        <div class="val">${summary.totalCasesCount} / ${summary.totalEvidenceCount}</div>
        <div class="lbl">Kasus & Eviden</div>
        <div class="sub">Total Barang Bukti Terdata</div>
      </div>
    </div>

    <h3>Rincian Rekapitulasi per Personel Kepolisian</h3>
    <table>
      <thead>
        <tr>
          <th>No</th>
          <th>Badge</th>
          <th>Nama Petugas</th>
          <th>Pangkat</th>
          <th>Divisi</th>
          <th>Jam Dinas</th>
          <th>Tilang</th>
          <th>Impound</th>
          <th>Kasus</th>
          <th>Eviden</th>
        </tr>
      </thead>
      <tbody>
        ${filteredBreakdown.map((o, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><span class="badge-tag">${o.badge}</span></td>
            <td><strong>${o.name}</strong></td>
            <td>${o.rank}</td>
            <td>${o.division}</td>
            <td><strong>${o.dutyHoursFormatted}</strong> (${o.dutyShifts}x)</td>
            <td><strong>${o.citationsCount}</strong> ($${o.citationsFine.toLocaleString()})</td>
            <td><strong>${o.impoundsCount}</strong></td>
            <td><strong>${o.casesCount}</strong></td>
            <td><strong>${o.evidenceCount}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer">
      <div>MDT Integrated Command • High State Police Department</div>
      <div>Dokumen Resmi Arsip Jajaran High Command</div>
    </div>
  </div>

  <div class="no-print" style="text-align: center; margin-top: 20px;">
    <button onclick="window.print()" style="background: #0369a1; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-weight: bold; cursor: pointer;">
      🖨️ Cetak / Simpan PDF Dokumen Rekap
    </button>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const cleanDate = new Date().toISOString().split('T')[0];
  const filename = `DOKUMEN_REKAP_MINGGUAN_HSPD_${cleanDate}.html`;
  triggerFileDownload(blob, filename);
  return filename;
}

