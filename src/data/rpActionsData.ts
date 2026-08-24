import { RoleplayPreset } from '../types';

export const MIRANDA_WARNINGS = {
  indonesia: [
    "Anda memiliki hak untuk tetap diam.",
    "Apapun yang Anda katakan dapat dan akan digunakan untuk melawan Anda di pengadilan hukum.",
    "Anda berhak didampingi pengacara saat diinterogasi.",
    "Jika Anda tidak mampu menyewa pengacara, negara dapat menyediakannya untuk Anda.",
    "Apakah Anda memahami hak-hak yang telah saya bacakan?"
  ],
  english: [
    "You have the right to remain silent.",
    "Anything you say can and will be used against you in a court of law.",
    "You have the right to an attorney.",
    "If you cannot afford an attorney, one will be provided for you.",
    "Do you understand these rights as I have read them to you?"
  ]
};

export const RP_PRESETS: RoleplayPreset[] = [
  {
    id: 'miranda-id',
    category: 'Miranda',
    title: 'Pembacaan Hak Miranda (Bahasa Indonesia)',
    commands: [
      { type: 'say', text: "Anda memiliki hak untuk tetap diam." },
      { type: 'say', text: "Apapun yang Anda katakan dapat dan akan digunakan untuk melawan Anda di pengadilan." },
      { type: 'say', text: "Anda berhak didampingi oleh penasihat hukum / pengacara." },
      { type: 'say', text: "Jika tidak mampu, pengacara dapat disediakan untuk Anda." },
      { type: 'say', text: "Apakah Anda mengerti hak-hak yang telah saya bacakan?" },
      { type: 'do', text: "Apakah suspect memahami seluruh hak Miranda yang dibacakan? (( Suspect ))" }
    ]
  },
  {
    id: 'miranda-en',
    category: 'Miranda',
    title: 'Miranda Rights Warning (English Version)',
    commands: [
      { type: 'say', text: "You have the right to remain silent." },
      { type: 'say', text: "Anything you say can and will be used against you in a court of law." },
      { type: 'say', text: "You have the right to talk to a lawyer and have him present with you while you are being questioned." },
      { type: 'say', text: "If you cannot afford a lawyer, one will be appointed to represent you before any questioning if you wish." },
      { type: 'say', text: "Do you understand each of these rights I have explained to you?" },
      { type: 'do', text: "Does the suspect understand their rights? (( Suspect ))" }
    ]
  },
  {
    id: 'cuff-suspect',
    category: 'Borgol & Tangkap',
    title: 'Memborgol Tersangka (Handcuffing)',
    commands: [
      { type: 'me', text: "mengambil sepasang borgol baja dari utility belt dengan tangan kanan." },
      { type: 'me', text: "menarik kedua pergelangan tangan tersangka ke belakang punggung lalu memasang borgol hingga terkunci." },
      { type: 'do', text: "Kedua tangan suspect terkunci rapat dengan borgol. Ada perlawanan? (( Suspect ))" },
      { type: 'cmd', text: "/cuff [ID]" }
    ]
  },
  {
    id: 'uncuff-suspect',
    category: 'Borgol & Tangkap',
    title: 'Membuka Borgol Tersangka',
    commands: [
      { type: 'me', text: "mengambil kunci borgol dari saku rompi lalu memasukkannya ke lubang kunci borgol suspect." },
      { type: 'me', text: "memutar kunci hingga pengait terbuka dan melepas borgol dari pergelangan tangan tersangka." },
      { type: 'cmd', text: "/uncuff [ID]" }
    ]
  },
  {
    id: 'frisk-suspect',
    category: 'Pemeriksaan / Frisk',
    title: 'Penggeledahan Tubuh (Frisking / Search)',
    commands: [
      { type: 'me', text: "memakai sarung tangan latex karet lalu menepuk dan meraba sekujur saku, celana, dan rompi tersangka secara mendalam." },
      { type: 'do', text: "Dimana letak barang-barang ilegal atau senjata milik tersangka disimpan? (( Suspect ))" },
      { type: 'cmd', text: "/frisk [ID]" }
    ]
  },
  {
    id: 'ticket-invoice',
    category: 'Tilang & Invoice',
    title: 'Penulisan Surat Tilang / Invoice',
    commands: [
      { type: 'me', text: "mengambil buku surat tilang HSPD dan pulpen dari kantong rompi." },
      { type: 'me', text: "mencatat identitas pelanggar, nomor plat kendaraan, rincian pasal, dan total nominal denda." },
      { type: 'me', text: "merobek lembaran tilang lalu menyerahkannya kepada pelanggar untuk ditandatangani dan diproses." },
      { type: 'cmd', text: "/giveinvoice [ID] [JUMLAH] [PASAL]" }
    ]
  },
  {
    id: 'impound-veh',
    category: 'Impound',
    title: 'Penyitaan Kendaraan (Impound Procedure)',
    commands: [
      { type: 'me', text: "mengambil formulir impound kepolisian lalu menempelkan stiker segel impound pada kaca depan kendaraan." },
      { type: 'me', text: "menghubungi mobil derek kepolisian untuk mengangkut kendaraan menuju impound lot pusat." },
      { type: 'cmd', text: "/impound" }
    ]
  },
  {
    id: 'tazer-draw',
    category: 'Senjata & Tazer',
    title: 'Menyiapkan Tazer (Non-Lethal Escalate)',
    commands: [
      { type: 'me', text: "membuka klip holster samping lalu mencabut senjata kejut listrik (Taser X26P)." },
      { type: 'me', text: "mengarahkan moncong taser ke arah suspect sambil memerintahkan untuk tiarap di tanah." },
      { type: 'say', text: "TIARAP SEKARANG JUGA ATAU SAYA TEMBAKKAN TASER!" },
      { type: 'cmd', text: "/tazer" }
    ]
  }
];

