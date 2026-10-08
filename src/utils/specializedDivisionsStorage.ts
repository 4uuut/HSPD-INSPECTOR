import { 
  AsdHelicopter, 
  K9Partner, 
  K9DeploymentLog, 
  SwatOperation, 
  IadComplaint, 
  CadetEvaluation,
  TedTrafficRecord,
  DivisionCaseFile,
  DivisionType
} from '../types';
import { pushToFirestore } from '../services/firebaseRealtimeSync';

export const ASD_KEY = 'hspd_asd_helicopters_v1';
export const K9_KEY = 'hspd_k9_partners_v1';
export const K9_LOGS_KEY = 'hspd_k9_deployment_logs_v1';
export const SWAT_KEY = 'hspd_swat_operations_v1';
export const IAD_KEY = 'hspd_iad_complaints_v1';
export const ACADEMY_KEY = 'hspd_academy_evaluations_v1';
export const TED_KEY = 'hspd_ted_records_v1';
export const DIVISION_CASE_FILES_KEY = 'hspd_division_case_files_v1';

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

export const INITIAL_DIVISION_CASE_FILES: DivisionCaseFile[] = [
  {
    id: 'case-swat-001',
    caseNumber: 'CASE-SWAT-2026-001',
    caseTitle: 'Penanganan Perampokan Bank Pusat Pacific Standard (Armed Hostage Siege)',
    division: 'SWAT',
    category: 'BANK_ROBBERY_CENTRAL',
    location: 'Pacific Standard Public Depository, Alta Street & Vinewood Blvd, Los Santos',
    incidentDate: '2026-10-06',
    incidentTime: '14:20 WIB',
    commanderName: 'David Miller',
    commanderBadge: '#045',
    commanderRank: 'COMMANDER [CDR]',
    officersCount: 8,
    participatingOfficers: [
      'David Miller (#045 - Incident Commander)',
      'Alex Mercer (#199 - SWAT Breacher Lead)',
      'Marcus Vance (#102 - SWAT Shield Operator)',
      'Tommy Ross (#142 - SWAT Operator)',
      'Elena Rostova (#088 - ASD Pilot Observer)',
      'Frank Sinatra (#210 - K-9 Handler Support)',
      'John Maverick (#301 - Perimeter Security)',
      'Damz Askara (#002 - Deputy Chief Liaison)'
    ],
    tacticalVehicles: [
      'Brute SWAT Bearcat (Armored Heavy Transport)',
      'Buckingham Police Maverick ASD (Air Support)',
      '2x Vapid Stanier Cruiser (Perimeter Barricade)',
      'EMS Ambulance Unit (MedEvac Standby)'
    ],
    suspectsCount: 4,
    suspectAffiliation: 'Sindikat Bersenjata Topeng Badut (The Clowns Heist Crew)',
    suspectStatusSummary: '3 Tersangka Dilumpuhkan Fatal saat Baku Tembak, 1 Tersangka Menyerah Hidup-Hidup (Tertembak di Bahu Kiri)',
    hostagesCount: 2,
    hostageStatus: '2 Sandera (Teller & Manajer Bank) Dievakuasi Selamat 100% Tanpa Cidera Fisik',
    policeCasualties: 'Nihil Korban Jiwa Polisi; 1 Anggota Luka Ringan Serpihan Peluru Rebound (PO II Marcus Vance, Stabil)',
    policeWeapons: [
      'Carbine Rifle Mk II (5.56x45mm NATO)',
      'Special Carbine Assault Rifle',
      'Tactical Shotgun 12-Gauge Drum',
      'Heavy Sniper Rifle (.50 BMG) Doppler Rooftop',
      'Flashbang Grenade M84 (Stun)',
      'Smoke Grenade M18 (Penutup Jalur)',
      'Taser X26P Conducted Energy Device'
    ],
    suspectWeapons: [
      'Assault Rifle AK-47 (7.62x39mm)',
      'Micro SMG Uzi (9mm Automatic)',
      'Heavy Shotgun dengan Amunisi Slug',
      'Pistol Semi-Automatic .50 Caliber',
      'Alat Las Thermite Bor C4 (Pemotong Brankas)',
      '2x Bom Pipa Rakitan (Pipe Bomb)'
    ],
    photoNegotiation: {
      url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80',
      caption: 'Tahap 1: Barikade Luar & Negosiator Berdialog di Pintu Masuk Bank',
      stageNotes: 'Pukul 14:15 WIB: Negosiator membuka dialog 10-99 via megafon. Pelaku menuntut mobil pelarian Sultan hitam diisi bensin penuh dan menolak melepas 2 sandera tanpa jaminan jalan bebas hambatan.'
    },
    photoSetupShooting: {
      url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80',
      caption: 'Tahap 2: Setup Posisi Sniper Doppler Rooftop & Barikade Baku Tembak Mobil Suspect',
      stageNotes: 'Pukul 14:38 WIB: Pelaku melempar bom pipa dan melepaskan tembakan liar ke perimeter luar saat membawa tas uang. Tim sniper atap melancarkan tembakan presisi melumpuhkan 2 penembak suspect di balik kap mobil.'
    },
    photoFinalOutcome: {
      url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
      caption: 'Tahap 3: Operasi Selesai (Code 4), 2 Sandera Aman, Pelaku Diborgol & Uang $750,000 Disita',
      stageNotes: 'Pukul 14:52 WIB: Tim breacher menyerbu pintu samping menggunakan flashbang. 1 pelaku tersisa menyerah mengangkat tangan, 2 sandera dievakuasi ke ambulans. Uang brankas $750,000 diamankan 100%.'
    },
    outcomeStatus: 'BERHASIL',
    lootRecovered: '$750,000 Uang Tunai Brankas Pacific Standard (100% Terselamatkan)',
    lootLoss: 'Nihil Kerugian Finansial Bank (Brankas Utama Tidak Jebol Total)',
    confiscatedEvidences: [
      '4 Pucuk Senjata Api Otomatis Suspect (AK-47, Uzi, Heavy Shotgun, Pistol .50)',
      '1 Unit Mesin Thermite Bor C4 Pemotong Baja',
      '3 Tas Duffle Berisi Uang Tunai $750,000',
      '1 Unit Kendaraan Declasse Sultan Hitam Pelaku'
    ],
    chronologySummary: 'Alarm silent bank berbunyi pukul 14:10. Unit SWAT & ASD tiba membentuk perimeter lingkaran tertutup dalam 3 menit. Negosiasi berlangsung 23 menit hingga pelaku memulai agresi bersenjata keluar dari pintu samping. Tim taktis merespons dengan tembakan balasan terukur, mengamankan sandera di ruang brankas, dan menyatakan status Code 4 pada pukul 14:55 WIB.',
    tacticalEvaluation: 'SOP respon perimeter cepat dan penempatan sniper di rooftop Doppler bioskop terbukti krusial menetralisir daya tembak AK-47 perampok tanpa membahayakan nyawa sandera. Rekomendasi: Pasang tambahan pembatas kawat di gang timur untuk penanganan masa depan.',
    signedByCommander: true,
    signedTimestamp: 1789045200000,
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 60 * 20
  },
  {
    id: 'case-swat-002',
    caseNumber: 'CASE-SWAT-2026-002',
    caseTitle: 'Penanganan Perampokan Bank Pedesaan Paleto Bay (Rural County Armed Siege)',
    division: 'SWAT',
    category: 'BANK_ROBBERY_RURAL',
    location: 'Blaine County Savings Bank (Bank Pedesaan Paleto), Paleto Boulevard, Paleto Bay',
    incidentDate: '2026-10-05',
    incidentTime: '11:15 WIB',
    commanderName: 'David Miller',
    commanderBadge: '#045',
    commanderRank: 'COMMANDER [CDR]',
    officersCount: 6,
    participatingOfficers: [
      'David Miller (#045 - SWAT Lead)',
      'Tommy Ross (#142 - SWAT Breacher)',
      'Frank Sinatra (#210 - K-9 Handler)',
      'Alex Mercer (#199 - SWAT Marksman)',
      'Marcus Vance (#102 - Rural Patrol Coordinator)',
      'Raymond Holt (#401 - Detective Advisor)'
    ],
    tacticalVehicles: [
      'SWAT Tactical Enforcer 4x4 Truck',
      '2x Sheriff 4x4 Alamo SUV',
      '1x K-9 Transport Unit'
    ],
    suspectsCount: 3,
    suspectAffiliation: 'Kelompok Bandit Bersenjata Senora Desert (O\'Neil Network Associates)',
    suspectStatusSummary: '1 Tersangka Dilumpuhkan Fatal di Jendela Kasir, 2 Tersangka Menyerah Tanpa Perlawanan Lanjutan',
    hostagesCount: 1,
    hostageStatus: '1 Sandera (Warga Lokal Paleto Bay) Selamat Penuh Tanpa Luka',
    policeCasualties: 'Nihil Korban Jiwa Maupun Luka dari Pihak Kepolisian',
    policeWeapons: [
      'Special Carbine Assault Rifle',
      'Pump Shotgun Mk II Non-Lethal & 00-Buck',
      'CS Tear Gas Grenade (Gas Air Mata Taktis)',
      'Battering Ram Baja Pintu Belakang',
      'Taser X26P'
    ],
    suspectWeapons: [
      'Sawn-off Double Barrel Shotgun (12-Gauge)',
      'Combat Pistol 9mm',
      '2x Molotov Cocktail Botol Kaca',
      'Pahat Besi Brankas Pedesaan'
    ],
    photoNegotiation: {
      url: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=800&auto=format&fit=crop&q=80',
      caption: 'Tahap 1: Blokade Akses Perempatan Paleto Blvd & Pengeras Suara Komando',
      stageNotes: 'Pukul 11:10 WIB: Patroli pedesaan memblokade jalan raya utama Paleto. Pelaku berteriak dari jendela lantai 1 menuntut unit mundur dan mengancam akan membakar kasir menggunakan molotov.'
    },
    photoSetupShooting: {
      url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80',
      caption: 'Tahap 2: Setup Barikade Pintu Depan & Baku Tembak Melawan Shotgun Suspect',
      stageNotes: 'Pukul 11:25 WIB: Pelaku melepaskan 2 tembakan shotgun ke arah kap mobil polisi di parkiran supermarket. Tim penembak jitu melumpuhkan tersangka bersenjata di jendela timur dengan satu tembakan presisi.'
    },
    photoFinalOutcome: {
      url: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800&auto=format&fit=crop&q=80',
      caption: 'Tahap 3: Pendobrakan Pintu Belakang dengan Gas CS, 2 Pelaku Menyerah & Sandera Dievakuasi',
      stageNotes: 'Pukul 11:38 WIB: Tim breacher melontarkan tabung gas air mata CS dan mendobrak pintu darurat belakang dengan ram baja. 2 pelaku tersisa batuk tersedak dan melempar senjata menyerah. Uang kas desa $92,000 utuh.'
    },
    outcomeStatus: 'BERHASIL',
    lootRecovered: '$92,000 Uang Kas Desa Blaine County (100% Aman Terkunci)',
    lootLoss: 'Nihil Kerugian Finansial Warga',
    confiscatedEvidences: [
      '1 Pucuk Sawn-off Shotgun & 1 Pucuk Pistol Combat 9mm',
      '2 Botol Molotov Cocktail Bahan Bakar Bensin',
      'Alat Perkakas Pahat Besi & Linggis Perusak Pintu'
    ],
    chronologySummary: 'Panggilan darurat 911 dari kasir bank desa Paleto diterima pukul 11:05. Respon cepat unit pedesaan berhasil mengepung gedung sebelum pelaku sempat menyalakan kendaraan kabur. Setelah kontak tembak singkat di jendela, gas CS diluncurkan dan 2 pelaku menyerah pada pukul 11:42 WIB.',
    tacticalEvaluation: 'Penggunaan gas air mata CS melalui jendela ventilasi sangat efektif memaksa pelaku keluar dari perlindungan brankas tanpa memicu ledakan botol molotov. Situasi terkendali secara sempurna.',
    signedByCommander: true,
    signedTimestamp: 1788958800000,
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    updatedAt: Date.now() - 1000 * 60 * 60 * 42
  },
  {
    id: 'case-asd-003',
    caseNumber: 'CASE-ASD-2026-003',
    caseTitle: 'Pengejaran Taktis Udara & Pelarian Pembobol Toko Perhiasan Vangelico (Air Tracking 10-80)',
    division: 'ASD',
    category: 'HIGH_SPEED_PURSUIT',
    location: 'Vangelico Jewelers Rockford Hills hingga Kanal Los Santos River Basin',
    incidentDate: '2026-10-04',
    incidentTime: '22:45 WIB',
    commanderName: 'Elena Rostova',
    commanderBadge: '#088',
    commanderRank: 'LIEUTENANT [LT]',
    officersCount: 5,
    participatingOfficers: [
      'Elena Rostova (#088 - Pilot In Command)',
      'Tommy Ross (#142 - Tactical Flight Officer FLIR)',
      'Alex Mercer (#199 - Ground Interceptor Unit)',
      'Frank Sinatra (#210 - Spike Strip Unit)',
      'Marcus Vance (#102 - Canal Containment)'
    ],
    tacticalVehicles: [
      'Buckingham Police Maverick FLIR 4K (AIR-ONE)',
      '2x Vapid Interceptor Highway Patrol Cruiser',
      '1x Tactical SUV Spike Strip'
    ],
    suspectsCount: 2,
    suspectAffiliation: 'Sindikat Pencuri Permata Internasional (Motorcycle Heist Duo)',
    suspectStatusSummary: '2 Tersangka Terjatuh di Kanal dan Tertangkap Basah Bersama Karung Permata',
    hostagesCount: 0,
    hostageStatus: 'Nihil Sandera dalam Kejadian',
    policeCasualties: 'Nihil Korban Jiwa Maupun Cidera',
    policeWeapons: [
      'Kamera Termal FLIR 4K (White Hot Detection)',
      'Searchlight Heli 30 Juta Candlepower',
      'Carbine Mk II (Airborne Marksman Standby)',
      'Spike Strip Stinger (Jalur Penghalang)'
    ],
    suspectWeapons: [
      'Micro SMG 9mm',
      'Pistol Glock 19',
      'Palu Godam Pemecah Kaca Anti-Peluru'
    ],
    photoNegotiation: {
      url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
      caption: 'Tahap 1: Deteksi Termal FLIR Udara Saat Pelaku Keluar dari Atap Vangelico',
      stageNotes: 'Pukul 22:40 WIB: Sensor termal AIR-ONE mengunci 2 figur manusia memanjat keluar dari ventilator atap toko perhiasan menaiki 2 unit motor balap Sanchez cross.'
    },
    photoSetupShooting: {
      url: 'https://images.unsplash.com/photo-1569420067645-5d9c34e007d4?w=800&auto=format&fit=crop&q=80',
      caption: 'Tahap 2: Panduan Taktis ASD ke Kanal Air & Setup Jebakan Spike Strip Jembatan',
      stageNotes: 'Pukul 22:52 WIB: Pilot memandu unit darat memotong jalan di mulut kanal La Puerta. Sorotan lampu searchlight membutakan pandangan pengendara motor saat mereka memacu 120 MPH.'
    },
    photoFinalOutcome: {
      url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
      caption: 'Tahap 3: Motor Tergelincir di Kanal, 2 Pelaku Dibekuk & Berlian $320,000 Diamankan Penuh',
      stageNotes: 'Pukul 23:04 WIB: Motor suspect tergelincir menabrak dinding semen kanal. Kedua pelaku menyerah seketika di bawah sorotan lampu helikopter. 14 kalung berlian dan 28 cincin emas terselamatkan.'
    },
    outcomeStatus: 'BERHASIL',
    lootRecovered: 'Permata & Perhiasan Emas Senilai $320,000 (100% Dikembalikan ke Pemilik)',
    lootLoss: 'Kerusakan 2 Etalase Kaca Toko Vangelico ($4,500)',
    confiscatedEvidences: [
      '2 Unit Motor Sanchez Offroad Pelaku',
      '1 Pucuk Micro SMG & 1 Pucuk Glock 19',
      '2 Tas Ransel Berisi 42 Butir Perhiasan Vangelico'
    ],
    chronologySummary: 'Sistem sensor gerak toko Vangelico memicu peringatan darurat. Helikopter AIR-ONE yang sedang patroli di atas Vinewood Hills langsung meluncur tiba dalam 45 detik, menjaga kontak visual konstan di kanal hingga kedua pelaku tertangkap.',
    tacticalEvaluation: 'Kemampuan pelacakan inframerah FLIR memastikan pelaku tidak bisa menyelinap di bawah gorong-gorong jembatan gelap. Koordinasi udara-ke-darat berjalan presisi.',
    signedByCommander: true,
    signedTimestamp: 1788872400000,
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
    updatedAt: Date.now() - 1000 * 60 * 60 * 68
  },
  {
    id: 'case-k9-004',
    caseNumber: 'CASE-K9-2026-004',
    caseTitle: 'Penyisiran K-9 Narkotika & Senjata Sindikat Kontainer Ocean Docks',
    division: 'K9',
    category: 'NARCOTICS_SWEEP',
    location: 'Ocean Docks Terminal, Gudang Kontainer Unit 14B, South Los Santos',
    incidentDate: '2026-10-03',
    incidentTime: '16:30 WIB',
    commanderName: 'Frank Sinatra',
    commanderBadge: '#210',
    commanderRank: 'SERGEANT [SGT]',
    officersCount: 4,
    participatingOfficers: [
      'Frank Sinatra (#210 - Senior K-9 Handler)',
      'Alex Mercer (#199 - K-9 Tactical Partner)',
      'Marcus Vance (#102 - Perimeter Guard)',
      'Tommy Ross (#142 - Evidence Officer)',
      'Anjing Satwa K-9 Zeus (Belgian Malinois)',
      'Anjing Satwa K-9 Thor (Dutch Shepherd)'
    ],
    tacticalVehicles: [
      '2x K-9 Tactical SUV Kennel Equipped',
      '1x Evidence Transport Van'
    ],
    suspectsCount: 5,
    suspectAffiliation: 'Sindikat Penyelundupan Pelabuhan Ocean Docks Cartel',
    suspectStatusSummary: '5 Tersangka Ditangkap (2 Dilumpuhkan Gigitan K-9 Non-Lethal, 3 Menyerah)',
    hostagesCount: 0,
    hostageStatus: 'Nihil Sandera',
    policeCasualties: 'Nihil Korban Jiwa; Anjing K-9 Zeus Sehat Tanpa Luka Gigitan Balik',
    policeWeapons: [
      'K-9 Bite Suit & Tactical Harness',
      'Carbine Rifle Mk II',
      'Taser X26P',
      'Flashbang Grenade'
    ],
    suspectWeapons: [
      '3x Pistol Otomatis AP Pistol',
      '1x Compact Rifle 7.62mm',
      'Pisau Belati Beracun'
    ],
    photoNegotiation: {
      url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80',
      caption: 'Tahap 1: Briefing Awal Tim K-9 di Pintu Dermaga & Penyisiran Jejak Aroma Kargo',
      stageNotes: 'Pukul 16:15 WIB: Tim K-9 menerima tip intelijen tentang kargo ikan beku berisi kokain. K-9 Zeus langsung mengendus jalur kontainer nomor seri #OD-9921.'
    },
    photoSetupShooting: {
      url: 'https://images.unsplash.com/photo-1569420067645-5d9c34e007d4?w=800&auto=format&fit=crop&q=80',
      caption: 'Tahap 2: Kontak Baku Tembak di Lorong Peti Kemas & Penetrasi Serangan Satwa K-9',
      stageNotes: 'Pukul 16:32 WIB: Tiga penjaga gudang melepaskan tembakan liar saat pintu kontainer dibuka. K-9 Zeus dilepaskan dari tali komando melompati barikade peti dan menggigit lengan penembak utama.'
    },
    photoFinalOutcome: {
      url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
      caption: 'Tahap 3: 5 Pelaku Diringkus, 45 Kg Kokain & 8 Pucuk Senjata Ilegal Diamankan',
      stageNotes: 'Pukul 16:48 WIB: Seluruh penjaga gudang meletakkan senjata. K-9 Thor menemukan kompartemen tersembunyi di bawah lantai peti berisi 45 paket bata kokain murni.'
    },
    outcomeStatus: 'BERHASIL',
    lootRecovered: '45 Kilogram Kokain Murni Sitaan ($1,350,000 Nilai Gelap Pasar) Dimusnahkan ke Brankas',
    lootLoss: 'Nihil Kerugian',
    confiscatedEvidences: [
      '45 Paket Bata Kokain Murni Kemasan Kedap Udara',
      '4 Pucuk Senjata Api Selundupan Tanpa Nomor Seri',
      '1 Mesin Penghitung Uang Kertas & Timbangan Digital'
    ],
    chronologySummary: 'Penyisiran terkoordinasi K-9 berhasil menembus pengelabuan bau menyengat dari ikan beku dan amonia. K-9 Zeus melakukan takedown cepat melumpuhkan ancaman senjata api sebelum jatuh korban.',
    tacticalEvaluation: 'Keberanian dan ketangkasan K-9 Zeus mencegah baku tembak berlarut di area pelabuhan yang padat kontainer. Direkomendasikan penghargaan medali satwa berjasa.',
    signedByCommander: true,
    signedTimestamp: 1788786000000,
    createdAt: Date.now() - 1000 * 60 * 60 * 96,
    updatedAt: Date.now() - 1000 * 60 * 60 * 90
  },
  {
    id: 'case-ted-005',
    caseNumber: 'CASE-TED-2026-005',
    caseTitle: 'Penindakan Balap Liar Massal & Penyekatan Tol Del Perro Freeway (Midnight Crackdown)',
    division: 'TED',
    category: 'TRAFFIC_CRACKDOWN',
    location: 'Del Perro Freeway Exit 4 s/d Jembatan Overpass La Puerta',
    incidentDate: '2026-10-02',
    incidentTime: '01:30 WIB',
    commanderName: 'Alex Mercer',
    commanderBadge: '#199',
    commanderRank: 'SERGEANT [SGT]',
    officersCount: 6,
    participatingOfficers: [
      'Alex Mercer (#199 - Traffic Incident Commander)',
      'Marcus Vance (#102 - Radar Radar Lead)',
      'Tommy Ross (#142 - Spike Strip Team)',
      'Frank Sinatra (#210 - Interceptor Driver)',
      'John Maverick (#301 - Impound Logistics)',
      'Raymond Holt (#401 - Legal Verification)'
    ],
    tacticalVehicles: [
      '3x Vapid Interceptor Highway Patrol High-Speed',
      '1x Heavy Tow Truck Flatbed Impound',
      '2x Traffic Utility Cruisers'
    ],
    suspectsCount: 6,
    suspectAffiliation: 'Komunitas Balap Liar Jalanan Midnight Syndicate Underground',
    suspectStatusSummary: '6 Pengemudi Ditilang & Ditahan, Nihil Tabrakan Beruntun Fatal',
    hostagesCount: 0,
    hostageStatus: 'Nihil Sandera',
    policeCasualties: 'Nihil Korban Jiwa / Nihil Kerusakan Berat Armada Polisi',
    policeWeapons: [
      'Radar Doppler Kecepatan Stalker II (Mendeteksi 145 MPH)',
      'Spike Strip Stinger Penembus Ban Otomatis',
      'Taser X26P',
      'Megafon Polisi Suara Keras'
    ],
    suspectWeapons: [
      'Tabung NOS Nitrous Oxide Berbahaya',
      '2x Tongkat Pemukul Baseball di Bagasi',
      'Alat Perusak Sinyal GPS Plat Polisi'
    ],
    photoNegotiation: {
      url: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=800&auto=format&fit=crop&q=80',
      caption: 'Tahap 1: Deteksi Radar 145 MPH & Formasi Pemblokiran Gerbang Tol',
      stageNotes: 'Pukul 01:15 WIB: Unit TED mendeteksi 6 mobil sport melaju zig-zag berbahaya di atas 140 MPH. Tiga mobil patroli membentuk pola rolling block di bawah jembatan tol.'
    },
    photoSetupShooting: {
      url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80',
      caption: 'Tahap 2: Penggelaran Spike Strip di Jalur Keluar & Penjepitan Mobil Balap',
      stageNotes: 'Pukul 01:28 WIB: Dua mobil terdepan mencoba menerobos pembatas jalan. Spike strip digelar melumpuhkan 4 ban mobil Elegy dan Jester sebelum membahayakan pengguna jalan lain.'
    },
    photoFinalOutcome: {
      url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
      caption: 'Tahap 3: 5 Mobil Disita Derek ke Impound, 6 Pengemudi Didenda Total $35,000',
      stageNotes: 'Pukul 01:45 WIB: Seluruh kendaraan ditarik ke garasi impound Sandy Shores. SIM ke-6 pengemudi dicabut sementara dan uang taruhan balap liar $45,000 diamankan.'
    },
    outcomeStatus: 'BERHASIL',
    lootRecovered: '$45,000 Uang Taruhan Ilegal Disita + $35,000 Total Denda Tilang Masuk Kas',
    lootLoss: 'Nihil Kerugian',
    confiscatedEvidences: [
      '5 Unit Mobil Sport Modifikasi Balap Liar (Elegy Retro, Jester RR, Sultan RS)',
      '6 Lembar SIM Dicabut Status REVOKED',
      'Uang Tunai Taruhan $45,000'
    ],
    chronologySummary: 'Operasi penindakan lalu lintas malam terencana berhasil membubarkan ajang taruhan balap liar tanpa satupun kecelakaan sipil. Prosedur penutupan jalan tol berjalan mulus dan tertib.',
    tacticalEvaluation: 'Taktik Rolling Block dikombinasikan dengan penyebaran spike strip terarah berhasil melumpuhkan kecepatan ekstrem mobil sport tanpa memicu tabrakan fatal.',
    signedByCommander: true,
    signedTimestamp: 1788699600000,
    createdAt: Date.now() - 1000 * 60 * 60 * 120,
    updatedAt: Date.now() - 1000 * 60 * 60 * 115
  },
  {
    id: 'case-iad-006',
    caseNumber: 'CASE-IAD-2026-006',
    caseTitle: 'Investigasi Disiplin Pelanggaran Tembakan Senpi Tanpa SOP Lapangan (Internal Investigation)',
    division: 'IAD',
    category: 'INTERNAL_INVESTIGATION',
    location: 'Ruang Sidang Komisi Etik Mabes HSPD Mission Row, Los Santos',
    incidentDate: '2026-10-01',
    incidentTime: '10:00 WIB',
    commanderName: 'Leoarnd Neave',
    commanderBadge: '#001',
    commanderRank: 'CHIEF OF POLICE [COP]',
    officersCount: 3,
    participatingOfficers: [
      'Leoarnd Neave (#001 - Chief of Police / Ketua Sidang)',
      'Damz Askara (#002 - Deputy Chief / Penuntut Etik)',
      'David Miller (#045 - Commander Saksi Ahli Taktis)'
    ],
    tacticalVehicles: [
      'Unit Dokumen Komisi Disiplin Mabes'
    ],
    suspectsCount: 1,
    suspectAffiliation: 'Personel Aktif Kepolisian Terperiksa Internal (PO I Tommy Ross)',
    suspectStatusSummary: 'Terbukti Melakukan Kelalaian Prosedur, Dikenakan Sanksi SP-2 & Skorsing',
    hostagesCount: 0,
    hostageStatus: 'Nihil Sandera',
    policeCasualties: 'Nihil Korban',
    policeWeapons: [
      'Rekaman Kamera Badan (Body-Worn Camera 1080p)',
      'Hasil Uji Balistik Forensik Uji Mesiu (GSR)',
      'BAP Pengakuan Tertulis di Bawah Sumpah Garrity'
    ],
    suspectWeapons: [
      'Pistol Dinas Glock 19 (Serial: HSPD-9942) yang Ditembakkan'
    ],
    photoNegotiation: {
      url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
      caption: 'Tahap 1: Verifikasi Rekaman Bodycam & Pengambilan Keterangan Terperiksa',
      stageNotes: 'Pukul 09:30 WIB: Majelis komisi etik memeriksa rekaman video bodycam penembakan ban mobil warga yang tidak melakukan perlawanan aktif saat proses razia.'
    },
    photoSetupShooting: {
      url: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800&auto=format&fit=crop&q=80',
      caption: 'Tahap 2: Rekonstruksi Uji Balistik Forensik & Verifikasi Jarak Tembak',
      stageNotes: 'Pukul 10:15 WIB: Ahli balistik membuktikan bahwa pelepasan proyektil terjadi tanpa adanya ancaman mematikan langsung terhadap keselamatan petugas di lokasi.'
    },
    photoFinalOutcome: {
      url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80',
      caption: 'Tahap 3: Keputusan Sidang Etik, Penerbitan SP-2 & Penarikan Senjata Sementara',
      stageNotes: 'Pukul 11:20 WIB: Chief of Police menandatangani putusan disiplin. Petugas dikenakan sanksi Surat Peringatan SP-2, wajib mengikuti pelatihan ulang di akademi, dan skorsing 7 hari kerja.'
    },
    outcomeStatus: 'BERHASIL',
    lootRecovered: 'Integritas & Kepercayaan Publik Korps HSPD Berhasil Dipulihkan',
    lootLoss: 'Ganti Rugi Ban Kendaraan Warga Dibayarkan dari Kas Operasional ($1,200)',
    confiscatedEvidences: [
      'Senjata Dinas Glock 19 ditarik ke gudang armory',
      'Kaset Rekaman Bodycam Disegel ke Arsip IAD',
      'Surat Penetapan Disiplin Bermaterai'
    ],
    chronologySummary: 'Laporan keberatan warga ditindaklanjuti secara transparan dan independen oleh Divisi Propam IAD. Melalui sidang etik resmi, putusan adil dijatuhkan untuk menegakkan standar integritas kepolisian tertinggi.',
    tacticalEvaluation: 'Penegakan disiplin tegas ini membuktikan komitmen HSPD terhadap profesionalisme dan akuntabilitas mutlak bagi seluruh jajaran personel.',
    signedByCommander: true,
    signedTimestamp: 1788613200000,
    createdAt: Date.now() - 1000 * 60 * 60 * 144,
    updatedAt: Date.now() - 1000 * 60 * 60 * 140
  }
];

