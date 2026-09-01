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
  Hash
} from 'lucide-react';
import { 
  OfficialDocument, 
  DocumentCategory, 
  DocumentClassification, 
  SealType, 
  OfficerProfile 
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
  sendOfficialDocumentToDiscord 
} from '../utils/discordWebhook';
import { HSPD_LOGO_URL, HSPD_LOGO_FALLBACK, getActiveLogoUrl } from '../assets/logo';

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
    window.addEventListener('hspd-documents-updated', handleDocsSync);
    return () => window.removeEventListener('hspd-documents-updated', handleDocsSync);
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
    const docConfig = getSavedDocumentWebhookConfig();
    const targetWebhookUrl = docConfig.webhookUrl || 
      webhookConfig?.webhookUrl || 
      (webhookConfig as any)?.url || 
      localStorage.getItem('hspd_discord_webhook_url') || 
      localStorage.getItem('hspd_roster_webhook_url');

    if (!targetWebhookUrl) {
      alert('⚠️ Discord Webhook Arsip Dokumen belum dikonfigurasi. Silakan atur URL Webhook di menu 👑 WEBHOOK (Header Bar) pada Tab 13. Dokumen terlebih dahulu.');
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
                  <div className="bg-[#161B22] border border-gray-800 rounded-lg p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-200">
                      <span className="flex items-center gap-1.5 text-blue-300">
                        <Shield className="w-3.5 h-3.5" />
                        1. Tanda Tangan Penerbit ({activeDoc.issuerName})
                      </span>
                      {activeDoc.issuerSignatureImage && (
                        <button
                          onClick={() => setActiveDoc(prev => ({ ...prev, issuerSignatureImage: undefined, issuerSignatureType: 'font' }))}
                          className="text-rose-400 hover:text-rose-300 text-[10px] underline"
                        >
                          Reset ke Font
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-gray-400 text-[9px] mb-0.5">LABEL TTD:</label>
                        <input
                          type="text"
                          value={activeDoc.issuerSignatureTitle}
                          onChange={(e) => setActiveDoc(prev => ({ ...prev, issuerSignatureTitle: e.target.value }))}
                          className="w-full bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-100 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 text-[9px] mb-0.5">METODE TTD:</label>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setActiveSigPadTarget('issuer')}
                            className="flex-1 px-1.5 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1"
                            title="Tanda tangan langsung dengan jari atau stylus di layar"
                          >
                            <PenTool className="w-3 h-3" />
                            <span>Gambar</span>
                          </button>
                          
                          <input
                            type="file"
                            ref={issuerSigUploadRef}
                            accept="image/*"
                            onChange={(e) => handleUploadImageFile(e, (url) => setActiveDoc(prev => ({ ...prev, issuerSignatureImage: url, issuerSignatureType: 'upload' })))}
                            className="hidden"
                          />
                          <button
                            onClick={() => issuerSigUploadRef.current?.click()}
                            className="flex-1 px-1.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-[10px] font-bold flex items-center justify-center gap-1 border border-gray-600"
                            title="Upload foto tanda tangan dari galeri HP / PC"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {activeDoc.issuerSignatureImage ? (
                      <div className="h-10 bg-white/10 rounded flex items-center justify-center p-1 border border-gray-700">
                        <img
                          src={activeDoc.issuerSignatureImage}
                          alt="Issuer Signature Preview"
                          className="max-h-full max-w-full object-contain"
                          style={{ mixBlendMode: 'multiply' }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">Gaya Cursive:</span>
                        <select
                          value={activeDoc.issuerSignatureStyle}
                          onChange={(e) => setActiveDoc(prev => ({ ...prev, issuerSignatureStyle: e.target.value as any }))}
                          className="bg-[#0D1117] border border-gray-700 rounded px-2 py-0.5 text-gray-200 text-[10px]"
                        >
                          <option value="formal">Gaya Formal Legal (Georgia Serif)</option>
                          <option value="handwriting1">Kaligrafi Cursive Miring</option>
                          <option value="handwriting2">Executive Autograph Script</option>
                          <option value="badge_stamp">Badge Monogram Signature</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* 2. Recipient Signature */}
                  <div className={`bg-[#161B22] border rounded-lg p-2.5 space-y-2 transition ${activeDoc.showRecipientSignature === false ? 'border-gray-800/60 opacity-80' : 'border-gray-800'}`}>
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-200">
                      <span className="flex items-center gap-1.5 text-emerald-300">
                        <User className="w-3.5 h-3.5" />
                        2. Tanda Tangan Penerima / Subjek ({activeDoc.recipientName})
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

                        {/* Reset TTD atau Kosongkan */}
                        {(activeDoc.recipientSignatureImage || activeDoc.recipientSignatureName || activeDoc.recipientSignatureTitle) && (
                          <button
                            type="button"
                            onClick={() => setActiveDoc(prev => ({
                              ...prev,
                              recipientSignatureImage: undefined,
                              recipientSignatureType: 'font',
                              recipientSignatureName: undefined,
                              recipientSignatureTitle: undefined
                            }))}
                            className="text-rose-400 hover:text-rose-300 text-[10px] underline flex items-center gap-0.5"
                            title="Hapus gambar atau teks tanda tangan penerima"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus TTD</span>
                          </button>
                        )}
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
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-gray-400 text-[9px] mb-0.5">LABEL TTD:</label>
                            <input
                              type="text"
                              value={activeDoc.recipientSignatureTitle || ''}
                              onChange={(e) => setActiveDoc(prev => ({ ...prev, recipientSignatureTitle: e.target.value }))}
                              className="w-full bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-100 text-xs"
                              placeholder="Pihak Penerima / Pemohon,"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-400 text-[9px] mb-0.5">METODE TTD:</label>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setActiveSigPadTarget('recipient')}
                                className="flex-1 px-1.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1"
                              >
                                <PenTool className="w-3 h-3" />
                                <span>Gambar</span>
                              </button>
                              
                              <input
                                type="file"
                                ref={recipientSigUploadRef}
                                accept="image/*"
                                onChange={(e) => handleUploadImageFile(e, (url) => setActiveDoc(prev => ({ ...prev, recipientSignatureImage: url, recipientSignatureType: 'upload' })))}
                                className="hidden"
                              />
                              <button
                                onClick={() => recipientSigUploadRef.current?.click()}
                                className="flex-1 px-1.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-[10px] font-bold flex items-center justify-center gap-1 border border-gray-600"
                              >
                                <Upload className="w-3 h-3" />
                                <span>Upload</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {activeDoc.recipientSignatureImage && (
                          <div className="h-10 bg-white/10 rounded flex items-center justify-center p-1 border border-gray-700 relative group">
                            <img
                              src={activeDoc.recipientSignatureImage}
                              alt="Recipient Signature Preview"
                              className="max-h-full max-w-full object-contain"
                              style={{ mixBlendMode: 'multiply' }}
                            />
                            <button
                              type="button"
                              onClick={() => setActiveDoc(prev => ({ ...prev, recipientSignatureImage: undefined, recipientSignatureType: 'font' }))}
                              className="absolute top-1 right-1 p-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded border border-rose-700/60 opacity-0 group-hover:opacity-100 transition text-[9px]"
                              title="Hapus gambar TTD ini"
                            >
                              Hapus
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* 3. High Command Acknowledgment Signature */}
                  <div className="bg-[#161B22] border border-gray-800 rounded-lg p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-200">
                      <span className="flex items-center gap-1.5 text-amber-300">
                        <Lock className="w-3.5 h-3.5" />
                        3. Pengesahan Pimpinan / Chief of Police
                      </span>
                      {activeDoc.acknowledgedSignatureImage && (
                        <button
                          onClick={() => setActiveDoc(prev => ({ ...prev, acknowledgedSignatureImage: undefined, acknowledgedSignatureType: 'font' }))}
                          className="text-rose-400 hover:text-rose-300 text-[10px] underline"
                        >
                          Reset ke Font
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-gray-400 text-[9px] mb-0.5">NAMA CHIEF / PIMPINAN:</label>
                        <input
                          type="text"
                          value={activeDoc.acknowledgedByName || ''}
                          onChange={(e) => setActiveDoc(prev => ({ ...prev, acknowledgedByName: e.target.value }))}
                          className="w-full bg-[#0D1117] border border-gray-700 rounded px-2 py-1 text-gray-100 text-xs"
                          placeholder="Leoarnd Neave"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 text-[9px] mb-0.5">METODE TTD:</label>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setActiveSigPadTarget('acknowledged')}
                            className="flex-1 px-1.5 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1"
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
                            onClick={() => acknowledgedSigUploadRef.current?.click()}
                            className="flex-1 px-1.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-[10px] font-bold flex items-center justify-center gap-1 border border-gray-600"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {activeDoc.acknowledgedSignatureImage && (
                      <div className="h-10 bg-white/10 rounded flex items-center justify-center p-1 border border-gray-700">
                        <img
                          src={activeDoc.acknowledgedSignatureImage}
                          alt="Acknowledged Signature Preview"
                          className="max-h-full max-w-full object-contain"
                          style={{ mixBlendMode: 'multiply' }}
                        />
                      </div>
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

                {/* Signature Block (3 Columns if recipient signature is enabled, or 2 Columns if hidden) */}
                <div className={`gap-4 text-center items-end relative ${activeDoc.showRecipientSignature !== false ? 'grid grid-cols-3' : 'grid grid-cols-2 max-w-xl ml-auto'}`}>
                  
                  {/* Left Signature: Recipient / Pihak Kedua (Only rendered if showRecipientSignature !== false) */}
                  {activeDoc.showRecipientSignature !== false && (
                    <div className="flex flex-col items-center">
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
                        ) : (
                          <span 
                            className="text-[20px] text-blue-900 rotate-[-4deg] select-none italic font-serif"
                            style={{ fontFamily: 'Georgia, serif' }}
                          >
                            {activeDoc.recipientSignatureName || activeDoc.recipientName}
                          </span>
                        )}
                      </div>

                      <div className="border-t border-black w-36 pt-1">
                        <span className="font-bold text-[11.5px] block text-black">
                          {activeDoc.recipientSignatureName || activeDoc.recipientName}
                        </span>
                        <span className="text-[9.5px] text-gray-600 font-mono block">
                          {activeDoc.recipientId ? `ID: ${activeDoc.recipientId}` : 'Pihak Terkait'}
                        </span>
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

                  {/* Right Signature: Issuing Officer / High Command */}
                  <div className="flex flex-col items-center">
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
                      ) : (
                        <span 
                          className="text-[22px] text-blue-950 rotate-[-2deg] select-none font-serif font-bold italic"
                          style={{ fontFamily: 'Georgia, serif' }}
                        >
                          {activeDoc.issuerName}
                        </span>
                      )}
                    </div>

                    <div className="border-t border-black w-40 pt-1">
                      <span className="font-bold text-[11.5px] block text-black">
                        {activeDoc.issuerName}
                      </span>
                      <span className="text-[9.5px] text-gray-700 font-mono block">
                        {activeDoc.issuerRank} [{activeDoc.issuerBadge}]
                      </span>
                    </div>
                  </div>
                </div>

                {/* High Command Final Acknowledgment Strip & Signature */}
                {activeDoc.acknowledgedByName && (
                  <div className="mt-6 pt-3 border-t border-dashed border-gray-400 flex items-center justify-between text-[10px] font-mono text-gray-700">
                    <div className="flex items-center gap-2">
                      <span>Otorisasi Pusat: </span>
                      <strong className="text-black">{activeDoc.acknowledgedByName}</strong> ({activeDoc.acknowledgedByRank || 'CHIEF OF POLICE'})
                      {activeDoc.acknowledgedSignatureImage && (
                        <img
                          src={activeDoc.acknowledgedSignatureImage}
                          alt="High Command Signature"
                          className="h-7 object-contain inline-block ml-1"
                          style={{ mixBlendMode: 'multiply' }}
                        />
                      )}
                    </div>
                    <div>
                      <span>STATUS: </span>
                      <strong className="text-emerald-800">DISAHKAN & DIAKREDITASI OLEH MARKAS BESAR</strong>
                    </div>
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
    </div>
  );
};
