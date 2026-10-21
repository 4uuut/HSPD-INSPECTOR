import { OfficerAccount } from '../types';
import { pushToFirestore } from '../services/firebaseRealtimeSync';
import { logDeveloperSystemActivity } from './activityMonitoringStorage';
import * as XLSX from 'xlsx';

export type AttendanceStatusCode = 'HADIR' | 'ABSEN' | 'IZIN' | 'SAKIT' | 'CUTI' | 'OFF' | 'NONE';

export interface AttendanceStatusInfo {
  code: AttendanceStatusCode;
  label: string;
  icon: string;
  shortLabel: string;
  badgeClass: string;
  buttonClass: string;
  bgClass: string;
  colorClass: string;
}

export const ATTENDANCE_STATUS_META: Record<AttendanceStatusCode, AttendanceStatusInfo> = {
  HADIR: {
    code: 'HADIR',
    label: 'Hadir',
    icon: '✅',
    shortLabel: 'Hadir',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-600',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    bgClass: 'bg-emerald-950/40',
    colorClass: 'text-emerald-400'
  },
  ABSEN: {
    code: 'ABSEN',
    label: 'Absen / Alfa',
    icon: '❌',
    shortLabel: 'Absen',
    badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-600',
    buttonClass: 'bg-rose-600 hover:bg-rose-500 text-white',
    bgClass: 'bg-rose-950/40',
    colorClass: 'text-rose-400'
  },
  IZIN: {
    code: 'IZIN',
    label: 'Izin',
    icon: '📝',
    shortLabel: 'Izin',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-600',
    buttonClass: 'bg-amber-600 hover:bg-amber-500 text-white',
    bgClass: 'bg-amber-950/40',
    colorClass: 'text-amber-400'
  },
  SAKIT: {
    code: 'SAKIT',
    label: 'Sakit',
    icon: '🤒',
    shortLabel: 'Sakit',
    badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-600',
    buttonClass: 'bg-cyan-600 hover:bg-cyan-500 text-white',
    bgClass: 'bg-cyan-950/40',
    colorClass: 'text-cyan-400'
  },
  CUTI: {
    code: 'CUTI',
    label: 'Cuti Resmi',
    icon: '🌴',
    shortLabel: 'Cuti',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-600',
    buttonClass: 'bg-purple-600 hover:bg-purple-500 text-white',
    bgClass: 'bg-purple-950/40',
    colorClass: 'text-purple-400'
  },
  OFF: {
    code: 'OFF',
    label: 'Lepas Dinas / Libur',
    icon: '⚪',
    shortLabel: 'Libur',
    badgeClass: 'bg-gray-800 text-gray-300 border-gray-600',
    buttonClass: 'bg-gray-700 hover:bg-gray-600 text-white',
    bgClass: 'bg-gray-900/40',
    colorClass: 'text-gray-400'
  },
  NONE: {
    code: 'NONE',
    label: 'Belum Diisi',
    icon: '—',
    shortLabel: 'Kosong',
    badgeClass: 'bg-gray-900/40 text-gray-500 border-gray-800/60',
    buttonClass: 'bg-gray-800 hover:bg-gray-700 text-gray-400',
    bgClass: 'bg-transparent',
    colorClass: 'text-gray-500'
  }
};

export const ORDERED_STATUS_CODES: AttendanceStatusCode[] = [
  'HADIR', 'ABSEN', 'IZIN', 'SAKIT', 'CUTI', 'OFF', 'NONE'
];

export interface ManualAttendanceRecord {
  id: string; // key `${normalizeOfficerKey(officerBadge)}_${dateStr}`
  date: string; // "YYYY-MM-DD"
  officerBadge: string;
  officerName: string;
  status: AttendanceStatusCode;
  markedBy: string;
  markedByBadge?: string;
  markedByRank?: string;
  markedAt: number;
  notes?: string;
  updatedAt: number;
}

const STORAGE_KEY = 'hspd_manual_attendance_records_v2';

export function normalizeOfficerAttendanceKey(badgeOrName: string): string {
  if (!badgeOrName) return 'unknown';
  return badgeOrName.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function buildAttendanceRecordKey(officerBadge: string, dateStr: string): string {
  const bKey = normalizeOfficerAttendanceKey(officerBadge);
  return `${bKey}_${dateStr}`;
}

export function getManualAttendanceRegistry(): Record<string, ManualAttendanceRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load manual attendance records', err);
  }
  return {};
}

