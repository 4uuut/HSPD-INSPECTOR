import React, { useState, useEffect, useMemo } from 'react';
import { OfficerProfile, OfficerAccount, OfficerLeaveRecord, isOfficerHighRank } from '../types';
import { 
  Calendar, Clock, CheckCircle2, XCircle, AlertTriangle, 
  FileText, Copy, Check, Send, Trash2, Filter, ShieldCheck, 
  User, RefreshCw, X, ChevronRight, CheckCheck, Sparkles, Building2
} from 'lucide-react';
import { 
  getSavedOfficerLeaves, createOfficerLeaveRequest, 
  approveOfficerLeave, rejectOfficerLeave, deleteOfficerLeave, 
  calculateDaysBetween, formatIndoDateDisplay, formatOfficerLeaveText 
} from '../utils/officerLeaveStorage';
import { getLocalDateString } from '../utils/attendanceExport';
import { getSavedDutyWebhookConfig, sendOfficerLeaveToDiscord } from '../utils/discordWebhook';
import { HSPD_LOGO_URL } from '../assets/logo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentOfficer: OfficerProfile;
  roster: OfficerAccount[];
  initialTargetOfficer?: { badge: string; name: string; rank: string; division?: string } | null;
}

export const OfficerLeaveModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentOfficer,
  roster,
  initialTargetOfficer
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  const [leavesList, setLeavesList] = useState<OfficerLeaveRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Form State
  const initialOfficerToUse = initialTargetOfficer || currentOfficer;
  const [targetBadge, setTargetBadge] = useState<string>(initialOfficerToUse.badge);
  const [targetName, setTargetName] = useState<string>(initialOfficerToUse.name);
  const [targetRank, setTargetRank] = useState<string>(initialOfficerToUse.rank);
  const [targetDivision, setTargetDivision] = useState<string>(initialOfficerToUse.division || 'Patrol Division');

  const [reason, setReason] = useState<string>('');
  
  const todayStr = useMemo(() => getLocalDateString(), []);
  const defaultEndStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return getLocalDateString(d);
  }, []);

  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(defaultEndStr);

  const [isSelfAcc, setIsSelfAcc] = useState<boolean>(false);
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Rejection modal state
  const [rejectingLeave, setRejectingLeave] = useState<OfficerLeaveRecord | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState<string>('');

  const isHighCommand = isOfficerHighRank(currentOfficer.rank);

  // Sync target officer when modal opens or initialTargetOfficer changes
  useEffect(() => {
    if (isOpen) {
      const selected = initialTargetOfficer || currentOfficer;
      setTargetBadge(selected.badge);
      setTargetName(selected.name);
      setTargetRank(selected.rank);
      setTargetDivision(selected.division || 'Patrol Division');
      setLeavesList(getSavedOfficerLeaves());
      setFeedback(null);
    }
  }, [isOpen, initialTargetOfficer, currentOfficer]);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setLeavesList(e.detail);
      } else {
        setLeavesList(getSavedOfficerLeaves());
      }
    };
    window.addEventListener('hspd-officer-leaves-updated', handleUpdate);
    return () => window.removeEventListener('hspd-officer-leaves-updated', handleUpdate);
  }, []);

  // Update selected target officer when targetBadge changes
  const handleOfficerSelect = (badge: string) => {
    setTargetBadge(badge);
    const found = roster.find(r => r.badge.toLowerCase().replace(/#/g, '') === badge.toLowerCase().replace(/#/g, ''));
    if (found) {
      setTargetName(found.name);
      setTargetRank(found.rank);
      setTargetDivision(found.division || 'Patrol Division');
    }
  };

  const calculatedDays = useMemo(() => {
    return calculateDaysBetween(startDate, endDate);
  }, [startDate, endDate]);

  // Preview data formatted as requested by user
  const previewFormattedText = useMemo(() => {
    const startFmt = formatIndoDateDisplay(startDate);
    const endFmt = formatIndoDateDisplay(endDate);
    const accPreview = (isHighCommand && isSelfAcc)
      ? `\n\nStatus ACC Atasan  : ✅ DI-ACC LANGSUNG OLEH: ${currentOfficer.name} (${currentOfficer.rank})`
      : `\n\nStatus ACC Atasan  : ⏳ MENUNGGU ACC ATASAN`;

    return `\`\`\`    IZIN CUTI SAPD\`\`\`
\`\`\`Nama Petugas  : ${targetName} [${targetBadge}]
Reason : ${reason.trim() || '(Alasan belum diisi)'}
Dari Tanggal  : ${startFmt}
Hingga Tanggal: ${endFmt}
Total Durasi Cuti  : ${calculatedDays} Hari${accPreview}
\`\`\``;
  }, [targetName, targetBadge, reason, startDate, endDate, calculatedDays, isHighCommand, isSelfAcc, currentOfficer]);

  const handleCopyText = (text: string, id: string = 'form') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setFeedback({ type: 'error', message: 'Harap cantumkan alasan (Reason) izin cuti.' });
      return;
    }
    if (!startDate || !endDate) {
      setFeedback({ type: 'error', message: 'Harap tentukan tanggal mulai dan tanggal selesai cuti.' });
      return;
    }
    if (startDate > endDate) {
      setFeedback({ type: 'error', message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const autoApprove = (isHighCommand && isSelfAcc) ? {
        name: currentOfficer.name,
        badge: currentOfficer.badge,
        rank: currentOfficer.rank
      } : undefined;

      const newRecord = createOfficerLeaveRequest({
        officerName: targetName,
        officerBadge: targetBadge,
        officerRank: targetRank,
        division: targetDivision,
        reason: reason.trim(),
        startDate,
        endDate,
        autoApproveBy: autoApprove,
        approvalNotes: approvalNotes.trim() || undefined
      });

      // Send to Discord Webhook
      const webhookConfig = getSavedDutyWebhookConfig();
      if (webhookConfig.webhookUrl && webhookConfig.webhookUrl.trim()) {
        sendOfficerLeaveToDiscord(newRecord, webhookConfig).catch(() => {});
      }

      setFeedback({
        type: 'success',
        message: autoApprove 
          ? `✅ Izin Cuti berhasil diterbitkan dan langsung di-ACC oleh ${currentOfficer.name}!` 
          : `✅ Pengajuan Izin Cuti berhasil dikirim! Menunggu ACC Atasan.`
      });

      setReason('');
      setLeavesList(getSavedOfficerLeaves());
      setTimeout(() => {
        setActiveTab('list');
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Gagal mengajukan cuti: ${err.message || err}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (leave: OfficerLeaveRecord) => {
    const approver = {
      name: currentOfficer.name,
      badge: currentOfficer.badge,
      rank: currentOfficer.rank
    };
    const updated = approveOfficerLeave(leave.id, approver, 'Disetujui oleh Atasan');
    if (updated) {
      const webhookConfig = getSavedDutyWebhookConfig();
      if (webhookConfig.webhookUrl && webhookConfig.webhookUrl.trim()) {
        sendOfficerLeaveToDiscord(updated, webhookConfig).catch(() => {});
      }
      setLeavesList(getSavedOfficerLeaves());
    }
  };

  const handleOpenReject = (leave: OfficerLeaveRecord) => {
    setRejectingLeave(leave);
    setRejectReasonInput('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingLeave) return;
    const rejecter = {
      name: currentOfficer.name,
      badge: currentOfficer.badge,
      rank: currentOfficer.rank
    };
    const updated = rejectOfficerLeave(rejectingLeave.id, rejecter, rejectReasonInput);
    if (updated) {
      const webhookConfig = getSavedDutyWebhookConfig();
      if (webhookConfig.webhookUrl && webhookConfig.webhookUrl.trim()) {
        sendOfficerLeaveToDiscord(updated, webhookConfig).catch(() => {});
      }
      setLeavesList(getSavedOfficerLeaves());
    }
    setRejectingLeave(null);
  };

  const handleDelete = (leaveId: string) => {
    if (window.confirm('Hapus berkas riwayat cuti ini dari sistem?')) {
      deleteOfficerLeave(leaveId);
      setLeavesList(getSavedOfficerLeaves());
    }
  };

  // Filtered list
  const filteredLeaves = useMemo(() => {
    if (filterStatus === 'ALL') return leavesList;
    return leavesList.filter(l => l.status === filterStatus);
  }, [leavesList, filterStatus]);

  const pendingCount = useMemo(() => {
    return leavesList.filter(l => l.status === 'PENDING').length;
  }, [leavesList]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#161B22] border border-amber-500/40 rounded-xl max-w-2xl w-full p-4 sm:p-5 shadow-2xl space-y-4 max-h-[94vh] overflow-y-auto font-mono">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="relative group shrink-0">
              <img
                src={HSPD_LOGO_URL}
                alt="HSPD Crest"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-contain drop-shadow-md border border-amber-500/60 bg-black/60 p-0.5"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-100 flex items-center gap-2">
                <span>Manajemen Izin Cuti SAPD</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  LEAVE SYSTEM
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">
                Format Resmi Pengajuan & Verifikasi ACC Atasan Kepolisian San Andreas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-rose-900 text-gray-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'form'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Formulir Pengajuan Cuti</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'list'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Daftar & ACC Atasan</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3 rounded-lg text-xs font-mono flex items-start gap-2 ${
            feedback.type === 'success' 
              ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-200' 
              : 'bg-rose-950/80 border border-rose-600 text-rose-200'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
            <div>{feedback.message}</div>
          </div>
        )}

        {/* TAB 1: FORM PENGAJUAN */}
        {activeTab === 'form' && (
          <form onSubmit={handleSubmitLeave} className="space-y-3.5">
            {/* Officer Selection */}
            <div className="bg-[#0D1117] p-3 rounded-xl border border-gray-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  Identitas Personel Pemohon
                </span>
                {isHighCommand && (
                  <span className="text-[10px] text-amber-400 font-bold">
                    Mode Atasan: Bisa ajukan untuk personel lain
                  </span>
                )}
              </div>

              {isHighCommand ? (
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-semibold">Pilih Anggota dari Roster:</label>
                  <select
                    value={targetBadge}
                    onChange={(e) => handleOfficerSelect(e.target.value)}
                    className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-100 focus:border-amber-500 focus:outline-hidden"
                  >
                    {roster.map(r => (
                      <option key={r.badge} value={r.badge}>
                        [{r.badge}] {r.name} - {r.rank} ({r.division || 'Patrol'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-[#161B22] p-2 rounded-lg border border-gray-800">
                    <div className="text-[9px] text-gray-400 uppercase">Nama Petugas</div>
                    <div className="font-bold text-gray-200">{targetName}</div>
                  </div>
                  <div className="bg-[#161B22] p-2 rounded-lg border border-gray-800">
                    <div className="text-[9px] text-gray-400 uppercase">Badge</div>
                    <div className="font-bold text-amber-400">{targetBadge}</div>
                  </div>
                  <div className="bg-[#161B22] p-2 rounded-lg border border-gray-800">
                    <div className="text-[9px] text-gray-400 uppercase">Pangkat</div>
                    <div className="font-bold text-blue-300 truncate">{targetRank}</div>
                  </div>
                  <div className="bg-[#161B22] p-2 rounded-lg border border-gray-800">
                    <div className="text-[9px] text-gray-400 uppercase">Divisi</div>
                    <div className="font-bold text-emerald-300 truncate">{targetDivision}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Date Pickers & Total Days */}
            <div className="bg-[#0D1117] p-3 rounded-xl border border-gray-800 space-y-2.5">
              <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5 border-b border-gray-800 pb-2">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Periode & Durasi Izin Cuti
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-semibold">Dari Tanggal:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-2.5 py-2 text-xs text-gray-100 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-semibold">Hingga Tanggal:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#161B22] border border-gray-700 rounded-lg px-2.5 py-2 text-xs text-gray-100 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-semibold">Total Durasi Cuti:</label>
                  <div className="bg-amber-950/40 border border-amber-600/80 rounded-lg px-3 py-2 text-xs font-bold text-amber-300 flex items-center justify-between">
                    <span>{calculatedDays} Hari</span>
                    <span className="text-[10px] bg-amber-900/60 px-1.5 py-0.2 rounded font-normal text-amber-200">
                      Kalender
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reason Textarea */}
            <div className="bg-[#0D1117] p-3 rounded-xl border border-gray-800 space-y-2">
              <label className="text-xs font-bold text-gray-200 flex items-center justify-between">
                <span>Alasan Izin Cuti (Reason):</span>
                <span className="text-[10px] text-gray-500 font-normal">Wajib diisi jelas</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Contoh: Keperluan keluarga di luar kota / Urusan medis / Berhalangan hadir dinas patroli"
                className="w-full bg-[#161B22] border border-gray-700 rounded-lg p-2.5 text-xs text-gray-100 focus:border-amber-500 focus:outline-hidden resize-none"
              />
            </div>

            {/* Self-ACC Option for High Command */}
            {isHighCommand && (
              <div className="bg-emerald-950/40 border border-emerald-800/80 p-3 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-300">
                  <input
                    type="checkbox"
                    checked={isSelfAcc}
                    onChange={(e) => setIsSelfAcc(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
                  />
                  <span>Langsung ACC Cuti Ini Sebagai Atasan ({currentOfficer.rank})</span>
                </label>
                {isSelfAcc && (
                  <input
                    type="text"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Catatan pengesahan Atasan (opsional)..."
                    className="w-full bg-[#161B22] border border-emerald-700/80 rounded-lg p-2 text-xs text-emerald-100 focus:border-emerald-500 focus:outline-hidden"
                  />
                )}
              </div>
            )}

            {/* Preview Box with Copy Button */}
            <div className="bg-[#0D1117] p-3 rounded-xl border border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Format Teks Salin (Discord / Laporan SAPD)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(previewFormattedText, 'form')}
                  className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-[11px] font-bold flex items-center gap-1.5 transition"
                >
                  {copiedId === 'form' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                      <span>Salin Format</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="bg-black/80 border border-gray-800 rounded-lg p-3 text-[11px] text-amber-300/90 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                {previewFormattedText}
              </pre>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition"
              >
                Tutup
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-lg ${
                  isSubmitting || !reason.trim()
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20 active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses Pengajuan...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSelfAcc ? 'Terbitkan & Langsung ACC Cuti' : 'Ajukan Izin Cuti SAPD'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: DAFTAR & ACC ATASAN */}
        {activeTab === 'list' && (
          <div className="space-y-3.5">
            {/* Filter status buttons */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                    filterStatus === 'ALL' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Semua ({leavesList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('PENDING')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                    filterStatus === 'PENDING' ? 'bg-rose-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span>Menunggu ACC</span>
                  {pendingCount > 0 && <span className="bg-white/20 px-1 rounded text-[9px]">{pendingCount}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('APPROVED')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                    filterStatus === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Disetujui ({leavesList.filter(l => l.status === 'APPROVED').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('REJECTED')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                    filterStatus === 'REJECTED' ? 'bg-gray-700 text-gray-200' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Ditolak ({leavesList.filter(l => l.status === 'REJECTED').length})
                </button>
              </div>

              <span className="text-[10px] text-gray-400 hidden sm:inline">
                Total: {filteredLeaves.length} Berkas
              </span>
            </div>

            {/* List items */}
            <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
              {filteredLeaves.map((leave) => {
                const isPending = leave.status === 'PENDING';
                const isApproved = leave.status === 'APPROVED';
                const isRejected = leave.status === 'REJECTED';
                const leaveFormatted = formatOfficerLeaveText(leave);

                return (
                  <div
                    key={leave.id}
                    className={`p-3.5 rounded-xl border transition space-y-2 ${
                      isPending
                        ? 'bg-[#1C1613] border-amber-600/70 shadow-md'
                        : isApproved
                          ? 'bg-[#101D17] border-emerald-800/80'
                          : 'bg-[#18181B] border-gray-800 opacity-75'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-gray-100">{leave.officerName}</span>
                          <span className="text-[10px] bg-black/60 border border-gray-700 px-1.5 py-0.2 rounded font-bold text-amber-400">
                            {leave.officerBadge}
                          </span>
                          <span className="text-[10px] text-blue-300">
                            {leave.officerRank}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Divisi: <span className="text-gray-300">{leave.division || 'Patrol Division'}</span> • Diajukan: {new Date(leave.requestedAt).toLocaleDateString('id-ID')}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                        isPending
                          ? 'bg-amber-950 text-amber-300 border-amber-600 animate-pulse'
                          : isApproved
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}>
                        {isPending ? '⏳ MENUNGGU ACC ATASAN' : isApproved ? '✅ RESMI DI-ACC' : '❌ DITOLAK'}
                      </span>
                    </div>

                    {/* Date and Reason info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-black/40 p-2.5 rounded-lg border border-gray-800/80">
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Periode Cuti:</div>
                        <div className="font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-amber-400" />
                          <span>{formatIndoDateDisplay(leave.startDate)}</span>
                          <span>s/d</span>
                          <span>{formatIndoDateDisplay(leave.endDate)}</span>
                          <span className="text-[10px] bg-amber-950 text-amber-200 px-1.5 py-0.2 rounded border border-amber-800">
                            {leave.totalDays} Hari
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Alasan (Reason):</div>
                        <div className="text-gray-200 text-xs italic mt-0.5 line-clamp-2">
                          "{leave.reason}"
                        </div>
                      </div>
                    </div>

                    {/* Approval / Rejection details */}
                    {isApproved && (
                      <div className="text-[11px] bg-emerald-950/30 border border-emerald-800/50 p-2 rounded-lg text-emerald-200 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Di-ACC oleh: <strong>{leave.approvedBy}</strong> ({leave.approvedRank})</span>
                        </div>
                        {leave.approvedAt && (
                          <span className="text-[10px] text-gray-400">
                            {new Date(leave.approvedAt).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </div>
                    )}

                    {isRejected && (
                      <div className="text-[11px] bg-rose-950/30 border border-rose-800/50 p-2 rounded-lg text-rose-200">
                        <div className="flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Ditolak oleh: <strong>{leave.rejectedBy}</strong></span>
                        </div>
                        {leave.rejectionReason && (
                          <div className="text-[10px] text-gray-300 mt-0.5 italic">
                            Catatan: {leave.rejectionReason}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-800/60 text-xs">
                      <button
                        type="button"
                        onClick={() => handleCopyText(leaveFormatted, leave.id)}
                        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-[10px] font-bold flex items-center gap-1 transition"
                      >
                        {copiedId === leave.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-gray-400" />
                            <span>Salin Format SAPD</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5">
                        {/* Approval actions for Atasan */}
                        {isPending && isHighCommand && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(leave)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center gap-1 transition active:scale-95 shadow-md shadow-emerald-600/30"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>ACC ATASAN</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenReject(leave)}
                              className="px-2.5 py-1 bg-rose-900/80 hover:bg-rose-800 text-rose-200 rounded text-[11px] font-bold flex items-center gap-1 transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </button>
                          </>
                        )}

                        {/* Delete for High Command */}
                        {isHighCommand && (
                          <button
                            type="button"
                            onClick={() => handleDelete(leave.id)}
                            className="p-1 text-gray-500 hover:text-rose-400 rounded transition"
                            title="Hapus berkas cuti"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredLeaves.length === 0 && (
                <div className="p-8 text-center bg-[#0D1117] rounded-xl border border-gray-800 text-gray-500 space-y-1">
                  <FileText className="w-8 h-8 mx-auto text-gray-600" />
                  <div className="font-bold text-gray-400">Belum Ada Berkas Izin Cuti</div>
                  <div className="text-[11px]">Belum ada permohonan izin cuti pada kategori filter ini.</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* REJECTION REASON MODAL */}
      {rejectingLeave && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setRejectingLeave(null)}
        >
          <div 
            className="bg-[#161B22] border border-rose-600 rounded-xl max-w-md w-full p-4 space-y-3 font-mono shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="font-bold text-sm text-rose-300 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-500" />
                Penolakan Izin Cuti Atasan
              </span>
              <button
                type="button"
                onClick={() => setRejectingLeave(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Menolak permohonan cuti personel: <strong className="text-white">{rejectingLeave.officerName}</strong> ({rejectingLeave.officerBadge})
            </p>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 uppercase font-semibold">Alasan Penolakan:</label>
              <textarea
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                rows={2}
                placeholder="Contoh: Jadwal operasi gabungan membutuhkan personel / Kuota cuti divisi penuh"
                className="w-full bg-[#0D1117] border border-gray-700 rounded-lg p-2 text-xs text-gray-100 focus:border-rose-500 focus:outline-hidden resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setRejectingLeave(null)}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
