export interface TacticalPhotoPreset {
  id: string;
  stage: 'NEGOTIATION' | 'SHOOTING_SETUP' | 'FINAL_OUTCOME';
  title: string;
  url: string;
  suggestedCaption: string;
  suggestedNotes: string;
}

export const TACTICAL_PHOTO_PRESETS: TacticalPhotoPreset[] = [
  // 1. TAHAP AWAL / NEGOSIASI
  {
    id: 'photo-neg-1',
    stage: 'NEGOTIATION',
    title: 'Negosiasi Depan Bank Pusat (Pacific Standard)',
    url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80',
    suggestedCaption: 'Negosiator SWAT Berdialog dengan Perampok di Pintu Utama',
    suggestedNotes: 'Pukul 14:15 WIB: Negosiator membuka saluran dialog 10-99 via pengeras suara. Pelaku menuntut mobil pelarian diisi bensin penuh dan menolak melepas sandera tanpa jaminan jalan aman.'
  },
  {
    id: 'photo-neg-2',
    stage: 'NEGOTIATION',
    title: 'Blokade Perimeter Luar Bank Pedesaan (Paleto / Fleeca)',
    url: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=800&auto=format&fit=crop&q=80',
    suggestedCaption: 'Pengepungan Bank Desa & Upaya Komunikasi Radio Lapangan',
    suggestedNotes: 'Pukul 11:10 WIB: Patroli lokal memblokir akses persimpangan jalan desa. Pelaku berteriak dari jendela mengancam membakar meja kasir jika polisi mendekat.'
  },
  {
    id: 'photo-neg-3',
    stage: 'NEGOTIATION',
    title: 'Perimeter Malam & Penyekatan Taktis Toko Emas / Minimarket',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
    suggestedCaption: 'Barikade Malam Hari & Sorotan Lampu Taktis ke Lobi Gedung',
    suggestedNotes: 'Pukul 22:30 WIB: Lampu sorot patroli diarahkan ke jendela toko. Kontak awal terjalin dengan pelaku bersenjata di dalam etalase.'
  },
  {
    id: 'photo-neg-4',
    stage: 'NEGOTIATION',
    title: 'Briefing Lapangan & Pengendalian Garis Garis Darurat',
    url: 'https://images.unsplash.com/photo-1569420067645-5d9c34e007d4?w=800&auto=format&fit=crop&q=80',
    suggestedCaption: 'Staging Area Komando Taktis & Persiapan Negosiasi Sandera',
    suggestedNotes: 'Incident Commander menggelar peta denah gedung dan membagi tugas negosiator serta tim pendobrak.'
  },

  // 2. LOKASI PENEMBAKAN / SETUP BARIKADE PERAMPOK
  {
    id: 'photo-shoot-1',
    stage: 'SHOOTING_SETUP',
    title: 'Posisi Sniper Atap Gedung & Pengawasan Garis Bidik',
    url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80',
    suggestedCaption: 'Setup Sniper Atap Doppler & Pemantauan Titik Crossfire Perampok',
    suggestedNotes: 'Pukul 14:38 WIB: Tim penembak jitu di atap seberang memantau pergerakan moncong senjata suspect dan menetralisir penembak di balik mobil pelarian.'
  },
  {
    id: 'photo-shoot-2',
    stage: 'SHOOTING_SETUP',
    title: 'Setup Barikade Mobil Sultan & Titik Baku Tembak Jalanan',
    url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80',
    suggestedCaption: 'Baku Tembak di Balik Mobil Perampok & Penetrasi Barikade',
    suggestedNotes: 'Pelaku mulai menembakkan senjata otomatis saat keluar membawa tas duffle. Polisi membalas dari balik pintu berlapis baja Bearcat.'
  },
  {
    id: 'photo-shoot-3',
    stage: 'SHOOTING_SETUP',
    title: 'Kontak Tembak Gudang Pelabuhan / Lorong Kontainer',
    url: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800&auto=format&fit=crop&q=80',
    suggestedCaption: 'Baku Tembak di Sudut Gelap Lorong Gudang Kontainer',
    suggestedNotes: 'Pelaku melepaskan tembakan shotgun dari balik peti kemas sebelum dilumpuhkan oleh tim breacher dan unit satwa K-9.'
  },

  // 3. SELESAI PENANGANAN / HASIL AKHIR (BERHASIL / TIDAK)
  {
    id: 'photo-end-1',
    stage: 'FINAL_OUTCOME',
    title: 'Operasi Selesai (Code 4), Sandera Selamat & Uang Disita',
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
    suggestedCaption: 'Gedung Steril (Code 4), Sandera Dievakuasi & Uang Tunai Diselamatkan',
    suggestedNotes: 'Pukul 14:52 WIB: Seluruh sandera dievakuasi dalam keadaan selamat. Pelaku diborgol dan seluruh barang bukti uang tunai brankas disita ke markas.'
  },
  {
    id: 'photo-end-2',
    stage: 'FINAL_OUTCOME',
    title: 'Olah TKP Inafis & Pemasangan Police Line',
    url: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=800&auto=format&fit=crop&q=80',
    suggestedCaption: 'Penyisiran Pasca-Operasi, Olah TKP & Evakuasi Medis EMS',
    suggestedNotes: 'Area dipasangi garis polisi (police line). Tim medis menstabilkan korban luka dan senjata rampokan didata untuk berita acara forensik.'
  },
  {
    id: 'photo-end-3',
    stage: 'FINAL_OUTCOME',
    title: 'Tersangka Diamankan ke Sel Mobil Tahanan',
    url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80',
    suggestedCaption: 'Tersangka Diangkut Menuju Sel Tahanan Mabes HSPD',
    suggestedNotes: 'Tersangka yang menyerah dinaikkan ke van transportasi tahanan dengan pengawalan ketat dua unit patroli bersenjata.'
  }
];

