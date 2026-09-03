import { VaultAuditLog, DestructionRegistryItem } from '../types';
import { pushAllToFirestore } from '../services/firebaseRealtimeSync';

export const VAULT_STORAGE_KEY = 'hspd_vault_audit_logs_v1';
export const DESTRUCTION_STORAGE_KEY = 'hspd_destruction_registry_v1';

// Initial Sample Data for Police Vault Weekly Audit
const INITIAL_VAULT_LOGS: VaultAuditLog[] = [
  {
    id: 'VAULT-2026-W34',
    auditNumber: 'HSPD-VAULT-26-W34',
    weekLabel: 'Minggu ke-34 (Agustus 2026)',
    auditDate: '2026-08-20',
    auditorName: 'Raymond Holt',
    auditorBadge: '#001',
    auditorRank: 'CHIEF OF POLICE [COP]',
    witnessOfficer: 'Amy Santiago (#215)',
    cashConfiscated: 345200,
    cleanCashFund: 50000,
    drugsSummary: {
      weedGrams: 1450,
      cocaineGrams: 820,
      crackGrams: 340,
      methGrams: 510,
      pillsCount: 120
    },
    weaponsSummary: {
      handgunsCount: 38,
      shotgunsCount: 16,
      smgCount: 22,
      rifleCount: 14,
      heavyWeaponsCount: 2
    },
    ammoSummary: {
      pistolAmmo: 3400,
      shotgunShells: 850,
      smgAmmo: 2100,
      rifleAmmo: 1800
    },
    otherItemsNote: '4 Batang Emas Sitaan Sindikat Ganton, 12 Unit Handphone Burner Bukti Kasus #001, 1 Mesin Pencetak Uang Palsu.',
    vaultSealStatus: 'INTACT_SECURED',
    auditNotes: 'Audit mingguan berjalan tertib. Seluruh segel baja bernomor seri #SEAL-9841 dalam kondisi utuh dan sesuai buku inventaris kasir forensik.',
    evidencePhotos: [
      'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80'
    ],
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    nextAuditDueDate: Date.now() + 2 * 24 * 60 * 60 * 1000 // 2 days left
  },
  {
    id: 'VAULT-2026-W33',
    auditNumber: 'HSPD-VAULT-26-W33',
    weekLabel: 'Minggu ke-33 (Agustus 2026)',
    auditDate: '2026-08-13',
    auditorName: 'Terry Jeffords',
    auditorBadge: '#302',
    auditorRank: 'DEPUTY CHIEF [D/C]',
    witnessOfficer: 'Jake Peralta (#204)',
    cashConfiscated: 289400,
    cleanCashFund: 50000,
    drugsSummary: {
      weedGrams: 1100,
      cocaineGrams: 650,
      crackGrams: 280,
      methGrams: 420,
      pillsCount: 90
    },
    weaponsSummary: {
      handgunsCount: 32,
      shotgunsCount: 14,
      smgCount: 18,
      rifleCount: 12,
      heavyWeaponsCount: 1
    },
    ammoSummary: {
      pistolAmmo: 2900,
      shotgunShells: 700,
      smgAmmo: 1800,
      rifleAmmo: 1500
    },
    otherItemsNote: 'Perhiasan emas rampasan kasus perampokan toko perhiasan Rodeo.',
    vaultSealStatus: 'INTACT_SECURED',
    auditNotes: 'Stock opname mingguan disetujui tanpa selisih barang.',
    evidencePhotos: [
      'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&auto=format&fit=crop&q=80'
    ],
    timestamp: Date.now() - 12 * 24 * 60 * 60 * 1000,
    nextAuditDueDate: Date.now() - 5 * 24 * 60 * 60 * 1000
  }
];

