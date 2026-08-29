import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, FileSpreadsheet, Archive, FileText, Printer, 
  Download, Filter, Calendar, Users, Clock, Award, 
  CheckCircle2, AlertCircle, Copy, ChevronRight, Search, 
  Layers, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';
import { OfficerAccount } from '../types';
import { 
  DutySession, 
  OfficerAttendanceSummary,
  ExportDateRangeType,
  getSavedDutySessions,
  getDateRangeTimestamps,
  generateAttendanceSummaries,
  exportAttendanceToExcel,
  exportAttendanceToCSV,
  exportAttendanceToZip,
  exportAttendanceToHTML
} from '../utils/attendanceExport';
import { HSPD_LOGO_URL } from '../assets/logo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  roster: OfficerAccount[];
}

export const ExportAttendanceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  roster
}) => {
  const [rangeType, setRangeType] = useState<ExportDateRangeType>('current_week');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'hours' | 'rank' | 'name' | 'badge'>('hours');
  const [dutySessions, setDutySessions] = useState<DutySession[]>([]);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Load duty sessions
  useEffect(() => {
    if (isOpen) {
      setDutySessions(getSavedDutySessions());
    }
  }, [isOpen]);

  // Listen to remote or local duty session events
  useEffect(() => {
    const handleSessionsUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setDutySessions(e.detail);
      }
    };
    window.addEventListener('hspd-duty-sessions-updated', handleSessionsUpdate);
    return () => window.removeEventListener('hspd-duty-sessions-updated', handleSessionsUpdate);
  }, []);

  // Compute date range
  const { startMs, endMs, label: dateRangeLabel } = useMemo(() => {
    return getDateRangeTimestamps(rangeType, customStartDate, customEndDate);
  }, [rangeType, customStartDate, customEndDate]);

  // Extract unique divisions from roster
  const divisionsList = useMemo(() => {
    const set = new Set<string>();
    roster.forEach(r => {
      if (r.division) set.add(r.division);
    });
    return Array.from(set).sort();
  }, [roster]);

  // Generate complete attendance summaries
  const allSummaries = useMemo(() => {
    return generateAttendanceSummaries(roster, dutySessions, startMs, endMs);
  }, [roster, dutySessions, startMs, endMs]);

  // Filtered & Sorted summaries for preview and export
  const filteredSummaries = useMemo(() => {
    let list = [...allSummaries];

    // Filter by division
    if (selectedDivision !== 'ALL') {
      list = list.filter(s => s.division.toLowerCase() === selectedDivision.toLowerCase());
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.badge.toLowerCase().includes(q) ||
        s.rank.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'hours') {
        return b.totalDutyMinutes - a.totalDutyMinutes;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'badge') {
        return a.badge.localeCompare(b.badge, undefined, { numeric: true });
      }
      // Rank (preserve roster sequence or rank index)
      return 0;
    });

    return list;
  }, [allSummaries, selectedDivision, searchQuery, sortBy]);

  // Key metrics
  const totalOfficers = filteredSummaries.length;
  const activeOfficers = filteredSummaries.filter(s => s.totalDutyMinutes > 0).length;
  const totalAccumulatedMinutes = filteredSummaries.reduce((acc, s) => acc + s.totalDutyMinutes, 0);
  const totalHours = Math.floor(totalAccumulatedMinutes / 60);
  const remMinutes = totalAccumulatedMinutes % 60;
  const topOfficer = filteredSummaries.length > 0 && filteredSummaries[0].totalDutyMinutes > 0 ? filteredSummaries[0] : null;

  // Handle Export Actions
  const handleExportExcel = () => {
    try {
      const filename = exportAttendanceToExcel(filteredSummaries, dateRangeLabel, selectedDivision);
      setNotification({
        type: 'success',
        message: `✅ File Excel berhasil diunduh: ${filename}`
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (e: any) {
      alert(`Gagal mengekspor Excel: ${e.message}`);
    }
  };

  const handleExportCSV = () => {
    try {
      const filename = exportAttendanceToCSV(filteredSummaries, dateRangeLabel, selectedDivision);
      setNotification({
        type: 'success',
        message: `✅ File CSV berhasil diunduh: ${filename}`
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (e: any) {
      alert(`Gagal mengekspor CSV: ${e.message}`);
    }
  };

  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      const filename = await exportAttendanceToZip(filteredSummaries, dateRangeLabel, selectedDivision);
      setNotification({
        type: 'success',
        message: `📦 Paket ZIP (Excel + CSV + TXT + JSON) berhasil diunduh: ${filename}`
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (e: any) {
      alert(`Gagal membuat file ZIP: ${e.message}`);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportHTML = () => {
    try {
      const filename = exportAttendanceToHTML(filteredSummaries, dateRangeLabel, selectedDivision);
      setNotification({
        type: 'success',
        message: `🖨️ Dokumen Cetak / PDF HTML siap dibuka: ${filename}`
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (e: any) {
      alert(`Gagal membuat Dokumen HTML: ${e.message}`);
    }
  };

  const handleCopyDiscordSummary = () => {
    const lines: string[] = [
      `👮‍♂️ **[HSPD] LAPORAN REKAPITULASI ABSENSI & JAM DINAS**`,
      `📅 **Periode:** ${dateRangeLabel}`,
      `🏢 **Divisi:** ${selectedDivision === 'ALL' ? 'Semua Divisi' : selectedDivision}`,
      `👥 **Total Personel:** ${totalOfficers} | **Aktif Dinas:** ${activeOfficers} (${totalOfficers > 0 ? Math.round((activeOfficers / totalOfficers) * 100) : 0}%)`,
      `⏱️ **Akumulasi Jam Dinas:** ${totalHours} Jam ${remMinutes} Menit`,
      `--------------------------------------------------`,
      `**🏆 TOP 10 PETUGAS TERAKTIF:**`
    ];

    filteredSummaries.slice(0, 10).forEach((s, idx) => {
      lines.push(`${idx + 1}. [${s.badge}] **${s.name}** (${s.rank}) ➔ **${s.totalDutyFormatted}** (${s.attendanceStatus})`);
    });

    if (filteredSummaries.length > 10) {
      lines.push(`... dan ${filteredSummaries.length - 10} petugas lainnya tercatat dalam dokumen rekap.`);
    }

    lines.push(`--------------------------------------------------`);
    lines.push(`*Dokumen Resmi MDC/MDT High State Police Department*`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopyFeedback(true);
    setNotification({
      type: 'info',
      message: '📋 Ringkasan format Discord berhasil disalin ke clipboard!'
    });
    setTimeout(() => {
      setCopyFeedback(false);
      setNotification(null);
    }, 3500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#12161F] border border-blue-900/60 rounded-xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto font-mono text-gray-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <img
              src={HSPD_LOGO_URL}
              alt="HSPD Logo"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-contain border border-amber-500/40 bg-black/60 p-0.5"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Ekspor Absensi & Jam Dinas Mingguan
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold">
                  HIGH COMMAND EXPORT
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Unduh rekapitulasi kehadiran, akumulasi jam dinas personel, dan log patroli dalam format Excel, CSV, ZIP, atau Dokumen Cetak.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NOTIFICATION TOAST */}
        {notification && (
          <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 border animate-in slide-in-from-top-2 duration-150 ${
            notification.type === 'success' 
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
              : 'bg-blue-950/80 border-blue-700 text-blue-300'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{notification.message}</span>
          </div>
        )}

        {/* METRIC CARDS BANNER */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#1A2130] border border-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between text-gray-400">
              <span>Total Personel</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1">{totalOfficers} Petugas</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Terdaftar di Roster</div>
          </div>

          <div className="bg-[#1A2130] border border-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between text-gray-400">
              <span>Aktif Berdinas</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{activeOfficers} Petugas</div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {totalOfficers > 0 ? Math.round((activeOfficers / totalOfficers) * 100) : 0}% Partisipasi
            </div>
          </div>

          <div className="bg-[#1A2130] border border-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between text-gray-400">
              <span>Total Akumulasi</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-400 mt-1">{totalHours}j {remMinutes}m</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Jam Dinas Terdata</div>
          </div>

          <div className="bg-[#1A2130] border border-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between text-gray-400">
              <span>Top Officer</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-sm font-bold text-purple-300 mt-1 truncate" title={topOfficer ? topOfficer.name : '-'}>
              {topOfficer ? `${topOfficer.name}` : '-'}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {topOfficer ? `⚡ ${topOfficer.totalDutyFormatted}` : 'Belum ada data'}
            </div>
          </div>
        </div>

        {/* FILTER & PERIODE CONTROLS */}
        <div className="bg-[#161B26] border border-gray-800/90 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 border-b border-gray-800 pb-2">
            <Filter className="w-4 h-4" />
            <span>PILIHAN RENTANG WAKTU & FILTER DATA</span>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setRangeType('current_week')}
              className={`px-2.5 py-1.5 rounded-lg border font-bold transition flex items-center justify-center gap-1 ${
                rangeType === 'current_week'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-gray-800/80 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>⚡ Minggu Ini</span>
            </button>

            <button
              type="button"
              onClick={() => setRangeType('last_week')}
              className={`px-2.5 py-1.5 rounded-lg border font-bold transition flex items-center justify-center gap-1 ${
                rangeType === 'last_week'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-gray-800/80 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>📅 Minggu Lalu</span>
            </button>

            <button
              type="button"
              onClick={() => setRangeType('last_7_days')}
              className={`px-2.5 py-1.5 rounded-lg border font-bold transition flex items-center justify-center gap-1 ${
                rangeType === 'last_7_days'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-gray-800/80 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>⏱️ 7 Hari Terakhir</span>
            </button>

            <button
              type="button"
              onClick={() => setRangeType('last_14_days')}
              className={`px-2.5 py-1.5 rounded-lg border font-bold transition flex items-center justify-center gap-1 ${
                rangeType === 'last_14_days'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-gray-800/80 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>📆 14 Hari Terakhir</span>
            </button>

            <button
              type="button"
              onClick={() => setRangeType('current_month')}
              className={`px-2.5 py-1.5 rounded-lg border font-bold transition flex items-center justify-center gap-1 ${
                rangeType === 'current_month'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-gray-800/80 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>🗓️ Bulan Ini</span>
            </button>

            <button
              type="button"
              onClick={() => setRangeType('custom')}
              className={`px-2.5 py-1.5 rounded-lg border font-bold transition flex items-center justify-center gap-1 ${
                rangeType === 'custom'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                  : 'bg-gray-800/80 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>🎯 Kustom Tanggal</span>
            </button>
          </div>

          {/* Custom Date Inputs */}
          {rangeType === 'custom' && (
            <div className="flex flex-wrap items-center gap-3 p-2.5 bg-black/40 border border-amber-900/40 rounded-lg text-xs animate-in fade-in">
              <span className="text-amber-400 font-bold">Pilih Tanggal:</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[11px]">Dari:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white px-2 py-1 rounded text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[11px]">Sampai:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white px-2 py-1 rounded text-xs"
                />
              </div>
            </div>
          )}

          {/* Secondary Filters: Division & Search & Sorting */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div>
              <label className="block text-gray-400 text-[11px] mb-1">Filter Divisi:</label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Semua Divisi Kepolisian</option>
                {divisionsList.map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-[11px] mb-1">Urutan (Sorting):</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="hours">Jam Dinas Tertinggi (Top Active)</option>
                <option value="rank">Hierarki Pangkat Asli</option>
                <option value="name">Nama Petugas (A - Z)</option>
                <option value="badge">Nomor Badge / NIK</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-[11px] mb-1">Cari Personel:</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama / badge..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* PRIMARY DOWNLOAD / EXPORT ACTION BUTTONS */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-300 flex items-center justify-between">
            <span>FORMAT FILE UNDUHAN (EXPORT OPTIONS):</span>
            <span className="text-amber-400 text-[11px] font-normal">Periode: {dateRangeLabel}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* 1. EXCEL WORKBOOK (.XLSX) */}
            <button
              id="btn-export-excel-xlsx"
              type="button"
              onClick={handleExportExcel}
              className="p-3 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/70 hover:border-emerald-400 rounded-lg text-left transition group shadow-md flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-md">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                  EXCEL .XLSX
                </span>
              </div>
              <div>
                <div className="font-bold text-white text-xs group-hover:text-emerald-300 flex items-center gap-1">
                  <span>Unduh File Excel</span>
                  <Download className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Multi-sheet lengkap: Rekapitulasi + Rincian Log Shift
                </div>
              </div>
            </button>

            {/* 2. PAKET ZIP ARCHIVE (.ZIP) */}
            <button
              id="btn-export-zip-archive"
              type="button"
              onClick={handleExportZip}
              disabled={isExportingZip}
              className="p-3 bg-purple-950/70 hover:bg-purple-900 border border-purple-600/70 hover:border-purple-400 rounded-lg text-left transition group shadow-md flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-md">
                  <Archive className="w-5 h-5" />
                </div>
                <span className="text-[10px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded font-bold">
                  ZIP ARCHIVE
                </span>
              </div>
              <div>
                <div className="font-bold text-white text-xs group-hover:text-purple-300 flex items-center gap-1">
                  <span>{isExportingZip ? 'Mengompres...' : 'Unduh Paket ZIP'}</span>
                  <Download className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Excel (.xlsx) + CSV + TXT Summary + Raw JSON
                </div>
              </div>
            </button>

            {/* 3. CSV SPREADSHEET (.CSV) */}
            <button
              id="btn-export-csv-file"
              type="button"
              onClick={handleExportCSV}
              className="p-3 bg-blue-950/70 hover:bg-blue-900 border border-blue-600/70 hover:border-blue-400 rounded-lg text-left transition group shadow-md flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-md">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded font-bold">
                  CSV DATA
                </span>
              </div>
              <div>
                <div className="font-bold text-white text-xs group-hover:text-blue-300 flex items-center gap-1">
                  <span>Unduh File CSV</span>
                  <Download className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Format tabel standar untuk Google Sheets & Excel
                </div>
              </div>
            </button>

            {/* 4. PRINTABLE HTML / PDF */}
            <button
              id="btn-export-html-pdf"
              type="button"
              onClick={handleExportHTML}
              className="p-3 bg-amber-950/70 hover:bg-amber-900 border border-amber-600/70 hover:border-amber-400 rounded-lg text-left transition group shadow-md flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-md">
                  <Printer className="w-5 h-5" />
                </div>
                <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                  PRINT / PDF
                </span>
              </div>
              <div>
                <div className="font-bold text-white text-xs group-hover:text-amber-300 flex items-center gap-1">
                  <span>Cetak / Simpan PDF</span>
                  <Download className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Format dokumen resmi kepolisian siap cetak
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* PRATINJAU TABEL DATA (PREVIEW TABLE) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="font-bold text-gray-300 flex items-center gap-2">
              <span>PRATINJAU REKAPITULASI ABSENSI ({filteredSummaries.length} PERSONEL)</span>
            </div>

            <button
              type="button"
              onClick={handleCopyDiscordSummary}
              className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded border border-gray-700 text-[11px] flex items-center gap-1 transition"
            >
              <Copy className="w-3 h-3 text-amber-400" />
              <span>{copyFeedback ? 'Tersalin!' : 'Salin Format Discord'}</span>
            </button>
          </div>

          <div className="border border-gray-800 rounded-lg overflow-hidden bg-black/40">
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#161B26] text-gray-400 text-[11px] sticky top-0 border-b border-gray-800">
                  <tr>
                    <th className="py-2 px-3">No</th>
                    <th className="py-2 px-3">Badge</th>
                    <th className="py-2 px-3">Nama Petugas</th>
                    <th className="py-2 px-3">Pangkat</th>
                    <th className="py-2 px-3">Divisi</th>
                    <th className="py-2 px-3">Total Jam Dinas</th>
                    <th className="py-2 px-3">Shift</th>
                    <th className="py-2 px-3">Hari</th>
                    <th className="py-2 px-3 text-right">Predikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono">
                  {filteredSummaries.map((s, idx) => {
                    let badgeColor = 'bg-gray-800 text-gray-400 border-gray-700';
                    if (s.attendanceStatus === 'SANGAT AKTIF') badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-800';
                    else if (s.attendanceStatus === 'AKTIF') badgeColor = 'bg-blue-950 text-blue-300 border-blue-800';
                    else if (s.attendanceStatus === 'CUKUP') badgeColor = 'bg-amber-950 text-amber-300 border-amber-800';
                    else if (s.attendanceStatus === 'KURANG AKTIF') badgeColor = 'bg-rose-950 text-rose-300 border-rose-800';

                    return (
                      <tr key={s.badge + idx} className="hover:bg-gray-800/40 transition">
                        <td className="py-2 px-3 text-gray-500 text-[11px]">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-amber-400">{s.badge}</td>
                        <td className="py-2 px-3 font-bold text-gray-200">{s.name}</td>
                        <td className="py-2 px-3 text-gray-400 text-[11px]">{s.rank}</td>
                        <td className="py-2 px-3 text-gray-400 text-[11px]">{s.division}</td>
                        <td className="py-2 px-3 font-bold text-emerald-400">{s.totalDutyFormatted}</td>
                        <td className="py-2 px-3 text-gray-300">{s.totalShifts}x</td>
                        <td className="py-2 px-3 text-gray-300">{s.daysActiveCount} Hari</td>
                        <td className="py-2 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                            {s.attendanceStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredSummaries.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-gray-500">
                        Tidak ada data personel yang cocok dengan filter yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-800 text-xs text-gray-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-emerald-400">●</span>
            <span>MDT Integrated Attendance System • High State Police Department</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition font-bold"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
