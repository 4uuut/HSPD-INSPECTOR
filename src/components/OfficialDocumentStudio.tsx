import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Save,
  Plus,
  Trash2,
  Copy,
  Check,
  Search,
  Shield,
  Award,
  FileCheck,
  Eye,
  RefreshCw,
  FolderOpen,
  Send,
  AlertTriangle,
  QrCode,
  Sliders,
  ChevronRight,
  Stamp as StampIcon,
  User,
  Building,
  CheckCircle2,
  Calendar,
  Lock,
  Layers,
  Upload,
  PenTool,
  Image as ImageIcon,
  Sparkles,
  RotateCcw,
  Palette,
  Minimize2,
  Maximize2,
  FilePlus2,
  Hash,
  Crown
} from 'lucide-react';
import { 
  OfficialDocument, 
  DocumentCategory, 
  DocumentClassification, 
  SealType, 
  OfficerProfile,
  isGovernmentOfficer
} from '../types';
import { DOCUMENT_PRESET_TEMPLATES, DocumentTemplatePreset } from '../data/documentTemplates';
import { 
  getSavedOfficialDocuments, 
  saveOfficialDocument, 
  deleteOfficialDocument, 
  formatDocumentAsText 
} from '../utils/documentStorage';
import { exportElementAsImage } from '../utils/exportDocumentAsImage';
import { OfficialSeal, CustomUploadedSeal } from './OfficialSeals';
import { SignaturePadModal } from './SignaturePadModal';
import { 
  DiscordWebhookConfig, 
  getSavedDocumentWebhookConfig, 
  getSavedGovDocumentWebhookConfig,
  sendOfficialDocumentToDiscord 
} from '../utils/discordWebhook';
import { HSPD_LOGO_URL, HSPD_LOGO_FALLBACK, getActiveLogoUrl } from '../assets/logo';
import { GovernmentCentralAuthModal } from './GovernmentCentralAuthModal';

interface OfficialDocumentStudioProps {
  currentOfficer: OfficerProfile | null;
  webhookConfig?: DiscordWebhookConfig;
}

type SignatureTarget = 'issuer' | 'recipient' | 'acknowledged' | null;

