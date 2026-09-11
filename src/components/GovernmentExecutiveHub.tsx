import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Crown, 
  ShieldAlert, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  X, 
  Copy, 
  Check, 
  Printer, 
  Send, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileCheck, 
  Users, 
  ExternalLink,
  Radio,
  BookOpen,
  Scale,
  Sparkles,
  Layers,
  ChevronRight,
  RefreshCw,
  Phone,
  UserCheck,
  Shield,
  Briefcase,
  Crosshair,
  BadgeAlert
} from 'lucide-react';
import { OfficerProfile } from '../types';
import { 
  SecurityLevel,
  StateSecurityStatus,
  GovernmentPermit,
  PermitCategory,
  PermitStatus,
  TreasuryTransaction,
  TreasuryType,
  TreasuryCategory,
  GovernmentAnnouncement,
  getStateSecurityStatus,
  saveStateSecurityStatus,
  getGovernmentPermits,
  saveGovernmentPermits,
  addGovernmentPermit,
  updateGovernmentPermit,
  deleteGovernmentPermit,
  getTreasuryTransactions,
  addTreasuryTransaction,
  deleteTreasuryTransaction,
  getGovernmentAnnouncements,
  addGovernmentAnnouncement,
  deleteGovernmentAnnouncement
} from '../utils/governmentOperationsStorage';
import { 
  getSavedGovDocumentWebhookConfig, 
  getSavedWebhookConfig 
} from '../utils/discordWebhook';
import { GovernmentCentralAuthModal } from './GovernmentCentralAuthModal';

interface GovernmentExecutiveHubProps {
  currentOfficer: OfficerProfile | null;
  onNavigateToDocuments?: (presetId?: string, initialData?: any) => void;
  onNavigateToDmv?: () => void;
  onNavigateToRoster?: () => void;
  onNavigateToHistory?: () => void;
}

