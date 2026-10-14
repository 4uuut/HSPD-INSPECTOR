import React, { useState, useEffect, useMemo } from 'react';
import { 
  Terminal, Shield, Building2, Activity, Database, RefreshCw, 
  Search, Filter, Download, ArrowUpRight, CheckCircle2, AlertTriangle, 
  Clock, Users, FileText, ShieldAlert, Car, Scale, Cpu, Lock, 
  ExternalLink, Layers, Sparkles, Check, ChevronDown, BarChart2,
  TrendingUp, Radio, Flame, Award, Globe, LogOut
} from 'lucide-react';
import { 
  OfficerProfile, 
  SystemActivityLog, 
  ActivityEntity 
} from '../types';
import { 
  getAllAggregatedActivities, 
  getHourlyActivityTrend, 
  getDailyActivityTrend,
  synchronizeDpoAndDmvIntegrity,
  logDeveloperSystemActivity
} from '../utils/activityMonitoringStorage';

interface Props {
  currentOfficer: OfficerProfile | null;
  onSwitchPortal?: (portal: 'POLICE' | 'GOVERNMENT' | 'CITIZEN') => void;
  onClose?: () => void;
}

export const DeveloperSystemMonitoring: React.FC<Props> = ({
  currentOfficer,
  onSwitchPortal,
  onClose
}) => {
  // Activity data
  const [activities, setActivities] = useState<SystemActivityLog[]>(() => getAllAggregatedActivities());
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<'ALL' | 'HSPD' | 'GOVERNMENT' | 'SYSTEM'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChartTab, setActiveChartTab] = useState<'HOURLY' | 'DAILY' | 'MODULES'>('HOURLY');
  const [chartEntityFilter, setChartEntityFilter] = useState<'ALL' | 'HSPD' | 'GOVERNMENT'>('ALL');

  // Diagnostics feedback
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<any | null>(null);

  // Sync listener across windows / tabs
  const refreshData = () => {
    setActivities(getAllAggregatedActivities());
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();

    window.addEventListener('hspd-activity-log-updated', handleUpdate);
    window.addEventListener('hspd-records-updated', handleUpdate);
    window.addEventListener('hspd-bolo-updated', handleUpdate);
    window.addEventListener('hspd-citizens-updated', handleUpdate);
    window.addEventListener('hspd-traffic-citations-updated', handleUpdate);
    window.addEventListener('hspd-impound-updated', handleUpdate);
    window.addEventListener('hspd-case-files-updated', handleUpdate);
    window.addEventListener('gov-permits-updated', handleUpdate);
    window.addEventListener('hspd-documents-updated', handleUpdate);

    const interval = setInterval(refreshData, 10000); // Poll every 10s

    return () => {
      window.removeEventListener('hspd-activity-log-updated', handleUpdate);
      window.removeEventListener('hspd-records-updated', handleUpdate);
      window.removeEventListener('hspd-bolo-updated', handleUpdate);
      window.removeEventListener('hspd-citizens-updated', handleUpdate);
      window.removeEventListener('hspd-traffic-citations-updated', handleUpdate);
      window.removeEventListener('hspd-impound-updated', handleUpdate);
      window.removeEventListener('hspd-case-files-updated', handleUpdate);
      window.removeEventListener('gov-permits-updated', handleUpdate);
      window.removeEventListener('hspd-documents-updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  // Filtered Activity Feed
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      if (selectedEntityFilter !== 'ALL' && act.entity !== selectedEntityFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (act.title || '').toLowerCase().includes(q);
        const matchDesc = (act.description || '').toLowerCase().includes(q);
        const matchActor = (act.actor || '').toLowerCase().includes(q) || (act.actorBadge || '').toLowerCase().includes(q);
        const matchModule = (act.module || '').toLowerCase().includes(q);
        const matchTarget = (act.target || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchActor && !matchModule && !matchTarget) {
          return false;
        }
      }
      return true;
    });
  }, [activities, selectedEntityFilter, searchQuery]);

  // Aggregate Metrics
  const totalHspdActivities = useMemo(() => activities.filter(a => a.entity === 'HSPD').length, [activities]);
  const totalGovActivities = useMemo(() => activities.filter(a => a.entity === 'GOVERNMENT').length, [activities]);
  const totalSystemActivities = useMemo(() => activities.filter(a => a.entity === 'SYSTEM').length, [activities]);

  const hspdPercent = activities.length > 0 ? Math.round((totalHspdActivities / activities.length) * 100) : 50;
  const govPercent = activities.length > 0 ? Math.round((totalGovActivities / activities.length) * 100) : 50;

  // Chart Data
  const hourlyData = useMemo(() => getHourlyActivityTrend(activities), [activities]);
  const dailyData = useMemo(() => getDailyActivityTrend(activities), [activities]);

  // Module Breakdown for Bar Charts
  const moduleCounts = useMemo(() => {
    const map: Record<string, { count: number; entity: ActivityEntity; color: string }> = {};
    activities.forEach(a => {
      const mod = a.module || 'Umum';
      if (!map[mod]) {
        let color = '#3B82F6';
        if (a.entity === 'GOVERNMENT') color = '#F59E0B';
        else if (mod.includes('BOLO') || mod.includes('DPO')) color = '#EF4444';
        else if (mod.includes('Tilang')) color = '#EAB308';
        else if (mod.includes('Sitaan')) color = '#06B6D4';
        else if (mod.includes('Divisi')) color = '#8B5CF6';
        map[mod] = { count: 0, entity: a.entity, color };
      }
      map[mod].count += 1;
    });

    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [activities]);

  // Max value for hourly chart scaling
  const maxHourlyVal = useMemo(() => {
    return Math.max(5, ...hourlyData.map(d => {
      if (chartEntityFilter === 'HSPD') return d.hspdCount;
      if (chartEntityFilter === 'GOVERNMENT') return d.govCount;
      return d.totalCount;
    }));
  }, [hourlyData, chartEntityFilter]);

  // 1-Click DPO & DMV Integrity Sync
  const handleRunDpoAudit = () => {
    setIsSyncing(true);
    try {
      const result = synchronizeDpoAndDmvIntegrity();
      setSyncNotice(`✓ Audit DPO Selesai: ${result.totalAudited} data diinspeksi. ${result.addedToBolo} DPO disinkronkan ke BOLO, ${result.linkedCitizens} warga ditandai DPO.`);
      refreshData();
    } catch (e: any) {
      setSyncNotice(`Gagal melakukan audit: ${e.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncNotice(null), 5000);
    }
  };

  // Export Audit Logs as JSON
  const handleExportJson = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activities, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `hspd_system_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error('Failed to export logs:', e);
    }
  };

  return (
    <div className="space-y-5 font-sans text-xs pb-10">
      {/* DEVELOPER TERMINAL TOP BANNER */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#070A0F] via-[#0D121C] to-[#080B10] border-2 border-emerald-500/70 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/80 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/60 font-mono font-bold text-lg">
              <Terminal className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-mono text-[10px] font-extrabold tracking-wider">
                  DEVELOPER BACKDOOR & AUDIT SYSTEM
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700/60 font-mono text-[10px] font-bold">
                  OVERSEER ROOT ACTIVE
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white mt-1 flex items-center gap-2">
                <span>Pusat Pemantauan Seluruh Aktivitas Kepolisian HSPD & Pemerintahan</span>
              </h2>
              <p className="text-xs text-gray-400 font-sans mt-0.5">
                Konsol telemetri pengembang web: Pemantauan real-time rekam jejak kriminal, DPO, tilang, perizinan negara, dokumen sah, serta visualisasi grafik aktivitas.
              </p>
            </div>
          </div>

          {/* Quick Actions & Role Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRunDpoAudit}
              disabled={isSyncing}
              className="px-3 py-2 bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-red-950/50 transition cursor-pointer active:scale-95 border border-red-500"
              title="Audit & sinkronkan paritas DPO antara basis data Dukcapil dan BOLO Alerts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Audit Paritas DPO</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="px-3 py-2 bg-[#161D2B] hover:bg-gray-800 text-gray-200 hover:text-white font-bold rounded-xl text-xs flex items-center gap-1.5 border border-gray-700 transition cursor-pointer"
              title="Unduh log riwayat aktivitas lengkap (JSON)"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Audit</span>
            </button>

            {onSwitchPortal && (
              <div className="flex items-center gap-1 bg-[#121620] p-1 rounded-xl border border-gray-800">
                <button
                  type="button"
                  onClick={() => onSwitchPortal('POLICE')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-300 hover:bg-blue-950/60 hover:text-white transition cursor-pointer"
                  title="Lihat Sebagai Petugas HSPD"
                >
                  🛡️ HSPD
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchPortal('GOVERNMENT')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-300 hover:bg-amber-950/60 hover:text-white transition cursor-pointer"
                  title="Lihat Sebagai Pejabat Negara"
                >
                  🏛️ Gov
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchPortal('CITIZEN')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-300 hover:bg-emerald-950/60 hover:text-white transition cursor-pointer"
                  title="Lihat Sebagai Portal Warga"
                >
                  🌐 Warga
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sync notification banner */}
        {syncNotice && (
          <div className="mt-3 p-2.5 bg-emerald-950/80 border border-emerald-500 text-emerald-200 rounded-lg text-xs font-mono flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncNotice}</span>
            </span>
            <button type="button" onClick={() => setSyncNotice(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* TOP METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* TOTAL AKTIVITAS */}
        <div className="p-3.5 bg-[#0F141E] border border-gray-800 rounded-xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 font-mono text-[10px]">
            <span>TOTAL AKTIVITAS SISTEM</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {activities.length.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Terhubung & Terpantau 24/7</span>
          </div>
        </div>

        {/* AKTIVITAS HSPD */}
        <div className="p-3.5 bg-[#0F141E] border border-blue-900/50 rounded-xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-blue-400 font-mono text-[10px]">
            <span>OPERASIONAL KEPOLISIAN (HSPD)</span>
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-300 font-mono">
            {totalHspdActivities.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-400 font-sans flex items-center justify-between">
            <span>Pangsa Beban: {hspdPercent}%</span>
            <span className="text-[10px] text-blue-400 font-mono">MDT & CAD</span>
          </div>
        </div>

        {/* AKTIVITAS PEMERINTAHAN */}
        <div className="p-3.5 bg-[#0F141E] border border-amber-900/50 rounded-xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-400 font-mono text-[10px]">
            <span>KEMENEGARAAN (GOVERNMENT)</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {totalGovActivities.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-400 font-sans flex items-center justify-between">
            <span>Pangsa Beban: {govPercent}%</span>
            <span className="text-[10px] text-amber-400 font-mono">NIB & Docs</span>
          </div>
        </div>

        {/* INTEGRITAS DPO & KEAMANAN */}
        <div className="p-3.5 bg-[#0F141E] border border-red-900/50 rounded-xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-red-400 font-mono text-[10px]">
            <span>INTEGRITAS DPO & PARITAS</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-300 font-mono flex items-center gap-1.5">
            <span>100%</span>
            <span className="text-xs font-bold text-emerald-400 font-sans px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700">SYNC</span>
          </div>
          <div className="text-[11px] text-gray-400 font-sans">
            BOLO & Citizen DMV Tersinkronisasi
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📊 GRAFIK VISUAL INTERAKTIF: TREN AKTIVITAS WEBSITE & KOMPARASI           */}
      {/* ========================================================================= */}
      <div className="bg-[#0D121C] border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white font-sans">
                Grafik Volume & Tren Aktivitas Website (HSPD & Government)
              </h3>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Visualisasi kuantitas aksi operasional per jam dan beban modul selama ada aktivitas di website.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Entity Filter for Chart */}
            <div className="flex items-center bg-[#151B27] p-1 rounded-xl border border-gray-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setChartEntityFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  chartEntityFilter === 'ALL' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Gabungan
              </button>
              <button
                type="button"
                onClick={() => setChartEntityFilter('HSPD')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  chartEntityFilter === 'HSPD' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-blue-300'
                }`}
              >
                HSPD
              </button>
              <button
                type="button"
                onClick={() => setChartEntityFilter('GOVERNMENT')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  chartEntityFilter === 'GOVERNMENT' ? 'bg-amber-600 text-white shadow' : 'text-gray-400 hover:text-amber-300'
                }`}
              >
                Government
              </button>
            </div>

            {/* View Mode: Hourly vs 7 Days vs Modules */}
            <div className="flex items-center bg-[#151B27] p-1 rounded-xl border border-gray-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveChartTab('HOURLY')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  activeChartTab === 'HOURLY' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                24 Jam
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('DAILY')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  activeChartTab === 'DAILY' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('MODULES')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  activeChartTab === 'MODULES' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Beban Modul
              </button>
            </div>
          </div>
        </div>

        {/* CHART VIEW 1: HOURLY ACTIVITY TIMELINE */}
        {activeChartTab === 'HOURLY' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Distribusi Waktu Jam Operasional (00:00 - 23:00 WIB)</span>
              </span>
              <span className="text-gray-500">Puncak Aktivitas: Max {maxHourlyVal} Aksi / Jam</span>
            </div>

            {/* SVG Interactive Area/Bar Chart */}
            <div className="p-3 bg-[#080B10] rounded-xl border border-gray-800/80 overflow-x-auto">
              <div className="min-w-[650px] h-48 flex items-end gap-1.5 px-2 pb-6 pt-4 relative">
                {/* Horizontal reference grid lines */}
                <div className="absolute inset-x-2 top-4 border-b border-gray-800/60 pointer-events-none" />
                <div className="absolute inset-x-2 top-24 border-b border-gray-800/60 pointer-events-none" />
                <div className="absolute inset-x-2 bottom-6 border-b border-gray-700 pointer-events-none" />

                {hourlyData.map((pt, idx) => {
                  const val = chartEntityFilter === 'HSPD' ? pt.hspdCount : chartEntityFilter === 'GOVERNMENT' ? pt.govCount : pt.totalCount;
                  const heightPercent = Math.max(8, Math.round((val / maxHourlyVal) * 100));

                  return (
                    <div
                      key={pt.hour}
                      onMouseEnter={() => setHoveredDataPoint(pt)}
                      onMouseLeave={() => setHoveredDataPoint(null)}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    >
                      {/* Bar Fill */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t transition-all group-hover:brightness-125 ${
                          chartEntityFilter === 'HSPD'
                            ? 'bg-gradient-to-t from-blue-900 to-blue-500'
                            : chartEntityFilter === 'GOVERNMENT'
                            ? 'bg-gradient-to-t from-amber-900 to-amber-500'
                            : 'bg-gradient-to-t from-emerald-900 via-blue-600 to-emerald-400'
                        }`}
                      />

                      {/* Hour Label */}
                      <span className="absolute -bottom-5 text-[9px] font-mono text-gray-500 group-hover:text-white transition">
                        {idx % 2 === 0 ? pt.hour.slice(0, 2) : ''}
                      </span>

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                        <div className="bg-[#151B27] text-white p-2 rounded-lg border border-gray-700 shadow-2xl text-[10px] font-mono whitespace-nowrap">
                          <div className="font-bold text-emerald-400">{pt.hour} WIB</div>
                          <div>Total: <strong>{pt.totalCount} Aksi</strong></div>
                          <div className="text-blue-300">HSPD: {pt.hspdCount}</div>
                          <div className="text-amber-300">Gov: {pt.govCount}</div>
                        </div>
                        <div className="w-1.5 h-1.5 bg-gray-700 rotate-45 -mt-0.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CHART VIEW 2: 7 DAYS DAILY TREND */}
        {activeChartTab === 'DAILY' && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-gray-400 flex items-center justify-between">
              <span>Aktivitas Harian (7 Hari Terakhir)</span>
              <span className="text-gray-500">Total Periode: {activities.length} Aksi Terdata</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
              {dailyData.map(d => (
                <div key={d.dateString} className="p-3 bg-[#080B10] rounded-xl border border-gray-800 text-center space-y-1.5 hover:border-gray-700 transition">
                  <div className="text-[10px] font-mono text-gray-400 font-bold">{d.dayLabel}</div>
                  <div className="text-[9px] font-mono text-gray-500">{d.dateString.slice(5)}</div>
                  <div className="text-xl font-black text-white font-mono">
                    {d.totalCount}
                  </div>
                  <div className="text-[9px] font-mono text-gray-400 flex items-center justify-center gap-1 border-t border-gray-800 pt-1">
                    <span className="text-blue-400">P:{d.hspdCount}</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-amber-400">G:{d.govCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHART VIEW 3: MODULE WORKLOAD BARS */}
        {activeChartTab === 'MODULES' && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-gray-400 flex items-center justify-between">
              <span>Beban Aktivitas Berdasarkan Modul Sistem</span>
              <span className="text-gray-500">{moduleCounts.length} Modul Aktif Terdata</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
              {moduleCounts.map(m => {
                const percent = Math.round((m.count / Math.max(1, activities.length)) * 100);
                return (
                  <div key={m.name} className="p-2.5 bg-[#080B10] rounded-xl border border-gray-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                        <span>{m.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-gray-400">
                          {m.entity}
                        </span>
                      </span>
                      <span className="font-mono text-gray-300 font-bold">
                        {m.count} aksi ({percent}%)
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(4, percent)}%`, backgroundColor: m.color }}
                        className="h-full rounded-full transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🔴 LIVE AUDIT FEED STREAM: REALTIME ACTIVITY LOG                          */}
      {/* ========================================================================= */}
      <div className="bg-[#0D121C] border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
            <h3 className="font-bold text-sm text-white font-sans">
              Live Audit Feed: Riwayat Aktivitas Seluruh Petugas & Pejabat
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              REALTIME
            </span>
          </div>

          {/* Search query input */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] sm:min-w-[260px]">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari aktor, badge, judul, modul..."
                className="w-full bg-[#151B27] border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div className="flex items-center bg-[#151B27] p-1 rounded-xl border border-gray-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setSelectedEntityFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  selectedEntityFilter === 'ALL' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Semua ({activities.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedEntityFilter('HSPD')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  selectedEntityFilter === 'HSPD' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-blue-300'
                }`}
              >
                HSPD ({totalHspdActivities})
              </button>
              <button
                type="button"
                onClick={() => setSelectedEntityFilter('GOVERNMENT')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  selectedEntityFilter === 'GOVERNMENT' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-amber-300'
                }`}
              >
                Gov ({totalGovActivities})
              </button>
            </div>
          </div>
        </div>

        {/* FEED ITEMS LIST */}
        <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredActivities.length === 0 ? (
            <div className="p-8 text-center bg-[#080B10] rounded-xl border border-gray-800/80 text-gray-400 space-y-1">
              <Terminal className="w-8 h-8 mx-auto text-gray-600" />
              <div className="font-bold text-gray-300">Tidak ada log aktivitas yang cocok dengan filter.</div>
              <div className="text-[11px]">Coba sesuaikan kata kunci pencarian atau ganti filter entitas.</div>
            </div>
          ) : (
            filteredActivities.map((act, idx) => {
              const isGov = act.entity === 'GOVERNMENT';
              const isCrit = act.severity === 'CRITICAL';
              const isWarn = act.severity === 'WARNING';
              const isSuccess = act.severity === 'SUCCESS';

              return (
                <div
                  key={`${act.id}-${idx}`}
                  className={`p-3 rounded-xl border transition space-y-1.5 ${
                    isCrit
                      ? 'bg-rose-950/20 border-rose-900/60 hover:border-rose-700'
                      : isGov
                      ? 'bg-amber-950/15 border-amber-900/50 hover:border-amber-700'
                      : 'bg-[#080B10] border-gray-800/80 hover:border-gray-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded font-extrabold uppercase border ${
                          isGov
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-blue-950 text-blue-300 border-blue-800'
                        }`}
                      >
                        {act.entity}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {act.module}
                      </span>
                      <span className="text-gray-600">•</span>
                      <span className="font-bold text-white text-xs">
                        {act.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
                      <span>{new Date(act.timestamp).toLocaleTimeString('id-ID')} WIB</span>
                      <span className="text-gray-600">|</span>
                      <span>{new Date(act.timestamp).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed font-sans">
                    {act.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-800/60 text-[10px] font-mono text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <span>Aktor / Petugas:</span>
                      <strong className="text-gray-200">{act.actor}</strong>
                      {act.actorBadge && <span className="text-blue-400">({act.actorBadge})</span>}
                    </div>

                    {act.target && (
                      <div className="flex items-center gap-1 text-gray-400">
                        <span>Target:</span>
                        <strong className="text-amber-300">{act.target}</strong>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
