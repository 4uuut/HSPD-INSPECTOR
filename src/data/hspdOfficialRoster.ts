import { OfficerAccount, isAtasanRank } from '../types';
import {
  getDischargedOfficers,
  isOfficerDischarged,
  getPermanentlyPurgedOfficers,
  isOfficerPermanentlyPurged,
  DischargedOfficerEntry
} from '../utils/dischargeStorage';
import { applyCustomPinOverrides } from '../utils/officerPinRegistry';

export const HSPD_OFFICIAL_ROSTER: OfficerAccount[] = [
  {
    "id": "roster-jackie-xianlao-001",
    "name": "Jackie Xianlao",
    "badge": "#001",
    "rank": "CHIEF OF POLICE [COP]",
    "division": "Executive Office / High Command",
    "pin": "846201",
    "phone": "555-0001",
    "registeredAt": 1783079932799,
    "promotedBy": "SK Pengangkatan Markas Besar Kepolisian High State"
  },
  {
    "id": "roster-damz-askara-002",
    "name": "Damz Askara",
    "badge": "#002",
    "rank": "DEPUTY CHIEF [D/C]",
    "division": "High Command Staff / Executive Office",
    "pin": "201982",
    "phone": "555-0002",
    "registeredAt": 1784375932799,
    "promotedBy": "SK Kepolisian HighState / Chief of Police"
  },
  {
    "id": "roster-wilona-costelo-003",
    "name": "Wilona Costelo",
    "badge": "#003",
    "rank": "DEPUTY CHIEF [D/C]",
    "division": "High Command Staff / Executive Office",
    "pin": "203841",
    "phone": "555-0003",
    "registeredAt": 1784807932799,
    "promotedBy": "SK Kepolisian HighState / Chief of Police"
  },
  {
    "id": "roster-matteo-stratton-401",
    "name": "Matteo Stratton",
    "badge": "#401",
    "rank": "CAPTAIN [CPT]",
    "division": "Field Command Bureau",
    "pin": "40101",
    "phone": "555-0401",
    "registeredAt": 1786535932799,
    "promotedBy": "High Command Executive Staff"
  },
  {
    "id": "roster-drego-tadashima-402",
    "name": "Drego Tadashima",
    "badge": "#402",
    "rank": "CAPTAIN [CPT]",
    "division": "Field Command Bureau",
    "pin": "40202",
    "phone": "555-0402",
    "registeredAt": 1786708732799,
    "promotedBy": "High Command Executive Staff"
  },
  {
    "id": "roster-ezio-silliwangi-403",
    "name": "Ezio Silliwangi",
    "badge": "#403",
    "rank": "CAPTAIN [CPT]",
    "division": "Field Command Bureau",
    "pin": "40303",
    "phone": "555-0403",
    "registeredAt": 1786967932799,
    "promotedBy": "High Command Executive Staff"
  },
  {
    "id": "roster-deren-askara-411",
    "name": "Deren Askara",
    "badge": "#411",
    "rank": "LIEUTENANT II [LT II]",
    "division": "Field Training & Operations",
    "pin": "41101",
    "phone": "555-0411",
    "registeredAt": 1787399932799,
    "promotedBy": "High Command Executive Staff"
  },
  {
    "id": "roster-grakiel-romanov-421",
    "name": "Grakiel Romanov",
    "badge": "#421",
    "rank": "LIEUTENANT I [LT I]",
    "division": "Patrol Operations Bureau",
    "pin": "42101",
    "phone": "555-0421",
    "registeredAt": 1787572732799,
    "promotedBy": "High Command Executive Staff"
  },
  {
    "id": "roster-ramsey-beningthon-301",
    "name": "Ramsey beningthon",
    "badge": "#301",
    "rank": "SERGEANT II [SGT II]",
    "division": "Patrol Division / Supervisor",
    "pin": "30101",
    "phone": "555-0301",
    "registeredAt": 1787831932799,
    "promotedBy": "Field Command Staff"
  },
  {
    "id": "roster-udin-phystachio-302",
    "name": "Udin Phystachio",
    "badge": "#302",
    "rank": "SERGEANT II [SGT II]",
    "division": "Patrol Division / Supervisor",
    "pin": "30202",
    "phone": "555-0302",
    "registeredAt": 1787918332799,
    "promotedBy": "Field Command Staff"
  },
  {
    "id": "roster-carlos-gallarado-311",
    "name": "Carlos Gallarado",
    "badge": "#311",
    "rank": "SERGEANT I [SGT I]",
    "division": "Patrol Division / Supervisor",
    "pin": "31101",
    "phone": "555-0311",
    "registeredAt": 1788091132799,
    "promotedBy": "Field Command Staff"
  },
  {
    "id": "roster-jon-oliver-312",
    "name": "Jon Oliver",
    "badge": "#312",
    "rank": "SERGEANT I [SGT I]",
    "division": "Traffic Enforcement / Supervisor",
    "pin": "31202",
    "phone": "555-0312",
    "registeredAt": 1788177532799,
    "promotedBy": "Field Command Staff"
  },
  {
    "id": "roster-kyloo-askara-313",
    "name": "Kyloo Askara",
    "badge": "#313",
    "rank": "SERGEANT I [SGT I]",
    "division": "Patrol Division / Supervisor",
    "pin": "31303",
    "phone": "555-0313",
    "registeredAt": 1788263932799,
    "promotedBy": "Field Command Staff",
    "warnings": [
      {
        "id": "warn-kyloo-1",
        "strikeNumber": 1,
        "reason": "Peringatan Kedisiplinan Tingkat I (SP-1)",
        "issuedBy": "Internal Affairs / High Command",
        "timestamp": 1789646332799
      },
      {
        "id": "warn-kyloo-2",
        "strikeNumber": 2,
        "reason": "Peringatan Kedisiplinan Tingkat II (SP-2)",
        "issuedBy": "Internal Affairs / High Command",
        "timestamp": 1790251132799
      }
    ]
  },
  {
    "id": "roster-moji-junior-314",
    "name": "Moji Junior",
    "badge": "#314",
    "rank": "SERGEANT I [SGT I]",
    "division": "Patrol Division / Supervisor",
    "pin": "31404",
    "phone": "555-0314",
    "registeredAt": 1788350332799,
    "promotedBy": "Field Command Staff",
    "warnings": [
      {
        "id": "warn-moji-1",
        "strikeNumber": 1,
        "reason": "Peringatan Kedisiplinan Tingkat I (SP-1)",
        "issuedBy": "Internal Affairs / High Command",
        "timestamp": 1789819132799
      },
      {
        "id": "warn-moji-2",
        "strikeNumber": 2,
        "reason": "Peringatan Kedisiplinan Tingkat II (SP-2)",
        "issuedBy": "Internal Affairs / High Command",
        "timestamp": 1790423932799
      }
    ]
  },
  {
    "id": "roster-boris-layasa-315",
    "name": "Boris Layasa",
    "badge": "#315",
    "rank": "SERGEANT I [SGT I]",
    "division": "Patrol Division / Supervisor",
    "pin": "31505",
    "phone": "555-0315",
    "registeredAt": 1788436732799,
    "promotedBy": "Field Command Staff"
  },
  {
    "id": "roster-gorgon-xianlao-316",
    "name": "Gorgon Xianlao",
    "badge": "#316",
    "rank": "SERGEANT I [SGT I]",
    "division": "Patrol Division / Supervisor",
    "pin": "31606",
    "phone": "555-0316",
    "registeredAt": 1788523132799,
    "promotedBy": "Field Command Staff"
  },
  {
    "id": "roster-thomas-olise-317",
    "name": "Thomas Olise",
    "badge": "#317",
    "rank": "SERGEANT I [SGT I]",
    "division": "Patrol Division / Supervisor",
    "pin": "31707",
    "phone": "555-0317",
    "registeredAt": 1788609532799,
    "promotedBy": "Field Command Staff"
  },
  {
    "id": "roster-jimmy-hops-318",
    "name": "Jimmy Hops",
    "badge": "#318",
    "rank": "SERGEANT I [SGT I]",
    "division": "Patrol Division / Supervisor",
    "pin": "31808",
    "phone": "555-0318",
    "registeredAt": 1788695932799,
    "promotedBy": "Field Command Staff"
  },
  {
    "id": "roster-rize-izumi-319",
    "name": "Rize Izumi",
    "badge": "#319",
    "rank": "SERGEANT I [SGT I]",
    "division": "Special Operations (Special Guest)",
    "pin": "31909",
    "phone": "555-0319",
    "registeredAt": 1788782332799,
    "promotedBy": "Special Command Guest Mandate"
  },
  {
    "id": "roster-syns-askara-201",
    "name": "Syns Askara",
    "badge": "#201",
    "rank": "POLICE OFFICER III [PO III]",
    "division": "Patrol Division (PD)",
    "pin": "20101",
    "phone": "555-0201",
    "registeredAt": 1788955132799,
    "promotedBy": "Field Command Staff"
  },
  {
    "id": "roster-lexa-arvella-202",
    "name": "Lexa Arvella",
    "badge": "#202",
    "rank": "POLICE OFFICER III [PO III]",
    "division": "Traffic Enforcement (TEU)",
    "pin": "20202",
    "phone": "555-0202",
    "registeredAt": 1788955132799,
    "promotedBy": "Field Command Staff"
  },
  {
    "id": "roster-oscar-hernandez-203",
    "name": "Oscar Hernandez",
    "badge": "#203",
    "rank": "POLICE OFFICER III [PO III]",
    "division": "Detective / CID",
    "pin": "20303",
    "phone": "555-0203",
    "registeredAt": 1788955132799,
    "promotedBy": "Field Command Staff"
  },
  {
    "id": "roster-leoanrd-neave-204",
    "name": "Leoanrd Neave",
    "badge": "#204",
    "rank": "POLICE OFFICER III [PO III]",
    "division": "Patrol Division (PD)",
    "pin": "20404",
    "phone": "555-0204",
    "registeredAt": 1788955132799,
    "promotedBy": "Field Command Staff"
  },
  {
    "id": "roster-gondrong-carregado-211",
    "name": "Gondrong Carregado",
    "badge": "#211",
    "rank": "POLICE OFFICER II [PO II]",
    "division": "Patrol Division (PD)",
    "pin": "21101",
    "phone": "555-0211",
    "registeredAt": 1789127932799,
    "promotedBy": "Supervisors Bureau"
  },
  {
    "id": "roster-edes-fernandes-212",
    "name": "Edes Fernandes",
    "badge": "#212",
    "rank": "POLICE OFFICER II [PO II]",
    "division": "Patrol Division (PD)",
    "pin": "21202",
    "phone": "555-0212",
    "registeredAt": 1789127932799,
    "promotedBy": "Supervisors Bureau"
  },
  {
    "id": "roster-jalisco-michoacana-213",
    "name": "Jalisco Michoacana",
    "badge": "#213",
    "rank": "POLICE OFFICER II [PO II]",
    "division": "Patrol Division (PD)",
    "pin": "21303",
    "phone": "555-0213",
    "registeredAt": 1789127932799,
    "promotedBy": "Supervisors Bureau",
    "warnings": [
      {
        "id": "warn-jalisco-1",
        "strikeNumber": 1,
        "reason": "Peringatan Kedisiplinan Tingkat I (SP-1)",
        "issuedBy": "Internal Affairs / High Command",
        "timestamp": 1789991932799
      },
      {
        "id": "warn-jalisco-2",
        "strikeNumber": 2,
        "reason": "Peringatan Kedisiplinan Tingkat II (SP-2)",
        "issuedBy": "Internal Affairs / High Command",
        "timestamp": 1790510332799
      }
    ]
  },
  {
    "id": "roster-cecep-alexsander-214",
    "name": "Cecep Alexsander",
    "badge": "#214",
    "rank": "POLICE OFFICER II [PO II]",
    "division": "Traffic Enforcement (TEU)",
    "pin": "21404",
    "phone": "555-0214",
    "registeredAt": 1789127932799,
    "promotedBy": "Supervisors Bureau"
  },
  {
    "id": "roster-marchel-leonerd-215",
    "name": "Marchel Leonerd",
    "badge": "#215",
    "rank": "POLICE OFFICER II [PO II]",
    "division": "Patrol Division (PD)",
    "pin": "21505",
    "phone": "555-0215",
    "registeredAt": 1789127932799,
    "promotedBy": "Supervisors Bureau",
    "warnings": [
      {
        "id": "warn-marchel-1",
        "strikeNumber": 1,
        "reason": "Peringatan Kedisiplinan Tingkat I (SP-1)",
        "issuedBy": "Internal Affairs / High Command",
        "timestamp": 1789905532799
      },
      {
        "id": "warn-marchel-2",
        "strikeNumber": 2,
        "reason": "Peringatan Kedisiplinan Tingkat II (SP-2)",
        "issuedBy": "Internal Affairs / High Command",
        "timestamp": 1790596732799
      }
    ]
  },
  {
    "id": "roster-michaell-anderson-216",
    "name": "Michaell Anderson",
    "badge": "#216",
    "rank": "POLICE OFFICER II [PO II]",
    "division": "Patrol Division (PD)",
    "pin": "21606",
    "phone": "555-0216",
    "registeredAt": 1789127932799,
    "promotedBy": "Supervisors Bureau"
  },
  {
    "id": "roster-kyle-satorue-217",
    "name": "Kyle Satorue",
    "badge": "#217",
    "rank": "POLICE OFFICER II [PO II]",
    "division": "Patrol Division (PD)",
    "pin": "21707",
    "phone": "555-0217",
    "registeredAt": 1789127932799,
    "promotedBy": "Supervisors Bureau"
  },
  {
    "id": "roster-luix-ziyen-218",
    "name": "Luix Ziyen",
    "badge": "#218",
    "rank": "POLICE OFFICER II [PO II]",
    "division": "Patrol Division (PD)",
    "pin": "21808",
    "phone": "555-0218",
    "registeredAt": 1789127932799,
    "promotedBy": "Supervisors Bureau"
  },
  {
    "id": "roster-zayy-choper-219",
    "name": "Zayy Choper",
    "badge": "#219",
    "rank": "POLICE OFFICER II [PO II]",
    "division": "Patrol Division (PD)",
    "pin": "21909",
    "phone": "555-0219",
    "registeredAt": 1789127932799,
    "promotedBy": "Supervisors Bureau"
  },
  {
    "id": "roster-viggo-bonapattem-220",
    "name": "Viggo Bonapattem",
    "badge": "#220",
    "rank": "POLICE OFFICER II [PO II]",
    "division": "Patrol Division (PD)",
    "pin": "22010",
    "phone": "555-0220",
    "registeredAt": 1789127932799,
    "promotedBy": "Supervisors Bureau"
  },
  {
    "id": "roster-luna-haller-221",
    "name": "Luna Haller",
    "badge": "#221",
    "rank": "POLICE OFFICER II [PO II]",
    "division": "Patrol Division (PD)",
    "pin": "22111",
    "phone": "555-0221",
    "registeredAt": 1789127932799,
    "promotedBy": "Supervisors Bureau"
  },
  {
    "id": "roster-rama-oscar-222",
    "name": "Rama Oscar",
    "badge": "#222",
    "rank": "POLICE OFFICER II [PO II]",
    "division": "Patrol Division (PD)",
    "pin": "22212",
    "phone": "555-0222",
    "registeredAt": 1789127932799,
    "promotedBy": "Supervisors Bureau"
  },
  {
    "id": "roster-andrew-caldwel-223",
    "name": "Andrew Caldwel",
    "badge": "#223",
    "rank": "POLICE OFFICER II [PO II]",
    "division": "Patrol Division (PD)",
    "pin": "22313",
    "phone": "555-0223",
    "registeredAt": 1789127932799,
    "promotedBy": "Supervisors Bureau"
  },
  {
    "id": "roster-abeng-rajendra-224",
    "name": "Abeng Rajendra",
    "badge": "#224",
    "rank": "POLICE OFFICER II [PO II]",
    "division": "Patrol Division (PD)",
    "pin": "22414",
    "phone": "555-0224",
    "registeredAt": 1789127932799,
    "promotedBy": "Supervisors Bureau"
  },
  {
    "id": "roster-yaochen-xianlao-231",
    "name": "Yaochen Xianlao",
    "badge": "#231",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "23101",
    "phone": "555-0231",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau",
    "warnings": [
      {
        "id": "warn-yaochen-1",
        "strikeNumber": 1,
        "reason": "Peringatan Kedisiplinan Tingkat I (SP-1)",
        "issuedBy": "Internal Affairs / High Command",
        "timestamp": 1790423932799
      }
    ]
  },
  {
    "id": "roster-rejjie-kei-232",
    "name": "Rejjie Kei",
    "badge": "#232",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "23202",
    "phone": "555-0232",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau",
    "warnings": [
      {
        "id": "warn-rejjie-1",
        "strikeNumber": 1,
        "reason": "Peringatan Kedisiplinan Tingkat I (SP-1)",
        "issuedBy": "Internal Affairs / High Command",
        "timestamp": 1790423932799
      }
    ]
  },
  {
    "id": "roster-alvert-canizares-233",
    "name": "Alvert Canizares",
    "badge": "#233",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "23303",
    "phone": "555-0233",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau"
  },
  {
    "id": "roster-jems-giantenk-234",
    "name": "Jems Giantenk",
    "badge": "#234",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "23404",
    "phone": "555-0234",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau",
    "warnings": [
      {
        "id": "warn-jems-1",
        "strikeNumber": 1,
        "reason": "Peringatan Kedisiplinan Tingkat I (SP-1)",
        "issuedBy": "Internal Affairs / High Command",
        "timestamp": 1790337532799
      }
    ]
  },
  {
    "id": "roster-gleen-guerrero-235",
    "name": "Gleen Guerrero",
    "badge": "#235",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "23505",
    "phone": "555-0235",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau",
    "warnings": [
      {
        "id": "warn-gleen-1",
        "strikeNumber": 1,
        "reason": "Peringatan Kedisiplinan Tingkat I (SP-1)",
        "issuedBy": "Internal Affairs / High Command",
        "timestamp": 1790510332799
      }
    ]
  },
  {
    "id": "roster-jeesyln-claurissa-236",
    "name": "Jeesyln Claurissa",
    "badge": "#236",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "23606",
    "phone": "555-0236",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau"
  },
  {
    "id": "roster-skay-verantes-237",
    "name": "Skay Verantes",
    "badge": "#237",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "23707",
    "phone": "555-0237",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau",
    "warnings": [
      {
        "id": "warn-skay-1",
        "strikeNumber": 1,
        "reason": "Peringatan Kedisiplinan Tingkat I (SP-1)",
        "issuedBy": "Internal Affairs / High Command",
        "timestamp": 1790251132799
      }
    ]
  },
  {
    "id": "roster-venn-shelby-238",
    "name": "Venn Shelby",
    "badge": "#238",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "23808",
    "phone": "555-0238",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau",
    "warnings": [
      {
        "id": "warn-venn-1",
        "strikeNumber": 1,
        "reason": "Peringatan Kedisiplinan Tingkat I (SP-1)",
        "issuedBy": "Internal Affairs / High Command",
        "timestamp": 1790596732799
      }
    ]
  },
  {
    "id": "roster-kane-walker-239",
    "name": "Kane Walker",
    "badge": "#239",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "23909",
    "phone": "555-0239",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau"
  },
  {
    "id": "roster-khabib-nurmagomedov-240",
    "name": "Khabib Nurmagomedov",
    "badge": "#240",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "24010",
    "phone": "555-0240",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau",
    "warnings": [
      {
        "id": "warn-khabib-1",
        "strikeNumber": 1,
        "reason": "Peringatan Kedisiplinan Tingkat I (SP-1)",
        "issuedBy": "Internal Affairs / High Command",
        "timestamp": 1790164732799
      }
    ]
  },
  {
    "id": "roster-richard-caldwell-241",
    "name": "Richard Caldwell",
    "badge": "#241",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "24111",
    "phone": "555-0241",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau"
  },
  {
    "id": "roster-crimson-shand-242",
    "name": "Crimson Shand",
    "badge": "#242",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "24212",
    "phone": "555-0242",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau"
  },
  {
    "id": "roster-haideen-deegan-243",
    "name": "Haideen Deegan",
    "badge": "#243",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "24313",
    "phone": "555-0243",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau"
  },
  {
    "id": "roster-leonardo-martinez-244",
    "name": "Leonardo Martinez",
    "badge": "#244",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "24414",
    "phone": "555-0244",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau"
  },
  {
    "id": "roster-ian-romano-245",
    "name": "Ian Romano",
    "badge": "#245",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "24515",
    "phone": "555-0245",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau",
    "warnings": [
      {
        "id": "warn-ian-1",
        "strikeNumber": 1,
        "reason": "Peringatan Kedisiplinan Tingkat I (SP-1)",
        "issuedBy": "Internal Affairs / High Command",
        "timestamp": 1790078332799
      }
    ]
  },
  {
    "id": "roster-immanuel-halburt-246",
    "name": "Immanuel Halburt",
    "badge": "#246",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "24616",
    "phone": "555-0246",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau"
  },
  {
    "id": "roster-brian-arthur-247",
    "name": "Brian Arthur",
    "badge": "#247",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "24717",
    "phone": "555-0247",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau",
    "warnings": [
      {
        "id": "warn-brian-1",
        "strikeNumber": 1,
        "reason": "Peringatan Kedisiplinan Tingkat I (SP-1)",
        "issuedBy": "Internal Affairs / High Command",
        "timestamp": 1790683132799
      }
    ]
  },
  {
    "id": "roster-william-crawford-248",
    "name": "William Crawford",
    "badge": "#248",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "24818",
    "phone": "555-0248",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau"
  },
  {
    "id": "roster-marvin-woods-249",
    "name": "Marvin Woods",
    "badge": "#249",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "24919",
    "phone": "555-0249",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau"
  },
  {
    "id": "roster-xander-sky-250",
    "name": "Xander Sky",
    "badge": "#250",
    "rank": "POLICE OFFICER I [PO I]",
    "division": "Patrol Division (PD)",
    "pin": "25020",
    "phone": "555-0250",
    "registeredAt": 1789559932799,
    "promotedBy": "Field Training Bureau"
  },
  {
    "id": "roster-gazlien-burge-101",
    "name": "Gazlien Burge",
    "badge": "#101",
    "rank": "CADET POLICE",
    "division": "Police Academy / Cadet",
    "pin": "10101",
    "phone": "555-0101",
    "registeredAt": 1789991932799,
    "promotedBy": "Police Academy Recruitment Board"
  },
  {
    "id": "roster-don-carlo-102",
    "name": "Don Carlo",
    "badge": "#102",
    "rank": "CADET POLICE",
    "division": "Police Academy / Cadet",
    "pin": "10202",
    "phone": "555-0102",
    "registeredAt": 1789991932799,
    "promotedBy": "Police Academy Recruitment Board"
  },
  {
    "id": "roster-ziee-xanderz-103",
    "name": "Ziee Xanderz",
    "badge": "#103",
    "rank": "CADET POLICE",
    "division": "Police Academy / Cadet",
    "pin": "10303",
    "phone": "555-0103",
    "registeredAt": 1789991932799,
    "promotedBy": "Police Academy Recruitment Board"
  },
  {
    "id": "roster-kenzie-arabelle-104",
    "name": "Kenzie Arabelle",
    "badge": "#104",
    "rank": "CADET POLICE",
    "division": "Police Academy / Cadet",
    "pin": "10404",
    "phone": "555-0104",
    "registeredAt": 1789991932799,
    "promotedBy": "Police Academy Recruitment Board"
  },
  {
    "id": "roster-dario-antonio-105",
    "name": "Dario Antonio",
    "badge": "#105",
    "rank": "CADET POLICE",
    "division": "Police Academy / Cadet",
    "pin": "10505",
    "phone": "555-0105",
    "registeredAt": 1789991932799,
    "promotedBy": "Police Academy Recruitment Board"
  },
  {
    "id": "roster-arga-renaga-106",
    "name": "Arga Renaga",
    "badge": "#106",
    "rank": "CADET POLICE",
    "division": "Police Academy / Cadet",
    "pin": "10606",
    "phone": "555-0106",
    "registeredAt": 1789991932799,
    "promotedBy": "Police Academy Recruitment Board"
  },
  {
    "id": "roster-kaito-kurosaki-107",
    "name": "Kaito Kurosaki",
    "badge": "#107",
    "rank": "CADET POLICE",
    "division": "Police Academy / Cadet",
    "pin": "10707",
    "phone": "555-0107",
    "registeredAt": 1789991932799,
    "promotedBy": "Police Academy Recruitment Board"
  },
  {
    "id": "roster-oscar-junior-108",
    "name": "Oscar Junior",
    "badge": "#108",
    "rank": "CADET POLICE",
    "division": "Police Academy / Cadet",
    "pin": "10808",
    "phone": "555-0108",
    "registeredAt": 1789991932799,
    "promotedBy": "Police Academy Recruitment Board"
  },
  {
    "id": "roster-halan-uden-109",
    "name": "Halan_Uden",
    "badge": "#109",
    "rank": "CADET POLICE",
    "division": "Police Academy / Cadet",
    "pin": "10909",
    "phone": "555-0109",
    "registeredAt": 1789991932799,
    "promotedBy": "Police Academy Recruitment Board"
  },
  {
    "id": "roster-briella-bimantara-110",
    "name": "Briella Bimantara",
    "badge": "#110",
    "rank": "CADET POLICE",
    "division": "Police Academy / Special Guest",
    "pin": "11010",
    "phone": "555-0110",
    "registeredAt": 1789991932799,
    "promotedBy": "Police Academy Special Guest Program"
  }
];

