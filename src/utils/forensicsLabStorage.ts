import { ForensicAnalysis } from '../types';
import { pushAllToFirestore } from '../services/firebaseRealtimeSync';

export const FORENSICS_KEY = 'hspd_forensics_lab_records_v1';

export const INITIAL_FORENSICS: ForensicAnalysis[] = [
  {
    id: 'forensic-1',
    labNumber: 'LAB-2026-0089',
    caseReference: 'CAS-2026-0012',
    examinerName: 'David Miller',
    examinerBadge: '#045',
    analysisType: 'BALLISTICS_MATCH',
    sampleDescription: '3 butir proyektil 9x19mm Parabellum dievakuasi dari pintu kaca toko 24/7 Vinewood',
    findings: 'Alur rifling 6-groove kanan dan striasi mikro 99.4% identik dengan laras senjata Glock 19 (Serial: HSPD-9921) yang disita dari TKP.',
    matchResult: 'POSITIVE_MATCH',
    matchTarget: 'Glock 19 (Serial: HSPD-9921)',
    timestamp: Date.now() - 1000 * 60 * 60 * 18
  },
  {
    id: 'forensic-2',
    labNumber: 'LAB-2026-0090',
    caseReference: 'CAS-2026-0014',
    examinerName: 'Marcus Vance',
    examinerBadge: '#102',
    analysisType: 'GSR_SWAB_TEST',
    sampleDescription: 'Swab kapas residu mesiu di telapak tangan & pergelangan tangan kiri tersangka Trevor Philips',
    findings: 'Uji kimia DPA & Griess Reagent menunjukkan konsentrasi tinggi residu timbal/antimon (Lead/Antimony). Tersangka terbukti melepaskan tembakan dalam kurun waktu 4 jam terakhir.',
    matchResult: 'POSITIVE_MATCH',
    matchTarget: 'Tersangka Trevor Philips (LS-10293)',
    timestamp: Date.now() - 1000 * 60 * 60 * 8
  },
  {
    id: 'forensic-3',
    labNumber: 'LAB-2026-0091',
    caseReference: 'CAS-2026-0015',
    examinerName: 'Elena Rostova',
    examinerBadge: '#088',
    analysisType: 'DRUG_PURITY_TEST',
    sampleDescription: '5 bungkus plastik klip serbuk kristal putih dari dashboard mobil Declasse Tulip',
    findings: 'Uji Scott Reagent & Marquis Test: Positif Methamphetamine murni (Kemurnian 94.2%). Berat bersih 240 gram (Kategori: Narkotika Kelas A / Pengedar).',
    matchResult: 'CONFIRMED_CONTRABAND',
    matchTarget: 'Methamphetamine Kualitas Tinggi (240g)',
    timestamp: Date.now() - 1000 * 60 * 60 * 2
  }
];

export const getSavedForensics = (): ForensicAnalysis[] => {
  try {
    const raw = localStorage.getItem(FORENSICS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed reading forensics', e);
  }
  return INITIAL_FORENSICS;
};

export const saveForensics = (records: ForensicAnalysis[]) => {
  localStorage.setItem(FORENSICS_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event('hspd-forensics-updated'));
  // Sync to Firebase Cloud Database in background
  pushAllToFirestore('FORENSICS', records).catch(console.error);
};