export const getSavedDivisionCaseFiles = (): DivisionCaseFile[] => {
  try {
    const raw = localStorage.getItem(DIVISION_CASE_FILES_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return INITIAL_DIVISION_CASE_FILES;
};

export const saveDivisionCaseFiles = (cases: DivisionCaseFile[]) => {
  try {
    localStorage.setItem(DIVISION_CASE_FILES_KEY, JSON.stringify(cases));
    window.dispatchEvent(new Event('hspd-case-files-updated'));
    syncSpecializedDivisionsToCloud();
  } catch (e) {
    console.error('Failed to save division case files:', e);
  }
};

export const saveSingleDivisionCaseFile = (caseFile: DivisionCaseFile) => {
  try {
    const current = getSavedDivisionCaseFiles();
    const idx = current.findIndex(c => c.id === caseFile.id);
    let updated: DivisionCaseFile[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...caseFile, updatedAt: Date.now() };
    } else {
      updated = [caseFile, ...current];
    }
    saveDivisionCaseFiles(updated);
  } catch (e) {
    console.error('Failed to save single division case file:', e);
  }
};

export const deleteDivisionCaseFile = (id: string) => {
  try {
    const current = getSavedDivisionCaseFiles();
    const updated = current.filter(c => c.id !== id);
    saveDivisionCaseFiles(updated);
  } catch (e) {
    console.error('Failed to delete division case file:', e);
  }
};

/**
 * Automatically generates the next sequential Case File Number for a given division
 * Example: CASE-SWAT-2026-003, CASE-ASD-2026-004, CASE-K9-2026-005
 */
export function generateNextCaseNumber(division: DivisionType): string {
  try {
    const currentCases = getSavedDivisionCaseFiles();
    const year = new Date().getFullYear();
    const prefix = `CASE-${division}-${year}-`;
    const regex = new RegExp(`^CASE-${division}-${year}-(\\d+)`, 'i');

    let maxNum = 0;
    currentCases.forEach(c => {
      const match = c.caseNumber.match(regex);
      if (match && match[1]) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      }
    });

    const nextNum = maxNum + 1;
    const padded = String(nextNum).padStart(3, '0');
    return `${prefix}${padded}`;
  } catch (e) {
    const year = new Date().getFullYear();
    return `CASE-${division}-${year}-${String(Math.floor(Math.random() * 900) + 100)}`;
  }
}

/**
 * Synchronizes all specialized division modules into a single consolidated Cloud document.
 */
export function syncSpecializedDivisionsToCloud() {
  try {
    const bundle = {
      id: 'specialized_divisions',
      caseFiles: getSavedDivisionCaseFiles(),
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
