import { pushToFirestore, pushAllToFirestore } from '../services/firebaseRealtimeSync';
import { ArrestRecord, TrafficCitationRecord, ImpoundRecord, DestructionRegistryItem } from '../types';
import { getSavedTrafficCitations } from './trafficCitationStorage';
import { getSavedImpounds } from './boloImpoundStorage';
import { getSavedDestructionList } from './vaultAndDestructionStorage';

export const BONUS_RATE_STORAGE_KEY = 'hspd_bonus_rate_config_v1';
export const BONUS_CLAIMS_STORAGE_KEY = 'hspd_bonus_claims_v1';
export const ARMORY_RESTOCK_STORAGE_KEY = 'hspd_armory_restock_logs_v1';

export interface BonusRateConfig {
  // 1. Kasus Penindakan
  caseBaseReward: number;       // Bonus flat per kasus BAP (e.g. $1,000)
  caseFinePercent: number;      // Persentase dari total denda kasus (e.g. 15%)
  caseCooperativeBonus: number; // Bonus tambahan jika tersangka kooperatif (e.g. $300)
  
  // 2. Pemasukan Efiden (Evidence Intake)
  evidencePhotoReward: number;  // Bonus per foto barang bukti terlampir (e.g. $200)
  evidenceWeaponReward: number; // Bonus per senpi sitaan yang disetor ke brankas (e.g. $750)
  evidenceDrugGramReward: number; // Bonus per gram narkoba sitaan (e.g. $5)
  evidenceCashPercent: number;  // Persentase uang kotor/kas sitaan yang disetor (e.g. 5%)

  // 3. Pemasukan Tilang
  citationFinePercent: number;  // Persentase denda tiket tilang (e.g. 20%)
  citationFlatReward: number;   // Bonus insentif per lembar tilang sah (e.g. $250)

  // 4. Pemasukan Impound
  impoundFeePercent: number;    // Persentase biaya derek/impound (e.g. 25%)
  impoundFlatReward: number;    // Bonus per unit kendaraan di-impound (e.g. $400)

  // 5. Sukses Perestokan Persenjataan
  restockMissionReward: number; // Bonus misi sukses restock logistik senjata (e.g. $3,500)
  restockWeaponUnitReward: number; // Bonus per unit senpi dinas direstock (e.g. $150)
  restockAmmoBoxReward: number;    // Bonus per peti amunisi (e.g. $50)

  // 6. Peleburan Senjata
  smeltWeaponReward: number;    // Bonus nilai scrap per unit senpi yang dilebur (e.g. $650)
  smeltCertReward: number;      // Bonus saksi/eksekutor Berita Acara Peleburan (e.g. $500)

  _updatedAt?: number;
  _updatedBy?: string;
}

export const DEFAULT_BONUS_RATES: BonusRateConfig = {
  // 1. Kasus Penindakan
  caseBaseReward: 1000,
  caseFinePercent: 15,
  caseCooperativeBonus: 300,

  // 2. Pemasukan Efiden
  evidencePhotoReward: 200,
  evidenceWeaponReward: 750,
  evidenceDrugGramReward: 5,
  evidenceCashPercent: 5,

  // 3. Pemasukan Tilang
  citationFinePercent: 20,
  citationFlatReward: 250,

  // 4. Pemasukan Impound
  impoundFeePercent: 25,
  impoundFlatReward: 400,

  // 5. Sukses Perestokan Persenjataan
  restockMissionReward: 3500,
  restockWeaponUnitReward: 150,
  restockAmmoBoxReward: 50,

  // 6. Peleburan Senjata
  smeltWeaponReward: 650,
  smeltCertReward: 500
};

export interface RestockedWeaponItem {
  model: string;
  quantity: number;
}

