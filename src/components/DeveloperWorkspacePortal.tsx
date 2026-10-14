import React, { useState, useEffect, useMemo } from 'react';
import { 
  Terminal, Shield, Building2, Activity, Database, RefreshCw, 
  Search, Filter, Download, Upload, CheckCircle2, AlertTriangle, 
  Clock, Users, FileText, ShieldAlert, Car, Scale, Cpu, Lock, 
  ExternalLink, Layers, Sparkles, Check, ChevronDown, BarChart2,
  TrendingUp, Radio, Flame, Award, Globe, LogOut, KeyRound, 
  MessageSquare, Wrench, ShieldCheck, Play, ArrowRight, Eye, User
} from 'lucide-react';
import { 
  OfficerProfile, 
  SystemActivityLog, 
  ActivityEntity,
  BoloAlert,
  CitizenProfile,
  DetectiveCase
} from '../types';
import { 
  getAllAggregatedActivities, 
  getHourlyActivityTrend, 
  getDailyActivityTrend,
  synchronizeDpoAndDmvIntegrity,
  logDeveloperSystemActivity,
  clearAllActivityLogs
} from '../utils/activityMonitoringStorage';
import { getSavedBoloAlerts, saveBoloAlerts } from '../utils/boloImpoundStorage';
import { getSavedCitizens, saveCitizens } from '../utils/citizenDmvStorage';
import { getSavedDetectiveCases } from '../utils/detectiveCaseStorage';
import { getRosterFromStorage, saveRosterToStorage, updateOfficerPinInRoster } from '../utils/pinResetStorage';
import { getGovernmentRoster } from '../utils/governmentStorage';
import { getSavedDiscordBotConfig, getSavedChangelogWebhookConfig, getSavedWebhookConfig, sendDiscordLog } from '../utils/discordWebhook';
import { pullLatestFromFirestore } from '../services/firebaseRealtimeSync';

interface Props {
  currentOfficer: OfficerProfile | null;
  onSwitchPortal?: (portal: 'POLICE' | 'GOVERNMENT' | 'CITIZEN') => void;
  onLogout?: () => void;
}

