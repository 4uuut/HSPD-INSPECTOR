import { BoloAlert, ImpoundRecord } from '../types';
import { pushAllToFirestore } from '../services/firebaseRealtimeSync';

export const BOLO_STORAGE_KEY = 'hspd_bolo_alerts_v1';
export const IMPOUND_STORAGE_KEY = 'hspd_impound_records_v1';

export const INITIAL_BOLO_ALERTS: BoloAlert[] = [
  {
    id: 'BOLO-01',
    type: 'VEHICLE',
    title: 'Sultan Biru Tua Gelap - Plat #LS-7749 (Kasus Perampokan Bank)',
    description: 'Kendaraan digunakan dalam aksi kabur perampokan Fleeca Bank Market. Kaca film gelap, knalpot racing, pelek emas.',
    dangerLevel: 'HIGH',
    lastSeenLocation: 'Terakhir terlihat melaju ke arah Temple / Mulholland',
    issuedBy: 'Terry Jeffords',
    issuedByBadge: '#302',
    active: true,
    timestamp: Date.now() - 3600000 * 2
  },
  {
    id: 'BOLO-02',
    type: 'PERSON',
    title: 'Antonio Morales (El Scorpio) - Bersenjata AK-47 & Rompi Berat',
    description: 'Tersangka utama kasus penembakan petugas patroli di East Beach. Waspada tembak di tempat jika melawan.',
    dangerLevel: 'EXTREME_ARMED_DANGEROUS',
    lastSeenLocation: 'Las Colinas / Los Flores area',
    issuedBy: 'Leoarnd Neave',
    issuedByBadge: '#001',
    active: true,
    timestamp: Date.now() - 3600000 * 5
  },
  {
    id: 'BOLO-04',
    type: 'PERSON',
    title: 'Trevor Philips - BURONAN / DPO Kasus Perampokan Bersenjata & Penyerangan',
    description: 'Tersangka DPO nomor 1 kasus perampokan bersenjata bank, penyelundupan senjata ilegal, dan penyerangan aparat HSPD. Sangat berbahaya.',
    dangerLevel: 'EXTREME_ARMED_DANGEROUS',
    lastSeenLocation: 'Sandy Shores Trailer Park / Grand Senora Desert',
    issuedBy: 'Jackie Xianlao',
    issuedByBadge: '#001',
    active: true,
    timestamp: Date.now() - 3600000 * 8
  },
  {
    id: 'BOLO-03',
    type: 'ALL_POINTS_BULLETIN',
    title: 'Patroli Khusus Area Santa Maria Beach & Verona',
    description: 'Peningkatan patroli balap liar ilegal dan transaksi narkoba jalanan pada malam hari.',
    dangerLevel: 'LOW',
    lastSeenLocation: 'Santa Maria Beach Boardwalk',
    issuedBy: 'Raymond Holt',
    issuedByBadge: '#401',
    active: true,
    timestamp: Date.now() - 3600000 * 12
  }
];

