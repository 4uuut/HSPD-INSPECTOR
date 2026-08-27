import React, { useRef, useState, useEffect } from 'react';
import { 
  PenTool, 
  Upload, 
  Eraser, 
  RotateCcw, 
  Check, 
  X, 
  Image as ImageIcon, 
  Sparkles,
  Sliders
} from 'lucide-react';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSaveSignature: (dataUrl: string) => void;
  currentSignature?: string;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  title,
  onSaveSignature,
  currentSignature
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'upload'>('draw');
  const [penColor, setPenColor] = useState<string>('#0c2340'); // Dark Navy Police Ink
  const [penWidth, setPenWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(currentSignature || null);
  const [contrastFilter, setContrastFilter] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize canvas
  useEffect(() => {
    if (isOpen && activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penWidth;
      }
    }
  }, [isOpen, activeTab, penColor, penWidth]);

  if (!isOpen) return null;

  // Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  // Upload Handler with automatic background clean-up option
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setUploadedPreview(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) {
        alert('Silakan tanda tangan terlebih dahulu pada kanvas.');
        return;
      }
      const dataUrl = canvas.toDataURL('image/png');
      onSaveSignature(dataUrl);
      onClose();
    } else {
      if (!uploadedPreview) {
        alert('Silakan upload file foto / PNG tanda tangan dari device Anda.');
        return;
      }
      onSaveSignature(uploadedPreview);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#11141A] border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-mono animate-fadeIn flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 bg-[#0D1117] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-gray-100">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg bg-gray-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-800 bg-[#161B22] p-1 gap-1">
          <button
            onClick={() => setActiveTab('draw')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'draw'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Tanda Tangan di Layar (Sentuh / Mouse)</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload dari HP / Laptop</span>
          </button>
        </div>

        {/* Tab 1: Live Drawing Canvas */}
        {activeTab === 'draw' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="text-[11px]">Tulis tanda tangan Anda di area putih bawah:</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px]">Tinta:</span>
                <button
                  onClick={() => setPenColor('#0c2340')}
                  className={`w-4 h-4 rounded-full border ${
                    penColor === '#0c2340' ? 'ring-2 ring-blue-400 border-white' : 'border-gray-500'
                  }`}
                  style={{ backgroundColor: '#0c2340' }}
                  title="Tinta Biru Navy Kepolisian"
                />
                <button
                  onClick={() => setPenColor('#111827')}
                  className={`w-4 h-4 rounded-full border ${
                    penColor === '#111827' ? 'ring-2 ring-blue-400 border-white' : 'border-gray-500'
                  }`}
                  style={{ backgroundColor: '#111827' }}
                  title="Tinta Hitam Pekat"
                />
                <button
                  onClick={() => setPenColor('#1e3a8a')}
                  className={`w-4 h-4 rounded-full border ${
                    penColor === '#1e3a8a' ? 'ring-2 ring-blue-400 border-white' : 'border-gray-500'
                  }`}
                  style={{ backgroundColor: '#1e3a8a' }}
                  title="Tinta Biru Royal"
                />
              </div>
            </div>

            {/* Canvas Container */}
            <div className="relative border-2 border-dashed border-gray-600 rounded-xl overflow-hidden bg-[#FEFEFB] shadow-inner touch-none">
              <canvas
                ref={canvasRef}
                width={500}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[180px] cursor-crosshair block"
              />
              
              {/* Baseline Guideline */}
              <div className="absolute bottom-6 left-6 right-6 border-b border-gray-300 border-dashed pointer-events-none flex justify-between text-[9px] text-gray-400 font-sans px-1">
                <span>✕ Garis Dasar Tanda Tangan</span>
                <span>HSPD Official Sign</span>
              </div>
            </div>

            {/* Tool buttons */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">Ketebalan:</span>
                <button
                  onClick={() => setPenWidth(2)}
                  className={`px-2 py-0.5 rounded text-[10px] border ${
                    penWidth === 2 ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                >
                  Halus (2px)
                </button>
                <button
                  onClick={() => setPenWidth(3)}
                  className={`px-2 py-0.5 rounded text-[10px] border ${
                    penWidth === 3 ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                >
                  Standar (3px)
                </button>
                <button
                  onClick={() => setPenWidth(5)}
                  className={`px-2 py-0.5 rounded text-[10px] border ${
                    penWidth === 5 ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                >
                  Tebal (5px)
                </button>
              </div>

              <button
                onClick={handleClear}
                className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs flex items-center gap-1 font-bold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Bersihkan</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Upload File / Photo */}
        {activeTab === 'upload' && (
          <div className="p-4 space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-600 hover:border-blue-500 bg-[#0D1117] rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-950/60 border border-blue-500 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-gray-200">
                Klik atau Tarik Foto / Gambar Tanda Tangan ke Sini
              </div>
              <p className="text-[10px] text-gray-400 max-w-xs">
                Mendukung format PNG Transparan, JPG, atau foto tanda tangan di atas kertas putih.
              </p>
            </div>

            {/* Uploaded Preview */}
            {uploadedPreview && (
              <div className="bg-[#0D1117] border border-gray-700 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-300 font-bold flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    Pratinjau Tanda Tangan:
                  </span>
                  <button
                    onClick={() => setUploadedPreview(null)}
                    className="text-rose-400 hover:text-rose-300 text-[10px] underline"
                  >
                    Ganti Foto
                  </button>
                </div>

                <div className="h-28 bg-[#FAF8F5] border border-gray-300 rounded-lg flex items-center justify-center p-2 overflow-hidden shadow-inner">
                  <img
                    src={uploadedPreview}
                    alt="Preview Signature"
                    className="max-h-full max-w-full object-contain"
                    style={{
                      mixBlendMode: contrastFilter ? 'multiply' : 'normal',
                      filter: contrastFilter ? 'contrast(130%)' : 'none'
                    }}
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-gray-300 text-[10px] pt-1">
                  <input
                    type="checkbox"
                    checked={contrastFilter}
                    onChange={(e) => setContrastFilter(e.target.checked)}
                    className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-0"
                  />
                  <span>Mode Tinta Transparan (Otomatis hilangkan background putih kertas)</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-3 border-t border-gray-800 bg-[#0D1117] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold"
          >
            Batal
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Terapkan Tanda Tangan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