/**
 * Merges any incoming roster array (from localStorage or Firestore realtime)
 * with the official 67 department officers so no official roster member is ever lost,
 * and user changes (especially PIN updates and promotions) are completely preserved.
 */
export function mergeWithOfficialRoster(
  incoming: OfficerAccount[] = [],
  dischargedOverride?: DischargedOfficerEntry[]
): OfficerAccount[] {
  // Read list of discharged/pecat officers and permanently purged officers so they are NEVER resurrected
  const dischargedList = dischargedOverride || getDischargedOfficers();
  const purgedList = getPermanentlyPurgedOfficers();

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

  // 1. Seed with official officers ONLY IF THEY ARE NOT DISCHARGED OR PERMANENTLY PURGED
  HSPD_OFFICIAL_ROSTER.forEach(official => {
    if (isOfficerDischarged(official, dischargedList) || isOfficerPermanentlyPurged(official, purgedList)) {
      return; // Do NOT seed discharged or purged officer
    }
    const key = getCanonicalKey(official);
    officersMap.set(key, { ...official });
  });

  // 2. Helper to find existing officer by ID, Name, or Badge
  const findExistingKey = (item: OfficerAccount): string | null => {
    const cleanId = item.id ? item.id.toLowerCase().trim() : '';
    const cleanBadge = (item.badge || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
    const cleanName = (item.name || '').toLowerCase().trim();

    const normalizeName = (n?: string) => {
      return (n || '').toLowerCase()
        .replace(/\(.*?\)/g, '') // remove parenthesized remarks like (WARN 2), (Special Guest)
        .replace(/[^a-z0-9]/g, '')
        .trim();
    };
    const normCleanName = normalizeName(cleanName);

    for (const [key, existing] of officersMap.entries()) {
      // 1. Direct ID match
      if (cleanId && existing.id && existing.id.toLowerCase().trim() === cleanId) {
        return key;
      }

      const existingName = (existing.name || '').toLowerCase().trim();
      const existingNormName = normalizeName(existingName);

      // 2. NAME MATCH (HIGHEST PRIORITY FOR IC IDENTITY):
      if (cleanName && existingName) {
        if (cleanName === existingName || cleanName.replace(/\s+/g, '') === existingName.replace(/\s+/g, '')) {
          return key;
        }
        if (normCleanName && normCleanName.length >= 4 && normCleanName === existingNormName) {
          return key;
        }
      }

      // Typo alias check for specific officers
      if (cleanName && cleanName.includes('neave') && existingName.includes('neave')) {
        return key;
      }
      if (
        cleanName &&
        (cleanName.includes('leoarnd') || cleanName.includes('leonard') || cleanName.includes('leoanrd')) &&
        (existingName.includes('leoarnd') || existingName.includes('leonard') || existingName.includes('leoanrd'))
      ) {
        return key;
      }

      // 3. BADGE MATCH:
      const existingBadgeDigits = (existing.badge || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();
      if (cleanBadge && existingBadgeDigits && cleanBadge === existingBadgeDigits) {
        if (!cleanName || !existingName || cleanName === existingName || normCleanName === existingNormName) {
          return key;
        }
      }
    }
    return null;
  };

  // 3. Overlay incoming records (filtering out any discharged or permanently purged officer)
  if (Array.isArray(incoming)) {
    incoming.forEach(item => {
      if (!item || isOfficerDischarged(item, dischargedList) || isOfficerPermanentlyPurged(item, purgedList)) return;
      const existingKey = findExistingKey(item);

      if (existingKey && officersMap.has(existingKey)) {
        const existing = officersMap.get(existingKey)!;
        const updated: OfficerAccount = {
          ...existing,
          ...item,
          name: item.name || existing.name,
          badge: item.badge || existing.badge,
          rank: item.rank || existing.rank,
          division: item.division || existing.division,
          pin: (item.pin !== undefined && String(item.pin).trim() !== '') ? String(item.pin).trim() : existing.pin,
          phone: item.phone || existing.phone,
          discordTag: (item.discordTag !== undefined && item.discordTag !== null && String(item.discordTag).trim() !== '') 
            ? String(item.discordTag).trim() 
            : existing.discordTag,
          promotedBy: item.promotedBy || existing.promotedBy,
          warnings: Array.isArray(item.warnings) && item.warnings.length > 0 ? item.warnings : (existing.warnings || []),
          _updatedAt: item._updatedAt || Date.now()
        };
        officersMap.set(existingKey, updated);
      } else {
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

  // 4. Strict deduplication pass by character name
  const nameRegistry = new Map<string, OfficerAccount>();
  for (const officer of officersMap.values()) {
    const normName = (officer.name || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    if (!normName) continue;

    if (nameRegistry.has(normName)) {
      const existing = nameRegistry.get(normName)!;
      const existingTime = existing._updatedAt || existing.registeredAt || 0;
      const curTime = officer._updatedAt || officer.registeredAt || 0;
      const preferred = curTime >= existingTime ? { ...existing, ...officer } : { ...officer, ...existing };
      nameRegistry.set(normName, preferred);
    } else {
      nameRegistry.set(normName, officer);
    }
  }

  // Guarantee Jackie Xianlao is always preserved as Chief of Police [COP]
  if (!nameRegistry.has('jackiexianlao')) {
    const jackieOfficial = HSPD_OFFICIAL_ROSTER[0];
    nameRegistry.set('jackiexianlao', { ...jackieOfficial });
  }

  const uniqueOfficers = Array.from(nameRegistry.values());
  const finalOfficers = applyCustomPinOverrides(uniqueOfficers);
  
  // Sort cleanly by numerical badge number (e.g. #001 -> #002 -> #101 -> #201 -> #301 -> #401)
  return finalOfficers.sort((a, b) => {
    const numA = extractBadgeNumeric(a.badge);
    const numB = extractBadgeNumeric(b.badge);
    if (numA !== numB) return numA - numB;
    const strA = (a.badge || '').toLowerCase().trim();
    const strB = (b.badge || '').toLowerCase().trim();
    if (strA !== strB) return strA.localeCompare(strB);
    return (a.name || '').localeCompare(b.name || '');
  });
}

/**
 * Extracts the primary numeric value of an officer badge (e.g. "#001" -> 1, "#018" -> 18, "#401" -> 401)
 * Useful for consistent numerical ascending ordering across all roster tables & views.
 */
export function extractBadgeNumeric(badge?: string): number {
  if (!badge) return 999999;
  const digits = String(badge).replace(/[^0-9]/g, '');
  if (!digits) return 999999;
  const num = parseInt(digits, 10);
  return isNaN(num) ? 999999 : num;
}
