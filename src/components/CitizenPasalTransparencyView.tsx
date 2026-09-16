import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scale, Search, AlertCircle, CheckCircle2, Shield, 
  FileText, DollarSign, Clock, Car, Copy, Check, 
  RotateCcw, Sparkles, Filter, ChevronDown, ChevronUp,
  Info, ExternalLink, HelpCircle, ShieldAlert, ArrowRight, X
} from 'lucide-react';
import { PasalItem, CategoryInfo } from '../types';
import { OFFENCE_CATEGORIES, getSavedPasalList } from '../data/pasalData';

interface Props {
  onBackToServices?: () => void;
  initialSelectedCodes?: string[];
}

export const CitizenPasalTransparencyView: React.FC<Props> = ({
  onBackToServices,
  initialSelectedCodes = []
}) => {
  // Master Pasal Data (reactive to system updates)
  const [pasalList, setPasalList] = useState<PasalItem[]>(() => getSavedPasalList());

  useEffect(() => {
    const handleUpdate = () => {
      setPasalList(getSavedPasalList());
    };
    window.addEventListener('hspd-pasal-updated', handleUpdate);
    return () => window.removeEventListener('hspd-pasal-updated', handleUpdate);
  }, []);

  // Filter & Search States
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'code' | 'fine_asc' | 'fine_desc' | 'time_desc'>('code');

  // Selected Pasal Codes for calculation simulation
  const [selectedCodes, setSelectedCodes] = useState<string[]>(initialSelectedCodes);
  const [isCooperative, setIsCooperative] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [showLegalRights, setShowLegalRights] = useState<boolean>(false);

  // Toggle selection
  const handleTogglePasal = (code: string) => {
    setSelectedCodes(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSelectAllCategory = (catKey: string) => {
    const catCodes = pasalList.filter(p => p.cat === catKey).map(p => p.code);
    setSelectedCodes(prev => {
      const allSelected = catCodes.every(c => prev.includes(c));
      if (allSelected) {
        return prev.filter(c => !catCodes.includes(c));
      } else {
        const set = new Set([...prev, ...catCodes]);
        return Array.from(set);
      }
    });
  };

  const handleResetCalculation = () => {
    setSelectedCodes([]);
    setIsCooperative(false);
  };

  // Quick Preset Scenarios for Citizen Education
  const PRESET_SCENARIOS = [
    {
      title: '🚦 Razia Standar: Tanpa SIM & Plat',
      desc: 'Pelanggaran kelengkapan berkendara standar saat razia rutin',
      codes: ['A01', 'A04']
    },
    {
      title: '🏎️ Balap Liar & Knalpot Api',
      desc: 'Ugal-ugalan, balap jalanan ilegal, dan knalpot brong',
      codes: ['A02', 'A11', 'A12']
    },
    {
      title: '👊 Keributan di Tempat Umum',
      desc: 'Berkelahi di area publik dan mengganggu ketertiban umum',
      codes: ['B06', 'B07']
    },
    {
      title: '🚗 Pencurian Kendaraan (Curanmor)',
      desc: 'Mencuri mobil/motor orang lain dan membawanya ugal-ugalan',
      codes: ['B08', 'A02']
    },
    {
      title: '🔫 Bawa Senpi Ilegal & Peluru',
      desc: 'Membawa senjata api tanpa izin dinas/lisensi kepolisian',
      codes: ['E01', 'E03']
    }
  ];

  const handleApplyPreset = (codes: string[]) => {
    // Only pick codes that exist in current pasalList
    const validCodes = codes.filter(code => pasalList.some(p => p.code === code));
    setSelectedCodes(validCodes);
  };

  // Filtered & Sorted Pasal List
  const filteredPasal = useMemo(() => {
    let result = pasalList;

    if (selectedCategory !== 'ALL') {
      result = result.filter(p => p.cat === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.code.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        p.cat.toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      if (sortBy === 'fine_desc') return b.fine - a.fine;
      if (sortBy === 'fine_asc') return a.fine - b.fine;
      if (sortBy === 'time_desc') return b.time - a.time;
      return a.code.localeCompare(b.code, undefined, { numeric: true });
    });
  }, [pasalList, selectedCategory, searchQuery, sortBy]);

  // Selected Pasal Objects
  const selectedItems = useMemo(() => {
    return selectedCodes
      .map(code => pasalList.find(p => p.code === code))
      .filter((p): p is PasalItem => p !== undefined);
  }, [selectedCodes, pasalList]);

  // Calculations: Count, Total Fine, Jail Time, Impounds
  const calculationResults = useMemo(() => {
    const count = selectedItems.length;
    const baseFine = selectedItems.reduce((acc, curr) => acc + (curr.fine || 0), 0);
    const baseTime = selectedItems.reduce((acc, curr) => acc + (curr.time || 0), 0);
    const maxImpoundDays = selectedItems.reduce((max, curr) => Math.max(max, curr.imp || 0), 0);
    const impoundCount = selectedItems.filter(p => (p.imp || 0) > 0).length;

    // Cooperative discount: 20% discount on fine and jail time as per HSPD guideline
    const fineDiscount = isCooperative ? Math.round(baseFine * 0.2) : 0;
    const timeDiscount = isCooperative ? Math.round(baseTime * 0.2) : 0;

    const finalFine = Math.max(0, baseFine - fineDiscount);
    const finalTime = Math.max(0, baseTime - timeDiscount);

    // Grouping by category for visual analytics
    const categoryBreakdown: Record<string, { count: number; subtotalFine: number }> = {};
    selectedItems.forEach(item => {
      if (!categoryBreakdown[item.cat]) {
        categoryBreakdown[item.cat] = { count: 0, subtotalFine: 0 };
      }
      categoryBreakdown[item.cat].count += 1;
      categoryBreakdown[item.cat].subtotalFine += item.fine || 0;
    });

    return {
      count,
      baseFine,
      baseTime,
      fineDiscount,
      timeDiscount,
      finalFine,
      finalTime,
      maxImpoundDays,
      impoundCount,
      categoryBreakdown
    };
  }, [selectedItems, isCooperative]);

  // Copy Calculation Summary for Citizen Reference
  const handleCopySummary = () => {
    if (selectedItems.length === 0) return;

    const lines: string[] = [
      '==========================================',
      '⚖️ HASIL KALKULASI PASAL & DENDA KUHP (HSPD)',
      '==========================================',
      `Jumlah Pasal Terpilih : ${calculationResults.count} Pelanggaran`,
      `Total Denda Resmi     : $${calculationResults.finalFine.toLocaleString('id-ID')}`,
      `Total Masa Penjara    : ${calculationResults.finalTime} Bulan`,
      calculationResults.maxImpoundDays > 0 
        ? `Status Kendaraan      : Disita (Impound Maks. ${calculationResults.maxImpoundDays} Hari)` 
        : 'Status Kendaraan      : Bebas Sitaan',
      isCooperative ? 'Keterangan Khusus     : Diskon Kooperatif 20% Diterapkan' : '',
      '------------------------------------------',
      'RINCIAN PASAL DILANGGAR:',
      ...selectedItems.map((item, idx) => 
        `${idx + 1}. [${item.code}] ${item.desc} -> Denda: $${item.fine.toLocaleString('id-ID')} | Penjara: ${item.time} Bulan${item.imp ? ` | Impound: ${item.imp}h` : ''}`
      ),
      '==========================================',
      'Informasi resmi transparansi hukum HighState Police Department.',
      'Denda resmi wajib disetorkan melalui loket pembayaran resmi.'
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* ========================================================= */}
      {/* 1. HERO HEADER BANNER                                      */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-r from-blue-950/80 via-[#0F141E] to-cyan-950/70 border border-blue-800/50 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-10 pointer-events-none">
          <Scale className="w-80 h-80 text-blue-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-blue-600/20 border border-blue-500/40 rounded-2xl text-blue-400 shrink-0 shadow-inner">
              <Scale className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  KITAB UNDANG-UNDANG HUKUM PIDANA (KUHP) & KALKULATOR DENDA
                </h2>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2.5 py-0.5 rounded-full font-bold">
                  TRANSPARANSI PUBLIK
                </span>
              </div>
              <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                Portal keterbukaan informasi hukum bagi seluruh masyarakat. Pelajari daftar resmi pasal pelanggaran KUHP, 
                cek masa kurungan penjara, serta lakukan simulasi perhitungan <strong className="text-amber-300 font-semibold">jumlah pasal dan total nominal denda resmi</strong> secara transparan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            {onBackToServices && (
              <button
                type="button"
                id="btn-back-to-services"
                onClick={onBackToServices}
                className="px-3.5 py-2 bg-gray-800/80 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold border border-gray-700 transition flex items-center gap-1.5"
              >
                <span>Kembali ke Layanan</span>
              </button>
            )}
            <button
              type="button"
              id="btn-toggle-legal-rights"
              onClick={() => setShowLegalRights(!showLegalRights)}
              className="px-3.5 py-2 bg-blue-900/60 hover:bg-blue-800/80 text-blue-200 border border-blue-700/60 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <Info className="w-4 h-4 text-blue-300" />
              <span>{showLegalRights ? 'Tutup Hak Warga' : 'Hak & Perlindungan Warga'}</span>
            </button>
          </div>
        </div>

        {/* LEGAL RIGHTS EDUCATIONAL ACCORDION */}
        {showLegalRights && (
          <div className="mt-5 pt-5 border-t border-blue-900/50 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-gray-300 animate-fadeIn">
            <div className="bg-black/40 border border-blue-800/40 p-3.5 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Hak Mengetahui Pasal</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Setiap warga berhak meminta petugas kepolisian menyebutkan pasal KUHP yang dilanggar serta alasan penilangan/penahanan sebelum menandatangani berkas.
              </p>
            </div>

            <div className="bg-black/40 border border-blue-800/40 p-3.5 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Anti Pungli & Denda Siluman</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Nominal denda wajib sesuai KUHP resmi. Petugas dilarang menaikkan tarif di luar undang-undang atau meminta pembayaran tunai di tempat tanpa bukti tilang CAD/MDT resmi.
              </p>
            </div>

            <div className="bg-black/40 border border-blue-800/40 p-3.5 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Keringanan Sikap Kooperatif</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Warga yang bersikap kooperatif, tidak melakukan perlawanan, dan jujur selama pemeriksaan berhak memperoleh pengurangan denda dan masa kurungan hingga 20%.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. LIVE RESULT / CALCULATION SUMMARY BOARD (HERO METRIC)   */}
      {/* "melihat kalkulasi atau hasil berapa jumlahnya & total denda"*/}
      {/* ========================================================= */}
      <div 
        id="citizen-pasal-calculation-summary" 
        className="bg-[#111622] border-2 border-blue-600/40 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                HASIL KALKULASI & ESTIMASI SANKSI
              </h3>
              <p className="text-[11px] text-gray-400">
                Pilih satu atau lebih pasal di tabel bawah untuk menghitung jumlah dan total dendanya secara instan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cooperative checkbox */}
            <label className="flex items-center gap-2 text-xs bg-[#0B0E14] border border-gray-700 hover:border-blue-500 px-3 py-1.5 rounded-lg cursor-pointer transition select-none">
              <input
                type="checkbox"
                id="checkbox-cooperative"
                checked={isCooperative}
                onChange={(e) => setIsCooperative(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded bg-gray-900 border-gray-700 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-gray-200 font-medium">Sikap Kooperatif (-20%)</span>
            </label>

            {calculationResults.count > 0 && (
              <>
                <button
                  type="button"
                  id="btn-copy-citizen-calculation"
                  onClick={handleCopySummary}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow"
                  title="Salin hasil rincian kalkulasi denda"
                >
                  {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSummary ? 'Tersalin!' : 'Salin Hasil'}</span>
                </button>

                <button
                  type="button"
                  id="btn-reset-citizen-calculation"
                  onClick={handleResetCalculation}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-rose-300 border border-rose-900/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  title="Kosongkan pilihan kalkulator"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reset</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 4 PRIMARY METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. JUMLAH PASAL */}
          <div className={`p-4 rounded-xl border transition ${
            calculationResults.count > 0 
              ? 'bg-[#151D2C] border-blue-500/60 shadow-lg' 
              : 'bg-[#0D1117] border-gray-800'
          }`}>
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block font-bold">
              1. JUMLAH PASAL DIPILIH
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className={`text-2xl sm:text-3xl font-black font-mono ${
                calculationResults.count > 0 ? 'text-white' : 'text-gray-500'
              }`}>
                {calculationResults.count}
              </span>
              <span className="text-xs text-gray-400 font-semibold">Pelanggaran</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {calculationResults.count > 0 
                ? `${calculationResults.count} pasal aktif dalam perhitungan` 
                : 'Belum ada pasal yang dipilih'}
            </p>
          </div>

          {/* 2. TOTAL DENDA */}
          <div className={`p-4 rounded-xl border transition ${
            calculationResults.count > 0 
              ? 'bg-amber-950/40 border-amber-500/70 shadow-lg' 
              : 'bg-[#0D1117] border-gray-800'
          }`}>
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-bold flex items-center justify-between">
              <span>2. TOTAL NOMINAL DENDA</span>
              {isCooperative && calculationResults.fineDiscount > 0 && (
                <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.2 rounded font-bold">
                  HEMAT ${calculationResults.fineDiscount.toLocaleString('id-ID')}
                </span>
              )}
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
                ${calculationResults.finalFine.toLocaleString('id-ID')}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-mono">
              {isCooperative && calculationResults.fineDiscount > 0 ? (
                <span>
                  Normal: <span className="line-through text-gray-500">${calculationResults.baseFine.toLocaleString('id-ID')}</span> (Diskon 20%)
                </span>
              ) : (
                <span>Tarif resmi berdasarkan KUHP HSPD</span>
              )}
            </p>
          </div>

          {/* 3. TOTAL KURUNGAN PENJARA */}
          <div className={`p-4 rounded-xl border transition ${
            calculationResults.baseTime > 0 
              ? 'bg-rose-950/40 border-rose-600/60 shadow-lg' 
              : 'bg-[#0D1117] border-gray-800'
          }`}>
            <span className="text-[10px] font-mono text-rose-300 uppercase tracking-wider block font-bold flex items-center justify-between">
              <span>3. MASA HUKUMAN PENJARA</span>
              {isCooperative && calculationResults.timeDiscount > 0 && (
                <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.2 rounded font-bold">
                  -{calculationResults.timeDiscount} bln
                </span>
              )}
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className={`text-2xl sm:text-3xl font-black font-mono ${
                calculationResults.finalTime > 0 ? 'text-rose-400' : 'text-gray-500'
              }`}>
                {calculationResults.finalTime}
              </span>
              <span className="text-xs text-gray-400 font-semibold">Bulan Kurungan</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-mono">
              {calculationResults.finalTime > 0 
                ? 'Hukuman penjara di Lembaga Pemasyarakatan (LP)' 
                : 'Bebas kurungan fisik (Hanya Denda)'}
            </p>
          </div>

          {/* 4. STATUS KENDARAAN IMPOUND */}
          <div className={`p-4 rounded-xl border transition ${
            calculationResults.impoundCount > 0 
              ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg' 
              : 'bg-[#0D1117] border-gray-800'
          }`}>
            <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider block font-bold">
              4. PENYITAAN KENDARAAN
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className={`text-2xl sm:text-3xl font-black font-mono ${
                calculationResults.impoundCount > 0 ? 'text-cyan-300' : 'text-emerald-400'
              }`}>
                {calculationResults.impoundCount > 0 ? `${calculationResults.maxImpoundDays} Hari` : 'Tidak Ada'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {calculationResults.impoundCount > 0 
                ? `${calculationResults.impoundCount} pasal mewajibkan kendaraan disita ke Impound Lot` 
                : 'Kendaraan tidak disita oleh kepolisian'}
            </p>
          </div>
        </div>

        {/* ITEMIZED BREAKDOWN TABLE (When at least 1 item is selected) */}
        {calculationResults.count > 0 && (
          <div className="bg-[#0B0E14] border border-gray-800 rounded-xl overflow-hidden animate-fadeIn">
            <div className="px-4 py-2.5 bg-[#151B26] border-b border-gray-800 flex items-center justify-between text-xs">
              <span className="font-bold text-gray-200 font-mono flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Rincian Itemized Denda Pelanggaran ({calculationResults.count} Pasal):
              </span>
              <span className="text-[11px] text-gray-400">
                Klik ikon silang (<X className="w-3 h-3 inline text-red-400" />) untuk menghapus pasal dari kalkulasi
              </span>
            </div>

            <div className="divide-y divide-gray-800/80 max-h-60 overflow-y-auto">
              {selectedItems.map((item, idx) => (
                <div 
                  key={item.code} 
                  className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-[#111722] transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-gray-500 text-[11px] w-5 text-right">{idx + 1}.</span>
                    <span className="font-mono font-bold text-amber-400 bg-amber-950/70 border border-amber-800/60 px-2 py-0.5 rounded text-[11px] shrink-0">
                      {item.code}
                    </span>
                    <span className="text-gray-200 font-medium truncate">
                      {item.desc}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono text-right">
                    <div>
                      <span className="text-amber-300 font-bold block">
                        ${item.fine.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {item.time > 0 ? `${item.time} bln penjara` : '0 bln'}
                        {item.imp > 0 ? ` • Impound ${item.imp}h` : ''}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTogglePasal(item.code)}
                      title={`Hapus ${item.code} dari kalkulasi`}
                      className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-950/50 rounded transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Row Footer */}
            <div className="px-4 py-3 bg-[#111622] border-t border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-gray-400">
                <span>Subtotal ({calculationResults.count} Pasal): </span>
                <span className="font-mono text-white font-bold">${calculationResults.baseFine.toLocaleString('id-ID')}</span>
                {isCooperative && (
                  <span className="text-emerald-400 ml-2 font-mono">
                    (Diskon Kooperatif: -${calculationResults.fineDiscount.toLocaleString('id-ID')})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 font-mono">
                <span className="text-gray-400 text-xs">TOTAL FINAL:</span>
                <span className="text-base font-black text-amber-300">
                  ${calculationResults.finalFine.toLocaleString('id-ID')}
                </span>
                <span className="text-gray-400 text-xs ml-1">
                  & {calculationResults.finalTime} Bulan Penjara
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. PRESET SIMULASI KASUS CEPAT (WARGA BELAJAR KASUS)       */}
      {/* ========================================================= */}
      <div className="bg-[#0F141E] border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-300 font-mono">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>SIMULASI CEPAT: CONTOH KASUS PELANGGARAN UMUM MASYARAKAT</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {PRESET_SCENARIOS.map((scenario, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(scenario.codes)}
              className="p-3 bg-[#151B26] hover:bg-[#1A2333] border border-gray-800 hover:border-blue-500 rounded-xl text-left transition group space-y-1"
            >
              <div className="font-bold text-xs text-white group-hover:text-blue-300 transition">
                {scenario.title}
              </div>
              <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">
                {scenario.desc}
              </p>
              <div className="pt-1 flex items-center gap-1 font-mono text-[10px] text-amber-400">
                <span>{scenario.codes.length} Pasal:</span>
                <span className="text-gray-300 font-bold">{scenario.codes.join(', ')}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. KATALOG & DAFTAR PASAL KUHP LENGKAP                    */}
      {/* "bagian tampilan warga memperlihatkan pasal"              */}
      {/* ========================================================= */}
      <div className="bg-[#0F141E] border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              DAFTAR PASAL RESMI KUHP HSPD ({pasalList.length} PASAL)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Klik pada baris kartu pasal untuk memilih atau menghapus dari kalkulator denda di atas.
            </p>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="input-search-pasal-citizen"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pasal, nama, atau kata kunci..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#0B0E14] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              id="select-sort-pasal-citizen"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0B0E14] border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-1.5 outline-none font-mono focus:border-blue-500"
            >
              <option value="code">Urutkan Kode (A-Z)</option>
              <option value="fine_desc">Denda Terbesar ($)</option>
              <option value="fine_asc">Denda Terkecil ($)</option>
              <option value="time_desc">Penjara Terlama</option>
            </select>
          </div>
        </div>

        {/* CATEGORY TABS BAR */}
        <div className="flex overflow-x-auto gap-1.5 pb-2 text-xs scrollbar-none font-medium">
          {OFFENCE_CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.key;
            const countInCat = cat.key === 'ALL' 
              ? pasalList.length 
              : pasalList.filter(p => p.cat === cat.key).length;
            
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/40 ring-1 ring-blue-400'
                    : 'bg-[#151B26] text-gray-400 hover:text-gray-200 hover:bg-gray-800/80 border border-gray-800'
                }`}
              >
                <span>{cat.title}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-blue-900 text-blue-200' : 'bg-[#0B0E14] text-gray-400'
                }`}>
                  {countInCat}
                </span>
              </button>
            );
          })}
        </div>

        {/* QUICK CATEGORY SELECTION BUTTON */}
        {selectedCategory !== 'ALL' && (
          <div className="flex items-center justify-between text-xs bg-[#0B0E14] px-3.5 py-2 rounded-xl border border-gray-800">
            <span className="text-gray-400">
              Kategori: <strong className="text-white">{OFFENCE_CATEGORIES.find(c => c.key === selectedCategory)?.title}</strong>
              <span className="ml-2 text-gray-500">({filteredPasal.length} Pasal ditemukan)</span>
            </span>

            <button
              type="button"
              onClick={() => handleSelectAllCategory(selectedCategory)}
              className="text-blue-400 hover:text-blue-300 font-bold text-[11px] transition"
            >
              Pilih / Batal Pilih Semua di Kategori Ini
            </button>
          </div>
        )}

        {/* ARTICLES GRID */}
        {filteredPasal.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredPasal.map(item => {
              const isChecked = selectedCodes.includes(item.code);
              const catInfo = OFFENCE_CATEGORIES.find(c => c.key === item.cat);

              return (
                <div
                  key={item.code}
                  id={`citizen-pasal-card-${item.code}`}
                  onClick={() => handleTogglePasal(item.code)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-3 ${
                    isChecked
                      ? 'bg-[#162032] border-blue-500 shadow-md ring-1 ring-blue-500/50 scale-[1.01]'
                      : 'bg-[#131823] border-gray-800 hover:border-gray-700 hover:bg-[#171D2B]'
                  }`}
                >
                  <div className="space-y-2">
                    {/* TOP ROW: CODE, CHECKBOX, CATEGORY */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by container onClick
                          className="w-4 h-4 text-blue-600 rounded bg-gray-900 border-gray-700 focus:ring-blue-500 pointer-events-none"
                        />
                        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                          isChecked 
                            ? 'bg-blue-600 text-white border-blue-400' 
                            : 'bg-black/50 text-amber-300 border-gray-700'
                        }`}>
                          {item.code}
                        </span>
                      </div>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${catInfo?.badgeColor || 'bg-gray-800 text-gray-300'}`}>
                        Kat. {item.cat}
                      </span>
                    </div>

                    {/* DESCRIPTION */}
                    <p className={`text-xs font-semibold leading-relaxed ${
                      isChecked ? 'text-white' : 'text-gray-200'
                    }`}>
                      {item.desc}
                    </p>
                  </div>

                  {/* BOTTOM ROW: FINE, JAIL, IMPOUND */}
                  <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-300 font-bold text-sm">
                        ${item.fine.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1" title="Masa Kurungan Penjara">
                        <Clock className="w-3 h-3 text-rose-400" />
                        <span>{item.time} bln</span>
                      </span>

                      {item.imp > 0 && (
                        <span className="flex items-center gap-1 text-cyan-300" title={`Sita Kendaraan: ${item.imp} Hari`}>
                          <Car className="w-3 h-3 text-cyan-400" />
                          <span>{item.imp}h</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 space-y-2 bg-[#0B0E14] rounded-xl border border-gray-800">
            <Search className="w-8 h-8 mx-auto text-gray-600" />
            <p className="text-sm font-semibold text-gray-300">Tidak ada pasal yang cocok dengan pencarian "{searchQuery}"</p>
            <p className="text-xs text-gray-500">Coba ganti kata kunci atau pilih kategori "Semua Kategori".</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="mt-2 px-3 py-1.5 bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 border border-blue-500/50 rounded-lg text-xs font-semibold transition"
            >
              Reset Filter Pencarian
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 5. FOOTER TRANSPARENCY NOTICE                             */}
      {/* ========================================================= */}
      <div className="bg-[#0B0E14] border border-gray-800/90 rounded-xl p-4 text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            Sumber Hukum: <strong>Kitab Undang-Undang Hukum Pidana (KUHP) & SOP Penindakan HighState Police Department (HSPD)</strong>.
          </span>
        </div>
        <span className="text-[11px] font-mono text-gray-500">
          Versi Regulasi: KUHP-v1.4 • Hak Cipta Publik Bebas Akses Warga
        </span>
      </div>
    </div>
  );
};
