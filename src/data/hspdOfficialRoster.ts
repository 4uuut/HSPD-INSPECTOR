import { OfficerAccount } from '../types';

export const HSPD_OFFICIAL_ROSTER: OfficerAccount[] = [
  // ==========================================
  // [COMMAND STAFF // RANK 6]
  // ==========================================
  {
    id: 'roster-jackie-xianlao-001',
    name: 'Jackie Xianlao',
    badge: '#001',
    rank: 'CHIEF OF POLICE [COP]',
    division: 'Executive Office / High Command',
    pin: '846201',
    phone: '555-0001',
    registeredAt: Date.now() - 86400000 * 90,
    promotedBy: 'SK Pengangkatan Markas Besar Kepolisian High State'
  },

  // ==========================================
  // [EXECUTIVE STAFF // RANK 5]
  // ==========================================
  {
    id: 'roster-damz-askara-002',
    name: 'Damz Askara',
    badge: '#002',
    rank: 'DEPUTY CHIEF [D/C]',
    division: 'High Command Staff / Executive Office',
    pin: '201982',
    phone: '555-0002',
    registeredAt: Date.now() - 86400000 * 75,
    promotedBy: 'SK Kepolisian HighState / Chief of Police'
  },
  {
    id: 'roster-wilona-costelo-003',
    name: 'Wilona Costelo',
    badge: '#003',
    rank: 'DEPUTY CHIEF [D/C]',
    division: 'High Command Staff / Executive Office',
    pin: '203841',
    phone: '555-0003',
    registeredAt: Date.now() - 86400000 * 70,
    promotedBy: 'SK Kepolisian HighState / Chief of Police'
  },

  // ==========================================
  // [FIELD COMMAND // RANK 4]
  // ==========================================
  {
    id: 'roster-matteo-stratton-401',
    name: 'Matteo Stratton',
    badge: '#401',
    rank: 'CAPTAIN [CPT]',
    division: 'Field Command Bureau',
    pin: '40101',
    phone: '555-0401',
    registeredAt: Date.now() - 86400000 * 50,
    promotedBy: 'High Command Executive Staff'
  },
  {
    id: 'roster-drego-tadashima-402',
    name: 'Drego Tadashima',
    badge: '#402',
    rank: 'CAPTAIN [CPT]',
    division: 'Field Command Bureau',
    pin: '40202',
    phone: '555-0402',
    registeredAt: Date.now() - 86400000 * 48,
    promotedBy: 'High Command Executive Staff'
  },
  {
    id: 'roster-ezio-silliwangi-403',
    name: 'Ezio Silliwangi',
    badge: '#403',
    rank: 'CAPTAIN [CPT]',
    division: 'Field Command Bureau',
    pin: '40303',
    phone: '555-0403',
    registeredAt: Date.now() - 86400000 * 45,
    promotedBy: 'High Command Executive Staff'
  },
  {
    id: 'roster-deren-askara-411',
    name: 'Deren Askara',
    badge: '#411',
    rank: 'LIEUTENANT II [LT II]',
    division: 'Field Training & Operations',
    pin: '41101',
    phone: '555-0411',
    registeredAt: Date.now() - 86400000 * 40,
    promotedBy: 'High Command Executive Staff'
  },
  {
    id: 'roster-grakiel-romanov-421',
    name: 'Grakiel Romanov',
    badge: '#421',
    rank: 'LIEUTENANT I [LT I]',
    division: 'Patrol Operations Bureau',
    pin: '42101',
    phone: '555-0421',
    registeredAt: Date.now() - 86400000 * 38,
    promotedBy: 'High Command Executive Staff'
  },

  // ==========================================
  // [SUPERVISORS // RANK 3]
  // ==========================================
  {
    id: 'roster-ramsey-beningthon-301',
    name: 'Ramsey beningthon',
    badge: '#301',
    rank: 'SERGEANT II [SGT II]',
    division: 'Patrol Supervisory',
    pin: '30101',
    phone: '555-0301',
    registeredAt: Date.now() - 86400000 * 35,
    promotedBy: 'Field Command Supervisory Board'
  },
  {
    id: 'roster-carlos-gallarado-311',
    name: 'Carlos Gallarado',
    badge: '#311',
    rank: 'SERGEANT I [SGT I]',
    division: 'Field Supervisory',
    pin: '31101',
    phone: '555-0311',
    registeredAt: Date.now() - 86400000 * 30,
    promotedBy: 'Field Command Supervisory Board'
  },
  {
    id: 'roster-jon-oliver-312',
    name: 'Jon Oliver',
    badge: '#312',
    rank: 'SERGEANT I [SGT I]',
    division: 'Field Supervisory',
    pin: '31202',
    phone: '555-0312',
    registeredAt: Date.now() - 86400000 * 28,
    promotedBy: 'Field Command Supervisory Board'
  },
  {
    id: 'roster-kyloo-askara-313',
    name: 'Kyloo Askara',
    badge: '#313',
    rank: 'SERGEANT I [SGT I]',
    division: 'Field Supervisory',
    pin: '31303',
    phone: '555-0313',
    registeredAt: Date.now() - 86400000 * 26,
    promotedBy: 'Field Command Supervisory Board'
  },
  {
    id: 'roster-moji-junior-314',
    name: 'Moji Junior',
    badge: '#314',
    rank: 'SERGEANT I [SGT I]',
    division: 'Field Supervisory',
    pin: '31404',
    phone: '555-0314',
    registeredAt: Date.now() - 86400000 * 25,
    promotedBy: 'Field Command Supervisory Board'
  },
  {
    id: 'roster-rize-izumi-315',
    name: 'Rize Izumi (Special Guest)',
    badge: '#315',
    rank: 'SERGEANT I [SGT I]',
    division: 'Special Assignment / Guest Supervisor',
    pin: '31505',
    phone: '555-0315',
    registeredAt: Date.now() - 86400000 * 24,
    promotedBy: 'Penugasan Khusus High Command'
  },

  // ==========================================
  // [POLICE OFFICERS // RANK 2]
  // ==========================================
  {
    id: 'roster-udin-phystachio-201',
    name: 'Udin Phystachio',
    badge: '#201',
    rank: 'POLICE OFFICER II [PO II]',
    division: 'Patrol Division',
    pin: '20111',
    phone: '555-0201',
    registeredAt: Date.now() - 86400000 * 20,
    promotedBy: 'Selesai Masa Probation PO I'
  },

  // POLICE OFFICER I [PO I]
  {
    id: 'roster-luix-ziyen-101',
    name: 'Luix Ziyen',
    badge: '#101',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '10101',
    phone: '555-0101',
    registeredAt: Date.now() - 86400000 * 18,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-kenzo-velows-102',
    name: 'Kenzo Velows',
    badge: '#102',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '10202',
    phone: '555-0102',
    registeredAt: Date.now() - 86400000 * 18,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-cecep-alexsander-103',
    name: 'Cecep Alexsander',
    badge: '#103',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '10303',
    phone: '555-0103',
    registeredAt: Date.now() - 86400000 * 17,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-yukai-escobar-104',
    name: 'Yukai Escobar',
    badge: '#104',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '10404',
    phone: '555-0104',
    registeredAt: Date.now() - 86400000 * 17,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-shiko-alexanderz-105',
    name: 'Shiko Alexanderz',
    badge: '#105',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '10505',
    phone: '555-0105',
    registeredAt: Date.now() - 86400000 * 16,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-lexa-arvella-106',
    name: 'Lexa Arvella',
    badge: '#106',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '10606',
    phone: '555-0106',
    registeredAt: Date.now() - 86400000 * 16,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-gondrong-carregado-107',
    name: 'Gondrong Carregado',
    badge: '#107',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '10707',
    phone: '555-0107',
    registeredAt: Date.now() - 86400000 * 15,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-gorgon-xianlao-108',
    name: 'Gorgon Xianlao',
    badge: '#108',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '10808',
    phone: '555-0108',
    registeredAt: Date.now() - 86400000 * 15,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-edes-fernandes-109',
    name: 'Edes Fernandes',
    badge: '#109',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '10909',
    phone: '555-0109',
    registeredAt: Date.now() - 86400000 * 14,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-thomas-olise-110',
    name: 'Thomas Olise',
    badge: '#110',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '11010',
    phone: '555-0110',
    registeredAt: Date.now() - 86400000 * 14,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-marchel-leonerd-111',
    name: 'Marchel Leonerd',
    badge: '#111',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '11111',
    phone: '555-0111',
    registeredAt: Date.now() - 86400000 * 13,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-rejjie-kei-112',
    name: 'Rejjie Kei',
    badge: '#112',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '11212',
    phone: '555-0112',
    registeredAt: Date.now() - 86400000 * 13,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-theo-leviathan-113',
    name: 'Theo Leviathan',
    badge: '#113',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '11313',
    phone: '555-0113',
    registeredAt: Date.now() - 86400000 * 12,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-peter-schmaicel-114',
    name: 'Peter Schmaicel',
    badge: '#114',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '11414',
    phone: '555-0114',
    registeredAt: Date.now() - 86400000 * 12,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-syns-askara-115',
    name: 'Syns Askara',
    badge: '#115',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '11515',
    phone: '555-0115',
    registeredAt: Date.now() - 86400000 * 11,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-dadang-darmawan-116',
    name: 'Dadang Darmawan',
    badge: '#116',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '11616',
    phone: '555-0116',
    registeredAt: Date.now() - 86400000 * 11,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-jalisco-michoacana-117',
    name: 'Jalisco Michoacana',
    badge: '#117',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '11717',
    phone: '555-0117',
    registeredAt: Date.now() - 86400000 * 10,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-jimmy-hops-118',
    name: 'Jimmy Hops',
    badge: '#118',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '11818',
    phone: '555-0118',
    registeredAt: Date.now() - 86400000 * 10,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-michaell-anderson-119',
    name: 'Michaell Anderson',
    badge: '#119',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '11919',
    phone: '555-0119',
    registeredAt: Date.now() - 86400000 * 9,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-oscar-hernandez-120',
    name: 'Oscar Hernandez',
    badge: '#120',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '12020',
    phone: '555-0120',
    registeredAt: Date.now() - 86400000 * 9,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-boris-layasa-121',
    name: 'Boris Layasa',
    badge: '#121',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '12121',
    phone: '555-0121',
    registeredAt: Date.now() - 86400000 * 8,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-zaydan-kusuma-122',
    name: 'Zaydan Kusuma',
    badge: '#122',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '12222',
    phone: '555-0122',
    registeredAt: Date.now() - 86400000 * 8,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-alvert-canizares-123',
    name: 'Alvert Canizares',
    badge: '#123',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '12323',
    phone: '555-0123',
    registeredAt: Date.now() - 86400000 * 7,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-kyle-satorue-124',
    name: 'Kyle Satorue',
    badge: '#124',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '12424',
    phone: '555-0124',
    registeredAt: Date.now() - 86400000 * 7,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-eiser-romanov-125',
    name: 'Eiser Romanov',
    badge: '#125',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '12525',
    phone: '555-0125',
    registeredAt: Date.now() - 86400000 * 6,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-dendi-pablo-126',
    name: 'Dendi Pablo',
    badge: '#126',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '12626',
    phone: '555-0126',
    registeredAt: Date.now() - 86400000 * 6,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-eliel-gravermourn-127',
    name: 'Eliel Gravermourn',
    badge: '#127',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '12727',
    phone: '555-0127',
    registeredAt: Date.now() - 86400000 * 5,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-corvin-gravermourn-128',
    name: 'Corvin Gravermourn',
    badge: '#128',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '12828',
    phone: '555-0128',
    registeredAt: Date.now() - 86400000 * 5,
    promotedBy: 'Lulus Akademi Kepolisian'
  },
  {
    id: 'roster-wesley-gravemourn-129',
    name: 'Wesley Gravemourn',
    badge: '#129',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Patrol Division',
    pin: '12929',
    phone: '555-0129',
    registeredAt: Date.now() - 86400000 * 4,
    promotedBy: 'Lulus Akademi Kepolisian'
  },

  // ==========================================
  // [RECRUITS // RANK 1] - CADET POLICE
  // ==========================================
  {
    id: 'roster-leoanrd-neave-011',
    name: 'Leonard Neave',
    badge: '#011',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '70101',
    phone: '555-0011',
    registeredAt: Date.now() - 86400000 * 3,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  },
  {
    id: 'roster-luna-haller-012',
    name: 'Luna Haller',
    badge: '#012',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '70202',
    phone: '555-0012',
    registeredAt: Date.now() - 86400000 * 3,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  },
  {
    id: 'roster-keii-claude-013',
    name: 'Keii Claude',
    badge: '#013',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '70303',
    phone: '555-0013',
    registeredAt: Date.now() - 86400000 * 3,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  },
  {
    id: 'roster-zayy-choper-014',
    name: 'Zayy Choper',
    badge: '#014',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '70404',
    phone: '555-0014',
    registeredAt: Date.now() - 86400000 * 3,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  },
  {
    id: 'roster-viggo-bonapattem-015',
    name: 'Viggo Bonapattem',
    badge: '#015',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '70505',
    phone: '555-0015',
    registeredAt: Date.now() - 86400000 * 2,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  },
  {
    id: 'roster-stephen-oscar-016',
    name: 'Stephen Oscar',
    badge: '#016',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '70606',
    phone: '555-0016',
    registeredAt: Date.now() - 86400000 * 2,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  },
  {
    id: 'roster-rafa-gharui-017',
    name: 'Rafa Gharui',
    badge: '#017',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '70707',
    phone: '555-0017',
    registeredAt: Date.now() - 86400000 * 2,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  },
  {
    id: 'roster-jems-giantenk-018',
    name: 'Jems Giantenk',
    badge: '#018',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '70808',
    phone: '555-0018',
    registeredAt: Date.now() - 86400000 * 2,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  },
  {
    id: 'roster-rafferty-linnix-019',
    name: 'Rafferty Linnix',
    badge: '#019',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '70909',
    phone: '555-0019',
    registeredAt: Date.now() - 86400000 * 2,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  },
  {
    id: 'roster-jeesyln-claurissa-020',
    name: 'Jeesyln Claurissa',
    badge: '#020',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '71010',
    phone: '555-0020',
    registeredAt: Date.now() - 86400000 * 1,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  },
  {
    id: 'roster-gerry-roach-021',
    name: 'Gerry Roach',
    badge: '#021',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '71111',
    phone: '555-0021',
    registeredAt: Date.now() - 86400000 * 1,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  },
  {
    id: 'roster-morale-lammar-022',
    name: 'Morale Lammar',
    badge: '#022',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '71212',
    phone: '555-0022',
    registeredAt: Date.now() - 86400000 * 1,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  },
  {
    id: 'roster-moeses-clausius-023',
    name: 'Moeses Clausius',
    badge: '#023',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '71313',
    phone: '555-0023',
    registeredAt: Date.now() - 86400000 * 1,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  },
  {
    id: 'roster-jack-kingston-024',
    name: 'Jack Kingston',
    badge: '#024',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '71414',
    phone: '555-0024',
    registeredAt: Date.now() - 86400000 * 1,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  },
  {
    id: 'roster-van-tamayuki-025',
    name: 'Van Tamayuki',
    badge: '#025',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '71515',
    phone: '555-0025',
    registeredAt: Date.now() - 86400000 * 1,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  },
  {
    id: 'roster-bian-alexander-026',
    name: 'Bian Alexander',
    badge: '#026',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '71616',
    phone: '555-0026',
    registeredAt: Date.now() - 86400000 * 1,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  },
  {
    id: 'roster-shalom-cuirras-027',
    name: 'Shalom Cuirras',
    badge: '#027',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '71717',
    phone: '555-0027',
    registeredAt: Date.now() - 86400000 * 1,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  },
  {
    id: 'roster-briella-bimantara-028',
    name: 'Briella Bimantara',
    badge: '#028',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '71818',
    phone: '555-0028',
    registeredAt: Date.now() - 86400000 * 1,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  },
  {
    id: 'roster-omar-bradley-029',
    name: 'Omar Bradley',
    badge: '#029',
    rank: 'CADET POLICE',
    division: 'Police Academy Division',
    pin: '71919',
    phone: '555-0029',
    registeredAt: Date.now() - 86400000 * 1,
    promotedBy: 'Perekrutan Angkatan Baru Akademi HSPD'
  }
];

