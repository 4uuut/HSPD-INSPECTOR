import { OfficialDocument } from '../types';

// Helper to create clean in-game styled placeholder photos
const createPlaceholderBadgeDataUrl = (title: string, subtitle: string, color: string, iconType: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a0f1d"/>
        <stop offset="50%" stop-color="#111827"/>
        <stop offset="100%" stop-color="#030712"/>
      </linearGradient>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1f2937" stroke-width="0.75" opacity="0.6"/>
      </pattern>
    </defs>
    <rect width="640" height="400" fill="url(#bg)"/>
    <rect width="640" height="400" fill="url(#grid)"/>
    <rect x="20" y="20" width="600" height="360" rx="12" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="6,4" opacity="0.8"/>
    
    <!-- Top Bar -->
    <rect x="30" y="30" width="580" height="45" rx="6" fill="#1e293b" opacity="0.8"/>
    <circle cx="55" cy="52" r="10" fill="${color}" opacity="0.3"/>
    <text x="75" y="57" fill="#f8fafc" font-family="monospace" font-size="14" font-weight="bold">HIGHSTATE GOVERNMENT &amp; HSPD EVIDENCE ARCHIVE</text>
    <text x="580" y="57" fill="${color}" font-family="monospace" font-size="12" text-anchor="end" font-weight="bold">VERIFIED 10-8</text>
    
    <!-- Center Content -->
    <rect x="180" y="100" width="280" height="170" rx="8" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
    <circle cx="320" cy="160" r="32" fill="${color}" opacity="0.2"/>
    <text x="320" y="168" fill="${color}" font-family="sans-serif" font-size="24" text-anchor="middle" font-weight="bold">${iconType}</text>
    <text x="320" y="220" fill="#e2e8f0" font-family="monospace" font-size="14" text-anchor="middle" font-weight="bold">${title}</text>
    <text x="320" y="245" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">${subtitle}</text>
    
    <!-- Watermark / Footer -->
    <text x="320" y="315" fill="#64748b" font-family="monospace" font-size="11" text-anchor="middle">NOMOR BERKAS DOKUMEN SAH • TEREGISTRASI RESMI</text>
    <text x="320" y="335" fill="#475569" font-family="monospace" font-size="9" text-anchor="middle">Los Santos Public Service Digital Gateway Security System</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const INITIAL_REGISTERED_CITIZEN_DOCS: OfficialDocument[] = [
  // 1. SKCK PERMOHONAN RESMI (DENGAN 2 FOTO: /STATS & KTP)
  {
    id: 'seed-skck-franklin-001',
    docNumber: 'SKCK/HSPD-INTEL/IX/2026/0941',
    category: 'SKCK',
    classification: 'BIASA',
    title: 'SURAT KETERANGAN CATATAN KEPOLISIAN (SKCK)',
    subject: 'Surat Keterangan Bersih dari Rekam Jejak Tindak Pidana Kriminal',
    date: '14 September 2026',
    validUntil: '6 (Enam) Bulan Sejak Tanggal Diterbitkan',
    location: 'Pelayanan Publik Markas Besar Kepolisian HSPD',
    
    issuerName: 'Amy Santiago',
    issuerBadge: '#215',
    issuerRank: 'POLICE OFFICER II [PO II]',
    issuerRole: 'Petugas Pelayanan Publik & Rekam Kriminalitas',
    
    recipientName: 'Franklin Clinton',
    recipientId: 'CID-99214002',
    recipientPhone: '555-0142',
    recipientRoleOrStatus: 'Warga Pemohon SKCK Resmi',
    recipientAddress: 'Strawberry Ave, South Los Santos',
    
    createdAt: Date.now() - 3600000 * 4,
    updatedAt: Date.now() - 3600000 * 4,
    
    openingText: 'Menerangkan bahwa berdasarkan penelusuran basis data Sistem Informasi Catatan Kriminalitas (CAD/MDT Database) Markas Besar Kepolisian HSPD, warga dengan identitas di bawah ini:',
    clauses: [
      {
        id: 'sk1',
        clauseNumber: 'Poin 1',
        title: 'HASIL PENGECEKAN CATATAN KRIMINAL',
        content: 'Yang bersangkutan TIDAK PERNAH tersangkut perkara pidana berat, tindak terorisme, peredaran narkotika, atau kejahatan bersenjata yang berkekuatan hukum tetap.'
      },
      {
        id: 'sk2',
        clauseNumber: 'Poin 2',
        title: 'STATUS TILANG & PELANGGARAN RINGAN',
        content: 'Tidak memiliki tunggakan denda tilang lalu lintas atau surat panggilan persidangan pengadilan yang masih aktif.'
      },
      {
        id: 'sk3',
        clauseNumber: 'Poin 3',
        title: 'TUJUAN PENGGUNAAN SURAT',
        content: 'Surat Keterangan ini diterbitkan secara khusus atas permohonan yang bersangkutan untuk keperluan: PERSYARATAN PENDAFTARAN CALON ANGGOTA KEPOLISIAN HSPD.'
      }
    ],
    closingText: 'Demikian Surat Keterangan Catatan Kepolisian ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.',
    notes: 'SKCK ini sah berkekuatan hukum dan telah diverifikasi bebas catatan kriminalitas.',
    primarySeal: 'HSPD_OFFICIAL',
    secondarySeal: 'APPROVED_PASSED',
    showWatermark: true,
    showQrVerification: true,
    showIssuerSignature: true,
    
    // Signatures
    officerSignatureName: 'Amy Santiago',
    officerSignatureRank: 'POLICE OFFICER II [PO II]',
    officerSignatureBadge: '#215',
    officerSignatureTitle: 'Petugas Pelaksana & Pemeriksa Berkas Resmi',
    officerSignatureStatus: 'SIGNED',
    officerSignedAt: Date.now() - 3600000 * 3,
    
    highOfficialSignatureName: 'Jackie Xianlao',
    highOfficialSignatureRank: 'CHIEF OF POLICE [COP]',
    highOfficialSignatureBadge: '#001',
    highOfficialSignatureTitle: 'Kepala Kepolisian Negara HighState',
    highOfficialSignatureStatus: 'SIGNED',
    highOfficialSignedAt: Date.now() - 3600000 * 2,
    
    documentStatus: 'APPROVED',
    documentVerificationNotes: 'Lolos verifikasi CAD/MDT, rekam jejak bersih, berkas lengkap.',

    // 2 Mandatory attached photos
    skckPhotos: {
      statsPhoto: createPlaceholderBadgeDataUrl('LAMPIRAN FOTO /STATS', 'Franklin Clinton • Status IC Aktif Clean', '#38bdf8', '📊'),
      ktpPhoto: createPlaceholderBadgeDataUrl('FOTO KTP WARGA (CID)', 'CID-99214002 • Franklin Clinton', '#60a5fa', '🪪')
    },
    
    issuerSignatureTitle: 'Petugas Pemeriksa Rekam Jejak,',
    issuerSignatureStyle: 'formal',
    recipientSignatureTitle: 'Pemohon SKCK,',
    recipientSignatureName: 'Franklin Clinton',
    recipientSignatureStyle: 'handwriting1'
  },

  // 2. SURAT IZIN USAHA RESMI (DENGAN 4 FOTO: DEPAN TOKO, /BIZ INFO, PROPERTI, KTP)
  {
    id: 'seed-biz-customs-002',
    docNumber: 'SIU/GOV-BIZ/2026/0418',
    category: 'IZIN_USAHA',
    classification: 'BIASA',
    title: 'SURAT IZIN OPERASIONAL BADAN USAHA & KOMERSIAL (NIB)',
    subject: 'Izin Operasional Usaha: Los Santos Customs & Workshop',
    date: '12 September 2026',
    validUntil: '1 (Satu) Tahun Sejak Diterbitkan',
    location: 'Kantor Otoritas Perizinan Terpadu HighState',
    
    issuerName: 'Terry Jeffords',
    issuerBadge: '#301',
    issuerRank: 'COMMANDER [CDR]',
    issuerRole: 'Kepala Bagian Verifikasi Lapangan & Usaha',
    
    recipientName: 'Michael De Santa',
    recipientId: 'CID-84920401',
    recipientPhone: '555-0143',
    recipientRoleOrStatus: 'Direktur Utama / Pemilik Usaha',
    recipientAddress: 'Burton Ave, Rockford Hills, Los Santos',
    
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 1,
    
    openingText: 'Berdasarkan pemeriksaan kelengkapan berkas fisik, lokasi usaha, dan kesesuaian zonasi tata ruang, DIBERIKAN IZIN USAHA RESMI KEPADA:',
    clauses: [
      {
        id: 'b1',
        clauseNumber: 'Pasal 1',
        title: 'NAMA & BIDANG OPERASIONAL',
        content: 'Diberikan izin operasional kepada "Los Santos Customs & Workshop" untuk bergerak pada sektor Bengkel Modifikasi Otomotif, Perawatan Kendaraan & Suku Cadang.'
      },
      {
        id: 'b2',
        clauseNumber: 'Pasal 2',
        title: 'STANDAR KEAMANAN & KETERTIBAN',
        content: 'Pengelola usaha wajib memasang CCTV di area depan dan kasir, menjaga kebersihan lingkungan publik, serta tidak memperjualbelikan barang ilegal atau suku cadang curian.'
      },
      {
        id: 'b3',
        clauseNumber: 'Pasal 3',
        title: 'KEWAJIBAN RETRIBUSI & PAJAK DAERAH',
        content: 'Badan usaha tunduk pada ketentuan perpajakan wilayah HighState dan wajib membayar retribusi izin usaha secara periodik.'
      }
    ],
    closingText: 'Surat Izin Usaha ini sah berkekuatan hukum dan wajib dipajang pada tempat usaha yang mudah terlihat.',
    notes: 'Izin berlaku selama 1 tahun dan dapat diperpanjang sesuai evaluasi ketertiban.',
    primarySeal: 'PRESIDENTIAL_SEAL',
    secondarySeal: 'APPROVED_PASSED',
    showWatermark: true,
    showQrVerification: true,
    showIssuerSignature: true,
    
    // Signatures
    officerSignatureName: 'Terry Jeffords',
    officerSignatureRank: 'COMMANDER [CDR]',
    officerSignatureBadge: '#301',
    officerSignatureTitle: 'Petugas Pelaksana & Verifikator Usaha',
    officerSignatureStatus: 'SIGNED',
    officerSignedAt: Date.now() - 86400000 * 2,
    
    highOfficialSignatureName: 'Momo Hatakeyama',
    highOfficialSignatureRank: 'PRESIDENT [RANK 6]',
    highOfficialSignatureBadge: '#GOV-01',
    highOfficialSignatureTitle: 'Presiden & Kepala Otoritas Perizinan Negara',
    highOfficialSignatureStatus: 'SIGNED',
    highOfficialSignedAt: Date.now() - 86400000 * 1,
    
    documentStatus: 'APPROVED',
    documentVerificationNotes: '4 berkas foto usaha terverifikasi sah. Zonasi sesuai peruntukan.',

    // 4 Attached business photos
    businessPhotos: {
      shopFrontPhoto: createPlaceholderBadgeDataUrl('FOTO DEPAN TOKO', 'Los Santos Customs Fasad & Plang Usaha', '#f59e0b', '🏪'),
      businessInfoPhoto: createPlaceholderBadgeDataUrl('MENU /BUSINESS INFO', 'Panel Sistem Kepemilikan Bisnis In-Game', '#fbbf24', '📋'),
      businessPropertyPhoto: createPlaceholderBadgeDataUrl('FOTO PROPERTI USAHA', 'Area Bengkel, Interior & Fasilitas Pelayanan', '#d97706', '🏢'),
      ktpPhoto: createPlaceholderBadgeDataUrl('FOTO KTP PEMILIK', 'CID-84920401 • Michael De Santa', '#f59e0b', '🪪')
    },
    
    issuerSignatureTitle: 'Pejabat Verifikator,',
    issuerSignatureStyle: 'formal',
    recipientSignatureTitle: 'Pemilik Usaha / Penanggung Jawab,',
    recipientSignatureName: 'Michael De Santa',
    recipientSignatureStyle: 'handwriting1'
  },

  // 3. SURAT IZIN SENJATA API SIPIL (WCL)
  {
    id: 'seed-wcl-trevor-003',
    docNumber: 'WCL/HSPD-LIC/2026/0724',
    category: 'IZIN_SENJATA',
    classification: 'TERBATAS',
    title: 'SURAT IZIN KEPEMILIKAN SENJATA API (WEAPON CARRY LICENSE)',
    subject: 'Lisensi Resmi Kepemilikan Senjata Api Perlindungan Diri',
    date: '10 September 2026',
    validUntil: '1 (Satu) Tahun Sejak Tanggal Terbit',
    location: 'Markas Besar Kepolisian HSPD, Divisi Lisensi Senjata Api',
    
    issuerName: 'Raymond Holt',
    issuerBadge: '#401',
    issuerRank: 'CAPTAIN [CPT]',
    issuerRole: 'Kepala Divisi Pengawasan Senjata Api & Amunisi',
    
    recipientName: 'Trevor Philips',
    recipientId: 'CID-77192841',
    recipientPhone: '555-0199',
    recipientRoleOrStatus: 'Warga Pemohon Lisensi WCL',
    recipientAddress: 'Zancudo Ave, Sandy Shores, HighState',
    
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 3,
    
    openingText: 'Berdasarkan hasil uji psikologi, uji ketangkasan menembak resmi di Shooting Range HSPD, dan rekam jejak kriminalitas bersih:',
    clauses: [
      {
        id: 'w1',
        clauseNumber: 'Pasal 1',
        title: 'TIPE & KALIBER SENJATA',
        content: 'Izin diberikan khusus untuk 1 (satu) unit Senjata Api Handgun Combat Pistol 9mm No. Seri: HSPD-WEP-7819.'
      },
      {
        id: 'w2',
        clauseNumber: 'Pasal 2',
        title: 'BATASAN PENGGUNAAN',
        content: 'Senjata hanya untuk pertahanan diri dari ancaman maut. Dilarang dipamerkan di ruang publik atau dipinjamkan kepada orang lain.'
      }
    ],
    closingText: 'Surat izin ini sah berkekuatan hukum di seluruh wilayah hukum HighState.',
    notes: 'Wajib membawa fisik surat izin ini saat membawa senjata.',
    primarySeal: 'HSPD_OFFICIAL',
    secondarySeal: 'APPROVED_PASSED',
    showWatermark: true,
    showQrVerification: true,
    showIssuerSignature: true,
    
    officerSignatureName: 'Raymond Holt',
    officerSignatureRank: 'CAPTAIN [CPT]',
    officerSignatureBadge: '#401',
    officerSignatureTitle: 'Petugas Pelaksana & Penguji Senjata Api',
    officerSignatureStatus: 'SIGNED',
    officerSignedAt: Date.now() - 86400000 * 4,
    
    highOfficialSignatureName: 'Jackie Xianlao',
    highOfficialSignatureRank: 'CHIEF OF POLICE [COP]',
    highOfficialSignatureBadge: '#001',
    highOfficialSignatureTitle: 'Kepala Kepolisian Negara HighState',
    highOfficialSignatureStatus: 'SIGNED',
    highOfficialSignedAt: Date.now() - 86400000 * 3,
    
    documentStatus: 'APPROVED',
    documentVerificationNotes: 'Lulus tes psikologi dan sertifikasi menembak kategori A.',
    
    issuerSignatureTitle: 'Penguji Senjata Api,',
    issuerSignatureStyle: 'formal',
    recipientSignatureTitle: 'Pemegang Lisensi,',
    recipientSignatureName: 'Trevor Philips',
    recipientSignatureStyle: 'handwriting1'
  }
];
