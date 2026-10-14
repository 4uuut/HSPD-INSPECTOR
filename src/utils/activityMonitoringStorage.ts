import { 
  SystemActivityLog, 
  ActivityEntity, 
  ActivityActionType, 
  BoloAlert, 
  CitizenProfile 
} from '../types';
import { getSavedBoloAlerts, saveBoloAlerts } from './boloImpoundStorage';
import { getSavedCitizens, saveCitizens } from './citizenDmvStorage';
import { getSavedTrafficCitations } from './trafficCitationStorage';
import { getSavedImpounds } from './boloImpoundStorage';
import { getSavedOfficialDocuments } from './documentStorage';
import { getGovernmentPermits } from './governmentOperationsStorage';
import { getSavedDivisionCaseFiles } from './specializedDivisionsStorage';
import { getSavedDetectiveCases } from './detectiveCaseStorage';

export const ACTIVITY_LOGS_STORAGE_KEY = 'hspd_developer_activity_logs_v1';
export const DEVELOPER_MASTER_PASSCODES = ['DEV-HSPD-2026', 'DEV-MASTER-ROOT', 'root', 'admin9999', 'HSPD-DEV-99'];

/**
 * Log a single activity into persistent storage
 */
export function logDeveloperSystemActivity(
  log: Omit<SystemActivityLog, 'id' | 'timestamp'> & { timestamp?: number }
): SystemActivityLog {
  const newLog: SystemActivityLog = {
    id: `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: log.timestamp || Date.now(),
    ...log
  };

  try {
    const raw = localStorage.getItem(ACTIVITY_LOGS_STORAGE_KEY);
    const existing: SystemActivityLog[] = raw ? JSON.parse(raw) : [];
    const updated = [newLog, ...existing].slice(0, 500); // keep last 500
    localStorage.setItem(ACTIVITY_LOGS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('hspd-activity-log-updated'));
  } catch (e) {
    console.error('Failed to save activity log:', e);
  }

  return newLog;
}

/**
 * Aggregates all activities from across the application (HSPD CAD/MDT + State Government)
 */
export function getAllAggregatedActivities(): SystemActivityLog[] {
  const combined: SystemActivityLog[] = [];

  // 1. Custom Recorded Activity Logs
  try {
    const raw = localStorage.getItem(ACTIVITY_LOGS_STORAGE_KEY);
    if (raw) {
      const parsed: SystemActivityLog[] = JSON.parse(raw);
      if (Array.isArray(parsed)) combined.push(...parsed);
    }
  } catch {}

  // 2. Arrest Records from HSPD
  try {
    const rawArrests = localStorage.getItem('hspd_arrest_records_v1');
    if (rawArrests) {
      const arrests = JSON.parse(rawArrests);
      if (Array.isArray(arrests)) {
        arrests.forEach((r: any) => {
          combined.push({
            id: `ACT-ARR-${r.id}`,
            entity: 'HSPD',
            module: 'Catatan Kasus & Penangkapan',
            action: 'ARREST_CASE',
            title: `Penangkapan: ${r.suspectName}`,
            description: `Tersangka ${r.suspectName} ditindak atas pasal: ${(r.pasalCodes || []).join(', ') || 'Pelanggaran KUHP'}. Denda: $${(r.totalFine || 0).toLocaleString()} / Kurungan: ${r.totalJail || 0} bln.`,
            actor: r.officerName || 'Officer',
            actorBadge: r.officerBadge || '#HSPD',
            target: r.suspectName,
            severity: 'WARNING',
            timestamp: r.timestamp || Date.now() - 3600000
          });
        });
      }
    }
  } catch {}

  // 3. BOLO Alerts from HSPD
  try {
    const bolos = getSavedBoloAlerts();
    bolos.forEach(b => {
      combined.push({
        id: `ACT-BOLO-${b.id}`,
        entity: 'HSPD',
        module: 'Siaga BOLO & DPO',
        action: 'BOLO_ALERT',
        title: `Peringatan BOLO [${b.type}]: ${b.title}`,
        description: b.description || 'Peringatan siaga buronan aktif disiarkan.',
        actor: b.issuedBy || 'High Command',
        actorBadge: b.issuedByBadge || '#001',
        target: b.title,
        severity: b.active ? 'CRITICAL' : 'INFO',
        timestamp: b.timestamp || Date.now() - 7200000
      });
    });
  } catch {}

  // 4. Traffic Citations from HSPD
  try {
    const citations = getSavedTrafficCitations();
    citations.forEach(c => {
      combined.push({
        id: `ACT-CIT-${c.id}`,
        entity: 'HSPD',
        module: 'Satlantas (TED Citations)',
        action: 'CITATION',
        title: `Surat Tilang: ${c.violatorName} (Plat: ${c.plateNumber})`,
        description: `Pelanggaran: ${c.violations || 'Pelanggaran Lalu Lintas'}. Total Denda: $${(c.totalFine || 0).toLocaleString()} (Lokasi: ${c.location || 'Los Santos'}).`,
        actor: c.officerName || 'Traffic Officer',
        actorBadge: c.officerBadge || '#TED',
        target: c.violatorName,
        severity: 'WARNING',
        timestamp: (c as any).timestamp || Date.now() - 10800000
      });
    });
  } catch {}

  // 5. Impound Records from HSPD
  try {
    const impounds = getSavedImpounds();
    impounds.forEach(imp => {
      combined.push({
        id: `ACT-IMP-${imp.id}`,
        entity: 'HSPD',
        module: 'Sitaan Kendaraan (Impound)',
        action: 'IMPOUND',
        title: `Sitaan Kendaraan: ${imp.vehicleModel} [${imp.plateNumber}]`,
        description: `Alasan sita: ${imp.reason || 'Barang Bukti Kejahatan'}. Pemilik: ${imp.ownerName}. Biaya tebus: $${(imp.impoundFee || 0).toLocaleString()}.`,
        actor: imp.officerName || 'Impound Officer',
        actorBadge: imp.officerBadge || '#HSPD',
        target: `${imp.plateNumber} (${imp.ownerName})`,
        severity: 'INFO',
        timestamp: imp.timestamp || Date.now() - 14400000
      });
    });
  } catch {}

  // 6. Division Tactical Operations (SWAT, ASD, etc.)
  try {
    const divisionCases = getSavedDivisionCaseFiles();
    divisionCases.forEach(dc => {
      combined.push({
        id: `ACT-DIV-${dc.id}`,
        entity: 'HSPD',
        module: `Divisi Khusus (${dc.division})`,
        action: 'DIVISION_OP',
        title: `Operasi ${dc.division}: ${dc.caseTitle}`,
        description: `Status: ${dc.outcomeStatus}. TKP: ${dc.location}. Tersangka: ${dc.suspectsCount} orang. Sandera diselamatkan: ${dc.hostagesCount}. Sitaan: ${dc.lootRecovered || '-'}.`,
        actor: dc.commanderName || 'Tactical Lead',
        actorBadge: dc.commanderBadge || '#045',
        target: dc.caseTitle,
        severity: dc.outcomeStatus === 'BERHASIL' ? 'SUCCESS' : 'CRITICAL',
        timestamp: dc.createdAt || Date.now() - 18000000
      });
    });
  } catch {}

  // 7. Government Permits & NIB (State Government)
  try {
    const permits = getGovernmentPermits();
    permits.forEach(p => {
      combined.push({
        id: `ACT-GOV-PERM-${p.id}`,
        entity: 'GOVERNMENT',
        module: 'Perizinan Usaha & NIB',
        action: 'GOV_PERMIT',
        title: `Izin Usaha / Dokumen: ${p.title || p.businessOrDetails || 'Permit'} (${p.category})`,
        description: `Pemohon: ${p.applicantName} (NIK: ${p.applicantId}). Keterangan: ${p.businessOrDetails}. Status Izin: ${p.status}. Biaya/Pajak: $${(p.feeAmount || 0).toLocaleString()}.`,
        actor: p.approvedBy || p.applicantName || 'State Registrar',
        actorBadge: '#GOV-NIB',
        target: p.businessOrDetails || p.applicantName,
        severity: p.status === 'APPROVED' ? 'SUCCESS' : 'INFO',
        timestamp: p.createdAt || Date.now() - 21600000
      });
    });
  } catch {}

  // 8. Official Documents & SKCK (HSPD & Government)
  try {
    const docs = getSavedOfficialDocuments();
    docs.forEach(doc => {
      const cat = doc.category as string;
      const isGov = (doc as any).department === 'PEMERINTAHAN' || cat === 'BUSINESS_PERMIT' || cat === 'GOV_DECREE' || cat === 'EXECUTIVE_ORDER';
      combined.push({
        id: `ACT-DOC-${doc.id}`,
        entity: isGov ? 'GOVERNMENT' : 'HSPD',
        module: 'Dokumen Resmi & SKCK',
        action: 'OFFICIAL_DOC',
        title: `Penerbitan Surat: ${doc.title} (${doc.category})`,
        description: `Penerima: ${doc.recipientName} [ID: ${doc.recipientId || '-'}]. Diterbitkan oleh: ${doc.issuerName} (${doc.issuerRank}). Perihal: ${doc.subject}.`,
        actor: doc.issuerName || 'Official Issuer',
        actorBadge: doc.issuerBadge || '#OFFICIAL',
        target: doc.recipientName,
        severity: 'SUCCESS',
        timestamp: doc.createdAt || Date.now() - 25200000
      });
    });
  } catch {}

  // Sort newest first
  return combined.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Hourly Activity Distribution for Graph (24 Hours)
 */
export interface HourlyDataPoint {
  hour: string;           // "00:00", "01:00", etc.
  hspdCount: number;
  govCount: number;
  totalCount: number;
}

export function getHourlyActivityTrend(activities: SystemActivityLog[]): HourlyDataPoint[] {
  const hoursMap: Record<number, { hspd: number; gov: number }> = {};
  for (let h = 0; h < 24; h++) {
    hoursMap[h] = { hspd: 0, gov: 0 };
  }

  activities.forEach(act => {
    const date = new Date(act.timestamp);
    const h = date.getHours();
    if (hoursMap[h]) {
      if (act.entity === 'GOVERNMENT') {
        hoursMap[h].gov += 1;
      } else {
        hoursMap[h].hspd += 1;
      }
    }
  });

  return Object.keys(hoursMap).map(key => {
    const h = parseInt(key, 10);
    const label = `${String(h).padStart(2, '0')}:00`;
    const hspd = hoursMap[h].hspd;
    const gov = hoursMap[h].gov;
    return {
      hour: label,
      hspdCount: hspd,
      govCount: gov,
      totalCount: hspd + gov
    };
  });
}

/**
 * 7 Days Daily Activity Distribution for Graph
 */
export interface DailyDataPoint {
  dayLabel: string;       // "Senin", "Selasa", etc.
  dateString: string;     // "YYYY-MM-DD"
  hspdCount: number;
  govCount: number;
  totalCount: number;
}

export function getDailyActivityTrend(activities: SystemActivityLog[]): DailyDataPoint[] {
  const days: DailyDataPoint[] = [];
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const endD = new Date(d);
    endD.setHours(23, 59, 59, 999);

    const startTime = d.getTime();
    const endTime = endD.getTime();

    const inRange = activities.filter(a => a.timestamp >= startTime && a.timestamp <= endTime);
    const hspd = inRange.filter(a => a.entity !== 'GOVERNMENT').length;
    const gov = inRange.filter(a => a.entity === 'GOVERNMENT').length;

    days.push({
      dayLabel: dayNames[d.getDay()],
      dateString: d.toISOString().slice(0, 10),
      hspdCount: hspd,
      govCount: gov,
      totalCount: hspd + gov
    });
  }

  return days;
}

/**
 * Audit & Auto-Synchronize DPO parity between Citizens DMV and BOLO Alerts
 * Ensures anyone marked as DPO in DMV is guaranteed to be in BOLO, and vice versa!
 */
export function synchronizeDpoAndDmvIntegrity(): {
  totalAudited: number;
  addedToBolo: number;
  linkedCitizens: number;
} {
  const citizens = getSavedCitizens();
  const bolos = getSavedBoloAlerts();
  let addedToBolo = 0;
  let linkedCitizens = 0;

  // 1. Check all Citizens with isWantedBolo === true -> make sure active BOLO exists
  citizens.forEach(c => {
    if (c.isWantedBolo) {
      const existsInBolo = bolos.some(b => 
        b.active && (b.id === `BOLO-CIT-${c.id}` || b.title.toLowerCase().includes(c.fullName.toLowerCase()))
      );

      if (!existsInBolo) {
        bolos.unshift({
          id: `BOLO-CIT-${c.id}`,
          type: 'PERSON',
          title: `${c.fullName} (${c.citizenId || c.id}) - DPO / BURONAN RESMI KEPOLISIAN`,
          description: c.wantedReason || `10-99 DPO Buronan Aktif Kepolisian HSPD. Terdaftar resmi di sistem Dukcapil/DMV. Kendaraan: ${c.registeredVehicles?.[0]?.model || '-'} (Plat: ${c.registeredVehicles?.[0]?.plate || '-'}).`,
          dangerLevel: (c.priorArrests && c.priorArrests.length > 2) ? 'EXTREME_ARMED_DANGEROUS' : 'HIGH',
          lastSeenLocation: c.address || 'Los Santos City Area',
          issuedBy: 'HSPD HQ System Auditor',
          issuedByBadge: '#HSPD-AUDIT',
          active: true,
          timestamp: Date.now()
        });
        addedToBolo++;
      }
    }
  });

  // 2. Check all active PERSON BOLOs -> make sure corresponding Citizen is marked isWantedBolo
  bolos.forEach(b => {
    if (b.active && b.type === 'PERSON') {
      const bTitleLower = b.title.toLowerCase();
      const matchingCitizen = citizens.find(c => 
        bTitleLower.includes(c.fullName.toLowerCase()) || 
        (c.citizenId && b.title.includes(c.citizenId))
      );
      if (matchingCitizen) {
        if (!matchingCitizen.isWantedBolo) {
          matchingCitizen.isWantedBolo = true;
          matchingCitizen.wantedReason = b.description || '10-99 DPO Buronan Aktif Kepolisian';
          linkedCitizens++;
        }
      } else {
        // Auto-create citizen profile so they exist in Dukcapil registry
        const rawName = b.title.split('-')[0].replace(/\(.*?\)/g, '').trim() || b.title.trim();
        citizens.push({
          id: `cit-dpo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          citizenId: `LS-${Math.floor(10000 + Math.random() * 90000)}`,
          fullName: rawName,
          dateOfBirth: '1985-05-15',
          gender: 'MALE',
          phoneNumber: '555-0999',
          address: b.lastSeenLocation || 'Los Santos City Area',
          driverLicenseStatus: 'REVOKED',
          driverPoints: 12,
          gunLicenseStatus: 'REVOKED',
          isWantedBolo: true,
          wantedReason: b.description || '10-99 DPO Buronan Aktif Kepolisian',
          registeredVehicles: [],
          priorArrests: [],
          notes: `DPO Buronan terdaftar resmi dari Siaga BOLO Kepolisian: ${b.title}`
        });
        linkedCitizens++;
      }
    }
  });

  // 3. Check Detective Cases suspects with WARRANT_ACTIVE (Buron/DPO)
  try {
    const detectiveCases = getSavedDetectiveCases();
    detectiveCases.forEach(dc => {
      (dc.suspects || []).forEach(s => {
        if (s.status === 'WARRANT_ACTIVE') {
          // Ensure in citizens
          const cit = citizens.find(c => c.fullName.toLowerCase().includes(s.name.toLowerCase()));
          if (cit) {
            if (!cit.isWantedBolo) {
              cit.isWantedBolo = true;
              cit.wantedReason = `10-99 DPO Buron Kasus Detektif: ${dc.title} (${(s.charges || []).join(', ')})`;
              linkedCitizens++;
            }
          } else {
            citizens.push({
              id: `cit-dpo-det-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              citizenId: `LS-${Math.floor(10000 + Math.random() * 90000)}`,
              fullName: s.name,
              dateOfBirth: '1986-08-20',
              gender: 'MALE',
              phoneNumber: '555-0888',
              address: 'Los Santos Area',
              driverLicenseStatus: 'REVOKED',
              driverPoints: 12,
              gunLicenseStatus: 'REVOKED',
              isWantedBolo: true,
              wantedReason: `10-99 DPO Buron Kasus Detektif CID: ${dc.title}`,
              registeredVehicles: [],
              priorArrests: [],
              notes: `DPO Buronan terdaftar dari Kasus CID: ${dc.title} (Nomor: ${dc.caseNumber})`
            });
            linkedCitizens++;
          }

          // Ensure in BOLO
          const existsInBolo = bolos.some(b => b.active && b.title.toLowerCase().includes(s.name.toLowerCase()));
          if (!existsInBolo) {
            bolos.unshift({
              id: `BOLO-CID-${s.id}`,
              type: 'PERSON',
              title: `${s.name} - DPO BURONAN KASUS CID: ${dc.title}`,
              description: `Tersangka dalam kasus ${dc.title} (No: ${dc.caseNumber}). Pasal: ${(s.charges || []).join(', ') || 'Pelanggaran KUHP'}. Waspada bersenjata.`,
              dangerLevel: 'EXTREME_ARMED_DANGEROUS',
              lastSeenLocation: 'Kota Los Santos',
              issuedBy: dc.leadDetective || 'Mabes HSPD CID',
              issuedByBadge: dc.leadDetectiveBadge || '#CID',
              active: true,
              timestamp: Date.now()
            });
            addedToBolo++;
          }
        }
      });
    });
  } catch {}

  if (addedToBolo > 0) saveBoloAlerts(bolos);
  if (linkedCitizens > 0) saveCitizens(citizens);

  window.dispatchEvent(new Event('hspd-citizens-updated'));
  window.dispatchEvent(new Event('hspd-bolo-updated'));

  // Log this system audit action
  logDeveloperSystemActivity({
    entity: 'SYSTEM',
    module: 'Audit Integritas DPO & DMV',
    action: 'SYSTEM_SYNC',
    title: 'Audit Sinkronisasi DPO Buronan',
    description: `Audit integritas selesai: ${addedToBolo} buronan disinkronkan ke BOLO, ${linkedCitizens} warga ditandai DPO. Paritas 100%.`,
    actor: 'Lead Developer Overseer',
    actorBadge: '#DEV-001',
    severity: 'SUCCESS'
  });

  return {
    totalAudited: citizens.length + bolos.length,
    addedToBolo,
    linkedCitizens
  };
}

export function clearAllActivityLogs(): void {
  try {
    localStorage.removeItem(ACTIVITY_LOGS_STORAGE_KEY);
    window.dispatchEvent(new Event('hspd-activity-log-updated'));
    window.dispatchEvent(new Event('hspd_activity_updated'));
  } catch (e) {
    console.error(e);
  }
}
