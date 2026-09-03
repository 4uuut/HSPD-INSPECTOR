import { 
  AsdHelicopter, 
  K9Partner, 
  K9DeploymentLog, 
  SwatOperation, 
  IadComplaint, 
  CadetEvaluation,
  TedTrafficRecord
} from '../types';
import { pushToFirestore } from '../services/firebaseRealtimeSync';

export const ASD_KEY = 'hspd_asd_helicopters_v1';
export const K9_KEY = 'hspd_k9_partners_v1';
export const K9_LOGS_KEY = 'hspd_k9_deployment_logs_v1';
export const SWAT_KEY = 'hspd_swat_operations_v1';
export const IAD_KEY = 'hspd_iad_complaints_v1';
export const ACADEMY_KEY = 'hspd_academy_evaluations_v1';
export const TED_KEY = 'hspd_ted_records_v1';

export const INITIAL_ASD_HELIS: AsdHelicopter[] = [
  {
    id: 'asd-1',
    tailNumber: 'AIR-ONE (N911LS)',
    model: 'Buckingham Police Maverick FLIR 4K',
    status: 'IN_AIR_PATROL',
    pilotName: 'Elena Rostova',
    pilotBadge: '#088',
    tacticalObserverName: 'Tommy Ross',
    fuelPercentage: 84,
    flirThermalMode: 'THERMAL_WHITE_HOT',
    searchlightActive: true,
    altitudeFeet: 1250,
    currentSector: 'Vinewood Hills & Downtown Metro'
  },
  {
    id: 'asd-2',
    tailNumber: 'AIR-TWO (N912LS)',
    model: 'Airbus H145 Tactical MedEvac',
    status: 'AVAILABLE',
    pilotName: 'Marcus Vance',
    pilotBadge: '#102',
    fuelPercentage: 100,
    flirThermalMode: 'NORMAL',
    searchlightActive: false,
    altitudeFeet: 0,
    currentSector: 'Mission Row Helipad (Standby)'
  }
];

export const INITIAL_K9_PARTNERS: K9Partner[] = [
  {
    id: 'k9-1',
    dogName: 'K-9 Zeus',
    breed: 'Belgian Malinois (Jantan - 3 Tahun)',
    handlerName: 'Frank Sinatra',
    handlerBadge: '#210',
    specialization: 'NARCOTICS & WEAPONS',
    certificationStatus: 'CERTIFIED',
    totalDeployments: 34,
    totalFinds: 18,
    totalBites: 2,
    healthStatus: 'OPTIMAL',
    lastVetCheckDate: '20 Agustus 2026'
  },
  {
    id: 'k9-2',
    dogName: 'K-9 Bella',
    breed: 'German Shepherd (Betina - 2.5 Tahun)',
    handlerName: 'Alex Mercer',
    handlerBadge: '#199',
    specialization: 'EXPLOSIVES & IED',
    certificationStatus: 'CERTIFIED',
    totalDeployments: 19,
    totalFinds: 9,
    totalBites: 0,
    healthStatus: 'OPTIMAL',
    lastVetCheckDate: '15 Agustus 2026'
  },
  {
    id: 'k9-3',
    dogName: 'K-9 Thor',
    breed: 'Dutch Shepherd (Jantan - 4 Tahun)',
    handlerName: 'David Miller',
    handlerBadge: '#045',
    specialization: 'TACTICAL PATROL',
    certificationStatus: 'CERTIFIED',
    totalDeployments: 42,
    totalFinds: 23,
    totalBites: 6,
    healthStatus: 'OPTIMAL',
    lastVetCheckDate: '18 Agustus 2026'
  }
];

export const INITIAL_K9_LOGS: K9DeploymentLog[] = [
  {
    id: 'k9-log-1',
    dogName: 'K-9 Zeus',
    handlerName: 'Frank Sinatra',
    location: 'Vespucci Beach Parking Lot',
    targetType: 'VEHICLE_SNIFF',
    resultStatus: 'POSITIVE_HIT',
    findingsSummary: 'Zeus mengendus bau mariyuana & kokain di bawah jok kemudi mobil Declasse Tulip.',
    timestamp: Date.now() - 1000 * 60 * 60 * 4
  },
  {
    id: 'k9-log-2',
    dogName: 'K-9 Bella',
    handlerName: 'Alex Mercer',
    location: 'Los Santos International Airport (LSIA) Cargo Bay',
    targetType: 'BUILDING_SWEEP',
    resultStatus: 'NEGATIVE_CLEAR',
    findingsSummary: 'Penyisiran bagasi kargo mencurigakan: Nihil bahan peledak / IED, area dinyatakan steril.',
    timestamp: Date.now() - 1000 * 60 * 60 * 18
  }
];