export const DeveloperWorkspacePortal: React.FC<Props> = ({
  currentOfficer,
  onSwitchPortal,
  onLogout
}) => {
  // Developer active tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'logs' | 'dpo_parity' | 'database' | 'discord_bot' | 'pin_manager'>('analytics');

  // Activity logs & telemetry
  const [activities, setActivities] = useState<SystemActivityLog[]>(() => getAllAggregatedActivities());
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<'ALL' | 'HSPD' | 'GOVERNMENT' | 'SYSTEM'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChartTab, setActiveChartTab] = useState<'HOURLY' | 'DAILY' | 'MODULES'>('HOURLY');
  const [chartEntityFilter, setChartEntityFilter] = useState<'ALL' | 'HSPD' | 'GOVERNMENT'>('ALL');

  // Diagnostics & Status
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<any | null>(null);

  // DPO Buronan Parity Data
  const [boloList, setBoloList] = useState<BoloAlert[]>(() => getSavedBoloAlerts());
  const [citizens, setCitizens] = useState<CitizenProfile[]>(() => getSavedCitizens());
  const [cidCases, setCidCases] = useState<DetectiveCase[]>(() => getSavedDetectiveCases());

  // PIN Override Manager state
  const [rosterList, setRosterList] = useState(() => getRosterFromStorage());
  const [govRosterList, setGovRosterList] = useState(() => getGovernmentRoster());
  const [pinSearch, setPinSearch] = useState('');
  const [selectedTargetBadge, setSelectedTargetBadge] = useState('');
  const [newMasterPin, setNewMasterPin] = useState('');
  const [pinNotice, setPinNotice] = useState<string | null>(null);

  // Discord test state
  const [botConfig, setBotConfig] = useState(() => getSavedDiscordBotConfig());
  const [changelogConfig, setChangelogConfig] = useState(() => getSavedChangelogWebhookConfig());
  const [webhookTestMessage, setWebhookTestMessage] = useState('📡 [PING TEST] Pesan uji coba koneksi gateway pengembang MDT HSPD.');
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  // Refresh activity data
  const refreshData = () => {
    setActivities(getAllAggregatedActivities());
    setBoloList(getSavedBoloAlerts());
    setCitizens(getSavedCitizens());
    setCidCases(getSavedDetectiveCases());
    setRosterList(getRosterFromStorage());
    setGovRosterList(getGovernmentRoster());
  };

  useEffect(() => {
    const handleStorageUpdate = () => refreshData();
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('hspd_activity_updated', handleStorageUpdate);
    const interval = setInterval(refreshData, 10000);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('hspd_activity_updated', handleStorageUpdate);
      clearInterval(interval);
    };
  }, []);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      if (selectedEntityFilter !== 'ALL' && act.entity !== selectedEntityFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = act.title.toLowerCase().includes(q);
        const matchDesc = act.description.toLowerCase().includes(q);
        const matchUser = (act.actor || '').toLowerCase().includes(q) || (act.actorBadge && act.actorBadge.toLowerCase().includes(q));
        const matchMod = (act.module || '').toLowerCase().includes(q);
        return matchTitle || matchDesc || matchUser || matchMod;
      }
      return true;
    });
  }, [activities, selectedEntityFilter, searchQuery]);

  // Hourly Trend Calculation
  const hourlyData = useMemo(() => {
    return getHourlyActivityTrend(activities);
  }, [activities]);

  // Daily Trend Calculation
  const dailyData = useMemo(() => {
    return getDailyActivityTrend(activities);
  }, [activities]);

  // Module Breakdown
  const moduleBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    activities.forEach(a => {
      if (chartEntityFilter !== 'ALL' && a.entity !== chartEntityFilter) return;
      counts[a.module] = (counts[a.module] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [activities, chartEntityFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const today = new Date().toDateString();
    const todayActivities = activities.filter(a => new Date(a.timestamp).toDateString() === today);
    const hspdCount = activities.filter(a => a.entity === 'HSPD').length;
    const govCount = activities.filter(a => a.entity === 'GOVERNMENT').length;
    const activeBolos = boloList.filter(b => b.active !== false).length;
    const wantedCitizens = citizens.filter(c => c.isWantedBolo).length;

    return {
      total: activities.length,
      todayTotal: todayActivities.length,
      hspdPercent: activities.length ? Math.round((hspdCount / activities.length) * 100) : 50,
      govPercent: activities.length ? Math.round((govCount / activities.length) * 100) : 50,
      activeBolos,
      wantedCitizens,
      rosterTotal: rosterList.length,
      govRosterTotal: govRosterList.length
    };
  }, [activities, boloList, citizens, rosterList, govRosterList]);

  // Handle Synchronize DPO
  const handleRunDpoSync = () => {
    setIsSyncing(true);
    try {
      const res = synchronizeDpoAndDmvIntegrity();
      refreshData();
      setSyncNotice(`✅ Sukses: Paritas DPO & DMV disinkronkan (${res.addedToBolo} BOLO baru, ${res.linkedCitizens} Warga Sipil ditautkan, total ${res.totalAudited} diinspeksi).`);
    } catch (err: any) {
      setSyncNotice(`❌ Gagal sinkronisasi: ${err?.message || err}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncNotice(null), 6000);
    }
  };

  // Handle Export CSV
  const handleExportCsv = () => {
    try {
      const headers = ['ID', 'Waktu', 'Entitas', 'Modul', 'Tindakan', 'Pelaksana', 'Badge', 'Detail'];
      const rows = filteredActivities.map(a => [
        `"${a.id}"`,
        `"${new Date(a.timestamp).toISOString()}"`,
        `"${a.entity}"`,
        `"${a.module}"`,
        `"${(a.title || '').replace(/"/g, '""')}"`,
        `"${(a.actor || 'Sistem').replace(/"/g, '""')}"`,
        `"${a.actorBadge || '-'}"`,
        `"${(a.description || '').replace(/"/g, '""')}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `HSPD_GOV_SYSTEM_AUDIT_LOGS_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Master PIN override
  const handleApplyMasterPin = () => {
    if (!selectedTargetBadge || !newMasterPin.trim()) {
      setPinNotice('⚠️ Pilih petugas dan masukkan PIN baru.');
      return;
    }
    const success = updateOfficerPinInRoster(selectedTargetBadge, newMasterPin.trim());
    if (success) {
      logDeveloperSystemActivity({
        entity: 'SYSTEM',
        module: 'ROSTER',
        action: 'PIN_AUDIT',
        actor: currentOfficer?.name || 'Lead Developer',
        actorBadge: currentOfficer?.badge || '#DEV-001',
        severity: 'INFO',
        title: `Override Master PIN Petugas [${selectedTargetBadge}]`,
        description: `Pengembang memperbarui PIN petugas badge ${selectedTargetBadge} secara langsung dari Konsol Pengembang.`
      });
      refreshData();
      setPinNotice(`✅ PIN untuk badge ${selectedTargetBadge} berhasil diubah menjadi "${newMasterPin.trim()}".`);
      setNewMasterPin('');
    } else {
      setPinNotice('❌ Gagal memperbarui PIN: Petugas tidak ditemukan.');
    }
    setTimeout(() => setPinNotice(null), 5000);
  };

  // Handle Cloud Sync Pull
  const handleForceCloudPull = async () => {
    setIsSyncing(true);
    try {
      await pullLatestFromFirestore('ROSTER');
      refreshData();
      setSyncNotice('✅ Sinkronisasi cloud Firestore berhasil diperbarui ke memori lokal.');
    } catch (e: any) {
      setSyncNotice(`❌ Gagal pull cloud: ${e?.message || e}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncNotice(null), 5000);
    }
  };

  // Handle Clear Logs
  const handleClearLogs = () => {
    if (window.confirm('Bersihkan seluruh log telemetri aktivitas lokal? (Data tidak dapat dikembalikan)')) {
      clearAllActivityLogs();
      refreshData();
      setSyncNotice('🧹 Seluruh log aktivitas telah dibersihkan.');
      setTimeout(() => setSyncNotice(null), 4000);
    }
  };

  const maxHourlyVal = Math.max(...hourlyData.map(d => d.totalCount), 1);
  const maxDailyVal = Math.max(...dailyData.map(d => d.totalCount), 1);
  const maxModuleVal = Math.max(...moduleBreakdown.map(d => d[1]), 1);

  return (
    <div className="min-h-screen bg-[#070B0E] text-gray-100 font-sans pb-16">
      {/* ================= TOP DEVELOPER SYSTEM COMMAND HEADER ================= */}
      <header className="sticky top-0 z-40 bg-[#0B1015]/95 backdrop-blur-md border-b border-emerald-500/30 shadow-xl shadow-black/80">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Branding & Developer Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-900/50 border border-emerald-400/60 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <Terminal className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-wide font-mono flex items-center gap-1.5">
                  CORE DEVELOPER SYSTEM CONSOLE
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/60 uppercase">
                    ROOT ACCESS
                  </span>
                </h1>
              </div>
              <p className="text-xs text-gray-400 font-mono flex items-center gap-2">
                <span>User: <strong className="text-emerald-300">{currentOfficer?.name || 'Lead Architect'}</strong> ({currentOfficer?.badge || 'DEV-001'})</span>
                <span className="text-gray-700">•</span>
                <span className="flex items-center gap-1 text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
                  FIREBASE CLOUD REALTIME LIVE
                </span>
              </p>
            </div>
          </div>

          {/* Right: Quick Inspection Switchers & Logout */}
          <div className="flex items-center gap-2 font-mono text-xs">
            {onSwitchPortal && (
              <>
                <button
                  type="button"
                  id="btn-inspect-hspd"
                  onClick={() => onSwitchPortal('POLICE')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0F1722] hover:bg-[#162338] border border-blue-500/50 text-blue-300 hover:text-blue-200 transition flex items-center gap-1.5 shadow"
                  title="Masuk ke tampilan operasional Kepolisian HSPD (Mode Inspeksi)"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Inspeksi HSPD</span>
                  <span className="sm:hidden">HSPD</span>
                </button>
                <button
                  type="button"
                  id="btn-inspect-gov"
                  onClick={() => onSwitchPortal('GOVERNMENT')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1F170C] hover:bg-[#2A1F10] border border-amber-500/50 text-amber-300 hover:text-amber-200 transition flex items-center gap-1.5 shadow"
                  title="Masuk ke tampilan operasional Balai Kota & Pemerintah (Mode Inspeksi)"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Inspeksi Balai Kota</span>
                  <span className="sm:hidden">Gov</span>
                </button>
                <button
                  type="button"
                  id="btn-inspect-citizen"
                  onClick={() => onSwitchPortal('CITIZEN')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0C1B14] hover:bg-[#122A1E] border border-emerald-500/50 text-emerald-300 hover:text-emerald-200 transition flex items-center gap-1.5 shadow"
                  title="Masuk ke portal publik Warga Sipil (SKCK & Izin Usaha)"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Portal Warga</span>
                  <span className="sm:hidden">Warga</span>
                </button>
              </>
            )}

            {onLogout && (
              <button
                type="button"
                id="btn-dev-logout"
                onClick={onLogout}
                className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 hover:text-white transition flex items-center gap-1.5 shadow font-bold"
                title="Keluar dari sesi Pengembang"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* ================= DEVELOPER NAVIGATION TABS ================= */}
        <div className="bg-[#05080A] border-t border-gray-800/80 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5 text-xs font-mono">
            <button
              type="button"
              id="tab-dev-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/50'
                  : 'text-gray-400 hover:text-emerald-300 hover:bg-emerald-950/30'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>📊 Grafik & Telemetri Real-Time</span>
            </button>

            <button
              type="button"
              id="tab-dev-logs"
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'logs'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/50'
                  : 'text-gray-400 hover:text-emerald-300 hover:bg-emerald-950/30'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>📜 Audit Log Seluruh Aktivitas ({filteredActivities.length})</span>
            </button>

            <button
              type="button"
              id="tab-dev-dpo"
              onClick={() => setActiveTab('dpo_parity')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'dpo_parity'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/50'
                  : 'text-gray-400 hover:text-emerald-300 hover:bg-emerald-950/30'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>⚖️ Paritas & Audit DPO Buronan</span>
            </button>

            <button
              type="button"
              id="tab-dev-database"
              onClick={() => setActiveTab('database')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'database'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/50'
                  : 'text-gray-400 hover:text-emerald-300 hover:bg-emerald-950/30'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>🗄️ Database & Cloud Firestore</span>
            </button>

            <button
              type="button"
              id="tab-dev-discord"
              onClick={() => setActiveTab('discord_bot')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'discord_bot'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/50'
                  : 'text-gray-400 hover:text-emerald-300 hover:bg-emerald-950/30'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>🤖 Discord Bot Gateway</span>
            </button>

            <button
              type="button"
              id="tab-dev-pin"
              onClick={() => setActiveTab('pin_manager')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'pin_manager'
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/50'
                  : 'text-gray-400 hover:text-emerald-300 hover:bg-emerald-950/30'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>🔑 Master PIN Override</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sync / Notification Alert Banner */}
      {syncNotice && (
        <div className="max-w-7xl mx-auto px-4 mt-3">
          <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl text-xs font-mono text-emerald-200 flex items-center justify-between shadow-lg">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              {syncNotice}
            </span>
            <button onClick={() => setSyncNotice(null)} className="text-gray-400 hover:text-white text-xs">✕</button>
          </div>
        </div>
      )}

      {/* ================= MAIN DEVELOPER CONTENT CONTAINER ================= */}
      <main className="max-w-7xl mx-auto px-4 mt-5 space-y-6">

        {/* KPI OVERVIEW CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
          <div className="p-3.5 bg-[#0F141B] border border-gray-800 rounded-xl shadow">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span>Total Operasi Hari Ini</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">{metrics.todayTotal}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Dari {metrics.total} total riwayat aksi</div>
          </div>

          <div className="p-3.5 bg-[#0F141B] border border-gray-800 rounded-xl shadow">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span>Buronan DPO Aktif (10-99)</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400 mt-1">{metrics.activeBolos}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{metrics.wantedCitizens} terdata di DMV Sipil</div>
          </div>

          <div className="p-3.5 bg-[#0F141B] border border-gray-800 rounded-xl shadow">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span>Roster Polisi & Pejabat</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-400 mt-1">{metrics.rosterTotal + metrics.govRosterTotal}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{metrics.rosterTotal} Polisi • {metrics.govRosterTotal} Balai Kota</div>
          </div>

          <div className="p-3.5 bg-[#0F141B] border border-gray-800 rounded-xl shadow">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span>Rasio HSPD vs Pemerintah</span>
              <Scale className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{metrics.hspdPercent}% : {metrics.govPercent}%</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Distribusi beban kerja platform</div>
          </div>
        </div>

        {/* ================= TAB 1: ANALYTICS & CHARTS ================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Chart Control Bar */}
            <div className="p-4 bg-[#0F141C] border border-gray-800 rounded-2xl shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    GRAFIK AKTIVITAS SISTEM SECARA REAL-TIME
                  </h2>
                  <p className="text-xs text-gray-400">
                    Memantau lonjakan beban kerja, kasus pidana, penerbitan surat, penilangan, dan seluruh interaksi.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  {/* Entity Filter */}
                  <div className="flex bg-[#070A0E] border border-gray-700/80 rounded-lg p-0.5">
                    {(['ALL', 'HSPD', 'GOVERNMENT'] as const).map(ent => (
                      <button
                        key={ent}
                        type="button"
                        onClick={() => setChartEntityFilter(ent)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                          chartEntityFilter === ent
                            ? 'bg-emerald-600 text-white'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {ent === 'ALL' ? 'Semua' : ent}
                      </button>
                    ))}
                  </div>

                  {/* Chart View Mode */}
                  <div className="flex bg-[#070A0E] border border-gray-700/80 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveChartTab('HOURLY')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                        activeChartTab === 'HOURLY' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      24 Jam
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveChartTab('DAILY')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                        activeChartTab === 'DAILY' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      7 Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveChartTab('MODULES')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                        activeChartTab === 'MODULES' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      Modul
                    </button>
                  </div>
                </div>
              </div>

              {/* Render Selected Chart */}
              {activeChartTab === 'HOURLY' && (
                <div className="space-y-2">
                  <div className="text-[11px] text-gray-400 font-mono flex items-center justify-between">
                    <span>Grafik Aktivitas per Jam (24 Jam Terakhir)</span>
                    <span className="text-emerald-400">Peak: {maxHourlyVal} Aksi/Jam</span>
                  </div>
                  <div className="h-56 flex items-end gap-1.5 pt-6 pb-2 px-2 bg-[#090D12] border border-gray-800/80 rounded-xl overflow-x-auto no-scrollbar">
                    {hourlyData.map((d, idx) => {
                      const count = chartEntityFilter === 'HSPD' ? d.hspdCount : chartEntityFilter === 'GOVERNMENT' ? d.govCount : d.totalCount;
                      const heightPercent = Math.max((count / maxHourlyVal) * 100, 4);
                      const isZero = count === 0;
                      return (
                        <div 
                          key={idx}
                          onMouseEnter={() => setHoveredDataPoint(d)}
                          onMouseLeave={() => setHoveredDataPoint(null)}
                          className="flex-1 min-w-[20px] flex flex-col items-center justify-end h-full group relative cursor-pointer"
                        >
                          <div 
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t transition-all ${
                              isZero 
                                ? 'bg-gray-800/40' 
                                : 'bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300 shadow-sm shadow-emerald-500/20'
                            }`}
                          ></div>
                          <span className="text-[9px] text-gray-500 font-mono mt-2 truncate w-full text-center">
                            {d.hour.split(':')[0]}
                          </span>

                          {/* Hover Tooltip */}
                          <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                            <div className="bg-gray-900 border border-emerald-500 text-white text-[10px] font-mono py-1 px-2 rounded shadow-2xl whitespace-nowrap">
                              <strong>{d.hour}</strong>: {count} aksi (HSPD: {d.hspdCount}, Gov: {d.govCount})
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeChartTab === 'DAILY' && (
                <div className="space-y-2">
                  <div className="text-[11px] text-gray-400 font-mono flex items-center justify-between">
                    <span>Tren Aktivitas Harian (7 Hari Terakhir)</span>
                    <span className="text-emerald-400">Puncak: {maxDailyVal} Aksi/Hari</span>
                  </div>
                  <div className="h-56 flex items-end gap-3 pt-6 pb-2 px-3 bg-[#090D12] border border-gray-800/80 rounded-xl">
                    {dailyData.map((d, idx) => {
                      const count = chartEntityFilter === 'HSPD' ? d.hspdCount : chartEntityFilter === 'GOVERNMENT' ? d.govCount : d.totalCount;
                      const heightPercent = Math.max((count / maxDailyVal) * 100, 6);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer">
                          <div 
                            style={{ height: `${heightPercent}%` }}
                            className="w-full rounded-t bg-gradient-to-t from-blue-600 to-indigo-400 group-hover:from-blue-500 group-hover:to-indigo-300 transition-all shadow-md"
                          ></div>
                          <span className="text-[10px] text-gray-400 font-mono mt-2 truncate w-full text-center">
                            {d.dayLabel}
                          </span>
                          <span className="text-[9px] text-gray-500 font-mono font-bold">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeChartTab === 'MODULES' && (
                <div className="space-y-3">
                  <div className="text-[11px] text-gray-400 font-mono">
                    Distribusi Beban Kerja Berdasarkan Modul Sistem
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {moduleBreakdown.map(([modName, count]) => {
                      const pct = Math.round((count / maxModuleVal) * 100);
                      return (
                        <div key={modName} className="p-2.5 bg-[#090D12] border border-gray-800/80 rounded-lg">
                          <div className="flex items-center justify-between text-xs font-mono mb-1">
                            <span className="font-bold text-gray-200">{modName}</span>
                            <span className="text-emerald-400 font-bold">{count} Aksi</span>
                          </div>
                          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${pct}%` }} 
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: AUDIT LOGS ================= */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            {/* Filter & Action Toolbar */}
            <div className="p-3 bg-[#0F141C] border border-gray-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari aktor, badge, kasus, tindakan atau modul..."
                  className="w-full bg-[#080B0F] border border-gray-700/80 rounded-lg px-3 py-1.5 text-xs text-gray-100 outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-[#080B0F] border border-gray-700/80 rounded-lg p-0.5">
                  {(['ALL', 'HSPD', 'GOVERNMENT', 'SYSTEM'] as const).map(ent => (
                    <button
                      key={ent}
                      type="button"
                      onClick={() => setSelectedEntityFilter(ent)}
                      className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                        selectedEntityFilter === ent ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {ent}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-bold transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-300 transition"
                  title="Bersihkan Log"
                >
                  🧹 Clear
                </button>
              </div>
            </div>

            {/* Log Stream Table */}
            <div className="bg-[#0F141C] border border-gray-800 rounded-xl overflow-hidden shadow">
              <div className="p-3 bg-[#090D12] border-b border-gray-800 text-xs font-mono text-gray-400 flex items-center justify-between">
                <span>Daftar Log Aktivitas Terpantau ({filteredActivities.length} data)</span>
                <button onClick={refreshData} className="hover:text-emerald-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              <div className="divide-y divide-gray-800/80 max-h-[550px] overflow-y-auto">
                {filteredActivities.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 font-mono text-xs">
                    Tidak ada aktivitas yang sesuai dengan filter pencarian.
                  </div>
                ) : (
                  filteredActivities.map(act => (
                    <div key={act.id} className="p-3 hover:bg-gray-800/30 transition text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            act.entity === 'HSPD' ? 'bg-blue-950 text-blue-300 border border-blue-700/60' :
                            act.entity === 'GOVERNMENT' ? 'bg-amber-950 text-amber-300 border border-amber-700/60' :
                            'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                          }`}>
                            {act.entity}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-gray-800 text-gray-300 border border-gray-700">
                            {act.module}
                          </span>
                          <strong className="text-white text-xs">{act.title}</strong>
                        </div>
                        <p className="text-gray-400 text-[11px] leading-relaxed">
                          {act.description}
                        </p>
                      </div>

                      <div className="text-right shrink-0 text-[10px] text-gray-400">
                        <div>
                          <strong className="text-gray-200">{act.actor || 'Sistem'}</strong>
                          {act.actorBadge && <span className="text-emerald-400 ml-1">[{act.actorBadge}]</span>}
                        </div>
                        <span className="text-gray-500">
                          {new Date(act.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {new Date(act.timestamp).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: DPO PARITY & WANTED AUDIT ================= */}
        {activeTab === 'dpo_parity' && (
          <div className="space-y-4 font-mono">
            <div className="p-4 bg-[#0F141C] border border-gray-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  SISTEM AUDIT & PERBAIKAN INTEGRITAS DPO BURONAN (10-99)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Sinkronisasi menyeluruh memastikan buronan di BOLO Satlantas/Patroli, Kasus CID Detektif (Surat Perintah Aktif), dan DMV Kependudukan selalu berstatus 10-99 seragam tanpa celah.
                </p>
              </div>

              <button
                type="button"
                id="btn-run-dpo-sync"
                disabled={isSyncing}
                onClick={handleRunDpoSync}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-950/60 disabled:opacity-60 whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Audit & Perbaiki Semua DPO Sekarang'}</span>
              </button>
            </div>

            {/* Active Wanted Table */}
            <div className="bg-[#0F141C] border border-gray-800 rounded-xl overflow-hidden shadow">
              <div className="p-3 bg-[#090D12] border-b border-gray-800 text-xs text-gray-400 flex items-center justify-between">
                <span>Daftar Buronan Terdata di Berbagai Modul ({boloList.filter(b => b.active !== false).length} BOLO Aktif)</span>
                <span className="text-emerald-400 font-bold">{citizens.filter(c => c.isWantedBolo).length} Terdaftar DPO di DMV</span>
              </div>

              <div className="divide-y divide-gray-800">
                {boloList.filter(b => b.active !== false).map(b => {
                  const targetName = (b as any).targetName || b.title.split('-')[0].replace(/\(.*?\)/g, '').trim() || b.title;
                  const targetId = (b as any).targetId || (b.title.match(/\((.*?)\)/)?.[1] || '');
                  const plateNumber = (b as any).plateNumber || '';
                  const officerName = (b as any).officerName || b.issuedBy;
                  const matchedCitizen = citizens.find(c => 
                    (c.fullName && c.fullName.toLowerCase() === targetName.toLowerCase()) ||
                    (c.citizenId && targetId && c.citizenId.toLowerCase() === targetId.toLowerCase())
                  );
                  const isCitizenSynced = Boolean(matchedCitizen?.isWantedBolo);

                  return (
                    <div key={b.id} className="p-3.5 hover:bg-gray-800/30 transition text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-700/60">
                            10-99 WANTED
                          </span>
                          <strong className="text-white text-sm">{targetName}</strong>
                          {targetId && <span className="text-gray-400">NIK: {targetId}</span>}
                          {plateNumber && <span className="text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded text-[10px]">Plat: {plateNumber}</span>}
                        </div>
                        <p className="text-gray-400 text-xs mt-1">
                          Kasus: <strong>{b.title}</strong> — {b.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right text-[10px]">
                          <div className={isCitizenSynced ? "text-green-400 font-bold" : "text-amber-400 font-bold"}>
                            {isCitizenSynced ? "✓ Sinkron di DMV Warga" : "⚠️ Belum Sinkron di DMV"}
                          </div>
                          <span className="text-gray-500">Oleh: {officerName}</span>
                        </div>

                        {!isCitizenSynced && (
                          <button
                            type="button"
                            onClick={() => {
                              handleRunDpoSync();
                            }}
                            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold transition"
                          >
                            Perbaiki
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: DATABASE & CLOUD FIRESTORE ================= */}
        {activeTab === 'database' && (
          <div className="space-y-4 font-mono">
            <div className="p-4 bg-[#0F141C] border border-gray-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    STATUS BASIS DATA CLOUD & KOLEKSI FIRESTORE
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Project Database: <strong className="text-emerald-400">ai-studio-hspdroleplayassi-2774b304-6286-4462-9d17-823224c7f4fd</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleForceCloudPull}
                  disabled={isSyncing}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Force Pull Firestore</span>
                </button>
              </div>

              {/* Collections Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-[#080B0F] border border-gray-800 rounded-lg">
                  <span className="text-gray-400 text-xs">Koleksi: roster</span>
                  <div className="text-lg font-bold text-white mt-1">{rosterList.length} Personel</div>
                </div>
                <div className="p-3 bg-[#080B0F] border border-gray-800 rounded-lg">
                  <span className="text-gray-400 text-xs">Koleksi: gov_roster</span>
                  <div className="text-lg font-bold text-amber-400 mt-1">{govRosterList.length} Pejabat</div>
                </div>
                <div className="p-3 bg-[#080B0F] border border-gray-800 rounded-lg">
                  <span className="text-gray-400 text-xs">Koleksi: citizens (DMV)</span>
                  <div className="text-lg font-bold text-emerald-400 mt-1">{citizens.length} Warga</div>
                </div>
                <div className="p-3 bg-[#080B0F] border border-gray-800 rounded-lg">
                  <span className="text-gray-400 text-xs">Koleksi: bolos & dpo</span>
                  <div className="text-lg font-bold text-rose-400 mt-1">{boloList.length} BOLO</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: DISCORD BOT GATEWAY ================= */}
        {activeTab === 'discord_bot' && (
          <div className="space-y-4 font-mono">
            <div className="p-4 bg-[#0F141C] border border-gray-800 rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                STATUS GATEWAY BOT DISCORD & WEBHOOK DIAGNOSTICS
              </h3>
              <p className="text-xs text-gray-400">
                Bot Token: {botConfig.botToken ? `${botConfig.botToken.slice(0, 8)}... (Terkonfigurasi)` : 'Belum Disetel'} • Webhook URL: {changelogConfig.webhookUrl ? `${changelogConfig.webhookUrl.slice(0, 35)}...` : 'Belum Disetel'}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={webhookTestMessage}
                  onChange={e => setWebhookTestMessage(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#080B0F] border border-gray-700 rounded-lg text-xs text-gray-100 outline-none focus:border-emerald-400"
                  placeholder="Ketik pesan tes broadcast webhook..."
                />
                <button
                  type="button"
                  onClick={async () => {
                    setWebhookStatus('Mengirim ping tes...');
                    try {
                      const targetUrl = changelogConfig.webhookUrl || getSavedWebhookConfig().webhookUrl;
                      if (!targetUrl) {
                        setWebhookStatus('❌ URL Webhook belum disetel.');
                      } else {
                        const ok = await sendDiscordLog(targetUrl, {
                          title: '📡 [DEV GATEWAY TEST PING]',
                          description: webhookTestMessage,
                          color: 0x10B981
                        });
                        setWebhookStatus(ok ? '✅ Ping webhook sukses terkirim ke Discord!' : '❌ Gagal mengirim ping webhook.');
                      }
                    } catch (e: any) {
                      setWebhookStatus(`❌ Gagal kirim: ${e?.message || e}`);
                    }
                    setTimeout(() => setWebhookStatus(null), 5000);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer"
                >
                  Kirim Tes Webhook
                </button>
              </div>

              {webhookStatus && (
                <div className="text-xs text-emerald-300 font-bold">{webhookStatus}</div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 6: PIN OVERRIDE MANAGER ================= */}
        {activeTab === 'pin_manager' && (
          <div className="space-y-4 font-mono">
            <div className="p-4 bg-[#0F141C] border border-gray-800 rounded-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                KONSOL MASTER PIN OVERRIDE & RESET PETUGAS
              </h3>
              <p className="text-xs text-gray-400">
                Fitur darurat pengembang: memperbarui PIN akun petugas polisi atau pejabat kenegaraan secara instan tanpa perlu persetujuan manual jika terjadi masalah login.
              </p>

              {pinNotice && (
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/80 rounded-lg text-xs text-emerald-200">
                  {pinNotice}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Pilih Badge Petugas:</label>
                  <select
                    value={selectedTargetBadge}
                    onChange={e => setSelectedTargetBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-[#080B0F] border border-gray-700 rounded-lg text-xs text-gray-100 outline-none focus:border-emerald-400"
                  >
                    <option value="">-- Pilih Anggota Roster --</option>
                    {rosterList.map(o => (
                      <option key={o.badge} value={o.badge}>
                        {o.badge} - {o.name} ({o.rank}) [PIN: {o.pin}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">PIN Baru (6 Digit / Angka):</label>
                  <input
                    type="text"
                    value={newMasterPin}
                    onChange={e => setNewMasterPin(e.target.value)}
                    placeholder="Contoh: 123456"
                    className="w-full px-3 py-2 bg-[#080B0F] border border-gray-700 rounded-lg text-xs text-gray-100 outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleApplyMasterPin}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
                  >
                    Terapkan Override PIN
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
