import React, { useState } from 'react';
import { 
  OfficerAccount, OfficerRankLevel, OfficerWarning, DischargeRecord, PromotionRecord, ALL_RANKS, HIGH_COMMAND_RANKS, isOfficerHighRank 
} from '../types';
import { 
  Shield, User, Award, ArrowUpRight, ArrowDownRight, Edit3, 
  Search, CheckCircle2, AlertTriangle, KeyRound, 
  Sparkles, ShieldAlert, X, Plus, ShieldCheck, Clock, Lock,
  UserX, Trash2, AlertOctagon, Send, RotateCcw, AlertCircle, FileText, RefreshCw,
  UserPlus, Phone, Sliders, Eye, EyeOff, Radio, Activity
} from 'lucide-react';
import { 
  sendOfficerWarningToDiscord, 
  sendOfficerDischargeToDiscord,
  sendPromotionAnnouncementToDiscord,
  sendNewOfficerRegistrationToDiscord,
  getSavedWarningWebhookConfig,
  getSavedDischargeWebhookConfig,
  getSavedPromotionWebhookConfig
} from '../utils/discordWebhook';
import { getOfficerDutyState, formatDutyDuration } from '../utils/officerDutyStorage';
import { HSPD_LOGO_URL } from '../assets/logo';
import { syncCollectionWithFirestore } from '../services/firebaseRealtimeSync';
import { mergeWithOfficialRoster, HSPD_OFFICIAL_ROSTER } from '../data/hspdOfficialRoster';

interface Props {
  roster: OfficerAccount[];
  currentOfficerRank?: OfficerRankLevel;
  currentOfficerName?: string;
  currentOfficerBadge?: string;
  onUpdateOfficer: (updated: OfficerAccount) => void;
  onRegisterOfficer?: (newAccount: OfficerAccount) => void;
  onDeleteOfficer?: (officerId: string, reason?: string) => void;
  onOpenPinResetAudit?: () => void;
  pendingPinResetCount?: number;
  onClose?: () => void;
}

const PRESET_DIVISIONS = [
  'Field Training Bureau / Patrol',
  'Traffic Enforcement Unit (TEU)',
  'Detective Bureau / CID',
  'Special Weapons and Tactics (SWAT)',
  'K-9 Canine Division',
  'Air Support Division (ASD)',
  'Internal Affairs Division (IAD)',
  'High Command Staff / Executive Office',
  'Police Academy Division',
];

const PRESET_WARNING_REASONS = [
  'Pelanggaran SOP Operasional & Radio Code Lapangan',
  'Penyalahgunaan Senjata Api / Kekerasan Berlebih (Excessive Force)',
  'Insubordinasi / Tidak Mematuhi Instruksi Pimpinan/Supervisor',
  'Lalai / Tidak Tertib dalam Pengisian Laporan Kasus & Denda',
  'Perilaku Tidak Pantas terhadap Warga Sipil / Rekan Seprofesi',
  'Mangkir / Desersi Tugas tanpa Izin Supervisor',
  'Mengabaikan Panggilan Darurat (10-99 / 10-20 Dispatch)',
  'Kerjasama / Membantu Aktivitas Kriminal (Peringatan Keras)',
  'Lainnya (Keterangan Khusus)'
];

const PRESET_DISCHARGE_REASONS = [
  'Akumulasi 3 Surat Peringatan (SP3 / 3 Strikes Disciplinary)',
  'Pelanggaran Kode Etik & Disiplin Berat Kepolisian',
  'Tindakan Korupsi / Kerjasama dengan Kriminal (Dirty Cop)',
  'Inaktif Tanpa Keterangan / Desersi Tugas Lapangan (AWOL)',
  'Penyalahgunaan Wewenang Jabatan & Senjata Api Kepolisian',
  'Gagal Melewati Masa Percobaan / Akademi (Failed Probation)',
  'Pemberhentian Dengan Hormat (Honorable Discharge / Resign)',
  'Mutasi Personel / Restrukturisasi Internal'
];

const PRESET_PROMOTION_REASONS = [
  'Lulus Ujian Kualifikasi / Diklat Kenaikan Pangkat',
  'Prestasi Kinerja, Loyalitas & Jam Terbang Patroli Tinggi',
  'Rekomendasi Resmi Kepala Divisi & Supervisor',
  'Dedikasi Penegakan Hukum & Bebas Pelanggaran Disiplin',
  'Pengangkatan Struktur Kepemimpinan & Komando Unit',
  'Lulus Masa Percobaan / Akademi Kepolisian (Cadet to Officer)',
  'Lainnya (Keterangan Khusus)'
];

