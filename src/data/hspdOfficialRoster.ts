import { OfficerAccount, isAtasanRank } from '../types';
import { getDischargedOfficers, isOfficerDischarged, DischargedOfficerEntry } from '../utils/dischargeStorage';

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
    division: 'Field Supervisory Division',
    pin: '30101',
    phone: '555-0301',
    registeredAt: Date.now() - 86400000 * 35,
    promotedBy: 'Executive Command Bureau'
  },
  {
    id: 'roster-carlos-gallarado-311',
    name: 'Carlos Gallarado',
    badge: '#311',
    rank: 'SERGEANT I [SGT I]',
    division: 'Patrol Supervisory Bureau',
    pin: '31101',
    phone: '555-0311',
    registeredAt: Date.now() - 86400000 * 34,
    promotedBy: 'Executive Command Bureau'
  },
  {
    id: 'roster-jon-oliver-312',
    name: 'Jon Oliver',
    badge: '#312',
    rank: 'SERGEANT I [SGT I]',
    division: 'Patrol Supervisory Bureau',
    pin: '31201',
    phone: '555-0312',
    registeredAt: Date.now() - 86400000 * 33,
    promotedBy: 'Executive Command Bureau'
  },
  {
    id: 'roster-kyloo-askara-313',
    name: 'Kyloo Askara',
    badge: '#313',
    rank: 'SERGEANT I [SGT I]',
    division: 'Patrol Supervisory Bureau',
    pin: '31301',
    phone: '555-0313',
    registeredAt: Date.now() - 86400000 * 32,
    promotedBy: 'Executive Command Bureau'
  },
  {
    id: 'roster-moji-junior-314',
    name: 'Moji Junior',
    badge: '#314',
    rank: 'SERGEANT I [SGT I]',
    division: 'Patrol Supervisory Bureau',
    pin: '31401',
    phone: '555-0314',
    registeredAt: Date.now() - 86400000 * 31,
    promotedBy: 'Executive Command Bureau'
  },
  {
    id: 'roster-udin-phystachio-315',
    name: 'Udin Phystachio',
    badge: '#315',
    rank: 'SERGEANT I [SGT I]',
    division: 'Patrol Supervisory Bureau',
    pin: '31501',
    phone: '555-0315',
    registeredAt: Date.now() - 86400000 * 30,
    promotedBy: 'Executive Command Bureau'
  },
  {
    id: 'roster-boris-layasa-316',
    name: 'Boris Layasa',
    badge: '#316',
    rank: 'SERGEANT I [SGT I]',
    division: 'Patrol Supervisory Bureau',
    pin: '31601',
    phone: '555-0316',
    registeredAt: Date.now() - 86400000 * 29,
    promotedBy: 'Executive Command Bureau'
  },
  {
    id: 'roster-gorgon-xianlao-317',
    name: 'Gorgon Xianlao',
    badge: '#317',
    rank: 'SERGEANT I [SGT I]',
    division: 'Patrol Supervisory Bureau',
    pin: '31701',
    phone: '555-0317',
    registeredAt: Date.now() - 86400000 * 28,
    promotedBy: 'Executive Command Bureau'
  },
  {
    id: 'roster-rize-izumi-318',
    name: 'Rize Izumi',
    badge: '#318',
    rank: 'SERGEANT I [SGT I]',
    division: 'Special Guest / Supervisory Liaison',
    pin: '31801',
    phone: '555-0318',
    registeredAt: Date.now() - 86400000 * 27,
    promotedBy: 'Chief of Police (Special Guest Liaison)'
  },

  // ==========================================
  // [POLICE OFFICERS // RANK 2]
  // ==========================================
  // -- POLICE OFFICER III [PO III] --
  {
    id: 'roster-thomas-olise-201',
    name: 'Thomas Olise',
    badge: '#201',
    rank: 'POLICE OFFICER III [PO III]',
    division: 'Senior Patrol Division',
    pin: '20101',
    phone: '555-0201',
    registeredAt: Date.now() - 86400000 * 25,
    promotedBy: 'Field Operations Division'
  },
  {
    id: 'roster-syns-askara-202',
    name: 'Syns Askara',
    badge: '#202',
    rank: 'POLICE OFFICER III [PO III]',
    division: 'Senior Patrol Division',
    pin: '20201',
    phone: '555-0202',
    registeredAt: Date.now() - 86400000 * 24,
    promotedBy: 'Field Operations Division'
  },
  {
    id: 'roster-jimmy-hops-203',
    name: 'Jimmy Hops',
    badge: '#203',
    rank: 'POLICE OFFICER III [PO III]',
    division: 'Senior Patrol Division',
    pin: '20301',
    phone: '555-0203',
    registeredAt: Date.now() - 86400000 * 23,
    promotedBy: 'Field Operations Division'
  },
  {
    id: 'roster-lexa-arvella-204',
    name: 'Lexa Arvella',
    badge: '#204',
    rank: 'POLICE OFFICER III [PO III]',
    division: 'Senior Patrol Division',
    pin: '20401',
    phone: '555-0204',
    registeredAt: Date.now() - 86400000 * 22,
    promotedBy: 'Field Operations Division'
  },

  // -- POLICE OFFICER II [PO II] --
  {
    id: 'roster-gondrong-carregado-211',
    name: 'Gondrong Carregado',
    badge: '#211',
    rank: 'POLICE OFFICER II [PO II]',
    division: 'Regular Patrol Division',
    pin: '21101',
    phone: '555-0211',
    registeredAt: Date.now() - 86400000 * 20,
    promotedBy: 'Field Operations Division'
  },
  {
    id: 'roster-edes-fernandes-212',
    name: 'Edes Fernandes',
    badge: '#212',
    rank: 'POLICE OFFICER II [PO II]',
    division: 'Regular Patrol Division',
    pin: '21201',
    phone: '555-0212',
    registeredAt: Date.now() - 86400000 * 20,
    promotedBy: 'Field Operations Division'
  },
  {
    id: 'roster-jalisco-michoacana-213',
    name: 'Jalisco Michoacana',
    badge: '#213',
    rank: 'POLICE OFFICER II [PO II]',
    division: 'Regular Patrol Division',
    pin: '21301',
    phone: '555-0213',
    registeredAt: Date.now() - 86400000 * 19,
    promotedBy: 'Field Operations Division'
  },
  {
    id: 'roster-cecep-alexsander-214',
    name: 'Cecep Alexsander',
    badge: '#214',
    rank: 'POLICE OFFICER II [PO II]',
    division: 'Regular Patrol Division',
    pin: '21401',
    phone: '555-0214',
    registeredAt: Date.now() - 86400000 * 19,
    promotedBy: 'Field Operations Division'
  },
  {
    id: 'roster-yukai-escobar-215',
    name: 'Yukai Escobar',
    badge: '#215',
    rank: 'POLICE OFFICER II [PO II]',
    division: 'Regular Patrol Division',
    pin: '21501',
    phone: '555-0215',
    registeredAt: Date.now() - 86400000 * 18,
    promotedBy: 'Field Operations Division'
  },
  {
    id: 'roster-shiko-alexanderz-216',
    name: 'Shiko Alexanderz',
    badge: '#216',
    rank: 'POLICE OFFICER II [PO II]',
    division: 'Regular Patrol Division',
    pin: '21601',
    phone: '555-0216',
    registeredAt: Date.now() - 86400000 * 18,
    promotedBy: 'Field Operations Division'
  },
  {
    id: 'roster-marchel-leonerd-217',
    name: 'Marchel Leonerd',
    badge: '#217',
    rank: 'POLICE OFFICER II [PO II]',
    division: 'Regular Patrol Division',
    pin: '21701',
    phone: '555-0217',
    registeredAt: Date.now() - 86400000 * 17,
    promotedBy: 'Field Operations Division'
  },
  {
    id: 'roster-theo-leviathan-218',
    name: 'Theo Leviathan',
    badge: '#218',
    rank: 'POLICE OFFICER II [PO II]',
    division: 'Regular Patrol Division',
    pin: '21801',
    phone: '555-0218',
    registeredAt: Date.now() - 86400000 * 17,
    promotedBy: 'Field Operations Division'
  },
  {
    id: 'roster-dadang-darmawan-219',
    name: 'Dadang Darmawan',
    badge: '#219',
    rank: 'POLICE OFFICER II [PO II]',
    division: 'Regular Patrol Division',
    pin: '21901',
    phone: '555-0219',
    registeredAt: Date.now() - 86400000 * 16,
    promotedBy: 'Field Operations Division'
  },
  {
    id: 'roster-michaell-anderson-220',
    name: 'Michaell Anderson',
    badge: '#220',
    rank: 'POLICE OFFICER II [PO II]',
    division: 'Regular Patrol Division',
    pin: '22001',
    phone: '555-0220',
    registeredAt: Date.now() - 86400000 * 16,
    promotedBy: 'Field Operations Division'
  },
  {
    id: 'roster-oscar-hernandez-221',
    name: 'Oscar Hernandez',
    badge: '#221',
    rank: 'POLICE OFFICER II [PO II]',
    division: 'Regular Patrol Division',
    pin: '22101',
    phone: '555-0221',
    registeredAt: Date.now() - 86400000 * 15,
    promotedBy: 'Field Operations Division'
  },
  {
    id: 'roster-kyle-satorue-222',
    name: 'Kyle Satorue',
    badge: '#222',
    rank: 'POLICE OFFICER II [PO II]',
    division: 'Regular Patrol Division',
    pin: '22201',
    phone: '555-0222',
    registeredAt: Date.now() - 86400000 * 15,
    promotedBy: 'Field Operations Division'
  },

  // -- POLICE OFFICER I [PO I] --
  {
    id: 'roster-luix-ziyen-231',
    name: 'Luix Ziyen',
    badge: '#231',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Junior Patrol Division',
    pin: '23101',
    phone: '555-0231',
    registeredAt: Date.now() - 86400000 * 14,
    promotedBy: 'Academy Training Command'
  },
  {
    id: 'roster-kenzo-velows-232',
    name: 'Kenzo Velows',
    badge: '#232',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Junior Patrol Division',
    pin: '23201',
    phone: '555-0232',
    registeredAt: Date.now() - 86400000 * 14,
    promotedBy: 'Academy Training Command'
  },
  {
    id: 'roster-rejjie-kei-233',
    name: 'Rejjie Kei',
    badge: '#233',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Junior Patrol Division',
    pin: '23301',
    phone: '555-0233',
    registeredAt: Date.now() - 86400000 * 13,
    promotedBy: 'Academy Training Command'
  },
  {
    id: 'roster-peter-schmaicel-234',
    name: 'Peter Schmaicel',
    badge: '#234',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Junior Patrol Division',
    pin: '23401',
    phone: '555-0234',
    registeredAt: Date.now() - 86400000 * 13,
    promotedBy: 'Academy Training Command'
  },
  {
    id: 'roster-zaydan-kusuma-235',
    name: 'Zaydan Kusuma',
    badge: '#235',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Junior Patrol Division',
    pin: '23501',
    phone: '555-0235',
    registeredAt: Date.now() - 86400000 * 12,
    promotedBy: 'Academy Training Command'
  },
  {
    id: 'roster-alvert-canizares-236',
    name: 'Alvert Canizares',
    badge: '#236',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Junior Patrol Division',
    pin: '23601',
    phone: '555-0236',
    registeredAt: Date.now() - 86400000 * 12,
    promotedBy: 'Academy Training Command'
  },
  {
    id: 'roster-eiser-romanov-237',
    name: 'Eiser Romanov',
    badge: '#237',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Junior Patrol Division',
    pin: '23701',
    phone: '555-0237',
    registeredAt: Date.now() - 86400000 * 11,
    promotedBy: 'Academy Training Command'
  },
  {
    id: 'roster-dendi-pablo-238',
    name: 'Dendi Pablo',
    badge: '#238',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Junior Patrol Division',
    pin: '23801',
    phone: '555-0238',
    registeredAt: Date.now() - 86400000 * 11,
    promotedBy: 'Academy Training Command'
  },
  {
    id: 'roster-eliel-gravermourn-239',
    name: 'Eliel Gravermourn',
    badge: '#239',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Junior Patrol Division',
    pin: '23901',
    phone: '555-0239',
    registeredAt: Date.now() - 86400000 * 10,
    promotedBy: 'Academy Training Command',
    warnings: [
      {
        id: 'warn-eliel-1',
        strikeNumber: 1,
        reason: 'Surat Peringatan 1 (SP 1) Pelanggaran Disiplin Tugas',
        issuedBy: 'Internal Affairs Division',
        issuedByBadge: '#001',
        issuedByRank: 'CHIEF OF POLICE [COP]',
        timestamp: Date.now() - 86400000 * 6
      },
      {
        id: 'warn-eliel-2',
        strikeNumber: 2,
        reason: 'Surat Peringatan 2 (SP 2) Pelanggaran Prosedur Patroli',
        issuedBy: 'Internal Affairs Division',
        issuedByBadge: '#002',
        issuedByRank: 'DEPUTY CHIEF [D/C]',
        timestamp: Date.now() - 86400000 * 2
      }
    ]
  },
  {
    id: 'roster-corvin-gravermourn-240',
    name: 'Corvin Gravermourn',
    badge: '#240',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Junior Patrol Division',
    pin: '24001',
    phone: '555-0240',
    registeredAt: Date.now() - 86400000 * 10,
    promotedBy: 'Academy Training Command',
    warnings: [
      {
        id: 'warn-corvin-1',
        strikeNumber: 1,
        reason: 'Surat Peringatan 1 (SP 1) Pelanggaran Disiplin Tugas',
        issuedBy: 'Internal Affairs Division',
        issuedByBadge: '#001',
        issuedByRank: 'CHIEF OF POLICE [COP]',
        timestamp: Date.now() - 86400000 * 6
      },
      {
        id: 'warn-corvin-2',
        strikeNumber: 2,
        reason: 'Surat Peringatan 2 (SP 2) Pelanggaran Prosedur Patroli',
        issuedBy: 'Internal Affairs Division',
        issuedByBadge: '#002',
        issuedByRank: 'DEPUTY CHIEF [D/C]',
        timestamp: Date.now() - 86400000 * 2
      }
    ]
  },
  {
    id: 'roster-wesley-gravemourn-241',
    name: 'Wesley Gravemourn',
    badge: '#241',
    rank: 'POLICE OFFICER I [PO I]',
    division: 'Junior Patrol Division',
    pin: '24101',
    phone: '555-0241',
    registeredAt: Date.now() - 86400000 * 10,
    promotedBy: 'Academy Training Command',
    warnings: [
      {
        id: 'warn-wesley-1',
        strikeNumber: 1,
        reason: 'Surat Peringatan 1 (SP 1) Pelanggaran Disiplin Tugas',
        issuedBy: 'Internal Affairs Division',
        issuedByBadge: '#001',
        issuedByRank: 'CHIEF OF POLICE [COP]',
        timestamp: Date.now() - 86400000 * 6
      },
      {
        id: 'warn-wesley-2',
        strikeNumber: 2,
        reason: 'Surat Peringatan 2 (SP 2) Pelanggaran Prosedur Patroli',
        issuedBy: 'Internal Affairs Division',
        issuedByBadge: '#002',
        issuedByRank: 'DEPUTY CHIEF [D/C]',
        timestamp: Date.now() - 86400000 * 2
      }
    ]
  },

  // ==========================================
  // [CADET // RANK 1]
  // ==========================================
  {
    id: 'roster-leoanrd-neave-101',
    name: 'Leoanrd Neave',
    badge: '#101',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '10101',
    phone: '555-0101',
    registeredAt: Date.now() - 86400000 * 8,
    promotedBy: 'Police Academy Staff'
  },
  {
    id: 'roster-luna-haller-102',
    name: 'Luna Haller',
    badge: '#102',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '10201',
    phone: '555-0102',
    registeredAt: Date.now() - 86400000 * 8,
    promotedBy: 'Police Academy Staff'
  },
  {
    id: 'roster-keii-claude-103',
    name: 'Keii Claude',
    badge: '#103',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '10301',
    phone: '555-0103',
    registeredAt: Date.now() - 86400000 * 7,
    promotedBy: 'Police Academy Staff'
  },
  {
    id: 'roster-zayy-choper-104',
    name: 'Zayy Choper',
    badge: '#104',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '10401',
    phone: '555-0104',
    registeredAt: Date.now() - 86400000 * 7,
    promotedBy: 'Police Academy Staff'
  },
  {
    id: 'roster-viggo-bonapattem-105',
    name: 'Viggo Bonapattem',
    badge: '#105',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '10501',
    phone: '555-0105',
    registeredAt: Date.now() - 86400000 * 6,
    promotedBy: 'Police Academy Staff'
  },
  {
    id: 'roster-stephen-oscar-106',
    name: 'Stephen Oscar',
    badge: '#106',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '10601',
    phone: '555-0106',
    registeredAt: Date.now() - 86400000 * 6,
    promotedBy: 'Police Academy Staff'
  },
  {
    id: 'roster-rafa-gharui-107',
    name: 'Rafa Gharui',
    badge: '#107',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '10701',
    phone: '555-0107',
    registeredAt: Date.now() - 86400000 * 5,
    promotedBy: 'Police Academy Staff'
  },
  {
    id: 'roster-jems-giantenk-108',
    name: 'Jems Giantenk',
    badge: '#108',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '10801',
    phone: '555-0108',
    registeredAt: Date.now() - 86400000 * 5,
    promotedBy: 'Police Academy Staff'
  },
  {
    id: 'roster-rafferty-linnix-109',
    name: 'Rafferty Linnix',
    badge: '#109',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '10901',
    phone: '555-0109',
    registeredAt: Date.now() - 86400000 * 4,
    promotedBy: 'Police Academy Staff'
  },
  {
    id: 'roster-jeesyln-claurissa-110',
    name: 'Jeesyln Claurissa',
    badge: '#110',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '11001',
    phone: '555-0110',
    registeredAt: Date.now() - 86400000 * 4,
    promotedBy: 'Police Academy Staff'
  },
  {
    id: 'roster-gerry-roach-111',
    name: 'Gerry Roach',
    badge: '#111',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '11101',
    phone: '555-0111',
    registeredAt: Date.now() - 86400000 * 3,
    promotedBy: 'Police Academy Staff'
  },
  {
    id: 'roster-morale-lammar-112',
    name: 'Morale Lammar',
    badge: '#112',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '11201',
    phone: '555-0112',
    registeredAt: Date.now() - 86400000 * 3,
    promotedBy: 'Police Academy Staff'
  },
  {
    id: 'roster-moeses-clausius-113',
    name: 'Moeses Clausius',
    badge: '#113',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '11301',
    phone: '555-0113',
    registeredAt: Date.now() - 86400000 * 3,
    promotedBy: 'Police Academy Staff'
  },
  {
    id: 'roster-jack-kingston-114',
    name: 'Jack Kingston',
    badge: '#114',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '11401',
    phone: '555-0114',
    registeredAt: Date.now() - 86400000 * 2,
    promotedBy: 'Police Academy Staff'
  },
  {
    id: 'roster-van-tamayuki-115',
    name: 'Van Tamayuki',
    badge: '#115',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '11501',
    phone: '555-0115',
    registeredAt: Date.now() - 86400000 * 2,
    promotedBy: 'Police Academy Staff'
  },
  {
    id: 'roster-bian-alexander-116',
    name: 'Bian Alexander',
    badge: '#116',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '11601',
    phone: '555-0116',
    registeredAt: Date.now() - 86400000 * 2,
    promotedBy: 'Police Academy Staff'
  },
  {
    id: 'roster-shalom-cuirras-117',
    name: 'Shalom Cuirras',
    badge: '#117',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '11701',
    phone: '555-0117',
    registeredAt: Date.now() - 86400000 * 2,
    promotedBy: 'Police Academy Staff',
    warnings: [
      {
        id: 'warn-shalom-1',
        strikeNumber: 1,
        reason: 'Surat Peringatan 1 (SP 1) Pelanggaran Kedisiplinan Akademi',
        issuedBy: 'Internal Affairs Division',
        issuedByBadge: '#001',
        issuedByRank: 'CHIEF OF POLICE [COP]',
        timestamp: Date.now() - 86400000 * 4
      },
      {
        id: 'warn-shalom-2',
        strikeNumber: 2,
        reason: 'Surat Peringatan 2 (SP 2) Pelanggaran Peraturan Barak Akademi',
        issuedBy: 'Internal Affairs Division',
        issuedByBadge: '#002',
        issuedByRank: 'DEPUTY CHIEF [D/C]',
        timestamp: Date.now() - 86400000 * 1
      }
    ]
  },
  {
    id: 'roster-briella-bimantara-118',
    name: 'Briella Bimantara',
    badge: '#118',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '11801',
    phone: '555-0118',
    registeredAt: Date.now() - 86400000 * 1,
    promotedBy: 'Police Academy Staff'
  },
  {
    id: 'roster-omar-bradley-119',
    name: 'Omar Bradley',
    badge: '#119',
    rank: 'CADET POLICE',
    division: 'Police Academy / Field Cadet',
    pin: '11901',
    phone: '555-0119',
    registeredAt: Date.now() - 86400000 * 1,
    promotedBy: 'Police Academy Staff'
  }
];

