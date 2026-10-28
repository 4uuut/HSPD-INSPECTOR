import React, { useState, useEffect, useMemo } from 'react';
import { 
  Terminal, Shield, Building2, Activity, Database, RefreshCw, 
  Search, Filter, Download, Upload, CheckCircle2, AlertTriangle, 
  Clock, Users, FileText, ShieldAlert, Car, Scale, Cpu, Lock, 
  ExternalLink, Layers, Sparkles, Check, ChevronDown, ChevronUp, BarChart2,
  TrendingUp, Radio, Flame, Award, Globe, LogOut, KeyRound, 
  MessageSquare, Wrench, ShieldCheck, Play, ArrowRight, Eye, User,
  Megaphone, Bell, Volume2, ChevronLeft, ChevronRight, Send, Zap, X, LogIn
} from 'lucide-react';
import { 
  OfficerProfile, 
  SystemActivityLog, 
  ActivityEntity,
  BoloAlert,
  CitizenProfile,
  DetectiveCase,
  ArrestRecord
} from '../types';
import { ArrestMonthlyAnalyticsChart } from './ArrestMonthlyAnalyticsChart';
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
import { 
  SystemAnnouncement, 
  getSystemAnnouncements,
  publishSystemAnnouncement,
  toggleAnnouncementBanner,
  forceSyncOfficialAnnouncements,
  AnnouncementCategory,
  AnnouncementSeverity,
  AnnouncementAudience
} from '../utils/systemAnnouncementStorage';
import { playSystemNotificationChime } from '../utils/systemNotificationAudio';
import { checkAndBroadcastLatestRelease } from '../utils/autoChangelogBroadcaster';
import { DiscordBotInviteCard } from './DiscordBotInviteCard';
import { LiveSystemAnnouncementsHub } from './LiveSystemAnnouncementsHub';
import { DiscordReleaseAnnouncementModal } from './DiscordReleaseAnnouncementModal';
import { ChangelogWebhookConfigModal } from './ChangelogWebhookConfigModal';
import { 
  getComingSoonConfig, saveComingSoonConfig, ComingSoonConfig, SAWERIA_DONATION_URL 
} from '../utils/comingSoonStorage';

interface Props {
  currentOfficer: OfficerProfile | null;
  onSwitchPortal?: (portal: 'POLICE' | 'GOVERNMENT' | 'CITIZEN' | 'LOGIN') => void;
  onLogout?: () => void;
}

