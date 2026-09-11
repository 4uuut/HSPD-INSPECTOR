import { TrafficCitationRecord, ImpoundRecord } from '../types';
import { pushAllToFirestore } from '../services/firebaseRealtimeSync';

export const TRAFFIC_CITATION_STORAGE_KEY = 'hspd_traffic_citations_v1';

export const INITIAL_TRAFFIC_CITATIONS: TrafficCitationRecord[] = [
  {
    id: 'CIT-2026-001',
    officerName: 'Momo Hatakeyama',
    officerBadge: '001',
    dayDate: 'Jumat, 11 September 2026',
    timeString: '14:20 WIB',
    violatorName: 'Dominic Toretto',
    location: 'Commerce Intersection, Los Santos',
    vehicleModel: 'Dodge Charger SRT / Buffalo S',
    plateNumber: 'FAST-01',
    violations: 'Pasal 24 (Ugal-ugalan / Reckless Driving) & Pasal 18 (Melebihi Batas Kecepatan 140 KM/J)',
    totalFine: 4500,
    notes: 'Pelanggar memacu kendaraan dengan kecepatan tinggi di zona padat sipil, kooperatif saat dihentikan.',
    hasEvidence: true,
    status: 'PAID',
    timestamp: Date.now() - 3600000 * 2
  },
  {
    id: 'CIT-2026-002',
    officerName: 'Brian OConner',
    officerBadge: '042',
    dayDate: 'Jumat, 11 September 2026',
    timeString: '11:05 WIB',
    violatorName: 'Carl Johnson',
    location: 'Idlewood Gas Station, East Los Santos',
    vehicleModel: 'Savanna Lowrider',
    plateNumber: 'CJ-1992',
    violations: 'Pasal 09 (Menerobos Lampu Merah) & Pasal 12 (Parkir Sembarangan di Jalur Darurat)',
    totalFine: 2800,
    notes: 'Kendaraan diparkir menghalangi pompa bensin dan menerobos persimpangan lampu merah.',
    hasEvidence: true,
    status: 'UNPAID',
    timestamp: Date.now() - 3600000 * 6
  }
];

export function getSavedTrafficCitations(): TrafficCitationRecord[] {
  try {
    const raw = localStorage.getItem(TRAFFIC_CITATION_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed reading traffic citation records', e);
  }
  return INITIAL_TRAFFIC_CITATIONS;
}

export function saveTrafficCitations(citations: TrafficCitationRecord[]): void {
  try {
    localStorage.setItem(TRAFFIC_CITATION_STORAGE_KEY, JSON.stringify(citations));
    window.dispatchEvent(new Event('hspd-traffic-citations-updated'));
    pushAllToFirestore('TRAFFIC_CITATIONS', citations).catch(console.error);
  } catch (e) {
    console.error('Failed saving traffic citation records', e);
  }
}

/**
 * Formats a Traffic Citation into the exact standard layout requested by user:
 * 
 * Nama Petugas    : 
 * Hari/Tanggal    : 
 * Jam             : 
 * Nama            : 
 * Nama tempat     : 
 * Jenis Kendaraan : 
 * Plat Nomor      : 
 * Pasal Pelanggaran     : 
 * Total Denda     : 
 * Catatan         : 
 * 
 * Bukti : Ada
 */
export function formatTrafficCitationAsText(c: TrafficCitationRecord): string {
  const buktiStatus = (c.hasEvidence || (c.evidenceImage && c.evidenceImage.length > 0)) ? 'Ada' : 'Tidak Ada';
  const fineFormatted = typeof c.totalFine === 'number' 
    ? `$${c.totalFine.toLocaleString('id-ID')}` 
    : `${c.totalFine}`;

  return [
    `Nama Petugas    : ${c.officerName}${c.officerBadge ? ` [${c.officerBadge}]` : ''}`,
    `Hari/Tanggal    : ${c.dayDate}`,
    `Jam             : ${c.timeString}`,
    `Nama            : ${c.violatorName}`,
    `Nama tempat     : ${c.location}`,
    `Jenis Kendaraan : ${c.vehicleModel}`,
    `Plat Nomor      : ${c.plateNumber}`,
    `Pasal Pelanggaran     : ${c.violations}`,
    `Total Denda     : ${fineFormatted}`,
    `Catatan         : ${c.notes || '-'}`,
    ``,
    `Bukti : ${buktiStatus}`
  ].join('\n');
}

/**
 * Formats an Impound Record into the exact standard layout requested by user:
 */
export function formatImpoundAsText(imp: ImpoundRecord): string {
  const dayDate = imp.dayDate || new Date(imp.timestamp).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const timeString = imp.timeString || new Date(imp.timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  }) + ' WIB';

  const fineFormatted = `$${(imp.impoundFee || 0).toLocaleString('id-ID')} (Sita ${imp.impoundDays || 3} Hari)`;
  const buktiStatus = (imp.hasEvidence || (imp.evidenceImage && imp.evidenceImage.length > 0)) ? 'Ada' : 'Tidak Ada';

  return [
    `Nama Petugas    : ${imp.officerName}${imp.officerBadge ? ` [${imp.officerBadge}]` : ''}`,
    `Hari/Tanggal    : ${dayDate}`,
    `Jam             : ${timeString}`,
    `Nama            : ${imp.ownerName}`,
    `Nama tempat     : ${imp.locationFound || 'Commerce, Los Santos'}`,
    `Jenis Kendaraan : ${imp.vehicleModel}${imp.color ? ` (${imp.color})` : ''}`,
    `Plat Nomor      : ${imp.plateNumber}`,
    `Pasal Pelanggaran     : ${imp.violations || imp.reason}`,
    `Total Denda     : ${fineFormatted}`,
    `Catatan         : ${imp.notes || imp.reason || 'Penyitaan di Garasi Impound Lot'}`,
    ``,
    `Bukti : ${buktiStatus}`
  ].join('\n');
}

/**
 * Helper to get current Indonesian day and date string (e.g. "Jumat, 11 September 2026")
 */
export function getCurrentDayDateString(): string {
  const now = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

/**
 * Helper to get current time string (e.g. "14:35 WIB")
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} WIB`;
}