/**
 * Merges any incoming roster array (from localStorage or Firestore realtime)
 * with the official 56+ department officers so no official roster member is ever lost,
 * and user changes (especially PIN updates and promotions) are completely preserved.
 */
export function mergeWithOfficialRoster(
  incoming: OfficerAccount[] = [],
  dischargedOverride?: DischargedOfficerEntry[]
): OfficerAccount[] {
  // Read list of discharged/pecat officers so they are never resurrected
  const dischargedList = dischargedOverride || getDischargedOfficers();

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

  // 1. Seed with official officers ONLY IF THEY ARE NOT DISCHARGED
  HSPD_OFFICIAL_ROSTER.forEach(official => {
    if (isOfficerDischarged(official, dischargedList)) {
      return; // Do NOT seed discharged officer
    }
    const key = getCanonicalKey(official);
    officersMap.set(key, { ...official });
  });

  // 2. Helper to find existing officer by ID, Badge, or Name
  const findExistingKey = (item: OfficerAccount): string | null => {
    const cleanId = item.id ? item.id.toLowerCase().trim() : '';
    const cleanBadge = (item.badge || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
    const cleanName = (item.name || '').toLowerCase().trim();

    const normalizeName = (n: string) => {
      return n.toLowerCase()
        .replace(/\(.*?\)/g, '') // remove parenthesized remarks like (WARN 2), (Special Guest)
        .replace(/[^a-z0-9]/g, '')
        .trim();
    };
    const normCleanName = normalizeName(cleanName);

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
      if (normCleanName && normCleanName === normalizeName(existingName)) {
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

  // 3. Overlay incoming records (filtering out any discharged officer)
  if (Array.isArray(incoming)) {
    incoming.forEach(item => {
      if (!item || isOfficerDischarged(item, dischargedList)) return;
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
          // CRITICAL: Discord Tag & Target User ID strictly preserved
          discordTag: (item.discordTag !== undefined && item.discordTag !== null && String(item.discordTag).trim() !== '') 
            ? String(item.discordTag).trim() 
            : existing.discordTag,
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
          discordTag: item.discordTag ? String(item.discordTag).trim() : undefined,
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