export const PRESET_POLICE_WEAPONS = [
  'Carbine Rifle Mk II (5.56x45mm NATO)',
  'Special Carbine Assault Rifle',
  'Tactical Shotgun 12-Gauge Drum',
  'Pump Shotgun Mk II (00-Buck & Slug)',
  'Heavy Sniper Rifle (.50 BMG)',
  'Marksman Rifle Semi-Auto',
  'SMG MP5 (9mm Submachine Gun)',
  'Combat Pistol 9mm (Sidearm)',
  'Taser X26P Conducted Energy Device',
  'Flashbang Grenade M84 (Stun)',
  'Smoke Grenade M18 (Tabir Asap)',
  'CS Tear Gas Grenade (Gas Air Mata)',
  'Battering Ram Taktis Baja',
  'Perisai Balistik Level IV (Ballistic Shield)',
  'Kamera Termal FLIR 4K Airborne'
];

export const PRESET_SUSPECT_WEAPONS = [
  'Assault Rifle AK-47 (7.62x39mm)',
  'Micro SMG Uzi (9mm Automatic)',
  'Mini SMG Scorpion',
  'Heavy Shotgun Drum Mag',
  'Sawn-off Double Barrel Shotgun',
  'Pistol Semi-Auto .50 Caliber',
  'Combat Pistol 9mm',
  'Pistol Revolver .44 Magnum',
  'Alat Las Thermite Bor C4 (Pemotong Brankas)',
  'Bom Pipa Rakitan (Pipe Bomb)',
  'Molotov Cocktail Botol Kaca',
  'Granat Nanas F1',
  'Palu Godam Pemecah Kaca Baja',
  'Pahat Besi Brankas Pedesaan'
];

export const PRESET_LOCATIONS = [
  'Pacific Standard Public Depository, Vinewood Blvd & Alta St (Bank Pusat)',
  'Blaine County Savings Bank, Paleto Boulevard, Paleto Bay (Bank Pedesaan Paleto)',
  'Fleeca Bank Highway 68, Harmony (Bank Pedesaan Harmony)',
  'Fleeca Bank Boulevard Del Perro & Marathon Ave',
  'Fleeca Bank Great Ocean Highway, Chumash Beach',
  'Vangelico Jewelers, Portola Drive, Rockford Hills',
  'Ocean Docks Container Warehouse Terminal Unit 14B',
  'Madrazo Ranch La Fuente Blanca, Vinewood Hills',
  'Del Perro Freeway Exit 4 & Overpass La Puerta',
  'Los Santos International Airport (LSIA) Cargo Bay 2',
  'Sandy Shores Airfield Hangar Timur',
  'Maze Bank Tower Lobby, Pillbox Hill Downtown'
];

export const PRESET_TACTICAL_VEHICLES = [
  'Brute SWAT Bearcat (Armored Heavy Transport)',
  'Buckingham Police Maverick FLIR 4K (AIR-ONE ASD)',
  'Vapid Stanier Cruiser (Patrol Interceptor)',
  'Vapid Interceptor (Highway Patrol High-Speed)',
  'Bravado Buffalo STX Tactical Cruiser',
  'K-9 Tactical Kennel SUV Unit',
  'SWAT Enforcer 4x4 Offroad Transport Truck',
  'Flatbed Heavy Tow Truck Impound',
  'EMS Ambulance MedEvac Standby Unit'
];