export const RosterManagement: React.FC<Props> = ({
  roster,
  currentOfficerRank,
  currentOfficerName,
  currentOfficerBadge,
  onUpdateOfficer,
  onRegisterOfficer,
  onDeleteOfficer,
  onOpenPinResetAudit,
  pendingPinResetCount,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRank, setFilterRank] = useState<'ALL' | 'DUTY' | 'COMMAND' | 'PATROL' | 'WARNED'>('ALL');
  const [editingOfficer, setEditingOfficer] = useState<OfficerAccount | null>(null);
  
  // Warning Management Modal State
  const [warningOfficer, setWarningOfficer] = useState<OfficerAccount | null>(null);
  const [warningPresetReason, setWarningPresetReason] = useState(PRESET_WARNING_REASONS[0]);
  const [warningDetailReason, setWarningDetailReason] = useState('');
  const [warningSendWebhook, setWarningSendWebhook] = useState(true);
  const [isSubmittingWarning, setIsSubmittingWarning] = useState(false);
  const [warningModalNotice, setWarningModalNotice] = useState('');

  // Discharge / Delete Modal State
  const [deletingOfficer, setDeletingOfficer] = useState<OfficerAccount | null>(null);
  const [deletePresetReason, setDeletePresetReason] = useState(PRESET_DISCHARGE_REASONS[0]);
  const [deleteDetailReason, setDeleteDetailReason] = useState('');
  const [deleteSendWebhook, setDeleteSendWebhook] = useState(true);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Edit Officer State
  const [newRank, setNewRank] = useState<OfficerRankLevel>('POLICE OFFICER II [PO II]');
  const [newDivision, setNewDivision] = useState('');
  const [newPin, setNewPin] = useState('');
  const [showEditPin, setShowEditPin] = useState(false);
  const [showTablePins, setShowTablePins] = useState(false);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [promotionPresetReason, setPromotionPresetReason] = useState(PRESET_PROMOTION_REASONS[0]);
  const [promotionDetailReason, setPromotionDetailReason] = useState('');
  const [promotionSendWebhook, setPromotionSendWebhook] = useState(true);
  const [isSubmittingRankUpdate, setIsSubmittingRankUpdate] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  const [isSyncingRealtime, setIsSyncingRealtime] = useState(false);

  const handleManualSyncDatabase = async () => {
    setIsSyncingRealtime(true);
    try {
      const merged = mergeWithOfficialRoster(roster);
      localStorage.setItem('hspd_roster_database_v4', JSON.stringify(merged));
      localStorage.setItem('hspd_roster_database_v3', JSON.stringify(merged));
      await syncCollectionWithFirestore('ROSTER', merged);
      setSuccessNotice(`⚡ Realtime Database Berhasil Disinkronkan! Total ${merged.length} data anggota kepolisian & PIN aktif tersimpan.`);
      setTimeout(() => setSuccessNotice(''), 6000);
    } catch (err: any) {
      setSuccessNotice(`✅ Database lokal aktif: ${roster.length} data anggota kepolisian tersimpan.`);
      setTimeout(() => setSuccessNotice(''), 4000);
    } finally {
      setIsSyncingRealtime(false);
    }
  };

  // Add Officer Modal State (High Command Full Access)
  const [isAddOfficerModalOpen, setIsAddOfficerModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addBadge, setAddBadge] = useState('#');
  const [addRank, setAddRank] = useState<OfficerRankLevel>('CADET [CDT]');
  const [addDivision, setAddDivision] = useState(PRESET_DIVISIONS[0]);
  const [addCustomDivision, setAddCustomDivision] = useState('');
  const [addPin, setAddPin] = useState('10-4');
  const [addPhone, setAddPhone] = useState('');
  const [addPromotedBy, setAddPromotedBy] = useState(() => 
    `SK Pengangkatan oleh ${currentOfficerRank || 'High Command'} ${currentOfficerName || ''}`
  );
  const [addSendWebhook, setAddSendWebhook] = useState(true);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addFormError, setAddFormError] = useState('');
  const [showAddPin, setShowAddPin] = useState(false);

  // Check if current officer holds one of the 4 High Command ranks
  const isCurrentOfficerCommand = isOfficerHighRank(currentOfficerRank);

  const handleOpenAddModal = () => {
    if (!isCurrentOfficerCommand) {
      alert('Akses Ditolak: Hanya jajaran High Command (Chief of Police, Assistant Chief, Deputy Chief, Commander) yang memiliki hak akses pendaftaran anggota baru.');
      return;
    }
    setAddName('');
    // Auto suggest next badge number
    const maxBadgeNum = roster.reduce((max, o) => {
      const match = o.badge.replace('#', '').match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        return num > max ? num : max;
      }
      return max;
    }, 100);
    setAddBadge(`#${maxBadgeNum + 1}`);
    setAddRank('CADET [CDT]');
    setAddDivision(PRESET_DIVISIONS[0]);
    setAddCustomDivision('');
    setAddPin('10-4');
    setAddPhone('');
    setAddPromotedBy(`SK Pengangkatan oleh ${currentOfficerRank || 'High Command'} ${currentOfficerName || ''}`);
    setAddSendWebhook(true);
    setAddFormError('');
    setIsAddOfficerModalOpen(true);
  };

  const handleSaveNewOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCurrentOfficerCommand) return;

    const trimmedName = addName.trim();
    let trimmedBadge = addBadge.trim();
    if (!trimmedBadge.startsWith('#')) {
      trimmedBadge = `#${trimmedBadge}`;
    }
    const trimmedPin = addPin.trim();
    const finalDivision = addDivision === 'CUSTOM' ? (addCustomDivision.trim() || 'Field Patrol') : addDivision;

    if (!trimmedName) {
      setAddFormError('Nama lengkap anggota kepolisian wajib diisi!');
      return;
    }
    if (!trimmedBadge || trimmedBadge === '#') {
      setAddFormError('Nomor badge / lencana wajib diisi!');
      return;
    }
    if (!trimmedPin) {
      setAddFormError('PIN Login awal wajib ditentukan!');
      return;
    }

    // Check duplicate badge
    const duplicateBadge = roster.find(o => o.badge.toLowerCase() === trimmedBadge.toLowerCase());
    if (duplicateBadge) {
      setAddFormError(`Nomor Badge "${trimmedBadge}" sudah digunakan oleh petugas ${duplicateBadge.name}! Gunakan nomor badge lain.`);
      return;
    }

    // Check duplicate name
    const duplicateName = roster.find(o => o.name.toLowerCase() === trimmedName.toLowerCase());
    if (duplicateName) {
      setAddFormError(`Nama "${trimmedName}" sudah terdaftar di Roster (Badge ${duplicateName.badge})!`);
      return;
    }

    setIsSubmittingAdd(true);
    setAddFormError('');

    const newAccount: OfficerAccount = {
      id: `roster-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmedName,
      badge: trimmedBadge,
      rank: addRank,
      division: finalDivision,
      phone: addPhone.trim() || undefined,
      pin: trimmedPin,
      registeredAt: Date.now(),
      promotedBy: addPromotedBy.trim() || `SK Pengangkatan oleh ${currentOfficerRank || 'High Command'} ${currentOfficerName || ''}`,
      warnings: []
    };

    try {
      // 1. Send Discord Webhook Announcement if enabled
      if (addSendWebhook) {
        await sendNewOfficerRegistrationToDiscord({
          officerName: trimmedName,
          officerBadge: trimmedBadge,
          officerRank: addRank,
          officerDivision: finalDivision,
          officerPhone: addPhone.trim() || undefined,
          initialPin: trimmedPin,
          registeredBy: currentOfficerName || 'High Command',
          registeredByBadge: currentOfficerBadge || '#001',
          registeredByRank: currentOfficerRank || 'HIGH COMMAND',
        });
      }

      // 2. Call handler or update roster
      if (onRegisterOfficer) {
        onRegisterOfficer(newAccount);
      } else {
        onUpdateOfficer(newAccount);
      }

      setIsAddOfficerModalOpen(false);
      setSuccessNotice(`✅ Personel Baru ${trimmedName} (${trimmedBadge}) pangkat ${addRank} berhasil ditambahkan ke Roster dan disahkan!`);
      setTimeout(() => setSuccessNotice(''), 6000);
    } catch (err: any) {
      console.error('Failed to register new officer:', err);
      if (onRegisterOfficer) onRegisterOfficer(newAccount);
      setIsAddOfficerModalOpen(false);
      setSuccessNotice(`✅ Personel Baru ${trimmedName} (${trimmedBadge}) berhasil ditambahkan ke database roster!`);
      setTimeout(() => setSuccessNotice(''), 6000);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const filteredRoster = roster.filter(officer => {
    const matchesSearch = 
      officer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.rank.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.division.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (officer.pin && officer.pin.includes(searchQuery));
    
    if (!matchesSearch) return false;
    if (filterRank === 'DUTY') {
      const duty = getOfficerDutyState(officer.badge, roster);
      return duty.isDuty;
    }
    if (filterRank === 'COMMAND') return isOfficerHighRank(officer.rank);
    if (filterRank === 'PATROL') return !isOfficerHighRank(officer.rank);
    if (filterRank === 'WARNED') return (officer.warnings?.length || 0) > 0;
    return true;
  });

  const handleStartEdit = (officer: OfficerAccount) => {
    if (!isCurrentOfficerCommand) {
      alert('Akses Ditolak: Hanya jajaran High Command (Chief of Police, Assistant Chief, Deputy Chief, Commander) yang berhak mengubah pangkat dan PIN anggota.');
      return;
    }
    setEditingOfficer(officer);
    setNewRank(officer.rank);
    setNewDivision(officer.division);
    setNewPin(officer.pin || '10-4');
    setShowEditPin(false);
    setPromotionPresetReason(PRESET_PROMOTION_REASONS[0]);
    setPromotionDetailReason('');
    setPromotionSendWebhook(true);
  };

  const handleStartWarning = (officer: OfficerAccount) => {
    if (!isCurrentOfficerCommand) {
      alert('Akses Ditolak: Hanya jajaran High Command yang berhak menerbitkan Surat Peringatan (SP / Strike) kepada anggota.');
      return;
    }
    setWarningOfficer(officer);
    setWarningPresetReason(PRESET_WARNING_REASONS[0]);
    setWarningDetailReason('');
    setWarningSendWebhook(true);
    setWarningModalNotice('');
  };

  const handleStartDelete = (officer: OfficerAccount) => {
    if (!isCurrentOfficerCommand) {
      alert('Akses Ditolak: Hanya jajaran High Command yang berhak memecat atau menghapus anggota dari roster.');
      return;
    }
    if (currentOfficerName && officer.name.toLowerCase() === currentOfficerName.toLowerCase()) {
      alert('Aksi Dibatalkan: Anda tidak dapat memecat atau menghapus akun Anda sendiri saat sedang aktif login.');
      return;
    }
    setDeletingOfficer(officer);
    
    const strikeCount = officer.warnings?.length || 0;
    if (strikeCount >= 3) {
      setDeletePresetReason('Akumulasi 3 Surat Peringatan (SP3 / 3 Strikes Disciplinary)');
      setDeleteDetailReason('Personel telah mencapai batas maksimal 3 Surat Peringatan atas akumulasi pelanggaran SOP kepolisian.');
    } else {
      setDeletePresetReason(PRESET_DISCHARGE_REASONS[1]);
      setDeleteDetailReason('');
    }
    setDeleteSendWebhook(true);
  };

  // Submit Warning (SP 1, 2, or 3)
  const handleIssueWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningOfficer || !isCurrentOfficerCommand) return;

    const currentStrikes = warningOfficer.warnings?.length || 0;
    if (currentStrikes >= 3) {
      alert('Personel ini telah mencapai batas maksimal 3 Surat Peringatan (Strike 3/3). Harap lakukan proses pemecatan.');
      return;
    }

    const nextStrikeLevel = (currentStrikes + 1) as 1 | 2 | 3;
    const finalReason = warningDetailReason.trim() 
      ? `${warningPresetReason}: ${warningDetailReason.trim()}`
      : warningPresetReason;

    const newWarning: OfficerWarning = {
      id: 'WRN-' + Date.now(),
      strikeNumber: nextStrikeLevel,
      reason: finalReason,
      timestamp: Date.now(),
      issuedBy: currentOfficerName || 'High Command',
      issuedByBadge: currentOfficerBadge || 'HC-01',
      issuedByRank: currentOfficerRank || 'HIGH COMMAND'
    };

    const updatedWarnings = [...(warningOfficer.warnings || []), newWarning];
    const updatedOfficer: OfficerAccount = {
      ...warningOfficer,
      warnings: updatedWarnings
    };

    setIsSubmittingWarning(true);

    try {
      // Send Discord Webhook if checked
      if (warningSendWebhook) {
        const webhookConfig = getSavedWarningWebhookConfig();
        if (webhookConfig.webhookUrl) {
          await sendOfficerWarningToDiscord(
            warningOfficer,
            newWarning,
            updatedWarnings.length,
            webhookConfig
          );
        }
      }

      onUpdateOfficer(updatedOfficer);
      setWarningOfficer(updatedOfficer);
      setWarningModalNotice(`✅ Surat Peringatan Ke-${nextStrikeLevel} (SP${nextStrikeLevel}) berhasil diterbitkan dan dicatat!`);
      setSuccessNotice(`⚠️ Berhasil memberikan SP${nextStrikeLevel} kepada ${warningOfficer.name} (${warningOfficer.badge})`);
      setWarningDetailReason('');
      setTimeout(() => setSuccessNotice(''), 5000);
    } catch (err: any) {
      console.error('Failed to issue warning', err);
      setWarningModalNotice('⚠️ SP tercatat di database CAD, namun webhook Discord gagal terkirim.');
    } finally {
      setIsSubmittingWarning(false);
    }
  };

  // Revoke / Pardon a Warning
  const handleRevokeWarning = (warningId: string) => {
    if (!warningOfficer || !isCurrentOfficerCommand) return;
    if (!confirm('Apakah Anda yakin ingin mencabut/membatalkan Surat Peringatan ini dari berkas personel?')) return;

    const filtered = (warningOfficer.warnings || []).filter(w => w.id !== warningId);
    // Re-index strike numbers
    const reindexed = filtered.map((w, idx) => ({
      ...w,
      strikeNumber: (idx + 1) as 1 | 2 | 3
    }));

    const updatedOfficer: OfficerAccount = {
      ...warningOfficer,
      warnings: reindexed
    };

    onUpdateOfficer(updatedOfficer);
    setWarningOfficer(updatedOfficer);
    setWarningModalNotice('✅ Surat Peringatan berhasil dicabut/dibatalkan.');
    setSuccessNotice(`✅ SP berhasil dicabut dari rekam jejak ${warningOfficer.name}`);
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  // Confirm Discharge / Pecat
  const handleConfirmDelete = async () => {
    if (!deletingOfficer || !onDeleteOfficer) return;
    const removedName = deletingOfficer.name;
    const removedBadge = deletingOfficer.badge;
    const finalReason = deleteDetailReason.trim()
      ? `${deletePresetReason} - ${deleteDetailReason.trim()}`
      : deletePresetReason;

    setIsSubmittingDelete(true);

    try {
      // Send Discord Webhook if checked
      if (deleteSendWebhook) {
        const dischargeConfig = getSavedDischargeWebhookConfig();
        if (dischargeConfig.webhookUrl) {
          const dischargeRecord: DischargeRecord = {
            officerId: deletingOfficer.id,
            officerName: deletingOfficer.name,
            officerBadge: deletingOfficer.badge,
            officerRank: deletingOfficer.rank,
            officerDivision: deletingOfficer.division,
            reason: finalReason,
            dischargedBy: currentOfficerName || 'High Command',
            dischargedByBadge: currentOfficerBadge || 'HC-01',
            dischargedByRank: currentOfficerRank || 'HIGH COMMAND',
            warningCountBeforeDischarge: deletingOfficer.warnings?.length || 0,
            timestamp: Date.now()
          };

          await sendOfficerDischargeToDiscord(
            dischargeRecord,
            dischargeConfig
          );
        }
      }

      onDeleteOfficer(deletingOfficer.id, finalReason);
      setDeletingOfficer(null);
      setSuccessNotice(`✅ Berhasil memecat dan memberhentikan ${removedName} (${removedBadge}) dari kepolisian.`);
      setTimeout(() => setSuccessNotice(''), 5000);
    } catch (err) {
      console.error('Discharge failed', err);
      onDeleteOfficer(deletingOfficer.id, finalReason);
      setDeletingOfficer(null);
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  const handleSaveRankUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficer || !isCurrentOfficerCommand) return;

    setIsSubmittingRankUpdate(true);
    const isRankChanged = editingOfficer.rank !== newRank;
    const finalPromotionReason = promotionPresetReason === 'Lainnya (Keterangan Khusus)'
      ? (promotionDetailReason.trim() || 'Keterangan khusus dari High Command')
      : (promotionDetailReason.trim() ? `${promotionPresetReason} - ${promotionDetailReason.trim()}` : promotionPresetReason);

    const promotedByText = isRankChanged 
      ? `Diubah ke ${newRank} oleh ${currentOfficerName || 'Atasan'} (${currentOfficerRank || 'Command'}) pada ${new Date().toLocaleDateString('id-ID')}`
      : editingOfficer.promotedBy;

    const updated: OfficerAccount = {
      ...editingOfficer,
      rank: newRank,
      division: newDivision || editingOfficer.division,
      pin: newPin.trim() || editingOfficer.pin || '10-4',
      promotedBy: promotedByText
    };

    try {
      if (isRankChanged && promotionSendWebhook) {
        const promotionConfig = getSavedPromotionWebhookConfig();
        if (promotionConfig.webhookUrl) {
          const promotionRecord: PromotionRecord = {
            officerId: editingOfficer.id,
            officerName: editingOfficer.name,
            officerBadge: editingOfficer.badge,
            oldRank: editingOfficer.rank,
            newRank: newRank,
            division: newDivision || editingOfficer.division,
            reason: finalPromotionReason,
            promotedBy: currentOfficerName || 'High Command',
            promotedByBadge: currentOfficerBadge || 'HC-01',
            promotedByRank: currentOfficerRank || 'HIGH COMMAND',
            timestamp: Date.now()
          };

          await sendPromotionAnnouncementToDiscord(promotionRecord, promotionConfig);
        }
      }

      onUpdateOfficer(updated);
      setSuccessNotice(`✅ Berhasil memperbarui data & PIN akun ${editingOfficer.name} (${editingOfficer.badge})!${isRankChanged ? ` SK Promosi ke ${newRank} telah dicatat.` : ''}`);
      setEditingOfficer(null);
      setTimeout(() => setSuccessNotice(''), 5000);
    } catch (err) {
      console.error('Failed to update officer rank/pin', err);
      onUpdateOfficer(updated);
      setEditingOfficer(null);
    } finally {
      setIsSubmittingRankUpdate(false);
    }
  };

  return (
    <div className="bg-[#161B22] border border-gray-800 rounded-xl p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-3.5">
          <div className="relative group shrink-0">
            <img
              src={HSPD_LOGO_URL}
              alt="HSPD Official Seal"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-contain drop-shadow-md border border-amber-500/40 bg-black/60 p-0.5"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-100 uppercase tracking-tight font-mono">
                Manajemen Anggota & Disiplin Personel Kepolisian
              </h2>
              <span className="text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded">
                HIGH COMMAND ONLY
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono">
              Status Dinas Tiap Petugas, Promosi Pangkat, PIN Login, Surat Peringatan (Maks 3 SP), & Pemecatan
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-end sm:self-center p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Permission Status Banner */}
      {!isCurrentOfficerCommand ? (
        <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg text-amber-300 text-xs font-mono flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Mode Hanya Lihat (View-Only). Pangkat Anda ({currentOfficerRank || 'Petugas'}) bukan High Command. Hanya <strong>CHIEF OF POLICE [COP], ASSISTANT CHIEF [A/C], DEPUTY CHIEF [D/C], dan COMMANDER [CDR]</strong> yang dapat mengedit data & PIN anggota.
          </span>
        </div>
      ) : (
        <div className="p-3 bg-blue-950/30 border border-blue-800/50 rounded-lg text-blue-300 text-xs font-mono flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Otorisasi High Command Terbuka: Anda login sebagai <strong>{currentOfficerRank}</strong>.</span>
          </div>
          <span className="text-[10px] bg-blue-900/60 text-blue-200 px-2 py-0.5 rounded border border-blue-700">
            FULL DISCIPLINARY ACCESS
          </span>
        </div>
      )}

      {/* Success Notification */}
      {successNotice && (
        <div className="p-3 bg-green-950/40 border border-green-800/60 rounded-lg text-green-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Command Actions Bar & Passcode Info Banner */}
      <div className="bg-[#0D1117] border border-amber-900/40 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          {/* HIGH COMMAND ONLY: ADD OFFICER BUTTON */}
          <button
            id="btn-add-officer-modal"
            type="button"
            onClick={handleOpenAddModal}
            className={`px-3.5 py-2 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition shadow-md ${
              isCurrentOfficerCommand
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
            }`}
            title={
              isCurrentOfficerCommand
                ? 'Daftarkan & tambahkan personel baru ke database anggota (Akses Penuh High Command)'
                : 'Hanya jajaran High Command yang dapat mendaftarkan personel baru'
            }
          >
            <UserPlus className="w-4 h-4" />
            <span>+ TAMBAH ANGGOTA BARU</span>
          </button>

          {/* SINKRONKAN DATABASE REALTIME BUTTON */}
          <button
            id="btn-sync-realtime-roster"
            type="button"
            onClick={handleManualSyncDatabase}
            disabled={isSyncingRealtime}
            className="px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/70 hover:border-emerald-400 text-emerald-300 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
            title="Sinkronkan seluruh 56+ data anggota kepolisian & PIN ke Realtime Database Firestore"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isSyncingRealtime ? 'animate-spin' : ''}`} />
            <span>{isSyncingRealtime ? 'MENYINKRONKAN...' : '⚡ SINKRONKAN DATABASE REALTIME'}</span>
          </button>

          {/* HIGH COMMAND ONLY: PIN RESET AUDIT & WEBHOOK LOG BUTTON */}
          {onOpenPinResetAudit && (
            <button
              id="btn-open-pin-reset-audit"
              type="button"
              onClick={onOpenPinResetAudit}
              className="px-3 py-2 bg-amber-950/70 hover:bg-amber-900 border border-amber-600/70 hover:border-amber-400 text-amber-300 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
              title="Audit & Otorisasi Pengajuan Lupa PIN Login via Discord Webhook"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>👑 LOG RESET PIN & WEBHOOK</span>
              {typeof pendingPinResetCount === 'number' && pendingPinResetCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-black text-[10px] rounded-full font-bold animate-pulse">
                  {pendingPinResetCount}
                </span>
              )}
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-[11px]">
            <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-gray-400">Passcode Pendaftaran:</span>
            <span className="text-amber-400 font-bold bg-black/60 px-1.5 py-0.5 rounded border border-amber-800/50">
              10-4 / 911
            </span>
          </div>
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <span className="text-amber-300 font-bold">⚠️ Max 3 SP</span>
            <span>sebelum pemecatan dinas</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama anggota, nomor badge, pangkat, atau divisi..."
            className="w-full pl-9 pr-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-blue-500 rounded-lg text-xs text-gray-100 placeholder:text-gray-600 outline-none font-mono transition"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#0D1117] p-1 border border-gray-800 rounded-lg text-xs font-mono overflow-x-auto">
          <button
            onClick={() => setFilterRank('ALL')}
            className={`px-2.5 py-1 rounded transition whitespace-nowrap ${filterRank === 'ALL' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Semua ({roster.length})
          </button>
          <button
            onClick={() => setFilterRank('DUTY')}
            className={`px-2.5 py-1 rounded transition whitespace-nowrap flex items-center gap-1 ${filterRank === 'DUTY' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-400 hover:text-emerald-200'}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>On Duty ({roster.filter(r => getOfficerDutyState(r.badge, roster).isDuty).length})</span>
          </button>
          <button
            onClick={() => setFilterRank('PATROL')}
            className={`px-2.5 py-1 rounded transition whitespace-nowrap ${filterRank === 'PATROL' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Field Patrol ({roster.filter(r => !isOfficerHighRank(r.rank)).length})
          </button>
          <button
            onClick={() => setFilterRank('COMMAND')}
            className={`px-2.5 py-1 rounded transition whitespace-nowrap ${filterRank === 'COMMAND' ? 'bg-amber-600 text-black font-bold' : 'text-gray-400 hover:text-gray-200'}`}
          >
            High Command ({roster.filter(r => isOfficerHighRank(r.rank)).length})
          </button>
          <button
            onClick={() => setFilterRank('WARNED')}
            className={`px-2.5 py-1 rounded transition whitespace-nowrap ${filterRank === 'WARNED' ? 'bg-rose-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Kena SP ({roster.filter(r => (r.warnings?.length || 0) > 0).length})
          </button>
        </div>
      </div>

      {/* Anggota Table / Grid */}
      <div className="border border-gray-800 rounded-lg overflow-hidden bg-[#0D1117]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#161B22] border-b border-gray-800 text-gray-400 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Petugas & Lencana</th>
                <th className="py-2.5 px-3">Status Dinas</th>
                <th className="py-2.5 px-3">Pangkat / Rank</th>
                <th className="py-2.5 px-3">Divisi Operasional</th>
                <th className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <span>PIN Anggota</span>
                    <button
                      type="button"
                      onClick={() => setShowTablePins(!showTablePins)}
                      className="p-0.5 text-gray-400 hover:text-amber-300 rounded transition"
                      title={showTablePins ? "Sembunyikan semua PIN di tabel" : "Tampilkan semua PIN di tabel"}
                    >
                      {showTablePins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </th>
                <th className="py-2.5 px-3">Status Disiplin (SP)</th>
                <th className="py-2.5 px-3">Riwayat Promosi</th>
                <th className="py-2.5 px-3 text-right">Tindakan High Command</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {filteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 font-mono">
                    Tidak ada data personel yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredRoster.map((officer) => {
                  const isHigh = isOfficerHighRank(officer.rank);
                  const isSelf = currentOfficerName && officer.name.toLowerCase() === currentOfficerName.toLowerCase();
                  const warningsCount = officer.warnings?.length || 0;
                  const dutyState = getOfficerDutyState(officer.badge, roster);
                  const dutyDuration = formatDutyDuration(dutyState.isDuty, dutyState.dutyStartTime);

                  return (
                    <tr key={officer.id || officer.name} className="hover:bg-gray-800/30 transition">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] ${
                            isHigh ? 'bg-amber-950 text-amber-300 border border-amber-700/60' : 'bg-blue-950 text-blue-300 border border-blue-800/60'
                          }`}>
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-100 flex items-center gap-1.5">
                              <span>{officer.name}</span>
                              {isSelf && (
                                <span className="text-[9px] bg-blue-900/60 text-blue-300 px-1.5 py-0.2 rounded border border-blue-700 font-normal">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-500">Badge: <span className="text-gray-300">{officer.badge}</span></div>
                          </div>
                        </div>
                      </td>

                      {/* Live Individual Officer Duty Status Badge */}
                      <td className="py-2.5 px-3">
                        {dutyState.isDuty ? (
                          <div className="inline-flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>{dutyState.dutyStatus || '10-8'} ON DUTY</span>
                            </span>
                            <span className="text-[9px] text-emerald-400/80 font-mono pl-0.5">
                              ⏱️ {dutyDuration.shortStr}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-rose-950/50 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span>10-7 OFF DUTY</span>
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isHigh 
                            ? 'bg-amber-950/60 text-amber-300 border-amber-700/60' 
                            : 'bg-blue-950/50 text-blue-300 border-blue-800/60'
                        }`}>
                          {isHigh && '★ '}{officer.rank}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-gray-400">
                        {officer.division}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <code className="text-amber-300 font-bold bg-black/60 px-1.5 py-0.5 rounded border border-amber-800/40 min-w-[54px] text-center inline-block">
                            {(showTablePins || revealedPins[officer.id || officer.name]) ? (officer.pin || '10-4') : '••••••'}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              const key = officer.id || officer.name;
                              setRevealedPins(prev => ({ ...prev, [key]: !prev[key] }));
                            }}
                            className="p-1 text-gray-500 hover:text-amber-300 rounded transition"
                            title={revealedPins[officer.id || officer.name] ? "Sembunyikan PIN" : "Tampilkan PIN"}
                          >
                            {revealedPins[officer.id || officer.name] ? (
                              <EyeOff className="w-3 h-3 text-amber-400" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Warnings / Strikes Badge */}
                      <td className="py-2.5 px-3">
                        {warningsCount === 0 ? (
                          <button
                            onClick={() => handleStartWarning(officer)}
                            className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 px-2 py-0.5 rounded hover:bg-emerald-900/50 transition cursor-pointer"
                            title="Klik untuk membuka riwayat / beri SP"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>0/3 Bersih</span>
                          </button>
                        ) : warningsCount === 1 ? (
                          <button
                            onClick={() => handleStartWarning(officer)}
                            className="inline-flex items-center gap-1 text-[10px] bg-amber-950/70 text-amber-300 border border-amber-700/70 px-2 py-0.5 rounded font-bold hover:bg-amber-900/60 transition cursor-pointer"
                            title="Klik untuk melihat SP1 atau tambah SP"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>1/3 (SP1)</span>
                          </button>
                        ) : warningsCount === 2 ? (
                          <button
                            onClick={() => handleStartWarning(officer)}
                            className="inline-flex items-center gap-1 text-[10px] bg-orange-950/80 text-orange-300 border border-orange-600 px-2 py-0.5 rounded font-bold hover:bg-orange-900/60 transition cursor-pointer"
                            title="Klik untuk melihat SP2 atau tambah SP"
                          >
                            <AlertTriangle className="w-3 h-3 text-orange-400" />
                            <span>2/3 (SP2)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartWarning(officer)}
                            className="inline-flex items-center gap-1 text-[10px] bg-rose-950 text-rose-300 border border-rose-600 px-2 py-0.5 rounded font-bold animate-pulse hover:bg-rose-900 transition cursor-pointer"
                            title="Batas Maksimal SP tercapai! Rekomendasi Pemecatan"
                          >
                            <AlertOctagon className="w-3 h-3 text-rose-400" />
                            <span>3/3 (SP3 / REKOMENDASI PECAT)</span>
                          </button>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-[10px] text-gray-400 max-w-[180px] truncate">
                        {officer.promotedBy || 'Terdaftar via Terminal Resmi'}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isCurrentOfficerCommand ? (
                            <>
                              {/* Warning Button */}
                              <button
                                onClick={() => handleStartWarning(officer)}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 shadow-sm ${
                                  warningsCount >= 3
                                    ? 'bg-rose-950 text-rose-300 border border-rose-700 hover:bg-rose-900'
                                    : warningsCount > 0
                                    ? 'bg-amber-950 text-amber-300 border border-amber-700 hover:bg-amber-900'
                                    : 'bg-gray-800 text-gray-300 hover:bg-amber-950 hover:text-amber-300 border border-gray-700'
                                }`}
                                title="Beri Surat Peringatan (Maks 3 SP)"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span className="hidden sm:inline">SP ({warningsCount}/3)</span>
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => handleStartEdit(officer)}
                                className="px-2 py-1 bg-blue-600/90 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
                                title="Edit Pangkat & PIN Anggota"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span className="hidden sm:inline">EDIT</span>
                              </button>

                              {/* Discharge / Delete Button */}
                              {onDeleteOfficer && (
                                <button
                                  onClick={() => handleStartDelete(officer)}
                                  disabled={!!isSelf}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 shadow-sm ${
                                    isSelf 
                                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700' 
                                      : 'bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-800 hover:border-rose-500'
                                  }`}
                                  title={isSelf ? 'Anda tidak bisa memecat diri sendiri saat sedang aktif' : 'Pecat / Hapus Anggota dari Kepolisian'}
                                >
                                  <UserX className="w-3 h-3" />
                                  <span className="hidden sm:inline">PECAT</span>
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-600 italic">
                              Hanya Command
                            </span>
                          )}
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

      {/* DISCIPLINARY / WARNING (SP) MODAL */}
      {warningOfficer && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150 font-mono text-xs">
          <div className="bg-[#161B22] border border-amber-700/80 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header Modal */}
            <div className="bg-[#0F1319] border-b border-gray-800 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center font-bold text-black shadow-lg shadow-amber-600/30 shrink-0">
                  <AlertTriangle className="w-5 h-5 text-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-gray-100">
                      Surat Peringatan & Disiplin Personel (SP)
                    </h3>
                    <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-bold">
                      MAKS 3 STRIKE
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {warningOfficer.name} (Badge: {warningOfficer.badge}) • {warningOfficer.rank}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWarningOfficer(null)}
                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {warningModalNotice && (
                <div className="p-3 bg-blue-950/80 border border-blue-700 rounded-lg text-blue-200 text-xs flex items-center gap-2 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{warningModalNotice}</span>
                </div>
              )}

              {/* Strikes Counter Meter */}
              <div className="p-3.5 bg-[#0D1117] border border-gray-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-bold uppercase">Akumulasi Strike Saat Ini:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-xs border ${
                    (warningOfficer.warnings?.length || 0) === 0
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                      : (warningOfficer.warnings?.length || 0) === 1
                      ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                      : (warningOfficer.warnings?.length || 0) === 2
                      ? 'bg-orange-950/80 text-orange-300 border-orange-600'
                      : 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
                  }`}>
                    {(warningOfficer.warnings?.length || 0)} / 3 STRIKE
                  </span>
                </div>

                {/* Visual meter blocks */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[1, 2, 3].map((step) => {
                    const isIssued = (warningOfficer.warnings?.length || 0) >= step;
                    return (
                      <div
                        key={step}
                        className={`p-2.5 rounded-lg border text-center transition ${
                          isIssued
                            ? step === 1
                              ? 'bg-amber-950/70 border-amber-600 text-amber-300'
                              : step === 2
                              ? 'bg-orange-950/70 border-orange-600 text-orange-300'
                              : 'bg-rose-950 border-rose-500 text-rose-300 font-bold'
                            : 'bg-gray-900/40 border-gray-800 text-gray-600'
                        }`}
                      >
                        <div className="text-[10px] font-bold">SP {step}</div>
                        <div className="text-[9px] mt-0.5">
                          {isIssued ? '⚠️ TERBIT' : '⚪ Kosong'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 1: Active Warnings History */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Daftar Riwayat Surat Peringatan Personel ({warningOfficer.warnings?.length || 0})</span>
                </div>

                {(!warningOfficer.warnings || warningOfficer.warnings.length === 0) ? (
                  <div className="p-4 bg-[#0D1117] border border-gray-800 rounded-lg text-center text-gray-500 text-xs">
                    Personel ini memiliki rekam jejak bersih (Belum pernah menerima SP).
                  </div>
                ) : (
                  <div className="space-y-2">
                    {warningOfficer.warnings.map((warn, idx) => (
                      <div 
                        key={warn.id || idx}
                        className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg space-y-2 relative group hover:border-gray-700 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              warn.strikeNumber === 1
                                ? 'bg-amber-950 text-amber-300 border-amber-700'
                                : warn.strikeNumber === 2
                                ? 'bg-orange-950 text-orange-300 border-orange-600'
                                : 'bg-rose-950 text-rose-300 border-rose-600'
                            }`}>
                              STRIKE {warn.strikeNumber} (SP{warn.strikeNumber})
                            </span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(warn.timestamp || Date.now()).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </div>

                          {/* Revoke / Pardon button */}
                          <button
                            type="button"
                            onClick={() => handleRevokeWarning(warn.id)}
                            className="text-[10px] text-gray-500 hover:text-rose-400 bg-gray-900 hover:bg-rose-950/60 px-2 py-0.5 rounded border border-gray-800 hover:border-rose-700 transition flex items-center gap-1"
                            title="Cabut Surat Peringatan ini (Pardon)"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Cabut SP</span>
                          </button>
                        </div>

                        <div className="text-gray-200 text-xs bg-black/40 p-2 rounded border border-gray-800/80">
                          {warn.reason}
                        </div>

                        <div className="text-[10px] text-gray-500 flex items-center justify-between">
                          <span>Diterbitkan oleh: <strong className="text-gray-400">{warn.issuedBy} ({warn.issuedByRank})</strong></span>
                          <span>Badge Atasan: <strong className="text-gray-400">{warn.issuedByBadge}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Issue New Warning Form (if < 3 strikes) */}
              {(warningOfficer.warnings?.length || 0) < 3 ? (
                <form onSubmit={handleIssueWarning} className="p-3.5 bg-amber-950/20 border border-amber-800/60 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] uppercase font-bold text-amber-300 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Terbitkan Surat Peringatan Ke-{(warningOfficer.warnings?.length || 0) + 1} (SP{(warningOfficer.warnings?.length || 0) + 1})</span>
                    </div>
                    <span className="text-[10px] bg-amber-900/60 text-amber-200 border border-amber-700 px-1.5 py-0.5 rounded">
                      Strike {(warningOfficer.warnings?.length || 0) + 1} dari 3
                    </span>
                  </div>

                  {/* Preset Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-300 uppercase block">
                      Klasifikasi Pelanggaran:
                    </label>
                    <select
                      value={warningPresetReason}
                      onChange={(e) => setWarningPresetReason(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-100 outline-none"
                    >
                      {PRESET_WARNING_REASONS.map((reason) => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                  </div>

                  {/* Detail Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-300 uppercase block">
                      Keterangan & Kronologi Pelanggaran:
                    </label>
                    <textarea
                      rows={2}
                      value={warningDetailReason}
                      onChange={(e) => setWarningDetailReason(e.target.value)}
                      placeholder="Contoh: Tidak merespon panggilan radio 10-20 saat situasi darurat bank robbery, mengabaikan komando supervisor..."
                      className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-100 placeholder:text-gray-600 outline-none resize-none"
                    />
                  </div>

                  {/* Webhook Option */}
                  <div className="flex items-center justify-between p-2 bg-[#0D1117] border border-gray-800 rounded">
                    <div className="flex items-center gap-2">
                      <Send className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] text-gray-300">Kirim Notifikasi SP ke Discord Webhook</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={warningSendWebhook}
                      onChange={(e) => setWarningSendWebhook(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-700 text-amber-600 focus:ring-0 cursor-pointer"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingWarning}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 disabled:opacity-50"
                  >
                    {isSubmittingWarning ? (
                      <span>Memproses Surat Peringatan...</span>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        <span>TERBITKAN SP {(warningOfficer.warnings?.length || 0) + 1} / 3 SEKARANG</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* MAX STRIKES REACHED ALERT */
                <div className="p-4 bg-rose-950/60 border border-rose-700 rounded-lg space-y-3 text-rose-200">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-300">
                    <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
                    <span>BATAS MAKSIMAL 3 STRIKE TERCAPAI (SP3)</span>
                  </div>
                  <p className="text-xs text-rose-300/90 leading-relaxed">
                    Personel ini telah menerima akumulasi 3 Surat Peringatan. Berdasarkan regulasi kedisiplinan kepolisian, personel ini direkomendasikan untuk segera <strong>diberhentikan dari dinas kepolisian (dipecat)</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const officerToDischarge = warningOfficer;
                      setWarningOfficer(null);
                      handleStartDelete(officerToDischarge);
                    }}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/40"
                  >
                    <UserX className="w-4 h-4" />
                    <span>LANGSUNG PROSES PEMECATAN SEKARANG</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-[#0D1117] border-t border-gray-800 p-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setWarningOfficer(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-bold transition text-xs"
              >
                Tutup Jendela SP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCHARGE / PECAT ANGGOTA CONFIRMATION MODAL */}
      {deletingOfficer && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#161B22] border border-rose-800/80 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 font-mono text-xs">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-rose-950 border border-rose-600 rounded-lg flex items-center justify-center text-rose-400 shadow-md shadow-rose-950/40">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-100 flex items-center gap-2">
                    <span>Surat Keputusan Pemecatan Personel</span>
                  </h3>
                  <p className="text-[11px] text-rose-400">
                    Pemberhentian dinas & pencabutan hak akses sistem kepolisian secara permanen.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeletingOfficer(null)}
                className="p-1 text-gray-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Officer Information Card */}
            <div className="p-3.5 bg-[#0D1117] border border-rose-900/50 rounded-lg space-y-2">
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Identitas Personel yang Diberhentikan:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 block text-[10px]">Nama Petugas:</span>
                  <span className="font-bold text-gray-100">{deletingOfficer.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Nomor Lencana / Badge:</span>
                  <span className="font-bold text-gray-200">{deletingOfficer.badge}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Pangkat Terakhir:</span>
                  <span className="font-bold text-amber-300">{deletingOfficer.rank}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Akumulasi SP:</span>
                  <span className="font-bold text-rose-400">
                    {deletingOfficer.warnings?.length || 0} / 3 Strikes
                  </span>
                </div>
              </div>
            </div>

            {/* Reason Selection / Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-300 uppercase block">
                Alasan Pemecatan / Pemberhentian Dinas:
              </label>
              <select
                value={deletePresetReason}
                onChange={(e) => setDeletePresetReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-rose-500 rounded text-xs text-gray-100 outline-none mb-1.5"
              >
                {PRESET_DISCHARGE_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <textarea
                rows={2}
                value={deleteDetailReason}
                onChange={(e) => setDeleteDetailReason(e.target.value)}
                placeholder="Tuliskan keterangan detail / keputusan High Command..."
                className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-rose-500 rounded text-xs text-rose-200 outline-none resize-none"
              />
            </div>

            {/* Discord Webhook Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-[#0D1117] border border-gray-800 rounded">
              <div className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-rose-400" />
                <div>
                  <div className="text-[11px] text-gray-200 font-bold">Kirim Surat Pemecatan ke Discord Webhook</div>
                  <div className="text-[10px] text-gray-500">Kirim embed pengumuman resmi pemberhentian personel ke Discord</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={deleteSendWebhook}
                onChange={(e) => setDeleteSendWebhook(e.target.checked)}
                className="w-4 h-4 rounded border-gray-700 text-rose-600 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Warning Box */}
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg text-rose-300 text-[11px] flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong>Peringatan Tegas High Command:</strong> Akun ini akan segera dihapus dari daftar roster kepolisian. Yang bersangkutan tidak akan dapat login lagi menggunakan PIN sebelumnya ke dalam sistem CAD HSPD.
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setDeletingOfficer(null)}
                disabled={isSubmittingDelete}
                className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmittingDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs transition flex items-center gap-1.5 shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {isSubmittingDelete ? (
                  <span>Memproses Pemecatan...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>KONFIRMASI PECAT & HAPUS DARI ROSTER</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT RANK / PROMOTION MODAL */}
      {editingOfficer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#161B22] border border-amber-700/60 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-amber-950 border border-amber-600 rounded-lg flex items-center justify-center text-amber-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-100">
                    Edit Pangkat & Pengaturan PIN Petugas
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    {editingOfficer.name} ({editingOfficer.badge})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingOfficer(null)}
                className="p-1 text-gray-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRankUpdate} className="space-y-4 font-mono text-xs">
              <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-lg text-[11px] text-gray-300">
                <div className="font-bold text-blue-400 mb-1">OTORISASI HIGH COMMAND AKTIF:</div>
                Hanya rank <strong>CHIEF OF POLICE [COP]</strong>, <strong>ASSISTANT CHIEF [A/C]</strong>, <strong>DEPUTY CHIEF [D/C]</strong>, dan <strong>COMMANDER [CDR]</strong> yang memiliki akses penuh untuk promosi, demosi, mutasi divisi, serta mengatur PIN login personal anggota.
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1.5">
                  Pangkat / Rank Baru:
                </label>
                <select
                  value={newRank}
                  onChange={(e) => setNewRank(e.target.value as OfficerRankLevel)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-100 outline-none"
                >
                  <optgroup label="👑 HIGH COMMAND (AKSES PENUH)">
                    <option value="CHIEF OF POLICE [COP]">★ CHIEF OF POLICE [COP] (Akses Penuh)</option>
                    <option value="ASSISTANT CHIEF [A/C]">★ ASSISTANT CHIEF [A/C] (Akses Penuh)</option>
                    <option value="DEPUTY CHIEF [D/C]">★ DEPUTY CHIEF [D/C] (Akses Penuh)</option>
                    <option value="COMMANDER [CDR]">★ COMMANDER [CDR] (Akses Penuh)</option>
                  </optgroup>
                  <optgroup label="👮 SUPERVISORY & FIELD PATROL RANKS">
                    <option value="CAPTAIN [CPT]">CAPTAIN [CPT]</option>
                    <option value="LIEUTENANT [LT]">LIEUTENANT [LT]</option>
                    <option value="SERGEANT [SGT]">SERGEANT [SGT]</option>
                    <option value="SENIOR LEAD OFFICER [SLO]">SENIOR LEAD OFFICER [SLO]</option>
                    <option value="POLICE OFFICER III [PO III]">POLICE OFFICER III [PO III]</option>
                    <option value="POLICE OFFICER II [PO II]">POLICE OFFICER II [PO II]</option>
                    <option value="POLICE OFFICER I [PO I]">POLICE OFFICER I [PO I]</option>
                    <option value="CADET [CDT]">CADET [CDT]</option>
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 uppercase block mb-1.5">
                    Divisi / Unit Penugasan:
                  </label>
                  <select
                    value={newDivision}
                    onChange={(e) => setNewDivision(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-xs text-gray-100 outline-none"
                  >
                    <option value="Patrol Division">Patrol Division (General Patrol)</option>
                    <option value="Traffic Enforcement Division">Traffic Enforcement Division (TED)</option>
                    <option value="Detective Bureau / CID">Detective Bureau / Investigation (CID)</option>
                    <option value="Special Enforcement Bureau (SEB/SWAT)">Special Enforcement Bureau (SEB / SWAT)</option>
                    <option value="Air Support Division (ASD)">Air Support Division (ASD)</option>
                    <option value="High Command Staff">High Command Staff (HQ)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-amber-300 uppercase flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>PIN Anggota (Diberikan Atasan):</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowEditPin(!showEditPin)}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold bg-amber-950/70 hover:bg-amber-900/70 px-1.5 py-0.5 rounded border border-amber-800/60 transition"
                      title={showEditPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
                    >
                      {showEditPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showEditPin ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showEditPin ? 'text' : 'password'}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="Contoh: 8462100 / 30210"
                      className="w-full px-3 py-2 pr-9 bg-[#0D1117] border border-amber-700/60 focus:border-amber-500 rounded text-xs text-amber-200 outline-none font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPin(!showEditPin)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-amber-300 transition"
                      title={showEditPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
                    >
                      {showEditPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* PROMOTION / RANK CHANGE REASON & WEBHOOK DISPATCH SECTION */}
              {newRank !== editingOfficer.rank ? (
                <div className="p-3.5 bg-amber-950/40 border border-amber-600/70 rounded-lg space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-amber-800/60">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                      <Award className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>PERUBAHAN PANGKAT / PROMOSI JABATAN</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded border border-amber-900/60">
                      <span className="text-gray-400">{editingOfficer.rank}</span>
                      <span className="text-amber-400 font-bold">➔</span>
                      <span className="text-amber-300 font-bold">{newRank}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-300 uppercase block mb-1">
                      Dasar / Alasan Kenaikan Pangkat (SK Kepolisian):
                    </label>
                    <select
                      value={promotionPresetReason}
                      onChange={(e) => setPromotionPresetReason(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-[11px] text-gray-200 outline-none mb-1.5"
                    >
                      {PRESET_PROMOTION_REASONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={promotionDetailReason}
                      onChange={(e) => setPromotionDetailReason(e.target.value)}
                      placeholder="Catatan tambahan promosi (opsional / nomor SK khusus)..."
                      className="w-full px-2.5 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded text-[11px] text-gray-200 outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-[11px] text-amber-200">
                      <input
                        type="checkbox"
                        checked={promotionSendWebhook}
                        onChange={(e) => setPromotionSendWebhook(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-gray-700 text-amber-600 focus:ring-0 cursor-pointer"
                      />
                      <span>Kirim Pengumuman Kenaikan Pangkat Resmi ke Webhook Discord</span>
                    </label>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-700">
                      📢 SK DISCORD
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-gray-900/60 border border-gray-800 rounded-lg text-[11px] text-gray-400 flex items-center justify-between">
                  <span>Pangkat saat ini tidak berubah ({editingOfficer.rank}).</span>
                  <span className="text-[10px] text-gray-500">Hanya update Divisi/PIN</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingOfficer(null)}
                  disabled={isSubmittingRankUpdate}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRankUpdate}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-600/30 disabled:opacity-50"
                >
                  {isSubmittingRankUpdate ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan & Mengirim Webhook...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>SIMPAN PERUBAHAN PANGKAT & PIN</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH ANGGOTA BARU (HIGH COMMAND FULL ACCESS) ================= */}
      {isAddOfficerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs font-mono text-xs animate-in fade-in duration-150">
          <div className="bg-[#161B22] border border-amber-500/80 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-[#0F1319] border-b border-gray-800 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-950/80 border border-amber-600 rounded-lg text-amber-300">
                  <UserPlus className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-100 uppercase tracking-tight flex items-center gap-2 font-sans">
                    <span>TAMBAH ANGGOTA BARU</span>
                    <span className="text-[9px] font-mono bg-amber-950 text-amber-300 border border-amber-700 px-1.5 py-0.2 rounded font-bold">
                      HIGH COMMAND
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    Registrasi personel baru ke Data Anggota & Broadcast Webhook Discord
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOfficerModalOpen(false)}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Notification */}
            {addFormError && (
              <div className="bg-rose-950/90 border-b border-rose-600 px-4 py-2 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{addFormError}</span>
              </div>
            )}

            {/* Modal Form Body */}
            <form onSubmit={handleSaveNewOfficer} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              {/* Nama & Badge Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8 space-y-1">
                  <label className="text-[10px] font-bold text-gray-300 uppercase block">
                    Nama Lengkap Petugas <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Contoh: Marcus Vance"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-100 outline-none font-mono font-bold"
                    required
                  />
                </div>

                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[10px] font-bold text-gray-300 uppercase block">
                    No. Badge <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={addBadge}
                    onChange={(e) => setAddBadge(e.target.value)}
                    placeholder="#105"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-amber-300 outline-none font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Pangkat / Rank */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-300 uppercase flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pangkat Dilantik <span className="text-rose-400">*</span></span>
                </label>
                <select
                  value={addRank}
                  onChange={(e) => setAddRank(e.target.value as OfficerRankLevel)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-100 outline-none font-mono"
                  required
                >
                  {ALL_RANKS.map((r) => (
                    <option key={r} value={r}>
                      {isOfficerHighRank(r) ? `★ ${r} [HIGH COMMAND]` : r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Divisi Penugasan */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-300 uppercase flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>Divisi Penugasan Kepolisian</span>
                </label>
                <select
                  value={addDivision}
                  onChange={(e) => setAddDivision(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-100 outline-none font-mono"
                >
                  {PRESET_DIVISIONS.map((div) => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                  <option value="CUSTOM">+ Divisi Kustom (Input Manual)...</option>
                </select>

                {addDivision === 'CUSTOM' && (
                  <input
                    type="text"
                    value={addCustomDivision}
                    onChange={(e) => setAddCustomDivision(e.target.value)}
                    placeholder="Tuliskan nama divisi kustom..."
                    className="w-full mt-1.5 px-3 py-1.5 bg-[#0D1117] border border-amber-600 focus:border-amber-400 rounded-lg text-xs text-gray-100 outline-none font-mono"
                    required
                  />
                )}
              </div>

              {/* PIN Login Awal & No. Telepon / Radio */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-gray-300 uppercase flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>PIN Login Terminal MDT <span className="text-rose-400">*</span></span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddPin(!showAddPin)}
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5"
                    >
                      {showAddPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showAddPin ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showAddPin ? 'text' : 'password'}
                    value={addPin}
                    onChange={(e) => setAddPin(e.target.value)}
                    placeholder="10-4"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-amber-600/70 focus:border-amber-400 rounded-lg text-xs text-amber-200 outline-none font-mono font-bold"
                    required
                  />
                  <span className="text-[9px] text-gray-500 block">
                    Default awal: 10-4 (dapat diubah nanti)
                  </span>
                </div>

                <div className="sm:col-span-6 space-y-1">
                  <label className="text-[10px] font-bold text-gray-300 uppercase flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>No. Kontak / Radio (Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="Contoh: 555-0199 / Freq 1111"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-200 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Diresmikan Oleh / Dasar SK */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-300 uppercase block">
                  Dasar SK Pengangkatan / Diresmikan Oleh:
                </label>
                <input
                  type="text"
                  value={addPromotedBy}
                  onChange={(e) => setAddPromotedBy(e.target.value)}
                  placeholder="SK Pengangkatan Markas Besar HSPD..."
                  className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-200 outline-none font-mono"
                />
              </div>

              {/* Discord Webhook Toggle Box */}
              <div className="p-3 bg-blue-950/30 border border-blue-800/60 rounded-lg space-y-1">
                <label className="flex items-center gap-2 text-xs text-blue-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addSendWebhook}
                    onChange={(e) => setAddSendWebhook(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-700 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="font-bold">📢 Kirim Pengumuman Personel Baru ke Webhook Discord</span>
                </label>
                <p className="text-[10px] text-gray-400 pl-6">
                  Broadcast induction resmi ke channel Discord Roster / Personel Markas Besar.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOfficerModalOpen(false)}
                  disabled={isSubmittingAdd}
                  className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-800 text-black font-bold rounded-lg transition text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  {isSubmittingAdd ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mendaftarkan & Broadcast...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>DAFTARKAN PERSONEL SEKARANG</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
