import { OfficialDocument, DocumentCategory, SealType } from '../types';

export interface DocumentTemplatePreset {
  id: string;
  category: DocumentCategory;
  name: string;
  badgeLabel: string;
  description: string;
  defaultDoc: Omit<OfficialDocument, 'id' | 'createdAt' | 'updatedAt'>;
}

export const DOCUMENT_PRESET_TEMPLATES: DocumentTemplatePreset[] = [
  // 1. SURAT PERINTAH TUGAS OPERASI KHUSUS
  {
    id: 'tpl-surat-tugas-operasi',
    category: 'SURAT_TUGAS',
    name: 'Surat Perintah Tugas / Operasi Khusus',
    badgeLabel: 'SP TUGAS / WARRANT',
    description: 'Surat tugas resmi pengerahan personel untuk operasi penggerebekan, razia lalu lintas, atau pengamanan VVIP.',
    defaultDoc: {
      docNumber: `SP-TUGAS/HSPD-OPS/VIII/${new Date().getFullYear()}/042`,
      category: 'SURAT_TUGAS',
      classification: 'RAHASIA',
      title: 'SURAT PERINTAH OPERASI PENEGAKAN HUKUM',
      subject: 'Pengerahan Personel Gabungan Dalam Rangka Operasi Taktis Khusus Kepolisian',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      validUntil: 'Hingga Seluruh Rangkaian Operasi Selesai',
      location: 'Markas Besar HSPD, Mission Row, Los Santos',
      issuerName: 'Raymond Holt',
      issuerBadge: '#401',
      issuerRank: 'CAPTAIN [CPT]',
      issuerRole: 'Kepala Biro Operasional & Patroli Taktis',
      recipientName: 'Tim Satuan Tugas Lapangan (Satgas Gabungan CID & Patrol)',
      recipientId: 'SATGAS-OPS-09',
      recipientRoleOrStatus: 'Personel Satgas Operasi Taktis',
      recipientAddress: 'Wilayah Hukum Kota Los Santos & Sekitarnya',
      openingText: 'Berdasarkan Laporan Intelijen Kepolisian dan Surat Penetapan Pimpinan Markas Besar Kepolisian HSPD, dengan ini Kepala Bagian Operasional MEMERINTAHKAN kepada personel yang ditugaskan:',
      clauses: [
        {
          id: 'c1',
          clauseNumber: 'Pasal 1',
          title: 'DASAR OPERASIONAL',
          content: 'Melaksanakan penindakan hukum tegas, razia terpadu, dan penggeledahan terhadap lokasi terduga sindikat peredaran barang ilegal / tindak pidana berisiko tinggi sesuai Standar Operasional Prosedur (SOP).'
        },
        {
          id: 'c2',
          clauseNumber: 'Pasal 2',
          title: 'WEWENANG LAPANGAN',
          content: 'Diberikan wewenang penuh untuk melakukan sterilisasi area, pemeriksaan identitas (Frisk & ID Check), penahanan sementara terhadap pihak mencurigakan, dan penyitaan barang bukti terkait tindak kejahatan.'
        },
        {
          id: 'c3',
          clauseNumber: 'Pasal 3',
          title: 'HAK PERLINDUNGAN & PENGGUNAAN SENJATA',
          content: 'Penggunaan senjata api taktis hanya dibenarkan dalam kondisi darurat ancaman mematikan (Deadly Force Authorization) sesuai regulasi Rules of Engagement (ROE) HSPD.'
        },
        {
          id: 'c4',
          clauseNumber: 'Pasal 4',
          title: 'PELAPORAN & AKUNTABILITAS',
          content: 'Membuat Berita Acara Penindakan dan menyerahkan seluruh tersangka beserta barang bukti sitaan ke Markas Besar HSPD selambat-lambatnya 1x24 jam pasca-operasi.'
        }
      ],
      closingText: 'Surat perintah ini diterbitkan untuk dilaksanakan dengan penuh rasa tanggung jawab, integritas, dan disiplin tinggi oleh seluruh personel yang bertugas.',
      notes: 'Dilarang keras menyebarluaskan isi surat perintah rahasia ini kepada pihak luar tanpa izin pimpinan.',
      primarySeal: 'HSPD_OFFICIAL',
      secondarySeal: 'CONFIDENTIAL',
      showWatermark: true,
      showQrVerification: true,
      issuerSignatureTitle: 'Pemberi Perintah / Komandan Operasi,',
      issuerSignatureStyle: 'formal',
      recipientSignatureTitle: 'Komandan Regu Satgas / Penerima Tugas,',
      recipientSignatureName: 'Jake Peralta (#204)',
      recipientSignatureStyle: 'handwriting1',
      acknowledgedByTitle: 'Mengetahui & Menyetujui,',
      acknowledgedByName: 'Leoarnd Neave',
      acknowledgedByRank: 'CHIEF OF POLICE [COP]',
      acknowledgedByRole: 'Kepala Kepolisian HighState'
    }
  },

  // 2. SURAT IZIN SENJATA API SIPIL (WCL / CCW)
  {
    id: 'tpl-izin-senjata-wcl',
    category: 'IZIN_SENJATA',
    name: 'Surat Izin Kepemilikan Senjata Api (WCL)',
    badgeLabel: 'WEAPON CARRY LICENSE',
    description: 'Lisensi resmi kepemilikan dan hak membawa senjata api perlindungan diri bagi warga sipil yang telah lolos uji.',
    defaultDoc: {
      docNumber: `WCL/HSPD-LIC/${new Date().getFullYear()}/0884`,
      category: 'IZIN_SENJATA',
      classification: 'TERBATAS',
      title: 'SURAT IZIN KEPEMILIKAN & MEMBAWA SENJATA API (WCL)',
      subject: 'Lisensi Resmi Kepemilikan Senjata Api Kategori Bela Diri Warga Sipil',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      validUntil: '1 (Satu) Tahun Sejak Tanggal Diterbitkan',
      location: 'Markas Besar HSPD, Divisi Perizinan Senjata Api',
      issuerName: 'Terry Jeffords',
      issuerBadge: '#302',
      issuerRank: 'SERGEANT [SGT]',
      issuerRole: 'Kepala Seksi Perizinan & Sertifikasi Senjata Api Sipil',
      recipientName: 'Michael De Santa',
      recipientId: 'CID-78921445',
      recipientPhone: '555-0143',
      recipientRoleOrStatus: 'Warga Sipil Pemegang Izin Resmi',
      recipientAddress: 'Portola Dr, Rockford Hills, Los Santos',
      openingText: 'Setelah melalui tahapan verifikasi berkas, tes psikologi, uji kemahiran menembak di Shooting Range Kepolisian, dan evaluasi rekam jejak kriminal (SKCK Bersih), Markas Besar HSPD DENGAN INI MEMBERIKAN IZIN kepada:',
      clauses: [
        {
          id: 'c1',
          clauseNumber: 'Ketentuan 1',
          title: 'SPESIFIKASI SENJATA RESMI',
          content: 'Izin ini hanya berlaku untuk 1 (satu) unit Senjata Api Handgun / Combat Pistol 9mm dengan Nomor Seri Pabrik Terdaftar: WEP-9MM-449102.'
        },
        {
          id: 'c2',
          clauseNumber: 'Ketentuan 2',
          title: 'HAK & BATASAN PENGGUNAAN',
          content: 'Senjata api ini semata-mata digunakan untuk perlindungan diri yang sah (Self-Defense) dari ancaman jiwa. Dilarang keras dipinjamkan, dialihkan, atau dipamerkan di ruang publik (Brandishing).'
        },
        {
          id: 'c3',
          clauseNumber: 'Ketentuan 3',
          title: 'KEWAJIBAN PEMBAWA LISENSI',
          content: 'Wajib membawa fisik Surat Izin Senjata (WCL) ini setiap saat saat membawa senjata, dan wajib kooperatif menunjukkan lisensi ini apabila dihentikan petugas kepolisian (Traffic Stop / Frisk).'
        },
        {
          id: 'c4',
          clauseNumber: 'Ketentuan 4',
          title: 'PENCABUTAN SEPIHAK',
          content: 'Izin ini gugur secara otomatis dan senjata akan disita tanpa ganti rugi apabila pemegang izin terlibat tindak kriminalitas, penyalahgunaan alkohol/narkoba, atau penembakan tanpa ancaman sah.'
        }
      ],
      closingText: 'Surat Izin Kepemilikan Senjata Api ini sah dan berkekuatan hukum di seluruh wilayah yurisdiksi HighState.',
      notes: 'Lisensi ini wajib diperpanjang sebelum masa berlaku 1 tahun habis.',
      primarySeal: 'TRAFFIC_TEU',
      secondarySeal: 'APPROVED_PASSED',
      showWatermark: true,
      showQrVerification: true,
      issuerSignatureTitle: 'Pejabat Penerbit Perizinan,',
      issuerSignatureStyle: 'handwriting2',
      recipientSignatureTitle: 'Pemegang Izin / Pemohon,',
      recipientSignatureName: 'Michael De Santa',
      recipientSignatureStyle: 'handwriting1',
      acknowledgedByTitle: 'Mengesahkan / Chief of Police,',
      acknowledgedByName: 'Leoarnd Neave',
      acknowledgedByRank: 'CHIEF OF POLICE [COP]',
      acknowledgedByRole: 'Kepala Kepolisian HighState'
    }
  },

  // 3. SKCK (SURAT KETERANGAN CATATAN KEPOLISIAN)
  {
    id: 'tpl-skck-resmi',
    category: 'SKCK',
    name: 'Surat Keterangan Catatan Kepolisian (SKCK)',
    badgeLabel: 'POLICE CLEARANCE / SKCK',
    description: 'Surat resmi rekam jejak kriminal warga sipil untuk keperluan lamaran kerja kedinasan, izin usaha, atau administrasi.',
    defaultDoc: {
      docNumber: `SKCK/HSPD-INTEL/VIII/${new Date().getFullYear()}/0219`,
      category: 'SKCK',
      classification: 'BIASA',
      title: 'SURAT KETERANGAN CATATAN KEPOLISIAN (SKCK)',
      subject: 'Surat Keterangan Bersih dari Rekam Jejak Tindak Pidana Kriminal',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      validUntil: '6 (Enam) Bulan Sejak Tanggal Diterbitkan',
      location: 'Pelayanan Publik Markas Besar Kepolisian HSPD',
      issuerName: 'Amy Santiago',
      issuerBadge: '#215',
      issuerRank: 'POLICE OFFICER II [PO II]',
      issuerRole: 'Petugas Pelayanan Publik & Rekam Kriminalitas',
      recipientName: 'Franklin Clinton',
      recipientId: 'CID-99214002',
      recipientPhone: '555-0182',
      recipientRoleOrStatus: 'Warga Pemohon SKCK',
      recipientAddress: 'Strawberry Ave, South Los Santos',
      openingText: 'Menerangkan bahwa berdasarkan penelusuran basis data Sistem Informasi Catatan Kriminalitas (CAD/MDT Database) Markas Besar Kepolisian HSPD, warga dengan identitas di bawah ini:',
      clauses: [
        {
          id: 'c1',
          clauseNumber: 'Poin 1',
          title: 'HASIL PENGECEKAN CATATAN KRIMINAL',
          content: 'Yang bersangkutan TIDAK PERNAH tersangkut perkara pidana berat, tindak terorisme, peredaran narkotika, atau kejahatan bersenjata yang berkekuatan hukum tetap.'
        },
        {
          id: 'c2',
          clauseNumber: 'Poin 2',
          title: 'STATUS TILANG & PELANGGARAN RINGAN',
          content: 'Tidak memiliki tunggakan denda tilang lalu lintas atau surat panggilan persidangan pengadilan yang masih aktif.'
        },
        {
          id: 'c3',
          clauseNumber: 'Poin 3',
          title: 'TUJUAN PENGGUNAAN SURAT',
          content: 'Surat Keterangan ini diterbitkan secara khusus atas permohonan yang bersangkutan untuk keperluan: PERSYARATAN ADMINISTRASI PEKERJAAN KEDINASAN / SWASTA RESMI.'
        }
      ],
      closingText: 'Demikian Surat Keterangan Catatan Kepolisian ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.',
      notes: 'SKCK ini tidak berlaku jika terdapat perubahan identitas atau putusan pengadilan baru.',
      primarySeal: 'HSPD_OFFICIAL',
      secondarySeal: 'APPROVED_PASSED',
      showWatermark: true,
      showQrVerification: true,
      issuerSignatureTitle: 'Petugas Verifikator Rekam Jejak,',
      issuerSignatureStyle: 'formal',
      recipientSignatureTitle: 'Pemohon SKCK,',
      recipientSignatureName: 'Franklin Clinton',
      recipientSignatureStyle: 'handwriting1',
      acknowledgedByTitle: 'Kepala Seksi Intelijen & Catatan Kriminal,',
      acknowledgedByName: 'Raymond Holt',
      acknowledgedByRank: 'CAPTAIN [CPT]',
      acknowledgedByRole: 'Head of Bureau of Records'
    }
  },

  // 4. SURAT PERINGATAN & DISIPLIN INTERNAL (SP1 / SP2 / SP3)
  {
    id: 'tpl-surat-peringatan-sp',
    category: 'SURAT_PERINGATAN',
    name: 'Surat Peringatan Disiplin (SP1 / SP2 / SP3)',
    badgeLabel: 'DISCIPLINARY STRIKE / SP',
    description: 'Surat teguran keras resmi dari High Command / Internal Affairs Division (IAD) bagi personel kepolisian yang melanggar SOP.',
    defaultDoc: {
      docNumber: `SP-DISIPLIN/HSPD-IAD/VIII/${new Date().getFullYear()}/003`,
      category: 'SURAT_PERINGATAN',
      classification: 'RAHASIA',
      title: 'SURAT KEPUTUSAN HUKUMAN DISIPLIN (SURAT PERINGATAN)',
      subject: 'Penjatuhan Sanksi Disiplin Internal Pelanggaran Standar Operasional Prosedur (SOP)',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      validUntil: 'Tercatat Permanen dalam Berkas Personel',
      location: 'Divisi Propam & Internal Affairs (IAD) HSPD',
      issuerName: 'Raymond Holt',
      issuerBadge: '#401',
      issuerRank: 'CAPTAIN [CPT]',
      issuerRole: 'Ketua Majelis Sidang Disiplin Personel',
      recipientName: 'John Miller',
      recipientId: '#105',
      recipientRoleOrStatus: 'POLICE OFFICER I [PO I] - Patrol Division',
      recipientAddress: 'Mission Row Police Headquarters',
      openingText: 'Setelah menelaah rekaman bodycam, laporan saksi, dan hasil investigasi Internal Affairs Division (IAD) terkait dugaan pelanggaran etik dan kedisiplinan dinas, DITETAPKAN KEPUTUSAN DISIPLIN:',
      clauses: [
        {
          id: 'c1',
          clauseNumber: 'Pasal 1',
          title: 'JENIS PELANGGARAN',
          content: 'Terbukti melakukan pelanggaran SOP: Lalai dalam mengisi Berkas Berita Acara Penangkapan & Mengabaikan Panggilan Radio Darurat 10-99.'
        },
        {
          id: 'c2',
          clauseNumber: 'Pasal 2',
          title: 'TINGKAT HUKUMAN (STRIKE)',
          content: 'Diberikan sanksi SURAT PERINGATAN KE-1 (SP1 / STRIKE 1 DARI MAKSIMAL 3 SP).'
        },
        {
          id: 'c3',
          clauseNumber: 'Pasal 3',
          title: 'SANKSI TAMBAHAN',
          content: 'Skorsing wewenang mengemudikan kendaraan patroli kecepatan tinggi selama 3 (tiga) shift kerja dan wajib mengikuti pembinaan etika profesi.'
        },
        {
          id: 'c4',
          clauseNumber: 'Pasal 4',
          title: 'KONSEKUENSI LANJUTAN',
          content: 'Apabila yang bersangkutan mengulangi pelanggaran serupa hingga mencapai akumulasi 3 SP, maka akan dijatuhkan sanksi PEMBERHENTIAN TIDAK DENGAN HORMAT (DISHONORABLE DISCHARGE).'
        }
      ],
      closingText: 'Keputusan ini berlaku sejak tanggal ditetapkan dan wajib ditaati sepenuhnya demi menjaga marwah korps kepolisian.',
      notes: 'Personel yang bersangkutan berhak mengajukan banding internal dalam kurun waktu 48 jam.',
      primarySeal: 'INTERNAL_AFFAIRS',
      secondarySeal: 'CONFIDENTIAL',
      showWatermark: true,
      showQrVerification: true,
      issuerSignatureTitle: 'Ketua Divisi Internal Affairs (IAD),',
      issuerSignatureStyle: 'formal',
      recipientSignatureTitle: 'Personel Yang Dijatuhi Sanksi,',
      recipientSignatureName: 'John Miller (#105)',
      recipientSignatureStyle: 'handwriting1',
      acknowledgedByTitle: 'Chief of Police / Pimpinan Tertinggi,',
      acknowledgedByName: 'Leoarnd Neave',
      acknowledgedByRank: 'CHIEF OF POLICE [COP]',
      acknowledgedByRole: 'Kepala Kepolisian HighState'
    }
  },

  // 5. SK KENAIKAN PANGKAT & MUTASI (PROMOTION DECREE)
  {
    id: 'tpl-sk-promosi-pangkat',
    category: 'SK_PROMOSI',
    name: 'SK Kenaikan Pangkat & Mutasi Personel',
    badgeLabel: 'PROMOTION DECREE / SK',
    description: 'Surat keputusan resmi kenaikan pangkat (misal Cadet ke PO, PO ke SGT) atau penugasan divisi baru ditandatangani Pimpinan.',
    defaultDoc: {
      docNumber: `SK-PROMOSI/HSPD-HC/VIII/${new Date().getFullYear()}/015`,
      category: 'SK_PROMOSI',
      classification: 'BIASA',
      title: 'SURAT KEPUTUSAN PENGANGKATAN KENAIKAN PANGKAT & PENUGASAN',
      subject: 'Kenaikan Pangkat Personel atas Prestasi, Disiplin, dan Loyalitas Penegakan Hukum',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      validUntil: 'Berlaku Seterusnya',
      location: 'Markas Besar Kepolisian HSPD, Executive Office',
      issuerName: 'Leoarnd Neave',
      issuerBadge: '#001',
      issuerRank: 'CHIEF OF POLICE [COP]',
      issuerRole: 'Kepala Kepolisian HighState (Chief of Police)',
      recipientName: 'Amy Santiago',
      recipientId: '#215',
      recipientRoleOrStatus: 'POLICE OFFICER II [PO II] -> POLICE OFFICER III [PO III]',
      recipientAddress: 'Patrol Supervisory & Field Training Bureau',
      openingText: 'Menimbang dedikasi, rekam jejak tanpa pelanggaran disiplin (0/3 SP), jam terbang dinas patroli yang tinggi, serta kelulusan uji kompetensi kepemimpinan lapangan, DENGAN INI MEMUTUSKAN:',
      clauses: [
        {
          id: 'c1',
          clauseNumber: 'Pasal 1',
          title: 'PENGANGKATAN PANGKAT BARU',
          content: 'Menaikkan pangkat dari POLICE OFFICER II [PO II] menjadi POLICE OFFICER III [PO III] terhitung mulai tanggal ditetapkannya keputusan ini.'
        },
        {
          id: 'c2',
          clauseNumber: 'Pasal 2',
          title: 'WEWENANG SUPERVISOR LAPANGAN',
          content: 'Diberikan hak bertindak sebagai Field Training Officer (FTO) untuk membimbing dan menguji para Cadet serta memimpin formasi patroli lapangan.'
        },
        {
          id: 'c3',
          clauseNumber: 'Pasal 3',
          title: 'HAK & FASILITAS DINAS',
          content: 'Berhak atas akses persenjataan tingkat lanjut, otorisasi armada kendaraan interceptor, serta tunjangan dinas kepangkatan sesuai regulasi anggaran kepolisian.'
        }
      ],
      closingText: 'Semoga amanah dan tanggung jawab yang diberikan dapat diemban dengan penuh kebanggaan demi melayani dan mengayomi masyarakat.',
      notes: 'Salinan SK ini diarsipkan ke buku induk personalia Markas Besar Kepolisian.',
      primarySeal: 'HIGH_COMMAND',
      secondarySeal: 'HSPD_OFFICIAL',
      showWatermark: true,
      showQrVerification: true,
      issuerSignatureTitle: 'Chief of Police / Pimpinan Tertinggi,',
      issuerSignatureStyle: 'formal',
      recipientSignatureTitle: 'Personel Yang Menerima Promosi,',
      recipientSignatureName: 'Amy Santiago (#215)',
      recipientSignatureStyle: 'handwriting2',
      acknowledgedByTitle: 'Wakil Kepala Kepolisian (Assistant Chief),',
      acknowledgedByName: 'High Command Board',
      acknowledgedByRank: 'ASSISTANT CHIEF [A/C]',
      acknowledgedByRole: 'Head of Personnel & Human Resources'
    }
  },

  // 6. SURAT IZIN KERAMAIAN & PENUTUPAN JALAN
  {
    id: 'tpl-izin-keramaian-event',
    category: 'IZIN_KERAMAIAN',
    name: 'Surat Izin Keramaian & Rekayasa Lalin',
    badgeLabel: 'PUBLIC EVENT & ROAD PERMIT',
    description: 'Surat perizinan resmi penyelenggaraan acara publik, konser musik, parade komunitas, atau penutupan jalan sementara.',
    defaultDoc: {
      docNumber: `IZIN-EVENT/HSPD-TEU/VIII/${new Date().getFullYear()}/077`,
      category: 'IZIN_KERAMAIAN',
      classification: 'BIASA',
      title: 'SURAT IZIN PENYELENGGARAAN ACARA PUBLIK & PENUTUPAN JALAN',
      subject: 'Izin Keramaian Massa dan Pengalihan Arus Lalu Lintas Sementara',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      validUntil: 'Hingga Acara Selesai (Maks 1x24 Jam)',
      location: 'Satuan Lalu Lintas (Traffic Enforcement Unit) HSPD',
      issuerName: 'Terry Jeffords',
      issuerBadge: '#302',
      issuerRank: 'SERGEANT [SGT]',
      issuerRole: 'Komandan Divisi Lalu Lintas & Rekayasa Jalan',
      recipientName: 'Los Santos Car Meet Community',
      recipientId: 'EVENT-LSCM-2026',
      recipientPhone: '555-0811',
      recipientRoleOrStatus: 'Ketua Panitia Penyelenggara',
      recipientAddress: 'Legion Square & Vinewood Boulevard',
      openingText: 'Menanggapi surat permohonan izin keramaian yang diajukan oleh pihak penyelenggara acara, Kepolisian HSPD memberikan IZIN PENYELENGGARAAN dengan syarat dan ketentuan mengikat:',
      clauses: [
        {
          id: 'c1',
          clauseNumber: 'Poin 1',
          title: 'WAKTU & LOKASI KEGIATAN',
          content: 'Kegiatan diizinkan berlangsung pada tanggal yang telah ditentukan, bertempat di area Legion Square mulai pukul 19.00 WIB hingga 23.30 WIB.'
        },
        {
          id: 'c2',
          clauseNumber: 'Poin 2',
          title: 'REKAYASA ARUS LALU LINTAS',
          content: 'Jalur sisi utara Legion Square ditutup sementara untuk parkir display kendaraan. Pengalihan arus lalu lintas dikawal langsung oleh personel Traffic Enforcement Unit (TEU).'
        },
        {
          id: 'c3',
          clauseNumber: 'Poin 3',
          title: 'LARANGAN KERAS',
          content: 'Dilarang keras menyalakan kembang api tanpa izin khusus, membawa senjata api tanpa lisensi WCL, mengonsumsi minuman keras/narkoba di luar area terdaftar, atau melakukan balap liar di jalan umum.'
        },
        {
          id: 'c4',
          clauseNumber: 'Poin 4',
          title: 'PEMBATALAN SEPIHAK OLEH POLISI',
          content: 'Petugas kepolisian berhak membubarkan acara secara paksa apabila terjadi kerusuhan, perkelahian massal, atau pelanggaran hukum yang membahayakan ketertiban umum.'
        }
      ],
      closingText: 'Demikian surat izin ini diterbitkan untuk dipergunakan sebagaimana mestinya dan wajib dipatuhi seluruh peserta acara.',
      notes: 'Panitia wajib berkoordinasi dengan petugas patroli terdekat selama acara berlangsung.',
      primarySeal: 'TRAFFIC_TEU',
      secondarySeal: 'APPROVED_PASSED',
      showWatermark: true,
      showQrVerification: true,
      issuerSignatureTitle: 'Kepala Divisi Lalu Lintas HSPD,',
      issuerSignatureStyle: 'formal',
      recipientSignatureTitle: 'Ketua Panitia / Penanggung Jawab,',
      recipientSignatureName: 'Ketua Panitia Acara',
      recipientSignatureStyle: 'handwriting1',
      acknowledgedByTitle: 'Mengetahui / Komandan Lapangan,',
      acknowledgedByName: 'Raymond Holt',
      acknowledgedByRank: 'CAPTAIN [CPT]',
      acknowledgedByRole: 'Head of Operations'
    }
  },

  // 7. BERITA ACARA INTEROGASI (BAP INTERROGATION)
  {
    id: 'tpl-bap-interogasi-tersangka',
    category: 'BAP_INTEROGASI',
    name: 'Berita Acara Interogasi / Pengakuan (BAP)',
    badgeLabel: 'BAP INTERROGATION RECORD',
    description: 'Berita Acara Pemeriksaan (BAP) interogasi tersangka, saksi mahkota, pernyataan pengakuan di ruang interogasi CID.',
    defaultDoc: {
      docNumber: `BAP-INT/HSPD-CID/VIII/${new Date().getFullYear()}/063`,
      category: 'BAP_INTEROGASI',
      classification: 'RAHASIA',
      title: 'BERITA ACARA PEMERIKSAAN & INTEROGASI TERSANGKA',
      subject: 'Pemeriksaan Perkara Dugaan Tindak Pidana Perampokan Bersenjata & Kepemilikan Barang Ilegal',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      validUntil: 'Tersimpan dalam Berkas Perkara Pengadilan',
      location: 'Ruang Interogasi No. 2, Detective Bureau CID, Mission Row HQ',
      issuerName: 'Jake Peralta',
      issuerBadge: '#204',
      issuerRank: 'POLICE OFFICER III [PO III]',
      issuerRole: 'Penyidik Kriminal / Lead Detective CID',
      recipientName: 'Trevor Philips',
      recipientId: 'CID-55109288',
      recipientRoleOrStatus: 'Tersangka Tindak Pidana Berat',
      recipientAddress: 'Sandy Shores, Blaine County',
      openingText: 'Pada hari ini, bertempat di Ruang Interogasi CID Markas Besar Kepolisian HSPD, telah dilakukan interogasi verbal dan rekaman audio-visual terhadap tersangka setelah Hak Miranda dibacakan:',
      clauses: [
        {
          id: 'c1',
          clauseNumber: 'Pertanyaan 1',
          title: 'PEMBACAAN HAK & KONDISI TERSANGKA',
          content: 'Penyidik telah membacakan Hak Miranda secara utuh. Tersangka menyatakan dalam kondisi sehat jasmani rohani dan bersedia memberikan keterangan tanpa paksaan.'
        },
        {
          id: 'c2',
          clauseNumber: 'Pertanyaan 2',
          title: 'KRONOLOGI & PERAN DALAM KEJAHATAN',
          content: 'Tersangka mengakui keberadaannya di lokasi Bank Fleeca saat insiden perampokan terjadi dan mengakui membawa senjata laras panjang ilegal jenis Compact Rifle.'
        },
        {
          id: 'c3',
          clauseNumber: 'Pertanyaan 3',
          title: 'KETERANGAN ALIRAN BARANG BUKTI',
          content: 'Tersangka memberikan informasi terkait gudang penyimpanan kendaraan hasil curian di wilayah El Burro Heights sebagai bentuk sikap kooperatif dalam penyelidikan.'
        },
        {
          id: 'c4',
          clauseNumber: 'Pertanyaan 4',
          title: 'PASAL SANGKAAN PIDANA',
          content: 'Tersangka disangkakan melanggar Pasal B-01 (Perampokan Bersenjata), Pasal C-02 (Kepemilikan Senjata Berat Ilegal), dan Pasal F-04 (Penolakan Perintah Petugas).'
        }
      ],
      closingText: 'Demikian Berita Acara Interogasi ini dibuat dengan sebenar-benarnya dan ditandatangani bersama oleh tersangka dan penyidik.',
      notes: 'Dilampirkan salinan rekaman rekaman kamera interogasi dan daftar barang bukti sitaan.',
      primarySeal: 'CID_DETECTIVE',
      secondarySeal: 'CONFIDENTIAL',
      showWatermark: true,
      showQrVerification: true,
      issuerSignatureTitle: 'Penyidik / Lead Detective,',
      issuerSignatureStyle: 'formal',
      recipientSignatureTitle: 'Tersangka Yang Diperiksa,',
      recipientSignatureName: 'Trevor Philips',
      recipientSignatureStyle: 'handwriting2',
      acknowledgedByTitle: 'Kepala Divisi Kriminal / CID Commander,',
      acknowledgedByName: 'Raymond Holt',
      acknowledgedByRank: 'CAPTAIN [CPT]',
      acknowledgedByRole: 'Head of Detective Bureau'
    }
  },

  // 8. SURAT PENJAMINAN & PELEPASAN BERSYARAT (BAIL AGREEMENT)
  {
    id: 'tpl-surat-jaminan-bail',
    category: 'SURAT_JAMINAN_BAIL',
    name: 'Surat Penjaminan & Pelepasan Bersyarat (Bail)',
    badgeLabel: 'BAIL & CONDITIONAL RELEASE',
    description: 'Surat perjanjian pelepasan bersyarat tahanan dengan jaminan uang atau jaminan pihak penjamin dengan kewajiban wajib lapor.',
    defaultDoc: {
      docNumber: `BAIL-AGR/HSPD-LEGAL/VIII/${new Date().getFullYear()}/011`,
      category: 'SURAT_JAMINAN_BAIL',
      classification: 'TERBATAS',
      title: 'SURAT PERJANJIAN PENJAMINAN & PELEPASAN BERSYARAT (BAIL AGREEMENT)',
      subject: 'Penangguhan Penahanan Sementara dengan Jaminan Finansial & Wajib Lapor',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      validUntil: 'Hingga Sidang Pengadilan Menjatuhkan Putusan',
      location: 'Markas Besar Kepolisian HSPD, Biro Hukum & Penahanan',
      issuerName: 'Terry Jeffords',
      issuerBadge: '#302',
      issuerRank: 'SERGEANT [SGT]',
      issuerRole: 'Kepala Seksi Penahanan & Pengawasan Tahanan',
      recipientName: 'Amanda De Santa (Pihak Penjamin)',
      recipientId: 'CID-11029344',
      recipientPhone: '555-0992',
      recipientRoleOrStatus: 'Pihak Penjamin Sah / Keluarga',
      recipientAddress: 'Rockford Hills, Los Santos',
      openingText: 'Berdasarkan permohonan penangguhan penahanan dan pembayaran uang jaminan (Bail Bond) sebesar $25,000 yang disetorkan ke Kas Negara Kepolisian, DILAKUKAN PELEPASAN BERSYARAT KEPADA TAHANAN:',
      clauses: [
        {
          id: 'c1',
          clauseNumber: 'Klausul 1',
          title: 'IDENTITAS TAHANAN YANG DIBEBASKAN',
          content: 'Nama Tahanan: Jimmy De Santa (CID: 441029), perkara pelanggaran lalu lintas berat dan kepemilikan zat terlarang tanpa kekerasan.'
        },
        {
          id: 'c2',
          clauseNumber: 'Klausul 2',
          title: 'KEWAJIBAN WAJIB LAPOR',
          content: 'Tahanan wajib melapor ke Markas Besar HSPD setiap hari Senin dan Kamis pukul 10.00 WIB hingga tanggal persidangan pengadilan dimulai.'
        },
        {
          id: 'c3',
          clauseNumber: 'Klausul 3',
          title: 'LARANGAN MENINGGALKAN WILAYAH KOTA',
          content: 'Dilarang keras bepergian ke luar wilayah yurisdiksi Los Santos, dilarang mendekati saksi perkara, dan dilarang membawa senjata apa pun.'
        },
        {
          id: 'c4',
          clauseNumber: 'Klausul 4',
          title: 'KONSEKUENSI PELANGGARAN JAMINAN',
          content: 'Apabila tahanan melarikan diri atau mangkir panggilan, uang jaminan $25,000 disita penuh oleh negara dan status dinaikkan menjadi DPO / BOLO Penangkapan Segera.'
        }
      ],
      closingText: 'Surat perjanjian ini ditandatangani atas kesadaran penuh kedua belah pihak tanpa ada paksaan dari pihak mana pun.',
      notes: 'Kwitansi bukti setor uang jaminan resmi terlampir pada dokumen ini.',
      primarySeal: 'HSPD_OFFICIAL',
      secondarySeal: 'APPROVED_PASSED',
      showWatermark: true,
      showQrVerification: true,
      issuerSignatureTitle: 'Petugas Pengawas Penahanan HSPD,',
      issuerSignatureStyle: 'formal',
      recipientSignatureTitle: 'Pihak Penjamin / Kuasa Hukum,',
      recipientSignatureName: 'Amanda De Santa',
      recipientSignatureStyle: 'handwriting1',
      acknowledgedByTitle: 'Kepala Bagian Operasional Penindakan,',
      acknowledgedByName: 'Raymond Holt',
      acknowledgedByRank: 'CAPTAIN [CPT]',
      acknowledgedByRole: 'Head of Bureau'
    }
  },

  // 9. SURAT KETERANGAN KEHILANGAN (POLICE LOSS REPORT)
  {
    id: 'tpl-surat-kehilangan-barang',
    category: 'SURAT_KEHILANGAN',
    name: 'Surat Tanda Penerimaan Laporan Kehilangan',
    badgeLabel: 'POLICE LOSS REPORT',
    description: 'Surat resmi penerimaan laporan kehilangan kendaraan, dompet, surat berharga, atau senjata untuk klaim asuransi / instansi.',
    defaultDoc: {
      docNumber: `SKTLK/HSPD-SPKT/VIII/${new Date().getFullYear()}/0481`,
      category: 'SURAT_KEHILANGAN',
      classification: 'BIASA',
      title: 'SURAT TANDA PENERIMAAN LAPORAN KEHILANGAN (STPLK)',
      subject: 'Surat Tanda Penerimaan Laporan Kehilangan 1 (Satu) Unit Kendaraan Bermotor',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      validUntil: '14 (Empat Belas) Hari Sejak Tanggal Diterbitkan',
      location: 'Sentra Pelayanan Kepolisian Terpadu (SPKT) HSPD',
      issuerName: 'Charles Boyle',
      issuerBadge: '#220',
      issuerRank: 'POLICE OFFICER II [PO II]',
      issuerRole: 'Petugas Piket Pelayanan SPKT',
      recipientName: 'Lamar Davis',
      recipientId: 'CID-22910443',
      recipientPhone: '555-0174',
      recipientRoleOrStatus: 'Warga Pelapor',
      recipientAddress: 'Forum Dr, Chamberlains Hills, Los Santos',
      openingText: 'Menerangkan bahwa pada hari dan tanggal tersebut di atas, telah datang ke kantor Sentra Pelayanan Kepolisian Terpadu (SPKT) seorang warga yang melaporkan kehilangan:',
      clauses: [
        {
          id: 'c1',
          clauseNumber: 'Poin 1',
          title: 'RINCIAN BARANG / KENDARAAN HILANG',
          content: '1 (Satu) Unit Mobil Sedan Sport, Merk: Karin Sultan RS, Warna: Hitam Metalik, Nomor Plat Polisi: 88LSC91, Nomor Rangka (VIN): VIN-99021481.'
        },
        {
          id: 'c2',
          clauseNumber: 'Poin 2',
          title: 'TEMPAT & PERKIRAAN WAKTU KEJADIAN',
          content: 'Hilang di area parkir umum Del Perro Pier pada pukul 03.30 WIB dini hari akibat dugaan pencurian kendaraan bermotor (Grand Theft Auto).'
        },
        {
          id: 'c3',
          clauseNumber: 'Poin 3',
          title: 'FUNGSI & KEGUNAAN SURAT',
          content: 'Surat ini diterbitkan sebagai bukti sah pelaporan kepolisian guna pengajuan klaim asuransi kendaraan dan penerbitan BOLO Pelacakan Satuan Patroli.'
        }
      ],
      closingText: 'Surat ini BUKAN pengganti identitas atau hak milik resmi, melainkan tanda bukti sah bahwa laporan telah diterima oleh Kepolisian HSPD.',
      notes: 'Apabila kendaraan ditemukan atau laporan palsu, pelapor wajib segera mengabari kepolisian.',
      primarySeal: 'HSPD_OFFICIAL',
      secondarySeal: 'TRAFFIC_TEU',
      showWatermark: true,
      showQrVerification: true,
      issuerSignatureTitle: 'Petugas Penerima Laporan SPKT,',
      issuerSignatureStyle: 'formal',
      recipientSignatureTitle: 'Warga Pelapor,',
      recipientSignatureName: 'Lamar Davis',
      recipientSignatureStyle: 'handwriting2',
      acknowledgedByTitle: 'Kepala Sentra Pelayanan Kepolisian,',
      acknowledgedByName: 'Terry Jeffords',
      acknowledgedByRank: 'SERGEANT [SGT]',
      acknowledgedByRole: 'Supervisor On Duty'
    }
  },

  // 10. SURAT PERINTAH PENGGELEDAHAN & PENYITAAN (SEARCH & SEIZURE)
  {
    id: 'tpl-surat-penyitaan-warrant',
    category: 'SURAT_PENYITAAN',
    name: 'Surat Perintah Penggeledahan & Penyitaan',
    badgeLabel: 'SEARCH & SEIZURE WARRANT',
    description: 'Surat perintah resmi penetapan penggeledahan properti/rumah aman dan penyitaan barang bukti tindak kriminal.',
    defaultDoc: {
      docNumber: `WARRANT-SEIZE/HSPD-CID/VIII/${new Date().getFullYear()}/028`,
      category: 'SURAT_PENYITAAN',
      classification: 'SANGAT RAHASIA',
      title: 'SURAT PENETAPAN PERINTAH PENGGELEDAHAN & PENYITAAN BARANG BUKTI',
      subject: 'Penyitaan Aset, Properti, Senjata Api, dan Zat Narkotika Terkait Jaringan Kejahatan',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      validUntil: '3x24 Jam Sejak Surat Diterbitkan',
      location: 'Markas Besar HSPD, Satuan Khusus Investigasi CID & SWAT',
      issuerName: 'Raymond Holt',
      issuerBadge: '#401',
      issuerRank: 'CAPTAIN [CPT]',
      issuerRole: 'Komandan Divisi Investigasi Kriminal (CID)',
      recipientName: 'Satuan Taktis Penindakan CID & SWAT Breaching Unit',
      recipientId: 'SWAT-CID-TASKFORCE',
      recipientRoleOrStatus: 'Tim Eksekutor Penggeledahan',
      recipientAddress: 'Lokasi Sasaran: Kompleks Pergudangan Bayside, Cypress Flats',
      openingText: 'Berdasarkan bukti permulaan yang cukup, rekaman intelijen drone kepolisian, dan surat penetapan pengadilan, DENGAN INI MEMERINTAHKAN KEPADA PENYIDIK KEPOLISIAN:',
      clauses: [
        {
          id: 'c1',
          clauseNumber: 'Pasal 1',
          title: 'TARGET SASARAN PENGGELEDAHAN',
          content: 'Melakukan penerobosan dan penggeledahan menyeluruh terhadap Gudang Logistik Blok C, Cypress Flats, terduga markas perakitan senjata ilegal.'
        },
        {
          id: 'c2',
          clauseNumber: 'Pasal 2',
          title: 'DAFTAR BARANG SITAAN RESMI',
          content: 'Menyita seluruh senjata api tanpa nomor seri, amunisi kaliber militer, narkotika, brankas uang tunai hasil kejahatan, dan perangkat komunikasi/elektronik di lokasi.'
        },
        {
          id: 'c3',
          clauseNumber: 'Pasal 3',
          title: 'RANTAI PENGAWALAN BARANG BUKTI (CHAIN OF CUSTODY)',
          content: 'Seluruh barang bukti yang disita wajib didokumentasikan, disegel dengan lak segel resmi kepolisian, dan dimasukkan ke Brankas Barang Bukti Terenkripsi HSPD.'
        }
      ],
      closingText: 'Surat perintah ini berlaku seketika dan wajib dijalankan dengan mengedepankan keselamatan petugas dan warga sekitar.',
      notes: 'Segala perlawanan bersenjata akan ditindak sesuai prosedur ancaman mematikan (Deadly Force).',
      primarySeal: 'CID_DETECTIVE',
      secondarySeal: 'CONFIDENTIAL',
      showWatermark: true,
      showQrVerification: true,
      issuerSignatureTitle: 'Pemberi Penetapan Perintah,',
      issuerSignatureStyle: 'formal',
      recipientSignatureTitle: 'Komandan Tim Eksekutor SWAT/CID,',
      recipientSignatureName: 'Jake Peralta (#204)',
      recipientSignatureStyle: 'handwriting1',
      acknowledgedByTitle: 'Chief of Police / Pimpinan Tertinggi,',
      acknowledgedByName: 'Leoarnd Neave',
      acknowledgedByRank: 'CHIEF OF POLICE [COP]',
      acknowledgedByRole: 'Kepala Kepolisian HighState'
    }
  },

  // 11. NOTA DINAS / PERINTAH HARIAN PIMPINAN (INTERNAL MEMO)
  {
    id: 'tpl-memo-internal-dinas',
    category: 'MEMO_INTERNAL',
    name: 'Nota Dinas / Memo Perintah Harian',
    badgeLabel: 'INTERNAL POLICE MEMO',
    description: 'Instruksi internal pimpinan markas kepada seluruh divisi mengenai siaga keamanan, patroli ekstra, atau pengumuman dinas.',
    defaultDoc: {
      docNumber: `MEMO-DIR/HSPD-HC/VIII/${new Date().getFullYear()}/099`,
      category: 'MEMO_INTERNAL',
      classification: 'TERBATAS',
      title: 'NOTA DINAS / INSTRUKSI OPERASIONAL HARIAN PIMPINAN',
      subject: 'Peningkatan Kesiapsiagaan Patroli dan Pengetatan Razia Senjata Ilegal Malam Hari',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      validUntil: 'Hingga Ada Pencabutan Resmi',
      location: 'Markas Besar Kepolisian HSPD, Seluruh Jajaran Divisi',
      issuerName: 'Leoarnd Neave',
      issuerBadge: '#001',
      issuerRank: 'CHIEF OF POLICE [COP]',
      issuerRole: 'Kepala Kepolisian HighState (Chief of Police)',
      recipientName: 'Seluruh Personel Kepolisian HSPD (Patrol, CID, TEU, SWAT, K-9)',
      recipientId: 'ALL-HSPD-OFFICERS',
      recipientRoleOrStatus: 'Seluruh Anggota On Duty',
      recipientAddress: 'Mission Row Police Station, Los Santos',
      openingText: 'Ditujukan kepada seluruh jajaran perwira, bintara, dan cadet kepolisian HighState Police Department (HSPD), berikut instruksi resmi pimpinan:',
      clauses: [
        {
          id: 'c1',
          clauseNumber: 'Instruksi 1',
          title: 'PENINGKATAN STATUS SIAGA (CODE ORANGE)',
          content: 'Menyusul meningkatnya tensi kejahatan jalanan, seluruh unit patroli diwajibkan berpasangan minimal 2 personel (Two-Man Unit) dalam 1 armada patroli.'
        },
        {
          id: 'c2',
          clauseNumber: 'Instruksi 2',
          title: 'PENGETATAN FRISK & TRAFFIC STOP',
          content: 'Lakukan pemeriksaan ketat terhadap kendaraan tanpa plat nomor, pengemudi dengan masker/balaclava, dan kendaraan yang melanggar batas kecepatan tinggi.'
        },
        {
          id: 'c3',
          clauseNumber: 'Instruksi 3',
          title: 'DISIPLIN LAPORAN MDT-CAD',
          content: 'Setiap penindakan wajib dicatat langsung ke dalam Kalkulator & Log Penangkapan CAD serta dilaporkan melalui frekuensi radio dispatch 10-8.'
        }
      ],
      closingText: 'Instruksi ini wajib dipedomani dan dilaksanakan dengan penuh integritas dan kewaspadaan tinggi. Selamat bertugas.',
      notes: 'Supervisor divisi wajib mengecek kesiapan perlengkapan rompi anti peluru seluruh anggotanya.',
      primarySeal: 'HIGH_COMMAND',
      secondarySeal: 'HSPD_OFFICIAL',
      showWatermark: true,
      showQrVerification: true,
      issuerSignatureTitle: 'Chief of Police / Pimpinan Markas,',
      issuerSignatureStyle: 'formal',
      recipientSignatureTitle: 'Perwakilan Supervisor Piket,',
      recipientSignatureName: 'Terry Jeffords (#302)',
      recipientSignatureStyle: 'handwriting2',
      acknowledgedByTitle: 'Kepala Staf Komando (Executive Office),',
      acknowledgedByName: 'Raymond Holt',
      acknowledgedByRank: 'CAPTAIN [CPT]',
      acknowledgedByRole: 'Chief of Staff'
    }
  },

  // 12. DOKUMEN BEBAS / CUSTOM BLANK TEMPLATE
  {
    id: 'tpl-custom-bebas-blank',
    category: 'CUSTOM_BEBAS',
    name: 'Dokumen Bebas / Custom Official Letter',
    badgeLabel: 'BLANK CUSTOM DOCUMENT',
    description: 'Format lembar surat resmi kepolisian kosong yang dapat Anda atur judul, isi klausul, nomor surat, stempel, dan tanda tangannya secara bebas.',
    defaultDoc: {
      docNumber: `SURAT-RESMI/HSPD/VIII/${new Date().getFullYear()}/001`,
      category: 'CUSTOM_BEBAS',
      classification: 'BIASA',
      title: 'SURAT RESMI KEPOLISIAN HIGHSTATE (HSPD)',
      subject: 'Perihal / Hal Mengenai Kepentingan Dinas Kepolisian',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      validUntil: 'Sesuai Ketentuan Yang Berlaku',
      location: 'Markas Besar Kepolisian HSPD, Mission Row, Los Santos',
      issuerName: 'Leoarnd Neave',
      issuerBadge: '#001',
      issuerRank: 'CHIEF OF POLICE [COP]',
      issuerRole: 'Pejabat Penerbit Surat',
      recipientName: 'Nama Penerima / Pihak Yang Dituju',
      recipientId: 'CID / NO IDENTITAS',
      recipientPhone: '555-0000',
      recipientRoleOrStatus: 'Status / Jabatan Penerima',
      recipientAddress: 'Alamat / Lokasi Yang Dituju',
      openingText: 'Dengan ini Markas Besar Kepolisian HighState Police Department (HSPD) menyampaikan pemberitahuan / penetapan resmi sebagai berikut:',
      clauses: [
        {
          id: 'c1',
          clauseNumber: 'Poin 1',
          title: 'KETENTUAN UTAMA',
          content: 'Tuliskan rincian isi ketentuan, dasar pertimbangan, atau poin ketetapan surat resmi di bagian ini sesuai kebutuhan roleplay kepolisian.'
        },
        {
          id: 'c2',
          clauseNumber: 'Poin 2',
          title: 'KLAUSUL TAMBAHAN',
          content: 'Tambahkan klausul tambahan, batas waktu, sanksi, atau instruksi operasional yang relevan dengan dokumen ini.'
        }
      ],
      closingText: 'Demikian surat resmi ini dibuat dengan sebenarnya untuk diketahui dan dipergunakan sebagaimana mestinya.',
      notes: 'Dokumen ini resmi dikeluarkan oleh Kepolisian HighState Police Department (HSPD).',
      primarySeal: 'HSPD_OFFICIAL',
      secondarySeal: 'HIGH_COMMAND',
      showWatermark: true,
      showQrVerification: true,
      issuerSignatureTitle: 'Pejabat Yang Mengeluarkan,',
      issuerSignatureStyle: 'formal',
      recipientSignatureTitle: 'Pihak Penerima Surat,',
      recipientSignatureName: 'Nama Penerima Surat',
      recipientSignatureStyle: 'handwriting1',
      acknowledgedByTitle: 'Mengetahui / Mengesahkan,',
      acknowledgedByName: 'Leoarnd Neave',
      acknowledgedByRank: 'CHIEF OF POLICE [COP]',
      acknowledgedByRole: 'Kepala Kepolisian HighState'
    }
  }
];