export function saveManualAttendanceRegistry(records: Record<string, ManualAttendanceRecord>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));

    // Sync to Firestore
    pushToFirestore('SYSTEM_CONFIGS', { id: 'manual_attendance', records, updatedAt: Date.now() }, 'manual_attendance').catch(console.error);

    // Intra-app live sync event
    window.dispatchEvent(new CustomEvent('hspd-manual-attendance-updated', {
      detail: { records, timestamp: Date.now() }
    }));
  } catch (err) {
    console.error('Failed to save manual attendance records', err);
  }
}

/**
 * Gets attendance status for a specific officer on a specific date
 */
export function getOfficerAttendanceStatus(
  officerBadge: string,
  dateStr: string,
  officerName?: string
): ManualAttendanceRecord | undefined {
  const registry = getManualAttendanceRegistry();
  const key1 = buildAttendanceRecordKey(officerBadge, dateStr);
  if (registry[key1]) return registry[key1];

  if (officerName) {
    const key2 = buildAttendanceRecordKey(officerName, dateStr);
    if (registry[key2]) return registry[key2];
  }

  return undefined;
}

/**
 * Sets or updates attendance status for an officer on a specific date
 */
export function setOfficerAttendanceStatus(params: {
  officerBadge: string;
  officerName: string;
  dateStr: string; // "YYYY-MM-DD"
  status: AttendanceStatusCode;
  markedBy: string;
  markedByBadge?: string;
  markedByRank?: string;
  notes?: string;
}): ManualAttendanceRecord {
  const registry = getManualAttendanceRegistry();
  const recordKey = buildAttendanceRecordKey(params.officerBadge, params.dateStr);

  const newRecord: ManualAttendanceRecord = {
    id: recordKey,
    date: params.dateStr,
    officerBadge: params.officerBadge,
    officerName: params.officerName,
    status: params.status,
    markedBy: params.markedBy,
    markedByBadge: params.markedByBadge,
    markedByRank: params.markedByRank,
    markedAt: Date.now(),
    notes: params.notes,
    updatedAt: Date.now()
  };

  registry[recordKey] = newRecord;

  // Also index by name if available
  if (params.officerName) {
    const nameKey = buildAttendanceRecordKey(params.officerName, params.dateStr);
    registry[nameKey] = newRecord;
  }

  saveManualAttendanceRegistry(registry);

  logDeveloperSystemActivity({
    module: 'ROSTER',
    action: 'DUTY_LOG',
    title: `Absensi Manual Ditandai: ${params.officerName} (${params.officerBadge})`,
    description: `Status ${params.dateStr} diubah menjadi ${ATTENDANCE_STATUS_META[params.status]?.icon} ${ATTENDANCE_STATUS_META[params.status]?.label} oleh ${params.markedBy}.`,
    entity: 'HSPD',
    actor: params.markedBy,
    actorBadge: params.markedByBadge,
    severity: 'INFO'
  });

  return newRecord;
}

/**
 * Cycle to the next attendance status (convenient 1-click rotation for superiors)
 */
export function cycleOfficerAttendanceStatus(params: {
  officerBadge: string;
  officerName: string;
  dateStr: string;
  currentStatus: AttendanceStatusCode;
  markedBy: string;
  markedByBadge?: string;
  markedByRank?: string;
}): AttendanceStatusCode {
  const order: AttendanceStatusCode[] = ['NONE', 'HADIR', 'ABSEN', 'IZIN', 'SAKIT', 'CUTI', 'OFF'];
  const currentIndex = order.indexOf(params.currentStatus);
  const nextIndex = (currentIndex + 1) % order.length;
  const nextStatus = order[nextIndex];

  setOfficerAttendanceStatus({
    officerBadge: params.officerBadge,
    officerName: params.officerName,
    dateStr: params.dateStr,
    status: nextStatus,
    markedBy: params.markedBy,
    markedByBadge: params.markedByBadge,
    markedByRank: params.markedByRank
  });

  return nextStatus;
}

/**
 * Batch mark all currently on-duty officers as HADIR (✅) for today
 */
