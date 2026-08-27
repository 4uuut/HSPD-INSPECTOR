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
    name: 'Leoanrd Neave',
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
 * with the official 56+ department officers so no official roster member is ever lost.
 */
export function mergeWithOfficialRoster(incoming: OfficerAccount[] = []): OfficerAccount[] {
  const map = new Map<string, OfficerAccount>();

  // 1. First seed with all official officers
  HSPD_OFFICIAL_ROSTER.forEach(official => {
    map.set(official.badge.toLowerCase().trim(), { ...official });
    map.set(official.name.toLowerCase().trim(), { ...official });
  });

  // 2. Overlay incoming records (preserving customized PINs, ranks, warnings, duty times)
  incoming.forEach(item => {
    if (!item) return;
    const badgeKey = item.badge ? item.badge.toLowerCase().trim() : '';
    const nameKey = item.name ? item.name.toLowerCase().trim() : '';

    const existing = map.get(badgeKey) || map.get(nameKey);
    if (existing) {
      // Merge with precedence given to newer modifications if available
      const updated: OfficerAccount = {
        ...existing,
        ...item,
        // Ensure critical fields are never undefined or blank
        name: item.name || existing.name,
        badge: item.badge || existing.badge,
        rank: item.rank || existing.rank,
        division: item.division || existing.division,
        pin: item.pin || existing.pin,
        phone: item.phone || existing.phone,
        warnings: item.warnings && item.warnings.length > 0 ? item.warnings : (existing.warnings || []),
      };
      map.set(badgeKey, updated);
      map.set(nameKey, updated);
    } else {
      // New custom officer registered dynamically in app
      if (badgeKey) map.set(badgeKey, item);
      else if (nameKey) map.set(nameKey, item);
    }
  });

  // 3. Return unique set of officers in deterministic order
  const uniqueOfficers = Array.from(new Set(map.values()));
  
  // Keep official ordering at top, followed by any custom officers
  const officialBadgeOrder = new Map<string, number>();
  HSPD_OFFICIAL_ROSTER.forEach((off, idx) => {
    officialBadgeOrder.set(off.badge.toLowerCase().trim(), idx);
  });

  return uniqueOfficers.sort((a, b) => {
    const idxA = officialBadgeOrder.has(a.badge.toLowerCase().trim()) 
      ? officialBadgeOrder.get(a.badge.toLowerCase().trim())! 
      : 9999;
    const idxB = officialBadgeOrder.has(b.badge.toLowerCase().trim()) 
      ? officialBadgeOrder.get(b.badge.toLowerCase().trim())! 
      : 9999;
    if (idxA !== idxB) return idxA - idxB;
    return (b.registeredAt || 0) - (a.registeredAt || 0);
  });
}

