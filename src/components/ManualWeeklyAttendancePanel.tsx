import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, 
  Search, Filter, Download, Sparkles, RefreshCw, Users, Shield, 
  Clock, Zap, Check, X, FileSpreadsheet, Layers, Info, Award, User
} from 'lucide-react';
import { OfficerAccount, OfficerRankLevel, isOfficerHighRank, isAtasanRank } from '../types';
import { 
  getWeekCalendarInfo, 
  WeekCalendarInfo, 
  DayColumnInfo,
  getOfficerAttendanceStatus, 
  setOfficerAttendanceStatus, 
  cycleOfficerAttendanceStatus,
  batchMarkOnDutyOfficersAsHadir,
  calculateOfficerWeeklySummary,
  exportWeeklyAttendanceToExcel,
  ATTENDANCE_STATUS_META,
  ORDERED_STATUS_CODES,
  AttendanceStatusCode,
  formatToIsoDateString
} from '../utils/manualAttendanceStorage';
import { getOfficerDutyState } from '../utils/officerDutyStorage';

interface Props {
  roster: OfficerAccount[];
  currentOfficerName?: string;
  currentOfficerBadge?: string;
  currentOfficerRank?: OfficerRankLevel | string;
  isCurrentOfficerCommand: boolean;
  onRefreshRoster?: () => void;
  onBackToRoster?: () => void;
}