export const INITIAL_SWAT_OPS: SwatOperation[] = [
  {
    id: 'swat-op-1',
    opCode: 'OP-EAGLE-STRIKE',
    missionType: 'HOSTAGE_RESCUE',
    threatLevel: 'CODE_RED',
    teamLeadName: 'David Miller',
    teamLeadBadge: '#045',
    assignedOperators: ['David Miller (#045)', 'Alex Mercer (#199)', 'Marcus Vance (#102)'],
    breachingPlan: 'EXPLOSIVE_C4',
    status: 'EXECUTING',
    targetLocation: 'Pacific Standard Bank Vinewood',
    hostageCount: 2,
    armedSuspectCount: 4,
    createdAt: Date.now() - 1000 * 60 * 40,
    notes: 'Perampok menolak bernegosiasi, tim sniper menduduki atap bioskop Doppler.'
  },
  {
    id: 'swat-op-2',
    opCode: 'OP-RANCH-CLEAN',
    missionType: 'HIGH_RISK_WARRANT',
    threatLevel: 'HIGH',
    teamLeadName: 'David Miller',
    teamLeadBadge: '#045',
    assignedOperators: ['David Miller (#045)', 'Tommy Ross (#142)'],
    breachingPlan: 'BATTERING_RAM',
    status: 'ALL_CLEAR',
    targetLocation: 'Madrazo Ranch Warehouse, La Fuente Blanca',
    hostageCount: 0,
    armedSuspectCount: 6,
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    notes: 'Penggerebekan gudang senjata otomatis, 5 pelaku menyerah, 1 dilumpuhkan non-lethal.'
  }
];

export const INITIAL_IAD_COMPLAINTS: IadComplaint[] = [
  {
    id: 'iad-1',
    caseNumber: 'IAD-2026-0041',
    complainantName: 'Michael De Santa',
    complainantType: 'CIVILIAN',
    accusedOfficerName: 'Marcus Vance',
    accusedOfficerBadge: '#102',
    accusedOfficerRank: 'POLICE OFFICER II [PO II]',
    allegationCategory: 'EXCESSIVE_FORCE',
    incidentDate: '22 Agustus 2026',
    incidentLocation: 'Rockford Hills Boulevard',
    narrative: 'Warga mengeluhkan pemukulan dengan baton saat proses tilang kendaraan padahal sudah kooperatif mengangkat tangan.',
    investigatorName: 'Leoarnd Neave (Chief of Police)',
    status: 'UNDER_INVESTIGATION',
    createdAt: Date.now() - 1000 * 60 * 60 * 36
  },
  {
    id: 'iad-2',
    caseNumber: 'IAD-2026-0038',
    complainantName: 'Anonymous Whistleblower',
    complainantType: 'OFFICER_INTERNAL',
    accusedOfficerName: 'Tommy Ross',
    accusedOfficerBadge: '#142',
    accusedOfficerRank: 'POLICE OFFICER I [PO I]',
    allegationCategory: 'PROCEDURAL_VIOLATION',
    incidentDate: '15 Agustus 2026',
    incidentLocation: 'Sandy Shores Impound Garage',
    narrative: 'Tidak membacakan Hak Miranda (Miranda Warning) sebelum memasukkan tersangka ke dalam sel tahanan.',
    investigatorName: 'David Miller (Commander)',
    status: 'SUSTAINED',
    recommendedSanction: 'STRIKE_WARNING',
    createdAt: Date.now() - 1000 * 60 * 60 * 120,
    resolvedAt: Date.now() - 1000 * 60 * 60 * 48
  }
];

export const INITIAL_CADET_EVALS: CadetEvaluation[] = [
  {
    id: 'eval-1',
    cadetName: 'John Maverick',
    cadetBadge: '#301',
    ftoName: 'Marcus Vance',
    ftoBadge: '#102',
    phase: 'PHASE 2 (BASIC PATROL)',
    drivingScore: 4,
    radioCommsScore: 5,
    pasalApplicationScore: 4,
    tacticalShootScore: 4,
    mirandaRightsScore: 5,
    overallGrade: 'SATISFACTORY',
    notes: 'Cadet sangat fasih dalam penggunaan 10-codes di radio dan membacakan Hak Miranda dengan lugas. Perlu latihan PIT maneuver di sirkuit.',
    recommendation: 'PASS_TO_NEXT_PHASE',
    evaluatedAt: Date.now() - 1000 * 60 * 60 * 12
  }
];

export const INITIAL_TED_RECORDS: TedTrafficRecord[] = [
  {
    id: 'ted-1',
    driverName: 'Franklin Clinton',
    driverLicense: 'DL-89021',
    vehiclePlate: 'LS-889-BB',
    vehicleModel: 'Bravado Buffalo STX (Hitam)',
    clockedSpeedMph: 115,
    speedLimitMph: 65,
    bacLevel: 0.00,
    violations: ['Pasal 104: Pelanggaran Batas Kecepatan Berat (+50 MPH)', 'Pasal 108: Mengemudi Ugal-Ugalan (Reckless Driving)'],
    totalFine: 2500,
    officerName: 'Alex Mercer',
    officerBadge: '#199',
    actionTaken: 'CITATION_ISSUED',
    location: 'Del Perro Freeway, Exit 4',
    timestamp: Date.now() - 1000 * 60 * 60 * 3
  },
  {
    id: 'ted-2',
    driverName: 'Trevor Philips',
    driverLicense: 'DL-33412',
    vehiclePlate: 'BC-991-TP',
    vehicleModel: 'Canis Bodhi (Merah Karat)',
    clockedSpeedMph: 75,
    speedLimitMph: 45,
    bacLevel: 0.14,
    violations: ['Pasal 112: Mengemudi Bawah Pengaruh Alkohol (DUI BAC > 0.08%)', 'Pasal 105: Melanggar Lampu Merah'],
    totalFine: 4500,
    officerName: 'Frank Sinatra',
    officerBadge: '#210',
    actionTaken: 'DUI_ARREST',
    location: 'Route 68, Senora Desert',
    timestamp: Date.now() - 1000 * 60 * 60 * 22
  }
];