export function batchMarkOnDutyOfficersAsHadir(params: {
  roster: OfficerAccount[];
  dateStr: string;
  markedBy: string;
  markedByBadge?: string;
  markedByRank?: string;
  getDutyState: (badge: string) => { isDuty: boolean };
}): number {
  let count = 0;
  const registry = getManualAttendanceRegistry();

  params.roster.forEach(officer => {
    const duty = params.getDutyState(officer.badge);
    if (duty && duty.isDuty) {
      const recordKey = buildAttendanceRecordKey(officer.badge, params.dateStr);
      const record: ManualAttendanceRecord = {
        id: recordKey,
        date: params.dateStr,
        officerBadge: officer.badge,
        officerName: officer.name,
        status: 'HADIR',
        markedBy: `${params.markedBy} (Auto On-Duty Sync)`,
        markedByBadge: params.markedByBadge,
        markedByRank: params.markedByRank,
        markedAt: Date.now(),
        notes: 'Otomatis ditandai hadir berdasarkan status 10-8 On-Duty',
        updatedAt: Date.now()
      };
      registry[recordKey] = record;
      if (officer.name) {
        registry[buildAttendanceRecordKey(officer.name, params.dateStr)] = record;
      }
      count++;
    }
  });

  if (count > 0) {
    saveManualAttendanceRegistry(registry);
    logDeveloperSystemActivity({
      module: 'ROSTER',
      action: 'DUTY_LOG',
      title: `Batch Absensi: ${count} Petugas On-Duty Ditandai Hadir`,
      description: `Atasan ${params.markedBy} menandai hadir seluruh personel yang sedang aktif bertugas pada ${params.dateStr}.`,
      entity: 'HSPD',
      actor: params.markedBy,
      actorBadge: params.markedByBadge,
      severity: 'INFO'
    });
  }

  return count;
}

export interface DayColumnInfo {
  dateStr: string; // "YYYY-MM-DD"
  dayName: string; // "Senin", "Selasa", etc.
  dayShort: string; // "Sen", "Sel", etc.
  displayDate: string; // "20 Okt"
  fullLabel: string; // "Senin, 20 Oktober 2026"
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday...
}

export interface WeekCalendarInfo {
  weekOffset: number; // 0 = current week, -1 = previous, +1 = next
  startDateStr: string;
  endDateStr: string;
  weekLabel: string; // "19 Okt - 25 Okt 2026"
  days: DayColumnInfo[];
}

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDO_DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const INDO_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const INDO_MONTHS_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Generates 7-day calendar week info based on week offset (Monday to Sunday)
 */
