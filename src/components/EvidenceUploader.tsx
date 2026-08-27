import React, { useState, useRef } from 'react';
import { 
  Camera, Upload, Link2, X, Image as ImageIcon, CheckCircle2, 
  AlertCircle, Sparkles, ZoomIn, RefreshCw, Plus, ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';
import { processAndCompressImage } from '../utils/imageCompressor';

const MAX_PHOTOS = 10;

interface Props {
  images?: string[]; // Array of up to 10 photos
  value?: string;    // Backward compatibility for single photo
  onChange: (images: string[]) => void;
  label?: string;
  placeholder?: string;
}

export const EvidenceUploader: React.FC<Props> = ({
  images,
  value,
  onChange,
  label = 'Bukti Kejadian / Evidence (Maksimal 10 Foto)',
  placeholder = 'https://i.imgur.com/... masukkan link gambar'
}) => {
  // Normalize images list
  const currentImages: string[] = Array.isArray(images) 
    ? images 
    : (value ? [value] : []);

  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleAddFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    if (currentImages.length >= MAX_PHOTOS) {
      setErrorMsg(`Maksimal upload adalah ${MAX_PHOTOS} foto bukti.`);
      return;
    }

    const availableSlots = MAX_PHOTOS - currentImages.length;
    const filesToProcess = files.slice(0, availableSlots);

    if (files.length > availableSlots) {
      setErrorMsg(`Hanya ${availableSlots} foto yang ditambahkan (mencapai batas maksimal 10 foto).`);
    } else {
      setErrorMsg(null);
    }

    setIsProcessing(true);
    const newProcessedUrls: string[] = [];

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) {
        continue;
      }
      try {
        const result = await processAndCompressImage(file, 1400, 1400, 0.85);
        newProcessedUrls.push(result.dataUrl);
      } catch (err) {
        console.error('Failed to process image', err);
      }
    }

    setIsProcessing(false);

    if (newProcessedUrls.length > 0) {
      const updated = [...currentImages, ...newProcessedUrls].slice(0, MAX_PHOTOS);
      onChange(updated);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleAddFiles(e.target.files);
    }
    // reset input value so same files can be re-selected if needed
    e.target.value = '';
  };

  // Drag and Drop
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  // Clipboard Paste Support
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      handleAddFiles(files);
    }
  };

  const handleRemoveSingle = (indexToRemove: number) => {
    const updated = currentImages.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
    if (previewIndex !== null && previewIndex >= updated.length) {
      setPreviewIndex(updated.length > 0 ? updated.length - 1 : null);
    }
  };

  const handleClearAll = () => {
    onChange([]);
    setPreviewIndex(null);
    setUrlInput('');
  };

  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) return;

    if (currentImages.length >= MAX_PHOTOS) {
      setErrorMsg(`Maksimal ${MAX_PHOTOS} foto bukti telah tercapai.`);
      return;
    }

    setErrorMsg(null);
    onChange([...currentImages, cleanUrl]);
    setUrlInput('');
  };

  const canAddMore = currentImages.length < MAX_PHOTOS;

  return (
    <div className="space-y-2" onPaste={handlePaste}>
      {/* Label & Counter Header */}
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase text-gray-300 flex items-center gap-1.5 font-mono">
          <Camera className="w-3.5 h-3.5 text-blue-400" />
          <span>{label}</span>
          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
            currentImages.length >= MAX_PHOTOS 
              ? 'bg-amber-950 text-amber-300 border border-amber-700' 
              : currentImages.length > 0
                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                : 'bg-gray-800 text-gray-400'
          }`}>
            {currentImages.length} / {MAX_PHOTOS} Foto
          </span>
        </label>

        {/* Mode Switcher & Clear Button */}
        <div className="flex items-center gap-1.5">
          {currentImages.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[10px] text-rose-400 hover:text-rose-300 px-1.5 py-0.5 rounded hover:bg-rose-950/40 transition font-mono flex items-center gap-1"
              title="Hapus Semua Foto"
            >
              <Trash2 className="w-3 h-3" />
              <span>Hapus Semua</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-[#161B22] p-0.5 rounded border border-gray-800 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
                mode === 'upload'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Upload className="w-3 h-3" />
              <span>Upload / Foto</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('url')}
              className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
                mode === 'url'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Link2 className="w-3 h-3" />
              <span>Link URL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File & Camera Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        id="device-photo-upload-input"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
        id="device-camera-capture-input"
      />

      {/* ERROR MESSAGE IF ANY */}
      {errorMsg && (
        <div className="p-2 bg-rose-950/40 border border-rose-800/60 rounded text-rose-300 text-[11px] flex items-center gap-2 font-mono">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* GALLERY GRID OF UPLOADED PHOTOS */}
      {currentImages.length > 0 && (
        <div className="bg-[#161B22] border border-gray-800 rounded-lg p-2.5 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {currentImages.map((imgUrl, idx) => {
              const isBase64 = imgUrl.startsWith('data:image/');
              return (
                <div 
                  key={idx} 
                  className="relative group bg-black/60 rounded-lg border border-gray-700/80 overflow-hidden aspect-[4/3] flex flex-col justify-between shadow-sm"
                >
                  <img
                    src={imgUrl}
                    alt={`Bukti #${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition cursor-pointer"
                    onClick={() => setPreviewIndex(idx)}
                    referrerPolicy="no-referrer"
                  />

                  {/* Top Overlay Badge */}
                  <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono px-1.5 py-0.2 rounded font-bold border border-gray-700 pointer-events-none">
                    #{idx + 1}
                  </div>

                  {/* Action Overlays */}
                  <div className="absolute top-1 right-1 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={() => handleRemoveSingle(idx)}
                      className="w-5 h-5 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center shadow transition"
                      title="Hapus foto ini"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Bottom Zoom Trigger */}
                  <button
                    type="button"
                    onClick={() => setPreviewIndex(idx)}
                    className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                    title="Perbesar foto"
                  >
                    <ZoomIn className="w-5 h-5 drop-shadow" />
                  </button>
                </div>
              );
            })}

            {/* "+ Tambah Foto" card inside grid if slots remain */}
            {canAddMore && (
              <div
                onClick={() => mode === 'upload' ? fileInputRef.current?.click() : null}
                className={`border border-dashed border-gray-700 hover:border-blue-500 bg-[#0D1117] hover:bg-blue-950/20 rounded-lg aspect-[4/3] flex flex-col items-center justify-center p-2 text-center transition cursor-pointer group`}
              >
                <div className="w-7 h-7 rounded-full bg-gray-800 group-hover:bg-blue-600 flex items-center justify-center text-gray-300 group-hover:text-white transition mb-1">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-gray-300 font-mono">
                  + Tambah Foto
                </span>
                <span className="text-[8px] text-gray-500 font-mono">
                  Sisa {MAX_PHOTOS - currentImages.length} slot
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 1: UPLOAD / CAMERA (DRAG & DROP ZONE) */}
      {mode === 'upload' && canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-3 text-center transition flex flex-col items-center justify-center gap-2 cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-950/30'
              : 'border-gray-700 bg-[#0D1117] hover:border-gray-600 hover:bg-[#161B22]'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2 py-2 text-blue-400 font-mono text-xs">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Memproses & mengoptimasi foto dari perangkat...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-7 h-7 rounded-full bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
                  <Upload className="w-3.5 h-3.5" />
                </div>
                <div className="w-7 h-7 rounded-full bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-200">
                  {currentImages.length === 0 ? 'Pilih Berkas Bukti Dari Folder Device (Maks. 10 Foto)' : `Tambah Foto Bukti (${currentImages.length}/10)`}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Buka folder komputer/HP, drag & drop foto bukti, atau paste (<kbd className="font-mono bg-black/50 px-1 rounded border border-gray-700 text-gray-300">Ctrl+V</kbd>)
                </p>
              </div>

              {/* Action Buttons inside Dropzone */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-mono font-bold flex items-center gap-1.5 transition shadow-md shadow-blue-600/30"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>PILIH DARI FOLDER DEVICE / FILE EXPLORER</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black rounded text-[10px] font-mono font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>KAMERA LANGSUNG</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* MODE 2: URL INPUT */}
      {mode === 'url' && canAddMore && (
        <form onSubmit={handleAddUrl} className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-8 pr-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded text-xs text-gray-200 placeholder:text-gray-600 outline-none font-mono transition"
            />
          </div>
          <button
            type="submit"
            disabled={!urlInput.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-mono font-bold transition flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>TAMBAH LINK</span>
          </button>
        </form>
      )}

      {/* FULL PREVIEW MODAL LIGHTBOX WITH SLIDER */}
      {previewIndex !== null && currentImages[previewIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPreviewIndex(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-[#161B22] border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-2.5 bg-[#0F1319] border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-gray-200 font-mono">
                  Foto Bukti #{previewIndex + 1} dari {currentImages.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewIndex(null)}
                className="w-6 h-6 rounded bg-gray-800 hover:bg-rose-900/60 text-gray-300 hover:text-rose-200 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image Display with Navigation Arrows */}
            <div className="relative p-2 bg-black flex items-center justify-center max-h-[75vh] overflow-hidden min-h-[300px]">
              {previewIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setPreviewIndex(previewIndex - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-blue-600 text-white flex items-center justify-center transition shadow-lg border border-gray-700 z-10"
                  title="Foto Sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <img
                src={currentImages[previewIndex]}
                alt={`Preview Bukti #${previewIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain rounded shadow"
                referrerPolicy="no-referrer"
              />

              {previewIndex < currentImages.length - 1 && (
                <button
                  type="button"
                  onClick={() => setPreviewIndex(previewIndex + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-blue-600 text-white flex items-center justify-center transition shadow-lg border border-gray-700 z-10"
                  title="Foto Berikutnya"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2 bg-[#0F1319] border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRemoveSingle(previewIndex)}
                  className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded text-xs transition flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus Foto Ini</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span>{previewIndex + 1} / {currentImages.length}</span>
                <button
                  type="button"
                  onClick={() => setPreviewIndex(null)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs"
                >
                  TUTUP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
