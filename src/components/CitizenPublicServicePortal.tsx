import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileText, Shield, Building2, Search, CheckCircle2, AlertTriangle, 
  Printer, Download, Copy, Check, QrCode, ArrowRight, User, KeyRound, 
  Building, MapPin, Phone, Calendar, Briefcase, Stamp as StampIcon, 
  Sparkles, RefreshCw, X, ShieldAlert, Award, ChevronRight, Eye,
  ExternalLink, FileCheck, HelpCircle, BadgeCheck, Zap, DollarSign,
  Car, Lock, Coffee, Wrench, GlassWater, ShoppingBag, Truck, Crosshair,
  Camera, Upload, Image as ImageIcon, ZoomIn, Trash2, Maximize2, PenTool
} from 'lucide-react';
import { 
  OfficialDocument, 
  ArrestRecord, 
  CitizenProfile, 
  OfficerProfile,
  BoloAlert,
  TrafficCitationRecord,
  ImpoundRecord 
} from '../types';
import { 
  getGovernmentPermits, 
  addGovernmentPermit, 
  saveGovernmentPermits, 
  GovernmentPermit 
} from '../utils/governmentOperationsStorage';
import { 
  getSavedOfficialDocuments, 
  saveOfficialDocument,
  deleteOfficialDocument 
} from '../utils/documentStorage';
import { CitizenServiceSignatoryModal } from './CitizenServiceSignatoryModal';
import { CitizenServiceRegisteredBoard } from './CitizenServiceRegisteredBoard';
import { CitizenPublicLookupViews } from './CitizenPublicLookupViews';
import { isRank2OrAbove } from '../types';
import { getSavedCitizens } from '../utils/citizenDmvStorage';
import { getSavedBoloAlerts, getSavedImpounds } from '../utils/boloImpoundStorage';
import { getSavedTrafficCitations } from '../utils/trafficCitationStorage';
import { exportElementAsImage } from '../utils/exportDocumentAsImage';
import { processAndCompressImage } from '../utils/imageCompressor';
import { OfficialSeal } from './OfficialSeals';
import { HSPD_LOGO_URL } from '../assets/logo';
import { getCustomBranding } from '../utils/brandingStorage';

export type PortalTabType = 'registered' | 'skck' | 'business' | 'other' | 'wanted' | 'citations' | 'impounds' | 'verify';

interface Props {
  currentOfficer?: OfficerProfile | null;
  onBackToLogin?: () => void;
  initialTab?: PortalTabType;
}