export const OfficialDocumentStudio: React.FC<OfficialDocumentStudioProps> = ({
  currentOfficer,
  webhookConfig
}) => {
  // Archive List
  const [savedDocs, setSavedDocs] = useState<OfficialDocument[]>(() => getSavedOfficialDocuments());
  const [archiveSearch, setArchiveSearch] = useState('');
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  // Sync saved documents with other tabs and Firestore
  useEffect(() => {
    const handleDocsSync = (e: any) => {
      if (e && e.detail && Array.isArray(e.detail)) {
        setSavedDocs(e.detail);
      } else {
        setSavedDocs(getSavedOfficialDocuments());
      }
    };

    // Load draft from external triggers (e.g. Government Executive Suite)
    const handleLoadDraft = (e: any) => {
      if (e && e.detail) {
        const { presetId, docData } = e.detail;
        let baseDoc = DOCUMENT_PRESET_TEMPLATES[0].defaultDoc;
        if (presetId) {
          const found = DOCUMENT_PRESET_TEMPLATES.find(p => p.id === presetId);
          if (found) baseDoc = found.defaultDoc;
        }
        setActiveDoc(prev => ({
          ...baseDoc,
          ...prev,
          id: `doc-${Date.now()}`,
          ...(docData || {}),
          createdAt: Date.now(),
          updatedAt: Date.now()
        }));
        setSaveSuccessMsg(`Template dokumen "${docData?.title || 'Resmi'}" berhasil dimuat dari Pusat Operasional Pemerintah!`);
        setTimeout(() => setSaveSuccessMsg(null), 3500);
      }
    };

    window.addEventListener('hspd-documents-updated', handleDocsSync);
    window.addEventListener('load-official-document-draft', handleLoadDraft);
    return () => {
      window.removeEventListener('hspd-documents-updated', handleDocsSync);
      window.removeEventListener('load-official-document-draft', handleLoadDraft);
    };
  }, []);

  // Active Working Document State
  const [activeDoc, setActiveDoc] = useState<OfficialDocument>(() => {
    const defaultTemplate = DOCUMENT_PRESET_TEMPLATES[0].defaultDoc;
    return {
      ...defaultTemplate,
      id: `doc-${Date.now()}`,
      issuerName: currentOfficer?.name || defaultTemplate.issuerName,
      issuerBadge: currentOfficer?.badge || defaultTemplate.issuerBadge,
      issuerRank: currentOfficer?.rank || defaultTemplate.issuerRank,
      showWatermark: true,
      watermarkOpacity: 0.11,
      watermarkSize: 450,
      paperTexture: 'security_parchment',
      paperBorderType: 'official_guilloche',
      sealDisplayMode: 'preset',
      customSealRotation: -7,
      customSealOpacity: 0.88,
      customSealScale: 1.0,
      customSealColorFilter: 'red',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  });

  // Editor Tabs
  const [activeEditorTab, setActiveEditorTab] = useState<'METADATA' | 'PARTIES' | 'CLAUSES' | 'SEALS_SIGS' | 'PAPER_STYLE'>('METADATA');

  // UI Feedback States
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportingFormat, setExportingFormat] = useState<'png' | 'jpeg' | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  // Signature Modal Target State
  const [activeSigPadTarget, setActiveSigPadTarget] = useState<SignatureTarget>(null);

  // Government Central Auth Modal State
  const [isGovCentralAuthModalOpen, setIsGovCentralAuthModalOpen] = useState(false);
  const [forceGovMode, setForceGovMode] = useState(false);

  // File Upload Refs
  const customStampInputRef = useRef<HTMLInputElement>(null);
  const customWatermarkInputRef = useRef<HTMLInputElement>(null);
  const customHeaderLogoInputRef = useRef<HTMLInputElement>(null);
  const issuerSigUploadRef = useRef<HTMLInputElement>(null);
  const recipientSigUploadRef = useRef<HTMLInputElement>(null);
  const acknowledgedSigUploadRef = useRef<HTMLInputElement>(null);

  // Paper preview ref
  const paperRef = useRef<HTMLDivElement>(null);

  // Handle template selection
  const handleApplyPreset = (preset: DocumentTemplatePreset) => {
    setActiveDoc({
      ...preset.defaultDoc,
      id: `doc-${Date.now()}`,
      issuerName: currentOfficer?.name || preset.defaultDoc.issuerName,
      issuerBadge: currentOfficer?.badge || preset.defaultDoc.issuerBadge,
      issuerRank: currentOfficer?.rank || preset.defaultDoc.issuerRank,
      showWatermark: true,
      watermarkOpacity: activeDoc.watermarkOpacity ?? 0.11,
      watermarkSize: activeDoc.watermarkSize ?? 450,
      paperTexture: activeDoc.paperTexture ?? 'security_parchment',
      paperBorderType: activeDoc.paperBorderType ?? 'official_guilloche',
      sealDisplayMode: activeDoc.sealDisplayMode ?? 'preset',
      customSealImage: activeDoc.customSealImage,
      customSealRotation: activeDoc.customSealRotation ?? -7,
      customSealOpacity: activeDoc.customSealOpacity ?? 0.88,
      customSealScale: activeDoc.customSealScale ?? 1.0,
      customSealColorFilter: activeDoc.customSealColorFilter ?? 'red',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    setSaveSuccessMsg(`Template "${preset.name}" berhasil diterapkan.`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Add new clause
  const handleAddClause = () => {
    const newIndex = activeDoc.clauses.length + 1;
    const newClause = {
      id: `clause-${Date.now()}-${newIndex}`,
      clauseNumber: `Pasal ${newIndex}`,
      title: `KETENTUAN KELENGKAPAN ${newIndex}`,
      content: 'Tuliskan rincian isi ketentuan, dasar pertimbangan, atau pasal penugasan di sini.'
    };
    setActiveDoc(prev => ({
      ...prev,
      clauses: [...prev.clauses, newClause]
    }));
  };

  // Remove clause
  const handleRemoveClause = (id: string) => {
    if (activeDoc.clauses.length <= 1) {
      setSaveSuccessMsg('⚠️ Dokumen harus memiliki minimal 1 klausul atau poin ketentuan.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      return;
    }
    setActiveDoc(prev => ({
      ...prev,
      clauses: prev.clauses.filter(c => c.id !== id)
    }));
  };

  // Update clause
  const handleUpdateClause = (id: string, field: 'clauseNumber' | 'title' | 'content', value: string) => {
    setActiveDoc(prev => ({
      ...prev,
      clauses: prev.clauses.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  // Save document to storage
  const handleSaveDocument = () => {
    const updated = {
      ...activeDoc,
      updatedAt: Date.now()
    };
    const newSavedList = saveOfficialDocument(updated);
    setSavedDocs(newSavedList);
    setActiveDoc(updated);
    
    // Auto send to document webhook if enabled
    const docWebhookCfg = getSavedDocumentWebhookConfig();
    if (docWebhookCfg.webhookUrl && docWebhookCfg.autoSendOnSave) {
      sendOfficialDocumentToDiscord(updated).catch(err => {
        console.warn('Auto send document webhook warning:', err);
      });
    }

    setSaveSuccessMsg('Dokumen resmi berhasil disimpan ke Arsip Markas Besar HSPD!');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Create new blank document
  const handleCreateNewBlank = () => {
    const defaultTemplate = DOCUMENT_PRESET_TEMPLATES[0].defaultDoc;
    setActiveDoc({
      ...defaultTemplate,
      id: `doc-${Date.now()}`,
      docNumber: `DOC/HSPD-GEN/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
      title: 'SURAT DOKUMEN RESMI KEPOLISIAN',
      subject: 'Perihal Pelaksanaan Tugas / Administrasi Kepolisian',
      issuerName: currentOfficer?.name || 'Petugas HSPD',
      issuerBadge: currentOfficer?.badge || '000',
      issuerRank: currentOfficer?.rank || 'POLICE OFFICER',
      showWatermark: true,
      watermarkOpacity: 0.11,
      watermarkSize: 450,
      paperTexture: 'security_parchment',
      paperBorderType: 'official_guilloche',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    setSaveSuccessMsg('Dokumen baru berhasil dibuat.');
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  // Load from archive
  const handleLoadFromArchive = (doc: OfficialDocument) => {
    setActiveDoc(doc);
    setIsArchiveModalOpen(false);
    setSaveSuccessMsg(`Dokumen "${doc.title}" dimuat dari arsip.`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Delete document
  const handleDeleteDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteOfficialDocument(id);
    setSavedDocs(updated);
    if (activeDoc.id === id) {
      handleCreateNewBlank();
    }
    setSaveSuccessMsg('Dokumen berhasil dihapus dari arsip.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Duplicate document
  const handleDuplicateDoc = (doc: OfficialDocument) => {
    const duplicated: OfficialDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      docNumber: `${doc.docNumber}-SALINAN`,
      title: `${doc.title} (SALINAN)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setActiveDoc(duplicated);
    setIsArchiveModalOpen(false);
    setSaveSuccessMsg('Salinan dokumen berhasil dibuat dan dimuat.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Copy Plain Text to Clipboard
  const handleCopyText = async () => {
    const plainText = formatDocumentAsText(activeDoc);
    try {
      await navigator.clipboard.writeText(plainText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch (e) {
      console.error(e);
      alert('Gagal menyalin teks. Silakan salin secara manual.');
    }
  };

  // Print PDF / Paper
  const handlePrint = () => {
    window.print();
  };

  // Export as Image (PNG / JPEG HD)
  const handleExportImage = async (format: 'png' | 'jpeg') => {
    if (!paperRef.current) {
      alert('Elemen dokumen tidak ditemukan untuk dicetak.');
      return;
    }
    setIsExporting(true);
    setExportingFormat(format);
    try {
      const sanitizedDocNumber = (activeDoc.docNumber || 'DOC-HSPD').replace(/[\/\\:*?"<>|]/g, '-').trim();
      const sanitizedTitle = (activeDoc.title || 'DOKUMEN_RESMI').replace(/[\/\\:*?"<>|\s]/g, '_').trim().slice(0, 35);
      const filename = `SURAT_${sanitizedDocNumber}_${sanitizedTitle}`;
      
      const result = await exportElementAsImage(paperRef.current, {
        fileName: filename,
        format,
        scale: 2.5,
        quality: 0.95,
        backgroundColor: format === 'jpeg' ? '#FAF8F3' : null
      });

      if (result.success) {
        setSaveSuccessMsg(`✅ Dokumen berhasil diproses & diunduh sebagai file ${format.toUpperCase()} (Resolusi Tinggi)!`);
        setTimeout(() => setSaveSuccessMsg(null), 4500);
      } else {
        throw new Error(result.error || 'Gagal merender file gambar');
      }
    } catch (error: any) {
      console.error('Export image error:', error);
      alert(`Gagal mengekspor gambar dokumen: ${error.message || 'Pastikan browser mendukung Canvas Export.'}`);
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  // Send to Discord Webhook
  const handleSendToDiscord = async () => {
    const isGov = currentOfficer && isGovernmentOfficer(currentOfficer.rank);
    const govDocConfig = getSavedGovDocumentWebhookConfig();
    const docConfig = getSavedDocumentWebhookConfig();
    const targetWebhookUrl = (isGov && govDocConfig.webhookUrl) ? govDocConfig.webhookUrl : (docConfig.webhookUrl || 
      webhookConfig?.webhookUrl || 
      (webhookConfig as any)?.url || 
      localStorage.getItem('hspd_discord_webhook_url') || 
      localStorage.getItem('hspd_roster_webhook_url'));

    if (!targetWebhookUrl) {
      if (isGov) {
        alert('⚠️ Discord Webhook Arsip Dokumen Pemerintahan belum dikonfigurasi. Silakan atur URL Webhook di menu Roster Pemerintahan > PENGATURAN WEBHOOK & BOT PM.');
      } else {
        alert('⚠️ Discord Webhook Arsip Dokumen belum dikonfigurasi. Silakan atur URL Webhook di menu 👑 WEBHOOK (Header Bar) pada Tab 13. Dokumen terlebih dahulu.');
      }
      return;
    }

    setWebhookStatus('sending');
    try {
      const res = await sendOfficialDocumentToDiscord(activeDoc, { webhookUrl: targetWebhookUrl });
      if (res.success) {
        setWebhookStatus('success');
        setSaveSuccessMsg(`✅ ${res.message}`);
        setTimeout(() => {
          setWebhookStatus('idle');
          setSaveSuccessMsg(null);
        }, 4000);
      } else {
        throw new Error(res.message);
      }
    } catch (e: any) {
      console.error(e);
      setWebhookStatus('error');
      alert(`Gagal mengirim dokumen ke Discord: ${e.message || 'Periksa URL Webhook Anda.'}`);
      setTimeout(() => setWebhookStatus('idle'), 3000);
    }
  };

  // Image Upload Handlers for Device Photos
  const handleUploadImageFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar yang valid.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setter(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Filtered Archive List
  const filteredArchive = savedDocs.filter(d => 
    d.title.toLowerCase().includes(archiveSearch.toLowerCase()) ||
    d.docNumber.toLowerCase().includes(archiveSearch.toLowerCase()) ||
    d.subject.toLowerCase().includes(archiveSearch.toLowerCase()) ||
    d.recipientName.toLowerCase().includes(archiveSearch.toLowerCase()) ||
    d.issuerName.toLowerCase().includes(archiveSearch.toLowerCase())
  );

  // Background Paper Texture Classes & Styles
  const getPaperStyles = () => {
    const texture = activeDoc.paperTexture || 'security_parchment';
    if (texture === 'clean_white') {
      return {
        backgroundColor: '#FFFFFF',
        backgroundImage: 'none'
      };
    }
    if (texture === 'cream_bond') {
      return {
        backgroundColor: '#FAF7EE',
        backgroundImage: 'linear-gradient(180deg, #FAF7EE 0%, #F5F1E4 100%)'
      };
    }
    if (texture === 'vintage_linen') {
      return {
        backgroundColor: '#F3EFE6',
        backgroundImage: 'radial-gradient(#E8E3D8 1px, transparent 1px), linear-gradient(135deg, #F5F1E8 0%, #EDE7DC 100%)',
        backgroundSize: '16px 16px, 100% 100%'
      };
    }
    // Default: 'security_parchment'
    return {
      backgroundColor: '#FAF8F3',
      backgroundImage: 'linear-gradient(135deg, #FBF9F4 0%, #F2EEE4 50%, #FAF8F4 100%)'
    };
  };

  return (
    <div className="space-y-4 pb-16 animate-fadeIn">
      {/* Scoped Print Styles for A4 Paper Layout */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #hspd-official-paper-sheet, #hspd-official-paper-sheet * {
            visibility: visible !important;
          }
          .no-print, .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          #hspd-official-paper-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 28px !important;
            box-shadow: none !important;
            border: none !important;
            background-color: white !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      {/* Top Header & Quick Action Bar */}
      <div className="bg-[#11141A] border border-gray-800 rounded-xl p-4 shadow-lg">
        {(currentOfficer?.accountType === 'GOVERNMENT' || (currentOfficer && isGovernmentOfficer(currentOfficer)) || forceGovMode || activeDoc.category === 'IZIN_USAHA' || activeDoc.category === 'MAKLUMAT_DARURAT' || activeDoc.category === 'GRASI_PRESIDEN' || activeDoc.category === 'ANGGARAN_DINAS' || activeDoc.primarySeal === 'GOVERNMENT_SEAL' || activeDoc.primarySeal === 'PRESIDENTIAL_SEAL' || activeDoc.secondarySeal === 'GOVERNMENT_SEAL' || activeDoc.secondarySeal === 'PRESIDENTIAL_SEAL') && (
          <div className="mb-3 p-3 bg-gradient-to-r from-amber-950/80 via-yellow-950/60 to-black/80 border border-amber-500/70 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🏛️</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-300 tracking-wide uppercase">PORTAL SURAT MENYURAT PEMERINTAHAN</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500 text-black font-black text-[9px]">EKSEKUTIF</span>
                </div>
                <p className="text-[11px] text-gray-300 mt-0.5">
                  Pejabat Aktif: <strong className="text-white">{currentOfficer?.name || 'Pejabat Negara'}</strong> • Pangkat: <strong className="text-amber-400">{currentOfficer?.rank || 'DEWAN EKSEKUTIF'}</strong> ({currentOfficer?.division || 'Kantor Pemerintahan'})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* TOMBOL OTORISASI PUSAT: BERISIKAN WEBHOOK DLL FITUR PEMERINTAH */}
              <button
                type="button"
                onClick={() => setIsGovCentralAuthModalOpen(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black rounded-lg text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-950/60 border border-amber-300 active:scale-95"
                title="Buka Panel Otorisasi Pusat: Pengesahan Dokumen, Webhook Discord Kenegaraan & Fitur Pemerintah"
              >
                <Crown className="w-3.5 h-3.5 text-black" />
                <span>👑 Otorisasi Pusat:</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const isPresident = (currentOfficer?.rank || '').toUpperCase().includes('PRESIDENT');
                  const officerName = currentOfficer?.name || 'Momo Hatakeyama';
                  const officerBadge = currentOfficer?.badge || '001';
                  const officerRank = currentOfficer?.rank || 'PRESIDENT [RANK 6]';
                  const officerDiv = currentOfficer?.division || 'Pemerintah Negara';
                  setActiveDoc(prev => ({
                    ...prev,
                    showIssuerSignature: true,
                    issuerName: officerName,
                    issuerBadge: officerBadge,
                    issuerRank: officerRank,
                    issuerRole: officerDiv,
                    issuerSignatureName: officerName,
                    issuerSignatureTitle: isPresident ? 'Presiden / Pengesah Negara,' : 'Pemberi Perintah / Komandan Operasi,',
                    issuerSignatureSubtitle: `${officerRank} (${officerBadge})`,
                    issuerSignatureType: 'font',
                    issuerSignatureStyle: 'formal',
                    issuerSignatureImage: undefined,
                    secondarySeal: isPresident ? 'PRESIDENTIAL_SEAL' : 'GOVERNMENT_SEAL'
                  }));
                  setSaveSuccessMsg(`✅ Dokumen berhasil ditandatangani oleh ${officerName} (${officerRank}) sebagai Pejabat Penerbit / Pengesah Negara.`);
                  setTimeout(() => setSaveSuccessMsg(null), 4000);
                }}
                className="px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-lg text-xs transition flex items-center gap-1 shadow-md shadow-blue-950/40"
                title="Bubuhkan tanda tangan pejabat aktif di kolom TTD Penerbit (Kanan)"
              >
                <span>✍️ TTD Sebagai Penerbit</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const isPresident = (currentOfficer?.rank || '').toUpperCase().includes('PRESIDENT');
                  const officerName = currentOfficer?.name || 'Momo Hatakeyama';
                  const officerBadge = currentOfficer?.badge || '001';
                  const officerRank = currentOfficer?.rank || 'PRESIDENT [RANK 6]';
                  const officerDiv = currentOfficer?.division || 'Pemerintah Negara';
                  setActiveDoc(prev => ({
                    ...prev,
                    showRecipientSignature: true,
                    recipientName: officerName,
                    recipientId: officerBadge,
                    recipientRoleOrStatus: `${officerRank} - ${officerDiv}`,
                    recipientSignatureName: officerName,
                    recipientSignatureTitle: isPresident ? 'Presiden / Pengesah Negara,' : 'Pejabat Penerima Negara,',
                    recipientSignatureSubtitle: `${officerRank} (${officerBadge})`,
                    recipientSignatureType: 'font',
                    recipientSignatureStyle: 'handwriting1',
                    recipientSignatureImage: undefined,
                    secondarySeal: isPresident ? 'PRESIDENTIAL_SEAL' : 'GOVERNMENT_SEAL'
                  }));
                  setSaveSuccessMsg(`✅ Dokumen berhasil ditandatangani oleh ${officerName} (${officerRank}) sebagai Penerima / Pengesah Negara.`);
                  setTimeout(() => setSaveSuccessMsg(null), 4000);
                }}
                className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-lg text-xs transition flex items-center gap-1 shadow-md shadow-emerald-950/40"
                title="Bubuhkan tanda tangan pejabat aktif di kolom TTD Penerima (Kiri)"
              >
                <span>✍️ TTD Sebagai Penerima</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveDoc(prev => ({
                    ...prev,
                    issuerSignatureType: 'blank',
                    issuerSignatureStyle: 'blank',
                    issuerSignatureImage: undefined,
                    recipientSignatureType: 'blank',
                    recipientSignatureStyle: 'blank',
                    recipientSignatureImage: undefined
                  }));
                  setSaveSuccessMsg('📄 Mode Kosongan: Area TTD dikosongkan untuk tanda tangan basah fisik manual.');
                  setTimeout(() => setSaveSuccessMsg(null), 3500);
                }}
                className="px-2 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/70 text-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1"
                title="Kosongkan area coretan TTD untuk dicetak dan ditandatangani basah"
              >
                <span>📄 Kosongkan TTD</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveEditorTab('SEALS_SIGS');
                }}
                className="px-2 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                title="Buka menu pengaturan detail TTD manual"
              >
                <span>⚙️ Atur TTD Manual</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveDoc(prev => ({ ...prev, secondarySeal: 'PRESIDENTIAL_SEAL' }));
                  setSaveSuccessMsg('👑 Stempel Resmi Kepresidenan berhasil dipasang.');
                  setTimeout(() => setSaveSuccessMsg(null), 3000);
                }}
                className="px-2 py-1.5 bg-amber-950/50 hover:bg-amber-900 border border-amber-600/50 text-amber-300 rounded-lg text-xs font-bold transition"
              >
                👑 Cap Presiden
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveDoc(prev => ({ ...prev, secondarySeal: 'GOVERNMENT_SEAL' }));
                  setSaveSuccessMsg('🏛️ Stempel Resmi Pemerintahan berhasil dipasang.');
                  setTimeout(() => setSaveSuccessMsg(null), 3000);
                }}
                className="px-2 py-1.5 bg-gray-800/70 hover:bg-gray-700 border border-gray-600 text-gray-200 rounded-lg text-xs font-bold transition"
              >
                🏛️ Cap Pemerintah
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <FileCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-100 font-mono tracking-wide">
                  STUDIO DOKUMEN & SURAT RESMI KEPOLISIAN
                </h1>
                <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/50 text-amber-300 text-[10px] font-mono font-bold">
                  OFFICIAL HSPD v2.5
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Pembuatan Surat Perintah, WCL, SKCK, BAP & Lembar Otorisasi Resmi dengan Kertas Realistis, Stempel Basah & Tanda Tangan Custom.
              </p>
            </div>
          </div>

          {/* Top Main Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Otorisasi Pusat / Fitur Pemerintah Button */}
            <button
              id="btn-doc-gov-central-auth"
              type="button"
              onClick={() => setIsGovCentralAuthModalOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-black font-black rounded-lg text-xs font-mono transition flex items-center gap-1.5 shadow-md shadow-amber-950/50 border border-amber-300 active:scale-95"
              title="Buka Panel Otorisasi Pusat & Webhook Discord Kenegaraan"
            >
              <Crown className="w-3.5 h-3.5 text-black" />
              <span>👑 Otorisasi Pusat:</span>
            </button>

            {/* Toggle Portal Pemerintah */}
            <button
              type="button"
              onClick={() => setForceGovMode(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 border active:scale-95 ${
                forceGovMode
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500'
                  : 'bg-[#161B22] text-gray-300 border-gray-700 hover:text-white'
              }`}
              title="Aktifkan/Sembunyikan Bilah Surat Menyurat Kenegaraan"
            >
              <Building className="w-3.5 h-3.5 text-amber-400" />
              <span>🏛️ {forceGovMode ? 'Portal Pemerintah: ON' : 'Mode Pemerintah'}</span>
            </button>

            {/* Archive Button */}
            <button
              id="btn-doc-archive-open"
              onClick={() => setIsArchiveModalOpen(true)}
              className="px-3 py-1.5 bg-[#161B22] hover:bg-[#1F242C] border border-gray-700 text-gray-200 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 active:scale-95"
              title="Buka daftar berkas dokumen yang tersimpan"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Arsip Berkas ({savedDocs.length})</span>
            </button>

            {/* Blank Document Button */}
            <button
              id="btn-doc-new-blank"
              onClick={handleCreateNewBlank}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-200 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 active:scale-95"
              title="Buat dokumen baru dari awal"
            >
              <FilePlus2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Dokumen Baru</span>
            </button>

            {/* Save to Database */}
            <button
              id="btn-doc-save-db"
              onClick={handleSaveDocument}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-900/30 active:scale-95"
              title="Simpan dokumen ini ke penyimpanan arsip lokal"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan ke Database</span>
            </button>

            {/* Export PNG */}
            <button
              id="btn-export-doc-png"
              disabled={isExporting}
              onClick={() => handleExportImage('png')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-900/30 disabled:opacity-50 active:scale-95"
              title="Cetak dan unduh lembar surat sebagai file PNG resolusi tinggi (HD)"
            >
              {exportingFormat === 'png' ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{exportingFormat === 'png' ? 'Memproses PNG...' : 'Cetak PNG (HD)'}</span>
            </button>

            {/* Export JPG */}
            <button
              id="btn-export-doc-jpg"
              disabled={isExporting}
              onClick={() => handleExportImage('jpeg')}
              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-900/30 disabled:opacity-50 active:scale-95"
              title="Cetak dan unduh lembar surat sebagai file JPG berkualitas tinggi"
            >
              {exportingFormat === 'jpeg' ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5" />
              )}
              <span>{exportingFormat === 'jpeg' ? 'Memproses JPG...' : 'Cetak JPG'}</span>
            </button>

            {/* Print / PDF */}
            <button
              id="btn-print-doc-pdf"
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 active:scale-95"
              title="Cetak Lembar Dokumen via Browser / Simpan PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF / Print</span>
            </button>

            {/* Copy Text */}
            <button
              id="btn-copy-doc-plain-text"
              onClick={handleCopyText}
              className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 active:scale-95"
              title="Salin isi dokumen dalam format Plain Text / Roleplay Chat"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            {/* Discord Webhook Button */}
            <button
              id="btn-send-doc-discord"
              disabled={webhookStatus === 'sending'}
              onClick={handleSendToDiscord}
              className="px-2.5 py-1.5 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 disabled:opacity-50 active:scale-95"
              title="Kirim arsip dokumen resmi ke Discord Webhook"
            >
              {webhookStatus === 'sending' ? (
                <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{webhookStatus === 'sending' ? 'Mengirim...' : 'Discord'}</span>
            </button>
          </div>
        </div>

        {/* Success / Notification Banner */}
        {saveSuccessMsg && (
          <div className="mt-3 p-2.5 bg-emerald-950/90 border border-emerald-500 rounded-lg text-emerald-200 text-xs font-mono flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Preset Templates Horizontal Bar */}
      <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-gray-200 font-mono">TEMPLATE RESMI SIAP PAKAI:</span>
          </div>
          <span className="text-[11px] text-gray-500 font-mono">Klik salah satu untuk memuat format otomatis</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {DOCUMENT_PRESET_TEMPLATES.map((preset) => {
            const isCurrent = activeDoc.category === preset.category;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`text-left p-2.5 rounded-lg border transition-all flex flex-col justify-between h-[82px] cursor-pointer active:scale-95 ${
                  isCurrent
                    ? 'bg-blue-950/70 border-blue-400 text-blue-100 shadow-md shadow-blue-950/50 ring-1 ring-blue-400/50'
                    : 'bg-[#161B22] border-gray-800 hover:border-blue-500/70 text-gray-300 hover:bg-[#1C2128]'
                }`}
                title={`Terapkan template ${preset.name}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      isCurrent 
                        ? 'bg-blue-500 text-black border-blue-400 font-black' 
                        : 'bg-black/60 text-gray-300 border-gray-700'
                    }`}>
                      {preset.badgeLabel}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] text-blue-300 font-bold flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Aktif
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-100 line-clamp-1 mt-1 font-mono">
                    {preset.name}
                  </div>
                </div>
                <div className="text-[9px] text-gray-400 truncate font-mono flex items-center justify-between">
                  <span>{preset.defaultDoc.classification}</span>
                  <span>{preset.defaultDoc.clauses.length} Poin</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace: Left Form Editor, Right Paper Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        
        {/* ========================================================
            LEFT COLUMN: INTERACTIVE FORM BUILDER (5 COLS ON XL)
           ======================================================== */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-[#11141A] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
            
            {/* Editor Sub-Tabs */}
            <div className="flex items-center border-b border-gray-800 bg-[#0D1117] p-1 gap-1 text-xs font-mono overflow-x-auto">
              <button
                onClick={() => setActiveEditorTab('METADATA')}
                className={`flex-1 py-2 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 min-w-[90px] ${
                  activeEditorTab === 'METADATA'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>1. Data Surat</span>
              </button>

              <button
                onClick={() => setActiveEditorTab('PARTIES')}
                className={`flex-1 py-2 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 min-w-[90px] ${
                  activeEditorTab === 'PARTIES'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>2. Pihak</span>
              </button>

              <button
                onClick={() => setActiveEditorTab('CLAUSES')}
                className={`flex-1 py-2 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 min-w-[90px] ${
                  activeEditorTab === 'CLAUSES'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>3. Isi ({activeDoc.clauses.length})</span>
              </button>

              <button
                onClick={() => setActiveEditorTab('SEALS_SIGS')}
                className={`flex-1 py-2 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 min-w-[100px] ${
                  activeEditorTab === 'SEALS_SIGS'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-amber-400 hover:text-amber-200 hover:bg-amber-950/40'
                }`}
              >
                <StampIcon className="w-3.5 h-3.5" />
                <span>4. Stempel & TTD</span>
              </button>

              <button
                onClick={() => setActiveEditorTab('PAPER_STYLE')}
                className={`flex-1 py-2 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1 min-w-[95px] ${
                  activeEditorTab === 'PAPER_STYLE'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-purple-400 hover:text-purple-200 hover:bg-purple-950/40'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>5. Kertas & Cap Air</span>
              </button>
            </div>

            {/* TAB 1: METADATA & SURAT */}
            {activeEditorTab === 'METADATA' && (
              <div className="p-4 space-y-3.5 font-mono text-xs">
                <div>
                  <label className="block text-gray-400 mb-1 text-[11px] font-bold">
                    NOMOR DOKUMEN / SURAT RESMI:
                  </label>
                  <input
                    type="text"
                    value={activeDoc.docNumber}
                    onChange={(e) => setActiveDoc(prev => ({ ...prev, docNumber: e.target.value }))}
                    className="w-full bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg px-3 py-2 text-gray-100 outline-none font-mono text-xs"
                    placeholder="Contoh: SP-TUGAS/HSPD-OPS/VIII/2026/042"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px] font-bold">
                      KLASIFIKASI KEAMANAN:
                    </label>
                    <select
                      value={activeDoc.classification}
                      onChange={(e) => setActiveDoc(prev => ({ ...prev, classification: e.target.value as DocumentClassification }))}
                      className="w-full bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg px-3 py-2 text-gray-100 outline-none text-xs"
                    >
                      <option value="BIASA">BIASA (TERBUKA)</option>
                      <option value="TERBATAS">TERBATAS (RESTRICTED)</option>
                      <option value="RAHASIA">RAHASIA (CONFIDENTIAL)</option>
                      <option value="SANGAT RAHASIA">SANGAT RAHASIA (TOP SECRET)</option>
                      <option value="KILAT / URGENT">KILAT / URGENT (IMMEDIATE)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px] font-bold">
                      TANGGAL DOKUMEN:
                    </label>
                    <input
                      type="text"
                      value={activeDoc.date}
                      onChange={(e) => setActiveDoc(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg px-3 py-2 text-gray-100 outline-none text-xs"
                      placeholder="25 Agustus 2026"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-[11px] font-bold">
                    JUDUL RESMI DOKUMEN:
                  </label>
                  <input
                    type="text"
                    value={activeDoc.title}
                    onChange={(e) => setActiveDoc(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg px-3 py-2 text-gray-100 outline-none font-bold text-xs"
                    placeholder="SURAT PERINTAH OPERASI PENEGAKAN HUKUM"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-[11px] font-bold">
                    PERIHAL / HAL / SUBJEK:
                  </label>
                  <input
                    type="text"
                    value={activeDoc.subject}
                    onChange={(e) => setActiveDoc(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg px-3 py-2 text-gray-100 outline-none text-xs"
                    placeholder="Pengerahan Personel Gabungan Operasi Taktis"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px] font-bold">
                      MASA BERLAKU / VALIDITAS:
                    </label>
                    <input
                      type="text"
                      value={activeDoc.validUntil || ''}
                      onChange={(e) => setActiveDoc(prev => ({ ...prev, validUntil: e.target.value }))}
                      className="w-full bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg px-3 py-2 text-gray-100 outline-none text-xs"
                      placeholder="Contoh: 1 (Satu) Bulan / Operasi Selesai"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px] font-bold">
                      TEMPAT PENETAPAN:
                    </label>
                    <input
                      type="text"
                      value={activeDoc.location}
                      onChange={(e) => setActiveDoc(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg px-3 py-2 text-gray-100 outline-none text-xs"
                      placeholder="Markas Besar HSPD, Los Santos"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PIHAK TERLIBAT */}
            {activeEditorTab === 'PARTIES' && (
              <div className="p-4 space-y-4 font-mono text-xs">
                {/* ISSUING OFFICER */}
                <div className="bg-[#0D1117] border border-gray-800 rounded-lg p-3 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[11px]">
                    <Shield className="w-3.5 h-3.5" />
                    <span>I. PIHAK PERTAMA (PEJABAT PENERBIT / PEMBUAT):</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-400 mb-0.5 text-[10px]">NAMA PEJABAT:</label>
                      <input
                        type="text"
                        value={activeDoc.issuerName}
                        onChange={(e) => setActiveDoc(prev => ({ ...prev, issuerName: e.target.value }))}
                        className="w-full bg-[#161B22] border border-gray-700 rounded px-2.5 py-1.5 text-gray-100 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-0.5 text-[10px]">NOMOR BADGE:</label>
                      <input
                        type="text"
                        value={activeDoc.issuerBadge}
                        onChange={(e) => setActiveDoc(prev => ({ ...prev, issuerBadge: e.target.value }))}
                        className="w-full bg-[#161B22] border border-gray-700 rounded px-2.5 py-1.5 text-gray-100 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-400 mb-0.5 text-[10px]">PANGKAT (RANK):</label>
                      <input
                        type="text"
                        value={activeDoc.issuerRank}
                        onChange={(e) => setActiveDoc(prev => ({ ...prev, issuerRank: e.target.value }))}
                        className="w-full bg-[#161B22] border border-gray-700 rounded px-2.5 py-1.5 text-gray-100 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-0.5 text-[10px]">JABATAN RESMI:</label>
                      <input
                        type="text"
                        value={activeDoc.issuerRole}
                        onChange={(e) => setActiveDoc(prev => ({ ...prev, issuerRole: e.target.value }))}
                        className="w-full bg-[#161B22] border border-gray-700 rounded px-2.5 py-1.5 text-gray-100 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* RECIPIENT / SUBJECT */}
                <div className="bg-[#0D1117] border border-gray-800 rounded-lg p-3 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                    <User className="w-3.5 h-3.5" />
                    <span>II. PIHAK KEDUA (PENERIMA / SUBJEK DOKUMEN):</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-400 mb-0.5 text-[10px]">NAMA LENGKAP:</label>
                      <input
                        type="text"
                        value={activeDoc.recipientName}
                        onChange={(e) => setActiveDoc(prev => ({ ...prev, recipientName: e.target.value }))}
                        className="w-full bg-[#161B22] border border-gray-700 rounded px-2.5 py-1.5 text-gray-100 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-0.5 text-[10px]">ID / CID / KTP / BADGE:</label>
                      <input
                        type="text"
                        value={activeDoc.recipientId || ''}
                        onChange={(e) => setActiveDoc(prev => ({ ...prev, recipientId: e.target.value }))}
                        className="w-full bg-[#161B22] border border-gray-700 rounded px-2.5 py-1.5 text-gray-100 text-xs"
                        placeholder="Contoh: CID-9921 / 2026-X"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-400 mb-0.5 text-[10px]">STATUS / PERAN:</label>
                      <input
                        type="text"
                        value={activeDoc.recipientRoleOrStatus || ''}
                        onChange={(e) => setActiveDoc(prev => ({ ...prev, recipientRoleOrStatus: e.target.value }))}
                        className="w-full bg-[#161B22] border border-gray-700 rounded px-2.5 py-1.5 text-gray-100 text-xs"
                        placeholder="Warga Sipil / Anggota Patroli / Tersangka"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-0.5 text-[10px]">LOKASI / ALAMAT:</label>
                      <input
                        type="text"
                        value={activeDoc.recipientAddress || ''}
                        onChange={(e) => setActiveDoc(prev => ({ ...prev, recipientAddress: e.target.value }))}
                        className="w-full bg-[#161B22] border border-gray-700 rounded px-2.5 py-1.5 text-gray-100 text-xs"
                        placeholder="Vinewood Hills / Los Santos"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ISI & PASAL */}
            {activeEditorTab === 'CLAUSES' && (
              <div className="p-4 space-y-3.5 font-mono text-xs">
                <div>
                  <label className="block text-gray-400 mb-1 text-[11px] font-bold">
                    PARAGRAF PEMBUKA (PREAMBULE):
                  </label>
                  <textarea
                    rows={2}
                    value={activeDoc.openingText}
                    onChange={(e) => setActiveDoc(prev => ({ ...prev, openingText: e.target.value }))}
                    className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100 text-xs"
                  />
                </div>

                {/* Dynamic Clauses List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-bold text-[11px]">
                      DAFTAR PASAL / KETENTUAN ({activeDoc.clauses.length}):
                    </span>
                    <button
                      onClick={handleAddClause}
                      className="px-2 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded text-[10px] font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Pasal</span>
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {activeDoc.clauses.map((clause, idx) => (
                      <div key={clause.id} className="bg-[#0D1117] border border-gray-800 rounded-lg p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={clause.clauseNumber || ''}
                            onChange={(e) => handleUpdateClause(clause.id, 'clauseNumber', e.target.value)}
                            className="w-24 bg-[#161B22] border border-gray-700 rounded px-2 py-0.5 text-blue-400 font-bold text-[11px]"
                            placeholder={`Pasal ${idx + 1}`}
                          />
                          <input
                            type="text"
                            value={clause.title || ''}
                            onChange={(e) => handleUpdateClause(clause.id, 'title', e.target.value)}
                            className="flex-1 bg-[#161B22] border border-gray-700 rounded px-2 py-0.5 text-gray-200 font-bold text-[11px]"
                            placeholder="Judul / Topik Pasal (Opsional)"
                          />
                          <button
                            onClick={() => handleRemoveClause(clause.id)}
                            className="text-gray-500 hover:text-rose-400 p-1"
                            title="Hapus pasal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={clause.content}
                          onChange={(e) => handleUpdateClause(clause.id, 'content', e.target.value)}
                          className="w-full bg-[#161B22] border border-gray-700 rounded p-1.5 text-gray-100 text-xs"
                          placeholder="Isi rincian poin ketentuan..."
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-[11px] font-bold">
                    PARAGRAF PENUTUP:
                  </label>
                  <textarea
                    rows={2}
                    value={activeDoc.closingText}
                    onChange={(e) => setActiveDoc(prev => ({ ...prev, closingText: e.target.value }))}
                    className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">
                    CATATAN / DISCLAIMER TAMBAHAN (OPSIONAL):
                  </label>
                  <input
                    type="text"
                    value={activeDoc.notes || ''}
                    onChange={(e) => setActiveDoc(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-[#0D1117] border border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-200 text-xs"
                    placeholder="Contoh: Dokumen sah apabila tertera stempel basah & hologram HSPD"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: STEMPEL BASAH & TANDA TANGAN CUSTOM (DEVICE UPLOAD / CANVAS) */}
            {activeEditorTab === 'SEALS_SIGS' && (
              <div className="p-4 space-y-4 font-mono text-xs">
                
                {/* STEMPEL / SEAL SECTION */}
                <div className="bg-[#0D1117] border border-amber-900/50 rounded-xl p-3 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <StampIcon className="w-4 h-4" />
                      <span>STEMPEL BASAH KEPOLISIAN</span>
                    </div>

                    {/* Display Mode Toggle */}
                    <div className="flex items-center gap-1 bg-[#161B22] p-0.5 rounded border border-gray-700 text-[10px]">
                      <button
                        onClick={() => setActiveDoc(prev => ({ ...prev, sealDisplayMode: 'preset' }))}
                        className={`px-2 py-0.5 rounded ${
                          (activeDoc.sealDisplayMode || 'preset') === 'preset' ? 'bg-amber-600 text-white font-bold' : 'text-gray-400'
                        }`}
                      >
                        Preset Standar
                      </button>
                      <button
                        onClick={() => setActiveDoc(prev => ({ ...prev, sealDisplayMode: 'custom' }))}
                        className={`px-2 py-0.5 rounded ${
                          activeDoc.sealDisplayMode === 'custom' ? 'bg-amber-600 text-white font-bold' : 'text-gray-400'
                        }`}
                      >
                        Upload HP/Device
                      </button>
                      <button
                        onClick={() => setActiveDoc(prev => ({ ...prev, sealDisplayMode: 'both' }))}
                        className={`px-2 py-0.5 rounded ${
                          activeDoc.sealDisplayMode === 'both' ? 'bg-amber-600 text-white font-bold' : 'text-gray-400'
                        }`}
                      >
                        Keduanya
                      </button>
                    </div>
                  </div>

                  {/* Preset Seal Selector */}
                  {(activeDoc.sealDisplayMode === 'preset' || activeDoc.sealDisplayMode === 'both' || !activeDoc.sealDisplayMode) && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-gray-400 mb-1 text-[10px]">STEMPEL PRESET UTAMA:</label>
                        <select
                          value={activeDoc.primarySeal}
                          onChange={(e) => setActiveDoc(prev => ({ ...prev, primarySeal: e.target.value as SealType }))}
                          className="w-full bg-[#161B22] border border-gray-700 rounded px-2 py-1.5 text-gray-100 text-xs"
                        >
                          <option value="HSPD_OFFICIAL">🔴 Stempel Merah HSPD Official</option>
                          <option value="PRESIDENTIAL_SEAL">👑 Stempel Resmi Kepresidenan (Presidential Seal)</option>
                          <option value="GOVERNMENT_SEAL">🏛️ Stempel Resmi Pemerintahan (State Government)</option>
                          <option value="CID_DETECTIVE">🔵 Stempel Biru CID Detective</option>
                          <option value="TRAFFIC_TEU">🟢 Stempel Hijau TEU / Perizinan</option>
                          <option value="HIGH_COMMAND">🟡 Stempel Emas High Command</option>
                          <option value="INTERNAL_AFFAIRS">🟣 Stempel Ungu IAD Disiplin</option>
                          <option value="APPROVED_PASSED">🟩 Stempel Hijau Lolos Uji</option>
                          <option value="CONFIDENTIAL">🟥 Stempel Rahasia Negara</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-400 mb-1 text-[10px]">STEMPEL KEDUA (OPSIONAL):</label>
                        <select
                          value={activeDoc.secondarySeal || ''}
                          onChange={(e) => setActiveDoc(prev => ({ ...prev, secondarySeal: e.target.value ? (e.target.value as SealType) : undefined }))}
                          className="w-full bg-[#161B22] border border-gray-700 rounded px-2 py-1.5 text-gray-100 text-xs"
                        >
                          <option value="">-- Tanpa Stempel Kedua --</option>
                          <option value="PRESIDENTIAL_SEAL">👑 Stempel Resmi Kepresidenan (Presidential Seal)</option>
                          <option value="GOVERNMENT_SEAL">🏛️ Stempel Resmi Pemerintahan (State Government)</option>
                          <option value="HSPD_OFFICIAL">🔴 Stempel Merah HSPD Official</option>
                          <option value="CID_DETECTIVE">🔵 Stempel Biru CID Detective</option>
                          <option value="TRAFFIC_TEU">🟢 Stempel Hijau Divisi TEU</option>
                          <option value="HIGH_COMMAND">🟡 Stempel Emas High Command</option>
                          <option value="INTERNAL_AFFAIRS">🟣 Stempel Ungu IAD Disiplin</option>
                          <option value="APPROVED_PASSED">🟩 Stempel Hijau Lolos Uji</option>
                          <option value="CONFIDENTIAL">🟥 Stempel Rahasia Negara</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Custom Uploaded Seal From Device Controls */}
                  {(activeDoc.sealDisplayMode === 'custom' || activeDoc.sealDisplayMode === 'both') && (
                    <div className="bg-[#161B22] border border-gray-700 rounded-lg p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          UPLOAD FOTO STEMPEL DARI HP / DEVICE:
                        </span>
                        {activeDoc.customSealImage && (
                          <button
                            onClick={() => setActiveDoc(prev => ({ ...prev, customSealImage: undefined }))}
                            className="text-rose-400 hover:text-rose-300 text-[10px] underline"
                          >
                            Hapus Stempel
                          </button>
                        )}
                      </div>

                      <input
                        type="file"
                        ref={customStampInputRef}
                        accept="image/*"
                        onChange={(e) => handleUploadImageFile(e, (dataUrl) => setActiveDoc(prev => ({ ...prev, customSealImage: dataUrl })))}
                        className="hidden"
                      />

                      {!activeDoc.customSealImage ? (
                        <div
                          onClick={() => customStampInputRef.current?.click()}
                          className="border border-dashed border-gray-600 hover:border-amber-500 rounded-lg p-3 text-center cursor-pointer transition bg-[#0D1117]"
                        >
                          <StampIcon className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                          <div className="text-[11px] text-gray-200 font-bold">
                            Klik untuk Pilih Gambar Stempel dari HP / Laptop
                          </div>
                          <span className="text-[9px] text-gray-400">
                            Format PNG (Transparan), JPG, atau foto stempel di atas kertas
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 bg-[#0D1117] p-2 rounded border border-gray-700">
                            <div className="w-14 h-14 bg-white/10 rounded flex items-center justify-center p-1 border border-gray-600 shrink-0 overflow-hidden">
                              <img
                                src={activeDoc.customSealImage}
                                alt="Custom Stamp"
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <div className="flex-1 text-[10px] space-y-1">
                              <span className="text-emerald-400 font-bold block">✓ Stempel Kustom Aktif</span>
                              <button
                                onClick={() => customStampInputRef.current?.click()}
                                className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 text-[10px]"
                              >
                                Ganti Gambar
                              </button>
                            </div>
                          </div>

                          {/* Ink Filter & Angle adjustments */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="block text-gray-400 text-[10px] mb-1">EFEK TINTA STEMPEL:</label>
                              <select
                                value={activeDoc.customSealColorFilter || 'original'}
                                onChange={(e) => setActiveDoc(prev => ({ ...prev, customSealColorFilter: e.target.value as any }))}
                                className="w-full bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-200 text-[11px]"
                              >
                                <option value="original">Warna Asli Gambar</option>
                                <option value="red">🔴 Tinta Merah Polisi</option>
                                <option value="blue">🔵 Tinta Biru Legal</option>
                                <option value="purple">🟣 Tinta Ungu / Violet</option>
                                <option value="gold">🟡 Tinta Emas High Command</option>
                                <option value="black">⚫ Tinta Hitam Carbon</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-gray-400 text-[10px] mb-1">
                                KEMIRINGAN CAP: ({activeDoc.customSealRotation ?? -7}°)
                              </label>
                              <input
                                type="range"
                                min="-30"
                                max="30"
                                value={activeDoc.customSealRotation ?? -7}
                                onChange={(e) => setActiveDoc(prev => ({ ...prev, customSealRotation: Number(e.target.value) }))}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-gray-400 text-[10px] mb-1">
                                UKURAN STEMPEL: ({Math.round((activeDoc.customSealScale ?? 1.0) * 130)}px)
                              </label>
                              <input
                                type="range"
                                min="0.6"
                                max="1.6"
                                step="0.05"
                                value={activeDoc.customSealScale ?? 1.0}
                                onChange={(e) => setActiveDoc(prev => ({ ...prev, customSealScale: Number(e.target.value) }))}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>

                            <div>
                              <label className="block text-gray-400 text-[10px] mb-1">
                                KEPEKATAN (OPACITY): ({Math.round((activeDoc.customSealOpacity ?? 0.88) * 100)}%)
                              </label>
                              <input
                                type="range"
                                min="0.4"
                                max="1.0"
                                step="0.05"
                                value={activeDoc.customSealOpacity ?? 0.88}
                                onChange={(e) => setActiveDoc(prev => ({ ...prev, customSealOpacity: Number(e.target.value) }))}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SIGNATURES SECTION WITH UPLOAD & SCREEN DRAWING */}
                <div className="bg-[#0D1117] border border-blue-900/50 rounded-xl p-3 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs border-b border-gray-800 pb-2">
                    <PenTool className="w-4 h-4" />
                    <span>PENGATURAN TANDA TANGAN (UPLOAD / GAMBAR LAYAR / FONT)</span>
                  </div>

                  {/* 1. Issuer Signature */}
                  <div className={`bg-[#161B22] border rounded-lg p-2.5 space-y-2.5 transition ${activeDoc.showIssuerSignature === false ? 'border-gray-800/60 opacity-80' : 'border-gray-800'}`}>
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-200">
                      <span className="flex items-center gap-1.5 text-blue-300">
                        <Shield className="w-3.5 h-3.5" />
                        1. Tanda Tangan Penerbit / Pembuat ({activeDoc.issuerSignatureName ?? activeDoc.issuerName})
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Toggle Switch Tampilkan / Sembunyikan Tanda Tangan Penerbit */}
                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-gray-700 hover:border-blue-500/50 transition">
                          <input
                            type="checkbox"
                            checked={activeDoc.showIssuerSignature !== false}
                            onChange={(e) => setActiveDoc(prev => ({ ...prev, showIssuerSignature: e.target.checked }))}
                            className="rounded border-gray-700 text-blue-500 focus:ring-0 w-3 h-3 accent-blue-500 cursor-pointer"
                          />
                          <span className={activeDoc.showIssuerSignature !== false ? 'text-blue-400 font-bold' : 'text-gray-400'}>
                            {activeDoc.showIssuerSignature !== false ? 'TAMPILKAN' : 'DISEMBUNYIKAN'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {activeDoc.showIssuerSignature === false ? (
                      <div className="p-2 bg-black/30 border border-dashed border-gray-800 rounded text-[10px] text-gray-400 font-sans flex items-center justify-between">
                        <span>Kolom tanda tangan pihak penerbit dinonaktifkan (dokumen tidak menampilkan tanda tangan penerbit).</span>
                        <button
                          type="button"
                          onClick={() => setActiveDoc(prev => ({ ...prev, showIssuerSignature: true }))}
                          className="px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-700/60 rounded text-[10px] font-bold hover:bg-blue-900"
                        >
                          Aktifkan Kembali
                        </button>
                      </div>
                    ) : (
                      <>
                        {currentOfficer && (
                          <div className="p-2 bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-black/60 border border-blue-600/50 rounded-lg flex items-center justify-between gap-2">
                            <div className="text-[10px] leading-tight">
                              <span className="font-bold text-blue-300 block flex items-center gap-1">
                                <span>✍️ Tanda Tangani Sebagai:</span>
                                <span className="text-white">{currentOfficer.name}</span>
                              </span>
                              <span className="text-gray-400 text-[9px]">
                                {currentOfficer.rank} • {currentOfficer.division || 'Pemerintahan / Kepolisian'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const isPresident = currentOfficer.rank?.toUpperCase().includes('PRESIDENT');
                                  setActiveDoc(prev => ({
                                    ...prev,
                                    showIssuerSignature: true,
                                    issuerName: currentOfficer.name,
                                    issuerBadge: currentOfficer.badge,
                                    issuerRank: currentOfficer.rank,
                                    issuerRole: currentOfficer.division || 'Pemerintah Negara',
                                    issuerSignatureName: currentOfficer.name,
                                    issuerSignatureTitle: isPresident ? 'Presiden / Pengesah Negara,' : 'Pemberi Perintah / Komandan Operasi,',
                                    issuerSignatureSubtitle: `${currentOfficer.rank} (${currentOfficer.badge})`,
                                    issuerSignatureType: 'font',
                                    issuerSignatureStyle: 'formal',
                                    issuerSignatureImage: undefined
                                  }));
                                  setSaveSuccessMsg(`✅ Berhasil membubuhkan TTD ${currentOfficer.name} (${currentOfficer.rank}) sebagai Penerbit!`);
                                  setTimeout(() => setSaveSuccessMsg(null), 3500);
                                }}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold font-mono transition flex items-center gap-1 shadow-sm"
                                title="Otomatis isi nama, status penerbit, dan tanda tangan"
                              >
                                <span>⚡ Bubuhkan TTD</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Mode Selector Buttons */}
                        <div>
                          <label className="block text-gray-400 text-[9px] mb-1 font-mono">PILIHAN FORMAT TANDA TANGAN PENERBIT:</label>
                          <div className="grid grid-cols-4 gap-1">
                            {/* Option 1: Font / Teks Cursive */}
                            <button
                              type="button"
                              onClick={() => setActiveDoc(prev => ({
                                ...prev,
                                issuerSignatureType: 'font',
                                issuerSignatureImage: undefined,
                                issuerSignatureStyle: prev.issuerSignatureStyle === 'blank' ? 'formal' : (prev.issuerSignatureStyle || 'formal')
                              }))}
                              className={`px-1.5 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border transition ${
                                activeDoc.issuerSignatureType === 'font' && activeDoc.issuerSignatureStyle !== 'blank' && !activeDoc.issuerSignatureImage
                                  ? 'bg-blue-700 border-blue-500 text-white shadow-sm'
                                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                              }`}
                              title="Gunakan teks nama dengan gaya tulisan tangan digital"
                            >
                              <span>✍️ Teks Font</span>
                            </button>

                            {/* Option 2: Kosongan / Blank */}
                            <button
                              type="button"
                              onClick={() => setActiveDoc(prev => ({
                                ...prev,
                                issuerSignatureType: 'blank',
                                issuerSignatureStyle: 'blank',
                                issuerSignatureImage: undefined
                              }))}
                              className={`px-1.5 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border transition ${
                                activeDoc.issuerSignatureType === 'blank' || activeDoc.issuerSignatureStyle === 'blank'
                                  ? 'bg-amber-700 border-amber-500 text-white shadow-sm'
                                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                              }`}
                              title="Kosongkan area tanda tangan untuk ditandatangani manual dengan pulpen basah"
                            >
                              <span>📄 Kosongan</span>
                            </button>

                            {/* Option 3: Gambar / Canvas */}
                            <button
                              type="button"
                              onClick={() => setActiveSigPadTarget('issuer')}
                              className={`px-1.5 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border transition ${
                                activeDoc.issuerSignatureType === 'draw' && activeDoc.issuerSignatureImage
                                  ? 'bg-blue-700 border-blue-500 text-white shadow-sm'
                                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                              }`}
                              title="Tanda tangan langsung dengan jari / mouse di layar"
                            >
                              <PenTool className="w-3 h-3" />
                              <span>Gambar</span>
                            </button>

                            {/* Option 4: Upload File */}
                            <input
                              type="file"
                              ref={issuerSigUploadRef}
                              accept="image/*"
                              onChange={(e) => handleUploadImageFile(e, (url) => setActiveDoc(prev => ({ ...prev, issuerSignatureImage: url, issuerSignatureType: 'upload' })))}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => issuerSigUploadRef.current?.click()}
                              className={`px-1.5 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border transition ${
                                activeDoc.issuerSignatureType === 'upload' && activeDoc.issuerSignatureImage
                                  ? 'bg-purple-700 border-purple-500 text-white shadow-sm'
                                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                              }`}
                              title="Upload foto tanda tangan dari galeri atau komputer"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Upload</span>
                            </button>
                          </div>
                        </div>

                        {/* If in Kosongan Mode */}
                        {(activeDoc.issuerSignatureType === 'blank' || activeDoc.issuerSignatureStyle === 'blank') && (
                          <div className="p-2 bg-amber-950/40 border border-amber-700/60 rounded text-[10px] text-amber-200 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-amber-300">
                              <span>📄 MODE KOSONGAN AKTIF</span>
                            </div>
                            <p className="text-[9.5px] text-gray-300 leading-tight">
                              Area tanda tangan di atas garis akan <strong>kosong polos</strong>. Pejabat dapat menandatangani dokumen secara fisik dengan pulpen setelah dicetak.
                            </p>
                          </div>
                        )}

                        {/* Image Preview if uploaded or drawn */}
                        {activeDoc.issuerSignatureImage && (
                          <div className="h-12 bg-white/10 rounded flex items-center justify-center p-1 border border-gray-700 relative group">
                            <img
                              src={activeDoc.issuerSignatureImage}
                              alt="Issuer Signature Preview"
                              className="max-h-full max-w-full object-contain"
                              style={{ mixBlendMode: 'multiply' }}
                            />
                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                type="button"
                                onClick={() => setActiveDoc(prev => ({
                                  ...prev,
                                  issuerSignatureType: 'blank',
                                  issuerSignatureStyle: 'blank',
                                  issuerSignatureImage: undefined
                                }))}
                                className="px-1.5 py-0.5 bg-amber-900/90 hover:bg-amber-800 text-amber-200 rounded text-[9px] border border-amber-600"
                              >
                                Kosongkan
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveDoc(prev => ({ ...prev, issuerSignatureImage: undefined, issuerSignatureType: 'font' }))}
                                className="px-1.5 py-0.5 bg-rose-900/90 hover:bg-rose-800 text-rose-200 rounded text-[9px] border border-rose-600"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Detailed Fields: Label, Custom Name, Subtitle, Style */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="block text-gray-400 text-[9px] font-mono">LABEL JABATAN / POSISI:</label>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, issuerSignatureTitle: '' }))}
                                  className="text-[8px] text-amber-400 hover:underline"
                                  title="Kosongkan label jabatan"
                                >
                                  [Kosongkan]
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, issuerSignatureTitle: 'Pejabat Penerbit,' }))}
                                  className="text-[8px] text-blue-400 hover:underline"
                                  title="Reset ke default"
                                >
                                  [Reset]
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={activeDoc.issuerSignatureTitle ?? 'Pejabat Penerbit,'}
                              onChange={(e) => setActiveDoc(prev => ({ ...prev, issuerSignatureTitle: e.target.value }))}
                              className="w-full bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-100 text-xs focus:border-blue-500 focus:outline-none"
                              placeholder="Pemberi Perintah / Komandan Operasi,"
                            />
                            {/* Preset Buttons for Title */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {[
                                'Presiden / Pengesah Negara,',
                                'Pemberi Perintah / Komandan Operasi,',
                                'Pejabat Penerbit,',
                                'Gubernur Negara,'
                              ].map(titlePreset => (
                                <button
                                  key={titlePreset}
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, issuerSignatureTitle: titlePreset }))}
                                  className="text-[8px] bg-gray-800 hover:bg-blue-900/60 text-gray-300 hover:text-blue-200 px-1 py-0.2 rounded border border-gray-700"
                                >
                                  {titlePreset.replace(',', '')}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="block text-gray-400 text-[9px] font-mono">NAMA TTD / CETAK:</label>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, issuerSignatureName: '' }))}
                                  className="text-[8px] text-amber-400 hover:underline"
                                  title="Kosongkan nama cetak di bawah garis"
                                >
                                  [Kosongkan]
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, issuerSignatureName: activeDoc.issuerName }))}
                                  className="text-[8px] text-blue-400 hover:underline"
                                  title="Reset ke nama pejabat"
                                >
                                  [Reset]
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={activeDoc.issuerSignatureName ?? activeDoc.issuerName}
                              onChange={(e) => setActiveDoc(prev => ({ ...prev, issuerSignatureName: e.target.value }))}
                              className="w-full bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-100 text-xs focus:border-blue-500 focus:outline-none"
                              placeholder="Ketik manual nama pejabat (atau kosongkan)"
                            />
                            <span className="text-[8px] text-gray-500 block mt-0.5">Ketik manual atau kosongkan untuk garis bersih.</span>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="block text-gray-400 text-[9px] font-mono">KETERANGAN / SUBTITLE:</label>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, issuerSignatureSubtitle: '' }))}
                                  className="text-[8px] text-amber-400 hover:underline"
                                  title="Kosongkan keterangan pangkat di bawah nama"
                                >
                                  [Kosongkan]
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, issuerSignatureSubtitle: activeDoc.issuerRank ? `${activeDoc.issuerRank} [${activeDoc.issuerBadge || 'ID'}]` : '' }))}
                                  className="text-[8px] text-blue-400 hover:underline"
                                  title="Reset ke format pangkat & badge standar"
                                >
                                  [Reset]
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={activeDoc.issuerSignatureSubtitle ?? (activeDoc.issuerRank ? `${activeDoc.issuerRank} [${activeDoc.issuerBadge || 'ID'}]` : '')}
                              onChange={(e) => setActiveDoc(prev => ({ ...prev, issuerSignatureSubtitle: e.target.value }))}
                              className="w-full bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-100 text-xs focus:border-blue-500 focus:outline-none"
                              placeholder="Contoh: PRESIDENT [RANK 6] (#GOV-01)"
                            />
                            <div className="flex flex-wrap gap-1 mt-1">
                              {currentOfficer?.rank?.toUpperCase().includes('PRESIDENT') && (
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, issuerSignatureSubtitle: `${currentOfficer.rank} [${currentOfficer.badge || '#GOV-01'}]` }))}
                                  className="text-[8px] bg-amber-950 text-amber-300 px-1 py-0.2 rounded border border-amber-700"
                                >
                                  {currentOfficer.rank} [{currentOfficer.badge || '#GOV-01'}]
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Font Style Selector (visible if not using image) */}
                        {!activeDoc.issuerSignatureImage && (
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[10px] text-gray-400 shrink-0 font-mono">Gaya Tulisan:</span>
                            <select
                              value={activeDoc.issuerSignatureStyle || 'formal'}
                              onChange={(e) => setActiveDoc(prev => ({
                                ...prev,
                                issuerSignatureStyle: e.target.value as any,
                                issuerSignatureType: e.target.value === 'blank' ? 'blank' : 'font'
                              }))}
                              className="w-full bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-200 text-[10px] focus:border-blue-500 focus:outline-none"
                            >
                              <option value="formal">Gaya Formal Legal (Georgia Serif - Default)</option>
                              <option value="handwriting1">Kaligrafi Cursive Miring</option>
                              <option value="handwriting2">Executive Autograph Script</option>
                              <option value="badge_stamp">Badge Monogram Signature</option>
                              <option value="blank">📄 Kosongan (Area TTD Manual / Kertas Polos)</option>
                            </select>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* 2. Recipient Signature */}
                  <div className={`bg-[#161B22] border rounded-lg p-2.5 space-y-2.5 transition ${activeDoc.showRecipientSignature === false ? 'border-gray-800/60 opacity-80' : 'border-gray-800'}`}>
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-200">
                      <span className="flex items-center gap-1.5 text-emerald-300">
                        <User className="w-3.5 h-3.5" />
                        2. Tanda Tangan Penerima / Subjek
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Toggle Switch Tampilkan / Sembunyikan Tanda Tangan Penerima */}
                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-gray-700 hover:border-emerald-500/50 transition">
                          <input
                            type="checkbox"
                            checked={activeDoc.showRecipientSignature !== false}
                            onChange={(e) => setActiveDoc(prev => ({ ...prev, showRecipientSignature: e.target.checked }))}
                            className="rounded border-gray-700 text-emerald-500 focus:ring-0 w-3 h-3 accent-emerald-500 cursor-pointer"
                          />
                          <span className={activeDoc.showRecipientSignature !== false ? 'text-emerald-400 font-bold' : 'text-gray-400'}>
                            {activeDoc.showRecipientSignature !== false ? 'TAMPILKAN' : 'DISEMBUNYIKAN'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {activeDoc.showRecipientSignature === false ? (
                      <div className="p-2 bg-black/30 border border-dashed border-gray-800 rounded text-[10px] text-gray-400 font-sans flex items-center justify-between">
                        <span>Kolom tanda tangan pihak penerima dinonaktifkan (dokumen hanya ditandatangani oleh Pejabat Penerbit / Atasan).</span>
                        <button
                          type="button"
                          onClick={() => setActiveDoc(prev => ({ ...prev, showRecipientSignature: true }))}
                          className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700/60 rounded text-[10px] font-bold hover:bg-emerald-900"
                        >
                          Aktifkan Kembali
                        </button>
                      </div>
                    ) : (
                      <>
                        {currentOfficer && (
                          <div className="p-2 bg-gradient-to-r from-emerald-950/60 via-amber-950/40 to-black/60 border border-emerald-600/50 rounded-lg flex items-center justify-between gap-2">
                            <div className="text-[10px] leading-tight">
                              <span className="font-bold text-emerald-300 block flex items-center gap-1">
                                <span>✍️ Tanda Tangani Sebagai:</span>
                                <span className="text-white">{currentOfficer.name}</span>
                              </span>
                              <span className="text-gray-400 text-[9px]">
                                {currentOfficer.rank} • {currentOfficer.division || 'Umum'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const isGov = currentOfficer.accountType === 'GOVERNMENT' || (currentOfficer.rank && (currentOfficer.rank.toUpperCase().includes('PRESIDENT') || currentOfficer.rank.toUpperCase().includes('RANK ')));
                                  const isPresident = currentOfficer.rank.toUpperCase().includes('PRESIDENT');
                                  setActiveDoc(prev => ({
                                    ...prev,
                                    showRecipientSignature: true,
                                    recipientName: currentOfficer.name,
                                    recipientId: currentOfficer.badge,
                                    recipientRoleOrStatus: `${currentOfficer.rank} - ${currentOfficer.division || 'Pemerintahan'}`,
                                    recipientSignatureName: currentOfficer.name,
                                    recipientSignatureTitle: isGov ? (isPresident ? 'Presiden / Pengesah Negara,' : 'Pejabat Negara / Penerima,') : 'Pihak Penerima,',
                                    recipientSignatureSubtitle: `${currentOfficer.rank} (${currentOfficer.badge})`,
                                    recipientSignatureType: 'font',
                                    recipientSignatureStyle: 'handwriting1',
                                    recipientSignatureImage: undefined,
                                    ...(isGov ? {
                                      secondarySeal: isPresident ? 'PRESIDENTIAL_SEAL' : 'GOVERNMENT_SEAL'
                                    } : {})
                                  }));
                                  setSaveSuccessMsg(`✅ Berhasil membubuhkan tanda tangan ${currentOfficer.name} (${currentOfficer.rank}) sebagai Penerima!`);
                                  setTimeout(() => setSaveSuccessMsg(null), 3500);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold font-mono transition flex items-center gap-1 shadow-sm"
                                title="Otomatis isi nama, status penerima, tanda tangan, dan stempel pemerintahan"
                              >
                                <span>⚡ Bubuhkan TTD</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Mode Selector Buttons */}
                        <div>
                          <label className="block text-gray-400 text-[9px] mb-1 font-mono">PILIHAN FORMAT TANDA TANGAN PENERIMA:</label>
                          <div className="grid grid-cols-4 gap-1">
                            {/* Option 1: Font / Teks Cursive */}
                            <button
                              type="button"
                              onClick={() => setActiveDoc(prev => ({
                                ...prev,
                                recipientSignatureType: 'font',
                                recipientSignatureImage: undefined,
                                recipientSignatureStyle: prev.recipientSignatureStyle === 'blank' ? 'handwriting1' : (prev.recipientSignatureStyle || 'handwriting1')
                              }))}
                              className={`px-1.5 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border transition ${
                                activeDoc.recipientSignatureType === 'font' && activeDoc.recipientSignatureStyle !== 'blank' && !activeDoc.recipientSignatureImage
                                  ? 'bg-emerald-700 border-emerald-500 text-white shadow-sm'
                                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                              }`}
                              title="Gunakan teks nama dengan gaya tulisan tangan digital"
                            >
                              <span>✍️ Teks Font</span>
                            </button>

                            {/* Option 2: Kosongan / Blank */}
                            <button
                              type="button"
                              onClick={() => setActiveDoc(prev => ({
                                ...prev,
                                recipientSignatureType: 'blank',
                                recipientSignatureStyle: 'blank',
                                recipientSignatureImage: undefined
                              }))}
                              className={`px-1.5 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border transition ${
                                activeDoc.recipientSignatureType === 'blank' || activeDoc.recipientSignatureStyle === 'blank'
                                  ? 'bg-amber-700 border-amber-500 text-white shadow-sm'
                                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                              }`}
                              title="Kosongkan area tanda tangan untuk ditandatangani manual dengan pulpen basah"
                            >
                              <span>📄 Kosongan</span>
                            </button>

                            {/* Option 3: Gambar / Canvas */}
                            <button
                              type="button"
                              onClick={() => setActiveSigPadTarget('recipient')}
                              className={`px-1.5 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border transition ${
                                activeDoc.recipientSignatureType === 'draw' && activeDoc.recipientSignatureImage
                                  ? 'bg-blue-700 border-blue-500 text-white shadow-sm'
                                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                              }`}
                              title="Tanda tangan langsung dengan jari / mouse di layar"
                            >
                              <PenTool className="w-3 h-3" />
                              <span>Gambar</span>
                            </button>

                            {/* Option 4: Upload File */}
                            <input
                              type="file"
                              ref={recipientSigUploadRef}
                              accept="image/*"
                              onChange={(e) => handleUploadImageFile(e, (url) => setActiveDoc(prev => ({ ...prev, recipientSignatureImage: url, recipientSignatureType: 'upload' })))}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => recipientSigUploadRef.current?.click()}
                              className={`px-1.5 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border transition ${
                                activeDoc.recipientSignatureType === 'upload' && activeDoc.recipientSignatureImage
                                  ? 'bg-purple-700 border-purple-500 text-white shadow-sm'
                                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                              }`}
                              title="Upload foto tanda tangan dari galeri atau komputer"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Upload</span>
                            </button>
                          </div>
                        </div>

                        {/* If in Kosongan Mode */}
                        {(activeDoc.recipientSignatureType === 'blank' || activeDoc.recipientSignatureStyle === 'blank') && (
                          <div className="p-2 bg-amber-950/40 border border-amber-700/60 rounded text-[10px] text-amber-200 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-amber-300">
                              <span>📄 MODE KOSONGAN AKTIF</span>
                            </div>
                            <p className="text-[9.5px] text-gray-300 leading-tight">
                              Area tanda tangan di atas garis akan <strong>kosong polos</strong>. Pihak penerima dapat menandatangani dokumen secara fisik dengan pulpen setelah dicetak.
                            </p>
                          </div>
                        )}

                        {/* Image Preview if uploaded or drawn */}
                        {activeDoc.recipientSignatureImage && (
                          <div className="h-12 bg-white/10 rounded flex items-center justify-center p-1 border border-gray-700 relative group">
                            <img
                              src={activeDoc.recipientSignatureImage}
                              alt="Recipient Signature Preview"
                              className="max-h-full max-w-full object-contain"
                              style={{ mixBlendMode: 'multiply' }}
                            />
                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                type="button"
                                onClick={() => setActiveDoc(prev => ({
                                  ...prev,
                                  recipientSignatureType: 'blank',
                                  recipientSignatureStyle: 'blank',
                                  recipientSignatureImage: undefined
                                }))}
                                className="px-1.5 py-0.5 bg-amber-900/90 hover:bg-amber-800 text-amber-200 rounded text-[9px] border border-amber-600"
                              >
                                Kosongkan
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveDoc(prev => ({ ...prev, recipientSignatureImage: undefined, recipientSignatureType: 'font' }))}
                                className="px-1.5 py-0.5 bg-rose-900/90 hover:bg-rose-800 text-rose-200 rounded text-[9px] border border-rose-600"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Detailed Fields: Label, Custom Name, Subtitle, Style */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="block text-gray-400 text-[9px] font-mono">LABEL JABATAN / POSISI:</label>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, recipientSignatureTitle: '' }))}
                                  className="text-[8px] text-amber-400 hover:underline"
                                  title="Kosongkan label jabatan penerima"
                                >
                                  [Kosongkan]
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, recipientSignatureTitle: 'Pihak Penerima,' }))}
                                  className="text-[8px] text-emerald-400 hover:underline"
                                  title="Reset ke default"
                                >
                                  [Reset]
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={activeDoc.recipientSignatureTitle ?? 'Pihak Penerima,'}
                              onChange={(e) => setActiveDoc(prev => ({ ...prev, recipientSignatureTitle: e.target.value }))}
                              className="w-full bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-100 text-xs focus:border-emerald-500 focus:outline-none"
                              placeholder="Pihak Penerima / Pemohon,"
                            />
                            {/* Preset Buttons for Title */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {[
                                'Presiden / Pengesah Negara,',
                                'Pemberi Perintah / Komandan Operasi,',
                                'Pihak Penerima,',
                                'Pejabat Penerima Negara,',
                                'Penerima Tugas / Pemohon,'
                              ].map(titlePreset => (
                                <button
                                  key={titlePreset}
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, recipientSignatureTitle: titlePreset }))}
                                  className="text-[8px] bg-gray-800 hover:bg-emerald-900/60 text-gray-300 hover:text-emerald-200 px-1 py-0.2 rounded border border-gray-700"
                                >
                                  {titlePreset.replace(',', '')}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="block text-gray-400 text-[9px] font-mono">NAMA TTD / CETAK:</label>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, recipientSignatureName: '' }))}
                                  className="text-[8px] text-amber-400 hover:underline"
                                  title="Kosongkan nama cetak di bawah garis"
                                >
                                  [Kosongkan]
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, recipientSignatureName: activeDoc.recipientName }))}
                                  className="text-[8px] text-emerald-400 hover:underline"
                                  title="Reset ke nama penerima"
                                >
                                  [Reset]
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={activeDoc.recipientSignatureName ?? activeDoc.recipientName}
                              onChange={(e) => setActiveDoc(prev => ({ ...prev, recipientSignatureName: e.target.value }))}
                              className="w-full bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-100 text-xs focus:border-emerald-500 focus:outline-none"
                              placeholder="Nama Pihak Penerima (atau kosongkan)"
                            />
                            <span className="text-[8px] text-gray-500 block mt-0.5">Ketik manual atau kosongkan untuk garis bersih.</span>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="block text-gray-400 text-[9px] font-mono">KETERANGAN / SUBTITLE:</label>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, recipientSignatureSubtitle: '' }))}
                                  className="text-[8px] text-amber-400 hover:underline"
                                  title="Kosongkan keterangan subtitle di bawah nama"
                                >
                                  [Kosongkan]
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, recipientSignatureSubtitle: activeDoc.recipientId ? `ID: ${activeDoc.recipientId}` : 'Pihak Terkait' }))}
                                  className="text-[8px] text-emerald-400 hover:underline"
                                  title="Reset ke format default"
                                >
                                  [Reset]
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={activeDoc.recipientSignatureSubtitle ?? (activeDoc.recipientId ? `ID: ${activeDoc.recipientId}` : 'Pihak Terkait')}
                              onChange={(e) => setActiveDoc(prev => ({ ...prev, recipientSignatureSubtitle: e.target.value }))}
                              className="w-full bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-100 text-xs focus:border-emerald-500 focus:outline-none"
                              placeholder="Kosongkan jika tidak perlu"
                            />
                          </div>
                        </div>

                        {/* Font Style Selector (visible if not using image) */}
                        {!activeDoc.recipientSignatureImage && (
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[10px] text-gray-400 shrink-0 font-mono">Gaya Tulisan:</span>
                            <select
                              value={activeDoc.recipientSignatureStyle || 'handwriting1'}
                              onChange={(e) => setActiveDoc(prev => ({
                                ...prev,
                                recipientSignatureStyle: e.target.value as any,
                                recipientSignatureType: e.target.value === 'blank' ? 'blank' : 'font'
                              }))}
                              className="w-full bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-200 text-[10px] focus:border-emerald-500 focus:outline-none"
                            >
                              <option value="handwriting1">Kaligrafi Cursive Miring (Default)</option>
                              <option value="formal">Gaya Formal Legal (Georgia Serif)</option>
                              <option value="handwriting2">Executive Autograph Script</option>
                              <option value="badge_stamp">Badge Monogram Signature</option>
                              <option value="blank">📄 Kosongan (Area TTD Manual / Kertas Polos)</option>
                            </select>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* 3. High Command Acknowledgment Signature */}
                  <div className={`bg-[#161B22] border rounded-lg p-2.5 space-y-2.5 transition ${activeDoc.showAcknowledgedBySignature === false || (!activeDoc.acknowledgedByName && !activeDoc.acknowledgedByRank) ? 'border-gray-800/60 opacity-80' : 'border-gray-800'}`}>
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-200">
                      <span className="flex items-center gap-1.5 text-amber-300">
                        <Lock className="w-3.5 h-3.5" />
                        3. Pengesahan Pimpinan / Otorisasi Pusat
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Otorisasi Pusat Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => setIsGovCentralAuthModalOpen(true)}
                          className="text-[9px] text-amber-300 hover:text-amber-100 font-mono font-bold px-2 py-0.5 rounded bg-gradient-to-r from-amber-950 to-yellow-950 border border-amber-500/70 transition flex items-center gap-1 shadow-sm active:scale-95"
                          title="Buka Panel Otorisasi Pusat & Webhook Discord Kenegaraan"
                        >
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>👑 Otorisasi Pusat: & Webhook</span>
                        </button>
                        {/* Quick Empty / Kosongkan Button */}
                        <button
                          type="button"
                          onClick={() => setActiveDoc(prev => ({
                            ...prev,
                            acknowledgedByName: '',
                            acknowledgedByTitle: '',
                            acknowledgedByRank: '',
                            acknowledgedByRole: '',
                            acknowledgedCustomStatus: '',
                            acknowledgedSignatureImage: undefined,
                            acknowledgedSignatureType: 'blank',
                            acknowledgedSignatureStyle: 'blank'
                          }))}
                          className="text-[9px] text-amber-400 hover:text-amber-300 font-mono px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-800/60 transition"
                          title="Kosongkan semua data strip pengesahan pimpinan"
                        >
                          Kosongkan
                        </button>
                        {/* Toggle Switch Tampilkan / Sembunyikan Pengesahan */}
                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-gray-700 hover:border-amber-500/50 transition">
                          <input
                            type="checkbox"
                            checked={activeDoc.showAcknowledgedBySignature !== false && (!!activeDoc.acknowledgedByName || !!activeDoc.acknowledgedByRank)}
                            onChange={(e) => setActiveDoc(prev => ({ 
                              ...prev, 
                              showAcknowledgedBySignature: e.target.checked,
                              ...(e.target.checked && !prev.acknowledgedByName ? {
                                acknowledgedByName: 'Leoarnd Neave',
                                acknowledgedByTitle: 'Otorisasi Pusat:',
                                acknowledgedByRank: 'CHIEF OF POLICE [COP]',
                                acknowledgedByRole: 'Kepala Kepolisian HighState',
                                acknowledgedCustomStatus: 'DISAHKAN & DIAKREDITASI OLEH MARKAS BESAR'
                              } : {})
                            }))}
                            className="rounded border-gray-700 text-amber-500 focus:ring-0 w-3 h-3 accent-amber-500 cursor-pointer"
                          />
                          <span className={activeDoc.showAcknowledgedBySignature !== false && (!!activeDoc.acknowledgedByName || !!activeDoc.acknowledgedByRank) ? 'text-amber-400 font-bold' : 'text-gray-400'}>
                            {activeDoc.showAcknowledgedBySignature !== false && (!!activeDoc.acknowledgedByName || !!activeDoc.acknowledgedByRank) ? 'TAMPILKAN' : 'DISEMBUNYIKAN / KOSONG'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {activeDoc.showAcknowledgedBySignature === false || (!activeDoc.acknowledgedByName && !activeDoc.acknowledgedByRank) ? (
                      <div className="p-2 bg-black/30 border border-dashed border-gray-800 rounded text-[10px] text-gray-400 font-sans flex items-center justify-between">
                        <span>Strip pengesahan pimpinan / otorisasi pusat saat ini <strong>kosong / tidak ditampilkan</strong> di lembar dokumen.</span>
                        <button
                          type="button"
                          onClick={() => setActiveDoc(prev => ({
                            ...prev,
                            showAcknowledgedBySignature: true,
                            acknowledgedByName: 'Leoarnd Neave',
                            acknowledgedByTitle: 'Otorisasi Pusat:',
                            acknowledgedByRank: 'CHIEF OF POLICE [COP]',
                            acknowledgedByRole: 'Kepala Kepolisian HighState',
                            acknowledgedCustomStatus: 'DISAHKAN & DIAKREDITASI OLEH MARKAS BESAR'
                          }))}
                          className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-700/60 rounded text-[10px] font-bold hover:bg-amber-900"
                        >
                          Tampilkan Pengesahan
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Format Mode Selector */}
                        <div>
                          <label className="block text-gray-400 text-[9px] mb-1 font-mono">FORMAT TANDA TANGAN PIMPINAN:</label>
                          <div className="grid grid-cols-4 gap-1">
                            <button
                              type="button"
                              onClick={() => setActiveDoc(prev => ({
                                ...prev,
                                acknowledgedSignatureType: 'font',
                                acknowledgedSignatureImage: undefined,
                                acknowledgedSignatureStyle: prev.acknowledgedSignatureStyle === 'blank' ? 'formal' : (prev.acknowledgedSignatureStyle || 'formal')
                              }))}
                              className={`px-1.5 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border transition ${
                                activeDoc.acknowledgedSignatureType === 'font' && activeDoc.acknowledgedSignatureStyle !== 'blank' && !activeDoc.acknowledgedSignatureImage
                                  ? 'bg-amber-700 border-amber-500 text-white shadow-sm'
                                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                              }`}
                            >
                              <span>✍️ Teks Font</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveDoc(prev => ({
                                ...prev,
                                acknowledgedSignatureType: 'blank',
                                acknowledgedSignatureStyle: 'blank',
                                acknowledgedSignatureImage: undefined
                              }))}
                              className={`px-1.5 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border transition ${
                                activeDoc.acknowledgedSignatureType === 'blank' || activeDoc.acknowledgedSignatureStyle === 'blank'
                                  ? 'bg-amber-800 border-amber-500 text-white shadow-sm'
                                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                              }`}
                            >
                              <span>📄 Kosongan</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setActiveSigPadTarget('acknowledged')}
                              className={`px-1.5 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border transition ${
                                activeDoc.acknowledgedSignatureType === 'draw' && activeDoc.acknowledgedSignatureImage
                                  ? 'bg-blue-700 border-blue-500 text-white shadow-sm'
                                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                              }`}
                            >
                              <PenTool className="w-3 h-3" />
                              <span>Gambar</span>
                            </button>

                            <input
                              type="file"
                              ref={acknowledgedSigUploadRef}
                              accept="image/*"
                              onChange={(e) => handleUploadImageFile(e, (url) => setActiveDoc(prev => ({ ...prev, acknowledgedSignatureImage: url, acknowledgedSignatureType: 'upload' })))}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => acknowledgedSigUploadRef.current?.click()}
                              className={`px-1.5 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1 border transition ${
                                activeDoc.acknowledgedSignatureType === 'upload' && activeDoc.acknowledgedSignatureImage
                                  ? 'bg-purple-700 border-purple-500 text-white shadow-sm'
                                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                              }`}
                            >
                              <Upload className="w-3 h-3" />
                              <span>Upload</span>
                            </button>
                          </div>
                        </div>

                        {activeDoc.acknowledgedSignatureImage && (
                          <div className="h-10 bg-white/10 rounded flex items-center justify-center p-1 border border-gray-700 relative group">
                            <img
                              src={activeDoc.acknowledgedSignatureImage}
                              alt="Acknowledged Signature Preview"
                              className="max-h-full max-w-full object-contain"
                              style={{ mixBlendMode: 'multiply' }}
                            />
                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                type="button"
                                onClick={() => setActiveDoc(prev => ({ ...prev, acknowledgedSignatureImage: undefined, acknowledgedSignatureType: 'font' }))}
                                className="px-1.5 py-0.5 bg-rose-900/90 hover:bg-rose-800 text-rose-200 rounded text-[9px] border border-rose-600"
                              >
                                Hapus Gambar
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="block text-gray-400 text-[9px] font-mono">LABEL / AWALAN:</label>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, acknowledgedByTitle: '' }))}
                                  className="text-[8px] text-amber-400 hover:underline"
                                >
                                  [Kosongkan]
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, acknowledgedByTitle: 'Otorisasi Pusat:' }))}
                                  className="text-[8px] text-blue-400 hover:underline"
                                >
                                  [Reset]
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={activeDoc.acknowledgedByTitle ?? 'Otorisasi Pusat:'}
                              onChange={(e) => setActiveDoc(prev => ({ ...prev, acknowledgedByTitle: e.target.value }))}
                              className="w-full bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-100 text-xs focus:border-amber-500 focus:outline-none"
                              placeholder="Otorisasi Pusat: / Mengetahui,"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="block text-gray-400 text-[9px] font-mono">NAMA PIMPINAN:</label>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, acknowledgedByName: '' }))}
                                  className="text-[8px] text-amber-400 hover:underline"
                                >
                                  [Kosongkan]
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, acknowledgedByName: 'Leoarnd Neave' }))}
                                  className="text-[8px] text-blue-400 hover:underline"
                                >
                                  [Reset]
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={activeDoc.acknowledgedByName || ''}
                              onChange={(e) => setActiveDoc(prev => ({ ...prev, acknowledgedByName: e.target.value }))}
                              className="w-full bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-100 text-xs focus:border-amber-500 focus:outline-none"
                              placeholder="Leoarnd Neave (atau kosongkan)"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="block text-gray-400 text-[9px] font-mono">PANGKAT & JABATAN:</label>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, acknowledgedByRank: '', acknowledgedByRole: '' }))}
                                  className="text-[8px] text-amber-400 hover:underline"
                                >
                                  [Kosongkan]
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, acknowledgedByRank: 'CHIEF OF POLICE [COP]' }))}
                                  className="text-[8px] text-blue-400 hover:underline"
                                >
                                  [COP]
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, acknowledgedByRank: 'PRESIDEN NEGARA' }))}
                                  className="text-[8px] text-blue-400 hover:underline"
                                >
                                  [Gov]
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={activeDoc.acknowledgedByRank || ''}
                              onChange={(e) => setActiveDoc(prev => ({ ...prev, acknowledgedByRank: e.target.value }))}
                              className="w-full bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-100 text-xs focus:border-amber-500 focus:outline-none"
                              placeholder="CHIEF OF POLICE / PRESIDEN"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="block text-gray-400 text-[9px] font-mono">TEKS STATUS PENGESAHAN:</label>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, acknowledgedCustomStatus: '' }))}
                                  className="text-[8px] text-amber-400 hover:underline"
                                >
                                  [Kosongkan]
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveDoc(prev => ({ ...prev, acknowledgedCustomStatus: 'DISAHKAN & DIAKREDITASI OLEH MARKAS BESAR' }))}
                                  className="text-[8px] text-blue-400 hover:underline"
                                >
                                  [Reset]
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={activeDoc.acknowledgedCustomStatus ?? 'DISAHKAN & DIAKREDITASI OLEH MARKAS BESAR'}
                              onChange={(e) => setActiveDoc(prev => ({ ...prev, acknowledgedCustomStatus: e.target.value }))}
                              className="w-full bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-100 text-xs focus:border-amber-500 focus:outline-none"
                              placeholder="DISAHKAN & DIAKREDITASI OLEH MARKAS BESAR"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: PAPER TEXTURE & WATERMARK CONTROLS */}
            {activeEditorTab === 'PAPER_STYLE' && (
              <div className="p-4 space-y-4 font-mono text-xs">
                
                {/* WATERMARK / CAP AIR EMBLEM SECTION */}
                <div className="bg-[#0D1117] border border-purple-900/50 rounded-xl p-3 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                      <Sparkles className="w-4 h-4" />
                      <span>CAP AIR / WATERMARK DOKUMEN</span>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-gray-300 text-[11px]">
                      <input
                        type="checkbox"
                        checked={activeDoc.showWatermark}
                        onChange={(e) => setActiveDoc(prev => ({ ...prev, showWatermark: e.target.checked }))}
                        className="rounded bg-gray-800 border-gray-700 text-purple-600 focus:ring-0"
                      />
                      <span>Aktifkan Cap Air</span>
                    </label>
                  </div>

                  {activeDoc.showWatermark && (
                    <div className="space-y-3">
                      {/* Watermark source logo */}
                      <div className="flex items-center gap-3 bg-[#161B22] p-2.5 rounded-lg border border-gray-700">
                        <div className="w-14 h-14 bg-white/10 rounded flex items-center justify-center p-1 border border-gray-600 shrink-0 overflow-hidden">
                          <img
                            src={activeDoc.customWatermarkImage || HSPD_LOGO_URL}
                            onError={(e) => { (e.target as HTMLImageElement).src = HSPD_LOGO_FALLBACK; }}
                            alt="Watermark Logo"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 text-[11px] space-y-1">
                          <span className="text-gray-200 font-bold block">
                            {activeDoc.customWatermarkImage ? 'Cap Air Custom dari Device' : 'Cap Air Resmi Lambang HSPD (Default)'}
                          </span>
                          
                          <input
                            type="file"
                            ref={customWatermarkInputRef}
                            accept="image/*"
                            onChange={(e) => handleUploadImageFile(e, (url) => setActiveDoc(prev => ({ ...prev, customWatermarkImage: url })))}
                            className="hidden"
                          />

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => customWatermarkInputRef.current?.click()}
                              className="px-2 py-0.5 bg-purple-700 hover:bg-purple-600 text-white rounded text-[10px] font-bold flex items-center gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Ganti Logo Cap Air</span>
                            </button>
                            {activeDoc.customWatermarkImage && (
                              <button
                                onClick={() => setActiveDoc(prev => ({ ...prev, customWatermarkImage: undefined }))}
                                className="text-gray-400 hover:text-gray-200 text-[10px] underline"
                              >
                                Gunakan Logo HSPD
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sliders for Opacity & Size */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-400 text-[10px] mb-1">
                            KEPEKATAN CAP AIR: ({Math.round((activeDoc.watermarkOpacity ?? 0.11) * 100)}%)
                          </label>
                          <input
                            type="range"
                            min="0.04"
                            max="0.30"
                            step="0.01"
                            value={activeDoc.watermarkOpacity ?? 0.11}
                            onChange={(e) => setActiveDoc(prev => ({ ...prev, watermarkOpacity: Number(e.target.value) }))}
                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="text-[9px] text-gray-500">Rekomendasi: 8% - 15% untuk kesan otentik</span>
                        </div>

                        <div>
                          <label className="block text-gray-400 text-[10px] mb-1">
                            DIAMETER CAP AIR: ({activeDoc.watermarkSize ?? 450}px)
                          </label>
                          <input
                            type="range"
                            min="280"
                            max="600"
                            step="10"
                            value={activeDoc.watermarkSize ?? 450}
                            onChange={(e) => setActiveDoc(prev => ({ ...prev, watermarkSize: Number(e.target.value) }))}
                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* PAPER TEXTURE & BORDER STYLING */}
                <div className="bg-[#0D1117] border border-gray-800 rounded-xl p-3 space-y-3">
                  <div className="text-gray-200 font-bold text-xs flex items-center gap-1.5 border-b border-gray-800 pb-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>TEKSTUR KERTAS & BINGKAI KEAMANAN</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 mb-1 text-[10px]">TIPE TEKSTUR KERTAS:</label>
                      <select
                        value={activeDoc.paperTexture || 'security_parchment'}
                        onChange={(e) => setActiveDoc(prev => ({ ...prev, paperTexture: e.target.value as any }))}
                        className="w-full bg-[#161B22] border border-gray-700 rounded px-2.5 py-1.5 text-gray-100 text-xs"
                      >
                        <option value="security_parchment">📜 Parchment Keamanan (Warm Ivory)</option>
                        <option value="cream_bond">📄 Kertas Segel Cream Bond</option>
                        <option value="vintage_linen">🗞️ Archival Vintage Linen</option>
                        <option value="clean_white">⚪ Putih Polos Standar</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1 text-[10px]">BINGKAI PINGGIR (BORDER):</label>
                      <select
                        value={activeDoc.paperBorderType || 'official_guilloche'}
                        onChange={(e) => setActiveDoc(prev => ({ ...prev, paperBorderType: e.target.value as any }))}
                        className="w-full bg-[#161B22] border border-gray-700 rounded px-2.5 py-1.5 text-gray-100 text-xs"
                      >
                        <option value="official_guilloche">🏛️ Bingkai Guilloche Resmi + Sudut Emas</option>
                        <option value="double_line">📑 Garis Ganda Formal (Double Line)</option>
                        <option value="gold_accent">✨ Garis Aksen Emas Markas Besar</option>
                        <option value="minimal">➖ Minimalis Standar</option>
                      </select>
                    </div>
                  </div>

                  {/* KOP SURAT LOGO CUSTOM UPLOAD OPTION */}
                  <div className="border-t border-gray-800 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-300 font-bold">
                        Logo Kop Surat Utama:
                      </span>
                      {activeDoc.customHeaderLogo && (
                        <button
                          onClick={() => setActiveDoc(prev => ({ ...prev, customHeaderLogo: undefined }))}
                          className="text-rose-400 text-[10px] underline"
                        >
                          Kembali ke Logo HSPD
                        </button>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={customHeaderLogoInputRef}
                      accept="image/*"
                      onChange={(e) => handleUploadImageFile(e, (url) => setActiveDoc(prev => ({ ...prev, customHeaderLogo: url })))}
                      className="hidden"
                    />

                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        onClick={() => customHeaderLogoInputRef.current?.click()}
                        className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-[10px] font-bold flex items-center gap-1 border border-gray-700"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Logo Kop Surat Sendiri</span>
                      </button>
                      <span className="text-[9px] text-gray-500">
                        Default: Logo Lambang Resmi HSPD
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: REALISTIC HSPD PHYSICAL PAPER CANVAS
           ======================================================== */}
        <div className="xl:col-span-7 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2 text-xs font-mono">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pratinjau Kertas Fisik Asli & Cap Air (Resolusi Tinggi Siap Cetak)</span>
            </span>
            <span className="text-[11px] text-gray-500">
              Format A4 (210 x 297 mm) • HSPD High-Security Paper
            </span>
          </div>

          {/* PHYSICAL PAPER SHEET CONTAINER */}
          <div className="w-full overflow-x-auto pb-4 flex justify-center">
            <div
              id="hspd-official-paper-sheet"
              ref={paperRef}
              className="w-[820px] min-h-[1160px] text-[#0F172A] p-10 shadow-2xl relative flex flex-col justify-between select-text transition-all duration-300"
              style={{
                ...getPaperStyles(),
                fontFamily: "'Times New Roman', 'Liberation Serif', serif",
                color: '#0F172A'
              }}
            >
              {/* Outer Security Microprint Border */}
              {activeDoc.paperBorderType !== 'minimal' && (
                <div className="absolute inset-4 border border-[#B45309]/30 pointer-events-none z-0 rounded-sm">
                  <div className="absolute inset-1 border border-black/20"></div>
                  {/* Guilloche Corner Ornaments */}
                  {activeDoc.paperBorderType === 'official_guilloche' && (
                    <>
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#B45309]"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#B45309]"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#B45309]"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#B45309]"></div>
                    </>
                  )}
                </div>
              )}

              {/* AUTHENTIC CAP AIR / WATERMARK DARI LOGO HSPD */}
              {activeDoc.showWatermark && (
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"
                  style={{
                    opacity: activeDoc.watermarkOpacity ?? 0.11,
                    mixBlendMode: 'multiply'
                  }}
                >
                  <img
                    src={activeDoc.customWatermarkImage || getActiveLogoUrl()}
                    onError={(e) => { (e.target as HTMLImageElement).src = HSPD_LOGO_FALLBACK; }}
                    alt="Official Watermark"
                    style={{
                      width: activeDoc.watermarkSize ? `${activeDoc.watermarkSize}px` : '450px',
                      height: activeDoc.watermarkSize ? `${activeDoc.watermarkSize}px` : '450px',
                      objectFit: 'contain',
                      filter: 'grayscale(20%) contrast(110%)'
                    }}
                  />
                </div>
              )}

              {/* TOP HEADER / KOP SURAT RESMI */}
              <div className="relative z-10">
                <div className="flex items-center justify-between pb-3 border-b-[3px] border-black">
                  
                  {/* Left: Official HSPD Badge Logo (High-Res Round Emblem) */}
                  <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                    <img
                      src={activeDoc.customHeaderLogo || getActiveLogoUrl()}
                      onError={(e) => { (e.target as HTMLImageElement).src = HSPD_LOGO_FALLBACK; }}
                      alt="Official Department Emblem"
                      className="w-20 h-20 object-contain drop-shadow-md rounded-full"
                    />
                  </div>

                  {/* Center: Official Title and Address */}
                  <div className="text-center flex-1 px-3">
                    <h2 className="text-[17px] font-black tracking-wider uppercase text-black font-sans leading-tight">
                      KEPOLISIAN NEGARA HIGHSTATE (HSPD)
                    </h2>
                    <h3 className="text-[13px] font-bold tracking-wide uppercase text-gray-800 font-sans mt-0.5">
                      MARKAS BESAR KEPOLISIAN • MISSION ROW HEADQUARTERS
                    </h3>
                    <p className="text-[10px] text-gray-700 font-mono mt-1 leading-snug">
                      Sinner St & Atwater Ave, Mission Row, Downtown Los Santos | Hotline: 911 | Dispatch Frequency 10-8
                    </p>
                    <div className="h-0.5 bg-gradient-to-r from-transparent via-[#B45309] to-transparent mt-1 opacity-70"></div>
                  </div>

                  {/* Right: Security Classification Badge */}
                  <div className="w-28 shrink-0 text-right">
                    <div className="border border-black px-2 py-1 text-center bg-gray-50/90 shadow-sm rounded-sm">
                      <span className="text-[8.5px] block text-gray-500 font-mono font-bold">KLASIFIKASI:</span>
                      <span className={`text-[10.5px] font-black font-mono tracking-wider ${
                        activeDoc.classification === 'RAHASIA' || activeDoc.classification === 'SANGAT RAHASIA'
                          ? 'text-red-700'
                          : 'text-black'
                      }`}>
                        {activeDoc.classification}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Secondary thin sub-border line */}
                <div className="border-b border-black mt-1 mb-5"></div>

                {/* DOCUMENT TITLE & NUMBER */}
                <div className="text-center my-4">
                  <h1 className="text-[16.5px] font-black uppercase tracking-wide text-black underline decoration-2 underline-offset-4 font-sans">
                    {activeDoc.title}
                  </h1>
                  <p className="text-[12px] font-bold font-mono tracking-wider text-gray-900 mt-1">
                    NOMOR: {activeDoc.docNumber}
                  </p>
                  <p className="text-[11.5px] italic text-gray-700 mt-0.5">
                    Tentang: {activeDoc.subject}
                  </p>
                </div>

                {/* METADATA GRID (ISSUER & RECIPIENT SUMMARY) */}
                <div className="grid grid-cols-2 gap-4 text-[11.5px] bg-white/60 border border-gray-400 p-3 rounded my-3 font-sans shadow-sm">
                  <div>
                    <span className="font-bold block text-gray-900 border-b border-gray-400 pb-0.5 mb-1.5 text-[11px] uppercase font-mono">
                      I. PIHAK PERTAMA (PEJABAT PENERBIT):
                    </span>
                    <table className="w-full text-[11.5px] leading-tight">
                      <tbody>
                        <tr>
                          <td className="w-20 text-gray-600">Nama</td>
                          <td className="w-3">:</td>
                          <td className="font-bold text-gray-900">{activeDoc.issuerName}</td>
                        </tr>
                        <tr>
                          <td className="text-gray-600">No. Badge</td>
                          <td>:</td>
                          <td className="font-mono text-gray-900">{activeDoc.issuerBadge}</td>
                        </tr>
                        <tr>
                          <td className="text-gray-600">Pangkat</td>
                          <td>:</td>
                          <td className="font-semibold text-gray-900">{activeDoc.issuerRank}</td>
                        </tr>
                        <tr>
                          <td className="text-gray-600">Jabatan</td>
                          <td>:</td>
                          <td className="text-gray-800">{activeDoc.issuerRole}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <span className="font-bold block text-gray-900 border-b border-gray-400 pb-0.5 mb-1.5 text-[11px] uppercase font-mono">
                      II. PIHAK KEDUA (PENERIMA / SUBJEK):
                    </span>
                    <table className="w-full text-[11.5px] leading-tight">
                      <tbody>
                        <tr>
                          <td className="w-20 text-gray-600">Nama</td>
                          <td className="w-3">:</td>
                          <td className="font-bold text-gray-900">{activeDoc.recipientName}</td>
                        </tr>
                        <tr>
                          <td className="text-gray-600">ID/CID</td>
                          <td>:</td>
                          <td className="font-mono text-gray-900">{activeDoc.recipientId || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-gray-600">Status</td>
                          <td>:</td>
                          <td className="text-gray-900">{activeDoc.recipientRoleOrStatus || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-gray-600">Lokasi/Alamat</td>
                          <td>:</td>
                          <td className="text-gray-800 truncate max-w-[170px]">{activeDoc.recipientAddress || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* OPENING STATEMENT */}
                <div className="text-[12.5px] leading-relaxed text-justify indent-8 my-3.5">
                  {activeDoc.openingText}
                </div>

                {/* CLAUSES / PASAL LIST */}
                <div className="space-y-3 my-4">
                  {activeDoc.clauses.map((clause, idx) => (
                    <div key={clause.id} className="text-[12px] leading-normal">
                      <div className="flex items-start gap-2">
                        <span className="font-bold font-sans text-black whitespace-nowrap min-w-[70px]">
                          {clause.clauseNumber || `Pasal ${idx + 1}`}:
                        </span>
                        <div className="flex-1 text-justify">
                          {clause.title && (
                            <strong className="block text-black mb-0.5 font-sans uppercase text-[11.5px]">
                              [{clause.title}]
                            </strong>
                          )}
                          <span className="text-gray-900 leading-relaxed">
                            {clause.content}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CLOSING STATEMENT */}
                <div className="text-[12.5px] leading-relaxed text-justify indent-8 my-3.5">
                  {activeDoc.closingText}
                </div>

                {/* DISCLAIMER / NOTES */}
                {activeDoc.notes && (
                  <div className="text-[10px] text-gray-700 italic bg-white/50 border-l-2 border-gray-500 p-2 my-2 font-sans">
                    * Catatan: {activeDoc.notes}
                  </div>
                )}
              </div>

              {/* BOTTOM SECTION: SIGNATURES & OFFICIAL SEALS */}
              <div className="relative z-10 mt-6 pt-4 border-t border-gray-400">
                <div className="text-[11px] text-right mb-4 font-mono text-gray-700">
                  Ditetapkan di: <strong>{activeDoc.location}</strong> pada tanggal <strong>{activeDoc.date}</strong>
                </div>

                {/* Signature Block (Dynamic 3 Columns, 2 Columns, or Center Seal Only depending on visibility toggles) */}
                {(() => {
                  const isRecipientVisible = activeDoc.showRecipientSignature !== false;
                  const isIssuerVisible = activeDoc.showIssuerSignature !== false;

                  let signatureGridClass = 'grid grid-cols-3 gap-4 text-center items-end relative';
                  if (isRecipientVisible && !isIssuerVisible) {
                    signatureGridClass = 'grid grid-cols-2 gap-4 text-center items-end relative max-w-xl';
                  } else if (!isRecipientVisible && isIssuerVisible) {
                    signatureGridClass = 'grid grid-cols-2 gap-4 text-center items-end relative max-w-xl ml-auto';
                  } else if (!isRecipientVisible && !isIssuerVisible) {
                    signatureGridClass = 'flex flex-col items-center justify-center relative min-h-[120px] my-2';
                  }

                  return (
                    <div className={signatureGridClass}>
                      {/* Left Signature: Recipient / Pihak Kedua (Only rendered if showRecipientSignature !== false) */}
                      {isRecipientVisible && (
                        <div className="flex flex-col items-center relative group/recipientsig">
                          {/* Hover Quick Actions (no-print) */}
                          <div className="no-print absolute -top-7 left-0 opacity-0 group-hover/recipientsig:opacity-100 transition flex items-center gap-1 bg-black/90 border border-emerald-500/60 rounded px-1.5 py-0.5 shadow-lg z-30">
                            <button
                              type="button"
                              onClick={() => setActiveEditorTab('SEALS_SIGS')}
                              className="text-[9px] text-emerald-300 hover:text-white flex items-center gap-0.5"
                              title="Buka tab pengaturan tanda tangan"
                            >
                              <span>✏️ Ubah Manual</span>
                            </button>
                            <span className="text-gray-600 text-[9px]">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDoc(prev => ({
                                  ...prev,
                                  recipientSignatureType: 'blank',
                                  recipientSignatureStyle: 'blank',
                                  recipientSignatureImage: undefined
                                }));
                                setSaveSuccessMsg('📄 Kolom tanda tangan penerima dikosongkan (TTD manual basah).');
                                setTimeout(() => setSaveSuccessMsg(null), 3000);
                              }}
                              className="text-[9px] text-amber-300 hover:text-white flex items-center gap-0.5"
                              title="Kosongkan coretan TTD (siap ditandatangani pulpen basah)"
                            >
                              <span>📄 Kosongkan</span>
                            </button>
                            <span className="text-gray-600 text-[9px]">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDoc(prev => ({ ...prev, showRecipientSignature: false }));
                                setSaveSuccessMsg('Kolom tanda tangan penerima disembunyikan.');
                                setTimeout(() => setSaveSuccessMsg(null), 3000);
                              }}
                              className="text-[9px] text-rose-300 hover:text-white flex items-center gap-0.5"
                              title="Hilangkan kolom tanda tangan penerima"
                            >
                              <span>❌ Hilangkan</span>
                            </button>
                          </div>

                          <span className="text-[11px] font-bold text-gray-800 font-sans block mb-1">
                            {activeDoc.recipientSignatureTitle || 'Pihak Penerima,'}
                          </span>
                          
                          {/* Custom Recipient Signature Display */}
                          <div className="h-16 flex items-center justify-center my-1 w-full overflow-hidden">
                            {activeDoc.recipientSignatureImage ? (
                              <img
                                src={activeDoc.recipientSignatureImage}
                                alt="Recipient Signature"
                                className="max-h-full max-w-full object-contain"
                                style={{ mixBlendMode: 'multiply' }}
                              />
                            ) : (activeDoc.recipientSignatureType === 'blank' || activeDoc.recipientSignatureStyle === 'blank') ? (
                              <div className="h-full w-full flex items-center justify-center">
                                {/* Kosongan: Area tanda tangan manual fisik basah */}
                              </div>
                            ) : (
                              (() => {
                                const nameText = activeDoc.recipientSignatureName !== undefined ? activeDoc.recipientSignatureName : (activeDoc.recipientName || 'Pihak Terkait');
                                if (!nameText) return null;
                                const style = activeDoc.recipientSignatureStyle || 'handwriting1';
                                if (style === 'formal') {
                                  return (
                                    <span 
                                      className="text-[18px] text-gray-950 font-serif italic font-medium select-none"
                                      style={{ fontFamily: 'Georgia, serif' }}
                                    >
                                      {nameText}
                                    </span>
                                  );
                                }
                                if (style === 'handwriting2') {
                                  return (
                                    <span 
                                      className="text-[21px] text-indigo-950 rotate-[-2deg] select-none font-sans italic font-light tracking-wide"
                                      style={{ fontFamily: 'cursive, sans-serif' }}
                                    >
                                      {nameText}
                                    </span>
                                  );
                                }
                                if (style === 'badge_stamp') {
                                  return (
                                    <span className="text-[12px] text-slate-800 font-mono font-bold tracking-widest uppercase border border-slate-700/60 px-2 py-0.5 rounded rotate-[2deg]">
                                      {nameText}
                                    </span>
                                  );
                                }
                                // default handwriting1
                                return (
                                  <span 
                                    className="text-[20px] text-blue-900 rotate-[-4deg] select-none italic font-serif"
                                    style={{ fontFamily: 'Georgia, serif' }}
                                  >
                                    {nameText}
                                  </span>
                                );
                              })()
                            )}
                          </div>

                          <div className="border-t border-black w-36 pt-1">
                            {activeDoc.recipientSignatureName !== '' && (
                              <span className="font-bold text-[11.5px] block text-black">
                                {activeDoc.recipientSignatureName ?? activeDoc.recipientName}
                              </span>
                            )}
                            {activeDoc.recipientSignatureSubtitle !== '' && (
                              <span className="text-[9.5px] text-gray-600 font-mono block">
                                {activeDoc.recipientSignatureSubtitle ?? (activeDoc.recipientId ? `ID: ${activeDoc.recipientId}` : 'Pihak Terkait')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Center / Left-Center: Real Official Wet Stamp & Watermark QR */}
                      <div className="flex flex-col items-center justify-center relative min-h-[120px]">
                        {/* 1. Custom Uploaded Seal from Device (if enabled) */}
                        {(activeDoc.sealDisplayMode === 'custom' || activeDoc.sealDisplayMode === 'both') && activeDoc.customSealImage && (
                          <div className="absolute top-[-20px] z-20">
                            <CustomUploadedSeal
                              imageUrl={activeDoc.customSealImage}
                              size={Math.round((activeDoc.customSealScale ?? 1.0) * 130)}
                              rotation={activeDoc.customSealRotation ?? -7}
                              opacity={activeDoc.customSealOpacity ?? 0.88}
                              colorFilter={activeDoc.customSealColorFilter ?? 'red'}
                            />
                          </div>
                        )}

                        {/* 2. Preset Official Vector Seal (if enabled) */}
                        {(activeDoc.sealDisplayMode === 'preset' || activeDoc.sealDisplayMode === 'both' || !activeDoc.sealDisplayMode) && (
                          <div className={`absolute ${activeDoc.sealDisplayMode === 'both' ? 'top-[-5px] left-[-15px] z-10 opacity-70' : 'top-[-15px] z-20'}`}>
                            <OfficialSeal type={activeDoc.primarySeal} size={125} />
                          </div>
                        )}

                        {/* Secondary Seal if configured */}
                        {activeDoc.secondarySeal && activeDoc.sealDisplayMode === 'preset' && (
                          <div className="absolute top-[20px] left-[-20px] z-10 opacity-80">
                            <OfficialSeal type={activeDoc.secondarySeal} size={90} />
                          </div>
                        )}

                        {/* QR Code Security Stamp */}
                        {activeDoc.showQrVerification && (
                          <div className="absolute bottom-[-15px] right-[-10px] z-30 bg-white border border-gray-400 p-1 rounded shadow-sm flex items-center gap-1">
                            <QrCode className="w-7 h-7 text-black" />
                            <div className="text-[7px] text-left leading-none font-mono text-gray-700">
                              <strong>VERIFIKASI</strong>
                              <br />HSPD-SECURE
                              <br />{activeDoc.id.slice(-6)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Signature: Issuing Officer / High Command (Only rendered if showIssuerSignature !== false) */}
                      {isIssuerVisible && (
                        <div className="flex flex-col items-center relative group/issuersig">
                          {/* Hover Quick Actions (no-print) */}
                          <div className="no-print absolute -top-7 right-0 opacity-0 group-hover/issuersig:opacity-100 transition flex items-center gap-1 bg-black/90 border border-blue-500/60 rounded px-1.5 py-0.5 shadow-lg z-30">
                            <button
                              type="button"
                              onClick={() => setActiveEditorTab('SEALS_SIGS')}
                              className="text-[9px] text-blue-300 hover:text-white flex items-center gap-0.5"
                              title="Buka tab pengaturan tanda tangan"
                            >
                              <span>✏️ Ubah Manual</span>
                            </button>
                            <span className="text-gray-600 text-[9px]">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDoc(prev => ({
                                  ...prev,
                                  issuerSignatureType: 'blank',
                                  issuerSignatureStyle: 'blank',
                                  issuerSignatureImage: undefined
                                }));
                                setSaveSuccessMsg('📄 Kolom tanda tangan penerbit dikosongkan (TTD manual basah).');
                                setTimeout(() => setSaveSuccessMsg(null), 3000);
                              }}
                              className="text-[9px] text-amber-300 hover:text-white flex items-center gap-0.5"
                              title="Kosongkan coretan TTD (siap ditandatangani pulpen basah)"
                            >
                              <span>📄 Kosongkan</span>
                            </button>
                            <span className="text-gray-600 text-[9px]">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDoc(prev => ({ ...prev, showIssuerSignature: false }));
                                setSaveSuccessMsg('Kolom tanda tangan penerbit disembunyikan.');
                                setTimeout(() => setSaveSuccessMsg(null), 3000);
                              }}
                              className="text-[9px] text-rose-300 hover:text-white flex items-center gap-0.5"
                              title="Hilangkan kolom tanda tangan penerbit"
                            >
                              <span>❌ Hilangkan</span>
                            </button>
                          </div>

                          <span className="text-[11px] font-bold text-gray-800 font-sans block mb-1">
                            {activeDoc.issuerSignatureTitle || 'Pejabat Penerbit,'}
                          </span>

                          {/* Custom Issuer Signature Display */}
                          <div className="h-16 flex items-center justify-center my-1 w-full overflow-hidden">
                            {activeDoc.issuerSignatureImage ? (
                              <img
                                src={activeDoc.issuerSignatureImage}
                                alt="Issuer Signature"
                                className="max-h-full max-w-full object-contain"
                                style={{ mixBlendMode: 'multiply' }}
                              />
                            ) : (activeDoc.issuerSignatureType === 'blank' || activeDoc.issuerSignatureStyle === 'blank') ? (
                              <div className="h-full w-full flex items-center justify-center">
                                {/* Kosongan: Area tanda tangan fisik manual penerbit */}
                              </div>
                            ) : (
                              (() => {
                                const issuerText = activeDoc.issuerSignatureName !== undefined ? activeDoc.issuerSignatureName : activeDoc.issuerName;
                                if (!issuerText) return null;
                                const style = activeDoc.issuerSignatureStyle || 'formal';
                                if (style === 'handwriting1') {
                                  return (
                                    <span 
                                      className="text-[22px] text-blue-900 rotate-[-4deg] select-none italic font-serif"
                                      style={{ fontFamily: 'Georgia, serif' }}
                                    >
                                      {issuerText}
                                    </span>
                                  );
                                }
                                if (style === 'handwriting2') {
                                  return (
                                    <span 
                                      className="text-[22px] text-indigo-950 rotate-[-2deg] select-none font-sans italic font-light tracking-wide"
                                      style={{ fontFamily: 'cursive, sans-serif' }}
                                    >
                                      {issuerText}
                                    </span>
                                  );
                                }
                                if (style === 'badge_stamp') {
                                  return (
                                    <span className="text-[13px] text-slate-800 font-mono font-bold tracking-widest uppercase border border-slate-700/60 px-2 py-0.5 rounded rotate-[2deg]">
                                      {issuerText}
                                    </span>
                                  );
                                }
                                // default formal
                                return (
                                  <span 
                                    className="text-[22px] text-blue-950 rotate-[-2deg] select-none font-serif font-bold italic"
                                    style={{ fontFamily: 'Georgia, serif' }}
                                  >
                                    {issuerText}
                                  </span>
                                );
                              })()
                            )}
                          </div>

                          <div className="border-t border-black w-40 pt-1">
                            {activeDoc.issuerSignatureName !== '' && (
                              <span className="font-bold text-[11.5px] block text-black">
                                {activeDoc.issuerSignatureName ?? activeDoc.issuerName}
                              </span>
                            )}
                            {activeDoc.issuerSignatureSubtitle !== '' && (
                              <span className="text-[9.5px] text-gray-700 font-mono block">
                                {activeDoc.issuerSignatureSubtitle ?? (activeDoc.issuerRank ? `${activeDoc.issuerRank} [${activeDoc.issuerBadge || 'ID'}]` : '')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* High Command Final Acknowledgment Strip & Signature */}
                {activeDoc.showAcknowledgedBySignature !== false && (!!activeDoc.acknowledgedByName || !!activeDoc.acknowledgedByRank) && (
                  <div className="mt-6 pt-3 border-t border-dashed border-gray-400 flex items-center justify-between text-[10px] font-mono text-gray-700">
                    <div className="flex items-center gap-2">
                      {activeDoc.acknowledgedByTitle !== '' && (
                        <span>{activeDoc.acknowledgedByTitle ?? 'Otorisasi Pusat:'} </span>
                      )}
                      {activeDoc.acknowledgedByName && (
                        <strong className="text-black">{activeDoc.acknowledgedByName}</strong>
                      )}
                      {activeDoc.acknowledgedByRank && (
                        <span>({activeDoc.acknowledgedByRank}{activeDoc.acknowledgedByRole ? ` - ${activeDoc.acknowledgedByRole}` : ''})</span>
                      )}
                      {activeDoc.acknowledgedSignatureImage ? (
                        <img
                          src={activeDoc.acknowledgedSignatureImage}
                          alt="High Command Signature"
                          className="h-7 object-contain inline-block ml-1"
                          style={{ mixBlendMode: 'multiply' }}
                        />
                      ) : (activeDoc.acknowledgedSignatureType === 'blank' || activeDoc.acknowledgedSignatureStyle === 'blank') ? (
                        <span className="inline-block w-20 border-b border-gray-500 mx-1"></span>
                      ) : activeDoc.acknowledgedByName ? (
                        <span 
                          className="font-serif italic font-bold text-blue-950 ml-1 text-xs select-none"
                          style={{ fontFamily: 'Georgia, serif' }}
                        >
                          {activeDoc.acknowledgedByName}
                        </span>
                      ) : null}
                    </div>
                    {activeDoc.acknowledgedCustomStatus !== '' && (
                      <div>
                        <span>STATUS: </span>
                        <strong className="text-emerald-800">
                          {activeDoc.acknowledgedCustomStatus ?? 'DISAHKAN & DIAKREDITASI OLEH MARKAS BESAR'}
                        </strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          SIGNATURE PAD DRAWING MODAL
         ======================================================== */}
      {activeSigPadTarget && (
        <SignaturePadModal
          isOpen={true}
          onClose={() => setActiveSigPadTarget(null)}
          title={
            activeSigPadTarget === 'issuer'
              ? `Tanda Tangan Pejabat Penerbit (${activeDoc.issuerName})`
              : activeSigPadTarget === 'recipient'
              ? `Tanda Tangan Pihak Penerima (${activeDoc.recipientName})`
              : `Tanda Tangan Pengesahan Pimpinan (${activeDoc.acknowledgedByName || 'Chief of Police'})`
          }
          currentSignature={
            activeSigPadTarget === 'issuer'
              ? activeDoc.issuerSignatureImage
              : activeSigPadTarget === 'recipient'
              ? activeDoc.recipientSignatureImage
              : activeDoc.acknowledgedSignatureImage
          }
          onSaveSignature={(dataUrl) => {
            if (activeSigPadTarget === 'issuer') {
              setActiveDoc(prev => ({ ...prev, issuerSignatureImage: dataUrl, issuerSignatureType: 'draw' }));
            } else if (activeSigPadTarget === 'recipient') {
              setActiveDoc(prev => ({ ...prev, recipientSignatureImage: dataUrl, recipientSignatureType: 'draw' }));
            } else if (activeSigPadTarget === 'acknowledged') {
              setActiveDoc(prev => ({ ...prev, acknowledgedSignatureImage: dataUrl, acknowledgedSignatureType: 'draw' }));
            }
            setSaveSuccessMsg('Tanda tangan digital berhasil diterapkan ke lembar dokumen!');
            setTimeout(() => setSaveSuccessMsg(null), 3000);
          }}
        />
      )}

      {/* ========================================================
          ARCHIVE MANAGEMENT DRAWER / MODAL
         ======================================================== */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#11141A] border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono animate-fadeIn">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#0D1117]">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-gray-100">
                    ARSIP SURAT & DOKUMEN RESMI KEPOLISIAN ({savedDocs.length})
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Pilih dokumen yang pernah dibuat untuk diedit, digandakan, atau dicetak ulang
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsArchiveModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-gray-800"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-gray-800 bg-[#161B22]">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  placeholder="Cari berdasarkan nomor surat, judul, perihal, nama penerima, atau pembuat..."
                  className="w-full pl-9 pr-3 py-2 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-100 outline-none"
                />
              </div>
            </div>

            {/* Archive Items List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {filteredArchive.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs">
                  Tidak ada dokumen yang sesuai pencarian.
                </div>
              ) : (
                filteredArchive.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleLoadFromArchive(doc)}
                    className="p-3.5 bg-[#0D1117] border border-gray-800 hover:border-blue-500 rounded-xl transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-700 text-blue-300 text-[10px] font-bold">
                          {doc.category}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {doc.docNumber}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-black/60 rounded text-gray-400 border border-gray-800">
                          {doc.date}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-100 group-hover:text-blue-300 transition">
                        {doc.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 line-clamp-1">
                        Perihal: {doc.subject} • Penerima: <strong className="text-gray-300">{doc.recipientName}</strong>
                      </p>
                      <div className="text-[10px] text-gray-500">
                        Diterbitkan oleh: {doc.issuerName} ({doc.issuerBadge}) • {doc.clauses.length} Poin
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLoadFromArchive(doc)}
                        className="px-2.5 py-1.5 bg-blue-600/30 hover:bg-blue-600 border border-blue-500/50 text-blue-200 hover:text-white rounded-lg text-xs flex items-center gap-1 font-bold transition active:scale-95"
                        title="Buka dan muat dokumen ini ke editor"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Buka / Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateDoc(doc);
                        }}
                        className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs flex items-center gap-1 font-bold transition active:scale-95"
                        title="Gandakan sebagai dokumen baru"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Gandakan</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteDoc(doc.id, e)}
                        className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-white rounded-lg text-xs flex items-center gap-1 font-bold transition active:scale-95"
                        title="Hapus berkas ini dari arsip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-gray-800 bg-[#0D1117] flex justify-end">
              <button
                onClick={() => setIsArchiveModalOpen(false)}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OTORISASI PUSAT & FITUR PEMERINTAH (WEBHOOK, PENGESAHAN, STATUS) */}
      <GovernmentCentralAuthModal
        isOpen={isGovCentralAuthModalOpen}
        onClose={() => setIsGovCentralAuthModalOpen(false)}
        currentOfficer={currentOfficer}
        activeDoc={activeDoc}
        onUpdateDoc={setActiveDoc}
        onNavigateToExecutiveHub={() => {
          setIsGovCentralAuthModalOpen(false);
          window.dispatchEvent(new CustomEvent('switch-to-government-hub'));
        }}
      />
    </div>
  );
};
