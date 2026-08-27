import { 
  DetectiveCase, 
  CaseStatus, 
  CasePriority, 
  CaseSuspect, 
  CaseEvidence, 
  CaseTimelineEvent,
  OfficerRankLevel
} from '../types';
import { pushAllToFirestore } from '../services/firebaseRealtimeSync';

export const DETECTIVE_CASES_KEY = 'hspd_detective_cases_v1';
export const DETECTIVE_WARRANTS_KEY = 'hspd_detective_warrants_v1';

// Initial sample detective cases for realistic SA-MP roleplay experience
export const INITIAL_DETECTIVE_CASES: DetectiveCase[] = [
  {
    id: 'CASE-2026-001',
    caseNumber: 'HSPD-DB-26-001',
    title: 'Operasi Sindikat Peredaran Senjata Ilegal Ganton & Idlewood',
    summary: 'Penyelidikan mendalam terhadap sindikat terorganisir penyelundupan & distribusi senjata api ilegal tipe Shotgun, Micro SMG, dan Assault Rifle di area Timur Los Santos.',
    leadDetective: 'Jake Peralta',
    leadDetectiveBadge: '#204',
    assistingDetectives: ['Amy Santiago (#215)', 'Terry Jeffords (#302)'],
    division: 'Detective Bureau / CID',
    status: 'UNDER_INVESTIGATION',
    priority: 'HIGH',
    incidentDate: '2026-08-20',
    location: 'Ganton Gas Station & Motel Idlewood',
    suspects: [
      {
        id: 'susp-01',
        name: 'Salvatore "Don" Falcone',
        alias: 'The Godfather',
        gangAffiliation: 'Falcone Cartel / Syndicate East',
        role: 'BOSS',
        customRoleTitle: 'Pimpinan Tertinggi & Investor Senjata',
        hierarchyLevel: 1,
        status: 'WARRANT_ACTIVE',
        mugshotUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        phone: '555-0199',
        bountyReward: 75000,
        charges: ['Pasal C - Pimpinan Sindikat Kriminal Bersenjata', 'Pasal F - Penyelundupan Senjata Antar Kota'],
        notes: 'Target prioritas #1. Jarang turun ke jalan, mengendalikan suplai dari vila di Vinewood Hills.'
      },
      {
        id: 'susp-02',
        name: 'Vincenzo "Vinnie" Moretti',
        alias: 'The Enforcer',
        gangAffiliation: 'Falcone Cartel / Syndicate East',
        role: 'UNDERBOSS',
        customRoleTitle: 'Wakil Ketua & Pengendali Keuangan',
        hierarchyLevel: 2,
        parentId: 'susp-01',
        status: 'SUSPECT',
        mugshotUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        phone: '555-0842',
        bountyReward: 35000,
        charges: ['Pasal F - Pencucian Uang Hasil Kejahatan', 'Pasal C - Kepemilikan Senjata Api Berat'],
        notes: 'Tangan kanan Don Salvatore. Mengatur rekening penampung dan transaksi deposit rahasia.'
      },
      {
        id: 'susp-03',
        name: 'Carl "CJ" Vance',
        alias: 'The Ghost',
        gangAffiliation: 'Falcone Cartel / Syndicate East',
        role: 'CAPTAIN',
        customRoleTitle: 'Letnan / Koordinator Logistik Ganton',
        hierarchyLevel: 3,
        parentId: 'susp-02',
        status: 'SUSPECT',
        mugshotUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
        phone: '555-0412',
        bountyReward: 15000,
        charges: ['Pasal C - Kepemilikan Senjata Ilegal Berat', 'Pasal B - Transaksi Gelap'],
        notes: 'Kepala pengiriman logistik senjata di wilayah Idlewood dan Ganton. Mengendarai Savannah Hitam.'
      },
      {
        id: 'susp-04',
        name: 'Darius Thorne',
        alias: 'D-Smoke',
        gangAffiliation: 'Falcone Cartel / Syndicate East',
        role: 'SOLDIER',
        customRoleTitle: 'Eksekutor / Kurir Senjata Lapangan',
        hierarchyLevel: 4,
        parentId: 'susp-03',
        status: 'ARRESTED',
        mugshotUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
        phone: '555-0721',
        charges: ['Pasal B - Penjualan Senjata Tanpa Izin'],
        notes: 'Tertangkap saat razia 10-8 di Ocean Docks. Mengakui menerima amunisi dari Carl Vance.'
      },
      {
        id: 'susp-05',
        name: 'Milo "Fingers" Reyes',
        alias: 'Street Rat',
        gangAffiliation: 'Falcone Cartel / Syndicate East',
        role: 'ASSOCIATE',
        customRoleTitle: 'Informan Jalanan & Pengintai Polisi',
        hierarchyLevel: 5,
        parentId: 'susp-04',
        status: 'PERSON_OF_INTEREST',
        phone: '555-0994',
        charges: ['Pasal A - Penghalangan Petugas'],
        notes: 'Sering terlihat nongkrong di motel Idlewood memantau frekuensi radio polisi.'
      }
    ],
    evidences: [
      {
        id: 'ev-01',
        type: 'BALLISTICS',
        title: 'Selongsong Peluru 9mm Tokarev',
        description: 'Ditemukan di TKP baku tembak gang Ganton dengan goresan laras khusus.',
        collectedBy: 'Jake Peralta (#204)',
        collectedDate: '2026-08-20',
        storageLocation: 'Evidence Locker #B-12'
      },
      {
        id: 'ev-02',
        type: 'PHOTO',
        title: 'Foto Pengintaian Transaksi di Bawah Jembatan Ganton',
        description: 'Penyerahan tas duffel hitam berisi 4 unit Micro Uzi pada pukul 23:45.',
        collectedBy: 'Amy Santiago (#215)',
        collectedDate: '2026-08-21',
        imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=500&auto=format&fit=crop&q=80',
        storageLocation: 'Digital Server / Cloud HSPD'
      }
    ],
    timeline: [
      {
        id: 'tl-01',
        timestamp: Date.now() - 86400000 * 4,
        dateFormatted: '2026-08-20 22:15',
        officer: 'Jake Peralta (#204)',
        description: 'Laporan patroli 10-99 mengenai suara tembakan berulang di Ganton. Ditemukan 12 selongsong peluru.'
      },
      {
        id: 'tl-02',
        timestamp: Date.now() - 86400000 * 3,
        dateFormatted: '2026-08-21 14:00',
        officer: 'Amy Santiago (#215)',
        description: 'Wawancara dengan saksi mata pemilik toko 24/7 Idlewood mengenai kendaraan plat #LS-8842.'
      },
      {
        id: 'tl-03',
        timestamp: Date.now() - 86400000 * 1,
        dateFormatted: '2026-08-23 19:30',
        officer: 'Raymond Holt (#401)',
        description: 'Pengesahan Surat Perintah Penggeledahan (Search Warrant #SW-26-09) untuk gudang Ocean Docks Unit 4.'
      }
    ],
    warrantIssued: true,
    warrantNumber: 'SW-26-09 (Search Warrant)',
    notes: 'Prioritas pemantauan 10-8 undercover di area Ganton pada malam hari.',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 1
  },
  {
    id: 'CASE-2026-002',
    caseNumber: 'HSPD-DB-26-002',
    title: 'Perampokan Bersenjata Berencana Fleeca Bank Market',
    summary: 'Aksi pencurian brankas bank terkoordinasi dengan menggunakan bahan peledak thermite dan kendaraan kabur Sultan Biru.',
    leadDetective: 'Terry Jeffords',
    leadDetectiveBadge: '#302',
    assistingDetectives: ['Charles Boyle (#220)'],
    division: 'Detective Bureau / CID',
    status: 'WARRANT_ISSUED',
    priority: 'CRITICAL',
    incidentDate: '2026-08-22',
    location: 'Fleeca Bank, Market Blvd Los Santos',
    suspects: [
      {
        id: 'susp-03',
        name: 'Antonio Morales',
        alias: 'El Scorpio',
        gangAffiliation: 'Los Santos Vagos',
        status: 'WARRANT_ACTIVE',
        mugshotUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        charges: ['Pasal D - Perampokan Bank Berat Berencana', 'Pasal C - Terorisme & Ledakan'],
        notes: 'Buronan berbahaya, bersenjata AK-47. SOP Penangkapan: Code 3 + SWAT Standby.'
      }
    ],
    evidences: [
      {
        id: 'ev-03',
        type: 'SURVEILLANCE_FOOTAGE',
        title: 'Rekaman CCTV ATM Bank Market',
        description: 'Tampak 3 pelaku bertopeng badut menonaktifkan kamera keamanan pada pukul 03:12.',
        collectedBy: 'Terry Jeffords (#302)',
        collectedDate: '2026-08-22',
        storageLocation: 'CCTV Secure Drive #04'
      }
    ],
    timeline: [
      {
        id: 'tl-04',
        timestamp: Date.now() - 86400000 * 2,
        dateFormatted: '2026-08-22 03:20',
        officer: 'Terry Jeffords (#302)',
        description: 'Alarm silent Fleeca Bank Market berbunyi. Unit patroli tiba di TKP dalam 90 detik.'
      },
      {
        id: 'tl-05',
        timestamp: Date.now() - 86400000 * 1,
        dateFormatted: '2026-08-23 10:00',
        officer: 'Leoarnd Neave (#001)',
        description: 'Chief of Police menyetujui penerbitan BOLO & Arrest Warrant tingkat State untuk Antonio Morales.'
      }
    ],
    warrantIssued: true,
    warrantNumber: 'AW-26-11 (Arrest Warrant)',
    notes: 'Koordinasi dengan Unit SWAT untuk penyerbuan safehouse di Las Colinas.',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 1
  }
];

export function getSavedDetectiveCases(): DetectiveCase[] {
  try {
    const raw = localStorage.getItem(DETECTIVE_CASES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed reading detective cases', e);
  }
  return INITIAL_DETECTIVE_CASES;
}

export function saveDetectiveCases(cases: DetectiveCase[]) {
  try {
    localStorage.setItem(DETECTIVE_CASES_KEY, JSON.stringify(cases));
    window.dispatchEvent(new Event('hspd-detective-cases-updated'));
    pushAllToFirestore('DETECTIVE_CASES', cases).catch(console.error);
  } catch (e) {
    console.error('Failed saving detective cases', e);
  }
}