export const CitizenPublicServicePortal: React.FC<Props> = ({
  currentOfficer,
  onBackToLogin,
  initialTab = 'skck'
}) => {
  const branding = getCustomBranding();
  const [activeTab, setActiveTab] = useState<PortalTabType>(
    currentOfficer ? 'registered' : initialTab
  );

  // Database States
  const [arrestRecords, setArrestRecords] = useState<ArrestRecord[]>([]);
  const [citizens, setCitizens] = useState<CitizenProfile[]>([]);
  const [boloList, setBoloList] = useState<BoloAlert[]>([]);
  const [citations, setCitations] = useState<TrafficCitationRecord[]>([]);
  const [impounds, setImpounds] = useState<ImpoundRecord[]>([]);
  const [govPermits, setGovPermits] = useState<GovernmentPermit[]>([]);
  const [officialDocs, setOfficialDocs] = useState<OfficialDocument[]>([]);

  // Feedback States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<OfficialDocument | null>(null);
  const [selectedSignatoryDoc, setSelectedSignatoryDoc] = useState<OfficialDocument | null>(null);

  // Load all databases from localStorage
  const loadDatabases = () => {
    try {
      const rawArrests = localStorage.getItem('hspd_arrest_records_v1');
      if (rawArrests) setArrestRecords(JSON.parse(rawArrests));
    } catch {}

    setCitizens(getSavedCitizens());
    setBoloList(getSavedBoloAlerts());
    setCitations(getSavedTrafficCitations());
    setImpounds(getSavedImpounds());
    setGovPermits(getGovernmentPermits());
    setOfficialDocs(getSavedOfficialDocuments());
  };

  useEffect(() => {
    loadDatabases();

    const handleSync = () => loadDatabases();
    window.addEventListener('hspd-records-updated', handleSync);
    window.addEventListener('hspd-citizens-updated', handleSync);
    window.addEventListener('gov-permits-updated', handleSync);
    window.addEventListener('hspd-documents-updated', handleSync);
    window.addEventListener('hspd-impound-updated', handleSync);
    window.addEventListener('hspd-bolo-updated', handleSync);
    window.addEventListener('hspd-traffic-citations-updated', handleSync);

    return () => {
      window.removeEventListener('hspd-records-updated', handleSync);
      window.removeEventListener('hspd-citizens-updated', handleSync);
      window.removeEventListener('gov-permits-updated', handleSync);
      window.removeEventListener('hspd-documents-updated', handleSync);
      window.removeEventListener('hspd-impound-updated', handleSync);
      window.removeEventListener('hspd-bolo-updated', handleSync);
      window.removeEventListener('hspd-traffic-citations-updated', handleSync);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // TAB 1: SKCK ONLINE ENGINE
  // ---------------------------------------------------------------------------
  const [skckFullName, setSkckFullName] = useState('');
  const [skckNik, setSkckNik] = useState('');
  const [skckPob, setSkckPob] = useState('Los Santos');
  const [skckDob, setSkckDob] = useState('1998-05-12');
  const [skckGender, setSkckGender] = useState<'Laki-Laki' | 'Perempuan'>('Laki-Laki');
  const [skckOccupation, setSkckOccupation] = useState('Wiraswasta / Pegawai Swasta');
  const [skckAddress, setSkckAddress] = useState('Strawberry Ave, South Los Santos');
  const [skckPhone, setSkckPhone] = useState('555-0142');
  const [skckDiscord, setSkckDiscord] = useState('');
  const [skckPurpose, setSkckPurpose] = useState('Melamar Pekerjaan Swasta / BUMN');
  const [skckCustomPurpose, setSkckCustomPurpose] = useState('');
  const [isSubmittingSkck, setIsSubmittingSkck] = useState(false);
  const [skckSuccessDoc, setSkckSuccessDoc] = useState<OfficialDocument | null>(null);

  // Lightbox Modal for Zooming Photos
  const [lightboxItem, setLightboxItem] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // SKCK 2 Photo Uploads: Foto /stats & Foto KTP
  const [skckStatsPhoto, setSkckStatsPhoto] = useState<string>('');
  const [skckKtpPhoto, setSkckKtpPhoto] = useState<string>('');
  const [skckUploadLoading, setSkckUploadLoading] = useState<string | null>(null);

  // Business Permit 4 Photo Uploads: Depan Toko, Informasi Business, Properti Business, KTP Pemilik
  const [bizShopFrontPhoto, setBizShopFrontPhoto] = useState<string>('');
  const [bizInfoPhoto, setBizInfoPhoto] = useState<string>('');
  const [bizPropertyPhoto, setBizPropertyPhoto] = useState<string>('');
  const [bizKtpPhoto, setBizKtpPhoto] = useState<string>('');
  const [bizUploadLoading, setBizUploadLoading] = useState<string | null>(null);

  // Reusable Image Compression and Upload Handler
  const handleProcessImageUpload = async (
    file: File,
    setter: (dataUrl: string) => void,
    setLoading: (key: string | null) => void,
    loadingKey: string
  ) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Mohon unggah file gambar (format PNG, JPG, JPEG, atau WebP).');
      return;
    }
    setLoading(loadingKey);
    try {
      const res = await processAndCompressImage(file, 1400, 1400, 0.84);
      setter(res.dataUrl);
    } catch (err: any) {
      console.error('Gagal memproses gambar:', err);
      alert('Gagal memproses gambar: ' + (err.message || 'File tidak valid atau ukuran terlalu besar.'));
    } finally {
      setLoading(null);
    }
  };

  // Background check results for SKCK
  const skckBackgroundCheck = useMemo(() => {
    const qName = skckFullName.trim().toLowerCase();
    const qNik = skckNik.trim().toLowerCase();

    if (!qName && !qNik) {
      return { searched: false, clean: true, arrests: [], isBolo: false, unpaidCitations: 0 };
    }

    // Check arrests
    const matchedArrests = arrestRecords.filter(r => {
      const nameMatch = qName && r.suspectName.toLowerCase().includes(qName);
      const nikMatch = qNik && r.suspectId.toLowerCase().includes(qNik);
      return nameMatch || nikMatch;
    });

    // Check BOLO
    const isWanted = boloList.some(b => {
      if (b.status !== 'ACTIVE') return false;
      const bName = b.targetName.toLowerCase();
      const bId = (b.targetId || '').toLowerCase();
      return (qName && bName.includes(qName)) || (qNik && bId.includes(qNik));
    });

    // Check Citations
    const matchedCitations = citations.filter(c => {
      const vName = c.violatorName.toLowerCase();
      const vId = (c.violatorId || '').toLowerCase();
      return (qName && vName.includes(qName)) || (qNik && vId.includes(qNik));
    });

    return {
      searched: true,
      clean: matchedArrests.length === 0 && !isWanted,
      arrests: matchedArrests,
      isBolo: isWanted,
      unpaidCitations: matchedCitations.length
    };
  }, [skckFullName, skckNik, arrestRecords, boloList, citations]);

  const handleGenerateSkck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skckFullName.trim()) return;

    setIsSubmittingSkck(true);

    const year = new Date().getFullYear();
    const monthRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][new Date().getMonth()];
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const docNumber = `SKCK/HSPD-INTEL/${monthRoman}/${year}/${randCode}`;
    const dateFormatted = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Valid for 6 months
    const validDate = new Date();
    validDate.setMonth(validDate.getMonth() + 6);
    const validUntilStr = validDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ' (6 Bulan)';

    const finalPurpose = skckPurpose === 'Lainnya' ? (skckCustomPurpose.trim() || 'Keperluan Administrasi Resmi') : skckPurpose;

    const isClean = skckBackgroundCheck.clean;
    const clauseCriminalRecord = isClean
      ? 'Berdasarkan penelusuran basis data resmi Criminal CAD/MDT HighState Police Department, yang bersangkutan TIDAK MEMILIKI CATATAN KRIMINAL, TIDAK PERNAH DIHUKUM PENJARA, dan BUKAN MERUPAKAN DPO/BURONAN.'
      : `Berdasarkan penelusuran basis data resmi HSPD, terdapat riwayat penanganan hukum sebanyak ${skckBackgroundCheck.arrests.length} perkara. Yang bersangkutan telah menjalani sanksi dan saat ini berstatus kooperatif dalam pengawasan hukum.`;

    const newDoc: OfficialDocument = {
      id: `skck-${Date.now()}`,
      docNumber,
      category: 'SKCK',
      classification: 'BIASA',
      title: 'SURAT KETERANGAN CATATAN KEPOLISIAN (SKCK)',
      subject: 'Surat Keterangan Bersih Rekam Jejak Tindak Pidana Kriminal',
      date: dateFormatted,
      validUntil: validUntilStr,
      location: 'Markas Besar Kepolisian HSPD, Mission Row, Los Santos',
      issuerName: currentOfficer?.name || 'Amy Santiago',
      issuerBadge: currentOfficer?.badge || '#215',
      issuerRank: currentOfficer?.rank || 'POLICE OFFICER II [PO II]',
      issuerRole: 'Petugas Pelayanan Publik & Rekam Kriminalitas',
      recipientName: skckFullName.trim(),
      recipientId: skckNik.trim() || `CID-${Math.floor(10000000 + Math.random() * 90000000)}`,
      recipientPhone: skckPhone.trim() || '555-0100',
      recipientRoleOrStatus: 'Warga Pemohon SKCK',
      recipientAddress: skckAddress.trim() || 'Kota Los Santos, HighState',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      openingText: 'Menerangkan bahwa berdasarkan penelusuran menyeluruh pada Sistem Database Kriminalitas Terpadu (CAD/MDT Database) Markas Besar Kepolisian HSPD, warga dengan identitas di bawah ini:',
      clauses: [
        {
          id: 'c1',
          clauseNumber: 'Poin 1',
          title: 'HASIL PENGECEKAN CATATAN KRIMINALITAS',
          content: clauseCriminalRecord
        },
        {
          id: 'c2',
          clauseNumber: 'Poin 2',
          title: 'STATUS TILANG & PELANGGARAN LALU LINTAS',
          content: skckBackgroundCheck.unpaidCitations === 0
            ? 'Tidak memiliki tunggakan denda tilang lalu lintas dan mematuhi etika berkendara di jalan raya.'
            : `Tercatat memiliki riwayat tilang tertib lalu lintas sebanyak ${skckBackgroundCheck.unpaidCitations} kali yang telah diselesaikan.`
        },
        {
          id: 'c3',
          clauseNumber: 'Poin 3',
          title: 'TUJUAN & KEPERLUAN PENERBITAN SURAT',
          content: `Surat Keterangan Catatan Kepolisian ini diterbitkan secara sah dan resmi atas permohonan yang bersangkutan untuk keperluan: ${finalPurpose.toUpperCase()}.`
        },
        {
          id: 'c4',
          clauseNumber: 'Poin 4',
          title: 'KEPATUHAN HUKUM & KETENTUAN BERLAKU',
          content: 'Surat ini dinyatakan batal dan tidak berlaku lagi apabila di kemudian hari pemegang surat melakukan tindak kejahatan atau melanggar peraturan perundang-undangan negara.'
        }
      ],
      closingText: 'Demikian Surat Keterangan Catatan Kepolisian ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya oleh instansi berwenang.',
      notes: 'Dokumen ini memiliki kode keamanan digital resmi HSPD dan dapat diverifikasi keasliannya melalui portal publik.',
      primarySeal: 'HSPD_OFFICIAL',
      secondarySeal: isClean ? 'APPROVED_PASSED' : undefined,
      showWatermark: true,
      showQrVerification: true,
      showIssuerSignature: true,
      issuerSignatureTitle: 'Kepala Seksi Intelijen & Catatan Kriminal,',
      issuerSignatureName: currentOfficer?.name || 'Raymond Holt',
      issuerSignatureSubtitle: currentOfficer?.rank || 'CAPTAIN [CPT] [#401]',
      issuerSignatureStyle: 'formal',
      recipientSignatureTitle: 'Pemohon SKCK,',
      recipientSignatureName: skckFullName.trim(),
      recipientSignatureStyle: 'handwriting1',
      acknowledgedByTitle: 'Mengetahui, Kepala Kepolisian HighState',
      acknowledgedByName: 'Leoarnd Neave',
      acknowledgedByRank: 'CHIEF OF POLICE [COP]',
      acknowledgedByRole: 'Headquarters High Command',
      skckPhotos: {
        statsPhoto: skckStatsPhoto || undefined,
        ktpPhoto: skckKtpPhoto || undefined
      },
      attachments: [
        ...(skckStatsPhoto ? [{ id: 'att-stats', label: 'Foto /stats Karakter IC', imageUrl: skckStatsPhoto, uploadedAt: Date.now() }] : []),
        ...(skckKtpPhoto ? [{ id: 'att-ktp', label: 'Foto Identitas KTP Pemohon', imageUrl: skckKtpPhoto, uploadedAt: Date.now() }] : [])
      ]
    };

    saveOfficialDocument(newDoc);
    setOfficialDocs(getSavedOfficialDocuments());
    setSkckSuccessDoc(newDoc);
    setIsSubmittingSkck(false);
  };

  // ---------------------------------------------------------------------------
  // TAB 2: SURAT IZIN USAHA (SIU / NIB BISNIS PEMERINTAHAN)
  // ---------------------------------------------------------------------------
  const [bizName, setBizName] = useState('');
  const [bizOwnerName, setBizOwnerName] = useState('');
  const [bizOwnerNik, setBizOwnerNik] = useState('');
  const [bizCategory, setBizCategory] = useState<string>('Kuliner, Kafe & Restoran');
  const [bizLocation, setBizLocation] = useState('Vinewood Boulevard #104, Los Santos');
  const [bizScale, setBizScale] = useState('Usaha Kecil & Menengah (UKM)');
  const [bizPhone, setBizPhone] = useState('555-8821');
  const [bizCapital, setBizCapital] = useState('$50,000');
  const [bizEmployees, setBizEmployees] = useState('4');
  const [bizNotes, setBizNotes] = useState('Operasional pelayanan makanan & minuman higienis sesuai regulasi dinas kesehatan.');
  const [isSubmittingBiz, setIsSubmittingBiz] = useState(false);
  const [bizSuccessPermit, setBizSuccessPermit] = useState<GovernmentPermit | null>(null);
  const [bizSuccessDoc, setBizSuccessDoc] = useState<OfficialDocument | null>(null);

  const handleGenerateBusinessPermit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName.trim() || !bizOwnerName.trim()) return;

    setIsSubmittingBiz(true);

    const year = new Date().getFullYear();
    const randNum = Math.floor(100 + Math.random() * 900);
    const permitNumber = `BIZ/GOV-EXEC/${year}/${randNum}`;
    const dateFormatted = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // 1 Year validity
    const validUntilStr = `1 (Satu) Tahun - Hingga ${year + 1}`;

    // 1. Add to Government Operations Database
    const bizPhotosPayload = {
      shopFrontPhoto: bizShopFrontPhoto || undefined,
      businessInfoPhoto: bizInfoPhoto || undefined,
      businessPropertyPhoto: bizPropertyPhoto || undefined,
      ktpPhoto: bizKtpPhoto || undefined
    };

    const newPermit = addGovernmentPermit({
      permitNumber,
      category: 'BUSINESS',
      title: `Surat Izin Operasional Usaha: ${bizName.trim()}`,
      applicantName: bizOwnerName.trim(),
      applicantId: bizOwnerNik.trim() || `CID-${Math.floor(10000000 + Math.random() * 90000000)}`,
      applicantPhone: bizPhone.trim() || '555-0199',
      businessOrDetails: `${bizName.trim()} (${bizCategory} - Lokasi: ${bizLocation.trim()})`,
      purpose: `Izin Operasional Komersial & Legalitas Usaha di Wilayah Hukum Negara HighState. Skala: ${bizScale}.`,
      validUntil: validUntilStr,
      feeAmount: 35000,
      status: 'APPROVED',
      approvedBy: currentOfficer?.name || 'Momo Hatakeyama',
      approvedByRank: currentOfficer?.rank || 'PRESIDENT [RANK 6]',
      approvedAt: Date.now(),
      notes: `Telah memenuhi prasyarat regulasi tata ruang dan terdaftar dalam basis data perpajakan negara.`,
      photos: bizPhotosPayload,
      attachments: [
        ...(bizShopFrontPhoto ? [bizShopFrontPhoto] : []),
        ...(bizInfoPhoto ? [bizInfoPhoto] : []),
        ...(bizPropertyPhoto ? [bizPropertyPhoto] : []),
        ...(bizKtpPhoto ? [bizKtpPhoto] : [])
      ]
    });

    // 2. Also generate printable Official Document version
    const newDoc: OfficialDocument = {
      id: `bizdoc-${Date.now()}`,
      docNumber: permitNumber,
      category: 'IZIN_USAHA',
      classification: 'BIASA',
      title: 'SURAT IZIN USAHA & OPERASIONAL BISNIS KOMERSIAL',
      subject: `Pemberian Hak Operasional & Legalitas Usaha ${bizName.trim()}`,
      date: dateFormatted,
      validUntil: validUntilStr,
      location: 'Kantor Pelayanan Perizinan Terpadu, Balai Kota Los Santos',
      issuerName: currentOfficer?.name || 'Momo Hatakeyama',
      issuerBadge: currentOfficer?.badge || '#GOV-01',
      issuerRank: currentOfficer?.rank || 'PRESIDENT [RANK 6]',
      issuerRole: 'Presiden & Kepala Eksekutif Pemerintahan Negara HighState',
      recipientName: bizOwnerName.trim(),
      recipientId: bizOwnerNik.trim() || newPermit.applicantId,
      recipientPhone: bizPhone.trim(),
      recipientRoleOrStatus: `Pemilik / Penanggung Jawab Usaha (${bizName.trim()})`,
      recipientAddress: bizLocation.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      businessPhotos: bizPhotosPayload,
      attachments: [
        ...(bizShopFrontPhoto ? [{ id: 'att-shop', label: 'Foto Depan Toko / Fasad', imageUrl: bizShopFrontPhoto, uploadedAt: Date.now() }] : []),
        ...(bizInfoPhoto ? [{ id: 'att-info', label: 'Informasi Business (/business info)', imageUrl: bizInfoPhoto, uploadedAt: Date.now() }] : []),
        ...(bizPropertyPhoto ? [{ id: 'att-prop', label: 'Foto Properti & Area Usaha', imageUrl: bizPropertyPhoto, uploadedAt: Date.now() }] : []),
        ...(bizKtpPhoto ? [{ id: 'att-ktp', label: 'Foto KTP Pemilik Usaha', imageUrl: bizKtpPhoto, uploadedAt: Date.now() }] : [])
      ],
      openingText: 'Berdasarkan Undang-Undang Regulasi Komersial dan Penanaman Modal Negara HighState, Pemerintah Negara HighState DENGAN INI MENETAPKAN DAN MEMBERIKAN IZIN KEPADA:',
      clauses: [
        {
          id: 'c1',
          clauseNumber: 'Pasal 1',
          title: 'LEGALITAS ENTITAS BISNIS',
          content: `Entitas bisnis dengan nama "${bizName.trim()}" resmi diakui sebagai badan usaha berlisensi kategori "${bizCategory}" dengan alamat operasional di ${bizLocation.trim()}.`
        },
        {
          id: 'c2',
          clauseNumber: 'Pasal 2',
          title: 'HAK & KEWAJIBAN OPERASIONAL',
          content: 'Diberikan hak penuh untuk melayani transaksi komersial kepada masyarakat umum, mempekerjakan tenaga kerja berlisensi, dan memperoleh perlindungan kepastian berusaha dari aparatur penegak hukum.'
        },
        {
          id: 'c3',
          clauseNumber: 'Pasal 3',
          title: 'KEPATUHAN PAJAK & KETERTIBAN UMUM',
          content: 'Pengelola usaha wajib menyetorkan pajak komersial sesuai jadwal pembukuan kas negara, menjaga ketertiban di sekitar tempat usaha, serta melarang peredaran zat berbahaya tanpa izin di lokasi bisnis.'
        },
        {
          id: 'c4',
          clauseNumber: 'Pasal 4',
          title: 'SANKSI PELANGGARAN',
          content: 'Pelanggaran terhadap izin ini dapat berakibat pada denda administratif, pembekuan izin operasional sementara, hingga pencabutan izin permanen oleh otoritas pemerintahan.'
        }
      ],
      closingText: 'Surat Izin Usaha ini diterbitkan untuk ditaati dan dipatuhi oleh seluruh jajaran manajemen usaha.',
      notes: 'Wajib dipajang atau diperlihatkan saat dilakukan inspeksi rutin oleh Satuan Pengawas Pemerintahan atau Kepolisian HSPD.',
      primarySeal: 'PRESIDENTIAL_SEAL',
      secondarySeal: 'GOVERNMENT_SEAL',
      showWatermark: true,
      showQrVerification: true,
      showIssuerSignature: true,
      issuerSignatureTitle: 'Presiden Negara HighState / Otoritas Eksekutif,',
      issuerSignatureName: currentOfficer?.name || 'Momo Hatakeyama',
      issuerSignatureSubtitle: 'PRESIDENT [RANK 6]',
      issuerSignatureStyle: 'formal',
      recipientSignatureTitle: 'Pemilik / Penanggung Jawab Usaha,',
      recipientSignatureName: bizOwnerName.trim(),
      recipientSignatureStyle: 'handwriting1',
      acknowledgedByTitle: 'Menteri Perindustrian, Perdagangan & Investasi',
      acknowledgedByName: 'Sekretariat Negara',
      acknowledgedByRank: 'CABINET [RANK 3]',
      acknowledgedByRole: 'Badan Koordinasi Perizinan Terpadu'
    };

    saveOfficialDocument(newDoc);
    setGovPermits(getGovernmentPermits());
    setOfficialDocs(getSavedOfficialDocuments());
    setBizSuccessPermit(newPermit);
    setBizSuccessDoc(newDoc);
    setIsSubmittingBiz(false);
  };

  // ---------------------------------------------------------------------------
  // TAB 3: OTHER ESSENTIAL CITIZEN & GOVERNMENT PERMITS
  // ---------------------------------------------------------------------------
  const [otherServiceType, setOtherServiceType] = useState<'WCL' | 'STLK' | 'EVENT'>('WCL');
  const [otherApplicantName, setOtherApplicantName] = useState('');
  const [otherApplicantNik, setOtherApplicantNik] = useState('');
  const [otherPhone, setOtherPhone] = useState('555-');
  const [otherDetails, setOtherDetails] = useState('');
  const [isSubmittingOther, setIsSubmittingOther] = useState(false);
  const [otherSuccessDoc, setOtherSuccessDoc] = useState<OfficialDocument | null>(null);

  const handleGenerateOtherDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otherApplicantName.trim()) return;

    setIsSubmittingOther(true);
    const year = new Date().getFullYear();
    const dateFormatted = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    let doc: OfficialDocument;

    if (otherServiceType === 'WCL') {
      const permitNumber = `WCL/GOV-LIC/${year}/${Math.floor(100 + Math.random() * 900)}`;
      addGovernmentPermit({
        permitNumber,
        category: 'WEAPON',
        title: `Izin Kepemilikan Senjata Api Legal (WCL): ${otherApplicantName.trim()}`,
        applicantName: otherApplicantName.trim(),
        applicantId: otherApplicantNik.trim() || `CID-${Math.floor(10000000 + Math.random() * 90000000)}`,
        applicantPhone: otherPhone.trim(),
        businessOrDetails: otherDetails.trim() || 'Combat Pistol 9mm / Perlindungan Diri',
        purpose: 'Perlindungan diri pribadi (Self Defense) di kediaman & kendaraan pribadi.',
        validUntil: `1 Tahun (Hingga ${year + 1})`,
        feeAmount: 25000,
        status: 'APPROVED',
        approvedBy: currentOfficer?.name || 'Momo Hatakeyama',
        approvedByRank: currentOfficer?.rank || 'PRESIDENT [RANK 6]',
        approvedAt: Date.now(),
        notes: 'Telah lolos verifikasi SKCK Bebas Kriminalitas dari Kepolisian HSPD.'
      });

      doc = {
        id: `wcl-${Date.now()}`,
        docNumber: permitNumber,
        category: 'IZIN_SENJATA',
        classification: 'BIASA',
        title: 'SURAT IZIN KEPEMILIKAN SENJATA API SIPIL (WCL)',
        subject: 'Lisensi Hak Membawa Senjata Api Kategori Perlindungan Diri',
        date: dateFormatted,
        validUntil: `1 (Satu) Tahun - Hingga ${year + 1}`,
        location: 'Markas Besar Kepolisian HSPD & Kantor Sekretariat Negara',
        issuerName: currentOfficer?.name || 'Leoarnd Neave',
        issuerBadge: currentOfficer?.badge || '#001',
        issuerRank: currentOfficer?.rank || 'CHIEF OF POLICE [COP]',
        issuerRole: 'Kepala Kepolisian & Otoritas Lisensi Senjata Api',
        recipientName: otherApplicantName.trim(),
        recipientId: otherApplicantNik.trim() || `CID-${Math.floor(10000000 + Math.random() * 90000000)}`,
        recipientPhone: otherPhone.trim(),
        recipientRoleOrStatus: 'Pemegang Lisensi Senjata Api Sipil',
        recipientAddress: 'Kota Los Santos, HighState',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        openingText: 'Setelah melalui tahapan verifikasi berkas, uji kecakapan menembak, dan pengecekan rekam jejak kriminal (SKCK Bersih), DENGAN INI MEMBERIKAN LISENSI KEPADA:',
        clauses: [
          {
            id: 'w1',
            clauseNumber: 'Pasal 1',
            title: 'SPESIFIKASI SENJATA RESMI',
            content: `Lisensi ini berlaku untuk senjata api kategori perlindungan diri: ${otherDetails.trim() || 'Pistol Semi-Otomatis Kaliber 9mm Standar Sipil'}.`
          },
          {
            id: 'w2',
            clauseNumber: 'Pasal 2',
            title: 'KETENTUAN PENGGUNAAN',
            content: 'Hanya dapat digunakan untuk perlindungan diri dalam ancaman pembunuhan seketika. Dilarang membawa senjata ke area steril (Kantor Polisi, Balai Kota, Rumah Sakit, Sekolah).'
          }
        ],
        closingText: 'Lisensi ini wajib dibawa setiap saat bersama senjata api berlisensi dan ditunjukkan saat pemeriksaan petugas.',
        notes: 'Penyalahgunaan senjata api berakibat pencabutan lisensi dan penuntutan pidana pasal bersenjata.',
        primarySeal: 'HSPD_OFFICIAL',
        secondarySeal: 'APPROVED_PASSED',
        showWatermark: true,
        showQrVerification: true,
        showIssuerSignature: true,
        issuerSignatureTitle: 'Otoritas Lisensi Senjata Api,',
        issuerSignatureName: currentOfficer?.name || 'Leoarnd Neave',
        issuerSignatureSubtitle: 'CHIEF OF POLICE [COP]',
        issuerSignatureStyle: 'formal',
        recipientSignatureTitle: 'Pemegang Lisensi,',
        recipientSignatureName: otherApplicantName.trim(),
        recipientSignatureStyle: 'handwriting1'
      };
    } else if (otherServiceType === 'STLK') {
      const reportNum = `STLK/HSPD-SPKT/${year}/${Math.floor(1000 + Math.random() * 9000)}`;
      doc = {
        id: `stlk-${Date.now()}`,
        docNumber: reportNum,
        category: 'SURAT_KEHILANGAN',
        classification: 'BIASA',
        title: 'SURAT TANDA LAPOR KEHILANGAN (STLK)',
        subject: 'Laporan Kehilangan Dokumen / Barang Berharga',
        date: dateFormatted,
        validUntil: '14 (Empat Belas) Hari Sejak Diterbitkan',
        location: 'Sentra Pelayanan Kepolisian Terpadu (SPKT) HSPD',
        issuerName: currentOfficer?.name || 'Jake Peralta',
        issuerBadge: currentOfficer?.badge || '#204',
        issuerRank: currentOfficer?.rank || 'POLICE OFFICER III [PO III]',
        issuerRole: 'Petugas SPKT / Sentra Pengaduan Warga',
        recipientName: otherApplicantName.trim(),
        recipientId: otherApplicantNik.trim() || `CID-${Math.floor(10000000 + Math.random() * 90000000)}`,
        recipientPhone: otherPhone.trim(),
        recipientRoleOrStatus: 'Warga Pelapor',
        recipientAddress: 'Kota Los Santos, HighState',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        openingText: 'Menerangkan bahwa pada hari dan tanggal tersebut di atas telah datang melapor ke SPKT HSPD seorang warga dengan identitas:',
        clauses: [
          {
            id: 's1',
            clauseNumber: 'Poin 1',
            title: 'BARANG / DOKUMEN YANG HILANG',
            content: `Telah melaporkan kehilangan: ${otherDetails.trim() || '1 Buah Dompet Berisi KTP, SIM, dan Kartu Identitas Lainnya'}.`
          },
          {
            id: 's2',
            clauseNumber: 'Poin 2',
            title: 'FUNGSI SURAT KETERANGAN',
            content: 'Surat ini bukan merupakan pengganti identitas asli, melainkan bukti sah pelaporan kepolisian untuk pengurusan dokumen baru ke dinas terkait.'
          }
        ],
        closingText: 'Demikian Surat Tanda Lapor Kehilangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.',
        notes: 'Apabila barang yang dilaporkan hilang ditemukan kembali, pelapor wajib melapor ke SPKT HSPD.',
        primarySeal: 'HSPD_OFFICIAL',
        showWatermark: true,
        showQrVerification: true,
        showIssuerSignature: true,
        issuerSignatureTitle: 'Petugas Penerima Laporan SPKT,',
        issuerSignatureName: currentOfficer?.name || 'Jake Peralta',
        issuerSignatureSubtitle: currentOfficer?.rank || 'POLICE OFFICER III [#204]',
        issuerSignatureStyle: 'formal',
        recipientSignatureTitle: 'Pelapor,',
        recipientSignatureName: otherApplicantName.trim(),
        recipientSignatureStyle: 'handwriting1'
      };
    } else {
      // EVENT PERMIT
      const permitNum = `EVT/GOV-EXEC/${year}/${Math.floor(100 + Math.random() * 900)}`;
      addGovernmentPermit({
        permitNumber: permitNum,
        category: 'EVENT',
        title: `Izin Keramaian & Acara Publik: ${otherDetails.trim() || 'Festival Publik Warga'}`,
        applicantName: otherApplicantName.trim(),
        applicantId: otherApplicantNik.trim() || `CID-${Math.floor(10000000 + Math.random() * 90000000)}`,
        applicantPhone: otherPhone.trim(),
        businessOrDetails: otherDetails.trim() || 'Festival Musik, Bazaar UMKM & Pameran Komunitas',
        purpose: 'Penyelenggaraan acara publik terbuka dengan pengawasan ketertiban.',
        validUntil: '3 Hari (Sesuai Jadwal Kegiatan)',
        feeAmount: 15000,
        status: 'APPROVED',
        approvedBy: currentOfficer?.name || 'Momo Hatakeyama',
        approvedByRank: currentOfficer?.rank || 'PRESIDENT [RANK 6]',
        approvedAt: Date.now(),
        notes: 'Wajib berkoordinasi dengan Satlantas HSPD untuk rekayasa jalan.'
      });

      doc = {
        id: `evt-${Date.now()}`,
        docNumber: permitNum,
        category: 'IZIN_KERAMAIAN',
        classification: 'BIASA',
        title: 'SURAT IZIN PENYELENGGARAAN ACARA PUBLIK & KERAMAIAN',
        subject: `Izin Keramaian Kegiatan: ${otherDetails.trim() || 'Kegiatan Publik'}`,
        date: dateFormatted,
        validUntil: 'Sesuai Jadwal Rangkaian Acara Resmi',
        location: 'Sekretariat Pemerintahan & Markas Besar HSPD',
        issuerName: currentOfficer?.name || 'Momo Hatakeyama',
        issuerBadge: currentOfficer?.badge || '#GOV-01',
        issuerRank: currentOfficer?.rank || 'PRESIDENT [RANK 6]',
        issuerRole: 'Pemerintah Otoritas Perizinan Wilayah',
        recipientName: otherApplicantName.trim(),
        recipientId: otherApplicantNik.trim() || `CID-${Math.floor(10000000 + Math.random() * 90000000)}`,
        recipientPhone: otherPhone.trim(),
        recipientRoleOrStatus: 'Ketua Panitia Pelaksana Acara',
        recipientAddress: 'Kota Los Santos, HighState',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        openingText: 'Mengingat permohonan tertib acara kemasyarakatan yang diajukan oleh panitia, DENGAN INI MEMBERIKAN IZIN KEGIATAN KEPADA:',
        clauses: [
          {
            id: 'e1',
            clauseNumber: 'Pasal 1',
            title: 'BENTUK KEGIATAN & LOKASI',
            content: `Diizinkan menyelenggarakan kegiatan: ${otherDetails.trim() || 'Pameran & Bazaar Publik'} dengan menjaga ketertiban kawasan sekitar.`
          },
          {
            id: 'e2',
            clauseNumber: 'Pasal 2',
            title: 'PENGAMANAN & PROTOKOL',
            content: 'Panitia wajib menyediakan tim keamanan internal dan mematuhi instruksi jalur evakuasi dari petugas patroli kepolisian HSPD.'
          }
        ],
        closingText: 'Surat izin keramaian ini diterbitkan untuk dipergunakan sesuai jadwal yang disepakati.',
        notes: 'Izin dibatalkan seketika apabila terjadi kerusuhan atau pelanggaran hukum di lokasi.',
        primarySeal: 'PRESIDENTIAL_SEAL',
        secondarySeal: 'HSPD_OFFICIAL',
        showWatermark: true,
        showQrVerification: true,
        showIssuerSignature: true,
        issuerSignatureTitle: 'Otoritas Perizinan Terpadu,',
        issuerSignatureName: currentOfficer?.name || 'Momo Hatakeyama',
        issuerSignatureSubtitle: 'PRESIDENT [RANK 6]',
        issuerSignatureStyle: 'formal',
        recipientSignatureTitle: 'Ketua Panitia Penyelenggara,',
        recipientSignatureName: otherApplicantName.trim(),
        recipientSignatureStyle: 'handwriting1'
      };
    }

    saveOfficialDocument(doc);
    setGovPermits(getGovernmentPermits());
    setOfficialDocs(getSavedOfficialDocuments());
    setOtherSuccessDoc(doc);
    setIsSubmittingOther(false);
  };

  // ---------------------------------------------------------------------------
  // TAB 4: VERIFIKASI KEASLIAN DOKUMEN PUBLIK
  // ---------------------------------------------------------------------------
  const [verifyQuery, setVerifyQuery] = useState('');
  
  const verificationResults = useMemo(() => {
    const q = verifyQuery.trim().toLowerCase();
    if (!q) return { docs: [], permits: [] };

    const matchedDocs = officialDocs.filter(d => 
      d.docNumber.toLowerCase().includes(q) ||
      d.recipientName.toLowerCase().includes(q) ||
      (d.recipientId || '').toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q)
    );

    const matchedPermits = govPermits.filter(p => 
      p.permitNumber.toLowerCase().includes(q) ||
      p.applicantName.toLowerCase().includes(q) ||
      p.applicantId.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q)
    );

    return { docs: matchedDocs, permits: matchedPermits };
  }, [verifyQuery, officialDocs, govPermits]);

  // Handle Export Document as Image
  const handleExportImage = async (elementId: string, filename: string) => {
    setIsExporting(true);
    try {
      await exportElementAsImage(elementId, {
        fileName: `${filename}_${Date.now()}.png`,
        format: 'png',
        quality: 0.98,
        scale: 2
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Reusable Photo Upload Card component renderer
  const renderPhotoUploadCard = ({
    id,
    label,
    sublabel,
    value,
    onChange,
    onClear,
    loadingKey,
    currentLoading,
    theme = 'blue'
  }: {
    id: string;
    label: string;
    sublabel: string;
    value: string;
    onChange: (file: File) => void;
    onClear: () => void;
    loadingKey: string;
    currentLoading: string | null;
    theme?: 'blue' | 'amber';
  }) => {
    const isLoading = currentLoading === loadingKey;
    const isAmber = theme === 'amber';
    const activeBorderClass = isAmber ? 'border-amber-500/70 bg-amber-950/20' : 'border-blue-500/70 bg-blue-950/20';
    const accentTextClass = isAmber ? 'text-amber-400' : 'text-blue-400';
    const badgeBorderClass = isAmber ? 'border-amber-600/60 bg-amber-950/80 text-amber-300' : 'border-blue-600/60 bg-blue-950/80 text-blue-300';

    return (
      <div className={`p-3 rounded-xl border transition-all ${value ? activeBorderClass : 'border-gray-800 bg-[#090C11] hover:border-gray-700'}`}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 truncate">
            <Camera className={`w-3.5 h-3.5 shrink-0 ${value ? accentTextClass : 'text-gray-400'}`} />
            <span className="text-xs font-bold text-gray-200 truncate">{label}</span>
          </div>
          {value ? (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold shrink-0 ${badgeBorderClass}`}>
              ✓ TERLAMPIR
            </span>
          ) : (
            <span className="text-[10px] font-mono text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800 shrink-0">
              BELUM ADA
            </span>
          )}
        </div>

        <p className="text-[11px] text-gray-400 mb-2 leading-snug line-clamp-1">{sublabel}</p>

        {value ? (
          <div className="relative group rounded-lg overflow-hidden border border-gray-700 bg-black/80">
            <img
              src={value}
              alt={label}
              className="w-full h-28 object-cover object-center group-hover:scale-105 transition duration-300 cursor-pointer"
              onClick={() => setLightboxItem({ url: value, title: label, subtitle: sublabel })}
            />
            {/* Quick Action Overlay on Hover */}
            <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 p-2">
              <button
                type="button"
                onClick={() => setLightboxItem({ url: value, title: label, subtitle: sublabel })}
                className="px-2 py-1 bg-black/80 hover:bg-black text-white text-[11px] font-bold rounded flex items-center gap-1 border border-white/20 transition shadow"
                title="Lihat Penuh"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Perbesar</span>
              </button>

              <label
                htmlFor={id}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer transition shadow"
                title="Ganti Gambar"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Ganti</span>
              </label>

              <button
                type="button"
                onClick={onClear}
                className="p-1 bg-rose-600/90 hover:bg-rose-600 text-white rounded transition shadow"
                title="Hapus Foto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <input
              type="file"
              id={id}
              accept="image/*"
              className="hidden"
              disabled={isLoading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onChange(f);
                e.target.value = '';
              }}
            />
            <label
              htmlFor={id}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const f = e.dataTransfer.files?.[0];
                if (f) onChange(f);
              }}
              className={`w-full h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-all p-2.5 text-center ${
                isAmber 
                  ? 'border-amber-700/40 hover:border-amber-500/80 bg-amber-950/10 hover:bg-amber-950/20' 
                  : 'border-blue-700/40 hover:border-blue-500/80 bg-blue-950/10 hover:bg-blue-950/20'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className={`w-5 h-5 animate-spin ${accentTextClass}`} />
                  <span className="text-[11px] font-mono text-gray-300">Mengompresi Gambar...</span>
                </>
              ) : (
                <>
                  <Upload className={`w-5 h-5 ${accentTextClass} opacity-80`} />
                  <span className="text-xs font-semibold text-gray-200">
                    Klik untuk Unggah <span className="text-gray-400 font-normal">atau seret foto</span>
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">PNG, JPG, WEBP (Auto Compress)</span>
                </>
              )}
            </label>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-gray-200 flex flex-col antialiased selection:bg-blue-600 selection:text-white relative">
      
      {/* BACKGROUND SUBTLE GRID */}
      <div className="fixed inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none z-0"></div>

      {/* TOP CITIZEN SERVICE HEADER */}
      <header className="sticky top-0 z-30 bg-[#0F131D]/95 backdrop-blur-md border-b border-gray-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0 flex items-center -space-x-2">
              <img
                src={branding.logoUrl || HSPD_LOGO_URL}
                alt="HSPD Logo"
                className="w-10 h-10 rounded-full object-contain drop-shadow-md border border-amber-500/50 bg-black/70 p-0.5 relative z-10"
              />
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 flex items-center justify-center text-white border border-amber-400/60 shadow-md relative z-0">
                <Building2 className="w-5 h-5 text-amber-100" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-1.5 font-sans">
                  PORTAL LAYANAN WARGA SIPIL & PERIZINAN RESMI
                </h1>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-700/60 px-2 py-0.5 rounded font-bold">
                  TERHUBUNG 24/7
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono flex items-center gap-2">
                <span>Database HSPD CAD/MDT & Administrasi Pemerintahan Terpadu</span>
                <span className="text-gray-600 hidden sm:inline">•</span>
                <span className="text-amber-400/90 font-semibold hidden sm:inline">HighState Public Gateway</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToLogin && (
              <button
                type="button"
                onClick={onBackToLogin}
                className="px-3 py-1.5 bg-gray-800/90 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Akses Login Petugas</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}
          </div>
        </div>

        {/* NAVIGATION SLIDE TABS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-2 border-t border-gray-800/80 pt-1.5 pb-2 text-xs scrollbar-none font-medium">
          {/* TAB 0: DATA DOKUMEN & PERIZINAN TERDAFTAR RESMI (PRIMARY FOR HSPD / PEMERINTAHAN) */}
          <button
            type="button"
            onClick={() => setActiveTab('registered')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'registered'
                ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/40 ring-1 ring-blue-400/50'
                : 'text-blue-300 hover:text-white hover:bg-blue-950/60 border border-blue-800/40'
            }`}
          >
            <FileCheck className="w-4 h-4 text-blue-400" />
            <span>📋 Data Surat Terdaftar & TTD (HSPD / Gov)</span>
            <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-1.5 py-0.2 rounded border border-blue-700">
              {officialDocs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('skck')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'skck'
                ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/40'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{currentOfficer ? '➕ Input SKCK Walk-In' : 'Penerbitan SKCK Online (HSPD)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'business'
                ? 'bg-amber-600 text-white font-bold shadow-lg shadow-amber-950/40'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{currentOfficer ? '➕ Input Izin Usaha Walk-In' : 'Surat Izin Usaha / NIB (Pemerintah)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('other')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'other'
                ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-950/40'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{currentOfficer ? '➕ Input Izin Lain (WCL/STLK)' : 'Layanan Lain (WCL, STLK, Acara)'}</span>
          </button>

          {/* TAB 5: CEK BURONAN / DPO (BOLO) */}
          <button
            type="button"
            onClick={() => setActiveTab('wanted')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'wanted'
                ? 'bg-red-600 text-white font-bold shadow-lg shadow-red-950/50 ring-1 ring-red-400'
                : 'text-red-300 hover:text-white hover:bg-red-950/50 border border-red-900/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>🚨 Cek Status Buronan (DPO)</span>
            <span className="text-[10px] font-mono bg-red-950 text-red-300 px-1.5 py-0.2 rounded border border-red-800">
              {boloList.filter(b => b.status === 'ACTIVE').length}
            </span>
          </button>

          {/* TAB 6: CEK NAMA KENA TILANG */}
          <button
            type="button"
            onClick={() => setActiveTab('citations')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'citations'
                ? 'bg-amber-600 text-white font-bold shadow-lg shadow-amber-950/50 ring-1 ring-amber-400'
                : 'text-amber-300 hover:text-white hover:bg-amber-950/50 border border-amber-900/50'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>🚦 Cek Tilang Warga</span>
            <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded border border-amber-800">
              {citations.length}
            </span>
          </button>

          {/* TAB 7: CEK KENDARAAN IMPOUND (SENJATA ILEGAL / MERAMPOK) */}
          <button
            type="button"
            onClick={() => setActiveTab('impounds')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'impounds'
                ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-950/50 ring-1 ring-blue-400'
                : 'text-blue-300 hover:text-white hover:bg-blue-950/50 border border-blue-900/50'
            }`}
          >
            <Car className="w-4 h-4 text-blue-400" />
            <span>🚗 Kendaraan Impound (Senjata/Rampok)</span>
            <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-1.5 py-0.2 rounded border border-blue-800">
              {impounds.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('verify')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'verify'
                ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-950/40'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Cek Keaslian & Status Surat</span>
          </button>
        </div>
      </header>

      {/* QUICK CITIZEN SHORTCUTS BANNER */}
      {!currentOfficer && (
        <div className="bg-[#0B0E14] border-b border-gray-800/90 py-2.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-gray-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold text-white">Layanan Pengecekan Cepat Warga:</span>
              <span className="text-gray-400 hidden md:inline">Cari status hukum, denda tilang, atau mobil disita polisi</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('wanted')}
                className="px-3 py-1.5 bg-red-950/70 hover:bg-red-900 border border-red-700/60 text-red-200 rounded-lg font-semibold flex items-center gap-1.5 transition shadow"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Cari Status Buronan (DPO)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('citations')}
                className="px-3 py-1.5 bg-amber-950/70 hover:bg-amber-900 border border-amber-700/60 text-amber-200 rounded-lg font-semibold flex items-center gap-1.5 transition shadow"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Cari Nama Kena Tilang</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('impounds')}
                className="px-3 py-1.5 bg-blue-950/70 hover:bg-blue-900 border border-blue-700/60 text-blue-200 rounded-lg font-semibold flex items-center gap-1.5 transition shadow"
              >
                <Car className="w-3.5 h-3.5 text-blue-400" />
                <span>Cari Kendaraan Impound</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 relative z-10">

        {/* ========================================================================= */}
        {/* TAB 0: DATA DOKUMEN TERDAFTAR RESMI & PENGESAHAN TTD (HSPD & PEMERINTAHAN) */}
        {/* ========================================================================= */}
        {activeTab === 'registered' && (
          <CitizenServiceRegisteredBoard
            documents={officialDocs}
            currentOfficer={currentOfficer}
            onOpenSignatoryModal={(doc) => setSelectedSignatoryDoc(doc)}
            onOpenPrintPreview={(doc) => setPreviewDoc(doc)}
            onOpenLightbox={(item) => setLightboxItem(item)}
            onDeleteDocument={(docId) => {
              const updated = deleteOfficialDocument(docId);
              setOfficialDocs(updated);
            }}
            onSwitchToCreateForm={() => setActiveTab('skck')}
            onRefreshData={() => loadDatabases()}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 1: PEMBUATAN SKCK ONLINE (TERKONEKSI DATABASE KEPOLISIAN HSPD) */}
        {/* ========================================================================= */}
        {activeTab === 'skck' && (
          <div className="space-y-6">
            {/* HERO NOTICE BANNER */}
            <div className="bg-gradient-to-r from-blue-950/70 via-[#111827] to-blue-950/70 border border-blue-800/50 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400 shrink-0">
                  <Shield className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      PEMBUATAN SURAT KETERANGAN CATATAN KEPOLISIAN (SKCK)
                    </h2>
                    <span className="text-[10px] font-mono bg-blue-900/60 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded font-semibold">
                      VERIFIKASI CAD/MDT OTOMATIS
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                    Sistem ini terhubung langsung ke basis data catatan kriminalitas kepolisian HighState Police Department (HSPD). 
                    Pemeriksaan rekam jejak kriminal, daftar buronan (BOLO), dan riwayat tilang dilakukan secara real-time.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center font-mono text-[11px] bg-black/40 border border-gray-800 px-3 py-2 rounded-lg">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <span>Status Basis Data: <strong className="text-emerald-400">AKTIF 10-8</strong></span>
              </div>
            </div>

            {/* MAIN SPLIT: FORM & REAL-TIME BACKGROUND CHECK RESULT */}
            <div className={currentOfficer || skckSuccessDoc ? "grid grid-cols-1 lg:grid-cols-12 gap-6" : "max-w-4xl mx-auto"}>
              
              {/* LEFT FORM (7 COLS IF OFFICER/SUCCESS, ELSE CENTERED CLEAN) */}
              <div className={currentOfficer || skckSuccessDoc ? "lg:col-span-7 bg-[#131823] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4" : "bg-[#131823] border border-gray-800 rounded-xl p-6 shadow-xl space-y-4"}>
                <div className="border-b border-gray-800 pb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Formulir Permohonan SKCK Baru</span>
                  </h3>
                  <span className="text-[11px] text-gray-400 font-mono">Biaya Retribusi: $10,000</span>
                </div>

                <form onSubmit={handleGenerateSkck} className="space-y-4 text-xs">
                  {/* IDENTITAS PEMOHON */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">
                        Nama Lengkap Warga (In-Game IC) <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={skckFullName}
                          onChange={(e) => setSkckFullName(e.target.value)}
                          placeholder="Contoh: Franklin Clinton atau Michael De Santa"
                          className="w-full bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none pl-8"
                          required
                        />
                        <User className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">
                        Nomor Identitas Kependudukan (NIK / CID)
                      </label>
                      <input
                        type="text"
                        value={skckNik}
                        onChange={(e) => setSkckNik(e.target.value)}
                        placeholder="Contoh: CID-84920401 atau LS-9921"
                        className="w-full bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Tempat Lahir</label>
                      <input
                        type="text"
                        value={skckPob}
                        onChange={(e) => setSkckPob(e.target.value)}
                        className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Tanggal Lahir</label>
                      <input
                        type="date"
                        value={skckDob}
                        onChange={(e) => setSkckDob(e.target.value)}
                        className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Jenis Kelamin</label>
                      <select
                        value={skckGender}
                        onChange={(e) => setSkckGender(e.target.value as any)}
                        className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="Laki-Laki">Laki-Laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Pekerjaan / Profesi</label>
                      <input
                        type="text"
                        value={skckOccupation}
                        onChange={(e) => setSkckOccupation(e.target.value)}
                        placeholder="Wiraswasta, Mekanik, Pengacara, dll."
                        className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Nomor Telepon</label>
                      <input
                        type="text"
                        value={skckPhone}
                        onChange={(e) => setSkckPhone(e.target.value)}
                        placeholder="555-xxxx"
                        className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-300 mb-1">Alamat Domisili Tempat Tinggal</label>
                    <input
                      type="text"
                      value={skckAddress}
                      onChange={(e) => setSkckAddress(e.target.value)}
                      placeholder="Strawberry Ave, South Los Santos"
                      className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  {/* TUJUAN PENGGUNAAN SKCK */}
                  <div>
                    <label className="block font-semibold text-gray-300 mb-1">
                      Keperluan Penggunaan SKCK <span className="text-blue-400">*</span>
                    </label>
                    <select
                      value={skckPurpose}
                      onChange={(e) => setSkckPurpose(e.target.value)}
                      className="w-full bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="Melamar Pekerjaan Swasta / BUMN">Melamar Pekerjaan Swasta / BUMN</option>
                      <option value="Pendaftaran Calon Anggota Kepolisian HSPD">Pendaftaran Calon Anggota Kepolisian HSPD</option>
                      <option value="Pendaftaran Aparatur Sipil Negara / Pemerintahan">Pendaftaran Aparatur Sipil Negara / Pemerintahan</option>
                      <option value="Persyaratan Pembuatan Surat Izin Usaha / Bisnis">Persyaratan Pembuatan Surat Izin Usaha / Bisnis</option>
                      <option value="Persyaratan Pengajuan Lisensi Senjata Api Legal (WCL)">Persyaratan Pengajuan Lisensi Senjata Api Legal (WCL)</option>
                      <option value="Pengurusan Izin Tinggal, Paspor & Visa Perjalanan">Pengurusan Izin Tinggal, Paspor & Visa Perjalanan</option>
                      <option value="Lainnya">Lainnya (Ketik Manual)</option>
                    </select>

                    {skckPurpose === 'Lainnya' && (
                      <input
                        type="text"
                        value={skckCustomPurpose}
                        onChange={(e) => setSkckCustomPurpose(e.target.value)}
                        placeholder="Sebutkan keperluan penggunaan SKCK Anda..."
                        className="w-full mt-2 bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-white"
                        required
                      />
                    )}
                  </div>

                  {/* UPLOAD 2 FOTO LAMPIRAN IDENTITAS: FOTO /STATS & FOTO KTP */}
                  <div className="bg-[#0D1117] border border-blue-900/50 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-200 text-xs tracking-wide">
                            UPLOAD LAMPIRAN BERKAS IDENTITAS (2 FOTO WAJIB)
                          </h4>
                          <p className="text-[10px] text-gray-400 font-mono">1 Foto /stats In-Game & 1 Foto Kartu Identitas (KTP)</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        skckStatsPhoto && skckKtpPhoto 
                          ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300' 
                          : 'bg-blue-950/80 border-blue-800/60 text-blue-300'
                      }`}>
                        {skckStatsPhoto && skckKtpPhoto ? '✓ 2/2 LENGKAP' : `${(skckStatsPhoto ? 1 : 0) + (skckKtpPhoto ? 1 : 0)}/2 TERUNGGAH`}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      Wajib mengunggah screenshot status karakter lengkap in-game (<strong>/stats</strong>) dan foto <strong>Kartu Tanda Penduduk (KTP)</strong> pemohon untuk verifikasi rekam status legalitas resmi.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {renderPhotoUploadCard({
                        id: 'upload-skck-stats',
                        label: '1. Foto /stats (In-Game)',
                        sublabel: 'Screenshot lengkap panel status /stats karakter',
                        value: skckStatsPhoto,
                        onChange: (file) => handleProcessImageUpload(file, setSkckStatsPhoto, setSkckUploadLoading, 'stats'),
                        onClear: () => setSkckStatsPhoto(''),
                        loadingKey: 'stats',
                        currentLoading: skckUploadLoading,
                        theme: 'blue'
                      })}

                      {renderPhotoUploadCard({
                        id: 'upload-skck-ktp',
                        label: '2. Foto KTP (Identitas)',
                        sublabel: 'Foto KTP atau kartu identitas sah pemohon',
                        value: skckKtpPhoto,
                        onChange: (file) => handleProcessImageUpload(file, setSkckKtpPhoto, setSkckUploadLoading, 'ktp'),
                        onClear: () => setSkckKtpPhoto(''),
                        loadingKey: 'ktp',
                        currentLoading: skckUploadLoading,
                        theme: 'blue'
                      })}
                    </div>
                  </div>

                  {/* SUBMIT ACTION BUTTON */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingSkck || !skckFullName.trim()}
                      className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50 disabled:opacity-50 transition-all"
                    >
                      {isSubmittingSkck ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Mengecek Database & Menerbitkan SKCK Resmi...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Verifikasi Database & Terbitkan SKCK Digital Resmi</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* RIGHT LIVE DATABASE BACKGROUND CHECK STATUS (ONLY SHOWN FOR OFFICERS OR IF SUCCESS DOC GENERATED) */}
              {(currentOfficer || skckSuccessDoc) && (
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* STATUS BADGE BOX (POLICE OFFICERS ONLY - HIDDEN IN CITIZEN VIEW) */}
                  {currentOfficer && (
                    <div className="bg-[#131823] border border-gray-800 rounded-xl p-5 shadow-xl space-y-3.5">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                    <span className="font-bold text-xs text-gray-200 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <ShieldAlert className="w-4 h-4 text-blue-400" />
                      Hasil Pemindaian CAD/MDT HSPD
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">Live Sync</span>
                  </div>

                  {!skckFullName.trim() ? (
                    <div className="py-8 text-center text-gray-500 space-y-2">
                      <Search className="w-8 h-8 mx-auto opacity-40" />
                      <p className="text-xs">Ketik nama pemohon pada formulir di sebelah kiri untuk melihat rekam jejak kriminalitas otomatis.</p>
                    </div>
                  ) : skckBackgroundCheck.isBolo ? (
                    /* DPO ALERT */
                    <div className="p-4 bg-red-950/60 border border-red-700/80 rounded-xl space-y-2 animate-fadeIn">
                      <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                        <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                        <span>PERINGATAN SISTEM: STATUS DPO / BURONAN AKTIF (10-99)</span>
                      </div>
                      <p className="text-[11px] text-red-200">
                        Nama "{skckFullName}" terdaftar aktif dalam daftar pencarian orang (BOLO Wanted List) kepolisian. 
                        Penerbitan SKCK ditolak secara otomatis dan koordinasi lapangan diteruskan ke unit patroli.
                      </p>
                    </div>
                  ) : skckBackgroundCheck.clean ? (
                    /* CLEAN RECORD */
                    <div className="p-4 bg-emerald-950/50 border border-emerald-500/50 rounded-xl space-y-2 animate-fadeIn">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>CATATAN BERSIH (CLEAN RECORD) - MEMENUHI SYARAT</span>
                      </div>
                      <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                        Tidak ditemukan catatan kriminalitas aktif, vonis pidana berat, atau keterlibatan sindikat kejahatan. 
                        Warga bersangkutan memenuhi seluruh kriteria untuk diterbitkan Surat Keterangan Catatan Kepolisian resmi.
                      </p>
                      <div className="pt-2 flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Vonis Pidana: 0 Perkara • Status Tilang: Aman</span>
                      </div>
                    </div>
                  ) : (
                    /* HAS PRIOR ARRESTS */
                    <div className="p-4 bg-amber-950/50 border border-amber-600/60 rounded-xl space-y-2.5 animate-fadeIn">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <span>TERDAPAT CATATAN PERKARA ({skckBackgroundCheck.arrests.length} RIWAYAT)</span>
                      </div>
                      <p className="text-[11px] text-gray-300 leading-relaxed">
                        Warga memiliki riwayat penindakan hukum sebelumnya di kepolisian HSPD. Rincian perkara akan dicantumkan secara transparan pada lampiran SKCK.
                      </p>

                      {/* ARREST LIST */}
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {skckBackgroundCheck.arrests.slice(0, 4).map((arr) => (
                          <div key={arr.id} className="p-2 bg-[#090C11] border border-gray-800 rounded text-[11px]">
                            <div className="flex justify-between font-mono text-gray-400">
                              <span>{new Date(arr.timestamp).toLocaleDateString('id-ID')}</span>
                              <span className="text-amber-400 font-bold">{arr.pasalCodes.join(', ') || 'Pelanggaran'}</span>
                            </div>
                            <div className="text-gray-300 truncate mt-0.5">{arr.notes || 'Telah diselesaikan secara hukum.'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* QUICK DEMO CITIZEN AUTO-FILL CHIPS */}
                  <div className="pt-2 border-t border-gray-800">
                    <span className="text-[10px] text-gray-400 font-mono block mb-1.5">
                      PILIH CONTOH WARGA UNTUK UJI VERIFIKASI INSTAN:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSkckFullName('Franklin Clinton');
                          setSkckNik('LS-84920');
                          setSkckAddress('Whispymound Drive, Vinewood Hills');
                        }}
                        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-[10px] font-mono transition"
                      >
                        Franklin Clinton (Bersih)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSkckFullName('Michael De Santa');
                          setSkckNik('LS-90142');
                          setSkckAddress('Portola Drive, Rockford Hills #802');
                        }}
                        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-[10px] font-mono transition"
                      >
                        Michael De Santa (1 Tilang)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSkckFullName('Trevor Philips');
                          setSkckNik('LS-10293');
                          setSkckAddress('Sandy Shores Trailer Park');
                        }}
                        className="px-2 py-1 bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-300 rounded text-[10px] font-mono transition"
                      >
                        Trevor Philips (BOLO / Buronan)
                      </button>
                    </div>
                  </div>
                </div>
              )}

                {/* SUCCESS ISSUANCE CARD */}
                {skckSuccessDoc && (
                  <div className="bg-emerald-950/30 border-2 border-emerald-500/60 rounded-xl p-4 shadow-xl space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>SKCK RESMI BERHASIL DITERBITKAN & TERSIMPAN!</span>
                    </div>

                    <div className="bg-[#090C11] border border-emerald-800/60 rounded-lg p-3 text-xs space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nomor Registrasi:</span>
                        <span className="font-bold text-amber-300">{skckSuccessDoc.docNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nama Pemohon:</span>
                        <span className="text-white font-semibold">{skckSuccessDoc.recipientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Masa Berlaku:</span>
                        <span className="text-emerald-400">{skckSuccessDoc.validUntil}</span>
                      </div>
                    </div>

                    {/* 2 ATTACHED PHOTOS GALLERY IN SKCK SUCCESS CARD */}
                    {(skckSuccessDoc.skckPhotos?.statsPhoto || skckSuccessDoc.skckPhotos?.ktpPhoto) && (
                      <div className="pt-2 border-t border-emerald-800/40">
                        <span className="text-[10px] font-mono text-emerald-300/80 block mb-1.5 flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          LAMPIRAN BERKAS IDENTITAS TERVERIFIKASI:
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {skckSuccessDoc.skckPhotos?.statsPhoto && (
                            <div 
                              onClick={() => setLightboxItem({ url: skckSuccessDoc.skckPhotos!.statsPhoto!, title: 'Foto /stats (In-Game)', subtitle: skckSuccessDoc.recipientName })}
                              className="group cursor-pointer relative rounded border border-emerald-700/60 overflow-hidden bg-black/60 hover:border-emerald-400 transition"
                            >
                              <img src={skckSuccessDoc.skckPhotos.statsPhoto} alt="/stats" className="w-full h-16 object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px] text-white font-bold gap-1">
                                <ZoomIn className="w-3 h-3" /> Perbesar
                              </div>
                              <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-center font-mono py-0.5 text-emerald-300 truncate px-1">
                                Foto /stats
                              </span>
                            </div>
                          )}
                          {skckSuccessDoc.skckPhotos?.ktpPhoto && (
                            <div 
                              onClick={() => setLightboxItem({ url: skckSuccessDoc.skckPhotos!.ktpPhoto!, title: 'Foto KTP Pemohon', subtitle: skckSuccessDoc.recipientName })}
                              className="group cursor-pointer relative rounded border border-emerald-700/60 overflow-hidden bg-black/60 hover:border-emerald-400 transition"
                            >
                              <img src={skckSuccessDoc.skckPhotos.ktpPhoto} alt="KTP" className="w-full h-16 object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px] text-white font-bold gap-1">
                                <ZoomIn className="w-3 h-3" /> Perbesar
                              </div>
                              <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-center font-mono py-0.5 text-emerald-300 truncate px-1">
                                Foto KTP
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(skckSuccessDoc)}
                        className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat & Cetak Dokumen</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(skckSuccessDoc.docNumber, 'skck-copy')}
                        className="py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs flex items-center gap-1 transition"
                      >
                        {copiedId === 'skck-copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Salin No.</span>
                      </button>
                    </div>
                  </div>
                )}

                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SURAT IZIN USAHA / NIB BISNIS (TERKONEKSI DATABASE PEMERINTAH) */}
        {/* ========================================================================= */}
        {activeTab === 'business' && (
          <div className="space-y-6">
            {/* HERO NOTICE BANNER */}
            <div className="bg-gradient-to-r from-amber-950/70 via-[#15120E] to-amber-950/70 border border-amber-800/50 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-amber-600/20 border border-amber-500/40 rounded-xl text-amber-400 shrink-0">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      PEMBUATAN SURAT IZIN USAHA & KOMERSIAL (SIU / NIB RESMI)
                    </h2>
                    <span className="text-[10px] font-mono bg-amber-900/60 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded font-semibold">
                      DATABASE PEMERINTAH TERPADU
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                    Seluruh pendaftaran izin usaha warga sipil otomatis tercatat pada buku perizinan Kementerian & Kepresidenan Negara HighState. 
                    Mendapatkan hak hukum berusaha, perlindungan aset, dan registrasi wajib pajak legal.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center font-mono text-[11px] bg-black/40 border border-gray-800 px-3 py-2 rounded-lg">
                <BadgeCheck className="w-4 h-4 text-amber-400" />
                <span>Terdata: <strong className="text-amber-400">{govPermits.filter(p => p.category === 'BUSINESS').length} Usaha Aktif</strong></span>
              </div>
            </div>

            {/* SPLIT GRID: FORM & PREVIOUS PERMITS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* FORM IZIN USAHA (7 COLS) */}
              <div className="lg:col-span-7 bg-[#131823] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
                <div className="border-b border-gray-800 pb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                    <Building className="w-4 h-4 text-amber-400" />
                    <span>Permohonan Registrasi Badan Usaha & Komersial</span>
                  </h3>
                  <span className="text-[11px] text-gray-400 font-mono">Retribusi Pajak: $35,000 / Thn</span>
                </div>

                <form onSubmit={handleGenerateBusinessPermit} className="space-y-3.5 text-xs">
                  {/* NAMA USAHA & KATEGORI */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">
                        Nama Usaha / Merk Dagang <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={bizName}
                        onChange={(e) => setBizName(e.target.value)}
                        placeholder="Contoh: Bean Machine Cafe & Bakery"
                        className="w-full bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">
                        Kategori & Klasifikasi Usaha <span className="text-amber-400">*</span>
                      </label>
                      <select
                        value={bizCategory}
                        onChange={(e) => setBizCategory(e.target.value)}
                        className="w-full bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="Kuliner, Kafe & Restoran">☕ Kuliner, Kafe & Restoran</option>
                        <option value="Bengkel Otomotif, Modifikasi & Cuci Kendaraan">🚗 Bengkel Otomotif, Modifikasi & Cuci Kendaraan</option>
                        <option value="Hiburan Malam, Bar, Klub & Lounge">🍸 Hiburan Malam, Bar, Klub & Lounge</option>
                        <option value="Perdagangan Retail & Minimarket">🏪 Perdagangan Retail & Minimarket</option>
                        <option value="Logistik, Ekspedisi & Transportasi">📦 Logistik, Ekspedisi & Transportasi</option>
                        <option value="Properti, Konstruksi & Real Estate">🏢 Properti, Konstruksi & Real Estate</option>
                        <option value="Jasa Keamanan Swasta & Pengawalan">🛡️ Jasa Keamanan Swasta & Pengawalan</option>
                        <option value="Industri Kreatif & Layanan Digital">💻 Industri Kreatif & Layanan Digital</option>
                      </select>
                    </div>
                  </div>

                  {/* IDENTITAS PENANGGUNG JAWAB */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">
                        Nama Pemilik / Penanggung Jawab <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={bizOwnerName}
                        onChange={(e) => setBizOwnerName(e.target.value)}
                        placeholder="Contoh: Franklin Clinton"
                        className="w-full bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">
                        NIK / CID Pemilik
                      </label>
                      <input
                        type="text"
                        value={bizOwnerNik}
                        onChange={(e) => setBizOwnerNik(e.target.value)}
                        placeholder="Contoh: CID-84920401"
                        className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* ALAMAT & LOKASI USAHA */}
                  <div>
                    <label className="block font-semibold text-gray-300 mb-1">
                      Alamat / Lokasi Operasional Tempat Usaha <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={bizLocation}
                        onChange={(e) => setBizLocation(e.target.value)}
                        placeholder="Vinewood Boulevard #104, Los Santos"
                        className="w-full bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg px-3 py-2 text-white pl-8"
                        required
                      />
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  {/* SKALA & MODAL */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Skala Usaha</label>
                      <select
                        value={bizScale}
                        onChange={(e) => setBizScale(e.target.value)}
                        className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="Usaha Mikro">Usaha Mikro</option>
                        <option value="Usaha Kecil & Menengah (UKM)">Usaha Kecil & Menengah (UKM)</option>
                        <option value="Usaha Skala Besar">Usaha Skala Besar</option>
                        <option value="Korporasi / Holding">Korporasi / Holding</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Estimasi Modal Awal</label>
                      <input
                        type="text"
                        value={bizCapital}
                        onChange={(e) => setBizCapital(e.target.value)}
                        placeholder="$50,000"
                        className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">No. Kontak Bisnis</label>
                      <input
                        type="text"
                        value={bizPhone}
                        onChange={(e) => setBizPhone(e.target.value)}
                        placeholder="555-8821"
                        className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  {/* KETERANGAN OPERASIONAL */}
                  <div>
                    <label className="block font-semibold text-gray-300 mb-1">Keterangan & Lingkup Aktivitas Usaha</label>
                    <textarea
                      value={bizNotes}
                      onChange={(e) => setBizNotes(e.target.value)}
                      placeholder="Jelaskan jenis layanan, jam operasional, dan kepatuhan standar..."
                      className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2.5 text-white h-16 resize-none"
                    />
                  </div>

                  {/* UPLOAD 4 FOTO KELENGKAPAN BADAN USAHA */}
                  <div className="bg-[#0E0C09] border border-amber-900/50 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-600/20 border border-amber-500/30 rounded-lg text-amber-400">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-200 text-xs tracking-wide">
                            UPLOAD 4 FOTO BERKAS KELAYAKAN USAHA
                          </h4>
                          <p className="text-[10px] text-gray-400 font-mono">Depan Toko, /business info, Properti, & KTP Pemilik</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        [bizShopFrontPhoto, bizInfoPhoto, bizPropertyPhoto, bizKtpPhoto].filter(Boolean).length === 4
                          ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300' 
                          : 'bg-amber-950/80 border-amber-800/60 text-amber-300'
                      }`}>
                        {`${[bizShopFrontPhoto, bizInfoPhoto, bizPropertyPhoto, bizKtpPhoto].filter(Boolean).length}/4 TERUNGGAH`}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      Sesuai peraturan registrasi badan usaha komersial, mohon lengkapi 4 berkas dokumentasi foto berikut untuk pengesahan lisensi usaha:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {renderPhotoUploadCard({
                        id: 'upload-biz-shop',
                        label: '1. Foto Depan Toko',
                        sublabel: 'Tampak depan toko, fasad gedung, atau plang nama bisnis',
                        value: bizShopFrontPhoto,
                        onChange: (file) => handleProcessImageUpload(file, setBizShopFrontPhoto, setBizUploadLoading, 'shop'),
                        onClear: () => setBizShopFrontPhoto(''),
                        loadingKey: 'shop',
                        currentLoading: bizUploadLoading,
                        theme: 'amber'
                      })}

                      {renderPhotoUploadCard({
                        id: 'upload-biz-info',
                        label: '2. Informasi Business (/business info)',
                        sublabel: 'Screenshot menu /business info in-game dari lokasi usaha',
                        value: bizInfoPhoto,
                        onChange: (file) => handleProcessImageUpload(file, setBizInfoPhoto, setBizUploadLoading, 'info'),
                        onClear: () => setBizInfoPhoto(''),
                        loadingKey: 'info',
                        currentLoading: bizUploadLoading,
                        theme: 'amber'
                      })}

                      {renderPhotoUploadCard({
                        id: 'upload-biz-property',
                        label: '3. Properti Business',
                        sublabel: 'Foto properti, interior toko, kasir, atau fasilitas usaha',
                        value: bizPropertyPhoto,
                        onChange: (file) => handleProcessImageUpload(file, setBizPropertyPhoto, setBizUploadLoading, 'property'),
                        onClear: () => setBizPropertyPhoto(''),
                        loadingKey: 'property',
                        currentLoading: bizUploadLoading,
                        theme: 'amber'
                      })}

                      {renderPhotoUploadCard({
                        id: 'upload-biz-ktp',
                        label: '4. Foto KTP Pemilik',
                        sublabel: 'Foto KTP / Kartu Identitas sah dari pemilik usaha',
                        value: bizKtpPhoto,
                        onChange: (file) => handleProcessImageUpload(file, setBizKtpPhoto, setBizUploadLoading, 'ktp'),
                        onClear: () => setBizKtpPhoto(''),
                        loadingKey: 'ktp',
                        currentLoading: bizUploadLoading,
                        theme: 'amber'
                      })}
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingBiz || !bizName.trim() || !bizOwnerName.trim()}
                      className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 disabled:opacity-50 transition-all"
                    >
                      {isSubmittingBiz ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Mendaftarkan Usaha ke Database Pemerintah...</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-4 h-4" />
                          <span>Daftarkan Usaha & Terbitkan Surat Izin Resmi (SIU/NIB)</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* RIGHT SIDE: BUSINESS PERMIT PREVIEWS & REGISTERED BUSINESSES LIST (5 COLS) */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* SUCCESS NOTIFICATION */}
                {bizSuccessPermit && bizSuccessDoc && (
                  <div className="bg-amber-950/40 border-2 border-amber-500/60 rounded-xl p-4 shadow-xl space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                      <CheckCircle2 className="w-5 h-5 text-amber-400" />
                      <span>SURAT IZIN USAHA RESMI BERHASIL DISAHKAN!</span>
                    </div>

                    <div className="bg-[#090C11] border border-amber-800/60 rounded-lg p-3 text-xs space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nomor Registrasi:</span>
                        <span className="font-bold text-amber-300">{bizSuccessPermit.permitNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nama Usaha:</span>
                        <span className="text-white font-semibold">{bizName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Penanggung Jawab:</span>
                        <span className="text-gray-200">{bizSuccessPermit.applicantName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status Legalitas:</span>
                        <span className="text-emerald-400 font-bold">TERDAFTAR & SAH (APPROVED)</span>
                      </div>
                    </div>

                    {/* 4 ATTACHED PHOTOS GALLERY IN SUCCESS CARD */}
                    {(bizSuccessPermit.photos?.shopFrontPhoto || bizSuccessPermit.photos?.businessInfoPhoto || bizSuccessPermit.photos?.businessPropertyPhoto || bizSuccessPermit.photos?.ktpPhoto) && (
                      <div className="pt-2 border-t border-amber-800/40">
                        <span className="text-[10px] font-mono text-amber-300/80 block mb-1.5 flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          4 BERKAS FOTO DOKUMENTASI USAHA:
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {bizSuccessPermit.photos.shopFrontPhoto && (
                            <div 
                              onClick={() => setLightboxItem({ url: bizSuccessPermit.photos!.shopFrontPhoto!, title: 'Foto Depan Toko', subtitle: bizName })}
                              className="group cursor-pointer relative rounded border border-amber-700/60 overflow-hidden bg-black/60 hover:border-amber-400 transition"
                            >
                              <img src={bizSuccessPermit.photos.shopFrontPhoto} alt="Depan Toko" className="w-full h-14 object-cover" />
                              <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[7px] text-center font-mono py-0.5 text-amber-300 truncate px-0.5">
                                Depan
                              </span>
                            </div>
                          )}
                          {bizSuccessPermit.photos.businessInfoPhoto && (
                            <div 
                              onClick={() => setLightboxItem({ url: bizSuccessPermit.photos!.businessInfoPhoto!, title: 'Informasi Business (/business info)', subtitle: bizName })}
                              className="group cursor-pointer relative rounded border border-amber-700/60 overflow-hidden bg-black/60 hover:border-amber-400 transition"
                            >
                              <img src={bizSuccessPermit.photos.businessInfoPhoto} alt="Info" className="w-full h-14 object-cover" />
                              <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[7px] text-center font-mono py-0.5 text-amber-300 truncate px-0.5">
                                /biz info
                              </span>
                            </div>
                          )}
                          {bizSuccessPermit.photos.businessPropertyPhoto && (
                            <div 
                              onClick={() => setLightboxItem({ url: bizSuccessPermit.photos!.businessPropertyPhoto!, title: 'Properti Business', subtitle: bizName })}
                              className="group cursor-pointer relative rounded border border-amber-700/60 overflow-hidden bg-black/60 hover:border-amber-400 transition"
                            >
                              <img src={bizSuccessPermit.photos.businessPropertyPhoto} alt="Properti" className="w-full h-14 object-cover" />
                              <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[7px] text-center font-mono py-0.5 text-amber-300 truncate px-0.5">
                                Properti
                              </span>
                            </div>
                          )}
                          {bizSuccessPermit.photos.ktpPhoto && (
                            <div 
                              onClick={() => setLightboxItem({ url: bizSuccessPermit.photos!.ktpPhoto!, title: 'Foto KTP Pemilik', subtitle: bizSuccessPermit.applicantName })}
                              className="group cursor-pointer relative rounded border border-amber-700/60 overflow-hidden bg-black/60 hover:border-amber-400 transition"
                            >
                              <img src={bizSuccessPermit.photos.ktpPhoto} alt="KTP" className="w-full h-14 object-cover" />
                              <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[7px] text-center font-mono py-0.5 text-amber-300 truncate px-0.5">
                                KTP
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(bizSuccessDoc)}
                        className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat & Cetak Surat Izin</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(bizSuccessPermit.permitNumber, 'biz-copy')}
                        className="py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs flex items-center gap-1 transition"
                      >
                        {copiedId === 'biz-copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Salin No.</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* REGISTERED BUSINESSES IN GOVERNMENT DATABASE */}
                <div className="bg-[#131823] border border-gray-800 rounded-xl p-4 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <h4 className="text-xs font-bold text-gray-200 flex items-center gap-1.5 font-mono">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      DAFTAR USAHA TERDAFTAR DI DATABASE NEGARA
                    </h4>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {govPermits.filter(p => p.category === 'BUSINESS').length} Terdaftar
                    </span>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {govPermits
                      .filter(p => p.category === 'BUSINESS')
                      .map((p) => (
                        <div
                          key={p.id}
                          className="p-3 bg-[#0A0D14] border border-gray-800 hover:border-amber-700/60 rounded-lg transition-colors text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-200">{p.title.replace('Surat Izin Operasional Usaha: ', '')}</span>
                            <span className="font-mono text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800">
                              {p.status}
                            </span>
                          </div>
                          <div className="text-gray-400 text-[11px] truncate">
                            Pemilik: <span className="text-gray-200">{p.applicantName}</span> ({p.applicantId})
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono pt-1">
                            <span>No: {p.permitNumber}</span>
                            <span>Masa: {p.validUntil}</span>
                          </div>

                          {/* 4 ATTACHED PHOTOS PREVIEW */}
                          {p.photos && (p.photos.shopFrontPhoto || p.photos.businessInfoPhoto || p.photos.businessPropertyPhoto || p.photos.ktpPhoto) && (
                            <div className="pt-2 mt-1 border-t border-gray-800/80 flex items-center justify-between">
                              <span className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1 font-semibold">
                                <Camera className="w-3 h-3 text-amber-400" />
                                4 Foto Berkas Usaha:
                              </span>
                              <div className="flex items-center gap-1">
                                {p.photos.shopFrontPhoto && (
                                  <button
                                    type="button"
                                    onClick={() => setLightboxItem({ url: p.photos!.shopFrontPhoto!, title: 'Foto Depan Toko', subtitle: p.title })}
                                    className="w-5 h-5 rounded overflow-hidden border border-gray-700 hover:border-amber-400 transition"
                                    title="Foto Depan Toko"
                                  >
                                    <img src={p.photos.shopFrontPhoto} alt="Depan" className="w-full h-full object-cover" />
                                  </button>
                                )}
                                {p.photos.businessInfoPhoto && (
                                  <button
                                    type="button"
                                    onClick={() => setLightboxItem({ url: p.photos!.businessInfoPhoto!, title: 'Informasi Business (/business info)', subtitle: p.title })}
                                    className="w-5 h-5 rounded overflow-hidden border border-gray-700 hover:border-amber-400 transition"
                                    title="Informasi Business"
                                  >
                                    <img src={p.photos.businessInfoPhoto} alt="Info" className="w-full h-full object-cover" />
                                  </button>
                                )}
                                {p.photos.businessPropertyPhoto && (
                                  <button
                                    type="button"
                                    onClick={() => setLightboxItem({ url: p.photos!.businessPropertyPhoto!, title: 'Properti Business', subtitle: p.title })}
                                    className="w-5 h-5 rounded overflow-hidden border border-gray-700 hover:border-amber-400 transition"
                                    title="Properti Business"
                                  >
                                    <img src={p.photos.businessPropertyPhoto} alt="Properti" className="w-full h-full object-cover" />
                                  </button>
                                )}
                                {p.photos.ktpPhoto && (
                                  <button
                                    type="button"
                                    onClick={() => setLightboxItem({ url: p.photos!.ktpPhoto!, title: 'Foto KTP Pemilik', subtitle: p.applicantName })}
                                    className="w-5 h-5 rounded overflow-hidden border border-gray-700 hover:border-amber-400 transition"
                                    title="KTP Pemilik"
                                  >
                                    <img src={p.photos.ktpPhoto} alt="KTP" className="w-full h-full object-cover" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LAYANAN LAIN (WCL SENJATA, LAPOR KEHILANGAN STLK, IZIN ACARA) */}
        {/* ========================================================================= */}
        {activeTab === 'other' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-950/70 via-[#111827] to-emerald-950/70 border border-emerald-800/50 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-emerald-600/20 border border-emerald-500/40 rounded-xl text-emerald-400 shrink-0">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    LAYANAN PERIZINAN & SURAT RESMI WARGA LAINNYA
                  </h2>
                  <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                    Pengajuan lisensi senjata api legal (WCL), laporan kehilangan dokumen (STLK), dan permohonan izin keramaian / acara publik terpadu.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-[#131823] border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
                
                {/* SELECT SERVICE TYPE CHIPS */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOtherServiceType('WCL')}
                    className={`p-3 rounded-lg border text-left transition ${
                      otherServiceType === 'WCL'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-md'
                        : 'bg-[#0D1117] border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <Crosshair className="w-4 h-4 text-amber-400" />
                      <span>Izin Senjata (WCL)</span>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">Lisensi Senjata Api Sipil</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtherServiceType('STLK')}
                    className={`p-3 rounded-lg border text-left transition ${
                      otherServiceType === 'STLK'
                        ? 'bg-blue-950/60 border-blue-500 text-blue-200 shadow-md'
                        : 'bg-[#0D1117] border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-blue-400" />
                      <span>Lapor Kehilangan</span>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">STLK SPKT Kepolisian</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtherServiceType('EVENT')}
                    className={`p-3 rounded-lg border text-left transition ${
                      otherServiceType === 'EVENT'
                        ? 'bg-purple-950/60 border-purple-500 text-purple-200 shadow-md'
                        : 'bg-[#0D1117] border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-purple-400" />
                      <span>Izin Keramaian</span>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">Festival & Acara Publik</span>
                  </button>
                </div>

                <form onSubmit={handleGenerateOtherDoc} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">
                        Nama Pemohon Warga <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={otherApplicantName}
                        onChange={(e) => setOtherApplicantName(e.target.value)}
                        placeholder="Franklin Clinton"
                        className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">NIK / Citizen ID</label>
                      <input
                        type="text"
                        value={otherApplicantNik}
                        onChange={(e) => setOtherApplicantNik(e.target.value)}
                        placeholder="CID-84920"
                        className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-300 mb-1">Nomor Telepon</label>
                    <input
                      type="text"
                      value={otherPhone}
                      onChange={(e) => setOtherPhone(e.target.value)}
                      placeholder="555-0142"
                      className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-300 mb-1">
                      {otherServiceType === 'WCL' 
                        ? 'Tipe / Seri Senjata Api & Tujuan Penggunaan' 
                        : otherServiceType === 'STLK' 
                        ? 'Rincian Barang / Dokumen yang Hilang & Kronologi Singkat' 
                        : 'Nama Acara, Estimasi Jumlah Peserta & Lokasi Penyelenggaraan'}
                    </label>
                    <textarea
                      value={otherDetails}
                      onChange={(e) => setOtherDetails(e.target.value)}
                      placeholder={
                        otherServiceType === 'WCL' 
                          ? 'Contoh: Combat Pistol 9mm (Seri: WEP-4491) untuk perlindungan diri...' 
                          : otherServiceType === 'STLK' 
                          ? 'Contoh: 1 Buah Dompet kulit coklat berisi KTP, SIM A, dan kartu bank...' 
                          : 'Contoh: Pameran Mobil Klasik & Bazaar UMKM di area parkir Pantai Vespucci...'
                      }
                      className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2.5 text-white h-24 resize-none"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingOther || !otherApplicantName.trim()}
                      className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 disabled:opacity-50 transition-all"
                    >
                      {isSubmittingOther ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Memproses Penerbitan Dokumen Resmi...</span>
                        </>
                      ) : (
                        <>
                          <FileCheck className="w-4 h-4" />
                          <span>Terbitkan Dokumen & Simpan ke Database</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* RIGHT PREVIEW */}
              <div className="lg:col-span-5 space-y-4">
                {otherSuccessDoc ? (
                  <div className="bg-emerald-950/40 border-2 border-emerald-500/60 rounded-xl p-4 shadow-xl space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>DOKUMEN RESMI TELAH SELESAI DITERBITKAN!</span>
                    </div>

                    <div className="bg-[#090C11] border border-emerald-800/60 rounded-lg p-3 text-xs space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nomor Registrasi:</span>
                        <span className="font-bold text-amber-300">{otherSuccessDoc.docNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Pemohon:</span>
                        <span className="text-white">{otherSuccessDoc.recipientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Jenis Dokumen:</span>
                        <span className="text-emerald-400">{otherSuccessDoc.title}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(otherSuccessDoc)}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat & Cetak Dokumen</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#131823] border border-gray-800 rounded-xl p-5 shadow-xl text-center text-gray-500 space-y-2">
                    <FileText className="w-8 h-8 mx-auto opacity-40" />
                    <p className="text-xs">Isi formulir di sebelah kiri untuk menerbitkan lisensi senjata WCL, laporan kehilangan STLK, atau izin keramaian publik.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CEK KEASLIAN DOKUMEN PUBLIK (VERIFICATION SCANNER) */}
        {/* ========================================================================= */}
        {activeTab === 'verify' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-950/70 via-[#111827] to-purple-950/70 border border-purple-800/50 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-purple-600/20 border border-purple-500/40 rounded-xl text-purple-400 shrink-0">
                  <QrCode className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    PORTAL VERIFIKASI KEASLIAN DOKUMEN & PERIZINAN NEGARA
                  </h2>
                  <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                    Masukkan nomor surat SKCK, nomor izin usaha (SIU/NIB), nomor lisensi senjata (WCL), atau NIK warga untuk memverifikasi keaslian dan status legalitas dokumen.
                  </p>
                </div>
              </div>
            </div>

            {/* SEARCH INPUT */}
            <div className="bg-[#131823] border border-gray-800 rounded-xl p-4 shadow-xl">
              <div className="relative">
                <input
                  type="text"
                  value={verifyQuery}
                  onChange={(e) => setVerifyQuery(e.target.value)}
                  placeholder="Ketik Nomor Dokumen (Contoh: SKCK/HSPD..., BIZ/GOV..., WCL/...) atau Nama Pemohon / NIK..."
                  className="w-full bg-[#0D1117] border border-gray-700 focus:border-purple-500 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none pl-10 font-mono"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            {/* RESULTS LIST */}
            <div className="space-y-4">
              {verifyQuery.trim() && (
                <div className="text-xs font-mono text-gray-400">
                  Ditemukan: <strong className="text-white">{verificationResults.docs.length}</strong> Arsip Dokumen Resmi & <strong className="text-white">{verificationResults.permits.length}</strong> Arsip Perizinan Pemerintahan.
                </div>
              )}

              {/* DOCUMENT RESULTS */}
              {verificationResults.docs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-[#131823] border border-gray-800 hover:border-purple-700/60 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                        {doc.docNumber}
                      </span>
                      <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-semibold">
                        TERDAFTAR & SAH
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white">{doc.title}</h3>
                    <p className="text-xs text-gray-300">
                      Pemohon: <strong className="text-white">{doc.recipientName}</strong> ({doc.recipientId || 'Sipil'}) • Diterbitkan: {doc.date}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka & Cetak Dokumen</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* PERMIT RESULTS */}
              {verificationResults.permits.map((pmt) => (
                <div
                  key={pmt.id}
                  className="bg-[#131823] border border-gray-800 hover:border-amber-700/60 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                        {pmt.permitNumber}
                      </span>
                      <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-semibold">
                        {pmt.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white">{pmt.title}</h3>
                    <p className="text-xs text-gray-300">
                      Pemohon / Badan: <strong className="text-white">{pmt.applicantName}</strong> ({pmt.applicantId}) • Masa: {pmt.validUntil}
                    </p>
                  </div>
                </div>
              ))}

              {!verifyQuery.trim() && (
                <div className="p-8 text-center text-gray-500 border border-gray-800/60 rounded-xl bg-[#111520]">
                  <Search className="w-10 h-10 mx-auto opacity-30 mb-2" />
                  <p className="text-xs">Ketik nomor registrasi dokumen pada kolom pencarian di atas untuk memeriksa keaslian surat.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5, 6, 7: CITIZEN LOOKUP (BURONAN/DPO, TILANG, KENDARAAN IMPOUND) */}
        {/* ========================================================================= */}
        {(activeTab === 'wanted' || activeTab === 'citations' || activeTab === 'impounds') && (
          <CitizenPublicLookupViews
            activeSubTab={activeTab}
            onSelectSubTab={(tab) => setActiveTab(tab)}
            boloList={boloList}
            citations={citations}
            impounds={impounds}
            currentOfficer={currentOfficer}
          />
        )}

      </main>

      {/* ========================================================================= */}
      {/* REALISTIC DOCUMENT PRINT & PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0B0E14] border border-gray-700 rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* MODAL ACTION BAR */}
            <div className="bg-[#161B22] p-3 border-b border-gray-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-gray-200">Pratinjau Dokumen Resmi Kenegaraan</span>
                <span className="font-mono text-[11px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                  {previewDoc.docNumber}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSignatoryDoc(previewDoc)}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded font-bold flex items-center gap-1.5 transition shadow"
                  title="Kelola & edit tanda tangan manual petugas (Rank 2+) dan petinggi pengesah"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Penandatangan (Rank 2+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak (Print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportImage('citizen-official-paper-preview', previewDoc.docNumber.replace(/[\/\\]/g, '_'))}
                  disabled={isExporting}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Menyimpan...' : 'Download Gambar'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* REALISTIC PARCHMENT PAPER VIEW */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-gray-950 flex justify-center">
              <div
                id="citizen-official-paper-preview"
                className="w-full max-w-2xl bg-[#FFFDF9] text-gray-900 font-serif p-8 sm:p-10 shadow-2xl border-4 border-double border-gray-300 relative text-xs leading-relaxed"
                style={{ minHeight: '850px' }}
              >
                {/* WATERMARK */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                  <img
                    src={branding.logoUrl || HSPD_LOGO_URL}
                    alt="Watermark"
                    className="w-96 h-96 object-contain"
                  />
                </div>

                {/* HEADER KOP SURAT */}
                <div className="border-b-2 border-black pb-3 mb-4 text-center relative z-10 flex items-center justify-between">
                  <img
                    src={previewDoc.category === 'PERIZINAN_USAHA' ? HSPD_LOGO_URL : (branding.logoUrl || HSPD_LOGO_URL)}
                    alt="Logo"
                    className="w-16 h-16 object-contain"
                  />
                  <div className="flex-1 px-4">
                    <h2 className="text-sm sm:text-base font-black tracking-wider uppercase font-sans">
                      {previewDoc.category === 'PERIZINAN_USAHA' 
                        ? 'PEMERINTAH NEGARA HIGHSTATE' 
                        : 'KEPOLISIAN NEGARA HIGHSTATE (HIGHSTATE POLICE DEPT)'}
                    </h2>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700 font-sans">
                      {previewDoc.category === 'PERIZINAN_USAHA' 
                        ? 'SEKRETARIAT NEGARA & KEMENTERIAN PERINDUSTRIAN DAN PERDAGANGAN' 
                        : 'MARKAS BESAR KEPOLISIAN - MISSION ROW HEADQUARTERS'}
                    </h3>
                    <p className="text-[10px] text-gray-600 font-sans">
                      Wilayah Hukum Kota Los Santos & Sekitarnya • Telepon SPKT: 911 / (555) 0100
                    </p>
                  </div>
                  <div className="w-16 flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-gray-700" />
                  </div>
                </div>

                {/* JUDUL DOKUMEN & NOMOR SURAT */}
                <div className="text-center my-4 relative z-10">
                  <h1 className="text-sm sm:text-base font-bold underline uppercase tracking-wider font-sans">
                    {previewDoc.title}
                  </h1>
                  <p className="text-[11px] font-mono text-gray-800 mt-0.5">
                    Nomor: {previewDoc.docNumber}
                  </p>
                </div>

                {/* PREAMBLE / OPENING TEXT */}
                <p className="mb-3 text-justify relative z-10">
                  {previewDoc.openingText}
                </p>

                {/* RECIPIENT IDENTITAS TABLE */}
                <div className="bg-gray-50 border border-gray-300 p-3 rounded mb-4 font-sans text-[11px] relative z-10 space-y-1">
                  <div className="grid grid-cols-12">
                    <span className="col-span-4 text-gray-600">Nama Pemohon / Warga</span>
                    <span className="col-span-8 font-bold text-black">: {previewDoc.recipientName}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-4 text-gray-600">Nomor Identitas (NIK/CID)</span>
                    <span className="col-span-8 font-mono">: {previewDoc.recipientId || '-'}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-4 text-gray-600">Alamat Domisili</span>
                    <span className="col-span-8">: {previewDoc.recipientAddress || '-'}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-4 text-gray-600">Masa Berlaku Surat</span>
                    <span className="col-span-8 font-bold text-gray-800">: {previewDoc.validUntil || '-'}</span>
                  </div>
                </div>

                {/* CLAUSES / ISI SURAT */}
                <div className="space-y-2 mb-4 relative z-10">
                  {previewDoc.clauses.map((clause, idx) => (
                    <div key={clause.id || idx} className="text-justify">
                      <span className="font-bold font-sans">{clause.clauseNumber || `${idx + 1}.`} {clause.title ? `${clause.title}: ` : ''}</span>
                      <span>{clause.content}</span>
                    </div>
                  ))}
                </div>

                {/* CLOSING TEXT */}
                <p className="mb-4 text-justify relative z-10">
                  {previewDoc.closingText}
                </p>

                {/* LAMPIRAN BERKAS FOTO SKCK (FOTO /STATS & FOTO KTP) - KHUSUS PEMERIKSAAN PETUGAS */}
                {Boolean(currentOfficer) && previewDoc.skckPhotos && (previewDoc.skckPhotos.statsPhoto || previewDoc.skckPhotos.ktpPhoto) && (
                  <div className="my-4 pt-3 border-t-2 border-dashed border-gray-400 relative z-10 font-sans">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[10px] uppercase tracking-wide text-gray-800">
                        LAMPIRAN DOKUMEN: REKAM STATUS IN-GAME (/STATS) & IDENTITAS KTP PEMOHON
                      </span>
                      <span className="text-[8.5px] font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
                        ARSIP RESMI TERVERIFIKASI
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {/* 1. Foto /stats */}
                      <div className="border border-gray-400 p-2 bg-white rounded shadow-sm flex flex-col items-center">
                        <span className="text-[9px] font-bold text-gray-700 mb-1 uppercase tracking-tight">
                          1. FOTO REKAM STATUS (/STATS)
                        </span>
                        {previewDoc.skckPhotos.statsPhoto ? (
                          <img
                            src={previewDoc.skckPhotos.statsPhoto}
                            alt="Foto /stats In-Game"
                            className="w-full h-36 object-contain rounded bg-black/95 border border-gray-300 cursor-pointer"
                            onClick={() => setLightboxItem({ url: previewDoc.skckPhotos!.statsPhoto!, title: 'Lampiran 1: Foto /stats In-Game', subtitle: previewDoc.recipientName })}
                          />
                        ) : (
                          <div className="w-full h-36 border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 font-mono italic">
                            [Foto /stats Tidak Dilampirkan]
                          </div>
                        )}
                        <span className="text-[8px] text-gray-500 font-mono mt-1">Screenshot Status Karakter IC</span>
                      </div>

                      {/* 2. Foto KTP */}
                      <div className="border border-gray-400 p-2 bg-white rounded shadow-sm flex flex-col items-center">
                        <span className="text-[9px] font-bold text-gray-700 mb-1 uppercase tracking-tight">
                          2. FOTO IDENTITAS KTP PEMOHON
                        </span>
                        {previewDoc.skckPhotos.ktpPhoto ? (
                          <img
                            src={previewDoc.skckPhotos.ktpPhoto}
                            alt="Foto KTP Pemohon"
                            className="w-full h-36 object-contain rounded bg-black/95 border border-gray-300 cursor-pointer"
                            onClick={() => setLightboxItem({ url: previewDoc.skckPhotos!.ktpPhoto!, title: 'Lampiran 2: Foto KTP Pemohon', subtitle: previewDoc.recipientName })}
                          />
                        ) : (
                          <div className="w-full h-36 border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 font-mono italic">
                            [Foto KTP Tidak Dilampirkan]
                          </div>
                        )}
                        <span className="text-[8px] text-gray-500 font-mono mt-1">Kartu Identitas Resmi Terdaftar</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* LAMPIRAN 4 FOTO BADAN USAHA - KHUSUS PEMERIKSAAN PETUGAS */}
                {Boolean(currentOfficer) && previewDoc.businessPhotos && (previewDoc.businessPhotos.shopFrontPhoto || previewDoc.businessPhotos.businessInfoPhoto || previewDoc.businessPhotos.businessPropertyPhoto || previewDoc.businessPhotos.ktpPhoto) && (
                  <div className="my-4 pt-3 border-t-2 border-dashed border-gray-400 relative z-10 font-sans">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[10px] uppercase tracking-wide text-gray-800">
                        LAMPIRAN DOKUMEN: DOKUMENTASI KELAYAKAN USAHA & IDENTITAS PEMILIK (4 BERKAS)
                      </span>
                      <span className="text-[8.5px] font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
                        VERIFIKASI FISIK BADAN USAHA
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* 1. Foto Depan Toko */}
                      <div className="border border-gray-400 p-1.5 bg-white rounded shadow-sm flex flex-col items-center">
                        <span className="text-[8.5px] font-bold text-gray-700 mb-1 uppercase tracking-tight">
                          1. FOTO DEPAN TOKO / FASAD
                        </span>
                        {previewDoc.businessPhotos.shopFrontPhoto ? (
                          <img
                            src={previewDoc.businessPhotos.shopFrontPhoto}
                            alt="Foto Depan Toko"
                            className="w-full h-28 object-cover rounded bg-black/10 border border-gray-300 cursor-pointer"
                            onClick={() => setLightboxItem({ url: previewDoc.businessPhotos!.shopFrontPhoto!, title: 'Lampiran 1: Foto Depan Toko', subtitle: previewDoc.title })}
                          />
                        ) : (
                          <div className="w-full h-28 border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-[9px] text-gray-400 font-mono italic">
                            [Foto Depan Toko Tidak Dilampirkan]
                          </div>
                        )}
                        <span className="text-[7.5px] text-gray-500 font-mono mt-0.5">Tampak Depan Tempat Usaha</span>
                      </div>

                      {/* 2. Informasi Business */}
                      <div className="border border-gray-400 p-1.5 bg-white rounded shadow-sm flex flex-col items-center">
                        <span className="text-[8.5px] font-bold text-gray-700 mb-1 uppercase tracking-tight">
                          2. INFORMASI BUSINESS (/BUSINESS INFO)
                        </span>
                        {previewDoc.businessPhotos.businessInfoPhoto ? (
                          <img
                            src={previewDoc.businessPhotos.businessInfoPhoto}
                            alt="Informasi Business"
                            className="w-full h-28 object-contain rounded bg-black/95 border border-gray-300 cursor-pointer"
                            onClick={() => setLightboxItem({ url: previewDoc.businessPhotos!.businessInfoPhoto!, title: 'Lampiran 2: Informasi Business (/business info)', subtitle: previewDoc.title })}
                          />
                        ) : (
                          <div className="w-full h-28 border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-[9px] text-gray-400 font-mono italic">
                            [Screenshot /business info Tidak Dilampirkan]
                          </div>
                        )}
                        <span className="text-[7.5px] text-gray-500 font-mono mt-0.5">Panel Sistem Bisnis In-Game</span>
                      </div>

                      {/* 3. Properti Business */}
                      <div className="border border-gray-400 p-1.5 bg-white rounded shadow-sm flex flex-col items-center">
                        <span className="text-[8.5px] font-bold text-gray-700 mb-1 uppercase tracking-tight">
                          3. FOTO PROPERTI & AREA USAHA
                        </span>
                        {previewDoc.businessPhotos.businessPropertyPhoto ? (
                          <img
                            src={previewDoc.businessPhotos.businessPropertyPhoto}
                            alt="Properti Business"
                            className="w-full h-28 object-cover rounded bg-black/10 border border-gray-300 cursor-pointer"
                            onClick={() => setLightboxItem({ url: previewDoc.businessPhotos!.businessPropertyPhoto!, title: 'Lampiran 3: Properti & Fasilitas Usaha', subtitle: previewDoc.title })}
                          />
                        ) : (
                          <div className="w-full h-28 border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-[9px] text-gray-400 font-mono italic">
                            [Foto Properti Tidak Dilampirkan]
                          </div>
                        )}
                        <span className="text-[7.5px] text-gray-500 font-mono mt-0.5">Fasilitas & Interior Operasional</span>
                      </div>

                      {/* 4. Foto KTP Pemilik */}
                      <div className="border border-gray-400 p-1.5 bg-white rounded shadow-sm flex flex-col items-center">
                        <span className="text-[8.5px] font-bold text-gray-700 mb-1 uppercase tracking-tight">
                          4. FOTO KTP PEMILIK USAHA
                        </span>
                        {previewDoc.businessPhotos.ktpPhoto ? (
                          <img
                            src={previewDoc.businessPhotos.ktpPhoto}
                            alt="KTP Pemilik Usaha"
                            className="w-full h-28 object-contain rounded bg-black/95 border border-gray-300 cursor-pointer"
                            onClick={() => setLightboxItem({ url: previewDoc.businessPhotos!.ktpPhoto!, title: 'Lampiran 4: Foto KTP Pemilik Usaha', subtitle: previewDoc.recipientName })}
                          />
                        ) : (
                          <div className="w-full h-28 border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-[9px] text-gray-400 font-mono italic">
                            [Foto KTP Pemilik Tidak Dilampirkan]
                          </div>
                        )}
                        <span className="text-[7.5px] text-gray-500 font-mono mt-0.5">Identitas Sah Penanggung Jawab</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* DATE & LOCATION */}
                <div className="text-right text-[11px] font-sans mb-4 relative z-10">
                  <span>Ditetapkan di: Los Santos</span><br />
                  <span>Pada tanggal: {previewDoc.date}</span>
                </div>

                {/* SIGNATURES & OFFICIAL SEALS (PEMOHON, PETUGAS PELAKSANA RANK 2+, & PETINGGI PENGESAH) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-300 relative z-10 items-end text-center font-sans">
                  {/* 1. PEMOHON / RECIPIENT */}
                  <div className="flex flex-col items-center">
                    <p className="text-[9.5px] text-gray-600 mb-8 leading-tight">
                      {previewDoc.recipientSignatureTitle || 'Pemohon / Pemegang Hak,'}
                    </p>
                    <p className="font-bold underline text-xs text-gray-900">
                      {previewDoc.recipientSignatureName || previewDoc.recipientName}
                    </p>
                    <p className="text-[9px] text-gray-500 font-mono mt-0.5">Pemohon Yang Bersangkutan</p>
                  </div>

                  {/* 2. PETUGAS PELAKSANA (RANK 2 S/D ATASAN) */}
                  <div className="flex flex-col items-center border-t sm:border-t-0 sm:border-l sm:border-r border-gray-200/80 pt-2 sm:pt-0 px-1">
                    <p className="text-[9.5px] text-blue-900 font-semibold mb-8 leading-tight">
                      {previewDoc.officerSignatureTitle || previewDoc.issuerSignatureTitle || 'Petugas Pelaksana & Pemeriksa,'}
                    </p>
                    <p className="font-bold underline text-xs text-blue-950">
                      {previewDoc.officerSignatureName || previewDoc.issuerSignatureName || previewDoc.issuerName || 'Amy Santiago'}
                    </p>
                    <p className="text-[8.5px] text-gray-600 font-mono mt-0.5">
                      {previewDoc.officerSignatureRank || previewDoc.issuerSignatureSubtitle || previewDoc.issuerRank || 'POLICE OFFICER II [PO II]'} [{previewDoc.officerSignatureBadge || previewDoc.issuerBadge || '#215'}]
                    </p>
                    <span className="text-[7.5px] text-blue-800 font-mono mt-0.5 font-semibold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      {previewDoc.officerSignatureStatus === 'PENDING' ? '⏳ Menunggu TTD Petugas' : '✓ Tanda Tangan Petugas Sah'}
                    </span>
                  </div>

                  {/* 3. PETINGGI / ATASAN PENGESAH DENGAN STEMPEL RESMI */}
                  <div className="relative flex flex-col items-center pt-2 sm:pt-0">
                    {/* STAMP OVERLAY */}
                    <div className="absolute -top-7 -right-1 sm:right-0 opacity-85 pointer-events-none">
                      <OfficialSeal type={previewDoc.highOfficialSeal || previewDoc.primarySeal || 'HSPD_OFFICIAL'} size={100} />
                    </div>

                    <p className="text-[9.5px] text-amber-950 font-semibold mb-8 leading-tight">
                      {previewDoc.highOfficialSignatureTitle || previewDoc.acknowledgedByTitle || 'Mengetahui & Mengesahkan,'}
                    </p>
                    <p className="font-bold underline text-xs text-amber-950">
                      {previewDoc.highOfficialSignatureName || previewDoc.acknowledgedByName || (previewDoc.category === 'IZIN_USAHA' ? 'Momo Hatakeyama' : 'Jackie Xianlao')}
                    </p>
                    <p className="text-[8.5px] text-amber-900 font-mono mt-0.5">
                      {previewDoc.highOfficialSignatureRank || previewDoc.acknowledgedByRank || (previewDoc.category === 'IZIN_USAHA' ? 'PRESIDENT [RANK 6]' : 'CHIEF OF POLICE [COP]')}
                    </p>
                    <span className="text-[7.5px] text-amber-800 font-mono mt-0.5 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      {previewDoc.highOfficialSignatureStatus === 'PENDING' ? '⏳ Menunggu Pengesahan Petinggi' : '✓ Otoritas Petinggi Sah'}
                    </span>
                  </div>
                </div>

                {/* FOOTER NOTICE */}
                <div className="mt-8 pt-2 border-t border-gray-200 text-center text-[9px] text-gray-400 font-sans relative z-10">
                  Dokumen Elektronik Sah • Diverifikasi oleh Sistem Komputasi Terpadu Kepolisian & Pemerintahan HighState
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FULLSCREEN PHOTO LIGHTBOX MODAL */}
      {lightboxItem && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxItem(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-[#0D111A] border border-gray-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#121723]">
              <div className="flex items-center gap-2 truncate">
                <Camera className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="truncate">
                  <h3 className="font-bold text-sm text-white truncate">{lightboxItem.title}</h3>
                  {lightboxItem.subtitle && (
                    <p className="text-[11px] text-gray-400 truncate">{lightboxItem.subtitle}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={lightboxItem.url}
                  download={`lampiran-${Date.now()}.png`}
                  className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition"
                  title="Unduh Foto Ini"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxItem(null)}
                  className="p-1.5 bg-gray-800 hover:bg-rose-900/60 text-gray-400 hover:text-rose-300 rounded-lg transition"
                  title="Tutup Pratinjau"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Photo Canvas */}
            <div className="flex-1 bg-black/95 p-3 flex items-center justify-center overflow-auto min-h-[300px]">
              <img
                src={lightboxItem.url}
                alt={lightboxItem.title}
                className="max-h-[72vh] max-w-full object-contain rounded shadow-lg"
              />
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-800 bg-[#121723] flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <span>Resolusi Kompresi Terverifikasi HighState CAD/MDT</span>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-sans transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIGNATORY & STATUS MANAGEMENT MODAL (FOR RANK 2 S/D ATASAN) */}
      {selectedSignatoryDoc && (
        <CitizenServiceSignatoryModal
          document={selectedSignatoryDoc}
          currentOfficer={currentOfficer}
          isOpen={Boolean(selectedSignatoryDoc)}
          onClose={() => setSelectedSignatoryDoc(null)}
          onSaveSignatories={(updatedDoc, openPreviewImmediately) => {
            const updated = saveOfficialDocument(updatedDoc);
            setOfficialDocs(updated);
            setSelectedSignatoryDoc(null);
            if (openPreviewImmediately || (previewDoc && previewDoc.id === updatedDoc.id)) {
              setPreviewDoc(updatedDoc);
            }
          }}
        />
      )}

    </div>
  );
};
