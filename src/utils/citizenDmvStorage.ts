import { CitizenProfile } from '../types';
import { pushAllToFirestore } from '../services/firebaseRealtimeSync';

export const CITIZEN_DMV_KEY = 'hspd_citizen_dmv_database_v1';

export const INITIAL_CITIZENS: CitizenProfile[] = [
  {
    id: 'cit-1',
    citizenId: 'LS-90142',
    fullName: 'Michael De Santa',
    dateOfBirth: '1968-04-20',
    gender: 'MALE',
    phoneNumber: '555-0182',
    address: 'Portola Drive, Rockford Hills #802',
    avatarUrl: '',
    driverLicenseStatus: 'VALID',
    driverPoints: 0,
    gunLicenseStatus: 'VALID_WCL',
    isWantedBolo: false,
    registeredVehicles: [
      { plate: '5MICH01', model: 'Obey Tailgater (Sedan)', color: 'Black Matte', status: 'ACTIVE' },
      { plate: '88ROB99', model: 'Ubermacht Sentinel Classic', color: 'Midnight Blue', status: 'ACTIVE' }
    ],
    priorArrests: [
      {
        recordId: 'ARR-2025-091',
        charges: 'Pasal 2.1 (Speeding Jalan Tol) & Pasal 1.2 (Kelalaian Mengemudi)',
        jailSentenceMinutes: 0,
        fineAmount: 4500,
        arrestingOfficer: 'Marcus Vance (#102)',
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 60
      }
    ],
    notes: 'Pemilik rumah di kawasan Rockford Hills. WCL Kelas 1 terdaftar resmi untuk perlindungan pribadi.'
  },
  {
    id: 'cit-2',
    citizenId: 'LS-84920',
    fullName: 'Franklin Clinton',
    dateOfBirth: '1988-06-11',
    gender: 'MALE',
    phoneNumber: '555-0155',
    address: 'Whispymound Drive, Vinewood Hills',
    avatarUrl: '',
    driverLicenseStatus: 'VALID',
    driverPoints: 2,
    gunLicenseStatus: 'VALID_CCW',
    isWantedBolo: false,
    registeredVehicles: [
      { plate: 'FC88LS', model: 'Bravado Buffalo S', color: 'White Pearl', status: 'ACTIVE' },
      { plate: 'BAGG01', model: 'Western Bagger Motorcycle', color: 'Green Metallic', status: 'ACTIVE' }
    ],
    priorArrests: [],
    notes: 'Kooperatif saat pemeriksaan lalu lintas rutin.'
  },
  {
    id: 'cit-3',
    citizenId: 'LS-10293',
    fullName: 'Trevor Philips',
    dateOfBirth: '1967-11-14',
    gender: 'MALE',
    phoneNumber: '555-0133',
    address: 'Marina Drive, Sandy Shores Trailer Park',
    avatarUrl: '',
    driverLicenseStatus: 'REVOKED',
    driverPoints: 12,
    gunLicenseStatus: 'REVOKED',
    isWantedBolo: true,
    wantedReason: '10-99 CODE RED: Penyerangan Terhadap Petugas, Kepemilikan Narkoba Kelas A (Meth) & Bahan Peledak Ilegal',
    registeredVehicles: [
      { plate: 'BETTY69', model: 'Canis Bodhi 4x4', color: 'Rusty Red', status: 'STOLEN' },
      { plate: 'TP-ENT', model: 'Frogger Helicopter', color: 'Yellow Black', status: 'ACTIVE' }
    ],
    priorArrests: [
      {
        recordId: 'ARR-2026-004',
        charges: 'Pasal 5.4 (Kepemilikan Senjata Otomatis) & Pasal 3.2 (Melarikan Diri dari Petugas)',
        jailSentenceMinutes: 45,
        fineAmount: 25000,
        arrestingOfficer: 'David Miller (#045)',
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 14
      }
    ],
    notes: 'PERINGATAN TINGGI: Selalu bersenjata laras panjang dan sangat agresif terhadap penegak hukum. Butuh SWAT bila terdeteksi.'
  },
  {
    id: 'cit-4',
    citizenId: 'LS-77401',
    fullName: 'Lamar Davis',
    dateOfBirth: '1989-02-18',
    gender: 'MALE',
    phoneNumber: '555-0144',
    address: 'Forum Drive, Strawberry, South Los Santos',
    avatarUrl: '',
    driverLicenseStatus: 'SUSPENDED',
    driverPoints: 8,
    gunLicenseStatus: 'NONE',
    isWantedBolo: false,
    registeredVehicles: [
      { plate: 'L-STAR', model: 'Albany Emperor Lowrider', color: 'Bright Green', status: 'IMPOUNDED' }
    ],
    priorArrests: [
      {
        recordId: 'ARR-2026-018',
        charges: 'Pasal 4.1 (Kepemilikan Mariyuana Tanpa Izin) & Balap Liar',
        jailSentenceMinutes: 15,
        fineAmount: 8500,
        arrestingOfficer: 'Frank Sinatra (#210)',
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5
      }
    ],
    notes: 'SIM ditangguhkan (Suspended) akibat akumulasi poin tilang balap liar di area Strawberry.'
  }
];

export const getSavedCitizens = (): CitizenProfile[] => {
  try {
    const raw = localStorage.getItem(CITIZEN_DMV_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed reading citizens', e);
  }
  return INITIAL_CITIZENS;
};

export const saveCitizens = (citizens: CitizenProfile[]) => {
  localStorage.setItem(CITIZEN_DMV_KEY, JSON.stringify(citizens));
  window.dispatchEvent(new Event('hspd-citizens-updated'));
  // Sync to Firebase Cloud Database
  pushAllToFirestore('CITIZENS', citizens).catch(console.error);
};