// Initial Sample Data for Smelting & Scrapping Registry
const INITIAL_DESTRUCTION_LIST: DestructionRegistryItem[] = [
  {
    id: 'DEST-2026-001',
    destructionNumber: 'HSPD-CRUSH-26-001',
    itemType: 'VEHICLE',
    title: 'Peleburan / Penghancuran Kendaraan: Bravado Buffalo Hitam Modifikasi',
    caseNumber: 'HSPD-DB-26-001',
    vehicleDetails: {
      model: 'Bravado Buffalo S',
      plateNumber: 'LS-9912',
      color: 'Matte Black',
      vin: 'VIN-89410924LS',
      previousOwner: 'Darius Thorne (Ballas Syndicate)',
      chassisCondition: 'Rusak berat akibat baku tembak 10-8 & mesin jebol'
    },
    destructionReason: 'TOTAL_WRECK_UNSAFE',
    reasonDescription: 'Kendaraan hasil kejahatan sindikat bersenjata berat, nomor sasis terhapus dan struktur bodi rusak total membahayakan jika dilelang.',
    facilityLocation: 'Los Santos Junkyard Scrapyard & Metal Smelter',
    registeredBy: 'Jake Peralta',
    registeredByBadge: '#204',
    authorizedBy: 'Raymond Holt (Chief of Police)',
    authorizedDate: '2026-08-22',
    executorOfficer: 'Terry Jeffords (#302)',
    courtOrderDocNumber: 'SK-PN-LS/VIII/2026/088',
    status: 'SMELTED_DESTROYED',
    scheduledDate: '2026-08-23',
    executedTimestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    beforePhotos: [
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600&auto=format&fit=crop&q=80'
    ],
    afterPhotos: [
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80'
    ],
    notes: 'Bodi kendaraan telah dipress & dilebur menjadi scrap metal balok baja daur ulang.',
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000
  },
  {
    id: 'DEST-2026-002',
    destructionNumber: 'HSPD-SMELT-26-002',
    itemType: 'WEAPON',
    title: 'Peleburan Senjata Api Ilegal & Rakitan Gelap (Batch #12)',
    caseNumber: 'HSPD-DB-26-001',
    weaponDetails: {
      weaponModel: '8x Sawed-Off Shotguns & 4x Micro SMG Uzi',
      serialNumber: 'SERIAL DIHAPUS / UNREGISTERED',
      isSerialScratched: true,
      caliber: '12 Gauge & 9mm Luger',
      confiscatedFrom: 'Sindikat Pengedar Senjata Idlewood & Ganton',
      quantity: 12
    },
    destructionReason: 'ILLEGAL_SERIAL_ERASED',
    reasonDescription: 'Senjata rakitan ilegal tanpa nomor seri resmi, tidak memenuhi standar dinas dan membahayakan keselamatan umum.',
    facilityLocation: 'Bayside Industrial Metal Smelting Furnace',
    registeredBy: 'Amy Santiago',
    registeredByBadge: '#215',
    authorizedBy: 'Raymond Holt (Chief of Police)',
    authorizedDate: '2026-08-24',
    status: 'APPROVED_SCHEDULED',
    scheduledDate: '2026-08-26',
    beforePhotos: [
      'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=600&auto=format&fit=crop&q=80'
    ],
    afterPhotos: [],
    courtOrderDocNumber: 'SURAT-PEMUSNAHAN-SENPI/HSPD/2026/014',
    notes: 'Dijadwalkan masuk tungku peleburan suhu tinggi 1500°C di Bayside Smelter.',
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000
  },
  {
    id: 'DEST-2026-003',
    destructionNumber: 'HSPD-CRUSH-26-003',
    itemType: 'VEHICLE',
    title: 'Peleburan Kendaraan Sitaan Kadaluarsa: Karin Sultan Merah',
    caseNumber: 'IMP-2026-049',
    vehicleDetails: {
      model: 'Karin Sultan V6',
      plateNumber: 'LS-3301',
      color: 'Wine Red',
      vin: 'VIN-58190014KS',
      previousOwner: 'Tidak Diketahui (Abandoned)',
      chassisCondition: 'Karat & Terbakar di Area Mesin'
    },
    destructionReason: 'UNCLAIMED_IMPOUND_EXPIRED',
    reasonDescription: 'Kendaraan sitaan impound lot telah melewati masa simpan 45 hari (melebihi regulasi batas maksimal 30 hari) tanpa pemilik yang mengklaim denda.',
    facilityLocation: 'Los Santos Junkyard Scrapyard & Metal Smelter',
    registeredBy: 'Jake Peralta',
    registeredByBadge: '#204',
    status: 'PROPOSED_PENDING_APPROVAL',
    scheduledDate: '2026-08-28',
    beforePhotos: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80'
    ],
    afterPhotos: [],
    notes: 'Menunggu tanda tangan otorisasi High Command untuk peleburan total.',
    timestamp: Date.now()
  }
];