export function getWeekCalendarInfo(weekOffset: number = 0, referenceDate: Date = new Date()): WeekCalendarInfo {
  const targetDate = new Date(referenceDate);
  targetDate.setDate(targetDate.getDate() + (weekOffset * 7));

  // Determine Monday of this week (ISO week: Monday = 1, Sunday = 0)
  const currentDay = targetDate.getDay(); // 0 is Sunday
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() + distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const todayStr = formatToIsoDateString(new Date());

  const days: DayColumnInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = formatToIsoDateString(d);
    const dayOfWeek = d.getDay();

    const isToday = dateStr === todayStr;
    const isPast = dateStr < todayStr;
    const isFuture = dateStr > todayStr;

    const dayName = INDO_DAYS[dayOfWeek];
    const dayShort = INDO_DAYS_SHORT[dayOfWeek];
    const displayDate = `${d.getDate()} ${INDO_MONTHS_SHORT[d.getMonth()]}`;
    const fullLabel = `${dayName}, ${d.getDate()} ${INDO_MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;

    days.push({
      dateStr,
      dayName,
      dayShort,
      displayDate,
      fullLabel,
      isToday,
      isPast,
      isFuture,
      dayOfWeek
    });
  }

  const startDay = days[0];
  const endDay = days[6];
  const weekLabel = `${startDay.displayDate} - ${endDay.displayDate} ${monday.getFullYear()}`;

  return {
    weekOffset,
    startDateStr: startDay.dateStr,
    endDateStr: endDay.dateStr,
    weekLabel,
    days
  };
}

export function formatToIsoDateString(d: Date): string {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface OfficerWeeklySummary {
  hadir: number;
  absen: number;
  izin: number;
  sakit: number;
  cuti: number;
  off: number;
  none: number;
  totalMarkedDays: number;
  attendanceRatePercent: number;
}

export function calculateOfficerWeeklySummary(
  officerBadge: string,
  weekDays: DayColumnInfo[],
  officerName?: string
): OfficerWeeklySummary {
  let hadir = 0;
  let absen = 0;
  let izin = 0;
  let sakit = 0;
  let cuti = 0;
  let off = 0;
  let none = 0;

  weekDays.forEach(day => {
    const rec = getOfficerAttendanceStatus(officerBadge, day.dateStr, officerName);
    const status = rec ? rec.status : 'NONE';

    switch (status) {
      case 'HADIR': hadir++; break;
      case 'ABSEN': absen++; break;
      case 'IZIN': izin++; break;
      case 'SAKIT': sakit++; break;
      case 'CUTI': cuti++; break;
      case 'OFF': off++; break;
      default: none++; break;
    }
  });

  const totalMarkedDays = hadir + absen + izin + sakit + cuti + off;
  // Attendance rate is Hadir / (Hadir + Absen), or Hadir / (Total Working Days)
  const countableWorkDays = hadir + absen;
  const attendanceRatePercent = countableWorkDays > 0 
    ? Math.round((hadir / countableWorkDays) * 100) 
    : (hadir > 0 ? 100 : 0);

  return {
    hadir,
    absen,
    izin,
    sakit,
    cuti,
    off,
    none,
    totalMarkedDays,
    attendanceRatePercent
  };
}

/**
 * Export complete weekly manual attendance report to Excel
 */
export function exportWeeklyAttendanceToExcel(params: {
  roster: OfficerAccount[];
  weekCalendar: WeekCalendarInfo;
  departmentName?: string;
  exportedBy?: string;
}) {
  const { roster, weekCalendar, departmentName = 'HIGH STATE POLICE DEPARTMENT', exportedBy = 'SUPERIOR / HIGH COMMAND' } = params;

  const headerRows = [
    [departmentName.toUpperCase()],
    [`LEMBAR REKAPITULASI ABSENSI MANUAL PEJABAT / ATASAN`],
    [`PERIODE MINGGUAN: ${weekCalendar.weekLabel}`],
    [`Diekspor Oleh: ${exportedBy} • Tanggal Ekspor: ${new Date().toLocaleString('id-ID')}`],
    []
  ];

  const tableHeader = [
    'No',
    'Nomor Badge',
    'Nama Lengkap',
    'Pangkat / Jabatan',
    'Divisi Operasional',
    ...weekCalendar.days.map(d => `${d.dayName}\n(${d.displayDate})`),
    'Total Hadir (✅)',
    'Total Absen (❌)',
    'Total Izin (📝)',
    'Total Sakit (🏥)',
    'Total Cuti (🏖️)',
    'Persentase Kehadiran (%)'
  ];

  const dataRows = roster.map((officer, idx) => {
    const summary = calculateOfficerWeeklySummary(officer.badge, weekCalendar.days, officer.name);

    const dayCells = weekCalendar.days.map(day => {
      const rec = getOfficerAttendanceStatus(officer.badge, day.dateStr, officer.name);
      if (!rec || rec.status === 'NONE') return '-';
      const meta = ATTENDANCE_STATUS_META[rec.status];
      return `${meta.icon} ${meta.label}`;
    });

    return [
      idx + 1,
      officer.badge,
      officer.name,
      officer.rank,
      officer.division || '-',
      ...dayCells,
      summary.hadir,
      summary.absen,
      summary.izin,
      summary.sakit,
      summary.cuti,
      `${summary.attendanceRatePercent}%`
    ];
  });

  const fullSheetData = [...headerRows, tableHeader, ...dataRows];
  const worksheet = XLSX.utils.aoa_to_sheet(fullSheetData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 12 }, // Badge
    { wch: 25 }, // Name
    { wch: 22 }, // Rank
    { wch: 22 }, // Division
    { wch: 15 }, // Day 1
    { wch: 15 }, // Day 2
    { wch: 15 }, // Day 3
    { wch: 15 }, // Day 4
    { wch: 15 }, // Day 5
    { wch: 15 }, // Day 6
    { wch: 15 }, // Day 7
    { wch: 15 }, // Hadir
    { wch: 15 }, // Absen
    { wch: 14 }, // Izin
    { wch: 14 }, // Sakit
    { wch: 14 }, // Cuti
    { wch: 22 }, // Rate %
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Absensi Mingguan');

  const cleanFileName = `HSPD_Rekap_Absensi_Manual_${weekCalendar.startDateStr}_sd_${weekCalendar.endDateStr}.xlsx`;
  XLSX.writeFile(workbook, cleanFileName);
}
