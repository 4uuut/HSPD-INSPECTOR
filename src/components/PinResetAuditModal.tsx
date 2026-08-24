import React, { useState, useMemo } from 'react';
import { 
  Shield, KeyRound, CheckCircle2, AlertTriangle, X, Search, 
  Send, User, Clock, MessageSquare, Check, Filter, Trash2, 
  Edit3, UserCheck, Lock, ExternalLink, RefreshCw, PlusCircle, 
  Sliders, ShieldCheck, ChevronRight, Eye, EyeOff
} from 'lucide-react';
import { 
  PinResetRequest, PinResetStatus, OfficerProfile, 
  OfficerAccount, isOfficerHighRank 
} from '../types';
import { HSPD_LOGO_URL } from '../assets/logo';
import { 
  getPinResetRequests, resolvePinResetRequest, 
  rejectPinResetRequest, deletePinResetRequest, 
  addPinResetRequest, savePinResetRequests 
} from '../utils/pinResetStorage';
import { sendPinResetResolvedWebhookToDiscord, getSavedWebhookConfig } from '../utils/discordWebhook';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentOfficer: OfficerProfile;
  roster: OfficerAccount[];
  onUpdateOfficerPin: (badgeOrName: string, newPin: string) => boolean;
  onOpenWebhookSettings?: () => void;
}