export const DeveloperWorkspacePortal: React.FC<Props> = ({
  currentOfficer,
  onSwitchPortal,
  onLogout
}) => {
  // Developer active tab (defaults to system_broadcasts for live update transparency)
  const [activeTab, setActiveTab] = useState<'system_broadcasts' | 'analytics' | 'logs' | 'dpo_parity' | 'database' | 'discord_bot' | 'pin_manager'>('system_broadcasts');
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>(() => getSystemAnnouncements());
  const [isDiscordReleaseModalOpen, setIsDiscordReleaseModalOpen] = useState(false);

  // Carousel & Flash Broadcast states for Core Developer Console
  const [activeNoticeIndex, setActiveNoticeIndex] = useState(0);
  const [isFlashModalOpen, setIsFlashModalOpen] = useState(false);
  const [flashVersion, setFlashVersion] = useState('v4.3.0');
  const [flashTitle, setFlashTitle] = useState('');
  const [flashCategory, setFlashCategory] = useState<AnnouncementCategory>('UPDATE');
  const [flashSeverity, setFlashSeverity] = useState<AnnouncementSeverity>('IMPORTANT');
  const [flashAudience, setFlashAudience] = useState<AnnouncementAudience>('GLOBAL');
  const [flashDescription, setFlashDescription] = useState('');
  const [flashFeature1, setFlashFeature1] = useState('');
  const [flashFeature2, setFlashFeature2] = useState('');
  const [flashIsBanner, setFlashIsBanner] = useState(true);
  const [flashDiscord, setFlashDiscord] = useState(true);
  const [isPublishingFlash, setIsPublishingFlash] = useState(false);

  // Activity logs & telemetry
  const [activities, setActivities] = useState<SystemActivityLog[]>(() => getAllAggregatedActivities());
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<'ALL' | 'HSPD' | 'GOVERNMENT' | 'SYSTEM'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChartTab, setActiveChartTab] = useState<'HOURLY' | 'DAILY' | 'MODULES' | 'ARRESTS'>('HOURLY');
  const [arrestRecords, setArrestRecords] = useState<ArrestRecord[]>(() => {
    try {
      const saved = localStorage.getItem('hspd_arrest_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
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
  const [isChangelogWebhookModalOpen, setIsChangelogWebhookModalOpen] = useState(false);
  const [selectedNoticeForWebhook, setSelectedNoticeForWebhook] = useState<SystemAnnouncement | null>(null);
  const [webhookTestMessage, setWebhookTestMessage] = useState('📡 [PING TEST] Pesan uji coba koneksi gateway pengembang MDT HSPD.');
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  // Coming Soon status & controls
  const [comingSoonConfig, setComingSoonConfig] = useState<ComingSoonConfig>(() => getComingSoonConfig());

  useEffect(() => {
    const handleComingSoonSync = () => setComingSoonConfig(getComingSoonConfig());
    window.addEventListener('hspd-coming-soon-updated', handleComingSoonSync);
    return () => window.removeEventListener('hspd-coming-soon-updated', handleComingSoonSync);
  }, []);

  // Ensure v4.3.0 latest release is dynamically loaded into announcements on mount
  useEffect(() => {
    const currentList = getSystemAnnouncements();
    if (!currentList.some(a => a.version === 'v4.3.0')) {
      const synced = forceSyncOfficialAnnouncements();
      setAnnouncements(synced);
    }
  }, []);

  const handleToggleComingSoon = (newEnabled: boolean) => {
    const updated: ComingSoonConfig = { ...comingSoonConfig, isEnabled: newEnabled };
    setComingSoonConfig(updated);
    saveComingSoonConfig(updated);
    logDeveloperSystemActivity({
      entity: 'SYSTEM',
      module: 'SETTINGS',
      action: 'SYSTEM_SYNC',
      actor: currentOfficer?.name || 'Lead Developer',
      actorBadge: currentOfficer?.badge || '#DEV-001',
      severity: 'INFO',
      title: `Ubah Status Coming Soon: ${newEnabled ? 'AKTIF (Terkunci)' : 'NONAKTIF (Publik Terbuka)'}`,
      description: newEnabled 
        ? 'Website dikunci ke tampilan Coming Soon untuk publik.' 
        : 'Mode Coming Soon dinonaktifkan. Seluruh portal login polisi, pemerintah, dan layanan warga dibuka normal.'
    });
    if (!newEnabled) {
      setSyncNotice('🟢 Mode Coming Soon telah DINONAKTIFKAN! Website resmi kini terbuka untuk umum (Anggota HSPD, Balai Kota & Warga dapat login normal).');
    } else {
      setSyncNotice('🔴 Mode Coming Soon AKTIF! Seluruh fitur & portal login publik dikunci.');
    }
    setTimeout(() => setSyncNotice(null), 8000);
  };

  // Refresh activity data & system announcements
  const refreshData = () => {
    setComingSoonConfig(getComingSoonConfig());
    setActivities(getAllAggregatedActivities());
    setBoloList(getSavedBoloAlerts());
    setCitizens(getSavedCitizens());
    setCidCases(getSavedDetectiveCases());
    setRosterList(getRosterFromStorage());
    setGovRosterList(getGovernmentRoster());
    setAnnouncements(getSystemAnnouncements());
    setChangelogConfig(getSavedChangelogWebhookConfig());
  };

  useEffect(() => {
    const handleStorageUpdate = () => refreshData();
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('hspd_activity_updated', handleStorageUpdate);
    window.addEventListener('hspd-system-announcements-updated', handleStorageUpdate);
    const interval = setInterval(refreshData, 10000);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('hspd_activity_updated', handleStorageUpdate);
      window.removeEventListener('hspd-system-announcements-updated', handleStorageUpdate);
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

  // Notice Carousel Helpers
  const currentNotice: SystemAnnouncement | undefined = announcements[activeNoticeIndex] || announcements[0];

  const handleNextNotice = () => {
    if (announcements.length === 0) return;
    setActiveNoticeIndex(prev => (prev + 1) % announcements.length);
  };

  const handlePrevNotice = () => {
    if (announcements.length === 0) return;
    setActiveNoticeIndex(prev => (prev - 1 + announcements.length) % announcements.length);
  };

  const handleQuickToggleBanner = (id: string, currentState: boolean) => {
    toggleAnnouncementBanner(id, !currentState);
    refreshData();
    setSyncNotice(!currentState ? '📢 Banner pemberitahuan sistem diaktifkan di seluruh portal!' : 'Banner berjalan dinonaktifkan.');
    setTimeout(() => setSyncNotice(null), 3500);
  };

  const handleQuickDiscordPush = async (item: SystemAnnouncement) => {
    try {
      const savedBotToken = localStorage.getItem('hspd_discord_bot_token') || '';
      const savedWebhook = localStorage.getItem('hspd_changelog_webhook_url') || '';
      const targetChannelId = localStorage.getItem('hspd_changelog_channel_id') || '1547776898833326161';

      setSyncNotice('📡 Menyiarkan ke Channel Discord via Bot Resmi...');
      const res = await checkAndBroadcastLatestRelease(true, {
        version: item.version,
        title: item.title,
        headerText: `[ SIARAN RESMI PEMBARUAN SISTEM ${item.version} ]`,
        customDescription: item.description,
        newFeatures: item.features,
        removedOrAdjusted: item.bugFixes?.length ? item.bugFixes : undefined,
        improvements: item.improvements,
        bugFixes: item.bugFixes,
        channelId: targetChannelId,
        botToken: savedBotToken,
        webhookUrl: savedWebhook
      });

      if (res.success) {
        setSyncNotice(`✅ Berhasil disiarkan ke Discord (${item.version}) melalui Bot Resmi!`);
      } else {
        setSyncNotice(`❌ ${res.message}`);
        setSelectedNoticeForWebhook(item);
        setIsChangelogWebhookModalOpen(true);
      }
    } catch (e: any) {
      setSyncNotice(`❌ Gagal siar: ${e?.message || e}`);
    }
    setTimeout(() => setSyncNotice(null), 5000);
  };

  // Synchronize Official Announcements (v4.3.0, v4.2.6, etc.)
  const handleForceSyncOfficialUpdates = () => {
    setIsSyncing(true);
    try {
      const synced = forceSyncOfficialAnnouncements();
      setAnnouncements(synced);
      setActiveNoticeIndex(0);
      playSystemNotificationChime('IMPORTANT');
      setSyncNotice('✅ Berhasil menyinkronkan seluruh pembaruan sistem resmi terbaru (v4.3.0)!');
    } catch (err: any) {
      setSyncNotice(`❌ Gagal sinkronisasi: ${err?.message || err}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncNotice(null), 5000);
    }
  };

  const handleApplyFlashPreset = (type: 'bonus' | 'attendance' | 'bank' | 'isolation' | 'maintenance' | 'hotfix') => {
    if (type === 'bonus') {
      setFlashVersion('v4.3.0');
      setFlashTitle('Pembaruan Sistem: Kalkulator & Rekapitulasi Bonus Kinerja 6 Komponen');
      setFlashCategory('UPDATE');
      setFlashSeverity('IMPORTANT');
      setFlashAudience('GLOBAL');
      setFlashDescription('Pembaruan resmi MDT HSPD v4.3.0: Menghadirkan Modul Kalkulator & Rekapitulasi Bonus Kinerja Operasional Petugas berbasis 6 komponen utama: Kasus Penindakan, Pemasukan Efiden, Pemasukan Tilang, Pemasukan Impound, Sukses Restok Persenjataan, dan Peleburan Senjata ke Tungku Smelter, terintegrasi rekening bank dinas & ekspor slip gambar.');
      setFlashFeature1('Perhitungan otomatis 6 pilar kinerja dari data riil database kasus, bukti, tilang, impound, restok & lebur');
      setFlashFeature2('Ekspor slip bonus resmi berwatermark lambang HSPD ke gambar PNG/JPG & Webhook Discord');
      playSystemNotificationChime('IMPORTANT');
    } else if (type === 'attendance') {
      setFlashVersion('v4.2.5');
      setFlashTitle('Pembaruan Sistem: Modul Absensi Manual Mingguan & Force On/Off Duty Atasan');
      setFlashCategory('UPDATE');
      setFlashSeverity('IMPORTANT');
      setFlashAudience('GLOBAL');
      setFlashDescription('Pembaruan resmi MDT HSPD v4.2.5: Menghadirkan modul rekap absensi dinas mingguan manual lengkap (✅, ❌, 📝, 🤒, 🌴, ⚪) dengan rotasi tanggal mingguan dinamis berkelanjutan, serta tombol langsung Force On/Off Duty di roster anggota untuk menertibkan anggota yang lupa off-duty.');
      setFlashFeature1('Tabel Absensi Mingguan Atasan: 6 status resmi ✅ Hadir, ❌ Absen, 📝 Izin, 🤒 Sakit, 🌴 Cuti, ⚪ Libur');
      setFlashFeature2('Tombol Force On/Off Duty Atasan di Roster Anggota & dialog konfirmasi aman');
      playSystemNotificationChime('IMPORTANT');
    } else if (type === 'bank') {
      setFlashVersion('v4.2.4');
      setFlashTitle('Pembaruan Sistem: Integrasi Rekening Bank Dinas di Formulir Roster');
      setFlashCategory('UPDATE');
      setFlashSeverity('IMPORTANT');
      setFlashAudience('GLOBAL');
      setFlashDescription('Integrasi kolom nomor rekening bank resmi untuk seluruh personel dinas kepolisian & aparatur balai kota guna kemudahan verifikasi penggajian dan tunjangan dinas.');
      setFlashFeature1('Kolom Nomor Rekening Bank pada Tambah & Edit Anggota Roster');
      setFlashFeature2('Pencarian cepat & 1-click salin rekening bank dinas');
      playSystemNotificationChime('IMPORTANT');
    } else if (type === 'isolation') {
      setFlashVersion('v4.2.4');
      setFlashTitle('Pengamanan Hak Akses: Isolasi Berkas Perkara 7 Divisi Kepolisian');
      setFlashCategory('UPDATE');
      setFlashSeverity('IMPORTANT');
      setFlashAudience('HSPD');
      setFlashDescription('Penegakan kepatuhan privasi berkas perkara kepolisian: setiap personel hanya dapat mengakses berkas kasus milik divisinya sendiri.');
      setFlashFeature1('Isolasi hak akses berkas 7 divisi resmi kepolisian');
      setFlashFeature2('Audit akses berkas otomatis tercatat di log telemetri pengembang');
      playSystemNotificationChime('IMPORTANT');
    } else if (type === 'maintenance') {
      setFlashVersion('v4.2.5');
      setFlashTitle('Jadwal Pemeliharaan Server & Sinkronisasi Firestore Realtime');
      setFlashCategory('MAINTENANCE');
      setFlashSeverity('URGENT');
      setFlashAudience('GLOBAL');
      setFlashDescription('Pemberitahuan pemeliharaan terjadwal untuk optimalisasi bandwidth data dan peningkatan kapasitas realtime listener.');
      setFlashFeature1('Optimalisasi bandwidth koneksi Firestore');
      setFlashFeature2('Pembersihan cache telemetri sistem');
      playSystemNotificationChime('URGENT');
    } else if (type === 'hotfix') {
      setFlashVersion('v4.2.4-hotfix');
      setFlashTitle('Hotfix Darurat: Patch Stabilitas Sesi & Submisi Formulir');
      setFlashCategory('ALERT');
      setFlashSeverity('CRITICAL');
      setFlashAudience('GLOBAL');
      setFlashDescription('Penerapan perbaikan darurat untuk memastikan keandalan otentikasi login dan integritas pengiriman data.');
      setFlashFeature1('Perbaikan validasi token otentikasi sesi');
      setFlashFeature2('Optimalisasi recovery data offline');
      playSystemNotificationChime('CRITICAL');
    }
  };

  const handlePublishFlashNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashTitle.trim() || !flashDescription.trim()) {
      alert('Judul dan deskripsi pengumuman wajib diisi!');
      return;
    }
    setIsPublishingFlash(true);
    try {
      const feats = [flashFeature1.trim(), flashFeature2.trim()].filter(Boolean);
      const pub = publishSystemAnnouncement({
        version: flashVersion.trim() || 'v4.2.4',
        title: flashTitle.trim(),
        category: flashCategory,
        severity: flashSeverity,
        targetAudience: flashAudience,
        description: flashDescription.trim(),
        features: feats.length > 0 ? feats : ['Implementasi rilis kilat dari Core Developer System Console'],
        improvements: ['Penyempurnaan performa dan sinkronisasi real-time lintas portal'],
        bugFixes: [],
        publishedBy: currentOfficer?.name || 'Lead Architect',
        publishedByBadge: currentOfficer?.badge || 'DEV-001',
        isBannerActive: flashIsBanner,
        discordBroadcasted: flashDiscord
      });

      logDeveloperSystemActivity({
        module: 'SYSTEM_ANNOUNCEMENT',
        action: 'SYSTEM_ANNOUNCEMENT',
        title: `Siaran Kilat Sistem: ${pub.version} - ${pub.title}`,
        description: `Kategori: ${flashCategory} | Urgensi: ${flashSeverity} | Sasaran: ${flashAudience}`,
        entity: 'SYSTEM',
        actor: currentOfficer?.name || 'Lead Developer',
        actorBadge: currentOfficer?.badge || 'DEV-001',
        severity: 'INFO'
      });

      if (flashDiscord) {
        checkAndBroadcastLatestRelease(true, {
          version: pub.version,
          title: pub.title,
          headerText: `[ PEMBERITAHUAN KILAT SISTEM ${pub.version} ]`,
          customDescription: pub.description,
          newFeatures: pub.features,
          improvements: pub.improvements,
          bugFixes: pub.bugFixes
        }).catch(() => {});
      }

      refreshData();
      setIsFlashModalOpen(false);
      setFlashTitle('');
      setFlashDescription('');
      setFlashFeature1('');
      setFlashFeature2('');
      setSyncNotice(`🚀 Siaran kilat sistem ${pub.version} berhasil diterbitkan secara live!`);
      setTimeout(() => setSyncNotice(null), 5000);
    } catch (err: any) {
      alert(`Gagal menerbitkan siaran: ${err?.message || err}`);
    } finally {
      setIsPublishingFlash(false);
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

              {/* Live System Notification Pill in Header */}
              {currentNotice && (
                <div 
                  onClick={() => setActiveTab('system_broadcasts')}
                  className="mt-1.5 inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/50 text-[10px] font-mono text-emerald-300 cursor-pointer hover:bg-emerald-900/70 transition shadow-sm"
                  title="Buka Pusat Pemberitahuan Sistem Terbaru"
                >
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold text-white uppercase tracking-wider">LIVE UPDATE:</span>
                  <span className="text-emerald-300 font-bold px-1.5 py-0.2 rounded bg-black/50 border border-emerald-500/40">{currentNotice.version}</span>
                  <span className="text-gray-300 max-w-[200px] sm:max-w-md truncate">{currentNotice.title}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Quick Inspection Switchers & Logout */}
          <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
            {/* Quick Coming Soon Status indicator */}
            <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-2 text-[11px] ${
              comingSoonConfig.isEnabled 
                ? 'bg-rose-950/80 border-rose-600/70 text-rose-300' 
                : 'bg-emerald-950/80 border-emerald-600/70 text-emerald-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${comingSoonConfig.isEnabled ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="font-bold">{comingSoonConfig.isEnabled ? 'Coming Soon: ON' : 'Coming Soon: OFF'}</span>
              <button
                type="button"
                onClick={() => handleToggleComingSoon(!comingSoonConfig.isEnabled)}
                className="px-1.5 py-0.5 rounded bg-black/60 hover:bg-black text-[10px] text-white border border-gray-600 cursor-pointer"
                title={comingSoonConfig.isEnabled ? 'Matikan Coming Soon & Buka Website untuk Umum' : 'Kunci Website ke Mode Coming Soon'}
              >
                {comingSoonConfig.isEnabled ? 'Matikan' : 'Aktifkan'}
              </button>
            </div>

            {onSwitchPortal && (
              <>
                {/* Direct button to Public Login Portal (as in user screenshot) */}
                <button
                  type="button"
                  id="btn-inspect-login"
                  onClick={() => onSwitchPortal('LOGIN')}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400 text-white transition flex items-center gap-1.5 shadow font-bold cursor-pointer"
                  title="Beralih ke Tampilan Halaman Login Terminal Dinas (Sesuai Gambar Dokumen)"
                >
                  <LogIn className="w-3.5 h-3.5 text-white" />
                  <span>Portal Login Publik</span>
                </button>

                <button
                  type="button"
                  id="btn-inspect-hspd"
                  onClick={() => onSwitchPortal('POLICE')}
                  className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 border border-blue-400 text-white transition flex items-center gap-1.5 shadow font-bold cursor-pointer"
                  title="Beralih ke Tampilan Aplikasi Mode Normal (MDC Kepolisian)"
                >
                  <Shield className="w-3.5 h-3.5 text-white" />
                  <span>MDC Polisi</span>
                </button>

                <button
                  type="button"
                  id="btn-inspect-gov"
                  onClick={() => onSwitchPortal('GOVERNMENT')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1F170C] hover:bg-[#2A1F10] border border-amber-500/50 text-amber-300 hover:text-amber-200 transition flex items-center gap-1.5 shadow"
                  title="Masuk ke tampilan operasional Balai Kota & Pemerintah (Mode Inspeksi)"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Balai Kota</span>
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
                className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 hover:text-white transition flex items-center gap-1.5 shadow font-bold cursor-pointer"
                title={comingSoonConfig.isEnabled 
                  ? 'Keluar dari sesi Pengembang dan kunci kembali ke tampilan Coming Soon'
                  : 'Keluar dari sesi Pengembang dan buka Halaman Login Publik'}
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>{comingSoonConfig.isEnabled ? 'Keluar (Coming Soon)' : 'Keluar ke Login Publik'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ================= DEVELOPER NAVIGATION TABS ================= */}
        <div className="bg-[#05080A] border-t border-gray-800/80 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5 text-xs font-mono">
            <button
              type="button"
              id="tab-dev-system-broadcasts"
              onClick={() => setActiveTab('system_broadcasts')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'system_broadcasts'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-950/60 ring-1 ring-emerald-400/50'
                  : 'text-gray-400 hover:text-emerald-300 hover:bg-emerald-950/30'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>📢 Live Pemberitahuan Sistem ({announcements.length})</span>
            </button>

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

        {/* ================= CORE DEVELOPER LIVE UPDATE & SYSTEM BROADCAST COMMAND CENTER ================= */}
        <section className="relative overflow-hidden rounded-2xl border border-emerald-500/50 bg-gradient-to-r from-[#06120D] via-[#0A1B14] to-[#08151D] p-4 sm:p-5 shadow-2xl shadow-emerald-950/40">
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top Command Bar: Status, Stepper & Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-500/30">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-emerald-300 tracking-wider flex items-center gap-1.5 uppercase">
                  <Megaphone className="w-4 h-4 text-emerald-400 animate-pulse" />
                  LIVE UPDATE & PUSAT PEMBERITAHUAN SISTEM RESMI
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/60 text-emerald-400 border border-emerald-500/40">
                  REAL-TIME BROADCAST DISPATCH
                </span>
              </div>
            </div>

            {/* Stepper Carousel Controls & Fast Action Buttons */}
            <div className="flex items-center gap-2 font-mono text-xs">
              {announcements.length > 1 && (
                <div className="flex items-center bg-[#070D12] border border-gray-700/80 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={handlePrevNotice}
                    className="p-1 text-gray-400 hover:text-emerald-300 transition cursor-pointer"
                    title="Pemberitahuan Sebelumnya"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 text-[10px] text-gray-300 font-bold">
                    {activeNoticeIndex + 1} / {announcements.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextNotice}
                    className="p-1 text-gray-400 hover:text-emerald-300 transition cursor-pointer"
                    title="Pemberitahuan Selanjutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                id="btn-sync-official-updates"
                onClick={handleForceSyncOfficialUpdates}
                className="px-2.5 py-1.5 rounded-lg bg-[#0E1F18] hover:bg-[#163025] border border-emerald-500/60 text-emerald-300 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow"
                title="Tarik dan sinkronkan seluruh pembaruan sistem resmi terbaru (v4.3.0)"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sinkron Update</span>
              </button>

              <button
                type="button"
                id="btn-config-changelog-webhook"
                onClick={() => {
                  setSelectedNoticeForWebhook(currentNotice || null);
                  setIsChangelogWebhookModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow bg-[#0E1F18] hover:bg-[#163025] border-emerald-500/60 text-emerald-300"
                title="Konfigurasi Bot Discord Resmi / Channel ID (#changelog) untuk Siaran Pembaruan"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>🤖 Bot Discord Siaran</span>
              </button>

              <button
                type="button"
                onClick={() => playSystemNotificationChime(currentNotice?.severity || 'IMPORTANT')}
                className="px-2.5 py-1.5 rounded-lg bg-[#0E1A16] hover:bg-[#152B23] border border-emerald-500/50 text-emerald-300 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow"
                title="Putar nada lonceng siaran sistem (Audio Chime Test)"
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Tes Nada</span>
              </button>

              <button
                type="button"
                id="btn-flash-broadcast"
                onClick={() => setIsFlashModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-[11px] transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-lg shadow-emerald-950/60"
                title="Buka panel siaran kilat untuk langsung mengirimkan pengumuman ke seluruh sistem"
              >
                <Zap className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                <span>SIARAN KILAT</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('system_broadcasts')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-600/70 text-emerald-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="Buka Pusat Manajemen Siaran Lengkap"
              >
                <span>Kelola Rilis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Active Notice Highlight Card */}
          {currentNotice ? (
            <div className="mt-3.5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-8 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-black font-black font-mono text-xs shadow">
                    {currentNotice.version}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0D1822] text-cyan-300 border border-cyan-500/50 uppercase">
                    {currentNotice.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                    currentNotice.severity === 'CRITICAL' ? 'bg-red-950 text-red-300 border-red-700' :
                    currentNotice.severity === 'URGENT' ? 'bg-orange-950 text-orange-300 border-orange-700' :
                    'bg-emerald-950 text-emerald-300 border-emerald-600'
                  }`}>
                    {currentNotice.severity}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141B24] text-gray-300 border border-gray-700">
                    Sasaran: {currentNotice.targetAudience}
                  </span>
                  {currentNotice.isBannerActive && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500 flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      BANNER ON-AIR
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1 ml-auto">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    {new Date(currentNotice.publishedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide leading-snug">
                  {currentNotice.title}
                </h3>
                <p className="text-xs text-gray-300 font-sans leading-relaxed line-clamp-2">
                  {currentNotice.description}
                </p>

                {/* Key Highlight Bullets */}
                {currentNotice.features && currentNotice.features.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {currentNotice.features.slice(0, 3).map((feat, fIdx) => (
                      <span key={fIdx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0D1820] border border-emerald-900/60 text-[10px] text-gray-300 font-sans">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate max-w-[220px] sm:max-w-xs">{feat}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Broadcast Controls for this Notice */}
              <div className="lg:col-span-4 bg-[#090F14] border border-gray-800 rounded-xl p-3.5 space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px] text-gray-400 pb-2 border-b border-gray-800">
                  <span className="font-bold text-gray-300">Aksi Siaran Langsung:</span>
                  <span className="text-emerald-400">ID: {currentNotice.id?.slice(-8)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickToggleBanner(currentNotice.id, currentNotice.isBannerActive)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      currentNotice.isBannerActive
                        ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 hover:bg-emerald-900'
                        : 'bg-[#121922] border-gray-700 text-gray-300 hover:text-emerald-300 hover:border-emerald-600'
                    }`}
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>{currentNotice.isBannerActive ? 'Banner Aktif' : 'Pasang Banner'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDiscordPush(currentNotice)}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-600/80 text-indigo-300 hover:text-white transition flex items-center justify-center gap-1.5 text-[11px] font-bold cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Push Discord</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Listener: <strong>{announcements.length} Versi Siap</strong>
                  </span>
                  <span 
                    onClick={() => setActiveTab('system_broadcasts')}
                    className="text-emerald-400 hover:underline cursor-pointer font-bold"
                  >
                    Buka Editor Penuh →
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 text-center text-xs text-gray-400 py-3">
              Belum ada siaran sistem yang terdaftar.
            </div>
          )}
        </section>

        {/* ================= KONTROL STATUS COMING SOON & AKSES PUBLIK ================= */}
        <section className={`rounded-2xl border p-4 sm:p-5 transition shadow-2xl font-mono ${
          comingSoonConfig.isEnabled
            ? 'bg-gradient-to-r from-[#1A0B0F] via-[#220D14] to-[#16080E] border-rose-500/60 shadow-rose-950/40'
            : 'bg-gradient-to-r from-[#061510] via-[#0B2117] to-[#081822] border-emerald-500/60 shadow-emerald-950/40'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wide border flex items-center gap-1.5 ${
                  comingSoonConfig.isEnabled
                    ? 'bg-rose-950 text-rose-300 border-rose-600'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-500'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${comingSoonConfig.isEnabled ? 'bg-rose-400' : 'bg-emerald-400 animate-ping'}`} />
                  {comingSoonConfig.isEnabled ? 'MODE COMING SOON AKTIF (WEBSITE TERKUNCI)' : 'WEBSITE RESMI TELAH DIBUKA (COMING SOON OFF)'}
                </span>
                <span className="text-[11px] text-gray-400">
                  {comingSoonConfig.isEnabled 
                    ? '🔴 Seluruh menu publik, terminal dinas, dan layanan warga terkunci.' 
                    : '🟢 Publik, Anggota Kepolisian HSPD, Balai Kota & Warga dapat login & beraktivitas normal.'}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white font-sans">
                {comingSoonConfig.isEnabled
                  ? 'Website sedang dalam mode prapeluncuran (Coming Soon). Publik tidak dapat melihat atau login.'
                  : 'Mode Coming Soon dimatikan: Sistem MDC Kepolisian, Balai Kota, dan Layanan SKCK Warga aktif normal.'}
              </h3>
              <p className="text-xs text-gray-300 font-sans leading-relaxed">
                {comingSoonConfig.isEnabled
                  ? 'Untuk mengembalikan website ke tampilan formulir login dinas kepolisian, balai kota, dan warga (seperti pada gambar), matikan status Coming Soon di bawah atau klik "Portal Login Publik".'
                  : 'Website siap digunakan oleh seluruh jajaran anggota kepolisian HSPD dan masyarakat. Anda dapat langsung membuka halaman Login Publik untuk verifikasi atau simulasi login anggota.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Toggle Coming Soon */}
              <button
                type="button"
                onClick={() => handleToggleComingSoon(!comingSoonConfig.isEnabled)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                  comingSoonConfig.isEnabled
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black border border-emerald-400'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border border-rose-500'
                }`}
              >
                {comingSoonConfig.isEnabled ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black stroke-[2.5]" />
                    <span>MATIKAN COMING SOON (BUKA AKSES PUBLIK)</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-white" />
                    <span>KUNCI KEMBALI KE COMING SOON</span>
                  </>
                )}
              </button>

              {/* View Public Login Portal as in Screenshot */}
              {onSwitchPortal && (
                <button
                  type="button"
                  onClick={() => onSwitchPortal('LOGIN')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs border border-blue-400 transition flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
                  title="Lihat langsung tampilan Halaman Login Terminal Dinas (seperti gambar)"
                >
                  <LogIn className="w-4 h-4 text-white" />
                  <span>BUKA PORTAL LOGIN (SEPERTI GAMBAR)</span>
                </button>
              )}

              {/* Exit Developer Session and leave site open to login */}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3.5 py-2.5 rounded-xl bg-black/60 hover:bg-black/90 border border-gray-600 text-gray-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Keluar dari akun developer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar Mode Dev</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* KPI OVERVIEW CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono">
          <div 
            onClick={() => setActiveTab('system_broadcasts')}
            className={`p-3.5 bg-[#0F141B] border rounded-xl shadow cursor-pointer transition select-none ${
              activeTab === 'system_broadcasts'
                ? 'border-emerald-500 ring-1 ring-emerald-500/50 bg-emerald-950/20'
                : 'border-gray-800 hover:border-emerald-600/70 hover:bg-[#121A22]'
            }`}
          >
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span className="font-bold text-gray-300">Pemberitahuan Sistem</span>
              <Megaphone className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{announcements.length} Rilis</div>
            <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
              {announcements.filter(a => a.isBannerActive).length > 0 ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Banner Aktif
                </span>
              ) : (
                <span>⚪ Standby / Siap Siar</span>
              )}
            </div>
          </div>

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

        {/* ================= TAB 0: LIVE SYSTEM ANNOUNCEMENTS & RECENT UPDATES ================= */}
        {activeTab === 'system_broadcasts' && (
          <LiveSystemAnnouncementsHub
            announcements={announcements}
            onRefresh={refreshData}
            currentOfficer={currentOfficer}
            onOpenDiscordStudio={() => setIsDiscordReleaseModalOpen(true)}
          />
        )}

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
                    <button
                      type="button"
                      onClick={() => setActiveChartTab('ARRESTS')}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                        activeChartTab === 'ARRESTS' ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <BarChart2 className="w-3 h-3" />
                      <span>Tren Bulanan Kasus</span>
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

              {activeChartTab === 'ARRESTS' && (
                <div className="pt-2">
                  <ArrestMonthlyAnalyticsChart
                    records={arrestRecords}
                    isDeveloperMode={true}
                    defaultExpanded={true}
                  />
                </div>
              )}
            </div>

            {/* Dedicated Executive Monthly Arrest Trend in Developer Analytics */}
            {activeChartTab !== 'ARRESTS' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                  <span className="font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Tren Penindakan Bulanan Komando (Arrest Records)
                  </span>
                  <span className="text-[10px] text-gray-500">Visualisasi Recharts • Realtime DB</span>
                </div>
                <ArrestMonthlyAnalyticsChart
                  records={arrestRecords}
                  isDeveloperMode={true}
                  defaultExpanded={true}
                />
              </div>
            )}
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

            {/* Dedicated Bot OAuth2 Allow Developer Generator */}
            <DiscordBotInviteCard
              botToken={botConfig.botToken}
              botName="HSPD MDT Official Bot"
              theme="emerald"
            />
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

      {/* Discord Release Studio Modal */}
      {isDiscordReleaseModalOpen && (
        <DiscordReleaseAnnouncementModal
          isOpen={isDiscordReleaseModalOpen}
          onClose={() => setIsDiscordReleaseModalOpen(false)}
          currentUser={{
            name: currentOfficer?.name,
            badge: currentOfficer?.badge,
            rank: currentOfficer?.rank
          }}
        />
      )}

      {/* ================= MODAL SIARAN KILAT PENGEMBANG ================= */}
      {isFlashModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0B1015] border border-emerald-500/70 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-950 via-[#0E161F] to-black border-b border-emerald-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white font-mono flex items-center gap-1.5">
                    SIARAN KILAT PEMBERITAHUAN SISTEM
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-600">
                      FLASH DISPATCH
                    </span>
                  </h3>
                  <p className="text-[10px] text-gray-400 font-mono">Langsung tersiar ke banner global, portal petugas, dan Discord</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFlashModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePublishFlashNotice} className="p-4 sm:p-5 space-y-3.5 text-xs font-mono">
              {/* Presets */}
              <div className="p-2.5 bg-[#080D12] border border-gray-800 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" /> Pilih Template Cepat:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleApplyFlashPreset('bonus')}
                    className="px-2 py-1 rounded bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-400 text-emerald-200 font-bold transition cursor-pointer active:scale-95 shadow"
                  >
                    💰 Bonus 6 Komponen (v4.3.0)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyFlashPreset('attendance')}
                    className="px-2 py-1 rounded bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500 text-emerald-200 font-bold transition cursor-pointer active:scale-95 shadow"
                  >
                    📋 Absensi & Kontrol Dinas (v4.2.5)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyFlashPreset('bank')}
                    className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 font-bold transition cursor-pointer active:scale-95"
                  >
                    💳 Rekening Bank Dinas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyFlashPreset('isolation')}
                    className="px-2 py-1 rounded bg-blue-950/80 hover:bg-blue-900 border border-blue-600 text-blue-300 font-bold transition cursor-pointer active:scale-95"
                  >
                    🛡️ Isolasi 7 Divisi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyFlashPreset('maintenance')}
                    className="px-2 py-1 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-600 text-purple-300 font-bold transition cursor-pointer active:scale-95"
                  >
                    🛠️ Pemeliharaan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyFlashPreset('hotfix')}
                    className="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-300 font-bold transition cursor-pointer active:scale-95"
                  >
                    ⚡ Hotfix Bug
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Versi Rilis:</label>
                  <input
                    type="text"
                    required
                    value={flashVersion}
                    onChange={e => setFlashVersion(e.target.value)}
                    placeholder="v4.2.4"
                    className="w-full bg-[#121922] border border-gray-700 rounded-lg px-2.5 py-1.5 text-emerald-300 font-bold outline-none focus:border-emerald-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Urgensi:</label>
                  <select
                    value={flashSeverity}
                    onChange={e => setFlashSeverity(e.target.value as any)}
                    className="w-full bg-[#121922] border border-gray-700 rounded-lg px-2 py-1.5 text-gray-200 outline-none focus:border-emerald-400 text-xs cursor-pointer"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="IMPORTANT">IMPORTANT</option>
                    <option value="URGENT">URGENT</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] text-gray-400 mb-1">Sasaran:</label>
                  <select
                    value={flashAudience}
                    onChange={e => setFlashAudience(e.target.value as any)}
                    className="w-full bg-[#121922] border border-gray-700 rounded-lg px-2 py-1.5 text-gray-200 outline-none focus:border-emerald-400 text-xs cursor-pointer"
                  >
                    <option value="GLOBAL">SEMUA PORTAL</option>
                    <option value="HSPD">HSPD KEPOLISIAN</option>
                    <option value="GOVERNMENT">BALAI KOTA</option>
                    <option value="CITIZEN">WARGA SIPIL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Judul Siaran:</label>
                <input
                  type="text"
                  required
                  value={flashTitle}
                  onChange={e => setFlashTitle(e.target.value)}
                  placeholder="Contoh: Pembaruan Sistem - Penambahan Fitur & Keamanan Operasi"
                  className="w-full bg-[#121922] border border-gray-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-emerald-400 font-sans text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Deskripsi Ringkas:</label>
                <textarea
                  required
                  rows={2}
                  value={flashDescription}
                  onChange={e => setFlashDescription(e.target.value)}
                  placeholder="Uraian singkat pembaruan..."
                  className="w-full bg-[#121922] border border-gray-700 rounded-lg px-3 py-1.5 text-gray-200 outline-none focus:border-emerald-400 font-sans text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Poin Fitur 1 (Opsional):</label>
                  <input
                    type="text"
                    value={flashFeature1}
                    onChange={e => setFlashFeature1(e.target.value)}
                    placeholder="Contoh: No. Rekening Bank Dinas"
                    className="w-full bg-[#121922] border border-gray-700 rounded-lg px-2.5 py-1 text-gray-200 outline-none focus:border-emerald-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Poin Fitur 2 (Opsional):</label>
                  <input
                    type="text"
                    value={flashFeature2}
                    onChange={e => setFlashFeature2(e.target.value)}
                    placeholder="Contoh: Isolasi 7 Divisi Kepolisian"
                    className="w-full bg-[#121922] border border-gray-700 rounded-lg px-2.5 py-1 text-gray-200 outline-none focus:border-emerald-400 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={flashIsBanner}
                      onChange={e => setFlashIsBanner(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-emerald-500"
                    />
                    <span className="text-[11px] text-gray-300">Aktifkan Banner Global</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={flashDiscord}
                      onChange={e => setFlashDiscord(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-indigo-500"
                    />
                    <span className="text-[11px] text-indigo-300">Siarkan ke Discord</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFlashModalOpen(false)}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-bold text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPublishingFlash}
                    className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black rounded-lg text-xs transition shadow flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isPublishingFlash ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>SIARKAN SEKARANG</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Changelog Discord Webhook Configuration Modal */}
      {isChangelogWebhookModalOpen && (
        <ChangelogWebhookConfigModal
          isOpen={isChangelogWebhookModalOpen}
          onClose={() => {
            setIsChangelogWebhookModalOpen(false);
            setChangelogConfig(getSavedChangelogWebhookConfig());
          }}
          currentNotice={selectedNoticeForWebhook || currentNotice || undefined}
          onSuccessBroadcast={() => {
            refreshData();
            setSyncNotice('✅ Siaran pembaruan berhasil dikirim ke saluran Webhook Discord!');
            setTimeout(() => setSyncNotice(null), 5000);
          }}
        />
      )}
    </div>
  );
};