export const GovernmentExecutiveHub: React.FC<GovernmentExecutiveHubProps> = ({
  currentOfficer,
  onNavigateToDocuments,
  onNavigateToDmv,
  onNavigateToRoster,
  onNavigateToHistory
}) => {
  // Navigation Sub-tab
  const [activeTab, setActiveTab] = useState<'ANNOUNCEMENTS' | 'PERMITS' | 'TREASURY' | 'SOP'>('PERMITS');

  // Core State
  const [securityStatus, setSecurityStatus] = useState<StateSecurityStatus>(getStateSecurityStatus);
  const [permits, setPermits] = useState<GovernmentPermit[]>(getGovernmentPermits);
  const [treasury, setTreasury] = useState<TreasuryTransaction[]>(getTreasuryTransactions);
  const [announcements, setAnnouncements] = useState<GovernmentAnnouncement[]>(getGovernmentAnnouncements);

  // Filter & Search states
  const [permitCategoryFilter, setPermitCategoryFilter] = useState<string>('ALL');
  const [permitStatusFilter, setPermitStatusFilter] = useState<string>('ALL');
  const [permitSearch, setPermitSearch] = useState('');

  const [treasurySearch, setTreasurySearch] = useState('');
  const [treasuryTypeFilter, setTreasuryTypeFilter] = useState<string>('ALL');

  // Modals
  const [isNewPermitModalOpen, setIsNewPermitModalOpen] = useState(false);
  const [isNewAnnouncementModalOpen, setIsNewAnnouncementModalOpen] = useState(false);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isGovCentralAuthModalOpen, setIsGovCentralAuthModalOpen] = useState(false);

  // Success / Feedback message
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Real-time Event Listeners
  useEffect(() => {
    const handleSecUpdate = (e: any) => setSecurityStatus(e.detail || getStateSecurityStatus());
    const handlePmtUpdate = (e: any) => setPermits(e.detail || getGovernmentPermits());
    const handleTxUpdate = (e: any) => setTreasury(e.detail || getTreasuryTransactions());
    const handleAncUpdate = (e: any) => setAnnouncements(e.detail || getGovernmentAnnouncements());

    window.addEventListener('gov-security-status-updated', handleSecUpdate);
    window.addEventListener('gov-permits-updated', handlePmtUpdate);
    window.addEventListener('gov-treasury-updated', handleTxUpdate);
    window.addEventListener('gov-announcements-updated', handleAncUpdate);

    return () => {
      window.removeEventListener('gov-security-status-updated', handleSecUpdate);
      window.removeEventListener('gov-permits-updated', handlePmtUpdate);
      window.removeEventListener('gov-treasury-updated', handleTxUpdate);
      window.removeEventListener('gov-announcements-updated', handleAncUpdate);
    };
  }, []);

  const triggerAlert = (type: 'success' | 'error' | 'info', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const handleCopyText = (text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      triggerAlert('success', '📋 Format RP berhasil disalin ke clipboard!');
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      triggerAlert('error', 'Gagal menyalin teks.');
    }
  };

  // --- FINANCIAL TOTAL CALCULATIONS ---
  const treasuryStats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    treasury.forEach(t => {
      if (t.type === 'INCOME') totalIncome += t.amount;
      else totalExpense += t.amount;
    });
    return {
      balance: totalIncome - totalExpense,
      income: totalIncome,
      expense: totalExpense
    };
  }, [treasury]);

  // --- FILTERED PERMITS ---
  const filteredPermits = useMemo(() => {
    return permits.filter(p => {
      const matchCat = permitCategoryFilter === 'ALL' || p.category === permitCategoryFilter;
      const matchStat = permitStatusFilter === 'ALL' || p.status === permitStatusFilter;
      const matchQuery = permitSearch === '' || 
        p.applicantName.toLowerCase().includes(permitSearch.toLowerCase()) ||
        p.applicantId.toLowerCase().includes(permitSearch.toLowerCase()) ||
        p.title.toLowerCase().includes(permitSearch.toLowerCase()) ||
        p.permitNumber.toLowerCase().includes(permitSearch.toLowerCase()) ||
        p.businessOrDetails.toLowerCase().includes(permitSearch.toLowerCase());
      return matchCat && matchStat && matchQuery;
    });
  }, [permits, permitCategoryFilter, permitStatusFilter, permitSearch]);

  // --- FILTERED TREASURY ---
  const filteredTreasury = useMemo(() => {
    return treasury.filter(t => {
      const matchType = treasuryTypeFilter === 'ALL' || t.type === treasuryTypeFilter;
      const matchQuery = treasurySearch === '' ||
        t.title.toLowerCase().includes(treasurySearch.toLowerCase()) ||
        t.partyName.toLowerCase().includes(treasurySearch.toLowerCase()) ||
        t.receiptNumber.toLowerCase().includes(treasurySearch.toLowerCase());
      return matchType && matchQuery;
    });
  }, [treasury, treasuryTypeFilter, treasurySearch]);

  // --- ACTIONS: PERMITS ---
  const handleUpdatePermitStatus = (id: string, newStatus: PermitStatus) => {
    const updated = updateGovernmentPermit(id, {
      status: newStatus,
      approvedBy: currentOfficer?.name || 'Pejabat Eksekutif',
      approvedByRank: currentOfficer?.rank || 'GOVERNMENT',
      approvedAt: Date.now()
    });
    setPermits(updated);
    triggerAlert('success', `Status izin berhasil diperbarui menjadi ${newStatus}.`);
  };

  const handleDeletePermit = (id: string) => {
    if (!window.confirm('Yakin ingin menghapus arsip perizinan ini?')) return;
    const updated = deleteGovernmentPermit(id);
    setPermits(updated);
    triggerAlert('info', 'Arsip perizinan telah dihapus.');
  };

  // Convert permit to official studio document
  const handleTransferPermitToStudio = (permit: GovernmentPermit) => {
    if (!onNavigateToDocuments) {
      triggerAlert('info', 'Fungsi navigasi ke studio dokumen tidak tersedia.');
      return;
    }

    // Determine target preset ID
    let presetId = 'tpl-custom-bebas-blank';
    if (permit.category === 'WEAPON') presetId = 'tpl-izin-senjata-wcl';
    else if (permit.category === 'BUSINESS') presetId = 'tpl-custom-bebas-blank';
    else if (permit.category === 'PARDON') presetId = 'tpl-surat-keputusan-pemerintah';
    else if (permit.category === 'APPOINTMENT') presetId = 'tpl-surat-keputusan-pemerintah';

    const prepopulatedDoc = {
      title: permit.title.toUpperCase(),
      docNumber: permit.permitNumber,
      subject: `Pemberian ${permit.title} untuk ${permit.applicantName}`,
      recipientName: permit.applicantName,
      recipientId: permit.applicantId,
      recipientPhone: permit.applicantPhone,
      recipientRoleOrStatus: permit.category === 'WEAPON' ? 'Warga Sipil Berlisensi Senjata' : 'Penerima Izin Resmi',
      recipientAddress: 'Wilayah Hukum Negara HighState',
      issuerName: currentOfficer?.name || 'Momo Hatakeyama',
      issuerBadge: currentOfficer?.badge || '#GOV-01',
      issuerRank: currentOfficer?.rank || 'PRESIDENT [RANK 6]',
      issuerRole: 'Presiden / Pejabat Eksekutif Pengesah Negara',
      issuerSignatureTitle: 'Presiden / Pengesah Negara,',
      primarySeal: 'PRESIDENTIAL_SEAL',
      secondarySeal: 'GOVERNMENT_SEAL',
      notes: `Nomor Registrasi Sistem: ${permit.id} | Valid hingga: ${permit.validUntil}`,
      clauses: [
        {
          id: 'c1',
          clauseNumber: 'Ketentuan 1',
          title: 'DASAR HUKUM DAN LISENSI',
          content: `Pemerintah Negara HighState memberikan hak dan legalitas penuh atas ${permit.title} kepada pihak terkait sesuai data permohonan resmi.`
        },
        {
          id: 'c2',
          clauseNumber: 'Ketentuan 2',
          title: 'OBJEK DAN KETENTUAN KHUSUS',
          content: `Detail izin mencakup: ${permit.businessOrDetails}. Tujuan pemakaian: ${permit.purpose}. Ketentuan ini mengikat dan tunduk pada pengawasan berkala oleh aparatur negara.`
        },
        {
          id: 'c3',
          clauseNumber: 'Ketentuan 3',
          title: 'SANKSI DAN PENCABUTAN',
          content: `Izin ini berlaku hingga ${permit.validUntil} dan dapat dicabut sewaktu-waktu tanpa pemberitahuan jika pemegang izin melanggar ketertiban umum atau hukum pidana.`
        }
      ]
    };

    onNavigateToDocuments(presetId, prepopulatedDoc);
    triggerAlert('success', `Dokumen resmi untuk ${permit.applicantName} telah dimuat ke Studio Dokumen!`);
  };

  // --- ACTIONS: ANNOUNCEMENTS ---
  const handlePublishAnnouncement = (data: {
    title: string;
    level: SecurityLevel;
    targetScope: string;
    summary: string;
    clauses: string[];
    penalties: string;
  }) => {
    const year = new Date().getFullYear();
    const count = announcements.length + 1;
    const decreeNumber = `MAKLUMAT/GOV-PRES/${year}/${String(count).padStart(3, '0')}`;

    const newAnc = addGovernmentAnnouncement({
      title: data.title,
      decreeNumber,
      level: data.level,
      targetScope: data.targetScope,
      summary: data.summary,
      clauses: data.clauses,
      penalties: data.penalties,
      issuedBy: currentOfficer?.name || 'Momo Hatakeyama',
      issuedByRank: currentOfficer?.rank || 'PRESIDENT [RANK 6]'
    });

    setAnnouncements(getGovernmentAnnouncements());
    setIsNewAnnouncementModalOpen(false);
    triggerAlert('success', `Maklumat resmi "${newAnc.title}" berhasil diterbitkan!`);

    // Auto broadcast to Discord if configured
    sendAnnouncementWebhook(newAnc);
  };

  const sendAnnouncementWebhook = async (anc: GovernmentAnnouncement) => {
    const cfg = getSavedGovDocumentWebhookConfig();
    const webhookUrl = cfg.webhookUrl || getSavedWebhookConfig().webhookUrl;
    if (!webhookUrl) return;

    try {
      const levelColors: Record<number, number> = {
        1: 0x10B981, // Green
        2: 0xF59E0B, // Amber
        3: 0xEA580C, // Orange
        4: 0xDC2626  // Red
      };

      const embed = {
        title: `🏛️ [MAKLUMAT RESMI PEMERINTAH] ${anc.title}`,
        description: `**Nomor:** \`${anc.decreeNumber}\`\n**Otoritas Penerbit:** **${anc.issuedBy}** (${anc.issuedByRank})\n**Cakupan Wilayah:** ${anc.targetScope}\n\n${anc.summary}`,
        color: levelColors[anc.level] || 0xF59E0B,
        fields: [
          ...anc.clauses.map((c, i) => ({
            name: `📜 Ketentuan Pasal ${i + 1}`,
            value: c,
            inline: false
          })),
          {
            name: '⚠️ Sanksi Pelanggaran',
            value: anc.penalties || 'Sesuai regulasi hukum pidana yang berlaku.',
            inline: false
          }
        ],
        footer: {
          text: `Dewan Eksekutif Negara HighState • ${new Date().toLocaleDateString('id-ID')}`
        },
        timestamp: new Date().toISOString()
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cfg.botName || 'Kantor Kepresidenan HighState',
          avatar_url: cfg.botAvatar || 'https://cdn-icons-png.flaticon.com/512/1022/1022382.png',
          embeds: [embed]
        })
      });
      triggerAlert('success', '📢 Siaran maklumat berhasil dikirim ke channel Discord Pemerintah!');
    } catch (e) {
      console.warn('Gagal kirim webhook maklumat:', e);
    }
  };

  // --- ACTIONS: TREASURY ---
  const handleSaveTransaction = (data: {
    type: TreasuryType;
    category: TreasuryCategory;
    title: string;
    amount: number;
    partyName: string;
    notes?: string;
  }) => {
    const year = new Date().getFullYear();
    const count = treasury.length + 1;
    const prefix = data.type === 'INCOME' ? 'TRX/IN' : 'TRX/OUT';
    const receiptNumber = `${prefix}/${year}/${String(count).padStart(3, '0')}`;

    addTreasuryTransaction({
      receiptNumber,
      type: data.type,
      category: data.category,
      title: data.title,
      amount: Math.abs(data.amount),
      partyName: data.partyName,
      notes: data.notes,
      recordedBy: currentOfficer?.name || 'Pejabat Kas Negara',
      recordedByRank: currentOfficer?.rank || 'TREASURY'
    });

    setTreasury(getTreasuryTransactions());
    setIsNewTxModalOpen(false);
    triggerAlert('success', `Transaksi kas ${receiptNumber} berhasil dicatat!`);
  };

  // --- SECURITY LEVEL UPDATE ---
  const handleUpdateSecurityLevel = (level: SecurityLevel, curfew: boolean, hours: string, notes: string) => {
    const levelTitles: Record<SecurityLevel, string> = {
      1: 'LEVEL 1: KONDISI TERTIB & NORMAL',
      2: 'LEVEL 2: WASPADA & PENINGKATAN PATROLI',
      3: 'LEVEL 3: SIAGA TINGGI & JAM MALAM',
      4: 'LEVEL 4: DARURAT MILITER & LOCKDOWN'
    };

    const newStatus: StateSecurityStatus = {
      level,
      levelTitle: levelTitles[level],
      curfewActive: curfew,
      curfewHours: curfew ? hours : 'Tidak Ada Jam Malam',
      curfewZones: curfew ? 'Seluruh Wilayah Hukum Kota & Jalur Tol' : 'Normal',
      notes,
      updatedBy: currentOfficer?.name || 'Momo Hatakeyama',
      updatedByRank: currentOfficer?.rank || 'PRESIDENT [RANK 6]',
      updatedAt: Date.now()
    };

    saveStateSecurityStatus(newStatus);
    setSecurityStatus(newStatus);
    setIsSecurityModalOpen(false);
    triggerAlert('success', `Status keamanan negara diubah menjadi ${newStatus.levelTitle}!`);
  };

  return (
    <div className="space-y-4">
      {/* Alert Feedback Banner */}
      {alertMsg && (
        <div className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between shadow-lg transition-all animate-in fade-in ${
          alertMsg.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200' :
          alertMsg.type === 'error' ? 'bg-rose-950/90 border-rose-500 text-rose-200' :
          'bg-blue-950/90 border-blue-500 text-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            {alertMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-gray-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TOP HEADER: EXECUTIVE STATE SUITE BANNER */}
      <div className="bg-gradient-to-r from-[#18140B] via-[#1F190D] to-[#120F08] border border-amber-500/50 rounded-xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative crest watermark */}
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-amber-400">
          <Building2 className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/20 shrink-0 border border-amber-300">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-gray-100 tracking-tight flex items-center gap-2">
                  PUSAT LAYANAN & OPERASIONAL PEMERINTAHAN
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black font-mono bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-sm">
                  EXECUTIVE SUITE
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Portal Terpadu Penerbitan Izin Resmi Kenegaraan, Maklumat Darurat/Jam Malam, Rekam Sipil, dan Kas APBN
              </p>
            </div>
          </div>

          {/* Real-time State Security Status Card */}
          <div className="flex items-center gap-3 bg-black/60 border border-amber-500/30 rounded-lg p-2.5 sm:px-4 shrink-0">
            <div className={`w-3 h-3 rounded-full shrink-0 animate-ping ${
              securityStatus.level === 1 ? 'bg-emerald-400' :
              securityStatus.level === 2 ? 'bg-amber-400' :
              securityStatus.level === 3 ? 'bg-orange-500' : 'bg-rose-500'
            }`} />
            <div>
              <div className="text-[10px] uppercase tracking-wider font-mono text-gray-400">
                STATUS KESIAGAAN NEGARA
              </div>
              <div className={`text-xs sm:text-sm font-black font-mono ${
                securityStatus.level === 1 ? 'text-emerald-400' :
                securityStatus.level === 2 ? 'text-amber-400' :
                securityStatus.level === 3 ? 'text-orange-400' : 'text-rose-400'
              }`}>
                {securityStatus.levelTitle}
              </div>
              {securityStatus.curfewActive && (
                <div className="text-[10px] font-mono text-orange-300 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-orange-400" />
                  <span>Jam Malam: {securityStatus.curfewHours}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsSecurityModalOpen(true)}
              className="ml-2 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 rounded text-[11px] font-bold font-mono transition"
              title="Ubah Status Kesiagaan & Jam Malam Negara"
            >
              UBAH
            </button>
          </div>
        </div>

        {/* Quick Shortcut Pills for Government Workflows */}
        <div className="relative z-10 mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsNewPermitModalOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Terbitkan Izin Baru</span>
            </button>
            <button
              type="button"
              onClick={() => setIsNewAnnouncementModalOpen(true)}
              className="px-3 py-1.5 bg-amber-950/70 hover:bg-amber-900/80 text-amber-200 border border-amber-600/50 hover:border-amber-400 font-bold text-xs rounded-lg flex items-center gap-1.5 transition active:scale-95"
            >
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>Buat Maklumat Kenegaraan</span>
            </button>
            <button
              type="button"
              onClick={() => setIsNewTxModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-600/50 hover:border-emerald-400 font-bold text-xs rounded-lg flex items-center gap-1.5 transition active:scale-95"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Catat Kas Negara</span>
            </button>
            <button
              type="button"
              onClick={() => setIsGovCentralAuthModalOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs rounded-lg shadow-md shadow-amber-950/40 flex items-center gap-1.5 transition active:scale-95 border border-amber-300"
              title="Buka Otorisasi Pusat & Webhook Kenegaraan"
            >
              <Crown className="w-3.5 h-3.5 text-black" />
              <span>👑 Otorisasi Pusat:</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToDocuments && (
              <button
                type="button"
                onClick={() => onNavigateToDocuments()}
                className="text-[11px] text-amber-300 hover:text-amber-100 font-mono flex items-center gap-1 underline underline-offset-2"
                title="Buka Studio Surat & Dokumen Resmi"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Buka Studio Surat Resmi</span>
              </button>
            )}
            {onNavigateToDmv && (
              <button
                type="button"
                onClick={onNavigateToDmv}
                className="text-[11px] text-cyan-300 hover:text-cyan-100 font-mono flex items-center gap-1 underline underline-offset-2 ml-2"
                title="Cek Kependudukan & Data Kendaraan (DMV)"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Cek Sipil & DMV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-2 overflow-x-auto no-scrollbar gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('PERMITS')}
            className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'PERMITS'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-[#161B22] text-gray-300 hover:text-white hover:bg-gray-800/80 border border-gray-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>📜 Perizinan & Grasi ({permits.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ANNOUNCEMENTS')}
            className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'ANNOUNCEMENTS'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-[#161B22] text-gray-300 hover:text-white hover:bg-gray-800/80 border border-gray-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>📢 Maklumat & Jam Malam ({announcements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('TREASURY')}
            className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'TREASURY'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-[#161B22] text-gray-300 hover:text-white hover:bg-gray-800/80 border border-gray-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>💰 Kas & APBN Negara (${treasuryStats.balance.toLocaleString()})</span>
          </button>

          <button
            onClick={() => setActiveTab('SOP')}
            className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === 'SOP'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-[#161B22] text-gray-300 hover:text-white hover:bg-gray-800/80 border border-gray-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>⚖️ Panduan Wewenang & SOP</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PERIZINAN & GRASI KENEGARAAN                                      */}
      {/* ========================================================================= */}
      {activeTab === 'PERMITS' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-[#161B22] border border-gray-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={permitSearch}
                  onChange={e => setPermitSearch(e.target.value)}
                  placeholder="Cari pemohon, nomor izin, NIK / CID, atau nomor senjata..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Category Filter */}
              <select
                value={permitCategoryFilter}
                onChange={e => setPermitCategoryFilter(e.target.value)}
                className="bg-[#0D1117] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="WEAPON">🔫 Senjata Api (WCL)</option>
                <option value="BUSINESS">🏢 Izin Usaha / Bisnis</option>
                <option value="EVENT">🎪 Izin Keramaian / Acara</option>
                <option value="PARDON">⚖️ Grasi & Amnesti</option>
                <option value="SECURITY">🛡️ Pengawalan VIP</option>
                <option value="APPOINTMENT">📜 SK Pejabat</option>
              </select>

              {/* Status Filter */}
              <select
                value={permitStatusFilter}
                onChange={e => setPermitStatusFilter(e.target.value)}
                className="bg-[#0D1117] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="APPROVED">✅ Disetujui / Aktif</option>
                <option value="PENDING">⏳ Menunggu Verifikasi</option>
                <option value="REJECTED">❌ Ditolak</option>
                <option value="REVOKED">🚫 Dicabut</option>
              </select>
            </div>

            <button
              onClick={() => setIsNewPermitModalOpen(true)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Form Izin Baru</span>
            </button>
          </div>

          {/* Permit Cards Grid */}
          {filteredPermits.length === 0 ? (
            <div className="bg-[#161B22] border border-gray-800 rounded-xl p-8 text-center text-gray-400">
              <FileCheck className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">Tidak ada data izin yang sesuai dengan pencarian.</p>
              <p className="text-xs text-gray-500 mt-1">Gunakan tombol "+ Form Izin Baru" untuk menerbitkan perizinan resmi.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredPermits.map(permit => {
                const isApproved = permit.status === 'APPROVED';
                const isPending = permit.status === 'PENDING';
                const isRejected = permit.status === 'REJECTED';
                const isRevoked = permit.status === 'REVOKED';

                // RP format text for quick copy
                const rpText = `[IZIN RESMI PEMERINTAH HIGHSTATE]\nNo. Registrasi: ${permit.permitNumber}\nJenis: ${permit.title}\nNama Pemegang: ${permit.applicantName} (ID: ${permit.applicantId})\nKeterangan/Seri: ${permit.businessOrDetails}\nMasa Berlaku: ${permit.validUntil}\nStatus: ${permit.status}\nPengesah: ${permit.approvedBy || currentOfficer?.name || 'Kantor Kepresidenan'} [PRESIDENTIAL DECREE]`;

                return (
                  <div 
                    key={permit.id}
                    className="bg-[#161B22] border border-gray-800 hover:border-amber-500/40 rounded-xl p-4 flex flex-col justify-between transition-all shadow-md group"
                  >
                    <div>
                      {/* Badge Top Line */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-[10px] text-amber-400 font-bold bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40">
                          {permit.permitNumber}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          isApproved ? 'bg-emerald-950/80 border border-emerald-600/60 text-emerald-300' :
                          isPending ? 'bg-amber-950/80 border border-amber-600/60 text-amber-300' :
                          isRejected ? 'bg-rose-950/80 border border-rose-600/60 text-rose-300' :
                          'bg-gray-800 border border-gray-700 text-gray-400'
                        }`}>
                          {isApproved ? '✅ AKTIF' : isPending ? '⏳ PROSES' : isRejected ? '❌ DITOLAK' : '🚫 DICABUT'}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-gray-100 line-clamp-1 group-hover:text-amber-300 transition">
                        {permit.title}
                      </h3>

                      <div className="space-y-1 mt-2.5 text-xs text-gray-300 font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Pemohon:</span>
                          <strong className="text-gray-100">{permit.applicantName}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">KTP / CID:</span>
                          <span className="text-amber-400 font-bold">{permit.applicantId}</span>
                        </div>
                        {permit.applicantPhone && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">No. Telepon:</span>
                            <span className="text-gray-300">{permit.applicantPhone}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Detail / Seri:</span>
                          <span className="text-gray-200 truncate max-w-[170px]">{permit.businessOrDetails}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Berlaku:</span>
                          <span className="text-emerald-400 font-bold">{permit.validUntil}</span>
                        </div>
                        {permit.feeAmount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Retribusi Pajak:</span>
                            <span className="text-amber-400 font-bold">${permit.feeAmount.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {permit.notes && (
                        <div className="mt-2.5 p-2 bg-[#0D1117] rounded border border-gray-800 text-[11px] text-gray-400 italic">
                          "{permit.notes}"
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-gray-800/80 flex flex-col gap-2">
                      {/* Fast Status Toggles */}
                      <div className="flex items-center gap-1.5">
                        {permit.status !== 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdatePermitStatus(permit.id, 'APPROVED')}
                            className="flex-1 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 hover:text-white rounded text-[11px] font-bold font-mono transition"
                            title="Setujui dan aktifkan izin ini"
                          >
                            ✓ SETUJUI
                          </button>
                        )}
                        {permit.status !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdatePermitStatus(permit.id, 'REJECTED')}
                            className="flex-1 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-600/50 text-rose-300 hover:text-white rounded text-[11px] font-bold font-mono transition"
                            title="Tolak permohonan izin"
                          >
                            ✗ TOLAK
                          </button>
                        )}
                        {permit.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdatePermitStatus(permit.id, 'REVOKED')}
                            className="flex-1 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-[11px] font-bold font-mono transition"
                            title="Cabut izin yang sedang berjalan"
                          >
                            🚫 CABUT
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* 1-Click Studio Document Generator */}
                        <button
                          type="button"
                          onClick={() => handleTransferPermitToStudio(permit)}
                          className="flex-1 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-bold rounded text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                          title="Buka dan cetak surat resmi ini di Studio Dokumen Resmi"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>📄 Terbitkan Surat</span>
                        </button>

                        {/* Copy RP text */}
                        <button
                          type="button"
                          onClick={() => handleCopyText(rpText, permit.id)}
                          className="p-1.5 bg-[#0D1117] hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 rounded transition"
                          title="Salin ringkasan surat izin untuk roleplay in-game"
                        >
                          {copiedId === permit.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        {/* Delete Permit */}
                        <button
                          type="button"
                          onClick={() => handleDeletePermit(permit.id)}
                          className="p-1.5 bg-[#0D1117] hover:bg-rose-900/60 text-gray-400 hover:text-rose-300 border border-gray-700 rounded transition"
                          title="Hapus berkas izin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MAKLUMAT RESMI & JAM MALAM KENEGARAAN                             */}
      {/* ========================================================================= */}
      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="space-y-4">
          {/* Header Action Strip */}
          <div className="bg-[#161B22] border border-gray-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <span>Pusat Maklumat, Dekrit Presiden & Pengumuman Publik</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Siarkan maklumat kenegaraan, jam malam (curfew), dan instruksi penegakan hukum ke in-game RP dan Discord.
              </p>
            </div>

            <button
              onClick={() => setIsNewAnnouncementModalOpen(true)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Maklumat Baru</span>
            </button>
          </div>

          {/* Announcements Feed */}
          {announcements.length === 0 ? (
            <div className="bg-[#161B22] border border-gray-800 rounded-xl p-8 text-center text-gray-400">
              <Radio className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">Belum ada maklumat resmi yang diterbitkan.</p>
              <p className="text-xs text-gray-500 mt-1">Klik "+ Buat Maklumat Baru" untuk menerbitkan siaran resmi kepresidenan.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {announcements.map(anc => {
                // In-Game chat formats
                const inGameAnnouncement = `/announcement [MAKLUMAT PRESIDEN] ${anc.title.toUpperCase()}! ${anc.summary} (Berlaku: ${anc.targetScope})`;
                const inGameGov = `/gov [PEMERINTAH HIGHSTATE] No: ${anc.decreeNumber} - ${anc.summary}`;
                const inGameEmote = `/me menyiarkan Maklumat Resmi Kepresidenan Nomor ${anc.decreeNumber} ke seluruh frekuensi publik dan aparat penegak hukum.`;

                return (
                  <div
                    key={anc.id}
                    className="bg-[#161B22] border border-amber-500/30 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-800">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/70 border border-amber-500/50 text-amber-300">
                            {anc.decreeNumber}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            Cakupan: <strong className="text-gray-200">{anc.targetScope}</strong>
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            Penerbit: <strong className="text-amber-400">{anc.issuedBy}</strong> [{anc.issuedByRank}]
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-gray-100 mt-1">
                          {anc.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => sendAnnouncementWebhook(anc)}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 rounded text-[11px] font-bold font-mono transition flex items-center gap-1"
                          title="Kirim ulang maklumat ini ke Discord Webhook Pemerintah"
                        >
                          <Send className="w-3 h-3" />
                          <span>KIRIM DISCORD</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Hapus maklumat ini?')) {
                              setAnnouncements(deleteGovernmentAnnouncement(anc.id));
                              triggerAlert('info', 'Maklumat berhasil dihapus.');
                            }
                          }}
                          className="p-1 text-gray-500 hover:text-rose-400"
                          title="Hapus maklumat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Summary & Clauses */}
                    <div className="py-3 text-xs text-gray-200 space-y-2 leading-relaxed">
                      <p className="bg-[#0D1117] p-2.5 rounded border border-gray-800 text-amber-200/90 font-sans">
                        {anc.summary}
                      </p>

                      {anc.clauses && anc.clauses.length > 0 && (
                        <div className="space-y-1.5 pl-2">
                          <span className="text-[11px] font-bold text-gray-400 font-mono block">POIN KETENTUAN HUKUM:</span>
                          {anc.clauses.map((clause, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[11.5px] text-gray-300">
                              <span className="text-amber-400 font-bold shrink-0">{idx + 1}.</span>
                              <span>{clause}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {anc.penalties && (
                        <div className="text-[11px] text-rose-300 font-mono bg-rose-950/40 p-2 rounded border border-rose-900/40">
                          <strong>⚠️ SANKSI HUKUM:</strong> {anc.penalties}
                        </div>
                      )}
                    </div>

                    {/* Fast Copy Buttons Strip for Roleplay */}
                    <div className="pt-3 border-t border-gray-800 flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleCopyText(inGameAnnouncement, `${anc.id}-ann`)}
                          className="px-2 py-1 bg-[#0D1117] hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 rounded text-[10.5px] font-mono flex items-center gap-1 transition"
                          title="Salin format /announcement in-game"
                        >
                          {copiedId === `${anc.id}-ann` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>/announcement</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyText(inGameGov, `${anc.id}-gov`)}
                          className="px-2 py-1 bg-[#0D1117] hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 rounded text-[10.5px] font-mono flex items-center gap-1 transition"
                          title="Salin format /gov in-game"
                        >
                          {copiedId === `${anc.id}-gov` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>/gov</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyText(inGameEmote, `${anc.id}-me`)}
                          className="px-2 py-1 bg-[#0D1117] hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 rounded text-[10.5px] font-mono flex items-center gap-1 transition"
                          title="Salin format /me emote roleplay"
                        >
                          {copiedId === `${anc.id}-me` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>/me Emote RP</span>
                        </button>
                      </div>

                      {onNavigateToDocuments && (
                        <button
                          type="button"
                          onClick={() => {
                            const prepopulatedDoc = {
                              title: anc.title.toUpperCase(),
                              docNumber: anc.decreeNumber,
                              subject: `Maklumat Resmi Kenegaraan: ${anc.title}`,
                              recipientName: 'Seluruh Warga Negara & Aparatur Penegak Hukum',
                              recipientId: 'CITIZENS-HSPD',
                              issuerName: anc.issuedBy,
                              issuerRank: anc.issuedByRank,
                              issuerSignatureTitle: 'Presiden / Pengesah Negara,',
                              primarySeal: 'PRESIDENTIAL_SEAL',
                              secondarySeal: 'GOVERNMENT_SEAL',
                              notes: `Wilayah Cakupan: ${anc.targetScope}`,
                              clauses: anc.clauses.map((c, i) => ({
                                id: `c-${i}`,
                                clauseNumber: `Pasal ${i + 1}`,
                                title: `KETENTUAN HUKUM ${i + 1}`,
                                content: c
                              }))
                            };
                            onNavigateToDocuments('tpl-surat-keputusan-pemerintah', prepopulatedDoc);
                          }}
                          className="text-[11px] text-amber-400 hover:text-amber-200 font-mono font-bold flex items-center gap-1 underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Jadikan Dokumen Cetak</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: KAS & APBN NEGARA                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'TREASURY' && (
        <div className="space-y-4">
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Saldo Kas Bersih */}
            <div className="bg-[#161B22] border border-amber-500/40 rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
                <span>TOTAL SALDO KAS NEGARA</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className={`text-2xl font-black font-mono mt-1 ${treasuryStats.balance >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                ${treasuryStats.balance.toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-500 mt-1 font-mono">
                Total Perbendaharaan Eksekutif Aktif
              </div>
            </div>

            {/* Total Pemasukan Pajak */}
            <div className="bg-[#161B22] border border-emerald-500/30 rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
                <span>TOTAL PEMASUKAN PAJAK / RETRIBUSI</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black font-mono mt-1 text-emerald-400">
                +${treasuryStats.income.toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-500 mt-1 font-mono">
                Pajak Usaha, Izin Senjata & Denda
              </div>
            </div>

            {/* Total Subsidi & Pengeluaran */}
            <div className="bg-[#161B22] border border-rose-500/30 rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
                <span>TOTAL SUBSIDI & PENGELUARAN</span>
                <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black font-mono mt-1 text-rose-400">
                -${treasuryStats.expense.toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-500 mt-1 font-mono">
                Subsidi HSPD, Medis & Operasional
              </div>
            </div>
          </div>

          {/* Filter & Action Bar */}
          <div className="bg-[#161B22] border border-gray-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={treasurySearch}
                  onChange={e => setTreasurySearch(e.target.value)}
                  placeholder="Cari transaksi, nomor kwitansi, atau pihak terkait..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <select
                value={treasuryTypeFilter}
                onChange={e => setTreasuryTypeFilter(e.target.value)}
                className="bg-[#0D1117] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 font-mono focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Semua Jenis</option>
                <option value="INCOME">🟢 Pemasukan (Pajak/Retribusi)</option>
                <option value="EXPENSE">🔴 Pengeluaran (Subsidi/Operasional)</option>
              </select>
            </div>

            <button
              onClick={() => setIsNewTxModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Transaksi Baru</span>
            </button>
          </div>

          {/* Treasury Table */}
          <div className="bg-[#161B22] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0D1117] border-b border-gray-800 text-gray-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Kwitansi & Tanggal</th>
                    <th className="p-3">Uraian Transaksi</th>
                    <th className="p-3">Pihak Terkait</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3 text-right">Nominal</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-300">
                  {filteredTreasury.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">
                        Belum ada catatan transaksi keuangan.
                      </td>
                    </tr>
                  ) : (
                    filteredTreasury.map(tx => {
                      const isIncome = tx.type === 'INCOME';
                      const dateStr = new Date(tx.timestamp).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });

                      return (
                        <tr key={tx.id} className="hover:bg-gray-800/40 transition">
                          <td className="p-3">
                            <div className="font-bold text-amber-400">{tx.receiptNumber}</div>
                            <div className="text-[10px] text-gray-500">{dateStr}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-gray-200">{tx.title}</div>
                            {tx.notes && <div className="text-[10px] text-gray-500 italic">{tx.notes}</div>}
                          </td>
                          <td className="p-3 text-gray-300">{tx.partyName}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-300 border border-gray-700">
                              {tx.category}
                            </span>
                          </td>
                          <td className={`p-3 text-right font-bold text-sm ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isIncome ? '+' : '-'}${tx.amount.toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Hapus pencatatan transaksi ini?')) {
                                  setTreasury(deleteTreasuryTransaction(tx.id));
                                  triggerAlert('info', 'Transaksi berhasil dihapus.');
                                }
                              }}
                              className="p-1 text-gray-500 hover:text-rose-400"
                              title="Hapus transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PANDUAN WEWENANG & SOP KENEGARAAN                                  */}
      {/* ========================================================================= */}
      {activeTab === 'SOP' && (
        <div className="bg-[#161B22] border border-gray-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-800">
            <Scale className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-gray-100">
              PANDUAN HAK PREROGATIF & STANDAR OPERASIONAL PEMERINTAH (SOP)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-gray-300">
            {/* Box 1: Hak Prerogatif Presiden */}
            <div className="p-4 bg-[#0D1117] rounded-lg border border-gray-800 space-y-2">
              <h3 className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>1. Hak Prerogatif Presiden & Kepala Eksekutif</span>
              </h3>
              <ul className="list-disc pl-4 space-y-1.5 text-gray-300">
                <li>Memiliki hak mutlak dalam memberikan <strong>Grasi & Amnesti</strong> (Pengurangan hukuman atau pembebasan narapidana) dengan pertimbangan hukum.</li>
                <li>Menetapkan status kesiagaan negara (Level 1 hingga Darurat Militer) serta memberlakukan jam malam (Curfew) di seluruh wilayah hukum.</li>
                <li>Mengangkat dan memberhentikan pejabat pemerintahan dan komandan kepolisian (HSPD Chief of Police).</li>
                <li>Mengesahkan anggaran belanja dan penyaluran subsidi operasional penegak hukum.</li>
              </ul>
            </div>

            {/* Box 2: Prosedur Izin Senjata Api (WCL) */}
            <div className="p-4 bg-[#0D1117] rounded-lg border border-gray-800 space-y-2">
              <h3 className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
                <Crosshair className="w-4 h-4 text-amber-400" />
                <span>2. Prosedur Legalitas Izin Senjata (WCL)</span>
              </h3>
              <ul className="list-disc pl-4 space-y-1.5 text-gray-300">
                <li>Warga sipil wajib memiliki <strong>SKCK Bersih</strong> (tidak memiliki catatan kriminal tindak pidana berat).</li>
                <li>Wajib mencantumkan nomor seri senjata pabrik yang didaftarkan ke sistem perizinan negara.</li>
                <li>Retribusi izin disetorkan ke Kas Negara sebesar nominal resmi yang ditetapkan ($25.000).</li>
                <li>Izin wajib dicetak dan dibawa dalam bentuk fisik maupun tercatat dalam arsip digital kenegaraan.</li>
              </ul>
            </div>

            {/* Box 3: Jam Malam & Darurat Sipil */}
            <div className="p-4 bg-[#0D1117] rounded-lg border border-gray-800 space-y-2">
              <h3 className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>3. Jam Malam & Penegakan Hukum Khusus</span>
              </h3>
              <ul className="list-disc pl-4 space-y-1.5 text-gray-300">
                <li>Selama jam malam diberlakukan, warga dilarang berkumpul lebih dari 3 orang tanpa izin resmi pemerintah.</li>
                <li>Aparat kepolisian HSPD berhak melakukan pemeriksaan identitas (Frisk & ID Check) terhadap siapapun yang melintas di zona jam malam.</li>
                <li>Pelanggar jam malam dapat dikenakan penahanan sementara (detention) maksimal 15 menit atau denda administratif.</li>
              </ul>
            </div>

            {/* Box 4: Sinergi dengan Kepolisian HSPD */}
            <div className="p-4 bg-[#0D1117] rounded-lg border border-gray-800 space-y-2">
              <h3 className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>4. Sinergi Pemerintah & Kepolisian</span>
              </h3>
              <ul className="list-disc pl-4 space-y-1.5 text-gray-300">
                <li>Pemerintah adalah otoritas pengesah tertinggi, sedangkan kepolisian HSPD adalah pelaksana hukum di lapangan.</li>
                <li>Pemerintah dapat meminta pengawalan VIP khusus dari divisi kepolisian untuk perjalanan dinas kenegaraan.</li>
                <li>Setiap surat keputusan operasi penegakan hukum gabungan wajib dibubuhi tanda tangan Presiden dan stempel kenegaraan.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FORM PERMOHONAN IZIN BARU                                         */}
      {/* ========================================================================= */}
      {isNewPermitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#161B22] border border-amber-500/50 rounded-xl w-full max-w-xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-gray-100">Penerbitan Izin Resmi Kenegaraan</h3>
              </div>
              <button onClick={() => setIsNewPermitModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                const form = e.currentTarget;
                const category = (form.elements.namedItem('category') as HTMLSelectElement).value as PermitCategory;
                const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                const applicantName = (form.elements.namedItem('applicantName') as HTMLInputElement).value;
                const applicantId = (form.elements.namedItem('applicantId') as HTMLInputElement).value;
                const applicantPhone = (form.elements.namedItem('applicantPhone') as HTMLInputElement).value;
                const businessOrDetails = (form.elements.namedItem('businessOrDetails') as HTMLInputElement).value;
                const purpose = (form.elements.namedItem('purpose') as HTMLInputElement).value;
                const validUntil = (form.elements.namedItem('validUntil') as HTMLInputElement).value;
                const feeAmount = Number((form.elements.namedItem('feeAmount') as HTMLInputElement).value) || 0;
                const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement).value;

                const year = new Date().getFullYear();
                const count = permits.length + 1;
                const catPrefix = category === 'WEAPON' ? 'WCL' : category === 'BUSINESS' ? 'BIZ' : category === 'EVENT' ? 'EVT' : 'GOV';
                const permitNumber = `${catPrefix}/GOV-EXEC/${year}/${String(count).padStart(3, '0')}`;

                const newPmt = addGovernmentPermit({
                  permitNumber,
                  category,
                  title,
                  applicantName,
                  applicantId,
                  applicantPhone,
                  businessOrDetails,
                  purpose,
                  validUntil,
                  feeAmount,
                  status: 'APPROVED',
                  approvedBy: currentOfficer?.name || 'Momo Hatakeyama',
                  approvedByRank: currentOfficer?.rank || 'PRESIDENT [RANK 6]',
                  approvedAt: Date.now(),
                  notes
                });

                // Also record fee to treasury if > 0
                if (feeAmount > 0) {
                  addTreasuryTransaction({
                    receiptNumber: `TRX/RET/${year}/${String(treasury.length + 1).padStart(3, '0')}`,
                    type: 'INCOME',
                    category: category === 'WEAPON' ? 'WEAPON_FEE' : 'TAX',
                    title: `Retribusi ${title}`,
                    amount: feeAmount,
                    partyName: applicantName,
                    notes: `Penerbitan Izin ${permitNumber}`,
                    recordedBy: currentOfficer?.name || 'Pejabat Penerbit',
                    recordedByRank: currentOfficer?.rank || 'GOVERNMENT'
                  });
                }

                setPermits(getGovernmentPermits());
                setTreasury(getTreasuryTransactions());
                setIsNewPermitModalOpen(false);
                triggerAlert('success', `Izin ${newPmt.permitNumber} untuk ${applicantName} berhasil diterbitkan!`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-gray-400 font-mono mb-1">KATEGORI PERIZINAN</label>
                <select
                  name="category"
                  defaultValue="WEAPON"
                  className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100 font-mono"
                  onChange={e => {
                    const titleInput = document.getElementById('new-permit-title') as HTMLInputElement;
                    const feeInput = document.getElementById('new-permit-fee') as HTMLInputElement;
                    if (e.target.value === 'WEAPON') {
                      if (titleInput) titleInput.value = 'Surat Izin Kepemilikan & Membawa Senjata Api Sipil (WCL)';
                      if (feeInput) feeInput.value = '25000';
                    } else if (e.target.value === 'BUSINESS') {
                      if (titleInput) titleInput.value = 'Surat Izin Operasional Komersial & Usaha';
                      if (feeInput) feeInput.value = '50000';
                    } else if (e.target.value === 'EVENT') {
                      if (titleInput) titleInput.value = 'Surat Izin Keramaian & Acara Publik';
                      if (feeInput) feeInput.value = '15000';
                    } else if (e.target.value === 'PARDON') {
                      if (titleInput) titleInput.value = 'Keputusan Grasi & Pengampunan Pidana Presiden';
                      if (feeInput) feeInput.value = '0';
                    }
                  }}
                >
                  <option value="WEAPON">🔫 Senjata Api Sipil (WCL)</option>
                  <option value="BUSINESS">🏢 Izin Usaha / Komersial</option>
                  <option value="EVENT">🎪 Izin Keramaian & Acara Publik</option>
                  <option value="PARDON">⚖️ Grasi & Pembebasan Bersyarat Narapidana</option>
                  <option value="SECURITY">🛡️ Izin Pengawalan VIP / Keamanan Swasta</option>
                  <option value="APPOINTMENT">📜 Surat Keputusan Pengangkatan Pejabat</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-mono mb-1">JUDUL DOKUMEN IZIN</label>
                <input
                  id="new-permit-title"
                  name="title"
                  type="text"
                  required
                  defaultValue="Surat Izin Kepemilikan & Membawa Senjata Api Sipil (WCL)"
                  className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-mono mb-1">NAMA PEMOHON / PENERIMA</label>
                  <input
                    name="applicantName"
                    type="text"
                    required
                    placeholder="Contoh: Michael De Santa"
                    className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-mono mb-1">NOMOR KTP / CID</label>
                  <input
                    name="applicantId"
                    type="text"
                    required
                    placeholder="Contoh: CID-78921445"
                    className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-mono mb-1">NOMOR TELEPON</label>
                  <input
                    name="applicantPhone"
                    type="text"
                    placeholder="Contoh: 555-0143"
                    className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-mono mb-1">RETRIBUSI / BIAYA PAJAK ($)</label>
                  <input
                    id="new-permit-fee"
                    name="feeAmount"
                    type="number"
                    defaultValue="25000"
                    className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-mono mb-1">DETAIL OBJEK / SERI SENJATA / NAMA USAHA</label>
                <input
                  name="businessOrDetails"
                  type="text"
                  required
                  placeholder="Contoh: Combat Pistol 9mm Seri: WEP-9MM-449102"
                  className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-mono mb-1">TUJUAN / KEPERLUAN</label>
                  <input
                    name="purpose"
                    type="text"
                    required
                    defaultValue="Perlindungan diri sah (Self Defense)"
                    className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-mono mb-1">MASA BERLAKU</label>
                  <input
                    name="validUntil"
                    type="text"
                    required
                    defaultValue="1 (Satu) Tahun Sejak Diterbitkan"
                    className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-mono mb-1">CATATAN KHUSUS / SYARAT KELULUSAN</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue="Telah melalui verifikasi SKCK Bersih di kepolisian HSPD dan uji kecakapan menembak."
                  className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100"
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPermitModalOpen(false)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg shadow-md"
                >
                  ✓ Terbitkan Izin Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FORM MAKLUMAT RESMI KENEGARAAN                                    */}
      {/* ========================================================================= */}
      {isNewAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#161B22] border border-amber-500/50 rounded-xl w-full max-w-xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-gray-100">Penerbitan Maklumat Kenegaraan</h3>
              </div>
              <button onClick={() => setIsNewAnnouncementModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                const form = e.currentTarget;
                const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                const level = Number((form.elements.namedItem('level') as HTMLSelectElement).value) as SecurityLevel;
                const targetScope = (form.elements.namedItem('targetScope') as HTMLInputElement).value;
                const summary = (form.elements.namedItem('summary') as HTMLTextAreaElement).value;
                const clausesText = (form.elements.namedItem('clauses') as HTMLTextAreaElement).value;
                const penalties = (form.elements.namedItem('penalties') as HTMLInputElement).value;

                const clauses = clausesText.split('\n').map(c => c.trim()).filter(Boolean);

                handlePublishAnnouncement({
                  title,
                  level,
                  targetScope,
                  summary,
                  clauses: clauses.length > 0 ? clauses : ['Mematuhi seluruh arahan petugas penegak hukum di lapangan.'],
                  penalties
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-gray-400 font-mono mb-1">JUDUL MAKLUMAT</label>
                <input
                  name="title"
                  type="text"
                  required
                  defaultValue="Maklumat Presiden: Penegakan Ketertiban Umum & Aturan Jam Malam"
                  className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-mono mb-1">TINGKAT KESIAGAAN NEGARA</label>
                  <select
                    name="level"
                    defaultValue="3"
                    className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100 font-mono"
                  >
                    <option value="1">🟢 Level 1: Normal (Tertib)</option>
                    <option value="2">🟡 Level 2: Waspada (Patroli Naik)</option>
                    <option value="3">🟠 Level 3: Siaga (Jam Malam)</option>
                    <option value="4">🔴 Level 4: Darurat Militer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 font-mono mb-1">CAKUPAN WILAYAH</label>
                  <input
                    name="targetScope"
                    type="text"
                    required
                    defaultValue="Seluruh Wilayah Hukum Negara HighState"
                    className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-mono mb-1">RINGKASAN INSTRUKSI RESMI</label>
                <textarea
                  name="summary"
                  rows={2}
                  required
                  defaultValue="Diberitahukan kepada seluruh warga masyarakat bahwa terhitung malam ini diberlakukan jam malam. Segala bentuk aktivitas di luar ruangan di atas pukul 22:00 wajib memiliki izin darurat."
                  className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-mono mb-1">POIN-POIN KETENTUAN HUKUM (1 Poin Per Baris)</label>
                <textarea
                  name="clauses"
                  rows={3}
                  defaultValue={`Masyarakat dilarang berkumpul lebih dari 3 orang di area publik setelah pukul 22:00 WIB.
Aparat kepolisian HSPD berhak melakukan sterilisasi dan pemeriksaan kendaraan secara acak.
Fasilitas medis, logistik pangan, dan petugas berwenang dikecualikan dari aturan jam malam.`}
                  className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-mono mb-1">SANKSI HUKUM BAGI PELANGGAR</label>
                <input
                  name="penalties"
                  type="text"
                  required
                  defaultValue="Penahanan sementara 15 menit dan denda tilang administratif $5.000."
                  className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100"
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewAnnouncementModalOpen(false)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg shadow-md"
                >
                  📢 Siarkan Maklumat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FORM TRANSAKSI KAS NEGARA                                         */}
      {/* ========================================================================= */}
      {isNewTxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#161B22] border border-emerald-500/50 rounded-xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-gray-100">Catat Transaksi Kas Negara</h3>
              </div>
              <button onClick={() => setIsNewTxModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                const form = e.currentTarget;
                const type = (form.elements.namedItem('type') as HTMLSelectElement).value as TreasuryType;
                const category = (form.elements.namedItem('category') as HTMLSelectElement).value as TreasuryCategory;
                const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                const amount = Number((form.elements.namedItem('amount') as HTMLInputElement).value) || 0;
                const partyName = (form.elements.namedItem('partyName') as HTMLInputElement).value;
                const notes = (form.elements.namedItem('notes') as HTMLInputElement).value;

                handleSaveTransaction({
                  type,
                  category,
                  title,
                  amount,
                  partyName,
                  notes
                });
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-mono mb-1">JENIS TRANSAKSI</label>
                  <select
                    name="type"
                    defaultValue="INCOME"
                    className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100 font-mono"
                  >
                    <option value="INCOME">🟢 Pemasukan (+)</option>
                    <option value="EXPENSE">🔴 Pengeluaran (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 font-mono mb-1">KATEGORI</label>
                  <select
                    name="category"
                    defaultValue="TAX"
                    className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100 font-mono"
                  >
                    <option value="TAX">Pajak Usaha / Properti</option>
                    <option value="WEAPON_FEE">Retribusi Izin Senjata</option>
                    <option value="FINE">Denda Pelanggaran Hukum</option>
                    <option value="POLICE_SUBSIDY">Subsidi Operasional HSPD</option>
                    <option value="EMS_SUBSIDY">Subsidi Medis & RS</option>
                    <option value="INFRASTRUCTURE">Perawatan Fasilitas Umum</option>
                    <option value="SALARY">Gaji & Honorarium Aparatur</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-mono mb-1">URAIAN TRANSAKSI</label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="Contoh: Pembayaran Pajak Triwulan Usaha Bar Bahama Mamas"
                  className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-mono mb-1">NOMINAL TRANSAKSI ($)</label>
                  <input
                    name="amount"
                    type="number"
                    required
                    min="1"
                    placeholder="50000"
                    className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-mono mb-1">PIHAK PENYETOR / PENERIMA</label>
                  <input
                    name="partyName"
                    type="text"
                    required
                    placeholder="Contoh: Bahama Mamas Club"
                    className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-mono mb-1">KETERANGAN / NOMOR REKENING / CATATAN</label>
                <input
                  name="notes"
                  type="text"
                  placeholder="Contoh: Bukti setor transfer bank rekening negara nomor..."
                  className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100"
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTxModalOpen(false)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-lg shadow-md"
                >
                  ✓ Simpan ke Buku Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UBAH STATUS KESIAGAAN NEGARA & JAM MALAM                          */}
      {/* ========================================================================= */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#161B22] border border-amber-500/50 rounded-xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-gray-100">Atur Status Kesiagaan Negara & Jam Malam</h3>
              </div>
              <button onClick={() => setIsSecurityModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                const form = e.currentTarget;
                const level = Number((form.elements.namedItem('secLevel') as HTMLSelectElement).value) as SecurityLevel;
                const curfew = (form.elements.namedItem('curfewActive') as HTMLInputElement).checked;
                const hours = (form.elements.namedItem('curfewHours') as HTMLInputElement).value;
                const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement).value;

                handleUpdateSecurityLevel(level, curfew, hours, notes);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-gray-400 font-mono mb-1">TINGKAT KESIAGAAN NEGARA</label>
                <select
                  name="secLevel"
                  defaultValue={securityStatus.level}
                  className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100 font-mono"
                >
                  <option value="1">🟢 Level 1: Kondisi Tertib & Normal (24 Jam Bebas)</option>
                  <option value="2">🟡 Level 2: Waspada & Peningkatan Patroli Gabungan</option>
                  <option value="3">🟠 Level 3: Siaga Tinggi & Pemberlakuan Jam Malam</option>
                  <option value="4">🔴 Level 4: Darurat Militer & Lockdown Wilayah Total</option>
                </select>
              </div>

              <div className="p-3 bg-[#0D1117] rounded-lg border border-gray-800 space-y-2">
                <label className="flex items-center gap-2 text-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    name="curfewActive"
                    defaultChecked={securityStatus.curfewActive}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                  />
                  <span className="font-bold">Aktifkan Protokol Jam Malam (Curfew)</span>
                </label>

                <div>
                  <label className="block text-gray-400 font-mono text-[11px] mb-1">RENTANG JAM MALAM</label>
                  <input
                    name="curfewHours"
                    type="text"
                    defaultValue={securityStatus.curfewHours || '22:00 - 05:00 WIB'}
                    className="w-full bg-[#161B22] border border-gray-700 rounded p-1.5 text-gray-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-mono mb-1">KETERANGAN SITUASI KEAMANAN</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={securityStatus.notes}
                  className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-gray-100"
                />
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSecurityModalOpen(false)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg shadow-md"
                >
                  ✓ Terapkan Status Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL OTORISASI PUSAT & WEBHOOK PEMERINTAH */}
      <GovernmentCentralAuthModal
        isOpen={isGovCentralAuthModalOpen}
        onClose={() => setIsGovCentralAuthModalOpen(false)}
        currentOfficer={currentOfficer}
        onNavigateToExecutiveHub={() => {
          setIsGovCentralAuthModalOpen(false);
          setActiveTab('ANNOUNCEMENTS');
        }}
        onNavigateToRoster={onNavigateToRoster}
      />
    </div>
  );
};