// Get Vault Logs
export function getSavedVaultAuditLogs(): VaultAuditLog[] {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return INITIAL_VAULT_LOGS;
}

// Aliases
export const getSavedVaultAudits = getSavedVaultAuditLogs;

// Save Vault Logs
export function saveVaultAuditLogs(logs: VaultAuditLog[]): void {
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(logs));
    window.dispatchEvent(new Event('hspd-vault-updated'));
    pushAllToFirestore('VAULT_ITEMS', logs).catch(console.error);
  } catch (e) {
    console.error('Failed to save vault audit logs:', e);
  }
}

// Save single audit
export function saveVaultAudit(newOrUpdated: VaultAuditLog): void {
  const current = getSavedVaultAuditLogs();
  const exists = current.some(a => a.id === newOrUpdated.id);
  const updated = exists
    ? current.map(a => a.id === newOrUpdated.id ? newOrUpdated : a)
    : [newOrUpdated, ...current];
  saveVaultAuditLogs(updated);
}

// Delete audit
export function deleteVaultAudit(auditId: string): void {
  const current = getSavedVaultAuditLogs();
  const updated = current.filter(a => a.id !== auditId);
  saveVaultAuditLogs(updated);
}

export const deleteVaultAuditLog = deleteVaultAudit;

// Weekly Cycle Checker Helper (Updates 1x a week)
export interface WeeklyAuditStatus {
  isAuditDue: boolean;            // True if > 7 days since last audit or no audit
  needsAudit: boolean;            // Alias for isAuditDue
  daysSinceLastAudit: number;
  daysRemainingUntilNext: number;
  lastAudit?: VaultAuditLog;
  statusBadgeText: string;
  statusBadgeColor: string;
  message: string;
}

export function getWeeklyAuditStatus(logs: VaultAuditLog[]): WeeklyAuditStatus {
  if (!logs || logs.length === 0) {
    return {
      isAuditDue: true,
      needsAudit: true,
      daysSinceLastAudit: 999,
      daysRemainingUntilNext: 0,
      statusBadgeText: '🔴 PERLU AUDIT MINGGUAN PERTAMA',
      statusBadgeColor: 'bg-rose-950 text-rose-300 border-rose-700',
      message: 'Belum ada catatan audit brankas. Harap segera lakukan stock opname mingguan!'
    };
  }

  // Sort logs by timestamp desc
  const sorted = [...logs].sort((a, b) => b.timestamp - a.timestamp);
  const latest = sorted[0];

  const now = Date.now();
  const elapsedMs = now - latest.timestamp;
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 7 - elapsedDays);

  if (elapsedDays >= 7) {
    return {
      isAuditDue: true,
      needsAudit: true,
      daysSinceLastAudit: elapsedDays,
      daysRemainingUntilNext: 0,
      lastAudit: latest,
      statusBadgeText: `🔴 PERLU AUDIT MINGGUAN (${elapsedDays} HARI SEJAK AUDIT TERAKHIR)`,
      statusBadgeColor: 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse',
      message: `Audit brankas telah melewati siklus 7 hari (${elapsedDays} hari lalu). Lakukan audit mingguan sekarang!`
    };
  }

  return {
    isAuditDue: false,
    needsAudit: false,
    daysSinceLastAudit: elapsedDays,
    daysRemainingUntilNext: daysRemaining,
    lastAudit: latest,
    statusBadgeText: `🟢 AUDIT MINGGU INI AKTIF (${daysRemaining} HARI LAGI MENUJU AUDIT BERIKUTNYA)`,
    statusBadgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-700',
    message: `Audit terakhir ${elapsedDays} hari yang lalu oleh ${latest.auditorName}. Status brankas aman.`
  };
}