export interface ArmoryRestockMission {
  id: string;
  missionCode: string;          // e.g. RESTOCK-ARM-26-081
  title: string;                // e.g. "Restok Suplai Senjata & Amunisi Patroli Divisi"
  conductedBy: string;          // Nama Petugas
  conductedBadge: string;       // Badge Petugas
  conductedRank: string;        // Pangkat Petugas
  division: string;             // Divisi
  weaponsRestocked: RestockedWeaponItem[];
  ammoBoxes: number;
  bodyArmors: number;
  status: 'SUCCESS_VERIFIED' | 'PENDING_AUDIT' | 'CANCELLED';
  authorizedBy: string;         // High Command Pengesah
  authorizedRank?: string;
  timestamp: number;
  dateFormatted: string;
  notes?: string;
}

export const INITIAL_RESTOCK_MISSIONS: ArmoryRestockMission[] = [
  {
    id: 'restock-01',
    missionCode: 'RESTOCK-ARM-26-001',
    title: 'Pengadaan Logistik & Amunisi Patroli Markas Pusat',
    conductedBy: 'Raymond Holt',
    conductedBadge: '#001',
    conductedRank: 'CHIEF OF POLICE [COP]',
    division: 'METRO DIVISION',
    weaponsRestocked: [
      { model: 'Combat Pistol 9mm', quantity: 15 },
      { model: 'Pump Shotgun 12-Gauge', quantity: 6 },
      { model: 'Carbine Rifle 5.56', quantity: 4 }
    ],
    ammoBoxes: 30,
    bodyArmors: 25,
    status: 'SUCCESS_VERIFIED',
    authorizedBy: 'Raymond Holt (#001)',
    authorizedRank: 'CHIEF OF POLICE',
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    dateFormatted: 'Kamis, 22 Oktober 2026',
    notes: 'Suplai logistik resmi dari gudang persenjataan negara. Ditempatkan di lemari brankas senjata Sektor A.'
  },
  {
    id: 'restock-02',
    missionCode: 'RESTOCK-ARM-26-002',
    title: 'Restok Khusus Persenjataan Taktis Tim SWAT & Pelindung Taktis',
    conductedBy: 'Terry Jeffords',
    conductedBadge: '#302',
    conductedRank: 'DEPUTY CHIEF [D/C]',
    division: 'SWAT DIVISION',
    weaponsRestocked: [
      { model: 'Special Carbine Mk II', quantity: 8 },
      { model: 'SMG Tactical 9mm', quantity: 10 },
      { model: 'Heavy Sniper System', quantity: 2 }
    ],
    ammoBoxes: 50,
    bodyArmors: 40,
    status: 'SUCCESS_VERIFIED',
    authorizedBy: 'Terry Jeffords (#302)',
    authorizedRank: 'DEPUTY CHIEF',
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
    dateFormatted: 'Sabtu, 24 Oktober 2026',
    notes: 'Pengawalan suplai taktis SWAT sukses tanpa insiden. Verifikasi fisik telah disetujui.'
  }
];

export interface OfficerBonusSummary {
  officerName: string;
  officerBadge: string;
  officerRank: string;
  division?: string;
  bankAccount?: string;
  periodLabel: string;
  calculatedAt: number;

  // 1. Kasus Penindakan
  caseStats: {
    count: number;
    totalFine: number;
    cooperativeCount: number;
    baseRewardTotal: number;
    finePercentTotal: number;
    cooperativeBonusTotal: number;
    subtotal: number;
  };

  // 2. Pemasukan Efiden
  evidenceStats: {
    photoCount: number;
    weaponCount: number;
    drugGrams: number;
    cashSeized: number;
    photoRewardTotal: number;
    weaponRewardTotal: number;
    drugRewardTotal: number;
    cashRewardTotal: number;
    subtotal: number;
  };

  // 3. Pemasukan Tilang
  citationStats: {
    count: number;
    totalFine: number;
    flatRewardTotal: number;
    finePercentTotal: number;
    subtotal: number;
  };

  // 4. Pemasukan Impound
  impoundStats: {
    count: number;
    totalFee: number;
    flatRewardTotal: number;
    feePercentTotal: number;
    subtotal: number;
  };

