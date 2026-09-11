import React, { useState, useEffect, useMemo } from 'react';
import { 
  GovernmentAccount, 
  GovernmentRankLevel, 
  GovernmentDivision, 
  ALL_GOVERNMENT_RANKS, 
  ALL_GOVERNMENT_DIVISIONS,
  OfficerProfile,
  canManageGovernmentPersonnel,
  isGovernmentPresidentOrVice
} from '../types';
import { 
  Building2, UserPlus, Search, Shield, KeyRound, Phone, 
  Award, Trash2, Edit3, CheckCircle2, AlertTriangle, X, 
  Crown, Sparkles, Filter, RefreshCw, Eye, EyeOff, FileText,
  User, Check, AlertCircle, Copy, ShieldAlert, BadgeCheck,
  Bot, Send
} from 'lucide-react';
import { 
  getGovernmentRoster, 
  addGovernmentAccount, 
  updateGovernmentAccount, 
  deleteGovernmentAccount, 
  getNextAvailableGovBadge,
  subscribeToGovernmentRoster 
} from '../utils/governmentStorage';
import {
  sendGovOfficerAccountDm,
  sendGovNewOfficerAnnouncementToDiscord,
  getSavedGovRosterWebhookConfig,
  getSavedDiscordBotConfig
} from '../utils/discordWebhook';
import { GovernmentWebhookModal } from './GovernmentWebhookModal';

interface Props {
  currentOfficer: OfficerProfile;
  onNavigateToDocuments?: () => void;
}

