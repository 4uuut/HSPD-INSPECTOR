import React, { useState, useEffect, useCallback } from 'react';
import { 
  KeyRound, ShieldAlert, Check, X, ExternalLink, 
  Volume2, VolumeX, Sparkles, User, Clock, BellRing, ArrowRight 
} from 'lucide-react';
import { 
  OfficerProfile, OfficerAccount, PinResetRequest, isSupervisorOrAbove 
} from '../types';
import { 
  getPinResetRequests, 
  resolvePinResetRequest, 
  rejectPinResetRequest, 
  playPoliceChime 
} from '../utils/pinResetStorage';
import { sendPinResetResolvedWebhookToDiscord } from '../utils/discordWebhook';

interface Props {
  currentOfficer: OfficerProfile | null;
  roster: OfficerAccount[];
  onUpdateOfficerPin: (badgeOrName: string, newPin: string) => boolean;
  onOpenAuditModal: () => void;
}

export const PinResetRealtimeNotifier: React.FC<Props> = ({
  currentOfficer,
  roster,
  onUpdateOfficerPin,
  onOpenAuditModal
}) => {
  const [activeAlert, setActiveAlert] = useState<PinResetRequest | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string>('');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const isSupervisor = Boolean(currentOfficer && isSupervisorOrAbove(currentOfficer.rank));

  // Check for recent pending requests
  const checkPendingRequests = useCallback(() => {
    if (!isSupervisor) return;
    const requests = getPinResetRequests();
    const pending = requests.filter(r => r.status === 'PENDING' && !dismissedIds.has(r.id));
    if (pending.length > 0) {
      const latest = pending[0];
      if (!activeAlert || activeAlert.id !== latest.id) {
        setActiveAlert(latest);
        if (soundEnabled) {
          playPoliceChime();
        }
      }
    } else {
      setActiveAlert(null);
    }
  }, [isSupervisor, dismissedIds, activeAlert, soundEnabled]);

  // Listen to realtime request events & local storage sync
  useEffect(() => {
    if (!isSupervisor) return;

    const handleNewRequest = (e: any) => {
      const detail: PinResetRequest = e.detail;
      if (detail && detail.status === 'PENDING') {
        setActiveAlert(detail);
        if (soundEnabled) {
          playPoliceChime();
        }
      }
    };

    const handleStorageChange = () => {
      checkPendingRequests();
    };

    window.addEventListener('hspd-pin-reset-requested', handleNewRequest);
    window.addEventListener('hspd-pin-requests-updated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(checkPendingRequests, 3500);

    return () => {
      window.removeEventListener('hspd-pin-reset-requested', handleNewRequest);
      window.removeEventListener('hspd-pin-requests-updated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [isSupervisor, checkPendingRequests, soundEnabled]);

  if (!isSupervisor || (!activeAlert && !successToast)) return null;

  // Handle 1-Click Immediate Quick Accept
  const handleQuickAccept = async (req: PinResetRequest) => {
    if (!currentOfficer) return;
    setIsProcessing(true);

    try {
      const assignedPin = req.requestedPin?.trim() || '10-4';

      // 1. Update PIN in roster
      onUpdateOfficerPin(req.officerBadge || req.officerName, assignedPin);

      // 2. Resolve request in storage
      resolvePinResetRequest(
        req.id,
        assignedPin,
        currentOfficer,
        `Disetujui langsung oleh ${currentOfficer.rank} ${currentOfficer.name} via Notifikasi Cepat.`
      );

      // 3. Send Discord Webhook
      await sendPinResetResolvedWebhookToDiscord({
        officerName: req.officerName,
        officerBadge: req.officerBadge,
        officerRank: req.officerRank,
        newPin: assignedPin,
        resolvedBy: currentOfficer.name,
        resolvedByBadge: currentOfficer.badge,
        resolvedByRank: currentOfficer.rank,
        notes: `Disetujui langsung melalui Notifikasi Realtime Atasan.`
      });

      setDismissedIds(prev => new Set(prev).add(req.id));
      setActiveAlert(null);
      setSuccessToast(`✅ PIN untuk ${req.officerName} (${req.officerBadge}) berhasil disetujui & diubah menjadi "${assignedPin}"!`);
      setTimeout(() => setSuccessToast(''), 4500);
    } catch (err: any) {
      console.error('Quick accept error', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Quick Reject
  const handleQuickReject = (req: PinResetRequest) => {
    if (!currentOfficer) return;
    rejectPinResetRequest(req.id, currentOfficer, 'Permintaan ditolak via Notifikasi Cepat oleh Atasan.');
    setDismissedIds(prev => new Set(prev).add(req.id));
    setActiveAlert(null);
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
    setActiveAlert(null);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-96 font-sans text-xs animate-in slide-in-from-bottom-5 duration-200">
      {/* SUCCESS TOAST */}
      {successToast && (
        <div className="mb-2 p-3 bg-emerald-950/95 border border-emerald-500/80 rounded-xl text-emerald-200 shadow-2xl backdrop-blur-md flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-xs leading-tight">{successToast}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSuccessToast('')}
            className="text-emerald-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* PENDING NOTIFICATION CARD */}
      {activeAlert && (
        <div className="bg-[#111622]/95 border-2 border-amber-500 rounded-2xl shadow-2xl shadow-amber-500/20 backdrop-blur-md overflow-hidden text-gray-200 ring-4 ring-amber-500/20">
          {/* Top Header */}
          <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-[#141A28] border-b border-amber-600/50 px-3.5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300 animate-pulse">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-amber-200 text-xs flex items-center gap-1.5 font-mono">
                  <span>PERMINTAAN RESET PIN BARU!</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                </div>
                <div className="text-[10px] text-amber-300/80">Anggota Membutuhkan Otorisasi Atasan</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 text-amber-300/70 hover:text-amber-200 hover:bg-amber-900/50 rounded-lg transition"
                title={soundEnabled ? 'Matikan Suara Alarm' : 'Nyalakan Suara Alarm'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => handleDismiss(activeAlert.id)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                title="Tutup Notifikasi"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-3.5 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-gray-100 text-sm flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{activeAlert.officerName}</span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-700/50">
                    {activeAlert.officerBadge}
                  </span>
                </div>
                {activeAlert.officerRank && (
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {activeAlert.officerRank}
                  </div>
                )}
              </div>

              {activeAlert.requestedPin && (
                <div className="text-right">
                  <div className="text-[9px] text-gray-400 font-mono">PIN DIAJUKAN:</div>
                  <div className="font-mono font-extrabold text-xs text-emerald-400 bg-emerald-950/80 border border-emerald-600/60 px-2 py-0.5 rounded">
                    {activeAlert.requestedPin}
                  </div>
                </div>
              )}
            </div>

            {/* Reason */}
            <div className="p-2 rounded-xl bg-black/40 border border-gray-800 text-[11px] text-gray-300">
              <span className="text-gray-400 font-medium">Alasan: </span>
              <span className="italic font-sans">"{activeAlert.reason}"</span>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickAccept(activeAlert)}
                disabled={isProcessing}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950 transition cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isProcessing ? 'Memproses...' : 'Setujui Langsung'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDismiss(activeAlert.id);
                  onOpenAuditModal();
                }}
                className="w-full py-2 px-3 bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60 font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Buka Log Tiket</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-800/80">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Baru saja diajukan</span>
              </div>
              <button
                type="button"
                onClick={() => handleQuickReject(activeAlert)}
                className="text-red-400 hover:text-red-300 hover:underline transition font-mono"
              >
                Tolak Tiket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
