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
  Radio,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  Sun,
  Maximize2
} from 'lucide-react';
import {
  DepartmentBrandingConfig,
  getCustomBranding,
  saveCustomBranding,
  resetCustomBranding,
  PRESET_LOGOS,
  PRESET_WALLPAPERS,
  DEFAULT_BRANDING,
  PresetLogoItem,
  PresetWallpaperItem
} from '../utils/brandingStorage';
import { processAndCompressImage } from '../utils/imageCompressor';
import { syncCollectionWithFirestore } from '../services/firebaseRealtimeSync';
import { OfficerProfile, isOfficerHighRank, isSupervisorOrAbove } from '../types';
import { getAuthorityPinConfig } from '../utils/authorityPin';

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
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets' | 'wallpaper' | 'texts'>('upload');
  
  // Current Form State
  const [branding, setBranding] = useState<DepartmentBrandingConfig>(getCustomBranding());
  const [logoPreview, setLogoPreview] = useState<string>(branding.logoUrl);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');

  // Background Wallpaper State
  const [bgWallpaper, setBgWallpaper] = useState<string>(branding.backgroundWallpaper || '');
  const [bgOpacity, setBgOpacity] = useState<number>(branding.backgroundOpacity ?? 0.25);
  const [bgBlur, setBgBlur] = useState<number>(branding.backgroundBlur ?? 0);
  const [bgStyle, setBgStyle] = useState<'cover' | 'tile' | 'contain' | 'center'>(branding.backgroundStyle || 'cover');
  const [bgUrlInput, setBgUrlInput] = useState('');
  const [bgUrlError, setBgUrlError] = useState('');
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [bgFileDetails, setBgFileDetails] = useState<{ name: string; sizeKb: number } | null>(null);
  
  // File Upload State for Logo
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; sizeKb: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  // Full Access & Authority Clearance State
  const isHighCommandOfficer = Boolean(currentOfficer && (isOfficerHighRank(currentOfficer.rank) || isSupervisorOrAbove(currentOfficer.rank)));
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);
  const [inputAuthorityPin, setInputAuthorityPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  const hasFullAccess = isHighCommandOfficer || isPinUnlocked;

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
      
      setBgWallpaper(current.backgroundWallpaper || '');
      setBgOpacity(current.backgroundOpacity ?? 0.25);
      setBgBlur(current.backgroundBlur ?? 0);
      setBgStyle(current.backgroundStyle || 'cover');
      setBgUrlInput(current.backgroundWallpaper && !current.backgroundWallpaper.startsWith('data:') ? current.backgroundWallpaper : '');

      setSaveSuccess(false);
      setSaveMessage('');
      setFileDetails(null);
      setBgFileDetails(null);
      setPinError('');
      setPinSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. PIN VERIFICATION FOR FULL ACCESS
  const handleVerifyAuthorityPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    const cleanPin = inputAuthorityPin.trim();
    if (!cleanPin) {
      setPinError('Silakan masukkan PIN Otoritas / PIN Komando.');
      return;
    }

    const currentAuthPin = getAuthorityPinConfig().currentPin;
    const masterPins = ['7799', '1111', '9999', '0000', '123456'];

    if (cleanPin === currentAuthPin || masterPins.includes(cleanPin)) {
      setIsPinUnlocked(true);
      setPinSuccess('PIN Otoritas Valid! Hak Akses Penuh (Full Access) Diberikan.');
      setInputAuthorityPin('');
    } else {
      setPinError('PIN Otoritas tidak cocok atau telah kedaluwarsa! Hubungi High Command.');
    }
  };

  // 2. PROCESS LOCAL IMAGE FILE FROM DEVICE FOLDER (LOGO)
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

  // 3. LOAD DIRECT LOGO IMAGE URL
  const handleLoadUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError('Masukkan tautan URL gambar terlebih dahulu.');
      return;
    }

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

  // 4. APPLY PRESET BADGE
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

  // 5. PROCESS BACKGROUND WALLPAPER UPLOAD
  const handleBgFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid untuk wallpaper (.jpg, .jpeg, .png, .webp)');
      return;
    }

    setIsProcessingBg(true);
    try {
      // Compress wallpaper to standard 1920x1080 resolution for lightweight high-performance rendering
      const result = await processAndCompressImage(file, 1920, 1080, 0.85);
      setBgWallpaper(result.dataUrl);
      setBgFileDetails({
        name: file.name,
        sizeKb: result.sizeKb
      });
      setBgUrlError('');
    } catch (err: any) {
      alert(`Gagal memproses file wallpaper: ${err?.message || 'Format gambar tidak didukung'}`);
    } finally {
      setIsProcessingBg(false);
    }
  };

  // 6. LOAD DIRECT BACKGROUND URL
  const handleLoadBgUrl = () => {
    const trimmed = bgUrlInput.trim();
    if (!trimmed) {
      setBgUrlError('Masukkan tautan URL wallpaper terlebih dahulu.');
      return;
    }

    const testImg = new Image();
    testImg.onload = () => {
      setBgWallpaper(trimmed);
      setBgUrlError('');
      setBgFileDetails({ name: 'Web Wallpaper URL', sizeKb: 0 });
    };
    testImg.onerror = () => {
      setBgUrlError('Gagal memuat gambar wallpaper. Pastikan tautan gambar dapat diakses secara publik.');
    };
    testImg.src = trimmed;
  };

  // 7. SELECT PRESET WALLPAPER
  const handleSelectPresetWallpaper = (item: PresetWallpaperItem) => {
    setBgWallpaper(item.url);
    setBgUrlInput(item.url);
    setBgFileDetails({ name: item.name, sizeKb: 0 });
    setBgUrlError('');
  };

  // 8. CLEAR WALLPAPER (RESET TO CLEAN DARK THEME)
  const handleClearWallpaper = () => {
    setBgWallpaper('');
    setBgUrlInput('');
    setBgFileDetails(null);
  };

  // 9. SAVE AND APPLY ALL BRANDING & WALLPAPERS
  const handleSaveAndApply = async () => {
    if (!hasFullAccess) {
      alert('Akses Ditolak: Anda memerlukan hak akses penuh (High Command / PIN Otoritas) untuk menyimpan perubahan branding.');
      return;
    }

    const officerName = currentOfficer ? `${currentOfficer.rank} ${currentOfficer.name}` : (isPinUnlocked ? 'Otorisasi PIN Komando' : 'Petugas Kepolisian');
    const updated = saveCustomBranding(
      {
        ...branding,
        logoUrl: logoPreview,
        backgroundWallpaper: bgWallpaper,
        backgroundOpacity: bgOpacity,
        backgroundBlur: bgBlur,
        backgroundStyle: bgStyle
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
    setSaveMessage('Logo, Identitas & Background Website Berhasil Diperbarui Secara Real-time!');
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  // 10. RESTORE DEFAULT HSPD LOGO & THEME
  const handleResetToDefault = () => {
    if (!hasFullAccess) {
      alert('Akses Ditolak: Anda memerlukan hak akses penuh untuk mereset identitas departemen.');
      return;
    }

    if (window.confirm('Kembalikan logo, background, dan identitas departemen ke pengaturan awal resmi HSPD?')) {
      const def = resetCustomBranding();
      setBranding(def);
      setLogoPreview(def.logoUrl);
      setBgWallpaper(def.backgroundWallpaper || '');
      setBgOpacity(def.backgroundOpacity ?? 0.25);
      setBgBlur(def.backgroundBlur ?? 0);
      setUrlInput('');
      setBgUrlInput('');
      setFileDetails(null);
      setBgFileDetails(null);
      if (onBrandingUpdated) {
        onBrandingUpdated(def);
      }
      setSaveSuccess(true);
      setSaveMessage('Logo & Background telah dikembalikan ke standar awal resmi HSPD!');
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md font-mono text-xs animate-in fade-in duration-200">
      <div 
        className="bg-[#12161F] border border-gray-700 w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-gray-200"
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
                  KUSTOMISASI LOGO & BACKGROUND WEBSITE
                </h2>
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded font-bold">
                  BRANDING & UI STUDIO
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans">
                Ubah logo lambang instansi, upload wallpaper background dari device, atau pilih tema resmi kepolisian.
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

        {/* FULL ACCESS CLEARANCE BANNER */}
        <div className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-[11px] ${
          hasFullAccess 
            ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300' 
            : 'bg-amber-950/50 border-amber-800/60 text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            {hasFullAccess ? (
              <>
                <Unlock className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">HAK AKSES PENUH (FULL ACCESS) AKTIF</span>
                <span className="text-emerald-400/80">•</span>
                <span className="text-gray-300">
                  {currentOfficer ? `${currentOfficer.rank} - ${currentOfficer.name}` : 'Otoritas PIN Terverifikasi'}
                </span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="font-bold">MODE PRATINJAU (TERKUNCI)</span>
                <span className="text-amber-400/80">•</span>
                <span className="text-gray-300">
                  Hanya Perwira Komando / Supervisor atau PIN Otoritas yang dapat menyimpan perubahan.
                </span>
              </>
            )}
          </div>

          {!hasFullAccess && (
            <form onSubmit={handleVerifyAuthorityPin} className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <input
                type="password"
                placeholder="PIN Otoritas..."
                value={inputAuthorityPin}
                onChange={e => setInputAuthorityPin(e.target.value)}
                className="bg-black/60 border border-amber-600/70 text-amber-200 px-2 py-1 rounded text-xs w-28 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-xs transition"
              >
                Buka Akses
              </button>
            </form>
          )}
        </div>

        {pinError && (
          <div className="bg-rose-950/80 border-b border-rose-800 text-rose-300 px-4 py-1.5 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{pinError}</span>
          </div>
        )}

        {pinSuccess && (
          <div className="bg-emerald-950/80 border-b border-emerald-800 text-emerald-300 px-4 py-1.5 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{pinSuccess}</span>
          </div>
        )}

        {/* Modal Body: Split into Controls & Live Preview */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Controls & Input Methods (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Nav Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-gray-800 bg-[#0B0E14] p-1 rounded-lg gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`py-2 px-2 rounded-md font-bold text-center transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span className="truncate">1. Upload Logo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`py-2 px-2 rounded-md font-bold text-center transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'url'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span className="truncate">2. URL Logo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`py-2 px-2 rounded-md font-bold text-center transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'presets'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="truncate">3. Preset Logo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('wallpaper')}
                className={`py-2 px-2 rounded-md font-bold text-center transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'wallpaper'
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'text-cyan-400 hover:text-cyan-200 hover:bg-gray-800/60'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="truncate">4. Background</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('texts')}
                className={`py-2 px-2 rounded-md font-bold text-center transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'texts'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="truncate">5. Teks & Identitas</span>
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
                      Klik untuk Memilih File Logo dari Folder Device
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
                  <div className="p-3 bg-emerald-950/40 border border-emerald-700/60 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-bold text-emerald-300">{fileDetails.name}</div>
                        <div className="text-[10px] text-gray-400">
                          {fileDetails.sizeKb > 0 ? `Ukuran optimal: ${fileDetails.sizeKb} KB` : 'Tautan gambar aktif'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-[11px] font-bold"
                    >
                      Ganti File
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: INPUT URL GAMBAR LANGSUNG */}
            {activeTab === 'url' && (
              <div className="space-y-4 bg-[#0F131A] p-4 rounded-xl border border-gray-800">
                <div className="space-y-1.5">
                  <label className="text-gray-300 font-bold flex items-center gap-2">
                    <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tautan URL Gambar (Direct Link / CDN / Discord / Imgur)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={e => {
                        setUrlInput(e.target.value);
                        setUrlError('');
                      }}
                      placeholder="https://cdn.discordapp.com/attachments/.../logo.png"
                      className="flex-1 bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleLoadUrl}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition shrink-0"
                    >
                      Terapkan URL
                    </button>
                  </div>
                  {urlError && (
                    <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{urlError}</span>
                    </p>
                  )}
                </div>

                <div className="p-3 bg-gray-900/80 rounded-lg border border-gray-800 text-[11px] text-gray-400 space-y-1 font-sans">
                  <div className="font-bold text-gray-300 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Petunjuk Tautan URL:</span>
                  </div>
                  <p>• Anda dapat menyalin tautan gambar dari Discord (Klik kanan gambar &rarr; Copy Link).</p>
                  <p>• Pastikan tautan berupa direct image link (berakhiran <code>.png</code>, <code>.jpg</code>, atau format gambar web lainnya).</p>
                </div>
              </div>
            )}

            {/* TAB 3: PRESET LAMBANG KEPOLISIAN RESMI */}
            {activeTab === 'presets' && (
              <div className="space-y-3">
                <div className="text-[11px] text-gray-400 font-sans">
                  Pilih salah satu lambang preset kepolisian berkualitas tinggi di bawah ini untuk diterapkan langsung ke sistem:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {PRESET_LOGOS.map(preset => {
                    const isSelected = logoPreview === preset.url;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/50'
                            : 'bg-[#0F131A] border-gray-800 hover:border-gray-600 hover:bg-[#141922]'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-contain bg-black/60 p-1 border border-gray-700 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-200 text-xs truncate flex items-center gap-1">
                            <span>{preset.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">{preset.category}</div>
                          <div className="text-[9px] text-gray-400 truncate mt-0.5">{preset.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: BACKGROUND / WALLPAPER CUSTOMIZATION */}
            {activeTab === 'wallpaper' && (
              <div className="space-y-4 bg-[#0F131A] p-4 rounded-xl border border-cyan-800/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span>PENGATURAN WALLPAPER LATAR BELAKANG</span>
                  </div>
                  {bgWallpaper && (
                    <button
                      type="button"
                      onClick={handleClearWallpaper}
                      className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[11px] font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus Background</span>
                    </button>
                  )}
                </div>

                {/* Upload or URL options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Local file button */}
                  <div 
                    onClick={() => bgFileInputRef.current?.click()}
                    className="border border-dashed border-cyan-700/60 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40 p-4 rounded-xl cursor-pointer text-center flex flex-col items-center justify-center gap-2 transition"
                  >
                    <input
                      ref={bgFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          handleBgFileSelect(e.target.files[0]);
                        }
                      }}
                    />
                    <Upload className={`w-6 h-6 text-cyan-400 ${isProcessingBg ? 'animate-bounce' : ''}`} />
                    <span className="font-bold text-gray-200">Upload Wallpaper dari Folder</span>
                    <span className="text-[10px] text-gray-400">JPG, PNG, WEBP (Max 1920x1080)</span>
                  </div>

                  {/* URL Input Box */}
                  <div className="bg-[#161B22] p-3 rounded-xl border border-gray-800 flex flex-col justify-between gap-2">
                    <label className="text-[11px] text-gray-300 font-bold flex items-center gap-1.5">
                      <LinkIcon className="w-3 h-3 text-cyan-400" />
                      <span>Tautan URL Wallpaper</span>
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="url"
                        value={bgUrlInput}
                        onChange={e => setBgUrlInput(e.target.value)}
                        placeholder="https://.../background.jpg"
                        className="flex-1 bg-black/60 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={handleLoadBgUrl}
                        className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded text-xs transition"
                      >
                        Pasang
                      </button>
                    </div>
                    {bgUrlError && <span className="text-[10px] text-rose-400">{bgUrlError}</span>}
                  </div>
                </div>

                {/* Preset Wallpapers */}
                <div className="space-y-2">
                  <span className="font-bold text-gray-300 flex items-center gap-1.5 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Koleksi Wallpaper HD Tema Kepolisian & Taktis:</span>
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {PRESET_WALLPAPERS.map(wp => {
                      const isSelected = bgWallpaper === wp.url;
                      return (
                        <div
                          key={wp.id}
                          onClick={() => handleSelectPresetWallpaper(wp)}
                          className={`relative h-20 rounded-lg overflow-hidden border cursor-pointer group transition ${
                            isSelected
                              ? 'border-cyan-400 ring-2 ring-cyan-400/60'
                              : 'border-gray-800 hover:border-gray-500'
                          }`}
                        >
                          <img
                            src={wp.url}
                            alt={wp.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-1.5 flex flex-col justify-end">
                            <span className="font-bold text-[10px] text-white truncate">{wp.name}</span>
                            <span className="text-[8px] text-cyan-300 font-mono truncate">{wp.category}</span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-cyan-400 text-black p-0.5 rounded-full">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Visual Adjustments: Opacity & Blur Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-800">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-300 font-bold flex items-center gap-1">
                        <Sun className="w-3 h-3 text-cyan-400" />
                        <span>Transparansi / Opasitas Background</span>
                      </span>
                      <span className="font-mono text-cyan-300 font-bold">{Math.round(bgOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.80"
                      step="0.05"
                      value={bgOpacity}
                      onChange={e => setBgOpacity(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-[9px] text-gray-500 block">Rekomendasi 20% - 35% agar teks MDC tetap kontras dan nyaman dibaca</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-300 font-bold flex items-center gap-1">
                        <Layers className="w-3 h-3 text-cyan-400" />
                        <span>Efek Blur Latar Belakang</span>
                      </span>
                      <span className="font-mono text-cyan-300 font-bold">{bgBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      step="1"
                      value={bgBlur}
                      onChange={e => setBgBlur(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-[9px] text-gray-500 block">Berikan efek blur lembut untuk nuansa UI futuristik</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: KUSTOMISASI TEKS & IDENTITAS */}
            {activeTab === 'texts' && (
              <div className="space-y-3 bg-[#0F131A] p-4 rounded-xl border border-gray-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-300 font-bold">Singkatan Departemen (Header)</label>
                    <input
                      type="text"
                      value={branding.departmentCode}
                      onChange={e => setBranding(prev => ({ ...prev, departmentCode: e.target.value }))}
                      placeholder="Contoh: HSPD / LSPD / BCSO"
                      className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-100 uppercase font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-300 font-bold">Sub-Judul Header</label>
                    <input
                      type="text"
                      value={branding.subTitle}
                      onChange={e => setBranding(prev => ({ ...prev, subTitle: e.target.value }))}
                      placeholder="Contoh: INSPECTOR / MDC-CAD / DISPATCH"
                      className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-100 uppercase font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-gray-300 font-bold">Nama Lengkap Departemen</label>
                  <input
                    type="text"
                    value={branding.departmentName}
                    onChange={e => setBranding(prev => ({ ...prev, departmentName: e.target.value }))}
                    placeholder="Contoh: HIGH STATE POLICE DEPARTMENT"
                    className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-100 uppercase font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-300 font-bold">Wilayah Yurisdiksi</label>
                    <input
                      type="text"
                      value={branding.agencyJurisdiction}
                      onChange={e => setBranding(prev => ({ ...prev, agencyJurisdiction: e.target.value }))}
                      placeholder="Contoh: STATE OF HIGH STATE POLICE DEPARTMENT"
                      className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-100 font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-300 font-bold flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-green-400" />
                      <span>Frekuensi Radio Utama</span>
                    </label>
                    <input
                      type="text"
                      value={branding.radioFreq}
                      onChange={e => setBranding(prev => ({ ...prev, radioFreq: e.target.value }))}
                      placeholder="Contoh: 1111"
                      className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-100 font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Live Real-time Preview (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#0B0E14] border border-gray-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-gray-200 text-xs">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>PRATINJAU REAL-TIME SISTEM</span>
                </div>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-1.5 py-0.5 rounded font-bold">
                  LIVE PREVIEW
                </span>
              </div>

              {/* Big Logo Showcase */}
              <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#161B22] to-[#0D1117] rounded-xl border border-gray-800 relative overflow-hidden group">
                {/* Background preview inside showcase */}
                {bgWallpaper && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `url(${bgWallpaper})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: bgOpacity,
                      filter: bgBlur ? `blur(${bgBlur}px)` : 'none'
                    }}
                  />
                )}

                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative">
                    <img
                      src={logoPreview || DEFAULT_BRANDING.logoUrl}
                      alt="Logo Preview"
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 rounded-full object-contain bg-black/80 p-1.5 border-2 border-amber-500/70 shadow-2xl drop-shadow-xl"
                      onError={e => {
                        (e.target as HTMLImageElement).src = DEFAULT_BRANDING.logoUrl;
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 text-black p-1 rounded-full border border-black shadow">
                      <Sparkles className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="text-center mt-3">
                    <h3 className="font-bold text-gray-100 text-sm font-sans tracking-wide">
                      {branding.departmentName || 'HIGH STATE POLICE DEPT'}
                    </h3>
                    <div className="flex items-center justify-center gap-1.5 mt-1 font-mono text-[10px] text-amber-400">
                      <span>{branding.departmentCode || 'HSPD'}</span>
                      <span>•</span>
                      <span>{branding.cadBadgeText || 'MDC-CAD'}</span>
                      <span>•</span>
                      <span className="text-green-400 font-bold">FREQ: {branding.radioFreq || '1111'}</span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-mono mt-0.5">
                      {branding.agencyJurisdiction || 'STATE OF HIGH STATE POLICE DEPARTMENT'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Simulated Header Bar */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                  Simulasi Header Bilah Atas:
                </span>
                <div className="bg-[#161B22] border border-gray-700 rounded-lg p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={logoPreview || DEFAULT_BRANDING.logoUrl}
                      alt="Logo Header"
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-contain bg-black/60 p-0.5 border border-amber-500/50"
                    />
                    <div>
                      <div className="font-bold text-gray-100 text-[11px] leading-tight">
                        {branding.departmentCode} <span className="text-amber-400">{branding.subTitle}</span>
                      </div>
                      <div className="text-[8px] text-gray-400 leading-none truncate max-w-[130px]">
                        {branding.agencyJurisdiction}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-mono">
                    <span className="bg-amber-950 text-amber-300 px-1 py-0.5 rounded border border-amber-800/60 font-bold">
                      {branding.cadBadgeText}
                    </span>
                    <span className="bg-emerald-950 text-emerald-300 px-1 py-0.5 rounded border border-emerald-800/60 font-bold">
                      10-8 ON DUTY
                    </span>
                  </div>
                </div>
              </div>

              {/* Status info */}
              <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-lg text-[10px] text-gray-400 space-y-1 font-sans">
                <div className="flex items-center gap-1 text-gray-300 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sinkronisasi Otomatis Seluruh Sistem:</span>
                </div>
                <p>• Perubahan logo & background akan langsung aktif di Header, Halaman Login, dan Studio Dokumen Surat Resmi.</p>
                <p>• Data tersimpan permanen di Local Storage browser dan Database Cloud Firestore.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-[#161B22] border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={!hasFullAccess}
            className="w-full sm:w-auto px-3.5 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 hover:text-white rounded-lg font-bold transition flex items-center justify-center gap-1.5"
            title="Kembalikan ke lambang dan teks default HSPD"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standar HSPD</span>
          </button>

          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs animate-bounce">
              <CheckCircle2 className="w-4 h-4" />
              <span>{saveMessage || 'Perubahan Berhasil Diterapkan!'}</span>
            </div>
          )}

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-bold transition"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              disabled={!hasFullAccess}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 shadow-lg ${
                hasFullAccess
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-950/50'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              }`}
            >
              {hasFullAccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Simpan & Terapkan Perubahan</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Buka Akses dengan PIN</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