/**
 * Merges any incoming roster array (from localStorage or Firestore realtime)
 * with the official 56+ department officers so no official roster member is ever lost,
 * and user changes (especially PIN updates and promotions) are completely preserved.
 */
export function mergeWithOfficialRoster(incoming: OfficerAccount[] = []): OfficerAccount[] {
  // Canonical registry map: canonicalKey -> OfficerAccount
  const officersMap = new Map<string, OfficerAccount>();

  const getCanonicalKey = (officer: Partial<OfficerAccount>): string => {
    if (officer.id) return officer.id.toLowerCase().trim();
    if (officer.badge) {
      const cleanDigits = officer.badge.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
      if (cleanDigits) return `badge_${cleanDigits}`;
    }
    if (officer.name) return `name_${officer.name.toLowerCase().trim().replace(/\s+/g, '_')}`;
    return `item_${Math.random()}`;
  };

  // 1. Seed with all official officers
  HSPD_OFFICIAL_ROSTER.forEach(official => {
    const key = getCanonicalKey(official);
    officersMap.set(key, { ...official });
  });

  // 2. Helper to find existing officer by ID, Badge, or Name
  const findExistingKey = (item: OfficerAccount): string | null => {
    const cleanId = item.id ? item.id.toLowerCase().trim() : '';
    const cleanBadge = (item.badge || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
    const cleanName = (item.name || '').toLowerCase().trim();

    for (const [key, existing] of officersMap.entries()) {
      if (cleanId && existing.id && existing.id.toLowerCase().trim() === cleanId) {
        return key;
      }
      const existingBadgeDigits = (existing.badge || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
      if (cleanBadge && existingBadgeDigits && cleanBadge === existingBadgeDigits) {
        return key;
      }
      const existingName = (existing.name || '').toLowerCase().trim();
      if (cleanName && (cleanName === existingName || cleanName.replace(/\s+/g, '') === existingName.replace(/\s+/g, ''))) {
        return key;
      }
      // Also handle common aliases/typos (e.g. Leoanrd / Leoarnd / Leonard)
      if (cleanName && (
        (cleanName.includes('neave') && existingName.includes('neave')) ||
        (cleanName.includes('leonard') && existingName.includes('neave')) ||
        (cleanName.includes('leoanrd') && existingName.includes('neave')) ||
        (cleanName.includes('leoarnd') && existingName.includes('neave'))
      )) {
        return key;
      }
    }
    return null;
  };

  // 3. Overlay incoming records
  if (Array.isArray(incoming)) {
    incoming.forEach(item => {
      if (!item) return;
      const existingKey = findExistingKey(item);

      if (existingKey && officersMap.has(existingKey)) {
        const existing = officersMap.get(existingKey)!;
        const updated: OfficerAccount = {
          ...existing,
          ...item,
          name: item.name || existing.name,
          badge: existing.badge || item.badge, // preserve official badge format
          rank: item.rank || existing.rank,
          division: item.division || existing.division,
          // CRITICAL: user's PIN modification is strictly preserved
          pin: (item.pin !== undefined && String(item.pin).trim() !== '') ? String(item.pin).trim() : existing.pin,
          phone: item.phone || existing.phone,
          promotedBy: item.promotedBy || existing.promotedBy,
          warnings: Array.isArray(item.warnings) && item.warnings.length > 0 ? item.warnings : (existing.warnings || []),
          _updatedAt: item._updatedAt || Date.now()
        };
        officersMap.set(existingKey, updated);
      } else {
        // New custom officer registered dynamically in app
        const newKey = getCanonicalKey(item);
        officersMap.set(newKey, {
          ...item,
          pin: item.pin ? String(item.pin).trim() : '10-4',
          warnings: item.warnings || []
        });
      }
    });
  }

  // 4. Return unique set of officers in deterministic order
  const uniqueOfficers = Array.from(officersMap.values());
  
  // Keep official ordering at top, followed by any custom officers
  const officialBadgeOrder = new Map<string, number>();
  HSPD_OFFICIAL_ROSTER.forEach((off, idx) => {
    const cleanDigits = off.badge.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
    officialBadgeOrder.set(cleanDigits, idx);
  });

  return uniqueOfficers.sort((a, b) => {
    const digitsA = (a.badge || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
    const digitsB = (b.badge || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
    const idxA = officialBadgeOrder.has(digitsA) ? officialBadgeOrder.get(digitsA)! : 9999;
    const idxB = officialBadgeOrder.has(digitsB) ? officialBadgeOrder.get(digitsB)! : 9999;
    if (idxA !== idxB) return idxA - idxB;
    return (b.registeredAt || 0) - (a.registeredAt || 0);
  });
}