/**
 * Synchronizes all specialized division modules into a single consolidated Cloud document.
 */
export function syncSpecializedDivisionsToCloud() {
  try {
    const bundle = {
      id: 'specialized_divisions',
      asd: getSavedAsdHelis(),
      k9: getSavedK9Partners(),
      k9Logs: getSavedK9Logs(),
      swat: getSavedSwatOps(),
      iad: getSavedIadComplaints(),
      academy: getSavedCadetEvals(),
      ted: getSavedTedRecords(),
      updatedAt: Date.now()
    };
    pushToFirestore('SYSTEM_CONFIGS', bundle, 'specialized_divisions').catch(() => {});
  } catch (e) {
    console.warn('Failed to sync specialized divisions to cloud', e);
  }
}

export const getSavedAsdHelis = (): AsdHelicopter[] => {
  try {
    const raw = localStorage.getItem(ASD_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_ASD_HELIS;
};

export const saveAsdHelis = (helis: AsdHelicopter[]) => {
  try {
    localStorage.setItem(ASD_KEY, JSON.stringify(helis));
    window.dispatchEvent(new Event('hspd-asd-updated'));
    syncSpecializedDivisionsToCloud();
  } catch (e) {
    console.error('Failed to save ASD helis:', e);
  }
};

export const getSavedK9Partners = (): K9Partner[] => {
  try {
    const raw = localStorage.getItem(K9_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_K9_PARTNERS;
};

export const saveK9Partners = (partners: K9Partner[]) => {
  try {
    localStorage.setItem(K9_KEY, JSON.stringify(partners));
    window.dispatchEvent(new Event('hspd-k9-updated'));
    syncSpecializedDivisionsToCloud();
  } catch (e) {
    console.error('Failed to save K9 partners:', e);
  }
};

export const getSavedK9Logs = (): K9DeploymentLog[] => {
  try {
    const raw = localStorage.getItem(K9_LOGS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_K9_LOGS;
};

export const saveK9Logs = (logs: K9DeploymentLog[]) => {
  try {
    localStorage.setItem(K9_LOGS_KEY, JSON.stringify(logs));
    window.dispatchEvent(new Event('hspd-k9-logs-updated'));
    syncSpecializedDivisionsToCloud();
  } catch (e) {
    console.error('Failed to save K9 logs:', e);
  }
};

export const getSavedSwatOps = (): SwatOperation[] => {
  try {
    const raw = localStorage.getItem(SWAT_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_SWAT_OPS;
};

export const saveSwatOps = (ops: SwatOperation[]) => {
  try {
    localStorage.setItem(SWAT_KEY, JSON.stringify(ops));
    window.dispatchEvent(new Event('hspd-swat-updated'));
    syncSpecializedDivisionsToCloud();
  } catch (e) {
    console.error('Failed to save SWAT ops:', e);
  }
};

export const getSavedIadComplaints = (): IadComplaint[] => {
  try {
    const raw = localStorage.getItem(IAD_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_IAD_COMPLAINTS;
};

export const saveIadComplaints = (complaints: IadComplaint[]) => {
  try {
    localStorage.setItem(IAD_KEY, JSON.stringify(complaints));
    window.dispatchEvent(new Event('hspd-iad-updated'));
    syncSpecializedDivisionsToCloud();
  } catch (e) {
    console.error('Failed to save IAD complaints:', e);
  }
};

export const getSavedCadetEvals = (): CadetEvaluation[] => {
  try {
    const raw = localStorage.getItem(ACADEMY_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_CADET_EVALS;
};

export const saveCadetEvals = (evals: CadetEvaluation[]) => {
  try {
    localStorage.setItem(ACADEMY_KEY, JSON.stringify(evals));
    window.dispatchEvent(new Event('hspd-academy-updated'));
    syncSpecializedDivisionsToCloud();
  } catch (e) {
    console.error('Failed to save cadet evals:', e);
  }
};

export const getSavedTedRecords = (): TedTrafficRecord[] => {
  try {
    const raw = localStorage.getItem(TED_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_TED_RECORDS;
};

export const saveTedRecords = (records: TedTrafficRecord[]) => {
  try {
    localStorage.setItem(TED_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event('hspd-ted-updated'));
    syncSpecializedDivisionsToCloud();
  } catch (e) {
    console.error('Failed to save TED records:', e);
  }
};