export const PinResetAuditModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentOfficer,
  roster,
  onUpdateOfficerPin,
  onOpenWebhookSettings
}) => {
  const [requests, setRequests] = useState<PinResetRequest[]>(() => getPinResetRequests());
  const [statusFilter, setStatusFilter] = useState<'ALL' | PinResetStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Resolution Dialog State
  const [resolvingRequest, setResolvingRequest] = useState<PinResetRequest | null>(null);
  const [newPinInput, setNewPinInput] = useState('');
  const [supervisorNotes, setSupervisorNotes] = useState('');
  const [sendWebhookOnResolve, setSendWebhookOnResolve] = useState(true);
  const [isProcessingResolve, setIsProcessingResolve] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState('');
  const [actionErrorNotice, setActionErrorNotice] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);

  // Reject Dialog State
  const [rejectingRequest, setRejectingRequest] = useState<PinResetRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Manual Reset Dialog State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualOfficerId, setManualOfficerId] = useState('');
  const [manualNewPin, setManualNewPin] = useState('');
  const [manualReason, setManualReason] = useState('Pembaruan Kredensial Langsung oleh High Command');

  if (!isOpen) return null;

  const isHighRank = isOfficerHighRank(currentOfficer.rank);

  const refreshRequests = () => {
    setRequests(getPinResetRequests());
  };

  // Stats calculation
  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const resolvedCount = requests.filter(r => r.status === 'RESOLVED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  // Filtered list
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || (
        r.officerName.toLowerCase().includes(q) ||
        r.officerBadge.toLowerCase().includes(q) ||
        (r.discordTag && r.discordTag.toLowerCase().includes(q)) ||
        r.reason.toLowerCase().includes(q) ||
        (r.resolvedBy && r.resolvedBy.toLowerCase().includes(q))
      );
      return matchStatus && matchQuery;
    });
  }, [requests, statusFilter, searchQuery]);

  // Open resolve dialog for a specific ticket
  const handleOpenResolve = (req: PinResetRequest) => {
    setResolvingRequest(req);
    // Find current officer PIN from roster
    const cleanIdent = req.officerName.trim().toLowerCase();
    const cleanBadge = req.officerBadge.trim().toLowerCase();
    const found = roster.find(o => 
      o.name.toLowerCase() === cleanIdent || 
      o.badge.toLowerCase() === cleanBadge ||
      o.name.toLowerCase().includes(cleanIdent)
    );
    // Prefer requested PIN, or random / suggested PIN
    setNewPinInput(req.requestedPin || (found ? found.pin : '10-4'));
    setSupervisorNotes('Kredensial identitas telah diverifikasi & PIN login MDT telah diperbarui.');
    setActionErrorNotice('');
    setActionSuccessNotice('');
  };

  // Execute PIN update & resolve request
  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingRequest) return;

    const trimmedPin = newPinInput.trim();
    if (!trimmedPin) {
      setActionErrorNotice('Kode PIN Baru tidak boleh kosong!');
      return;
    }

    setIsProcessingResolve(true);
    setActionErrorNotice('');

    try {
      // 1. Update Officer PIN in Roster live state
      const updatedInRoster = onUpdateOfficerPin(resolvingRequest.officerBadge || resolvingRequest.officerName, trimmedPin);

      // 2. Mark request as RESOLVED in storage
      const result = resolvePinResetRequest(
        resolvingRequest.id,
        trimmedPin,
        currentOfficer,
        supervisorNotes
      );

      // 3. Send Discord Webhook Confirmation if toggled
      if (sendWebhookOnResolve) {
        await sendPinResetResolvedWebhookToDiscord({
          officerName: resolvingRequest.officerName,
          officerBadge: resolvingRequest.officerBadge,
          officerRank: resolvingRequest.officerRank,
          newPin: trimmedPin,
          resolvedBy: currentOfficer.name,
          resolvedByBadge: currentOfficer.badge,
          resolvedByRank: currentOfficer.rank,
          notes: supervisorNotes,
        });
      }

      refreshRequests();
      setResolvingRequest(null);
      setActionSuccessNotice(`✅ PIN login untuk ${resolvingRequest.officerName} (${resolvingRequest.officerBadge}) berhasil diubah menjadi "${trimmedPin}" dan disahkan!`);
      setTimeout(() => setActionSuccessNotice(''), 4000);
    } catch (err: any) {
      setActionErrorNotice(`Gagal memproses otorisasi: ${err.message || 'Error'}`);
    } finally {
      setIsProcessingResolve(false);
    }
  };

  // Reject Request
  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest) return;

    rejectPinResetRequest(rejectingRequest.id, currentOfficer, rejectReason);
    refreshRequests();
    setRejectingRequest(null);
    setRejectReason('');
    setActionSuccessNotice(`Permohonan ${rejectingRequest.officerName} telah ditandai Ditolak.`);
    setTimeout(() => setActionSuccessNotice(''), 4000);
  };

  // Delete Request Log
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Hapus catatan log pengajuan reset PIN untuk ${name}?`)) {
      deletePinResetRequest(id);
      refreshRequests();
    }
  };

  // Manual Reset Submission
  const handleManualResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOfficerId) {
      setActionErrorNotice('Pilih petugas yang akan diubah PIN-nya!');
      return;
    }
    const targetOfficer = roster.find(o => o.id === manualOfficerId);
    if (!targetOfficer) return;

    const trimmedPin = manualNewPin.trim();
    if (!trimmedPin) {
      setActionErrorNotice('PIN baru wajib diisi!');
      return;
    }

    // 1. Update in roster
    onUpdateOfficerPin(targetOfficer.badge, trimmedPin);

    // 2. Add and immediately resolve log
    const createdReq = addPinResetRequest({
      officerName: targetOfficer.name,
      officerBadge: targetOfficer.badge,
      officerRank: targetOfficer.rank,
      reason: manualReason,
      requestedPin: trimmedPin,
      webhookSent: true,
    });

    resolvePinResetRequest(
      createdReq.id,
      trimmedPin,
      currentOfficer,
      `Reset manual langsung oleh ${currentOfficer.rank} ${currentOfficer.name}: ${manualReason}`
    );

    // 3. Send Discord Webhook
    await sendPinResetResolvedWebhookToDiscord({
      officerName: targetOfficer.name,
      officerBadge: targetOfficer.badge,
      officerRank: targetOfficer.rank,
      newPin: trimmedPin,
      resolvedBy: currentOfficer.name,
      resolvedByBadge: currentOfficer.badge,
      resolvedByRank: currentOfficer.rank,
      notes: `Reset PIN Manual: ${manualReason}`,
    });

    refreshRequests();
    setIsManualModalOpen(false);
    setManualOfficerId('');
    setManualNewPin('');
    setActionSuccessNotice(`✅ PIN ${targetOfficer.name} (${targetOfficer.badge}) berhasil diperbarui menjadi "${trimmedPin}" dan disiarkan ke Discord!`);
    setTimeout(() => setActionSuccessNotice(''), 4000);
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} mnt lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs font-mono text-xs animate-in fade-in duration-150">
      <div className="bg-[#161B22] border border-amber-600/60 rounded-xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="bg-[#0F1319] border-b border-gray-800 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group shrink-0">
              <img
                src={HSPD_LOGO_URL}
                alt="HSPD Crest"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-contain border border-amber-500/50 bg-black/60 p-0.5"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-gray-100 uppercase tracking-tight flex items-center gap-1.5 font-sans">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>LOG TIKET WEBHOOK & RESET PIN (HIGH COMMAND)</span>
                </h3>
                <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-700/60 px-1.5 py-0.5 rounded font-bold">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono">
                Audit pengajuan lupa password via Discord & otorisasi pengubahan PIN login anggota
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenWebhookSettings && (
              <button
                type="button"
                onClick={onOpenWebhookSettings}
                className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition flex items-center gap-1 text-[11px]"
                title="Pengaturan URL Webhook Discord"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Set Webhook</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition"
              title="Tutup Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* NOTIFICATION NOTICES */}
        {actionSuccessNotice && (
          <div className="bg-emerald-950/90 border-b border-emerald-600 px-4 py-2 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessNotice}</span>
          </div>
        )}

        {actionErrorNotice && (
          <div className="bg-rose-950/90 border-b border-rose-600 px-4 py-2 text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionErrorNotice}</span>
          </div>
        )}

        {/* MAIN BODY CONTAINER */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* STATS TILES BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-[#0D1117] border border-gray-800 rounded-lg">
              <div className="text-[10px] text-gray-400 uppercase font-bold">Total Pengajuan</div>
              <div className="text-xl font-bold text-gray-100 font-sans mt-0.5">{totalCount}</div>
            </div>

            <div className="p-3 bg-[#0D1117] border border-amber-800/60 rounded-lg">
              <div className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Menunggu Otorisasi
              </div>
              <div className="text-xl font-bold text-amber-300 font-sans mt-0.5">{pendingCount}</div>
            </div>

            <div className="p-3 bg-[#0D1117] border border-emerald-800/60 rounded-lg">
              <div className="text-[10px] text-emerald-400 uppercase font-bold">Disetujui / Selesai</div>
              <div className="text-xl font-bold text-emerald-300 font-sans mt-0.5">{resolvedCount}</div>
            </div>

            <div className="p-3 bg-[#0D1117] border border-rose-800/60 rounded-lg">
              <div className="text-[10px] text-rose-400 uppercase font-bold">Ditolak / Batal</div>
              <div className="text-xl font-bold text-rose-300 font-sans mt-0.5">{rejectedCount}</div>
            </div>
          </div>

          {/* FILTER & ACTIONS BAR */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-[#0D1117] p-2.5 border border-gray-800 rounded-lg">
            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs transition font-bold ${
                  statusFilter === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800/80 text-gray-400 hover:text-gray-200'
                }`}
              >
                Semua ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`px-2.5 py-1 rounded text-xs transition font-bold flex items-center gap-1 ${
                  statusFilter === 'PENDING'
                    ? 'bg-amber-600 text-black'
                    : 'bg-amber-950/40 text-amber-400 border border-amber-800/60 hover:bg-amber-900/40'
                }`}
              >
                <span>🟡 Menunggu ({pendingCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('RESOLVED')}
                className={`px-2.5 py-1 rounded text-xs transition font-bold flex items-center gap-1 ${
                  statusFilter === 'RESOLVED'
                    ? 'bg-emerald-600 text-black'
                    : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/40'
                }`}
              >
                <span>🟢 Selesai ({resolvedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-2.5 py-1 rounded text-xs transition font-bold flex items-center gap-1 ${
                  statusFilter === 'REJECTED'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-950/40 text-rose-400 border border-rose-800/60 hover:bg-rose-900/40'
                }`}
              >
                <span>🔴 Ditolak ({rejectedCount})</span>
              </button>
            </div>

            {/* Search Input & Manual Action */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama / badge / discord..."
                  className="w-full pl-8 pr-3 py-1.5 bg-black/50 border border-gray-700 rounded text-xs text-gray-200 placeholder:text-gray-600 outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded transition flex items-center gap-1 text-xs shrink-0 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Reset Manual</span>
              </button>
            </div>
          </div>

          {/* REQUESTS LIST */}
          <div className="space-y-2.5">
            {filteredRequests.length === 0 ? (
              <div className="p-8 text-center bg-[#0D1117] border border-dashed border-gray-800 rounded-xl space-y-2">
                <KeyRound className="w-8 h-8 text-gray-600 mx-auto" />
                <div className="text-gray-300 font-bold">Tidak Ada Catatan Pengajuan Reset PIN</div>
                <p className="text-gray-500 text-xs max-w-sm mx-auto">
                  Semua tiket pengajuan dari petugas yang lupa password akan tampil di sini untuk diotorisasi oleh High Command.
                </p>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isPending = req.status === 'PENDING';
                const isResolved = req.status === 'RESOLVED';
                const isRejected = req.status === 'REJECTED';

                // Find matching roster account
                const matchedOfficer = roster.find(o => 
                  o.name.toLowerCase() === req.officerName.toLowerCase() ||
                  o.badge.toLowerCase() === req.officerBadge.toLowerCase()
                );

                return (
                  <div
                    key={req.id}
                    className={`p-3.5 sm:p-4 rounded-xl border transition space-y-3 ${
                      isPending
                        ? 'bg-amber-950/20 border-amber-600/70 hover:border-amber-500 shadow-md shadow-amber-950/20'
                        : isResolved
                          ? 'bg-[#0D1117] border-gray-800 hover:border-gray-700'
                          : 'bg-rose-950/20 border-rose-900/60'
                    }`}
                  >
                    {/* Top Row: Officer Identity + Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                          isPending 
                            ? 'bg-amber-900/60 border border-amber-600 text-amber-300' 
                            : isResolved 
                              ? 'bg-emerald-900/60 border border-emerald-600 text-emerald-300'
                              : 'bg-rose-900/60 border border-rose-600 text-rose-300'
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-100 text-sm">{req.officerName}</span>
                            <span className="px-1.5 py-0.5 bg-black/60 border border-gray-700 text-gray-300 rounded font-bold text-[10px]">
                              {req.officerBadge}
                            </span>
                            {req.officerRank && (
                              <span className="text-[10px] text-amber-400 font-bold hidden sm:inline">
                                {req.officerRank}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-500" />
                              {formatDate(req.createdAt)} ({getRelativeTime(req.createdAt)})
                            </span>
                            {req.discordTag && (
                              <span className="text-indigo-400 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {req.discordTag}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isPending && (
                          <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-600 rounded-full font-bold text-[10px] flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            MENUNGGU OTORISASI ATASAN
                          </span>
                        )}
                        {isResolved && (
                          <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-700 rounded-full font-bold text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            DISETUJUI & SELESAI
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2.5 py-1 bg-rose-950 text-rose-300 border border-rose-700 rounded-full font-bold text-[10px] flex items-center gap-1">
                            <X className="w-3.5 h-3.5 text-rose-400" />
                            DITOLAK
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Details & Reason */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1 text-xs">
                      <div className="md:col-span-8 space-y-1">
                        <div className="text-[10px] uppercase text-gray-500 font-bold">Keterangan / Alasan Petugas:</div>
                        <div className="p-2 bg-black/40 border border-gray-800 rounded-lg text-gray-200 text-xs">
                          {req.reason}
                        </div>
                      </div>

                      <div className="md:col-span-4 space-y-1">
                        <div className="text-[10px] uppercase text-gray-500 font-bold">Data PIN Kredensial:</div>
                        <div className="p-2 bg-black/40 border border-gray-800 rounded-lg space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-gray-400">PIN Aktif di Roster:</span>
                            <strong className="text-amber-300 font-mono">
                              {matchedOfficer ? matchedOfficer.pin : '(Tidak Terdaftar)'}
                            </strong>
                          </div>
                          {req.requestedPin && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">PIN Diajukan:</span>
                              <strong className="text-emerald-400 font-mono">{req.requestedPin}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Resolution Summary (If Resolved/Rejected) */}
                    {(isResolved || isRejected) && (
                      <div className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                        isResolved 
                          ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200' 
                          : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                      }`}>
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                          <span className="font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {isResolved ? 'Disahkan oleh:' : 'Ditolak oleh:'} {req.resolvedByRank} {req.resolvedBy} ({req.resolvedByBadge})
                          </span>
                          {req.resolvedAt && (
                            <span className="text-[10px] text-gray-400">
                              {formatDate(req.resolvedAt)}
                            </span>
                          )}
                        </div>
                        {isResolved && req.resolvedNewPin && (
                          <div className="text-xs">
                            PIN Baru Ditetapkan: <strong className="text-white bg-black/50 px-1.5 py-0.5 rounded font-mono">{req.resolvedNewPin}</strong>
                          </div>
                        )}
                        {req.resolutionNotes && (
                          <div className="text-[11px] text-gray-300 italic">
                            Catatan: "{req.resolutionNotes}"
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="pt-2 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[10px] text-gray-500">
                        Tiket ID: <span className="font-mono">{req.id}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingRequest(req);
                                setRejectReason('Identitas tidak dapat diverifikasi atau nomor badge tidak valid.');
                              }}
                              className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-300 rounded font-bold transition text-xs flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenResolve(req)}
                              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded font-mono transition text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>👑 OTORISASI & UBAH PIN</span>
                            </button>
                          </>
                        )}

                        {isResolved && (
                          <button
                            type="button"
                            onClick={() => handleOpenResolve(req)}
                            className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded transition text-xs flex items-center gap-1"
                            title="Perbarui PIN lagi jika diperlukan"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Ubah PIN Lagi</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(req.id, req.officerName)}
                          className="p-1.5 text-gray-500 hover:text-rose-400 transition"
                          title="Hapus Tiket Log Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-[#0F1319] border-t border-gray-800 px-4 py-2.5 flex items-center justify-between text-[11px] text-gray-400 font-mono">
          <span>HighState PD MDT CAD Security Control</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded transition font-bold"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* ================= MODAL RESOLVE / UBAH PIN ================= */}
      {resolvingRequest && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-3">
          <div className="bg-[#161B22] border border-amber-500 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm text-gray-100 uppercase font-sans">
                  OTORISASI PIN: {resolvingRequest.officerName}
                </h4>
              </div>
              <button
                onClick={() => setResolvingRequest(null)}
                className="text-gray-400 hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-3.5">
              <div className="p-2.5 bg-black/40 border border-gray-800 rounded-lg text-xs space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Petugas:</span>
                  <strong className="text-gray-200">{resolvingRequest.officerName} ({resolvingRequest.officerBadge})</strong>
                </div>
                {resolvingRequest.discordTag && (
                  <div className="flex justify-between text-gray-400">
                    <span>Discord:</span>
                    <strong className="text-indigo-400">{resolvingRequest.discordTag}</strong>
                  </div>
                )}
                {resolvingRequest.requestedPin && (
                  <div className="flex justify-between text-gray-400">
                    <span>PIN yang Diajukan:</span>
                    <strong className="text-emerald-400">{resolvingRequest.requestedPin}</strong>
                  </div>
                )}
              </div>

              {/* Input PIN Baru */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-gray-300 flex items-center justify-between">
                  <span>Tetapkan PIN Login Baru <span className="text-rose-400">*</span></span>
                  <button
                    type="button"
                    onClick={() => setShowNewPin(!showNewPin)}
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    {showNewPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showNewPin ? 'Sembunyikan' : 'Lihat'}</span>
                  </button>
                </label>
                <input
                  type={showNewPin ? 'text' : 'password'}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="Contoh: 84621 atau 10-4"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-amber-500/70 focus:border-amber-400 rounded-lg text-sm text-gray-100 outline-none font-mono font-bold transition"
                  required
                />
                <span className="text-[10px] text-gray-400 block">
                  PIN ini akan langsung disimpan ke database roster agar petugas dapat login kembali.
                </span>
              </div>

              {/* Supervisor Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-gray-300">
                  Catatan Pengesahan Atasan
                </label>
                <textarea
                  rows={2}
                  value={supervisorNotes}
                  onChange={(e) => setSupervisorNotes(e.target.value)}
                  placeholder="Keterangan pengesahan..."
                  className="w-full px-3 py-1.5 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-200 outline-none font-mono"
                />
              </div>

              {/* Toggle Webhook */}
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none bg-black/30 p-2 rounded-lg border border-gray-800">
                <input
                  type="checkbox"
                  checked={sendWebhookOnResolve}
                  onChange={(e) => setSendWebhookOnResolve(e.target.checked)}
                  className="rounded border-gray-700 text-amber-500 focus:ring-amber-500"
                />
                <span>Kirim konfirmasi pengesahan ke Webhook Discord</span>
              </label>

              {/* Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingRequest(null)}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessingResolve}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-800 text-black font-bold rounded-lg transition text-xs flex items-center gap-1.5 shadow-md"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isProcessingResolve ? 'Memproses...' : 'SIMPAN PIN & SAHKAN'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL REJECT ================= */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-3">
          <div className="bg-[#161B22] border border-rose-600 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h4 className="font-bold text-sm text-gray-100 uppercase font-sans">
                  Tolak Pengajuan: {rejectingRequest.officerName}
                </h4>
              </div>
              <button
                onClick={() => setRejectingRequest(null)}
                className="text-gray-400 hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-gray-300">
                  Alasan Penolakan <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Tuliskan alasan penolakan..."
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-200 outline-none font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition text-xs"
                >
                  Konfirmasi Tolak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL MANUAL RESET ================= */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-3">
          <div className="bg-[#161B22] border border-amber-500 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm text-gray-100 uppercase font-sans">
                  RESET PIN PETUGAS MANUAL
                </h4>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualResetSubmit} className="space-y-3.5">
              {/* Select Officer */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-gray-300">
                  Pilih Anggota Kepolisian <span className="text-rose-400">*</span>
                </label>
                <select
                  value={manualOfficerId}
                  onChange={(e) => {
                    setManualOfficerId(e.target.value);
                    const sel = roster.find(o => o.id === e.target.value);
                    if (sel) setManualNewPin(sel.pin);
                  }}
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-200 outline-none font-mono"
                  required
                >
                  <option value="">-- Pilih Petugas dari Roster --</option>
                  {roster.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.badge} - {o.name} ({o.rank})
                    </option>
                  ))}
                </select>
              </div>

              {/* Input New PIN */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-gray-300">
                  Tetapkan PIN Baru <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={manualNewPin}
                  onChange={(e) => setManualNewPin(e.target.value)}
                  placeholder="Contoh: 84621 atau 10-4"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 focus:border-amber-500 rounded-lg text-xs text-gray-100 outline-none font-mono"
                  required
                />
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-gray-300">
                  Alasan / Keterangan Reset
                </label>
                <input
                  type="text"
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="Keterangan..."
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-700 rounded-lg text-xs text-gray-200 outline-none font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition text-xs flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Simpan & Broadcast Discord</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