export const MEGAPHONE_CATEGORIES = [
  {
    id: 'traffic',
    title: 'Patroli & Traffic Stop (10-55)',
    description: 'Peringatan kendaraan untuk menepi ke sisi jalan dan mematikan mesin.',
    presets: [
      {
        level: 'Normal / Permintaan Menepi',
        text: 'Kepada pengemudi {VEHICLE} berwarna {COLOR}, harap segera menepi ke sisi kiri jalan dan matikan mesin!'
      },
      {
        level: 'Peringatan 1 (Matikan Mesin)',
        text: '[PERINGATAN 1] Pengemudi {VEHICLE} {COLOR}, matikan mesin Anda, taruh kedua tangan di atas setir kemudi!'
      },
      {
        level: 'Peringatan 2 (Tindakan Tegas)',
        text: '[PERINGATAN 2] Kendaraan {VEHICLE} {COLOR}, menepi sekarang juga atau kami akan mengambil tindakan penegakan hukum tegas!'
      },
      {
        level: 'Peringatan Terakhir (Tembakan Ban)',
        text: '[PERINGATAN TERAKHIR] Pengemudi {VEHICLE} {COLOR}! Ini peringatan terakhir! Menepi dan menyerah atau kami akan membuka tembakan ke arah ban!'
      }
    ]
  },
  {
    id: 'pursuit',
    title: 'Pursuit / Pengejaran (10-57)',
    description: 'Eskalasi pursuit berkala (Peringatan 1 s/d Peringatan 3 & PIT Warning).',
    presets: [
      {
        level: 'Pursuit Warning 1 (Menit ke-0)',
        text: 'PERINGATAN 1! PENGEMUDI {VEHICLE} {COLOR} DENGAN PLAT {PLATE}, HENTIKAN KENDARAAN ANDA DAN MENYERAH!'
      },
      {
        level: 'Pursuit Warning 2 (Menit ke-5)',
        text: 'PERINGATAN 2! HENTIKAN LAJU {VEHICLE} ANDA SEGERA! ANDA SUDAH TIDAK MEMILIKI JALAN KELUAR!'
      },
      {
        level: 'Pursuit Warning 3 (Menit ke-10 - Otorisasi Drive-by)',
        text: 'PERINGATAN 3 & TERAKHIR! KEPOLISIAN MEMBERIKAN WAKTU 10 DETIK UNTUK BERHENTI ATAU KENDARAAN AKAN DILUMPUHKAN DENGAN TEMBAKAN BAN!'
      },
      {
        level: 'PIT Maneuver Warning (Zona Tol)',
        text: 'PERINGATAN TAKTIS! KENDARAAN AKAN SEGERA DILAKUKAN PIT MANEUVER DAN DILUMPUHKAN PAKSA!'
      }
    ]
  },
  {
    id: 'robbery',
    title: 'Perampokan Bank & ATM',
    description: 'Pengepungan perimeter bank, sterilisasi area, dan peringatan menyerah.',
    presets: [
      {
        level: 'Sterilisasi Perimeter Warga',
        text: 'Diberitahukan kepada seluruh warga sipil di sekitar {LOCATION}, area ini sedang berbahaya! Segera menjauh dan kosongkan radius 200 meter!'
      },
      {
        level: 'Pengepungan Gedung',
        text: '[HSPD COMMAND] Kepada seluruh pelaku kriminal di dalam {LOCATION}! Seluruh jalur keluar telah dikepung rapat! Angkat tangan dan keluar satu per satu!'
      },
      {
        level: 'Peringatan Senjata & Darah',
        text: 'Letakkan senjata api Anda di lantai dan jangan melakukan gerakan mencurigakan demi keselamatan Anda!'
      },
      {
        level: 'Breaching / Ultimatum Terakhir',
        text: '[ULTIMATUM TERAKHIR] Waktu 30 detik untuk keluar menyerahkan diri atau Tim Taktis SWAT akan mendobrak masuk dengan kekuatan penuh!'
      }
    ]
  },
  {
    id: 'hostage',
    title: 'Negosiasi Sandera (Hostage Scene)',
    description: 'Protokol perlindungan sandera, jalur dialog negosiator, dan kesepakatan.',
    presets: [
      {
        level: 'Inisiasi Kontak Negosiasi',
        text: 'Kami dari Tim Negosiator Kepolisian HSPD ingin berbicara dengan pimpinan di dalam! Tunjukkan bukti visual bahwa sandera dalam kondisi selamat!'
      },
      {
        level: 'Syarat Keselamatan Sandera',
        text: 'Pastikan sandera tidak disakiti! Setiap luka pada sandera akan membatalkan seluruh opsi negosiasi dan memicu penyerbuan langsung!'
      },
      {
        level: 'Pertukaran & Tuntutan',
        text: 'Katakan apa tuntutan Anda secara jelas, kami siap mendengarkan selama keselamatan warga sipil menjadi jaminan utama!'
      },
      {
        level: 'Proses Evakuasi Sandera',
        text: 'Lepaskan sandera keluar terlebih dahulu melalui pintu depan sebelum kendaraan penjemputan Anda diperbolehkan bergerak!'
      }
    ]
  }
];
