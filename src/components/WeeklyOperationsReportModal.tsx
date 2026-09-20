import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  Clock,
  Shield,
  Filter,
  CheckCircle2,
  Car,
  FolderOpen,
  Boxes,
  AlertCircle,
  Copy,
  Printer,
  ChevronDown
} from 'lucide-react';
import { OfficerAccount } from '../types';
import {
  DutySession,
  getSavedDutySessions,
  getWeeklyOperationsSummary,
  exportWeeklyOperationsToExcel,
  exportWeeklyOperationsToDocument,
  ExportDateRangeType
} from '../utils/attendanceExport';
import { HSPD_LOGO_URL } from '../assets/logo';

interface WeeklyOperationsReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  roster: OfficerAccount[];
}

export const WeeklyOperationsReportModal: React.FC<WeeklyOperationsReportModalProps> = ({
  isOpen,
  onClose,
  roster
}) => {
  const [rangeType, setRangeType] = useState<ExportDateRangeType>('current_week');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // 1. Calculate Start and End Miliseconds
  const { startMs, endMs, dateRangeLabel } = useMemo(() => {
    const now = new Date();
    let s = new Date(now);
    let e = new Date(now);

    if (rangeType === 'current_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      s = new Date(now.setDate(diff));
      s.setHours(0, 0, 0, 0);
      e = new Date();
      e.setHours(23, 59, 59, 999);
    } else if (rangeType === 'last_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
      s = new Date(now.setDate(diff));
      s.setHours(0, 0, 0, 0);
      e = new Date(s);
      e.setDate(e.getDate() + 6);
      e.setHours(23, 59, 59, 999);
    } else if (rangeType === 'last_7_days') {
      s.setDate(s.getDate() - 7);
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
    } else if (rangeType === 'last_14_days') {
      s.setDate(s.getDate() - 14);
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
    } else if (rangeType === 'current_month') {
      s = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (rangeType === 'all_time') {
      s = new Date(2024, 0, 1, 0, 0, 0, 0);
      e = new Date(2030, 11, 31, 23, 59, 59, 999);
    } else if (rangeType === 'custom') {
      s = new Date(customStart + 'T00:00:00');
      e = new Date(customEnd + 'T23:59:59');
    }

    const startStr = s.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const endStr = e.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const label = rangeType === 'all_time' ? 'Seluruh Riwayat (All Time)' : `${startStr} s/d ${endStr}`;

    return {
      startMs: s.getTime(),
      endMs: e.getTime(),
      dateRangeLabel: label
    };
  }, [rangeType, customStart, customEnd]);

  // 2. Load sessions & generate aggregate summary
  const rawSessions: DutySession[] = useMemo(() => {
    return getSavedDutySessions();
  }, [isOpen]);

  const summary = useMemo(() => {
    return getWeeklyOperationsSummary(roster, rawSessions, startMs, endMs, dateRangeLabel);
  }, [roster, rawSessions, startMs, endMs, dateRangeLabel]);

  // Divisions list
  const divisionsList = useMemo(() => {
    const set = new Set<string>();
    roster.forEach(r => {
      if (r.division) set.add(r.division);
    });
    return Array.from(set).sort();
  }, [roster]);

  // Filtered breakdown
  const filteredBreakdown = useMemo(() => {
    let list = summary.officerBreakdown;
    if (selectedDivision !== 'ALL') {
      list = list.filter(o => o.division.toLowerCase() === selectedDivision.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(o =>
        o.name.toLowerCase().includes(q) ||
        o.badge.toLowerCase().includes(q) ||
        o.rank.toLowerCase().includes(q)
      );
    }
    return list;
  }, [summary, selectedDivision, searchQuery]);

  // Export handlers
  const handleExportExcel = () => {
    try {
      const filename = exportWeeklyOperationsToExcel(summary, selectedDivision);
      setNotification({
        type: 'success',
        message: `✅ File Excel "${filename}" berhasil diunduh!`
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Gagal mengekspor Excel: ${err?.message || err}`
      });
    }
  };

  const handleExportDocument = () => {
    try {
      const filename = exportWeeklyOperationsToDocument(summary, selectedDivision);
      setNotification({
        type: 'success',
        message: `✅ Dokumen resmi cetak "${filename}" berhasil dibuat!`
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Gagal mencetak dokumen: ${err?.message || err}`
      });
    }
  };

  const handleCopyDiscordSummary = () => {
    const lines: string[] = [
      `📊 **[HSPD] REKAPITULASI OPERASIONAL MINGGUAN KEPOLISIAN**`,
      `📅 **Periode:** ${summary.periodLabel}`,
      `🏢 **Divisi:** ${selectedDivision === 'ALL' ? 'Semua Divisi' : selectedDivision}`,
      `--------------------------------------------------`,
      `⏱️ **Akumulasi Duty:** ${summary.totalDutyHours} Jam ${summary.totalDutyMinutes % 60} Menit (${summary.totalDutyOfficers} Petugas Aktif)`,
      `📑 **Upload Tilang:** ${summary.totalCitationsCount} Berkas (Total Denda: $${summary.totalCitationsFine.toLocaleString()})`,
      `🚗 **Upload Impound:** ${summary.totalImpoundsCount} Kendaraan (Biaya Sita: $${summary.totalImpoundsFee.toLocaleString()})`,
      `📁 **Upload Kasus:** ${summary.totalCasesCount} Kasus Investigasi`,
      `📦 **Upload Eviden:** ${summary.totalEvidenceCount} Barang Bukti Terdaftar`,
      `--------------------------------------------------`,
      `**🏆 TOP KONTRIBUTOR OPERASIONAL MINGGU INI:**`
    ];

    const sortedByDuty = [...filteredBreakdown].sort((a, b) => b.dutyMinutes - a.dutyMinutes);
    sortedByDuty.slice(0, 5).forEach((o, idx) => {
      lines.push(`${idx + 1}. [${o.badge}] **${o.name}** ➔ Duty: ${o.dutyHoursFormatted} | Tilang: ${o.citationsCount} | Impound: ${o.impoundsCount} | Kasus: ${o.casesCount} | Eviden: ${o.evidenceCount}`);
    });

    lines.push(`--------------------------------------------------`);
    lines.push(`*Dokumen Resmi MDC/MDT High State Police Department*`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopyFeedback(true);
    setNotification({
      type: 'info',
      message: '📋 Ringkasan operasional format Discord berhasil disalin ke clipboard!'
    });
    setTimeout(() => {
      setCopyFeedback(false);
      setNotification(null);
    }, 3500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#12161F] border border-cyan-800/60 rounded-xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto font-mono text-gray-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <img
              src={HSPD_LOGO_URL}
              alt="HSPD Logo"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-contain border border-cyan-500/40 bg-black/60 p-0.5"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Rekap Data Mingguan Operasional Personel
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  HIGH COMMAND REPORT
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Rekap akumulasi duty, upload surat tilang, sita kendaraan (impound), berkas kasus, dan eviden barang bukti berupa Excel / Dokumen resmi.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white bg-gray-800/80 hover:bg-gray-700 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Notifications */}
        {notification && (
          <div className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300'
              : notification.type === 'info'
              ? 'bg-cyan-950/80 border border-cyan-500 text-cyan-300'
              : 'bg-rose-950/80 border border-rose-500 text-rose-300'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
        )}

        {/* TOP STATS CARDS: 5 PILLARS (DUTY, TILANG, IMPOUND, KASUS, EVIDEN) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          {/* 1. Jam Duty */}
          <div className="bg-[#182030] border border-blue-900/60 rounded-lg p-3">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px] font-semibold">1. Jam Duty</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-lg font-bold text-blue-300 mt-1">
              {summary.totalDutyHours}j {summary.totalDutyMinutes % 60}m
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              {summary.totalDutyOfficers} Personel Aktif
            </div>
          </div>

          {/* 2. Upload Tilang */}
          <div className="bg-[#182030] border border-amber-900/60 rounded-lg p-3">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px] font-semibold">2. Upload Tilang</span>
              <FileText className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-amber-300 mt-1">
              {summary.totalCitationsCount} <span className="text-xs font-normal text-amber-400">Berkas</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              ${summary.totalCitationsFine.toLocaleString()} Total Denda
            </div>
          </div>

          {/* 3. Upload Impound */}
          <div className="bg-[#182030] border border-red-900/60 rounded-lg p-3">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px] font-semibold">3. Upload Impound</span>
              <Car className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-lg font-bold text-rose-300 mt-1">
              {summary.totalImpoundsCount} <span className="text-xs font-normal text-rose-400">Unit</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              ${summary.totalImpoundsFee.toLocaleString()} Total Biaya Sita
            </div>
          </div>

          {/* 4. Upload Kasus */}
          <div className="bg-[#182030] border border-purple-900/60 rounded-lg p-3">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px] font-semibold">4. Upload Kasus</span>
              <FolderOpen className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-lg font-bold text-purple-300 mt-1">
              {summary.totalCasesCount} <span className="text-xs font-normal text-purple-400">Berkas</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              Kasus Reskrim / Detective
            </div>
          </div>

          {/* 5. Upload Eviden */}
          <div className="bg-[#182030] border border-emerald-900/60 rounded-lg p-3 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[11px] font-semibold">5. Upload Eviden</span>
              <Boxes className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-emerald-300 mt-1">
              {summary.totalEvidenceCount} <span className="text-xs font-normal text-emerald-400">Barang</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              Barang Bukti Terdaftar
            </div>
          </div>
        </div>

        {/* FILTER & PERIODE CONTROLS */}
        <div className="bg-[#161B26] border border-gray-800/90 rounded-lg p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Filter className="w-4 h-4" />
              <span>RENTANG WAKTU & DIVISI</span>
            </div>
            <span className="text-[11px] text-amber-300">Periode: {dateRangeLabel}</span>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setRangeType('current_week')}
              className={`px-2.5 py-1.5 rounded-lg border font-bold transition flex items-center justify-center gap-1 ${
                rangeType === 'current_week'
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
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
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
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
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
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
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                  : 'bg-gray-800/80 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>📆 14 Hari</span>
            </button>

            <button
              type="button"
              onClick={() => setRangeType('current_month')}
              className={`px-2.5 py-1.5 rounded-lg border font-bold transition flex items-center justify-center gap-1 ${
                rangeType === 'current_month'
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
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
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                  : 'bg-gray-800/80 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span>✏️ Kustom</span>
            </button>
          </div>

          {/* Custom Date Input */}
          {rangeType === 'custom' && (
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-gray-800/80">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">Dari:</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded px-2.5 py-1 text-xs text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">Sampai:</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded px-2.5 py-1 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* Secondary filter: Division & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <label className="block text-gray-400 text-[11px] mb-1">Filter Divisi:</label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">Semua Divisi Kepolisian</option>
                {divisionsList.map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-[11px] mb-1">Cari Personel:</label>
              <input
                type="text"
                placeholder="Cari nama / badge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* PRIMARY EXPORT BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* EXCEL */}
          <button
            id="btn-download-weekly-excel"
            type="button"
            onClick={handleExportExcel}
            className="p-3 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/80 hover:border-emerald-400 rounded-xl text-left transition group shadow-md flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-xs group-hover:text-emerald-300">
                  Unduh Rekap Excel (.xlsx)
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Rekap Ringkasan + Rincian Per Personel
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-emerald-400 opacity-60 group-hover:opacity-100" />
          </button>

          {/* DOKUMEN RESMI CETAK */}
          <button
            id="btn-download-weekly-doc"
            type="button"
            onClick={handleExportDocument}
            className="p-3 bg-blue-950/80 hover:bg-blue-900 border border-blue-600/80 hover:border-blue-400 rounded-xl text-left transition group shadow-md flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-xs group-hover:text-blue-300">
                  Dokumen Cetak / PDF Resmi
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Format Laporan Surat Resmi Kepolisian
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-blue-400 opacity-60 group-hover:opacity-100" />
          </button>

          {/* COPY DISCORD */}
          <button
            id="btn-copy-weekly-discord"
            type="button"
            onClick={handleCopyDiscordSummary}
            className="p-3 bg-[#2B2D31] hover:bg-[#313338] border border-cyan-600/70 hover:border-cyan-400 rounded-xl text-left transition group shadow-md flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-xs group-hover:text-cyan-300">
                  {copyFeedback ? 'Tersalin ke Clipboard!' : 'Salin Format Discord'}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Rapi untuk Siaran Channel Server
                </div>
              </div>
            </div>
            <CheckCircle2 className={`w-4 h-4 ${copyFeedback ? 'text-emerald-400' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* PREVIEW TABLE REKAP DATA PER PERSONEL */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-300 flex items-center justify-between">
            <span>RINCIAN STATISTIK OPERASIONAL PER PERSONEL:</span>
            <span className="text-gray-400 font-normal text-[11px]">
              Menampilkan {filteredBreakdown.length} dari {summary.officerBreakdown.length} personel
            </span>
          </div>

          <div className="border border-gray-800 rounded-lg overflow-hidden bg-[#0e121a]">
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#161B26] text-gray-400 text-[10px] uppercase sticky top-0 border-b border-gray-800 z-10">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Badge</th>
                    <th className="py-2.5 px-3">Nama Petugas</th>
                    <th className="py-2.5 px-3">Divisi</th>
                    <th className="py-2.5 px-3 text-center">Duty</th>
                    <th className="py-2.5 px-3 text-center">Tilang</th>
                    <th className="py-2.5 px-3 text-center">Impound</th>
                    <th className="py-2.5 px-3 text-center">Kasus</th>
                    <th className="py-2.5 px-3 text-center">Eviden</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono">
                  {filteredBreakdown.map((o, idx) => (
                    <tr key={o.badge + idx} className="hover:bg-gray-800/40 transition">
                      <td className="py-2 px-3 text-gray-500 text-[11px]">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-cyan-400">{o.badge}</td>
                      <td className="py-2 px-3 font-bold text-gray-200">
                        {o.name}
                        <div className="text-[10px] text-gray-400 font-normal">{o.rank}</div>
                      </td>
                      <td className="py-2 px-3 text-gray-400 text-[11px]">{o.division}</td>
                      <td className="py-2 px-3 text-center font-bold text-blue-300">
                        {o.dutyHoursFormatted}
                        <div className="text-[9px] text-gray-500">{o.dutyShifts}x Shift</div>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-amber-300">
                        {o.citationsCount}
                        <div className="text-[9px] text-gray-500">${o.citationsFine.toLocaleString()}</div>
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-rose-300">
                        {o.impoundsCount}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-purple-300">
                        {o.casesCount}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-300">
                        {o.evidenceCount}
                      </td>
                    </tr>
                  ))}
                  {filteredBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-gray-500">
                        Tidak ada personel yang cocok dengan pencarian / filter.
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
            <span className="text-cyan-400">●</span>
            <span>MDT Integrated Command • High State Police Department Operations</span>
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