  // 5. Sukses Perestokan Persenjataan
  restockStats: {
    missionCount: number;
    weaponsCount: number;
    ammoBoxesCount: number;
    missionRewardTotal: number;
    weaponsRewardTotal: number;
    ammoBoxesRewardTotal: number;
    subtotal: number;
  };

  // 6. Peleburan Senjata
  smeltStats: {
    weaponCount: number;
    certCount: number;
    scrapRewardTotal: number;
    certRewardTotal: number;
    subtotal: number;
  };

  grandTotalBonus: number;
}

export type BonusClaimStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'DISBURSED_PAID' | 'REJECTED';

export interface BonusClaimRecord {
  id: string;
  claimNumber: string;          // e.g. CLAIM-BN-26-004
  officerName: string;
  officerBadge: string;
  officerRank: string;
  division?: string;
  bankAccount?: string;
  periodLabel: string;
  summary: OfficerBonusSummary;
  status: BonusClaimStatus;
  notes?: string;
  submittedAt: number;
  approvedBy?: string;
  approvedByRank?: string;
  approvedAt?: number;
  disbursedBy?: string;
  disbursedAt?: number;
  rejectionReason?: string;
}

// -------------------------------------------------------------
// Storage Operations
// -------------------------------------------------------------

export function getSavedBonusRateConfig(): BonusRateConfig {
  try {
    const raw = localStorage.getItem(BONUS_RATE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_BONUS_RATES, ...parsed };
    }
  } catch {}
  return DEFAULT_BONUS_RATES;
}

export function saveBonusRateConfig(cfg: BonusRateConfig): void {
  try {
    localStorage.setItem(BONUS_RATE_STORAGE_KEY, JSON.stringify(cfg));
    window.dispatchEvent(new CustomEvent('hspd-bonus-rates-updated', { detail: cfg }));
    pushToFirestore('SYSTEM_CONFIGS', { id: 'BONUS_RATES', ...cfg }, 'BONUS_RATES').catch(() => {});
  } catch (e) {
    console.error('Failed to save bonus rate config:', e);
  }
}

export function resetBonusRateConfig(): BonusRateConfig {
  saveBonusRateConfig(DEFAULT_BONUS_RATES);
  return DEFAULT_BONUS_RATES;
}