export function generateAuditReportSummary(audit: VaultAuditLog): string {
  const totalDrugs = (audit.drugsSummary.weedGrams || 0) + (audit.drugsSummary.cocaineGrams || 0) + 
                     (audit.drugsSummary.crackGrams || 0) + (audit.drugsSummary.methGrams || 0);
  const totalGuns = (audit.weaponsSummary.handgunsCount || 0) + (audit.weaponsSummary.shotgunsCount || 0) + 
                    (audit.weaponsSummary.smgCount || 0) + (audit.weaponsSummary.rifleCount || 0) + 
                    (audit.weaponsSummary.heavyWeaponsCount || 0);
  return `Audit ${audit.auditNumber} (${audit.weekLabel}): Kas Sitaan $${audit.cashConfiscated.toLocaleString()}, Narkotika ${totalDrugs}g, Senpi ${totalGuns} unit. Segel: ${audit.vaultSealStatus}.`;
}

// Get Destruction List
export function getSavedDestructionList(): DestructionRegistryItem[] {
  try {
    const raw = localStorage.getItem(DESTRUCTION_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return INITIAL_DESTRUCTION_LIST;
}

export const getSavedDestructionItems = getSavedDestructionList;

// Save Destruction List
export function saveDestructionList(list: DestructionRegistryItem[]): void {
  try {
    localStorage.setItem(DESTRUCTION_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('hspd-destruction-updated'));
    pushAllToFirestore('DESTRUCTION_LOGS', list).catch(console.error);
  } catch (e) {
    console.error('Failed to save destruction registry list:', e);
  }
}

// Save single item
export function saveDestructionItem(item: DestructionRegistryItem): void {
  const current = getSavedDestructionList();
  const exists = current.some(d => d.id === item.id);
  const updated = exists
    ? current.map(d => d.id === item.id ? item : d)
    : [item, ...current];
  saveDestructionList(updated);
}

// Delete item
export function deleteDestructionItem(itemId: string): void {
  const current = getSavedDestructionList();
  const updated = current.filter(d => d.id !== itemId);
  saveDestructionList(updated);
}

export function getDestructionStats(list: DestructionRegistryItem[]) {
  const total = list.length;
  const vehicles = list.filter(i => i.itemType === 'VEHICLE').length;
  const weapons = list.filter(i => i.itemType === 'WEAPON').length;
  const narcotics = list.filter(i => i.itemType === 'NARCOTICS').length;
  const destroyed = list.filter(i => i.status === 'SMELTED_DESTROYED').length;
  const scheduled = list.filter(i => i.status === 'APPROVED_SCHEDULED' || i.status === 'PROPOSED_PENDING_APPROVAL').length;

  return {
    totalItems: total,
    totalDestroyed: destroyed,
    totalScheduled: scheduled,
    vehiclesDestroyed: vehicles,
    weaponsDestroyed: weapons,
    narcoticsDestroyed: narcotics,
    totalScrapValue: vehicles * 4500 + weapons * 850,
    totalMetalWeightKg: vehicles * 1400 + weapons * 4
  };
}

export function generateDestructionCertificate(item: DestructionRegistryItem): string {
  return `BERITA ACARA PEMUSNAHAN NO: ${item.destructionNumber}\nItem: ${item.title}\nTipe: ${item.itemType}\nStatus: ${item.status}\nOtorisasi: ${item.authorizedBy || '-'}\nLokasi: ${item.facilityLocation}`;
}