export const ManualWeeklyAttendancePanel: React.FC<Props> = ({
  roster,
  currentOfficerName = 'Atasan',
  currentOfficerBadge = 'HQ-01',
  currentOfficerRank,
  isCurrentOfficerCommand,
  onRefreshRoster,
  onBackToRoster
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [quickDateJump, setQuickDateJump] = useState<string>('');
  const [activeCellPopover, setActiveCellPopover] = useState<{
    officerBadge: string;
    officerName: string;
    dateStr: string;
    currentStatus: AttendanceStatusCode;
    anchorX: number;
    anchorY: number;
  } | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActiveCellPopover(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Listen to remote changes or intra-app updates
  useEffect(() => {
    const handleUpdate = () => {
      setLastUpdated(Date.now());
    };
    window.addEventListener('hspd-manual-attendance-updated', handleUpdate);
    return () => window.removeEventListener('hspd-manual-attendance-updated', handleUpdate);
  }, []);

  // Compute 7 days of the selected week
  const weekCalendar: WeekCalendarInfo = useMemo(() => {
    return getWeekCalendarInfo(weekOffset);
  }, [weekOffset, lastUpdated]);

  // Unique divisions list
  const divisions = useMemo(() => {
    const set = new Set<string>();
    roster.forEach(r => {
      if (r.division) set.add(r.division);
    });
    return Array.from(set).sort();
  }, [roster]);

  // Filtered roster for table
  const filteredRoster = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return roster.filter(officer => {
      const matchesSearch = !q || 
        officer.name.toLowerCase().includes(q) || 
        officer.badge.toLowerCase().includes(q) ||
        (officer.rank && officer.rank.toLowerCase().includes(q));

      const matchesDivision = selectedDivision === 'ALL' || (officer.division || '') === selectedDivision;

      return matchesSearch && matchesDivision;
    });
  }, [roster, searchQuery, selectedDivision]);

  // Calculate week-wide statistics across all visible officers
  const weeklyGlobalStats = useMemo(() => {
    let hadir = 0;
    let absen = 0;
    let izin = 0;
    let sakit = 0;
    let cuti = 0;
    let off = 0;

    roster.forEach(officer => {
      const summary = calculateOfficerWeeklySummary(officer.badge, weekCalendar.days, officer.name);
      hadir += summary.hadir;
      absen += summary.absen;
      izin += summary.izin;
      sakit += summary.sakit;
      cuti += summary.cuti;
      off += summary.off;
    });

    const totalDaysRecorded = hadir + absen + izin + sakit + cuti + off;
    const workDays = hadir + absen;
    const globalRate = workDays > 0 ? Math.round((hadir / workDays) * 100) : (hadir > 0 ? 100 : 0);

    return {
      hadir,
      absen,
      izin,
      sakit,
      cuti,
      off,
      totalDaysRecorded,
      globalRate
    };
  }, [roster, weekCalendar, lastUpdated]);

  // Helper toast notification
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // Handle cell click (cycle or open menu)
  const handleCellClick = (e: React.MouseEvent, officer: OfficerAccount, day: DayColumnInfo) => {
    if (!isCurrentOfficerCommand && !isAtasanRank(currentOfficerRank)) {
      showToast('Hanya Atasan / High Command yang memiliki otoritas mengisi absensi manual.', 'info');
      return;
    }

    const currentRec = getOfficerAttendanceStatus(officer.badge, day.dateStr, officer.name);
    const curStatus = currentRec ? currentRec.status : 'NONE';

    // Cycle directly
    const nextStatus = cycleOfficerAttendanceStatus({
      officerBadge: officer.badge,
      officerName: officer.name,
      dateStr: day.dateStr,
      currentStatus: curStatus,
      markedBy: currentOfficerName,
      markedByBadge: currentOfficerBadge,
      markedByRank: typeof currentOfficerRank === 'string' ? currentOfficerRank : undefined
    });

    const meta = ATTENDANCE_STATUS_META[nextStatus];
    showToast(`${officer.name} (${day.dayShort}, ${day.displayDate}): ${meta.icon} ${meta.label}`);
    setLastUpdated(Date.now());
  };

  // Open right click / specific status popover
  const handleCellContextMenu = (e: React.MouseEvent, officer: OfficerAccount, day: DayColumnInfo) => {
    e.preventDefault();
    if (!isCurrentOfficerCommand && !isAtasanRank(currentOfficerRank)) return;

    const currentRec = getOfficerAttendanceStatus(officer.badge, day.dateStr, officer.name);
    const curStatus = currentRec ? currentRec.status : 'NONE';

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setActiveCellPopover({
      officerBadge: officer.badge,
      officerName: officer.name,
      dateStr: day.dateStr,
      currentStatus: curStatus,
      anchorX: rect.left,
      anchorY: rect.bottom + window.scrollY
    });
  };

  // Set explicit status from popover
  const handleSelectExplicitStatus = (status: AttendanceStatusCode) => {
    if (!activeCellPopover) return;

    setOfficerAttendanceStatus({
      officerBadge: activeCellPopover.officerBadge,
      officerName: activeCellPopover.officerName,
      dateStr: activeCellPopover.dateStr,
      status,
      markedBy: currentOfficerName,
      markedByBadge: currentOfficerBadge,
      markedByRank: typeof currentOfficerRank === 'string' ? currentOfficerRank : undefined
    });

    const meta = ATTENDANCE_STATUS_META[status];
    showToast(`${activeCellPopover.officerName}: ${meta.icon} ${meta.label}`);
    setActiveCellPopover(null);
    setLastUpdated(Date.now());
  };

  // Batch mark all currently on-duty officers for TODAY
  const handleBatchMarkTodayOnDuty = () => {
    const todayStr = formatToIsoDateString(new Date());
    const count = batchMarkOnDutyOfficersAsHadir({
      roster,
      dateStr: todayStr,
      markedBy: currentOfficerName,
      markedByBadge: currentOfficerBadge,
      markedByRank: typeof currentOfficerRank === 'string' ? currentOfficerRank : undefined,
      getDutyState: (badge) => getOfficerDutyState(badge, roster)
    });

    if (count > 0) {
      showToast(`⚡ Berhasil menandai ${count} personel yang sedang On-Duty sebagai HADIR (✅) untuk hari ini!`);
      setLastUpdated(Date.now());
      if (onRefreshRoster) onRefreshRoster();
    } else {
      showToast('Tidak ada personel yang sedang aktif 10-8 On-Duty saat ini.', 'info');
    }
  };

  // Handle jumping to custom date
  const handleDateJump = (val: string) => {
    setQuickDateJump(val);
    if (!val) return;
    const picked = new Date(val);
    if (isNaN(picked.getTime())) return;

    const now = new Date();
    // Calculate difference in weeks
    const diffTime = picked.getTime() - now.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    const calculatedOffset = Math.floor(diffDays / 7);
    setWeekOffset(calculatedOffset);
  };

  const handleExportExcel = () => {
    exportWeeklyAttendanceToExcel({
      roster: filteredRoster,
      weekCalendar,
      departmentName: 'HIGH STATE POLICE DEPARTMENT',
      exportedBy: `${currentOfficerRank || 'ATASAN'} ${currentOfficerName} (${currentOfficerBadge})`
    });
    showToast('📥 Berhasil mengekspor lembar rekapitulasi absensi mingguan ke Excel!');
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification Banner */}
      {notification && (
        <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between shadow-lg transition animate-in fade-in ${
          notification.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
            : 'bg-blue-950/80 border-blue-500 text-blue-200'
        }`}>
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification.message}</span>
          </span>
          <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* Top Controls: Week Navigator & Summary Stats */}
      <div className="bg-[#0D1219] border border-blue-500/40 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Week Navigation */}
          <div className="flex items-center gap-2 flex-wrap">
            {onBackToRoster && (
              <button
                type="button"
                onClick={onBackToRoster}
                className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-amber-300 hover:text-white transition flex items-center gap-1.5 text-xs font-mono font-bold border border-gray-700 cursor-pointer shadow-sm mr-1"
                title="Kembali ke Tabel Roster Anggota"
              >
                <ChevronLeft className="w-4 h-4 text-amber-400" />
                <span>Roster Anggota</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white transition flex items-center gap-1 text-xs font-mono border border-gray-700 cursor-pointer shadow-sm"
              title="Lihat Minggu Lalu"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Minggu Lalu</span>
            </button>

            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className={`px-3 py-2 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 border shadow-sm cursor-pointer ${
                weekOffset === 0
                  ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400 shadow-blue-900/50'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
              }`}
              title="Kembali ke Minggu Ini"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-300" />
              <span>{weekOffset === 0 ? '📅 Minggu Ini (Live)' : 'Ke Minggu Ini'}</span>
            </button>

            <button
              type="button"
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white transition flex items-center gap-1 text-xs font-mono border border-gray-700 cursor-pointer shadow-sm"
              title="Lihat Minggu Depan"
            >
              <span className="hidden sm:inline">Minggu Depan</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="px-3 py-1.5 bg-[#080B0F] rounded-xl border border-gray-800 text-xs font-mono font-bold text-gray-100 flex items-center gap-1.5">
              <span className="text-blue-400">Periode:</span>
              <span>{weekCalendar.weekLabel}</span>
            </div>
          </div>

          {/* Quick Date Picker & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-[#080B0F] border border-gray-800 rounded-xl px-2 py-1 text-xs font-mono">
              <span className="text-gray-400 text-[10px] hidden sm:inline">Lompat Tgl:</span>
              <input
                type="date"
                value={quickDateJump}
                onChange={e => handleDateJump(e.target.value)}
                className="bg-transparent text-gray-200 outline-none text-xs font-mono cursor-pointer"
                title="Pilih tanggal tertentu untuk melihat minggunya"
              />
            </div>

            {/* Quick Auto-Mark On-Duty Officers as Hadir */}
            {isCurrentOfficerCommand && (
              <button
                type="button"
                onClick={handleBatchMarkTodayOnDuty}
                className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs font-mono transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/60 cursor-pointer"
                title="Otomatis tandai Hadir (✅) untuk semua personel yang sedang bertugas hari ini"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span className="hidden md:inline">Tandai Hadir Semua On-Duty</span>
                <span className="md:hidden">Sync Hadir</span>
              </button>
            )}

            {/* Export to Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs font-mono transition flex items-center gap-1.5 shadow-lg shadow-blue-950/60 cursor-pointer"
              title="Ekspor rekap mingguan ke format Microsoft Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
          </div>
        </div>

        {/* Global Statistics Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-gray-800/80 font-mono text-xs">
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
            <span className="text-gray-300 text-[11px] flex items-center gap-1">
              <span>✅</span> Hadir
            </span>
            <strong className="text-emerald-400 font-black text-sm">{weeklyGlobalStats.hadir}</strong>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between">
            <span className="text-gray-300 text-[11px] flex items-center gap-1">
              <span>❌</span> Absen (Alfa)
            </span>
            <strong className="text-rose-400 font-black text-sm">{weeklyGlobalStats.absen}</strong>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between">
            <span className="text-gray-300 text-[11px] flex items-center gap-1">
              <span>📝</span> Izin
            </span>
            <strong className="text-amber-400 font-black text-sm">{weeklyGlobalStats.izin}</strong>
          </div>

          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between">
            <span className="text-gray-300 text-[11px] flex items-center gap-1">
              <span>🏥</span> Sakit
            </span>
            <strong className="text-cyan-400 font-black text-sm">{weeklyGlobalStats.sakit}</strong>
          </div>

          <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between">
            <span className="text-gray-300 text-[11px] flex items-center gap-1">
              <span>🏖️</span> Cuti Resmi
            </span>
            <strong className="text-purple-400 font-black text-sm">{weeklyGlobalStats.cuti}</strong>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/40 flex items-center justify-between">
            <span className="text-gray-300 text-[11px] flex items-center gap-1">
              <span>📊</span> Kehadiran
            </span>
            <strong className="text-blue-300 font-black text-sm">{weeklyGlobalStats.globalRate}%</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0A0E14] border border-gray-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama anggota, badge, pangkat..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#06090D] border border-gray-800 rounded-lg text-xs text-gray-200 placeholder:text-gray-600 outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={selectedDivision}
            onChange={e => setSelectedDivision(e.target.value)}
            className="px-2.5 py-1.5 bg-[#06090D] border border-gray-800 rounded-lg text-xs text-gray-300 outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Divisi ({roster.length})</option>
            {divisions.map(div => (
              <option key={div} value={div}>{div}</option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-gray-400 flex items-center gap-2">
          <span>Menampilkan: <strong className="text-white">{filteredRoster.length}</strong> personel</span>
          <span className="text-gray-600">•</span>
          <span className="text-emerald-400 font-bold">💡 Klik sel tanggal untuk rotasi status</span>
        </div>
      </div>

      {/* Main Weekly Attendance Grid Table */}
      <div className="bg-[#0A0E14] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#06090D] border-b border-gray-800 text-[11px] text-gray-400">
                <th className="py-3 px-3 min-w-[200px]">Personel HSPD</th>
                {weekCalendar.days.map((day) => (
                  <th 
                    key={day.dateStr} 
                    className={`py-2 px-2 text-center min-w-[100px] border-l border-gray-800/60 ${
                      day.isToday 
                        ? 'bg-blue-950/60 text-blue-300 font-bold border-t-2 border-t-blue-500' 
                        : 'text-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-xs font-bold">{day.dayName}</div>
                      <div className="text-[10px] text-gray-400 font-normal">{day.displayDate}</div>
                      {day.isToday && (
                        <span className="mt-0.5 px-1.5 py-0.2 rounded-full bg-blue-500 text-white text-[8px] font-black tracking-wider uppercase">
                          HARI INI
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="py-3 px-3 text-center min-w-[130px] border-l border-gray-800">
                  Rekap Minggu Ini
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800/60">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500 font-sans">
                    Tidak ada anggota roster yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((officer, rowIdx) => {
                  const isHigh = isOfficerHighRank(officer.rank);
                  const dutyState = getOfficerDutyState(officer.badge, roster);
                  const summary = calculateOfficerWeeklySummary(officer.badge, weekCalendar.days, officer.name);

                  return (
                    <tr 
                      key={officer.id || officer.badge || rowIdx}
                      className="hover:bg-gray-800/30 transition group"
                    >
                      {/* Officer Identity Column */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isHigh 
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-600/70 shadow-sm' 
                              : 'bg-blue-950/80 text-blue-300 border border-blue-700/60'
                          }`}>
                            <User className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-100 truncate text-xs">
                              {officer.name}
                            </div>
                            <div className="text-[10px] text-gray-400 flex items-center gap-1.5 flex-wrap">
                              <span className="text-gray-300 font-mono font-bold">{officer.badge}</span>
                              <span className="text-gray-600">•</span>
                              <span className="text-gray-400 truncate max-w-[110px]">{officer.rank}</span>
                              {dutyState.isDuty && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-400 font-bold bg-emerald-950 px-1 rounded border border-emerald-700">
                                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                                  10-8
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 7 Days Attendance Cells */}
                      {weekCalendar.days.map((day) => {
                        const rec = getOfficerAttendanceStatus(officer.badge, day.dateStr, officer.name);
                        const status: AttendanceStatusCode = rec ? rec.status : 'NONE';
                        const meta = ATTENDANCE_STATUS_META[status];

                        return (
                          <td 
                            key={day.dateStr}
                            onClick={(e) => handleCellClick(e, officer, day)}
                            onContextMenu={(e) => handleCellContextMenu(e, officer, day)}
                            className={`py-2 px-1 text-center border-l border-gray-800/60 cursor-pointer transition select-none ${
                              day.isToday ? 'bg-blue-950/20 hover:bg-blue-900/40' : 'hover:bg-gray-800/60'
                            }`}
                            title={`Klik untuk ubah: ${officer.name} (${day.fullLabel})\nStatus: ${meta.label}${rec?.markedBy ? `\nDitandai oleh: ${rec.markedBy}` : ''}`}
                          >
                            <div className="flex flex-col items-center justify-center p-1 rounded-lg transition group-hover:scale-105">
                              <span className={`px-2 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1 shadow-sm ${meta.badgeClass}`}>
                                <span className="text-sm">{meta.icon}</span>
                                <span className="text-[10px] hidden sm:inline">{meta.shortLabel}</span>
                              </span>
                              {rec?.notes && (
                                <span className="text-[8px] text-gray-400 truncate max-w-[70px] mt-0.5">
                                  {rec.notes}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Weekly Summary Column */}
                      <td className="py-2 px-3 border-l border-gray-800 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center justify-center gap-1 text-[10px] flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 font-bold" title="Hadir">
                              ✅ {summary.hadir}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-700/60 text-amber-300 font-bold" title="Izin">
                              📝 {summary.izin}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-950/70 border border-rose-700/60 text-rose-300 font-bold" title="Absen (Alfa)">
                              ❌ {summary.absen}
                            </span>
                          </div>
                          <div className="text-[9px] text-gray-400 font-mono">
                            Kehadiran: <strong className="text-blue-300">{summary.attendanceRatePercent}%</strong>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend & Instructions Footer */}
      <div className="bg-[#0A0E14] border border-gray-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-gray-400">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-300 font-bold">Keterangan Ikon:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
            ✅ Hadir
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-700/60">
            ❌ Absen (Alfa)
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60">
            📝 Izin
          </span>
          <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
            🏥 Sakit
          </span>
          <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-700/60">
            🏖️ Cuti Resmi
          </span>
          <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-600">
            ⚪ Lepas Dinas
          </span>
        </div>

        <div className="text-[11px] text-gray-500">
          💡 Tanggal berganti otomatis setiap hari. Data tersimpan permanen di cloud dan dapat diekspor kapan saja.
        </div>
      </div>

      {/* Popover Selector for Explicit Status Pick */}
      {activeCellPopover && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            left: `${Math.min(window.innerWidth - 240, Math.max(10, activeCellPopover.anchorX - 60))}px`,
            top: `${activeCellPopover.anchorY + 8}px`,
            zIndex: 60
          }}
          className="bg-[#0F141C] border border-blue-500/70 rounded-xl shadow-2xl p-2.5 space-y-1.5 w-56 font-mono text-xs animate-in zoom-in-95 duration-100"
        >
          <div className="text-[10px] text-gray-400 pb-1 border-b border-gray-800 flex items-center justify-between">
            <span className="font-bold text-gray-200 truncate">{activeCellPopover.officerName}</span>
            <button onClick={() => setActiveCellPopover(null)} className="text-gray-500 hover:text-white">✕</button>
          </div>
          <div className="text-[9px] text-blue-400 font-bold">
            Pilih Status ({activeCellPopover.dateStr}):
          </div>
          <div className="grid grid-cols-1 gap-1">
            {ORDERED_STATUS_CODES.map((code) => {
              const meta = ATTENDANCE_STATUS_META[code];
              const isSelected = activeCellPopover.currentStatus === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleSelectExplicitStatus(code)}
                  className={`w-full text-left px-2 py-1 rounded-lg text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                    isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm">{meta.icon}</span>
                    <span>{meta.label}</span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