export function getSavedRestockMissions(): ArmoryRestockMission[] {
  try {
    const raw = localStorage.getItem(ARMORY_RESTOCK_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_RESTOCK_MISSIONS;
}

export function saveRestockMissions(list: ArmoryRestockMission[]): void {
  try {
    localStorage.setItem(ARMORY_RESTOCK_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('hspd-restock-missions-updated', { detail: list }));
    pushAllToFirestore('RESTOCK_MISSIONS', list).catch(() => {});
  } catch (e) {
    console.error('Failed to save restock missions:', e);
  }
}

export function addRestockMission(mission: ArmoryRestockMission): void {
  const current = getSavedRestockMissions();
  const exists = current.some(m => m.id === mission.id);
  const updated = exists ? current.map(m => m.id === mission.id ? mission : m) : [mission, ...current];
  saveRestockMissions(updated);
}

export function deleteRestockMission(id: string): void {
  const current = getSavedRestockMissions();
  const updated = current.filter(m => m.id !== id);
  saveRestockMissions(updated);
}

export function getSavedBonusClaims(): BonusClaimRecord[] {
  try {
    const raw = localStorage.getItem(BONUS_CLAIMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveBonusClaims(list: BonusClaimRecord[]): void {
  try {
    localStorage.setItem(BONUS_CLAIMS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('hspd-bonus-claims-updated', { detail: list }));
    pushAllToFirestore('BONUS_CLAIMS', list).catch(() => {});
  } catch (e) {
    console.error('Failed to save bonus claims:', e);
  }
}

export function addBonusClaim(claim: BonusClaimRecord): void {
  const current = getSavedBonusClaims();
  const exists = current.some(c => c.id === claim.id);
  const updated = exists ? current.map(c => c.id === claim.id ? claim : c) : [claim, ...current];
  saveBonusClaims(updated);
}

export function updateBonusClaim(claim: BonusClaimRecord): void {
  addBonusClaim(claim);
}

export function deleteBonusClaim(id: string): void {
  const current = getSavedBonusClaims();
  const updated = current.filter(c => c.id !== id);
  saveBonusClaims(updated);
}

// -------------------------------------------------------------
// Bonus Computation Engine
// -------------------------------------------------------------

export interface CalculateBonusParams {
  officerName: string;
  officerBadge: string;
  officerRank: string;
  division?: string;
  bankAccount?: string;
  periodLabel?: string;
  rates?: BonusRateConfig;

  // Custom Raw Inputs (for manual interactive calculation mode)
  casesCount?: number;
  casesTotalFine?: number;
  casesCooperativeCount?: number;

  evidencePhotoCount?: number;
  evidenceWeaponCount?: number;
  evidenceDrugGrams?: number;
  evidenceCashAmount?: number;

  citationsCount?: number;
  citationsTotalFine?: number;

  impoundsCount?: number;
  impoundsTotalFee?: number;

  restockMissionsCount?: number;
  restockWeaponsCount?: number;
  restockAmmoBoxesCount?: number;

  smeltWeaponsCount?: number;
  smeltCertsCount?: number;
}

export function calculateBonusSummary(params: CalculateBonusParams): OfficerBonusSummary {
  const rates = params.rates || getSavedBonusRateConfig();

  // 1. Kasus Penindakan
  const cCount = Math.max(0, params.casesCount || 0);
  const cFine = Math.max(0, params.casesTotalFine || 0);
  const cCoop = Math.max(0, params.casesCooperativeCount || 0);
  const cBaseTotal = cCount * rates.caseBaseReward;
  const cFinePercentTotal = Math.floor((cFine * rates.caseFinePercent) / 100);
  const cCoopTotal = cCoop * rates.caseCooperativeBonus;
  const caseSubtotal = cBaseTotal + cFinePercentTotal + cCoopTotal;

  // 2. Pemasukan Efiden
  const evPhotos = Math.max(0, params.evidencePhotoCount || 0);
  const evWeapons = Math.max(0, params.evidenceWeaponCount || 0);
  const evDrugs = Math.max(0, params.evidenceDrugGrams || 0);
  const evCash = Math.max(0, params.evidenceCashAmount || 0);
  const evPhotoTotal = evPhotos * rates.evidencePhotoReward;
  const evWeaponTotal = evWeapons * rates.evidenceWeaponReward;
  const evDrugTotal = Math.floor(evDrugs * rates.evidenceDrugGramReward);
  const evCashTotal = Math.floor((evCash * rates.evidenceCashPercent) / 100);
  const evidenceSubtotal = evPhotoTotal + evWeaponTotal + evDrugTotal + evCashTotal;

  // 3. Pemasukan Tilang
  const citCount = Math.max(0, params.citationsCount || 0);
  const citFine = Math.max(0, params.citationsTotalFine || 0);
  const citFlatTotal = citCount * rates.citationFlatReward;
  const citFinePercentTotal = Math.floor((citFine * rates.citationFinePercent) / 100);
  const citationSubtotal = citFlatTotal + citFinePercentTotal;

  // 4. Pemasukan Impound
  const impCount = Math.max(0, params.impoundsCount || 0);
  const impFee = Math.max(0, params.impoundsTotalFee || 0);
  const impFlatTotal = impCount * rates.impoundFlatReward;
  const impFeePercentTotal = Math.floor((impFee * rates.impoundFeePercent) / 100);
  const impoundSubtotal = impFlatTotal + impFeePercentTotal;

  // 5. Sukses Perestokan Persenjataan
  const rMissions = Math.max(0, params.restockMissionsCount || 0);
  const rWeapons = Math.max(0, params.restockWeaponsCount || 0);
  const rAmmo = Math.max(0, params.restockAmmoBoxesCount || 0);
  const rMissionTotal = rMissions * rates.restockMissionReward;
  const rWeaponTotal = rWeapons * rates.restockWeaponUnitReward;
  const rAmmoTotal = rAmmo * rates.restockAmmoBoxReward;
  const restockSubtotal = rMissionTotal + rWeaponTotal + rAmmoTotal;

  // 6. Peleburan Senjata
  const smWeapons = Math.max(0, params.smeltWeaponsCount || 0);
  const smCerts = Math.max(0, params.smeltCertsCount || 0);
  const smScrapTotal = smWeapons * rates.smeltWeaponReward;
  const smCertTotal = smCerts * rates.smeltCertReward;
  const smeltSubtotal = smScrapTotal + smCertTotal;

  const grandTotalBonus = caseSubtotal + evidenceSubtotal + citationSubtotal + impoundSubtotal + restockSubtotal + smeltSubtotal;

  return {
    officerName: params.officerName || 'Petugas HSPD',
    officerBadge: params.officerBadge || '#UNIT',
    officerRank: params.officerRank || 'OFFICER',
    division: params.division,
    bankAccount: params.bankAccount,
    periodLabel: params.periodLabel || 'Periode Operasional Berjalan',
    calculatedAt: Date.now(),
    caseStats: {
      count: cCount,
      totalFine: cFine,
      cooperativeCount: cCoop,
      baseRewardTotal: cBaseTotal,
      finePercentTotal: cFinePercentTotal,
      cooperativeBonusTotal: cCoopTotal,
      subtotal: caseSubtotal
    },
    evidenceStats: {
      photoCount: evPhotos,
      weaponCount: evWeapons,
      drugGrams: evDrugs,
      cashSeized: evCash,
      photoRewardTotal: evPhotoTotal,
      weaponRewardTotal: evWeaponTotal,
      drugRewardTotal: evDrugTotal,
      cashRewardTotal: evCashTotal,
      subtotal: evidenceSubtotal
    },
    citationStats: {
      count: citCount,
      totalFine: citFine,
      flatRewardTotal: citFlatTotal,
      finePercentTotal: citFinePercentTotal,
      subtotal: citationSubtotal
    },
    impoundStats: {
      count: impCount,
      totalFee: impFee,
      flatRewardTotal: impFlatTotal,
      feePercentTotal: impFeePercentTotal,
      subtotal: impoundSubtotal
    },
    restockStats: {
      missionCount: rMissions,
      weaponsCount: rWeapons,
      ammoBoxesCount: rAmmo,
      missionRewardTotal: rMissionTotal,
      weaponsRewardTotal: rWeaponTotal,
      ammoBoxesRewardTotal: rAmmoTotal,
      subtotal: restockSubtotal
    },
    smeltStats: {
      weaponCount: smWeapons,
      certCount: smCerts,
      scrapRewardTotal: smScrapTotal,
      certRewardTotal: smCertTotal,
      subtotal: smeltSubtotal
    },
    grandTotalBonus
  };
}

// -------------------------------------------------------------
// Auto-pull from actual database records for a given officer
// -------------------------------------------------------------

export function pullOfficerDataAndCalculateBonus(
  targetBadge: string,
  targetName: string,
  targetRank: string,
  targetDivision?: string,
  bankAccount?: string,
  options?: {
    startMs?: number;
    endMs?: number;
    rates?: BonusRateConfig;
  }
): OfficerBonusSummary {
  const normBadge = (targetBadge || '').toLowerCase().replace(/#/g, '').trim();
  const normName = (targetName || '').toLowerCase().trim();
  const rates = options?.rates || getSavedBonusRateConfig();
  const startMs = options?.startMs || 0;
  const endMs = options?.endMs || Number.MAX_SAFE_INTEGER;

  const matchesOfficer = (badge?: string, name?: string): boolean => {
    const b = (badge || '').toLowerCase().replace(/#/g, '').trim();
    const n = (name || '').toLowerCase().trim();
    if (normBadge && b && b === normBadge) return true;
    if (normName && n && (n === normName || n.includes(normName) || normName.includes(n))) return true;
    return false;
  };

  // 1. Fetch Arrest Records (Kasus Penindakan)
  let casesCount = 0;
  let casesTotalFine = 0;
  let casesCooperativeCount = 0;
  let evidencePhotoCount = 0;
  let evidenceWeaponCount = 0;
  let evidenceDrugGrams = 0;
  let evidenceCashAmount = 0;

  try {
    const arrestRaw = localStorage.getItem('hspd_arrest_records_v1');
    if (arrestRaw) {
      const records: ArrestRecord[] = JSON.parse(arrestRaw);
      records.forEach(r => {
        const t = r.timestamp || 0;
        if (t < startMs || t > endMs) return;

        const isMain = matchesOfficer(r.officerBadge, r.officerName);
        const isPartner = r.partnerOfficer ? matchesOfficer('', r.partnerOfficer) : false;

        if (isMain || isPartner) {
          casesCount += 1;
          const fine = Number(r.totalFine) || 0;
          // If partner, split fine credit or full credit
          casesTotalFine += isPartner && !isMain ? Math.floor(fine / 2) : fine;
          if (r.isCooperative) casesCooperativeCount += 1;

          // Evidence Photos from Arrest Record
          if (Array.isArray(r.evidenceUrls)) {
            evidencePhotoCount += r.evidenceUrls.length;
          } else if (r.evidenceUrl) {
            evidencePhotoCount += 1;
          }

          // Confiscated item parsing
          const conf = (r.confiscatedItems || '').toLowerCase();
          if (conf) {
            // Count weapons mentioned (e.g. pistol, shotgun, smg, rifle, senjata)
            const wpnMatches = conf.match(/pistol|shotgun|smg|rifle|glock|remington|carbine|senjata|senpi/gi);
            if (wpnMatches) evidenceWeaponCount += wpnMatches.length;

            // Extract drug grams if mentioned
            const drugMatch = conf.match(/(\d+)\s*(gram|g\b|paket|klip)/i);
            if (drugMatch) {
              evidenceDrugGrams += parseInt(drugMatch[1], 10) || 0;
            }

            // Extract dirty money / cash seized
            const cashMatch = conf.match(/\$?\s*(\d+[\d,.]*)/);
            if (cashMatch && (conf.includes('uang') || conf.includes('cash') || conf.includes('dollar') || conf.includes('$'))) {
              const num = parseInt(cashMatch[1].replace(/[,.]/g, ''), 10);
              if (!isNaN(num) && num > 0 && num < 10000000) {
                evidenceCashAmount += num;
              }
            }
          }
        }
      });
    }
  } catch {}

  // 2. Fetch Traffic Citations (Pemasukan Tilang)
  let citationsCount = 0;
  let citationsTotalFine = 0;

  try {
    const citations: TrafficCitationRecord[] = getSavedTrafficCitations();
    citations.forEach(c => {
      const t = c.timestamp || 0;
      if (t < startMs || t > endMs) return;
      if (matchesOfficer(c.officerBadge, c.officerName)) {
        citationsCount += 1;
        citationsTotalFine += Number(c.totalFine) || 0;
        if (c.evidenceImage || c.evidenceUrl || c.hasEvidence) {
          evidencePhotoCount += 1;
        }
      }
    });
  } catch {}

  // 3. Fetch Vehicle Impounds (Pemasukan Impound)
  let impoundsCount = 0;
  let impoundsTotalFee = 0;

  try {
    const impounds: ImpoundRecord[] = getSavedImpounds();
    impounds.forEach(i => {
      const t = i.timestamp || 0;
      if (t < startMs || t > endMs) return;
      if (matchesOfficer(i.officerBadge, i.officerName)) {
        impoundsCount += 1;
        impoundsTotalFee += Number(i.impoundFee) || 0;
        if (i.evidenceImage || i.evidenceUrl) evidencePhotoCount += 1;
        if (i.evidenceImage2 || i.evidenceUrl2) evidencePhotoCount += 1;
      }
    });
  } catch {}

  // 4. Fetch Restock Missions (Sukses Perestokan Persenjataan)
  let restockMissionsCount = 0;
  let restockWeaponsCount = 0;
  let restockAmmoBoxesCount = 0;

  try {
    const missions = getSavedRestockMissions();
    missions.forEach(m => {
      const t = m.timestamp || 0;
      if (t < startMs || t > endMs) return;
      if (m.status === 'SUCCESS_VERIFIED' && matchesOfficer(m.conductedBadge, m.conductedBy)) {
        restockMissionsCount += 1;
        const totalWpns = Array.isArray(m.weaponsRestocked) 
          ? m.weaponsRestocked.reduce((acc, w) => acc + (Number(w.quantity) || 0), 0)
          : 0;
        restockWeaponsCount += totalWpns;
        restockAmmoBoxesCount += Number(m.ammoBoxes) || 0;
      }
    });
  } catch {}

  // 5. Fetch Smelted / Destroyed Weapons (Peleburan Senjata)
  let smeltWeaponsCount = 0;
  let smeltCertsCount = 0;

  try {
    const destructions: DestructionRegistryItem[] = getSavedDestructionList();
    destructions.forEach(d => {
      const t = (d as any).timestamp || 0;
      if (startMs > 0 && t > 0 && (t < startMs || t > endMs)) return;

      const isSmelted = d.status === 'SMELTED_DESTROYED';
      const isWeapon = d.itemType === 'WEAPON';
      const isExecutor = matchesOfficer((d as any).authorizedBadge || '', d.authorizedBy || '') || 
                         matchesOfficer('', (d as any).executorOfficer || '') ||
                         matchesOfficer('', (d as any).witnessOfficer || '');

      if (isSmelted && isWeapon && isExecutor) {
        smeltCertsCount += 1;
        const qty = d.weaponDetails?.quantity || 1;
        smeltWeaponsCount += qty;
      }
    });
  } catch {}

  return calculateBonusSummary({
    officerName: targetName,
    officerBadge: targetBadge,
    officerRank: targetRank,
    division: targetDivision,
    bankAccount,
    periodLabel: 'Hasil Sinkronisasi Data Riil Sistem',
    rates,
    casesCount,
    casesTotalFine,
    casesCooperativeCount,
    evidencePhotoCount,
    evidenceWeaponCount,
    evidenceDrugGrams,
    evidenceCashAmount,
    citationsCount,
    citationsTotalFine,
    impoundsCount,
    impoundsTotalFee,
    restockMissionsCount,
    restockWeaponsCount,
    restockAmmoBoxesCount,
    smeltWeaponsCount,
    smeltCertsCount
  });
}

// -------------------------------------------------------------
// Format Slip As Clean Text (for Discord / WhatsApp / MDT Slip)
// -------------------------------------------------------------

export function formatBonusSummaryAsText(summary: OfficerBonusSummary): string {
  const formatRp = (val: number) => `$${val.toLocaleString()}`;
  
  return [
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 SLIP PERHITUNGAN BONUS OPERASIONAL PETUGAS HSPD`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 Personel : ${summary.officerRank} ${summary.officerName} (${summary.officerBadge})`,
    `🏢 Divisi   : ${summary.division || 'Kepolisian HSPD'}`,
    `💳 Rek. Bank: ${summary.bankAccount || 'Belum Terdaftar'}`,
    `📅 Periode  : ${summary.periodLabel}`,
    `⏰ Dihitung : ${new Date(summary.calculatedAt).toLocaleString('id-ID')}`,
    `─────────────────────────────────────────`,
    `1️⃣ KASUS PENINDAKAN & BAP:`,
    `   • Total Kasus   : ${summary.caseStats.count} Kasus`,
    `   • Total Denda   : ${formatRp(summary.caseStats.totalFine)}`,
    `   • Bonus Dasar   : ${formatRp(summary.caseStats.baseRewardTotal)}`,
    `   • Potongan %    : ${formatRp(summary.caseStats.finePercentTotal)}`,
    `   • Bonus Koop.   : ${formatRp(summary.caseStats.cooperativeBonusTotal)} (${summary.caseStats.cooperativeCount} Kooperatif)`,
    `   ➥ Subtotal      : ${formatRp(summary.caseStats.subtotal)}`,
    ``,
    `2️⃣ PEMASUKAN EFIDEN (EVIDENCE INTAKE):`,
    `   • Foto BB Sah   : ${summary.evidenceStats.photoCount} Lembar (${formatRp(summary.evidenceStats.photoRewardTotal)})`,
    `   • Senpi Sitaan  : ${summary.evidenceStats.weaponCount} Unit (${formatRp(summary.evidenceStats.weaponRewardTotal)})`,
    `   • Narkotika     : ${summary.evidenceStats.drugGrams}g (${formatRp(summary.evidenceStats.drugRewardTotal)})`,
    `   • Kas Sitaan    : ${formatRp(summary.evidenceStats.cashSeized)} (${formatRp(summary.evidenceStats.cashRewardTotal)})`,
    `   ➥ Subtotal      : ${formatRp(summary.evidenceStats.subtotal)}`,
    ``,
    `3️⃣ PEMASUKAN TILANG (TRAFFIC CITATION):`,
    `   • Tiket Tilang  : ${summary.citationStats.count} Lembar`,
    `   • Total Denda   : ${formatRp(summary.citationStats.totalFine)}`,
    `   • Fee Lembar    : ${formatRp(summary.citationStats.flatRewardTotal)}`,
    `   • Komisi Denda  : ${formatRp(summary.citationStats.finePercentTotal)}`,
    `   ➥ Subtotal      : ${formatRp(summary.citationStats.subtotal)}`,
    ``,
    `4️⃣ PEMASUKAN IMPOUND (KENDARAAN SITAAN):`,
    `   • Unit Derek    : ${summary.impoundStats.count} Kendaraan`,
    `   • Total Fee     : ${formatRp(summary.impoundStats.totalFee)}`,
    `   • Fee Unit      : ${formatRp(summary.impoundStats.flatRewardTotal)}`,
    `   • Komisi Derek  : ${formatRp(summary.impoundStats.feePercentTotal)}`,
    `   ➥ Subtotal      : ${formatRp(summary.impoundStats.subtotal)}`,
    ``,
    `5️⃣ SUKSES PERESTOKAN PERSENJATAAN:`,
    `   • Misi Sukses   : ${summary.restockStats.missionCount} Misi (${formatRp(summary.restockStats.missionRewardTotal)})`,
    `   • Senpi Logistik: ${summary.restockStats.weaponsCount} Unit (${formatRp(summary.restockStats.weaponsRewardTotal)})`,
    `   • Peti Amunisi  : ${summary.restockStats.ammoBoxesCount} Peti (${formatRp(summary.restockStats.ammoBoxesRewardTotal)})`,
    `   ➥ Subtotal      : ${formatRp(summary.restockStats.subtotal)}`,
    ``,
    `6️⃣ PELEBURAN SENJATA (SMELTER & SCRAP):`,
    `   • Senpi Dilebur : ${summary.smeltStats.weaponCount} Unit (${formatRp(summary.smeltStats.scrapRewardTotal)})`,
    `   • Berita Acara  : ${summary.smeltStats.certCount} BA (${formatRp(summary.smeltStats.certRewardTotal)})`,
    `   ➥ Subtotal      : ${formatRp(summary.smeltStats.subtotal)}`,
    `─────────────────────────────────────────`,
    `💰 TOTAL BONUS DINAS : ${formatRp(summary.grandTotalBonus)}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
  ].join('\n');
}