export const GovernmentRosterManagement: React.FC<Props> = ({
  currentOfficer,
  onNavigateToDocuments
}) => {
  const [govRoster, setGovRoster] = useState<GovernmentAccount[]>(() => getGovernmentRoster());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRank, setFilterRank] = useState<string>('ALL');
  const [filterDivision, setFilterDivision] = useState<string>('ALL');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<GovernmentAccount | null>(null);
  const [viewingOfficer, setViewingOfficer] = useState<GovernmentAccount | null>(null);
  const [isSendingDmId, setIsSendingDmId] = useState<string | null>(null);

  // Add Form State
  const [formData, setFormData] = useState<{
    name: string;
    badge: string;
    rank: GovernmentRankLevel;
    division: GovernmentDivision;
    pin: string;
    phone: string;
    discordTag: string;
  }>({
    name: '',
    badge: '',
    rank: 'STAFF [RANK 1]',
    division: 'Government Affairs Official',
    pin: '10-4',
    phone: '',
    discordTag: ''
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [showPinInList, setShowPinInList] = useState<Record<string, boolean>>({});
  const [showAddPin, setShowAddPin] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const canManage = canManageGovernmentPersonnel(currentOfficer.rank);
  const isPresident = isGovernmentPresidentOrVice(currentOfficer.rank);

  // Subscribe to realtime roster updates
  useEffect(() => {
    return subscribeToGovernmentRoster(updated => {
      setGovRoster(updated);
    });
  }, []);

  // Initialize badge when opening add modal
  const handleOpenAddModal = () => {
    const nextBadge = getNextAvailableGovBadge();
    setFormData({
      name: '',
      badge: nextBadge,
      rank: 'STAFF [RANK 1]',
      division: 'Government Affairs Official',
      pin: '10-4',
      phone: '',
      discordTag: ''
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Submit Add Form
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Nama lengkap pejabat wajib diisi!');
      return;
    }
    if (!formData.badge.trim()) {
      setFormError('Nomor badge / callsign wajib diisi!');
      return;
    }

    const assignedPin = formData.pin.trim() || '10-4';
    const targetDiscord = formData.discordTag.trim();

    const result = addGovernmentAccount({
      name: formData.name.trim(),
      badge: formData.badge.trim(),
      rank: formData.rank,
      division: formData.division,
      pin: assignedPin,
      phone: formData.phone.trim(),
      discordTag: targetDiscord,
      registeredBy: `${currentOfficer.name} (${currentOfficer.rank})`
    });

    if (!result.success) {
      setFormError(result.message);
      return;
    }

    setGovRoster(getGovernmentRoster());
    setIsAddModalOpen(false);

    let successNotice = result.message;

    // 🤖 1. Automated Discord Bot PM (Private Message) to new official
    if (targetDiscord) {
      sendGovOfficerAccountDm({
        targetDiscord,
        officerName: formData.name.trim(),
        badge: formData.badge.trim(),
        rank: formData.rank,
        division: formData.division,
        pin: assignedPin,
        registeredBy: currentOfficer.name,
        registeredByRank: currentOfficer.rank,
        registeredByBadge: currentOfficer.badge,
        customMessage: 'Selamat bertugas! Akun dinas kenegaraan Anda telah aktif. Masuk ke website menggunakan nama dan PIN di atas.'
      }).then(dmRes => {
        if (dmRes.success) {
          setActionSuccessMsg(prev => prev ? `${prev} • 🤖 Bot PM Terkirim ke ${targetDiscord}` : `🤖 Kredensial akun dikirim ke Discord ${targetDiscord}`);
        } else {
          console.warn('Bot DM status notice:', dmRes.message);
        }
      }).catch(err => {
        console.error('Failed to send Discord Bot DM:', err);
      });
    }

    // 🏛️ 2. Official Government Induction Webhook Broadcast
    const rosterConfig = getSavedGovRosterWebhookConfig();
    if (rosterConfig.webhookUrl && rosterConfig.autoSendOnSave) {
      sendGovNewOfficerAnnouncementToDiscord({
        officer: {
          id: result.account?.id || `gov_${Date.now()}`,
          name: formData.name.trim(),
          badge: formData.badge.trim(),
          rank: formData.rank,
          division: formData.division,
          pin: assignedPin,
          phone: formData.phone.trim(),
          discordTag: targetDiscord,
          status: 'ACTIVE'
        } as any,
        registeredBy: currentOfficer.name,
        registeredByRank: currentOfficer.rank,
        customNote: 'Pengangkatan & pelantikan pejabat resmi pemerintahan baru.'
      }).catch(err => {
        console.warn('Roster announcement notice:', err);
      });
    }

    setActionSuccessMsg(successNotice);
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  // Resend Bot DM
  const handleResendBotDm = async (officer: GovernmentAccount) => {
    if (!officer.discordTag) {
      alert('Pejabat ini belum memiliki Discord Tag / ID terdaftar. Silakan edit data terlebih dahulu.');
      return;
    }
    setIsSendingDmId(officer.id);
    try {
      const res = await sendGovOfficerAccountDm({
        targetDiscord: officer.discordTag,
        officerName: officer.name,
        badge: officer.badge,
        rank: officer.rank,
        division: officer.division,
        pin: officer.pin || '10-4',
        registeredBy: currentOfficer.name,
        registeredByRank: currentOfficer.rank,
        registeredByBadge: currentOfficer.badge,
        customMessage: 'Pengiriman ulang kredensial akun dinas kenegaraan.'
      });
      if (res.success) {
        setActionSuccessMsg(`🤖 Pesan Kredensial berhasil dikirim via Bot PM ke ${officer.discordTag}!`);
        setTimeout(() => setActionSuccessMsg(null), 4500);
      } else {
        alert(`Gagal mengirim Bot PM: ${res.message}`);
      }
    } catch (e: any) {
      alert(`Error mengirim Bot PM: ${e.message}`);
    } finally {
      setIsSendingDmId(null);
    }
  };

  // Submit Edit Form
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficer) return;
    setFormError(null);

    const result = updateGovernmentAccount(editingOfficer);
    if (!result.success) {
      setFormError(result.message);
      return;
    }

    setGovRoster(getGovernmentRoster());
    setEditingOfficer(null);
    setActionSuccessMsg(result.message);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Delete Officer
  const handleDelete = (officer: GovernmentAccount) => {
    if (officer.name.toLowerCase().includes('momo hatakeyama') || officer.badge === '#GOV-01') {
      alert('Presiden Momo Hatakeyama adalah Kepala Negara dan tidak dapat dihapus.');
      return;
    }

    if (!window.confirm(`Yakin ingin memberhentikan / menonaktifkan Pejabat ${officer.name} (${officer.badge}) dari jajaran Pemerintahan?`)) {
      return;
    }

    const result = deleteGovernmentAccount(officer.id);
    if (result.success) {
      setGovRoster(getGovernmentRoster());
      setActionSuccessMsg(result.message);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } else {
      alert(result.message);
    }
  };

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return govRoster.filter(officer => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (officer.name || '').toLowerCase().includes(q);
        const matchBadge = (officer.badge || '').toLowerCase().includes(q);
        const matchRank = (officer.rank || '').toLowerCase().includes(q);
        const matchDiv = (officer.division || '').toLowerCase().includes(q);
        const matchPhone = (officer.phone || '').toLowerCase().includes(q);
        if (!matchName && !matchBadge && !matchRank && !matchDiv && !matchPhone) return false;
      }
      // Rank filter
      if (filterRank !== 'ALL' && officer.rank !== filterRank) {
        return false;
      }
      // Division filter
      if (filterDivision !== 'ALL' && officer.division !== filterDivision) {
        return false;
      }
      return true;
    });
  }, [govRoster, searchQuery, filterRank, filterDivision]);

  // Statistics
  const stats = useMemo(() => {
    const total = govRoster.length;
    const presidents = govRoster.filter(g => g.rank.includes('RANK 6') || g.rank.includes('RANK 5')).length;
    const ministers = govRoster.filter(g => g.rank.includes('RANK 4') || g.rank.includes('RANK 3')).length;
    const staff = govRoster.filter(g => g.rank.includes('RANK 2') || g.rank.includes('RANK 1')).length;
    return { total, presidents, ministers, staff };
  }, [govRoster]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 text-emerald-200 rounded-xl flex items-center justify-between gap-2 shadow-lg shadow-emerald-950/40 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button 
            type="button"
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-400 hover:text-white text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Executive Banner */}
      <div className="bg-gradient-to-r from-[#18140B] via-[#1F190D] to-[#120F08] border border-amber-600/70 rounded-xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none text-amber-400">
          <Building2 className="w-72 h-72" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-950/50">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-black text-[10px] tracking-wider uppercase font-mono">
                  EKSEKUTIF PEMERINTAHAN
                </span>
                <span className="text-xs text-amber-300/80 font-mono">STATE GOVERNMENT OF HIGHSTATE</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-100 tracking-tight mt-0.5 flex items-center gap-2">
                <span>Roster & Jajaran Aparatur Negara</span>
              </h1>
              <p className="text-xs text-gray-400 mt-1 max-w-2xl font-mono leading-relaxed">
                Manajemen data resmi pegawai eksekutif, kementerian, direktur divisi penegakan aturan sipil, dan staf kepresidenan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canManage && (
              <button
                type="button"
                id="btn-add-gov-member"
                onClick={handleOpenAddModal}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-lg text-xs font-mono transition flex items-center gap-1.5 shadow-lg shadow-amber-950/60 active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>ANGKAT PEJABAT BARU</span>
              </button>
            )}

            {canManage && (
              <button
                type="button"
                id="btn-gov-webhook-settings"
                onClick={() => setIsWebhookModalOpen(true)}
                className="px-3 py-2 bg-[#1C160C] hover:bg-amber-950/70 text-amber-300 border border-amber-500/60 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Konfigurasi Webhook Roster, Dokumen, dan Token Bot PM Discord"
              >
                <Bot className="w-4 h-4 text-amber-400" />
                <span>PENGATURAN WEBHOOK & BOT PM</span>
              </button>
            )}

            {onNavigateToDocuments && (
              <button
                type="button"
                onClick={onNavigateToDocuments}
                className="px-3 py-2 bg-[#161B22] hover:bg-gray-800 text-amber-300 border border-amber-600/40 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 shadow-sm"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>SURAT RESMI NEGARA</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-amber-900/40">
          <div className="p-2.5 rounded-lg bg-black/40 border border-amber-600/30">
            <span className="text-[10px] text-gray-400 block font-mono">TOTAL APARATUR</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-white font-mono">{stats.total}</span>
              <span className="text-[10px] text-amber-400 font-bold">Pejabat</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-black/40 border border-amber-600/30">
            <span className="text-[10px] text-amber-400/90 block font-mono flex items-center gap-1">
              <Crown className="w-2.5 h-2.5 text-amber-400 inline" /> PRESIDEN & WAKIL
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-amber-300 font-mono">{stats.presidents}</span>
              <span className="text-[10px] text-gray-400">Pimpinan</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-black/40 border border-amber-600/30">
            <span className="text-[10px] text-gray-400 block font-mono">KABINET & DIREKTUR</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-white font-mono">{stats.ministers}</span>
              <span className="text-[10px] text-gray-400">Menteri / Kepala</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-black/40 border border-amber-600/30">
            <span className="text-[10px] text-gray-400 block font-mono">STAF & PENGAMANAN</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black text-white font-mono">{stats.staff}</span>
              <span className="text-[10px] text-gray-400">Pegawai</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-[#11141A] border border-gray-800 rounded-xl p-3 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari Pejabat Negara berdasarkan nama, callsign (#GOV), pangkat, divisi..."
            className="w-full bg-[#161B22] border border-gray-700/80 rounded-lg pl-9 pr-8 py-2 text-gray-100 text-xs focus:outline-none focus:border-amber-500 font-mono transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {/* Rank Filter */}
          <div className="flex items-center gap-1 bg-[#161B22] border border-gray-700 rounded-lg px-2 py-1 shrink-0">
            <Filter className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-gray-400 font-mono">Pangkat:</span>
            <select
              value={filterRank}
              onChange={e => setFilterRank(e.target.value)}
              className="bg-transparent text-gray-200 text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#161B22]">Semua Pangkat</option>
              {ALL_GOVERNMENT_RANKS.map(r => (
                <option key={r} value={r} className="bg-[#161B22]">{r}</option>
              ))}
            </select>
          </div>

          {/* Division Filter */}
          <div className="flex items-center gap-1 bg-[#161B22] border border-gray-700 rounded-lg px-2 py-1 shrink-0">
            <Building2 className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-gray-400 font-mono">Divisi:</span>
            <select
              value={filterDivision}
              onChange={e => setFilterDivision(e.target.value)}
              className="bg-transparent text-gray-200 text-xs font-mono focus:outline-none cursor-pointer max-w-[170px]"
            >
              <option value="ALL" className="bg-[#161B22]">Semua 16 Divisi</option>
              {ALL_GOVERNMENT_DIVISIONS.map(d => (
                <option key={d} value={d} className="bg-[#161B22]">{d}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilterRank('ALL');
              setFilterDivision('ALL');
            }}
            className="p-1.5 text-gray-400 hover:text-white bg-[#161B22] hover:bg-gray-800 border border-gray-700 rounded-lg transition"
            title="Reset Filter"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Roster Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {filteredRoster.map(officer => {
          const isChief = officer.rank.includes('RANK 6') || officer.rank.includes('RANK 5');
          const isLeader = officer.rank.includes('RANK 4') || officer.rank.includes('RANK 3');
          const isCurrent = officer.name.toLowerCase() === currentOfficer.name.toLowerCase() || officer.badge === currentOfficer.badge;
          const isMomo = officer.badge === '#GOV-01' || officer.name.toLowerCase().includes('momo hatakeyama');

          return (
            <div 
              key={officer.id}
              className={`rounded-xl border p-4 shadow-lg transition duration-200 flex flex-col justify-between relative overflow-hidden ${
                isChief
                  ? 'bg-gradient-to-br from-[#1C160B] via-[#14120D] to-[#0E0C09] border-amber-500/80 ring-1 ring-amber-500/40'
                  : isLeader
                    ? 'bg-gradient-to-br from-[#14171F] via-[#101218] to-[#0B0D12] border-blue-500/50'
                    : 'bg-[#12151C] border-gray-800 hover:border-gray-700'
              }`}
            >
              {/* Top Row: Badge, Rank Chip, and Current Badge indicator */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-black font-mono text-xs ${
                      isChief
                        ? 'bg-amber-500 text-black shadow-sm'
                        : isLeader
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-amber-300 border border-gray-700'
                    }`}>
                      {officer.badge}
                    </span>

                    {isCurrent && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono font-bold text-[9px]">
                        AKUN ANDA
                      </span>
                    )}

                    {isMomo && (
                      <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/60 text-yellow-300 font-mono font-bold text-[9px] flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5 text-yellow-400" /> KEPALA NEGARA
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingOfficer({ ...officer });
                            setFormError(null);
                          }}
                          className="p-1 text-gray-400 hover:text-amber-400 bg-gray-800/80 hover:bg-gray-800 border border-gray-700 rounded transition"
                          title="Edit Data Pejabat"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {officer.discordTag && (
                          <button
                            type="button"
                            onClick={() => handleResendBotDm(officer)}
                            disabled={isSendingDmId === officer.id}
                            className="p-1 text-amber-400 hover:text-amber-200 bg-amber-950/50 hover:bg-amber-900 border border-amber-600/60 rounded transition disabled:opacity-50"
                            title="Kirim Ulang Kredensial Akun via Bot PM Discord"
                          >
                            {isSendingDmId === officer.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                            ) : (
                              <Bot className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        {!isMomo && (
                          <button
                            type="button"
                            onClick={() => handleDelete(officer)}
                            className="p-1 text-rose-400 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 rounded transition"
                            title="Berhentikan / Hapus Pejabat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Name & Title */}
                <div className="mt-3">
                  <h3 className="text-base font-bold text-gray-100 flex items-center gap-1.5 tracking-tight">
                    <span>{officer.name}</span>
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-xs font-mono font-bold ${
                      isChief ? 'text-amber-400' : isLeader ? 'text-blue-400' : 'text-gray-300'
                    }`}>
                      {officer.rank}
                    </span>
                  </div>
                </div>

                {/* Division Chip */}
                <div className="mt-2.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/50 border border-gray-800 text-[11px] font-mono text-gray-300">
                    <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">{officer.division}</span>
                  </div>
                </div>

                {/* Contact & Registration Meta */}
                <div className="mt-3.5 pt-3 border-t border-gray-800/80 space-y-1.5 text-[11px] font-mono text-gray-400">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Telepon IC:</span>
                    <span className="text-gray-200">{officer.phone || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Discord:</span>
                    <span className="text-gray-200">{officer.discordTag || '—'}</span>
                  </div>
                  
                  {/* PIN Display (Supervisor / Self) */}
                  {(canManage || isCurrent) && (
                    <div className="flex items-center justify-between pt-1 border-t border-gray-800/50">
                      <span className="text-gray-500 flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-amber-400" /> PIN Akses:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-amber-300 font-mono tracking-wider">
                          {showPinInList[officer.id] ? officer.pin || '10-4' : '••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPinInList(prev => ({
                              ...prev,
                              [officer.id]: !prev[officer.id]
                            }));
                          }}
                          className="text-gray-400 hover:text-white p-0.5"
                          title="Tampilkan / Sembunyikan PIN"
                        >
                          {showPinInList[officer.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="mt-3.5 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-[10px] font-mono">
                <span className="text-gray-500">
                  Terdaftar: {new Date(officer.registeredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${officer.name} (${officer.badge}) - ${officer.rank}`, officer.id)}
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
                  title="Salin Data Pejabat"
                >
                  {copiedId === officer.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Disalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin ID</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRoster.length === 0 && (
        <div className="p-8 text-center bg-[#11141A] border border-gray-800 rounded-xl">
          <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-300 font-medium text-sm">Tidak ada pejabat yang sesuai dengan filter pencarian.</p>
          <p className="text-gray-500 text-xs font-mono mt-1">Coba sesuaikan kata kunci pencarian atau reset filter.</p>
        </div>
      )}

      {/* ================= MODAL: ANGKAT PEJABAT BARU ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#12151C] border border-amber-500/70 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-gradient-to-r from-amber-950 via-[#161B22] to-black border-b border-amber-600/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-100 text-sm">Angkat / Tambah Anggota Pemerintahan</h3>
                  <p className="text-[10px] text-amber-400/80 font-mono">Penerbitan SK & Penetapan Pejabat Eksekutif Negara</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs font-mono">
              {formError && (
                <div className="p-2.5 bg-rose-950/80 border border-rose-500 text-rose-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nama Lengkap */}
                <div className="sm:col-span-2">
                  <label className="block text-gray-300 font-bold mb-1">
                    Nama Lengkap Pejabat: <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: James Vance"
                    className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Callsign / Badge */}
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    Nomor Callsign (#GOV): <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      required
                      value={formData.badge}
                      onChange={e => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                      placeholder="#GOV-02"
                      className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-amber-500 font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, badge: getNextAvailableGovBadge() }))}
                      className="px-2 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-[10px] text-amber-300 shrink-0 font-bold"
                      title="Generate ID Berikutnya"
                    >
                      AUTO
                    </button>
                  </div>
                </div>

                {/* PIN Masuk */}
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    PIN Keamanan Masuk: <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showAddPin ? 'text' : 'password'}
                      required
                      value={formData.pin}
                      onChange={e => setFormData(prev => ({ ...prev, pin: e.target.value }))}
                      placeholder="10-4"
                      className="w-full bg-[#161B22] border border-gray-700 rounded-lg pl-3 pr-8 py-2 text-gray-100 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPin(!showAddPin)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showAddPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Pangkat Resmi */}
                <div className="sm:col-span-2">
                  <label className="block text-gray-300 font-bold mb-1">
                    Jenjang Pangkat Resmi: <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.rank}
                    onChange={e => setFormData(prev => ({ ...prev, rank: e.target.value as GovernmentRankLevel }))}
                    className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-amber-500 font-mono"
                  >
                    {ALL_GOVERNMENT_RANKS.map(r => (
                      <option key={r} value={r} className="bg-[#161B22]">{r}</option>
                    ))}
                  </select>
                </div>

                {/* 16 Divisi Resmi */}
                <div className="sm:col-span-2">
                  <label className="block text-gray-300 font-bold mb-1">
                    Penempatan Divisi Negara (16 Divisi Resmi): <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.division}
                    onChange={e => setFormData(prev => ({ ...prev, division: e.target.value as GovernmentDivision }))}
                    className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-amber-500 font-mono"
                  >
                    <optgroup label="🏛️ Biro Eksekutif & Hubungan Pemerintahan" className="bg-[#0F1218] text-amber-300 font-bold">
                      <option value="Government Affairs Official" className="bg-[#161B22] text-gray-200">Government Affairs Official</option>
                      <option value="Assistent Government Affairs Official" className="bg-[#161B22] text-gray-200">Assistent Government Affairs Official</option>
                    </optgroup>
                    <optgroup label="⚖️ Biro Hukum & Penuntutan (BLP)" className="bg-[#0F1218] text-indigo-300 font-bold">
                      <option value="BLP DIRECTOR" className="bg-[#161B22] text-gray-200">BLP DIRECTOR</option>
                      <option value="BLP — Senior Prosecutor" className="bg-[#161B22] text-gray-200">BLP — Senior Prosecutor</option>
                      <option value="BLP — Prosecutor" className="bg-[#161B22] text-gray-200">BLP — Prosecutor</option>
                    </optgroup>
                    <optgroup label="🕵️ Biro Investigasi Federal (FBI)" className="bg-[#0F1218] text-blue-300 font-bold">
                      <option value="FBI DIRECTOR" className="bg-[#161B22] text-gray-200">FBI DIRECTOR</option>
                      <option value="FBI — Senior FBI Official" className="bg-[#161B22] text-gray-200">FBI — Senior FBI Official</option>
                      <option value="FBI — Agent" className="bg-[#161B22] text-gray-200">FBI — Agent</option>
                    </optgroup>
                    <optgroup label="💰 Pendapatan, Pajak & Ekonomi (DREA)" className="bg-[#0F1218] text-emerald-300 font-bold">
                      <option value="Tax & Revenue" className="bg-[#161B22] text-gray-200">Tax & Revenue</option>
                      <option value="Property Enforcement" className="bg-[#161B22] text-gray-200">Property Enforcement</option>
                      <option value="Economic Analysis" className="bg-[#161B22] text-gray-200">Economic Analysis</option>
                      <option value="DREA — Revenue & Economic Officer" className="bg-[#161B22] text-gray-200">DREA — Revenue & Economic Officer</option>
                      <option value="DREA— Revenue & Economic Staff" className="bg-[#161B22] text-gray-200">DREA— Revenue & Economic Staff</option>
                    </optgroup>
                    <optgroup label="🛡️ Pengamanan & Satuan Keamanan Negara" className="bg-[#0F1218] text-orange-300 font-bold">
                      <option value="SECURITY COMMANDER" className="bg-[#161B22] text-gray-200">SECURITY COMMANDER</option>
                      <option value="Security — Senior Security Guard" className="bg-[#161B22] text-gray-200">Security — Senior Security Guard</option>
                      <option value="Security — Junior" className="bg-[#161B22] text-gray-200">Security — Junior</option>
                    </optgroup>
                  </select>
                </div>

                {/* Telepon */}
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    Nomor Telepon IC:
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Contoh: 555-0123"
                    className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Discord */}
                <div>
                  <label className="block text-gray-300 font-bold mb-1 flex items-center justify-between">
                    <span>Discord Tag / ID:</span>
                    <span className="text-[10px] text-amber-400 font-normal">🤖 Kirim Akun via Bot PM</span>
                  </label>
                  <input
                    type="text"
                    value={formData.discordTag}
                    onChange={e => setFormData(prev => ({ ...prev, discordTag: e.target.value }))}
                    placeholder="Username atau ID Discord (e.g. james atau 104523...)"
                    className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <Bot className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Bot Discord PM akan otomatis mengirimkan UCP Nama & PIN login langsung ke Discord ini.</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-lg transition shadow-md shadow-amber-950/50 flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4 text-black" />
                  <span>Simpan & Angkat Pejabat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT DATA PEJABAT ================= */}
      {editingOfficer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#12151C] border border-amber-500/70 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-gradient-to-r from-amber-950 via-[#161B22] to-black border-b border-amber-600/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-100 text-sm">Perbarui Data Pejabat Negara</h3>
                  <p className="text-[10px] text-amber-400/80 font-mono">{editingOfficer.name} ({editingOfficer.badge})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingOfficer(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs font-mono">
              {formError && (
                <div className="p-2.5 bg-rose-950/80 border border-rose-500 text-rose-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nama Lengkap */}
                <div className="sm:col-span-2">
                  <label className="block text-gray-300 font-bold mb-1">
                    Nama Lengkap Pejabat:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingOfficer.name}
                    onChange={e => setEditingOfficer(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Callsign */}
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    Nomor Callsign:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingOfficer.badge}
                    onChange={e => setEditingOfficer(prev => prev ? { ...prev, badge: e.target.value } : null)}
                    className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-amber-500 font-mono uppercase"
                  />
                </div>

                {/* PIN */}
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    PIN Keamanan:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingOfficer.pin}
                    onChange={e => setEditingOfficer(prev => prev ? { ...prev, pin: e.target.value } : null)}
                    className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Pangkat */}
                <div className="sm:col-span-2">
                  <label className="block text-gray-300 font-bold mb-1">
                    Pangkat Pejabat:
                  </label>
                  <select
                    value={editingOfficer.rank}
                    onChange={e => setEditingOfficer(prev => prev ? { ...prev, rank: e.target.value as GovernmentRankLevel } : null)}
                    className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-amber-500 font-mono"
                  >
                    {ALL_GOVERNMENT_RANKS.map(r => (
                      <option key={r} value={r} className="bg-[#161B22]">{r}</option>
                    ))}
                  </select>
                </div>

                {/* Divisi */}
                <div className="sm:col-span-2">
                  <label className="block text-gray-300 font-bold mb-1">
                    Divisi Penempatan:
                  </label>
                  <select
                    value={editingOfficer.division}
                    onChange={e => setEditingOfficer(prev => prev ? { ...prev, division: e.target.value as GovernmentDivision } : null)}
                    className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-amber-500 font-mono"
                  >
                    {ALL_GOVERNMENT_DIVISIONS.map(d => (
                      <option key={d} value={d} className="bg-[#161B22]">{d}</option>
                    ))}
                  </select>
                </div>

                {/* Telepon */}
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    Nomor Telepon IC:
                  </label>
                  <input
                    type="text"
                    value={editingOfficer.phone || ''}
                    onChange={e => setEditingOfficer(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Discord */}
                <div>
                  <label className="block text-gray-300 font-bold mb-1">
                    Discord Tag:
                  </label>
                  <input
                    type="text"
                    value={editingOfficer.discordTag || ''}
                    onChange={e => setEditingOfficer(prev => prev ? { ...prev, discordTag: e.target.value } : null)}
                    className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingOfficer(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-lg transition shadow-md shadow-amber-950/50"
                >
                  Perbarui Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PENGATURAN WEBHOOK & BOT PM PEMERINTAHAN ================= */}
      <GovernmentWebhookModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
      />
    </div>
  );
};