export const INITIAL_IMPOUND_RECORDS: ImpoundRecord[] = [
  {
    id: 'IMP-01',
    plateNumber: 'LS-9921',
    vehicleModel: 'Elegy RH8',
    color: 'Merah Putih',
    ownerName: 'Kenji Sato',
    reason: 'Pasal E - Balap Liar Ilegal di Commerce + Kecepatan Tinggi Tanpa Lampu',
    impoundDays: 3,
    impoundFee: 15000,
    officerName: 'Amy Santiago',
    officerBadge: '#215',
    status: 'IMPOUNDED',
    locationFound: 'Persimpangan Commerce, Los Santos',
    timestamp: Date.now() - 86400000 * 1
  },
  {
    id: 'IMP-02',
    plateNumber: 'LS-1184',
    vehicleModel: 'Sanchez Motocross',
    color: 'Hijau Tosca',
    ownerName: 'Rico Cortez',
    reason: 'Pasal C - Kendaraan Ditinggalkan di TKP Baku Tembak Idlewood',
    impoundDays: 7,
    impoundFee: 30000,
    officerName: 'Jake Peralta',
    officerBadge: '#204',
    status: 'IMPOUNDED',
    locationFound: 'Belakang Motel Idlewood',
    timestamp: Date.now() - 86400000 * 2
  },
  {
    id: 'IMP-03',
    plateNumber: 'LS-8831',
    vehicleModel: 'Karin Sultan RS',
    color: 'Hitam Metalik',
    ownerName: 'Carl Johnson',
    reason: 'Penyitaan Senjata: Ditemukan Senjata Ilegal (Micro SMG & Pistol Tanpa Serial Sah) di Dalam Kendaraan saat Razia Gabungan',
    impoundDays: 14,
    impoundFee: 35000,
    officerName: 'Momo Hatakeyama',
    officerBadge: '#001',
    status: 'IMPOUNDED',
    locationFound: 'Persimpangan Ganton - Idlewood',
    timestamp: Date.now() - 3600000 * 10
  },
  {
    id: 'IMP-04',
    plateNumber: 'LS-7749',
    vehicleModel: 'Bravado Buffalo STX',
    color: 'Abu-abu Gelap',
    ownerName: 'Trevor Philips',
    reason: 'Penyitaan BB Kejahatan: Kendaraan Bekas Merampok Bank Fleeca Market (Getaway Vehicle Perampokan Bersenjata Api & Pembobolan Vault)',
    impoundDays: 30,
    impoundFee: 50000,
    officerName: 'Terry Jeffords',
    officerBadge: '#302',
    status: 'IMPOUNDED',
    locationFound: 'Gudang Pelabuhan Ocean Docks',
    timestamp: Date.now() - 3600000 * 16
  },
  {
    id: 'IMP-05',
    plateNumber: 'LS-2490',
    vehicleModel: 'Vapid Speedo Custom',
    color: 'Putih Dop',
    ownerName: 'Dmitri Voronin',
    reason: 'Penyitaan Berat: Ditemukan Muatan Senjata Ilegal Otomatis Laras Panjang (AK-47 & Box Amunisi) di Bagasi Belakang Kendaraan',
    impoundDays: 21,
    impoundFee: 45000,
    officerName: 'Amy Santiago',
    officerBadge: '#215',
    status: 'IMPOUNDED',
    locationFound: 'Docks Warehouse #4, Los Santos',
    timestamp: Date.now() - 86400000 * 3
  },
  {
    id: 'IMP-06',
    plateNumber: 'LS-4402',
    vehicleModel: 'Ubermacht Oracle XS',
    color: 'Biru Tua',
    ownerName: 'Vance Rodriguez',
    reason: 'Penyitaan BB Pidana: Kendaraan Bekas Merampok Toko Perhiasan Vangelico Jewelry (Barang Bukti Aksi Perampokan & Pencurian Bersenjata)',
    impoundDays: 28,
    impoundFee: 40000,
    officerName: 'Jake Peralta',
    officerBadge: '#204',
    status: 'IMPOUNDED',
    locationFound: 'Pillbox Hill Underground Parking',
    timestamp: Date.now() - 86400000 * 4
  }
];

export function getSavedBoloAlerts(): BoloAlert[] {
  try {
    const raw = localStorage.getItem(BOLO_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed reading BOLO alerts', e);
  }
  return INITIAL_BOLO_ALERTS;
}

export function saveBoloAlerts(bolos: BoloAlert[]) {
  try {
    localStorage.setItem(BOLO_STORAGE_KEY, JSON.stringify(bolos));
    window.dispatchEvent(new Event('hspd-bolo-updated'));
    pushAllToFirestore('BOLOS', bolos).catch(console.error);
  } catch (e) {
    console.error('Failed saving BOLO alerts', e);
  }
}

export function getSavedImpounds(): ImpoundRecord[] {
  try {
    const raw = localStorage.getItem(IMPOUND_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed reading Impound records', e);
  }
  return INITIAL_IMPOUND_RECORDS;
}

export function saveImpounds(impounds: ImpoundRecord[]) {
  try {
    localStorage.setItem(IMPOUND_STORAGE_KEY, JSON.stringify(impounds));
    window.dispatchEvent(new Event('hspd-impound-updated'));
    pushAllToFirestore('IMPOUNDS', impounds).catch(console.error);
  } catch (e) {
    console.error('Failed saving Impound records', e);
  }
}
