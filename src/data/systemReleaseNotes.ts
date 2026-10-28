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
    version: 'v4.3.1',
    releaseDate: '28 Oktober 2026',
    title: 'Pembaruan Sistem MDT HSPD - Proteksi Frekuensi Rahasia Taktis, Dual-Portal Login & Penyiaran Bot Discord',
    headerText: '[ PEMBERITAHUAN RESMI PEMBARUAN & SISTEM TERBARU v4.3.1 ]',
    customDescription: 'Sistem operasional MDT HSPD dan Portal Kenegaraan telah diperbarui ke versi v4.3.1. Pembaruan ini menegakkan kerahasiaan frekuensi radio taktis kepolisian, optimasi terminal login aparatur POLISI & PEMERINTAH, sinkronisasi realtime pusat pemberitahuan sistem, serta pengiriman siaran changelog langsung via Bot Discord Resmi tanpa webhook:',
    embedColorHex: '#06B6D4',
    embedColorInt: 0x06B6D4,
    newFeatures: [
      '1️⃣ Penyiaran Bot Discord Otomatis Tanpa Webhook: Pengiriman changelog & pembaruan sistem kini langsung dikirimkan oleh Bot Resmi ke Channel #changelog (1547776898833326161) via Discord REST API tanpa bergantung pada webhook',
      '2️⃣ Pembaruan Realtime Pusat Pemberitahuan Sistem: Live Update Carousel & Pusat Siaran resmi tersinkronisasi otomatis dengan catatan rilis versi terbaru',
      '3️⃣ Portal Slide Interaktif KUHP & Regulasi HSPD: Peninjauan Kitab Pidana, SOP Kepolisian, dan Hak Miranda secara mandiri melalui tombol geser navigasi portal depan',
      '4️⃣ Hak Miranda (Miranda Warning) Dwibahasa Resmi: Pedoman pembacaan hak tersangka penangkapan wajib sebelum BAP demi keabsahan berkas perkara di persidangan',
      '5️⃣ Tangga Penggunaan Kekuatan & Senjata (Use of Force Continuum): 5 tingkatan eskalasi baku (Kehadiran Fisik, Komando Verbal, Borgol/Tangan Kosong, Less-Lethal Taser/Baton, dan Senjata Mematikan)',
      '6️⃣ Kitab Pasal KUHP Terpadu (Kategori A s/d I): Modul pencarian instan seluruh pasal pidana, denda maksimal, waktu penjara, dan status impound'
    ],
    removedOrAdjusted: [
      'Pembersihan Frekuensi Radio Taktis dari Publik: Menghapus modul frekuensi taktis dari portal hukum publik demi menjaga kerahasiaan operasional HSPD',
      'Optimasi Terminal Login Aparatur: Menghilangkan tombol layanan warga dari kotak login untuk tampilan dual-portal yang simetris dan profesional (POLISI & PEMERINTAH)'
    ],
    improvements: [
      'Dukungan Penuh Pengiriman Pesan Bot Discord ke Channel Rilis tanpa webhook',
      'Pencegahan anti pesan ganda (deduplication guard) cerdas pada siaran changelog',
      'Desain antarmuka gelap responsif yang sinkron antara desktop laptop dan perangkat ponsel'
    ],
    bugFixes: [
      'Perbaikan kendala siaran di mana tombol Push Discord sempat memerlukan URL Webhook meskipun bot aktif',
      'Penyelarasan nomor rilis dan sinkronisasi otomatis pusat pengumuman sistem'
    ],
    extraNotes: 'Pembaruan ini telah aktif dan dapat langsung disiarkan oleh atasan kepolisian atau pengembang.',
    mentionRole: 'none',
    authorName: 'HSPD High Command',
    authorBadge: 'DEV-001',
    authorRank: 'Chief of Police'
  },
  {
    version: 'v4.3.0',
    releaseDate: '27 Oktober 2026',
    title: 'Pembaruan Sistem MDT HSPD - Portal Interaktif Regulasi & KUHP HSPD, SOP Hak Miranda, dan Pusat Layanan Warga',
    headerText: '[ PEMBERITAHUAN RESMI PEMBARUAN SISTEM MDT HSPD v4.3.0 ]',
    customDescription: 'Sistem operasional MDT HSPD dan Portal Kenegaraan telah ditingkatkan ke versi v4.3.0. Menghadirkan portal slide interaktif Kitab Undang-Undang Hukum Pidana (KUHP) & SOP Kepolisian, tangga eskalasi kekuatan (Use of Force), pembacaan resmi Hak Miranda, modul frekuensi taktis & 10-Codes, tombol terpadu Layanan Warga, serta link Discord Kenegaraan Balai Kota:',
    embedColorHex: '#06B6D4',
    embedColorInt: 0x06B6D4,
    newFeatures: [
      '1️⃣ Portal Slide Interaktif Undang-Undang & Regulasi HSPD: Tombol navigasi geser (< dan >) di portal informasi utama untuk meninjau Kitab Pidana & SOP Kepolisian tanpa harus login',
      '2️⃣ Hak Miranda (Miranda Warning) Dwibahasa Resmi: Pedoman pembacaan hak tersangka penangkapan wajib sebelum BAP demi keabsahan berkas perkara di persidangan',
      '3️⃣ Tangga Penggunaan Kekuatan & Senjata (Use of Force Continuum): 5 tingkatan eskalasi baku (Kehadiran Fisik, Komando Verbal, Borgol/Tangan Kosong, Less-Lethal Taser/Baton, dan Senjata Mematikan)',
      '4️⃣ Kitab Pasal KUHP Terpadu (Kategori A s/d I): Modul pencarian instan seluruh pasal pidana, denda maksimal, waktu penjara, dan status impound',
      '5️⃣ Protokol 10-Codes & Frekuensi Radio Taktis: Referensi cepat komunikasi radio lapangan (10-1 s/d CODE 0) dan kanal frekuensi radio taktis (1111 HQ, 1112 ATM, 1113 Bank Desa, 1114 Bank Pusat)',
      '6️⃣ Tombol Akses Cepat "LAYANAN WARGA": Warga sipil dapat langsung menekan tombol Layanan Warga di portal utama untuk perizinan SKCK, pelaporan pengaduan, dan cek buronan DPO',
      '7️⃣ Integrasi Discord Kenegaraan Balai Kota: Tautan resmi (https://discord.gg/THy6fzJvsw) langsung terhubung di portal aparatur negara'
    ],
    removedOrAdjusted: [
      'Pembersihan passcode dan tautan donasi yang tidak perlu pada portal dinas',
      'Penghapusan tombol modifikasi pengumuman atasan dari halaman login publik demi sterilisasi keamanan'
    ],
    improvements: [
      'Desain antarmuka gelap responsif yang sinkron antara laptop dan perangkat ponsel',
      'Penyempurnaan performa pencarian pasal dan 10-codes secara instan'
    ],
    bugFixes: [
      'Perbaikan kendala alur mode coming soon agar seluruh portal dapat diakses normal'
    ],
    extraNotes: 'Pembaruan ini telah aktif dan dapat langsung digunakan oleh seluruh personel, aparat pemerintah, dan warga.',
    mentionRole: 'none',
    authorName: 'HSPD High Command',
    authorBadge: 'DEV-001',
    authorRank: 'Chief of Police'
  },
  {
    version: 'v4.2.6',
    releaseDate: '25 Oktober 2026',
    title: 'Pembaruan Sistem MDT HSPD - Modul Perhitungan Bonus Operasional 6 Kategori Prestasi Dinas',
    headerText: '[ PEMBERITAHUAN RESMI PEMBARUAN SISTEM MDT HSPD v4.2.6 ]',
    customDescription: 'Sistem operasional MDT HSPD telah ditingkatkan ke versi v4.2.6. Menghadirkan modul kalkulator dan pusat perhitungan bonus prestasi dinas operasional lengkap untuk 6 kategori resmi: Kasus Penindakan, Pemasukan Efiden, Pemasukan Tilang, Pemasukan Impound, Sukses Perestokan Persenjataan, dan Peleburan Senjata:',
    embedColorHex: '#F59E0B',
    embedColorInt: 0xF59E0B,
    newFeatures: [
      '1️⃣ Perhitungan Bonus Kasus Penindakan: Reward dasar flat per kasus BAP, persentase dari total denda pidana, serta bonus tambahan penanganan tersangka kooperatif',
      '2️⃣ Perhitungan Bonus Pemasukan Efiden: Insentif penyetoran barang bukti ke brankas/locker (foto BB sah, senpi ilegal disetor, narkotika per gram, dan persentase uang kas sitaan)',
      '3️⃣ Perhitungan Bonus Pemasukan Tilang: Insentif penegakan pelanggaran lalu lintas (komisi persentase denda tilang dan reward flat per lembar tiket tilang sah)',
      '4️⃣ Perhitungan Bonus Pemasukan Impound: Komisi derek dan penyitaan kendaraan pelanggar (persentase biaya impound dan reward flat per unit mobil/motor di-impound)',
      '5️⃣ Perhitungan Bonus Sukses Perestokan Persenjataan: Misi logistik pengadaan dan pengawalan senjata dinas, suplai peti amunisi, dan rompi balistik markas',
      '6️⃣ Perhitungan Bonus Peleburan Senjata: Nilai kompensasi scrap besi tua per pucuk senjata yang dimusnahkan di smelter serta insentif eksekutor Berita Acara resmi',
      'Mode Komputasi Fleksibel: Pilihan Tarik Otomatis Data Sistem (Auto-Sync dari berkas riil) atau Mode Simulasi Bebas (Interactive Calculator)',
      'Slip Berita Acara Bonus Resmi: Tampilan sertifikat slip berbingkai dinas lengkap dengan rincian per kategori, nomor rekening bank personel, dan tombol 1-click salin teks Discord / WhatsApp serta unduh gambar (PNG/JPEG)'
    ],
    removedOrAdjusted: [],
    improvements: [
      'Penyediaan tab navigasi "💰 Bonus Operasional" di bilah utama dan Android Mobile MDT Drawer',
      'Widget perkiraan bonus langsung tersemat di panel Kalkulator Pasal, Hub Tilang/Impound, Brankas, dan Peleburan',
      'Pusat pengaturan tarif reward dinas fleksibel untuk jajaran High Command'
    ],
    bugFixes: [
      'Sinkronisasi otomatis rekening bank anggota dari Roster ke slip klaim bonus dinas'
    ],
    extraNotes: 'Seluruh personel dapat membuka kalkulator bonus melalui menu navigasi atas atau tombol pintas di menu operasional.',
    mentionRole: 'none',
    authorName: 'HSPD High Command',
    authorBadge: 'HQ-01',
    authorRank: 'Chief of Police'
  },
  {
    version: 'v4.2.5',
    releaseDate: '1 Oktober 2026',
    title: 'Pembaruan Sistem MDT HSPD - Modul Absensi Manual Mingguan Atasan & Tombol Kontrol On/Off Duty Roster',
    headerText: '[ PEMBERITAHUAN RESMI PEMBARUAN & PENYEMPURNAAN SISTEM MDT HSPD v4.2.5 ]',
    customDescription: 'Sistem operasional MDT HSPD telah ditingkatkan ke versi v4.2.5. Pembaruan ini menghadirkan Modul Rekap Absensi Manual Mingguan untuk Atasan dengan ikon resmi dinas lengkap (✅ Hadir, ❌ Absen, 📝 Izin, 🤒 Sakit, 🌴 Cuti, ⚪ Off/Libur) yang otomatis berganti mengikuti tanggal dan minggu seterusnya, serta tombol khusus Force On/Off Duty di tabel roster anggota untuk menertibkan anggota yang sering lupa off-duty:',
    embedColorHex: '#10B981',
    embedColorInt: 0x10B981,
    newFeatures: [
      'Modul Absensi Manual Mingguan Atasan: Tabel rekap absensi lengkap 7 hari (Senin - Minggu) per anggota dengan indikator ikon resmi ✅ Hadir, ❌ Absen, 📝 Izin, 🤒 Sakit, 🌴 Cuti, ⚪ Off/Libur',
      'Rotasi Tanggal Mingguan Otomatis & Berkelanjutan: Kalender mingguan otomatis berganti dinamis mengikuti hari dan minggu berjalan, serta kontrol navigasi minggu lalu, minggu ini, dan minggu berikutnya',
      'Tombol Cepat Force On / Off Duty untuk Atasan: Tombol langsung di kolom Status Dinas tabel roster ([🔴 Paksa OFF DUTY] & [🟢 Nyalakan ON DUTY]) dan menu Tindakan High Command untuk menertibkan petugas yang lupa off-duty',
      'Dialog Konfirmasi Aman & Bebas Iframe Freeze: Prosedur konfirmasi dinas via modal UI modern berperingatan jelas tanpa menggunakan popup browser yang rentan macet',
      'Pusat Audit & Sinkronisasi Real-Time: Perubahan absensi manual dan status dinas otomatis tersimpan permanen di penyimpanan lokal serta disinkronkan ke Firestore Cloud dan log audit sistem'
    ],
    removedOrAdjusted: [
      'Pembersihan Redundansi Alert & Confirm: Menghilangkan alert/confirm bawaan browser demi kenyamanan antarmuka bebas freeze'
    ],
    improvements: [
      'Penyelarasan hak akses atasan dan High Command untuk pembaharuan absensi serta kontrol dinas',
      'Optimalisasi tampilan tabel absensi dinas mingguan di layar desktop dan mobile',
      'Fitur filter divisi dan pencarian cepat anggota pada lembar absensi'
    ],
    bugFixes: [
      'Solusi tuntas bagi anggota yang sering lupa mematikan status dinas (10-7) saat selesai bertugas',
      'Mencegah duplikasi data absensi mingguan pada pergantian tanggal antar-periode'
    ],
    extraNotes: 'Atasan dan Perwira Komando dapat mengakses absensi melalui tab "Absensi Manual (Atasan)" di menu Roster.',
    mentionRole: 'none',
    authorName: 'HSPD High Command',
    authorBadge: 'HQ-01',
    authorRank: 'Chief of Police'
  },
  {
    version: 'v4.2.4',
    releaseDate: '29 September 2026',
    title: 'Pembaruan Sistem MDT HSPD - Integrasi Rekening Bank Dinas di Roster & Live Broadcast System Console',
    headerText: '[ PEMBERITAHUAN RESMI PEMBARUAN & PENYEMPURNAAN SISTEM MDT HSPD v4.2.4 ]',
    customDescription: 'Sistem operasional MDT HSPD telah diperbarui ke versi v4.2.4. Pembaruan ini mengintegrasikan nomor rekening bank dinas untuk penggajian dan verifikasi resmi seluruh personel kepolisian & balai kota, pengamanan ketat hak akses berkas perkara 7 divisi resmi kepolisian, serta penyempurnaan konsol live update pemberitahuan sistem pengembang secara real-time:',
    embedColorHex: '#00A8FF',
    embedColorInt: 0x00A8FF,
    newFeatures: [
      'Integrasi Kolom Nomor Rekening Bank di Seluruh Roster: Mendukung BCA, Mandiri, BRI, BNI dll pada pendaftaran anggota baru, formulir edit, serta kartu profil',
      'Fitur 1-Click Copy Rekening & Pencarian Cepat Anggota lewat Nomor Rekening',
      'Isolasi Hak Akses 7 Divisi Resmi Kepolisian: Setiap personel hanya dapat membuka berkas kasus milik divisinya sendiri dengan penjagaan privasi ketat',
      'Core Developer Live Update System Console: Dilengkapi ticker siaran sistem live real-time, audio alert chime, push banner berjalan, serta pengiriman instan ke Discord Webhook'
    ],
    removedOrAdjusted: [],
    improvements: [
      'Peningkatan enkripsi isolasi berkas perkara antar-divisi kepolisian',
      'Optimalisasi performa pemfilteran dan pencarian anggota di perangkat mobile dan desktop',
      'Sinkronisasi instan Firestore Cloud Realtime untuk seluruh siaran maklumat sistem'
    ],
    bugFixes: [
      'Perbaikan formulir tambah anggota Balai Kota yang sebelumnya belum menyertakan kolom nomor rekening bank',
      'Penyempurnaan validasi karakter pada input nomor rekening perbankan'
    ],
    extraNotes: '',
    mentionRole: 'none',
    authorName: 'HSPD High Command',
    authorBadge: 'DEV-001',
    authorRank: 'Chief of Police'
  },
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
