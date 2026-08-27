import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  RefreshCw,
  RotateCcw,
  Check,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Shield,
  Layers,
  FileText,
  Sliders,
  Eye,
  FolderOpen,
  HelpCircle,
  Radio
} from 'lucide-react';
import {
  DepartmentBrandingConfig,
  getCustomBranding,
  saveCustomBranding,
  resetCustomBranding,
  PRESET_LOGOS,
  DEFAULT_BRANDING,
  PresetLogoItem
} from '../utils/brandingStorage';
import { processAndCompressImage } from '../utils/imageCompressor';
import { syncCollectionWithFirestore } from '../services/firebaseRealtimeSync';
import { OfficerProfile, isOfficerHighRank } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentOfficer?: OfficerProfile | null;
  onBrandingUpdated?: (config: DepartmentBrandingConfig) => void;
}

export const CustomBrandingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentOfficer,
  onBrandingUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets' | 'texts'>('upload');
  
  // Current Form State
  const [branding, setBranding] = useState<DepartmentBrandingConfig>(getCustomBranding());
  const [logoPreview, setLogoPreview] = useState<string>(branding.logoUrl);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  
  // File Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; sizeKb: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status Alerts
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load fresh branding when modal opens
  useEffect(() => {
    if (isOpen) {
      const current = getCustomBranding();
      setBranding(current);
      setLogoPreview(current.logoUrl);
      setUrlInput(current.logoUrl.startsWith('data:') ? '' : current.logoUrl);
      setSaveSuccess(false);
      setSaveMessage('');
      setFileDetails(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. PROCESS LOCAL IMAGE FILE FROM DEVICE FOLDER
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (.png, .jpg, .jpeg, .webp, .svg)');
      return;
    }

    setIsProcessingImage(true);
    try {
      // Compress to optimal high-res icon size (max 800x800 for crystal-clear retina badges)
      const result = await processAndCompressImage(file, 800, 800, 0.90);
      setLogoPreview(result.dataUrl);
      setBranding(prev => ({ ...prev, logoUrl: result.dataUrl }));
      setFileDetails({
        name: file.name,
        sizeKb: result.sizeKb
      });
      setUrlError('');
    } catch (err: any) {
      alert(`Gagal memproses file: ${err?.message || 'Format gambar tidak didukung'}`);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // 2. LOAD DIRECT IMAGE URL
  const handleLoadUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError('Masukkan tautan URL gambar terlebih dahulu.');
      return;
    }

    // Test image loading
    const testImg = new Image();
    testImg.onload = () => {
      setLogoPreview(trimmed);
      setBranding(prev => ({ ...prev, logoUrl: trimmed }));
      setUrlError('');
      setFileDetails({ name: 'Web Image URL', sizeKb: 0 });
    };
    testImg.onerror = () => {
      setUrlError('Gagal memuat URL gambar. Pastikan tautan langsung ke file gambar (berakhiran .png, .jpg, dll) dan dapat diakses publik.');
    };
    testImg.src = trimmed;
  };

  // 3. APPLY PRESET BADGE
  const handleSelectPreset = (preset: PresetLogoItem) => {
    setLogoPreview(preset.url);
    setBranding(prev => ({
      ...prev,
      logoUrl: preset.url,
      departmentCode: preset.suggestedCode || prev.departmentCode,
      departmentName: preset.suggestedName || prev.departmentName,
      agencyJurisdiction: preset.suggestedJurisdiction || prev.agencyJurisdiction
    }));
    setUrlInput(preset.url);
    setFileDetails({ name: preset.name, sizeKb: 0 });
    setUrlError('');
  };

  // 4. SAVE AND APPLY BRANDING TO ENTIRE APPLICATION
  const handleSaveAndApply = async () => {
    const officerName = currentOfficer ? `${currentOfficer.rank} ${currentOfficer.name}` : 'Petugas Kepolisian';
    const updated = saveCustomBranding(
      {
        ...branding,
        logoUrl: logoPreview
      },
      officerName
    );

    if (onBrandingUpdated) {
      onBrandingUpdated(updated);
    }

    // Sync to Firestore Realtime Database
    try {
      await syncCollectionWithFirestore('BRANDING' as any, [updated]);
    } catch (e) {}

    setSaveSuccess(true);
    setSaveMessage('Logo & Identitas Website Berhasil Diperbarui Secara Real-time!');
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  // 5. RESTORE DEFAULT HSPD LOGO
  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan logo dan nama departemen ke pengaturan awal resmi HSPD?')) {
      const def = resetCustomBranding();
      setBranding(def);
      setLogoPreview(def.logoUrl);
      setUrlInput('');
      setFileDetails(null);
      if (onBrandingUpdated) {
        onBrandingUpdated(def);
      }
      setSaveSuccess(true);
      setSaveMessage('Logo telah dikembalikan ke Lambang Resmi HSPD!');
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono text-xs animate-in fade-in duration-200">
      <div 
        className="bg-[#12161F] border border-gray-700 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-gray-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-[#161B22] via-[#1C2330] to-[#161B22] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-100 uppercase tracking-wide">
                  KUSTOMISASI LOGO WEBSITE & IDENTITAS KEPOLISIAN
                </h2>
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded font-bold">
                  BRANDING STUDIO
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans">
                Unggah logo dari folder komputer/HP, gunakan tautan web, atau pilih preset lambang kepolisian resmi.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split into Controls & Live Preview */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Controls & Input Methods (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Nav Tabs */}
            <div className="flex border-b border-gray-800 bg-[#0B0E14] p-1 rounded-lg gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 px-2.5 rounded-md font-bold text-center transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Upload Folder</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`flex-1 py-2 px-2.5 rounded-md font-bold text-center transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'url'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>URL Web</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`flex-1 py-2 px-2.5 rounded-md font-bold text-center transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'presets'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Preset Lambang</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('texts')}
                className={`flex-1 py-2 px-2.5 rounded-md font-bold text-center transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'texts'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Teks Header</span>
              </button>
            </div>

            {/* TAB 1: UPLOAD DARI FOLDER DEVICE */}
            {activeTab === 'upload' && (
              <div className="space-y-3">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-amber-400 bg-amber-500/10 scale-[0.99]'
                      : 'border-gray-700 hover:border-amber-500/70 bg-[#0F131A] hover:bg-[#141922]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
                    <Upload className={`w-7 h-7 ${isProcessingImage ? 'animate-bounce' : ''}`} />
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-gray-100 font-sans">
                      Klik untuk Memilih File Gambar dari Folder Device
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 font-sans">
                      atau drag & drop file logo langsung ke area kotak ini
                    </p>
                    <span className="inline-block mt-2 text-[10px] text-amber-400/80 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
                      Mendukung PNG transparan, JPG, JPEG, WEBP, SVG (Rekomendasi rasio 1:1)
                    </span>
                  </div>

                  {isProcessingImage && (
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sedang memproses & mengoptimasi gambar...</span>
                    </div>
                  )}
                </div>

                {fileDetails && (
                  <div className="p-3 bg-[#0B0E14] border border-emerald-900/60 rounded-lg flex items-center justify-between text-emerald-400">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="font-bold truncate text-gray-200">{fileDetails.name}</span>
                    </div>
                    {fileDetails.sizeKb > 0 && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 shrink-0 font-mono">
                        {fileDetails.sizeKb} KB
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MASUKKAN URL GAMBAR LANGSUNG */}
            {activeTab === 'url' && (
              <div className="space-y-4 p-4 bg-[#0F131A] border border-gray-800 rounded-xl">
                <div>
                  <label className="block text-gray-300 font-bold mb-1.5">
                    Tautan / Link URL Gambar Langsung (Direct Image URL):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      placeholder="https://i.imgur.com/example.png atau https://cdn.discordapp.com/..."
                      className="flex-1 px-3 py-2 bg-[#0A0D12] border border-gray-700 rounded-lg focus:border-amber-500 focus:outline-none text-xs text-gray-100 placeholder:text-gray-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleLoadUrl}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition shrink-0 flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Muat & Cek</span>
                    </button>
                  </div>
                  {urlError && (
                    <div className="flex items-center gap-1.5 text-red-400 mt-2 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{urlError}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-500 mt-2 font-sans">
                    💡 Tips: Anda dapat mengunggah gambar ke platform hosting publik seperti Imgur, PostImages, atau mengambil link avatar Discord.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: PRESET LAMBANG KEPOLISIAN */}
            {activeTab === 'presets' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {PRESET_LOGOS.map((preset) => {
                    const isSelected = logoPreview === preset.url;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 relative ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-gray-100 shadow-md'
                            : 'bg-[#0F131A] border-gray-800 hover:border-gray-700 hover:bg-[#141922] text-gray-300'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-black/60 border border-gray-700 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                          <img
                            src={preset.url}
                            alt={preset.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain rounded-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs truncate text-gray-100 font-sans">
                              {preset.name}
                            </span>
                            <span className="text-[9px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono">
                              {preset.suggestedCode}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2 font-sans">
                            {preset.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: EDIT TEKS NAMA DEPARTEMEN & SLOGAN */}
            {activeTab === 'texts' && (
              <div className="space-y-3 p-4 bg-[#0F131A] border border-gray-800 rounded-xl">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1 text-[11px]">
                      Kode Departemen (Singkatan):
                    </label>
                    <input
                      type="text"
                      value={branding.departmentCode}
                      onChange={e => setBranding(prev => ({ ...prev, departmentCode: e.target.value.toUpperCase() }))}
                      placeholder="Contoh: HSPD, LSPD, BCSO"
                      className="w-full px-3 py-2 bg-[#0A0D12] border border-gray-700 rounded-lg focus:border-amber-500 focus:outline-none text-xs text-amber-300 font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-bold mb-1 text-[11px]">
                      Badge Header Label:
                    </label>
                    <input
                      type="text"
                      value={branding.cadBadgeText}
                      onChange={e => setBranding(prev => ({ ...prev, cadBadgeText: e.target.value.toUpperCase() }))}
                      placeholder="Contoh: MDC-CAD, CAD-POLICE"
                      className="w-full px-3 py-2 bg-[#0A0D12] border border-gray-700 rounded-lg focus:border-amber-500 focus:outline-none text-xs text-gray-200 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-1 text-[11px]">
                    Nama Lengkap Departemen / Kepolisian:
                  </label>
                  <input
                    type="text"
                    value={branding.departmentName}
                    onChange={e => setBranding(prev => ({ ...prev, departmentName: e.target.value.toUpperCase() }))}
                    placeholder="Contoh: HIGH STATE POLICE DEPT / LOS SANTOS POLICE DEPT"
                    className="w-full px-3 py-2 bg-[#0A0D12] border border-gray-700 rounded-lg focus:border-amber-500 focus:outline-none text-xs text-gray-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-1 text-[11px]">
                    Sub-Judul / Slogan Header:
                  </label>
                  <input
                    type="text"
                    value={branding.subTitle}
                    onChange={e => setBranding(prev => ({ ...prev, subTitle: e.target.value.toUpperCase() }))}
                    placeholder="Contoh: INSPECTOR, MDT-CAD PORTAL, CENTRAL DISPATCH"
                    className="w-full px-3 py-2 bg-[#0A0D12] border border-gray-700 rounded-lg focus:border-amber-500 focus:outline-none text-xs text-gray-200 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 font-bold mb-1 text-[11px]">
                      Wilayah Hukum (Jurisdiction):
                    </label>
                    <input
                      type="text"
                      value={branding.agencyJurisdiction}
                      onChange={e => setBranding(prev => ({ ...prev, agencyJurisdiction: e.target.value.toUpperCase() }))}
                      placeholder="STATE OF HIGH STATE POLICE DEPARTMENT"
                      className="w-full px-3 py-2 bg-[#0A0D12] border border-gray-700 rounded-lg focus:border-amber-500 focus:outline-none text-xs text-gray-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-bold mb-1 text-[11px]">
                      Frekuensi Radio Utama:
                    </label>
                    <input
                      type="text"
                      value={branding.radioFreq}
                      onChange={e => setBranding(prev => ({ ...prev, radioFreq: e.target.value }))}
                      placeholder="1111"
                      className="w-full px-3 py-2 bg-[#0A0D12] border border-gray-700 rounded-lg focus:border-amber-500 focus:outline-none text-xs text-emerald-400 font-bold font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: LIVE REALTIME PREVIEW MOCKUPS (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 bg-[#0A0D12] border border-gray-800 rounded-xl space-y-4 shadow-inner">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="font-bold text-gray-300 flex items-center gap-1.5 text-xs">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>PREVIEW REAL-TIME TAMPILAN</span>
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                  LIVE
                </span>
              </div>

              {/* 1. HEADER PREVIEW */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Tampilan Header Navbar:
                </span>
                <div className="bg-[#161B22] border border-gray-800 rounded-lg p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-contain border border-amber-500/40 bg-black/60 p-0.5 drop-shadow-md"
                      onError={e => {
                        (e.target as HTMLImageElement).src = DEFAULT_BRANDING.logoUrl;
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-1.5 leading-none">
                        <span className="font-bold text-gray-100 text-xs tracking-tight">
                          {branding.departmentCode} <span className="text-amber-400">{branding.subTitle}</span>
                        </span>
                        <span className="text-[8px] text-amber-300 font-mono bg-amber-950/60 px-1 py-0.5 rounded border border-amber-800/60 font-bold">
                          {branding.cadBadgeText}
                        </span>
                      </div>
                      <div className="text-[8px] text-gray-400 font-mono mt-0.5">
                        {branding.agencyJurisdiction}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] text-emerald-400 font-mono font-bold">
                    FREQ: {branding.radioFreq}
                  </span>
                </div>
              </div>

              {/* 2. LOGIN PORTAL BADGE PREVIEW */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Tampilan Logo Portal Login & Dokumen:
                </span>
                <div className="bg-[#10141D] border border-gray-800 rounded-lg p-4 flex flex-col items-center text-center relative overflow-hidden">
                  <div className="w-16 h-16 rounded-full bg-black/70 border-2 border-amber-500/60 p-1 shadow-lg shadow-amber-500/20 flex items-center justify-center mb-2">
                    <img
                      src={logoPreview}
                      alt="Logo Seal Large"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <h4 className="font-bold text-gray-100 text-xs font-sans tracking-wide">
                    {branding.departmentName}
                  </h4>
                  <p className="text-[9px] text-amber-400/90 font-mono mt-0.5">
                    {branding.agencyJurisdiction}
                  </p>
                </div>
              </div>

              {/* Reset to Default Button */}
              <button
                type="button"
                onClick={handleResetToDefault}
                className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-amber-300 border border-gray-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                title="Kembalikan ke lambang resmi default HSPD"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kembalikan Logo & Nama Default HSPD</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 bg-[#161B22] border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-gray-400 text-[11px] font-sans flex items-center gap-1.5">
            {saveSuccess ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveMessage}</span>
              </span>
            ) : (
              <span>Logo akan langsung tersimpan di browser & disinkronkan ke seluruh aplikasi.</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-lg transition"
            >
              Batal
            </button>
            <button
              id="btn-save-branding-changes"
              type="button"
              onClick={handleSaveAndApply}
              className="flex-1 sm:flex-initial px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-lg shadow-lg shadow-amber-950/50 transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan & Terapkan Logo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
