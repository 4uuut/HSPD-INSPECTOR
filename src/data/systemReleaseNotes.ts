/**
 * Riwayat Rilis Resmi Sistem MDT HSPD Terpadu
 * Digunakan secara sinkron oleh Web App, Modal Pengumuman, dan Discord Bot Gateway.
 */

export interface SystemReleaseNote {
  version: string;
  releaseDate: string; // Tanggal rilis resmi
  title: string;
  headerText: string;
  customDescription: string;
  embedColorHex: string;
  embedColorInt: number;
  newFeatures: string[];
  removedOrAdjusted: string[];
  improvements: string[];
  bugFixes: string[];
  extraNotes?: string;
  mentionRole?: string;
  authorName?: string;
  authorBadge?: string;
  authorRank?: string;
}

export const ALL_SYSTEM_RELEASES: SystemReleaseNote[] = [
  {
    version: 'v4.2.2',
    releaseDate: '27 September 2026',
    title: 'Pembaruan Sistem MDT HSPD - Sinkronisasi Instan Edit PIN Roster & Integrasi Penuh Otorisasi Reset PIN',
    headerText: '[ PEMBERITAHUAN RESMI PEMBARUAN & PENYEMPURNAAN SISTEM MDT HSPD ]',
    customDescription: 'Sistem operasional MDT HSPD telah diperbarui ke versi v4.2.2. Pembaruan ini menyempurnakan keandalan otentikasi login, sinkronisasi instan PIN hasil edit di Roster Anggota, serta integrasi langsung permohonan lupa/ganti PIN ke database sehingga langsung aktif seketika tanpa tertimpa:',
    embedColorHex: '#00A8FF',
    embedColorInt: 0x00A8FF,
    newFeatures: [
      'Sinkronisasi Instan Edit PIN Roster ke Login: PIN yang diubah melalui menu "Edit Petugas" di Roster Anggota kini langsung tersimpan ke Central PIN Registry dan Firestore sehingga petugas dapat langsung login menggunakan PIN baru seketika tanpa jeda',
      'Integrasi Otomatis Permohonan Lupa/Ganti PIN: PIN baru yang diajukan atau disetujui atasan otomatis masuk ke database roster dan langsung dapat dipakai login seketika di portal MDT',
      'Proteksi Anti-Overwrite PIN Resmi: Mengamankan PIN hasil kustomisasi petugas/atasan agar tidak pernah tertimpa kembali ke nilai default saat penggabungan data roster'
    ],
    removedOrAdjusted: [
      'Pembersihan Redundansi Validasi PIN: Menghilangkan ketidaksesuaian verifikasi PIN antara storage lokal browser dan server gateway'
    ],
    improvements: [
      'Centralized Persistent PIN Registry: Seluruh perubahan PIN diikat permanen dengan nomor badge, nama petugas, dan ID akun',
      'Sinkronisasi Realtime Lintas Sesi: Perubahan PIN oleh atasan langsung memutakhirkan sesi login aktif petugas yang bersangkutan'
    ],
    bugFixes: [
      'Perbaikan Login Setelah Edit PIN: Memperbaiki kendala di mana PIN yang telah diedit di roster tidak terbaca saat petugas mencoba login',
      'Perbaikan Fitur Lupa PIN: Memastikan PIN hasil persetujuan manual maupun otomatis langsung tertulis ke database roster dan aktif seketika'
    ],
    extraNotes: '',
    mentionRole: 'none',
    authorName: 'HSPD High Command',
    authorBadge: 'HQ-01',
    authorRank: 'Chief of Police'
  },
  {
    version: 'v4.2.1',
    releaseDate: '25 September 2026',
    title: 'Pembaruan Sistem MDT HSPD - Proteksi Anti-Duplikasi Siaran & Sinkronisasi Dinamis Catatan Perubahan',
    headerText: '[ PEMBERITAHUAN RESMI PEMBARUAN & PENYEMPURNAAN SISTEM MDT HSPD ]',
    customDescription: 'Sistem operasional MDT HSPD telah diperbarui ke versi v4.2.1. Pembaruan ini menghadirkan proteksi cerdas anti pesan ganda (deduplication throttle) pada pengumuman changelog & ping monitor, pembaruan dinamis riwayat perubahan fitur mengikuti update nyata, serta penegasan pengiriman pesan langsung oleh Bot Resmi ke Channel 1547776898833326161:',
    embedColorHex: '#00A8FF',
    embedColorInt: 0x00A8FF,
    newFeatures: [
      'Proteksi Anti-Pesan Ganda (Deduplication Guard) Pengumuman & Ping: Mencegah sistem dan bot mengirim pesan changelog maupun ping server yang sama berulang kali dalam jeda singkat',
      'Daftar Perubahan Mengikuti Update Nyata (Dinamis): Kotak "Daftar Perubahan yang Disiarkan Otomatis" kini dinamis dan dapat beralih melihat riwayat rilis sebelumnya tanpa terkunci pada satu template statis',
      'Penyelarasan Channel Rilis Resmi Bot (Channel 1547776898833326161): Siaran changelog pembaruan sistem dan rilis resmi disiarkan khusus langsung oleh bot Discord ke Channel #changelog (1547776898833326161)'
    ],
    removedOrAdjusted: [
      'Pembersihan Baris Operator/Pemicu: Menghapus baris operator/pemicu Leonard Xianlao (#019) dari seluruh pelaporan status sistem dan embed Discord',
      'Penghapusan Timer Ganda Auto-Ping: Menghilangkan redundansi pemanggilan interval ping antara modul client dan backend server'
    ],
    improvements: [
      'Standardisasi Foto Profil Resmi Bot: Mengganti seluruh icon webhook pihak ketiga dengan foto profil resmi bot HSPD',
      'Pemisahan Jalur Channel: Channel changelog rilis (1547776898833326161) dan channel ping monitor (1550418868814610433) kini sepenuhnya independen dengan konfigurasi terpisah',
      'Sinkronisasi Status Siaran Lintas Tab & Browser: Riwayat rilis yang sudah disiarkan otomatis tersimpan aman di server config dan local storage'
    ],
    bugFixes: [
      'Perbaikan Pengiriman Pesan Dobel (Duplicate Broadcast Fix): Mengatasi masalah di mana pengumuman pembaruan dan ping server terkirim 2 kali sekaligus saat memuat halaman web',
      'Perbaikan Template Statis Kaku: Mengganti tampilan template yang kaku dengan data rilis yang dapat diedit langsung oleh perwira komando atau dipilih dari riwayat update',
      'Perbaikan Token Discord Gateway (401 Unauthorized): Memprioritaskan sesi token valid aktif dengan User-Agent bot resmi'
    ],
    extraNotes: '',
    mentionRole: 'none',
    authorName: 'HSPD High Command',
    authorBadge: 'HQ-01',
    authorRank: 'Chief of Police'
  },
  {
    version: 'v4.2.0',
    releaseDate: '24 September 2026',
    title: 'Pembaruan Sistem MDT HSPD - Pengali Denda Kasus, Studio Dokumen 1 Halaman & Monitor Ping Status Real-Time',
    headerText: '[ PEMBERITAHUAN RESMI PEMBARUAN & PENYEMPURNAAN SISTEM MDT HSPD ]',
    customDescription: 'Sistem operasional MDT HSPD ditingkatkan ke versi v4.2.0 dengan fitur faktor pengali nominal denda, tata letak dokumen kepolisian 1 lembar pas (A4 Fit Lock), dan sistem ping status website & bot:',
    embedColorHex: '#3B82F6',
    embedColorInt: 0x3B82F6,
    newFeatures: [
      'Faktor Pengali Denda (x1, x2, x3, x4, x5) & Nominal Khusus (Isi Sendiri) di Formulir Kasus Penindakan: Petugas dapat secara instan melipatgandakan total denda untuk kasus pelanggar berulang / sindikat atau menginput nominal kustom manual',
      'Studio Dokumen & Surat Resmi Terpadu 1 Halaman Pas (A4 Fit Lock): Penataan ulang seluruh tombol aksi, ekspor gambar HD (PNG/JPG), dan print PDF dalam satu layout terpadu dengan jaminan pas 1 lembar utuh tanpa halaman kedua kosong',
      'Monitor Ping Status Website & Bot Discord Real-Time (Channel 1550418868814610433): Pengiriman laporan ping status kesehatan website dan status bot Discord secara langsung ke Discord'
    ],
    removedOrAdjusted: [],
    improvements: [
      'Pilihan Kerapatan Tata Letak Dokumen (Normal, Compact, Tight): Menjamin dokumen resmi dengan banyak pasal atau pihak tetap muat presisi dalam satu lembar A4',
      'Sinkronisasi Kalkulasi Denda Berlapis: Integrasi instan antara diskon kooperatif (-20%), faktor pengali pelanggaran, serta nominal custom override'
    ],
    bugFixes: [
      'Perbaikan Siaran Bot Changelog Berulang: Memperbaiki sistem pengumuman bot Discord yang sebelumnya selalu mengirim pesan teks versi lawas (v3.5.0)',
      'Perbaikan Cetak Dokumen Blank Halaman Kedua: Penerapan aturan CSS @media print (break-inside: avoid, max-height: 284mm) sehingga pencetakan PDF selalu 1 lembar bersih',
      'Perbaikan Rekam Jejak Total Denda: Nilai denda hasil pengali dan nominal kustom kini tersimpan presisi ke CAD Roster, Riwayat Kasus, dan Webhook Discord'
    ],
    extraNotes: '',
    mentionRole: 'none',
    authorName: 'HSPD High Command',
    authorBadge: 'HQ-01',
    authorRank: 'Chief of Police'
  },
  {
    version: 'v4.1.0',
    releaseDate: '23 September 2026',
    title: 'Pembaruan Sistem MDT HSPD - Sinkronisasi Multi-Dokumen Resmi & Panel Administrasi Terpadu',
    headerText: '[ PEMBERITAHUAN RESMI PEMBARUAN & PENYEMPURNAAN SISTEM MDT HSPD ]',
    customDescription: 'Penyempurnaan modul penerbitan dokumen kepolisian, arsip kabinet negara, dan rekonsiliasi data personel terpadu:',
    embedColorHex: '#10B981',
    embedColorInt: 0x10B981,
    newFeatures: [
      'Template Dokumen Dinas Baru: Surat Panggilan Saksi/Tersangka, Surat Perintah Penggeledahan & Penyitaan, serta Surat Izin Operasional Khusus',
      'Panel Administrasi Terpadu: Monitoring kehadiran personel secara otomatis saat on-duty',
      'Tombol Salin Ringkas Berita Acara Pemeriksaan (BAP) khusus format teks Discord'
    ],
    removedOrAdjusted: [],
    improvements: [
      'Optimalisasi render font dokumen resmi agar tajam pada resolusi tinggi',
      'Pencatatan nomor surat dinas otomatis dengan format penomoran standar kepolisian'
    ],
    bugFixes: [
      'Perbaikan tanda tangan digital yang terkadang bergeser saat jendela browser diperkecil',
      'Perbaikan validasi tanggal kadaluarsa izin senjata dan usaha'
    ],
    extraNotes: 'Seluruh personel yang bertugas diwajibkan menggunakan format surat resmi terbaru.',
    mentionRole: '@everyone',
    authorName: 'HSPD High Command',
    authorBadge: 'HQ-01',
    authorRank: 'Chief of Police'
  }
];

export const CURRENT_SYSTEM_RELEASE: SystemReleaseNote = ALL_SYSTEM_RELEASES[0];
