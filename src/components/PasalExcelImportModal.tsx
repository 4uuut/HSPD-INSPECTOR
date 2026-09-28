import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle2, AlertTriangle, 
  X, Crown, RefreshCw, FileText, ArrowRight, Eye, Check, ShieldAlert
} from 'lucide-react';
import { PasalItem } from '../types';
import { OFFENCE_CATEGORIES, PASAL_LIST, sortPasalByBadgeCode } from '../data/pasalData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentPasalList: PasalItem[];
  onApplyImport: (newPasalList: PasalItem[], mode: 'replace' | 'merge') => void;
  isAtasan: boolean;
}

export const PasalExcelImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentPasalList,
  onApplyImport,
  isAtasan
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<PasalItem[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewTab, setPreviewTab] = useState<'all' | 'preview'>('preview');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Clean and normalize number
  const cleanNumber = (val: any, fallback = 0): number => {
    if (typeof val === 'number') return isNaN(val) ? fallback : Math.max(0, val);
    if (!val) return fallback;
    const str = String(val).toLowerCase().trim();
    // Handle Indonesian & English boolean / affirmative indicators
    if (['ya', 'yes', 'sita', 'ada', 'true', 'impound'].includes(str)) return 1;
    if (['tidak', 'no', 'none', 'false', '-', '', 'bukan'].includes(str)) return 0;
    
    // Extract first numeric group
    const match = str.match(/(\d+(?:[.,]\d+)?)/);
    if (!match) return fallback;
    
    // Remove dots/commas if thousands (e.g. 1.000 -> 1000)
    let cleanStr = match[1].replace(/,/g, '');
    if (cleanStr.includes('.') && cleanStr.split('.')[1].length === 3) {
      cleanStr = cleanStr.replace(/\./g, '');
    }
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? fallback : Math.max(0, Math.round(parsed));
  };

  // Process uploaded Excel / CSV file
  const handleFile = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setParseErrors([]);
    setParsedRows([]);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('File Excel tidak memiliki lembar kerja (worksheet) yang valid.');
      }

      // 1. Multi-Sheet Scan: Cari worksheet yang paling relevan
      let bestSheetName = workbook.SheetNames[0];
      let bestJson: any[][] = [];
      let maxScore = -1;

      for (const sName of workbook.SheetNames) {
        const ws = workbook.Sheets[sName];
        if (!ws) continue;
        const sheetJson = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });
        if (!Array.isArray(sheetJson) || sheetJson.length < 2) continue;

        let score = sheetJson.length;
        const lowerSheetName = sName.toLowerCase();
        if (/(kuhp|pasal|sop|pidana|hukum|undang|aturan)/i.test(lowerSheetName)) score += 500;

        // Cek sampel 10 baris pertama
        for (let i = 0; i < Math.min(sheetJson.length, 10); i++) {
          const rowText = (sheetJson[i] || []).join(' ').toLowerCase();
          if (/(kode|pasal|pelanggaran|deskripsi|denda|penjara|impound)/i.test(rowText)) score += 100;
          if (/[a-h][0-9]{1,3}/i.test(rowText)) score += 50;
        }

        if (score > maxScore) {
          maxScore = score;
          bestSheetName = sName;
          bestJson = sheetJson;
        }
      }

      if (bestJson.length < 2) {
        const firstWs = workbook.Sheets[workbook.SheetNames[0]];
        if (firstWs) {
          bestJson = XLSX.utils.sheet_to_json<any[]>(firstWs, { header: 1, defval: '' });
        }
      }

      if (!bestJson || bestJson.length < 2) {
        throw new Error('File Excel kosong atau tidak memiliki baris data yang cukup.');
      }

      // 2. Deteksi Baris Header Fleksibel (Cari hingga 25 baris pertama)
      let headerRowIdx = -1;
      let colIndices = {
        cat: -1,
        code: -1,
        desc: -1,
        fine: -1,
        time: -1,
        imp: -1
      };

      for (let r = 0; r < Math.min(bestJson.length, 25); r++) {
        const row = bestJson[r];
        if (!Array.isArray(row)) continue;

        let foundCat = -1;
        let foundCode = -1;
        let foundDesc = -1;
        let foundFine = -1;
        let foundTime = -1;
        let foundImp = -1;

        row.forEach((cell: any, idx: number) => {
          const s = String(cell || '').toLowerCase().trim();
          if (!s) return;

          // Category: Kategori, Cat, Category, Bab, Golongan, Kelas
          if (/(kategori|category|cat\b|bab\b|golongan|kelas)/i.test(s) && !/(kode|nama|deskripsi|pasal)/i.test(s)) {
            foundCat = idx;
          }
          // Description: Deskripsi, Pelanggaran, Perkara, Tindak Pidana, Uraian, Nama Pasal, dsb. (Mendukung 'Deskripsi / Pelanggaran')
          else if (/(deskripsi|pelanggaran|perkara|tindak|kejahatan|keterangan|uraian|judul|nama\s*pasal|nama\s*pelanggaran|isi\s*pasal|bunyi)/i.test(s)) {
            foundDesc = idx;
          }
          // Code: Kode Pasal, Kode, Code, No Pasal, ID Pasal
          else if (/(kode\s*pasal|kode|code|no\s*pasal|id\s*pasal|pasal_id|id_pasal)/i.test(s)) {
            foundCode = idx;
          }
          // Fine: Denda, Fine, Biaya, Nominal, Tarif, Harga, $
          else if (/(denda|fine|biaya|nominal|tarif|harga|rupiah|uang)/i.test(s) || s.includes('$') || /\brp\b/i.test(s)) {
            foundFine = idx;
          }
          // Time: Waktu, Time, Penjara, Jail, Kurungan, Bulan, Menit, Hukuman
          else if (/(waktu|time|penjara|jail|kurungan|bulan|menit|hukuman|durasi)/i.test(s)) {
            foundTime = idx;
          }
          // Impound: Impound, Imp, Sita, Kendaraan, Mobil, Motor
          else if (/(impound|imp\b|sita|kendaraan|mobil|motor)/i.test(s)) {
            foundImp = idx;
          }
          // Jika cell hanya bertuliskan "Pasal"
          else if (foundCode === -1 && /^pasal$/i.test(s)) {
            foundCode = idx;
          }
        });

        // Jika baris ini memiliki kode ATAU deskripsi, tetapkan sebagai baris header
        if (foundCode !== -1 || foundDesc !== -1) {
          headerRowIdx = r;
          colIndices = {
            cat: foundCat,
            code: foundCode,
            desc: foundDesc,
            fine: foundFine,
            time: foundTime,
            imp: foundImp
          };
          break;
        }
      }

      // 3. Fallback Heuristik berbasis Isi Data (Jika header tidak lengkap)
      const sampleStart = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
      const sampleRows = bestJson.slice(sampleStart, sampleStart + 30).filter(r => Array.isArray(r) && r.length > 0);

      // Cari kolom Kode jika belum ditemukan: cari kolom dengan pola A01, B08, C-12, dsb.
      if (colIndices.code === -1 && sampleRows.length > 0) {
        const maxCols = Math.max(...sampleRows.map(r => r.length));
        for (let c = 0; c < maxCols; c++) {
          const matchCount = sampleRows.filter(r => {
            const v = String(r[c] || '').trim();
            return /^[a-zA-Z][-_\s.]?[0-9]{1,3}[a-zA-Z]?$/.test(v) || /^pasal\s*[0-9]+/i.test(v);
          }).length;
          if (matchCount >= Math.min(2, sampleRows.length)) {
            colIndices.code = c;
            break;
          }
        }
      }

      // Cari kolom Deskripsi jika belum ditemukan: cari kolom teks terpanjang
      if (colIndices.desc === -1 && sampleRows.length > 0) {
        const maxCols = Math.max(...sampleRows.map(r => r.length));
        let bestCol = -1;
        let maxAvgLen = 0;
        for (let c = 0; c < maxCols; c++) {
          if (c === colIndices.code || c === colIndices.cat) continue;
          const lengths = sampleRows.map(r => String(r[c] || '').trim().length).filter(len => len > 0);
          if (lengths.length > 0) {
            const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
            if (avg > maxAvgLen && avg >= 5) {
              maxAvgLen = avg;
              bestCol = c;
            }
          }
        }
        if (bestCol !== -1) colIndices.desc = bestCol;
      }

      // Cari kolom Denda jika belum ditemukan: cari kolom dengan angka >= 100
      if (colIndices.fine === -1 && sampleRows.length > 0) {
        const maxCols = Math.max(...sampleRows.map(r => r.length));
        for (let c = 0; c < maxCols; c++) {
          if (c === colIndices.code || c === colIndices.desc || c === colIndices.cat) continue;
          const hasBigNumbers = sampleRows.some(r => {
            const num = cleanNumber(r[c]);
            return num >= 100;
          });
          if (hasBigNumbers) {
            colIndices.fine = c;
            break;
          }
        }
      }

      // Fallback mutlak jika tidak ada kolom terdeteksi sama sekali
      if (colIndices.code === -1 && colIndices.desc === -1) {
        headerRowIdx = 0;
        colIndices = { cat: 0, code: 1, desc: 2, fine: 3, time: 4, imp: 5 };
      } else if (colIndices.code === -1) {
        colIndices.code = 1;
      } else if (colIndices.desc === -1) {
        colIndices.desc = colIndices.code === 0 ? 1 : 2;
      }

      const results: PasalItem[] = [];
      const errors: string[] = [];
      const validCategories: string[] = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
        'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
      ];
      let currentSectionCategory: string = 'A';

      const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
      for (let r = startRow; r < bestJson.length; r++) {
        const row = bestJson[r];
        if (!Array.isArray(row) || row.length === 0) continue;

        // Deteksi baris pembatas section (Contoh: "KATEGORI I: PIDANA KHUSUS" atau "BAB I")
        const rowJoined = row.map(c => String(c || '').trim()).join(' ');
        const sectionMatch = rowJoined.match(/(?:kategori|bab|golongan)\s*([a-zA-Z])/i);
        if (sectionMatch) {
          currentSectionCategory = sectionMatch[1].toUpperCase();
        }

        let rawCode = colIndices.code !== -1 ? String(row[colIndices.code] || '').trim() : '';
        let rawDesc = colIndices.desc !== -1 ? String(row[colIndices.desc] || '').trim() : '';
        let rawCat = colIndices.cat !== -1 ? String(row[colIndices.cat] || '').trim().toUpperCase() : '';
        const rawFine = colIndices.fine !== -1 ? row[colIndices.fine] : 0;
        const rawTime = colIndices.time !== -1 ? row[colIndices.time] : 0;
        const rawImp = colIndices.imp !== -1 ? row[colIndices.imp] : 0;

        // Lewati baris kosong
        if (!rawCode && !rawDesc) continue;

        // Lewati jika baris ini adalah duplikasi header di tengah lembar kerja
        if (/^(kode|pasal|kategori|deskripsi|no|nomor)$/i.test(rawCode) && /^(deskripsi|pelanggaran|nama|keterangan)$/i.test(rawDesc)) {
          continue;
        }

        // Jika rawCode hanya berisi nomor urut biasa (1, 2, 3) dan ada kode pasal di kolom deskripsi atau kolom lain
        if (/^\d{1,3}$/.test(rawCode)) {
          const embeddedCodeMatch = rawDesc.match(/^([a-zA-Z][-_\s.]?[0-9]{1,3})[\s:–—-]+(.*)/);
          if (embeddedCodeMatch) {
            rawCode = embeddedCodeMatch[1].replace(/[-_\s.]/g, '').toUpperCase();
            rawDesc = embeddedCodeMatch[2].trim();
          } else {
            for (let c = 0; c < row.length; c++) {
              const cellStr = String(row[c] || '').trim();
              if (/^[a-zA-Z][-_\s.]?[0-9]{1,3}[a-zA-Z]?$/.test(cellStr)) {
                rawCode = cellStr.toUpperCase();
                break;
              }
            }
          }
        }

        // Jika kode pasal masih kosong, cari di kolom lain
        if (!rawCode) {
          for (let c = 0; c < row.length; c++) {
            const cellStr = String(row[c] || '').trim();
            if (/^[a-zA-Z][-_\s.]?[0-9]{1,3}[a-zA-Z]?$/.test(cellStr)) {
              rawCode = cellStr.toUpperCase();
              break;
            }
          }
        }

        if (!rawCode) {
          errors.push(`Baris ${r + 1}: Kode pasal kosong, baris dilewati.`);
          continue;
        }

        // Jika deskripsi kosong, cari teks alternatif di kolom lain
        if (!rawDesc) {
          for (let c = 0; c < row.length; c++) {
            if (c === colIndices.code || c === colIndices.cat) continue;
            const strVal = String(row[c] || '').trim();
            if (strVal.length > 5 && isNaN(Number(strVal))) {
              rawDesc = strVal;
              break;
            }
          }
        }

        if (!rawDesc) {
          errors.push(`Baris ${r + 1} (${rawCode}): Deskripsi pasal kosong, baris dilewati.`);
          continue;
        }

        // Tentukan Kategori:
        // 1. Dari kolom kategori
        // 2. Dari awalan kode (misal I01 -> I, A01 -> A)
        // 3. Dari section header terakhir
        // 4. Default ke H (Khusus)
        if (!validCategories.includes(rawCat)) {
          const matchCat = rawCode.match(/^([a-zA-Z])/i);
          if (matchCat) {
            rawCat = matchCat[1].toUpperCase();
          } else if (validCategories.includes(currentSectionCategory)) {
            rawCat = currentSectionCategory;
          } else {
            rawCat = 'I';
          }
        }

        const cleanCode = rawCode.replace(/[\s_]/g, '-').toUpperCase();

        results.push({
          cat: rawCat as PasalItem['cat'],
          code: cleanCode,
          desc: rawDesc,
          fine: cleanNumber(rawFine, 1000),
          time: cleanNumber(rawTime, 0),
          imp: cleanNumber(rawImp, 0)
        });
      }

      if (results.length === 0) {
        throw new Error(`Tidak ada baris data pasal yang valid ditemukan dalam sheet "${bestSheetName}". Pastikan terdapat kolom Kode Pasal dan Deskripsi Pelanggaran.`);
      }

      const sortedResults = sortPasalByBadgeCode(results);
      setParsedRows(sortedResults);
      setParseErrors(errors);
    } catch (err: any) {
      console.error('Error parsing Excel file:', err);
      setParseErrors([err.message || 'Gagal membaca file Excel. Pastikan format file sesuai.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Download official pre-formatted Excel template
  const handleDownloadTemplate = () => {
    const headers = ['Kategori', 'Kode Pasal', 'Deskripsi / Pelanggaran', 'Denda ($)', 'Waktu Penjara (Bulan)', 'Impound Kendaraan'];
    const sampleData = [
      ['A', 'A01', 'Berkendara tidak memiliki SIM', 1000, 0, 1],
      ['A', 'A02', 'Berkendara Secara Ugal - Ugalan', 1200, 0, 1],
      ['A', 'A05', 'Kabur dari Kecelakaan', 1800, 5, 1],
      ['B', 'B01', 'Kekerasan Ringan', 2500, 10, 0],
      ['B', 'B06', 'Berkelahi di tempat umum', 1750, 15, 0],
      ['B', 'B08', 'Pencurian', 3000, 18, 1],
      ['C', 'C01', 'Masuk properti pribadi tanpa izin', 1300, 10, 0],
      ['D', 'D01', 'Berada di tempat narkotika', 2000, 15, 0],
      ['E', 'E01', 'Kepemilikan Senjata Api Tanpa Izin', 7500, 25, 1],
      ['F', 'F01', 'Perampokan Bank / ATM (Robbery)', 10000, 30, 2],
      ['G', 'G01', 'Pencucian Uang / Money Laundering', 12500, 35, 3],
      ['H', 'H01', 'Pelanggaran Ketertiban Luar Biasa', 5000, 20, 1],
      ['I', 'I01', 'Tindak Pidana Khusus / Korupsi Berat', 15000, 45, 3]
    ];

    const wsData = [
      headers,
      ...sampleData
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 10 }, // Kategori
      { wch: 14 }, // Kode Pasal
      { wch: 45 }, // Deskripsi
      { wch: 14 }, // Denda
      { wch: 22 }, // Waktu Penjara
      { wch: 20 }  // Impound
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KUHP_SOP_TEMPLATE');

    XLSX.writeFile(wb, 'TEMPLATE_RESMI_KUHP_SOP_HSPD.xlsx');
  };

  // Export currently active pasal data to Excel so Atasan can edit it
  const handleExportActivePasal = () => {
    const headers = ['Kategori', 'Kode Pasal', 'Deskripsi / Pelanggaran', 'Denda ($)', 'Waktu Penjara (Bulan)', 'Impound Kendaraan'];
    const rows = currentPasalList.map(p => [
      p.cat,
      p.code,
      p.desc,
      p.fine,
      p.time,
      p.imp
    ]);

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 10 },
      { wch: 14 },
      { wch: 50 },
      { wch: 14 },
      { wch: 22 },
      { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DATA_KUHP_AKTIF');

    const cleanDate = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `DATA_RESMI_KUHP_SOP_HSPD_${cleanDate}.xlsx`);
  };

  const handleConfirmSubmit = () => {
    if (parsedRows.length === 0) return;
    onApplyImport(parsedRows, importMode);
    onClose();
  };

  // Group counts by category
  const categoryCounts = parsedRows.reduce((acc, item) => {
    acc[item.cat] = (acc[item.cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-[#0D1117] border border-blue-600/60 rounded-xl shadow-2xl shadow-blue-950/60 w-full max-w-3xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="p-4 bg-gradient-to-r from-blue-950/80 via-slate-900 to-[#0D1117] border-b border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-100 text-sm sm:text-base font-mono flex items-center gap-1.5">
                  Import & Perbarui KUHP / SOP dari Excel
                </h3>
                <span className="px-2 py-0.5 bg-amber-950/80 border border-amber-700/80 text-amber-300 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>Khusus Atasan</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Upload file Excel (.xlsx / .xls / .csv) untuk mengubah atau mengganti seluruh pasal KUHP & SOP HSPD secara otomatis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 font-mono text-xs">
          {/* Action Quickbar: Download Template or Export Active */}
          <div className="p-3 bg-[#161B22] border border-gray-800 rounded-lg flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-gray-300">
              <FileText className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Butuh format tabel yang benar sebelum diedit?</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                id="btn-download-kuhp-template"
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-md text-xs font-bold transition flex items-center gap-1.5"
                title="Download file template kosong dengan format kolom resmi HSPD"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Unduh Template Excel</span>
              </button>
              <button
                type="button"
                id="btn-export-active-kuhp"
                onClick={handleExportActivePasal}
                className="px-3 py-1.5 bg-blue-950/70 hover:bg-blue-900/80 text-blue-300 border border-blue-700/80 rounded-md text-xs font-bold transition flex items-center gap-1.5"
                title="Download data KUHP yang saat ini aktif ke Excel untuk Anda edit lalu upload kembali"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                <span>Ekspor KUHP Aktif ({currentPasalList.length} Pasal)</span>
              </button>
            </div>
          </div>

          {/* Drag & Drop File Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
              dragActive 
                ? 'border-blue-500 bg-blue-950/30' 
                : 'border-gray-700 hover:border-blue-500/70 bg-[#161B22]/50 hover:bg-[#161B22]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleInputChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-blue-950/80 border border-blue-700/60 flex items-center justify-center text-blue-400">
              {isProcessing ? (
                <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="font-bold text-gray-200 text-sm">
                {selectedFile ? selectedFile.name : 'Klik atau Tarik File Excel / CSV ke Sini'}
              </p>
              <p className="text-gray-400 text-[11px] mt-1">
                Mendukung format <strong>.xlsx</strong>, <strong>.xls</strong>, dan <strong>.csv</strong>
              </p>
            </div>
            {selectedFile && (
              <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 rounded text-[11px]">
                Ukuran file: {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
            )}
          </div>

          {/* Parse Errors Notification */}
          {parseErrors.length > 0 && (
            <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Peringatan Pembacaan Data:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-300/90 pl-1">
                {parseErrors.slice(0, 5).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
                {parseErrors.length > 5 && (
                  <li>...dan {parseErrors.length - 5} baris lainnya</li>
                )}
              </ul>
            </div>
          )}

          {/* Parsed Results Overview & Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-blue-950/40 border border-blue-800/60 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-gray-200">
                    Berhasil mendeteksi <strong className="text-emerald-300 font-mono text-sm">{parsedRows.length}</strong> Pasal KUHP & SOP
                  </span>
                </div>
                {/* Category breakdown tags */}
                <div className="flex items-center gap-1 flex-wrap">
                  {Object.entries(categoryCounts).map(([cat, count]) => (
                    <span key={cat} className="px-1.5 py-0.5 bg-gray-900 border border-gray-700 text-gray-300 rounded text-[10px]">
                      {cat}: <strong className="text-blue-300">{count}</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* Import Mode Options */}
              <div className="p-3 bg-[#161B22] border border-gray-800 rounded-lg space-y-2">
                <span className="font-bold text-gray-300 block text-[11px] uppercase tracking-wider">
                  Pilih Cara Penerapan Data ke Sistem:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label 
                    className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start gap-2.5 ${
                      importMode === 'replace'
                        ? 'bg-blue-950/60 border-blue-500 text-blue-100 shadow-sm'
                        : 'bg-black/30 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-xs block text-gray-200">
                        Ganti Seluruh Pasal (Otomatis Timpa)
                      </span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">
                        Menghapus pasal lama dan menggantinya 100% dengan {parsedRows.length} pasal dari file Excel ini.
                      </span>
                    </div>
                  </label>

                  <label 
                    className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start gap-2.5 ${
                      importMode === 'merge'
                        ? 'bg-blue-950/60 border-blue-500 text-blue-100 shadow-sm'
                        : 'bg-black/30 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-xs block text-gray-200">
                        Perbarui & Gabungkan (Merge)
                      </span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">
                        Memperbarui pasal yang memiliki kode sama, menambah pasal baru, dan mempertahankan pasal lain yang tidak ada di Excel.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="border border-gray-800 rounded-lg overflow-hidden">
                <div className="p-2 bg-[#161B22] border-b border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="font-bold text-gray-300">
                    Preview Data Hasil Pembacaan ({previewTab === 'preview' ? '10 Baris Pertama' : `Seluruh ${parsedRows.length} Baris`}):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('preview')}
                      className={`px-2 py-0.5 rounded ${previewTab === 'preview' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      Ringkas (10)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('all')}
                      className={`px-2 py-0.5 rounded ${previewTab === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      Semua ({parsedRows.length})
                    </button>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-black/60 text-gray-400 border-b border-gray-800 sticky top-0">
                      <tr>
                        <th className="py-1.5 px-2.5">Kat</th>
                        <th className="py-1.5 px-2.5">Kode</th>
                        <th className="py-1.5 px-2.5">Deskripsi / Judul Pelanggaran</th>
                        <th className="py-1.5 px-2.5 text-right">Denda ($)</th>
                        <th className="py-1.5 px-2.5 text-center">Tahanan</th>
                        <th className="py-1.5 px-2.5 text-center">Impound</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-gray-300">
                      {(previewTab === 'preview' ? parsedRows.slice(0, 10) : parsedRows).map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-800/40">
                          <td className="py-1.5 px-2.5 font-bold text-blue-400">{p.cat}</td>
                          <td className="py-1.5 px-2.5 font-bold text-gray-100">{p.code}</td>
                          <td className="py-1.5 px-2.5 max-w-xs truncate text-gray-300" title={p.desc}>{p.desc}</td>
                          <td className="py-1.5 px-2.5 text-right text-emerald-400 font-bold">${p.fine.toLocaleString()}</td>
                          <td className="py-1.5 px-2.5 text-center text-amber-400 font-bold">{p.time > 0 ? `${p.time} Bln` : '-'}</td>
                          <td className="py-1.5 px-2.5 text-center text-purple-400 font-bold">{p.imp > 0 ? `Lvl ${p.imp}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-[#161B22] border-t border-gray-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-mono font-bold transition"
          >
            Batal
          </button>

          <button
            type="button"
            id="btn-confirm-import-pasal"
            disabled={parsedRows.length === 0}
            onClick={handleConfirmSubmit}
            className={`px-5 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition shadow-md ${
              parsedRows.length > 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 cursor-pointer'
                : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Terapkan Perubahan ({parsedRows.length} Pasal)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
